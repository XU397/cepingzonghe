import { useCallback, useMemo, useRef, useState } from 'react';
import { submitPageMarkData } from '@shared/services/apiService.js';
import { createSubmissionPayload } from '@shared/services/dataLogger.js';
import createMarkObject, { formatTimestamp } from './createMarkObject.js';
import EventTypes from './eventTypes.js';
import { handleSessionExpired as defaultHandleSessionExpired } from './handleSessionExpired.js';
import {
  validateMarkObject,
  RESERVED_TARGET_ELEMENTS,
  isNonEmptyAnswer,
} from '@shared/services/submission/schema.ts';
import {
  encodeCompositePageNum,
  buildTargetElementPrefix,
  buildPageDescPrefix,
} from '@shared/utils/pageMapping.ts';

const RETRY_DELAYS = [1000, 2000, 4000];
const debugLog = () => {};
const DEFAULT_TIMEOUT_PLACEHOLDER = '超时未回答';
const DEFAULT_LIFECYCLE_MODE = 'legacy';
const L2_TRACE_LIFECYCLE_MODE = 'l2-trace';
const SUBMISSION_CHANNEL = 'usePageSubmission';
const SYSTEM_EVENT_TARGET = 'page_submission';
const COMPOSITE_TARGET_PREFIX_REGEX = /^P[1-9]\d*\.\d{2}_.+/;
const LEGACY_TARGET_PREFIX_REGEX = /^P\d+(?:\.\d+)?_/;

// System reserved targetElement values that should NOT have P prefix (keep in sync with schema)
const RESERVED_TARGET_ELEMENT_SET = new Set(RESERVED_TARGET_ELEMENTS);

const isSessionExpiredError = error => {
  if (!error) return false;
  if (error.isSessionExpired) return true;
  if (error.code === 401) return true;
  const message = error.message || '';
  return (
    typeof message === 'string' &&
    (message.includes('401') || message.includes('session已过期') || message.includes('请重新登录'))
  );
};

const ensureArray = value => (Array.isArray(value) ? value : []);

const parseTimeValue = value => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string') {
    const directDate = new Date(value);
    if (!Number.isNaN(directDate.getTime())) {
      return directDate;
    }
    const isoLikeDate = new Date(value.replace(' ', 'T'));
    if (!Number.isNaN(isoLikeDate.getTime())) {
      return isoLikeDate;
    }
  }
  return null;
};

const isFlowContextEventType = eventType =>
  eventType === 'flow_context' || eventType === EventTypes.FLOW_CONTEXT;

const maybeString = value => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return value;
  return String(value);
};

const buildFlowContextValue = flowInfo => {
  if (!flowInfo) {
    return null;
  }
  return JSON.stringify({
    flowId: flowInfo.flowId || null,
    submoduleId: flowInfo.submoduleId || null,
    stepIndex: flowInfo.stepIndex ?? null,
    moduleName: flowInfo.moduleName || null,
    pageId: flowInfo.pageId || null,
  });
};

const normalizeFlowContextValue = (value, flowInfo) => {
  // 如果已经是符合格式的 JSON 字符串，直接返回
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object') {
        // 补充 moduleName 如果缺失
        if (!parsed.moduleName && flowInfo?.moduleName) {
          parsed.moduleName = flowInfo.moduleName;
        }
        return JSON.stringify(parsed);
      }
    } catch (error) {
      // 解析失败，使用 buildFlowContextValue 创建新的
    }
  }
  // 如果是对象，转换为 JSON 字符串
  if (value && typeof value === 'object') {
    const merged = {
      flowId: value.flowId || flowInfo?.flowId || null,
      submoduleId: value.submoduleId || flowInfo?.submoduleId || null,
      stepIndex: value.stepIndex ?? flowInfo?.stepIndex ?? null,
      moduleName: value.moduleName || flowInfo?.moduleName || null,
      pageId: value.pageId || flowInfo?.pageId || null,
    };
    return JSON.stringify(merged);
  }
  return buildFlowContextValue(flowInfo);
};

