/**
 * 薇甘菊防治实验子模块主组件
 *
 * 使用 AssessmentPageFrame 统一框架接入
 */

import { createContext, useContext, useReducer, useEffect, useMemo, useCallback, useRef } from 'react';
import { AssessmentPageFrame } from '@/shared/ui/PageFrame';
import { formatTimestamp } from '@shared/services/submission/createMarkObject.js';
import EventTypes from '@shared/services/submission/eventTypes.js';
import {
  buildPageDesc as buildSharedPageDesc,
  appendExperimentHistory,
  collectAnswers as collectAnswersFromConfig,
  createOperationSequence,
  injectFlowContext,
  shouldInjectFlowContext,
} from '@shared/services/submission/submoduleAdapter';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
import {
  getNextPageId,
  getSubPageNumByPageId,
  getTotalSteps,
  getNavigationMode,
  getStepIndex,
  PAGE_DESC_MAP,
  QUESTION_CODE_MAP,
  ANSWER_KEY_TO_QUESTION,
  SUBMODULE_MAPPING_CONFIG,
  HISTORY_CODE_BASE,
} from './mapping';

// Page Components
import Page00Notice from './pages/Page00_Notice';
import Page01Intro from './pages/Page01_Intro';
import Page02StepQ1 from './pages/Page02_Step_Q1';
import Page03SimExp from './pages/Page03_Sim_Exp';
import Page04Q2Data from './pages/Page04_Q2_Data';
import Page05Q3Trend from './pages/Page05_Q3_Trend';
import Page06Q4Conc from './pages/Page06_Q4_Conc';

// ========================================
// Constants
// ========================================

const DISPLAY_NAME = '薇甘菊防治实验';

const STORAGE_KEYS = {
  answers: 'module.g8-mikania-experiment.answers',
  experimentState: 'module.g8-mikania-experiment.experimentState',
  noticeConfirmed: 'module.g8-mikania-experiment.noticeConfirmed',
};

const DEFAULT_EXPERIMENT_STATE = {
  concentration: '0mg/ml',
  days: 4,
  hasStarted: false,
  currentResult: null,
  history: [],
};

// 导出给页面组件使用
export { QUESTION_CODE_MAP, PAGE_DESC_MAP, ANSWER_KEY_TO_QUESTION };

// ========================================
// Action Types
// ========================================

export const ACTION_TYPES = {
  SET_PAGE: 'SET_PAGE',
  SET_ANSWER: 'SET_ANSWER',
  SET_EXPERIMENT_STATE: 'SET_EXPERIMENT_STATE',
  TICK_NOTICE_COUNTDOWN: 'TICK_NOTICE_COUNTDOWN',
  CONFIRM_NOTICE: 'CONFIRM_NOTICE',
  LOG_OPERATION: 'LOG_OPERATION',
  CLEAR_OPERATIONS: 'CLEAR_OPERATIONS',
  SET_PAGE_ENTER_TIME: 'SET_PAGE_ENTER_TIME',
  RESTORE_STATE: 'RESTORE_STATE',
};

// ========================================
// Initial State
// ========================================

const createInitialState = (initialPageId) => ({
  currentPageId: initialPageId || 'page_00_notice',
  answers: {
    Q1_控制变量原因: null,
    Q2_抑制作用浓度: null,
    Q3_发芽率趋势: null,
    Q4a_菟丝子有效性: null,
    Q4b_结论理由: null,
  },
  experimentState: {
    ...DEFAULT_EXPERIMENT_STATE,
  },
  noticeConfirmed: false,
  noticeCountdown: 38,
  operations: [],
  flowContextInjected: false,  // flow_context 是否已注入当前页
  pageEnterTime: new Date(),
});

// ========================================
// Validation Functions
// ========================================

