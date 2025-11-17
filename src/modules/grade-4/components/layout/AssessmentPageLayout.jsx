/**
 * 四年级测评页面布局组件
 * 现在使用 shared AssessmentPageFrame + LeftStepperNav 统一布局、计时与下一步按钮。
 */

import { useCallback, useMemo } from 'react';
import { AssessmentPageFrame } from '@shared/ui/PageFrame';
import { useGrade4Context } from '../../context/Grade4Context';
import { moduleConfig } from '../../moduleConfig';
import '../../../../styles/global.css';

const TOTAL_NAV_STEPS = 11;

const resolvePageMeta = (currentPage) => {
  const entries = Object.entries(moduleConfig?.pages || {});
  const match = entries.find(([, cfg]) => Number(cfg.number) === Number(currentPage));

  if (!match) {
    return {
      pageId: `grade4-page-${currentPage}`,
      pageNumber: currentPage,
      pageDesc: `第${currentPage}页`,
    };
  }

  const [pageId, cfg] = match;
  return {
    pageId,
    pageNumber: cfg.number ?? currentPage,
    pageDesc: cfg.desc ?? `第${currentPage}页`,
  };
};

const AssessmentPageLayout = ({
  children,
  showNextButton = true,
  nextButtonText = '下一页',
  isNextButtonEnabled = true,
  onNextClick,
  className = '',
  backgroundImage = null,
  backgroundStyle = {},
  showNavigation,
  showTimer,
  navigationMode = 'experiment',
  navTitle = '进度',
  timerVariant = 'task',
  timerLabel = '剩余时间',
  timerWarningThreshold = moduleConfig?.settings?.warningThresholdSeconds ?? 300,
  timerCriticalThreshold = moduleConfig?.settings?.criticalThresholdSeconds ?? 60,
}) => {
  const {
    logOperation,
    currentPage,
    currentNavigationStep,
    globalTimer,
    buildMarkForSubmission,
    getUserContext,
  } = useGrade4Context();

  const pageMeta = useMemo(
    () => resolvePageMeta(currentPage),
    [currentPage],
  );

  const currentStep = useMemo(() => {
    const parsed = parseInt(currentNavigationStep, 10);
    if (Number.isNaN(parsed) || parsed <= 0) {
      return 1;
    }
    return Math.min(parsed, TOTAL_NAV_STEPS);
  }, [currentNavigationStep]);

  const resolvedShowNavigation = typeof showNavigation === 'boolean'
    ? showNavigation
    : currentPage > 1;

  const resolvedShowTimer = typeof showTimer === 'boolean'
    ? showTimer
    : Boolean(globalTimer?.isActive);

  const containerStyle = useMemo(
    () => ({
      height: '100%',
      width: '100%',
      position: 'relative',
      minHeight: '100%',
      display: 'flex',
      flexDirection: 'column',
      ...(backgroundImage && {
        backgroundImage: `url(${backgroundImage})`,
        backgroundSize: 'contain',
        backgroundPosition: 'center top',
        backgroundRepeat: 'no-repeat',
        ...backgroundStyle,
      }),
    }),
    [backgroundImage, backgroundStyle],
  );

  const submissionConfig = useMemo(() => {
    if (typeof buildMarkForSubmission !== 'function' || typeof getUserContext !== 'function') {
      return null;
    }
    return {
      getUserContext,
      buildMark: () => buildMarkForSubmission(),
      allowProceedOnFailureInDev: Boolean(import.meta.env?.DEV),
    };
  }, [buildMarkForSubmission, getUserContext]);

  const timerScope = useMemo(
    () => `module.${moduleConfig?.moduleId || 'grade-4'}.task`,
    [],
  );

  const handleNext = useCallback(
    async (helpers = {}) => {
      if (!showNextButton || !isNextButtonEnabled) {
        return false;
      }

      logOperation({
        targetElement: '下一页按钮',
        eventType: 'button_click',
        value: `点击${nextButtonText}按钮`,
      });

      if (typeof onNextClick === 'function') {
        try {
          const result = await onNextClick({
            ...helpers,
            nextLabel: nextButtonText,
          });
          return result !== false;
        } catch (error) {
          console.error('[AssessmentPageLayout] onNextClick 执行失败', error);
          return false;
        }
      }

      if (typeof helpers.defaultSubmit === 'function') {
        return helpers.defaultSubmit();
      }

      return true;
    },
    [isNextButtonEnabled, logOperation, nextButtonText, onNextClick, showNextButton],
  );

  return (
    <AssessmentPageFrame
      navigationMode={navigationMode}
      currentStep={currentStep}
      totalSteps={TOTAL_NAV_STEPS}
      navTitle={navTitle}
      showNavigation={resolvedShowNavigation}
      showTimer={resolvedShowTimer}
      timerVariant={timerVariant}
      timerLabel={timerLabel}
      timerWarningThreshold={timerWarningThreshold}
      timerCriticalThreshold={timerCriticalThreshold}
      timerScope={timerScope}
      nextLabel={nextButtonText}
      nextEnabled={isNextButtonEnabled}
      hideNextButton={!showNextButton}
      onNext={handleNext}
      pageMeta={pageMeta}
      submission={submissionConfig || undefined}
    >
      <div className={`page-content page-fade-in ${className}`} style={containerStyle}>
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
          {children}
        </div>
      </div>
    </AssessmentPageFrame>
  );
};

export default AssessmentPageLayout;
