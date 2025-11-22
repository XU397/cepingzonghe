/**
 * 薇甘菊防治实验子模块主组件
 *
 * 使用 AssessmentPageFrame 统一框架接入
 */

import { createContext, useContext, useReducer, useEffect, useMemo, useCallback, useRef } from 'react';
import { AssessmentPageFrame } from '@/shared/ui/PageFrame';
import { EventTypes } from '@/shared/services/submission/eventTypes';
import { formatTimestamp } from '@/shared/services/dataLogger.js';
import {
  getNextPageId,
  getPageSubNum,
  getTotalSteps,
  getNavigationMode,
  getStepIndex,
  isLastPage,
  PAGE_DESC_MAP,
  QUESTION_CODE_MAP,
  ANSWER_KEY_TO_QUESTION,
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

const STORAGE_KEYS = {
  answers: 'module.g8-mikania-experiment.answers',
  experimentState: 'module.g8-mikania-experiment.experimentState',
  noticeConfirmed: 'module.g8-mikania-experiment.noticeConfirmed',
};

// 导出给页面组件使用
export { QUESTION_CODE_MAP, PAGE_DESC_MAP, ANSWER_KEY_TO_QUESTION };

const PAGE_QUESTIONS = {
  'page_00_notice': [],
  'page_01_intro': [],
  'page_02_step_q1': ['Q1_控制变量原因'],
  'page_03_sim_exp': [],
  'page_04_q2_data': ['Q2_抑制作用浓度'],
  'page_05_q3_trend': ['Q3_发芽率趋势'],
  'page_06_q4_conc': ['Q4a_菟丝子有效性', 'Q4b_结论理由'],
};

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
    concentration: '0mg/ml',
    days: 1,
    hasStarted: false,
    currentResult: null,
  },
  noticeConfirmed: false,
  noticeCountdown: 38,
  operations: [],
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
      return state.experimentState?.hasStarted === true;
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
      if (!state.experimentState?.hasStarted) {
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

function mikaniaReducer(state, action) {
  switch (action.type) {
    case ACTION_TYPES.SET_PAGE:
      return {
        ...state,
        currentPageId: action.payload,
        pageEnterTime: new Date(),
        operations: [],
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
    case ACTION_TYPES.LOG_OPERATION:
      return {
        ...state,
        operations: [...state.operations, action.payload],
      };
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

function MikaniaExperimentFrame({ userContext, flowContext, options }) {
  const {
    state,
    actions,
    navigateToPage,
  } = useMikaniaExperiment();

  const currentPageId = state.currentPageId;
  const subPageNum = getPageSubNum(currentPageId);
  const stepIndex = getStepIndex(currentPageId);
  const totalSteps = getTotalSteps();
  const navigationMode = getNavigationMode(currentPageId);

  // Validate page before proceeding
  const canProceed = useMemo(() => {
    return validatePage(currentPageId, state);
  }, [currentPageId, state]);

  // Build page description (without Flow prefix - usePageSubmission handles that)
  const buildPageDesc = useCallback((pageId) => {
    return PAGE_DESC_MAP[pageId] || '未知页面';
  }, []);

  // Collect answers with simple page number prefix
  const collectAnswers = useCallback(() => {
    const questionKeys = PAGE_QUESTIONS[currentPageId] || [];
    const answerList = [];

    questionKeys.forEach((key) => {
      const value = state.answers[key];
      if (value !== null && value !== undefined && value !== '') {
        const questionId = ANSWER_KEY_TO_QUESTION[key];
        const code = QUESTION_CODE_MAP[questionId];

        answerList.push({
          code,
          targetElement: `P${subPageNum}_${questionId}`,
          value: String(value),
        });
      }
    });

    return answerList;
  }, [currentPageId, state.answers, subPageNum]);

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
      const answerList = collectAnswers();

      return {
        pageNumber: String(subPageNum),
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
          pageId: currentPageId,
        })
      : undefined;

    return {
      getUserContext,
      buildMark,
      getFlowContext,
      allowProceedOnFailureInDev: true,
    };
  }, [userContext, flowContext, currentPageId, subPageNum, state.operations, state.pageEnterTime, buildPageDesc, collectAnswers]);

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
      const nextSubPageNum = getPageSubNum(nextPageId);
      flowContext.updateModuleProgress(nextSubPageNum);
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
    pageNumber: String(subPageNum),
    pageDesc: buildPageDesc(currentPageId),
  };

  // Show timer only on experiment pages (hide on hidden notice and intro info page)
  const showTimer = navigationMode !== 'hidden' && currentPageId !== 'page_01_intro';

  return (
    <AssessmentPageFrame
      navigationMode={navigationMode}
      currentStep={stepIndex}
      totalSteps={totalSteps}
      navTitle="进度"
      showNavigation={navigationMode !== 'hidden'}
      showTimer={showTimer}
      timerVariant="task"
      timerLabel="剩余时间"
      timerScope="module.g8-mikania-experiment.task"
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
  const [state, dispatch] = useReducer(
    mikaniaReducer,
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
            payload: { experimentState: parsedExperimentState },
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
    logOperation: (operation) => {
      dispatch({
        type: ACTION_TYPES.LOG_OPERATION,
        payload: {
          ...operation,
          time: operation.time || new Date().toISOString(),
        },
      });
    },
    clearOperations: () => {
      dispatch({ type: ACTION_TYPES.CLEAR_OPERATIONS });
    },
  }), []);

  // Navigation helper
  const navigateToPage = useCallback((pageId) => {
    actions.setPage(pageId);
  }, [actions]);

  // Context value
  const contextValue = useMemo(() => ({
    state,
    actions,
    navigateToPage,
    userContext,
    flowContext,
    options,

    // Helper functions for pages
    validateCurrentPage: () => validatePage(state.currentPageId, state),
    getCurrentMissingFields: () => getMissingFields(state.currentPageId, state),

    // Expose actions directly
    ...actions,
  }), [state, actions, navigateToPage, userContext, flowContext, options]);

  return (
    <MikaniaExperimentContext.Provider value={contextValue}>
      <MikaniaExperimentFrame
        userContext={userContext}
        flowContext={flowContext}
        options={options}
      />
    </MikaniaExperimentContext.Provider>
  );
}

export default MikaniaExperimentComponent;