export function validatePage(pageId, state) {
  switch (pageId) {
    case 'page_00_notice':
      return state.noticeCountdown <= 0 && state.noticeConfirmed;
    case 'page_01_intro':
      return true;
    case 'page_02_step_q1':
      return state.answers.Q1_控制变量原因?.length >= 5;
    case 'page_03_sim_exp':
      return Array.isArray(state.experimentState?.history) && state.experimentState.history.length > 0;
    case 'page_04_q2_data':
      return ['A', 'B', 'C'].includes(state.answers.Q2_抑制作用浓度);
    case 'page_05_q3_trend':
      return ['A', 'B', 'C'].includes(state.answers.Q3_发芽率趋势);
    case 'page_06_q4_conc':
      return (
        ['是', '否'].includes(state.answers.Q4a_菟丝子有效性) &&
        state.answers.Q4b_结论理由?.length >= 10
      );
    default:
      return true;
  }
}

export function getMissingFields(pageId, state) {
  const missing = [];
  switch (pageId) {
    case 'page_00_notice':
      if (state.noticeCountdown > 0) missing.push('倒计时未结束');
      if (!state.noticeConfirmed) missing.push('注意事项确认');
      break;
    case 'page_02_step_q1':
      if (!state.answers.Q1_控制变量原因 || state.answers.Q1_控制变量原因.length < 5) {
        missing.push('Q1_控制变量原因');
      }
      break;
    case 'page_03_sim_exp':
      if (!Array.isArray(state.experimentState?.history) || state.experimentState.history.length === 0) {
        missing.push('未完成实验操作');
      }
      break;
    case 'page_04_q2_data':
      if (!['A', 'B', 'C'].includes(state.answers.Q2_抑制作用浓度)) {
        missing.push('Q2_抑制作用浓度');
      }
      break;
    case 'page_05_q3_trend':
      if (!['A', 'B', 'C'].includes(state.answers.Q3_发芽率趋势)) {
        missing.push('Q3_发芽率趋势');
      }
      break;
    case 'page_06_q4_conc':
      if (!['是', '否'].includes(state.answers.Q4a_菟丝子有效性)) {
        missing.push('Q4a_菟丝子有效性');
      }
      if (!state.answers.Q4b_结论理由 || state.answers.Q4b_结论理由.length < 10) {
        missing.push('Q4b_结论理由');
      }
      break;
    default:
      break;
  }
  return missing;
}

export function getValidationErrors(pageId, state) {
  const errors = {};

  switch (pageId) {
    case 'page_00_notice':
      if (!state.noticeConfirmed) {
        errors.checkbox = '请勾选确认已阅读注意事项';
      }
      break;

    case 'page_02_step_q1': {
      const answer = state.answers?.Q1_控制变量原因 || '';
      if (answer.length < 5) {
        errors.Q1_控制变量原因 = `请至少填写5个字符，当前${answer.length}个`;
      }
      break;
    }

    case 'page_06_q4_conc': {
      const answerQ4a = state.answers?.Q4a_菟丝子有效性;
      if (!['是', '否'].includes(answerQ4a)) {
        errors.Q4a_菟丝子有效性 = '请选择“是”或“否”';
      }

      const answerQ4b = state.answers?.Q4b_结论理由 || '';
      if (answerQ4b.length < 10) {
        errors.Q4b_结论理由 = `请至少输入10个字符，当前${answerQ4b.length}个（至少10个字符）`;
      }
      break;
    }

    default:
      break;
  }

  return errors;
}

export function clearModuleStorage() {
  try {
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    console.log('[g8-mikania-experiment] Cleared localStorage');
  } catch (e) {
    console.warn('[g8-mikania-experiment] Failed to clear localStorage:', e);
  }
}

// ========================================
// Reducer
// ========================================

