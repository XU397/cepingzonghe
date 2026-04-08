import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { PvSandProvider, usePvSandContext } from './context/PvSandContext';
import type { SubmoduleProps } from './types';
import { AssessmentPageFrame } from '@shared/ui/PageFrame';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import { EventTypes } from '@shared/services/submission/eventTypes';
import {
  collectAnswers as collectAnswersFromConfig,
  appendExperimentHistory,
  buildPageDesc as buildSharedPageDesc,
} from '@shared/services/submission/submoduleAdapter';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
import {
  getSubPageNumByPageId,
  getPageConfig,
  PAGE_CONFIGS,
  PageId,
  PAGE_DESC_MAP,
  INTERNAL_TO_STANDARD_KEY,
  HISTORY_CODE_BASE,
  SUBMODULE_MAPPING_CONFIG,
} from './mapping';

const Page01InstructionsCover = lazy(() => import('./pages/Page01bTaskCover'));
const Page03Background = lazy(() => import('./pages/Page03Background'));
const Page04ExperimentDesign = lazy(() => import('./pages/Page04ExperimentDesign'));
const Page05Tutorial = lazy(() => import('./pages/Page05Tutorial'));
const Page06Experiment1 = lazy(() => import('./pages/Page06Experiment1'));
const Page07Experiment2 = lazy(() => import('./pages/Page07Experiment2'));
const Page08Conclusion = lazy(() => import('./pages/Page08Conclusion'));

const PageRouter: React.FC = () => {
  const { currentPageId } = usePvSandContext();

  switch (currentPageId) {
    case 'instructions_cover':
      return <Page01InstructionsCover />;
    case 'background_notice':
      return <Page03Background />;
    case 'experiment_design':
      return <Page04ExperimentDesign />;
    case 'tutorial_simulation':
      return <Page05Tutorial />;
    case 'experiment_task1':
      return <Page06Experiment1 />;
    case 'experiment_task2':
      return <Page07Experiment2 />;
    case 'conclusion_analysis':
      return <Page08Conclusion />;
    default:
      console.warn('[PvSand] Unknown pageId: ' + currentPageId + ', falling back to instructions_cover');
      return <Page01InstructionsCover />;
  }
};

const formatPageNumber = (stepIndex: number | undefined, subPageNum: number) => {
  const safeStep = typeof stepIndex === 'number' ? stepIndex + 1 : 1;
  return encodeCompositePageNum(safeStep, subPageNum);
};

const validatePage = (
  pageId: PageId,
  answers: Record<string, any>,
  experimentState: any,
) => {
  switch (pageId) {
    case 'instructions_cover': {
      const timerCompleted = answers['timer_completed'] === 'true';
      const instructionsChecked = answers['instructions_read'] === 'true';

      if (!timerCompleted) {
        return { ok: false, message: '请仔细阅读注意事项，倒计时结束后才能继续' };
      }

      if (!instructionsChecked) {
        return { ok: false, message: '请勾选我已阅读并理解上述注意事项' };
      }

      return { ok: true };
    }
    case 'background_notice':
      return answers['background_read'] === 'true'
        ? { ok: true }
        : { ok: false, message: '请先阅读完背景介绍' };
    case 'experiment_design': {
      const text = (answers['designReason'] || '').toString().trim();
      return text.length >= 10
        ? { ok: true }
        : { ok: false, message: '实验设计原因至少需要 10 个字符' };
    }
    case 'tutorial_simulation':
      return answers['tutorialCompleted'] === 'true'
        ? { ok: true }
        : { ok: false, message: '请先完成模拟教程' };
    case 'experiment_task1': {
      const hasChoice = !!answers['experiment1Choice'];
      return hasChoice
        ? { ok: true }
        : { ok: false, message: '请选择一个选项' };
    }
    case 'experiment_task2': {
      const analysis = answers['experiment2Analysis'];
      let hasSelection = false;

      if (analysis) {
        if (typeof analysis === 'string') {
          try {
            const parsed = JSON.parse(analysis);
            hasSelection = Array.isArray(parsed) && parsed.length > 0;
          } catch {
            hasSelection = analysis.trim().length > 0;
          }
        } else if (Array.isArray(analysis)) {
          hasSelection = analysis.length > 0;
        }
      }

      return hasSelection
        ? { ok: true }
        : { ok: false, message: '请至少选择一个选项' };
    }
    case 'conclusion_analysis': {
      const option = (answers['selectedOption'] || '').toString().trim();
      const reason = (answers['reason'] || '').toString().trim();
      const valid = option.length > 0 && reason.length >= 10;
      return valid
        ? { ok: true }
        : { ok: false, message: '请选择结论并填写至少 10 个字符的理由' };
    }
    default:
      return { ok: true };
  }
};

