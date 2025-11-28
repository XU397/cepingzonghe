import React, {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useRef,
} from 'react';
import { PvSandProvider, usePvSandContext } from './context/PvSandContext';
import type { SubmoduleProps } from './types';
import { AssessmentPageFrame } from '@shared/ui/PageFrame';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import { EventTypes } from '@shared/services/submission/eventTypes';
import {
  getSubPageNumByPageId,
  getPageConfig,
  PAGE_CONFIGS,
  PageId,
} from './mapping';
import useHeartbeat from '@/hooks/useHeartbeat';

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
  const safeStep = typeof stepIndex === 'number' ? stepIndex : 0;
  return `${safeStep}.${subPageNum}`;
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
  } = usePvSandContext();
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

  // === Progress heartbeat兜底：Flow未启用时仍保持进度同步 ===
  const stepIndexRef = useRef(submissionStepIndex);
  const modulePageNumRef = useRef(String(subPageNum));

  useEffect(() => {
    stepIndexRef.current = submissionStepIndex;
    modulePageNumRef.current = String(subPageNum);
  }, [submissionStepIndex, subPageNum]);

  const heartbeatExamNo =
    (userContext as any)?.examNo || (userContext as any)?.user?.examNo || '';
  const heartbeatBatchCode =
    (userContext as any)?.batchCode || (userContext as any)?.user?.batchCode || '';
  const heartbeatEnabled =
    Boolean(flowContext?.flowId) && Boolean(heartbeatExamNo) && Boolean(heartbeatBatchCode);

  useHeartbeat({
    flowId: flowContext?.flowId || '',
    stepIndexRef,
    modulePageNumRef,
    examNo: heartbeatExamNo,
    batchCode: heartbeatBatchCode,
    enabled: heartbeatEnabled,
    intervalMs: 15000,
    onError: (err) => {
      console.warn('[PvSand] Heartbeat failed', err);
    },
  });

  const operationsForSubmission = useMemo(
    () => operations.filter((op) => !op.pageId || op.pageId === currentPageId),
    [currentPageId, operations],
  );

  const answersForSubmission = useMemo(() => {
    const entries = Object.entries(pageAnswers).map(([key, meta]) => ({
      targetElement: key,
      value: (meta as any)?.value,
      pageId: currentPageId,
    }));

    const filtered = entries.filter(({ value }) => {
      if (value === undefined || value === null) {
        return false;
      }
      if (typeof value === 'string') {
        return value.trim() !== '';
      }
      return String(value).trim() !== '';
    });

    if (experimentState?.collectedData) {
      filtered.push({
        targetElement: 'experiment_data',
        value: JSON.stringify(experimentState.collectedData),
        pageId: currentPageId,
      });
    }

    return filtered;
  }, [currentPageId, experimentState?.collectedData, pageAnswers]);

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
            pageId: currentPageId,
          })
        : undefined;

    return {
      getUserContext,
      getFlowContext,
      operations: () => operationsForSubmission,
      answers: () => answersForSubmission,
      allowProceedOnFailureInDev: Boolean(import.meta.env?.DEV),
    };
  }, [
    answersForSubmission,
    currentPageId,
    flowContext,
    operationsForSubmission,
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
      console.log('[PvSand] handleFrameNext called', {
        currentPageId,
        operationsCount: operationsForSubmission.length,
        answersCount: answersForSubmission.length,
        pageMeta: {
          pageNumber,
          pageDesc,
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
          targetElement: 'next_button',
          eventType: EventTypes.CLICK_BLOCKED,
          value: message,
          time: formatTimestamp(new Date()),
          pageId: currentPageId,
        });
        return false;
      }

      setValidationError('');

      console.log('[PvSand] Calling defaultSubmit with data:', {
        operations: operationsForSubmission,
        answers: answersForSubmission,
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
    [answers, answersForSubmission, clearOperations, currentPageId, experimentState, goToNextPage, logOperation, operationsForSubmission, pageDesc, pageNumber, subPageNum, submissionStepIndex],
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

  console.log(
    '[PvSand] pageMeta.pageId',
    pageMeta.pageId,
    typeof pageMeta.pageId,
    {
      pageMeta,
      ...pageIdDiagnostics,
    },
  );

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

  return (
    <PvSandProvider initialPageId={validPageId}>
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
