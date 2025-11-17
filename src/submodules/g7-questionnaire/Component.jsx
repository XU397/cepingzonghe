/**
 * 7年级蒸馒头问卷 - 子模块组件
 * 暂时复用 Grade7Wrapper，后续将替换为 AssessmentPageFrame 版本
 */

import { useCallback, useEffect, useRef } from 'react';
import { Grade7Wrapper } from '@/modules/grade-7/wrapper';
import { useAppContext } from '@/context/AppContext';
import { getPageNumByPageId } from './mapping';

export function G7QuestionnaireComponent({ userContext, initialPageId, flowContext }) {
  const { currentPageId, isQuestionnaireTimeUp, isQuestionnaireCompleted } = useAppContext();
  const lastProgressRef = useRef(null);
  const completionRef = useRef(false);
  const timeoutRef = useRef(false);

  const handlePageChange = useCallback((pageId) => {
    if (!flowContext?.updateModuleProgress || !pageId) {
      return;
    }
    const subPageNum = getPageNumByPageId(pageId);
    if (!subPageNum || lastProgressRef.current === subPageNum) {
      return;
    }
    lastProgressRef.current = subPageNum;
    flowContext.updateModuleProgress(subPageNum);
  }, [flowContext]);

  useEffect(() => {
    handlePageChange(currentPageId);
  }, [currentPageId, handlePageChange]);

  const handleComplete = useCallback(() => {
    if (!flowContext?.onComplete || completionRef.current) {
      return;
    }
    completionRef.current = true;
    flowContext.onComplete();
  }, [flowContext]);

  useEffect(() => {
    if (isQuestionnaireCompleted || currentPageId === 'Page_28_Effort_Submit') {
      handleComplete();
    }
  }, [currentPageId, handleComplete, isQuestionnaireCompleted]);

  const handleTimeout = useCallback(() => {
    if (!flowContext?.onTimeout || timeoutRef.current) {
      return;
    }
    timeoutRef.current = true;
    flowContext.onTimeout();
  }, [flowContext]);

  useEffect(() => {
    if (isQuestionnaireTimeUp) {
      handleTimeout();
    }
  }, [handleTimeout, isQuestionnaireTimeUp]);

  useEffect(() => {
    completionRef.current = false;
    timeoutRef.current = false;
    lastProgressRef.current = null;
  }, [flowContext?.flowId, flowContext?.stepIndex]);

  useEffect(() => {
    console.log('[G7Questionnaire] Submodule mounted', {
      initialPageId,
      flowContext,
    });

    return () => {
      console.log('[G7Questionnaire] Submodule unmounted');
    };
  }, [initialPageId, flowContext]);

  return (
    <Grade7Wrapper
      userContext={userContext}
      initialPageId={initialPageId}
      flowContext={flowContext}
    />
  );
}

export default G7QuestionnaireComponent;
