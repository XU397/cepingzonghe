/**
 * 四年级模块状态管理Context
 * 管理模块内的所有状态、用户操作记录和数据提交
 */

import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { moduleConfig } from '../moduleConfig';
import { submitPageData } from '../../../shared/services/dataLogger';
import { useAppContext } from '../../../context/AppContext';

// 从配置读取主任务时长（毫秒），转换为秒；默认40分钟
const MAIN_TASK_SECONDS = Math.round(((moduleConfig?.timers?.mainTask) || (40 * 60 * 1000)) / 1000);

// 初始状态
const initialState = {
  currentPage: 1,  // 当前页面：注意事项页
  
  // 全局40分钟倒计时状态
  globalTimer: {
    remainingTime: MAIN_TASK_SECONDS,     // 由配置驱动
    isActive: false,            // 计时器是否激活
    isCompleted: false,         // 计时器是否完成
    startTime: null,            // 计时器开始时间
  },
  
  // 注意事项页状态
  notices: {
    isTimerCompleted: false,    // 40秒倒计时是否完成
    isAcknowledged: false,      // 用户是否已确认阅读
    timerRemaining: 40,         // 剩余倒计时秒数
    pageEnterTime: null,        // 页面进入时间
  },
  
  // 问题识别状态 (新增 - Story 2.2)
  problemStatement: '',       // 用户输入的问题描述
  
  // 因素分析状态 (新增 - Story 2.3)
  relevantFactors: [],        // 用户选择的因素ID数组
  
  // 路线计算状态 (新增 - Story 2.4)
  routeCalculations: {
    route1_km: null,          // 路线1距离（公里）
    route5_km: null,          // 路线5距离（公里）
  },
  
  // 导航状态 (新增 - Story 2.2)
  currentNavigationStep: '1', // 当前高亮的导航项
  
  // 故事2.8 车票筛选与计价（跨页状态）
  ticketSelections: [], // P17 已选择的车次ID列表，例如 ['D175','C751']
  pricingData: {
    reason: '',
    formula: '',
    totalPrice: null,
  },
  
  // 操作记录列表
  operations: [],
  
  // 答案收集列表
  answers: [],
  
  // 全局状态
  authInfo: null,
  globalContext: null,
};

// Action 类型定义
const ACTION_TYPES = {
  SET_AUTH_INFO: 'SET_AUTH_INFO',
  SET_GLOBAL_CONTEXT: 'SET_GLOBAL_CONTEXT',
  
  // 全局倒计时相关Actions
  START_GLOBAL_TIMER: 'START_GLOBAL_TIMER',
  UPDATE_GLOBAL_TIMER: 'UPDATE_GLOBAL_TIMER',
  COMPLETE_GLOBAL_TIMER: 'COMPLETE_GLOBAL_TIMER',
  
  // 注意事项页相关Actions
  SET_TIMER_REMAINING: 'SET_TIMER_REMAINING',
  SET_TIMER_COMPLETED: 'SET_TIMER_COMPLETED',
  SET_ACKNOWLEDGED: 'SET_ACKNOWLEDGED',
  SET_PAGE_ENTER_TIME: 'SET_PAGE_ENTER_TIME',
  
  // 问题识别页相关Actions (新增 - Story 2.2)
  SET_PROBLEM_STATEMENT: 'SET_PROBLEM_STATEMENT',
  
  // 因素分析页相关Actions (新增 - Story 2.3)
  SET_RELEVANT_FACTORS: 'SET_RELEVANT_FACTORS',
  
  // 路线计算页相关Actions (新增 - Story 2.4)
  SET_ROUTE_CALCULATIONS: 'SET_ROUTE_CALCULATIONS',
  
  // 导航相关Actions (新增 - Story 2.2)
  SET_NAVIGATION_STEP: 'SET_NAVIGATION_STEP',
  
  // 数据记录Actions
  LOG_OPERATION: 'LOG_OPERATION',
  COLLECT_ANSWER: 'COLLECT_ANSWER',
  CLEAR_OPERATIONS: 'CLEAR_OPERATIONS',
  
  // 页面导航Actions
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  
  // 故事2.8 专用Actions
  SET_SELECTED_TRAINS: 'SET_SELECTED_TRAINS',
  SET_PRICING_DATA: 'SET_PRICING_DATA',
};

