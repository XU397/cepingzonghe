import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTextEventCollector } from './text';

const createLogger = () => ({
  textFocus: vi.fn(),
  textChange: vi.fn(),
  textBlur: vi.fn(),
});

describe('createTextEventCollector', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('emits TEXT_CHANGE on debounce for natural long input before blur', () => {
    vi.useFakeTimers();
    const logger = createLogger();
    const collector = createTextEventCollector({
      fieldId: 'reason_text',
      logger,
      debounceMs: 300,
      throttleCharDelta: 100,
    });

    collector.onFocus('');
    collector.onChange('banana browning explanation', {
      metadata: { source_answer_key: 'Q8_reason' },
    });

    vi.advanceTimersByTime(299);
    expect(logger.textChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(logger.textChange).toHaveBeenCalledTimes(1);
    expect(logger.textChange).toHaveBeenCalledWith(
      'reason_text',
      '',
      'banana browning explanation',
      {
        source_answer_key: 'Q8_reason',
        flush_reason: 'debounce',
      }
    );

    collector.onBlur('banana browning explanation');
    expect(logger.textChange).toHaveBeenCalledTimes(1);
    expect(logger.textBlur).toHaveBeenCalledTimes(1);
    expect(logger.textBlur).toHaveBeenCalledWith(
      'reason_text',
      '',
      'banana browning explanation',
      {
        source_answer_key: 'Q8_reason',
        flush_reason: 'blur',
      }
    );
  });

  it('flushes short input on blur without fabricated intermediate cadence', () => {
    const logger = createLogger();
    const collector = createTextEventCollector({
      fieldId: 'short_answer',
      logger,
      debounceMs: 300,
      throttleCharDelta: 10,
    });

    collector.onFocus('');
    collector.onChange('ok');
    expect(logger.textChange).not.toHaveBeenCalled();

    collector.onBlur('ok', { source_answer_key: 'Q2_short' });

    expect(logger.textChange).toHaveBeenCalledTimes(1);
    expect(logger.textChange).toHaveBeenCalledWith('short_answer', '', 'ok', {
      source_answer_key: 'Q2_short',
      flush_reason: 'blur',
    });
    expect(logger.textBlur).toHaveBeenCalledTimes(1);
    expect(logger.textBlur).toHaveBeenCalledWith('short_answer', '', 'ok', {
      source_answer_key: 'Q2_short',
      flush_reason: 'blur',
    });
  });
});
