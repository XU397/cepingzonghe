import { describe, expect, it, vi } from 'vitest';
import { createTextEventCollector } from '../collectors/text';
import { createExperimentEventCollector } from '../collectors/experiment';
import { createDynamicTableEventCollector } from '../collectors/dynamicTable';

describe('trace collectors', () => {
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
});
