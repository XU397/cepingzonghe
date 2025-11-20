/**
 * 薇甘菊防治实验子模块主组件
 *
 * 使用 React Context + Reducer 管理模块内状态
 */

import { createContext, useContext, useReducer, useEffect, useMemo, useCallback, useRef, useState } from 'react';
import {
  getNextPageId,
  getPageSubNum,
  isLastPage,
} from './mapping';
import { encodeCompositePageNum } from '@/shared/types/flow';
import { usePageSubmission } from '@/shared/services/submission/usePageSubmission.js';
import { useAppContext } from '@/context/AppContext';

// ========================================
// Page Components Imports
// ========================================

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

/**
 * localStorage keys for persistence
 */
const STORAGE_KEYS = {
  answers: 'module.g8-mikania-experiment.answers',
  experimentState: 'module.g8-mikania-experiment.experimentState',
  noticeConfirmed: 'module.g8-mikania-experiment.noticeConfirmed',
};

/**
 * Question code mapping for answer collection
 * Q1 -> 1, Q2 -> 2, Q3 -> 3, Q4a -> 4, Q4b -> 5
 */
// eslint-disable-next-line react-refresh/only-export-components
export const QUESTION_CODE_MAP = {
  Q1: 1,
  Q2: 2,
  Q3: 3,
  Q4a: 4,
  Q4b: 5,
};

/**
 * Page description mapping for MarkObject
 */
// eslint-disable-next-line react-refresh/only-export-components
export const PAGE_DESC_MAP = {
  'page_00_notice': '注意事项',
  'page_01_intro': '任务背景',
  'page_02_step_q1': '实验步骤',
  'page_03_sim_exp': '模拟实验',
  'page_04_q2_data': '数据分析',
  'page_05_q3_trend': '趋势分析',
  'page_06_q4_conc': '结论验证',
};

/**
 * Map answer keys to question IDs
 */
const ANSWER_KEY_TO_QUESTION = {
  'Q1_控制变量原因': 'Q1',
  'Q2_抑制作用浓度': 'Q2',
  'Q3_发芽率趋势': 'Q3',
  'Q4a_菟丝子有效性': 'Q4a',
  'Q4b_结论理由': 'Q4b',
};

/**
 * Map page IDs to the questions they contain
 */
const PAGE_QUESTIONS = {
  'page_00_notice': [],
  'page_01_intro': [],
  'page_02_step_q1': ['Q1_控制变量原因'],
  'page_03_sim_exp': [],
  'page_04_q2_data': ['Q2_抑制作用浓度'],
  'page_05_q3_trend': ['Q3_发芽率趋势'],
  'page_06_q4_conc': ['Q4a_菟丝子有效性', 'Q4b_结论理由'],
};

/**
 * All question keys for timeout handling
 */
const ALL_QUESTION_KEYS = [
  'Q1_控制变量原因',
  'Q2_抑制作用浓度',
  'Q3_发芽率趋势',
  'Q4a_菟丝子有效性',
  'Q4b_结论理由',
];

// ========================================
// Action Types
// ========================================

// eslint-disable-next-line react-refresh/only-export-components
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
  // 当前页面
  currentPageId: initialPageId || 'page_00_notice',

  // 答案存储 { questionId: value }
  answers: {
    Q1_控制变量原因: null,
    Q2_抑制作用浓度: null,
    Q3_发芽率趋势: null,
    Q4a_菟丝子有效性: null,
    Q4b_结论理由: null,
  },

  // 实验面板状态
  experimentState: {
    concentration: '0mg/ml',
    days: 1,
    hasStarted: false,
    currentResult: null, // 发芽率结果
  },

  // 注意事项页状态
  noticeConfirmed: false, // 复选框是否已勾选
  noticeCountdown: 38, // 剩余倒计时秒数

  // 操作记录（当前页）
  operations: [],

  // 页面进入时间
  pageEnterTime: new Date(),
});

// ========================================
// Validation Function
// ========================================

/**
 * 验证页面的必填项是否已完成
 * @param {string} pageId - 页面 ID
 * @param {Object} state - 当前状态
 * @returns {boolean} 是否通过验证
 */
