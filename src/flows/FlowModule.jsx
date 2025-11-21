/**
 * Flow Module - 拼装式测评入�? * 识别 /flow/<flowId>，动态加载子模块并管理过�? */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FlowOrchestrator } from './orchestrator/FlowOrchestrator';
import { TransitionPage } from '@shared/ui/PageFrame';
import { FlowAppContextBridge } from './FlowAppContextBridge';
import { FlowProvider } from '@/flows/context';
import { submoduleRegistry } from '@/submodules/registry';
import { useAppContext } from '@/context/AppContext';
import { createFlowContextOperation } from '@/shared/types/flow';
import { TimerService } from '@shared/services/timers';
import useHeartbeat from '@/hooks/useHeartbeat';
import styles from './FlowModule.module.css';
import { createModuleUserContext } from '@/modules/utils/createModuleUserContext.js';
import { useRenderCounter } from '@shared/utils/RenderCounter.jsx';

const FLOW_APP_CONTEXT_KEYS_TO_CLEAR = ['hci-pageNum', 'hci-currentStepNumber', 'hci-totalUserSteps'];
const debugLog = () => {};
const isDevEnv = typeof process !== 'undefined'
  ? process.env.NODE_ENV === 'development'
  : Boolean(import.meta.env?.DEV);
// 显式开关：仅当设置�?VITE_FLOW_DEV_MOCK_AUTH 时才启用 Flow �?Mock 账号
const flowDevMockAuthEnabled = Boolean(import.meta.env?.VITE_FLOW_DEV_MOCK_AUTH);
// Flow 心跳开关：默认开启，VITE_FLOW_HEARTBEAT_ENABLED=0 时可全局关闭
const flowHeartbeatEnabled =
  String(import.meta.env?.VITE_FLOW_HEARTBEAT_ENABLED ?? '1') !== '0';

// Simple flag parser (true/1/yes/on �?true)
const parseFlag = (val, def) => {
  if (val === undefined || val === null) return !!def;
  const s = String(val).toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
};

// Wrapper to optionally render FlowProvider
function MaybeFlowProvider({ enabled, providerProps, children }) {
  if (!enabled) return children;
  return <FlowProvider {...providerProps}>{children}</FlowProvider>;
}

// Wrapper to optionally render FlowAppContextBridge
function MaybeFlowAppContextBridge({ enabled, beforeNavigate, flowContext, children }) {
  if (!enabled) return children;
  return (
    <FlowAppContextBridge beforeNavigate={beforeNavigate} flowContext={flowContext}>
      {children}
    </FlowAppContextBridge>
  );
}

const createInitialState = () => ({
  loading: true,
  error: null,
  showTransition: false,
  currentStep: null,
  submoduleComponent: null,
  definition: null,
  progress: null,
});

const deriveFlowIdFromUrl = (url) => {
  if (typeof url !== 'string' || !url) {
    return null;
  }

  let pathname = url;
  try {
    if (url.includes('://')) {
      pathname = new URL(url).pathname;
    }
  } catch (error) {
    // ignore parse failures and fall back to raw string
  }

  const match = pathname.match(/\/flow\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]) : null;
};

const teardownOrchestrator = (instance) => {
  if (!instance) {
    return;
  }
  if (typeof instance.dispose === 'function') {
    instance.dispose();
  } else if (typeof instance.destroy === 'function') {
    instance.destroy();
  }
};

const logFlowContextOnce = (flowId, resolved, logOperation, loggedRef) => {
  if (!flowId || !resolved || typeof logOperation !== 'function') {
    return;
  }

  const { stepIndex, submoduleId, submoduleDefinition } = resolved;
  const cacheKey = `${flowId || 'unknown'}::${stepIndex ?? 'unknown'}`;

  if (loggedRef?.current?.has(cacheKey)) {
    debugLog('[FlowModule] flow_context already logged for step', stepIndex);
    return;
  }

  if (!loggedRef?.current) {
    loggedRef.current = new Set();
  }

  const operation = createFlowContextOperation(
    flowId,
    stepIndex,
    submoduleId,
    submoduleDefinition?.displayName || submoduleId
  );

  debugLog('[FlowModule] flow_context operation value type:', typeof operation.value, operation.value);
  const added = logOperation(operation);
  if (!added) {
    console.warn('[FlowModule] flow_context logOperation skipped (duplicate?)');
    return;
  }

  loggedRef.current.add(cacheKey);
  debugLog('[FlowModule] flow_context logged:', operation);
};

