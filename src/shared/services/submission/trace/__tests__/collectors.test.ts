import { afterEach, describe, expect, it, vi } from 'vitest';
import { createTextEventCollector } from '../collectors/text';
import { createExperimentEventCollector } from '../collectors/experiment';
import { createDynamicTableEventCollector } from '../collectors/dynamicTable';

describe('trace collectors', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('flushes TEXT_CHANGE and TEXT_BLUR on submit', () => {
    const logger = {
      textFocus: vi.fn(),
      textChange: vi.fn(),
      textBlur: vi.fn(),
    };
    const collector = createTextEventCollector({
      fieldId: 'input_question_1',
      logger,
      debounceMs: 2000,
      throttleCharDelta: 10,
    });

    collector.onFocus('');
    collector.onChange('香蕉为什么变黑');
    collector.flush('submit');

    expect(logger.textFocus).toHaveBeenCalledWith('input_question_1', '');
    expect(logger.textChange).toHaveBeenCalledWith('input_question_1', '', '香蕉为什么变黑', {
      flush_reason: 'submit',
    });
    expect(logger.textBlur).toHaveBeenCalledWith('input_question_1', '', '香蕉为什么变黑', {
      flush_reason: 'submit',
    });
  });

  it('debounces TEXT_CHANGE until the configured delay', () => {
    vi.useFakeTimers();
    const logger = {
      textFocus: vi.fn(),
      textChange: vi.fn(),
      textBlur: vi.fn(),
    };
    const collector = createTextEventCollector({
      fieldId: 'input_question_1',
      logger,
      debounceMs: 2000,
      throttleCharDelta: 10,
    });

    collector.onFocus('abc');
    collector.onChange('abcd');
    vi.advanceTimersByTime(1999);

    expect(logger.textChange).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(logger.textChange).toHaveBeenCalledWith('input_question_1', 'abc', 'abcd', {
      flush_reason: 'debounce',
    });
  });

  it('uses the previous logged text value for repeated char-delta flushes', () => {
    const logger = {
      textFocus: vi.fn(),
      textChange: vi.fn(),
      textBlur: vi.fn(),
    };
    const collector = createTextEventCollector({
      fieldId: 'input_question_1',
      logger,
      debounceMs: 2000,
      throttleCharDelta: 10,
    });

    collector.onFocus('');
    collector.onChange('1234567890');
    collector.onChange('12345678901234567890');

    expect(logger.textChange).toHaveBeenNthCalledWith(1, 'input_question_1', '', '1234567890', {
      flush_reason: 'char_delta',
    });
    expect(logger.textChange).toHaveBeenNthCalledWith(
      2,
      'input_question_1',
      '1234567890',
      '12345678901234567890',
      {
        flush_reason: 'char_delta',
      }
    );
  });

  it('flushes pending text and blur on dispose without duplicate events', () => {
    const logger = {
      textFocus: vi.fn(),
      textChange: vi.fn(),
      textBlur: vi.fn(),
    };
    const collector = createTextEventCollector({
      fieldId: 'input_question_1',
      logger,
      debounceMs: 2000,
      throttleCharDelta: 10,
    });

    collector.onFocus('');
    collector.onChange('dispose');
    collector.dispose();
    collector.dispose();
    collector.flush('dispose');

    expect(logger.textChange).toHaveBeenCalledTimes(1);
    expect(logger.textChange).toHaveBeenCalledWith('input_question_1', '', 'dispose', {
      flush_reason: 'dispose',
    });
    expect(logger.textBlur).toHaveBeenCalledTimes(1);
    expect(logger.textBlur).toHaveBeenCalledWith('input_question_1', '', 'dispose', {
      flush_reason: 'dispose',
    });
  });

  it('suppresses duplicate experiment run inside debounce window', () => {
    let currentTime = 1000;
    const logger = {
      setExpParam: vi.fn(),
      executeExp: vi.fn(),
      resetExp: vi.fn(),
    };
    const collector = createExperimentEventCollector({
      standardPageId: 'page_09_experiment_question_1',
      logger,
      nowMs: () => currentTime,
      expRunDebounceMs: 1500,
      expRunIdFactory: (_pageId, seq) => `run-${seq}`,
    });

    expect(collector.execute({ days: 3 }, { black_ratio: 0.5 })).toBe(true);
    expect(collector.execute({ days: 3 }, { black_ratio: 0.5 })).toBe(false);
    currentTime = 2600;
    expect(collector.execute({ days: 3 }, { black_ratio: 0.5 })).toBe(true);
    expect(logger.executeExp).toHaveBeenCalledTimes(2);
  });

  it('suppresses duplicate experiment runs with stable param serialization', () => {
    let currentTime = 1000;
    const logger = {
      setExpParam: vi.fn(),
      executeExp: vi.fn(),
      resetExp: vi.fn(),
    };
    const collector = createExperimentEventCollector({
      standardPageId: 'page_09_experiment_question_1',
      logger,
      nowMs: () => currentTime,
      expRunDebounceMs: 1500,
      expRunIdFactory: (_pageId, seq) => `run-${seq}`,
    });

    expect(collector.execute({ a: 1, b: 2 }, { black_ratio: 0.5 })).toBe(true);
    currentTime = 1200;
    expect(collector.execute({ b: 2, a: 1 }, { black_ratio: 0.5 })).toBe(false);
    expect(logger.executeExp).toHaveBeenCalledTimes(1);
  });

  it('freezes experiment metadata snapshots against caller mutation', () => {
    const logger = {
      setExpParam: vi.fn(),
      executeExp: vi.fn(),
      resetExp: vi.fn(),
    };
    const collector = createExperimentEventCollector({
      standardPageId: 'page_09_experiment_question_1',
      logger,
      nowMs: () => 1000,
      expRunDebounceMs: 1500,
      expRunIdFactory: (_pageId, seq) => `run-${seq}`,
    });
    const params = { days: 3, nested: { temp: 10 } };
    const result = { black_ratio: 0.5, nested: { score: 1 } };

    collector.execute(params, result);
    params.days = 9;
    params.nested.temp = 20;
    result.black_ratio = 0.9;
    result.nested.score = 2;

    expect(logger.executeExp).toHaveBeenCalledWith('run-1', {
      param_snapshot: { days: 3, nested: { temp: 10 } },
      result_snapshot: { black_ratio: 0.5, nested: { score: 1 } },
      click_debounce_applied: false,
      run_seq: 1,
    });
  });

  it('keeps stable row IDs for dynamic table operations', () => {
    const logger = {
      addRow: vi.fn(),
      deleteRow: vi.fn(),
      setPlanParam: vi.fn(),
      selectBest: vi.fn(),
    };
    const collector = createDynamicTableEventCollector({
      standardPageId: 'page_12_solution_selection',
      logger,
      rowIdFactory: (pageId, seq) => `${pageId}_row_${seq}`,
    });

    const rowId = collector.addRow({ variety: '海南香蕉', temperature: '10℃' });
    collector.setPlanParam(rowId, 'plan_param_1', '', '海南香蕉');
    collector.selectBest(rowId, null);

    expect(rowId).toBe('page_12_solution_selection_row_1');
    expect(logger.addRow).toHaveBeenCalledWith(rowId, {
      row_snapshot_after_add: { variety: '海南香蕉', temperature: '10℃' },
    });
    expect(logger.selectBest).toHaveBeenCalledWith(rowId, null);
  });

  it('freezes dynamic table snapshots against caller mutation', () => {
    const logger = {
      addRow: vi.fn(),
      deleteRow: vi.fn(),
      setPlanParam: vi.fn(),
      selectBest: vi.fn(),
    };
    const collector = createDynamicTableEventCollector({
      standardPageId: 'page_12_solution_selection',
      logger,
      rowIdFactory: (pageId, seq) => `${pageId}_row_${seq}`,
    });
    const initialSnapshot = { variety: '海南香蕉', nested: { temperature: '10℃' } };

    collector.addRow(initialSnapshot);
    initialSnapshot.variety = '突变香蕉';
    initialSnapshot.nested.temperature = '30℃';

    expect(logger.addRow).toHaveBeenCalledWith('page_12_solution_selection_row_1', {
      row_snapshot_after_add: { variety: '海南香蕉', nested: { temperature: '10℃' } },
    });
  });

  it('derives dynamic table valueBefore from the stored row snapshot when available', () => {
    const logger = {
      addRow: vi.fn(),
      deleteRow: vi.fn(),
      setPlanParam: vi.fn(),
      selectBest: vi.fn(),
    };
    const collector = createDynamicTableEventCollector({
      standardPageId: 'page_12_solution_selection',
      logger,
      rowIdFactory: (pageId, seq) => `${pageId}_row_${seq}`,
    });

    const rowId = collector.addRow({ plan_param_1: '旧方案' });
    collector.setPlanParam(rowId, 'plan_param_1', 'caller stale value', '新方案');

    expect(logger.setPlanParam).toHaveBeenCalledWith(rowId, 'plan_param_1', '旧方案', '新方案', {
      row_snapshot_after_change: { plan_param_1: '新方案' },
    });
  });
});