// Reducer 函数
const grade4Reducer = (state, action) => {
  switch (action.type) {
    case ACTION_TYPES.SET_AUTH_INFO:
      return { ...state, authInfo: action.payload };
      
    case ACTION_TYPES.SET_GLOBAL_CONTEXT:
      return { ...state, globalContext: action.payload };
      
    // 全局倒计时相关reducers
    case ACTION_TYPES.START_GLOBAL_TIMER:
      return {
        ...state,
        globalTimer: {
          ...state.globalTimer,
          isActive: true,
          startTime: action.payload,
          remainingTime: MAIN_TASK_SECONDS // 重置为配置的主任务时长
        }
      };
      
    case ACTION_TYPES.UPDATE_GLOBAL_TIMER:
      return {
        ...state,
        globalTimer: {
          ...state.globalTimer,
          remainingTime: action.payload
        }
      };
      
    case ACTION_TYPES.COMPLETE_GLOBAL_TIMER:
      return {
        ...state,
        globalTimer: {
          ...state.globalTimer,
          isActive: false,
          isCompleted: true,
          remainingTime: 0
        }
      };
      
    case ACTION_TYPES.SET_TIMER_REMAINING:
      return {
        ...state,
        notices: { ...state.notices, timerRemaining: action.payload }
      };
      
    case ACTION_TYPES.SET_TIMER_COMPLETED:
      return {
        ...state,
        notices: { ...state.notices, isTimerCompleted: action.payload }
      };
      
    case ACTION_TYPES.SET_ACKNOWLEDGED:
      return {
        ...state,
        notices: { ...state.notices, isAcknowledged: action.payload }
      };
      
    case ACTION_TYPES.SET_PAGE_ENTER_TIME:
      return {
        ...state,
        notices: { ...state.notices, pageEnterTime: action.payload }
      };
      
    // 问题识别页相关reducers (新增 - Story 2.2)
    case ACTION_TYPES.SET_PROBLEM_STATEMENT:
      return { ...state, problemStatement: action.payload };
      
    // 因素分析页相关reducers (新增 - Story 2.3)
    case ACTION_TYPES.SET_RELEVANT_FACTORS:
      return { ...state, relevantFactors: action.payload };
      
    // 路线计算页相关reducers (新增 - Story 2.4)
    case ACTION_TYPES.SET_ROUTE_CALCULATIONS:
      return { ...state, routeCalculations: { ...state.routeCalculations, ...action.payload } };
      
    // 导航相关reducers (新增 - Story 2.2)
    case ACTION_TYPES.SET_NAVIGATION_STEP:
      return { ...state, currentNavigationStep: action.payload };
      
    case ACTION_TYPES.LOG_OPERATION:
      return {
        ...state,
        operations: [...state.operations, action.payload]
      };
      
    case ACTION_TYPES.COLLECT_ANSWER:
      return {
        ...state,
        answers: [...state.answers, action.payload]
      };
      
    case ACTION_TYPES.CLEAR_OPERATIONS:
      return {
        ...state,
        operations: [],
        answers: []
      };
      
    case ACTION_TYPES.SET_CURRENT_PAGE:
      return { ...state, currentPage: action.payload };
      
    // 故事2.8：车票筛选
    case ACTION_TYPES.SET_SELECTED_TRAINS:
      return { ...state, ticketSelections: Array.isArray(action.payload) ? action.payload : [] };
      
    // 故事2.8：计价数据
    case ACTION_TYPES.SET_PRICING_DATA:
      return { ...state, pricingData: { ...state.pricingData, ...action.payload } };
      
    default:
      return state;
  }
};

// Context 创建
const Grade4Context = createContext();

