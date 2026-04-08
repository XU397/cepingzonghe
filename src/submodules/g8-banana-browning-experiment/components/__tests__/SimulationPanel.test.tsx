import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import EventTypes from '@shared/services/submission/eventTypes.js';
import type { OperationLog } from '../../types';
import SimulationPanel from '../SimulationPanel';

type LoggedOperation = Omit<OperationLog, 'code'>;
type FrameCallback = (timestamp: number) => void;

const getLoggedOperation = (calls: Array<[LoggedOperation]>, index: number): LoggedOperation | undefined =>
  calls[index]?.[0];

const EXPECTED_DAY_3_RESULTS = [
  { origin: '海南', temperature: '2℃', browning: 0.05 },
  { origin: '海南', temperature: '10℃', browning: 0.03 },
  { origin: '海南', temperature: '18℃', browning: 0.04 },
  { origin: '菲律宾', temperature: '2℃', browning: 0.03 },
  { origin: '菲律宾', temperature: '10℃', browning: 0.02 },
  { origin: '菲律宾', temperature: '18℃', browning: 0.03 },
];

const setupRafController = () => {
  const callbacks = new Map<number, FrameCallback>();
  let nextId = 1;

  vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
    const id = nextId++;
    callbacks.set(id, callback as FrameCallback);
    return id;
  });

  vi.spyOn(globalThis, 'cancelAnimationFrame').mockImplementation((id: number) => {
    callbacks.delete(id);
  });

  vi.spyOn(performance, 'now').mockReturnValue(0);

  return {
    runNextFrame(timestamp: number) {
      const entry = callbacks.entries().next().value as [number, FrameCallback] | undefined;
      expect(entry).toBeDefined();
      const [id, callback] = entry!;
      callbacks.delete(id);
      act(() => {
        callback(timestamp);
      });
    },
  };
};

describe('SimulationPanel', () => {
  const logOperation = vi.fn();

  beforeEach(() => {
    logOperation.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('semantic operation sequence emits simulation events and result payload', () => {
    const raf = setupRafController();

    render(<SimulationPanel logOperation={logOperation} targetPrefix="P1.10_" />);

    fireEvent.click(screen.getByRole('button', { name: '增加天数' }));
    fireEvent.click(screen.getByRole('button', { name: '增加天数' }));
    fireEvent.click(screen.getByRole('button', { name: '减少天数' }));
    fireEvent.click(screen.getByRole('button', { name: '开始实验' }));

    expect(logOperation).toHaveBeenCalledTimes(4);
    expect(logOperation.mock.calls.map(([operation]) => operation.eventType)).toEqual([
      EventTypes.SIMULATION_OPERATION,
      EventTypes.SIMULATION_OPERATION,
      EventTypes.SIMULATION_OPERATION,
      EventTypes.SIMULATION_TIMING_STARTED,
    ]);
    expect(logOperation.mock.calls.map(([operation]) => operation.value)).toEqual([
      { action: 'increment_day', fromDay: 0, toDay: 3 },
      { action: 'increment_day', fromDay: 3, toDay: 6 },
      { action: 'decrement_day', fromDay: 6, toDay: 3 },
      { selectedDay: 3, totalConditions: 6 },
    ]);

    raf.runNextFrame(600);
    expect(logOperation).toHaveBeenCalledTimes(4);

    raf.runNextFrame(1200);

    expect(logOperation).toHaveBeenCalledTimes(5);
    expect(logOperation.mock.calls.some(([operation]) => operation.eventType === EventTypes.CLICK)).toBe(false);

    const runResult = getLoggedOperation(logOperation.mock.calls as Array<[LoggedOperation]>, 4);
    expect(runResult).toEqual(
      expect.objectContaining({
        eventType: EventTypes.SIMULATION_RUN_RESULT,
        value: {
          selectedDay: 3,
          results: EXPECTED_DAY_3_RESULTS,
        },
      })
    );
    expect(((runResult?.value ?? {}) as { results?: unknown[] }).results).toHaveLength(6);
  });

  it('reset restores day zero state and logs semantic reset payload', () => {
    const raf = setupRafController();

    render(<SimulationPanel logOperation={logOperation} targetPrefix="P1.11_" />);

    fireEvent.click(screen.getByRole('button', { name: '增加天数' }));
    fireEvent.click(screen.getByRole('button', { name: '增加天数' }));
    fireEvent.click(screen.getByRole('button', { name: '开始实验' }));
    raf.runNextFrame(1200);
    fireEvent.click(screen.getByRole('button', { name: '重置' }));

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getAllByText('0%')).toHaveLength(6);
    expect(logOperation.mock.calls.some(([operation]) => operation.eventType === EventTypes.CLICK)).toBe(false);

    const resetOperation = getLoggedOperation(
      logOperation.mock.calls as Array<[LoggedOperation]>,
      logOperation.mock.calls.length - 1
    );
    expect(resetOperation).toEqual(
      expect.objectContaining({
        eventType: EventTypes.SIMULATION_OPERATION,
        value: {
          action: 'reset',
          fromDay: 6,
          toDay: 0,
        },
      })
    );
  });
});