const applyTimerConfigForStep = (flowId, resolved, step) => {
  if (!resolved?.submoduleDefinition) {
    return;
  }

  const submodule = resolved.submoduleDefinition;
  const stepConfig = step || null;
  const overrides = (stepConfig && stepConfig.overrides && stepConfig.overrides.timers) || {};

  const defaultTimers =
    typeof submodule.getDefaultTimers === 'function' ? submodule.getDefaultTimers() || {} : {};

  const taskDuration =
    typeof overrides.task === 'number' && overrides.task > 0
      ? overrides.task
      : typeof defaultTimers.task === 'number' && defaultTimers.task > 0
        ? defaultTimers.task
        : null;

  const questionnaireDuration =
    typeof overrides.questionnaire === 'number' && overrides.questionnaire > 0
      ? overrides.questionnaire
      : typeof defaultTimers.questionnaire === 'number' && defaultTimers.questionnaire > 0
        ? defaultTimers.questionnaire
        : null;

  const baseScopeParts = [
    'flow',
    flowId || 'unknown',
    resolved.submoduleId || 'unknown',
    String(resolved.stepIndex ?? 0),
    ];
    const baseScope = baseScopeParts.join('::');

  if (taskDuration) {
    const expectedScope = `${baseScope}::task`;
    const taskTimer = TimerService.getInstance('task');
    const debug = taskTimer.getDebugInfo();
    const hasSameScopeRunning =
      debug.scope === expectedScope && debug.remaining > 0 && !debug.isTimeout;

    if (!hasSameScopeRunning) {
      TimerService.startTask(taskDuration, {
        scope: expectedScope,
        force: true,
      });
    }
  }

  if (questionnaireDuration) {
    const expectedScope = `${baseScope}::questionnaire`;
    const questionnaireTimer = TimerService.getInstance('questionnaire');
    const debugQ = questionnaireTimer.getDebugInfo();
    const hasSameScopeRunning =
      debugQ.scope === expectedScope && debugQ.remaining > 0 && !debugQ.isTimeout;

    if (!hasSameScopeRunning) {
      TimerService.startQuestionnaire(questionnaireDuration, {
        scope: expectedScope,
        force: true,
      });
    }
  }
};

const advanceFlowStep = ({
  orchestratorRef,
  completionSignaledRef,
  navigate,
  loadFlow,
  onFlowCompleted,
}) => {
  const orchestrator = orchestratorRef.current;
  if (!orchestrator) {
    return;
  }
  const hasNext = orchestrator.nextStep();
  completionSignaledRef.current = false;

  if (!hasNext) {
    debugLog('[FlowModule] Flow completed');
    if (typeof onFlowCompleted === 'function') {
      try {
        onFlowCompleted();
      } catch (err) {
        console.error('[FlowModule] Error during onFlowCompleted:', err);
      }
    }
    navigate('/login', { replace: true });
    return;
  }

  loadFlow();
};

