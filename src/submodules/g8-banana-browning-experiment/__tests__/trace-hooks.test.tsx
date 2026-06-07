import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { validateTraceMark } from '@shared/services/submission/trace';
import { G8BananaBrowningProvider, useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import { optionIdFromOptionLabel } from '../trace/fieldBindings';
import { useTracePageStart } from '../trace/useTracePageStart';
import type { OperationLog } from '../types';

const FLOW_CONTEXT = {
  flowId: 'flow-banana',
  submoduleId: 'g8-banana-browning-experiment',
  stepIndex: 0,
  moduleName: '8年级香蕉变黑科学探究',
  pageId: 'simulation_question_1',
};

const TRACE_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}(Z|[+-]\d{2}:\d{2})$/;

interface TraceHarnessProps {
  flowContext?: typeof FLOW_CONTEXT;
  metadata?: Record<string, unknown>;
}

function TraceHarness({ flowContext = FLOW_CONTEXT, metadata }: TraceHarnessProps) {
  const { operations } = useG8BananaBrowningContext();

  useTracePageStart({
    pageId: 'simulation_question_1',
    pageNumber: '1.10',
    flowContext,
    metadata,
  });

  return <pre data-testid="operations">{JSON.stringify(operations)}</pre>;
}

const renderTraceHarness = (props: TraceHarnessProps = {}) =>
  render(
    <G8BananaBrowningProvider initialPageId="simulation_question_1">
      <TraceHarness {...props} />
    </G8BananaBrowningProvider>
  );

const readOperations = (): OperationLog[] =>
  JSON.parse(screen.getByTestId('operations').textContent || '[]') as OperationLog[];

const readStartPageOperations = () =>
  readOperations().filter(operation => operation.eventType === 'START_PAGE');

const buildTraceMark = (operationList: OperationLog[]) => ({
  pageNumber: '1.10',
  pageDesc: '模拟实验 + 问题1',
  beginTime: '2026-06-03T10:10:00.000+08:00',
  endTime: '2026-06-03T10:10:01.000+08:00',
  imgList: [],
  answerList: [],
  operationList,
});

describe('g8 banana trace hooks', () => {
  it('preserves L2 timestamp format and value objects through the banana context logger', async () => {
    renderTraceHarness({ metadata: { entry_reason: 'test' } });

    await waitFor(() => {
      expect(readStartPageOperations()).toHaveLength(1);
    });

    const [startPage] = readStartPageOperations();

    expect(startPage.time).toMatch(TRACE_TIMESTAMP_PATTERN);
    expect(typeof startPage.value).toBe('object');
    expect(startPage.value).toMatchObject({
      trace_id: expect.any(String),
      page_id: 'page_09_experiment_question_1',
      page_type: 'D2_SIMULATION_QUESTION',
      target_id: 'page',
      target_type: 'page',
    });
    expect(() => validateTraceMark(buildTraceMark([startPage]))).not.toThrow();
  });

  it('emits START_PAGE only once when equivalent metadata and flow context get new identities', async () => {
    const { rerender } = renderTraceHarness({
      flowContext: { ...FLOW_CONTEXT },
      metadata: { source: 'inline' },
    });

    await waitFor(() => {
      expect(readStartPageOperations()).toHaveLength(1);
    });

    rerender(
      <G8BananaBrowningProvider initialPageId="simulation_question_1">
        <TraceHarness flowContext={{ ...FLOW_CONTEXT }} metadata={{ source: 'inline' }} />
      </G8BananaBrowningProvider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    rerender(
      <G8BananaBrowningProvider initialPageId="simulation_question_1">
        <TraceHarness flowContext={{ ...FLOW_CONTEXT }} metadata={{ source: 'inline' }} />
      </G8BananaBrowningProvider>
    );

    await act(async () => {
      await Promise.resolve();
    });

    expect(readStartPageOperations()).toHaveLength(1);
  });

  it('maps option labels A-E and falls back to the normalized label', () => {
    expect(['A. 3天', 'B. 6天', 'C. 9天', 'D. 12天', 'E. 15天'].map(optionIdFromOptionLabel)).toEqual([
      'option_a',
      'option_b',
      'option_c',
      'option_d',
      'option_e',
    ]);
    expect(optionIdFromOptionLabel('  custom_option  ')).toBe('custom_option');
  });
});
