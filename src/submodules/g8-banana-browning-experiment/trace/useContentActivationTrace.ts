import { useCallback, useEffect, useRef } from 'react';
import type { HTMLAttributes } from 'react';

export const BANANA_CONTENT_ACTIVATE_HOVER_MIN_MS = 600;
export const BANANA_CONTENT_ACTIVATE_TOUCH_MIN_MS = 300;

interface TraceLoggerLike {
  contentActivate?: (
    contentId: string,
    targetType?: 'content',
    metadata?: Record<string, unknown>
  ) => unknown;
}

interface ActivationOptions {
  sourceUiId: string;
  metadata?: Record<string, unknown>;
}

type ActivationType = 'hover' | 'touch';

interface ActivationState {
  activationType: ActivationType;
  startedAt: number;
}

export function useContentActivationTrace(traceLogger: TraceLoggerLike | null | undefined) {
  const activeByContentIdRef = useRef<Record<string, ActivationState>>({});

  useEffect(
    () => () => {
      activeByContentIdRef.current = {};
    },
    []
  );

  return useCallback(
    (
      contentId: string,
      { sourceUiId, metadata = {} }: ActivationOptions
    ): Pick<
      HTMLAttributes<HTMLElement>,
      'onMouseEnter' | 'onMouseLeave' | 'onTouchStart' | 'onTouchEnd' | 'onTouchCancel'
    > => {
      const start = (activationType: ActivationType) => {
        activeByContentIdRef.current[contentId] = {
          activationType,
          startedAt: Date.now(),
        };
      };

      const finish = (activationType: ActivationType) => {
        const activeState = activeByContentIdRef.current[contentId];
        if (!activeState || activeState.activationType !== activationType) {
          return;
        }

        delete activeByContentIdRef.current[contentId];

        const dwellMs = Date.now() - activeState.startedAt;
        const thresholdMs =
          activationType === 'touch'
            ? BANANA_CONTENT_ACTIVATE_TOUCH_MIN_MS
            : BANANA_CONTENT_ACTIVATE_HOVER_MIN_MS;

        if (dwellMs < thresholdMs) {
          return;
        }

        traceLogger?.contentActivate?.(contentId, 'content', {
          source: 'content_activation',
          source_ui_id: sourceUiId,
          activation_type: activationType,
          dwell_ms: dwellMs,
          threshold_ms: thresholdMs,
          visible_ratio: 1,
          ...metadata,
        });
      };

      return {
        onMouseEnter: () => start('hover'),
        onMouseLeave: () => finish('hover'),
        onTouchStart: () => start('touch'),
        onTouchEnd: () => finish('touch'),
        onTouchCancel: () => {
          delete activeByContentIdRef.current[contentId];
        },
      };
    },
    [traceLogger]
  );
}
