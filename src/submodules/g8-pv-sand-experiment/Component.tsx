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
  getSubPageNumByPageId,
  getPageConfig,
  PAGE_CONFIGS,
  PageId,
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
  const safeStep = typeof stepIndex === 'number' ? stepIndex : 0;
  return `${safeStep}.${subPageNum}`;
};

const normalizeEventType = (eventType?: string) => {
  const value = (eventType || '').toLowerCase();
  switch (value) {
    case 'change':
      return EventTypes.INPUT_CHANGE;
    case EventTypes.INPUT_CHANGE:
      return EventTypes.INPUT_CHANGE;
    case EventTypes.INPUT:
      return EventTypes.INPUT;
    case EventTypes.CLICK:
      return EventTypes.CLICK;
    case EventTypes.PAGE_ENTER:
      return EventTypes.PAGE_ENTER;
    case EventTypes.PAGE_EXIT:
      return EventTypes.PAGE_EXIT;
    case EventTypes.AUTO_SUBMIT:
      return EventTypes.AUTO_SUBMIT;
    case EventTypes.CLICK_BLOCKED:
      return EventTypes.CLICK_BLOCKED;
    default:
      return value || EventTypes.CLICK;
  }
};

const validatePage = (
  pageId: PageId,
  answers: Record<string, any>,
  experimentState: any,
) => {
  switch (pageId) {
    case 'instructions_cover':
      return answers['instructions_read'] === 'true'
        ? { ok: true }
        : { ok: false, message: '请阅读完注意事项并勾选确认后再继续' };
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
    pageStartTime,
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
  const pageNumber = formatPageNumber(flowContext?.stepIndex, subPageNum);
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

  const ensurePrefixed = useCallback(
    (id: string) => {
      const base = id || 'field';
      const prefix = `P${pageNumber}_`;
      return base.startsWith(prefix) ? base : `${prefix}${base}`;
    },
    [pageNumber],
  );

  const normalizedOperations = useMemo(() => {
    return operations
      .filter((op) => !op.pageId || op.pageId === currentPageId)
      .map((op, index) => ({
        code: index + 1,
        eventType: normalizeEventType(op.eventType),
        targetElement: ensurePrefixed(op.targetElement),
        value: op.value,
        time: formatTimestamp(op.time || new Date()),
        pageId: currentPageId,
      }));
  }, [currentPageId, ensurePrefixed, operations]);

  const normalizedAnswers = useMemo(() => {
    const entries = Object.entries(answers).filter(
      ([, value]) => value !== undefined && value !== null && String(value).trim() !== '',
    );
    const answerList = entries.map(([key, value], index) => ({
      code: index + 1,
      targetElement: ensurePrefixed(key),
      value: String(value),
      pageId: currentPageId,
    }));

    if (experimentState?.collectedData) {
      answerList.push({
        code: answerList.length + 1,
        targetElement: ensurePrefixed('experiment_data'),
        value: JSON.stringify(experimentState.collectedData),
        pageId: currentPageId,
      });
    }

    return answerList;
  }, [answers, currentPageId, ensurePrefixed, experimentState?.collectedData]);

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

    const buildMark = () => ({
      pageNumber,
      pageDesc,
      operationList: normalizedOperations,
      answerList: normalizedAnswers,
      beginTime: pageStartTime ? formatTimestamp(pageStartTime) : formatTimestamp(new Date()),
      endTime: formatTimestamp(new Date()),
      imgList: [],
    });

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
    currentPageId,
    flowContext,
    normalizedAnswers,
    normalizedOperations,
    pageDesc,
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
    [answers, clearOperations, currentPageId, experimentState, goToNextPage, logOperation],
  );

  const handleTimerTimeout = useCallback(() => {
    if (flowContext?.onTimeout) {
      flowContext.onTimeout();
    }
  }, [flowContext]);

  const pageMeta = {
    pageId: ensurePrefixed(pageConfig?.pageId ?? currentPageId),
    pageNumber,
    pageDesc,
  };

  // Validation errors are now handled by page-specific UI (e.g., Page01bTaskCover)
  // No need to show footer validation error
  const footerSlot = null;

  return (
    <AssessmentPageFrame
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
