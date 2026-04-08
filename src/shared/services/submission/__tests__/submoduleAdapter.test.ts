import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import EventTypes from '../eventTypes.js';
import {
  appendExperimentHistory,
  buildPageDesc,
  collectAnswers,
  useOperationLogger,
  usePageMeta,
  validateMappingConfig,
  validateMarkBeforeSubmit,
} from '../submoduleAdapter';
import type {
  FlowContext,
  MarkObject,
  SubmoduleMappingConfig,
} from '../submoduleAdapter';

const createFlowContext = (): FlowContext => ({
  flowId: 'flow-001',
  submoduleId: 'demo-submodule',
  stepIndex: 1,
  totalSteps: 3,
});

const createValidMark = (): MarkObject => ({
  pageNumber: '1.01',
  pageDesc: 'Demo page',
  beginTime: '2024-01-01 10:00:00',
  endTime: '2024-01-01 10:05:00',
  operationList: [
    {
      code: 1,
      targetElement: 'page',
      eventType: EventTypes.PAGE_ENTER,
      value: 'enter',
      time: '2024-01-01 10:00:00',
    },
    {
      code: 2,
      targetElement: 'flow_context',
      eventType: EventTypes.FLOW_CONTEXT,
      value: '{"flow":"demo"}',
      time: '2024-01-01 10:00:01',
    },
    {
      code: 3,
      targetElement: 'P1.01_button',
      eventType: EventTypes.CLICK,
      value: 'clicked',
      time: '2024-01-01 10:02:00',
    },
    {
      code: 4,
      targetElement: 'page',
      eventType: EventTypes.PAGE_EXIT,
      value: 'leave',
      time: '2024-01-01 10:05:00',
    },
  ],
  answerList: [],
});

const createMappingConfig = (): SubmoduleMappingConfig => ({
  PAGE_CONFIGS: [{ pageId: 'p1', title: 'Page 1', subPageNum: 1 }],
  PAGE_DESC_MAP: { p1: 'Page 1' },
  PAGE_QUESTIONS: { p1: ['a1', 'a2'] },
  QUESTION_CODE_MAP: { q1: 10, q2: 11 },
  QUESTION_TEXT_MAP: { q1: 'Question 1', q2: 'Question 2' },
  ANSWER_KEY_TO_QUESTION: { a1: 'q1', a2: 'q2' },
  getSubPageNumByPageId: () => 1,
});

describe('usePageMeta', () => {
  it('builds composite page number and target prefix', () => {
    const { result } = renderHook(() => usePageMeta(2, 5));

    expect(result.current.pageNumber).toBe('2.05');
    expect(result.current.targetPrefix).toBe('P2.05_');
    expect(result.current.prefixTarget('button')).toBe('P2.05_button');
  });
});

describe('useOperationLogger', () => {
  it('prefixes business targets, increments code, and resets on clear', () => {
    const { result } = renderHook(() =>
      useOperationLogger({
        pageNumber: '1.02',
        targetPrefix: 'P1.02_',
        flowContext: null,
      }),
    );

    act(() =>
      result.current.logOperation({
        targetElement: 'button',
        eventType: EventTypes.CLICK,
        value: 'tap',
      }),
    );
    act(() =>
      result.current.logOperation({
        targetElement: 'P1.02_input',
        eventType: EventTypes.INPUT,
        value: 'text',
      }),
    );

    expect(result.current.operations.map((op) => [op.code, op.targetElement])).toEqual([
      [1, 'P1.02_button'],
      [2, 'P1.02_input'],
    ]);

    act(() => result.current.clearOperations());
    expect(result.current.operations.length).toBe(0);
    expect(result.current.currentCode).toBe(0);
  });

  it('injects flow_context after first page_enter when flowContext exists', () => {
    const flowContext = createFlowContext();
    const { result } = renderHook(() =>
      useOperationLogger({
        pageNumber: '1.01',
        targetPrefix: 'P1.01_',
        flowContext,
      }),
    );

    act(() =>
      result.current.logOperation({
        targetElement: 'page',
        eventType: EventTypes.PAGE_ENTER,
        value: 'enter',
      }),
    );

    expect(result.current.operations[0].eventType).toBe(EventTypes.PAGE_ENTER);
    const flowContextOperation = result.current.operations[1];
    expect(flowContextOperation.eventType).toBe(EventTypes.FLOW_CONTEXT);
    expect(flowContextOperation.code).toBe(2);
    expect(flowContextOperation.targetElement).toBe('flow_context');
  });
});