function createMikaniaReducer(sequenceRef, flowContext) {
  return function mikaniaReducer(state, action) {
    switch (action.type) {
      case ACTION_TYPES.SET_PAGE:
        return {
          ...state,
          currentPageId: action.payload,
          pageEnterTime: new Date(),
          operations: [],
          flowContextInjected: false,  // 重置 flow_context 注入标记
        };
      case ACTION_TYPES.SET_ANSWER:
        return {
          ...state,
          answers: {
            ...state.answers,
            [action.payload.questionId]: action.payload.value,
          },
        };
      case ACTION_TYPES.SET_EXPERIMENT_STATE:
        return {
          ...state,
          experimentState: {
            ...state.experimentState,
            ...action.payload,
          },
        };
      case ACTION_TYPES.TICK_NOTICE_COUNTDOWN:
        return {
          ...state,
          noticeCountdown: Math.max(0, state.noticeCountdown - 1),
        };
      case ACTION_TYPES.CONFIRM_NOTICE:
        return {
          ...state,
          noticeConfirmed: action.payload,
        };
      case ACTION_TYPES.LOG_OPERATION: {
        const { flowContext: payloadFlowContext, ...operation } = action.payload;
        const operations = [...state.operations, operation];
        const resolvedFlowContext = payloadFlowContext || flowContext;

        const isPageEnter =
          operation.eventType === EventTypes.PAGE_ENTER ||
          operation.eventType === 'page_enter';
        const needFlowContextInjection =
          isPageEnter &&
          shouldInjectFlowContext(operations, resolvedFlowContext) &&
          !state.flowContextInjected;

        const operationsWithFlowContext = needFlowContextInjection
          ? injectFlowContext(
              operations,
              resolvedFlowContext
                ? {
                    ...resolvedFlowContext,
                    moduleName: resolvedFlowContext.moduleName || DISPLAY_NAME,
                  }
                : resolvedFlowContext,
              sequenceRef.current
            )
          : operations;

        const hasFlowContextOperation = operationsWithFlowContext.some(
          (op) => op.eventType === EventTypes.FLOW_CONTEXT || op.eventType === 'flow_context'
        );

        return {
          ...state,
          operations: operationsWithFlowContext,
          flowContextInjected: state.flowContextInjected || needFlowContextInjection || hasFlowContextOperation,
        };
      }
      case ACTION_TYPES.CLEAR_OPERATIONS:
        return {
          ...state,
          operations: [],
        };
      case ACTION_TYPES.SET_PAGE_ENTER_TIME:
        return {
          ...state,
          pageEnterTime: action.payload,
        };
      case ACTION_TYPES.RESTORE_STATE:
        return {
          ...state,
          ...action.payload,
        };
      default:
        return state;
    }
  };
}

// ========================================
// Context
// ========================================

const MikaniaExperimentContext = createContext(null);

export function useMikaniaExperiment() {
  const context = useContext(MikaniaExperimentContext);
  if (!context) {
    throw new Error('useMikaniaExperiment must be used within MikaniaExperimentProvider');
  }
  return context;
}

// ========================================
// Page Components Mapping
// ========================================

const PAGE_COMPONENTS = {
  'page_00_notice': Page00Notice,
  'page_01_intro': Page01Intro,
  'page_02_step_q1': Page02StepQ1,
  'page_03_sim_exp': Page03SimExp,
  'page_04_q2_data': Page04Q2Data,
  'page_05_q3_trend': Page05Q3Trend,
  'page_06_q4_conc': Page06Q4Conc,
};

// ========================================
// Page Router Component
// ========================================

function PageRouter({ currentPageId }) {
  const Component = PAGE_COMPONENTS[currentPageId];

  if (!Component) {
    console.error(`[g8-mikania-experiment] Unknown page: ${currentPageId}`);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        未知页面: {currentPageId}
      </div>
    );
  }

  return <Component />;
}

// ========================================
// Frame Wrapper Component
// ========================================

function MikaniaExperimentFrame({ userContext, flowContext }) {
  const {
    state,
    navigateToPage,
    logOperation,
    pageNumber,
    subPageNum,
  } = useMikaniaExperiment();

  const currentPageId = state.currentPageId;
  // 始终使用子模块内部的 stepIndex 用于导航高亮，不受 Flow 全局 stepIndex 影响
  const stepIndex = getStepIndex(currentPageId);
  const totalSteps = getTotalSteps();
  const navigationMode = getNavigationMode(currentPageId);

  // 同步当前页面的进度到 Flow 框架（组件加载时和页面变化时）
  useEffect(() => {
    if (flowContext?.updateModuleProgress) {
      console.log(`[g8-mikania-experiment] Syncing progress to Flow: page ${currentPageId}, subPageNum ${subPageNum}`);
      flowContext.updateModuleProgress(String(subPageNum));
    }
  }, [currentPageId, subPageNum, flowContext]);

  // Validate page before proceeding
  const canProceed = useMemo(() => {
    return validatePage(currentPageId, state);
  }, [currentPageId, state]);

  // Build page description with optional Flow context prefix
  const buildPageDesc = useCallback((pageId) => {
    const title = PAGE_DESC_MAP[pageId] || '未知页面';
    const fc = flowContext ? {
      flowId: flowContext.flowId,
      submoduleId: flowContext.submoduleId,
      stepIndex: flowContext.stepIndex,
      totalSteps: 0,
    } : null;
    return buildSharedPageDesc(title, fc);
  }, [flowContext]);

  // Collect answers for current page
  const buildAnswerList = useCallback(() => {
    const collected = collectAnswersFromConfig(currentPageId, state.answers, SUBMODULE_MAPPING_CONFIG).filter(
      (entry) => typeof entry.value === 'string' && entry.value !== '',
    );

    if (currentPageId !== 'page_03_sim_exp') {
      return collected;
    }

    const runs = Array.isArray(state.experimentState?.history) ? state.experimentState.history : [];
    if (runs.length === 0) {
      return collected;
    }

    const historyData = {
      runs: runs.map(({ concentration, days, germinationRate, timestamp }) => ({
        concentration,
        days,
        germinationRate,
        timestamp,
      })),
    };

    return appendExperimentHistory(collected, historyData, {
      targetElement: `P${pageNumber}_实验历史`,
      historyCodeBase: HISTORY_CODE_BASE,
    });
  }, [currentPageId, state.answers, state.experimentState, pageNumber]);

  // Submission config for Frame
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

    const buildMark = () => {
      const pageDesc = buildPageDesc(currentPageId);
      const answerList = buildAnswerList();

      // flow_context 按规范应在 Reducer 中注入，这里仅做缺失告警
      const hasFlowContext = state.operations.some(
        (op) => op.eventType === EventTypes.FLOW_CONTEXT || op.eventType === 'flow_context'
      );

      if (flowContext?.flowId && !hasFlowContext) {
        console.warn(
          '[g8-mikania-experiment] flow_context missing in operations, should have been injected by Reducer'
        );
      }

      return {
        pageNumber,
        pageDesc,
        operationList: state.operations,
        answerList,
        beginTime: formatTimestamp(state.pageEnterTime),
        endTime: formatTimestamp(new Date()),
        imgList: [],
      };
    };

    const getFlowContext = flowContext?.flowId
      ? () => ({
          flowId: flowContext.flowId,
          submoduleId: flowContext.submoduleId,
          stepIndex: flowContext.stepIndex,
          moduleName: flowContext.moduleName || DISPLAY_NAME,
          pageId: currentPageId,
        })
      : undefined;

    return {
      getUserContext,
      buildMark,
      getFlowContext,
      allowProceedOnFailureInDev: true,
      logOperation,
    };
  }, [userContext, flowContext, currentPageId, pageNumber, state.operations, state.pageEnterTime, buildPageDesc, buildAnswerList, logOperation]);

  // Navigate to next page
  const goToNextPage = useCallback(() => {
    const nextPageId = getNextPageId(currentPageId);

    if (!nextPageId) {
      // Last page - call onComplete
      if (flowContext?.onComplete) {
        console.log('[g8-mikania-experiment] Last page completed, calling onComplete');
        flowContext.onComplete();
      }
      return;
    }

    // Update progress for non-last pages
    if (flowContext?.updateModuleProgress) {
      const nextSubPageNum = getSubPageNumByPageId(nextPageId);
      flowContext.updateModuleProgress(String(nextSubPageNum));
    }

    // Navigate
    navigateToPage(nextPageId);
  }, [currentPageId, flowContext, navigateToPage]);

  // Handle Frame's onNext callback
  const handleFrameNext = useCallback(
    async ({ defaultSubmit }) => {
      // Check validation
      if (!canProceed) {
        // Delegate to page's internal button for validation and logging
        const pageNextButton = document.querySelector('[data-testid="next-button"]');
        if (pageNextButton) {
          pageNextButton.click();
        }

        return false;
      }

      // Submit data
      if (typeof defaultSubmit === 'function') {
        const ok = await defaultSubmit();
        if (!ok) {
          return false;
        }
      }

      // Navigate
      goToNextPage();
      return true;
    },
    [canProceed, goToNextPage]
  );

  // Handle timeout
  const handleTimerTimeout = useCallback(() => {
    console.log('[g8-mikania-experiment] Timer timeout');
    if (flowContext?.onTimeout) {
      flowContext.onTimeout();
    }
  }, [flowContext]);

  // Page metadata
  const pageMeta = {
    pageId: currentPageId,
    pageNumber,
    pageDesc: buildPageDesc(currentPageId),
  };

  // Show timer on all experiment pages starting from page_01_intro (step 1)
  // - page_00_notice: hidden mode, no timer
  // - page_01_intro onwards: show timer (experiment mode)
  const showTimer = navigationMode !== 'hidden';

  // Build timerScope that matches Flow's scope format when in Flow mode
  // This ensures the timer UI correctly subscribes to the timer started by Flow
  const timerScope = useMemo(() => {
    if (flowContext?.flowId && flowContext?.stepIndex != null) {
      // Flow mode: use Flow's scope format
      return `flow::${flowContext.flowId}::module::g8-mikania-experiment::step::${flowContext.stepIndex}::task`;
    }
    // Standalone mode: use module-specific scope
    return 'module.g8-mikania-experiment.task';
  }, [flowContext?.flowId, flowContext?.stepIndex]);

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
      <PageRouter currentPageId={currentPageId} />
    </AssessmentPageFrame>
  );
}

