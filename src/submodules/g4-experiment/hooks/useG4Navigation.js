import { useCallback, useMemo } from 'react';
import { usePageSubmission } from '@shared/services/submission/usePageSubmission.js';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';
import { useG4Context } from '../context/G4Context';
import { getInitialPage, getPageConfigById, getPageNumByPageId } from '../mapping';
import { MAX_PAGE } from '../constants/pageConfig';

const resolveUserIds = (userContext = {}) => {
  const flatBatchCode = userContext.batchCode || userContext.user?.batchCode || '';
  const flatExamNo = userContext.examNo || userContext.user?.examNo || '';
  return {
    batchCode: flatBatchCode,
    examNo: flatExamNo,
  };
};

export function useG4Navigation() {
  const {
    state,
    userContext,
    flowContext,
    navigateToPage,
    clearOperations,
    logOperation,
  } = useG4Context();

  const { currentPageId, currentPageNum, operations, answers, pageBeginTime } = state;
  const pageConfig = useMemo(() => getPageConfigById(currentPageId), [currentPageId]);
  const subPageNum = useMemo(
    () => parseInt(getPageNumByPageId(currentPageId) || String(currentPageNum), 10) || 1,
    [currentPageId, currentPageNum]
  );

  const flowStepIndex = flowContext?.stepIndex ?? 0;
  const submoduleIndex = flowStepIndex + 1;
  const flowId = flowContext?.flowId;
  const pageDescription = pageConfig?.description || currentPageId;

  const { submit, isSubmitting, lastError } = usePageSubmission({
    getUserContext: () => resolveUserIds(userContext),
    pageMeta: () => ({
      pageId: currentPageId,
      pageTitle: pageDescription,
      pageDesc: pageDescription,
      subPageNum,
      stepIndex: flowStepIndex,
      flowId,
      submoduleId: 'g4-experiment',
      pageNumber: encodeCompositePageNum(submoduleIndex, subPageNum),
    }),
    operations: () => operations,
    answers: () => answers,
    getFlowContext: flowContext
      ? () => ({
          ...flowContext,
          pageId: currentPageId,
          submoduleId: 'g4-experiment',
        })
      : undefined,
    logOperation,
    allowProceedOnFailureInDev: true,
  });

  const handleNextPage = useCallback(
    async ({ validate, nextPageId } = {}) => {
      if (typeof validate === 'function') {
        const isValid = await validate(state);
        if (!isValid) {
          return false;
        }
      }

      const submitted = await submit({
        markOverride: {
          beginTime: pageBeginTime,
        },
      });
      if (!submitted) {
        return false;
      }

      clearOperations();

      const targetPageId =
        nextPageId ||
        (() => {
          const nextPageNum = Math.min(subPageNum + 1, MAX_PAGE);
          if (nextPageNum === subPageNum) return null;
          return getInitialPage(String(nextPageNum));
        })();

      if (targetPageId) {
        navigateToPage(targetPageId);
      }

      return true;
    },
    [clearOperations, navigateToPage, pageBeginTime, state, subPageNum, submit]
  );

  return {
    handleNextPage,
    isSubmitting,
    lastError,
    currentPageId,
    subPageNum,
    navigationMode: pageConfig?.mode || 'experiment',
  };
}

export default useG4Navigation;