describe('collectAnswers', () => {
  it('maps answers to standardized entries', () => {
    const config = createMappingConfig();
    const answers = {
      a1: { choice: 'A' },
      a2: true,
    };

    const collected = collectAnswers('p1', answers, config);
    expect(collected).toEqual([
      { code: 10, targetElement: 'Question 1', value: '{"choice":"A"}' },
      { code: 11, targetElement: 'Question 2', value: 'true' },
    ]);
  });
});

describe('buildPageDesc', () => {
  it('adds flow prefix when flowContext is provided', () => {
    const desc = buildPageDesc('Task', createFlowContext());
    expect(desc).toBe('[flow-001/demo-submodule/1] Task');
  });

  it('returns original title in standalone mode', () => {
    expect(buildPageDesc('Task', null)).toBe('Task');
  });
});

describe('appendExperimentHistory', () => {
  it('appends single history entry with fixed code', () => {
    const baseAnswers = [{ code: 1, targetElement: 'P1.01_q1', value: 'A' }];
    const result = appendExperimentHistory(
      baseAnswers,
      { records: [1, 2, 3] },
      {
        targetElement: 'P1.01_history',
        historyCodeBase: 100,
      },
    );

    expect(result).toHaveLength(2);
    expect(result[1]).toEqual({
      code: 100,
      targetElement: 'P1.01_history',
      value: '{"records":[1,2,3]}',
    });
  });
});

describe('validateMarkBeforeSubmit', () => {
  it('passes validation for well-formed mark in flow mode', () => {
    const mark = createValidMark();
    const result = validateMarkBeforeSubmit(mark, createFlowContext());

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects prefix and code issues', () => {
    const mark: MarkObject = {
      pageNumber: '1.02',
      pageDesc: 'Bad mark',
      beginTime: '2024-01-01 11:00:00',
      endTime: '2024-01-01 11:05:00',
      operationList: [
        {
          code: 2,
          targetElement: 'button',
          eventType: EventTypes.PAGE_ENTER,
          value: 'enter',
          time: '2024-01-01 11:00:00',
        },
        {
          code: 4,
          targetElement: 'button_exit',
          eventType: EventTypes.PAGE_EXIT,
          value: 'exit',
          time: '2024-01-01 11:05:00',
        },
      ],
      answerList: [],
    };

    const result = validateMarkBeforeSubmit(mark);
    const errorCodes = result.errors.map((e) => e.code);
    expect(errorCodes).toContain('MISSING_PREFIX');
    expect(errorCodes).toContain('CODE_NOT_FROM_ONE');
    expect(errorCodes).toContain('CODE_DISCONTINUITY');
  });

  it('requires flow_context when flowContext is provided', () => {
    const mark = createValidMark();
    mark.operationList = mark.operationList.filter(
      (op) => op.eventType !== EventTypes.FLOW_CONTEXT,
    );

    const result = validateMarkBeforeSubmit(mark, createFlowContext());
    expect(result.errors.some((e) => e.code === 'MISSING_FLOW_CONTEXT')).toBe(true);
  });

  it('validates pageNumber format and time range', () => {
    const mark = createValidMark();
    mark.pageNumber = '01-01';
    mark.beginTime = '2024-01-01 11:10:00';
    mark.endTime = '2024-01-01 11:00:00';

    const result = validateMarkBeforeSubmit(mark);
    const codes = result.errors.map((e) => e.code);
    expect(codes).toContain('INVALID_PAGE_NUMBER');
    expect(codes).toContain('INVALID_TIME_RANGE');
  });
});

describe('validateMappingConfig', () => {
  it('passes when required fields are present and consistent', () => {
    const config = createMappingConfig();
    const result = validateMappingConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('detects duplicate codes and coverage gaps', () => {
    const config: SubmoduleMappingConfig = {
      ...createMappingConfig(),
      PAGE_QUESTIONS: { p1: ['a1', 'a2', 'a3'] },
      QUESTION_CODE_MAP: { q1: 10, q2: 10 },
      ANSWER_KEY_TO_QUESTION: { a1: 'q1', a2: 'q2', a3: 'q3' },
    };

    const result = validateMappingConfig(config);
    const messages = result.errors.map((e) => e.message);
    expect(messages.some((msg) => msg.includes('duplicate code'))).toBe(true);
    expect(messages.some((msg) => msg.includes('Missing code mapping for questionId "q3"'))).toBe(true);
  });
});
