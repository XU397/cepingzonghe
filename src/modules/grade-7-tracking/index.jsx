/**
 * 7年级追踪测评模块主入口
 * 提供模块的主要组件和配置
 *
 * T103: 实现 Code Splitting - 使用 React.lazy() 懒加载所有页面组件
 */

/* eslint-disable react-refresh/only-export-components */

import { Suspense, lazy, useEffect } from 'react';
import { useRenderCounter } from '@shared/utils/RenderCounter.jsx';
import { TrackingProvider, useTrackingContext } from './context/TrackingProvider';
import { getInitialPage, getPageId } from './utils/pageMapping';
import ModuleErrorBoundary from '../ErrorBoundary';
import Spinner from './components/ui/Spinner';
import {
  MODULE_ID,
  MODULE_DISPLAY_NAME,
  MODULE_URL,
  MODULE_VERSION
} from './config';

// 懒加载所有页面组件 (使用React.lazy进行代码分割)
// T103: Code Splitting - 按需加载页面组件以减少初始 bundle 大小
const pages = {
  // 过渡页 (0.1, 0.2)
  'Page_00_1_Precautions': lazy(() => import('./pages/Page01_Notice')),
  'Page_00_2_QuestionnaireIntro': lazy(() => import('./pages/Page02_QuestionnaireNotice')),

  // 人机交互部分 (第1-13页)
  'Page_01_Intro': lazy(() => import('./pages/Page02_Intro')),
  'Page_02_Question': lazy(() => import('./pages/Page03_Question')),
  'Page_03_Resource': lazy(() => import('./pages/Page04_Resource')),
  'Page_04_Hypothesis': lazy(() => import('./pages/Page06_Hypothesis')),
  'Page_05_Design': lazy(() => import('./pages/Page07_Design')),
  'Page_06_Evaluation': lazy(() => import('./pages/Page08_Evaluation')),
  'Page_07_Transition': lazy(() => import('./pages/Page09_Transition')),
  'Page_08_Experiment': lazy(() => import('./pages/Page10_Experiment')),
  'Page_09_Analysis1': lazy(() => import('./pages/Page11_Analysis1')),
  'Page_10_Analysis2': lazy(() => import('./pages/Page12_Analysis2')),
  'Page_11_Analysis3': lazy(() => import('./pages/Page13_Analysis3')),
  'Page_12_Solution': lazy(() => import('./pages/Page14_Solution')),
  'Page_13_Summary': lazy(() => import('./pages/Page13_Summary')),

  // 问卷部分 (第14-21页)
  'Questionnaire_01': lazy(() => import('./pages/Page15_Questionnaire1')),
  'Questionnaire_02': lazy(() => import('./pages/Page16_Questionnaire2')),
  'Questionnaire_03': lazy(() => import('./pages/Page17_Questionnaire3')),
  'Questionnaire_04': lazy(() => import('./pages/Page18_Questionnaire4')),
  'Questionnaire_05': lazy(() => import('./pages/Page19_Questionnaire5')),
  'Questionnaire_06': lazy(() => import('./pages/Page20_Questionnaire6')),
  'Questionnaire_07': lazy(() => import('./pages/Page21_Questionnaire7')),
  'Questionnaire_08': lazy(() => import('./pages/Page22_Questionnaire8')),

  // 完成页 (第22页)
  'Page_22_Completion': lazy(() => import('./pages/Page23_Completion'))
};

/**
 * 页面加载中占位组件
 * T103: 使用 Spinner 组件提供更好的加载体验
 */
const PageLoadingFallback = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5'
  }}>
    <Spinner size="large" message="页面加载中..." />
  </div>
);

/**
 * 内部路由组件 - 根据TrackingContext的session.currentPage渲染对应页面
 * 这个组件在TrackingProvider内部，可以访问TrackingContext
 */
