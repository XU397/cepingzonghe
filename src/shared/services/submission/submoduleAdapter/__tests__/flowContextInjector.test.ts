import { describe, it, expect } from 'vitest';
import EventTypes from '../../eventTypes.js';
import { formatTimestamp } from '../../createMarkObject.js';
import { createOperationSequence } from '../operationSequence';
import {
  FlowContextPayload,
  InjectFlowContextOptions,
  MissingPageEnterError,
  injectFlowContext,
  shouldInjectFlowContext,
} from '../flowContextInjector';
import { Operation } from '../types';

const createFlowContext = (overrides: Partial<FlowContextPayload> = {}): FlowContextPayload => ({
  flowId: 'flow-1',
  stepIndex: 0,
  submoduleId: 'module-1',
  moduleName: 'Module 1',
  pageId: 'page-1',
  ...overrides,
});

const createOperation = (
  sequenceValue: number,
  overrides: Partial<Operation> = {},
  options: InjectFlowContextOptions = {}
): Operation => ({
  code: sequenceValue,
  targetElement: 'page',
  eventType: EventTypes.PAGE_ENTER,
  value: '',
  time: formatTimestamp(options.timestamp ?? new Date()),
  ...overrides,
});

describe('injectFlowContext', () => {
  it('inserts flow_context immediately after the first page_enter', () => {
    const sequence = createOperationSequence();
    const timestamp = new Date('2024-01-01T00:00:00Z');
    const operations: Operation[] = [
      createOperation(sequence.next(), { eventType: EventTypes.PAGE_ENTER }, { timestamp }),
      createOperation(sequence.next(), { eventType: EventTypes.INPUT, targetElement: 'P1.01_input' }),
    ];

    const result = injectFlowContext(operations, createFlowContext(), sequence, { timestamp });

    expect(result).toHaveLength(3);
    expect(result[0]).toEqual(operations[0]);
    expect(result[1]).toMatchObject({
      code: 3,
      targetElement: 'flow_context',
      eventType: EventTypes.FLOW_CONTEXT,
      value: JSON.stringify(createFlowContext()),
      time: formatTimestamp(timestamp),
    });
    expect(result[2]).toEqual(operations[1]);
    expect(operations).toHaveLength(2);
  });

  it('works when moduleName is not provided', () => {
    const sequence = createOperationSequence();
    const operations: Operation[] = [
      createOperation(sequence.next(), { eventType: EventTypes.PAGE_ENTER }),
    ];

    const flowContextWithoutModule: FlowContextPayload = {
      flowId: 'flow-1',
      stepIndex: 0,
      submoduleId: 'module-1',
      pageId: 'page-2',
    };

    const result = injectFlowContext(operations, flowContextWithoutModule, sequence);
    const parsed = JSON.parse(result[1].value);

    expect(parsed).toEqual({
      flowId: 'flow-1',
      stepIndex: 0,
      submoduleId: 'module-1',
      pageId: 'page-2',
    });
    expect(parsed.moduleName).toBeUndefined();
  });

  it('serializes moduleName when provided', () => {
    const sequence = createOperationSequence();
    const operations: Operation[] = [
      createOperation(sequence.next(), { eventType: EventTypes.PAGE_ENTER }),
    ];

    const flowContextWithModule = createFlowContext({ moduleName: 'Custom Module' });

    const result = injectFlowContext(operations, flowContextWithModule, sequence);
    const parsed = JSON.parse(result[1].value);

    expect(parsed).toMatchObject({
      flowId: 'flow-1',
      submoduleId: 'module-1',
      stepIndex: 0,
      moduleName: 'Custom Module',
    });
  });

  it('throws MissingPageEnterError when page_enter is absent', () => {
    const sequence = createOperationSequence();
    const operations: Operation[] = [
      createOperation(sequence.next(), { eventType: EventTypes.CLICK, targetElement: 'button' }),
    ];

    expect(() => injectFlowContext(operations, createFlowContext(), sequence)).toThrow(
      MissingPageEnterError,
    );
  });

  it('allows inserting at the beginning when allowMissingPageEnter is true', () => {
    const sequence = createOperationSequence();
    const timestamp = new Date('2024-05-05T05:05:05Z');
    const operations: Operation[] = [
      createOperation(sequence.next(), { eventType: EventTypes.CLICK, targetElement: 'button' }),
    ];

    const result = injectFlowContext(operations, createFlowContext(), sequence, {
      allowMissingPageEnter: true,
      timestamp,
    });

    expect(result).toHaveLength(2);
    expect(result[0]).toMatchObject({
      code: 2,
      eventType: EventTypes.FLOW_CONTEXT,
      targetElement: 'flow_context',
      value: JSON.stringify(createFlowContext()),
      time: formatTimestamp(timestamp),
    });
    expect(result[1]).toEqual(operations[0]);
  });
});

describe('shouldInjectFlowContext', () => {
  it('returns false when flowContext is null or undefined', () => {
    const operations: Operation[] = [];

    expect(shouldInjectFlowContext(operations, null)).toBe(false);
    expect(shouldInjectFlowContext(operations, undefined)).toBe(false);
  });

  it('returns false when flow_context already exists', () => {
    const operations: Operation[] = [
      createOperation(1, { eventType: EventTypes.FLOW_CONTEXT, targetElement: 'flow_context' }),
    ];

    expect(shouldInjectFlowContext(operations, createFlowContext())).toBe(false);
  });

  it('returns true when flowContext exists and no flow_context event is present', () => {
    const operations: Operation[] = [
      createOperation(1, { eventType: EventTypes.PAGE_ENTER }),
      createOperation(2, { eventType: EventTypes.INPUT, targetElement: 'input' }),
    ];

    expect(shouldInjectFlowContext(operations, createFlowContext())).toBe(true);
  });
});
