import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CHART_HOVER_MIN_MS,
  TEXT_DEBOUNCE_MS,
  TEXT_THROTTLE_CHAR_DELTA,
  createTextEventCollector,
} from '@shared/services/submission/trace';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import type { PageId } from '../mapping';
import styles from '../styles/Page13SolutionSelection.module.css';
import { useContentActivationTrace } from '../trace/useContentActivationTrace';
import { useTracePageStart } from '../trace/useTracePageStart';

const CHART_DATA = [
  {
    day: '0',
    '2℃-海南香蕉': 0,
    '10℃-海南香蕉': 0,
    '18℃-海南香蕉': 0,
    '2℃-菲律宾香蕉': 0,
    '10℃-菲律宾香蕉': 0,
    '18℃-菲律宾香蕉': 0,
  },
  {
    day: '3',
    '2℃-海南香蕉': 0.05,
    '10℃-海南香蕉': 0.03,
    '18℃-海南香蕉': 0.04,
    '2℃-菲律宾香蕉': 0.03,
    '10℃-菲律宾香蕉': 0.02,
    '18℃-菲律宾香蕉': 0.03,
  },
  {
    day: '6',
    '2℃-海南香蕉': 0.35,
    '10℃-海南香蕉': 0.04,
    '18℃-海南香蕉': 0.06,
    '2℃-菲律宾香蕉': 0.65,
    '10℃-菲律宾香蕉': 0.03,
    '18℃-菲律宾香蕉': 0.05,
  },
  {
    day: '9',
    '2℃-海南香蕉': 0.8,
    '10℃-海南香蕉': 0.05,
    '18℃-海南香蕉': 0.08,
    '2℃-菲律宾香蕉': 0.9,
    '10℃-菲律宾香蕉': 0.04,
    '18℃-菲律宾香蕉': 0.07,
  },
  {
    day: '12',
    '2℃-海南香蕉': 1.0,
    '10℃-海南香蕉': 0.23,
    '18℃-海南香蕉': 0.4,
    '2℃-菲律宾香蕉': 1.0,
    '10℃-菲律宾香蕉': 0.1,
    '18℃-菲律宾香蕉': 0.2,
  },
  {
    day: '15',
    '2℃-海南香蕉': 1.0,
    '10℃-海南香蕉': 0.33,
    '18℃-海南香蕉': 0.46,
    '2℃-菲律宾香蕉': 1.0,
    '10℃-菲律宾香蕉': 0.25,
    '18℃-菲律宾香蕉': 0.27,
  },
];

interface SeriesConfig {
  key: string;
  color: string;
  dashArray: string | undefined;
  isDiamond: boolean;
}

// 颜色规则：2℃=蓝, 10℃=绿, 18℃=红；海南=深色, 菲律宾=浅色
const SERIES_CONFIG: SeriesConfig[] = [
  { key: '2℃-海南香蕉', color: '#2563eb', dashArray: undefined, isDiamond: false },
  { key: '10℃-海南香蕉', color: '#16a34a', dashArray: undefined, isDiamond: false },
  { key: '18℃-海南香蕉', color: '#dc2626', dashArray: undefined, isDiamond: false },
  { key: '2℃-菲律宾香蕉', color: '#7cacf0', dashArray: undefined, isDiamond: true },
  { key: '10℃-菲律宾香蕉', color: '#6dba88', dashArray: undefined, isDiamond: true },
  { key: '18℃-菲律宾香蕉', color: '#e28080', dashArray: undefined, isDiamond: true },
];

const VARIETIES = ['海南香蕉', '菲律宾香蕉'] as const;
const TEMPERATURES = ['2℃', '10℃', '18℃'] as const;

// ---------------------------------------------------------------------------
// Custom diamond dot for 菲律宾香蕉 (visually distinct from circle)
// ---------------------------------------------------------------------------
interface DiamondDotProps {
  cx?: number;
  cy?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}

const DiamondDot = (props: DiamondDotProps): React.ReactElement => {
  const { cx = 0, cy = 0, fill, stroke, strokeWidth = 1.5 } = props;
  const size = 4;
  return (
    <path
      d={`M${cx},${cy - size}L${cx + size},${cy}L${cx},${cy + size}L${cx - size},${cy}Z`}
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
    />
  );
};

