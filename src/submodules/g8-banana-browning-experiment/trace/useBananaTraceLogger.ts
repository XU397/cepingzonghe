import { useMemo } from 'react';
import { createPageTraceLogger, validateTraceMark } from '@shared/services/submission/trace';
import type { TraceFlowContext, TraceOperationDraft } from '@shared/services/submission/trace';
import { getTracePageConfigByLegacyPageId, type PageId } from '../mapping';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';

interface UseBananaTraceLoggerOptions {
  pageId: PageId;
  pageNumber: string;
  flowContext?: TraceFlowContext | null;
}

export function useBananaTraceLogger({
  pageId,
  pageNumber,
  flowContext,
}: UseBananaTraceLoggerOptions) {
  const { logOperation } = useG8BananaBrowningContext();
  const page = getTracePageConfigByLegacyPageId(pageId);
  const stableFlowContext = useMemo(
    () =>
      flowContext
        ? {
            flowId: flowContext.flowId,
            submoduleId: flowContext.submoduleId,
            stepIndex: flowContext.stepIndex,
            moduleName: flowContext.moduleName,
            pageId: flowContext.pageId,
          }
        : flowContext,
    [
      flowContext?.flowId,
      flowContext?.submoduleId,
      flowContext?.stepIndex,
      flowContext?.moduleName,
      flowContext?.pageId,
    ]
  );

  return useMemo(() => {
    if (!page) {
      return null;
    }
    return createPageTraceLogger({
      page,
      pageNumber,
      flowContext: stableFlowContext,
      logOperation: (operation: TraceOperationDraft) => {
        logOperation(operation as unknown as Parameters<typeof logOperation>[0]);
      },
    });
  }, [stableFlowContext, logOperation, page, pageNumber]);
}

export { validateTraceMark };
