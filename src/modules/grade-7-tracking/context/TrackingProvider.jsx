import { useState, useCallback, useMemo, useEffect, useContext } from 'react';
import TrackingContext from './TrackingContext';
import { PAGE_MAPPING } from '../config';

/**
 * TrackingProvider - 7年级追踪测评模块的状态管理提供者
 *
 * 职责：
 * 1. 初始化和管理ExperimentSession状态
 * 2. 管理实验试验数据(ExperimentTrial)
 * 3. 管理图表数据(ChartData)
 * 4. 管理文本回答(TextResponse)
 * 5. 管理问卷答案(QuestionnaireAnswer)
 * 6. 管理操作日志(operationLog)
 * 7. 提供页面导航和数据提交方法
 * 8. 监听计时器并实现自动跳转逻辑 (T098, T100)
 *
 * @param {Object} props
 * @param {Object} props.userContext - 从ModuleRouter传入的用户上下文
 * @param {string} props.initialPageId - 初始页面ID
 * @param {React.ReactNode} props.children - 子组件
 */
export const TrackingProvider = ({ userContext, initialPageId, children }) => {
  // ============================================================================
  // 1. 会话状态初始化 (ExperimentSession)
  // ============================================================================

  /**
   * 生成或恢复sessionId
   * 优先从localStorage恢复，不存在则生成新的UUID
   */
  const initializeSessionId = useCallback(() => {
    const storedSessionId = localStorage.getItem('tracking_sessionId');
    if (storedSessionId) {
      console.log('[TrackingProvider] 从localStorage恢复sessionId:', storedSessionId);
      return storedSessionId;
    }

    // 生成新的UUID v4
    const newSessionId = crypto.randomUUID();
    localStorage.setItem('tracking_sessionId', newSessionId);
    console.log('[TrackingProvider] 生成新sessionId:', newSessionId);
    return newSessionId;
  }, []);

  /**
   * 初始化会话状态
   */
  const initializeSession = useCallback(() => {
    const now = Date.now();

    // 从userContext提取学生信息
    const session = {
      // 学生身份信息 (从登录API获取)
      studentCode: userContext?.user?.examNo || '',
      studentName: userContext?.user?.studentName || '',
      examNo: userContext?.user?.examNo || '',
      batchCode: userContext?.session?.batchCode || '',
      schoolCode: userContext?.user?.schoolCode || userContext?.user?.schoolName || '',

      // 会话管理
      sessionId: initializeSessionId(),
      sessionStartTime: now,
      lastHeartbeatTime: now,
      isSessionValid: true,

      // 导航状态 (根据initialPageId确定)
      currentPage: determinePageNumber(initialPageId),
      navigationMode: determineNavigationMode(initialPageId),

      // 计时器状态
      experimentTimerStarted: false,
      questionnaireTimerStarted: false,
      experimentStartTime: null,
      questionnaireStartTime: null,

      // T097: 40分钟探究任务计时器(秒)
      taskTimeRemaining: 40 * 60, // 2400秒 = 40分钟
      taskTimerActive: false,

      // T099: 10分钟问卷计时器(秒)
      questionnaireTimeRemaining: 10 * 60, // 600秒 = 10分钟
      questionnaireTimerActive: false,
    };

    console.log('[TrackingProvider] 会话状态初始化完成:', session);
    return session;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userContext, initialPageId, initializeSessionId]);

  // ============================================================================
  // 2. 状态定义
  // ============================================================================

  const [session, setSession] = useState(() => initializeSession());
  const [experimentTrials, setExperimentTrials] = useState([]);
  const [chartData, setChartData] = useState({
    dataPoints: [],
    isCompleted: false,
    creationTime: Date.now(),
    operationList: []
  });
  const [textResponses, setTextResponses] = useState([
    { questionNumber: 1, questionText: '', answerText: '', startEditTime: 0, lastEditTime: 0, editDuration: 0, characterCount: 0, isEmpty: true, isValid: false },
    { questionNumber: 2, questionText: '', answerText: '', startEditTime: 0, lastEditTime: 0, editDuration: 0, characterCount: 0, isEmpty: true, isValid: false },
    { questionNumber: 3, questionText: '', answerText: '', startEditTime: 0, lastEditTime: 0, editDuration: 0, characterCount: 0, isEmpty: true, isValid: false }
  ]);
  const [questionnaireAnswers, setQuestionnaireAnswers] = useState({});
  const [operationLog, setOperationLog] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [pageStartTime, setPageStartTime] = useState(Date.now());

  // ============================================================================
  // 3. 辅助函数
  // ============================================================================

  /**
   * 根据pageId确定页面编号
   * @param {string} pageId - 页面ID (如 'Page_01_Intro')
   * @returns {number} 页面编号 (如 1, 0.1, 0.2)
   */
  function determinePageNumber(pageId) {
    // 遍历PAGE_MAPPING查找匹配的pageId
    for (const [pageNum, pageInfo] of Object.entries(PAGE_MAPPING)) {
      if (pageInfo.pageId === pageId) {
        return parseFloat(pageNum);
      }
    }

    // 默认返回1（首页）
    console.warn('[TrackingProvider] 未找到pageId对应的页面编号:', pageId);
    return 1;
  }

  /**
   * 根据pageId确定导航模式
   * @param {string} pageId - 页面ID
   * @returns {'hidden' | 'experiment' | 'questionnaire'} 导航模式
   */
  function determineNavigationMode(pageId) {
    const pageNum = determinePageNumber(pageId);
    const pageInfo = PAGE_MAPPING[pageNum];

    if (pageInfo) {
      return pageInfo.navigationMode;
    }

    // 根据页面编号范围判断
    if (pageNum === 0.1 || pageNum === 0.2 || pageNum === 22) {
      return 'hidden';
    } else if (pageNum >= 1 && pageNum <= 13) {
      return 'experiment';
    } else if (pageNum >= 14 && pageNum <= 21) {
      return 'questionnaire';
    }

    return 'hidden';
  }

  /**
   * 格式化日期时间为 "YYYY-MM-DD HH:mm:ss"
   * @param {Date|number} date - 日期对象或时间戳
   * @returns {string} 格式化的日期时间字符串
   */
  const formatDateTime = useCallback((date) => {
    const d = date instanceof Date ? date : new Date(date);
    const pad = (num) => String(num).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }, []);

  // ============================================================================
  // 4. 会话管理方法
  // ============================================================================

  /**
   * 更新会话状态
   * @param {Object} updates - 要更新的字段
   */
  const updateSession = useCallback((updates) => {
    setSession(prev => {
      const newSession = { ...prev, ...updates };
      console.log('[TrackingProvider] 会话状态已更新:', updates);
      return newSession;
    });
  }, []);

  /**
   * 更新心跳时间戳
   * 应该每30秒调用一次
   */
  const updateHeartbeat = useCallback(() => {
    updateSession({ lastHeartbeatTime: Date.now() });
  }, [updateSession]);

  // ============================================================================
  // 5. 实验数据管理
  // ============================================================================

  /**
   * 添加图表数据点
   * @param {Object} dataPoint - ChartDataPoint对象
   */
  const addChartDataPoint = useCallback((dataPoint) => {
    setChartData(prev => {
      // 检查是否已存在相同含水量的数据点
      const existingIndex = prev.dataPoints.findIndex(
        point => point.waterContent === dataPoint.waterContent
      );

      let newDataPoints;
      if (existingIndex !== -1) {
        // 更新现有数据点
        newDataPoints = [...prev.dataPoints];
        newDataPoints[existingIndex] = dataPoint;
        console.log('[TrackingProvider] 更新图表数据点:', dataPoint);
      } else {
        // 添加新数据点
        newDataPoints = [...prev.dataPoints, dataPoint];
        console.log('[TrackingProvider] 新增图表数据点:', dataPoint);
      }

      // 记录操作
      const operation = {
        timestamp: Date.now(),
        action: existingIndex !== -1 ? 'edit_point' : 'add_point',
        dataPoint
      };

      const newOperationList = [...prev.operationList, operation];

      return {
        ...prev,
        dataPoints: newDataPoints,
        isCompleted: newDataPoints.length >= 2,
        operationList: newOperationList
      };
    });
  }, []);

  /**
   * 添加实验试验记录
   * @param {Object} trial - ExperimentTrial对象
   */
  const addExperimentTrial = useCallback((trial) => {
    setExperimentTrials(prev => {
      const newTrials = [...prev, trial];
      console.log('[TrackingProvider] 新增实验试验记录:', trial);
      return newTrials;
    });

    // 自动将试验数据映射到图表数据点
    const chartPoint = {
      waterContent: trial.waterContent,
      fallTime: trial.fallTime,
      source: 'trial',
      trialNumber: trial.trialNumber
    };
    addChartDataPoint(chartPoint);
  }, [addChartDataPoint]);

  /**
   * 移除图表数据点
   * @param {number} waterContent - 要移除的数据点的含水量
   */
  const removeChartDataPoint = useCallback((waterContent) => {
    setChartData(prev => {
      const dataPoint = prev.dataPoints.find(point => point.waterContent === waterContent);
      const newDataPoints = prev.dataPoints.filter(point => point.waterContent !== waterContent);

      // 记录操作
      const operation = {
        timestamp: Date.now(),
        action: 'remove_point',
        dataPoint
      };

      const newOperationList = [...prev.operationList, operation];

      console.log('[TrackingProvider] 移除图表数据点 - 含水量:', waterContent);

      return {
        ...prev,
        dataPoints: newDataPoints,
        isCompleted: newDataPoints.length >= 2,
        operationList: newOperationList
      };
    });
  }, []);

  // ============================================================================
  // 6. 文本回答管理
  // ============================================================================

  /**
   * 更新文本回答
   * @param {number} questionNumber - 问题编号 (1, 2, 3)
   * @param {string} answerText - 答案文本
   * @param {Object} [metadata] - 可选的元数据 (startEditTime, lastEditTime等)
   */
  const updateTextResponse = useCallback((questionNumber, answerText, metadata = {}) => {
    setTextResponses(prev => {
      const newResponses = prev.map(response => {
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
            ...metadata
          };
        }
        return response;
      });

      console.log('[TrackingProvider] 更新文本回答 - 问题', questionNumber);
      return newResponses;
    });
  }, []);

  // ============================================================================
  // 7. 问卷答案管理
  // ============================================================================

  /**
   * 更新问卷答案
   * @param {number} questionNumber - 问题编号 (1-27)
   * @param {string} selectedOption - 选中的选项 ('A' | 'B' | 'C' | 'D' | 'E')
   * @param {Object} [metadata] - 可选的元数据
   */
  const updateQuestionnaireAnswer = useCallback((questionNumber, selectedOption, metadata = {}) => {
    setQuestionnaireAnswers(prev => {
      const newAnswers = {
        ...prev,
        [questionNumber]: {
          questionNumber,
          selectedOption,
          selectionTime: Date.now(),
          isAnswered: true,
          ...metadata
        }
      };

      console.log('[TrackingProvider] 更新问卷答案 - 问题', questionNumber, '选项:', selectedOption);
      return newAnswers;
    });
  }, []);

  // ============================================================================
  // 8. 操作日志管理
  // ============================================================================

  /**
   * 记录用户操作
   * @param {Object} operation - 操作对象
   * @param {string} operation.action - 操作类型
   * @param {string} [operation.target] - 操作目标
   * @param {*} [operation.value] - 操作值
   * @param {string} [operation.time] - ISO时间字符串
   */
  const logOperation = useCallback((operation) => {
    setOperationLog(prev => {
      const newLog = [...prev, {
        timestamp: operation.timestamp || Date.now(),
        action: operation.action,
        target: operation.target || '',
        value: operation.value !== undefined ? operation.value : null,
        time: operation.time || new Date().toISOString()
      }];

      // 可选：限制日志大小，防止内存溢出
      const MAX_LOG_SIZE = 1000;
      if (newLog.length > MAX_LOG_SIZE) {
        console.warn('[TrackingProvider] 操作日志已达到最大大小，移除旧记录');
        return newLog.slice(-MAX_LOG_SIZE);
      }

      return newLog;
    });
  }, []);

  /**
   * 收集答案
   * @param {Object} answer - 答案对象
   * @param {string} answer.targetElement - 目标元素
   * @param {*} answer.value - 答案值
   */
  const collectAnswer = useCallback((answer) => {
    setAnswers(prev => [...prev, {
      targetElement: answer.targetElement,
      value: answer.value,
      timestamp: Date.now()
    }]);
  }, []);

  /**
   * 清除操作日志和答案
   * 在提交数据后调用
   */
  const clearOperations = useCallback(() => {
    setOperationLog([]);
    setAnswers([]);
    setPageStartTime(Date.now());
    console.log('[TrackingProvider] 操作日志和答案已清除');
  }, []);

  /**
   * 构建MarkObject数据结构
   * @param {string} pageNumber - 页面编号
   * @param {string} pageDesc - 页面描述
   * @returns {Object} MarkObject
   */
  const buildMarkObject = useCallback((pageNumber, pageDesc) => {
    const markObject = {
      pageNumber: String(pageNumber),
      pageDesc: pageDesc,
      operationList: operationLog.map(op => ({
        targetElement: op.target,
        eventType: op.action,
        value: String(op.value || ''),
        time: op.time || new Date(op.timestamp).toISOString()
      })),
      answerList: answers.map(ans => ({
        targetElement: ans.targetElement,
        value: String(ans.value || '')
      })),
      beginTime: formatDateTime(pageStartTime),
      endTime: formatDateTime(new Date()),
      imgList: []
    };

    console.log('[TrackingProvider] 构建MarkObject:', {
      pageNumber,
      pageDesc,
      operationCount: markObject.operationList.length,
      answerCount: markObject.answerList.length
    });

    return markObject;
  }, [operationLog, answers, pageStartTime, formatDateTime]);

  // ============================================================================
  // 9. 页面导航
  // ============================================================================

  /**
   * 导航到指定页面
   * @param {number} pageNum - 目标页面编号
   *
   */
  const navigateToPage = useCallback((pageNum) => {
    // 查找对应的 pageId
    const pageInfo = PAGE_MAPPING[pageNum];
    if (!pageInfo) {
      console.error('[TrackingProvider] 未找到页面编号对应的页面信息:', pageNum);
      return;
    }

    const pageId = pageInfo.pageId;
    const navigationMode = pageInfo.navigationMode;

    // 记录页面退出操作
    logOperation({
      timestamp: Date.now(),
      action: 'page_exit',
      target: '页面',
      value: session.currentPage,
      time: new Date().toISOString()
    });

    // 更新会话状态
    updateSession({
      currentPage: pageNum,
      navigationMode
    });

    // 重置页面开始时间
    setPageStartTime(Date.now());

    // 记录页面进入操作
    logOperation({
      timestamp: Date.now(),
      action: 'page_enter',
      target: '页面',
      value: pageNum,
      time: new Date().toISOString()
    });

    console.log('[TrackingProvider] 导航至页面:', pageId, '页码:', pageNum);
  }, [session.currentPage, updateSession, logOperation]);

  // ============================================================================
  // 10. 数据提交
  // ============================================================================

  /**
   * 提交页面数据
   * @param {Object} markObject - MarkObject数据结构
   * @returns {Promise<boolean>} 提交是否成功
   */
  const submitPageData = useCallback(async (markObject) => {
    try {
      console.log('[TrackingProvider] 准备提交页面数据:', markObject);

      // 使用userContext中的helpers提交数据
      if (userContext?.helpers?.submitPageMarkData) {
        const payload = {
          batchCode: session.batchCode,
          examNo: session.examNo,
          mark: JSON.stringify(markObject)
        };

        const response = await userContext.helpers.submitPageMarkData(payload);
        console.log('[TrackingProvider] 数据提交成功:', response);

        // 提交成功后清除操作日志
        clearOperations();

        return true;
      } else {
        console.error('[TrackingProvider] submitPageMarkData helper不可用');
        return false;
      }
    } catch (error) {
      console.error('[TrackingProvider] 数据提交失败:', error);
      return false;
    }
  }, [session.batchCode, session.examNo, userContext, clearOperations]);

  // ============================================================================
  // 11. 导航辅助方法
  // ============================================================================

  /**
   * 检查是否可以导航到下一页
   * @returns {boolean} 是否可以导航
   */
  const canNavigateNext = useCallback(() => {
    // 根据当前页面判断导航前置条件
    const currentPage = session.currentPage;

    // 示例：第12页需要至少2个图表数据点才能继续
    if (currentPage === 12) {
      return chartData.isCompleted;
    }

    // 默认允许导航
    return true;
  }, [session.currentPage, chartData.isCompleted]);

  /**
   * 获取当前导航模式
   * @returns {'hidden' | 'experiment' | 'questionnaire'} 导航模式
   */
  const getCurrentNavigationMode = useCallback(() => {
    return session.navigationMode;
  }, [session.navigationMode]);

  // ============================================================================
  // 12. T097: 40分钟探究任务计时器管理
  // ============================================================================

  /**
   * T097: 启动40分钟探究任务计时器
   * 应该在Page02_Intro (任务开始页) 调用
   */
  const startTaskTimer = useCallback(() => {
    if (!session.taskTimerActive) {
      updateSession({
        taskTimerActive: true,
        taskTimeRemaining: 40 * 60 // 重置为40分钟
      });
      console.log('[TrackingProvider] 40分钟探究任务计时器已启动');
    }
  }, [session.taskTimerActive, updateSession]);

  /**
   * T097: 计时器倒计时逻辑 (每秒递减)
   */
  useEffect(() => {
    if (!session.taskTimerActive || session.taskTimeRemaining <= 0) {
      return;
    }

    const timerId = setInterval(() => {
      setSession(prev => {
        const newTimeRemaining = Math.max(0, prev.taskTimeRemaining - 1);
        return {
          ...prev,
          taskTimeRemaining: newTimeRemaining
        };
      });
    }, 1000);

    return () => clearInterval(timerId);
  }, [session.taskTimerActive, session.taskTimeRemaining]);

  // ============================================================================
  // 13. T098 & T100: 计时器监听和自动跳转逻辑
  // ============================================================================

  /**
   * T098: 监听40分钟探究任务计时器到期
   * 自动保存数据并跳转到问卷说明页 (页码 0.2 / 页面编号 13)
   */
  useEffect(() => {
    const taskTimeRemaining = session.taskTimeRemaining;

    // 仅在探究阶段 (navigationMode === 'experiment') 监听,且计时器为0
    if (
      session.navigationMode === 'experiment' &&
      session.taskTimerActive &&
      taskTimeRemaining === 0
    ) {
      console.log('[TrackingProvider] 40分钟探究任务时间到，自动跳转到问卷说明页');

      // 停止计时器
      updateSession({ taskTimerActive: false });

      // 构建当前页面的 MarkObject
      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(
        session.currentPage,
        pageInfo?.pageDesc || '当前页面'
      );

      // 提交数据
      submitPageData(markObject).then((success) => {
        if (success) {
          console.log('[TrackingProvider] 探究任务数据提交成功，跳转到问卷说明页');
          // 跳转到问卷说明页 (页码 13 = Page02_QuestionnaireNotice)
          navigateToPage(13);
        } else {
          console.error('[TrackingProvider] 探究任务数据提交失败，无法跳转');
          alert('数据提交失败，请检查网络连接后重试');
        }
      });
    }
  }, [
    session.taskTimeRemaining,
    session.taskTimerActive,
    session.navigationMode,
    session.currentPage,
    buildMarkObject,
    submitPageData,
    navigateToPage,
    updateSession
  ]);

  /**
   * T100: 监听10分钟问卷计时器到期
   * 自动提交所有问卷数据并跳转到完成页 (页码 22)
   */
  useEffect(() => {
    const questionnaireTimeRemaining = userContext?.session?.questionnaireRemainingTime;

    // 仅在问卷阶段 (navigationMode === 'questionnaire') 监听
    if (
      session.navigationMode === 'questionnaire' &&
      questionnaireTimeRemaining !== undefined &&
      questionnaireTimeRemaining === 0
    ) {
      console.log('[TrackingProvider] 10分钟问卷时间到，自动提交问卷数据');

      // 构建当前页面的 MarkObject
      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(
        session.currentPage,
        pageInfo?.pageDesc || '问卷调查'
      );

      // 提交数据
      submitPageData(markObject).then((success) => {
        if (success) {
          console.log('[TrackingProvider] 问卷数据提交成功，跳转到完成页');
          // 跳转到完成页 (页码 22 = Page23_Completion)
          navigateToPage(22);
        } else {
          console.error('[TrackingProvider] 问卷数据提交失败，无法跳转');
          alert('数据提交失败，请检查网络连接后重试');
        }
      });
    }
  }, [
    userContext?.session?.questionnaireRemainingTime,
    session.navigationMode,
    session.currentPage,
    buildMarkObject,
    submitPageData,
    navigateToPage
  ]);

  // ============================================================================
  // 13. 持久化到localStorage (可选)
  // ============================================================================

  useEffect(() => {
    // 持久化关键状态到localStorage
    try {
      localStorage.setItem('tracking_session', JSON.stringify(session));
      localStorage.setItem('tracking_experimentTrials', JSON.stringify(experimentTrials));
      localStorage.setItem('tracking_chartData', JSON.stringify(chartData));
      localStorage.setItem('tracking_textResponses', JSON.stringify(textResponses));
      localStorage.setItem('tracking_questionnaireAnswers', JSON.stringify(questionnaireAnswers));
    } catch (error) {
      console.warn('[TrackingProvider] localStorage持久化失败:', error);
    }
  }, [session, experimentTrials, chartData, textResponses, questionnaireAnswers]);

  // ============================================================================
  // 14. Context Value
  // ============================================================================

  const contextValue = useMemo(() => ({
    // 会话管理
    session,
    updateSession,
    updateHeartbeat,

    // 实验数据
    experimentTrials,
    addExperimentTrial,

    // 图表数据
    chartData,
    addChartDataPoint,
    removeChartDataPoint,

    // 文本回答
    textResponses,
    updateTextResponse,

    // 问卷答案
    questionnaireAnswers,
    updateQuestionnaireAnswer,

    // 操作日志
    operationLog,
    logOperation,
    collectAnswer,
    clearOperations,
    buildMarkObject,

    // 导航
    navigateToPage,
    canNavigateNext,
    getCurrentNavigationMode,

    // 数据提交
    submitPageData,

    // 计时器管理 (T097)
    startTaskTimer,

    // 工具函数
    formatDateTime,

    // 提供给组件的当前页面操作记录
    currentPageOperations: operationLog,

    // 暴露 userContext 以便页面组件访问
    userContext,
  }), [
    session,
    updateSession,
    updateHeartbeat,
    experimentTrials,
    addExperimentTrial,
    chartData,
    addChartDataPoint,
    removeChartDataPoint,
    textResponses,
    updateTextResponse,
    questionnaireAnswers,
    updateQuestionnaireAnswer,
    operationLog,
    logOperation,
    collectAnswer,
    clearOperations,
    buildMarkObject,
    navigateToPage,
    canNavigateNext,
    getCurrentNavigationMode,
    submitPageData,
    startTaskTimer,
    formatDateTime,
    userContext,
  ]);

  return (
    <TrackingContext.Provider value={contextValue}>
      {children}
    </TrackingContext.Provider>
  );
};

/**
 * useTrackingContext - 自定义Hook用于访问TrackingContext
 *
 * @returns {Object} Context value
 * @throws {Error} 如果在Provider外部调用
 *
 * @example
 * const { session, navigateToPage, logOperation } = useTrackingContext();
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
