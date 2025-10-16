import { createContext, useContext, useReducer, useCallback, useMemo } from 'react';

/**
 * TrackingContext - 7年级追踪测评模块的全局状态管理
 *
 * 管理实验会话、试验数据、问卷答案等所有模块状态。
 * 基于 specs/001-7/data-model.md 实现。
 *
 * @module TrackingContext
 */

/**
 * 生成UUID v4
 * 使用浏览器原生crypto.randomUUID() API
 * @returns {string} UUID字符串
 */
function generateUUID() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Fallback: 简单的UUID v4生成器 (用于不支持crypto.randomUUID的环境)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ============================================================================
// Context Definition
// ============================================================================

const TrackingContext = createContext(null);

// ============================================================================
// Action Types
// ============================================================================

const ActionTypes = {
  // Session Management
  INITIALIZE_SESSION: 'INITIALIZE_SESSION',
  UPDATE_SESSION: 'UPDATE_SESSION',
  UPDATE_HEARTBEAT: 'UPDATE_HEARTBEAT',
  INVALIDATE_SESSION: 'INVALIDATE_SESSION',
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  START_EXPERIMENT_TIMER: 'START_EXPERIMENT_TIMER',
  START_QUESTIONNAIRE_TIMER: 'START_QUESTIONNAIRE_TIMER',

  // Experiment Data
  ADD_EXPERIMENT_TRIAL: 'ADD_EXPERIMENT_TRIAL',

  // Chart Data
  ADD_CHART_DATA_POINT: 'ADD_CHART_DATA_POINT',
  REMOVE_CHART_DATA_POINT: 'REMOVE_CHART_DATA_POINT',
  UPDATE_CHART_OPERATION: 'UPDATE_CHART_OPERATION',

  // Text Responses
  UPDATE_TEXT_RESPONSE: 'UPDATE_TEXT_RESPONSE',
  START_TEXT_EDIT: 'START_TEXT_EDIT',

  // Questionnaire Answers
  UPDATE_QUESTIONNAIRE_ANSWER: 'UPDATE_QUESTIONNAIRE_ANSWER',

  // Operations Log
  LOG_OPERATION: 'LOG_OPERATION',
  CLEAR_OPERATIONS: 'CLEAR_OPERATIONS',
};

// ============================================================================
// Initial State Factory
// ============================================================================

/**
 * 创建初始状态
 * @param {Object} userInfo - 用户信息 (从登录API获取)
 * @returns {Object} 初始状态对象
 */
const createInitialState = (userInfo = {}) => ({
  // Session Management (ExperimentSession)
  session: {
    // 学生身份信息
    studentCode: userInfo.examNo || '',
    studentName: userInfo.studentName || '',
    examNo: userInfo.examNo || '',
    batchCode: userInfo.batchCode || '',
    schoolCode: userInfo.schoolCode || '',

    // 会话管理
    sessionId: generateUUID(),
    sessionStartTime: Date.now(),
    lastHeartbeatTime: Date.now(),
    isSessionValid: true,

    // 导航状态
    currentPage: parseFloat(userInfo.pageNum) || 0.1, // 支持小数页码 (0.1, 0.2, 1-21)
    navigationMode: 'hidden', // 'hidden' | 'experiment' | 'questionnaire'

    // 计时器状态
    experimentTimerStarted: false,
    questionnaireTimerStarted: false,
    experimentStartTime: null,
    questionnaireStartTime: null,
  },

  // Experiment Data (ExperimentTrial[])
  experimentTrials: [],

  // Chart Data (ChartData)
  chartData: {
    dataPoints: [],
    isCompleted: false,
    creationTime: null,
    operationList: [],
  },

  // Text Responses (TextResponse[])
  textResponses: [
    {
      questionNumber: 1,
      questionText: '1. 根据你的折线图,描述蜂蜜含水量与小球下落时间的关系。',
      answerText: '',
      startEditTime: null,
      lastEditTime: null,
      editDuration: 0,
      characterCount: 0,
      isEmpty: true,
      isValid: false,
    },
    {
      questionNumber: 2,
      questionText: '2. 解释为什么含水量的变化会影响小球的下落时间。',
      answerText: '',
      startEditTime: null,
      lastEditTime: null,
      editDuration: 0,
      characterCount: 0,
      isEmpty: true,
      isValid: false,
    },
    {
      questionNumber: 3,
      questionText: '3. 如果实验中改变温度参数,你预测会对结果产生什么影响?',
      answerText: '',
      startEditTime: null,
      lastEditTime: null,
      editDuration: 0,
      characterCount: 0,
      isEmpty: true,
      isValid: false,
    },
  ],

  // Questionnaire Answers (QuestionnaireAnswer[])
  // 初始化27个问卷问题的答案槽位
  questionnaireAnswers: Array.from({ length: 27 }, (_, index) => ({
    pageNumber: getPageNumberForQuestion(index + 1),
    questionNumber: index + 1,
    questionText: '', // 实际文本由页面组件提供
    selectedOption: null,
    selectionTime: null,
    isAnswered: false,
  })),

  // Operations Log (用于构建MarkObject)
  currentPageOperations: [],
});

