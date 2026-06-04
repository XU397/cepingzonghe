import { describe, expect, it, vi } from 'vitest';
import { createPageTraceLogger, formatTraceTimestamp } from '../logger';
import {
  EXP_RUN_DEBOUNCE_MS,
  TEXT_DEBOUNCE_MS,
  TEXT_THROTTLE_CHAR_DELTA,
  TRACE_EVENT_TYPES,
  TRACE_RULE_THRESHOLDS,
  getRuleThreshold,
  hasContentId,
  hasFieldId,
  hasQuestionId,
} from '../contracts';

describe('createPageTraceLogger', () => {
  const baseOptions = {
    page: {
      legacyPageId: 'simulation_question_1',
      standardPageId: 'page_09_experiment_question_1',
      pageIndex: 9,
      pageType: 'D2_SIMULATION_QUESTION' as const,
      lifecycleMode: 'l2-trace' as const,
      requiredFields: ['question_1_answer'],
    },
    pageNumber: '1.10',
    flowContext: {
      flowId: 'flow-g8',
      submoduleId: 'g8-banana-browning-experiment',
      stepIndex: 0,
      moduleName: '8年级香蕉变黑科学探究',
      pageId: 'simulation_question_1',
    },
    logOperation: vi.fn(),
    now: () => new Date('2026-06-03T02:10:00.000Z'),
    idFactory: {
      traceId: () => 'trace-1',
      submitAttemptId: () => 'submit-1',
      expRunId: (pageId: string, runSeq: number) => `${pageId}-run-${runSeq}`,
      rowId: (pageId: string, rowSeq: number) => `${pageId}-row-${rowSeq}`,
    },
  };

  it('loads L2 event types from the synced contract', () => {
    expect(TRACE_EVENT_TYPES).toContain('START_PAGE');
    expect(TRACE_EVENT_TYPES).toContain('TEXT_BLUR');
    expect(TRACE_EVENT_TYPES).toContain('EXECUTE_EXP');
    expect(TRACE_EVENT_TYPES).not.toContain('page_enter');
  });

  it('exposes all trace rule thresholds and preserves named aliases', () => {
    expect(TEXT_DEBOUNCE_MS).toBe(2000);
    expect(TEXT_THROTTLE_CHAR_DELTA).toBe(10);
    expect(EXP_RUN_DEBOUNCE_MS).toBe(1000);
    expect(TRACE_RULE_THRESHOLDS).toMatchObject({
      textDebounceMs: 2000,
      textThrottleCharDelta: 10,
      expRunDebounceMs: 1000,
      pageHiddenAdjustEnabled: true,
    });
    expect(getRuleThreshold('deepReadMs')).toBe(8000);
    expect(getRuleThreshold('missingThreshold')).toBeUndefined();
  });

  it('checks field, question, and content registry IDs', () => {
    expect(hasFieldId('page_09_experiment_question_1', 'question_1_answer')).toBe(true);
    expect(hasFieldId('page_09_experiment_question_1', 'missing_field')).toBe(false);
    expect(hasQuestionId('page_09_experiment_question_1', 'question_1')).toBe(true);
    expect(hasQuestionId('page_09_experiment_question_1', 'missing_question')).toBe(false);
    expect(hasContentId('page_02_question_generation', 'chat_bubble_02_01')).toBe(true);
    expect(hasContentId('page_02_question_generation', 'missing_content')).toBe(false);
  });

  it('formats trace timestamps with deterministic timezone offsets', () => {
    const timestamp = new Date('2026-06-03T02:10:00.000Z');

    expect(formatTraceTimestamp(timestamp)).toBe('2026-06-03T10:10:00.000+08:00');
    expect(formatTraceTimestamp(timestamp, -300)).toBe('2026-06-02T21:10:00.000-05:00');
  });

  it('emits START_PAGE with registry metadata and flow context', () => {
    const logger = createPageTraceLogger(baseOptions);
    const operation = logger.startPage({
      initial_state: { selectedOption: null },
    });

    expect(operation).toMatchObject({
      targetElement: 'P1.10_page',
      eventType: 'START_PAGE',
      time: '2026-06-03T10:10:00.000+08:00',
      pageId: 'simulation_question_1',
      value: {
        trace_id: 'trace-1',
        page_id: 'page_09_experiment_question_1',
        page_type: 'D2_SIMULATION_QUESTION',
        target_id: 'page',
        target_type: 'page',
        metadata: {
          schema_version: 'science-inquiry-trace-v2.1',
          field_registry_version: 'science-inquiry-field-registry-v2.1',
          content_registry_version: 'science-inquiry-content-registry-banana-v2.1',
          page_index: 9,
          legacy_page_id: 'simulation_question_1',
          flow_context: baseOptions.flowContext,
          initial_state: { selectedOption: null },
        },
      },
    });
    expect(baseOptions.logOperation).toHaveBeenCalledWith(operation);
  });

  it('keeps invariant metadata authoritative over caller metadata', () => {
    const logger = createPageTraceLogger(baseOptions);
    const operation = logger.startPage({
      schema_version: 'caller-schema',
      page_index: 999,
      legacy_page_id: 'caller-page',
      flow_context: { flowId: 'caller-flow' },
    });

    expect(operation.value.metadata).toMatchObject({
      schema_version: 'science-inquiry-trace-v2.1',
      page_index: 9,
      legacy_page_id: 'simulation_question_1',
      flow_context: baseOptions.flowContext,
    });
  });

  it('emits SELECT_ANSWER without allocating a code', () => {
    const logger = createPageTraceLogger(baseOptions);
    const operation = logger.selectAnswer({
      questionId: 'question_1',
      optionId: 'option_b',
      optionText: 'B. 6天',
      valueBefore: 'option_a',
      targetId: 'question_1_option_b',
      questionIndex: 1,
      totalQuestionCount: 3,
    });

    expect(operation).not.toHaveProperty('code');
    expect(operation).toMatchObject({
      targetElement: 'P1.10_question_1_option_b',
      eventType: 'SELECT_ANSWER',
      value: {
        question_id: 'question_1',
        option_id: 'option_b',
        value_before: 'option_a',
        value_after: 'option_b',
        metadata: {
          option_text: 'B. 6天',
          question_index: 1,
          total_question_count: 3,
        },
      },
    });
  });

  it('emits TEXT_CHANGE with redacted value_after and char-count metadata', () => {
    const logger = createPageTraceLogger(baseOptions);
    const operation = logger.textChange('question_1_answer', 'abc', 'abcdef', {
      flush_reason: 'typing',
    });

    expect(operation).toMatchObject({
      targetElement: 'P1.10_question_1_answer',
      eventType: 'TEXT_CHANGE',
      value: {
        field_id: 'question_1_answer',
        value_before: 'abc',
        value_after: null,
        metadata: {
          char_count_before: 3,
          char_count_after: 6,
          char_delta: 3,
          flush_reason: 'typing',
        },
      },
    });
  });

  it('emits SUBMIT_ATTEMPT with attempt id, validation status, and missing fields', () => {
    const logger = createPageTraceLogger(baseOptions);
    const operation = logger.submitAttempt({
      validationStatus: 'blocked',
      missingFields: ['question_1_answer'],
      targetId: 'finish_button',
    });

    expect(operation).toMatchObject({
      targetElement: 'P1.10_finish_button',
      eventType: 'SUBMIT_ATTEMPT',
      value: {
        submit_attempt_id: 'submit-1',
        validation_status: 'blocked',
        metadata: {
          missing_fields: ['question_1_answer'],
        },
      },
    });
  });

  it('returns operations without logging when emit is false', () => {
    const logOperation = vi.fn();
    const logger = createPageTraceLogger({ ...baseOptions, logOperation });
    const operation = logger.emit(
      'RESET_EXP',
      {},
      {
        targetId: 'reset_exp',
        targetType: 'experiment',
        emit: false,
      }
    );

    expect(operation).toMatchObject({
      targetElement: 'P1.10_reset_exp',
      eventType: 'RESET_EXP',
    });
    expect(logOperation).not.toHaveBeenCalled();
  });
});
