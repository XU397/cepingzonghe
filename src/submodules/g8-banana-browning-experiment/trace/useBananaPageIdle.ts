import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  PAGE_IDLE_THRESHOLD_MS,
  createPageIdleCollector,
  type L2TraceEventType,
  type PageIdleOptions,
} from '@shared/services/submission/trace';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';

interface BananaPageIdleLogger {
  pageIdle(_options: PageIdleOptions): unknown;
}

const isTraceOperationValue = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

type ValidationStatus = 'success' | 'blocked' | 'auto' | 'timeout' | 'none';

export function useBananaPageIdle(logger: BananaPageIdleLogger | null | undefined) {
  const {
    registerTraceCollectorFlush,
    registerTraceOperationObserver,
  } = useG8BananaBrowningContext();
  const loggerRef = useRef<BananaPageIdleLogger | null | undefined>(logger);
  loggerRef.current = logger;

  const collector = useMemo(
    () =>
      createPageIdleCollector({
        logger: {
          pageIdle: options => loggerRef.current?.pageIdle(options),
        },
        thresholdMs: PAGE_IDLE_THRESHOLD_MS,
      }),
    []
  );

  const startInitial = useCallback(
    (startedAt?: Date) => {
      collector.start('initial_before_first_action', startedAt);
    },
    [collector]
  );

  useEffect(
    () =>
      registerTraceOperationObserver(operation => {
        if (!isTraceOperationValue(operation.value)) {
          return;
        }

        // The callback may emit PAGE_IDLE re-entrantly through context; the collector ignores PAGE_IDLE boundaries.
        const validationStatus =
          typeof operation.value.validation_status === 'string'
            ? (operation.value.validation_status as ValidationStatus)
            : undefined;

        collector.onEffectiveEvent(operation.eventType as L2TraceEventType, { validationStatus });
      }),
    [collector, registerTraceOperationObserver]
  );

  useEffect(
    () => registerTraceCollectorFlush(() => collector.flushBoundary()),
    [collector, registerTraceCollectorFlush]
  );

  useEffect(() => {
    const handleVisibilityOrFocusChange = () => {
      collector.handleVisibilityOrFocusChange();
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityOrFocusChange);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('blur', handleVisibilityOrFocusChange);
      window.addEventListener('focus', handleVisibilityOrFocusChange);
    }

    return () => {
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityOrFocusChange);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('blur', handleVisibilityOrFocusChange);
        window.removeEventListener('focus', handleVisibilityOrFocusChange);
      }
      collector.dispose();
    };
  }, [collector]);

  return { startInitial };
}
