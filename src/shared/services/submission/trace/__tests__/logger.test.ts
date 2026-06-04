import { describe, expect, it, vi } from 'vitest';
import { createPageTraceLogger } from '../logger';
import { TRACE_EVENT_TYPES } from '../contracts';

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
});