const loadFlowState = async ({
  flowId,
  orchestrator,
  logOperation,
  setState,
  shouldAbort,
  flowContextLogCacheRef,
}) => {
  if (!flowId || !orchestrator || shouldAbort?.()) {
    return;
  }

  // 开始加载时设置 loading
  setState((prev) => ({
    ...prev,
    loading: true,
    error: null,
  }));

  try {
    debugLog('[FlowModule] Loading flow:', flowId);

    if (shouldAbort?.()) {
      return;
    }
    await submoduleRegistry.initialize();
    if (shouldAbort?.()) {
      return;
    }

    // Extra guard right before orchestrator.load to avoid running on disposed instance
    if (shouldAbort?.()) {
      return;
    }

    let definition, progress;
    try {
      ({ definition, progress } = await orchestrator.load());
    } catch (err) {
      // If the orchestrator was disposed during StrictMode remount window, bail out quietly
      if (shouldAbort?.()) {
        return;
      }
      const msg = String(err?.message || '');
      if (msg.includes('disposed') || msg.includes('Disposed') || msg.includes('has been disposed')) {
        console.warn('[FlowModule] Orchestrator disposed during load, aborting.');
        return;
      }
      throw err;
    }
    if (shouldAbort?.()) {
      return;
    }

      const resolved = orchestrator.resolve(definition, progress);

      if (!resolved.submoduleDefinition) {
        throw new Error(`Submodule not found: ${resolved.submoduleId}`);
      }

      if (shouldAbort?.()) {
        return;
      }

      logFlowContextOnce(flowId, resolved, logOperation, flowContextLogCacheRef);

      if (shouldAbort?.()) {
        return;
      }

      applyTimerConfigForStep(flowId, resolved, resolved.step);

      resolved.submoduleDefinition.onInitialize?.();

    if (shouldAbort?.()) {
      return;
    }

    setState({
      loading: false,
      error: null,
      showTransition: false,
      currentStep: resolved,
      submoduleComponent: resolved.submoduleDefinition.Component,
      definition,
      progress,
    });
  } catch (error) {
    if (shouldAbort?.()) {
      return;
    }
    const msg = String(error?.message || '');
    if (msg.includes('disposed') || msg.includes('Disposed')) {
      console.warn('[FlowModule] Orchestrator disposed during load (outer catch), aborting.');
      return;
    }
    console.error('[FlowModule] Load failed:', error);
    setState((prev) => ({
      ...prev,
      loading: false,
      error: msg,
    }));
  }
};

/**
 * FlowModule 主组�? */
