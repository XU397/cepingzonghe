import { useCallback, useEffect, useRef } from 'react';
import Grade7TrackingModuleDefinition from '@/modules/grade-7-tracking';
import { useTrackingContext } from '@/modules/grade-7-tracking/context/TrackingProvider';
import { PAGE_MAPPING } from '@/modules/grade-7-tracking/config';
import { getPageNumByPageId } from './mapping';

function QuestionnaireFlowBridge({ flowContext }) {
  const { session } = useTrackingContext();
  const lastProgressRef = useRef(null);
  const completionRef = useRef(false);
  const timeoutRef = useRef(false);

  const isQuestionnairePage = session.currentPage >= 14 && session.currentPage <= 21;
  const currentPageEntry = isQuestionnairePage ? PAGE_MAPPING[session.currentPage] : undefined;
  const currentPageId = currentPageEntry?.pageId;
  const questionnaireCompletionPageId = PAGE_MAPPING[22]?.pageId;

  const handlePageChange = useCallback(() => {
    if (!flowContext?.updateModuleProgress || !currentPageId || !isQuestionnairePage) {
      return;
    }
    const subPageNum = getPageNumByPageId(currentPageId);
    if (!subPageNum || lastProgressRef.current === subPageNum) {
      return;
    }
    lastProgressRef.current = subPageNum;
    flowContext.updateModuleProgress(subPageNum);
  }, [currentPageId, flowContext, isQuestionnairePage]);

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
    if (
      session.currentPage === 22 &&
      questionnaireCompletionPageId &&
      PAGE_MAPPING[session.currentPage]?.pageId === questionnaireCompletionPageId
    ) {
      handleComplete();
    }
  }, [handleComplete, questionnaireCompletionPageId, session.currentPage]);

  const handleTimeout = useCallback(() => {
    if (!flowContext?.onTimeout || timeoutRef.current) {
      return;
    }
    timeoutRef.current = true;
    flowContext.onTimeout();
  }, [flowContext]);

  useEffect(() => {
    if (session.questionnaireTimerActive && session.questionnaireTimeRemaining <= 0) {
      handleTimeout();
    }
  }, [handleTimeout, session.questionnaireTimeRemaining, session.questionnaireTimerActive]);

  useEffect(() => {
    completionRef.current = false;
    timeoutRef.current = false;
    lastProgressRef.current = null;
  }, [flowContext?.flowId, flowContext?.stepIndex]);

  return null;
}

export function G7TrackingQuestionnaireComponent({ userContext, initialPageId, flowContext }) {
  const { ModuleComponent: TrackingModule } = Grade7TrackingModuleDefinition || {};

  useEffect(() => {
    console.log('[G7TrackingQuestionnaire] Submodule mounted', {
      initialPageId,
      flowContext,
    });

    return () => {
      console.log('[G7TrackingQuestionnaire] Submodule unmounted');
    };
  }, [flowContext, initialPageId]);

  if (typeof TrackingModule !== 'function') {
    console.error('[G7TrackingQuestionnaire] Missing TrackingModule implementation');
    return null;
  }

  return (
    <TrackingModule
      userContext={userContext}
      initialPageId={initialPageId}
    >
      <QuestionnaireFlowBridge flowContext={flowContext} />
    </TrackingModule>
  );
}

export default G7TrackingQuestionnaireComponent;
