import React from 'react';
import { useAppContext } from '../context/AppContext';
import { getPageTitle } from '../utils/pageMappings';

// 导入所有页面组件
import LoginPage from '../pages/LoginPage';
import PrecautionsPage from '../pages/PrecautionsPage';
import IntroductionPage from '../pages/IntroductionPage';
import Page_03_Dialogue_Question from '../pages/Page_03_Dialogue_Question';
import Page_04_Material_Reading_Factor_Selection from '../pages/Page_04_Material_Reading_Factor_Selection';
import HypothesisFocusPage from '../pages/HypothesisFocusPage';
import Page_11_Solution_Design_Measurement_Ideas from '../pages/Page_11_Solution_Design_Measurement_Ideas';
import Page_12_Solution_Evaluation_Measurement_Critique from '../pages/Page_12_Solution_Evaluation_Measurement_Critique';
import TransitionToSimulationPage from '../pages/TransitionToSimulationPage';
import Page_14_Simulation_Intro_Exploration from '../pages/Page_14_Simulation_Intro_Exploration';
import Page_15_Simulation_Question_1 from '../pages/Page_15_Simulation_Question_1';
import Page_16_Simulation_Question_2 from '../pages/Page_16_Simulation_Question_2';
import Page_17_Simulation_Question_3 from '../pages/Page_17_Simulation_Question_3';
import Page_18_Solution_Selection from '../pages/Page_18_Solution_Selection';
import Page_19_Task_Completion from '../pages/Page_19_Task_Completion';

// 问卷页面组件
import Page_20_Questionnaire_Intro from '../pages/questionnaire/Page_20_Questionnaire_Intro';
import Page_21_Curiosity_Questions from '../pages/questionnaire/Page_21_Curiosity_Questions';
import Page_22_Creativity_Questions from '../pages/questionnaire/Page_22_Creativity_Questions';
import Page_23_Imagination_Questions from '../pages/questionnaire/Page_23_Imagination_Questions';
import Page_24_Science_Efficacy_Questions from '../pages/questionnaire/Page_24_Science_Efficacy_Questions';
import Page_25_Environment_Questions from '../pages/questionnaire/Page_25_Environment_Questions';
import Page_26_School_Activities from '../pages/questionnaire/Page_26_School_Activities';
import Page_27_Outschool_Activities from '../pages/questionnaire/Page_27_Outschool_Activities';
import Page_28_Effort_Submit from '../pages/questionnaire/Page_28_Effort_Submit';
// ...其他页面组件

/**
 * 页面路由组件
 * 根据当前页面ID显示相应的页面组件
 */
const PageRouter = () => {
  const { currentPageId, isAuthenticated } = useAppContext();
  
  // 减少日志频率，避免控制台刷屏
  const logRef = React.useRef('');
  if (logRef.current !== currentPageId) {
    console.log(`[PageRouter] Rendering for currentPageId: ${currentPageId}`);
    logRef.current = currentPageId;
  }
  
  // 获取当前页面标题
  const pageTitle = getPageTitle(currentPageId);
  
  // 受保护的页面列表（需要登录才能访问）
  const protectedPages = [
    'Page_01_Precautions',
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
    'Page_18_Solution_Selection',
    'Page_19_Task_Completion',
    // 问卷页面也需要登录保护
    'Page_20_Questionnaire_Intro',
    'Page_21_Curiosity_Questions',
    'Page_22_Creativity_Questions',
    'Page_23_Imagination_Questions',
    'Page_24_Science_Efficacy_Questions',
    'Page_25_Environment_Questions',
    'Page_26_School_Activities',
    'Page_27_Outschool_Activities',
    'Page_28_Effort_Submit'
  ];
  
  // 检查是否需要登录
  const isProtectedPage = protectedPages.includes(currentPageId);
  const shouldShowLogin = (isProtectedPage && !isAuthenticated) || currentPageId === 'Page_Login';
  
  // 如果是受保护页面且用户未登录，显示登录页面
  if (shouldShowLogin) {
    return <LoginPage />;
  }
  
  // 根据currentPageId选择渲染的页面组件
  const renderPageContent = () => {
    // 注释掉过于频繁的日志，避免控制台刷屏
    // console.log(`[PageRouter] renderPageContent called with currentPageId: ${currentPageId}`);
    switch (currentPageId) {
      case 'Page_Login':
        return <LoginPage />;
      case 'Page_01_Precautions':
        return <PrecautionsPage />;
      case 'Page_02_Introduction':
        return <IntroductionPage />;
      case 'Page_03_Dialogue_Question':
        return <Page_03_Dialogue_Question />;
      case 'Page_04_Material_Reading_Factor_Selection':
        return <Page_04_Material_Reading_Factor_Selection />;
      case 'Page_10_Hypothesis_Focus':
        return <HypothesisFocusPage />;
      case 'Page_11_Solution_Design_Measurement_Ideas':
        return <Page_11_Solution_Design_Measurement_Ideas />;
      case 'Page_12_Solution_Evaluation_Measurement_Critique':
        return <Page_12_Solution_Evaluation_Measurement_Critique />;
      case 'Page_13_Transition_To_Simulation':
        return <TransitionToSimulationPage />;
      case 'Page_14_Simulation_Intro_Exploration':
        return <Page_14_Simulation_Intro_Exploration />;
      case 'Page_15_Simulation_Question_1':
        return <Page_15_Simulation_Question_1 />;
      case 'Page_16_Simulation_Question_2':
        return <Page_16_Simulation_Question_2 />;
      case 'Page_17_Simulation_Question_3':
        return <Page_17_Simulation_Question_3 />;
      case 'Page_18_Solution_Selection':
        return <Page_18_Solution_Selection />;
      case 'Page_19_Task_Completion':
        return <Page_19_Task_Completion />;
      // 问卷页面路由
      case 'Page_20_Questionnaire_Intro':
        return <Page_20_Questionnaire_Intro />;
      case 'Page_21_Curiosity_Questions':
        return <Page_21_Curiosity_Questions />;
      case 'Page_22_Creativity_Questions':
        return <Page_22_Creativity_Questions />;
      case 'Page_23_Imagination_Questions':
        return <Page_23_Imagination_Questions />;
      case 'Page_24_Science_Efficacy_Questions':
        return <Page_24_Science_Efficacy_Questions />;
      case 'Page_25_Environment_Questions':
        return <Page_25_Environment_Questions />;
      case 'Page_26_School_Activities':
        return <Page_26_School_Activities />;
      case 'Page_27_Outschool_Activities':
        return <Page_27_Outschool_Activities />;
      case 'Page_28_Effort_Submit':
        return <Page_28_Effort_Submit />;
      // ...其他页面组件
      default:
        // 临时显示当前页面ID（开发阶段）
        return (
          <div className="page-content page-fade-in">
            <h1 className="page-title">{pageTitle}</h1>
            <p>当前页面ID: {currentPageId}</p>
            <p>页面开发中...</p>
          </div>
        );
    }
  };
  
  return renderPageContent();
};

export default PageRouter; 