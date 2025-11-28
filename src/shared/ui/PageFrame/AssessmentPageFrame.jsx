import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import LeftStepperNav from '@shared/ui/LeftStepperNav/index.jsx';
import TimerContainer from '@shared/ui/TimerDisplay/TimerContainer';
import { usePageSubmission } from '@shared/services/submission/usePageSubmission.js';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import AppContext from '@/context/AppContext.jsx';
import { encodeCompositePageNum } from '@shared/utils/pageMapping.ts';
import STORAGE_KEYS, { getStorageItem } from '@shared/services/storage/storageKeys.js';
import styles from './frame.module.css';

const asArray = (value) => (Array.isArray(value) ? value : []);
const cloneEntries = (entries) => asArray(entries).map((entry) => ({ ...entry }));

const composeAsync = (...handlers) => async (...args) => {
  for (const handler of handlers) {
    if (typeof handler === 'function') {
       
      await handler(...args);
    }
  }
};

const mergeHandlers = (...handlers) => {
  const valid = handlers.filter((fn) => typeof fn === 'function');
  if (!valid.length) return undefined;
  return composeAsync(...valid);
};

const PageSubmissionContext = createContext({
  submitPage: async () => false,
  logOperation: () => {},
  pageNumber: '0',
});

export const usePageSubmissionContext = () => useContext(PageSubmissionContext);

const defaultPageMeta = {
  pageId: 'unknown-page',
  pageNumber: '0',
  pageDesc: '未命名页面',
};

const buildLifecycleOperation = (eventType, meta, overrides = {}) => ({
  ...overrides,
  eventType,
  targetElement: 'page', // 强制为系统保留字 'page'，放在最后确保不被 overrides 覆盖
  value: overrides.value ?? meta.pageDesc ?? '',
  pageId: meta.pageId,
  time: formatTimestamp(new Date()),
});

/**
 * 评估页面框架组件，提供定制化的导航、计时与统一提交上下文。
 *
 * @param {Object} props - 组件属性。
 * @param {string} props.pageId - 页面唯一标识，用于日志与提交。
 * @param {() => ({ batchCode: string, examNo: string })} [props.getUserContext] - 覆盖默认用户上下文。
 * @param {() => Object} [props.getFlowContext] - Flow 模式下的上下文解析函数。
 * @param {Function} [props.onSubmitSuccess] - 每次提交成功后的全局回调。
 * @param {Function} [props.onSubmitError] - 每次提交失败后的全局回调。
 * @param {(helpers: { submitPage: Function, submitOnTimeout: Function, pageMeta: Object }) => void} [props.onTimeout]
 *   - 计时器自动提交后的自定义处理。
 *
 * @example
 * import { usePageSubmissionContext } from '@shared/ui/PageFrame/AssessmentPageFrame.jsx';
 *
 * function SamplePage() {
 *   const { submitPage, logOperation } = usePageSubmissionContext();
 *
 *   const handleSubmit = async () => {
 *     logOperation({ eventType: 'click', targetElement: 'btn_submit', value: 'confirm' });
 *     await submitPage({
 *       answers: [
 *         { targetElement: 'Q1', value: 'A' },
 *         { targetElement: 'Q2', value: 'B' },
 *       ],
 *       operations: [
 *         { eventType: 'operation_confirm', targetElement: 'btn_submit', value: '用户点击提交' },
 *       ],
 *     });
 *   };
 *
 *   return (
 *     <AssessmentPageFrame
 *       pageId="Page_Sample"
 *       pageTitle="示例页面"
 *       subPageNum={2}
 *       stepIndex={1}
 *     >
 *       <button type="button" onClick={handleSubmit}>交卷</button>
 *     </AssessmentPageFrame>
 *   );
 * }
 */
export function AssessmentPageFrame({
  children,
  navigationMode = 'experiment',
  currentStep = 1,
  totalSteps = 0,
  navTitle = '进度',
  navCompact = false,
  allowNavigationClick = false,
  onStepClick,
  showNavigation = true,
  showTimer = true,
  timerVariant,
  timerWarningThreshold,
  timerCriticalThreshold = 60,
  timerLabel = '剩余时间',
  timerScope,
  timerOnTimeout,
  timerOnTick,
  timerShowEmoji = true,
  hideNextButton = false,
  nextLabel = '下一页',
  nextEnabled = true,
  nextButtonProps = {},
  onProceed,
  onNext,
  submission = {},
  pageMeta = defaultPageMeta,
  autoRecordLifecycle = true,
  onLifecycleEvent,
  showErrorTray = true,
  errorFormatter,
  footerSlot,
  headerSlot,
  className = '',
  bodyClassName = '',
  footerAlign = 'end',
  onBefore,
  onAfter,
  onError,
  getUserContext: getUserContextProp,
  getFlowContext: getFlowContextProp,
  pageId,
  pageTitle,
  subPageNum,
  stepIndex,
  onSubmitSuccess,
  onSubmitError,
  onTimeout,
}) {
  const appContext = useContext(AppContext) || null;
  const appLogOperation = appContext?.logOperation;
  const appBatchCode = appContext?.batchCode;
  const appExamNo = appContext?.examNo;
  const preparePageSubmissionData = appContext?.preparePageSubmissionData;

  const effectivePageMeta = useMemo(() => {
    const merged = {
      ...defaultPageMeta,
      ...pageMeta,
    };
    if (pageId) {
      merged.pageId = pageId;
    }
    if (typeof pageTitle === 'string' && pageTitle.trim()) {
      merged.pageTitle = pageTitle;
      if (!merged.pageDesc || merged.pageDesc === defaultPageMeta.pageDesc) {
        merged.pageDesc = pageTitle;
      }
    }
    if (typeof subPageNum === 'number') {
      merged.subPageNum = subPageNum;
    }
    if (typeof stepIndex === 'number') {
      merged.stepIndex = stepIndex;
    }
    if (typeof merged.pageNum !== 'undefined' && typeof merged.pageNumber === 'undefined') {
      merged.pageNumber = merged.pageNum;
    }
    if (typeof merged.pageNumber === 'number') {
      merged.pageNumber = String(merged.pageNumber);
    }
    if (!merged.pageDesc && merged.pageTitle) {
      merged.pageDesc = merged.pageTitle;
    }
    if (!merged.pageId) {
      merged.pageId = defaultPageMeta.pageId;
    }
    return merged;
  }, [pageId, pageMeta, pageTitle, stepIndex, subPageNum]);

  const resolvedPageNumber = useMemo(() => {
    if (
      typeof effectivePageMeta.stepIndex === 'number' &&
      typeof effectivePageMeta.subPageNum === 'number'
    ) {
      try {
        return encodeCompositePageNum(
          Number(effectivePageMeta.stepIndex),
          Number(effectivePageMeta.subPageNum),
        );
      } catch (error) {
        console.warn('[AssessmentPageFrame] 复合页码编码失败', error);
      }
    }
    if (effectivePageMeta.pageNumber) {
      return String(effectivePageMeta.pageNumber);
    }
    return defaultPageMeta.pageNumber;
  }, [effectivePageMeta]);

  // Extract submission helpers early to avoid TDZ errors
  const {
    getUserContext: submissionGetUserContext,
    userContext: submissionUserContext,
    buildMark: submissionBuildMark,
    getFlowContext: submissionGetFlowContext,
    allowProceedOnFailureInDev: submissionAllowProceedOnFailureInDev,
    handleSessionExpired: submissionHandleSessionExpired,
    logger: submissionLogger,
    submitImpl: submissionSubmitImpl,
    onBefore: submissionOnBefore,
    onAfter: submissionOnAfter,
    onError: submissionOnError,
    answers: submissionAnswers,
    operations: submissionOperations,
  } = submission || {};

  const fallbackGetUserContext = useMemo(() => {
    if (!appContext) {
      return undefined;
    }
    return () => ({
      batchCode: appBatchCode || getStorageItem(STORAGE_KEYS.CORE_BATCH_CODE) || '',
      examNo: appExamNo || getStorageItem(STORAGE_KEYS.CORE_EXAM_NO) || '',
    });
  }, [appBatchCode, appContext, appExamNo]);

  const resolvedGetUserContext = useMemo(
    () => getUserContextProp || submissionGetUserContext || fallbackGetUserContext,
    [fallbackGetUserContext, getUserContextProp, submissionGetUserContext],
  );

  const resolvedGetFlowContext = useMemo(
    () => getFlowContextProp || submissionGetFlowContext,
    [getFlowContextProp, submissionGetFlowContext],
  );

  const submissionPageMeta = useMemo(
    () => ({
      ...effectivePageMeta,
      pageNumber: resolvedPageNumber,
    }),
    [effectivePageMeta, resolvedPageNumber],
  );

  const lifecycleEventsRef = useRef({});
  const exitMarkedRef = useRef(false);
  const logOperationWithPage = useCallback(
    (operation = {}) => {
      if (typeof appLogOperation !== 'function') {
        return;
      }
      appLogOperation({
        pageId: effectivePageMeta.pageId,
        ...operation,
      });
    },
    [appLogOperation, effectivePageMeta.pageId],
  );
  const perSubmitCallbacksRef = useRef({ onSuccess: null, onError: null });
  const lastSubmissionMarkRef = useRef(null);

  const resetLifecycle = useCallback(() => {
    lifecycleEventsRef.current = {};
    exitMarkedRef.current = false;
  }, []);

  useEffect(() => {
    resetLifecycle();
  }, [resetLifecycle, effectivePageMeta.pageId]);

  useEffect(() => {
    lastSubmissionMarkRef.current = null;
  }, [effectivePageMeta.pageId]);

  const mergeLifecycleOperations = useCallback(
    (operations = []) => {
      const base = cloneEntries(operations);
      if (!autoRecordLifecycle) {
        return base;
      }
      const lifecycleOps = Object.values(lifecycleEventsRef.current);
      if (!lifecycleOps.length) {
        return base;
      }
      const deduped = lifecycleOps.filter(
        (op) =>
          !base.some(
            (item) =>
              item.eventType === op.eventType &&
              (item.targetElement || '') === (op.targetElement || '') &&
              (item.value || '') === (op.value || ''),
          ),
      );
      if (!deduped.length) {
        return base;
      }
      return [...base, ...deduped];
    },
    [autoRecordLifecycle],
  );

  /**
   * next_click 是最小事件集合的一部分，这里在手动提交前兜底补齐，
   * 以确保“下一页”意图始终记录为触发提交的原因。
   */
  const buildNextClickOperation = useCallback(() => {
    const targetElement = resolvedPageNumber
      ? `P${resolvedPageNumber}_next_button`
      : 'next_button';
    return buildLifecycleOperation(EventTypes.NEXT_CLICK, effectivePageMeta, {
      targetElement,
      value: 'navigate_next',
    });
  }, [effectivePageMeta, resolvedPageNumber]);

  const appendNextClickEvent = useCallback(
    (operations = []) => {
      if (operations.some((operation) => operation?.eventType === EventTypes.NEXT_CLICK)) {
        return operations;
      }
      const nextClickOperation = buildNextClickOperation();
      logOperationWithPage(nextClickOperation);
      return [...operations, nextClickOperation];
    },
    [buildNextClickOperation, logOperationWithPage],
  );

  const upsertLifecycleEvent = useCallback(
    (eventType, overrides = {}) => {
      if (!autoRecordLifecycle) return;
      const operation = buildLifecycleOperation(eventType, effectivePageMeta, overrides);
      lifecycleEventsRef.current[eventType] = operation;
      logOperationWithPage(operation);
      onLifecycleEvent?.(operation);
    },
    [autoRecordLifecycle, effectivePageMeta, logOperationWithPage, onLifecycleEvent],
  );

  const markPageExit = useCallback(
    (reason = 'navigate_next') => {
      if (exitMarkedRef.current || !autoRecordLifecycle) return;
      exitMarkedRef.current = true;
      upsertLifecycleEvent(EventTypes.PAGE_EXIT, {
        value: reason,
      });
    },
    [autoRecordLifecycle, upsertLifecycleEvent],
  );

  useEffect(() => {
    if (!autoRecordLifecycle) {
      return undefined;
    }
    upsertLifecycleEvent(EventTypes.PAGE_ENTER, {
      value: effectivePageMeta.pageDesc,
    });
    return () => {
      markPageExit('component_unmount');
    };
  }, [autoRecordLifecycle, effectivePageMeta.pageDesc, markPageExit, upsertLifecycleEvent]);

  // Submission helpers already extracted above (line 207-220) to avoid TDZ
  const resolvedLogger = submissionLogger || console;
  const userContext = submissionUserContext;
  const allowProceedOnFailureInDev = submissionAllowProceedOnFailureInDev;
  const handleSessionExpired = submissionHandleSessionExpired;
  const submitImpl = submissionSubmitImpl;

  const buildMarkFromContext = useCallback(() => {
    if (typeof preparePageSubmissionData !== 'function') {
      return null;
    }
    try {
      return preparePageSubmissionData();
    } catch (error) {
      resolvedLogger.warn('[AssessmentPageFrame] 读取上下文页面数据失败', error);
      return null;
    }
  }, [preparePageSubmissionData, resolvedLogger]);

  const wrappedBuildMark = useCallback(() => {
    let markCandidate = null;
    if (typeof submissionBuildMark === 'function') {
      markCandidate = submissionBuildMark();
    } else if (submissionBuildMark) {
      markCandidate = submissionBuildMark;
    } else {
      // 老架构：仅当既无 buildMark 时，才 fallback 到 AppContext
      markCandidate = buildMarkFromContext();
    }

    if (!markCandidate) {
      return markCandidate;
    }

    return {
      ...markCandidate,
      operationList: mergeLifecycleOperations(markCandidate.operationList),
    };
  }, [buildMarkFromContext, mergeLifecycleOperations, submissionBuildMark]);

  // 新架构：当提供了 operations/answers 时，不传递 buildMark 给 usePageSubmission
  // usePageSubmission 会自动使用 operations/answers 构建 mark
  const resolvedBuildMark = (submissionAnswers || submissionOperations)
    ? undefined
    : wrappedBuildMark;

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [errorDescriptor, setErrorDescriptor] = useState(null);
  const [isHandlingNext, setIsHandlingNext] = useState(false);

  const sanitizeAnswersInput = useCallback(
    (answersInput) => {
      try {
        const value = typeof answersInput === 'function' ? answersInput() : answersInput;
        if (!value) {
          return [];
        }
        if (Array.isArray(value)) {
          return cloneEntries(value);
        }
        if (typeof value === 'object') {
          return Object.entries(value).map(([targetElement, valueEntry]) => ({
            targetElement,
            value: valueEntry,
          }));
        }
      } catch (error) {
        resolvedLogger.warn('[AssessmentPageFrame] 解析 answers 失败', error);
      }
      return [];
    },
    [resolvedLogger],
  );

  const sanitizeOperationsInput = useCallback(
    (operationsInput) => {
      try {
        const value = typeof operationsInput === 'function' ? operationsInput() : operationsInput;
        if (!value) {
          return [];
        }
        if (Array.isArray(value)) {
          return cloneEntries(value);
        }
      } catch (error) {
        resolvedLogger.warn('[AssessmentPageFrame] 解析 operations 失败', error);
      }
      return [];
    },
    [resolvedLogger],
  );

  const resolveSubmissionAnswers = useCallback(
    () => sanitizeAnswersInput(submissionAnswers),
    [sanitizeAnswersInput, submissionAnswers],
  );

  const resolveSubmissionOperations = useCallback(
    () => {
      const value = sanitizeOperationsInput(submissionOperations);
      const withLifecycle = mergeLifecycleOperations(value);
      return appendNextClickEvent(withLifecycle);
    },
    [appendNextClickEvent, mergeLifecycleOperations, sanitizeOperationsInput, submissionOperations],
  );

  const composeMarkOverride = useCallback(
    ({ answers: answersInput, operations: operationsInput } = {}, options = {}) => {
      const normalizedOperations = mergeLifecycleOperations(
        sanitizeOperationsInput(operationsInput),
      );
      const { injectNextClick = false } = options;
      const operationList = injectNextClick
        ? appendNextClickEvent(normalizedOperations)
        : normalizedOperations;
      return {
        answerList: sanitizeAnswersInput(answersInput),
        operationList,
        pageId: effectivePageMeta.pageId,
        pageDesc: effectivePageMeta.pageDesc,
      };
    },
    [appendNextClickEvent, effectivePageMeta.pageDesc, effectivePageMeta.pageId, mergeLifecycleOperations, sanitizeAnswersInput, sanitizeOperationsInput],
  );

  const attachNextClickToMark = useCallback(
    (mark) => {
      if (!mark) return null;
      const operationList = appendNextClickEvent(asArray(mark.operationList));
      if (operationList === mark.operationList) {
        return mark;
      }
      return {
        ...mark,
        operationList,
      };
    },
    [appendNextClickEvent],
  );

  const ensureNextClickMark = useCallback(
    (markOverride) => {
      if (markOverride) {
        return attachNextClickToMark(markOverride);
      }
      const builtMark = typeof resolvedBuildMark === 'function' ? resolvedBuildMark() : null;
      if (!builtMark) {
        return null;
      }
      return attachNextClickToMark(builtMark);
    },
    [attachNextClickToMark, resolvedBuildMark],
  );

  const resolveTimeoutMark = useCallback(
    () => lastSubmissionMarkRef.current || composeMarkOverride(),
    [composeMarkOverride],
  );

  const forwardSubmissionError = useCallback(
    async (error) => {
      if (typeof submissionOnError === 'function') {
        await submissionOnError(error);
      }
    },
    [submissionOnError],
  );

  const handlePerSubmitSuccess = useCallback(
    async (...args) => {
      const { onSuccess } = perSubmitCallbacksRef.current;
      perSubmitCallbacksRef.current = { onSuccess: null, onError: null };
      if (typeof onSubmitSuccess === 'function') {
        await onSubmitSuccess(...args);
      }
      if (typeof onSuccess === 'function') {
        await onSuccess(...args);
      }
    },
    [onSubmitSuccess],
  );

  const handlePerSubmitError = useCallback(
    async (...args) => {
      const { onError: perError } = perSubmitCallbacksRef.current;
      perSubmitCallbacksRef.current = { onSuccess: null, onError: null };
      if (typeof onSubmitError === 'function') {
        await onSubmitError(...args);
      }
      if (typeof perError === 'function') {
        await perError(...args);
      }
    },
    [onSubmitError],
  );

  const beforeHook = useMemo(
    () => mergeHandlers(submissionOnBefore, onBefore),
    [onBefore, submissionOnBefore],
  );
  const afterHook = useMemo(
    () => mergeHandlers(submissionOnAfter, onAfter, handlePerSubmitSuccess),
    [handlePerSubmitSuccess, onAfter, submissionOnAfter],
  );
  const errorHook = useMemo(
    () => mergeHandlers(forwardSubmissionError, onError, handlePerSubmitError),
    [forwardSubmissionError, handlePerSubmitError, onError],
  );

  const {
    submit: submitRaw,
    submitOnTimeout,
    isSubmitting,
    lastError,
    clearError,
  } = usePageSubmission({
    getUserContext: resolvedGetUserContext,
    userContext,
    buildMark: resolvedBuildMark,
    onBefore: beforeHook,
    onAfter: afterHook,
    onError: errorHook,
    getFlowContext: resolvedGetFlowContext,
    allowProceedOnFailureInDev,
    handleSessionExpired,
    logger: resolvedLogger,
    submitImpl,
    pageMeta: () => submissionPageMeta,
    answers: resolveSubmissionAnswers,
    operations: resolveSubmissionOperations,
    logOperation: logOperationWithPage,
  });

  /**
   * 默认导航不会自己拼装 next_click，这里统一兜底注入，确保 Schema 所需的最小事件集完整。
   */
  const submit = useCallback(
    (options = {}) => {
      const { markOverride, ...rest } = options;
      const normalizedMarkOverride = ensureNextClickMark(markOverride);
      if (normalizedMarkOverride) {
        return submitRaw({
          ...rest,
          markOverride: normalizedMarkOverride,
        });
      }
      return submitRaw(rest);
    },
    [ensureNextClickMark, submitRaw],
  );

  const classifyError = useCallback(
    (error) => {
      if (!error) return null;
      if (typeof errorFormatter === 'function') {
        return errorFormatter(error, {
          failedAttempts,
        });
      }
      if (error.isSessionExpired || error.code === 401) {
        return {
          severity: 'info',
          title: '登录状态已失效',
          message: '系统已将你带回登录页，请重新登录后继续测评。',
          retryable: false,
        };
      }
      if (failedAttempts > 1) {
        return {
          severity: 'error',
          title: '多次提交失败',
          message: error.message || '已尝试多次提交但仍失败，请检查网络或稍后再试。',
          retryable: true,
          retryLabel: '再次尝试',
        };
      }
      return {
        severity: 'warning',
        title: '提交失败，可重试',
        message: error.message || '网络波动导致提交失败，请点击下方按钮重试。',
        retryable: true,
        retryLabel: '重试提交',
      };
    },
    [errorFormatter, failedAttempts],
  );

  useEffect(() => {
    if (!lastError) {
      setErrorDescriptor(null);
      return;
    }
    setErrorDescriptor(classifyError(lastError));
  }, [classifyError, lastError]);

  const clearErrorTray = useCallback(() => {
    setErrorDescriptor(null);
    clearError();
  }, [clearError]);

  const resolvedTimerType = useMemo(() => {
    if (timerVariant) return timerVariant;
    return navigationMode === 'questionnaire' ? 'questionnaire' : 'task';
  }, [navigationMode, timerVariant]);

  const primePerSubmitCallbacks = useCallback((callbacks = {}) => {
    perSubmitCallbacksRef.current = {
      onSuccess: typeof callbacks.onSuccess === 'function' ? callbacks.onSuccess : null,
      onError: typeof callbacks.onError === 'function' ? callbacks.onError : null,
    };
  }, []);

  const runSubmitWithMark = useCallback(
    (options = {}) => {
      const { markOverride, onSuccess, onError, mode = 'default', timeoutOptions } = options;
      primePerSubmitCallbacks({ onSuccess, onError });
      const isDefaultMode = mode !== 'timeout';
      const normalizedMarkOverride =
        isDefaultMode && markOverride ? ensureNextClickMark(markOverride) : markOverride;
      if (isDefaultMode) {
        if (normalizedMarkOverride) {
          lastSubmissionMarkRef.current = normalizedMarkOverride;
        }
      } else if (markOverride) {
        lastSubmissionMarkRef.current = markOverride;
      }
      const submitFn = mode === 'timeout' ? submitOnTimeout : submit;
      return submitFn({
        markOverride: isDefaultMode ? normalizedMarkOverride : markOverride,
        timeoutOptions,
      });
    },
    [ensureNextClickMark, primePerSubmitCallbacks, submit, submitOnTimeout],
  );

  const submitPage = useCallback(
    (options = {}) => {
      const { answers, operations, onSuccess, onError } = options;
      const markOverride = composeMarkOverride({ answers, operations });
      return runSubmitWithMark({ markOverride, onSuccess, onError });
    },
    [composeMarkOverride, runSubmitWithMark],
  );

  const resolvedWarning = useMemo(() => {
    if (typeof timerWarningThreshold === 'number') return timerWarningThreshold;
    return resolvedTimerType === 'questionnaire' ? 180 : 300;
  }, [resolvedTimerType, timerWarningThreshold]);

  const handleTimerTimeout = useCallback(async () => {
    await runSubmitWithMark({ markOverride: resolveTimeoutMark(), mode: 'timeout' });
    if (typeof timerOnTimeout === 'function') {
      await timerOnTimeout();
    }
    if (typeof onTimeout === 'function') {
      await onTimeout({
        submitPage,
        submitOnTimeout: (payload = {}) => runSubmitWithMark({ ...payload, mode: 'timeout' }),
        pageMeta: submissionPageMeta,
      });
    }
  }, [onTimeout, resolveTimeoutMark, runSubmitWithMark, submissionPageMeta, submitPage, timerOnTimeout]);

  const disableNavigationClick = !(allowNavigationClick && typeof onStepClick === 'function');

  const handleDefaultNext = useCallback(async () => {
    if (isSubmitting || isHandlingNext || !nextEnabled) {
      return false;
    }
    setIsHandlingNext(true);
    clearErrorTray();
    markPageExit('proceed_next');

    primePerSubmitCallbacks();
    const success = await submit();
    if (success) {
      setFailedAttempts(0);
      setErrorDescriptor(null);
      await onProceed?.();
    } else {
      setFailedAttempts((prev) => prev + 1);
    }
    setIsHandlingNext(false);
    return success;
  }, [
    clearErrorTray,
    isHandlingNext,
    isSubmitting,
    markPageExit,
    nextEnabled,
    onProceed,
    submit,
  ]);

  const handleNext = useCallback(async () => {
    if (typeof onNext === 'function') {
      return onNext({
        submit,
        defaultSubmit: handleDefaultNext,
        recordLifecycleEvent: upsertLifecycleEvent,
        markPageExit,
      });
    }
    return handleDefaultNext();
  }, [handleDefaultNext, markPageExit, onNext, submit, upsertLifecycleEvent]);

  const renderErrorTray = () => {
    if (!showErrorTray || !errorDescriptor) return null;
    const severityClass =
      errorDescriptor.severity === 'info'
        ? styles.errorInfo
        : errorDescriptor.severity === 'warning'
          ? styles.errorWarning
          : '';
    return (
      <div className={`${styles.errorTray} ${severityClass}`}>
        <div className={styles.errorIcon}>
          {errorDescriptor.severity === 'info' && 'ℹ️'}
          {errorDescriptor.severity === 'warning' && '⚠️'}
          {errorDescriptor.severity === 'error' && '⛔'}
        </div>
        <div className={styles.errorContent}>
          <p className={styles.errorTitle}>{errorDescriptor.title}</p>
          <p className={styles.errorMessage}>{errorDescriptor.message}</p>
          <div className={styles.errorActions}>
            {errorDescriptor.retryable && (
              <button
                type="button"
                className={styles.errorAction}
                onClick={handleNext}
                disabled={isSubmitting || isHandlingNext}
              >
                {errorDescriptor.retryLabel || '重试'}
              </button>
            )}
            <button
              type="button"
              className={`${styles.errorAction} ${styles.errorDismiss}`}
              onClick={clearErrorTray}
            >
              知道了
            </button>
          </div>
        </div>
      </div>
    );
  };

  const showNav = showNavigation && navigationMode !== 'hidden' && totalSteps > 0;
  const waiting = isSubmitting || isHandlingNext;
  const footerJustify = footerAlign === 'start' ? 'flex-start' : footerAlign === 'center' ? 'center' : 'flex-end';
  const nextBtnClassName = nextButtonProps?.className ?? '';
  const restNextButtonProps = useMemo(() => {
    if (!nextButtonProps) return {};
    const { className: _cls, onClick: _onClick, disabled: _disabled, ...rest } = nextButtonProps;
    return rest;
  }, [nextButtonProps]);

  const pageSubmissionContextValue = useMemo(
    () => ({
      submitPage,
      logOperation: logOperationWithPage,
      pageNumber: resolvedPageNumber,
    }),
    [logOperationWithPage, resolvedPageNumber, submitPage],
  );

  return (
    <PageSubmissionContext.Provider value={pageSubmissionContextValue}>
      <div className={styles.frameWrapper}>
        <div className={`${styles.frame} ${className}`} data-nav-mode={navigationMode}>
          <aside className={`${styles.navRail} ${showNav ? '' : styles.navHidden}`}>
            {showNav && (
              <LeftStepperNav
                mode={navigationMode === 'questionnaire' ? 'questionnaire' : 'experiment'}
                currentStep={currentStep}
                totalSteps={totalSteps}
                compact={navCompact}
                onStepClick={disableNavigationClick ? undefined : onStepClick}
                title={navTitle}
              />
            )}
          </aside>

          <section className={styles.content}>
            <div className={styles.contentCard}>
              <div className={styles.header}>
                <div className={styles.timerSlot}>
                  {headerSlot}
                  {showTimer && (
                    <TimerContainer
                      type={resolvedTimerType}
                      warningThreshold={resolvedWarning}
                      criticalThreshold={timerCriticalThreshold}
                      label={timerLabel}
                      onTimeout={handleTimerTimeout}
                      onTick={timerOnTick}
                      showEmoji={timerShowEmoji}
                      scope={timerScope}
                    />
                  )}
                </div>
              </div>

              <div className={`${styles.body} ${bodyClassName}`}>{children}</div>

              <div className={styles.footer}>
                {renderErrorTray()}
                {footerSlot && <div className={styles.footerSlot}>{footerSlot}</div>}
                {!hideNextButton && (
                  <div className={styles.actionRow} style={{ justifyContent: footerJustify }}>
                    <button
                      type="button"
                      className={`${styles.nextButton} ${waiting ? styles.nextButtonLoading : ''} ${nextBtnClassName}`}
                      onClick={handleNext}
                      disabled={!nextEnabled || waiting}
                      {...restNextButtonProps}
                    >
                      {waiting ? '提交中...' : nextLabel}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </PageSubmissionContext.Provider>
  );
}

AssessmentPageFrame.propTypes = {
  children: PropTypes.node.isRequired,
  navigationMode: PropTypes.oneOf(['hidden', 'experiment', 'questionnaire']),
  currentStep: PropTypes.number,
  totalSteps: PropTypes.number,
  navTitle: PropTypes.string,
  navCompact: PropTypes.bool,
  allowNavigationClick: PropTypes.bool,
  onStepClick: PropTypes.func,
  showNavigation: PropTypes.bool,
  showTimer: PropTypes.bool,
  timerVariant: PropTypes.oneOf(['task', 'questionnaire', 'notice']),
  timerWarningThreshold: PropTypes.number,
  timerCriticalThreshold: PropTypes.number,
  timerLabel: PropTypes.string,
  timerScope: PropTypes.string,
  timerOnTimeout: PropTypes.func,
  timerOnTick: PropTypes.func,
  timerShowEmoji: PropTypes.bool,
  hideNextButton: PropTypes.bool,
  nextLabel: PropTypes.string,
  nextEnabled: PropTypes.bool,
  nextButtonProps: PropTypes.object,
  onProceed: PropTypes.func,
  onNext: PropTypes.func,
  submission: PropTypes.shape({
    getUserContext: PropTypes.func,
    userContext: PropTypes.object,
    buildMark: PropTypes.func,
    getFlowContext: PropTypes.func,
    allowProceedOnFailureInDev: PropTypes.bool,
    handleSessionExpired: PropTypes.func,
    logger: PropTypes.object,
    submitImpl: PropTypes.func,
    onBefore: PropTypes.func,
    onAfter: PropTypes.func,
    onError: PropTypes.func,
    answers: PropTypes.oneOfType([PropTypes.array, PropTypes.func, PropTypes.object]),
    operations: PropTypes.oneOfType([PropTypes.array, PropTypes.func]),
  }),
  pageMeta: PropTypes.shape({
    pageId: PropTypes.string,
    pageNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    pageDesc: PropTypes.string,
    pageTitle: PropTypes.string,
    subPageNum: PropTypes.number,
    stepIndex: PropTypes.number,
  }),
  autoRecordLifecycle: PropTypes.bool,
  onLifecycleEvent: PropTypes.func,
  showErrorTray: PropTypes.bool,
  errorFormatter: PropTypes.func,
  footerSlot: PropTypes.node,
  headerSlot: PropTypes.node,
  className: PropTypes.string,
  bodyClassName: PropTypes.string,
  footerAlign: PropTypes.oneOf(['start', 'center', 'end']),
  onBefore: PropTypes.func,
  onAfter: PropTypes.func,
  onError: PropTypes.func,
  getUserContext: PropTypes.func,
  getFlowContext: PropTypes.func,
  pageId: PropTypes.string.isRequired,
  pageTitle: PropTypes.string,
  subPageNum: PropTypes.number,
  stepIndex: PropTypes.number,
  onSubmitSuccess: PropTypes.func,
  onSubmitError: PropTypes.func,
  onTimeout: PropTypes.func,
};

export default AssessmentPageFrame;
