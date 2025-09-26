import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { pageInfoMapping, TOTAL_USER_STEPS } from '../utils/pageMappings'; // 假设这个工具函数存在且路径正确
import * as apiService from '../services/apiService'; // 假设API服务存在且路径正确
import { handlePageTransition } from '../utils/pageTransitionUtils';
import { useBrowserCloseHandler } from '../hooks/useBrowserCloseHandler';

/**
 * 应用全局上下文
 * 用于管理全局状态，如当前页面ID、剩余时间、任务开始时间等
 */
const AppContext = createContext();

/**
 * 总任务时长（秒）
 * 40分钟 = 2400秒
 */
const TOTAL_TASK_DURATION = 40 * 60;

// 辅助函数：格式化日期时间为 "YYYY-MM-DD HH:mm:ss"
const internalFormatDateTime = (date) => {
  if (!date) return '';
  const d = new Date(date);
  const pad = (num) => String(num).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

/**
 * 应用全局上下文提供者组件
 * @param {Object} props - 组件属性
 * @param {React.ReactNode} props.children - 子组件
 */
export const AppProvider = ({ children }) => {
  // 当前页面ID，默认为登录页
  const [currentPageId, setCurrentPageIdInternal] = useState('Page_Login');
  
  // 剩余时间（秒）
  const [remainingTime, setRemainingTime] = useState(TOTAL_TASK_DURATION);
  
  // 任务开始时间
  const [taskStartTime, setTaskStartTime] = useState(null);
  
  // 测评批次号
  const [batchCode, setBatchCode] = useState('');
  
  // 学生考号
  const [examNo, setExamNo] = useState('');
  
  // 用户完成的页面编号（从后端获取）
  const [pageNum, setPageNum] = useState(null);
  
  // 当前页面数据
  const [currentPageData, setCurrentPageData] = useState({
    operationList: [],
    answerList: []
  });
  
  // 页面进入时间
  const [pageEnterTime, setPageEnterTime] = useState(null);
  
  // 登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // 认证状态 - 新增
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // 认证令牌 - 新增
  const [authToken, setAuthToken] = useState(null);
  
  // 当前用户信息 - 新增
  const [currentUser, setCurrentUser] = useState(null);

  // 模块URL状态 - 用于多模块路由
  const [moduleUrl, setModuleUrl] = useState('');

  // 任务是否已结束（例如，通过P19完成或超时）
  const [isTaskFinished, setIsTaskFinished] = useState(false);

  // 标记时间是否已耗尽
  const [isTimeUp, setIsTimeUp] = useState(false);

  // 问卷相关状态
  const [questionnaireStartTime, setQuestionnaireStartTime] = useState(null);
  const [questionnaireRemainingTime, setQuestionnaireRemainingTime] = useState(10 * 60); // 10分钟
  const [isQuestionnaireStarted, setIsQuestionnaireStarted] = useState(false);
  const [isQuestionnaireTimeUp, setIsQuestionnaireTimeUp] = useState(false);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState({});
  const [isQuestionnaireCompleted, setIsQuestionnaireCompleted] = useState(false); // 新增：问卷是否已完成

  // 计算当前步骤号
  const currentStepNumber = pageInfoMapping[currentPageId]?.stepNumber || 0;
  const totalUserSteps = TOTAL_USER_STEPS;

  const formatDateTime = useCallback((date) => {
    return internalFormatDateTime(date);
  }, []);

  // 页面加载时从localStorage恢复状态
  useEffect(() => {
    const savedModuleUrl = localStorage.getItem('moduleUrl');
    const savedModulePageNum = localStorage.getItem('modulePageNum');
    const savedBatchCode = localStorage.getItem('batchCode');
    const savedExamNo = localStorage.getItem('examNo');
    
    console.log('[AppContext] 🔄 从localStorage恢复状态', {
      moduleUrl: savedModuleUrl,
      modulePageNum: savedModulePageNum,
      batchCode: savedBatchCode,
      examNo: savedExamNo
    });
    
    if (savedModuleUrl) {
      setModuleUrl(savedModuleUrl);
    }
    
    if (savedModulePageNum) {
      setPageNum(savedModulePageNum);
    }
    
    if (savedBatchCode) {
      setBatchCode(savedBatchCode);
    }
    
    if (savedExamNo) {
      setExamNo(savedExamNo);
    }
  }, []);

  /**
   * 记录用户交互操作
   * @param {object} operationData - 操作数据
   * @param {string} operationData.targetElement - 交互的UI元素描述
   * @param {string} operationData.eventType - 事件类型 (e.g., 'click', 'input', '查看资料')
   * @param {string} [operationData.value] - 相关值 (e.g., 输入内容)
   * @param {string} [operationData.elementId] - 元素ID (可选, 若targetElement不足以描述时使用)
   * @param {string} [operationData.pageId] - 操作发生的页面ID (可选, 默认为当前页)
   */
  const logOperation = useCallback(({ targetElement, eventType, value = '', elementId = null, pageId: operationPageId }) => {
    const now = new Date();
    
    // 直接获取当前页面ID，避免依赖问题
    const finalPageId = operationPageId || currentPageId;
    const finalTargetElement = targetElement || elementId;
    
    console.log(`[AppContext.logOperation] 记录操作:`, {
      targetElement: finalTargetElement,
      eventType,
      value,
      pageId: finalPageId,
      currentPageId: currentPageId
    });
    
    setCurrentPageData(prevData => {
      // 🔧 防重复逻辑：检查是否存在相同的操作记录
      const existingOperations = prevData.operationList || [];
      const isDuplicate = existingOperations.some(op => {
        const isSameOperation = (
          op.targetElement === finalTargetElement &&
          op.eventType === eventType &&
          op.value === value
        );
        
        // 对于页面进入事件，进行额外的时间检查（1秒内的重复认为是React严格模式导致的）
        if (isSameOperation && eventType === 'page_enter') {
          const timeDiff = Math.abs(now.getTime() - new Date(op.time.replace(/\-/g, '/')).getTime());
          return timeDiff < 1000; // 1秒内的重复page_enter事件
        }
        
        return isSameOperation;
      });
      
      if (isDuplicate) {
        console.log(`[AppContext.logOperation] ⚠️ 检测到重复操作，跳过记录:`, {
          targetElement: finalTargetElement,
          eventType,
          value
        });
        return prevData; // 返回原数据，不添加重复记录
      }
      
      const newOperation = {
        code: (existingOperations.length || 0) + 1, // 确保在当前页面数据中唯一
        targetElement: finalTargetElement,
        eventType,
        value,
        time: internalFormatDateTime(now), // 直接使用内部函数避免依赖
        pageId: finalPageId, 
      };
      
      const newOperationList = [...existingOperations, newOperation];
      
      console.log(`[AppContext.logOperation] 操作记录已添加，当前operationList长度:`, newOperationList.length);
      console.log(`[AppContext.logOperation] 最新操作:`, newOperation);
      
      return {
        ...prevData,
        operationList: newOperationList,
      };
    });
  }, []); // 完全移除依赖，使其稳定

  /**
   * 收集用户答案
   * @param {object} answerData - 答案数据
   * @param {string} answerData.targetElement - 答案对应的UI元素或问题描述
   * @param {*} answerData.value - 答案的值
   * @param {number} [answerData.code] - 答案的编号 (可选, 若不提供则自动生成)
   * @param {string} [answerData.elementId] - 元素ID (可选, 若targetElement不足以描述时使用)
   */
  const collectAnswer = useCallback(({ targetElement, value, code = null, elementId = null }) => {
    setCurrentPageData(prevData => {
      const answerCode = code || (prevData.answerList?.length || 0) + 1;
      const existingAnswerIndex = prevData.answerList?.findIndex(a => a.targetElement === (targetElement || elementId));
      const newAnswer = {
        code: answerCode,
        targetElement: targetElement || elementId,
        value,
        // time: formatDateTime(now), // 根据规范，answerList没有time字段，注释掉
      };

      let newAnswerList;
      if (existingAnswerIndex !== -1 && existingAnswerIndex !== undefined) {
        // 更新现有答案
        newAnswerList = [...(prevData.answerList || [])];
        newAnswerList[existingAnswerIndex] = { ...newAnswerList[existingAnswerIndex], ...newAnswer}; //保留旧code，更新value
      } else {
        // 添加新答案
        newAnswerList = [...(prevData.answerList || []), newAnswer];
      }
      
      return {
        ...prevData,
        answerList: newAnswerList,
      };
    });
  }, []); // 移除所有依赖，因为使用的是prevData

  /**
   * 准备当前页面的提交数据 (mark 对象)
   * @returns {object | null} 包含当前页面所有待提交数据的 mark 对象，或在信息不全时返回 null
   */
  const preparePageSubmissionData = useCallback(() => {
    const pageDetails = pageInfoMapping[currentPageId];
    if (!pageDetails) {
      console.error(`[DataLoggerContext] preparePageSubmissionData: Cannot find page details for ${currentPageId}`);
      return null;
    }

    const beginTimeFormatted = formatDateTime(pageEnterTime);
    const endTimeFormatted = formatDateTime(new Date());

    if (!beginTimeFormatted) {
        console.warn(`[DataLoggerContext] preparePageSubmissionData: pageEnterTime for ${currentPageId} is not set or invalid.`);
        // 可以在这里决定是否阻止提交，或者用一个标记值
    }

    return {
      pageNumber: pageDetails.number,
      pageDesc: pageDetails.desc,
      operationList: currentPageData.operationList || [],
      answerList: currentPageData.answerList || [],
      beginTime: beginTimeFormatted,
      endTime: endTimeFormatted,
      imgList: [], // 通常为空
    };
  }, [currentPageId, currentPageData, pageEnterTime, formatDateTime]);

  /**
   * 处理退出登录
   * 清除认证状态和用户信息
   */
  const handleLogout = useCallback(() => {
    console.log('[AppContext] 执行登出操作...');
    
    // 清除认证状态
    setIsAuthenticated(false);
    setIsLoggedIn(false);
    setAuthToken(null);
    setCurrentUser(null);
    
    // 清除任务相关状态
    setBatchCode('');
    setExamNo('');
    setPageNum(null);
    setTaskStartTime(null);
    setRemainingTime(TOTAL_TASK_DURATION);
    setCurrentPageIdInternal('Page_Login');
    setIsTaskFinished(false);
    setIsTimeUp(false);
    setCurrentPageData({ operationList: [], answerList: [] });
    setPageEnterTime(null);
    
    // 清除问卷相关状态
    setIsQuestionnaireCompleted(false);
    setQuestionnaireAnswers({});
    setIsQuestionnaireStarted(false);
    setIsQuestionnaireTimeUp(false);
    setQuestionnaireRemainingTime(10 * 60);
    setQuestionnaireStartTime(null);
    
    // 清除本地存储 - 完整清除所有缓存数据
    const keysToRemove = [
      'isAuthenticated',
      'currentUser',
      'batchCode',
      'examNo',
      'pageNum',
      'isTaskFinished',
      'taskStartTime',
      'remainingTime',
      'currentPageId',
      'isQuestionnaireCompleted',
      'questionnaireAnswers',
      'isQuestionnaireStarted',
      'questionnaireStartTime',
      'questionnaireRemainingTime',
      'moduleUrl', // 清除模块URL状态
      'lastUserId', // 也清除保存的用户名（用于session过期自动填充）
      'lastSessionEndTime', // 清除会话结束时间
      'shouldClearOnNextSession', // 清除旧的缓存清除标志
      'cacheCleared', // 清除旧的缓存清除标志
      'lastClearTime' // 清除旧的缓存清除标志
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log('[AppContext] 登出完成，所有状态和缓存已清除');
  }, []);

  /**
   * 清除所有缓存数据的函数
   * 用于浏览器关闭时的清理操作
   */
  const clearAllCache = useCallback(() => {
    console.log('[AppContext] 清除所有缓存数据...');
    
    // 调用现有的登出逻辑来清理状态
    handleLogout();
    
    // 额外清理一些可能的残留数据
    try {
      // 清除所有可能的localStorage键
      const additionalKeys = [
        'cacheCleared',
        'lastClearTime',
        'pageHiddenTime'
      ];
      
      additionalKeys.forEach(key => {
        localStorage.removeItem(key);
      });
      
      // 清除sessionStorage
      sessionStorage.clear();
      
      console.log('[AppContext] 所有缓存清除完成');
    } catch (error) {
      console.error('[AppContext] 清除缓存时出错:', error);
    }
  }, [handleLogout]);

  // 使用浏览器关闭监听Hook
  const { clearCache } = useBrowserCloseHandler(clearAllCache);

  /**
   * 使用指定的认证信息提交页面数据的内部函数
   * @param {string} submitBatchCode - 批次号
   * @param {string} submitExamNo - 考号
   * @param {object} [customData] - 可选的自定义页面数据，如果不提供则使用当前状态数据
   * @returns {Promise<boolean>} 提交是否成功
   */
  const submitPageDataWithInfo = useCallback(async (submitBatchCode, submitExamNo, customData = null) => {
    let markData;
    
    if (customData) {
      // 使用传入的自定义数据构建提交数据
      const pageDetails = pageInfoMapping[currentPageId] || { number: '0', desc: '未知页面' };
      
      markData = {
        pageNumber: pageDetails.number,
        pageDesc: pageDetails.desc,
        operationList: customData.operationList || [],
        answerList: customData.answerList || [],
        beginTime: pageEnterTime ? formatDateTime(pageEnterTime) : formatDateTime(new Date()),
        endTime: formatDateTime(new Date()),
        imgList: [], // 通常为空
      };
    } else {
      // 使用当前状态数据
      markData = preparePageSubmissionData();
    }
    
    if (!markData) {
      console.error("[AppContext] submitPageData: Failed to prepare submission data.");
      return false;
    }

    const payload = {
      batchCode: submitBatchCode,
      examNo: submitExamNo,
      mark: markData,
    };

    try {
      logOperation({ 
        targetElement: '系统操作',
        eventType: '发起页面数据提交',
        value: `Page: ${currentPageId} (${markData.pageDesc})`
      });
      
      console.log("[AppContext] 正在提交数据:", {
        pageId: currentPageId,
        batchCode: submitBatchCode,
        examNo: submitExamNo,
        markData: markData
      });
      
      console.log("[AppContext] operationList内容详情:", markData.operationList);
      console.log("[AppContext] operationList长度:", markData.operationList?.length || 0);
      console.log("[AppContext] answerList内容详情:", markData.answerList);
      console.log("[AppContext] answerList长度:", markData.answerList?.length || 0);
      
      const response = await apiService.submitPageMarkData(payload);
      
      console.log("[AppContext] 提交响应:", response);
      console.log("[AppContext] 🔍 刚才提交的operationList详情:", markData.operationList);
      console.log("[AppContext] 🔍 operationList中的事件类型:", markData.operationList.map(op => `${op.targetElement} → ${op.eventType}`));
      
      logOperation({ 
        targetElement: '系统操作',
        eventType: '页面数据提交成功',
        value: `Page: ${currentPageId}, Response: ${JSON.stringify(response)}`
      });
      
      return true;
    } catch (error) {
      console.error("[AppContext] submitPageData: Error submitting page data:", error);
      
      // 检查是否是session过期错误
      if (error.isSessionExpired || error.code === 401 || (error.message && (
        error.message.includes('401') || 
        error.message.includes('session已过期') ||
        error.message.includes('请重新登录')
      ))) {
        console.log("[AppContext] 检测到session过期，清除登录状态");
        
        logOperation({ 
          targetElement: '系统操作',
          eventType: '会话过期',
          value: `Page: ${currentPageId}, Error: ${error.message}`
        });
        
        // 清除认证状态但保留页面数据
        setIsAuthenticated(false);
        setIsLoggedIn(false);
        
        // 提示用户session过期
        alert('登录会话已过期，请重新登录以继续使用');
        
        // 跳转到登录页，但不清除任务数据
        setCurrentPageIdInternal('Page_Login');
        
        return false;
      }
      
      logOperation({ 
        targetElement: '系统操作',
        eventType: '页面数据提交失败',
        value: `Page: ${currentPageId}, Error: ${error.message}`
      });
      
      // 其他类型的错误，显示友好提示
      console.error("数据提交失败，可能是网络问题，请稍后重试");
      
      return false;
    }
  }, [preparePageSubmissionData, logOperation, currentPageId, setIsAuthenticated, setIsLoggedIn, setCurrentPageIdInternal, pageEnterTime, formatDateTime]);

  /**
   * 提交当前页面的数据
   * @async
   * @returns {Promise<boolean>} 提交成功返回 true，失败返回 false
   */
  const submitPageData = useCallback(async (options = {}) => {
    const { isFromButton = false } = options; // New option parameter

    // Block automatic submission for Page_19_Task_Completion
    if (currentPageId === 'Page_19_Task_Completion' && !isFromButton) {
      console.warn("[AppContext] submitPageData: Auto-submission for Page_19_Task_Completion was blocked. This call was not from the P19 button.");
      // Return true to pretend submission happened, to avoid blocking calling logic (like navigateToPage)
      // but the actual data won't be sent. The P19 button click will do the real submission.
      return true; 
    }

    // 检查登录状态和必要的认证信息
    // 首先尝试从当前状态获取，如果没有则从localStorage获取
    const currentBatchCode = batchCode || localStorage.getItem('batchCode');
    const currentExamNo = examNo || localStorage.getItem('examNo');
    const currentAuthStatus = (isLoggedIn && isAuthenticated) || localStorage.getItem('isAuthenticated') === 'true';
    
    if (!currentAuthStatus || !currentBatchCode || !currentExamNo) {
      console.error("[AppContext] submitPageData: Missing login info or not authenticated.", {
        isLoggedIn,
        isAuthenticated,
        currentAuthStatus,
        hasBatchCode: !!currentBatchCode,
        hasExamNo: !!currentExamNo
      });
      
      // 无法恢复认证信息，引导用户重新登录
      console.error("[AppContext] 无法恢复认证信息，需要重新登录");
      alert('登录状态已失效，请重新登录');
      handleLogout();
      return false;
    }
    
    // 如果当前状态变量为空但localStorage有值，同步状态
    if (!batchCode && currentBatchCode) {
      setBatchCode(currentBatchCode);
    }
    if (!examNo && currentExamNo) {
      setExamNo(currentExamNo);
    }
    if ((!isLoggedIn || !isAuthenticated) && currentAuthStatus) {
      setIsAuthenticated(true);
      setIsLoggedIn(true);
    }
    
    return await submitPageDataWithInfo(currentBatchCode, currentExamNo);
  }, [isLoggedIn, isAuthenticated, batchCode, examNo, handleLogout, submitPageDataWithInfo]);

  // 从持久化存储中恢复数据
  useEffect(() => {
    console.log('[AppContext] 开始初始化，检查状态恢复...');
    
    console.log('[AppContext] 状态检查结果:', {
      localStorage_keys: Object.keys(localStorage),
      sessionStorage_keys: Object.keys(sessionStorage),
      sessionStartTime: sessionStorage.getItem('sessionStartTime'),
      lastSessionEndTime: localStorage.getItem('lastSessionEndTime'),
      isAuthenticated: localStorage.getItem('isAuthenticated'),
      currentPageId: localStorage.getItem('currentPageId')
    });
    
    // 移除旧的缓存清除相关逻辑
    // 现在默认总是尝试恢复用户状态
    console.log('[AppContext] 💾 启用状态持久化模式，尝试恢复用户状态');
    
    // 清理旧的缓存清除标志（向后兼容）
    const shouldClearCache = sessionStorage.getItem('shouldClearCache');
    const cacheCleared = localStorage.getItem('cacheCleared');
    const shouldClearOnNextSession = localStorage.getItem('shouldClearOnNextSession');
    
    if (shouldClearCache === 'true' || cacheCleared === 'true' || shouldClearOnNextSession === 'true') {
      console.log('[AppContext] 清理旧的缓存清除标志...');
      sessionStorage.removeItem('shouldClearCache');
      localStorage.removeItem('cacheCleared');
      localStorage.removeItem('lastClearTime');
      localStorage.removeItem('shouldClearOnNextSession');
    }

    // 新的统一认证状态恢复逻辑
    try {
      const savedAuth = localStorage.getItem('isAuthenticated');
      const savedUser = localStorage.getItem('currentUser');
      const savedBatchCode = localStorage.getItem('batchCode');
      const savedExamNo = localStorage.getItem('examNo');
      const storedTaskStartTime = localStorage.getItem('taskStartTime');
      const storedRemainingTime = localStorage.getItem('remainingTime');
      const storedCurrentPageId = localStorage.getItem('currentPageId');
      const storedIsTaskFinished = localStorage.getItem('isTaskFinished') === 'true';
      // 恢复问卷完成状态
      const storedIsQuestionnaireCompleted = localStorage.getItem('isQuestionnaireCompleted') === 'true';
      const storedIsQuestionnaireStarted = localStorage.getItem('isQuestionnaireStarted') === 'true';
      const storedQuestionnaireStartTime = localStorage.getItem('questionnaireStartTime');
      const storedQuestionnaireRemainingTime = localStorage.getItem('questionnaireRemainingTime');
      // 恢复模块URL状态
      const storedModuleUrl = localStorage.getItem('moduleUrl');
      
      // 恢复问卷相关状态
      if (storedIsQuestionnaireCompleted) {
        setIsQuestionnaireCompleted(true);
        console.log('[AppContext] 从本地存储恢复问卷完成状态');
      } else if (storedIsQuestionnaireStarted && storedQuestionnaireStartTime && storedQuestionnaireRemainingTime) {
        // 恢复问卷计时器状态
        const questionnaireStartTimeObj = new Date(storedQuestionnaireStartTime);
        const parsedQuestionnaireRemainingTime = parseInt(storedQuestionnaireRemainingTime, 10);
        
        // 计算问卷实际剩余时间
        const now = new Date().getTime();
        const lastSessionEndTime = localStorage.getItem('lastSessionEndTime');
        
        let actualQuestionnaireRemainingTime;
        
        if (lastSessionEndTime) {
          const sessionEndTimeMillis = parseInt(lastSessionEndTime);
          const offlineTimeSeconds = Math.floor((now - sessionEndTimeMillis) / 1000);
          
          console.log('[AppContext] 计算问卷倒计时恢复:', {
            storedQuestionnaireRemainingTime: parsedQuestionnaireRemainingTime,
            offlineTimeSeconds,
            lastSessionEndTime: new Date(sessionEndTimeMillis).toLocaleString()
          });
          
          actualQuestionnaireRemainingTime = Math.max(0, parsedQuestionnaireRemainingTime - offlineTimeSeconds);
        } else {
          // 使用传统的开始时间计算方法
          const questionnaireStartTimeMillis = questionnaireStartTimeObj.getTime();
          const expectedQuestionnaireEndTimeMillis = questionnaireStartTimeMillis + 10 * 60 * 1000; // 10分钟
          actualQuestionnaireRemainingTime = Math.max(0, Math.floor((expectedQuestionnaireEndTimeMillis - now) / 1000));
        }
        
        if (actualQuestionnaireRemainingTime <= 0) {
          setQuestionnaireRemainingTime(0);
          setIsQuestionnaireTimeUp(true);
          console.log('[AppContext] 🕐 问卷时间已到，倒计时为0');
        } else {
          setQuestionnaireRemainingTime(actualQuestionnaireRemainingTime);
          setIsQuestionnaireStarted(true);
          setQuestionnaireStartTime(questionnaireStartTimeObj);
          console.log('[AppContext] ⏰ 恢复问卷倒计时:', actualQuestionnaireRemainingTime, '秒');
        }
      }

      // 检查是否有有效的认证信息
      if (savedAuth === 'true' && savedUser && savedBatchCode && savedExamNo) {
        const userData = JSON.parse(savedUser);
        
        setIsAuthenticated(true);
        setIsLoggedIn(true);
        setCurrentUser(userData);
        setBatchCode(savedBatchCode);
        setExamNo(savedExamNo);
        
        // 恢复模块URL状态，提供默认值
        if (storedModuleUrl) {
          setModuleUrl(storedModuleUrl);
          console.log('[AppContext] 从localStorage恢复moduleUrl:', storedModuleUrl);
        } else {
          // 如果没有存储的URL，使用默认值（四年级模块）
          const defaultUrl = '/four-grade';
          setModuleUrl(defaultUrl);
          localStorage.setItem('moduleUrl', defaultUrl);
          console.log('[AppContext] 使用默认moduleUrl:', defaultUrl);
        }
        
        console.log('从本地存储恢复登录状态:', userData);

        if (storedIsTaskFinished) {
          // setIsTaskFinished(true); // <--- TEMPORARILY COMMENT OUT
          console.log("[AppContext] Initial load: storedIsTaskFinished was true, setIsTaskFinished(true) SKIPPED for testing.");
          if (storedCurrentPageId) setCurrentPageIdInternal(storedCurrentPageId);
          else setCurrentPageIdInternal('Page_19_Task_Completion');
          // return; // We might still want to proceed with timer logic if task wasn't actually finished by P19 button click
        }

        // 恢复任务相关状态
        if (storedTaskStartTime && storedRemainingTime) {
          const parsedRemainingTime = parseInt(storedRemainingTime, 10);
          const taskStartTimeObj = new Date(storedTaskStartTime);
          
          // 计算实际剩余时间，考虑浏览器关闭期间的时间流逝
          const now = new Date().getTime();
          const lastSessionEndTime = localStorage.getItem('lastSessionEndTime');
          
          let actualRemainingTime;
          
          if (lastSessionEndTime) {
            // 如果有记录的会话结束时间，计算离线期间流逝的时间
            const sessionEndTimeMillis = parseInt(lastSessionEndTime);
            const offlineTimeSeconds = Math.floor((now - sessionEndTimeMillis) / 1000);
            
            console.log('[AppContext] 计算倒计时恢复:', {
              storedRemainingTime: parsedRemainingTime,
              offlineTimeSeconds,
              lastSessionEndTime: new Date(sessionEndTimeMillis).toLocaleString(),
              currentTime: new Date(now).toLocaleString()
            });
            
            // 从存储的剩余时间中减去离线时间
            actualRemainingTime = Math.max(0, parsedRemainingTime - offlineTimeSeconds);
          } else {
            // 如果没有会话结束时间，使用传统的开始时间计算方法
            const startTimeMillis = taskStartTimeObj.getTime();
            const expectedEndTimeMillis = startTimeMillis + TOTAL_TASK_DURATION * 1000;
            actualRemainingTime = Math.max(0, Math.floor((expectedEndTimeMillis - now) / 1000));
          }
          
          if (actualRemainingTime <= 0) {
            setRemainingTime(0);
            setIsTimeUp(true);
            console.log('[AppContext] 🕐 任务时间已到，倒计时为0');
          } else {
            setRemainingTime(actualRemainingTime);
            console.log('[AppContext] ⏰ 恢复倒计时:', actualRemainingTime, '秒');
          }
          
          setTaskStartTime(taskStartTimeObj);
          
          if (storedCurrentPageId && storedCurrentPageId !== 'Page_00_Start') {
            setCurrentPageIdInternal(storedCurrentPageId);
            setPageEnterTime(new Date()); // 重新进入页面的时间
          }
        } else if (storedCurrentPageId && storedCurrentPageId !== 'Page_00_Start') {
          // 有页面ID但没有计时器信息，说明可能在P0页面
          setCurrentPageIdInternal(storedCurrentPageId);
        } else {
          // 刚登录，还没开始任务
          setCurrentPageIdInternal('Page_01_Precautions');
        }
      } else {
        // 没有有效的认证信息，确保跳转到登录页
        setIsAuthenticated(false);
        setIsLoggedIn(false);
        setCurrentPageIdInternal('Page_Login');
        
        // 清除可能损坏的本地存储数据
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('batchCode');
        localStorage.removeItem('examNo');
      }
    } catch (error) {
      console.error('恢复登录状态时出错:', error);
      // 出错时清除所有数据并跳转到登录页
      handleLogout();
    }
  }, []); // 只在组件挂载时执行一次

  // This useEffect is responsible for managing localStorage items when isTaskFinished changes,
  // and for determining the correct localStorage.currentPageId when the task is finished.
  // It should be the primary handler for localStorage.currentPageId when isTaskFinished is true.
  // Dependencies should be [isTaskFinished, currentPageId, pageInfoMapping]
  useEffect(() => {
    if (isTaskFinished) {
      localStorage.setItem('isTaskFinished', 'true');
      localStorage.removeItem('taskStartTime');
      localStorage.removeItem('remainingTime');

      const pageDetails = pageInfoMapping[currentPageId];
      const isQuestionnairePage = pageDetails && pageDetails.number >= 20 && pageDetails.number <= 28;

      if (!isQuestionnairePage) {
        // Task is finished, but we are NOT on a questionnaire page.
        // This could be P19 itself, or an earlier page if task ended due to timeout.
        // localStorage should point to Page_19_Task_Completion.
        localStorage.setItem('currentPageId', 'Page_19_Task_Completion');
      }
      // 问卷页面的currentPageId持久化由另一个useEffect处理
    } else {
      // Task is not finished. Remove the task finished flag.
      // The persistence of currentPageId for an active task is handled by another useEffect.
      localStorage.removeItem('isTaskFinished');
    }
  }, [isTaskFinished, currentPageId, pageInfoMapping]);

  // 持久化当前页面ID
  useEffect(() => {
    // 持久化currentPageId的条件：
    // 1. 用户已登录
    // 2. 不是登录页
    // 3. 任务未完成 OR （任务已完成且当前是问卷页面）
    // 这确保了问卷阶段的页面切换也能被正确持久化
    const pageDetails = pageInfoMapping[currentPageId];
    const isQuestionnairePage = pageDetails && pageDetails.number >= 20 && pageDetails.number <= 28;
    
    if (isLoggedIn && currentPageId !== 'Page_Login' && 
        (!isTaskFinished || (isTaskFinished && isQuestionnairePage))) {
      localStorage.setItem('currentPageId', currentPageId);
      console.log(`[AppContext] 持久化当前页面ID: ${currentPageId}`);
    }
  }, [currentPageId, isLoggedIn, isTaskFinished, pageInfoMapping]);

  // 处理计时器
  useEffect(() => {
    console.log('[AppContext] 计时器useEffect触发，当前状态:', {
      isLoggedIn,
      taskStartTime: taskStartTime ? taskStartTime.toISOString() : null,
      remainingTime,
      isTaskFinished,
      isTimeUp,
      currentPageId
    });
    
    let timerId;
    // Only start timer if logged in, task has started, and not finished, and time is not already up
    if (isLoggedIn && taskStartTime && remainingTime > 0 && !isTaskFinished && !isTimeUp) {
      console.log('[AppContext] 🎯 计时器启动条件满足，开始倒计时');
      
      // 保存当前的pageId，避免闭包问题
      const currentPage = currentPageId;
      
      timerId = setInterval(() => {
        setRemainingTime(prevTime => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            clearInterval(timerId);
            setIsTimeUp(true); // Set time up flag
            
            // 直接调用logOperation，不从依赖中获取
            try {
              logOperation({ pageId: currentPage, targetElement: '系统事件', eventType: '任务超时' });
            } catch (error) {
              console.error('[AppContext] 记录超时操作失败:', error);
            }
            
            // 清除持久化的计时器数据
            localStorage.removeItem('remainingTime');
            console.log('[AppContext] ⏰ 测评计时器到达0，任务超时，准备跳转到任务完成页面');
            
            // 测评倒计时为0时，跳转到任务完成页面（P19）
            setTimeout(() => {
              try {
                console.log('[AppContext] 🔄 测评超时，自动跳转到P19任务完成页面');
                // 直接使用navigate函数跳转，不使用依赖
                setCurrentPageIdInternal('Page_19_Task_Completion');
                setPageEnterTime(new Date());
                setCurrentPageData({ operationList: [], answerList: [] });
              } catch (error) {
                console.error('[AppContext] 超时跳转失败:', error);
              }
            }, 1000); // 延迟1秒执行跳转，确保状态更新完成
            
            return 0;
          }
          // 持久化剩余时间（每5秒更新一次以减少写入频率）
          if (newTime % 5 === 0) {
            localStorage.setItem('remainingTime', newTime.toString());
          }
          return newTime;
        });
      }, 1000);
    } else {
      console.log('[AppContext] ❌ 计时器启动条件不满足:', {
        isLoggedIn: isLoggedIn,
        hasTaskStartTime: !!taskStartTime,
        remainingTimePositive: remainingTime > 0,
        taskNotFinished: !isTaskFinished,
        timeNotUp: !isTimeUp
      });
      
      if (remainingTime <= 0 && !isTimeUp && taskStartTime) {
        // This condition handles if the time was already 0 or less when component mounted
        // and timer didn't start, but should be marked as up.
        setIsTimeUp(true);
        console.log('[AppContext] ⏰ 剩余时间已到0，标记时间结束');
      }
    }

    return () => {
      if (timerId) {
        clearInterval(timerId);
        console.log('[AppContext] 🛑 计时器已清除');
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [isLoggedIn, taskStartTime, isTaskFinished, isTimeUp]);

  // 持久化任务开始时间和剩余时间
  useEffect(() => {
    if (taskStartTime && remainingTime > 0 && isLoggedIn) {
      localStorage.setItem('taskStartTime', taskStartTime.toISOString());
      localStorage.setItem('remainingTime', remainingTime.toString());
    }
  }, [taskStartTime, remainingTime, isLoggedIn]);

  // 问卷计时器
  useEffect(() => {
    let questionnaireTimerId;
    
    if (isQuestionnaireStarted && questionnaireRemainingTime > 0 && !isQuestionnaireTimeUp) {
      questionnaireTimerId = setInterval(() => {
        setQuestionnaireRemainingTime(prevTime => {
          const newTime = prevTime - 1;
          if (newTime <= 0) {
            clearInterval(questionnaireTimerId);
            setIsQuestionnaireTimeUp(true);
            logOperation({ 
              targetElement: '问卷计时器', 
              eventType: '问卷超时',
              value: '问卷作答时间已结束'
            });
            
            // 清除问卷计时器的持久化数据
            localStorage.removeItem('questionnaireRemainingTime');
            
            console.log('[AppContext] ⏰ 问卷计时器到达0，准备跳转到最后页面');
            
            // 问卷倒计时为0时，自动跳转到最后的问卷页面（P28）
            setTimeout(() => {
              try {
                console.log('[AppContext] 🔄 问卷超时，自动跳转到P28问卷完成页面');
                // 如果当前不在P28页面，则跳转到P28
                setCurrentPageIdInternal(currentId => {
                  if (currentId !== 'Page_28_Effort_Submit') {
                    setPageEnterTime(new Date());
                    setCurrentPageData({ operationList: [], answerList: [] });
                    return 'Page_28_Effort_Submit';
                  }
                  return currentId; // 如果已经在P28，不做改变
                });
              } catch (error) {
                console.error('[AppContext] 问卷超时跳转失败:', error);
              }
            }, 1000); // 延迟1秒执行跳转，确保状态更新完成
            
            return 0;
          }
          
          // 持久化问卷剩余时间（每5秒更新一次以减少写入频率）
          if (newTime % 5 === 0) {
            localStorage.setItem('questionnaireRemainingTime', newTime.toString());
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (questionnaireTimerId) {
        clearInterval(questionnaireTimerId);
      }
    };
  }, [isQuestionnaireStarted, questionnaireRemainingTime, isQuestionnaireTimeUp, logOperation]); 

  /**
   * 设置登录信息并标记为已登录
   * @param {string} bCode - Batch Code
   * @param {string} eNo - Exam No
   */
  const login = (bCode, eNo) => {
    setBatchCode(bCode);
    setExamNo(eNo);
    setIsLoggedIn(true);
    // Reset task related states for a fresh start, in case of re-login (though not typical for this app)
    setTaskStartTime(null);
    setRemainingTime(TOTAL_TASK_DURATION);
    setCurrentPageIdInternal('Page_01_Precautions');  // 改为注意事项页面
    setIsTaskFinished(false);
    setIsTimeUp(false);
    // 重置问卷相关状态
    setIsQuestionnaireCompleted(false);
    setQuestionnaireAnswers({});
    setIsQuestionnaireStarted(false);
    setIsQuestionnaireTimeUp(false);
    setQuestionnaireRemainingTime(10 * 60);
    
    localStorage.removeItem('isTaskFinished');
    localStorage.removeItem('taskStartTime');
    localStorage.removeItem('remainingTime');
    localStorage.removeItem('currentPageId');
    // 清除问卷相关的localStorage
    localStorage.removeItem('isQuestionnaireCompleted');
    localStorage.removeItem('questionnaireAnswers');
    localStorage.removeItem('isQuestionnaireStarted');
    localStorage.removeItem('questionnaireStartTime');
    localStorage.removeItem('questionnaireRemainingTime');
    
    // 初始登录时不应记录操作，因为此时 logOperation 可能依赖尚未完全初始化的状态
  };
  
  /**
   * 启动任务计时
   * 应该在用户确认开始任务后（例如从P0页面点击开始）调用
   */
  const startTaskTimer = useCallback(() => {
    if (!taskStartTime && isLoggedIn) { // Only start if not already started and logged in
      const now = new Date();
      setTaskStartTime(now);
      setRemainingTime(TOTAL_TASK_DURATION); // Reset to full duration
      setPageEnterTime(now); 
      setIsTimeUp(false);
      setIsTaskFinished(false);
      // Log task start. Ensure this is called after logOperation is stable.
      logOperation({ targetElement: '系统事件', eventType: '任务开始' });
    }
  }, [taskStartTime, isLoggedIn, logOperation]); 

  /**
   * 启动问卷计时
   * 在用户进入问卷说明页面点击"开始作答"时调用
   */
  const startQuestionnaireTimer = useCallback(() => {
    if (!isQuestionnaireStarted && isLoggedIn) {
      const now = new Date();
      setQuestionnaireStartTime(now);
      setQuestionnaireRemainingTime(10 * 60); // 重置为10分钟
      setIsQuestionnaireStarted(true);
      setIsQuestionnaireTimeUp(false);
      
      logOperation({ 
        targetElement: '问卷计时器', 
        eventType: '问卷开始',
        value: '用户开始作答问卷' 
      });
      
      console.log('[AppContext] 问卷计时器已启动');
    }
  }, [isQuestionnaireStarted, isLoggedIn, logOperation]);

  /**
   * 保存问卷答案
   * @param {string} pageId - 页面ID (如 'page21', 'page22')
   * @param {string} questionId - 问题ID (如 'q1', 'q2')
   * @param {string} answer - 答案内容
   */
  const saveQuestionnaireAnswer = useCallback((pageId, questionId, answer) => {
    setQuestionnaireAnswers(prev => ({
      ...prev,
      [pageId]: {
        ...prev[pageId],
        [questionId]: answer
      }
    }));
  }, []);

  /**
   * 获取问卷答案
   * @param {string} pageId - 页面ID
   * @param {string} questionId - 问题ID
   * @returns {string} 答案内容
   */
  const getQuestionnaireAnswer = useCallback((pageId, questionId) => {
    return questionnaireAnswers[pageId]?.[questionId] || '';
  }, [questionnaireAnswers]);

  /**
   * 切换到下一页
   * @param {string} nextPageId - 下一页的ID
   * @param {object} [options] - 可选参数
   * @param {boolean} [options.skipSubmit] - 是否跳过当前页数据提交 (默认为false)
   */
  const navigateToPage = useCallback(async (nextPageId, options = {}) => {
    const { skipSubmit = false } = options;
    let canNavigate = true;

    console.log(`[AppContext] Attempting to navigate to: ${nextPageId}, skipSubmit: ${skipSubmit}, from: ${currentPageId}`);

    try {
      if (!skipSubmit && currentPageId !== 'Page_00_Start') { 
        console.log(`[AppContext] 准备提交当前页面数据 - currentPageId: ${currentPageId}`);
        console.log(`[AppContext] 当前页面数据状态:`, currentPageData);
        console.log(`[AppContext] 当前操作记录数量:`, currentPageData.operationList?.length || 0);
        console.log(`[AppContext] 操作记录详情:`, currentPageData.operationList);
        
        // 🔧 修复时序问题：先备份当前数据，然后同步添加页面退出事件，再提交
        const exitOperation = {
          code: (currentPageData.operationList?.length || 0) + 1,
          targetElement: '页面', 
          eventType: 'page_exit', 
          value: `离开页面${currentPageId}`,
          time: formatDateTime(new Date())
        };
        
        // 创建包含页面退出事件的完整操作列表
        const completeOperationList = [...(currentPageData.operationList || []), exitOperation];
        
        // 临时更新页面数据包含退出事件，用于提交
        const dataToSubmit = {
          ...currentPageData,
          operationList: completeOperationList
        };
        
        // 直接提交包含完整操作记录的数据
        const submissionSuccess = await submitPageDataWithInfo(
          batchCode || localStorage.getItem('batchCode'),
          examNo || localStorage.getItem('examNo'),
          dataToSubmit  // 传入完整数据而不是使用当前状态
        );
        
        console.log(`[AppContext] 页面数据提交结果: ${submissionSuccess}`);
        console.log(`[AppContext] 提交的操作记录数量:`, completeOperationList.length);
        
        if (!submissionSuccess) {
          console.warn(`[AppContext] Navigation to ${nextPageId} blocked due to submission failure of ${currentPageId}.`);
          canNavigate = false; 
        }
      }

      if (canNavigate) {
        // if (nextPageId === 'Page_19_Task_Completion') { // Temporarily comment out this block
        //   setIsTaskFinished(true);
        //   logOperation({ targetElement: '系统事件', eventType: '任务完成' });
        // }
        console.log(`[AppContext] NOTE: Auto-setting isTaskFinished on navigate to P19 is temporarily disabled for testing.`);

        console.log(`[AppContext] Navigating: Current: ${currentPageId}, Next: ${nextPageId}`);
        
        // 页面切换：数据已提交，现在可以安全地切换页面状态
        setCurrentPageIdInternal(targetPageId => {
          console.log(`[AppContext] setCurrentPageIdInternal: old=${targetPageId}, new=${nextPageId}`);
          return nextPageId;
        });
        setPageEnterTime(new Date());
        
        // 重置页面数据为新页面做准备
        setCurrentPageData({ operationList: [], answerList: [] });
        
        // 为新页面记录进入事件将在页面组件的useEffect中处理
        
        // 使用专门的页面切换处理函数
        handlePageTransition(); 
        
        if (nextPageId === 'Page_01_Precautions' && !taskStartTime && isLoggedIn) {
           // console.log('[AppContext] Special logic for Page_01_Precautions');
        }
      }
    } catch (error) {
      console.error('[AppContext] Error during navigateToPage execution:', error);
      throw error; 
    }
  }, [currentPageId, logOperation, taskStartTime, isLoggedIn, setIsTaskFinished, setPageEnterTime, setCurrentPageData, setCurrentPageIdInternal, submitPageData, currentPageData, batchCode, examNo, submitPageDataWithInfo, formatDateTime]);

  /**
   * 恢复任务状态（计时器和页面状态）
   */
  const restoreTaskState = useCallback(() => {
    const storedTaskStartTime = localStorage.getItem('taskStartTime');
    const storedRemainingTime = localStorage.getItem('remainingTime');
    const storedCurrentPageId = localStorage.getItem('currentPageId');
    const storedIsTaskFinished = localStorage.getItem('isTaskFinished') === 'true';
    
    console.log('[AppContext] 开始恢复任务状态...');
    console.log('[AppContext] 存储的数据:', {
      taskStartTime: storedTaskStartTime,
      remainingTime: storedRemainingTime,
      currentPageId: storedCurrentPageId,
      isTaskFinished: storedIsTaskFinished
    });
    
    if (storedTaskStartTime && storedRemainingTime) {
      const parsedRemainingTime = parseInt(storedRemainingTime, 10);
      const taskStartTimeObj = new Date(storedTaskStartTime);
      
      // 计算实际剩余时间
      const now = new Date().getTime();
      const startTimeMillis = taskStartTimeObj.getTime();
      const expectedEndTimeMillis = startTimeMillis + TOTAL_TASK_DURATION * 1000;
      
      if (now >= expectedEndTimeMillis) {
        setRemainingTime(0);
        setIsTimeUp(true);
        setIsTaskFinished(true);
        console.log('[AppContext] 任务时间已到，设置倒计时为0');
      } else {
        const newRemaining = Math.max(0, Math.floor((expectedEndTimeMillis - now) / 1000));
        setRemainingTime(newRemaining);
        setIsTimeUp(false);
        setIsTaskFinished(storedIsTaskFinished);
        console.log(`[AppContext] 恢复任务倒计时: ${newRemaining}秒`);
      }
      
      setTaskStartTime(taskStartTimeObj);
      console.log('[AppContext] 任务开始时间已恢复:', taskStartTimeObj);
      
      if (storedCurrentPageId && storedCurrentPageId !== 'Page_00_Start' && storedCurrentPageId !== 'Page_Login') {
        setCurrentPageIdInternal(storedCurrentPageId);
        setPageEnterTime(new Date()); // 重新进入页面的时间
        console.log(`[AppContext] 恢复页面状态: ${storedCurrentPageId}`);
      }
    } else if (storedCurrentPageId && storedCurrentPageId !== 'Page_00_Start' && storedCurrentPageId !== 'Page_Login' && storedCurrentPageId !== 'Page_01_Precautions') {
      // 如果没有任务开始时间，但用户已经在任务页面中（不是P0和P1），说明任务应该已经开始
      console.log('[AppContext] 检测到用户在任务进行页面但无计时器数据，启动计时器');
      const now = new Date();
      setTaskStartTime(now);
      setRemainingTime(TOTAL_TASK_DURATION);
      setIsTimeUp(false);
      setIsTaskFinished(false);
      setCurrentPageIdInternal(storedCurrentPageId);
      setPageEnterTime(new Date());
      
      // 持久化任务开始状态
      localStorage.setItem('taskStartTime', now.toISOString());
      localStorage.setItem('remainingTime', TOTAL_TASK_DURATION.toString());
      
      console.log(`[AppContext] 任务计时器已启动，恢复到页面: ${storedCurrentPageId}`);
    }
  }, []);

  /**
   * 处理登录成功
   * 更新认证状态和用户信息
   * @param {Object} userData - 用户数据对象
   * @param {string} userData.batchCode - 测评批次号
   * @param {string} userData.examNo - 学生考号
   * @param {string} userData.studentName - 学生姓名
   * @param {string} userData.schoolName - 学校名称
   * @param {Object} userData - 完整的用户数据
   */
  const handleLoginSuccess = useCallback((userData) => {
    try {
      // 检查是否为重新登录（已有任务数据）
      const existingTaskStartTime = localStorage.getItem('taskStartTime');
      const existingCurrentPageId = localStorage.getItem('currentPageId');
      // 只要有页面ID且不是登录页面，就认为是重新登录，需要恢复状态
      const isRelogin = existingCurrentPageId && existingCurrentPageId !== 'Page_Login';
      
      // 更新认证状态
      setIsAuthenticated(true);
      setIsLoggedIn(true);
      
      // 存储用户信息
      setCurrentUser(userData);
      
      // 处理模块URL字段
      try {
        const userModuleUrl = userData.url || '/four-grade'; // 默认值（四年级模块）
        setModuleUrl(userModuleUrl);
        localStorage.setItem('moduleUrl', userModuleUrl);
        console.log('[AppContext] URL字段处理完成:', {
          receivedUrl: userData.url,
          appliedUrl: userModuleUrl,
          isDefault: !userData.url
        });
        
        if (!userData.url) {
          console.log('[AppContext] Using default moduleUrl: /four-grade (API response missing url field)');
        }
      } catch (error) {
        console.error('[AppContext] URL extraction failed:', error.message);
        // 错误处理：使用默认值（四年级模块）
        const defaultUrl = '/four-grade';
        setModuleUrl(defaultUrl);
        localStorage.setItem('moduleUrl', defaultUrl);
        console.log('[AppContext] 错误恢复 - 使用默认moduleUrl:', defaultUrl);
      }
      
      // 存储必要的任务信息
      setBatchCode(userData.batchCode);
      setExamNo(userData.examNo);
      setPageNum(userData.pageNum || null);
      
      // 检查是否已完成所有任务（包括问卷）
      if (userData.pageNum !== undefined && userData.pageNum !== null) {
        const pageNumInt = parseInt(userData.pageNum);
        if (pageNumInt >= 28) {
          // 如果已完成所有任务，标记问卷为已完成
          setIsQuestionnaireCompleted(true);
          localStorage.setItem('isQuestionnaireCompleted', 'true');
          console.log('[AppContext] 用户已完成所有任务，标记问卷为已完成，pageNum:', userData.pageNum);
        }
      }
      
      // 持久化存储认证信息
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('currentUser', JSON.stringify(userData));
      localStorage.setItem('batchCode', userData.batchCode);
      localStorage.setItem('examNo', userData.examNo);
      if (userData.pageNum !== undefined && userData.pageNum !== null) {
        localStorage.setItem('pageNum', userData.pageNum);
      }
      
      console.log('[AppContext] 登录状态判断:', {
        existingTaskStartTime: !!existingTaskStartTime,
        existingCurrentPageId,
        isRelogin
      });
      
      if (isRelogin) {
        // 重新登录：保持现有任务状态，手动恢复计时器
        console.log('[AppContext] 🔄 检测到重新登录，恢复现有任务状态');
        
        // 立即恢复任务状态
        setTimeout(() => {
          console.log('[AppContext] 🚀 开始执行恢复任务状态...');
          restoreTaskState();
        }, 200); // 增加延迟确保状态更新完成
      } else {
        // 首次登录：重置任务相关状态
        console.log('[AppContext] 首次登录，重置任务状态');
        
        setTaskStartTime(null);
        setRemainingTime(TOTAL_TASK_DURATION);
        setCurrentPageIdInternal('Page_01_Precautions');  // 改为注意事项页面
        setIsTaskFinished(false);
        setIsTimeUp(false);
        
        // 清除可能存在的旧任务数据
        localStorage.removeItem('isTaskFinished');
        localStorage.removeItem('taskStartTime');
        localStorage.removeItem('remainingTime');
        localStorage.removeItem('currentPageId');
        // 注意：不清除moduleUrl，因为它需要在首次登录时也保持
      }
      
      console.log('登录成功，用户信息已保存:', userData);
    } catch (error) {
      console.error('处理登录成功时出错:', error);
      throw error;
    }
  }, [restoreTaskState]);

  /**
   * 标记问卷已完成
   */
  const completeQuestionnaire = useCallback(() => {
    setIsQuestionnaireCompleted(true);
    // 持久化问卷完成状态
    localStorage.setItem('isQuestionnaireCompleted', 'true');
    console.log('[AppContext] 问卷已完成，状态已持久化到localStorage');
    
    // 在此可以考虑停止问卷计时器，如果它还在运行的话
    // 也可以清除 questionnaireAnswers，如果不再需要
    // localStorage.removeItem('questionnaireAnswers');
    // localStorage.removeItem('questionnaireRemainingTime');
    // localStorage.removeItem('isQuestionnaireStarted');
    // localStorage.removeItem('questionnaireStartTime');
    logOperation({targetElement: 'System', eventType: 'questionnaire_marked_complete'});
  }, [logOperation]);

  const contextValue = {
    currentPageId,
    setCurrentPageId: navigateToPage, // 使用 navigateToPage 进行页面切换
    navigateToPage: navigateToPage, // 新增: 确保 navigateToPage 以此键名导出
    remainingTime,
    taskStartTime,
    setTaskStartTime, //确保暴露
    batchCode,
    examNo,
    pageNum,
    currentPageData,
    setCurrentPageData, //确保暴露
    pageEnterTime,
    isLoggedIn,
    isTaskFinished,
    isTimeUp,
    login,
    startTaskTimer,
    logOperation,
    collectAnswer,
    preparePageSubmissionData,
    submitPageData,
    submitPageDataWithInfo, // 暴露手动重试提交函数
    formatDateTime, // 暴露格式化函数
    TOTAL_TASK_DURATION,
    setPageEnterTime,   // 暴露以便特殊页面或逻辑可以直接设置
    setIsTaskFinished,  // 暴露以便特殊逻辑（如超时自动提交后）可以设置
    setIsTimeUp,        // 主要由内部计时器控制，但暴露以备不时之需
    currentStepNumber, // 新增：当前步骤号
    totalUserSteps,   // 新增：总用户步骤数
    isAuthenticated,
    authToken,
    currentUser,
    moduleUrl,
    setModuleUrl,
    handleLoginSuccess,
    handleLogout,
    clearAllCache,      // 新增：暴露清除所有缓存的函数
    clearCache,         // 新增：暴露手动清除缓存的函数
    // 问卷相关状态和函数
    questionnaireStartTime,
    questionnaireRemainingTime,
    isQuestionnaireStarted,
    isQuestionnaireTimeUp,
    questionnaireAnswers,
    startQuestionnaireTimer,
    saveQuestionnaireAnswer,
    getQuestionnaireAnswer,
    isQuestionnaireCompleted, // 暴露新状态
    completeQuestionnaire,    // 暴露新函数
  };

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
};

/**
 * 自定义Hook，用于方便地使用AppContext
 * @returns {object} AppContext的值
 * @throws {Error} 如果在AppContext.Provider之外使用，则抛出错误
 */
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;