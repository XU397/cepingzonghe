import React from 'react';
import { Routes, Route, useParams, useLocation, useNavigate } from 'react-router-dom';
import App from '@/App.jsx';
import { FlowModule } from '@/flows/FlowModule.jsx';
import { AppProvider, useAppContext } from '@/context/AppContext.jsx';
import G8DroneImagingDevPage from '@/dev/G8DroneImagingDevPage.jsx';
import UserInfoBar from '@/components/common/UserInfoBar.jsx';
import FullscreenEnforcer from '@/components/FullscreenEnforcer.jsx';
import PvSandDevHarness from '@/submodules/g8-pv-sand-experiment/dev/PvSandDevHarness';
import { isFullscreenFeatureEnabled } from '@/utils/fullscreenPreference';
import STORAGE_KEYS, { getStorageItem } from '@shared/services/storage/storageKeys.js';
import { shouldHideUserInfoBar, shouldRedirectToFlowRoute } from './appShellVisibility.js';

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

function AppShellContent() {
  const isDevEnvironment =
    Boolean(import.meta.env?.DEV) ||
    import.meta.env?.MODE === 'development' ||
    (typeof process !== 'undefined' && process.env.NODE_ENV === 'development');

  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, moduleUrl, batchCode, examNo, pageNum, currentUser } = useAppContext();
  const persistedModuleUrl = getStorageItem(STORAGE_KEYS.CORE_MODULE_URL) || '';
  const sessionBatchCode = batchCode || currentUser?.batchCode || getStorageItem(STORAGE_KEYS.CORE_BATCH_CODE) || '';
  const sessionExamNo = examNo || currentUser?.examNo || getStorageItem(STORAGE_KEYS.CORE_EXAM_NO) || '';
  const verifiedSession = React.useMemo(() => ({
    isAuthenticated,
    currentUser,
    batchCode: sessionBatchCode,
    examNo: sessionExamNo,
  }), [currentUser, isAuthenticated, sessionBatchCode, sessionExamNo]);
  const effectiveModuleUrl = moduleUrl || (isAuthenticated ? persistedModuleUrl : '');
  const hideUserInfoBar = shouldHideUserInfoBar(location.pathname, {
    ...verifiedSession,
    moduleUrl: effectiveModuleUrl,
  });

  const fullscreenEnabled = isFullscreenFeatureEnabled();

  React.useEffect(() => {
    if (!shouldRedirectToFlowRoute(location.pathname, effectiveModuleUrl, verifiedSession)) {
      return;
    }

    navigate(effectiveModuleUrl, {
      replace: true,
      state: {
        userContext: {
          batchCode: sessionBatchCode,
          examNo: sessionExamNo,
          url: effectiveModuleUrl,
          moduleUrl: effectiveModuleUrl,
          pageNum: pageNum || getStorageItem(STORAGE_KEYS.CORE_PAGE_NUM) || null,
          ...(currentUser?.studentName ? { studentName: currentUser.studentName } : {}),
        },
      },
    });
  }, [
    batchCode,
    currentUser?.studentName,
    effectiveModuleUrl,
    examNo,
    location.pathname,
    navigate,
    pageNum,
    sessionBatchCode,
    sessionExamNo,
    verifiedSession,
  ]);

  return (
    <>
      {fullscreenEnabled && <FullscreenEnforcer />}
      {/* Global UserInfoBar (fixed position); shared across all routes */}
      {!hideUserInfoBar && <UserInfoBar forceVisible />}
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
          element={
            <React.StrictMode>
              <App />
            </React.StrictMode>
          }
        />
      </Routes>
    </>
  );
}

// AppShell: top-level shell wiring routes and global entry points
export default function AppShell() {
  return (
    <AppProviders>
      <AppProvider>
        <AppShellContent />
      </AppProvider>
    </AppProviders>
  );
}
