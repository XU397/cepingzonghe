/**
 * @file MeasuringCylinder.jsx
 * @description 量筒视觉组件，用于模拟实验中显示面团体积变化。
 */
import React from 'react';
import PropTypes from 'prop-types';
import styles from './MeasuringCylinder.module.css';

/**
 * 量筒组件
 * @param {object} props - 组件属性
 * @param {string|number} props.temperatureLabel - 温度标签 (例如 "20°C")
 * @param {number} props.currentVolume - 当前面团体积 (ml)
 * @param {number} props.maxVolume - 量筒最大容量 (ml)，默认为250ml
 * @param {number} props.initialVolume - 面团初始体积 (ml), 默认为70ml, 用于计算相对膨胀
 */
const MeasuringCylinder = ({ temperatureLabel, currentVolume, maxVolume = 250, initialVolume = 70 }) => {
  // 防止除以零或负数的情况
  const safeMaxVolume = Math.max(1, maxVolume);
  const safeCurrentVolume = Math.max(0, currentVolume);

  // 面团高度计算逻辑：
  // 我们假设面团的膨胀是相对于其初始体积的。
  // 量筒的视觉高度100%代表maxVolume。
  // 面团的初始高度对应 initialVolume / maxVolume 的比例。
  // 当前面团的显示高度，应该是基于 currentVolume 相对于 maxVolume 的比例。
  // 为了更直观地表现膨胀，我们可以让面团元素的高度直接对应 currentVolume 在 maxVolume 中的占比。

  // 面团占据量筒的百分比高度
  const doughHeightPercentage = (safeCurrentVolume / safeMaxVolume) * 100;
  // 确保高度不超过100%
  const clampedDoughHeight = Math.min(doughHeightPercentage, 100);

  return (
    <div className={styles.measuringCylinderContainer}>
      <div className={styles.temperatureLabel}>{temperatureLabel}</div>
      <div className={styles.cylinderVisual}>
        <div className={styles.cylinderMarkings}>
          {/* 简单刻度线示例，可以根据需要做得更精细 */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className={styles.markingLine} style={{ bottom: `${(i + 1) * (100 / 5)}%` }}></div>
          ))}
        </div>
        <div
          className={styles.doughVisual}
          style={{ height: `${clampedDoughHeight}%` }}
          title={`体积: ${safeCurrentVolume.toFixed(1)}ml`}
        >
        </div>
      </div>
      <div className={styles.volumeReading}>{safeCurrentVolume.toFixed(1)} ml</div>
    </div>
  );
};

MeasuringCylinder.propTypes = {
  temperatureLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  currentVolume: PropTypes.number.isRequired,
  maxVolume: PropTypes.number,
  initialVolume: PropTypes.number,
};

export default MeasuringCylinder; 