import { useEffect, useRef } from 'react';
import type { TraceFlowContext } from '@shared/services/submission/trace';
import type { PageId } from '../mapping';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import { useBananaTraceLogger } from './useBananaTraceLogger';

const EMPTY_TRACE_METADATA: Record<string, unknown> = {};

const stableStringify = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map(key => `${JSON.stringify(key)}:${stableStringify((value as Record<string, unknown>)[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value);
};

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
  const startKey = `${pageId}:${pageNumber}`;
  const emittedStartKeyRef = useRef<string | null>(null);
  const metadataRef = useRef(metadata);
  const metadataKeyRef = useRef('');
  const metadataKey = stableStringify(metadata);
  if (metadataKeyRef.current !== metadataKey) {
    metadataKeyRef.current = metadataKey;
    metadataRef.current = metadata;
  }

  useEffect(() => {
    if (!traceLogger || emittedStartKeyRef.current === startKey) {
      return;
    }

    emittedStartKeyRef.current = startKey;
    setPageStartTime(new Date());
    traceLogger.startPage(metadataRef.current);
  }, [setPageStartTime, startKey, traceLogger]);

  return traceLogger;
}
