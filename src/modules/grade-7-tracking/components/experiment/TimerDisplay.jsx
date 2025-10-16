/**
 * TimerDisplay - 计时器显示组件
 *
 * 功能:
 * - 显示实验计时结果(精确到0.1秒)
 * - 支持不同状态:待机、计时中、已完成
 * - 大号数字显示,易于阅读
 * - 可选的动画效果(数字跳动)
 *
 * T043 - TimerDisplay组件
 */


import PropTypes from 'prop-types';
import styles from '../../styles/TimerDisplay.module.css';

const TimerDisplay = ({
  time,
  isRunning,
  label = '下落时间',
  unit = '秒',
  showMilliseconds = true,
  size = 'large'
}) => {
  // formatTime removed (unused)

  // 拆分整数和小数部分
  const getTimeParts = () => {
    if (time === null || time === undefined) {
      return { integer: '--', decimal: showMilliseconds ? '-' : null };
    }

    const formatted = time.toFixed(1);
    const parts = formatted.split('.');
    return {
      integer: parts[0],
      decimal: showMilliseconds ? parts[1] : null
    };
  };

  const { integer, decimal } = getTimeParts();

  // 获取状态类
  const getStatusClass = () => {
    if (isRunning) return styles.running;
    if (time !== null && time !== undefined) return styles.completed;
    return styles.idle;
  };

  return (
    <div className={`${styles.container} ${styles[size]} ${getStatusClass()}`}>
      <div className={styles.labelArea}>
        <span className={styles.label}>{label}</span>
        {isRunning && <span className={styles.runningIndicator} aria-label="计时中" />}
      </div>

      <div className={styles.displayArea} role="timer" aria-live="polite">
        <span className={styles.integer}>{integer}</span>
        {showMilliseconds && decimal !== null && (
          <>
            <span className={styles.dot}>.</span>
            <span className={styles.decimal}>{decimal}</span>
          </>
        )}
        <span className={styles.unit}>{unit}</span>
      </div>

      {time !== null && time !== undefined && !isRunning && (
        <div className={styles.completionBadge} role="status">
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <circle cx="8" cy="8" r="7" fill="#52c41a" />
            <path
              d="M6 9.5L4.5 8L3.5 9L6 11.5L12.5 5L11.5 4L6 9.5Z"
              fill="white"
            />
          </svg>
          <span>计时完成</span>
        </div>
      )}
    </div>
  );
};

TimerDisplay.propTypes = {
  /** 时间值(秒, null表示未开始) */
  time: PropTypes.number,

  /** 是否正在计时 */
  isRunning: PropTypes.bool.isRequired,

  /** 标签文本 */
  label: PropTypes.string,

  /** 单位文本 */
  unit: PropTypes.string,

  /** 是否显示小数部分 */
  showMilliseconds: PropTypes.bool,

  /** 尺寸 */
  size: PropTypes.oneOf(['small', 'medium', 'large'])
};

export default TimerDisplay;
