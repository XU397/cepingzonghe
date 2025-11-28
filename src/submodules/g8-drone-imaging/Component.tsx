import React, { Suspense, lazy, useEffect, useCallback, useMemo } from 'react';
import type { SubmoduleProps } from '@shared/types/flow';
import { AssessmentPageFrame } from '@shared/ui/PageFrame';
import { DroneImagingProvider, useDroneImagingContext } from './context/DroneImagingContext';
import type { AnswerRecord, buildQuestionIdMap } from './context/DroneImagingContext';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { usePageSubmission } from '@shared/services/submission/usePageSubmission';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import { getSubPageNumByPageId, getPageConfig, PAGE_CONFIGS } from './mapping';
import type { PageId } from './mapping';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';

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

const getQuestionIdList = (questionIds: ReturnType<typeof buildQuestionIdMap>) => [
  questionIds.confirmRead,
  questionIds.controlVariableReason,
  questionIds.minGsdFocal,
  questionIds.gsdTrend,
  questionIds.priorityFactor,
  questionIds.priorityReason,
];

const getQuestionTextMap = (questionIds: ReturnType<typeof buildQuestionIdMap>) => ({
  [questionIds.confirmRead]: '我已阅读并理解以上注意事项',
  [questionIds.controlVariableReason]:
    '问题1：为什么在每次航拍时，都需要确保相机分辨率和天气条件等一致？请写出原因。',
  [questionIds.minGsdFocal]:
    '问题2：根据模拟实验，当飞行高度为100米时，使用何种焦距可以使地面采样距离（GSD）达到最小？',
  [questionIds.gsdTrend]:
    '问题3：根据模拟实验，随着飞行高度的增加，地面采样距离（GSD）呈现出怎样的变化趋势？',
  [questionIds.priorityFactor]:
    '问题4：右图展示了飞行高度、镜头焦距与地面采样距离（GSD）的关系曲线。请问在航拍中，为获取更高精度的影像，应优先考虑降低飞行高度还是调整镜头焦距？',
  [questionIds.priorityReason]: '请说明你的理由：',
});

interface DroneImagingProps extends Omit<SubmoduleProps, 'initialPageId'> {
  stepIndex?: number;
  initialPageId?: string;
}

type DroneImagingChildProps = Omit<DroneImagingProps, 'initialPageId'>;

