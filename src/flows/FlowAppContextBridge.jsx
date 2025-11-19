import { useMemo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import AppContext, { useAppContext } from '@/context/AppContext';

const debugLog = () => {};

/**
 * 重新暴露 AppContext，并在 navigateToPage 被调用时先执行 beforeNavigate。
 * 这样遗留模块继续通过 useAppContext 使用导航能力，但 Flow 编排器仍然可以拦截导航。
 */
export function FlowAppContextBridge({
  beforeNavigate = undefined,
  afterNavigate = undefined,
  flowContext = null,
  children,
}) {
  const contextValue = useAppContext();
  const setFlowContextFn = contextValue?.setFlowContext;

  // 注入 Flow 上下文到 AppContext（仅在变更时设置，不在依赖变化时清空）
  const lastFlowCtxRef = useRef(null);
  useEffect(() => {
    const same =
      lastFlowCtxRef.current &&
      flowContext &&
      lastFlowCtxRef.current.flowId === flowContext.flowId &&
      lastFlowCtxRef.current.submoduleId === flowContext.submoduleId &&
      lastFlowCtxRef.current.stepIndex === flowContext.stepIndex;

    if (!setFlowContextFn || !flowContext) {
      console.warn('[FlowAppContextBridge] Skipping setFlowContext', {
        hasSetFlowContext: !!setFlowContextFn,
        hasFlowContext: !!flowContext,
      });
      return;
    }

    if (!same) {
      debugLog('[FlowAppContextBridge] Setting flowContext:', flowContext);
      setFlowContextFn(flowContext);
      lastFlowCtxRef.current = flowContext;
    }
  }, [flowContext, setFlowContextFn]);

  // 仅在组件真正卸载时清空 flowContext，避免每次依赖变更导致的闪断
  useEffect(() => {
    return () => {
      if (setFlowContextFn) {
        debugLog('[FlowAppContextBridge] Clearing flowContext on unmount');
        setFlowContextFn(null);
      }
    };
  }, [setFlowContextFn]);

  const originalNavigate = contextValue?.navigateToPage;
  const wrappedNavigate = useMemo(() => {
    if (typeof originalNavigate !== 'function') {
      return null;
    }
    return async (nextPageId, options = {}) => {
      const proceed = beforeNavigate ? (await beforeNavigate(nextPageId, options)) !== false : true;
      if (!proceed) {
        return false;
      }

      const result = await originalNavigate(nextPageId, options);

      if (typeof afterNavigate === 'function') {
        await afterNavigate(nextPageId, options);
      }

      return result;
    };
  }, [originalNavigate, beforeNavigate, afterNavigate]);

  const bridgedValue = useMemo(() => {
    if (!contextValue || !wrappedNavigate) {
      return contextValue;
    }

    return {
      ...contextValue,
      navigateToPage: wrappedNavigate,
      // 一些页面直接使用 setCurrentPageId 触发导航，保持相同的引用确保它们也被拦截
      setCurrentPageId: wrappedNavigate,
    };
  }, [contextValue, wrappedNavigate]);

  return <AppContext.Provider value={bridgedValue}>{children}</AppContext.Provider>;
}

FlowAppContextBridge.propTypes = {
  beforeNavigate: PropTypes.func,
  afterNavigate: PropTypes.func,
  flowContext: PropTypes.shape({
    flowId: PropTypes.string,
    submoduleId: PropTypes.string,
    stepIndex: PropTypes.number,
  }),
  children: PropTypes.node.isRequired,
};

export default FlowAppContextBridge;