// eslint-disable-next-line react-refresh/only-export-components
export function validatePage(pageId, state) {
  switch (pageId) {
    case 'page_00_notice':
      return state.noticeCountdown <= 0 && state.noticeConfirmed;

    case 'page_01_intro':
      // 任务背景页无必填项
      return true;

    case 'page_02_step_q1':
      return state.answers.Q1_控制变量原因?.length >= 5;

    case 'page_03_sim_exp':
      // 模拟实验页无强制条件
      return true;

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

/**
 * 获取页面未完成的必填项列表
 * @param {string} pageId - 页面 ID
 * @param {Object} state - 当前状态
 * @returns {string[]} 未完成的必填项列表
 */
// eslint-disable-next-line react-refresh/only-export-components
export function getMissingFields(pageId, state) {
  const missing = [];

  switch (pageId) {
    case 'page_00_notice':
      if (state.noticeCountdown > 0) {
        missing.push('倒计时未结束');
      }
      if (!state.noticeConfirmed) {
        missing.push('注意事项确认');
      }
      break;

    case 'page_02_step_q1':
      if (!state.answers.Q1_控制变量原因 || state.answers.Q1_控制变量原因.length < 5) {
        missing.push('Q1_控制变量原因');
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

/**
 * 获取页面验证错误详情
 * @param {string} pageId - 页面 ID
 * @param {Object} state - 当前状态
 * @returns {Object} 验证错误详情 { field: errorMessage }
 */
// eslint-disable-next-line react-refresh/only-export-components
export function getValidationErrors(pageId, state) {
  const errors = {};

  switch (pageId) {
    case 'page_00_notice':
      if (state.noticeCountdown > 0) {
        errors.countdown = `请等待倒计时结束（剩余${state.noticeCountdown}秒）`;
      }
      if (!state.noticeConfirmed) {
        errors.checkbox = '请勾选确认已阅读注意事项';
      }
      break;

    case 'page_02_step_q1': {
      const currentLength = state.answers.Q1_控制变量原因?.length || 0;
      if (currentLength < 5) {
        errors.Q1_控制变量原因 = `至少5个字符，当前${currentLength}个`;
      }
      break;
    }

    case 'page_04_q2_data':
      if (!['A', 'B', 'C'].includes(state.answers.Q2_抑制作用浓度)) {
        errors.Q2_抑制作用浓度 = '请选择一个选项';
      }
      break;

    case 'page_05_q3_trend':
      if (!['A', 'B', 'C'].includes(state.answers.Q3_发芽率趋势)) {
        errors.Q3_发芽率趋势 = '请选择一个选项';
      }
      break;

    case 'page_06_q4_conc': {
      if (!['是', '否'].includes(state.answers.Q4a_菟丝子有效性)) {
        errors.Q4a_菟丝子有效性 = '请选择"是"或"否"';
      }
      const conclusionLength = state.answers.Q4b_结论理由?.length || 0;
      if (conclusionLength < 10) {
        errors.Q4b_结论理由 = `至少10个字符，当前${conclusionLength}个`;
      }
      break;
    }

    default:
      break;
  }

  return errors;
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
        operations: [], // 清空操作记录
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
      console.warn(`[g8-mikania-experiment] Unknown action type: ${action.type}`);
      return state;
  }
}

// ========================================
// Context
// ========================================

const MikaniaExperimentContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
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
// Helper Functions
// ========================================

/**
 * Format timestamp to 'YYYY-MM-DD HH:mm:ss' format
 * @param {Date} date - Date object
 * @returns {string} Formatted string
 */
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * Collect answers for the current page
 * @param {string} pageId - Page ID
 * @param {Object} answers - All answers from state
 * @returns {Array} Answer list in required format
 */
function collectAnswersForPage(pageId, answers) {
  const questionKeys = PAGE_QUESTIONS[pageId] || [];
  const answerList = [];

  questionKeys.forEach((key) => {
    const value = answers[key];
    if (value !== null && value !== undefined && value !== '') {
      const questionId = ANSWER_KEY_TO_QUESTION[key];
      const code = QUESTION_CODE_MAP[questionId];
      const subPageNum = getPageSubNum(pageId);

      answerList.push({
        code,
        targetElement: `P${subPageNum}_${questionId}`,
        value: String(value),
      });
    }
  });

  return answerList;
}

/**
 * Collect all answers for timeout submission
 * @param {Object} answers - All answers from state
 * @returns {Array} Answer list in required format with timeout markers
 */
function collectAllAnswersForTimeout(answers) {
  const answerList = [];

  ALL_QUESTION_KEYS.forEach((key) => {
    let value = answers[key];

    // Mark unanswered questions as "超时未回答"
    if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      value = '超时未回答';
    }

    const questionId = ANSWER_KEY_TO_QUESTION[key];
    const code = QUESTION_CODE_MAP[questionId];

    // Find which page this question belongs to
    let pageId = 'page_00_notice';
    for (const [pid, questions] of Object.entries(PAGE_QUESTIONS)) {
      if (questions.includes(key)) {
        pageId = pid;
        break;
      }
    }
    const subPageNum = getPageSubNum(pageId);

    answerList.push({
      code,
      targetElement: `P${subPageNum}_${questionId}`,
      value: String(value),
    });
  });

  return answerList;
}

/**
 * Clear all localStorage data for this module
 */
// eslint-disable-next-line react-refresh/only-export-components
export function clearModuleStorage() {
  try {
    localStorage.removeItem(STORAGE_KEYS.answers);
    localStorage.removeItem(STORAGE_KEYS.experimentState);
    localStorage.removeItem(STORAGE_KEYS.noticeConfirmed);
    console.log('[g8-mikania-experiment] Cleared localStorage');
  } catch (e) {
    console.warn('[g8-mikania-experiment] Failed to clear localStorage:', e);
  }
}

// ========================================
// Main Component
// ========================================

/**
 * 薇甘菊防治实验子模块主组件
 *
 * @param {Object} props
 * @param {Object} props.userContext - 用户上下文
 * @param {string} props.initialPageId - 初始页面 ID
 * @param {Object} props.options - 配置选项
 * @param {Object} props.flowContext - Flow 上下文
 */
function MikaniaExperimentComponent({
 userContext,
  initialPageId,
  options,
  flowContext,
  // 开发用：允许注入额外的调试 overlay（例如 dev harness）
  devOverlay,
}) {
  // 初始化状态
  const [state, dispatch] = useReducer(
    mikaniaReducer,
    initialPageId,
    createInitialState
  );

  // Get isTimeUp from AppContext for timeout detection (T046, T047)
  const appContext = useAppContext();
  const isTimeUp = appContext?.isTimeUp ?? false;

  // Ref to prevent duplicate timeout handling (T047)
  const timeoutRef = useRef(false);

  // Network error state for retry UI (T053)
  const [submitError, setSubmitError] = useState(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // ========================================
  // localStorage Persistence Effects
  // ========================================

  // Load state from localStorage on mount (T042)
  useEffect(() => {
    try {
      // Load answers
      const savedAnswers = localStorage.getItem(STORAGE_KEYS.answers);
      if (savedAnswers) {
        const parsedAnswers = JSON.parse(savedAnswers);
        if (parsedAnswers && typeof parsedAnswers === 'object') {
          dispatch({
            type: ACTION_TYPES.RESTORE_STATE,
            payload: { answers: parsedAnswers },
          });
          console.log('[g8-mikania-experiment] Restored answers from localStorage');
        }
      }

      // Load experimentState
      const savedExperimentState = localStorage.getItem(STORAGE_KEYS.experimentState);
      if (savedExperimentState) {
        const parsedExperimentState = JSON.parse(savedExperimentState);
        if (parsedExperimentState && typeof parsedExperimentState === 'object') {
          dispatch({
            type: ACTION_TYPES.RESTORE_STATE,
            payload: { experimentState: parsedExperimentState },
          });
          console.log('[g8-mikania-experiment] Restored experimentState from localStorage');
        }
      }

      // Load noticeConfirmed
      const savedNoticeConfirmed = localStorage.getItem(STORAGE_KEYS.noticeConfirmed);
      if (savedNoticeConfirmed) {
        const parsedNoticeConfirmed = JSON.parse(savedNoticeConfirmed);
        if (typeof parsedNoticeConfirmed === 'boolean') {
          dispatch({
            type: ACTION_TYPES.RESTORE_STATE,
            payload: {
              noticeConfirmed: parsedNoticeConfirmed,
              // If notice was confirmed, set countdown to 0
              noticeCountdown: parsedNoticeConfirmed ? 0 : 38,
            },
          });
          console.log('[g8-mikania-experiment] Restored noticeConfirmed from localStorage');
        }
      }
    } catch (e) {
      console.warn('[g8-mikania-experiment] Failed to restore state from localStorage:', e);
    }
  }, []);

  // Save answers to localStorage on change (T039)
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.answers,
        JSON.stringify(state.answers)
      );
    } catch (e) {
      console.warn('[g8-mikania-experiment] Failed to save answers to localStorage:', e);
    }
  }, [state.answers]);

  // Save experimentState to localStorage on change (T040)
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.experimentState,
        JSON.stringify(state.experimentState)
      );
    } catch (e) {
      console.warn('[g8-mikania-experiment] Failed to save experimentState to localStorage:', e);
    }
  }, [state.experimentState]);

  // Save noticeConfirmed to localStorage on change (T041)
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.noticeConfirmed,
        JSON.stringify(state.noticeConfirmed)
      );
    } catch (e) {
      console.warn('[g8-mikania-experiment] Failed to save noticeConfirmed to localStorage:', e);
    }
  }, [state.noticeConfirmed]);

  // ========================================
  // Action Creators
  // ========================================

  const actions = useMemo(() => ({
    /**
     * 设置当前页面
     */
    setPage: (pageId) => {
      dispatch({ type: ACTION_TYPES.SET_PAGE, payload: pageId });
    },

    /**
     * 设置答案
     */
    setAnswer: (questionId, value) => {
      dispatch({
        type: ACTION_TYPES.SET_ANSWER,
        payload: { questionId, value },
      });
    },

    /**
     * 更新实验状态
     */
    setExperimentState: (experimentState) => {
      dispatch({ type: ACTION_TYPES.SET_EXPERIMENT_STATE, payload: experimentState });
    },

    /**
     * 注意事项倒计时 -1 秒
     */
    tickNoticeCountdown: () => {
      dispatch({ type: ACTION_TYPES.TICK_NOTICE_COUNTDOWN });
    },

    /**
     * 确认注意事项
     */
    confirmNotice: (confirmed) => {
      dispatch({ type: ACTION_TYPES.CONFIRM_NOTICE, payload: confirmed });
    },

    /**
     * 记录操作
     */
    logOperation: (operation) => {
      dispatch({
        type: ACTION_TYPES.LOG_OPERATION,
        payload: {
          ...operation,
          time: operation.time || new Date().toISOString(),
        },
      });
    },

    /**
     * 清空操作记录
     */
    clearOperations: () => {
      dispatch({ type: ACTION_TYPES.CLEAR_OPERATIONS });
    },

    /**
     * 设置页面进入时间
     */
    setPageEnterTime: (time) => {
      dispatch({ type: ACTION_TYPES.SET_PAGE_ENTER_TIME, payload: time });
    },
  }), []);

  // ========================================
  // MarkObject Builder
  // ========================================

  /**
   * Build MarkObject for current page
   */
  const buildMarkObject = useCallback(() => {
    const pageId = state.currentPageId;
    const subPageNum = getPageSubNum(pageId);
    const stepIndex = flowContext?.stepIndex ?? 0;

    // Use composite page number format: M{stepIndex}:{subPageNum}
    const pageNumber = encodeCompositePageNum(stepIndex, subPageNum);
    const pageDesc = PAGE_DESC_MAP[pageId] || '未知页面';

    // Collect answers for current page
    const answerList = collectAnswersForPage(pageId, state.answers);

    // Build mark object
    const markObject = {
      pageNumber,
      pageDesc,
      operationList: [...state.operations],
      answerList,
      beginTime: formatDateTime(state.pageEnterTime),
      endTime: formatDateTime(new Date()),
      imgList: [],
    };

    return markObject;
  }, [state.currentPageId, state.operations, state.answers, state.pageEnterTime, flowContext]);

  /**
   * Build MarkObject for timeout submission (T048, T049)
   * Includes all answers with unanswered marked as "超时未回答"
   */
  const buildTimeoutMarkObject = useCallback(() => {
    const pageId = state.currentPageId;
    const subPageNum = getPageSubNum(pageId);
    const stepIndex = flowContext?.stepIndex ?? 0;

    // Use composite page number format: M{stepIndex}:{subPageNum}
    const pageNumber = encodeCompositePageNum(stepIndex, subPageNum);
    const pageDesc = PAGE_DESC_MAP[pageId] || '未知页面';

    // Collect ALL answers with timeout markers
    const answerList = collectAllAnswersForTimeout(state.answers);

    // Add timeout operation to the operations list
    const timeoutOperations = [
      ...state.operations,
      {
        targetElement: '系统事件',
        eventType: '任务超时',
        value: '超时自动提交',
        time: new Date().toISOString(),
      },
    ];

    // Build mark object
    const markObject = {
      pageNumber,
      pageDesc,
      operationList: timeoutOperations,
      answerList,
      beginTime: formatDateTime(state.pageEnterTime),
      endTime: formatDateTime(new Date()),
      imgList: [],
    };

    return markObject;
  }, [state.currentPageId, state.operations, state.answers, state.pageEnterTime, flowContext]);

  // ========================================
  // User Context Resolver
  // ========================================

  const getUserContext = useCallback(() => {
    console.log('[g8-mikania-experiment] getUserContext 被调用');
    console.log('[g8-mikania-experiment] userContext:', userContext);

    // Handle both formats:
    // 1. DevHarness format: { user: { batchCode, examNo } }
    // 2. Flow/App format: { batchCode, examNo }
    if (userContext?.user?.batchCode && userContext?.user?.examNo) {
      const result = {
        batchCode: userContext.user.batchCode,
        examNo: userContext.user.examNo,
      };
      console.log('[g8-mikania-experiment] 返回用户上下文 (format 1):', result);
      return result;
    }

    if (userContext?.batchCode && userContext?.examNo) {
      const result = {
        batchCode: userContext.batchCode,
        examNo: userContext.examNo,
      };
      console.log('[g8-mikania-experiment] 返回用户上下文 (format 2):', result);
      return result;
    }

    console.warn('[g8-mikania-experiment] userContext 缺少必要字段，返回 null');
    console.warn('[g8-mikania-experiment] 期望: { user: { batchCode, examNo } } 或 { batchCode, examNo }');
    return null;
  }, [userContext]);

  // ========================================
  // Flow Context for Submission
  // ========================================

  const getFlowContext = useCallback(() => {
    if (!flowContext) return null;

    return {
      flowId: flowContext.flowId,
      submoduleId: flowContext.submoduleId,
      stepIndex: flowContext.stepIndex,
      pageId: state.currentPageId,
    };
  }, [flowContext, state.currentPageId]);

  // ========================================
  // Page Submission Hook
  // ========================================

  const {
    submit,
    isSubmitting,
    lastError,
  } = usePageSubmission({
    getUserContext,
    buildMark: buildMarkObject,
    getFlowContext,
    allowProceedOnFailureInDev: true,
    onError: (error) => {
      console.error('[g8-mikania-experiment] Submission error:', error);

      // T056: Check for 401 session expiry
      if (error.status === 401 || error.message?.includes('401') || error.isSessionExpired) {
        console.log('[g8-mikania-experiment] Session expired, redirecting to login');
        clearModuleStorage();
        window.location.href = '/login';
        return;
      }

      // Set error for retry UI (T053)
      setSubmitError(error.message || '网络错误，请重试');
    },
  });

  // ========================================
  // Timeout Handler (T048, T049, T050)
  // ========================================

  const handleTimeout = useCallback(async () => {
    // Skip if no flowContext or already handled
    if (!flowContext?.onTimeout || timeoutRef.current) {
      console.log('[g8-mikania-experiment] Timeout skipped: no flowContext or already handled');
      return;
    }

    console.log('[g8-mikania-experiment] Handling timeout...');
    timeoutRef.current = true;

    try {
      // Build timeout mark object with all answers (unanswered marked as "超时未回答")
      const timeoutMarkObject = buildTimeoutMarkObject();

      // Get user context for submission
      const userCtx = getUserContext();

      if (userCtx) {
        // Submit timeout data
        const formData = new FormData();
        formData.append('batchCode', userCtx.batchCode);
        formData.append('examNo', userCtx.examNo);
        formData.append('mark', JSON.stringify(timeoutMarkObject));

        try {
          const response = await fetch('/stu/saveHcMark', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });

          if (response.ok) {
            console.log('[g8-mikania-experiment] Timeout submission successful');
          } else {
            console.error('[g8-mikania-experiment] Timeout submission failed:', response.status);
          }
        } catch (fetchError) {
          console.error('[g8-mikania-experiment] Timeout submission error:', fetchError);
        }
      }

      // Clear localStorage after timeout submission
      clearModuleStorage();

      // Notify Flow container (T050)
      flowContext.onTimeout();
      console.log('[g8-mikania-experiment] Timeout handled, notified flowContext');

    } catch (error) {
      console.error('[g8-mikania-experiment] Timeout handling error:', error);
      // Still call onTimeout to avoid blocking the flow
      flowContext.onTimeout();
    }
  }, [flowContext, buildTimeoutMarkObject, getUserContext]);

  // ========================================
  // Timeout Detection Effect (T047)
  // ========================================

  useEffect(() => {
    if (isTimeUp) {
      handleTimeout();
    }
  }, [isTimeUp, handleTimeout]);

  // Reset timeout ref when flow step changes
  useEffect(() => {
    timeoutRef.current = false;
  }, [flowContext?.flowId, flowContext?.stepIndex]);

  // ========================================
  // Retry Handler (T053)
  // ========================================

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    setSubmitError(null);

    try {
      const success = await submit();
      if (success) {
        setSubmitError(null);
      }
    } catch (error) {
      setSubmitError(error.message || '重试失败，请再试');
    } finally {
      setIsRetrying(false);
    }
  }, [submit]);

  const clearSubmitError = useCallback(() => {
    setSubmitError(null);
  }, []);

  // ========================================
  // Navigation Helpers
  // ========================================

  const navigationHelpers = useMemo(() => ({
    /**
     * 获取下一个页面 ID
     */
    getNextPage: () => getNextPageId(state.currentPageId),

    /**
     * 检查是否是最后一页
     */
    isLastPage: () => isLastPage(state.currentPageId),

    /**
     * 获取当前页面的子模块内页码
     */
    getCurrentSubPageNum: () => getPageSubNum(state.currentPageId),

    /**
     * 导航到下一页（带数据提交）
     */
    navigateToNextPage: async () => {
      console.log('[g8-mikania-experiment] ========== navigateToNextPage START ==========');

      // Clear any previous submit errors
      setSubmitError(null);

      const nextPageId = getNextPageId(state.currentPageId);
      console.log('[g8-mikania-experiment] navigateToNextPage:', {
        currentPageId: state.currentPageId,
        nextPageId,
        hasFlowContext: !!flowContext,
        hasUserContext: !!userContext,
        isSubmitting,
      });

      if (!nextPageId) {
        // Last page - call onComplete if available
        if (flowContext?.onComplete) {
          console.log('[g8-mikania-experiment] 最后一页，提交并调用 onComplete');
          const success = await submit();
          if (success) {
            // Clear localStorage on completion
            clearModuleStorage();
            flowContext.onComplete();
          } else {
            console.error('[g8-mikania-experiment] 最后一页提交失败');
          }
        } else {
          console.warn('[g8-mikania-experiment] 最后一页但没有 onComplete 回调');
        }
        return;
      }

      // Submit current page data
      console.log('[g8-mikania-experiment] 提交当前页面数据...');
      console.log('[g8-mikania-experiment] submit 函数类型:', typeof submit);
      console.log('[g8-mikania-experiment] isSubmitting:', isSubmitting);

      try {
        const success = await submit();
        console.log('[g8-mikania-experiment] 提交结果:', success);
        console.log('[g8-mikania-experiment] 提交后 lastError:', lastError);

        if (success) {
          // Update module progress if available
          if (flowContext?.updateModuleProgress) {
            const nextSubPageNum = getPageSubNum(nextPageId);
            flowContext.updateModuleProgress(nextSubPageNum);
          }

          // Navigate to next page
          console.log('[g8-mikania-experiment] 导航到下一页:', nextPageId);
          actions.setPage(nextPageId);
        } else {
          console.error('[g8-mikania-experiment] 提交失败，无法跳转到下一页');
          // 检查 lastError
          if (lastError) {
            console.error('[g8-mikania-experiment] 最后错误:', lastError);
          }
        }
      } catch (error) {
        console.error('[g8-mikania-experiment] submit() 抛出异常:', error);
      }

      console.log('[g8-mikania-experiment] ========== navigateToNextPage END ==========');
    },

    /**
     * 提交当前页面数据
     */
    submitCurrentPage: submit,

    /**
     * 检查是否正在提交
     */
    isSubmitting: () => isSubmitting,

    /**
     * 获取最后一次提交错误
     */
    getLastError: () => lastError,

    /**
     * 验证当前页面 (T051)
     */
    validateCurrentPage: () => validatePage(state.currentPageId, state),

    /**
     * 获取当前页面缺失字段 (T051)
     */
    getCurrentMissingFields: () => getMissingFields(state.currentPageId, state),

    /**
     * 获取当前页面验证错误 (T052)
     */
    getCurrentValidationErrors: () => getValidationErrors(state.currentPageId, state),

    /**
     * 记录点击被阻止事件 (T051)
     */
    logClickBlocked: (reason, missingFields) => {
      actions.logOperation({
        targetElement: '下一页按钮',
        eventType: 'click_blocked',
        value: JSON.stringify({
          reason: reason || 'validation_failed',
          page: state.currentPageId,
          missingFields: missingFields || getMissingFields(state.currentPageId, state),
        }),
        time: new Date().toISOString(),
      });
    },
  }), [state, actions, submit, isSubmitting, lastError, flowContext]);

  // ========================================
  // Context Value
  // ========================================

  const contextValue = useMemo(() => ({
    // State
    state,

    // Actions
    ...actions,

    // Navigation
    ...navigationHelpers,

    // Submission
    submit,
    isSubmitting,
    lastError,
    buildMarkObject,

    // Timer info from AppContext (T046)
    isTimeUp,

    // Error handling (T053)
    submitError,
    isRetrying,
    handleRetry,
    clearSubmitError,

    // External contexts
    userContext,
    flowContext,
    options,
  }), [state, actions, navigationHelpers, submit, isSubmitting, lastError, buildMarkObject, isTimeUp, submitError, isRetrying, handleRetry, clearSubmitError, userContext, flowContext, options]);

  // ========================================
  // Effects
  // ========================================

  // 记录初始页面进入（仅在组件首次挂载时）
  useEffect(() => {
    actions.logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: state.currentPageId,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ========================================
  // Render
  // ========================================

  // 获取当前页面组件
  const CurrentPageComponent = PAGE_COMPONENTS[state.currentPageId];

  if (!CurrentPageComponent) {
    console.error(`[g8-mikania-experiment] Unknown page: ${state.currentPageId}`);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        未知页面: {state.currentPageId}
      </div>
    );
  }

  return (
    <MikaniaExperimentContext.Provider value={contextValue}>
      {typeof devOverlay === 'function' ? devOverlay(contextValue) : devOverlay}
      <CurrentPageComponent />
    </MikaniaExperimentContext.Provider>
  );
}

export default MikaniaExperimentComponent;
