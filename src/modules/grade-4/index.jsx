/**
 * 四年级火车购票测评模块主入口
 * 提供模块的主要组件和配置
 */

// Import React for JSX
import React from 'react';
import { Grade4Provider, useGrade4Context } from './context/Grade4Context';
import NoticesPage from './pages/00-NoticesPage';
import ScenarioIntroPage from './pages/01-ScenarioIntroPage';
import ProblemIdentificationPage from './pages/02-ProblemIdentificationPage';
import TrainTicketFactorsPage from './pages/03-TrainTicketFactorsPage';
import RouteAnalysisPage from './pages/04-RouteAnalysisPage';
import StationRecommendationPage from './pages/05-StationRecommendationPage';
import TimelinePlanningPage from './pages/06-TimelinePlanningPage';
import UserSolutionDesignPage from './pages/07-UserSolutionDesignPage';
import PlanOptimizationPage from './pages/08-PlanOptimizationPage';
import TicketFilterPage from './pages/09-TicketFilterPage';
import TicketPricingPage from './pages/10-TicketPricingPage';
import TaskCompletionPage from './pages/12-TaskCompletionPage';
import GlobalTimer from './components/GlobalTimer';
import LeftNavigation from './components/LeftNavigation';
import { moduleConfig } from './moduleConfig';

// 引入全局布局样式 - CSS Modules版本
import layoutStyles from './styles/Grade4Layout.module.css';

/**
 * 页面路由组件
 * 根据当前页面状态渲染相应的页面组件
 * 注意事项页面不显示左侧导航栏，其他页面显示
 */
const Grade4PageRouter = () => {
  const { currentPage, currentNavigationStep } = useGrade4Context();

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 1:
        return <NoticesPage />;
      case 2:
        return <ScenarioIntroPage />;
      case 3:
        return <ProblemIdentificationPage />;
      case 4:
        return <TrainTicketFactorsPage />;
      case 5:
        return <RouteAnalysisPage />;
      case 6:
        return <StationRecommendationPage />;
      case 7:
        return <TimelinePlanningPage />;
      case 8:
        return <UserSolutionDesignPage />;
      case 9:
        return <PlanOptimizationPage />;
      case 10:
        return <TicketFilterPage />;
      case 11:
        return <TicketPricingPage />;
      case 12:
        return <TaskCompletionPage />;
      default:
        return <NoticesPage />;
    }
  };

  // 注意事项页面（第1页）不显示左侧导航栏
  const isNoticesPage = currentPage === 1;

  return (
    <div className={`${layoutStyles.grade4Module} grade-4-module`}>
      {/* 全局计时器 */}
      <GlobalTimer />
      
      {isNoticesPage ? (
        // 注意事项页面：全屏显示，无左侧导航
        <div className={layoutStyles.fullPageContainer}>
          {renderCurrentPage()}
        </div>
      ) : (
        // 其他页面：显示左侧导航 + 右侧内容
        <div className={layoutStyles.moduleLayout}>
          {/* 左侧导航栏 */}
          <div className={layoutStyles.leftSidebar}>
            <LeftNavigation currentStep={currentNavigationStep} />
          </div>
          
          {/* 右侧页面内容区域 */}
          <div className={layoutStyles.pageContainer}>
            {renderCurrentPage()}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * 四年级模块主组件
 * @param {Object} props - 组件属性
 * @param {Object} props.globalContext - 全局上下文
 * @param {Object} props.authInfo - 认证信息
 * @param {string} props.initialPageId - 初始页面ID（用于页面恢复）
 */
const Grade4Module = ({ userContext, initialPageId }) => {
  // 与模块路由器接口对齐：从 userContext 推导所需上下文与认证信息
  const derivedGlobalContext = userContext || null;
  const derivedAuthInfo = userContext ? {
    batchCode: userContext.batchCode,
    examNo: userContext.examNo,
    url: userContext.url,
    pageNum: userContext.pageNum
  } : null;

  console.log('[Grade4Module] 🎯 4年级模块初始化', {
    hasUserContext: !!userContext,
    initialPageId,
    authInfo: derivedAuthInfo ? {
      hasBatchCode: !!derivedAuthInfo.batchCode,
      hasExamNo: !!derivedAuthInfo.examNo,
      batchCode: derivedAuthInfo.batchCode,
      examNo: derivedAuthInfo.examNo,
      url: derivedAuthInfo.url
    } : null,
    globalContextAuth: derivedGlobalContext ? {
      hasBatchCode: !!derivedGlobalContext.batchCode,
      hasExamNo: !!derivedGlobalContext.examNo,
      batchCode: derivedGlobalContext.batchCode,
      examNo: derivedGlobalContext.examNo,
      moduleUrl: derivedGlobalContext.moduleUrl
    } : null
  });

  return (
    <div className={layoutStyles.moduleContainer}>
      <Grade4Provider 
        globalContext={derivedGlobalContext} 
        authInfo={derivedAuthInfo}
        initialPageId={initialPageId}
      >
        <Grade4PageRouter />
      </Grade4Provider>
    </div>
  );
};

/**
 * 获取初始页面
 * @param {string|number} pageNum - 页面编号（可选）
 * @returns {string} 页面标识
 */
const getInitialPage = (pageNum = null) => {
  console.log(`[Grade4Module] 🔄 获取初始页面, pageNum: ${pageNum}`);
  
  // 如果指定了页面编号，返回对应页面（与7年级逻辑一致）
  if (pageNum !== null && pageNum !== undefined) {
    const pageNumber = parseInt(pageNum);
    let pageId;
    
    switch (pageNumber) {
      case 1: pageId = 'notices'; break;
      case 2: pageId = 'scenario-intro'; break;
      case 3: pageId = 'problem-identification'; break;
      case 4: pageId = 'factor-analysis'; break;
      case 5: pageId = 'route-analysis'; break;
      case 6: pageId = 'station-recommendation'; break;
      case 7: pageId = 'timeline-planning-tutorial'; break;
      case 8: pageId = 'user-solution-design'; break;
      case 9: pageId = 'plan-optimization'; break;
      case 10: pageId = 'ticket-filter'; break;
      case 11: pageId = 'ticket-pricing'; break;
      case 12: pageId = 'task-completion'; break;
      default: pageId = 'notices'; break;
    }
    
    console.log(`[Grade4Module] ✅ 页面恢复: pageNum ${pageNumber} → ${pageId}`);
    return pageId;
  }
  
  // 默认返回注意事项页面
  const defaultPage = moduleConfig.settings.defaultPage || 'notices';
  console.log(`[Grade4Module] 📄 使用默认页面: ${defaultPage}`);
  return defaultPage;
};

/**
 * 四年级模块定义
 * 符合 ModuleRegistry 要求的模块接口
 */
export const Grade4Module_Definition = {
  moduleId: moduleConfig.moduleId,
  displayName: moduleConfig.displayName,
  url: moduleConfig.url,
  version: moduleConfig.version,
  
  // 主模块组件
  ModuleComponent: Grade4Module,
  
  // 获取初始页面函数
  getInitialPage,
  
  // 模块配置
  moduleConfig: {
    timers: moduleConfig.timers,
    pages: moduleConfig.pages,
    settings: moduleConfig.settings
  }
};

// 默认导出模块组件
export default Grade4Module;
