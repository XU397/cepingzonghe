import React from 'react';
import { Routes, Route, useParams, useLocation } from 'react-router-dom';
import App from '@/App.jsx';
import { FlowModule } from '@/flows/FlowModule.jsx';
import { AppProvider } from '@/context/AppContext.jsx';
import DevG8DroneImagingHarness from '@/dev/g8-drone-imaging/DevHarness.jsx';

function AppProviders({ children }) {
  return children;
}

function FlowRoute() {
  const { flowId } = useParams();
  const location = useLocation();
  const routeState = location.state || {};

  return (
    <FlowModule
      key={flowId}
      flowId={flowId}
      userContext={routeState.userContext}
      initialPageId={routeState.initialPageId}
    />
  );
}

// AppShell: 顶层应用外壳，集中挂载路由与全局入口
export default function AppShell() {
  return (
    <AppProviders>
      <AppProvider>
        <Routes>
          {/* Flow 路由：不包裹 StrictMode，避免开发期双渲染导致编排器二次初始化 */}
          <Route path="/flow/:flowId" element={<FlowRoute />} />
          <Route
            path="/dev/g8-drone-imaging"
            element={(
              <React.StrictMode>
                <DevG8DroneImagingHarness />
              </React.StrictMode>
            )}
          />
          {/* 传统模块路由：在 element 内部包裹 StrictMode，从而仅对该分支启用 */}
          {/* 说明：顶层/外层 StrictMode 会在首次装载时决定行为，
              路由切换后无法动态切换。将 StrictMode 放到具体路由的
              element 中，能够确保 /flow/* 不受影响，而其他模块保持
              开发期双重渲染以捕获副作用。*/}
          <Route
            path="*"
            element={(
              <React.StrictMode>
                <App />
              </React.StrictMode>
            )}
          />
        </Routes>
      </AppProvider>
    </AppProviders>
  );
}
