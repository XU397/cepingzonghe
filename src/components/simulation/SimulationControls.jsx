/**
 * @file SimulationControls.jsx
 * @description 模拟实验的控制组件，包含时间选择、开始计时和重置功能。
 */
import React from 'react';
import PropTypes from 'prop-types';
import styles from './SimulationControls.module.css';
import Button from '../common/Button'; // 假设通用按钮组件已存在

const TIME_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8]; // 小时

/**
 * 模拟实验控制组件
 * @param {object} props - 组件属性
 * @param {function} props.onTimeChange - 时间选择变化时的回调函数，参数为选中的时间 (小时)
 * @param {function} props.onStartTiming - 点击"计时开始"按钮的回调函数
 * @param {function} props.onReset - 点击"重置"按钮的回调函数
 * @param {number} props.currentTime - 当前选定的时间 (小时)
 * @param {boolean} props.isTiming - 是否正在计时 (用于禁用按钮)
 * @param {boolean} props.isMaxTimeReached - 是否已达到最大可选时间（用于禁用增加时间按钮）
 * @param {boolean} props.isMinTimeReached - 是否已达到最小可选时间（用于禁用减少时间按钮）
 */
const SimulationControls = ({
  onTimeChange,
  onStartTiming,
  onReset,
  currentTime,
  isTiming,
  isMaxTimeReached,
  isMinTimeReached,
}) => {

  const handleDecreaseTime = () => {
    const currentIndex = TIME_OPTIONS.indexOf(currentTime);
    if (currentIndex > 0) {
      onTimeChange(TIME_OPTIONS[currentIndex - 1]);
    }
  };

  const handleIncreaseTime = () => {
    const currentIndex = TIME_OPTIONS.indexOf(currentTime);
    if (currentIndex < TIME_OPTIONS.length - 1) {
      onTimeChange(TIME_OPTIONS[currentIndex + 1]);
    }
  };

  return (
    <div className={styles.controlsContainer}>
      <div className={styles.timeSelectorContainer}>
        <Button
          text="-"
          onClick={handleDecreaseTime}
          disabled={isTiming || isMinTimeReached || currentTime <= TIME_OPTIONS[0]}
          variant="secondary"
          className={styles.timeAdjustButton}
        />
        <span className={styles.timeDisplay}>{currentTime} 小时</span>
        <Button
          text="+"
          onClick={handleIncreaseTime}
          disabled={isTiming || isMaxTimeReached || currentTime >= TIME_OPTIONS[TIME_OPTIONS.length -1]}
          variant="secondary"
          className={styles.timeAdjustButton}
        />
      </div>
      <div className={styles.actionButtonsContainer}>
        <Button
          text="计时开始"
          onClick={onStartTiming}
          disabled={isTiming}
          className={styles.controlButton}
        />
        <Button
          text="重置"
          onClick={onReset}
          disabled={isTiming}
          variant="warning" // 假设有warning样式
          className={styles.controlButton}
        />
      </div>
    </div>
  );
};

SimulationControls.propTypes = {
  onTimeChange: PropTypes.func.isRequired,
  onStartTiming: PropTypes.func.isRequired,
  onReset: PropTypes.func.isRequired,
  currentTime: PropTypes.number.isRequired,
  isTiming: PropTypes.bool,
  isMaxTimeReached: PropTypes.bool,
  isMinTimeReached: PropTypes.bool,
};

SimulationControls.defaultProps = {
  isTiming: false,
  isMaxTimeReached: false,
  isMinTimeReached: false,
};

export default SimulationControls; 