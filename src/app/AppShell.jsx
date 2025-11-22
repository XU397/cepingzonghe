import React from 'react';
import { Routes, Route, useParams, useLocation } from 'react-router-dom';
import App from '@/App.jsx';
import { FlowModule } from '@/flows/FlowModule.jsx';
import { AppProvider } from '@/context/AppContext.jsx';
import G8DroneImagingDevPage from '@/dev/G8DroneImagingDevPage.jsx';
import UserInfoBar from '@/components/common/UserInfoBar.jsx';
import PvSandDevHarness from '@/submodules/g8-pv-sand-experiment/dev/PvSandDevHarness';

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

// AppShell: top-level shell wiring routes and global entry points
export default function AppShell() {
  const isDevEnvironment = typeof process !== 'undefined'
    ? process.env.NODE_ENV === 'development'
    : Boolean(import.meta.env?.DEV);

  const location = useLocation();
  // Hide UserInfoBar on login and landing routes
  const isLoginPage = location.pathname === '/login' || location.pathname === '/';

  return (
    <AppProviders>
      <AppProvider>
        {/* Global UserInfoBar (fixed position); shared across all routes */}
        {!isLoginPage && <UserInfoBar />}
        <Routes>
          {/* Flow routes skip StrictMode to avoid double init during dev */}
          <Route path="/flow/:flowId" element={<FlowRoute />} />
          {/* Dev-only harness routes; enabled only during development */}
          {isDevEnvironment && (
            <>
              <Route path="/dev/g8-drone-imaging" element={<G8DroneImagingDevPage />} />
              <Route path="/dev/pv-sand" element={<PvSandDevHarness />} />
            </>
          )}
          {/* Other modules wrap elements in StrictMode for that branch only.
              Keeping StrictMode inside the element keeps /flow/* untouched while
              letting the rest double-render in dev to surface side effects. */}
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
