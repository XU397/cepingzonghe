import React, { Suspense, lazy, useCallback, useEffect, useMemo } from 'react';
import { AssessmentPageFrame } from '@shared/ui/PageFrame';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import EventTypes from '@shared/services/submission/eventTypes.js';
import {
  collectAnswers as collectAnswersFromConfig,
  buildPageDesc as buildSharedPageDesc,
} from '@shared/services/submission/submoduleAdapter';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
import type { OperationLog, SubmoduleProps } from './types';
import { validateTraceMark, useBananaTraceLogger } from './trace/useBananaTraceLogger';
import {
  G8BananaBrowningProvider,
  useG8BananaBrowningContext,
} from './context/G8BananaBrowningContext';
import {
  getTracePageConfigByLegacyPageId,
  getSubPageNumByPageId,
  getPageConfig,
  PAGE_CONFIGS,
  PAGE_DESC_MAP,
  SUBMODULE_MAPPING_CONFIG,
  type PageId,
} from './mapping';

const Page01Notice = lazy(() => import('./pages/Page01Notice'));
const Page02BananaBrowning = lazy(() => import('./pages/Page02BananaBrowning'));
const Page03BananaMystery = lazy(() => import('./pages/Page03BananaMystery'));
const Page04BananaBrowningReading = lazy(() => import('./pages/Page04BananaBrowningReading'));
const Page05BananaBrowning = lazy(() => import('./pages/Page05BananaBrowning'));
const Page06BananaBrowningDesign = lazy(() => import('./pages/Page06BananaBrowningDesign'));
const Page07BananaBrowningEvaluation = lazy(() => import('./pages/Page07BananaBrowningEvaluation'));
const Page08BananaBrowning = lazy(() => import('./pages/Page08BananaBrowning'));
const Page09BananaBrowningSimulationMain = lazy(
  () => import('./pages/Page09BananaBrowningSimulationMain')
);
const Page10SimulationQuestion1 = lazy(() => import('./pages/Page10SimulationQuestion1'));
const Page11SimulationQuestion2 = lazy(() => import('./pages/Page11SimulationQuestion2'));
const Page12SimulationQuestion3 = lazy(() => import('./pages/Page12SimulationQuestion3'));
const Page13SolutionSelection = lazy(() => import('./pages/Page13SolutionSelection'));
const Page14TaskCompletion = lazy(() => import('./pages/Page14TaskCompletion'));

const PageRouter: React.FC = () => {
  const { currentPageId } = useG8BananaBrowningContext();

  switch (currentPageId) {
    case 'intro_notice':
      return <Page01Notice />;
    case 'page_02_banana_browning':
      return <Page02BananaBrowning />;
    case 'banana_mystery':
      return <Page03BananaMystery />;
    case 'banana_browning_reading':
      return <Page04BananaBrowningReading />;
    case 'page_05_banana_browning':
      return <Page05BananaBrowning />;
    case 'banana_browning_design':
      return <Page06BananaBrowningDesign />;
    case 'banana_browning_evaluation':
      return <Page07BananaBrowningEvaluation />;
    case 'page_08_banana_browning':
      return <Page08BananaBrowning />;
    case 'banana_browning_simulation_main':
      return <Page09BananaBrowningSimulationMain />;
    case 'simulation_question_1':
      return <Page10SimulationQuestion1 />;
    case 'simulation_question_2':
      return <Page11SimulationQuestion2 />;
    case 'simulation_question_3':
      return <Page12SimulationQuestion3 />;
    case 'solution_selection':
      return <Page13SolutionSelection />;
    case 'task_completion':
      return <Page14TaskCompletion />;
    default:
      return <Page01Notice />;
  }
};

const formatPageNumber = (stepIndex: number | undefined, subPageNum: number) => {
  const safeStep = typeof stepIndex === 'number' ? stepIndex + 1 : 1;
  return encodeCompositePageNum(safeStep, subPageNum);
};

