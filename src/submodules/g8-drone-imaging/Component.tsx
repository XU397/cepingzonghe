import React, {
  Suspense,
  lazy,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useLayoutEffect,
} from 'react';
import type { SubmoduleProps } from '@shared/types/flow';
import { AssessmentPageFrame } from '@shared/ui/PageFrame';
import { DroneImagingProvider, useDroneImagingContext } from './context/DroneImagingContext';
import type { AnswerRecord, Operation, buildQuestionIdMap } from './context/DroneImagingContext';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { usePageSubmission } from '@shared/services/submission/usePageSubmission';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import {
  buildPageDesc as buildSharedPageDesc,
  appendExperimentHistory,
  collectAnswers,
} from '@shared/services/submission/submoduleAdapter';
import {
  getPageConfig,
  PAGE_CONFIGS,
  PAGE_QUESTIONS,
  PAGE_DESC_MAP,
  HISTORY_CODE_BASE,
  getSubPageNumByPageId,
  SUBMODULE_MAPPING_CONFIG,
} from './mapping';
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

const resolveModuleName = (moduleName?: string) =>
  typeof moduleName === 'string' && moduleName.trim().length > 0 ? moduleName : 'g8-drone-imaging';

const getFlowModuleName = (flowContext: DroneImagingChildProps['flowContext'] | undefined) => {
  if (!flowContext) {
    return 'g8-drone-imaging';
  }
  const moduleName = (flowContext as { moduleName?: unknown }).moduleName;
  return typeof moduleName === 'string' ? resolveModuleName(moduleName) : 'g8-drone-imaging';
};

const normalizeOperationCodes = (operationList: Operation[]) =>
  operationList.map((operation, index) => ({
    ...operation,
    code: index + 1,
  }));

const buildAnswersForPage = (
  pageId: PageId,
  rawAnswers: Record<string, AnswerRecord | string>,
  questionIdMap: ReturnType<typeof buildQuestionIdMap>
) => {
  const questionKeys = PAGE_QUESTIONS[pageId] || [];
  return questionKeys.reduce<Record<string, AnswerRecord | string>>((map, key) => {
    const answerKey = (questionIdMap as Record<string, string>)[key];
    if (answerKey) {
      map[key] = rawAnswers[answerKey];
    }
    return map;
  }, {});
};

const buildAnswerList = (
  pageId: PageId,
  rawAnswers: Record<string, AnswerRecord | string>,
  questionIdMap: ReturnType<typeof buildQuestionIdMap>
) => {
  const answersForPage = buildAnswersForPage(pageId, rawAnswers, questionIdMap);
  const collected = collectAnswers(pageId, answersForPage, SUBMODULE_MAPPING_CONFIG);
  return collected.filter(entry => entry.value.trim() !== '').sort((a, b) => a.code - b.code);
};

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
  const resolvedModuleName = getFlowModuleName(flowContext);
  const {
    currentPageId,
    operations,
    answers,
    pageStartTime,
    experimentState,
    logOperation,
    clearOperations,
    saveToStorage,
    questionIds,
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
          stepIndex,
          pageId: currentPageId,
          moduleName: resolvedModuleName,
        })
      : undefined,
    allowProceedOnFailureInDev: true,
  });

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
    clearOperations,
  } = useDroneImagingContext();
  const lastPageEnterLoggedRef = useRef<string | null>(null);
  const pageConfig = getPageConfig(currentPageId as PageId);
  const stepIndex = props.stepIndex ?? flowContext?.stepIndex ?? 0;
  const resolvedModuleName = useMemo(() => getFlowModuleName(flowContext), [flowContext]);

  const navigationMode = pageConfig?.navigationMode ?? 'experiment';
  const currentStep = pageConfig?.stepIndex ?? 0;
  const totalSteps = PAGE_CONFIGS.filter(cfg => cfg.stepIndex > 0).length;
  const subPageNum = getSubPageNumByPageId(currentPageId as PageId);

  // 确保每次进入页面都记录 page_enter（使用共享 logger 以触发 flow_context 注入且保持时间准确）
  useLayoutEffect(() => {
    if (lastPageEnterLoggedRef.current === currentPageId) {
      return;
    }
    lastPageEnterLoggedRef.current = currentPageId;
    const pageIdValue = pageConfig?.pageId ?? currentPageId;
    logOperation({
      targetElement: 'page',
      eventType: EventTypes.PAGE_ENTER,
      value: pageIdValue,
      time: formatTimestamp(new Date()),
    });
  }, [currentPageId, logOperation, pageConfig]);

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
        op =>
          op.eventType === EventTypes.READING_COMPLETE &&
          (op.value === 'Page02_Background' || op.targetElement === 'page')
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
      const currentPageNumber = encodeCompositePageNum(stepIndex + 1, subPageNum);
      const normalizedOperations = normalizeOperationCodes(operations);

      let answerList = buildAnswerList(currentPageId as PageId, answers, questionIds);

      if (currentPageId === 'experiment_free' && experimentState.captureHistory.length > 0) {
        answerList = appendExperimentHistory(answerList, experimentState.captureHistory, {
          targetElement: `P${currentPageNumber}_experiment_captures`,
          historyCodeBase: HISTORY_CODE_BASE,
        });
      }

      const pageDesc = buildSharedPageDesc(
        PAGE_DESC_MAP[currentPageId as PageId] || '未知页面',
        flowContext
          ? {
              flowId: flowContext.flowId,
              submoduleId: flowContext.submoduleId,
              stepIndex,
              totalSteps: 0,
            }
          : null
      );

      const markData = {
        pageNumber: currentPageNumber,
        pageDesc,
        operationList: normalizedOperations,
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
            moduleName: resolvedModuleName,
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
    pageStartTime,
    questionIds,
    props.userContext,
    stepIndex,
    subPageNum,
    resolvedModuleName,
  ]);

  const goToNextPage = useCallback(() => {
    const currentIndex = PAGE_CONFIGS.findIndex(cfg => cfg.pageId === (currentPageId as PageId));
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
        const pageNextButton = document.querySelector<HTMLButtonElement>(
          '[data-testid="next-button"]'
        );
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
      // Clear per-page operations after successful submission to avoid carrying over to next pages
      clearOperations();
      goToNextPage();
      return true;
    },
    [canProceed, clearOperations, goToNextPage]
  );

  const handleTimerTimeout = useCallback(() => {
    if (flowContext?.onTimeout) {
      flowContext.onTimeout();
    }
  }, [flowContext]);

  const basePageTitle =
    PAGE_DESC_MAP[currentPageId as PageId] || pageConfig?.pageId || currentPageId;
  const currentPageNumber = encodeCompositePageNum(stepIndex + 1, subPageNum);
  const pageDesc = buildSharedPageDesc(
    basePageTitle,
    flowContext
      ? {
          flowId: flowContext.flowId,
          submoduleId: flowContext.submoduleId,
          stepIndex,
          totalSteps: 0,
        }
      : null
  );
  const pageMeta = {
    pageId: pageConfig?.pageId ?? currentPageId,
    pageNumber: currentPageNumber,
    subPageNum,
    stepIndex,
    pageDesc,
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
      options={options}
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
