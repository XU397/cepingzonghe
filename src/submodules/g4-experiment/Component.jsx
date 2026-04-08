/**
 * 4年级火车购票实验子模块主组件
 *
 * 使用 AssessmentPageFrame 统一框架接入
 */

import { useCallback, useEffect, useMemo } from 'react';
import { AssessmentPageFrame } from '@/shared/ui/PageFrame';
import { formatTimestamp } from '@shared/services/submission/createMarkObject.js';
import {
  buildPageDesc,
  collectAnswers as collectAnswersFromConfig,
} from '@shared/services/submission/submoduleAdapter';
import { G4Provider, useG4Context } from './context/G4Context';
import { PageRouter } from './PageRouter';
import {
  SUBMODULE_MAPPING_CONFIG,
  getNavigationMode,
  getNextPageId,
  getPageConfigById,
  getStepIndex,
  getSubPageNumByPageId,
  getTotalSteps,
} from './mapping';

const DISPLAY_NAME = '4年级火车购票-交互';

function G4ExperimentFrame({ userContext, flowContext }) {
  const { state, navigateToPage, clearOperations, pageNumber, subPageNum, validateCurrentPage } =
    useG4Context();

  const currentPageId = state.currentPageId;
  const stepIndex = getStepIndex(currentPageId);
  const totalSteps = getTotalSteps();
  const navigationMode = getNavigationMode(currentPageId);

  const collectedAnswerSource = useMemo(
    () =>
      (Array.isArray(state.answers) ? state.answers : []).reduce((acc, answer) => {
        const targetElement =
          typeof answer?.targetElement === 'string' ? answer.targetElement.trim() : '';
        if (!targetElement) {
          return acc;
        }
        acc[targetElement] = answer?.value;
        return acc;
      }, {}),
    [state.answers]
  );

  const derivedAnswerSource = useMemo(
    () => ({
      问题输入框: String(state.problemAnswer || '').trim(),
      选中因素: Array.isArray(state.selectedFactors) ? state.selectedFactors : [],
      route1_total: state.routeInputs?.route1,
      route5_total: state.routeInputs?.route5,
      推荐出发站: state.selectedStation,
      推荐理由_站点: String(state.stationReason || '').trim(),
      方案一: state.solutions?.solution1 || null,
      方案二: state.solutions?.solution2 || null,
      方案最优:
        typeof state.isOptimal === 'boolean' ? (state.isOptimal ? '是' : '否') : state.isOptimal,
      改进方案: state.improvedSolution,
      选中车次: Array.isArray(state.selectedTrains) ? state.selectedTrains : [],
      推荐车次: state.recommendedTrain,
      推荐理由: String(state.recommendReason || '').trim(),
      计算过程: String(state.calculationProcess || '').trim(),
      总票价: String(state.totalPrice || '').trim(),
    }),
    [
      state.calculationProcess,
      state.improvedSolution,
      state.isOptimal,
      state.problemAnswer,
      state.recommendReason,
      state.recommendedTrain,
      state.routeInputs?.route1,
      state.routeInputs?.route5,
      state.selectedFactors,
      state.selectedStation,
      state.selectedTrains,
      state.solutions?.solution1,
      state.solutions?.solution2,
      state.stationReason,
      state.totalPrice,
    ]
  );

  const answerSource = useMemo(
    () => ({
      ...collectedAnswerSource,
      ...derivedAnswerSource,
    }),
    [collectedAnswerSource, derivedAnswerSource]
  );

  const answerList = useMemo(
    () =>
      collectAnswersFromConfig(currentPageId, answerSource, SUBMODULE_MAPPING_CONFIG).filter(
        answer => typeof answer.value === 'string' && answer.value.trim().length > 0
      ),
    [answerSource, currentPageId]
  );

  // 同步当前页面的进度到 Flow 框架（组件加载时和页面变化时）
  useEffect(() => {
    if (flowContext?.updateModuleProgress && subPageNum) {
      flowContext.updateModuleProgress(String(subPageNum));
    }
  }, [flowContext, subPageNum]);

  const canProceed = useMemo(() => validateCurrentPage(), [validateCurrentPage]);

  const pageTitle = useMemo(() => {
    const config = getPageConfigById(currentPageId);
    return config?.description || currentPageId || '未知页面';
  }, [currentPageId]);

  const pageDesc = useMemo(
    () =>
      buildPageDesc(
        pageTitle,
        flowContext?.flowId
          ? {
              flowId: flowContext.flowId,
              submoduleId: flowContext.submoduleId,
              stepIndex: flowContext.stepIndex,
            }
          : null
      ),
    [flowContext?.flowId, flowContext?.stepIndex, flowContext?.submoduleId, pageTitle]
  );

  const pageMeta = useMemo(
    () => ({
      pageId: currentPageId,
      pageNumber,
      pageDesc,
    }),
    [currentPageId, pageDesc, pageNumber]
  );

  const submissionConfig = useMemo(() => {
    const getUserContext = () => {
      const flatBatchCode = userContext?.batchCode || '';
      const flatExamNo = userContext?.examNo || '';
      const nestedBatchCode = userContext?.user?.batchCode || '';
      const nestedExamNo = userContext?.user?.examNo || '';
      return {
        batchCode: flatBatchCode || nestedBatchCode || '',
        examNo: flatExamNo || nestedExamNo || '',
      };
    };

    const buildMark = () => ({
      pageNumber,
      pageDesc,
      operationList: state.operations,
      answerList,
      beginTime: formatTimestamp(new Date(state.pageBeginTime)),
      endTime: formatTimestamp(new Date()),
      imgList: [],
    });

    const getFlowContext = flowContext?.flowId
      ? () => ({
          flowId: flowContext.flowId,
          submoduleId: flowContext.submoduleId,
          stepIndex: flowContext.stepIndex,
          moduleName: DISPLAY_NAME,
          pageId: currentPageId,
        })
      : undefined;

    return {
      getUserContext,
      buildMark,
      getFlowContext,
      allowProceedOnFailureInDev: true,
    };
  }, [
    answerList,
    currentPageId,
    flowContext,
    pageDesc,
    pageNumber,
    state.operations,
    state.pageBeginTime,
    userContext,
  ]);

  const goToNextPage = useCallback(() => {
    const nextPageId = getNextPageId(currentPageId);

    if (!nextPageId) {
      if (typeof flowContext?.onComplete === 'function') {
        flowContext.onComplete();
      }
      return;
    }

    if (flowContext?.updateModuleProgress) {
      const nextSubPageNum = getSubPageNumByPageId(nextPageId);
      flowContext.updateModuleProgress(String(nextSubPageNum));
    }

    navigateToPage(nextPageId);
  }, [currentPageId, flowContext, navigateToPage]);

  const handleFrameNext = useCallback(
    async ({ defaultSubmit }) => {
      if (!canProceed) {
        const pageNextButton = document.querySelector('[data-testid="next-button"]');
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

      clearOperations();
      goToNextPage();
      return true;
    },
    [canProceed, clearOperations, goToNextPage]
  );

  const timerScope = useMemo(() => {
    if (flowContext?.flowId && flowContext?.stepIndex != null) {
      return `flow::${flowContext.flowId}::module::g4-experiment::step::${flowContext.stepIndex}::task`;
    }
    return 'module.g4-experiment.task';
  }, [flowContext?.flowId, flowContext?.stepIndex]);

  const handleTimerTimeout = useCallback(() => {
    if (typeof flowContext?.onTimeout === 'function') {
      flowContext.onTimeout();
    }
  }, [flowContext]);

  const showTimer = navigationMode !== 'hidden';

  return (
    <AssessmentPageFrame
      pageId={currentPageId}
      navigationMode={navigationMode}
      currentStep={stepIndex}
      totalSteps={totalSteps}
      navTitle="进度"
      showNavigation={navigationMode !== 'hidden'}
      showTimer={showTimer}
      timerVariant="task"
      timerLabel="剩余时间"
      timerScope={timerScope}
      nextLabel="下一步"
      submission={submissionConfig}
      onNext={handleFrameNext}
      timerOnTimeout={handleTimerTimeout}
      pageMeta={pageMeta}
      nextButtonProps={{ 'data-testid': 'frame-next-button' }}
    >
      <PageRouter />
    </AssessmentPageFrame>
  );
}

export function G4ExperimentComponent({ userContext, initialPageId, options, flowContext }) {
  const resolvedFlowContext = flowContext || options?.flowContext;

  return (
    <G4Provider
      initialPageId={initialPageId}
      userContext={userContext}
      flowContext={resolvedFlowContext}
    >
      <G4ExperimentFrame userContext={userContext} flowContext={resolvedFlowContext} />
    </G4Provider>
  );
}

export default G4ExperimentComponent;