const cloneMark = mark => {
  if (!mark) return null;
  return {
    ...mark,
    operationList: ensureArray(mark.operationList).map(op => ({ ...op })),
    answerList: ensureArray(mark.answerList).map(answer => ({ ...answer })),
    imgList: ensureArray(mark.imgList).map(item => ({ ...item })),
  };
};

const cloneOperationList = operations => ensureArray(operations).map(op => ({ ...op }));
const cloneAnswerList = answers => ensureArray(answers).map(answer => ({ ...answer }));

const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value);

const shouldEncodeCompositePageNumber = meta =>
  isFiniteNumber(meta?.stepIndex) && isFiniteNumber(meta?.subPageNum);

const pickPageNumber = (meta, markCandidate) => {
  if (shouldEncodeCompositePageNumber(meta)) {
    try {
      // 新格式：submoduleIndex = stepIndex + 1, pageIndex = subPageNum
      const submoduleIndex = Number(meta.stepIndex) + 1;
      const pageIndex = Number(meta.subPageNum);
      return encodeCompositePageNum(submoduleIndex, pageIndex);
    } catch (error) {
      console.warn('[usePageSubmission] 复合页码编码失败', error);
    }
  }
  if (markCandidate?.pageNumber) {
    return String(markCandidate.pageNumber);
  }
  if (meta?.pageNumber) {
    return String(meta.pageNumber);
  }
  return '';
};

const derivePageDesc = (markCandidate, meta) => {
  if (markCandidate?.pageDesc) {
    return String(markCandidate.pageDesc);
  }
  if (meta?.pageDesc) {
    return String(meta.pageDesc);
  }
  if (meta?.pageTitle) {
    return String(meta.pageTitle);
  }
  return '未命名页面';
};

const hasFlowPrefix = (pageDesc, prefix) => {
  if (!pageDesc || !prefix) return false;
  return pageDesc.startsWith(prefix) || pageDesc.startsWith(prefix.trim());
};

const applyPageDescPrefixWithFlow = (pageDesc, flowContext, meta) => {
  let parsedFlowContext = flowContext;
  if (typeof flowContext === 'string') {
    try {
      parsedFlowContext = JSON.parse(flowContext);
    } catch (e) {
      parsedFlowContext = null;
    }
  }

  const flowId = parsedFlowContext?.flowId || meta?.flowId;
  const submoduleId = parsedFlowContext?.submoduleId || meta?.submoduleId;
  const stepIndex =
    typeof parsedFlowContext?.stepIndex === 'number'
      ? parsedFlowContext.stepIndex
      : meta?.stepIndex;

  const prefix = buildPageDescPrefix(flowId, submoduleId, stepIndex);
  if (!prefix) {
    return pageDesc;
  }
  if (hasFlowPrefix(pageDesc, prefix)) {
    return pageDesc;
  }
  return `${prefix}${pageDesc}`;
};

const applyOperationTargetPrefix = (operations, pageNumber) => {
  const list = ensureArray(operations);
  if (!pageNumber) {
    return list.map(operation => ({ ...operation }));
  }
  const prefix = buildTargetElementPrefix(pageNumber);
  return list.map(operation => {
    if (!operation) return operation;
    if (isFlowContextEventType(operation.eventType)) {
      return { ...operation };
    }
    const rawTarget =
      typeof operation.targetElement === 'string'
        ? operation.targetElement
        : String(operation.targetElement ?? '');
    if (COMPOSITE_TARGET_PREFIX_REGEX.test(rawTarget)) {
      return {
        ...operation,
        targetElement: rawTarget,
      };
    }
    if (LEGACY_TARGET_PREFIX_REGEX.test(rawTarget)) {
      const strippedTarget = rawTarget.replace(LEGACY_TARGET_PREFIX_REGEX, '').trim();
      return {
        ...operation,
        targetElement: `${prefix}${strippedTarget || 'unknown_target'}`,
      };
    }
    // Skip if system reserved element
    if (RESERVED_TARGET_ELEMENT_SET.has(rawTarget)) {
      return {
        ...operation,
        targetElement: rawTarget,
      };
    }
    return {
      ...operation,
      targetElement: `${prefix}${rawTarget}`,
    };
  });
};