/**
 * 根据问题编号获取对应的页码
 * @param {number} questionNumber - 全局问题编号 (1-27)
 * @returns {number} 页码 (14-21)
 */
function getPageNumberForQuestion(questionNumber) {
  if (questionNumber >= 1 && questionNumber <= 3) return 14;
  if (questionNumber >= 4 && questionNumber <= 7) return 15;
  if (questionNumber >= 8 && questionNumber <= 10) return 16;
  if (questionNumber >= 11 && questionNumber <= 13) return 17;
  if (questionNumber >= 14 && questionNumber <= 16) return 18;
  if (questionNumber >= 17 && questionNumber <= 19) return 19;
  if (questionNumber >= 20 && questionNumber <= 23) return 20;
  if (questionNumber >= 24 && questionNumber <= 27) return 21;
  return 14; // 默认返回第一页
}

// ============================================================================
// Reducer
// ============================================================================

/**
 * TrackingContext Reducer
 * @param {Object} state - 当前状态
 * @param {Object} action - 动作对象
 * @returns {Object} 新状态
 */
function trackingReducer(state, action) {
  switch (action.type) {
    // ------------------------------------------------------------------------
    // Session Management
    // ------------------------------------------------------------------------

    case ActionTypes.INITIALIZE_SESSION: {
      const { userInfo } = action.payload;
      return {
        ...state,
        session: {
          ...state.session,
          studentCode: userInfo.examNo || state.session.studentCode,
          studentName: userInfo.studentName || state.session.studentName,
          examNo: userInfo.examNo || state.session.examNo,
          batchCode: userInfo.batchCode || state.session.batchCode,
          schoolCode: userInfo.schoolCode || state.session.schoolCode,
          currentPage: parseFloat(userInfo.pageNum) || 0.1,
        },
      };
    }

    case ActionTypes.UPDATE_SESSION: {
      return {
        ...state,
        session: {
          ...state.session,
          ...action.payload,
        },
      };
    }

    case ActionTypes.UPDATE_HEARTBEAT: {
      return {
        ...state,
        session: {
          ...state.session,
          lastHeartbeatTime: Date.now(),
        },
      };
    }

    case ActionTypes.INVALIDATE_SESSION: {
      return {
        ...state,
        session: {
          ...state.session,
          isSessionValid: false,
        },
      };
    }

    case ActionTypes.SET_CURRENT_PAGE: {
      const { pageNumber } = action.payload;
      let navigationMode = 'hidden';

      // 根据页码自动设置导航模式
      if (pageNumber >= 1 && pageNumber <= 13) {
        navigationMode = 'experiment';
      } else if (pageNumber >= 14 && pageNumber <= 21) {
        navigationMode = 'questionnaire';
      }

      return {
        ...state,
        session: {
          ...state.session,
          currentPage: pageNumber,
          navigationMode,
        },
      };
    }

    case ActionTypes.START_EXPERIMENT_TIMER: {
      return {
        ...state,
        session: {
          ...state.session,
          experimentTimerStarted: true,
          experimentStartTime: Date.now(),
        },
      };
    }

    case ActionTypes.START_QUESTIONNAIRE_TIMER: {
      return {
        ...state,
        session: {
          ...state.session,
          questionnaireTimerStarted: true,
          questionnaireStartTime: Date.now(),
        },
      };
    }

    // ------------------------------------------------------------------------
    // Experiment Data
    // ------------------------------------------------------------------------

    case ActionTypes.ADD_EXPERIMENT_TRIAL: {
      const { trial } = action.payload;

      // 验证试验数据
      if (!validateExperimentTrial(trial)) {
        console.error('[TrackingContext] Invalid experiment trial:', trial);
        return state;
      }

      return {
        ...state,
        experimentTrials: [...state.experimentTrials, trial],
      };
    }

    // ------------------------------------------------------------------------
    // Chart Data
    // ------------------------------------------------------------------------

    case ActionTypes.ADD_CHART_DATA_POINT: {
      const { dataPoint } = action.payload;

      // 检查是否已存在相同含水量的数据点
      const existingIndex = state.chartData.dataPoints.findIndex(
        point => point.waterContent === dataPoint.waterContent
      );

      if (existingIndex !== -1) {
        console.warn('[TrackingContext] Duplicate water content, updating existing point');
        const updatedDataPoints = [...state.chartData.dataPoints];
        updatedDataPoints[existingIndex] = dataPoint;

        return {
          ...state,
          chartData: {
            ...state.chartData,
            dataPoints: updatedDataPoints,
            isCompleted: updatedDataPoints.length >= 2,
          },
        };
      }

      // 添加新数据点 (最多3个)
      if (state.chartData.dataPoints.length >= 3) {
        console.warn('[TrackingContext] Chart already has 3 data points');
        return state;
      }

      const newDataPoints = [...state.chartData.dataPoints, dataPoint];

      return {
        ...state,
        chartData: {
          ...state.chartData,
          dataPoints: newDataPoints,
          isCompleted: newDataPoints.length >= 2,
          creationTime: state.chartData.creationTime || Date.now(),
        },
      };
    }

    case ActionTypes.REMOVE_CHART_DATA_POINT: {
      const { waterContent } = action.payload;

      const filteredDataPoints = state.chartData.dataPoints.filter(
        point => point.waterContent !== waterContent
      );

      return {
        ...state,
        chartData: {
          ...state.chartData,
          dataPoints: filteredDataPoints,
          isCompleted: filteredDataPoints.length >= 2,
        },
      };
    }

    case ActionTypes.UPDATE_CHART_OPERATION: {
      const { operation } = action.payload;

      return {
        ...state,
        chartData: {
          ...state.chartData,
          operationList: [...state.chartData.operationList, operation],
        },
      };
    }

    // ------------------------------------------------------------------------
    // Text Responses
    // ------------------------------------------------------------------------

    case ActionTypes.UPDATE_TEXT_RESPONSE: {
      const { questionNumber, answerText } = action.payload;

      const updatedResponses = state.textResponses.map(response => {
        if (response.questionNumber === questionNumber) {
          const now = Date.now();
          const characterCount = answerText.trim().length;

          return {
            ...response,
            answerText,
            lastEditTime: now,
            characterCount,
            isEmpty: characterCount === 0,
            isValid: characterCount > 0,
          };
        }
        return response;
      });

      return {
        ...state,
        textResponses: updatedResponses,
      };
    }

    case ActionTypes.START_TEXT_EDIT: {
      const { questionNumber } = action.payload;

      const updatedResponses = state.textResponses.map(response => {
        if (response.questionNumber === questionNumber && !response.startEditTime) {
          return {
            ...response,
            startEditTime: Date.now(),
          };
        }
        return response;
      });

      return {
        ...state,
        textResponses: updatedResponses,
      };
    }

    // ------------------------------------------------------------------------
    // Questionnaire Answers
    // ------------------------------------------------------------------------

    case ActionTypes.UPDATE_QUESTIONNAIRE_ANSWER: {
      const { questionNumber, selectedOption, questionText } = action.payload;

      // 验证问题编号范围
      if (questionNumber < 1 || questionNumber > 27) {
        console.error('[TrackingContext] Invalid question number:', questionNumber);
        return state;
      }

      // 验证选项
      if (!['A', 'B', 'C', 'D', 'E'].includes(selectedOption)) {
        console.error('[TrackingContext] Invalid option:', selectedOption);
        return state;
      }

      const updatedAnswers = state.questionnaireAnswers.map(answer => {
        if (answer.questionNumber === questionNumber) {
          return {
            ...answer,
            questionText: questionText || answer.questionText,
            selectedOption,
            selectionTime: Date.now(),
            isAnswered: true,
          };
        }
        return answer;
      });

      return {
        ...state,
        questionnaireAnswers: updatedAnswers,
      };
    }

    // ------------------------------------------------------------------------
    // Operations Log
    // ------------------------------------------------------------------------

    case ActionTypes.LOG_OPERATION: {
      const { operation } = action.payload;

      return {
        ...state,
        currentPageOperations: [
          ...state.currentPageOperations,
          {
            timestamp: Date.now(),
            ...operation,
          },
        ],
      };
    }

    case ActionTypes.CLEAR_OPERATIONS: {
      return {
        ...state,
        currentPageOperations: [],
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * 验证实验试验数据
 * @param {Object} trial - ExperimentTrial对象
 * @returns {boolean} 是否有效
 */
function validateExperimentTrial(trial) {
  const { trialNumber, waterContent, temperature, fallTime, pageNumber } = trial;

  // 试验编号验证
  if (![1, 2, 3].includes(trialNumber)) {
    console.error('[TrackingContext] Invalid trialNumber:', trialNumber);
    return false;
  }

  // 含水量验证
  if (![15, 20, 25].includes(waterContent)) {
    console.error('[TrackingContext] Invalid waterContent:', waterContent);
    return false;
  }

  // 温度验证
  if (![15, 20, 25, 30].includes(temperature)) {
    console.error('[TrackingContext] Invalid temperature:', temperature);
    return false;
  }

  // 下落时间验证
  if (typeof fallTime !== 'number' || fallTime <= 0) {
    console.error('[TrackingContext] Invalid fallTime:', fallTime);
    return false;
  }

  // 页码验证
  const expectedPageNumber = 8 + trialNumber; // Trial 1 → Page 9, Trial 2 → Page 10, Trial 3 → Page 11
  if (pageNumber !== expectedPageNumber) {
    console.error('[TrackingContext] Page number mismatch:', { pageNumber, expectedPageNumber });
    return false;
  }

  return true;
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * TrackingProvider - Context Provider 组件
 * @param {Object} props
 * @param {ReactNode} props.children - 子组件
 * @param {Object} props.userInfo - 用户信息 (从登录API获取)
 */
export function TrackingProvider({ children, userInfo = {} }) {
  const [state, dispatch] = useReducer(trackingReducer, createInitialState(userInfo));

  // --------------------------------------------------------------------------
  // Session Management Methods
  // --------------------------------------------------------------------------

  /**
   * 初始化会话 (登录后调用)
   */
  const initializeSession = useCallback((userInfo) => {
    dispatch({ type: ActionTypes.INITIALIZE_SESSION, payload: { userInfo } });
  }, []);

  /**
   * 更新会话信息
   */
  const updateSession = useCallback((updates) => {
    dispatch({ type: ActionTypes.UPDATE_SESSION, payload: updates });
  }, []);

  /**
   * 更新心跳时间戳
   */
  const updateHeartbeat = useCallback(() => {
    dispatch({ type: ActionTypes.UPDATE_HEARTBEAT });
  }, []);

  /**
   * 使会话失效 (多设备登录检测)
   */
  const invalidateSession = useCallback(() => {
    dispatch({ type: ActionTypes.INVALIDATE_SESSION });
  }, []);

  /**
   * 导航到指定页码
   */
  const navigateToPage = useCallback((pageNumber) => {
    dispatch({ type: ActionTypes.SET_CURRENT_PAGE, payload: { pageNumber } });
  }, []);

  /**
   * 启动实验计时器
   */
  const startExperimentTimer = useCallback(() => {
    dispatch({ type: ActionTypes.START_EXPERIMENT_TIMER });
  }, []);

  /**
   * 启动问卷计时器
   */
  const startQuestionnaireTimer = useCallback(() => {
    dispatch({ type: ActionTypes.START_QUESTIONNAIRE_TIMER });
  }, []);

  // --------------------------------------------------------------------------
  // Experiment Data Methods
  // --------------------------------------------------------------------------

  /**
   * 添加实验试验记录
   * @param {Object} trial - ExperimentTrial对象
   */
  const addExperimentTrial = useCallback((trial) => {
    dispatch({ type: ActionTypes.ADD_EXPERIMENT_TRIAL, payload: { trial } });
  }, []);

  // --------------------------------------------------------------------------
  // Chart Data Methods
  // --------------------------------------------------------------------------

  /**
   * 添加图表数据点
   * @param {Object} dataPoint - ChartDataPoint对象
   */
  const addChartDataPoint = useCallback((dataPoint) => {
    dispatch({ type: ActionTypes.ADD_CHART_DATA_POINT, payload: { dataPoint } });
  }, []);

  /**
   * 移除图表数据点
   * @param {number} waterContent - 含水量 (15, 20, 25)
   */
  const removeChartDataPoint = useCallback((waterContent) => {
    dispatch({ type: ActionTypes.REMOVE_CHART_DATA_POINT, payload: { waterContent } });
  }, []);

  /**
   * 记录图表操作
   * @param {Object} operation - 操作对象 { action, dataPoint }
   */
  const logChartOperation = useCallback((operation) => {
    dispatch({ type: ActionTypes.UPDATE_CHART_OPERATION, payload: { operation } });
  }, []);

  // --------------------------------------------------------------------------
  // Text Response Methods
  // --------------------------------------------------------------------------

  /**
   * 更新文本回答
   * @param {number} questionNumber - 问题编号 (1, 2, 3)
   * @param {string} answerText - 答案文本
   */
  const updateTextResponse = useCallback((questionNumber, answerText) => {
    dispatch({
      type: ActionTypes.UPDATE_TEXT_RESPONSE,
      payload: { questionNumber, answerText }
    });
  }, []);

  /**
   * 开始编辑文本回答 (记录startEditTime)
   * @param {number} questionNumber - 问题编号 (1, 2, 3)
   */
  const startTextEdit = useCallback((questionNumber) => {
    dispatch({ type: ActionTypes.START_TEXT_EDIT, payload: { questionNumber } });
  }, []);

  // --------------------------------------------------------------------------
  // Questionnaire Methods
  // --------------------------------------------------------------------------

  /**
   * 更新问卷答案
   * @param {number} questionNumber - 全局问题编号 (1-27)
   * @param {string} selectedOption - 选中的选项 ('A' | 'B' | 'C' | 'D' | 'E')
   * @param {string} questionText - 问题文本 (可选)
   */
  const updateQuestionnaireAnswer = useCallback((questionNumber, selectedOption, questionText = '') => {
    dispatch({
      type: ActionTypes.UPDATE_QUESTIONNAIRE_ANSWER,
      payload: { questionNumber, selectedOption, questionText }
    });
  }, []);

  // --------------------------------------------------------------------------
  // Operations Log Methods
  // --------------------------------------------------------------------------

  /**
   * 记录用户操作
   * @param {Object} operation - 操作对象 { action, target?, value? }
   */
  const logOperation = useCallback((operation) => {
    dispatch({ type: ActionTypes.LOG_OPERATION, payload: { operation } });
  }, []);

  /**
   * 清空当前页面操作记录 (提交后调用)
   */
  const clearOperations = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_OPERATIONS });
  }, []);

  // --------------------------------------------------------------------------
  // Computed Values (Memoized)
  // --------------------------------------------------------------------------

  /**
   * 获取当前导航模式
   */
  const getCurrentNavigationMode = useCallback(() => {
    return state.session.navigationMode;
  }, [state.session.navigationMode]);

  /**
   * 检查是否可以导航到下一页 (基于当前页面验证规则)
   */
  const canNavigateNext = useCallback(() => {
    const { currentPage } = state.session;

    // 页码0.1, 0.2: 注意事项/说明页 - 总是可以前进
    if (currentPage === 0.1 || currentPage === 0.2) {
      return true;
    }

    // 页码9-11: 实验页面 - 需要完成当前试验
    if (currentPage >= 9 && currentPage <= 11) {
      const trialNumber = currentPage - 8;
      const trial = state.experimentTrials.find(t => t.trialNumber === trialNumber);
      return trial !== undefined;
    }

    // 页码12: 图表页面 - 需要至少2个数据点
    if (currentPage === 12) {
      return state.chartData.isCompleted;
    }

    // 页码13: 文本回答页面 - 建议填写但不强制
    if (currentPage === 13) {
      // 可以选择性验证: 至少回答1个问题
      // const hasAtLeastOneAnswer = state.textResponses.some(r => r.isValid);
      // return hasAtLeastOneAnswer;

      // 或者允许全部跳过
      return true;
    }

    // 页码14-21: 问卷调查 - 需要回答当前页面的所有问题
    if (currentPage >= 14 && currentPage <= 21) {
      const pageNumber = Math.floor(currentPage);
      const questionsOnPage = state.questionnaireAnswers.filter(
        a => a.pageNumber === pageNumber
      );

      return questionsOnPage.every(a => a.isAnswered);
    }

    // 默认允许
    return true;
  }, [state.session, state.experimentTrials, state.chartData.isCompleted, state.questionnaireAnswers]);

  /**
   * 获取指定试验的数据
   * @param {number} trialNumber - 试验编号 (1, 2, 3)
   */
  const getExperimentTrial = useCallback((trialNumber) => {
    return state.experimentTrials.find(t => t.trialNumber === trialNumber);
  }, [state.experimentTrials]);

  /**
   * 获取指定问题的文本回答
   * @param {number} questionNumber - 问题编号 (1, 2, 3)
   */
  const getTextResponse = useCallback((questionNumber) => {
    return state.textResponses.find(r => r.questionNumber === questionNumber);
  }, [state.textResponses]);

  /**
   * 获取指定问题的问卷答案
   * @param {number} questionNumber - 全局问题编号 (1-27)
   */
  const getQuestionnaireAnswer = useCallback((questionNumber) => {
    return state.questionnaireAnswers.find(a => a.questionNumber === questionNumber);
  }, [state.questionnaireAnswers]);

  /**
   * 获取指定页面的问卷答案列表
   * @param {number} pageNumber - 页码 (14-21)
   */
  const getQuestionnaireAnswersForPage = useCallback((pageNumber) => {
    return state.questionnaireAnswers.filter(a => a.pageNumber === pageNumber);
  }, [state.questionnaireAnswers]);

  // --------------------------------------------------------------------------
  // Context Value (Memoized)
  // --------------------------------------------------------------------------

  const value = useMemo(
    () => ({
      // State
      session: state.session,
      experimentTrials: state.experimentTrials,
      chartData: state.chartData,
      textResponses: state.textResponses,
      questionnaireAnswers: state.questionnaireAnswers,
      currentPageOperations: state.currentPageOperations,

      // Session Methods
      initializeSession,
      updateSession,
      updateHeartbeat,
      invalidateSession,
      navigateToPage,
      startExperimentTimer,
      startQuestionnaireTimer,

      // Experiment Methods
      addExperimentTrial,
      getExperimentTrial,

      // Chart Methods
      addChartDataPoint,
      removeChartDataPoint,
      logChartOperation,

      // Text Response Methods
      updateTextResponse,
      startTextEdit,
      getTextResponse,

      // Questionnaire Methods
      updateQuestionnaireAnswer,
      getQuestionnaireAnswer,
      getQuestionnaireAnswersForPage,

      // Operations Methods
      logOperation,
      clearOperations,

      // Computed Values
      getCurrentNavigationMode,
      canNavigateNext,
    }),
    [
      state,
      initializeSession,
      updateSession,
      updateHeartbeat,
      invalidateSession,
      navigateToPage,
      startExperimentTimer,
      startQuestionnaireTimer,
      addExperimentTrial,
      getExperimentTrial,
      addChartDataPoint,
      removeChartDataPoint,
      logChartOperation,
      updateTextResponse,
      startTextEdit,
      getTextResponse,
      updateQuestionnaireAnswer,
      getQuestionnaireAnswer,
      getQuestionnaireAnswersForPage,
      logOperation,
      clearOperations,
      getCurrentNavigationMode,
      canNavigateNext,
    ]
  );

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}

// ============================================================================
// Custom Hook
// ============================================================================

/**
 * useTrackingContext - 自定义Hook用于访问TrackingContext
 *
 * @returns {Object} Context value
 * @throws {Error} 如果在Provider外部调用
 *
 * @example
 * const { session, addExperimentTrial, logOperation } = useTrackingContext();
 */
export function useTrackingContext() {
  const context = useContext(TrackingContext);

  if (!context) {
    throw new Error(
      '[useTrackingContext] Hook must be used within TrackingProvider. ' +
      'Make sure to wrap your component tree with <TrackingProvider>.'
    );
  }

  return context;
}

// ============================================================================
// Exports
// ============================================================================

export default TrackingContext;
