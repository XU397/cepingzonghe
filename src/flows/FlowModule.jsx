/**
 * Flow Module - 拼装式测评入口
 * 识别 /flow/<flowId>，动态加载子模块并管理过程
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FlowOrchestrator, parseFlowPageNum } from './orchestrator/FlowOrchestrator';
import { TransitionPage, CompletionPage, completionDefaultContent } from '@shared/ui/PageFrame';
import { FlowAppContextBridge } from './FlowAppContextBridge';
import { FlowProvider } from '@/flows/context';
import { submoduleRegistry } from '@/submodules/registry';
import { useAppContext } from '@/context/AppContext';
import { createFlowContextOperation } from '@/shared/types/flow';
import { TimerService } from '@shared/services/timers';
import { endpoints } from '@shared/services/api';
import styles from './FlowModule.module.css';
import { createModuleUserContext } from '@/modules/utils/createModuleUserContext.js';
import { useRenderCounter } from '@shared/utils/RenderCounter.jsx';

const FLOW_APP_CONTEXT_KEYS_TO_CLEAR = [
  'hci-pageNum',
  'hci-currentStepNumber',
  'hci-totalUserSteps',
];
const debugLog = () => {};
const isDevEnv =
  Boolean(import.meta.env?.DEV) ||
  import.meta.env?.MODE === 'development' ||
  (typeof process !== 'undefined' && process.env.NODE_ENV === 'development');
const COMPLETION_PROGRESS_PAGE_NUM = '999'; // 前端完成标识，不占用真实子模块页码
const DEFAULT_COMPLETION_CONTENT = completionDefaultContent;
// 显式开关：仅当设置 VITE_FLOW_DEV_MOCK_AUTH 时才启用 Flow 的 Mock 账号
const flowDevMockAuthEnabled = Boolean(import.meta.env?.VITE_FLOW_DEV_MOCK_AUTH);
// Flow 心跳开关：默认开启，VITE_FLOW_HEARTBEAT_ENABLED=0 时可全局关闭
const flowHeartbeatEnabled = String(import.meta.env?.VITE_FLOW_HEARTBEAT_ENABLED ?? '1') !== '0';
const PROGRESS_QUEUE_LIMIT = 50;
const flushingProgressFlows = new Set();

// Simple flag parser (true/1/yes/on => true)
const parseFlag = (val, def) => {
  if (val === undefined || val === null) return !!def;
  const s = String(val).toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
};

const getProgressQueueKey = flowId => `flow.${flowId}.progressQueue`;

const loadProgressQueue = flowId => {
  try {
    const raw = localStorage.getItem(getProgressQueueKey(flowId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const saveProgressQueue = (flowId, queue) => {
  try {
    localStorage.setItem(
      getProgressQueueKey(flowId),
      JSON.stringify(queue.slice(-PROGRESS_QUEUE_LIMIT))
    );
  } catch {
    // ignore storage errors
  }
};

const flushProgressQueue = async (flowId, onError) => {
  if (flushingProgressFlows.has(flowId)) {
    return;
  }

  const queue = loadProgressQueue(flowId);
  if (!queue.length) {
    return;
  }

  flushingProgressFlows.add(flowId);
  try {
    const progressEndpoint = endpoints.flow.updateProgress(flowId);
    const baseURL = import.meta.env.VITE_API_BASE_URL || '';
    const url = baseURL + progressEndpoint;
    const remain = [];

    for (const item of queue) {
      try {
        const res = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(item),
        });
        if (!res.ok) {
          const text = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}: ${text || 'Request failed'}`);
        }
      } catch (err) {
        remain.push(item);
        onError?.(err);
      }
    }

    saveProgressQueue(flowId, remain);
  } finally {
    flushingProgressFlows.delete(flowId);
  }
};

const sendProgressNow = async (payload, onError) => {
  const { flowId } = payload;
  if (!flowId) return;

  const progressEndpoint = endpoints.flow.updateProgress(flowId);
  const baseURL = import.meta.env.VITE_API_BASE_URL || '';
  const url = baseURL + progressEndpoint;

  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${text || 'Request failed'}`);
    }
  } catch (err) {
    const queue = loadProgressQueue(flowId);
    queue.push(payload);
    saveProgressQueue(flowId, queue);
    onError?.(err);
  }
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
  showCompletion: false,
  currentStep: null,
  submoduleComponent: null,
  definition: null,
  progress: null,
  completionConfig: null,
});

const deriveFlowIdFromUrl = url => {
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

const teardownOrchestrator = instance => {
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

  debugLog(
    '[FlowModule] flow_context operation value type:',
    typeof operation.value,
    operation.value
  );
  const added = logOperation(operation);
  // logOperation 可能返回 undefined（表示已接受），仅显式 false 视为失败/重复
  if (added === false) {
    console.warn('[FlowModule] flow_context logOperation skipped (duplicate?)');
    return;
  }

  loggedRef.current.add(cacheKey);
  debugLog('[FlowModule] flow_context logged:', operation);
};

const shouldStartTimerForPage = (submodule, modulePageNum) => {
  if (!submodule || typeof submodule.getInitialPage !== 'function') {
    return true;
  }

  const pageNum = modulePageNum || '1';
  let pageId = null;
  try {
    pageId = submodule.getInitialPage(pageNum);
  } catch (err) {
    console.warn('[FlowModule] getInitialPage failed when evaluating timer start:', err);
  }

  if (!pageId) {
    return true; // fallback: do not block timers if page cannot be resolved
  }

  try {
    const navMode = submodule.getNavigationMode(pageId);
    return navMode !== 'hidden';
  } catch (err) {
    console.warn('[FlowModule] getNavigationMode failed when evaluating timer start:', err);
    return true;
  }
};

const buildTimerConfigForStep = (flowId, resolved, step) => {
  if (!resolved?.submoduleDefinition) {
    return null;
  }

  const submodule = resolved.submoduleDefinition;
  const stepConfig = step || null;
  const overrides = (stepConfig && stepConfig.overrides && stepConfig.overrides.timers) || {};

  const defaultTimers =
    typeof submodule.getDefaultTimers === 'function' ? submodule.getDefaultTimers() || {} : {};

  const baselineTaskDuration =
    typeof defaultTimers.task === 'number' && defaultTimers.task > 0 ? defaultTimers.task : null;

  let taskDuration =
    typeof overrides.task === 'number' && overrides.task > 0
      ? overrides.task
      : typeof defaultTimers.task === 'number' && defaultTimers.task > 0
        ? defaultTimers.task
        : null;

  if (resolved.submoduleId === 'g7-tracking-experiment') {
    const fallbackDuration = baselineTaskDuration ?? 30 * 60;
    taskDuration =
      typeof taskDuration === 'number' && taskDuration > 0
        ? Math.max(taskDuration, fallbackDuration)
        : fallbackDuration;
  }

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

  return {
    taskDuration,
    questionnaireDuration,
    baseScope,
    submodule,
  };
};

const startTimersForConfig = (config, modulePageNum) => {
  if (!config) {
    return false;
  }
  const { submodule, taskDuration, questionnaireDuration, baseScope } = config;

  // Only start timers when current page is not hidden (skip info/cover pages).
  // If we land on a hidden page (e.g.,注意事项) for a new submodule, clear any
  // previous task/questionnaire timer so旧计时不会遗留到本页。
  if (!shouldStartTimerForPage(submodule, modulePageNum)) {
    try {
      TimerService.getInstance('task').reset();
      TimerService.getInstance('questionnaire').reset();
    } catch (err) {
      console.warn('[FlowModule] Failed to reset timers on hidden page', err);
    }
    return false;
  }

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

  return true;
};

const advanceFlowStep = ({
  orchestratorRef,
  completionSignaledRef,
  navigate,
  loadFlow,
  onFlowCompleted,
  setCompletionState,
  completionConfig,
  onFlowCompletion,
}) => {
  const orchestrator = orchestratorRef.current;
  if (!orchestrator) {
    return;
  }
  const hasNext = orchestrator.nextStep();

  if (!hasNext) {
    debugLog('[FlowModule] Flow completed');
    try {
      TimerService.resetAll();
    } catch (err) {
      console.warn('[FlowModule] Failed to reset timers on completion', err);
    }
    if (typeof setCompletionState === 'function') {
      setCompletionState(completionConfig);
    }
    if (typeof onFlowCompletion === 'function') {
      try {
        onFlowCompletion();
      } catch (err) {
        console.warn('[FlowModule] onFlowCompletion error:', err);
      }
    }
    if (typeof onFlowCompleted === 'function') {
      try {
        onFlowCompleted();
      } catch (err) {
        console.error('[FlowModule] Error during onFlowCompleted:', err);
      }
    }
    return;
  }

  // ✅ 只有在确认有下一步后才重置 flag，并在 loadFlow 完成后异步重置
  // 避免在加载过程中的导航事件触发重复完成
  loadFlow()
    .then(() => {
      // 延迟重置，等待 React 渲染周期完成，确保新子模块已完全加载并稳定
      // 使用 requestIdleCallback 或 setTimeout(0) 确保在下一个事件循环中重置
      if (typeof requestIdleCallback === 'function') {
        requestIdleCallback(
          () => {
            completionSignaledRef.current = false;
            debugLog('[FlowModule] completionSignaledRef reset after idle callback');
          },
          { timeout: 100 }
        );
      } else {
        setTimeout(() => {
          completionSignaledRef.current = false;
          debugLog('[FlowModule] completionSignaledRef reset after timeout');
        }, 100);
      }
    })
    .catch(() => {
      completionSignaledRef.current = false;
    });
};

const loadFlowState = async ({
  flowId,
  orchestrator,
  logOperation,
  setState,
  shouldAbort,
  flowContextLogCacheRef,
  loginPageNum,
  timerConfigRef,
}) => {
  if (!flowId || !orchestrator || shouldAbort?.()) {
    return;
  }

  // 开始加载时设置 loading
  setState(prev => ({
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
      if (
        msg.includes('disposed') ||
        msg.includes('Disposed') ||
        msg.includes('has been disposed')
      ) {
        console.warn('[FlowModule] Orchestrator disposed during load, aborting.');
        return;
      }
      throw err;
    }
    if (shouldAbort?.()) {
      return;
    }

    let progressForResolve = progress;

    // 仅在没有有效 progress 时才使用登录落地页覆盖，避免完成/超时后被旧 pageNum 拉回中间页
    // 认为 orchestrator 里已有有效进度（即便 modulePageNum 为 null 也表示“从子模块首页开始”）
    const hasValidProgress =
      progressForResolve &&
      typeof progressForResolve.stepIndex === 'number' &&
      progressForResolve.modulePageNum !== undefined;

    if (!hasValidProgress && loginPageNum) {
      const composite = parseFlowPageNum(String(loginPageNum));
      if (composite) {
        const desiredStep = composite.stepIndex;
        const desiredPage = String(composite.subPageNum);
        const currentStep = progress?.stepIndex ?? 0;
        const currentPage = progress?.modulePageNum ?? null;
        const changed = desiredStep !== currentStep || desiredPage !== currentPage;
        if (changed) {
          try {
            orchestrator.updateProgress(desiredStep, desiredPage);
          } catch (err) {
            console.warn('[FlowModule] Failed to apply login pageNum to progress', err);
          }
          progressForResolve = {
            ...(progress || { stepIndex: 0, modulePageNum: null }),
            stepIndex: desiredStep,
            modulePageNum: desiredPage,
            lastUpdated: new Date().toISOString(),
          };
        }
      }
    }

    const resolved = orchestrator.resolve(definition, progressForResolve);

    if (!resolved.submoduleDefinition) {
      throw new Error(`Submodule not found: ${resolved.submoduleId}`);
    }

    if (shouldAbort?.()) {
      return;
    }

    const completedFlag =
      typeof orchestrator.isCompleted === 'function'
        ? orchestrator.isCompleted()
        : Boolean(progressForResolve?.completed);
    const completionByPageNum =
      progressForResolve?.modulePageNum &&
      String(progressForResolve.modulePageNum) === COMPLETION_PROGRESS_PAGE_NUM;
    const isCompleted = completedFlag || completionByPageNum;
    if (completionByPageNum && !completedFlag && typeof orchestrator.markCompleted === 'function') {
      try {
        orchestrator.markCompleted();
      } catch (err) {
        console.warn('[FlowModule] markCompleted failed for completion sentinel', err);
      }
    }
    if (isCompleted) {
      try {
        TimerService.resetAll();
      } catch (err) {
        console.warn('[FlowModule] Failed to reset timers on completion restore', err);
      }
      const completionConfig = definition?.completionPage || DEFAULT_COMPLETION_CONTENT;
      setState({
        loading: false,
        error: null,
        showTransition: false,
        showCompletion: true,
        completionConfig,
        currentStep: null,
        submoduleComponent: null,
        definition,
        progress: progressForResolve
          ? {
              ...progressForResolve,
              completed: true,
              modulePageNum: COMPLETION_PROGRESS_PAGE_NUM,
            }
          : progressForResolve,
      });
      return;
    }

    const timerConfig = buildTimerConfigForStep(flowId, resolved, resolved.step);
    if (timerConfigRef) {
      timerConfigRef.current = timerConfig;
    }
    const initialModulePageNum = progressForResolve?.modulePageNum || '1';
    startTimersForConfig(timerConfig, initialModulePageNum);

    resolved.submoduleDefinition.onInitialize?.();

    if (shouldAbort?.()) {
      return;
    }

    setState({
      loading: false,
      error: null,
      showTransition: false,
      showCompletion: false,
      completionConfig: null,
      currentStep: resolved,
      submoduleComponent: resolved.submoduleDefinition.Component,
      definition,
      progress: progressForResolve,
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
    setState(prev => ({
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
  // DEV Mock only enabled when explicitly requested to avoid impacting real accounts
  const devMockFlowId =
    isDevEnv && flowDevMockAuthEnabled ? flowIdProp || routeFlowId || null : null;
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

    // 仅在显式开启 dev mock 时，才为 Flow 构建 Mock 账号
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

  // 在 DEV 环境下，Flow 直达时补充认证状态，避免路由层显示登录页
  const handleLoginSuccess = flowContextSnapshot?.handleLoginSuccess;
  const hasRealAuthContext =
    Boolean(flowContextSnapshot?.isAuthenticated) &&
    Boolean(flowContextSnapshot?.batchCode || flowContextSnapshot?.examNo);
  useEffect(() => {
    // 仅在显式开启 dev mock 且当前没有真实账号上下文时，才注入 Mock 账号
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
    [effectiveUserContext?.moduleUrl, effectiveUserContext?.url]
  );
  const initialResolvedFlowId = useMemo(
    () => flowIdProp || routeFlowId || contextFlowId || null,
    [flowIdProp, routeFlowId, contextFlowId]
  );

  const [flowId, setFlowId] = useState(initialResolvedFlowId);
  const stableResolvedFlowIdRef = useRef(initialResolvedFlowId || null);
  const flowContextLogCacheRef = useRef(new Set());
  const orchestratorRef = useRef(null);
  const pendingLoadRef = useRef(null);
  const timerConfigRef = useRef(null);
  const setCompletionState = useCallback(config => {
    setState(prev => ({
      ...prev,
      showCompletion: true,
      completionConfig: config || DEFAULT_COMPLETION_CONTENT,
      showTransition: false,
      loading: false,
      progress: prev.progress
        ? {
            ...prev.progress,
            completed: true,
            modulePageNum: COMPLETION_PROGRESS_PAGE_NUM,
          }
        : prev.progress,
    }));
  }, []);

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
      setFlowId(prev => (prev === null ? prev : null));
      return;
    }

    if (stableResolvedFlowIdRef.current !== resolvedFlowId) {
      stableResolvedFlowIdRef.current = resolvedFlowId;
    }

    setFlowId(prev => (prev === resolvedFlowId ? prev : resolvedFlowId));
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
      debugLog('[FlowModule] stepIndex changed:', stableStepIndexRef.current, '->', newStepIndex);
      stableStepIndexRef.current = newStepIndex;

      // 模块切换时清理 AppContext 的操作列表，避免上一模块的事件混入新模块
      if (appContext?.setCurrentPageData) {
        debugLog('[FlowModule] Clearing AppContext.currentPageData on step change');
        appContext.setCurrentPageData({ operationList: [], answerList: [] });
      }
    }

    if (stableModulePageNumRef.current !== newModulePageNum) {
      debugLog(
        '[FlowModule] modulePageNum changed:',
        stableModulePageNumRef.current,
        '->',
        newModulePageNum
      );
      stableModulePageNumRef.current = newModulePageNum;
    }
  }, [appContext?.setCurrentPageData, state.currentStep, state.progress]);

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

  const lastProgressSentRef = useRef({
    flowId: null,
    stepIndex: null,
    modulePageNum: null,
  });

  const handleProgressError = useCallback(error => {
    console.error('[FlowModule] Progress sync failed:', error);
  }, []);

  const sendProgressUpdate = useCallback(
    async payload => {
      if (!flowHeartbeatEnabled || !payload?.flowId) {
        return;
      }
      await flushProgressQueue(payload.flowId, handleProgressError);
      await sendProgressNow(payload, handleProgressError);
    },
    [handleProgressError]
  );

  useEffect(() => {
    const effectiveFlowId = flowId || contextFlowId;
    const stepIndex = state.currentStep?.stepIndex;
    const modulePageNum = state.progress?.modulePageNum;
    const examNo = effectiveUserContext?.examNo || flowContextSnapshot?.examNo || null;
    const batchCode = effectiveUserContext?.batchCode || flowContextSnapshot?.batchCode || null;

    if (
      !effectiveFlowId ||
      stepIndex === null ||
      stepIndex === undefined ||
      modulePageNum == null
    ) {
      return;
    }
    if (!examNo || !batchCode) {
      return;
    }

    const last = lastProgressSentRef.current;
    if (
      last.flowId === effectiveFlowId &&
      last.stepIndex === stepIndex &&
      String(last.modulePageNum) === String(modulePageNum)
    ) {
      return;
    }

    const payload = {
      flowId: effectiveFlowId,
      examNo,
      batchCode,
      stepIndex,
      modulePageNum: String(modulePageNum),
      ts: Date.now(),
    };

    lastProgressSentRef.current = {
      flowId: effectiveFlowId,
      stepIndex,
      modulePageNum: String(modulePageNum),
    };

    sendProgressUpdate(payload);
  }, [
    contextFlowId,
    effectiveUserContext?.batchCode,
    effectiveUserContext?.examNo,
    flowContextSnapshot?.batchCode,
    flowContextSnapshot?.examNo,
    flowId,
    sendProgressUpdate,
    state.currentStep?.stepIndex,
    state.progress?.modulePageNum,
  ]);

  const pushCompletionProgress = useCallback(() => {
    const effectiveFlowId = flowId || contextFlowId;
    const stepIndex = state.currentStep?.stepIndex;
    const modulePageNum = COMPLETION_PROGRESS_PAGE_NUM;
    const examNo = effectiveUserContext?.examNo || flowContextSnapshot?.examNo || null;
    const batchCode = effectiveUserContext?.batchCode || flowContextSnapshot?.batchCode || null;

    if (
      !effectiveFlowId ||
      stepIndex === null ||
      stepIndex === undefined ||
      modulePageNum == null ||
      !examNo ||
      !batchCode
    ) {
      return;
    }

    const payload = {
      flowId: effectiveFlowId,
      examNo,
      batchCode,
      stepIndex,
      modulePageNum: String(modulePageNum),
      completed: true,
      ts: Date.now(),
    };

    lastProgressSentRef.current = {
      flowId: effectiveFlowId,
      stepIndex,
      modulePageNum: String(modulePageNum),
    };

    sendProgressUpdate(payload);
  }, [
    contextFlowId,
    effectiveUserContext?.batchCode,
    effectiveUserContext?.examNo,
    flowContextSnapshot?.batchCode,
    flowContextSnapshot?.examNo,
    flowId,
    sendProgressUpdate,
    state.currentStep?.stepIndex,
    state.progress?.modulePageNum,
  ]);

  /**
   * 加载 Flow
   */
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  debugLog(`[FlowModule DEBUG] Render #${renderCountRef.current}`);

  // Keep legacy PageRouter in sync with Flow initial page (avoid staying on Page_Login)
  // Only apply once per step to avoid overriding user navigation (e.g., jumping back to Page_01).
  const lastSyncedStepRef = useRef(null);
  useEffect(() => {
    const targetPageId = state.currentStep?.initialPageId;
    if (!targetPageId || !appContext) {
      return;
    }

    const key = `${state.currentStep.submoduleId ?? ''}::${state.currentStep.stepIndex ?? ''}`;
    if (lastSyncedStepRef.current === key) {
      return;
    }

    if (appContext.currentPageId === targetPageId) {
      lastSyncedStepRef.current = key;
      return;
    }

    if (typeof appContext.navigateToPage === 'function') {
      appContext.navigateToPage(targetPageId, { skipSubmit: true });
      lastSyncedStepRef.current = key;
      return;
    }
    if (typeof appContext.setCurrentPageId === 'function') {
      appContext.setCurrentPageId(targetPageId);
      lastSyncedStepRef.current = key;
    }
  }, [
    appContext,
    state.currentStep?.initialPageId,
    state.currentStep?.stepIndex,
    state.currentStep?.submoduleId,
  ]);

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
      loginPageNum: effectiveUserContext?.pageNum || flowContextSnapshot?.pageNum || null,
      timerConfigRef,
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
    // ✅ 防重入保护：如果已经触发完成，直接返回避免重复执行
    if (completionSignaledRef.current) {
      debugLog('[FlowModule] Submodule completion already signaled, skipping duplicate call');
      return;
    }

    completionSignaledRef.current = true;
    debugLog('[FlowModule] Submodule completed');
    const completionConfig = state.definition?.completionPage || DEFAULT_COMPLETION_CONTENT;

    // Call submodule destroy hook
    state.currentStep?.submoduleDefinition?.onDestroy?.();

    // Check transition page config
    const transitionConfig = state.currentStep?.step?.transitionPage;

    if (transitionConfig) {
      setState(prev => ({
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
        setCompletionState,
        completionConfig,
        onFlowCompletion: pushCompletionProgress,
      });
    }
  }, [
    appContext?.clearAllCache,
    appContext?.handleLogout,
    loadFlow,
    navigate,
    pushCompletionProgress,
    setCompletionState,
    state.currentStep,
    state.definition?.completionPage,
  ]);

  /**
   * 过渡页继续
   */
  const handleTransitionNext = useCallback(() => {
    const completionConfig = state.definition?.completionPage || DEFAULT_COMPLETION_CONTENT;
    setState(prev => ({
      ...prev,
      showTransition: false,
    }));

    advanceFlowStep({
      orchestratorRef,
      completionSignaledRef,
      navigate,
      loadFlow,
      onFlowCompleted: appContext?.handleLogout || appContext?.clearAllCache || null,
      setCompletionState,
      completionConfig,
      onFlowCompletion: pushCompletionProgress,
    });
  }, [
    appContext?.clearAllCache,
    appContext?.handleLogout,
    loadFlow,
    navigate,
    pushCompletionProgress,
    setCompletionState,
    state.definition?.completionPage,
  ]);

  /**
   * 子模块超时回调
   */
  const handleSubmoduleTimeout = useCallback(() => {
    debugLog('[FlowModule] Submodule timeout');
    handleSubmoduleComplete();
  }, [handleSubmoduleComplete]);

  const handleCompletionCTA = useCallback(() => {
    const target = state.definition?.completionPage?.ctaLink || '/login';

    try {
      appContext?.handleLogout?.();
    } catch (err) {
      console.warn('[FlowModule] handleLogout on completion failed:', err);
    }
    try {
      appContext?.clearAllCache?.();
    } catch (err) {
      console.warn('[FlowModule] clearAllCache on completion failed:', err);
    }

    try {
      const isExternal = /^https?:\/\//i.test(target);
      if (isExternal) {
        window.location.href = target;
      } else {
        navigate(target, { replace: true });
      }
    } catch (err) {
      console.warn('[FlowModule] navigate on completion failed, fallback to location.href', err);
      try {
        window.location.href = target;
      } catch (e) {
        console.error('[FlowModule] Fallback navigation failed:', e);
      }
    }
  }, [
    appContext?.clearAllCache,
    appContext?.handleLogout,
    navigate,
    state.definition?.completionPage?.ctaLink,
  ]);

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
    FLOW_APP_CONTEXT_KEYS_TO_CLEAR.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (err) {
        console.warn(`[FlowModule] Failed to clear AppContext key ${key}:`, err);
      }
    });

    const orchestrator = new FlowOrchestrator(
      flowId,
      effectiveUserContext?.examNo || null,
      effectiveUserContext?.batchCode || null
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
      timerConfigRef,
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
  const currentPageId = appContext?.currentPageId || null;

  const persistModuleProgress = useCallback(
    nextModulePageNum => {
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

      startTimersForConfig(timerConfigRef.current, normalized);

      orchestrator.updateProgress(activeStepIndex, normalized);
      setState(prev => {
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
    async nextPageId => {
      if (typeof currentResolver !== 'function' || !nextPageId) {
        return true;
      }

      // ✅ 额外检查：防止在子模块切换期间处理错误的页面
      if (completionSignaledRef.current) {
        debugLog('[FlowModule] Skipping beforeNavigate during submodule transition');
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
      // 仅当超出最大页码（> totalSteps）时触发兜底完成，允许最后一页正常渲染/提交
      if (totalSteps && Number(resolvedPageNum) > totalSteps && !completionSignaledRef.current) {
        console.warn(
          '[FlowModule] Completion fallback triggered via beforeNavigate, advancing flow step.',
          {
            stepIndex: state.currentStep?.stepIndex,
            submoduleId: state.currentStep?.submoduleId,
            resolvedPageNum,
            totalSteps,
          }
        );
        handleSubmoduleComplete();
      }
      return true;
    },
    [currentResolver, handleSubmoduleComplete, persistModuleProgress, state.currentStep]
  );

  // After landing on a new page (via AppContext router), persist module progress once.
  useEffect(() => {
    if (typeof currentResolver !== 'function' || !currentPageId) {
      return;
    }
    const resolvedPageNum = currentResolver(currentPageId);
    if (!resolvedPageNum) {
      return;
    }
    persistModuleProgress(resolvedPageNum);
  }, [currentPageId, currentResolver, persistModuleProgress]);

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

  const providerProps = useMemo(
    () => ({
      flowId,
      submoduleId: state.currentStep?.submoduleId,
      stepIndex: state.currentStep?.stepIndex,
      progress: state.progress,
      orchestratorRef,
    }),
    [flowId, state.currentStep?.submoduleId, state.currentStep?.stepIndex, state.progress]
  );

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

  const [devNavPending, setDevNavPending] = useState(false);

  const devBackTarget = useMemo(() => {
    if (!isDevEnv) return null;
    const orchestrator = orchestratorRef.current;
    const definition = orchestrator?.getDefinition?.() || state.definition;
    const steps = definition?.steps || [];
    if (!steps.length) {
      return null;
    }

    const progress = orchestrator?.getProgress?.() || state.progress;
    const progressStepIndex =
      typeof progress?.stepIndex === 'number'
        ? progress.stepIndex
        : typeof state.currentStep?.stepIndex === 'number'
          ? state.currentStep.stepIndex
          : null;
    const fallbackStepIndex = steps.length > 0 ? steps.length - 1 : 0;
    const currentStepIndex =
      progressStepIndex !== null && progressStepIndex !== undefined
        ? progressStepIndex
        : fallbackStepIndex;

    if (currentStepIndex === null || currentStepIndex < 0 || currentStepIndex >= steps.length) {
      return null;
    }

    const currentSubmoduleId = steps[currentStepIndex]?.submoduleId ?? null;
    const currentSubmoduleDef = currentSubmoduleId
      ? submoduleRegistry.get(currentSubmoduleId)
      : null;
    const totalSteps =
      currentSubmoduleDef && typeof currentSubmoduleDef.getTotalSteps === 'function'
        ? Number(currentSubmoduleDef.getTotalSteps())
        : null;
    const safeTotal = Number.isFinite(totalSteps) && totalSteps > 0 ? totalSteps : 1;

    const currentPageNumRaw = progress?.modulePageNum ?? state.progress?.modulePageNum ?? '1';
    const currentPageNumParsed = Number.parseFloat(String(currentPageNumRaw || '1'));
    const currentPageNum =
      Number.isFinite(currentPageNumParsed) &&
      currentPageNumParsed > 0 &&
      currentPageNumParsed !== Number(COMPLETION_PROGRESS_PAGE_NUM)
        ? Math.min(currentPageNumParsed, safeTotal)
        : safeTotal;

    if (Number.isFinite(currentPageNum) && currentPageNum > 1) {
      const prevNum = Math.max(1, Math.floor(currentPageNum - 1));
      return {
        stepIndex: currentStepIndex,
        pageNum: String(prevNum),
        submoduleId: currentSubmoduleId,
      };
    }

    const prevStepIndex = currentStepIndex - 1;
    if (prevStepIndex < 0 || !steps[prevStepIndex]) {
      return null;
    }

    const prevSubmoduleId = steps[prevStepIndex].submoduleId;
    const prevSubmoduleDef = prevSubmoduleId ? submoduleRegistry.get(prevSubmoduleId) : null;
    const prevTotalSteps =
      prevSubmoduleDef && typeof prevSubmoduleDef.getTotalSteps === 'function'
        ? Number(prevSubmoduleDef.getTotalSteps())
        : null;
    const prevSafeTotal =
      Number.isFinite(prevTotalSteps) && prevTotalSteps > 0 ? prevTotalSteps : 1;

    return {
      stepIndex: prevStepIndex,
      pageNum: String(prevSafeTotal),
      submoduleId: prevSubmoduleId ?? null,
    };
  }, [state.currentStep?.stepIndex, state.definition, state.progress?.modulePageNum]);

  const handleDevBackNavigation = useCallback(async () => {
    if (!devBackTarget || !orchestratorRef.current) {
      return;
    }
    setDevNavPending(true);
    try {
      const { stepIndex, pageNum, submoduleId } = devBackTarget;
      const orchestrator = orchestratorRef.current;
      orchestrator.updateProgress(stepIndex, pageNum);
      completionSignaledRef.current = false;

      const definition = orchestrator.getDefinition?.() || state.definition;
      const steps = definition?.steps || [];
      const targetSubmoduleId = submoduleId || steps[stepIndex]?.submoduleId || null;
      const targetSubmoduleDef = targetSubmoduleId
        ? submoduleRegistry.get(targetSubmoduleId)
        : null;
      const targetPageId =
        targetSubmoduleDef && typeof targetSubmoduleDef.getInitialPage === 'function'
          ? targetSubmoduleDef.getInitialPage(pageNum)
          : null;

      await loadFlow();

      if (targetPageId && appContext?.navigateToPage) {
        await appContext.navigateToPage(targetPageId, { skipSubmit: true });
      }
    } catch (err) {
      console.warn('[FlowModule] Dev back navigation failed:', err);
    } finally {
      setDevNavPending(false);
    }
  }, [appContext?.navigateToPage, devBackTarget, loadFlow, state.definition]);

  const devNavOverlay = isDevEnv ? (
    <div className={styles.devNav}>
      <button
        type="button"
        className={styles.devBackButton}
        onClick={handleDevBackNavigation}
        disabled={!devBackTarget || devNavPending}
      >
        {devNavPending ? 'Jumping...' : 'Prev (DEV)'}
      </button>
      <span className={styles.devNavLabel}>
        {devBackTarget
          ? `Target step ${devBackTarget.stepIndex + 1} / page ${devBackTarget.pageNum}`
          : 'At first page'}
      </span>
    </div>
  ) : null;

  if (!flowId && redirectingToRoute) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>正在跳转到 Flow 路由...</p>
        </div>
      </div>
    );
  }

  if (!flowId) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>缺少 Flow ID</h2>
          <p>无法确定要加载的 Flow，请重新登录或检查 URL。</p>
        </div>
      </div>
    );
  }

  // 加载状态
  if (state.loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>正在加载流程...</p>
        </div>
      </div>
    );
  }

  // 错误状态
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

  const completionConfig =
    state.completionConfig || state.definition?.completionPage || DEFAULT_COMPLETION_CONTENT;

  if (state.showCompletion) {
    return (
      <>
        {devNavOverlay}
        <CompletionPage
          title={completionConfig.title || DEFAULT_COMPLETION_CONTENT.title}
          message={completionConfig.message || DEFAULT_COMPLETION_CONTENT.message}
          detail={completionConfig.detail || DEFAULT_COMPLETION_CONTENT.detail}
          tip={completionConfig.tip || DEFAULT_COMPLETION_CONTENT.tip}
          ctaLabel={completionConfig.ctaLabel || DEFAULT_COMPLETION_CONTENT.ctaLabel}
          icon={completionConfig.icon || '🎉'}
          onPrimary={handleCompletionCTA}
        />
      </>
    );
  }

  // 显示过渡页
  if (state.showTransition) {
    const transitionConfig = state.currentStep?.step?.transitionPage || {};
    return (
      <>
        {devNavOverlay}
        <TransitionPage
          title={transitionConfig.title}
          content={transitionConfig.content}
          autoNextSeconds={transitionConfig.autoNextSeconds || 0}
          onNext={handleTransitionNext}
        />
      </>
    );
  }

  // 渲染子模块
  const SubmoduleComponent = state.submoduleComponent;
  if (!SubmoduleComponent) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>子模块未找到</h2>
          <p>无法渲染该子模块</p>
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
      {devNavOverlay}
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

  getInitialPage: pageNum => {
    // Flow 使用复合页码 <stepIndex>.<subPageNum>（兼容旧格式 M<stepIndex>:<subPageNum>）
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
