import React, { useEffect, useRef, useMemo } from 'react';
import { useAppContext } from './context/AppContext';
import Timer from './components/common/Timer';
import QuestionnaireTimer from './components/questionnaire/QuestionnaireTimer';
import PageRouter from './components/PageRouter';
import StepNavigation from './components/common/StepNavigation';
import QuestionnaireNavigation from './components/questionnaire/QuestionnaireNavigation';
import ApiConfigDebug from './components/debug/ApiConfigDebug';
// import DevToolsPanel from './components/dev/DevToolsPanel';  // 文件不存在，暂时注释
import { isQuestionnairePage, getQuestionnaireStepNumber, TOTAL_QUESTIONNAIRE_STEPS } from './utils/pageMappings';
// import { initGlobalErrorHandling } from './utils/errorHandler'; // 可选：启用错误过滤
import './styles/global.css'; // Ensure global styles are imported

// 导入模块路由器
const ModuleRouter = React.lazy(() => import('./modules/ModuleRouter.jsx'));

/**
 * 主应用内容组件
 * 根据登录状态和任务状态渲染不同内容
 */
const AppContent = () => {
  const {
    isLoggedIn,
    isAuthenticated,
    currentPageId,
    isTimeUp,
    isTaskFinished,
    setCurrentPageId,
    setIsTaskFinished,
    startTaskTimer,
    currentStepNumber,
    totalUserSteps,
    submitPageData,
    questionnaireRemainingTime,
    isQuestionnaireTimeUp,
    isQuestionnaireStarted,
    questionnaireStartTime,
    startQuestionnaireTimer,
    saveQuestionnaireAnswer,
    getQuestionnaireAnswer,
    completeQuestionnaire,
    taskStartTime,
    currentUser,
    batchCode,
    examNo,
    // 模块系统需要的状态
    remainingTime,
    pageNum,
    currentPageData,
    pageEnterTime,
    authToken,
    moduleUrl,
    questionnaireData,
    questionnaireAnswers,
    isQuestionnaireCompleted,
    logOperation,
    collectAnswer,
    // 提交相关能力（提供给模块）
    submitPageDataWithInfo,
    // 暴露给模块路由器的登出与清理
    handleLogout,
    clearAllCache
  } = useAppContext();

  // 用于防止重复日志输出
  const moduleLoggedRef = useRef(false);

  // 🚀 性能优化：提前声明 useMemo，避免 Hook 顺序问题
  // 必须在所有条件语句之前调用，符合 React Hooks 规则
  const globalContext = useMemo(() => {
    // 如果不使用模块系统，返回 null
    if (!moduleUrl || !isAuthenticated) {
      return null;
    }

    return {
      currentPageId,
      remainingTime,
      taskStartTime,
      batchCode,
      examNo,
      pageNum,
      currentPageData,
      pageEnterTime,
      isLoggedIn,
      isAuthenticated,
      authToken,
      currentUser,
      moduleUrl,
      isTaskFinished,
      isTimeUp,
      // 问卷相关状态和函数
      questionnaireData,
      questionnaireAnswers,
      isQuestionnaireCompleted,
      questionnaireRemainingTime,
      isQuestionnaireTimeUp,
      isQuestionnaireStarted,
      questionnaireStartTime,
      startQuestionnaireTimer,
      saveQuestionnaireAnswer,
      getQuestionnaireAnswer,
      completeQuestionnaire,
      logOperation,
      collectAnswer,
      // 数据提交（模块调用）
      submitPageData,
      submitPageDataWithInfo,
      // 暴露登出与清理能力给模块
      handleLogout,
      clearAllCache
    };
  }, [
    // 只依赖真正重要的状态变化
    moduleUrl,
    isAuthenticated,
    currentPageId,
    // remainingTime 故意省略 - 计时器更新不应触发模块重新渲染
    taskStartTime,
    batchCode,
    examNo,
    pageNum,
    currentPageData,
    pageEnterTime,
    isLoggedIn,
    authToken,
    currentUser,
    isTaskFinished,
    isTimeUp,
    questionnaireData,
    questionnaireAnswers,
    isQuestionnaireCompleted,
    questionnaireRemainingTime,
    isQuestionnaireTimeUp,
    isQuestionnaireStarted,
    questionnaireStartTime,
    // 函数引用通常是稳定的，但为了安全起见也包含
    startQuestionnaireTimer,
    saveQuestionnaireAnswer,
    getQuestionnaireAnswer,
    completeQuestionnaire,
    logOperation,
    collectAnswer,
    submitPageData,
    submitPageDataWithInfo,
    handleLogout,
    clearAllCache
  ]);

  // 🚀 性能优化：使用useMemo缓存authInfo
  const authInfo = useMemo(() => {
    if (!moduleUrl || !isAuthenticated) {
      return null;
    }
    return {
      url: moduleUrl,
      pageNum: pageNum,
      examNo: examNo,
      batchCode: batchCode
    };
  }, [moduleUrl, pageNum, examNo, batchCode, isAuthenticated]);

  useEffect(() => {
    if (isTimeUp && !isTaskFinished && currentPageId !== 'Page_18_Solution_Selection') {
      console.log("时间到，自动提交当前页面并标记完成...");
      
      // 使用AppContext的submitPageData，它已包含session过期处理
      const doTimeUpSubmission = async () => {
        await submitPageData();
        // 无论提交成功与否，都标记完成并回落到最后一页
        setIsTaskFinished(true);
        setCurrentPageId('Page_18_Solution_Selection');
      };
      
      doTimeUpSubmission();
    }
  }, [isTimeUp, isTaskFinished, currentPageId, submitPageData, setCurrentPageId, setIsTaskFinished]);

  // 计时器检查：确保在任务页面时计时器已启动
  useEffect(() => {
    if (isAuthenticated && isLoggedIn && !taskStartTime && !isTaskFinished) {
      // 定义需要计时器的页面
      const taskPages = [
        'Page_02_Introduction',
        'Page_03_Dialogue_Question',
        'Page_04_Material_Reading_Factor_Selection',
        'Page_10_Hypothesis_Focus',
        'Page_11_Solution_Design_Measurement_Ideas',
        'Page_12_Solution_Evaluation_Measurement_Critique',
        'Page_13_Transition_To_Simulation',
        'Page_14_Simulation_Intro_Exploration',
        'Page_15_Simulation_Question_1',
        'Page_16_Simulation_Question_2',
        'Page_17_Simulation_Question_3',
        'Page_18_Solution_Selection'
      ];
      
      if (taskPages.includes(currentPageId)) {
        console.log(`[App] 🚨 检测到用户在任务页面 ${currentPageId} 但计时器未启动，立即启动计时器`);
        startTaskTimer();
      }
    }
  }, [isAuthenticated, isLoggedIn, taskStartTime, isTaskFinished, currentPageId, startTaskTimer]);

  if (!isAuthenticated) {
    return (
      <div className="app-container">
        {/* 全屏提示现在使用DOM管理器处理，不再使用React组件 */}
        <div className="task-wrapper">
          <PageRouter />
        </div>
      </div>
    );
  }

  // 检查当前页面是否是问卷页面（P20-P28）
  const isQuestionnairePageId = (pageId) => {
    return pageId && pageId.startsWith('Page_2') && ['Page_20_Questionnaire_Intro', 'Page_21_Curiosity_Questions', 'Page_22_Creativity_Questions', 'Page_23_Imagination_Questions', 'Page_24_Science_Efficacy_Questions', 'Page_25_Environment_Questions', 'Page_26_School_Activities', 'Page_27_Outschool_Activities', 'Page_28_Effort_Submit'].includes(pageId);
  };

  if (isTaskFinished && currentPageId !== 'Page_18_Solution_Selection' && !isQuestionnairePageId(currentPageId)) {
    // 如果任务已标记为完成，但当前页面不是最终页且不是问卷页面，则强制回落到最终页
    setCurrentPageId('Page_18_Solution_Selection');
  }

  // 任务进行中，显示计时器和页面路由器（注意事项页面开始显示计时器）
  const showTimer = currentPageId !== 'Page_01_Precautions'; // 注意事项页面不显示计时器
  const showStepNavigation = currentStepNumber > 0;
  
  // 判断是否是问卷页面
  const isCurrentPageQuestionnaire = isQuestionnairePage(currentPageId);
  const currentQuestionnaireStep = getQuestionnaireStepNumber(currentPageId);


  // 如果有模块URL，使用模块路由器
  // 但必须确保用户已认证（双重检查，防止localStorage残留导致的问题）
  if (moduleUrl && isAuthenticated) {
    // 只在第一次或moduleUrl变化时输出日志
    if (process.env.NODE_ENV === 'development' && !moduleLoggedRef.current) {
      console.log('[App] 📦 渲染模块系统界面');
      moduleLoggedRef.current = true;
    }
    return (
      <div className="app-container">
        {/* 全屏提示现在使用DOM管理器处理，不再使用React组件 */}

        {/* UserInfoBar 已移到 AppShell 全局渲染 */}
        {showTimer && (isCurrentPageQuestionnaire ? <QuestionnaireTimer /> : <Timer />)}
        <div className="main-content-wrapper">
          {/* 模块系统下不显示全局导航，模块内部有自己的导航系统 */}
          <div className="task-wrapper">
            <React.Suspense fallback={
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px',
                fontSize: '16px'
              }}>
                🚀 正在加载模块系统...
              </div>
            }>
              <ModuleRouter
                globalContext={globalContext}
                authInfo={authInfo}
              />
            </React.Suspense>
          </div>
        </div>
      </div>
    );
  }

  // 重置日志标志（当不使用模块系统时）
  if (moduleLoggedRef.current) {
    moduleLoggedRef.current = false;
  }

  // 默认情况：使用传统页面路由器
  return (
    <div className="app-container">
      {/* 全屏提示现在使用DOM管理器处理，不再使用React组件 */}

      {/* UserInfoBar 已移到 AppShell 全局渲染 */}
      {/* 根据当前页面类型显示不同的计时器 */}
      {showTimer && (isCurrentPageQuestionnaire ? <QuestionnaireTimer /> : <Timer />)}
      <div className="main-content-wrapper">
        {/* 根据当前页面类型显示不同的导航 */}
        {isCurrentPageQuestionnaire ? (
          <QuestionnaireNavigation
            currentQuestionnaireStep={currentQuestionnaireStep}
            totalQuestionnaireSteps={TOTAL_QUESTIONNAIRE_STEPS}
          />
        ) : (
          showStepNavigation && <StepNavigation currentStepNumber={currentStepNumber} totalSteps={totalUserSteps} />
        )}
        <div className="task-wrapper">
          <PageRouter />
        </div>
      </div>
    </div>
  );
};

/**
 * 应用主组件
 * 包含全局状态管理和页面路由
 */
function App() {
  // 显示调试信息（可以通过查询参数控制）
  const showDebug = new URLSearchParams(window.location.search).get('debug') === 'true';
  
  return (
    <>
      <AppContent />
      {showDebug && <ApiConfigDebug />}
      {/* DevToolsPanel disabled: component is not available */}
    </>
  );
}

export default App;
