/**
 * Flow Module - 拼装式测评入口
 * 识别 /flow/<flowId>，动态加载子模块并管理过渡
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FlowOrchestrator } from './orchestrator/FlowOrchestrator';
import { TransitionPage } from '@shared/ui/PageFrame';
import { FlowAppContextBridge } from './FlowAppContextBridge';
import { FlowProvider } from '@/flows/context';
import { submoduleRegistry } from '@/submodules/registry';
import { useAppContext } from '@/context/AppContext';
import { createFlowContextOperation } from '@/shared/types/flow';
import useHeartbeat from '@/hooks/useHeartbeat';
import styles from './FlowModule.module.css';
import { createModuleUserContext } from '@/modules/utils/createModuleUserContext.js';
import { useRenderCounter } from '@shared/utils/RenderCounter.jsx';

const FLOW_APP_CONTEXT_KEYS_TO_CLEAR = ['hci-pageNum', 'hci-currentStepNumber', 'hci-totalUserSteps'];
const debugLog = () => {};

// Simple flag parser (true/1/yes/on → true)
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

const advanceFlowStep = ({ orchestratorRef, completionSignaledRef, navigate, loadFlow }) => {
  const orchestrator = orchestratorRef.current;
  if (!orchestrator) {
    return;
  }
  const hasNext = orchestrator.nextStep();
  completionSignaledRef.current = false;

  if (!hasNext) {
    debugLog('[FlowModule] Flow completed');
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
 * FlowModule 主组件
 */
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

  // 验证 remount 行为：组件挂载/卸载日志（切换 /flow/A -> /flow/B 应触发）
  useEffect(() => {
    // 注意：这里的 flowId 在首次渲染时可能为空，等状态解析后会再次挂载
    debugLog('[FlowModule] mount', { flowId: flowIdProp });
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
  const devMockFlowId = flowIdProp || routeFlowId || null;
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

    if (import.meta.env.DEV && devMockFlowId) {
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

  // 在 DEV 环境下，Flow 直达时补充认证状态，避免路由层显示登录页
  const handleLoginSuccess = flowContextSnapshot?.handleLoginSuccess;
  useEffect(() => {
    
    if (!import.meta.env.DEV) return;
    if (!devMockFlowId) return;
    if (typeof handleLoginSuccess !== 'function') return;
    if (devAuthAppliedRef.current) return;

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
  }, [devMockFlowId, handleLoginSuccess]);

  const contextFlowId = useMemo(
    () => deriveFlowIdFromUrl(effectiveUserContext?.url || effectiveUserContext?.moduleUrl),
    [effectiveUserContext?.moduleUrl, effectiveUserContext?.url],
  );
  const initialResolvedFlowId = useMemo(
    () => flowIdProp || routeFlowId || contextFlowId || null,
    [flowIdProp, routeFlowId, contextFlowId],
  );

  const [flowId, setFlowId] = useState(initialResolvedFlowId);
  const flowContextLogCacheRef = useRef(new Set());
  const orchestratorRef = useRef(null);

  useEffect(() => {
    flowContextLogCacheRef.current.clear();
  }, [flowId]);
  const lastResolvedFlowIdRef = useRef(initialResolvedFlowId);
  useEffect(() => {
    const nextFlowId = initialResolvedFlowId || null;

    if (lastResolvedFlowIdRef.current === nextFlowId && flowId === nextFlowId) {
      return;
    }

    lastResolvedFlowIdRef.current = nextFlowId;

    if (nextFlowId !== flowId) {
      setFlowId(nextFlowId);
    }
  }, [flowId, initialResolvedFlowId]);
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

  const heartbeatEnabled = Boolean(flowId) && !state.loading && !state.error && !state.showTransition;
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
    // 失败时本地队列会自动保存，下次重试
  }, []);

  // 集成心跳进度回写
  useHeartbeat({
    flowId: flowId || contextFlowId || 'pending',
    stepIndexRef: stableStepIndexRef,
    modulePageNumRef: stableModulePageNumRef,
    enabled: heartbeatEnabled,
    intervalMs: 15000, // 15秒
    onError: handleHeartbeatError,
  });

  /**
   * 加载 Flow
   */
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  debugLog(`[FlowModule DEBUG] Render #${renderCountRef.current}`);
  const loadFlow = useCallback(async () => {
    await loadFlowState({
      flowId,
      orchestrator: orchestratorRef.current,
      logOperation: (...args) => logOperationRef.current?.(...args),
      setState,
      flowContextLogCacheRef,
    });
  }, [flowId]);

  /**
   * 子模块完成回调
   */
  const handleSubmoduleComplete = useCallback(() => {
    completionSignaledRef.current = true;
    debugLog('[FlowModule] Submodule completed');

    // 调用子模块销毁钩子
    state.currentStep?.submoduleDefinition?.onDestroy?.();

    // 检查过渡页配置
    const transitionConfig = state.currentStep?.step?.transitionPage;

    if (transitionConfig) {
      // 显示过渡页
      setState((prev) => ({
        ...prev,
        showTransition: true,
      }));
    } else {
      // 直接进入下一步
      advanceFlowStep({
        orchestratorRef,
        completionSignaledRef,
        navigate,
        loadFlow,
      });
    }
  }, [loadFlow, navigate, state.currentStep]);

  /**
   * 过渡页继续
   */
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
    });
  }, [loadFlow, navigate]);

  /**
   * 子模块超时回调
   */
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

    const orchestrator = new FlowOrchestrator(flowId);
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
      orchestrator.updateProgress(activeStepIndex, normalized);
      setState((prev) => ({
        ...prev,
        progress: {
          ...(prev.progress || {}),
          stepIndex: activeStepIndex,
          modulePageNum: normalized,
          lastUpdated: new Date().toISOString(),
        },
      }));
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
          <p>正在跳转到 Flow 流程...</p>
        </div>
      </div>
    );
  }

  if (!flowId) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>缺少 Flow ID</h2>
          <p>无法确定要加载的 Flow，请检查登录返回的 url。</p>
        </div>
      </div>
    );
  }

  // Loading 状态
  if (state.loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>正在加载测评...</p>
        </div>
      </div>
    );
  }

  // Error 状态
  if (state.error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>加载失败</h2>
          <p>{state.error}</p>
          <button onClick={loadFlow}>重试</button>
        </div>
      </div>
    );
  }

  // 显示过渡页
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

  // 渲染子模块
  const SubmoduleComponent = state.submoduleComponent;
  if (!SubmoduleComponent) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>子模块未找到</h2>
          <p>无法加载子模块组件</p>
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
 * Flow Module 定义（用于注册到 ModuleRegistry）
 */
export const FlowModule_Definition = {
  moduleId: 'flow',
  displayName: 'Flow 拼装式测评',
  url: '/flow/:flowId',
  version: '1.0.0',
  ModuleComponent: FlowModule,

  getInitialPage: (pageNum) => {
    // Flow 使用复合页码 M<stepIndex>:<subPageNum>
    // 但这里直接返回 null，由 FlowOrchestrator 处理
    return null;
  },

  onInitialize: () => {
    debugLog('[FlowModule] Initializing...');
  },

  onDestroy: () => {
    debugLog('[FlowModule] Cleaning up...');
  },
};
