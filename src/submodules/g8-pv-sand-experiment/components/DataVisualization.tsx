import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { WIND_SPEED_DATA } from '../constants/windSpeedData';
import styles from './DataVisualization.module.css';

interface DataVisualizationProps {
  title?: string;
  className?: string;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({ 
  title = "风速对比实验数据", 
  className 
}) => {
  // 转换数据格式为Recharts需要的格式
  const chartData = Object.entries(WIND_SPEED_DATA).map(([height, data]) => ({
    height: `${height}cm`,
    heightValue: parseInt(height),
    withPanel: data.withPanel,
    noPanel: data.noPanel,
    difference: Number((data.noPanel - data.withPanel).toFixed(2))
  }));

  // 自定义Tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipLabel}>{`高度：${label}`}</p>
          <p className={styles.tooltipWithPanel}>
            <span className={styles.withPanelIndicator}></span>
            {`有光伏板：${data.withPanel} m/s`}
          </p>
          <p className={styles.tooltipNoPanel}>
            <span className={styles.noPanelIndicator}></span>
            {`无光伏板：${data.noPanel} m/s`}
          </p>
          <p className={styles.tooltipDifference}>
            {`差值：${data.difference} m/s`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`${styles.container} ${className || ''}`}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.subtitle}>
          对比分析不同高度下有无光伏板时的风速变化
        </p>
      </div>
      
      <div className={styles.chartContainer}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 20,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="height" 
              stroke="#64748b"
              fontSize={14}
              fontWeight={500}
            />
            <YAxis 
              stroke="#64748b"
              fontSize={14}
              fontWeight={500}
              label={{ value: '风速 (m/s)', angle: -90, position: 'insideLeft' }}
              domain={['dataMin - 0.1', 'dataMax + 0.1']}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{
                paddingTop: '20px',
                fontSize: '14px',
                fontWeight: '500'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="withPanel" 
              stroke="#059669" 
              strokeWidth={3}
              name="有光伏板"
              dot={{ fill: '#059669', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: '#059669', stroke: '#fff', strokeWidth: 2 }}
            />
            <Line 
              type="monotone" 
              dataKey="noPanel" 
              stroke="#dc2626" 
              strokeWidth={3}
              name="无光伏板"
              dot={{ fill: '#dc2626', strokeWidth: 2, r: 6 }}
              activeDot={{ r: 8, fill: '#dc2626', stroke: '#fff', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <h4 className={styles.summaryTitle}>数据总结</h4>
          <div className={styles.summaryContent}>
            {chartData.map((item) => (
              <div key={item.height} className={styles.summaryRow}>
                <span className={styles.heightLabel}>{item.height}</span>
                <div className={styles.speedValues}>
                  <span className={styles.withPanelValue}>
                    有板：{item.withPanel} m/s
                  </span>
                  <span className={styles.noPanelValue}>
                    无板：{item.noPanel} m/s
                  </span>
                  <span className={styles.differenceValue}>
                    减少：{item.difference} m/s
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataVisualization;