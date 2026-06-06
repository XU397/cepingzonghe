import { describe, expect, it } from 'vitest';
import { CHART_HOVER_MIN_MS, PAGE_IDLE_THRESHOLD_MS } from '../contracts';
import { createPageTraceLogger } from '../logger';
import { validateTraceMark } from '../validators/validateTraceMark';

const validMark = {
  pageNumber: '1.10',
  pageDesc: '模拟实验 + 问题1',
  beginTime: '2026-06-03T10:10:00.000+08:00',
  endTime: '2026-06-03T10:10:30.000+08:00',
  imgList: [],
  answerList: [{ code: 1, targetElement: 'P1.10_Q5', value: 'B. 6天' }],
  operationList: [
    {
      code: 1,
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
        },
      },
    },
    {
      code: 2,
      targetElement: 'P1.10_question_1_option_b',
      eventType: 'SELECT_ANSWER',
      time: '2026-06-03T10:10:20.000+08:00',
      pageId: 'simulation_question_1',
      value: {
        trace_id: 'trace-2',
        page_id: 'page_09_experiment_question_1',
        page_type: 'D2_SIMULATION_QUESTION',
        target_id: 'question_1_option_b',
        target_type: 'radio',
        question_id: 'question_1',
        option_id: 'option_b',
        metadata: {},
      },
    },
    {
      code: 3,
      targetElement: 'P1.10_next_button',
      eventType: 'SUBMIT_ATTEMPT',
      time: '2026-06-03T10:10:30.000+08:00',
      pageId: 'simulation_question_1',
      value: {
        trace_id: 'trace-3',
        page_id: 'page_09_experiment_question_1',
        page_type: 'D2_SIMULATION_QUESTION',
        target_id: 'next_button',
        target_type: 'button',
        submit_attempt_id: 'submit-1',
        validation_status: 'success',
        metadata: { missing_fields: [], submit_trigger: 'next_button' },
      },
    },
  ],
};

const cloneValidMark = () => JSON.parse(JSON.stringify(validMark));

const page02StartPage = {
  ...validMark.operationList[0],
  targetElement: 'P1.03_page',
  pageId: 'banana_mystery',
  value: {
    ...validMark.operationList[0].value,
    trace_id: 'trace-page02-start',
    page_id: 'page_02_question_generation',
    page_type: 'B1_TEXT_SINGLE',
    target_id: 'page',
    target_type: 'page',
    metadata: {
      schema_version: 'science-inquiry-trace-v2.2',
      field_registry_version: 'science-inquiry-field-registry-v2.2',
      content_registry_version: 'science-inquiry-content-registry-banana-v2.2',
    },
  },
};

const createOperation = (eventType: string, valuePatch: Record<string, unknown>) => ({
  code: 2,
  targetElement: 'P1.10_target',
  eventType,
  time: '2026-06-03T10:10:20.000+08:00',
  pageId: 'simulation_question_1',
  value: {
    trace_id: `trace-${eventType}`,
    page_id: 'page_09_experiment_question_1',
    page_type: 'D2_SIMULATION_QUESTION',
    target_id: 'target',
    target_type: 'button',
    metadata: {},
    ...valuePatch,
  },
});

const createPageIdleOperation = (metadataPatch: Record<string, unknown> = {}) => ({
  ...createOperation('PAGE_IDLE', {
    page_id: 'page_02_question_generation',
    page_type: 'B1_TEXT_SINGLE',
    target_id: 'page',
    target_type: 'page',
    metadata: {
      idle_duration_ms: 6200,
      idle_phase: 'initial_before_first_action',
      page_visible: true,
      window_focused: true,
      threshold_ms: PAGE_IDLE_THRESHOLD_MS,
      ...metadataPatch,
    },
  }),
  targetElement: 'P1.03_page',
  pageId: 'banana_mystery',
});

const createChatScrollOperation = (valuePatch: Record<string, unknown> = {}) => {
  const metadataPatch = valuePatch.metadata && typeof valuePatch.metadata === 'object'
    ? (valuePatch.metadata as Record<string, unknown>)
    : {};

  return {
    ...createOperation('CHAT_SCROLL', {
      page_id: 'page_02_question_generation',
      page_type: 'B1_TEXT_SINGLE',
      target_id: 'chat_window',
      target_type: 'content',
      ...valuePatch,
      metadata: {
        scroll_delta: 240,
        scroll_direction: 'down',
        visible_content_ids_before: ['chat_bubble_02_01'],
        visible_content_ids_after: ['chat_bubble_02_01', 'chat_bubble_02_02'],
        phase: 'reading_chat',
        ...metadataPatch,
      },
    }),
    targetElement: 'P1.03_chat_window',
    pageId: 'banana_mystery',
  };
};

