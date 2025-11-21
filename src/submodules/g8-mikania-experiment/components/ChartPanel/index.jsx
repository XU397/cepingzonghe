/**
 * ChartPanel - 发芽率趋势图组件
 *
 * 显示3条折线图，表示不同浓度下7天的发芽率变化
 * 使用简单SVG实现
 */

import { GERMINATION_BY_CONCENTRATION } from '../../utils/experimentData';
import styles from '../../styles/ChartPanel.module.css';

// 图表配置
const CHART_CONFIG = {
  width: 500,
  height: 350,
  padding: {
    top: 40,
    right: 60,
    bottom: 50,
    left: 60,
  },
  colors: {
    '0mg/ml': '#59c1ff',    // 蓝色 - 对照组
    '5mg/ml': '#ffce6b',    // 黄色
    '10mg/ml': '#ff8a80',   // 红色
  },
};

/**
 * ChartPanel Component
 */
function ChartPanel() {
  const { width, height, padding, colors } = CHART_CONFIG;

  // 计算绘图区域
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  // 数据范围
  const xMin = 1;
  const xMax = 7;
  const yMin = 0;
  const yMax = 100;

  // 坐标转换函数
  const xScale = (day) => padding.left + ((day - xMin) / (xMax - xMin)) * plotWidth;
  const yScale = (rate) => padding.top + plotHeight - ((rate - yMin) / (yMax - yMin)) * plotHeight;

  // 生成路径数据
  const generatePath = (data) => {
    if (!data || data.length === 0) return '';

    return data
      .map((rate, index) => {
        const x = xScale(index + 1);
        const y = yScale(rate);
        return index === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
      })
      .join(' ');
  };

  // 生成网格线
  const gridLines = [];
  for (let i = 0; i <= 5; i++) {
    const y = yScale((i / 5) * 100);
    gridLines.push(
      <line
        key={`grid-${i}`}
        x1={padding.left}
        y1={y}
        x2={width - padding.right}
        y2={y}
        stroke="#e0e0e0"
        strokeWidth="1"
        strokeDasharray="4,4"
      />
    );
  }

  // 生成Y轴刻度标签
  const yLabels = [];
  for (let i = 0; i <= 5; i++) {
    const value = (i / 5) * 100;
    const y = yScale(value);
    yLabels.push(
      <text
        key={`ylabel-${i}`}
        x={padding.left - 10}
        y={y}
        textAnchor="end"
        alignmentBaseline="middle"
        fontSize="12"
        fill="#666"
      >
        {value}%
      </text>
    );
  }

  // 生成X轴刻度标签
  const xLabels = [];
  for (let day = 1; day <= 7; day++) {
    const x = xScale(day);
    xLabels.push(
      <text
        key={`xlabel-${day}`}
        x={x}
        y={height - padding.bottom + 20}
        textAnchor="middle"
        fontSize="12"
        fill="#666"
      >
        {day}
      </text>
    );
  }

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>薇甘菊种子发芽率趋势图</h3>

      <svg
        width={width}
        height={height}
        className={styles.chartSvg}
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* 网格线 */}
        {gridLines}

        {/* 坐标轴 */}
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={height - padding.bottom}
          stroke="#333"
          strokeWidth="2"
        />
        <line
          x1={padding.left}
          y1={height - padding.bottom}
          x2={width - padding.right}
          y2={height - padding.bottom}
          stroke="#333"
          strokeWidth="2"
        />

        {/* Y轴标签 */}
        {yLabels}

        {/* X轴标签 */}
        {xLabels}

        {/* 坐标轴标题 */}
        <text
          x={width / 2}
          y={height - 10}
          textAnchor="middle"
          fontSize="14"
          fill="#333"
        >
          天数
        </text>
        <text
          x={15}
          y={height / 2}
          textAnchor="middle"
          fontSize="14"
          fill="#333"
          transform={`rotate(-90, 15, ${height / 2})`}
        >
          发芽率
        </text>

        {/* 折线图 */}
        {Object.entries(GERMINATION_BY_CONCENTRATION).map(([concentration, data]) => (
          <g key={concentration}>
            {/* 折线 */}
            <path
              d={generatePath(data)}
              fill="none"
              stroke={colors[concentration]}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* 数据点 */}
            {data.map((rate, index) => (
              <circle
                key={`${concentration}-${index}`}
                cx={xScale(index + 1)}
                cy={yScale(rate)}
                r="4"
                fill={colors[concentration]}
                stroke="white"
                strokeWidth="2"
              />
            ))}
          </g>
        ))}
      </svg>

      {/* 图例 */}
      <div className={styles.legend}>
        {Object.entries(colors).map(([concentration, color]) => (
          <div key={concentration} className={styles.legendItem}>
            <span
              className={styles.legendColor}
              style={{ backgroundColor: color }}
            />
            <span className={styles.legendText}>{concentration}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ChartPanel;
