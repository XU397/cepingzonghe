import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import LeftStepperNav from '@shared/ui/LeftStepperNav/index.jsx';
import TimerContainer from '@shared/ui/TimerDisplay/TimerContainer';
import { usePageSubmission } from '@shared/services/submission/usePageSubmission.js';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import styles from './frame.module.css';

const asArray = (value) => (Array.isArray(value) ? value : []);

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

const defaultPageMeta = {
  pageId: 'unknown-page',
  pageNumber: '0',
  pageDesc: '未命名页面',
};

const buildLifecycleOperation = (eventType, meta, overrides = {}) => ({
  eventType,
  targetElement: overrides.targetElement ?? meta.pageId ?? 'page',
  value: overrides.value ?? meta.pageDesc ?? '',
  pageId: meta.pageId,
  time: formatTimestamp(new Date()),
  ...overrides,
});

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
}) {
  const effectivePageMeta = useMemo(
    () => ({
      ...defaultPageMeta,
      ...pageMeta,
    }),
    [pageMeta],
  );

  const lifecycleEventsRef = useRef({});
  const exitMarkedRef = useRef(false);

  const resetLifecycle = useCallback(() => {
    lifecycleEventsRef.current = {};
    exitMarkedRef.current = false;
  }, []);

  useEffect(() => {
    resetLifecycle();
  }, [resetLifecycle, effectivePageMeta.pageId]);

  const upsertLifecycleEvent = useCallback(
    (eventType, overrides = {}) => {
      if (!autoRecordLifecycle) return;
      const operation = buildLifecycleOperation(eventType, effectivePageMeta, overrides);
      lifecycleEventsRef.current[eventType] = operation;
      onLifecycleEvent?.(operation);
    },
    [autoRecordLifecycle, effectivePageMeta, onLifecycleEvent],
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

  const {
    getUserContext,
    userContext,
    buildMark: submissionBuildMark,
    getFlowContext,
    allowProceedOnFailureInDev,
    handleSessionExpired,
    logger,
    submitImpl,
    onBefore: submissionOnBefore,
    onAfter: submissionOnAfter,
    onError: submissionOnError,
  } = submission || {};

  const wrappedBuildMark = useCallback(() => {
    if (typeof submissionBuildMark !== 'function') {
      return submissionBuildMark;
    }
    const mark = submissionBuildMark();
    if (!autoRecordLifecycle || !mark) return mark;

    const lifecycleOps = Object.values(lifecycleEventsRef.current);
    if (lifecycleOps.length === 0) return mark;

    const existing = asArray(mark.operationList);
    const deduped = lifecycleOps.filter(
      (op) =>
        !existing.some(
          (item) =>
            item.eventType === op.eventType &&
            (item.targetElement || '') === (op.targetElement || '') &&
            (item.value || '') === (op.value || ''),
        ),
    );

    if (!deduped.length) return mark;

    return {
      ...mark,
      operationList: [...existing, ...deduped],
    };
  }, [autoRecordLifecycle, submissionBuildMark]);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [errorDescriptor, setErrorDescriptor] = useState(null);
  const [isHandlingNext, setIsHandlingNext] = useState(false);

  const forwardSubmissionError = useCallback(
    async (error) => {
      if (typeof submissionOnError === 'function') {
        await submissionOnError(error);
      }
    },
    [submissionOnError],
  );

  const beforeHook = useMemo(
    () => mergeHandlers(submissionOnBefore, onBefore),
    [onBefore, submissionOnBefore],
  );
  const afterHook = useMemo(
    () => mergeHandlers(submissionOnAfter, onAfter),
    [onAfter, submissionOnAfter],
  );
  const errorHook = useMemo(
    () => mergeHandlers(forwardSubmissionError, onError),
    [forwardSubmissionError, onError],
  );

  const {
    submit,
    isSubmitting,
    lastError,
    clearError,
  } = usePageSubmission({
    getUserContext,
    userContext,
    buildMark: wrappedBuildMark,
    onBefore: beforeHook,
    onAfter: afterHook,
    onError: errorHook,
    getFlowContext,
    allowProceedOnFailureInDev,
    handleSessionExpired,
    logger,
    submitImpl,
  });

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

  const resolvedWarning = useMemo(() => {
    if (typeof timerWarningThreshold === 'number') return timerWarningThreshold;
    return resolvedTimerType === 'questionnaire' ? 180 : 300;
  }, [resolvedTimerType, timerWarningThreshold]);

  const disableNavigationClick = !(allowNavigationClick && typeof onStepClick === 'function');

  const handleDefaultNext = useCallback(async () => {
    if (isSubmitting || isHandlingNext || !nextEnabled) {
      return false;
    }
    setIsHandlingNext(true);
    clearErrorTray();
    markPageExit('proceed_next');

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

  return (
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
                  onTimeout={timerOnTimeout}
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
  }),
  pageMeta: PropTypes.shape({
    pageId: PropTypes.string,
    pageNumber: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    pageDesc: PropTypes.string,
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
};

export default AssessmentPageFrame;
