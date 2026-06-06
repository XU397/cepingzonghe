import type { L2TraceEventType, PageIdleOptions, PageIdlePhase, TraceEventValue } from '../types';

export interface PageIdleLogger {
  pageIdle(_options: PageIdleOptions): unknown;
}

export interface PageIdleCollectorOptions {
  logger: PageIdleLogger;
  thresholdMs: number;
  now?: () => Date;
  isPageVisible?: () => boolean;
  isWindowFocused?: () => boolean;
}

type EffectiveValidationStatus = NonNullable<TraceEventValue['validation_status']>;

export interface EffectiveEventOptions {
  validationStatus?: EffectiveValidationStatus;
  validation_status?: EffectiveValidationStatus;
}

interface IdleCandidate {
  startedAt: Date;
  phase: PageIdlePhase;
  validVisibleFocusedSegment: boolean;
}

const EXCLUDED_EVENT_TYPES = new Set<L2TraceEventType>([
  'START_PAGE',
  'PAGE_IDLE',
  'PAGE_HIDDEN',
  'PAGE_VISIBLE',
  'TASK_FINISH',
  'TIMER_COMPLETE',
]);

const defaultNow = () => new Date();

const defaultIsPageVisible = () => {
  if (typeof document === 'undefined') {
    return true;
  }
  return document.visibilityState === 'visible';
};

const defaultIsWindowFocused = () => {
  if (typeof document === 'undefined' || typeof document.hasFocus !== 'function') {
    return true;
  }
  return document.hasFocus();
};

const assertValidThreshold = (thresholdMs: number) => {
  if (!Number.isFinite(thresholdMs) || thresholdMs <= 0) {
    throw new Error('createPageIdleCollector requires thresholdMs to be a finite positive number.');
  }
};

const isTrackedEffectiveEvent = (eventType: L2TraceEventType) => !EXCLUDED_EVENT_TYPES.has(eventType);

const nextPhaseAfterEvent = (
  eventType: L2TraceEventType,
  eventOptions: EffectiveEventOptions
): PageIdlePhase => {
  const validationStatus = eventOptions.validationStatus ?? eventOptions.validation_status;
  if (eventType === 'SUBMIT_ATTEMPT' && validationStatus === 'blocked') {
    return 'after_blocked_submit';
  }
  return 'between_effective_events';
};

export function createPageIdleCollector(options: PageIdleCollectorOptions) {
  assertValidThreshold(options.thresholdMs);

  const thresholdMs = options.thresholdMs;
  const now = options.now ?? defaultNow;
  const isPageVisible = options.isPageVisible ?? defaultIsPageVisible;
  const isWindowFocused = options.isWindowFocused ?? defaultIsWindowFocused;
  let candidate: IdleCandidate | null = null;

  const isVisibleAndFocused = () => isPageVisible() && isWindowFocused();

  const start = (phase: PageIdlePhase, startedAt = now()) => {
    candidate = {
      startedAt,
      phase,
      validVisibleFocusedSegment: isVisibleAndFocused(),
    };
  };

  const closeCandidate = (closedAt = now()) => {
    if (!candidate) {
      return;
    }

    const idleDurationMs = closedAt.getTime() - candidate.startedAt.getTime();
    if (
      candidate.validVisibleFocusedSegment &&
      isVisibleAndFocused() &&
      Number.isFinite(idleDurationMs) &&
      idleDurationMs > 0 &&
      idleDurationMs >= thresholdMs
    ) {
      options.logger.pageIdle({
        idleDurationMs,
        idlePhase: candidate.phase,
        pageVisible: true,
        windowFocused: true,
        time: closedAt,
      });
    }
  };

  return {
    start,
    onEffectiveEvent(eventType: L2TraceEventType, eventOptions: EffectiveEventOptions = {}) {
      if (!isTrackedEffectiveEvent(eventType)) {
        return;
      }
      const boundaryTime = now();
      closeCandidate(boundaryTime);
      start(nextPhaseAfterEvent(eventType, eventOptions), boundaryTime);
    },
    flushBoundary() {
      const boundaryTime = now();
      closeCandidate(boundaryTime);
      start('between_effective_events', boundaryTime);
    },
    handleVisibilityOrFocusChange() {
      if (!candidate) {
        return;
      }

      if (!isVisibleAndFocused()) {
        candidate.validVisibleFocusedSegment = false;
        return;
      }

      if (!candidate.validVisibleFocusedSegment) {
        start(candidate.phase);
      }
    },
    dispose() {
      candidate = null;
    },
  };
}
