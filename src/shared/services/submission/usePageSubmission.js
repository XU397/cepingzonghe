import { useCallback, useMemo, useRef, useState } from 'react';
import { submitPageMarkData } from '@shared/services/apiService.js';
import { createSubmissionPayload } from '@shared/services/dataLogger.js';
import createMarkObject, { formatTimestamp } from './createMarkObject.js';
import EventTypes from './eventTypes.js';
import { handleSessionExpired as defaultHandleSessionExpired } from './handleSessionExpired.js';
import { validateMarkObject } from './validateMarkObject.js';
import { enhancePageDesc } from './pageDescUtils.js';

const RETRY_DELAYS = [1000, 2000, 4000];
const debugLog = () => {};

const isSessionExpiredError = (error) => {
  if (!error) return false;
  if (error.isSessionExpired) return true;
  if (error.code === 401) return true;
  const message = error.message || '';
  return (
    typeof message === 'string' &&
    (message.includes('401') ||
      message.includes('session已过期') ||
      message.includes('请重新登录'))
  );
};

const ensureArray = (value) => (Array.isArray(value) ? value : []);

const isFlowContextEventType = (eventType) =>
  eventType === 'flow_context' || eventType === EventTypes.FLOW_CONTEXT;

const maybeString = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return value;
  return String(value);
};

const buildFlowContextValue = (flowInfo) => {
  if (!flowInfo) {
    return null;
  }
  return {
    flowId: flowInfo.flowId || null,
    submoduleId: flowInfo.submoduleId || null,
    stepIndex: flowInfo.stepIndex ?? null,
    pageId: flowInfo.pageId || null,
  };
};

const normalizeFlowContextValue = (value, flowInfo) => {
  if (value && typeof value === 'object') {
    return value;
  }
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch (error) {
      console.warn('[usePageSubmission] 无法解析 flow_context value 字符串', error);
    }
  }
  return buildFlowContextValue(flowInfo);
};

const cloneMark = (mark) => {
  if (!mark) return null;
  return {
    ...mark,
    operationList: ensureArray(mark.operationList).map((op) => ({ ...op })),
    answerList: ensureArray(mark.answerList).map((answer) => ({ ...answer })),
    imgList: ensureArray(mark.imgList).map((item) => ({ ...item })),
  };
};

/**
 * 统一的页面提交 Hook。
 *
 * @param {Object} options
 * @param {() => ({ batchCode: string, examNo: string })} [options.getUserContext]
 * @param {{ batchCode: string, examNo: string }} [options.userContext]
 * @param {() => import('../../types/mark.js').MarkInput} [options.buildMark]
 * @param {() => void|Promise<void>} [options.onBefore]
 * @param {(result: { response: any, payload: any }) => void|Promise<void>} [options.onAfter]
 * @param {(error: Error) => void} [options.onError]
 * @param {(info: { flowId?: string, submoduleId?: string, stepIndex?: number, pageId?: string }) => object|null} [options.getFlowContext]
 * @param {boolean} [options.allowProceedOnFailureInDev=false]
 * @param {(error: Error|undefined) => void} [options.handleSessionExpired]
 * @param {Console} [options.logger=console]
 * @param {(payload: any) => Promise<any>} [options.submitImpl]
 */