const applyAnswerTargetPrefix = (answers, pageNumber) => {
  const list = ensureArray(answers);
  if (!pageNumber) {
    return list.map(answer => ({ ...answer }));
  }
  const prefix = buildTargetElementPrefix(pageNumber);
  return list.map(answer => {
    if (!answer) return answer;
    const rawTarget =
      typeof answer.targetElement === 'string'
        ? answer.targetElement
        : String(answer.targetElement ?? '');
    if (COMPOSITE_TARGET_PREFIX_REGEX.test(rawTarget)) {
      return {
        ...answer,
        targetElement: rawTarget,
      };
    }
    if (LEGACY_TARGET_PREFIX_REGEX.test(rawTarget)) {
      const strippedTarget = rawTarget.replace(LEGACY_TARGET_PREFIX_REGEX, '').trim();
      return {
        ...answer,
        targetElement: `${prefix}${strippedTarget || 'answer'}`,
      };
    }
    // Skip if system reserved element
    if (RESERVED_TARGET_ELEMENT_SET.has(rawTarget)) {
      return {
        ...answer,
        targetElement: rawTarget,
      };
    }
    return {
      ...answer,
      targetElement: `${prefix}${rawTarget}`,
    };
  });
};

const appendTimeoutAnswers = (answers, targets, placeholderValue, pageNumber) => {
  const missingTargets = ensureArray(targets);
  if (missingTargets.length === 0) {
    return answers;
  }
  const currentAnswers = [...answers];
  const prefix = pageNumber ? buildTargetElementPrefix(pageNumber) : '';
  const knownTargets = new Set(currentAnswers.map(answer => String(answer?.targetElement ?? '')));

  missingTargets.forEach(entry => {
    const descriptor =
      typeof entry === 'string'
        ? { targetElement: entry }
        : entry && typeof entry === 'object'
          ? entry
          : null;
    const rawTarget = descriptor?.targetElement ? String(descriptor.targetElement).trim() : '';
    if (!rawTarget) {
      return;
    }
    const prefixed = prefix ? `${prefix}${rawTarget}` : rawTarget;
    if (knownTargets.has(rawTarget) || knownTargets.has(prefixed)) {
      return;
    }
    currentAnswers.push({
      targetElement: rawTarget,
      value: descriptor?.value ?? placeholderValue ?? DEFAULT_TIMEOUT_PLACEHOLDER,
    });
    knownTargets.add(rawTarget);
    knownTargets.add(prefixed);
  });

  return currentAnswers;
};

const appendTimeoutOperations = (
  operations,
  { pageNumber, autoSubmitReason, autoSubmitMeta, pageExitReason, timeoutSeconds }
) => {
  const now = formatTimestamp(new Date());
  const autoSubmitValue = {
    reason: autoSubmitReason || 'timeout_auto_submit',
    trigger: 'auto_submit',
    triggerTime: now,
    timeout: timeoutSeconds ?? autoSubmitMeta?.timeout,
    pageNumber,
    ...(autoSubmitMeta || {}),
  };

  const eventSet = new Set(operations.map(operation => operation?.eventType));
  const result = [...operations];
  const timeoutExitReason = pageExitReason || 'timeout_auto_submit';
  const hasTimeoutExit = operations.some(
    operation =>
      operation?.eventType === EventTypes.PAGE_EXIT &&
      String(operation?.value || '') === timeoutExitReason
  );

  if (!eventSet.has(EventTypes.AUTO_SUBMIT)) {
    result.push({
      eventType: EventTypes.AUTO_SUBMIT,
      targetElement: 'page',
      value: autoSubmitValue,
      time: now,
    });
  }

  if (!hasTimeoutExit) {
    result.push({
      eventType: EventTypes.PAGE_EXIT,
      targetElement: 'page',
      value: timeoutExitReason,
      time: now,
    });
  }

  return result;
};

