import React, { useEffect, lazy, Suspense } from 'react';
import { PvSandProvider, usePvSandContext } from './context/PvSandContext';
import { SubmoduleProps } from './types';
import { getInitialPageId } from './mapping';

const Page01bTaskCover = lazy(() => import('./pages/Page01bTaskCover'));
const Page03Background = lazy(() => import('./pages/Page03Background'));
const Page04ExperimentDesign = lazy(() => import('./pages/Page04ExperimentDesign'));
const Page05Tutorial = lazy(() => import('./pages/Page05Tutorial'));
const Page06Experiment1 = lazy(() => import('./pages/Page06Experiment1'));
const Page07Experiment2 = lazy(() => import('./pages/Page07Experiment2'));
const Page08Conclusion = lazy(() => import('./pages/Page08Conclusion'));

const PageRouter: React.FC = () => {
  const { currentPageId, logOperation } = usePvSandContext();

  useEffect(() => {
    logOperation({
      targetElement: 'flow_context',
      eventType: 'flow_context',
      value: JSON.stringify({
        flowId: 'g8-physics-assessment',
        submoduleId: 'g8-pv-sand-experiment',
        stepIndex: 1
      }),
      time: new Date().toISOString()
    });
  }, [logOperation]);

  const renderPage = () => {
    switch (currentPageId) {
      case 'page01b-task-cover':
        return <Page01bTaskCover />;
      case 'page02-cover':
        return <Page01bTaskCover />;
      case 'page03-background':
        return <Page03Background />;
      case 'page04-experiment-design':
        return <Page04ExperimentDesign />;
      case 'page05-tutorial':
        return <Page05Tutorial />;
      case 'page06-experiment1':
        return <Page06Experiment1 />;
      case 'page07-experiment2':
        return <Page07Experiment2 />;
      case 'page08-conclusion':
        return <Page08Conclusion />;
      default:
        return <Page01bTaskCover />;
    }
  };

  return (
    <Suspense fallback={
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: 'var(--cartoon-dark)'
      }}>
        正在加载光伏治沙实验...
      </div>
    }>
      {renderPage()}
    </Suspense>
  );
};

const G8PvSandExperiment: React.FC<SubmoduleProps> = ({ 
  userContext, 
  initialPageId,
  options,
  flowContext
}) => {
  const resolvedInitialPageId = initialPageId || getInitialPageId();

  useEffect(() => {
    if (options?.timers) {
      console.log('[G8PvSandExperiment] Timer configuration:', options.timers);
    }
    if (flowContext) {
      console.log('[G8PvSandExperiment] Flow context:', flowContext);
    }
  }, [options, flowContext]);

  return (
    <PvSandProvider initialPageId={resolvedInitialPageId}>
      <div 
        className="g8-pv-sand-experiment"
        style={{
          width: '100%',
          height: '100%',
          fontFamily: 'var(--font-family)',
          backgroundColor: 'var(--cartoon-bg)'
        }}
      >
        <PageRouter />
      </div>
    </PvSandProvider>
  );
};

export default G8PvSandExperiment;