const markWithOperations = (operations: any[]) => ({
  ...cloneValidMark(),
  operationList: operations.map((operation, index) => ({
    ...operation,
    code: index + 1,
  })),
});

const markWithOperationCodes = (operations: any[]) => ({
  ...cloneValidMark(),
  operationList: operations,
});

const createPage13FinishMark = (pageId = 'page_13_finish') => ({
  ...cloneValidMark(),
  pageNumber: '1.14',
  pageDesc: '任务完成',
  answerList: [],
  operationList: [
    {
      code: 1,
      targetElement: 'P1.14_page',
      eventType: 'START_PAGE',
      time: '2026-06-03T10:13:00.000+08:00',
      pageId: 'task_completion',
      value: {
        trace_id: 'p13-e001',
        page_id: pageId,
        page_type: 'A1_FLOW',
        target_id: 'page',
        target_type: 'page',
        metadata: {
          schema_version: 'science-inquiry-trace-v2.1',
          field_registry_version: 'science-inquiry-field-registry-v2.1',
          content_registry_version: 'science-inquiry-content-registry-banana-v2.1',
        },
      },
    },
    {
      code: 2,
      targetElement: 'P1.14_finish',
      eventType: 'TASK_FINISH',
      time: '2026-06-03T10:13:03.000+08:00',
      pageId: 'task_completion',
      value: {
        trace_id: 'p13-e002',
        page_id: pageId,
        page_type: 'A1_FLOW',
        target_id: 'finish',
        target_type: 'button',
        metadata: {
          finish_trigger: 'auto_or_click',
        },
      },
    },
  ],
});