const ModuleRouter = () => {
  // DEV-only render counter for g7-tracking visuals: 15s window, threshold 80
  useRenderCounter({ component: 'g7-tracking', windows: [15], thresholds: { 15: 80 } })
  const { session } = useTrackingContext();

  // 根据 session.currentPage 动态获取当前页面ID
  const currentPageId = getPageId(session.currentPage);

  // 获取对应的页面组件(如果不存在则使用默认页)
  const CurrentPageComponent = pages[currentPageId] || pages['Page_00_1_Precautions'];

  useEffect(() => {
    console.log('[ModuleRouter] 页面渲染', {
      currentPage: session.currentPage,
      currentPageId,
      navigationMode: session.navigationMode
    });
  }, [session.currentPage, currentPageId, session.navigationMode]);

  return (
    <div className="grade-7-tracking-module">
      {/* T103: Suspense 包裹懒加载组件，显示 loading 状态 */}
      <Suspense fallback={<PageLoadingFallback />}>
        <CurrentPageComponent />
      </Suspense>
    </div>
  );
};

/**
 * 7年级追踪测评模块主组件
 * @param {Object} props - 组件属性
 * @param {Object} props.userContext - 用户上下文(包含认证信息、会话数据等)
 * @param {string} props.initialPageId - 初始页面ID(用于页面恢复)
 */
const Grade7TrackingModule = ({ userContext, initialPageId, children }) => {
  console.log('[Grade7TrackingModule] 7年级追踪测评模块初始化', {
    hasUserContext: !!userContext,
    initialPageId,
    userContextAuth: userContext ? {
      hasBatchCode: !!userContext.batchCode,
      hasExamNo: !!userContext.examNo,
      batchCode: userContext.batchCode,
      examNo: userContext.examNo,
      moduleUrl: userContext.moduleUrl
    } : null
  });

  // T101: 禁用浏览器后退按钮
  useEffect(() => {
    const handlePopState = (event) => {
      // 阻止默认行为
      event.preventDefault();

      const confirmed = window.confirm(
        '离开此页面将导致您的答题进度丢失，确定要离开吗？'
      );

      if (!confirmed) {
        // 阻止后退，保持在当前页
        window.history.pushState(null, '', window.location.href);
      } else {
        // 用户确认离开，允许后退
        console.log('[Grade7TrackingModule] 用户确认离开，允许后退');
      }
    };

    // 添加监听器
    window.addEventListener('popstate', handlePopState);

    // 初始化历史记录状态
    window.history.pushState(null, '', window.location.href);

    console.log('[Grade7TrackingModule] 浏览器后退按钮监听已启用');

    return () => {
      window.removeEventListener('popstate', handlePopState);
      console.log('[Grade7TrackingModule] 浏览器后退按钮监听已移除');
    };
  }, []);

  // 获取初始页面ID
  const initialPage = initialPageId || getInitialPage(null);

  return (
    <ModuleErrorBoundary>
      <TrackingProvider userContext={userContext} initialPageId={initialPage}>
        {children}
        {/* ModuleRouter 在 TrackingProvider 内部，可以访问 session.currentPage */}
        <ModuleRouter />
      </TrackingProvider>
    </ModuleErrorBoundary>
  );
};

/**
 * 7年级追踪测评模块定义
 * 符合 ModuleRegistry 要求的模块接口
 */
export const Grade7TrackingModule_Definition = {
  // 必需字段
  moduleId: MODULE_ID,
  displayName: MODULE_DISPLAY_NAME,
  url: MODULE_URL,
  version: MODULE_VERSION,

  // 主模块组件
  ModuleComponent: Grade7TrackingModule,

  // 页面恢复函数
  getInitialPage: (pageNum) => {
    console.log(`[Grade7TrackingModule] 获取初始页面, pageNum: ${pageNum}`);

    // 使用工具函数处理页面映射
    const pageId = getInitialPage(pageNum);

    console.log(`[Grade7TrackingModule] 页面恢复: pageNum ${pageNum} → ${pageId}`);
    return pageId;
  },

  // 可选的生命周期钩子
  onInitialize: () => {
    console.log('[Grade7TrackingModule] 模块初始化...');
    // 预加载资源、初始化跟踪器等
  },

  onDestroy: () => {
    console.log('[Grade7TrackingModule] 模块清理...');
    // 清理定时器、移除监听器等
  }
};

// 默认导出模块定义
export default Grade7TrackingModule_Definition;