const filterNonEmptyAnswers = answers =>
  ensureArray(answers)
    .map(answer => ({
      ...answer,
      value: answer?.value === undefined || answer?.value === null ? '' : String(answer.value),
    }))
    .filter(answer => isNonEmptyAnswer(answer));

const ensureLifecycleOperations = (operations, { pageDesc, pageId, mode, beginTime }) => {
  const list = ensureArray(operations).map(operation => ({ ...operation }));
  const eventSet = new Set(list.map(operation => operation?.eventType));
  const now = formatTimestamp(new Date());
  const hasAutoSubmit = eventSet.has(EventTypes.AUTO_SUBMIT);

  if (!eventSet.has(EventTypes.PAGE_ENTER)) {
    list.unshift({
      eventType: EventTypes.PAGE_ENTER,
      targetElement: 'page',
      value: pageDesc || pageId || 'page_enter',
      time: beginTime || now,
      pageId,
    });
  }

  if (!hasAutoSubmit && !eventSet.has(EventTypes.NEXT_CLICK)) {
    const nextClickOperation = {
      eventType: EventTypes.NEXT_CLICK,
      targetElement: 'next_button',
      value: '下一页',
      time: now,
      pageId,
    };
    const exitIndex = list.findIndex(operation => operation?.eventType === EventTypes.PAGE_EXIT);
    if (exitIndex >= 0) {
      list.splice(exitIndex, 0, nextClickOperation);
    } else {
      list.push(nextClickOperation);
    }
  }

  if (!eventSet.has(EventTypes.PAGE_EXIT)) {
    list.push({
      eventType: EventTypes.PAGE_EXIT,
      targetElement: 'page',
      value: mode === 'timeout' ? 'timeout_auto_submit' : 'navigate_next',
      time: now,
      pageId,
    });
  }

  return list;
};

const normalizeOperations = (operations, defaultPageId) =>
  ensureArray(operations).map((operation, index) => {
    const eventType = operation?.eventType;
    return {
      code: index + 1,
      eventType,
      targetElement: typeof operation?.targetElement === 'string' ? operation.targetElement : '',
      value: isFlowContextEventType(eventType) ? operation?.value : maybeString(operation?.value),
      time: operation?.time || formatTimestamp(new Date()),
      pageId: operation?.pageId || defaultPageId || undefined,
    };
  });

const normalizeAnswers = answers =>
  ensureArray(answers).map((answer, index) => ({
    code: index + 1,
    targetElement: typeof answer?.targetElement === 'string' ? answer.targetElement : '',
    value: answer?.value === null || answer?.value === undefined ? '' : String(answer.value),
  }));

const buildMarkFromInputs = (meta, answers, operations) => ({
  pageNumber: meta?.pageNumber ? String(meta.pageNumber) : '',
  pageDesc: meta?.pageDesc || meta?.pageTitle || '',
  operationList: operations,
  answerList: answers,
  beginTime: formatTimestamp(new Date()),
  endTime: formatTimestamp(new Date()),
  imgList: [],
});

