import { useEffect } from 'react';
import type { TraceFlowContext } from '@shared/services/submission/trace';
import type { PageId } from '../mapping';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import { useBananaTraceLogger } from './useBananaTraceLogger';

const EMPTY_TRACE_METADATA: Record<string, unknown> = {};

interface UseTracePageStartOptions {
  pageId: PageId;
  pageNumber: string;
  flowContext?: TraceFlowContext | null;
  metadata?: Record<string, unknown>;
}

export function useTracePageStart({
  pageId,
  pageNumber,
  flowContext,
  metadata = EMPTY_TRACE_METADATA,
}: UseTracePageStartOptions) {
  const { setPageStartTime } = useG8BananaBrowningContext();
  const traceLogger = useBananaTraceLogger({ pageId, pageNumber, flowContext });

  useEffect(() => {
    setPageStartTime(new Date());
    traceLogger?.startPage(metadata);
  }, [metadata, setPageStartTime, traceLogger]);

  return traceLogger;
}