// ---------------------------------------------------------------------------
// Table row shape
// ---------------------------------------------------------------------------
interface SolutionRow {
  id: string;
  variety: string;
  temperature: string;
}

interface ChartHoverSnapshot {
  pointId: string;
  dataSnapshot: {
    day: string;
    series_id: unknown;
    black_ratio: unknown;
    values: Record<string, unknown>;
  };
}

const createSolutionRow = (id: string): SolutionRow => ({
  id,
  variety: '',
  temperature: '',
});

const INITIAL_SOLUTION_ROW_ID = 'page_12_solution_selection_row_1';
const CHART_EVIDENCE_ID = 'chart_evidence_1';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Page13SolutionSelection: React.FC = () => {
  const { collectAnswer, getPagePrefix, registerTraceCollectorFlush } =
    useG8BananaBrowningContext();

  const nextIdRef = useRef(2);
  const rowsRef = useRef<SolutionRow[]>([createSolutionRow(INITIAL_SOLUTION_ROW_ID)]);
  const bestIdRef = useRef<string | null>(null);
  const reasonValueRef = useRef('');
  const reasonCollectorRef = useRef<ReturnType<typeof createTextEventCollector> | null>(null);
  const chartHoverStartedAtRef = useRef(0);
  const lastChartHoverLoggedAtRef = useRef(0);
  const chartHoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const chartHoverSnapshotRef = useRef<ChartHoverSnapshot | null>(null);
  const loggedChartHoverPointRef = useRef<string | null>(null);

  const traceLogger = useTracePageStart({
    pageId: 'solution_selection' as PageId,
    pageNumber: getPagePrefix().replace(/^P/, '').replace(/_$/, ''),
    flowContext: undefined,
    metadata: {
      initial_state: {
        rows: [INITIAL_SOLUTION_ROW_ID],
        best_row_id: null,
      },
    },
  });
  const getContentActivationHandlers = useContentActivationTrace(traceLogger);

  const [rows, setRowsState] = useState<SolutionRow[]>(() => rowsRef.current);
  const [bestId, setBestIdState] = useState<string | null>(null);
  const [reason, setReason] = useState('');

  const clearChartHoverTimer = useCallback(() => {
    if (chartHoverTimerRef.current) {
      clearTimeout(chartHoverTimerRef.current);
      chartHoverTimerRef.current = null;
    }
  }, []);

  const getReasonCollector = useCallback(() => {
    if (!traceLogger) {
      return null;
    }
    if (!reasonCollectorRef.current) {
      reasonCollectorRef.current = createTextEventCollector({
        fieldId: 'reason_text',
        logger: traceLogger,
        debounceMs: TEXT_DEBOUNCE_MS,
        throttleCharDelta: TEXT_THROTTLE_CHAR_DELTA,
      });
    }
    return reasonCollectorRef.current;
  }, [traceLogger]);

  const flushReasonCollector = useCallback(() => {
    reasonCollectorRef.current?.flush('submit');
  }, []);

  useEffect(
    () => registerTraceCollectorFlush(flushReasonCollector),
    [flushReasonCollector, registerTraceCollectorFlush]
  );

  useEffect(
    () => () => {
      reasonCollectorRef.current?.dispose();
      reasonCollectorRef.current = null;
      clearChartHoverTimer();
      chartHoverSnapshotRef.current = null;
    },
    [clearChartHoverTimer, traceLogger]
  );

  const updateRows = useCallback((nextRows: SolutionRow[]) => {
    rowsRef.current = nextRows;
    setRowsState(nextRows);
  }, []);

  const updateBestId = useCallback((nextBestId: string | null) => {
    bestIdRef.current = nextBestId;
    setBestIdState(nextBestId);
  }, []);

  // ---- persist table answers whenever rows / bestId change ----
  useEffect(() => {
    collectAnswer({ targetElement: 'Q8_方案表格', value: JSON.stringify(rows) });
    const bestRow = rows.find(r => r.id === bestId);
    collectAnswer({
      targetElement: 'Q8_最优方案',
      value:
        bestRow && bestRow.variety && bestRow.temperature
          ? `${bestRow.variety}-${bestRow.temperature}`
          : '',
    });
  }, [rows, bestId, collectAnswer]);

  // ---- handlers ----
  const handleVarietyChange = useCallback(
    (rowId: string, value: string) => {
      const row = rowsRef.current.find(r => r.id === rowId);
      if (!row) {
        return;
      }

      const previousValue = row.variety;
      const nextRow = { ...row, variety: value };
      updateRows(rowsRef.current.map(r => (r.id === rowId ? nextRow : r)));
      traceLogger?.setPlanParam(rowId, 'plan_param_1', previousValue, value, {
        row_snapshot_after_change: nextRow,
      });
    },
    [traceLogger, updateRows]
  );

  const handleTemperatureChange = useCallback(
    (rowId: string, value: string) => {
      const row = rowsRef.current.find(r => r.id === rowId);
      if (!row) {
        return;
      }

      const previousValue = row.temperature;
      const nextRow = { ...row, temperature: value };
      updateRows(rowsRef.current.map(r => (r.id === rowId ? nextRow : r)));
      traceLogger?.setPlanParam(rowId, 'plan_param_2', previousValue, value, {
        row_snapshot_after_change: nextRow,
      });
    },
    [traceLogger, updateRows]
  );

  const handleStarClick = useCallback(
    (rowId: string) => {
      const previousBestId = bestIdRef.current;
      if (previousBestId === rowId) {
        return;
      }

      updateBestId(rowId);
      const bestRow = rowsRef.current.find(r => r.id === rowId);
      collectAnswer({
        targetElement: 'Q8_最优方案',
        value:
          bestRow && bestRow.variety && bestRow.temperature
            ? `${bestRow.variety}-${bestRow.temperature}`
            : '',
      });
      traceLogger?.selectBest(rowId, previousBestId);
    },
    [collectAnswer, traceLogger, updateBestId]
  );

  const handleDeleteRow = useCallback(
    (rowId: string) => {
      const rowToDelete = rowsRef.current.find(r => r.id === rowId);
      if (!rowToDelete) {
        return;
      }

      const wasBestPlan = bestIdRef.current === rowId;
      updateRows(rowsRef.current.filter(r => r.id !== rowId));
      if (wasBestPlan) {
        updateBestId(null);
      }
      traceLogger?.deleteRow(rowId, {
        row_snapshot_before_delete: rowToDelete,
        was_best_plan: wasBestPlan,
      });
    },
    [traceLogger, updateBestId, updateRows]
  );

  const handleAddRow = useCallback(() => {
    const newRow = createSolutionRow(`page_12_solution_selection_row_${nextIdRef.current}`);
    nextIdRef.current += 1;
    updateRows([...rowsRef.current, newRow]);
    traceLogger?.addRow(newRow.id, {
      row_snapshot_after_add: newRow,
    });
  }, [traceLogger, updateRows]);

  const handleReasonChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      reasonValueRef.current = value;
      setReason(value);
      collectAnswer({ targetElement: 'Q8_理由', value });
      getReasonCollector()?.onChange(value, {
        metadata: {
          source_answer_key: 'Q8_理由',
        },
      });
    },
    [collectAnswer, getReasonCollector]
  );

  const handleReasonFocus = useCallback(() => {
    getReasonCollector()?.onFocus(reasonValueRef.current);
  }, [getReasonCollector]);

  const handleReasonBlur = useCallback(
    () => {
      getReasonCollector()?.onBlur(reasonValueRef.current, {
        source_answer_key: 'Q8_理由',
      });
    },
    [getReasonCollector]
  );

  const buildChartHoverSnapshot = useCallback((state: unknown): ChartHoverSnapshot | null => {
    if (!state || typeof state !== 'object') {
      return null;
    }

    const activePayload = (state as { activePayload?: unknown[] }).activePayload;
    const firstPayload = activePayload?.[0];
    if (!firstPayload || typeof firstPayload !== 'object') {
      return null;
    }

    const payloadRecord = firstPayload as Record<string, unknown>;
    const dataPoint =
      payloadRecord.payload && typeof payloadRecord.payload === 'object'
        ? (payloadRecord.payload as Record<string, unknown>)
        : {};
    const day = String(dataPoint.day ?? (state as { activeLabel?: unknown }).activeLabel ?? '');
    if (!day) {
      return null;
    }

    return {
      pointId: `day_${day}`,
      dataSnapshot: {
        day,
        series_id: payloadRecord.dataKey,
        black_ratio: payloadRecord.value,
        values: dataPoint,
      },
    };
  }, []);

  const emitChartHoverSnapshot = useCallback(
    (snapshot: ChartHoverSnapshot, hoverMs: number, loggedAt: number) => {
      if (!traceLogger || loggedChartHoverPointRef.current === snapshot.pointId) {
        return;
      }
      if (
        lastChartHoverLoggedAtRef.current &&
        loggedAt - lastChartHoverLoggedAtRef.current < CHART_HOVER_MIN_MS
      ) {
        return;
      }

      lastChartHoverLoggedAtRef.current = loggedAt;
      loggedChartHoverPointRef.current = snapshot.pointId;
      traceLogger.chartHover(CHART_EVIDENCE_ID, snapshot.pointId, {
        hover_ms: hoverMs,
        data_snapshot: snapshot.dataSnapshot,
      });
    },
    [traceLogger]
  );

  const scheduleChartHoverThreshold = useCallback(() => {
    clearChartHoverTimer();
    chartHoverTimerRef.current = setTimeout(() => {
      chartHoverTimerRef.current = null;
      const snapshot = chartHoverSnapshotRef.current;
      const startedAt = chartHoverStartedAtRef.current;
      if (!snapshot || startedAt === 0) {
        return;
      }
      const now = Date.now();
      const hoverMs = now - startedAt;
      if (hoverMs >= CHART_HOVER_MIN_MS) {
        emitChartHoverSnapshot(snapshot, hoverMs, now);
      }
    }, CHART_HOVER_MIN_MS);
  }, [clearChartHoverTimer, emitChartHoverSnapshot]);

  const handleChartHover = useCallback(
    (state: unknown) => {
      const snapshot = buildChartHoverSnapshot(state);
      const now = Date.now();
      const currentPointId = chartHoverSnapshotRef.current?.pointId;
      if (!snapshot) {
        return;
      }

      chartHoverSnapshotRef.current = snapshot;
      if (chartHoverStartedAtRef.current === 0 || currentPointId !== snapshot.pointId) {
        chartHoverStartedAtRef.current = now;
        loggedChartHoverPointRef.current = null;
        scheduleChartHoverThreshold();
        return;
      }

      const hoverMs = now - chartHoverStartedAtRef.current;
      if (hoverMs < CHART_HOVER_MIN_MS) {
        return;
      }

      emitChartHoverSnapshot(snapshot, hoverMs, now);
    },
    [buildChartHoverSnapshot, emitChartHoverSnapshot, scheduleChartHoverThreshold]
  );

  const handleChartLeave = useCallback(() => {
    const snapshot = chartHoverSnapshotRef.current;
    const startedAt = chartHoverStartedAtRef.current;
    const now = Date.now();
    if (snapshot && startedAt > 0) {
      const hoverMs = now - startedAt;
      if (hoverMs >= CHART_HOVER_MIN_MS) {
        emitChartHoverSnapshot(snapshot, hoverMs, now);
      }
    }
    clearChartHoverTimer();
    chartHoverStartedAtRef.current = 0;
    chartHoverSnapshotRef.current = null;
    loggedChartHoverPointRef.current = null;
  }, [clearChartHoverTimer, emitChartHoverSnapshot]);

  // ---- render ----
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.badge}>8</div>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>方案选择</h1>
        </div>
      </div>

      <p
        className={styles.instruction}
        data-content-id="solution_selection_instruction"
        {...getContentActivationHandlers('solution_selection_instruction', {
          sourceUiId: 'page12_instruction_text',
          metadata: {
            phase: 'before_plan_selection',
            content_type: 'instruction_text',
          },
        })}
      >
        根据实验结果，小明绘制了香蕉储存温度、时长与黑变比例的关系图（见左下角图）。
        查阅资料得知，为保持口感，香蕉黑变比例不宜超过
        <span className={styles.instructionHighlight}>30%</span>
        。小明计划为家庭聚会储备香蕉，需至少储存
        <span className={styles.instructionHighlight}>12天</span>
        。请将所有符合条件的香蕉品种及对应温度选入右下方表格，并在你认为最合适的方案前点亮
        <span className={styles.starInline}>★</span>，然后在下方方框内，简要说明理由。
      </p>

      <div className={styles.mainContent}>
        {/* ---- Left: Line Chart ---- */}
        <div className={styles.chartSection}>
          <h3 className={styles.chartTitle}>香蕉储存温度、时长与黑变比例关系图</h3>
          <div className={styles.chartWrapper}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={CHART_DATA}
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                onMouseMove={handleChartHover}
                onTouchMove={handleChartHover}
                onMouseLeave={handleChartLeave}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis
                  dataKey="day"
                  label={{ value: '储存天数', position: 'insideBottom', offset: -2 }}
                  tick={{ fontSize: 12 }}
                />
                <YAxis
                  domain={[0, 1]}
                  tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
                  label={{
                    value: '黑变比例',
                    angle: -90,
                    position: 'insideLeft',
                    offset: 10,
                  }}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    `${(value * 100).toFixed(0)}%`,
                    name.replace('香蕉', ''),
                  ]}
                  labelFormatter={(label: string) => `第 ${label} 天`}
                />
                <Legend verticalAlign="top" />
                {SERIES_CONFIG.map(series => (
                  <Line
                    key={series.key}
                    type="linear"
                    dataKey={series.key}
                    stroke={series.color}
                    strokeWidth={2}
                    strokeDasharray={series.dashArray}
                    dot={
                      series.isDiamond ? DiamondDot : { r: 4, fill: series.color, strokeWidth: 1 }
                    }
                    activeDot={{ r: 6 }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ---- Right: Table + Reason ---- */}
        <div className={styles.rightPanel}>
          <div className={styles.tableSection}>
            <h3 className={styles.tableTitle}>方案选择</h3>

            {rows.length === 0 ? (
              <table className={styles.tableWrapper}>
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>品种</th>
                    <th>温度</th>
                    <th>★</th>
                    <th>删除</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={styles.emptyRow}>
                    <td colSpan={5}>暂无方案，请点击下方按钮添加</td>
                  </tr>
                </tbody>
              </table>
            ) : (
              <table className={styles.tableWrapper}>
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>品种</th>
                    <th>温度</th>
                    <th>★</th>
                    <th>删除</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => (
                    <tr key={row.id}>
                      <td>{index + 1}</td>
                      <td>
                        <select
                          className={styles.selectCell}
                          value={row.variety}
                          onChange={e => handleVarietyChange(row.id, e.target.value)}
                          aria-label="品种选择"
                        >
                          <option value="">请选择</option>
                          {VARIETIES.map(v => (
                            <option key={v} value={v}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <select
                          className={styles.selectCell}
                          value={row.temperature}
                          onChange={e => handleTemperatureChange(row.id, e.target.value)}
                          aria-label="温度选择"
                        >
                          <option value="">请选择</option>
                          {TEMPERATURES.map(t => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.starButton} ${bestId === row.id ? styles.starButtonActive : ''}`}
                          onClick={() => handleStarClick(row.id)}
                          aria-label={bestId === row.id ? '已标记为最优方案' : '标记为最优方案'}
                        >
                          ★
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.deleteButton}
                          onClick={() => handleDeleteRow(row.id)}
                          aria-label="删除此方案"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <button type="button" className={styles.addRowButton} onClick={handleAddRow}>
              + 新增方案
            </button>
          </div>

          <div className={styles.reasonSection}>
            <label className={styles.reasonLabel} htmlFor="reason-textarea">
              请说明理由：
            </label>
            <textarea
              id="reason-textarea"
              className={styles.reasonTextarea}
              value={reason}
              onChange={handleReasonChange}
              onFocus={handleReasonFocus}
              onBlur={handleReasonBlur}
              placeholder="请在此处输入你的回答。"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page13SolutionSelection;
