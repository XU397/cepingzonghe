import { useCallback, useEffect, useRef } from 'react';
import Grade4Module from '@/modules/grade-4';
import { useGrade4Context } from '@/modules/grade-4/context/Grade4Context';

function Grade4FlowBridge({ flowContext }) {
  const { currentPage, globalTimer } = useGrade4Context();
  const lastProgressRef = useRef(null);
  const completionRef = useRef(false);
  const timeoutRef = useRef(false);

  const handlePageChange = useCallback(() => {
    if (!flowContext?.updateModuleProgress || !currentPage) {
      return;
    }
    const subPageNum = String(currentPage);
    if (lastProgressRef.current === subPageNum) {
      return;
    }
    lastProgressRef.current = subPageNum;
    flowContext.updateModuleProgress(subPageNum);
  }, [currentPage, flowContext]);

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
    if (currentPage === 12) {
      handleComplete();
    }
  }, [currentPage, handleComplete]);

  const handleTimeout = useCallback(() => {
    if (!flowContext?.onTimeout || timeoutRef.current) {
      return;
    }
    timeoutRef.current = true;
    flowContext.onTimeout();
  }, [flowContext]);

  useEffect(() => {
    if (globalTimer?.isCompleted) {
      handleTimeout();
    }
  }, [globalTimer?.isCompleted, handleTimeout]);

  useEffect(() => {
    completionRef.current = false;
    timeoutRef.current = false;
    lastProgressRef.current = null;
  }, [flowContext?.flowId, flowContext?.stepIndex]);

  return null;
}

export function G4ExperimentComponent({ userContext, initialPageId, flowContext }) {
  useEffect(() => {
    console.log('[G4Experiment] Submodule mounted', {
      initialPageId,
      flowContext,
    });

    return () => {
      console.log('[G4Experiment] Submodule unmounted');
    };
  }, [flowContext, initialPageId]);

  return (
    <Grade4Module
      userContext={userContext}
      initialPageId={initialPageId}
    >
      <Grade4FlowBridge flowContext={flowContext} />
    </Grade4Module>
  );
}

export default G4ExperimentComponent;