// ========================================
// Main Component with Provider
// ========================================

function MikaniaExperimentComponent({
  userContext,
  initialPageId,
  options,
  flowContext,
}) {
  const sequenceRef = useRef(createOperationSequence());
  const reducer = useMemo(
    () => createMikaniaReducer(sequenceRef, flowContext),
    [flowContext]
  );
  const [state, dispatch] = useReducer(
    reducer,
    initialPageId,
    createInitialState
  );

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const savedAnswers = localStorage.getItem(STORAGE_KEYS.answers);
      if (savedAnswers) {
        const parsedAnswers = JSON.parse(savedAnswers);
        if (parsedAnswers && typeof parsedAnswers === 'object') {
          dispatch({
            type: ACTION_TYPES.RESTORE_STATE,
            payload: { answers: parsedAnswers },
          });
        }
      }

      const savedExperimentState = localStorage.getItem(STORAGE_KEYS.experimentState);
      if (savedExperimentState) {
        const parsedExperimentState = JSON.parse(savedExperimentState);
        if (parsedExperimentState && typeof parsedExperimentState === 'object') {
          dispatch({
            type: ACTION_TYPES.RESTORE_STATE,
            payload: {
              experimentState: {
                ...DEFAULT_EXPERIMENT_STATE,
                ...parsedExperimentState,
              },
            },
          });
        }
      }

      const savedNoticeConfirmed = localStorage.getItem(STORAGE_KEYS.noticeConfirmed);
      if (savedNoticeConfirmed) {
        const parsedNoticeConfirmed = JSON.parse(savedNoticeConfirmed);
        if (typeof parsedNoticeConfirmed === 'boolean') {
          dispatch({
            type: ACTION_TYPES.RESTORE_STATE,
            payload: {
              noticeConfirmed: parsedNoticeConfirmed,
              noticeCountdown: parsedNoticeConfirmed ? 0 : 38,
            },
          });
        }
      }
    } catch (e) {
      console.warn('[g8-mikania-experiment] Failed to restore state:', e);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.answers, JSON.stringify(state.answers));
    } catch (e) {
      console.warn('[g8-mikania-experiment] Failed to save answers:', e);
    }
  }, [state.answers]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.experimentState, JSON.stringify(state.experimentState));
    } catch (e) {
      console.warn('[g8-mikania-experiment] Failed to save experimentState:', e);
    }
  }, [state.experimentState]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.noticeConfirmed, JSON.stringify(state.noticeConfirmed));
    } catch (e) {
      console.warn('[g8-mikania-experiment] Failed to save noticeConfirmed:', e);
    }
  }, [state.noticeConfirmed]);

  // Action creators
  const actions = useMemo(() => ({
    setPage: (pageId) => {
      sequenceRef.current.reset();
      dispatch({ type: ACTION_TYPES.SET_PAGE, payload: pageId });
    },
    setAnswer: (questionId, value) => {
      dispatch({
        type: ACTION_TYPES.SET_ANSWER,
        payload: { questionId, value },
      });
    },
    setExperimentState: (experimentState) => {
      dispatch({ type: ACTION_TYPES.SET_EXPERIMENT_STATE, payload: experimentState });
    },
    tickNoticeCountdown: () => {
      dispatch({ type: ACTION_TYPES.TICK_NOTICE_COUNTDOWN });
    },
    confirmNotice: (confirmed) => {
      dispatch({ type: ACTION_TYPES.CONFIRM_NOTICE, payload: confirmed });
    },
    logOperation: (operation, flowCtx) => {
      const code = sequenceRef.current.next();
      dispatch({
        type: ACTION_TYPES.LOG_OPERATION,
        payload: {
          ...operation,
          code,
          time: operation.time || formatTimestamp(new Date()),
          flowContext: flowCtx,  // 传递 flowContext 用于 PAGE_ENTER 后自动注入
        },
      });
    },
    clearOperations: () => {
      sequenceRef.current.reset();
      dispatch({ type: ACTION_TYPES.CLEAR_OPERATIONS });
    },
  }), []);

  // Navigation helper
  const navigateToPage = useCallback((pageId) => {
    actions.setPage(pageId);
  }, [actions]);

  const subPageNum = getSubPageNumByPageId(state.currentPageId);
  const pageNumber = useMemo(() => {
    // 独立模式和 Flow 模式统一使用 encodeCompositePageNum
    // 独立模式：stepIndex 默认为 0，生成 1.xx 格式
    // Flow 模式：使用 flowContext.stepIndex，生成 (stepIndex+1).xx 格式
    const stepIndex = typeof flowContext?.stepIndex === 'number' ? flowContext.stepIndex : 0;
    return encodeCompositePageNum(stepIndex + 1, subPageNum || 1);
  }, [flowContext?.stepIndex, subPageNum]);
  const targetPrefix = useMemo(() => (pageNumber ? `P${pageNumber}_` : ''), [pageNumber]);
  const taskDurationMinutes = useMemo(() => {
    const taskSeconds = options?.timers?.task ?? 1200; // 默认 20 分钟
    return Math.round(taskSeconds / 60);
  }, [options?.timers?.task]);

  // 使用 ref 跟踪 flowContext，避免 logOperation 因 flowContext 变化而重新创建
  const flowContextRef = useRef(flowContext);
  useEffect(() => {
    flowContextRef.current = flowContext;
  }, [flowContext]);

  // 创建稳定的 logOperation 函数，避免 useEffect 循环触发
  // 问题原因：之前 logOperation 在 contextValue 的 useMemo 中创建，依赖 state
  // 每次 state 变化（如倒计时 tick）都会重新创建 logOperation，
  // 导致页面组件的 useEffect（依赖 logOperation）反复触发 PAGE_ENTER/PAGE_EXIT
  const stableLogOperation = useCallback((operation) => {
    actions.logOperation(operation, flowContextRef.current);
  }, [actions]);

  // Context value - 注意：不再在这里创建 logOperation，使用稳定的 stableLogOperation
  const contextValue = useMemo(() => ({
    state,
    actions,
    navigateToPage,
    userContext,
    flowContext,
    options,
    subPageNum,
    pageNumber,
    targetPrefix,
    taskDurationMinutes,

    // Helper functions for pages
    validateCurrentPage: () => validatePage(state.currentPageId, state),
    getCurrentMissingFields: () => getMissingFields(state.currentPageId, state),

    // Expose actions directly
    ...actions,

    // 使用稳定的 logOperation，避免循环渲染问题
    logOperation: stableLogOperation,
  }), [state, actions, navigateToPage, userContext, flowContext, options, subPageNum, pageNumber, targetPrefix, stableLogOperation]);

  return (
    <MikaniaExperimentContext.Provider value={contextValue}>
      <MikaniaExperimentFrame
        userContext={userContext}
        flowContext={flowContext}
      />
    </MikaniaExperimentContext.Provider>
  );
}

export default MikaniaExperimentComponent;