const answerEntriesFromObject = record => {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return [];
  }
  return Object.entries(record).map(([targetElement, value]) => ({
    targetElement,
    value,
  }));
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
 * @param {Object|(() => Object)} [options.pageMeta]
 * @param {Array|(() => Array)|Record<string, string>} [options.answers]
 * @param {Array|(() => Array)} [options.operations]
 * @param {'legacy'|'l2-trace'} [options.lifecycleMode='legacy']
 * @param {(mark: object) => void} [options.traceValidator]
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
    pageMeta,
    answers,
    operations,
    logOperation: externalLogOperation,
    lifecycleMode = DEFAULT_LIFECYCLE_MODE,
    traceValidator,
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

  const injectFlowContextOperation = useCallback(
    mark => {
      if (typeof getFlowContext !== 'function') return null;
      const flowInfo = getFlowContext();
      if (!flowInfo) return null;

      const operationList = ensureArray(mark.operationList);
      // 检查是否已存在 flow_context
      const existingOpIndex = operationList.findIndex(operation =>
        isFlowContextEventType(operation?.eventType)
      );

      if (existingOpIndex !== -1) {
        const existingOperation = operationList[existingOpIndex];
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

      const flowContextValue = buildFlowContextValue(flowInfo);
      const pageEnterIndex = operationList.findIndex(
        op => op.eventType === 'page_enter' || op.eventType === EventTypes.PAGE_ENTER
      );
      const pageEnterOp = pageEnterIndex !== -1 ? operationList[pageEnterIndex] : null;
      let flowContextTime = flowInfo.time;
      if (!flowContextTime) {
        const pageEnterTime = parseTimeValue(pageEnterOp?.time);
        if (pageEnterTime) {
          flowContextTime = formatTimestamp(new Date(pageEnterTime.getTime() + 1000));
        } else if (typeof pageEnterOp?.time === 'string' && pageEnterOp.time.trim()) {
          flowContextTime = pageEnterOp.time;
        } else {
          flowContextTime = formatTimestamp(new Date());
        }
      }
      const flowContextOp = {
        code: 0, // 稍后重新编号
        targetElement: 'flow_context',
        eventType: EventTypes.FLOW_CONTEXT,
        value: flowContextValue,
        time: flowContextTime,
        pageId: flowInfo.pageId || undefined,
      };

      // 在 page_enter 后插入，如果没有 page_enter 则插入到开头
      const insertIndex = pageEnterIndex !== -1 ? pageEnterIndex + 1 : 0;
      operationList.splice(insertIndex, 0, flowContextOp);

      // 重新编号 code，从 1 开始连续递增
      operationList.forEach((op, index) => {
        op.code = index + 1;
      });

      mark.operationList = operationList;
      return flowContextValue;
    },
    [getFlowContext]
  );

  const emitSubmitEvent = useCallback(
    (eventType, markSummary, { isTimeout, error } = {}) => {
      if (typeof externalLogOperation !== 'function') {
        return;
      }
      if (!markSummary) {
        return;
      }
      const pageNumber = markSummary.pageNumber ? String(markSummary.pageNumber) : '';
      const targetPrefix = pageNumber ? buildTargetElementPrefix(pageNumber) : '';
      const targetElement = targetPrefix
        ? `${targetPrefix}${SYSTEM_EVENT_TARGET}`
        : SYSTEM_EVENT_TARGET;
      const payload = {
        channel: SUBMISSION_CHANNEL,
        pageNumber,
        pageDesc: markSummary.pageDesc || '',
        auto_submit: Boolean(isTimeout),
        timestamp: new Date().toISOString(),
      };
      if (eventType === EventTypes.PAGE_SUBMIT_FAILED && error) {
        payload.error = error.message || String(error);
      }
      try {
        externalLogOperation({
          targetElement,
          eventType,
          value: payload,
          time: formatTimestamp(new Date()),
          pageId: markSummary.pageId,
        });
      } catch (logError) {
        logger?.warn?.('[usePageSubmission] 提交事件日志记录失败', logError);
      }
    },
    [externalLogOperation, logger]
  );

  const submitInternal = useCallback(
    async ({ markOverride, userContextOverride, mode = 'default', timeoutOptions = {} } = {}) => {
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

      const resolveProvidedOperations = () => {
        try {
          const provided = typeof operations === 'function' ? operations() : operations;
          return cloneOperationList(provided);
        } catch (error) {
          logger.warn('[usePageSubmission] 无法解析 operations', error);
          return [];
        }
      };

      const resolveProvidedAnswers = () => {
        try {
          const provided = typeof answers === 'function' ? answers() : answers;
          if (Array.isArray(provided)) {
            return cloneAnswerList(provided);
          }
          return cloneAnswerList(answerEntriesFromObject(provided));
        } catch (error) {
          logger.warn('[usePageSubmission] 无法解析 answers', error);
          return [];
        }
      };

      const resolvePageMetaValue = () => {
        if (typeof pageMeta === 'function') {
          try {
            return pageMeta() || {};
          } catch (error) {
            logger.warn('[usePageSubmission] 解析 pageMeta 失败', error);
            return {};
          }
        }
        return pageMeta || {};
      };

      const resolvedPageMeta = resolvePageMetaValue();

      let markCandidate = cloneMark(markOverride);

      if (!markCandidate) {
        if (typeof buildMark === 'function') {
          markCandidate = cloneMark(buildMark());
        } else {
          const fallbackAnswers = resolveProvidedAnswers();
          const fallbackOperations = resolveProvidedOperations();
          markCandidate = buildMarkFromInputs(
            resolvedPageMeta,
            fallbackAnswers,
            fallbackOperations
          );
        }
      }

      if (!markCandidate) {
        const error = new Error('提交失败：无法构建标记数据');
        lastErrorRef.current = error;
        setLastError(error);
        setIsSubmitting(false);
        onError?.(error);
        return false;
      }

      if (!markCandidate.beginTime) {
        markCandidate.beginTime = formatTimestamp(new Date());
      }
      if (!markCandidate.endTime) {
        markCandidate.endTime = formatTimestamp(new Date());
      }

      let resolvedPageNumber = pickPageNumber(resolvedPageMeta, markCandidate);
      if (!resolvedPageNumber) {
        logger.warn('[usePageSubmission] pageNumber 缺失，默认使用 "1.01"');
        resolvedPageNumber = '1.01';
      }
      markCandidate.pageNumber = resolvedPageNumber;

      const isL2TraceMode = lifecycleMode === L2_TRACE_LIFECYCLE_MODE;
      const baseOperations = ensureArray(markCandidate.operationList);
      const mergedOperations =
        baseOperations.length > 0
          ? cloneOperationList(baseOperations)
          : resolveProvidedOperations();

      let composedOperations = [...mergedOperations];
      if (mode === 'timeout' && !isL2TraceMode) {
        composedOperations = appendTimeoutOperations(composedOperations, {
          pageNumber: resolvedPageNumber,
          autoSubmitReason: timeoutOptions.autoSubmitReason,
          autoSubmitMeta: timeoutOptions.autoSubmitMeta,
          pageExitReason: timeoutOptions.pageExitReason,
          timeoutSeconds: timeoutOptions.timeoutSeconds ?? timeoutOptions.timeout,
        });
      }
      markCandidate.operationList = composedOperations;

      const baseAnswers = ensureArray(markCandidate.answerList);
      let composedAnswers =
        baseAnswers.length > 0 ? cloneAnswerList(baseAnswers) : resolveProvidedAnswers();

      if (mode === 'timeout' && !isL2TraceMode) {
        composedAnswers = appendTimeoutAnswers(
          composedAnswers,
          timeoutOptions.missingAnswerTargets,
          timeoutOptions.placeholderValue || DEFAULT_TIMEOUT_PLACEHOLDER,
          resolvedPageNumber
        );
      }
      markCandidate.answerList = filterNonEmptyAnswers(composedAnswers);

      const resolvedFlowContext = isL2TraceMode ? null : injectFlowContextOperation(markCandidate);

      debugLog('[usePageSubmission] resolvedFlowContext:', resolvedFlowContext);
      const pageDescBefore = derivePageDesc(markCandidate, resolvedPageMeta);
      debugLog('[usePageSubmission] pageDesc before enhancement:', pageDescBefore);

      const pageDescAfter = isL2TraceMode
        ? pageDescBefore
        : applyPageDescPrefixWithFlow(pageDescBefore, resolvedFlowContext, resolvedPageMeta);
      debugLog('[usePageSubmission] pageDesc after enhancement:', pageDescAfter);
      markCandidate.pageDesc = pageDescAfter;

      if (!isL2TraceMode) {
        markCandidate.operationList = ensureLifecycleOperations(markCandidate.operationList, {
          pageDesc: pageDescAfter,
          pageId: resolvedPageMeta.pageId,
          mode,
          beginTime: markCandidate.beginTime,
        });
      }

      const prefixedOperations = applyOperationTargetPrefix(
        markCandidate.operationList,
        resolvedPageNumber
      );
      markCandidate.operationList = normalizeOperations(
        prefixedOperations,
        resolvedPageMeta.pageId
      );

      const prefixedAnswers = applyAnswerTargetPrefix(markCandidate.answerList, resolvedPageNumber);
      markCandidate.answerList = normalizeAnswers(prefixedAnswers);

      let normalizedMark = null;
      try {
        if (isL2TraceMode) {
          if (typeof traceValidator !== 'function') {
            throw new Error('lifecycleMode="l2-trace" requires traceValidator');
          }
          traceValidator(markCandidate);
        } else {
          validateMarkObject(markCandidate);
        }
      } catch (validationError) {
        lastErrorRef.current = validationError;
        setLastError(validationError);
        setIsSubmitting(false);
        onError?.(validationError);
        return false;
      }

      normalizedMark = createMarkObject(markCandidate);
      const submissionPageSummary = {
        pageNumber: normalizedMark.pageNumber,
        pageDesc: normalizedMark.pageDesc,
        pageId: resolvedPageMeta.pageId || markCandidate.pageId,
      };
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
          if (!isL2TraceMode) {
            emitSubmitEvent(EventTypes.PAGE_SUBMIT_SUCCESS, submissionPageSummary, {
              isTimeout: mode === 'timeout',
            });
          }
          setIsSubmitting(false);
          return true;
        } catch (error) {
          if (isSessionExpiredError(error)) {
            logger.error('[usePageSubmission] 会话过期，终止重试');
            if (!isL2TraceMode) {
              emitSubmitEvent(EventTypes.PAGE_SUBMIT_FAILED, submissionPageSummary, {
                isTimeout: mode === 'timeout',
                error,
              });
            }
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
            if (!isL2TraceMode) {
              emitSubmitEvent(EventTypes.PAGE_SUBMIT_FAILED, submissionPageSummary, {
                isTimeout: mode === 'timeout',
                error,
              });
            }
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
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      setIsSubmitting(false);
      return false;
    },
    [
      allowProceedOnFailureInDev,
      answers,
      buildMark,
      handleSessionExpired,
      injectFlowContextOperation,
      isSubmitting,
      lifecycleMode,
      logger,
      onAfter,
      onBefore,
      onError,
      operations,
      pageMeta,
      resolveUserContext,
      submitImpl,
      emitSubmitEvent,
      traceValidator,
    ]
  );

  const submit = useCallback(
    (params = {}) => submitInternal({ ...params, mode: 'default' }),
    [submitInternal]
  );

  const submitOnTimeout = useCallback(
    (timeoutOptions = {}) => submitInternal({ mode: 'timeout', timeoutOptions }),
    [submitInternal]
  );

  const helpers = useMemo(
    () => ({
      clearError: () => {
        lastErrorRef.current = null;
        setLastError(null);
      },
      getLastError: () => lastErrorRef.current,
    }),
    []
  );

  return {
    submit,
    submitOnTimeout,
    isSubmitting,
    lastError,
    ...helpers,
  };
}

export default usePageSubmission;
