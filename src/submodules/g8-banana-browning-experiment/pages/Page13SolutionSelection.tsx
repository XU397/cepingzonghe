import React, { useCallback, useEffect, useRef, useState } from 'react';
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
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import styles from '../styles/Page13SolutionSelection.module.css';

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
// Table row shape (per task spec: id is number)
// ---------------------------------------------------------------------------
interface TableRow {
  id: number;
  variety: string;
  temperature: string;
  isBest: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
const Page13SolutionSelection: React.FC = () => {
  const { logOperation, collectAnswer, setPageStartTime, getPagePrefix } =
    useG8BananaBrowningContext();
  const targetPrefix = getPagePrefix();

  const hasLoggedEnter = useRef(false);
  const nextIdRef = useRef(2);

  const [rows, setRows] = useState<TableRow[]>([
    { id: 1, variety: '', temperature: '', isBest: false },
  ]);
  const [bestId, setBestId] = useState<number | null>(null);
  const [reason, setReason] = useState('');

  // ---- page enter lifecycle ----
  useEffect(() => {
    if (hasLoggedEnter.current) return;
    hasLoggedEnter.current = true;
    setPageStartTime(new Date());
    logOperation({
      targetElement: `${targetPrefix}页面进入`,
      eventType: EventTypes.PAGE_ENTER,
      value: '页面加载完成',
      time: new Date().toISOString(),
    });
  }, [logOperation, setPageStartTime, targetPrefix]);

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
    (rowId: number, variety: string) => {
      setRows(prev => prev.map(r => (r.id === rowId ? { ...r, variety } : r)));
      logOperation({
        targetElement: `${targetPrefix}品种选择`,
        eventType: EventTypes.CHANGE,
        value: variety,
        time: new Date().toISOString(),
      });
    },
    [logOperation, targetPrefix]
  );

  const handleTemperatureChange = useCallback(
    (rowId: number, temperature: string) => {
      setRows(prev => prev.map(r => (r.id === rowId ? { ...r, temperature } : r)));
      logOperation({
        targetElement: `${targetPrefix}温度选择`,
        eventType: EventTypes.CHANGE,
        value: temperature,
        time: new Date().toISOString(),
      });
    },
    [logOperation, targetPrefix]
  );

  const handleStarClick = useCallback(
    (rowId: number) => {
      const newBestId = bestId === rowId ? null : rowId;
      setBestId(newBestId);
      setRows(prev => prev.map(r => ({ ...r, isBest: r.id === newBestId })));
      logOperation({
        targetElement: `${targetPrefix}最优方案标记`,
        eventType: EventTypes.CLICK,
        value: newBestId !== null ? '标记为最优' : '取消标记',
        time: new Date().toISOString(),
      });
    },
    [bestId, logOperation, targetPrefix]
  );

  const handleDeleteRow = useCallback(
    (rowId: number) => {
      setRows(prev => prev.filter(r => r.id !== rowId));
      if (bestId === rowId) {
        setBestId(null);
      }
      logOperation({
        targetElement: `${targetPrefix}删除方案`,
        eventType: EventTypes.CLICK,
        value: `删除方案ID=${rowId}`,
        time: new Date().toISOString(),
      });
    },
    [bestId, logOperation, targetPrefix]
  );

  const handleAddRow = useCallback(() => {
    const newId = nextIdRef.current;
    nextIdRef.current += 1;
    setRows(prev => [...prev, { id: newId, variety: '', temperature: '', isBest: false }]);
    logOperation({
      targetElement: `${targetPrefix}新增方案`,
      eventType: EventTypes.CLICK,
      value: '新增空白方案行',
      time: new Date().toISOString(),
    });
  }, [logOperation, targetPrefix]);

  const handleReasonChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = e.target.value;
      setReason(value);
      collectAnswer({ targetElement: 'Q8_理由', value });
      logOperation({
        targetElement: `${targetPrefix}理由输入`,
        eventType: EventTypes.INPUT_CHANGE,
        value,
        time: new Date().toISOString(),
      });
    },
    [collectAnswer, logOperation, targetPrefix]
  );

  // ---- render ----
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.badge}>8</div>
        <div className={styles.headerContent}>
          <h1 className={styles.pageTitle}>方案选择</h1>
        </div>
      </div>

      <p className={styles.instruction}>
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
              <LineChart data={CHART_DATA} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
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
                          aria-label={bestId === row.id ? '取消最优标记' : '标记为最优方案'}
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
              placeholder="请在此处输入你的回答。"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page13SolutionSelection;