function FlowModuleInner({ userContext, initialPageId, flowId: flowIdProp }) {
  const params = useParams();
  const navigate = useNavigate();
  const appContext = useAppContext();
  const flowContextSnapshot = useMemo(() => {
    if (!appContext) {
      return null;
    }

    return {
      currentPageId: appContext.currentPageId,
      remainingTime: appContext.remainingTime,
      taskStartTime: appContext.taskStartTime,
      pageEnterTime: appContext.pageEnterTime,
      isLoggedIn: appContext.isLoggedIn,
      isAuthenticated: appContext.isAuthenticated,
      authToken: appContext.authToken,
      currentUser: appContext.currentUser,
      moduleUrl: appContext.moduleUrl,
      pageNum: appContext.pageNum,
      examNo: appContext.examNo,
      batchCode: appContext.batchCode,
      isTaskFinished: appContext.isTaskFinished,
      isTimeUp: appContext.isTimeUp,
      questionnaireData: appContext.questionnaireData,
      questionnaireAnswers: appContext.questionnaireAnswers,
      isQuestionnaireCompleted: appContext.isQuestionnaireCompleted,
      questionnaireRemainingTime: appContext.questionnaireRemainingTime,
      isQuestionnaireStarted: appContext.isQuestionnaireStarted,
      isQuestionnaireTimeUp: appContext.isQuestionnaireTimeUp,
      questionnaireStartTime: appContext.questionnaireStartTime,
      logOperation: appContext.logOperation,
      collectAnswer: appContext.collectAnswer,
      handleLogout: appContext.handleLogout,
      clearAllCache: appContext.clearAllCache,
      startQuestionnaireTimer: appContext.startQuestionnaireTimer,
      saveQuestionnaireAnswer: appContext.saveQuestionnaireAnswer,
      getQuestionnaireAnswer: appContext.getQuestionnaireAnswer,
      completeQuestionnaire: appContext.completeQuestionnaire,
      submitPageData: appContext.submitPageData,
      submitPageDataWithInfo: appContext.submitPageDataWithInfo,
      handleLoginSuccess: appContext.handleLoginSuccess,
    };
  }, [
    appContext?.authToken,
    appContext?.batchCode,
    appContext?.clearAllCache,
    appContext?.collectAnswer,
    appContext?.completeQuestionnaire,
    appContext?.currentPageId,
    appContext?.currentUser,
    appContext?.examNo,
    appContext?.getQuestionnaireAnswer,
    appContext?.handleLoginSuccess,
    appContext?.handleLogout,
    appContext?.isAuthenticated,
    appContext?.isLoggedIn,
    appContext?.isQuestionnaireCompleted,
    appContext?.isQuestionnaireStarted,
    appContext?.isQuestionnaireTimeUp,
    appContext?.isTaskFinished,
    appContext?.isTimeUp,
    appContext?.logOperation,
    appContext?.moduleUrl,
    appContext?.pageEnterTime,
    appContext?.pageNum,
    appContext?.questionnaireAnswers,
    appContext?.questionnaireData,
    appContext?.questionnaireRemainingTime,
    appContext?.questionnaireStartTime,
    appContext?.remainingTime,
    appContext?.saveQuestionnaireAnswer,
    appContext?.startQuestionnaireTimer,
    appContext?.submitPageData,
    appContext?.submitPageDataWithInfo,
    appContext?.taskStartTime,
  ]);
  const logOperation = flowContextSnapshot?.logOperation ?? (() => {});
  const logOperationRef = useRef(logOperation);
  useEffect(() => {
    logOperationRef.current = logOperation;
  }, [logOperation]);

  // 验证 remount 行为：组件挂�?卸载日志（切�?/flow/A -> /flow/B 应触发）
  useEffect(() => {
    // 注意：这里的 flowId 在首次渲染时可能为空，等状态解析后会再次挂�?    debugLog('[FlowModule] mount', { flowId: flowIdProp });
    return () => {
      debugLog('[FlowModule] unmount', { flowId: flowIdProp });
    };
  }, []);

  const fallbackAuthInfo = useMemo(() => {
    if (!flowContextSnapshot) {
      return null;
    }
    if (
      !flowContextSnapshot.moduleUrl &&
      !flowContextSnapshot.batchCode &&
      !flowContextSnapshot.examNo
    ) {
      return null;
    }
    return {
      url: flowContextSnapshot.moduleUrl,
      pageNum: flowContextSnapshot.pageNum ?? null,
      examNo: flowContextSnapshot.examNo,
      batchCode: flowContextSnapshot.batchCode,
    };
  }, [
    flowContextSnapshot?.moduleUrl,
    flowContextSnapshot?.pageNum,
    flowContextSnapshot?.examNo,
    flowContextSnapshot?.batchCode,
  ]);

  const routeFlowId = params?.flowId || null;
  // DEV Mock only enabled when explicitly requested to avoid impacting real accounts
  const devMockFlowId = isDevEnv && flowDevMockAuthEnabled ? (flowIdProp || routeFlowId || null) : null;
  const devAuthAppliedRef = useRef(false);
  const effectiveUserContext = useMemo(() => {
    const hasFullContext =
      userContext &&
      (typeof userContext.logOperation === 'function' ||
        typeof userContext.submitPageData === 'function');

    if (hasFullContext) {
      return userContext;
    }

    const serializableUserContext = userContext
      ? {
          batchCode: userContext.batchCode || '',
          examNo: userContext.examNo || '',
          url: userContext.url || '',
          pageNum: userContext.pageNum ?? null,
          ...(userContext.studentName ? { studentName: userContext.studentName } : {}),
        }
      : null;

    if (flowContextSnapshot) {
      const mergedAuthInfo = {
        ...(fallbackAuthInfo || {}),
        ...(serializableUserContext || {}),
      };
      const rebuiltContext = createModuleUserContext(flowContextSnapshot, mergedAuthInfo);
      if (serializableUserContext?.studentName) {
        rebuiltContext.studentName = serializableUserContext.studentName;
      }
      return rebuiltContext;
    }

    if (serializableUserContext) {
      return serializableUserContext;
    }

    // 仅在显式开�?dev mock 时，才为 Flow 构�?Mock 账号
    if (devMockFlowId) {
      const mockContext = {
        batchCode: 'FLOW-MOCK',
        examNo: 'E001',
        url: `/flow/${devMockFlowId}`,
        pageNum: '1',
        studentName: 'Flow 测试用户',
      };
      debugLog(`[FlowModule] Creating mock userContext for Flow ${devMockFlowId}`);
      return mockContext;
    }
    return null;
  }, [userContext, flowContextSnapshot, fallbackAuthInfo, devMockFlowId]);

  // �?DEV 环境下，Flow 直达时补充认证状态，避免路由层显示登录页
  const handleLoginSuccess = flowContextSnapshot?.handleLoginSuccess;
  const hasRealAuthContext =
    Boolean(flowContextSnapshot?.isAuthenticated) &&
    Boolean(flowContextSnapshot?.batchCode || flowContextSnapshot?.examNo);
  useEffect(() => {
    // 仅在显式开�?dev mock 且当前没有真实账号上下文时，才注�?Mock 账号
    if (!devMockFlowId) return;
    if (typeof handleLoginSuccess !== 'function') return;
    if (devAuthAppliedRef.current) return;
    // 如果已经有真实的认证上下文（来自后端登录），则不要再注入 Mock 账号
    if (hasRealAuthContext) return;

    const userData = {
      batchCode: 'FLOW-MOCK',
      examNo: 'E001',
      url: `/flow/${devMockFlowId}`,
      pageNum: '1',
      studentName: 'Flow 测试用户',
    };

    debugLog('[FlowModule] Setting mock authentication via handleLoginSuccess');
    try {
      handleLoginSuccess(userData);
      devAuthAppliedRef.current = true;
    } catch (err) {
      console.error('[FlowModule] Mock authentication failed:', err);
    }
  }, [devMockFlowId, handleLoginSuccess, hasRealAuthContext]);

  const contextFlowId = useMemo(
    () => deriveFlowIdFromUrl(effectiveUserContext?.url || effectiveUserContext?.moduleUrl),
    [effectiveUserContext?.moduleUrl, effectiveUserContext?.url],
  );
  const initialResolvedFlowId = useMemo(
    () => flowIdProp || routeFlowId || contextFlowId || null,
    [flowIdProp, routeFlowId, contextFlowId],
  );

  const [flowId, setFlowId] = useState(initialResolvedFlowId);
  const stableResolvedFlowIdRef = useRef(initialResolvedFlowId || null);
  const flowContextLogCacheRef = useRef(new Set());
  const orchestratorRef = useRef(null);
  const pendingLoadRef = useRef(null);

  useEffect(() => {
    flowContextLogCacheRef.current.clear();
  }, [flowId]);
  useEffect(() => {
    pendingLoadRef.current = null;
  }, [flowId]);
  useEffect(() => {
    const resolvedFlowId = initialResolvedFlowId || stableResolvedFlowIdRef.current || null;

    if (!resolvedFlowId) {
      if (stableResolvedFlowIdRef.current !== null) {
        stableResolvedFlowIdRef.current = null;
      }
      setFlowId((prev) => (prev === null ? prev : null));
      return;
    }

    if (stableResolvedFlowIdRef.current !== resolvedFlowId) {
      stableResolvedFlowIdRef.current = resolvedFlowId;
    }

    setFlowId((prev) => (prev === resolvedFlowId ? prev : resolvedFlowId));
  }, [initialResolvedFlowId]);
  const [state, setState] = useState(() => createInitialState());
  const completionSignaledRef = useRef(false);
  const redirectingToRoute = !flowIdProp && !routeFlowId && !!contextFlowId;
  const stableStepIndexRef = useRef(state.currentStep?.stepIndex ?? 0);
  const stableModulePageNumRef = useRef(state.progress?.modulePageNum ?? '1');
  useEffect(() => {
    const newStepIndex = state.currentStep?.stepIndex ?? 0;
    const newModulePageNum = state.progress?.modulePageNum ?? '1';

    if (stableStepIndexRef.current !== newStepIndex) {
      debugLog(
        '[FlowModule] stepIndex changed:',
        stableStepIndexRef.current,
        '->',
        newStepIndex,
      );
      stableStepIndexRef.current = newStepIndex;
    }

    if (stableModulePageNumRef.current !== newModulePageNum) {
      debugLog(
        '[FlowModule] modulePageNum changed:',
        stableModulePageNumRef.current,
        '->',
        newModulePageNum,
      );
      stableModulePageNumRef.current = newModulePageNum;
    }
  }, [state.currentStep, state.progress]);

  useEffect(() => {
    if (!redirectingToRoute) {
      return;
    }

    const navigationState = {
      userContext: effectiveUserContext
        ? {
            url: effectiveUserContext.url,
            moduleUrl: effectiveUserContext.moduleUrl,
            pageNum: effectiveUserContext.pageNum,
            examNo: effectiveUserContext.examNo,
            batchCode: effectiveUserContext.batchCode,
          }
        : null,
      initialPageId,
    };

    navigate(`/flow/${contextFlowId}`, {
      replace: true,
      state: navigationState,
    });
  }, [contextFlowId, effectiveUserContext, initialPageId, navigate, redirectingToRoute]);

  const heartbeatEnabled =
    Boolean(flowId) &&
    !state.loading &&
    !state.error &&
    !state.showTransition &&
    !!(effectiveUserContext?.examNo || flowContextSnapshot?.examNo) &&
    !!(effectiveUserContext?.batchCode || flowContextSnapshot?.batchCode);
  useEffect(() => {
    debugLog('[FlowModule] heartbeatEnabled changed:', heartbeatEnabled, {
      hasFlowId: Boolean(flowId),
      loading: state.loading,
      error: state.error,
      showTransition: state.showTransition,
    });
  }, [heartbeatEnabled, flowId, state.error, state.loading, state.showTransition]);
  const handleHeartbeatError = useCallback((error) => {
    console.error('[FlowModule] Heartbeat failed:', error);
    // Errors are queued locally and retried later
  }, []);

  // Heartbeat progress sync
  // FIXME: disabled previously due to infinite loop; see docs/HEARTBEAT_INFINITE_LOOP_BUG.md
  useHeartbeat({
    flowId: flowId || contextFlowId || 'pending',
    stepIndexRef: stableStepIndexRef,
    modulePageNumRef: stableModulePageNumRef,
    examNo: effectiveUserContext?.examNo || flowContextSnapshot?.examNo || null,
    batchCode: effectiveUserContext?.batchCode || flowContextSnapshot?.batchCode || null,
    enabled: flowHeartbeatEnabled && heartbeatEnabled,
    intervalMs: 15000, // 15s
    onError: handleHeartbeatError,
  });

  /**
   * 加载 Flow
   */
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  debugLog(`[FlowModule DEBUG] Render #${renderCountRef.current}`);
  const loadFlow = useCallback(() => {
    if (!flowId || !orchestratorRef.current) {
      return Promise.resolve();
    }
    if (pendingLoadRef.current) {
      return pendingLoadRef.current;
    }
    const promise = loadFlowState({
      flowId,
      orchestrator: orchestratorRef.current,
      logOperation: (...args) => logOperationRef.current?.(...args),
      setState,
      flowContextLogCacheRef,
    }).finally(() => {
      pendingLoadRef.current = null;
    });
    pendingLoadRef.current = promise;
    return promise;
  }, [flowContextLogCacheRef, flowId]);

  /**
   * Handle submodule completion
   */
  const handleSubmoduleComplete = useCallback(() => {
    completionSignaledRef.current = true;
    debugLog('[FlowModule] Submodule completed');

    // Call submodule destroy hook
    state.currentStep?.submoduleDefinition?.onDestroy?.();

    // Check transition page config
    const transitionConfig = state.currentStep?.step?.transitionPage;

    if (transitionConfig) {
      setState((prev) => ({
        ...prev,
        showTransition: true,
      }));
    } else {
      advanceFlowStep({
        orchestratorRef,
        completionSignaledRef,
        navigate,
        loadFlow,
        onFlowCompleted: appContext?.handleLogout || appContext?.clearAllCache || null,
      });
    }
  }, [appContext?.clearAllCache, appContext?.handleLogout, loadFlow, navigate, state.currentStep]);

  /**
   * 过渡页继�?   */
  const handleTransitionNext = useCallback(() => {
    setState((prev) => ({
      ...prev,
      showTransition: false,
    }));

    advanceFlowStep({
      orchestratorRef,
      completionSignaledRef,
      navigate,
      loadFlow,
      onFlowCompleted: appContext?.handleLogout || appContext?.clearAllCache || null,
    });
  }, [appContext?.clearAllCache, appContext?.handleLogout, loadFlow, navigate]);

  /**
   * 子模块超时回�?   */
  const handleSubmoduleTimeout = useCallback(() => {
    debugLog('[FlowModule] Submodule timeout');
    handleSubmoduleComplete();
  }, [handleSubmoduleComplete]);

  useEffect(() => {
    debugLog('[FlowModule DEBUG] loadFlow effect triggered, flowId:', flowId);
    const previous = orchestratorRef.current;
    if (previous) {
      teardownOrchestrator(previous);
    }
    orchestratorRef.current = null;

    if (!flowId) {
      return;
    }

    debugLog('[FlowModule] Clearing AppContext state for clean Flow start');
    FLOW_APP_CONTEXT_KEYS_TO_CLEAR.forEach((key) => {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.warn(`[FlowModule] Failed to clear AppContext key ${key}:`, err);
      }
    });

    const orchestrator = new FlowOrchestrator(
      flowId,
      effectiveUserContext?.examNo || null,
      effectiveUserContext?.batchCode || null,
    );
    orchestratorRef.current = orchestrator;
    completionSignaledRef.current = false;

    let canceled = false;

    loadFlowState({
      flowId,
      orchestrator,
      logOperation: (...args) => logOperationRef.current?.(...args),
      setState,
      flowContextLogCacheRef,
      shouldAbort: () => canceled,
    });

    return () => {
      canceled = true;
      if (orchestratorRef.current === orchestrator) {
        orchestratorRef.current = null;
      }
      teardownOrchestrator(orchestrator);
    };
  }, [flowId]);

  

  /**
   * 当前步骤用于导航拦截
   */
  const activeStepIndex = state.currentStep?.stepIndex ?? null;
  const currentResolver = state.currentStep?.submoduleDefinition?.resolvePageNum;

  const persistModuleProgress = useCallback(
    (nextModulePageNum) => {
      if (activeStepIndex === null || !nextModulePageNum) {
        return;
      }
      const normalized = String(nextModulePageNum);
      const orchestrator = orchestratorRef.current;
      if (!orchestrator) {
        return;
      }
      const currentProgress =
        typeof orchestrator.getProgress === 'function' ? orchestrator.getProgress() : null;
      if (
        currentProgress &&
        currentProgress.stepIndex === activeStepIndex &&
        currentProgress.modulePageNum === normalized
      ) {
        return;
      }

      orchestrator.updateProgress(activeStepIndex, normalized);
      setState((prev) => {
        if (
          prev.progress &&
          prev.progress.stepIndex === activeStepIndex &&
          prev.progress.modulePageNum === normalized
        ) {
          return prev;
        }
        return {
          ...prev,
          progress: {
            ...(prev.progress || {}),
            stepIndex: activeStepIndex,
            modulePageNum: normalized,
            lastUpdated: new Date().toISOString(),
          },
        };
      });
    },
    [activeStepIndex]
  );

  const handleBeforeNavigate = useCallback(
    async (nextPageId) => {
      if (typeof currentResolver !== 'function' || !nextPageId) {
        return true;
      }

      const resolvedPageNum = currentResolver(nextPageId);
      if (!resolvedPageNum) {
        console.warn('[FlowModule] Unable to resolve module page number for', nextPageId);
        return true;
      }

      persistModuleProgress(resolvedPageNum);

      const totalSteps =
        typeof state.currentStep?.submoduleDefinition?.getTotalSteps === 'function'
          ? Number(state.currentStep.submoduleDefinition.getTotalSteps())
          : null;
      if (
        totalSteps &&
        Number(resolvedPageNum) >= totalSteps &&
        !completionSignaledRef.current
      ) {
        console.warn(
          '[FlowModule] Completion fallback triggered via beforeNavigate, advancing flow step.',
          {
            stepIndex: state.currentStep?.stepIndex,
            submoduleId: state.currentStep?.submoduleId,
            resolvedPageNum,
            totalSteps,
          },
        );
        completionSignaledRef.current = true;
        handleSubmoduleComplete();
      }
      return true;
    },
    [currentResolver, handleSubmoduleComplete, persistModuleProgress, state.currentStep]
  );

  // Compute values used by rendering below; hooks must run unconditionally
  // to keep hook order stable across renders.
  const submoduleFlowContext = useMemo(() => {
    if (!state.currentStep) return null;
    return {
      flowId,
      submoduleId: state.currentStep.submoduleId,
      stepIndex: state.currentStep.stepIndex,
      modulePageNum: state.progress?.modulePageNum,
      onComplete: handleSubmoduleComplete,
      onTimeout: handleSubmoduleTimeout,
      updateModuleProgress: persistModuleProgress,
    };
  }, [
    flowId,
    state.currentStep?.submoduleId,
    state.currentStep?.stepIndex,
    state.progress?.modulePageNum,
    handleSubmoduleComplete,
    handleSubmoduleTimeout,
    persistModuleProgress,
  ]);

  const providerProps = useMemo(() => ({
    flowId,
    submoduleId: state.currentStep?.submoduleId,
    stepIndex: state.currentStep?.stepIndex,
    progress: state.progress,
    orchestratorRef,
  }), [flowId, state.currentStep?.submoduleId, state.currentStep?.stepIndex, state.progress]);

  const bridgeFlowContext = useMemo(() => {
    if (
      !flowId ||
      !state.currentStep ||
      state.currentStep.submoduleId == null ||
      state.currentStep.stepIndex == null
    ) {
      return null;
    }
    return {
      flowId,
      submoduleId: state.currentStep.submoduleId,
      stepIndex: state.currentStep.stepIndex,
    };
  }, [flowId, state.currentStep?.submoduleId, state.currentStep?.stepIndex]);

  if (!flowId && redirectingToRoute) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>������ת�� Flow ����...</p>
        </div>
      </div>
    );
  }

  if (!flowId) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>ȱ�� Flow ID</h2>
          <p>�޷�ȷ��Ҫ���ص� Flow�������¼���ص� url��</p>
        </div>
      </div>
    );
  }

  // Loading ״̬
  if (state.loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>���ڼ��ز���...</p>
        </div>
      </div>
    );
  }

  // Error ״̬
  if (state.error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>����ʧ��</h2>
          <p>{state.error}</p>
          <button onClick={loadFlow}>����</button>
        </div>
      </div>
    );
  }

  // ��ʾ����ҳ
  if (state.showTransition) {
    const transitionConfig = state.currentStep?.step?.transitionPage || {};
    return (
      <TransitionPage
        title={transitionConfig.title}
        content={transitionConfig.content}
        autoNextSeconds={transitionConfig.autoNextSeconds || 0}
        onNext={handleTransitionNext}
      />
    );
  }

  // ��Ⱦ��ģ��
  const SubmoduleComponent = state.submoduleComponent;
  if (!SubmoduleComponent) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>��ģ��δ�ҵ�</h2>
          <p>�޷�������ģ�����</p>
        </div>
      </div>
    );
  }

  const submoduleProps = {
    userContext: effectiveUserContext,
    initialPageId: state.currentStep.initialPageId,
    options: state.currentStep.step?.overrides,
    flowContext: submoduleFlowContext,
  };

  // Flags for Phase 1 dual-wrap (provider + bridge)
  const providerEnabled = parseFlag(import.meta?.env?.VITE_FLOW_PROVIDER_ENABLED, true);
  const bridgeEnabled = parseFlag(import.meta?.env?.VITE_FLOW_BRIDGE_ENABLED, true);

  

  return (
    <div className={styles.container}>
      <MaybeFlowProvider enabled={providerEnabled} providerProps={providerProps}>
        <MaybeFlowAppContextBridge
          enabled={bridgeEnabled}
          beforeNavigate={handleBeforeNavigate}
          flowContext={bridgeFlowContext}
        >
          <SubmoduleComponent {...submoduleProps} />
        </MaybeFlowAppContextBridge>
      </MaybeFlowProvider>
    </div>
  );
}

export function FlowModule(props) {
  // DEV-only render counter: 5s window, threshold 100
  useRenderCounter({ component: 'FlowModule', windows: [5], thresholds: { 5: 100 } });
  return <FlowModuleInner {...props} />;
}

/**
 * Flow Module 定义（用于注册到 ModuleRegistry�? */
export const FlowModule_Definition = {
  moduleId: 'flow',
  displayName: 'Flow ƴװʽ����',
  url: '/flow/:flowId',
  version: '1.0.0',
  ModuleComponent: FlowModule,

  getInitialPage: (pageNum) => {
    // Flow 使用复合页码 M<stepIndex>:<subPageNum>
    // 但这里直接返�?null，由 FlowOrchestrator 处理
    return null;
  },

  onInitialize: () => {
    debugLog('[FlowModule] Initializing...');
  },

  onDestroy: () => {
    debugLog('[FlowModule] Cleaning up...');
  },
};


