import React, { Suspense, lazy, useEffect, useCallback, useMemo } from 'react';
import type { SubmoduleProps } from '@shared/types/flow';
import { AssessmentPageFrame } from '@shared/ui/PageFrame';
import { DroneImagingProvider, useDroneImagingContext } from './context/DroneImagingContext';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { usePageSubmission } from '@shared/services/submission/usePageSubmission';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import { getSubPageNumByPageId, getPageConfig, PAGE_CONFIGS } from './mapping';
import type { PageId } from './mapping';

// Lazy load page components
const Page01_Cover = lazy(() => import('./pages/Page01_Cover'));
const Page02_Background = lazy(() => import('./pages/Page02_Background'));
const Page03_Hypothesis = lazy(() => import('./pages/Page03_Hypothesis'));
const Page04_ExperimentFree = lazy(() => import('./pages/Page04_ExperimentFree'));
const Page05_FocalAnalysis = lazy(() => import('./pages/Page05_FocalAnalysis'));
const Page06_HeightAnalysis = lazy(() => import('./pages/Page06_HeightAnalysis'));
const Page07_Conclusion = lazy(() => import('./pages/Page07_Conclusion'));

// Loading fallback component
function LoadingFallback() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        minHeight: '200px',
        fontSize: '16px',
        color: '#666',
      }}
    >
      Loading...
    </div>
  );
}

// Page router component
function PageRouter() {
  const { currentPageId } = useDroneImagingContext();

  switch (currentPageId) {
    case 'cover':
      return <Page01_Cover />;
    case 'background':
      return <Page02_Background />;
    case 'hypothesis':
      return <Page03_Hypothesis />;
    case 'experiment_free':
      return <Page04_ExperimentFree />;
    case 'focal_analysis':
      return <Page05_FocalAnalysis />;
    case 'height_analysis':
      return <Page06_HeightAnalysis />;
    case 'conclusion':
      return <Page07_Conclusion />;
    default:
      console.warn('[DroneImaging] Unknown pageId: ' + currentPageId + ', falling back to cover');
      return <Page01_Cover />;
  }
}

// Question IDs that need answers
const QUESTION_IDS = [
  'P1_确认阅读',
  'P3_控制变量理由',
  'P5_最小GSD焦距',
  'P6_GSD变化趋势',
  'P7_优先调整因素',
  'P7_理由说明',
] as const;

