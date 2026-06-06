import { describe, expect, it, vi } from 'vitest';
import { createPageTraceLogger, formatTraceTimestamp } from '../logger';
import {
  EXP_RUN_DEBOUNCE_MS,
  PAGE_IDLE_THRESHOLD_MS,
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
    expect(TRACE_EVENT_TYPES).toContain('PAGE_IDLE');
    expect(TRACE_EVENT_TYPES).toContain('TEXT_BLUR');
    expect(TRACE_EVENT_TYPES).toContain('EXECUTE_EXP');
    expect(TRACE_EVENT_TYPES).not.toContain('page_enter');
  });

  it('exposes all trace rule thresholds and preserves named aliases', () => {
    expect(TEXT_DEBOUNCE_MS).toBe(2000);
    expect(TEXT_THROTTLE_CHAR_DELTA).toBe(10);
    expect(EXP_RUN_DEBOUNCE_MS).toBe(1000);
    expect(PAGE_IDLE_THRESHOLD_MS).toBe(5000);
    expect(TRACE_RULE_THRESHOLDS).toMatchObject({
      textDebounceMs: 2000,
      textThrottleCharDelta: 10,
      expRunDebounceMs: 1000,
      pageIdleThresholdMs: 5000,
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
          schema_version: 'science-inquiry-trace-v2.2',
          field_registry_version: 'science-inquiry-field-registry-v2.2',
          field_registry_hash: '93f0d6b95a7ae9615bf9bc0604fd81fa52d47712c9f3eda8670875e6646bcc54',
          content_registry_version: 'science-inquiry-content-registry-banana-v2.2',
          content_registry_hash: '7a8074f0f856be60949015eabae64e5ebf43bca9413b587476c8fb2231cc1fd7',
          rule_config_version: 'rule-config-v2.2',
          rule_config_hash: 'c29da8988f93be25b69d4b7f82df417fb2f70741c4d0eb923de9e69531fd5d83',
          page_index: 9,
          legacy_page_id: 'simulation_question_1',
          flow_context: baseOptions.flowContext,
          initial_state: { selectedOption: null },
        },
      },
    });
    expect(baseOptions.logOperation).toHaveBeenCalledWith(operation);
  });

  it('emits PAGE_IDLE with backend v2.2 idle metadata names', () => {
    const logger = createPageTraceLogger(baseOptions);
    const operation = logger.pageIdle({
      idleDurationMs: 6200,
      idlePhase: 'initial_before_first_action',
      pageVisible: true,
      windowFocused: true,
    });

    expect(operation).toMatchObject({
      targetElement: 'P1.10_page',
      eventType: 'PAGE_IDLE',
      value: {
        target_id: 'page',
        target_type: 'page',
        metadata: {
          idle_duration_ms: 6200,
          idle_phase: 'initial_before_first_action',
          page_visible: true,
          window_focused: true,
          threshold_ms: 5000,
        },
      },
    });
  });

  it('emits CHAT_SCROLL with backend fixture metadata names', () => {
    const logger = createPageTraceLogger({
      ...baseOptions,
      page: {
        legacyPageId: 'banana_mystery',
        standardPageId: 'page_02_question_generation',
        pageIndex: 2,
        pageType: 'B1_TEXT_SINGLE' as const,
        lifecycleMode: 'l2-trace' as const,
        requiredFields: ['question_generation_answer'],
      },
      pageNumber: '1.03',
    });
    const visibleContentIdsBefore = ['chat_bubble_02_01'];
    const visibleContentIdsAfter = ['chat_bubble_02_01', 'chat_bubble_02_02'];
    const operation = logger.chatScroll({
      scrollDelta: 240,
      scrollDirection: 'down',
      visibleContentIdsBefore,
      visibleContentIdsAfter,
      phase: 'reading_chat',
    });
    visibleContentIdsBefore.push('mutated_before');
    visibleContentIdsAfter.push('mutated_after');

    expect(operation).toMatchObject({
      targetElement: 'P1.03_chat_window',
      eventType: 'CHAT_SCROLL',
      value: {
        target_id: 'chat_window',
        target_type: 'content',
        metadata: {
          scroll_delta: 240,
          scroll_direction: 'down',
          visible_content_ids_before: ['chat_bubble_02_01'],
          visible_content_ids_after: ['chat_bubble_02_01', 'chat_bubble_02_02'],
          phase: 'reading_chat',
        },
      },
    });
  });

  it('keeps invariant metadata authoritative over caller metadata', () => {
    const logger = createPageTraceLogger(baseOptions);
    const operation = logger.startPage({
      schema_version: 'caller-schema',
      field_registry_version: 'caller-field-registry',
      field_registry_hash: 'caller-field-registry-hash',
      content_registry_version: 'caller-content-registry',
      content_registry_hash: 'caller-content-registry-hash',
      rule_config_version: 'caller-rule-config',
      rule_config_hash: 'caller-rule-config-hash',
      page_index: 999,
      legacy_page_id: 'caller-page',
      flow_context: { flowId: 'caller-flow' },
    });

    expect(operation.value.metadata).toMatchObject({
      schema_version: 'science-inquiry-trace-v2.2',
      field_registry_version: 'science-inquiry-field-registry-v2.2',
      field_registry_hash: '93f0d6b95a7ae9615bf9bc0604fd81fa52d47712c9f3eda8670875e6646bcc54',
      content_registry_version: 'science-inquiry-content-registry-banana-v2.2',
      content_registry_hash: '7a8074f0f856be60949015eabae64e5ebf43bca9413b587476c8fb2231cc1fd7',
      rule_config_version: 'rule-config-v2.2',
      rule_config_hash: 'c29da8988f93be25b69d4b7f82df417fb2f70741c4d0eb923de9e69531fd5d83',
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

  it('emits SUBMIT_ATTEMPT with attempt id, validation status, missing fields, and submit trigger', () => {
    const logger = createPageTraceLogger(baseOptions);
    const operation = logger.submitAttempt({
      validationStatus: 'blocked',
      missingFields: ['question_1_answer'],
      targetId: 'finish_button',
      submitTrigger: 'next_button',
    });

    expect(operation).toMatchObject({
      targetElement: 'P1.10_finish_button',
      eventType: 'SUBMIT_ATTEMPT',
      value: {
        submit_attempt_id: 'submit-1',
        validation_status: 'blocked',
        metadata: {
          missing_fields: ['question_1_answer'],
          submit_trigger: 'next_button',
        },
      },
    });
  });

  it('emits plan-table events with the stable plan_table field id', () => {
    const logger = createPageTraceLogger({
      ...baseOptions,
      page: {
        legacyPageId: 'solution_selection',
        standardPageId: 'page_12_solution_selection',
        pageIndex: 12,
        pageType: 'E1_CHART_PLAN_DECISION' as const,
        lifecycleMode: 'l2-trace' as const,
        requiredFields: ['plan_table', 'reason_text'],
      },
      pageNumber: '1.13',
    });

    expect(logger.addRow('row_1').value).toMatchObject({
      field_id: 'plan_table',
      row_id: 'row_1',
    });
    expect(logger.deleteRow('row_1').value).toMatchObject({
      field_id: 'plan_table',
      row_id: 'row_1',
    });
    expect(logger.setPlanParam('row_1', 'plan_param_1', '', '海南香蕉').value).toMatchObject({
      field_id: 'plan_table',
      row_id: 'row_1',
      param_id: 'plan_param_1',
    });
    expect(logger.selectBest('row_1', null).value).toMatchObject({
      field_id: 'plan_table',
      row_id: 'row_1',
    });
  });

  it('emits CHART_HOVER with chart and point identifiers', () => {
    const logger = createPageTraceLogger({
      ...baseOptions,
      page: {
        legacyPageId: 'solution_selection',
        standardPageId: 'page_12_solution_selection',
        pageIndex: 12,
        pageType: 'E1_CHART_PLAN_DECISION' as const,
        lifecycleMode: 'l2-trace' as const,
        requiredFields: ['plan_table', 'reason_text'],
      },
      pageNumber: '1.13',
    });

    const operation = logger.chartHover('chart_evidence_1', 'day_12', {
      hover_ms: 500,
      data_snapshot: { day: '12' },
    });

    expect(operation).toMatchObject({
      targetElement: 'P1.13_chart_evidence_1',
      eventType: 'CHART_HOVER',
      value: {
        chart_id: 'chart_evidence_1',
        point_id: 'day_12',
        metadata: {
          hover_ms: 500,
          data_snapshot: { day: '12' },
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
