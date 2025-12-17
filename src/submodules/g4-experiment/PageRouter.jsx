import { useG4Context } from './context/G4Context';
import { useG4Navigation } from './hooks/useG4Navigation';
import { useTimeoutHandler } from './hooks/useTimeoutHandler';
import { useErrorHandler } from './hooks/useErrorHandler';
import Page01_Notices from './pages/Page01_Notices';
import Page02_ScenarioIntro from './pages/Page02_ScenarioIntro';
import Page03_ProblemId from './pages/Page03_ProblemId';
import Page04_FactorAnalysis from './pages/Page04_FactorAnalysis';
import Page05_RouteAnalysis from './pages/Page05_RouteAnalysis';
import Page06_StationRec from './pages/Page06_StationRec';
import Page07_TimelineTutorial from './pages/Page07_TimelineTutorial';
import Page08_SolutionDesign from './pages/Page08_SolutionDesign';
import Page09_PlanOptimize from './pages/Page09_PlanOptimize';
import Page10_TicketFilter from './pages/Page10_TicketFilter';
import Page11_TicketPricing from './pages/Page11_TicketPricing';
import Page12_Completion from './pages/Page12_Completion';
import styles from './PageRouter.module.css';

const PAGE_COMPONENTS = {
  notices: Page01_Notices,
  'scenario-intro': Page02_ScenarioIntro,
  'problem-identification': Page03_ProblemId,
  'factor-analysis': Page04_FactorAnalysis,
  'route-analysis': Page05_RouteAnalysis,
  'station-recommendation': Page06_StationRec,
  'timeline-planning-tutorial': Page07_TimelineTutorial,
  'user-solution-design': Page08_SolutionDesign,
  'plan-optimization': Page09_PlanOptimize,
  'ticket-filter': Page10_TicketFilter,
  'ticket-pricing': Page11_TicketPricing,
  'task-completion': Page12_Completion,
};

export function PageRouter() {
  const { state, collectAnswer } = useG4Context();
  const { currentPageId } = state;
  const { handleNextPage, lastError } = useG4Navigation();
  const Component = PAGE_COMPONENTS[currentPageId];

  // 接入超时处理（FR-073）
  useTimeoutHandler({ handleNextPage, collectAnswer });

  // 接入错误处理（FR-074/075）
  const { errorMessage, showRetry, clearError } = useErrorHandler({
    lastError,
    onSessionExpired: () => {
      // 会话过期时清除本地存储并跳转登录
      localStorage.removeItem('hci-isAuthenticated');
      window.location.href = '/';
    },
  });

  if (Component) {
    return (
      <>
        {errorMessage && (
          <div className={styles.errorBanner}>
            <span>{errorMessage}</span>
            {showRetry && (
              <button onClick={clearError} className={styles.retryButton}>
                重试
              </button>
            )}
          </div>
        )}
        <Component />
      </>
    );
  }

  return <div data-page-id={currentPageId} className={styles.unknownPage}>未知页面: {currentPageId}</div>;
}

export default PageRouter;