// Inner component that has access to context
function DroneImagingInner({
  userContext,
  flowContext,
  options,
}: Omit<SubmoduleProps, 'initialPageId'>) {
  const {
    currentPageId,
    operations,
    answers,
    pageStartTime,
    experimentState,
    logOperation,
    setAnswer,
    clearOperations,
    saveToStorage,
  } = useDroneImagingContext();

  const resolveUserIds = useCallback(() => {
    const flatBatchCode = (userContext as any)?.batchCode || '';
    const flatExamNo = (userContext as any)?.examNo || '';
    const nestedBatchCode = (userContext as any)?.user?.batchCode || '';
    const nestedExamNo = (userContext as any)?.user?.examNo || '';

    return {
      batchCode: flatBatchCode || nestedBatchCode || '',
      examNo: flatExamNo || nestedExamNo || '',
    };
  }, [userContext]);

  // Setup page submission hook
  const { submit } = usePageSubmission({
    getUserContext: resolveUserIds,
    getFlowContext: flowContext
      ? () => ({
          flowId: flowContext.flowId,
          submoduleId: flowContext.submoduleId,
          stepIndex: flowContext.stepIndex,
          pageId: currentPageId,
        })
      : undefined,
    allowProceedOnFailureInDev: true,
  });

  // Handle timer expiration - auto-submit with default values
  const handleTimerExpiration = useCallback(async () => {
    console.log('[DroneImaging] Timer expired, auto-submitting...');

    // Log AUTO_SUBMIT event
    logOperation({
      targetElement: 'module',
      eventType: EventTypes.AUTO_SUBMIT,
      value: 'timer_expired',
      time: formatTimestamp(new Date()),
    });

    // Fill unanswered questions with timeout message
    const timeoutValue = '超时未回�?';
    QUESTION_IDS.forEach((questionId) => {
      const currentAnswer = answers[questionId];
      if (!currentAnswer || currentAnswer.trim() === '') {
        setAnswer(questionId, timeoutValue);
      }
    });

    // Build answer list from answers
    const answerList = Object.entries(answers).map(([key, value], index) => ({
      code: index + 1,
      targetElement: key,
      value: value || timeoutValue,
    }));

    // Add experiment capture history as answer
    if (experimentState.captureHistory.length > 0) {
      answerList.push({
        code: answerList.length + 1,
        targetElement: 'experiment_captures',
        value: JSON.stringify(experimentState.captureHistory),
      });
    }

    // Get page description
    const pageConfig = getPageConfig(currentPageId as PageId);
    const pageDesc = '无人机航�?' + (pageConfig?.pageId || currentPageId);

    // Build mark object for submission
    const markData = {
      pageNumber: String(getSubPageNumByPageId(currentPageId as PageId)),
      pageDesc,
      operationList: operations,
      answerList,
      beginTime: pageStartTime,
      endTime: formatTimestamp(new Date()),
    };

    // Submit data
    try {
      await submit({ markOverride: markData });
      console.log('[DroneImaging] Auto-submit completed');
    } catch (error) {
      console.error('[DroneImaging] Auto-submit failed:', error);
    }

    // Save to storage before completion
    saveToStorage();

    // Clear operations after submission
    clearOperations();

    // Call onComplete callback
    if (flowContext?.onComplete) {
      flowContext.onComplete();
    }
  }, [
    answers,
    clearOperations,
    currentPageId,
    experimentState.captureHistory,
    flowContext,
    logOperation,
    operations,
    pageStartTime,
    saveToStorage,
    setAnswer,
    submit,
  ]);

  // Handle timeout signal from flow context
  useEffect(() => {
    if (flowContext?.onTimeout) {
      // Register timeout handler
      const originalOnTimeout = flowContext.onTimeout;
      flowContext.onTimeout = () => {
        handleTimerExpiration();
        originalOnTimeout?.();
      };
    }
  }, [flowContext, handleTimerExpiration]);

  // Notify flow context of page changes
  useEffect(() => {
    if (flowContext?.updateModuleProgress) {
      const subPageNum = getSubPageNumByPageId(currentPageId as PageId);
      flowContext.updateModuleProgress(String(subPageNum));
    }
  }, [currentPageId, flowContext]);

  return (
    <Suspense fallback={<LoadingFallback />}>
      <PageRouter />
    </Suspense>
  );
}

