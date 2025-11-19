import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import { useAppContext } from '@/context/AppContext';

// Internal noop logger (Phase 0 keeps noise low)
const debugLog = () => {};

// React context for Flow
const FlowRuntimeContext = createContext(null);

/**
 * Feature flag helpers
 */
function parseFlag(val, def) {
  if (val === undefined || val === null) return !!def;
  const s = String(val).toLowerCase();
  return s === '1' || s === 'true' || s === 'yes' || s === 'on';
}

/**
 * FlowProvider (Phase 0 skeleton)
 * - Creates Flow runtime context without changing existing behavior
 * - When disabled via flag, renders children as-is (no provider)
 */
export function FlowProvider({
  flowId = '',
  submoduleId = '',
  stepIndex = 0,
  progress = null,
  orchestratorRef = null,
  heartbeatEnabled = false,
  children,
}) {
  const isEnabled = parseFlag(import.meta?.env?.VITE_FLOW_PROVIDER_ENABLED, false);

  // Do not wrap with provider when disabled to avoid any behavioral shifts
  if (!isEnabled) {
    return children;
  }

  // AppContext integration (Phase 0: read-only + refs)
  const app = useAppContext();

  // Cache selected fields in refs to avoid re-creating context value
  const examNoRef = useRef(app?.examNo ?? '');
  const batchCodeRef = useRef(app?.batchCode ?? '');
  const remainingTimeRef = useRef(Number(app?.remainingTime ?? 0));
  const questionnaireRemainingTimeRef = useRef(Number(app?.questionnaireRemainingTime ?? 0));
  const currentPageIdRef = useRef(app?.currentPageId ?? '');

  useEffect(() => { examNoRef.current = app?.examNo ?? ''; }, [app?.examNo]);
  useEffect(() => { batchCodeRef.current = app?.batchCode ?? ''; }, [app?.batchCode]);
  useEffect(() => { remainingTimeRef.current = Number(app?.remainingTime ?? 0); }, [app?.remainingTime]);
  useEffect(() => {
    questionnaireRemainingTimeRef.current = Number(app?.questionnaireRemainingTime ?? 0);
  }, [app?.questionnaireRemainingTime]);
  useEffect(() => { currentPageIdRef.current = app?.currentPageId ?? ''; }, [app?.currentPageId]);

  // Stable accessors to imperative helpers
  const submitPageRef = useRef(app?.submitPageData);
  useEffect(() => { submitPageRef.current = app?.submitPageData; }, [app?.submitPageData]);

  // Forward the orchestrator ref through a stable holder
  const orchestratorRefRef = useRef(orchestratorRef || null);
  useEffect(() => { orchestratorRefRef.current = orchestratorRef || null; }, [orchestratorRef]);

  // Stable wrappers
  const navigateToNextStep = useCallback(() => {
    const ref = orchestratorRefRef.current;
    const inst = ref && 'current' in ref ? ref.current : null;
    if (!inst) return false;
    if (typeof inst.nextStep === 'function') return inst.nextStep();
    if (typeof inst.next === 'function') return inst.next();
    return false;
  }, []);

  const submitPage = useCallback(async (options = {}) => {
    const fn = submitPageRef.current;
    if (typeof fn === 'function') {
      try {
        return await fn(options);
      } catch (e) {
        debugLog('[FlowProvider] submitPage error (delegated):', e);
        return false;
      }
    }
    debugLog('[FlowProvider] submitPage ignored (no app.submitPageData)');
    return false;
  }, []);

  const getUserContext = useCallback(() => ({
    examNo: examNoRef.current || '',
    batchCode: batchCodeRef.current || '',
    currentPageId: currentPageIdRef.current || '',
  }), []);

  const getTimerSnapshot = useCallback(() => ({
    remainingTime: Number(remainingTimeRef.current || 0),
    questionnaireRemainingTime: Number(questionnaireRemainingTimeRef.current || 0),
  }), []);

  const getFlowContext = useCallback(() => ({
    flowId: flowId ?? '',
    submoduleId: submoduleId ?? '',
    stepIndex: typeof stepIndex === 'number' ? stepIndex : 0,
    modulePageNum: progress?.modulePageNum ?? null,
  }), [flowId, submoduleId, stepIndex, progress?.modulePageNum]);

  // Context value memo - only depends on minimal keys
  const value = useMemo(() => {
    return {
      flowId: flowId ?? '',
      submoduleId: submoduleId ?? '',
      stepIndex: typeof stepIndex === 'number' ? stepIndex : 0,
      progress: { modulePageNum: progress?.modulePageNum ?? null },

      orchestratorRef: orchestratorRefRef,
      navigateToNextStep,
      submitPage,

      heartbeat: { enabled: !!heartbeatEnabled },

      getUserContext,
      getTimerSnapshot,
      getFlowContext,
    };
    // Intentionally NOT depending on AppContext values; selectors and wrappers use refs
  }, [flowId, submoduleId, stepIndex, progress?.modulePageNum, heartbeatEnabled]);

  return (
    <FlowRuntimeContext.Provider value={value}>{children}</FlowRuntimeContext.Provider>
  );
}

FlowProvider.propTypes = {
  flowId: PropTypes.string,
  submoduleId: PropTypes.string,
  stepIndex: PropTypes.number,
  progress: PropTypes.shape({
    modulePageNum: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
  }),
  orchestratorRef: PropTypes.shape({ current: PropTypes.any }),
  heartbeatEnabled: PropTypes.bool,
  children: PropTypes.node.isRequired,
};

/**
 * 获取 FlowContext（严格：未找到时抛错）
 */
export function useFlowContext() {
  const ctx = useContext(FlowRuntimeContext);
  if (!ctx) {
    throw new Error('[FlowProvider] FlowContext is not available. Ensure provider is enabled and mounted.');
  }
  return ctx;
}

/**
 * 获取 FlowContext（宽松：未找到时返回 null）
 */
export function useOptionalFlowContext() {
  return useContext(FlowRuntimeContext);
}

export default FlowProvider;