// Provider 组件
export const Grade4Provider = ({ children, globalContext, authInfo, initialPageId }) => {
  // 尝试从AppContext获取认证信息作为最后的fallback
  const appContext = useAppContext();

  // 根据initialPageId计算初始页面号
  const getInitialPageNumber = (pageId) => {
    console.log(`[Grade4Context] 🔢 计算初始页面号，输入pageId: ${pageId}`);
    
    if (!pageId) {
      console.log(`[Grade4Context] ✅ 无pageId，使用默认页面: 1 (注意事项)`);
      return 1; // 默认注意事项页面
    }
    
    const pageMapping = {
      'notices': 1,
      'scenario-intro': 2,
      'problem-identification': 3,
      'factor-analysis': 4,
      'route-analysis': 5,
      'station-recommendation': 6,
      'timeline-planning-tutorial': 7,
      'user-solution-design': 8,
      'plan-optimization': 9,
      'ticket-filter': 10,
      'ticket-pricing': 11,
      'task-completion': 12,
    };
    
    const pageNumber = pageMapping[pageId] || 1;
    console.log(`[Grade4Context] ✅ 页面映射结果: ${pageId} → ${pageNumber}`);
    
    return pageNumber;
  };

  // 构造最终的认证信息 - 多级fallback
  const finalAuthInfo = authInfo || {
    batchCode: globalContext?.batchCode || appContext?.batchCode,
    examNo: globalContext?.examNo || appContext?.examNo,
    url: globalContext?.moduleUrl || appContext?.moduleUrl,
    pageNum: globalContext?.pageNum || appContext?.pageNum
  };

  console.log('[Grade4Context] 🔐 认证信息初始化', {
    hasAuthInfo: !!authInfo,
    hasGlobalContext: !!globalContext,
    hasAppContext: !!appContext,
    finalAuthInfo: {
      hasBatchCode: !!finalAuthInfo?.batchCode,
      hasExamNo: !!finalAuthInfo?.examNo,
      batchCode: finalAuthInfo?.batchCode,
      examNo: finalAuthInfo?.examNo
    },
    appContextData: appContext ? {
      batchCode: appContext.batchCode,
      examNo: appContext.examNo,
      moduleUrl: appContext.moduleUrl,
      pageNum: appContext.pageNum
    } : null
  });

  // 计算初始页面号
  const initialPageNumber = getInitialPageNumber(initialPageId);
  
  console.log(`[Grade4Context] 🚀 初始化4年级模块Provider`, {
    initialPageId,
    initialPageNumber,
    hasAuthInfo: !!authInfo,
    hasGlobalContext: !!globalContext,
    finalAuthInfo: finalAuthInfo ? {
      batchCode: finalAuthInfo.batchCode,
      examNo: finalAuthInfo.examNo
    } : null
  });

  const [state, dispatch] = useReducer(grade4Reducer, {
    ...initialState,
    currentPage: initialPageNumber, // 使用计算出的初始页面号
    authInfo: finalAuthInfo,
    globalContext
  });

  // 格式化时间戳
  const formatTimestamp = useCallback((date = new Date()) => {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }, []);

  // 记录操作
  const logOperation = useCallback(({
    targetElement,
    eventType,
    value = '',
    elementId = ''
  }) => {
    const operation = {
      code: Date.now(), // 使用时间戳避免依赖state
      targetElement,
      eventType,
      value,
      time: formatTimestamp(),
      elementId
    };

    dispatch({
      type: ACTION_TYPES.LOG_OPERATION,
      payload: operation
    });

    console.log(`[Grade4Context] 记录操作:`, operation);
  }, [formatTimestamp]); // 移除state.operations.length依赖

  // 页面恢复Effect
  useEffect(() => {
    if (initialPageId && initialPageId !== 'notices') {
      console.log(`[Grade4Context] 🔄 页面恢复: ${initialPageId} (页面${state.currentPage})`);
      
      // 设置页面进入时间（用于数据提交）
      const enterTime = new Date();
      dispatch({
        type: ACTION_TYPES.SET_PAGE_ENTER_TIME,
        payload: enterTime
      });
      
      // 记录页面恢复操作
      logOperation({
        targetElement: '页面',
        eventType: 'page_restore',
        value: `恢复到页面${state.currentPage} (${initialPageId})`
      });
    }
  }, [initialPageId, state.currentPage, logOperation]);

  // 全局倒计时相关Actions
  const startGlobalTimer = useCallback(() => {
    const startTime = Date.now();
    dispatch({
      type: ACTION_TYPES.START_GLOBAL_TIMER,
      payload: startTime
    });
    
    console.log(`[Grade4Context] 🕐 启动全局倒计时: ${Math.round(MAIN_TASK_SECONDS / 60)}分钟`);
    
    // 记录计时器启动操作
    logOperation({
      targetElement: '全局计时器',
      eventType: 'timer_start',
      value: `倒计时开始（${Math.round(MAIN_TASK_SECONDS / 60)}分钟）`
    });
  }, [logOperation]);

  const updateGlobalTimer = useCallback((remainingTime) => {
    dispatch({
      type: ACTION_TYPES.UPDATE_GLOBAL_TIMER,
      payload: remainingTime
    });
  }, []);

  const completeGlobalTimer = useCallback(() => {
    dispatch({
      type: ACTION_TYPES.COMPLETE_GLOBAL_TIMER
    });
    
    console.log('[Grade4Context] ⏰ 全局倒计时结束');
    
    // 记录计时器完成操作
    logOperation({
      targetElement: '全局计时器',
      eventType: 'timer_complete',
      value: '倒计时结束，任务时间耗尽'
    });
  }, [logOperation]);

  // 全局倒计时效果
  useEffect(() => {
    let intervalId = null;
    
    if (state.globalTimer.isActive && !state.globalTimer.isCompleted) {
      intervalId = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - state.globalTimer.startTime) / 1000);
        const remaining = Math.max(0, MAIN_TASK_SECONDS - elapsed);
        
        if (remaining > 0) {
          updateGlobalTimer(remaining);
        } else {
          completeGlobalTimer();
        }
      }, 1000);
    }
    
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [state.globalTimer.isActive, state.globalTimer.isCompleted, state.globalTimer.startTime, updateGlobalTimer, completeGlobalTimer]);

  // 收集答案
  const collectAnswer = useCallback(({
    targetElement,
    value,
    code = null
  }) => {
    const answer = {
      code: code || Date.now(), // 使用时间戳避免依赖state
      targetElement,
      value
    };

    dispatch({
      type: ACTION_TYPES.COLLECT_ANSWER,
      payload: answer
    });

    console.log(`[Grade4Context] 收集答案:`, answer);
  }, []); // 移除state.answers.length依赖

  // 注意事项页面特定Actions
  const noticesActions = {
    setTimerRemaining: (seconds) => {
      dispatch({
        type: ACTION_TYPES.SET_TIMER_REMAINING,
        payload: seconds
      });
    },
    
    setTimerCompleted: (completed) => {
      dispatch({
        type: ACTION_TYPES.SET_TIMER_COMPLETED,
        payload: completed
      });
      
      // 记录倒计时完成操作
      if (completed) {
        logOperation({
          targetElement: '40秒倒计时',
          eventType: 'timer_complete',
          value: '倒计时完成，复选框已激活'
        });
      }
    },
    
    setAcknowledged: (acknowledged) => {
      dispatch({
        type: ACTION_TYPES.SET_ACKNOWLEDGED,
        payload: acknowledged
      });
      
      // 记录确认操作
      logOperation({
        targetElement: '确认复选框',
        eventType: 'checkbox_select',
        value: acknowledged ? '用户确认已阅读注意事项' : '用户取消确认'
      });
      
      // 收集答案
      collectAnswer({
        targetElement: '注意事项确认',
        value: acknowledged ? '已确认' : '未确认'
      });
    },
    
    setPageEnterTime: (time) => {
      dispatch({
        type: ACTION_TYPES.SET_PAGE_ENTER_TIME,
        payload: time
      });
    }
  };

  // 页面导航
  const setCurrentPage = useCallback((pageNumber) => {
    dispatch({
      type: ACTION_TYPES.SET_CURRENT_PAGE,
      payload: pageNumber
    });
  }, []);

  // 问题识别页面Actions (新增 - Story 2.2)
  const setProblemStatement = useCallback((statement) => {
    dispatch({
      type: ACTION_TYPES.SET_PROBLEM_STATEMENT,
      payload: statement
    });
  }, []);

  // 因素分析页面Actions (新增 - Story 2.3)
  const setRelevantFactors = useCallback((factors) => {
    dispatch({
      type: ACTION_TYPES.SET_RELEVANT_FACTORS,
      payload: factors
    });
  }, []);

  // 路线计算页面Actions (新增 - Story 2.4)
  const setRouteCalculations = useCallback((calculations) => {
    dispatch({
      type: ACTION_TYPES.SET_ROUTE_CALCULATIONS,
      payload: calculations
    });
  }, []);

  // 导航状态管理 (新增 - Story 2.2)
  const setNavigationStep = useCallback((step) => {
    dispatch({
      type: ACTION_TYPES.SET_NAVIGATION_STEP,
      payload: step
    });
  }, []);

  // 故事2.8：设置已选车次
  const setSelectedTrains = useCallback((trainIds) => {
    dispatch({
      type: ACTION_TYPES.SET_SELECTED_TRAINS,
      payload: Array.isArray(trainIds) ? trainIds : []
    });
  }, []);

  // 故事2.8：保存计价数据
  const setPricingData = useCallback((data) => {
    dispatch({
      type: ACTION_TYPES.SET_PRICING_DATA,
      payload: data || {}
    });
  }, []);

  // 页面导航函数 - 修改为自动提交机制 (类似7年级模块)
  const navigateToPage = useCallback(async (pageId, options = {}) => {
    const { skipSubmit = false } = options;
    
    const pageMapping = {
      'notices': 1,
      'scenario-intro': 2,
      'problem-identification': 3,
      'factor-analysis': 4,
      'route-analysis': 5,
      'station-recommendation': 6,
      'timeline-planning-tutorial': 7,
      'user-solution-design': 8,
      'plan-optimization': 9,
      'ticket-filter': 10,
      'ticket-pricing': 11,
      'task-completion': 12,
    };
    
    const pageNumber = pageMapping[pageId] || 1;
    const currentPageNumber = state.currentPage;
    
    console.log(`[Grade4Context] 🔄 开始导航: 从页面${currentPageNumber} → 页面${pageNumber} (${pageId})`);
    
    let canNavigate = true;
    
    try {
      // 自动提交当前页面数据（除非明确跳过）；开发环境或缺少认证信息时跳过提交
      const isDev = import.meta && import.meta.env && import.meta.env.DEV;
      const hasAuthInfo = !!(state.authInfo?.batchCode && state.authInfo?.examNo);
      const shouldAttemptSubmit = !skipSubmit && currentPageNumber && state.operations.length > 0 && hasAuthInfo;
      if (shouldAttemptSubmit) {
        console.log(`[Grade4Context] 📤 自动提交当前页面数据，操作记录数量: ${state.operations.length}`);
        
        // 添加页面退出操作记录
        const exitOperation = {
          code: state.operations.length + 1,
          targetElement: '页面',
          eventType: 'page_exit',
          value: `离开页面${currentPageNumber}`,
          time: formatTimestamp()
        };
        
        // 创建包含退出记录的完整操作列表
        const completeOperationList = [...state.operations, exitOperation];
        
        // 提交数据
        const submissionSuccess = await submitPageDataInternal(completeOperationList);
        
        if (!submissionSuccess) {
          console.warn(`[Grade4Context] ❌ 页面数据提交失败，阻止导航`);
          canNavigate = false;
        } else {
          console.log(`[Grade4Context] ✅ 页面数据提交成功`);
        }
      }
      
      if (canNavigate) {
        // 记录导航操作
        logOperation({
          targetElement: '页面导航',
          eventType: 'page_navigate',
          value: `从页面${currentPageNumber}导航到页面${pageNumber}`
        });
        
        // 切换页面
        setCurrentPage(pageNumber);
        
        // 清空操作记录为新页面做准备
        dispatch({ type: ACTION_TYPES.CLEAR_OPERATIONS });
        
        // 记录新页面进入事件
        logOperation({
          targetElement: '页面',
          eventType: 'page_enter',
          value: `进入页面${pageNumber} (${pageId})`
        });
        
        console.log(`[Grade4Context] ✅ 成功导航到页面: ${pageId} (页面${pageNumber})`);
      }
    } catch (error) {
      console.error('[Grade4Context] ❌ 页面导航过程中出错:', error);
      throw error;
    }
  }, [state.currentPage, state.operations, formatTimestamp, setCurrentPage, logOperation]);

  // 内部数据提交函数 - 支持自定义操作列表
  const submitPageDataInternal = useCallback(async (customOperationList = null) => {
    if (!state.authInfo?.batchCode || !state.authInfo?.examNo) {
      console.error('[Grade4Context] ❌ 缺少认证信息，无法提交数据', {
        hasBatchCode: !!state.authInfo?.batchCode,
        hasExamNo: !!state.authInfo?.examNo,
        authInfo: state.authInfo
      });
      return false;
    }

    const currentTime = formatTimestamp();
    
    // 根据页面类型确定页面描述
    const getPageDescription = (pageNumber) => {
      const pages = moduleConfig?.pages || {};
      const match = Object.values(pages).find(p => Number(p.number) === Number(pageNumber));
      if (match) {
        const n = match.number ?? pageNumber;
        const d = match.desc ?? '';
        // 仅影响数据上报描述，不影响页面顶部标题
        return `第${n}页-${d}`.trim();
      }
      return `第${pageNumber}页`;
    };
    
    const markData = {
      pageNumber: state.currentPage.toString(),
      pageDesc: getPageDescription(state.currentPage),
      operationList: customOperationList || state.operations,
      answerList: state.answers,
      beginTime: state.notices.pageEnterTime || currentTime,
      endTime: currentTime,
      imgList: []
    };

    try {
      console.log('[Grade4Context] 📤 准备提交页面数据:', {
        pageNumber: markData.pageNumber,
        pageDesc: markData.pageDesc,
        operationCount: markData.operationList.length,
        answerCount: markData.answerList.length,
        batchCode: state.authInfo.batchCode,
        examNo: state.authInfo.examNo
      });

      await submitPageData(state.authInfo, markData);

      console.log('[Grade4Context] ✅ 页面数据提交成功');
      return true;
      
    } catch (error) {
      console.error('[Grade4Context] ❌ 页面数据提交失败:', error);
      
      // 检查是否是session过期错误
      if (error.isSessionExpired || error.code === 401 || (error.message && (
        error.message.includes('401') || 
        error.message.includes('session已过期') ||
        error.message.includes('请重新登录')
      ))) {
        console.log("[Grade4Context] 检测到session过期");
        alert('登录会话已过期，请重新登录以继续使用');
      } else {
        console.error("数据提交失败，可能是网络问题，请稍后重试");
      }
      
      return false;
    }
  }, [state, formatTimestamp]);

  // 提交当前页面数据 - 兼容性保留，使用内部函数
  const submitCurrentPageData = useCallback(async () => {
    const success = await submitPageDataInternal();
    if (success) {
      // 清空操作记录
      dispatch({ type: ACTION_TYPES.CLEAR_OPERATIONS });
    }
    return success;
  }, [submitPageDataInternal]);

  // Context 值
  const contextValue = {
    // 状态
    ...state,
    
    // 通用Actions
    logOperation,
    collectAnswer,
    setCurrentPage,
    submitCurrentPageData,
    
    // 全局倒计时Actions
    startGlobalTimer,
    updateGlobalTimer,
    completeGlobalTimer,
    
    // 注意事项页面专用Actions
    noticesActions,
    
    // 问题识别页面Actions (新增 - Story 2.2)
    setProblemStatement,
    
    // 因素分析页面Actions (新增 - Story 2.3)
    setRelevantFactors,
    
    // 路线计算页面Actions (新增 - Story 2.4)
    setRouteCalculations,
    
    // 导航相关Actions (新增 - Story 2.2)
    setNavigationStep,
    
    // 故事2.8 专用
    setSelectedTrains,
    setPricingData,
    navigateToPage,
    
    // 工具函数
    formatTimestamp,
  };

  return (
    <Grade4Context.Provider value={contextValue}>
      {children}
    </Grade4Context.Provider>
  );
};

// Hook for consuming context
export const useGrade4Context = () => {
  const context = useContext(Grade4Context);
  if (!context) {
    throw new Error('useGrade4Context must be used within a Grade4Provider');
  }
  return context;
};

export default Grade4Context;