export function usePageSubmission(options = {}) {
  const {
    getUserContext,
    userContext,
    buildMark,
    onBefore,
    onAfter,
    onError,
    getFlowContext,
    allowProceedOnFailureInDev = false,
    handleSessionExpired = defaultHandleSessionExpired,
    logger = console,
    submitImpl = submitPageMarkData,
  } = options;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState(null);
  const lastErrorRef = useRef(null);

  const resolveUserContext = useCallback(() => {
    if (typeof getUserContext === 'function') {
      return getUserContext();
    }
    return userContext;
  }, [getUserContext, userContext]);

  const injectFlowContextOperation = useCallback((mark) => {
    if (typeof getFlowContext !== 'function') return null;
    const flowInfo = getFlowContext();
    if (!flowInfo) return null;

    const operationList = ensureArray(mark.operationList);
    const existingOperation = operationList.find((operation) =>
      isFlowContextEventType(operation?.eventType),
    );

    if (existingOperation) {
      const normalizedValue = normalizeFlowContextValue(existingOperation.value, flowInfo);
      if (normalizedValue) {
        existingOperation.value = normalizedValue;
      }
      if (!existingOperation.pageId && flowInfo.pageId) {
        existingOperation.pageId = flowInfo.pageId;
      }
      mark.operationList = operationList;
      return normalizedValue || buildFlowContextValue(flowInfo);
    }

    const nextCode =
      operationList.length > 0
        ? Math.max(...operationList.map((op) => Number(op.code) || 0)) + 1
        : 1;

    const flowContextValue = buildFlowContextValue(flowInfo);

    operationList.push({
      code: nextCode,
      targetElement: 'flow_context',
      eventType: EventTypes.FLOW_CONTEXT,
      value: flowContextValue,
      time: flowInfo.time || formatTimestamp(new Date()),
      pageId: flowInfo.pageId || undefined,
    });

    mark.operationList = operationList;
    return flowContextValue;
  }, [getFlowContext]);

  const submit = useCallback(async ({ markOverride, userContextOverride } = {}) => {
    if (isSubmitting) {
      logger.warn('[usePageSubmission] 正在提交中，跳过重复请求');
      return false;
    }

    setIsSubmitting(true);
    lastErrorRef.current = null;
    setLastError(null);

    const context = userContextOverride || resolveUserContext();

    if (!context || !context.batchCode || !context.examNo) {
      const error = new Error('提交失败：缺少 batchCode/examNo');
      lastErrorRef.current = error;
      setLastError(error);
      setIsSubmitting(false);
      onError?.(error);
      return false;
    }

    let markCandidate = cloneMark(markOverride);

    if (!markCandidate) {
      if (typeof buildMark !== 'function') {
        const error = new Error('提交失败：未提供 buildMark 方法或 markOverride');
        lastErrorRef.current = error;
        setLastError(error);
        setIsSubmitting(false);
        onError?.(error);
        return false;
      }
      markCandidate = cloneMark(buildMark());
    }

    if (!markCandidate) {
      const error = new Error('提交失败：无法构建标记数据');
      lastErrorRef.current = error;
      setLastError(error);
      setIsSubmitting(false);
      onError?.(error);
      return false;
    }

    markCandidate.operationList = ensureArray(markCandidate.operationList).map((operation, index) => {
      const eventType = operation.eventType;
      const isFlowContextEvent = isFlowContextEventType(eventType);

      return {
        code: operation.code ?? index + 1,
        eventType,
        targetElement: operation.targetElement ?? '',
        value: isFlowContextEvent ? operation.value : maybeString(operation.value),
        time: operation.time || formatTimestamp(new Date()),
        pageId: operation.pageId,
      };
    });

    markCandidate.answerList = ensureArray(markCandidate.answerList).map((answer, index) => ({
      code: answer.code ?? index + 1,
      targetElement: answer.targetElement ?? '',
      value: maybeString(answer.value),
    }));

    if (!markCandidate.beginTime) {
      markCandidate.beginTime = formatTimestamp(new Date());
    }
    if (!markCandidate.endTime) {
      markCandidate.endTime = formatTimestamp(new Date());
    }

    const resolvedFlowContext = injectFlowContextOperation(markCandidate);

    debugLog('[usePageSubmission] resolvedFlowContext:', resolvedFlowContext);
    debugLog('[usePageSubmission] pageDesc before enhancement:', markCandidate.pageDesc);

    if (resolvedFlowContext && markCandidate.pageDesc) {
      const enhancedPageDesc = enhancePageDesc(markCandidate.pageDesc, resolvedFlowContext);
      debugLog('[usePageSubmission] pageDesc after enhancement:', enhancedPageDesc);
      markCandidate.pageDesc = enhancedPageDesc;
    } else {
      console.warn('[usePageSubmission] Skipping pageDesc enhancement', {
        hasFlowContext: !!resolvedFlowContext,
        hasPageDesc: !!markCandidate.pageDesc,
        resolvedFlowContext,
        pageDesc: markCandidate.pageDesc,
      });
    }

    try {
      validateMarkObject(markCandidate);
    } catch (validationError) {
      lastErrorRef.current = validationError;
      setLastError(validationError);
      setIsSubmitting(false);
      onError?.(validationError);
      return false;
    }

    const normalizedMark = createMarkObject(markCandidate);
    const payload = createSubmissionPayload(context, normalizedMark);

    try {
      if (onBefore) {
        await onBefore();
      }
    } catch (hookError) {
      logger.error('[usePageSubmission] onBefore 钩子执行失败', hookError);
      lastErrorRef.current = hookError;
      setLastError(hookError);
      setIsSubmitting(false);
      onError?.(hookError);
      return false;
    }

    for (let attempt = 0; attempt < RETRY_DELAYS.length; attempt++) {
      try {
        logger.info('[usePageSubmission] 发起页面提交', {
          attempt: attempt + 1,
          total: RETRY_DELAYS.length,
          pageNumber: normalizedMark.pageNumber,
          pageDesc: normalizedMark.pageDesc,
        });

        const response = await submitImpl(payload);

        if (response?.code === 401) {
          const sessionError = new Error(response.msg || '会话已过期');
          sessionError.code = 401;
          sessionError.isSessionExpired = true;
          throw sessionError;
        }

        if (response?.code && response.code !== 200) {
          throw new Error(response.msg || `提交失败（${response.code}）`);
        }

        onAfter?.({ response, payload });
        setIsSubmitting(false);
        return true;
      } catch (error) {
        if (isSessionExpiredError(error)) {
          logger.error('[usePageSubmission] 会话过期，终止重试');
          setIsSubmitting(false);
          handleSessionExpired(error);
          lastErrorRef.current = error;
          setLastError(error);
          onError?.(error);
          return false;
        }

        const isLastAttempt = attempt === RETRY_DELAYS.length - 1;
        logger.warn('[usePageSubmission] 页面提交失败', {
          attempt: attempt + 1,
          isLastAttempt,
          error,
        });

        if (isLastAttempt) {
          lastErrorRef.current = error;
          setLastError(error);
          setIsSubmitting(false);
          onError?.(error);

          if (allowProceedOnFailureInDev && import.meta.env?.DEV) {
            logger.warn('[usePageSubmission] DEV 模式允许失败后继续');
            return true;
          }

          return false;
        }

        const delay = RETRY_DELAYS[attempt];
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    setIsSubmitting(false);
    return false;
  }, [
    allowProceedOnFailureInDev,
    buildMark,
    handleSessionExpired,
    injectFlowContextOperation,
    isSubmitting,
    logger,
    onAfter,
    onBefore,
    onError,
    resolveUserContext,
    submitImpl,
  ]);

  const helpers = useMemo(
    () => ({
      clearError: () => {
        lastErrorRef.current = null;
        setLastError(null);
      },
      getLastError: () => lastErrorRef.current,
    }),
    [],
  );

  return {
    submit,
    isSubmitting,
    lastError,
    ...helpers,
  };
}

export default usePageSubmission;
