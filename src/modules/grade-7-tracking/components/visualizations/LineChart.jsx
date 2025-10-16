/**
 * LineChart - 折线图可视化组件
 *
 * 功能:
 * - 使用Recharts库绘制温度-下落时间关系折线图
 * - 横轴:温度(25℃-45℃)
 * - 纵轴:下落时间(秒)
 * - 多条曲线:代表不同含水量(15%, 17%, 19%, 21%)
 * - 响应式设计,自适应容器宽度
 *
 * T050 - LineChart组件
 * FR-033
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
  ResponsiveContainer
} from 'recharts';
import styles from '../../styles/LineChart.module.css';

/**
 * 生成图表数据
 * 根据物理模型计算所有温度和含水量组合的下落时间
 */
const generateChartData = (temperatureRange, waterContentOptions) => {
  return temperatureRange.map((temperature) => {
    const dataPoint = { temperature };

    waterContentOptions.forEach((waterContent) => {
      // 计算平均下落时间(不带随机波动)
      const BASE_TIME = 10.0;
      const waterContentFactor = 1 - (waterContent - 15) * 0.08;
      const temperatureFactor = 1 - (temperature - 25) * 0.02;
      const fallTime = BASE_TIME * waterContentFactor * temperatureFactor;

      dataPoint[`${waterContent}%`] = parseFloat(fallTime.toFixed(1));
    });

    return dataPoint;
  });
};

/**
 * 自定义Tooltip组件
 */
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>温度: {label}°C</p>
        {payload.map((entry, index) => (
          <p
            key={`item-${index}`}
            className={styles.tooltipItem}
            style={{ color: entry.color }}
          >
            {entry.name}: {entry.value.toFixed(1)}秒
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
  // 生成图表数据
  const chartData = generateChartData(temperatureRange, waterContentOptions);

  // 颜色映射(为不同含水量分配不同颜色)
  const colorMap = {
    '15%': '#8884d8', // 紫蓝色(高黏度)
    '17%': '#82ca9d', // 绿色
    '19%': '#ffc658', // 橙色
    '21%': '#ff7300'  // 深橙色(低黏度)
  };

  return (
    <div className={styles.container}>
      <div className={styles.chartHeader}>
        <h3 className={styles.chartTitle}>温度、含水量与落球时间的关系</h3>
        <p className={styles.chartSubtitle}>
          横轴:环境温度(°C) · 纵轴:小球下落时间(秒)
        </p>
      </div>

      <ResponsiveContainer width={width} height={height}>
        <RechartsLineChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
        >
          {showGrid && (
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
          )}

          <XAxis
            dataKey="temperature"
            label={{
              value: '温度 (°C)',
              position: 'insideBottom',
              offset: -10,
              style: { fontSize: 14, fontWeight: 600, fill: '#595959' }
            }}
            tick={{ fontSize: 12, fill: '#8c8c8c' }}
            stroke="#d9d9d9"
          />

          <YAxis
            label={{
              value: '下落时间 (秒)',
              angle: -90,
              position: 'insideLeft',
              offset: 0,
              style: { fontSize: 14, fontWeight: 600, fill: '#595959' }
            }}
            tick={{ fontSize: 12, fill: '#8c8c8c' }}
            stroke="#d9d9d9"
            domain={[0, 'auto']}
          />

          <Tooltip content={<CustomTooltip />} />

          {showLegend && (
            <Legend
              verticalAlign="top"
              height={40}
              wrapperStyle={{ fontSize: 13, fontWeight: 600 }}
              iconType="line"
            />
          )}

          {waterContentOptions.map((waterContent) => (
            <Line
              key={waterContent}
              type="monotone"
              dataKey={`${waterContent}%`}
              name={`含水量 ${waterContent}%`}
              stroke={colorMap[`${waterContent}%`] || '#1890ff'}
              strokeWidth={3}
              dot={{
                r: 5,
                fill: colorMap[`${waterContent}%`],
                stroke: 'white',
                strokeWidth: 2
              }}
              activeDot={{
                r: 7,
                fill: colorMap[`${waterContent}%`],
                stroke: 'white',
                strokeWidth: 3
              }}
              animationDuration={1500}
              animationEasing="ease-in-out"
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>

      <div className={styles.chartFooter}>
        <div className={styles.insightBadge}>
          <span className={styles.insightIcon}>📊</span>
          <span className={styles.insightText}>
            观察发现:含水量越高,曲线越低(下落时间越短)
          </span>
        </div>
      </div>
    </div>
  );
};

LineChart.propTypes = {
  /** 温度范围数组 */
  temperatureRange: PropTypes.arrayOf(PropTypes.number),

  /** 含水量选项数组 */
  waterContentOptions: PropTypes.arrayOf(PropTypes.number),

  /** 图表宽度 */
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),

  /** 图表高度 */
  height: PropTypes.number,

  /** 是否显示图例 */
  showLegend: PropTypes.bool,

  /** 是否显示网格 */
  showGrid: PropTypes.bool
};

export default LineChart;