// Inner component that has access to context
function DroneImagingInner({
  userContext,
  flowContext,
  options,
  stepIndex: stepIndexProp,
}: DroneImagingChildProps) {
  const stepIndex = stepIndexProp ?? flowContext?.stepIndex ?? 0;
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
    questionIds,
  } = useDroneImagingContext();

  const requiredQuestionIds = useMemo(() => getQuestionIdList(questionIds), [questionIds]);
  const questionTextMap = useMemo(() => getQuestionTextMap(questionIds), [questionIds]);

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
          stepIndex,
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

    const subPageNum = getSubPageNumByPageId(currentPageId as PageId);
    const currentPageNumber = encodeCompositePageNum(stepIndex, subPageNum);
    const currentPagePrefix = `P${currentPageNumber}_`;

    // Fill unanswered questions with timeout message (仅当前页面的问题)
    const timeoutValue = '超时未回答';
    const populatedAnswers: Record<string, AnswerRecord> = { ...answers };

    // 只处理当前页面的必填问题
    requiredQuestionIds.forEach((questionId) => {
      if (questionId.startsWith(currentPagePrefix)) {
        const currentAnswer = populatedAnswers[questionId];
        const answerValue = currentAnswer?.value ?? '';
        if (!answerValue || answerValue.trim() === '') {
          populatedAnswers[questionId] = { value: timeoutValue };
          setAnswer(questionId, timeoutValue);
        }
      }
    });

    // 仅提交当前页面的答案
    const answerList = Object.entries(populatedAnswers)
      .filter(([key, answerRecord]) => {
        const answerValue = answerRecord?.value ?? '';
        if (answerValue.trim() === '') {
          return false;
        }
        // 只提交当前页面的答案
        return key.startsWith(currentPagePrefix);
      })
      .map(([key, answerRecord], index) => ({
        code: index + 1,
        targetElement: questionTextMap[key] ?? key,
        value: answerRecord?.value ?? '',
      }));

    // 实验历史仅在实验页面提交
    if (currentPageId === 'experiment_free' && experimentState.captureHistory.length > 0) {
      answerList.push({
        code: answerList.length + 1,
        targetElement: 'experiment_captures',
        value: JSON.stringify(experimentState.captureHistory),
      });
    }

    // Get page description
    const pageConfig = getPageConfig(currentPageId as PageId);
    const pageDescPrefix = flowContext
      ? `[${flowContext.flowId}/${flowContext.submoduleId}/${stepIndex}] `
      : '';
    const pageDescBase = `无人机航拍交互课堂-${pageConfig?.pageId || currentPageId}`;
    const pageDesc = `${pageDescPrefix}${pageDescBase}`;

    // Build mark object for submission
    const markData = {
      pageNumber: currentPageNumber,
      pageDesc,
      operationList: operations,
      answerList,
      beginTime: pageStartTime,
      endTime: formatTimestamp(new Date()),
    };

    console.log('[DroneImaging] Auto-submit data:', {
      pageNumber: markData.pageNumber,
      pageId: currentPageId,
      answerCount: answerList.length,
      answerList,
    });

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

    // ✅ 不再调用 onComplete，避免与 onTimeout 重复触发
    // flowContext.onTimeout() 会负责后续的流程控制
  }, [
    answers,
    clearOperations,
    currentPageId,
    experimentState.captureHistory,
    flowContext,
    logOperation,
    operations,
    pageStartTime,
    questionIds,
    questionTextMap,
    requiredQuestionIds,
    stepIndex,
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
function DroneImagingFrame(props: DroneImagingChildProps) {
  const { flowContext } = props;
  const {
    currentPageId,
    operations,
    answers,
    pageStartTime,
    experimentState,
    navigateToPage,
    logOperation,
    questionIds,
    getAnswer,
  } = useDroneImagingContext();
  const pageConfig = getPageConfig(currentPageId as PageId);
  const stepIndex = props.stepIndex ?? flowContext?.stepIndex ?? 0;

  const navigationMode = pageConfig?.navigationMode ?? 'experiment';
  const currentStep = pageConfig?.stepIndex ?? 0;
  const totalSteps = PAGE_CONFIGS.filter((cfg) => cfg.stepIndex > 0).length;
  const subPageNum = getSubPageNumByPageId(currentPageId as PageId);
  const questionTextMap = useMemo(() => getQuestionTextMap(questionIds), [questionIds]);

  const canProceed = useMemo(() => {
    if (!currentPageId) {
      return true;
    }
    if (currentPageId === 'cover') {
      const confirmValue = getAnswer(questionIds.confirmRead) || '';
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
      const reason = (getAnswer(questionIds.controlVariableReason) || '').trim();
      return reason.length > 5;
    }
    if (currentPageId === 'focal_analysis') {
      const selected = (getAnswer(questionIds.minGsdFocal) || '').trim();
      return selected.length > 0;
    }
    if (currentPageId === 'height_analysis') {
      const selected = (getAnswer(questionIds.gsdTrend) || '').trim();
      return selected.length > 0;
    }
    if (currentPageId === 'conclusion') {
      const selected = (getAnswer(questionIds.priorityFactor) || '').trim();
      const reason = (getAnswer(questionIds.priorityReason) || '').trim();
      return selected.length > 0 && reason.length > 5;
    }
    return true;
  }, [currentPageId, experimentState.captureHistory, getAnswer, operations, questionIds]);

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
      const pageDescBase = `无人机航拍交互课堂-${pageConfig?.pageId ?? currentPageId}`;
      const pageDescPrefix = flowContext
        ? `[${flowContext.flowId}/${flowContext.submoduleId}/${stepIndex}] `
        : '';
      const pageDesc = `${pageDescPrefix}${pageDescBase}`;

      const currentPageNumber = encodeCompositePageNum(stepIndex, subPageNum);
      const currentPagePrefix = `P${currentPageNumber}_`;

      // 仅提交当前页面的答案（根据题目ID前缀过滤）
      const answerEntries = Object.entries(answers).filter(
        ([key, answerRecord]) => {
          const answerValue = answerRecord?.value ?? '';
          if (answerValue.trim() === '') {
            return false;
          }
          // 只提交当前页面的答案
          return key.startsWith(currentPagePrefix);
        },
      );
      const answerList = answerEntries.map(([key, answerRecord], index) => ({
        code: index + 1,
        targetElement: questionTextMap[key] ?? key,
        value: answerRecord?.value ?? '',
      }));

      // 实验历史仅在实验页面提交
      if (currentPageId === 'experiment_free' && experimentState.captureHistory.length > 0) {
        answerList.push({
          code: answerList.length + 1,
          targetElement: 'experiment_captures',
          value: JSON.stringify(experimentState.captureHistory),
        });
      }

      const markData = {
        pageNumber: currentPageNumber,
        pageDesc,
        operationList: operations,
        answerList,
        beginTime: pageStartTime,
        endTime: formatTimestamp(new Date()),
      };

      // DEBUG: 输出提交数据用于调试
      console.log('[DroneImaging] Submitting mark data:', {
        pageNumber: markData.pageNumber,
        stepIndex,
        subPageNum,
        pageId: currentPageId,
        answerCount: answerList.length,
        operationListFirst3: markData.operationList.slice(0, 3),
        answerList: answerList,
      });

      return markData;
    };

    const getFlowContext =
      flowContext && flowContext.flowId
        ? () => ({
            flowId: flowContext.flowId,
            submoduleId: flowContext.submoduleId,
            stepIndex,
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
    questionTextMap,
    props.userContext,
    stepIndex,
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

  const basePageDesc = `无人机航拍交互课堂-${pageConfig?.pageId ?? currentPageId}`;
  const pageMeta = {
    pageId: pageConfig?.pageId ?? currentPageId,
    pageNumber: encodeCompositePageNum(stepIndex, subPageNum),
    subPageNum,
    stepIndex,
    pageDesc: flowContext
      ? `[${flowContext.flowId}/${flowContext.submoduleId}/${stepIndex}] ${basePageDesc}`
      : basePageDesc,
  };

  const showUnifiedTimer = currentPageId !== 'cover';

  return (
    <AssessmentPageFrame
      pageId={currentPageId}
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
        stepIndex={props.stepIndex}
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
  stepIndex,
}: DroneImagingProps) {
  // Validate initialPageId
  const validPageId = (initialPageId as PageId) || 'cover';
  const resolvedStepIndex = stepIndex ?? flowContext?.stepIndex ?? 0;

  return (
    <DroneImagingProvider
      initialPageId={validPageId}
      stepIndex={resolvedStepIndex}
      flowContext={flowContext}
    >
      <DroneImagingFrame
        userContext={userContext}
        flowContext={flowContext}
        options={options}
        stepIndex={resolvedStepIndex}
      />
    </DroneImagingProvider>
  );
}
