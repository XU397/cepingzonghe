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
}

export function createExperimentEventCollector(options: ExperimentEventCollectorOptions) {
  let runSeq = 0;
  let resetCount = 0;
  let lastRunAt = 0;
  let lastParamKey = '';
  let paramSnapshot: Record<string, unknown> = {};

  const snapshotKey = (snapshot: Record<string, unknown>) => JSON.stringify(snapshot);

  return {
    setParam(paramId: string, paramName: string, valueAfter: unknown) {
      const valueBefore = paramSnapshot[paramName] ?? null;
      paramSnapshot = { ...paramSnapshot, [paramName]: valueAfter };
      options.logger.setExpParam(paramId, paramName, valueBefore, valueAfter, {
        param_snapshot: paramSnapshot,
      });
    },
    execute(params: Record<string, unknown>, resultSnapshot: Record<string, unknown>) {
      const now = options.nowMs();
      const key = snapshotKey(params);
      if (key === lastParamKey && now - lastRunAt < options.expRunDebounceMs) {
        return false;
      }
      runSeq += 1;
      lastRunAt = now;
      lastParamKey = key;
      paramSnapshot = { ...params };
      const expRunId = options.expRunIdFactory(options.standardPageId, runSeq);
      options.logger.executeExp(expRunId, {
        param_snapshot: params,
        result_snapshot: resultSnapshot,
        click_debounce_applied: false,
        run_seq: runSeq,
      });
      return true;
    },
    reset() {
      resetCount += 1;
      const beforeReset = { ...paramSnapshot };
      paramSnapshot = {};
      options.logger.resetExp({
        param_snapshot_before_reset: beforeReset,
        reset_count: resetCount,
      });
    },
  };
}