function PvSandFrame(props: Omit<SubmoduleProps, 'initialPageId'>) {
  const { flowContext, userContext } = props;
  const {
    currentPageId,
    operations,
    navigateToPage,
    logOperation,
    clearOperations,
    answerDraft,
    experimentState,
    pageStartTime,
    setFlowContext,
  } = usePvSandContext();

  // 同步 flowContext 到 context，供页面组件使用
  useEffect(() => {
    if (flowContext) {
      setFlowContext({
        flowId: flowContext.flowId,
        submoduleId: flowContext.submoduleId,
        stepIndex: flowContext.stepIndex,
      });
    }
  }, [flowContext, setFlowContext]);
  const [validationError, setValidationError] = useState<string>('');

  const pageConfig = getPageConfig(currentPageId as PageId);
  const navigationMode = pageConfig?.navigationMode ?? 'experiment';
  const currentStep = pageConfig?.stepIndex ?? 0;
  const totalSteps = PAGE_CONFIGS.filter((cfg) => cfg.stepIndex > 0).length;
  const subPageNum = getSubPageNumByPageId(currentPageId as PageId);
  const submissionStepIndex =
    typeof flowContext?.stepIndex === 'number' ? flowContext.stepIndex : pageConfig?.stepIndex ?? 0;
  const pageNumber = formatPageNumber(submissionStepIndex, subPageNum);
  const pageDesc = pageConfig?.pageDesc ?? currentPageId;
  const showTimer = navigationMode !== 'hidden';

  const pageAnswers = answerDraft.pageAnswers[currentPageId] || {};
  const answers = useMemo(
    () =>
      Object.entries(pageAnswers).reduce((acc, [key, meta]) => {
        acc[key] = (meta as any)?.value;
        return acc;
      }, {} as Record<string, any>),
    [pageAnswers],
  );

  useEffect(() => {
    if (flowContext?.updateModuleProgress) {
      flowContext.updateModuleProgress(String(subPageNum));
    }
  }, [flowContext, subPageNum]);

  const operationsForSubmission = useMemo(
    () => operations.filter((op) => !op.pageId || op.pageId === currentPageId),
    [currentPageId, operations],
  );

  // 构建规范化的页面描述
  const buildPageDesc = useCallback((pageId: PageId) => {
    const title = PAGE_DESC_MAP[pageId] || '未知页面';
    const fc = flowContext ? {
      flowId: flowContext.flowId,
      submoduleId: flowContext.submoduleId,
      stepIndex: flowContext.stepIndex,
      totalSteps: 0 // 不需要 totalSteps 用于描述
    } : null;
    return buildSharedPageDesc(title, fc);
  }, [flowContext]);

  const buildAnswerList = useCallback(() => {
    const normalizedAnswers = Object.entries(answers).reduce((acc, [key, value]) => {
      const standardKey = INTERNAL_TO_STANDARD_KEY[key] || key;
      acc[standardKey] = value;
      return acc;
    }, {} as Record<string, any>);

    const collected = collectAnswersFromConfig(
      currentPageId,
      normalizedAnswers,
      SUBMODULE_MAPPING_CONFIG
    ).filter((entry) => entry.value !== '');

    if ((currentPageId === 'experiment_task1' || currentPageId === 'experiment_task2')
        && experimentState?.collectedData) {
      return appendExperimentHistory(collected, experimentState.collectedData, {
        targetElement: `P${pageNumber}_实验历史`,
        historyCodeBase: HISTORY_CODE_BASE,
      });
    }

    return collected;
  }, [currentPageId, answers, experimentState, pageNumber]);

  const submissionConfig = useMemo(() => {
    const getUserContext = () => {
      const flatBatchCode = (userContext as any)?.batchCode || '';
      const nestedBatchCode = (userContext as any)?.user?.batchCode || '';
      const flatExamNo = (userContext as any)?.examNo || '';
      const nestedExamNo = (userContext as any)?.user?.examNo || '';

      return {
        batchCode: flatBatchCode || nestedBatchCode || '',
        examNo: flatExamNo || nestedExamNo || '',
      };
    };

    const getFlowContext =
      flowContext && flowContext.flowId
        ? () => ({
            flowId: flowContext.flowId,
            submoduleId: flowContext.submoduleId,
            stepIndex: flowContext.stepIndex,
            moduleName: '光伏治沙实验',
            pageId: currentPageId,
          })
        : undefined;

    // 使用 buildMark 模式构建符合规范的提交数据
    const buildMark = () => {
      const currentPageDesc = buildPageDesc(currentPageId as PageId);
      const answerList = buildAnswerList();

      // 直接使用 operationsForSubmission，不再手动注入 flow_context
      // flow_context 已在 Context 的 logOperation 中注入
      return {
        pageNumber,
        pageDesc: currentPageDesc,
        operationList: operationsForSubmission,
        answerList,
        beginTime: pageStartTime ? formatTimestamp(pageStartTime) : formatTimestamp(new Date()),
        endTime: formatTimestamp(new Date()),
        imgList: [],
      };
    };

    return {
      getUserContext,
      getFlowContext,
      buildMark,
      allowProceedOnFailureInDev: Boolean(import.meta.env?.DEV),
      logOperation,
    };
  }, [
    buildPageDesc,
    buildAnswerList,
    currentPageId,
    flowContext,
    logOperation,
    operationsForSubmission,
    pageNumber,
    pageStartTime,
    userContext,
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
      const currentAnswers = buildAnswerList();
      console.log('[PvSand] handleFrameNext called', {
        currentPageId,
        operationsCount: operationsForSubmission.length,
        answersCount: currentAnswers.length,
        pageMeta: {
          pageNumber,
          pageDesc: buildPageDesc(currentPageId as PageId),
          stepIndex: submissionStepIndex,
          subPageNum,
        },
      });

      const validation = validatePage(currentPageId as PageId, answers, experimentState);
      if (!validation.ok) {
        const message = validation.message || '请完成当前页面必填项';
        setValidationError(message);

        // Dispatch custom event for page-specific error handling
        window.dispatchEvent(new CustomEvent('pv-sand-validation-error', {
          detail: { message, pageId: currentPageId }
        }));

        logOperation({
          targetElement: `P${pageNumber}_下一页按钮`,
          eventType: EventTypes.CLICK_BLOCKED,
          value: JSON.stringify({
            reason: 'validation_failed',
            message,
          }),
          time: formatTimestamp(new Date()),
          pageId: currentPageId,
        });
        return false;
      }

      setValidationError('');

      console.log('[PvSand] Calling defaultSubmit with data:', {
        operations: operationsForSubmission,
        answers: currentAnswers,
      });

      if (typeof defaultSubmit === 'function') {
        const ok = await defaultSubmit();
        console.log('[PvSand] defaultSubmit result:', ok);
        if (!ok) {
          return false;
        }
      }

      clearOperations();
      goToNextPage();
      return true;
    },
    [answers, buildAnswerList, buildPageDesc, clearOperations, currentPageId, experimentState, goToNextPage, logOperation, operationsForSubmission, pageNumber, subPageNum, submissionStepIndex],
  );

  const handleTimerTimeout = useCallback(() => {
    if (flowContext?.onTimeout) {
      flowContext.onTimeout();
    }
  }, [flowContext]);

  // Keep pageId unprefixed so AssessmentPageFrame/DataLogger can map it correctly
  const fallbackPageId: PageId = PAGE_CONFIGS[0]?.pageId ?? 'instructions_cover';
  const rawPageId = pageConfig?.pageId ?? currentPageId ?? fallbackPageId;
  const normalizedPageId =
    typeof rawPageId === 'string' && rawPageId.startsWith('P_')
      ? rawPageId.slice(2)
      : rawPageId;
  const safePageId =
    typeof normalizedPageId === 'string' && normalizedPageId.trim()
      ? normalizedPageId.trim()
      : fallbackPageId;

  const guardedPageId =
    typeof safePageId === 'string' && safePageId.trim() ? safePageId : fallbackPageId;

  const pageIdDiagnostics = {
    currentPageId,
    rawPageId,
    normalizedPageId,
    safePageId,
    guardedPageId,
    fallbackPageId,
    pageConfigPageId: pageConfig?.pageId,
    hasPageConfig: Boolean(pageConfig),
  };

  if (!guardedPageId || typeof guardedPageId !== 'string') {
    console.error('[PvSand] guardedPageId resolved to an invalid value', pageIdDiagnostics);
  } else if (guardedPageId === fallbackPageId && normalizedPageId !== fallbackPageId) {
    console.warn('[PvSand] pageId fallback applied', pageIdDiagnostics);
  }

  const pageMeta = {
    pageId: guardedPageId || fallbackPageId,
    pageNumber,
    pageDesc,
    stepIndex: submissionStepIndex,
    subPageNum,
  };

  if (!pageMeta.pageId) {
    console.error('[PvSand] pageMeta.pageId is missing before render', {
      pageMeta,
      ...pageIdDiagnostics,
    });
  }

  // Validation errors are now handled by page-specific UI (e.g., Page01bTaskCover)
  // No need to show footer validation error
  const footerSlot = null;

  return (
    <AssessmentPageFrame
      pageId={guardedPageId}
      navigationMode={navigationMode}
      currentStep={currentStep}
      totalSteps={totalSteps}
      navTitle="进度"
      showNavigation={navigationMode !== 'hidden'}
      showTimer={showTimer}
      timerVariant="task"
      timerLabel="剩余时间"
      timerScope="module.g8-pv-sand-experiment.task"
      nextLabel="下一步"
      submission={submissionConfig}
      onNext={handleFrameNext}
      timerOnTimeout={handleTimerTimeout}
      pageMeta={pageMeta}
      nextButtonProps={{ 'data-testid': 'frame-next-button' }}
      footerSlot={footerSlot}
    >
      <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
        <PageRouter />
      </div>
    </AssessmentPageFrame>
  );
}

const G8PvSandExperiment: React.FC<SubmoduleProps> = ({
  userContext,
  initialPageId,
  options,
  flowContext,
}) => {
  const validPageId = (initialPageId as PageId) || 'instructions_cover';
  const initialFlowContext = flowContext
    ? {
        flowId: flowContext.flowId,
        submoduleId: flowContext.submoduleId,
        stepIndex: flowContext.stepIndex,
      }
    : null;

  return (
    <PvSandProvider
      initialPageId={validPageId}
      options={options}
      initialFlowContext={initialFlowContext}
    >
      <Suspense
        fallback={
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100vh',
              fontSize: '18px',
              color: 'var(--cartoon-dark)',
            }}
          >
            正在加载光伏治沙实验...
          </div>
        }
      >
        <PvSandFrame userContext={userContext} flowContext={flowContext} options={options} />
      </Suspense>
    </PvSandProvider>
  );
};

export default G8PvSandExperiment;
