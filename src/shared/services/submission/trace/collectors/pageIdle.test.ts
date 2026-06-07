import { describe, expect, it, vi } from 'vitest';
import type { L2TraceEventType } from '../types';
import { PAGE_IDLE_THRESHOLD_MS } from '../contracts';
import { createPageIdleCollector } from './pageIdle';

const createCollector = (initialTime = 0, thresholdMs = PAGE_IDLE_THRESHOLD_MS) => {
  let nowMs = initialTime;
  let pageVisible = true;
  let windowFocused = true;
  const logger = {
    pageIdle: vi.fn(),
  };
  const collector = createPageIdleCollector({
    logger,
    thresholdMs,
    now: () => new Date(nowMs),
    isPageVisible: () => pageVisible,
    isWindowFocused: () => windowFocused,
  });

  return {
    collector,
    logger,
    setNowMs(nextNowMs: number) {
      nowMs = nextNowMs;
    },
    setPageVisible(nextPageVisible: boolean) {
      pageVisible = nextPageVisible;
    },
    setWindowFocused(nextWindowFocused: boolean) {
      windowFocused = nextWindowFocused;
    },
  };
};

describe('createPageIdleCollector', () => {
  const nonEffectiveEvents: L2TraceEventType[] = [
    'START_PAGE',
    'PAGE_IDLE',
    'PAGE_HIDDEN',
    'PAGE_VISIBLE',
    'TASK_FINISH',
    'TIMER_COMPLETE',
  ];

  it('emits initial_before_first_action when duration reaches threshold', () => {
    const { collector, logger, setNowMs } = createCollector(0);

    collector.start('initial_before_first_action');
    setNowMs(5000);
    collector.onEffectiveEvent('TEXT_FOCUS');

    expect(logger.pageIdle).toHaveBeenCalledWith({
      idleDurationMs: 5000,
      idlePhase: 'initial_before_first_action',
      pageVisible: true,
      windowFocused: true,
      time: new Date(5000),
    });
  });

  it('ignores lifecycle and non-effective events without closing or restarting the candidate', () => {
    const { collector, logger, setNowMs } = createCollector(0);

    collector.start('initial_before_first_action');
    setNowMs(6000);
    nonEffectiveEvents.forEach((eventType) => {
      collector.onEffectiveEvent(eventType);
    });
    setNowMs(7000);
    collector.onEffectiveEvent('TEXT_FOCUS');

    expect(logger.pageIdle).toHaveBeenCalledTimes(1);
    expect(logger.pageIdle).toHaveBeenCalledWith({
      idleDurationMs: 7000,
      idlePhase: 'initial_before_first_action',
      pageVisible: true,
      windowFocused: true,
      time: new Date(7000),
    });
  });

  it('does not emit under threshold', () => {
    const { collector, logger, setNowMs } = createCollector(0);

    collector.start('initial_before_first_action');
    setNowMs(4999);
    collector.onEffectiveEvent('TEXT_FOCUS');

    expect(logger.pageIdle).not.toHaveBeenCalled();
  });

  it('starts after_blocked_submit after blocked submit boundary', () => {
    const { collector, logger, setNowMs } = createCollector(0);

    collector.start('initial_before_first_action');
    setNowMs(1000);
    collector.onEffectiveEvent('SUBMIT_ATTEMPT', { validationStatus: 'blocked' });
    setNowMs(7000);
    collector.onEffectiveEvent('TEXT_FOCUS');

    expect(logger.pageIdle).toHaveBeenCalledTimes(1);
    expect(logger.pageIdle).toHaveBeenCalledWith({
      idleDurationMs: 6000,
      idlePhase: 'after_blocked_submit',
      pageVisible: true,
      windowFocused: true,
      time: new Date(7000),
    });
  });

  it('starts after_blocked_submit after snake_case blocked submit boundary', () => {
    const { collector, logger, setNowMs } = createCollector(0);

    collector.start('initial_before_first_action');
    setNowMs(1000);
    collector.onEffectiveEvent('SUBMIT_ATTEMPT', { validation_status: 'blocked' });
    setNowMs(7000);
    collector.onEffectiveEvent('TEXT_FOCUS');

    expect(logger.pageIdle).toHaveBeenCalledTimes(1);
    expect(logger.pageIdle).toHaveBeenCalledWith({
      idleDurationMs: 6000,
      idlePhase: 'after_blocked_submit',
      pageVisible: true,
      windowFocused: true,
      time: new Date(7000),
    });
  });

  it('flushBoundary closes and restarts as between_effective_events', () => {
    const { collector, logger, setNowMs } = createCollector(0);

    collector.start('initial_before_first_action');
    setNowMs(5000);
    collector.flushBoundary();
    setNowMs(10000);
    collector.onEffectiveEvent('TEXT_FOCUS');

    expect(logger.pageIdle).toHaveBeenCalledTimes(2);
    expect(logger.pageIdle).toHaveBeenNthCalledWith(1, {
      idleDurationMs: 5000,
      idlePhase: 'initial_before_first_action',
      pageVisible: true,
      windowFocused: true,
      time: new Date(5000),
    });
    expect(logger.pageIdle).toHaveBeenNthCalledWith(2, {
      idleDurationMs: 5000,
      idlePhase: 'between_effective_events',
      pageVisible: true,
      windowFocused: true,
      time: new Date(10000),
    });
  });

  it('discards hidden or unfocused candidate segments', () => {
    const { collector, logger, setNowMs, setPageVisible } = createCollector(0);

    collector.start('initial_before_first_action');
    setPageVisible(false);
    collector.handleVisibilityOrFocusChange();
    setPageVisible(true);
    setNowMs(5000);
    collector.onEffectiveEvent('TEXT_FOCUS');

    expect(logger.pageIdle).not.toHaveBeenCalled();
  });

  it('treats focus loss like visibility loss', () => {
    const { collector, logger, setNowMs, setWindowFocused } = createCollector(0);

    collector.start('initial_before_first_action');
    setWindowFocused(false);
    collector.handleVisibilityOrFocusChange();
    setWindowFocused(true);
    setNowMs(5000);
    collector.onEffectiveEvent('TEXT_FOCUS');

    expect(logger.pageIdle).not.toHaveBeenCalled();
  });

  it('restarts the same idle phase when visibility regains', () => {
    const { collector, logger, setNowMs, setPageVisible } = createCollector(0);

    collector.start('initial_before_first_action');
    setNowMs(1000);
    setPageVisible(false);
    collector.handleVisibilityOrFocusChange();
    setNowMs(2000);
    setPageVisible(true);
    collector.handleVisibilityOrFocusChange();
    setNowMs(7000);
    collector.onEffectiveEvent('TEXT_FOCUS');

    expect(logger.pageIdle).toHaveBeenCalledTimes(1);
    expect(logger.pageIdle).toHaveBeenCalledWith({
      idleDurationMs: 5000,
      idlePhase: 'initial_before_first_action',
      pageVisible: true,
      windowFocused: true,
      time: new Date(7000),
    });
  });

  it('does not count hidden time before visibility regains', () => {
    const { collector, logger, setNowMs, setPageVisible } = createCollector(0);

    collector.start('initial_before_first_action');
    setNowMs(1000);
    setPageVisible(false);
    collector.handleVisibilityOrFocusChange();
    setNowMs(2000);
    setPageVisible(true);
    collector.handleVisibilityOrFocusChange();
    setNowMs(6999);
    collector.onEffectiveEvent('TEXT_FOCUS');

    expect(logger.pageIdle).not.toHaveBeenCalled();
  });

  it.each<[string, number, number]>([
    ['zero', 5000, 5000],
    ['backward', 5000, 4000],
    ['invalid close', 0, Number.NaN],
    ['invalid start', Number.NaN, 5000],
  ])('does not emit for %s time boundaries', (_caseName, startMs, endMs) => {
    const { collector, logger, setNowMs } = createCollector(startMs, 1);

    collector.start('initial_before_first_action');
    setNowMs(endMs);
    collector.onEffectiveEvent('TEXT_FOCUS');

    expect(logger.pageIdle).not.toHaveBeenCalled();
  });

  it.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    'throws a clear error for invalid threshold %s',
    (thresholdMs) => {
      expect(() =>
        createPageIdleCollector({
          logger: { pageIdle: vi.fn() },
          thresholdMs,
          now: () => new Date(0),
          isPageVisible: () => true,
          isWindowFocused: () => true,
        })
      ).toThrow('createPageIdleCollector requires thresholdMs to be a finite positive number.');
    }
  );

  it('dispose clears the candidate so later boundaries do not emit', () => {
    const { collector, logger, setNowMs } = createCollector(0);

    collector.start('initial_before_first_action');
    collector.dispose();
    setNowMs(5000);
    collector.onEffectiveEvent('TEXT_FOCUS');

    expect(logger.pageIdle).not.toHaveBeenCalled();
  });
});