type PageValidationSuccess = { ok: true };
type PageValidationFailure = {
  ok: false;
  reason: string;
  message: string;
  missing: string[];
};
type PageValidationResult = PageValidationSuccess | PageValidationFailure;

const VALIDATION_REASON = 'required_fields_missing';
const INTRO_COUNTDOWN_REASON = 'countdown_not_finished';

type OperationWithOptionalCode = Omit<OperationLog, 'code'> & { code?: number };

const createSubmitAttemptId = () =>
  `submit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const isL2SuccessSubmitAttempt = (operation: OperationLog) => {
  const value = operation.value;
  return Boolean(
    operation.eventType === 'SUBMIT_ATTEMPT' &&
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      value.validation_status === 'success' &&
      value.target_id === 'next_button'
  );
};

const withSequentialOperationCodes = (
  operations: OperationWithOptionalCode[]
): OperationLog[] =>
  operations.map((operation, index) => ({
    ...operation,
    code: index + 1,
  }));

const buildValidationSuccess = (): PageValidationSuccess => ({ ok: true });

const buildValidationFailure = (
  reason: string,
  message: string,
  missing: string[]
): PageValidationResult => ({
  ok: false,
  reason,
  message,
  missing,
});

const validatePage = (
  pageId: PageId,
  answers: Record<string, unknown>,
  validationContext?: { operations?: OperationLog[] }
): PageValidationResult => {
  const operations = validationContext?.operations ?? [];
  const hasTextAnswer = (value: unknown) => String(value || '').trim().length > 0;
  const hasSelectionAnswer = (value: unknown) =>
    value !== undefined && value !== null && value !== '';
  const hasSimulationRunResult = operations.some(
    operation => operation.eventType === EventTypes.SIMULATION_RUN_RESULT
  );
  const buildMissingResult = (
    missing: string[],
    message: string,
    reason = VALIDATION_REASON
  ): PageValidationResult =>
    missing.length > 0 ? buildValidationFailure(reason, message, missing) : buildValidationSuccess();
  const collectMissingKeys = (
    requiredKeys: string[],
    predicate: (key: string) => boolean
  ): string[] => requiredKeys.filter(key => !predicate(key));

  if (pageId === 'intro_notice') {
    const missing = collectMissingKeys(
      ['timer_completed', 'instructions_read'],
      key => answers[key] === 'true'
    );

    return buildMissingResult(
      missing,
      missing.includes('timer_completed')
        ? '请仔细阅读注意事项，倒计时结束后才能继续'
        : '请勾选我已阅读并理解上述注意事项',
      missing.includes('timer_completed') ? INTRO_COUNTDOWN_REASON : VALIDATION_REASON
    );
  }

  switch (pageId) {
    case 'banana_mystery': {
      return buildMissingResult(
        collectMissingKeys(['Q1_科学问题'], key => hasTextAnswer(answers[key])),
        '请输入你的科学问题'
      );
    }
    case 'banana_browning_reading': {
      return buildMissingResult(
        collectMissingKeys(['Q2_影响因素'], key => hasSelectionAnswer(answers[key])),
        '请完成当前页面必填项'
      );
    }
    case 'banana_browning_design': {
      return buildMissingResult(
        collectMissingKeys(
          ['Q3a_想法1', 'Q3b_想法2', 'Q3c_想法3'],
          key => hasTextAnswer(answers[key])
        ),
        '请完成当前页面必填项'
      );
    }
    case 'banana_browning_evaluation': {
      return buildMissingResult(
        collectMissingKeys(
          [
            'Q4a_图像法优点',
            'Q4b_图像法缺点',
            'Q4c_网格法优点',
            'Q4d_网格法缺点',
            'Q4e_称重法优点',
            'Q4f_称重法缺点',
          ],
          key => hasTextAnswer(answers[key])
        ),
        '请完成当前页面必填项'
      );
    }
    case 'simulation_question_1': {
      return buildMissingResult(
        collectMissingKeys(
          [EventTypes.SIMULATION_RUN_RESULT, 'Q5_海南香蕉变黑时间'],
          key =>
            key === EventTypes.SIMULATION_RUN_RESULT
              ? hasSimulationRunResult
              : hasSelectionAnswer(answers[key])
        ),
        '请完成当前页面必填项'
      );
    }
    case 'simulation_question_2': {
      return buildMissingResult(
        collectMissingKeys(
          [EventTypes.SIMULATION_RUN_RESULT, 'Q6_常温储存品种'],
          key =>
            key === EventTypes.SIMULATION_RUN_RESULT
              ? hasSimulationRunResult
              : hasSelectionAnswer(answers[key])
        ),
        '请完成当前页面必填项'
      );
    }
    case 'simulation_question_3': {
      return buildMissingResult(
        collectMissingKeys(
          [EventTypes.SIMULATION_RUN_RESULT, 'Q7_平缓温度'],
          key =>
            key === EventTypes.SIMULATION_RUN_RESULT
              ? hasSimulationRunResult
              : hasSelectionAnswer(answers[key])
        ),
        '请完成当前页面必填项'
      );
    }
    case 'solution_selection': {
      return buildMissingResult(
        collectMissingKeys(
          ['Q8_方案表格', 'Q8_最优方案', 'Q8_理由'],
          key => (key === 'Q8_理由' ? hasTextAnswer(answers[key]) : hasSelectionAnswer(answers[key]))
        ),
        '请完成当前页面必填项'
      );
    }
    default:
      return buildValidationSuccess();
  }
};

function G8BananaBrowningFrame(props: Omit<SubmoduleProps, 'initialPageId'>) {
  const { flowContext, userContext } = props;
  const {
    currentPageId,
    operations,
    navigateToPage,
    logOperation,
    clearOperations,
    answerDraft,
    pageStartTime,
    setFlowContext,
    setValidationError,
    validationError,
  } = useG8BananaBrowningContext();

  useEffect(() => {
    if (flowContext) {
      setFlowContext({
        flowId: flowContext.flowId,
        submoduleId: flowContext.submoduleId,
        stepIndex: flowContext.stepIndex,
      });
    }
  }, [flowContext, setFlowContext]);

  const pageConfig = getPageConfig(currentPageId as PageId);
  const tracePageConfig = getTracePageConfigByLegacyPageId(currentPageId);
  const isL2TracePage = Boolean(tracePageConfig);
  const navigationMode = pageConfig?.navigationMode ?? 'experiment';
  const currentStep = pageConfig?.stepIndex ?? 0;
  const totalSteps = PAGE_CONFIGS.filter(config => config.stepIndex > 0).length;
  const subPageNum = getSubPageNumByPageId(currentPageId as PageId);
  const submissionStepIndex =
    typeof flowContext?.stepIndex === 'number'
      ? flowContext.stepIndex
      : (pageConfig?.stepIndex ?? 0);
  const pageNumber = formatPageNumber(submissionStepIndex, subPageNum);
  const frameTraceLogger = useBananaTraceLogger({
    pageId: currentPageId as PageId,
    pageNumber,
    flowContext: flowContext
      ? {
          flowId: flowContext.flowId,
          submoduleId: flowContext.submoduleId,
          stepIndex: flowContext.stepIndex,
          moduleName: '8年级香蕉变黑科学探究',
          pageId: currentPageId,
        }
      : null,
  });
  const pageDesc = pageConfig?.pageDesc ?? currentPageId;
  const showTimer = navigationMode !== 'hidden';

  const pageAnswers = answerDraft.pageAnswers[currentPageId] || {};
  const answers = useMemo(
    () =>
      Object.entries(pageAnswers).reduce(
        (acc, [key, meta]) => {
          acc[key] = meta?.value;
          return acc;
        },
        {} as Record<string, unknown>
      ),
    [pageAnswers]
  );

  useEffect(() => {
    if (flowContext?.updateModuleProgress) {
      flowContext.updateModuleProgress(String(subPageNum));
    }
  }, [flowContext, subPageNum]);

  const operationsForSubmission = useMemo(
    () => operations.filter(operation => !operation.pageId || operation.pageId === currentPageId),
    [currentPageId, operations]
  );

  const buildPageDesc = useCallback(
    (pageId: PageId) => {
      const title = PAGE_DESC_MAP[pageId] || '未知页面';
      const currentFlowContext = flowContext
        ? {
            flowId: flowContext.flowId,
            submoduleId: flowContext.submoduleId,
            stepIndex: flowContext.stepIndex,
            totalSteps: 0,
          }
        : null;

      return buildSharedPageDesc(title, currentFlowContext);
    },
    [flowContext]
  );

  const buildAnswerList = useCallback(() => {
    return collectAnswersFromConfig(currentPageId, answers, SUBMODULE_MAPPING_CONFIG).filter(
      entry => entry.value !== ''
    );
  }, [answers, currentPageId]);

  const buildSubmissionMark = useCallback(
    () => ({
      pageNumber,
      pageDesc: buildPageDesc(currentPageId as PageId),
      operationList: operationsForSubmission,
      answerList: buildAnswerList(),
      beginTime: pageStartTime ? formatTimestamp(pageStartTime) : formatTimestamp(new Date()),
      endTime: formatTimestamp(new Date()),
      imgList: [],
    }),
    [
      buildAnswerList,
      buildPageDesc,
      currentPageId,
      operationsForSubmission,
      pageNumber,
      pageStartTime,
    ]
  );

  const submissionConfig = useMemo(() => {
    const getUserContext = () => ({
      batchCode: (userContext as any)?.batchCode || (userContext as any)?.user?.batchCode || '',
      examNo: (userContext as any)?.examNo || (userContext as any)?.user?.examNo || '',
    });

    const getFlowContext = flowContext?.flowId
      ? () => ({
          flowId: flowContext.flowId,
          submoduleId: flowContext.submoduleId,
          stepIndex: flowContext.stepIndex,
          moduleName: '8年级香蕉变黑科学探究',
          pageId: currentPageId,
        })
      : undefined;

    return {
      getUserContext,
      getFlowContext,
      buildMark: buildSubmissionMark,
      lifecycleMode: isL2TracePage ? 'l2-trace' : 'legacy',
      traceValidator: isL2TracePage ? validateTraceMark : undefined,
      allowProceedOnFailureInDev: Boolean(import.meta.env?.DEV),
      logOperation,
    };
  }, [
    buildSubmissionMark,
    currentPageId,
    flowContext,
    isL2TracePage,
    logOperation,
    userContext,
  ]);

  const goToNextPage = useCallback(() => {
    const currentIndex = PAGE_CONFIGS.findIndex(
      config => config.pageId === (currentPageId as PageId)
    );

    if (currentIndex >= 0 && currentIndex < PAGE_CONFIGS.length - 1) {
      navigateToPage(PAGE_CONFIGS[currentIndex + 1].pageId);
      return;
    }

    if (currentIndex === PAGE_CONFIGS.length - 1 && flowContext?.onComplete) {
      flowContext.onComplete();
    }
  }, [currentPageId, flowContext, navigateToPage]);

  const handleFrameNext = useCallback(
    async ({
      defaultSubmit,
      submit,
    }: {
      defaultSubmit?: () => Promise<boolean>;
      submit?: (options?: {
        markOverride?: ReturnType<typeof buildSubmissionMark>;
      }) => Promise<boolean>;
    }) => {
      const validation = validatePage(currentPageId as PageId, answers, {
        operations: operationsForSubmission,
      });

      if (!validation.ok) {
        const message = validation.message || '请完成当前页面必填项';
        const timestamp = formatTimestamp(new Date());
        setValidationError(message);
        if (isL2TracePage) {
          frameTraceLogger?.submitAttempt({
            validationStatus: 'blocked',
            missingFields: validation.missing || [],
            targetId: 'next_button',
          });
        } else {
          logOperation({
            targetElement: `P${pageNumber}_下一页按钮`,
            eventType: EventTypes.CLICK_BLOCKED,
            value: {
              reason: validation.reason,
              missing: validation.missing,
              timestamp,
              message,
            },
            time: timestamp,
            pageId: currentPageId,
          });
        }
        return false;
      }

      setValidationError('');
      if (isL2TracePage && typeof submit === 'function') {
        const submitAttemptOperation = frameTraceLogger?.emit(
          'SUBMIT_ATTEMPT',
          {
            submit_attempt_id: createSubmitAttemptId(),
            validation_status: 'success',
          },
          {
            targetId: 'next_button',
            targetType: 'button',
            metadata: {
              missing_fields: [],
            },
            emit: false,
          }
        );
        const baseMark = buildSubmissionMark();
        const operationList = submitAttemptOperation
          ? withSequentialOperationCodes([
              ...baseMark.operationList.filter(operation => !isL2SuccessSubmitAttempt(operation)),
              submitAttemptOperation,
            ])
          : withSequentialOperationCodes(
              baseMark.operationList.filter(operation => !isL2SuccessSubmitAttempt(operation))
            );
        const ok = await submit({
          markOverride: {
            ...baseMark,
            operationList,
          },
        });
        if (!ok) {
          return false;
        }
      } else if (typeof defaultSubmit === 'function') {
        const ok = await defaultSubmit();
        if (!ok) {
          return false;
        }
      }

      clearOperations();
      goToNextPage();
      return true;
    },
    [
      answers,
      buildSubmissionMark,
      clearOperations,
      currentPageId,
      frameTraceLogger,
      goToNextPage,
      isL2TracePage,
      logOperation,
      operationsForSubmission,
      pageNumber,
      setValidationError,
    ]
  );

  const handleTimerTimeout = useCallback(() => {
    if (flowContext?.onTimeout) {
      flowContext.onTimeout();
    }
  }, [flowContext]);

  const pageMeta = {
    pageId: pageConfig?.pageId ?? currentPageId,
    pageNumber,
    pageDesc,
    stepIndex: submissionStepIndex,
    subPageNum,
  };

  return (
    <AssessmentPageFrame
      pageId={pageMeta.pageId}
      navigationMode={navigationMode}
      currentStep={currentStep}
      totalSteps={totalSteps}
      navTitle="进度"
      showNavigation={navigationMode !== 'hidden'}
      showTimer={showTimer}
      timerVariant="task"
      timerLabel="剩余时间"
      timerScope="module.g8-banana-browning-experiment.task"
      nextLabel="下一步"
      submission={submissionConfig}
      onNext={handleFrameNext}
      timerOnTimeout={handleTimerTimeout}
      pageMeta={pageMeta}
      nextButtonProps={{ 'data-testid': 'frame-next-button' }}
      footerSlot={
        validationError && currentPageId !== 'banana_mystery' ? (
          <div style={{ color: '#d32f2f' }}>{validationError}</div>
        ) : null
      }
    >
      <div style={{ width: '100%', height: '100%', overflowY: 'auto' }}>
        <PageRouter />
      </div>
    </AssessmentPageFrame>
  );
}

const G8BananaBrowningExperiment: React.FC<SubmoduleProps> = ({
  userContext,
  initialPageId,
  options,
  flowContext,
}) => {
  const validPageId = (initialPageId as PageId) || 'intro_notice';
  const initialFlowContext = flowContext
    ? {
        flowId: flowContext.flowId,
        submoduleId: flowContext.submoduleId,
        stepIndex: flowContext.stepIndex,
      }
    : null;

  return (
    <G8BananaBrowningProvider
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
            }}
          >
            正在加载8年级香蕉变黑科学探究...
          </div>
        }
      >
        <G8BananaBrowningFrame
          userContext={userContext}
          flowContext={flowContext}
          options={options}
        />
      </Suspense>
    </G8BananaBrowningProvider>
  );
};

export default G8BananaBrowningExperiment;
