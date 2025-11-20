import React, { useEffect, useMemo, useState } from 'react';
import { PvSandProvider, usePvSandContext } from '../context/PvSandContext';
import { getInitialPageId } from '../mapping';
import Page01bTaskCover from '../pages/Page01bTaskCover';
import Page03Background from '../pages/Page03Background';
import Page04ExperimentDesign from '../pages/Page04ExperimentDesign';
import Page05Tutorial from '../pages/Page05Tutorial';
import Page06Experiment1 from '../pages/Page06Experiment1';
import Page07Experiment2 from '../pages/Page07Experiment2';
import Page08Conclusion from '../pages/Page08Conclusion';

const DevPageRouter: React.FC = () => {
  const { currentPageId } = usePvSandContext();

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

const HarnessTap: React.FC = () => {
  const { operationLogs, answerList, currentPageId } = usePvSandContext();

  useEffect(() => {
    (window as any).__pvSandHarness__ = {
      operations: operationLogs,
      answers: answerList,
      currentPageId
    };
  }, [operationLogs, answerList, currentPageId]);

  return null;
};

const PvSandDevHarness: React.FC = () => {
  const resolvedInitialPage = useMemo(() => {
    const search = new URLSearchParams(window.location.search);
    return search.get('page') || getInitialPageId();
  }, []);
  const [initialPageId] = useState(resolvedInitialPage);

  const sidebarInfo = useMemo(() => ([
    '路径：/dev/pv-sand（无需 Flow/账号）',
    'log/answer 通过 window.__pvSandHarness__ 暴露',
    '默认 20min/10min 计时配置，可自行修改',
  ]), []);

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f6f8fb' }}>
      <aside style={{ width: 280, padding: 16, borderRight: '1px solid #e5e7eb' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 18 }}>光伏治沙 Dev Harness</h2>
        <ul style={{ paddingLeft: 18, margin: 0, color: '#374151', lineHeight: 1.6 }}>
          {sidebarInfo.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 12, lineHeight: 1.6 }}>
          <p style={{ margin: 0 }}>Playwright 可直接读取 window.__pvSandHarness__ 校验提交 payload。</p>
          <p style={{ margin: 0 }}>可通过 ?page=page04-experiment-design 等 query 直达指定页面以跳过倒计时。</p>
        </div>
      </aside>
      <main style={{ flex: 1, overflow: 'auto' }}>
        <PvSandProvider initialPageId={initialPageId}>
          <HarnessTap />
          <DevPageRouter />
        </PvSandProvider>
      </main>
    </div>
  );
};

export default PvSandDevHarness;
