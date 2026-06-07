import { cloneJsonLike } from './snapshot';

interface DynamicTableLogger {
  addRow(_rowId: string, _metadata?: Record<string, unknown>): unknown;
  deleteRow(_rowId: string, _metadata?: Record<string, unknown>): unknown;
  setPlanParam(
    _rowId: string,
    _paramId: string,
    _valueBefore: unknown,
    _valueAfter: unknown,
    _metadata?: Record<string, unknown>
  ): unknown;
  selectBest(_rowId: string, _previousBestRowId: string | null): unknown;
}

export interface DynamicTableCollectorOptions {
  standardPageId: string;
  logger: DynamicTableLogger;
  rowIdFactory: (_standardPageId: string, _rowSeq: number) => string;
}

export function createDynamicTableEventCollector(options: DynamicTableCollectorOptions) {
  let rowSeq = 0;
  const rows = new Map<string, Record<string, unknown>>();

  return {
    addRow(initialSnapshot: Record<string, unknown>) {
      rowSeq += 1;
      const rowId = options.rowIdFactory(options.standardPageId, rowSeq);
      const rowSnapshot = cloneJsonLike(initialSnapshot);
      rows.set(rowId, cloneJsonLike(rowSnapshot));
      options.logger.addRow(rowId, {
        row_snapshot_after_add: cloneJsonLike(rowSnapshot),
      });
      return rowId;
    },
    deleteRow(rowId: string, wasBestPlan: boolean) {
      const beforeDelete = cloneJsonLike(rows.get(rowId) || {});
      rows.delete(rowId);
      options.logger.deleteRow(rowId, {
        row_snapshot_before_delete: beforeDelete,
        was_best_plan: wasBestPlan,
      });
    },
    setPlanParam(rowId: string, paramId: 'plan_param_1' | 'plan_param_2', valueBefore: unknown, valueAfter: unknown) {
      const current = rows.get(rowId) || {};
      const previousValue = Object.prototype.hasOwnProperty.call(current, paramId)
        ? current[paramId]
        : valueBefore;
      const clonedValueAfter = cloneJsonLike(valueAfter);
      const nextRow = { ...current, [paramId]: clonedValueAfter };
      rows.set(rowId, cloneJsonLike(nextRow));
      options.logger.setPlanParam(rowId, paramId, cloneJsonLike(previousValue), clonedValueAfter, {
        row_snapshot_after_change: cloneJsonLike(nextRow),
      });
    },
    selectBest(rowId: string, previousBestRowId: string | null) {
      options.logger.selectBest(rowId, previousBestRowId);
    },
    dispose() {
      rows.clear();
    },
  };
}
