import '@testing-library/jest-dom';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import SimulationPanel from '../SimulationPanel';

type FrameCallback = (timestamp: number) => void;
type TraceEventName = 'SET_EXP_PARAM' | 'EXECUTE_EXP' | 'RESET_EXP';

const LEGACY_SIMULATION_EVENTS = [
  'simulation_operation',
  'simulation_run_result',
  'radio_select',
];

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

const buildTraceLogger = () => {
  const events: Array<{ eventType: TraceEventName; args: unknown[] }> = [];
  const traceLogger = {
    setExpParam: vi.fn((...args: unknown[]) => {
      events.push({ eventType: 'SET_EXP_PARAM', args });
    }),
    executeExp: vi.fn((...args: unknown[]) => {
      events.push({ eventType: 'EXECUTE_EXP', args });
    }),
    resetExp: vi.fn((...args: unknown[]) => {
      events.push({ eventType: 'RESET_EXP', args });
    }),
  };

  return { traceLogger, events };
};

describe('SimulationPanel', () => {
  let traceLogger: ReturnType<typeof buildTraceLogger>['traceLogger'];
  let events: ReturnType<typeof buildTraceLogger>['events'];

  beforeEach(() => {
    ({ traceLogger, events } = buildTraceLogger());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('semantic operation sequence emits L2 simulation events and result payload', () => {
    const raf = setupRafController();

    render(<SimulationPanel traceLogger={traceLogger} />);

    fireEvent.click(screen.getByRole('button', { name: '增加天数' }));
    fireEvent.click(screen.getByRole('button', { name: '增加天数' }));
    fireEvent.click(screen.getByRole('button', { name: '减少天数' }));
    fireEvent.click(screen.getByRole('button', { name: '开始实验' }));

    expect(events.map(event => event.eventType)).toEqual([
      'SET_EXP_PARAM',
      'SET_EXP_PARAM',
      'SET_EXP_PARAM',
      'EXECUTE_EXP',
    ]);
    expect(traceLogger.setExpParam).toHaveBeenNthCalledWith(1, 'exp_param_days', 'days', 0, 3, {
      param_snapshot: { days: 3 },
    });
    expect(traceLogger.setExpParam).toHaveBeenNthCalledWith(2, 'exp_param_days', 'days', 3, 6, {
      param_snapshot: { days: 6 },
    });
    expect(traceLogger.setExpParam).toHaveBeenNthCalledWith(3, 'exp_param_days', 'days', 6, 3, {
      param_snapshot: { days: 3 },
    });
    expect(traceLogger.executeExp).toHaveBeenCalledWith('banana_browning_exp_run_1', {
      param_snapshot: { days: 3 },
      result_snapshot: {
        day: 3,
        results: EXPECTED_DAY_3_RESULTS,
      },
      click_debounce_applied: false,
      run_seq: 1,
    });

    raf.runNextFrame(600);
    expect(events.map(event => event.eventType)).toEqual([
      'SET_EXP_PARAM',
      'SET_EXP_PARAM',
      'SET_EXP_PARAM',
      'EXECUTE_EXP',
    ]);

    raf.runNextFrame(1200);

    expect(events.map(event => event.eventType)).toEqual([
      'SET_EXP_PARAM',
      'SET_EXP_PARAM',
      'SET_EXP_PARAM',
      'EXECUTE_EXP',
    ]);
    expect(events.some(event => event.eventType === 'click')).toBe(false);
    expect(events.some(event => LEGACY_SIMULATION_EVENTS.includes(event.eventType))).toBe(false);

    expect(
      (
        traceLogger.executeExp.mock.calls[0]?.[1] as
          | { result_snapshot?: { results?: unknown[] } }
          | undefined
      )?.result_snapshot?.results
    ).toHaveLength(6);
  });

  it('reset restores day zero state and logs L2 reset payload', () => {
    const raf = setupRafController();

    render(<SimulationPanel traceLogger={traceLogger} />);

    fireEvent.click(screen.getByRole('button', { name: '增加天数' }));
    fireEvent.click(screen.getByRole('button', { name: '增加天数' }));
    fireEvent.click(screen.getByRole('button', { name: '开始实验' }));
    raf.runNextFrame(1200);
    fireEvent.click(screen.getByRole('button', { name: '重置' }));

    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getAllByText('0%')).toHaveLength(6);
    expect(events.some(event => event.eventType === 'click')).toBe(false);
    expect(events.some(event => LEGACY_SIMULATION_EVENTS.includes(event.eventType))).toBe(false);

    expect(events.map(event => event.eventType)).toEqual([
      'SET_EXP_PARAM',
      'SET_EXP_PARAM',
      'EXECUTE_EXP',
      'RESET_EXP',
    ]);
    expect(traceLogger.resetExp).toHaveBeenCalledWith({
      param_snapshot_before_reset: { days: 6 },
      reset_count: 1,
    });
  });

  it('reset restores collector snapshot and clears debounce for an immediate rerun', () => {
    setupRafController();
    vi.spyOn(Date, 'now').mockReturnValue(1000);

    render(<SimulationPanel traceLogger={traceLogger} />);

    fireEvent.click(screen.getByRole('button', { name: '增加天数' }));
    fireEvent.click(screen.getByRole('button', { name: '开始实验' }));
    fireEvent.click(screen.getByRole('button', { name: '重置' }));
    fireEvent.click(screen.getByRole('button', { name: '增加天数' }));
    fireEvent.click(screen.getByRole('button', { name: '开始实验' }));

    expect(events.map(event => event.eventType)).toEqual([
      'SET_EXP_PARAM',
      'EXECUTE_EXP',
      'RESET_EXP',
      'SET_EXP_PARAM',
      'EXECUTE_EXP',
    ]);
    expect(traceLogger.setExpParam).toHaveBeenNthCalledWith(2, 'exp_param_days', 'days', 0, 3, {
      param_snapshot: { days: 3 },
    });
    expect(traceLogger.executeExp).toHaveBeenCalledTimes(2);
    expect(traceLogger.executeExp.mock.calls[0]?.[0]).toBe('banana_browning_exp_run_1');
    expect(traceLogger.executeExp.mock.calls[1]?.[0]).toBe('banana_browning_exp_run_2');
    expect(traceLogger.executeExp.mock.calls[1]?.[1]).toMatchObject({
      param_snapshot: { days: 3 },
      click_debounce_applied: false,
      run_seq: 2,
    });
  });

  it('debounces rapid duplicate runs and uses unique run IDs for accepted repeats', () => {
    const raf = setupRafController();
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1000);

    render(<SimulationPanel traceLogger={traceLogger} />);

    fireEvent.click(screen.getByRole('button', { name: '增加天数' }));
    fireEvent.click(screen.getByRole('button', { name: '开始实验' }));

    expect(traceLogger.executeExp).toHaveBeenCalledTimes(1);
    expect(traceLogger.executeExp.mock.calls[0]?.[0]).toBe('banana_browning_exp_run_1');

    raf.runNextFrame(1200);

    nowSpy.mockReturnValue(1500);
    fireEvent.click(screen.getByRole('button', { name: '开始实验' }));

    expect(traceLogger.executeExp).toHaveBeenCalledTimes(1);

    nowSpy.mockReturnValue(2600);
    fireEvent.click(screen.getByRole('button', { name: '开始实验' }));

    expect(traceLogger.executeExp).toHaveBeenCalledTimes(2);
    expect(traceLogger.executeExp.mock.calls[1]?.[0]).toBe('banana_browning_exp_run_2');
    expect(traceLogger.executeExp.mock.calls[1]?.[1]).toMatchObject({
      param_snapshot: { days: 3 },
      result_snapshot: {
        day: 3,
        results: EXPECTED_DAY_3_RESULTS,
      },
      click_debounce_applied: false,
      run_seq: 2,
    });
  });

  it('does not require a trace logger to render or interact', () => {
    const raf = setupRafController();

    render(<SimulationPanel traceLogger={null} />);

    fireEvent.click(screen.getByRole('button', { name: '增加天数' }));
    fireEvent.click(screen.getByRole('button', { name: '开始实验' }));

    raf.runNextFrame(1200);

    expect(screen.getByText('3')).toBeInTheDocument();
    EXPECTED_DAY_3_RESULTS.forEach(({ browning }) => {
      expect(screen.getAllByText(`${Math.round(browning * 100)}%`).length).toBeGreaterThan(0);
    });
  });
});