describe('validateTraceMark', () => {
  it('accepts a valid L2 trace mark', () => {
    expect(() => validateTraceMark(validMark)).not.toThrow();
  });

  it('accepts strictly increasing operation codes with gaps', () => {
    const mark = markWithOperationCodes([
      { ...validMark.operationList[0], code: 1 },
      { ...validMark.operationList[2], code: 3 },
    ]);

    expect(() => validateTraceMark(mark)).not.toThrow();
  });

  it('rejects duplicate operation codes', () => {
    const mark = cloneValidMark();
    mark.operationList[1].code = 1;

    expect(() => validateTraceMark(mark)).toThrow(/greater than previous operation code/);
  });

  it('rejects decreasing operation codes', () => {
    const mark = markWithOperationCodes([
      { ...validMark.operationList[0], code: 2 },
      { ...validMark.operationList[1], code: 1 },
    ]);

    expect(() => validateTraceMark(mark)).toThrow(/greater than previous operation code/);
  });

  it('rejects non-positive operation codes', () => {
    const mark = cloneValidMark();
    mark.operationList[0].code = 0;

    expect(() => validateTraceMark(mark)).toThrow(/positive integer/);
  });

  it('rejects non-integer operation codes', () => {
    const mark = cloneValidMark();
    mark.operationList[0].code = 1.5;

    expect(() => validateTraceMark(mark)).toThrow(/positive integer/);
  });

  it('accepts page_13_finish as the registered banana submodule finish page', () => {
    expect(() => validateTraceMark(createPage13FinishMark())).not.toThrow();
  });

  it('accepts page_13_finish for final-page submit attempts without a compatibility alias', () => {
    const mark = createPage13FinishMark();
    mark.operationList[1] = {
      ...mark.operationList[1],
      eventType: 'SUBMIT_ATTEMPT',
      value: {
        ...mark.operationList[1].value,
        target_id: 'next_button',
        submit_attempt_id: 'submit-page13',
        validation_status: 'success',
        metadata: { missing_fields: [], submit_trigger: 'next_button' },
      },
    };

    expect(() => validateTraceMark(mark)).not.toThrow();
  });

  it('rejects page_13_task_finish because the registry uses submodule-local page_13_finish', () => {
    expect(() => validateTraceMark(createPage13FinishMark('page_13_task_finish'))).toThrow(
      /page_id.*registry/i
    );
  });

  it('rejects unknown Page13-like page IDs instead of aliasing them', () => {
    expect(() => validateTraceMark(createPage13FinishMark('page_13_finish_typo'))).toThrow(
      /page_id.*registry/i
    );
  });

  it('rejects legacy lifecycle events in L2 mode', () => {
    expect(() =>
      validateTraceMark({
        ...validMark,
        operationList: [
          ...validMark.operationList,
          {
            code: 4,
            targetElement: 'P1.10_page',
            eventType: 'page_enter',
            time: '2026-06-03T10:10:31.000+08:00',
            value: 'legacy',
          },
        ],
      })
    ).toThrow(/L2 trace eventType/);
  });

  it('rejects stringified value objects', () => {
    expect(() =>
      validateTraceMark({
        ...validMark,
        operationList: [
          {
            ...validMark.operationList[0],
            value: JSON.stringify(validMark.operationList[0].value),
          },
        ],
      })
    ).toThrow(/value must be an object/);
  });

  it('rejects marks without START_PAGE', () => {
    const submitAttempt = createOperation('SUBMIT_ATTEMPT', {
      target_id: 'next_button',
      target_type: 'button',
      submit_attempt_id: 'submit-1',
      validation_status: 'success',
      metadata: { missing_fields: [], submit_trigger: 'next_button' },
    });

    expect(() => validateTraceMark(markWithOperations([submitAttempt]))).toThrow(/START_PAGE/);
  });

  it('rejects operations missing target_id', () => {
    const mark = cloneValidMark();
    delete mark.operationList[0].value.target_id;

    expect(() => validateTraceMark(mark)).toThrow(/target_id/);
  });

  it('rejects page IDs absent from trace registries', () => {
    const mark = cloneValidMark();
    mark.operationList[0].value.page_id = 'page_missing_from_registries';

    expect(() => validateTraceMark(mark)).toThrow(/page_id.*registry/i);
  });

  it('rejects page types that do not match the page registry', () => {
    const mark = cloneValidMark();
    mark.operationList[0].value.page_type = 'A1_FLOW';

    expect(() => validateTraceMark(mark)).toThrow(/page_type.*registry/i);
  });

  it('rejects non-ISO operation timestamps', () => {
    const mark = cloneValidMark();
    mark.operationList[0].time = 'not a timestamp';

    expect(() => validateTraceMark(mark)).toThrow(/time.*format/i);
  });

  it('rejects operation timestamps without milliseconds', () => {
    const mark = cloneValidMark();
    mark.operationList[0].time = '2026-06-03T10:10:00+08:00';

    expect(() => validateTraceMark(mark)).toThrow(/time.*format/i);
  });

  it('accepts UTC operation timestamps with milliseconds', () => {
    const mark = cloneValidMark();
    mark.operationList[0].time = '2026-06-03T02:10:00.000Z';

    expect(() => validateTraceMark(mark)).not.toThrow();
  });

  it('rejects invalid submit validation status', () => {
    const mark = cloneValidMark();
    mark.operationList[2].value.validation_status = 'maybe';

    expect(() => validateTraceMark(mark)).toThrow(/validation_status/);
  });

  it('rejects answer option IDs not registered for the question', () => {
    const factorToggle = createOperation('CHECKBOX_TOGGLE', {
      page_id: 'page_03_factor_selection',
      page_type: 'C1_INFO_SELECTION',
      target_id: 'factor_selection_optoin_1',
      target_type: 'checkbox',
      field_id: 'factor_selection',
      question_id: 'factor_selection',
      option_id: 'optoin_1',
      value_before: [],
      value_after: ['optoin_1'],
    });

    expect(() => validateTraceMark(markWithOperations([validMark.operationList[0], factorToggle]))).toThrow(
      /option_id.*registry/i
    );
  });

  it.each([
    [
      'SET_EXP_PARAM',
      createOperation('SET_EXP_PARAM', {
        target_id: 'days_slider',
        target_type: 'experiment',
        param_name: 'days',
      }),
      /param_id/,
    ],
    [
      'SET_EXP_PARAM',
      createOperation('SET_EXP_PARAM', {
        target_id: 'days_slider',
        target_type: 'experiment',
        param_id: 'exp_param_days',
      }),
      /param_name/,
    ],
    [
      'EXECUTE_EXP',
      createOperation('EXECUTE_EXP', {
        target_id: 'execute_exp',
        target_type: 'experiment',
      }),
      /exp_run_id/,
    ],
    [
      'RESET_EXP',
      createOperation('RESET_EXP', {
        target_id: 'reset_exp',
        target_type: 'experiment',
        metadata: {},
      }),
      /reset metadata/,
    ],
    [
      'OPEN_MODAL',
      createOperation('OPEN_MODAL', {
        page_id: 'page_02_question_generation',
        page_type: 'B1_TEXT_SINGLE',
        target_id: 'question_source_modal',
        target_type: 'modal',
      }),
      /content_id/,
    ],
    [
      'CLOSE_MODAL',
      createOperation('CLOSE_MODAL', {
        page_id: 'page_02_question_generation',
        page_type: 'B1_TEXT_SINGLE',
        target_id: 'question_source_modal',
        target_type: 'modal',
        metadata: { dwell_ms: 100 },
      }),
      /content_id/,
    ],
    [
      'CONTENT_ACTIVATE',
      createOperation('CONTENT_ACTIVATE', {
        page_id: 'page_02_question_generation',
        page_type: 'B1_TEXT_SINGLE',
        target_id: 'chat_bubble_02_01',
        target_type: 'content',
      }),
      /content_id/,
    ],
    [
      'ADD_ROW',
      createOperation('ADD_ROW', {
        page_id: 'page_12_solution_selection',
        page_type: 'E1_CHART_PLAN_DECISION',
        target_id: 'add_row_button',
        target_type: 'table',
        field_id: 'plan_table',
      }),
      /row_id/,
    ],
    [
      'SET_PLAN_PARAM',
      createOperation('SET_PLAN_PARAM', {
        page_id: 'page_12_solution_selection',
        page_type: 'E1_CHART_PLAN_DECISION',
        target_id: 'row_1_plan_param_1',
        target_type: 'table',
        field_id: 'plan_table',
        row_id: 'row_1',
      }),
      /param_id/,
    ],
    [
      'ADD_ROW',
      createOperation('ADD_ROW', {
        page_id: 'page_12_solution_selection',
        page_type: 'E1_CHART_PLAN_DECISION',
        target_id: 'row_1',
        target_type: 'table',
        row_id: 'row_1',
      }),
      /field_id/,
    ],
    [
      'SET_PLAN_PARAM',
      createOperation('SET_PLAN_PARAM', {
        page_id: 'page_12_solution_selection',
        page_type: 'E1_CHART_PLAN_DECISION',
        target_id: 'row_1_plan_param_1',
        target_type: 'table',
        row_id: 'row_1',
        param_id: 'plan_param_1',
      }),
      /field_id/,
    ],
    [
      'CHART_HOVER',
      createOperation('CHART_HOVER', {
        page_id: 'page_12_solution_selection',
        page_type: 'E1_CHART_PLAN_DECISION',
        target_id: 'banana_browning_chart',
        target_type: 'chart',
      }),
      /chart_id/,
    ],
    [
      'CHART_HOVER',
      createOperation('CHART_HOVER', {
        page_id: 'page_12_solution_selection',
        page_type: 'E1_CHART_PLAN_DECISION',
        target_id: 'banana_browning_chart',
        target_type: 'chart',
        chart_id: 'banana_browning_chart',
      }),
      /point_id/,
    ],
    [
      'SUBMIT_ATTEMPT',
      createOperation('SUBMIT_ATTEMPT', {
        target_id: 'next_button',
        target_type: 'button',
        submit_attempt_id: 'submit-1',
      }),
      /validation_status/,
    ],
    [
      'SUBMIT_ATTEMPT',
      createOperation('SUBMIT_ATTEMPT', {
        target_id: 'next_button',
        target_type: 'button',
        submit_attempt_id: 'submit-1',
        validation_status: 'success',
        metadata: { missing_fields: [] },
      }),
      /submit_trigger/,
    ],
    [
      'TEXT_CHANGE',
      createOperation('TEXT_CHANGE', {
        target_id: 'question_1_answer',
        target_type: 'text',
      }),
      /field_id/,
    ],
    [
      'SELECT_ANSWER',
      createOperation('SELECT_ANSWER', {
        target_id: 'question_1_option_b',
        target_type: 'radio',
        question_id: 'question_1',
      }),
      /option_id/,
    ],
  ])('rejects %s when event-specific data is missing', (_eventType, operation, message) => {
    expect(() => validateTraceMark(markWithOperations([validMark.operationList[0], operation]))).toThrow(message);
  });

  it('accepts CHART_HOVER with a registered chart field and threshold-qualified hover duration', () => {
    const chartHover = createOperation('CHART_HOVER', {
      page_id: 'page_12_solution_selection',
      page_type: 'E1_CHART_PLAN_DECISION',
      target_id: 'chart_evidence_1',
      target_type: 'chart',
      chart_id: 'chart_evidence_1',
      point_id: 'day_6_point',
      metadata: { hover_ms: CHART_HOVER_MIN_MS, data_snapshot: { day: '6' } },
    });

    expect(() => validateTraceMark(markWithOperations([validMark.operationList[0], chartHover]))).not.toThrow();
  });

  it('accepts PAGE_IDLE when duration meets threshold and the page is visible and focused', () => {
    expect(() =>
      validateTraceMark(markWithOperations([page02StartPage, createPageIdleOperation()]))
    ).not.toThrow();
  });

  it.each([
    [{ idle_duration_ms: PAGE_IDLE_THRESHOLD_MS - 1 }, /idle_duration_ms/i],
    [{ idle_phase: 'finish_page_idle' }, /idle_phase/i],
    [{ page_visible: false }, /page_visible/i],
    [{ window_focused: false }, /window_focused/i],
    [{ threshold_ms: 4000 }, /threshold_ms/i],
  ])('rejects invalid PAGE_IDLE metadata %#', (metadataPatch, message) => {
    expect(() =>
      validateTraceMark(markWithOperations([page02StartPage, createPageIdleOperation(metadataPatch)]))
    ).toThrow(message);
  });

  it('rejects PAGE_IDLE when target_id is not page', () => {
    const pageIdle = createPageIdleOperation();

    expect(() =>
      validateTraceMark(
        markWithOperations([
          page02StartPage,
          {
            ...pageIdle,
            value: {
              ...pageIdle.value,
              target_id: 'content_area',
            },
          },
        ])
      )
    ).toThrow(/target_id.*page/i);
  });

  it('accepts valid CHAT_SCROLL metadata and chat window targeting', () => {
    expect(() =>
      validateTraceMark(markWithOperations([page02StartPage, createChatScrollOperation()]))
    ).not.toThrow();
  });

  it('rejects CHAT_SCROLL when target_type is not content', () => {
    expect(() =>
      validateTraceMark(
        markWithOperations([
          page02StartPage,
          createChatScrollOperation({
            target_type: 'page',
          }),
        ])
      )
    ).toThrow(/target_type.*content/i);
  });

  it('rejects CHAT_SCROLL when target_id is not chat_window', () => {
    expect(() =>
      validateTraceMark(
        markWithOperations([
          page02StartPage,
          createChatScrollOperation({
            target_id: 'other_chat_window',
          }),
        ])
      )
    ).toThrow(/target_id.*chat_window/i);
  });

  it.each([Number.NaN, Infinity])('rejects CHAT_SCROLL with non-finite scroll_delta %s', (scrollDelta) => {
    expect(() =>
      validateTraceMark(
        markWithOperations([
          page02StartPage,
          createChatScrollOperation({
            metadata: {
              scroll_delta: scrollDelta,
            },
          }),
        ])
      )
    ).toThrow(/scroll_delta/i);
  });

  it('rejects CHAT_SCROLL with an invalid scroll_direction', () => {
    expect(() =>
      validateTraceMark(
        markWithOperations([
          page02StartPage,
          createChatScrollOperation({
            metadata: {
              scroll_direction: 'sideways',
            },
          }),
        ])
      )
    ).toThrow(/scroll_direction/i);
  });

  it('rejects CHAT_SCROLL with an unregistered visible_content_ids_before id', () => {
    expect(() =>
      validateTraceMark(
        markWithOperations([
          page02StartPage,
          createChatScrollOperation({
            metadata: {
              visible_content_ids_before: ['missing_before_content'],
            },
          }),
        ])
      )
    ).toThrow(/visible_content_ids_before.*missing_before_content/i);
  });

  it('rejects CHAT_SCROLL with an unregistered visible_content_ids_after id', () => {
    expect(() =>
      validateTraceMark(
        markWithOperations([
          page02StartPage,
          createChatScrollOperation({
            metadata: {
              visible_content_ids_after: ['missing_after_content'],
            },
          }),
        ])
      )
    ).toThrow(/visible_content_ids_after.*missing_after_content/i);
  });

  it('rejects CHAT_SCROLL with a blank phase', () => {
    expect(() =>
      validateTraceMark(
        markWithOperations([
          page02StartPage,
          createChatScrollOperation({
            metadata: {
              phase: '   ',
            },
          }),
        ])
      )
    ).toThrow(/phase/i);
  });

  it('rejects CHART_HOVER when the chart id is not registered for the page', () => {
    const chartHover = createOperation('CHART_HOVER', {
      page_id: 'page_12_solution_selection',
      page_type: 'E1_CHART_PLAN_DECISION',
      target_id: 'banana_browning_chart',
      target_type: 'chart',
      chart_id: 'banana_browning_chart',
      point_id: 'day_6_point',
      metadata: { hover_ms: CHART_HOVER_MIN_MS, data_snapshot: { day: '6' } },
    });

    expect(() => validateTraceMark(markWithOperations([validMark.operationList[0], chartHover]))).toThrow(
      /chart_id.*Field Registry/i
    );
  });

  it('rejects CHART_HOVER below the configured hover threshold', () => {
    const chartHover = createOperation('CHART_HOVER', {
      page_id: 'page_12_solution_selection',
      page_type: 'E1_CHART_PLAN_DECISION',
      target_id: 'chart_evidence_1',
      target_type: 'chart',
      chart_id: 'chart_evidence_1',
      point_id: 'day_6_point',
      metadata: { hover_ms: CHART_HOVER_MIN_MS - 1, data_snapshot: { day: '6' } },
    });

    expect(() => validateTraceMark(markWithOperations([validMark.operationList[0], chartHover]))).toThrow(
      /hover_ms/i
    );
  });

  it('rejects CHART_HOVER without a data snapshot', () => {
    const chartHover = createOperation('CHART_HOVER', {
      page_id: 'page_12_solution_selection',
      page_type: 'E1_CHART_PLAN_DECISION',
      target_id: 'chart_evidence_1',
      target_type: 'chart',
      chart_id: 'chart_evidence_1',
      point_id: 'day_6_point',
      metadata: { hover_ms: CHART_HOVER_MIN_MS },
    });

    expect(() => validateTraceMark(markWithOperations([validMark.operationList[0], chartHover]))).toThrow(
      /data_snapshot/i
    );
  });

  it('accepts Page12 table events only when bound to the plan_table field id', () => {
    const tableEvent = createOperation('SET_PLAN_PARAM', {
      page_id: 'page_12_solution_selection',
      page_type: 'E1_CHART_PLAN_DECISION',
      target_id: 'row_1_plan_param_1',
      target_type: 'table',
      field_id: 'plan_table',
      row_id: 'row_1',
      param_id: 'plan_param_1',
      value_before: '',
      value_after: '海南香蕉',
      metadata: {},
    });

    expect(() => validateTraceMark(markWithOperations([validMark.operationList[0], tableEvent]))).not.toThrow();

    const invalidTableEvent = {
      ...tableEvent,
      value: {
        ...tableEvent.value,
        field_id: 'missing_table',
      },
    };

    expect(() =>
      validateTraceMark(markWithOperations([validMark.operationList[0], invalidTableEvent]))
    ).toThrow(/field_id.*Field Registry/i);
  });

  it('accepts operations emitted by createPageTraceLogger', () => {
    const operationList: any[] = [];
    const logger = createPageTraceLogger({
      page: {
        legacyPageId: 'simulation_question_1',
        standardPageId: 'page_09_experiment_question_1',
        pageIndex: 9,
        pageType: 'D2_SIMULATION_QUESTION',
        lifecycleMode: 'l2-trace',
        requiredFields: ['question_1_answer'],
      },
      pageNumber: '1.10',
      logOperation: (operation) => {
        operationList.push({ ...operation, code: operationList.length + 1 });
      },
      now: () => new Date('2026-06-03T02:10:00.000Z'),
      idFactory: {
        traceId: () => `trace-${operationList.length + 1}`,
        submitAttemptId: () => 'submit-1',
      },
    });

    logger.startPage();
    logger.textFocus('question_1_answer', '');
    logger.textChange('question_1_answer', '', '香蕉为什么变黑', { flush_reason: 'submit' });
    logger.submitAttempt({ validationStatus: 'success', submitTrigger: 'next_button' });

    expect(() =>
      validateTraceMark({
        ...validMark,
        operationList,
      })
    ).not.toThrow();
  });
});
