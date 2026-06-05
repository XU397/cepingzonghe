import { cloneJsonLike, stableStringifyJsonLike } from './snapshot';

interface ExperimentLogger {
  setExpParam(
    _paramId: string,
    _paramName: string,
    _valueBefore: unknown,
    _valueAfter: unknown,
    _metadata?: Record<string, unknown>
  ): unknown;
  executeExp(_expRunId: string, _metadata?: Record<string, unknown>): unknown;
  resetExp(_metadata?: Record<string, unknown>): unknown;
}

export interface ExperimentEventCollectorOptions {
  standardPageId: string;
  logger: ExperimentLogger;
  nowMs: () => number;
  expRunDebounceMs: number;
  expRunIdFactory: (_standardPageId: string, _runSeq: number) => string;
  initialParamSnapshot?: Record<string, unknown>;
}

export function createExperimentEventCollector(options: ExperimentEventCollectorOptions) {
  let runSeq = 0;
  let resetCount = 0;
  let lastRunAt = 0;
  let lastParamKey = '';
  const initialParamSnapshot: Record<string, unknown> = cloneJsonLike(
    options.initialParamSnapshot || {}
  );
  let paramSnapshot: Record<string, unknown> = cloneJsonLike(initialParamSnapshot);

  return {
    setParam(paramId: string, paramName: string, valueAfter: unknown) {
      const valueBefore = cloneJsonLike(paramSnapshot[paramName] ?? null);
      const clonedValueAfter = cloneJsonLike(valueAfter);
      paramSnapshot = { ...paramSnapshot, [paramName]: clonedValueAfter };
      const snapshot = cloneJsonLike(paramSnapshot);
      options.logger.setExpParam(paramId, paramName, valueBefore, clonedValueAfter, {
        param_snapshot: snapshot,
      });
    },
    execute(params: Record<string, unknown>, resultSnapshot: Record<string, unknown>) {
      const now = options.nowMs();
      const paramsSnapshot = cloneJsonLike(params);
      const resultSnapshotClone = cloneJsonLike(resultSnapshot);
      const key = stableStringifyJsonLike(paramsSnapshot);
      if (key === lastParamKey && now - lastRunAt < options.expRunDebounceMs) {
        return false;
      }
      runSeq += 1;
      lastRunAt = now;
      lastParamKey = key;
      paramSnapshot = cloneJsonLike(paramsSnapshot);
      const expRunId = options.expRunIdFactory(options.standardPageId, runSeq);
      options.logger.executeExp(expRunId, {
        param_snapshot: paramsSnapshot,
        result_snapshot: resultSnapshotClone,
        click_debounce_applied: false,
        run_seq: runSeq,
      });
      return true;
    },
    reset() {
      resetCount += 1;
      const beforeReset = cloneJsonLike(paramSnapshot);
      paramSnapshot = cloneJsonLike(initialParamSnapshot);
      lastRunAt = 0;
      lastParamKey = '';
      options.logger.resetExp({
        param_snapshot_before_reset: beforeReset,
        reset_count: resetCount,
      });
    },
  };
}