// Frame wrapper that provides unified navigation/timer shell
function DroneImagingFrame(props: Omit<SubmoduleProps, 'initialPageId'>) {
  const { flowContext } = props;
  const {
    currentPageId,
    operations,
    answers,
    pageStartTime,
    experimentState,
    navigateToPage,
    logOperation,
  } = useDroneImagingContext();
  const pageConfig = getPageConfig(currentPageId as PageId);

  const navigationMode = pageConfig?.navigationMode ?? 'experiment';
  const currentStep = pageConfig?.stepIndex ?? 0;
  const totalSteps = PAGE_CONFIGS.filter((cfg) => cfg.stepIndex > 0).length;
  const subPageNum = getSubPageNumByPageId(currentPageId as PageId);

  const canProceed = useMemo(() => {
    if (!currentPageId) {
      return true;
    }
    if (currentPageId === 'cover') {
      const confirmValue = answers['P1_确认阅读'] || '';
      return confirmValue.trim().length > 0;
    }
    if (currentPageId === 'experiment_free') {
      return experimentState.captureHistory.length > 0;
    }
    if (currentPageId === 'background') {
      return operations.some(
        (op) =>
          op.eventType === EventTypes.READING_COMPLETE &&
          (op.value === 'Page02_Background' || op.targetElement === 'page'),
      );
    }
    if (currentPageId === 'hypothesis') {
      const reason = (answers['P3_控制变量理由'] || '').trim();
      return reason.length > 5;
    }
    if (currentPageId === 'focal_analysis') {
      const selected = (answers['P5_最小GSD焦距'] || '').trim();
      return selected.length > 0;
    }
    if (currentPageId === 'height_analysis') {
      const selected = (answers['P6_GSD变化趋势'] || '').trim();
      return selected.length > 0;
    }
    if (currentPageId === 'conclusion') {
      const selected = (answers['P7_优先调整因素'] || '').trim();
      const reason = (answers['P7_理由说明'] || '').trim();
      return selected.length > 0 && reason.length > 5;
    }
    return true;
  }, [answers, currentPageId, operations]);

  const submissionConfig = useMemo(() => {
    const getUserContext = () => {
      const flatBatchCode = (props.userContext as any)?.batchCode || '';
      const flatExamNo = (props.userContext as any)?.examNo || '';
      const nestedBatchCode = (props.userContext as any)?.user?.batchCode || '';
      const nestedExamNo = (props.userContext as any)?.user?.examNo || '';

      return {
        batchCode: flatBatchCode || nestedBatchCode || '',
        examNo: flatExamNo || nestedExamNo || '',
      };
    };

    const buildMark = () => {
      const pageDescBase = pageConfig?.pageId ?? currentPageId;

      const answerList = Object.entries(answers).map(([key, value], index) => ({
        code: index + 1,
        targetElement: key,
        value: value ?? '',
      }));

      if (experimentState.captureHistory.length > 0) {
        answerList.push({
          code: answerList.length + 1,
          targetElement: 'experiment_captures',
          value: JSON.stringify(experimentState.captureHistory),
        });
      }

      return {
        pageNumber: String(subPageNum),
        pageDesc: pageDescBase,
        operationList: operations,
        answerList,
        beginTime: pageStartTime,
        endTime: formatTimestamp(new Date()),
      };
    };

    const getFlowContext =
      flowContext && flowContext.flowId
        ? () => ({
            flowId: flowContext.flowId,
            submoduleId: flowContext.submoduleId,
            stepIndex: flowContext.stepIndex,
            pageId: currentPageId,
          })
        : undefined;

    return {
      getUserContext,
      buildMark,
      getFlowContext,
      allowProceedOnFailureInDev: Boolean(import.meta.env?.DEV),
    };
  }, [
    answers,
    currentPageId,
    experimentState.captureHistory,
    flowContext,
    operations,
    pageConfig?.pageId,
    pageStartTime,
    props.userContext,
    subPageNum,
  ]);

  const goToNextPage = useCallback(() => {
    const currentIndex = PAGE_CONFIGS.findIndex((cfg) => cfg.pageId === (currentPageId as PageId));
    if (currentIndex >= 0 && currentIndex < PAGE_CONFIGS.length - 1) {
      const nextConfig = PAGE_CONFIGS[currentIndex + 1];
      navigateToPage(nextConfig.pageId);
      return;
    }
    if (currentIndex === PAGE_CONFIGS.length - 1 && flowContext?.onComplete) {
      flowContext.onComplete();
    }
  }, [currentPageId, flowContext, navigateToPage]);

  const handleFrameNext = useCallback(
    async ({ defaultSubmit }: { defaultSubmit?: () => Promise<boolean> }) => {
      if (!canProceed) {
        const pageNextButton =
          document.querySelector<HTMLButtonElement>('[data-testid="next-button"]');
        if (pageNextButton) {
          pageNextButton.click();
        }
        return false;
      }

      if (typeof defaultSubmit === 'function') {
        const ok = await defaultSubmit();
        if (!ok) {
          return false;
        }
      }
      goToNextPage();
      return true;
    },
    [canProceed, goToNextPage],
  );

  const handleTimerTimeout = useCallback(() => {
    if (flowContext?.onTimeout) {
      flowContext.onTimeout();
    }
  }, [flowContext]);

  const pageMeta = {
    pageId: pageConfig?.pageId ?? currentPageId,
    pageNumber: String(subPageNum),
    pageDesc: `无人机航拍交互课�?${pageConfig?.pageId ?? currentPageId}`,
  };

  const showUnifiedTimer = currentPageId !== 'cover';

  return (
    <AssessmentPageFrame
      navigationMode={navigationMode}
      currentStep={currentStep}
      totalSteps={totalSteps}
      navTitle="进度"
      showNavigation={navigationMode !== 'hidden'}
      showTimer={showUnifiedTimer}
      timerVariant="task"
      timerLabel="剩余时间"
      timerScope="module.g8-drone-imaging.task"
      nextLabel="下一步"
      submission={submissionConfig}
      onNext={handleFrameNext}
      timerOnTimeout={handleTimerTimeout}
      pageMeta={pageMeta}
      nextButtonProps={{ 'data-testid': 'frame-next-button' }}
    >
      <DroneImagingInner
        userContext={props.userContext}
        flowContext={props.flowContext}
        options={props.options}
      />
    </AssessmentPageFrame>
  );
}

// Main component
export default function Component({
  initialPageId,
  userContext,
  flowContext,
  options,
}: SubmoduleProps) {
  // Validate initialPageId
  const validPageId = (initialPageId as PageId) || 'cover';

  return (
    <DroneImagingProvider initialPageId={validPageId}>
      <DroneImagingFrame userContext={userContext} flowContext={flowContext} options={options} />
    </DroneImagingProvider>
  );
}
