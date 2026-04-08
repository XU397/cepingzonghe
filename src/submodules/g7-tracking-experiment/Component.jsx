import { useCallback, useEffect, useRef } from 'react';
import Grade7TrackingModuleDefinition from '@/modules/grade-7-tracking';
import { useTrackingContext } from '@/modules/grade-7-tracking/context/TrackingProvider';
import { PAGE_MAPPING } from '@/modules/grade-7-tracking/config';
import { useTimer } from '@/shared/services/timers/useTimer';
import { getPageNumByPageId } from './mapping';

function ExperimentFlowBridge({ flowContext }) {
  const { session } = useTrackingContext();
  const { isTimeout: taskTimerTimeout, getDebugInfo: getTaskTimerDebug } = useTimer('task');
  const lastProgressRef = useRef(null);
  const completionRef = useRef(false);
  const timeoutRef = useRef(false);

  const isExperimentPage = session.currentPage >= 1 && session.currentPage <= 12;
  const currentPageEntry = isExperimentPage ? PAGE_MAPPING[session.currentPage] : undefined;
  const currentPageId = currentPageEntry?.pageId;
  const isExperimentCompletionPage = currentPageId === PAGE_MAPPING[13]?.pageId;

  const handlePageChange = useCallback(() => {
    if (!flowContext?.updateModuleProgress || !currentPageId || !isExperimentPage) {
      return;
    }
    const subPageNum = getPageNumByPageId(currentPageId);
    if (!subPageNum || lastProgressRef.current === subPageNum) {
      return;
    }
    lastProgressRef.current = subPageNum;
    flowContext.updateModuleProgress(subPageNum);
  }, [currentPageId, flowContext, isExperimentPage]);

  useEffect(() => {
    handlePageChange();
  }, [handlePageChange]);

  const handleComplete = useCallback(() => {
    if (!flowContext?.onComplete || completionRef.current) {
      return;
    }
    completionRef.current = true;
    flowContext.onComplete();
  }, [flowContext]);

  useEffect(() => {
    if (isExperimentCompletionPage) {
      handleComplete();
    }
  }, [handleComplete, isExperimentCompletionPage]);

  const handleTimeout = useCallback(() => {
    if (!flowContext?.onTimeout || timeoutRef.current) {
      return;
    }
    timeoutRef.current = true;
    flowContext.onTimeout();
  }, [flowContext]);

  const expectedTaskScope = flowContext
    ? [
        'flow',
        flowContext.flowId || 'unknown',
        flowContext.submoduleId || 'unknown',
        String(flowContext.stepIndex ?? 0),
        'task',
      ].join('::')
    : null;

  useEffect(() => {
    if (!taskTimerTimeout) {
      return;
    }

    const timerDebug = getTaskTimerDebug();
    if (expectedTaskScope && timerDebug?.scope && timerDebug.scope !== expectedTaskScope) {
      return;
    }

    handleTimeout();
  }, [expectedTaskScope, getTaskTimerDebug, handleTimeout, taskTimerTimeout]);

  useEffect(() => {
    completionRef.current = false;
    timeoutRef.current = false;
    lastProgressRef.current = null;
  }, [flowContext?.flowId, flowContext?.stepIndex]);

  return null;
}

export function G7TrackingExperimentComponent({ userContext, initialPageId, flowContext }) {
  const { ModuleComponent: TrackingModule } = Grade7TrackingModuleDefinition || {};
  const enhancedUserContext = {
    ...userContext,
    // 向 Tracking 模块提供 getFlowContext，供 useDataLogger 注入 flow_context
    getFlowContext: () => (flowContext ? { ...flowContext } : null),
  };

  useEffect(() => {
    console.log('[G7TrackingExperiment] Submodule mounted', {
      initialPageId,
      flowContext,
    });

    return () => {
      console.log('[G7TrackingExperiment] Submodule unmounted');
    };
  }, [flowContext, initialPageId]);

  if (typeof TrackingModule !== 'function') {
    console.error('[G7TrackingExperiment] Missing TrackingModule implementation');
    return null;
  }

  return (
    <TrackingModule userContext={enhancedUserContext} initialPageId={initialPageId}>
      <ExperimentFlowBridge flowContext={flowContext} />
    </TrackingModule>
  );
}

export default G7TrackingExperimentComponent;
