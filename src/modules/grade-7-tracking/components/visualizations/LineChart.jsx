/**
 * LineChart - 折线图可视化组件（UTF-8 clean）
 */

import PropTypes from 'prop-types';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import styles from '../../styles/LineChart.module.css';

// 基于提供的表格数据生成图表数据
const generateChartData = (temperatureRange, waterContentOptions) => {
  // 数据来源于附件图中的表格
  const tableData = {
    25: { 15: 16.5, 17: 5.7, 19: 2.9, 21: 1.5 },
    30: { 15: 8.6, 17: 3.1, 19: 1.6, 21: 1.1 },
    35: { 15: 4.8, 17: 1.8, 19: 1.0, 21: 0.7 },
    40: { 15: 2.7, 17: 1.1, 19: 0.6, 21: 0.4 },
    45: { 15: 1.6, 17: 0.7, 19: 0.4, 21: 0.3 }
  };

  return temperatureRange.map((temperature) => {
    const dataPoint = { temperature };

    waterContentOptions.forEach((waterContent) => {
      const fallTime = tableData[temperature]?.[waterContent];
      if (fallTime !== undefined) {
        dataPoint[`${waterContent}%`] = fallTime;
      }
    });

    return dataPoint;
  });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>温度: {label}°C</p>
        {payload.map((entry, index) => (
          <p key={`item-${index}`} className={styles.tooltipItem} style={{ color: entry.color }}>
            {entry.name}: {Number(entry.value).toFixed(1)}秒
          </p>
        ))}
      </div>
    );
  }
  return null;
};

CustomTooltip.propTypes = {
  active: PropTypes.bool,
  payload: PropTypes.array,
  label: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

const LineChart = ({
  temperatureRange = [25, 30, 35, 40, 45],
  waterContentOptions = [15, 17, 19, 21],
  width = '100%',
  height = 400,
  showLegend = true,
  showGrid = true
}) => {
  const chartData = generateChartData(temperatureRange, waterContentOptions);

  const colorMap = {
    '15%': '#8884d8',
    '17%': '#82ca9d',
    '19%': '#ffc658',
    '21%': '#ff7300'
  };

  return (
    <div className={styles.container}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>温度、含水量与落球时间的关系</h3>
        <p className={styles.chartSubtitle}>横轴: 环境温度(°C) · 纵轴: 小球下落时间(秒)</p>
      </div>

      <ResponsiveContainer width={width} height={height}>
        <RechartsLineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />}

          <XAxis
            dataKey="temperature"
            label={{ value: '温度 (°C)', position: 'insideBottom', offset: -10, style: { fontSize: 14, fontWeight: 600, fill: '#595959' } }}
            tick={{ fontSize: 12, fill: '#8c8c8c' }}
            stroke="#d9d9d9"
          />

          <YAxis
            label={{ value: '下落时间 (秒)', angle: -90, position: 'insideLeft', offset: 0, style: { fontSize: 14, fontWeight: 600, fill: '#595959' } }}
            tick={{ fontSize: 12, fill: '#8c8c8c' }}
            stroke="#d9d9d9"
            domain={[0, 'auto']}
          />

          {/* 2秒参考线 - 标识目标下落时间 */}
          <ReferenceLine
            y={2}
            stroke="#ff4d4f"
            strokeWidth={2}
            strokeDasharray="5 5"
            label={{
              value: '目标时间: 2秒',
              position: 'right',
              fill: '#ff4d4f',
              fontSize: 12,
              fontWeight: 600
            }}
          />

          <Tooltip content={<CustomTooltip />} />
          {showLegend && (
            <Legend verticalAlign="top" height={40} wrapperStyle={{ fontSize: 13, fontWeight: 600 }} iconType="line" />
          )}

          {waterContentOptions.map((wc) => (
            <Line
              key={wc}
              type="monotone"
              dataKey={`${wc}%`}
              name={`含水量${wc}%`}
              stroke={colorMap[`${wc}%`] || '#1890ff'}
              strokeWidth={3}
              dot={{ r: 5, fill: colorMap[`${wc}%`], stroke: 'white', strokeWidth: 2 }}
              activeDot={{ r: 7, fill: colorMap[`${wc}%`], stroke: 'white', strokeWidth: 3 }}
              animationDuration={1200}
              animationEasing="ease-in-out"
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>

      {/* 删除了chartFooter观察提示部分，以节省垂直空间 */}
    </div>
  );
};

LineChart.propTypes = {
  temperatureRange: PropTypes.arrayOf(PropTypes.number),
  waterContentOptions: PropTypes.arrayOf(PropTypes.number),
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  height: PropTypes.number,
  showLegend: PropTypes.bool,
  showGrid: PropTypes.bool
};

export default LineChart;
