/**
 * TimerDisplay - 统一计时器显示组件
 *
 * 基于 Grade-7 Tracking CountdownTimer 的视觉规范 (像素级一致)
 *
 * 功能特性:
 * - 固定定位 (右上角)
 * - 三种变体: task(主任务), questionnaire(问卷), notice(注意事项)
 * - 自动警告状态 (<300s warning, <60s critical)
 * - 脉冲动画
 * - 可自定义阈值
 * - 完全无障碍支持
 *
 * 使用示例:
 * ```jsx
 * <TimerDisplay
 *   variant="task"
 *   remainingSeconds={1200}
 *   warningThreshold={300}
 *   criticalThreshold={60}
 * />
 * ```
 *
 * @component
 */

import { useMemo } from 'react';
import PropTypes from 'prop-types';
import styles from './styles.module.css';

/**
 * 格式化时间为 MM:SS
 * @param {number} totalSeconds - 总秒数
 * @returns {string}
 */
function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * TimerDisplay 组件
 *
 * @param {Object} props
 * @param {string} [props.variant='task'] - 计时器类型: 'task' | 'questionnaire' | 'notice'
 * @param {number} props.remainingSeconds - 剩余时间 (秒)
 * @param {number} [props.warningThreshold=300] - 警告阈值 (秒), 默认 5 分钟
 * @param {number} [props.criticalThreshold=60] - 严重阈值 (秒), 默认 1 分钟
 * @param {string} [props.className] - 额外 CSS 类名
 * @param {string} [props.label] - 自定义标签文本, 默认 "剩余时间"
 * @param {boolean} [props.showEmoji=true] - 是否显示 emoji
 * @returns {JSX.Element}
 */
const TimerDisplay = ({
  variant = 'task',
  remainingSeconds,
  warningThreshold = 300, // 5 分钟
  criticalThreshold = 60,  // 1 分钟
  className = '',
  label = '剩余时间',
  showEmoji = true,
}) => {
  // 计算状态
  const state = useMemo(() => {
    if (remainingSeconds === 0) {
      return 'complete';
    }
    if (remainingSeconds <= criticalThreshold) {
      return 'critical';
    }
    if (remainingSeconds < warningThreshold) {
      return 'warning';
    }
    return 'normal';
  }, [remainingSeconds, warningThreshold, criticalThreshold]);

  // 格式化时间
  const timeText = useMemo(() => formatTime(remainingSeconds), [remainingSeconds]);

  // 构建 CSS 类名
  const timerClasses = [
    styles.timer,
    styles[variant],
    styles[state],
    className,
  ].filter(Boolean).join(' ');

  // ARIA label
  const ariaLabel = `${label}: ${timeText}`;

  // Emoji 映射
  const emojiMap = {
    normal: '⏱️',
    warning: '⚠️',
    critical: '🔴',
    complete: '⏰',
  };

  return (
    <div
      className={timerClasses}
      role="timer"
      aria-live="polite"
      aria-label={ariaLabel}
      data-variant={variant}
      data-state={state}
    >
      {showEmoji && (
        <span className={styles.emoji} aria-hidden="true">
          {emojiMap[state]}
        </span>
      )}
      <span className={styles.timeText}>
        {label}: {timeText}
      </span>
    </div>
  );
};

TimerDisplay.propTypes = {
  variant: PropTypes.oneOf(['task', 'questionnaire', 'notice']),
  remainingSeconds: PropTypes.number.isRequired,
  warningThreshold: PropTypes.number,
  criticalThreshold: PropTypes.number,
  className: PropTypes.string,
  label: PropTypes.string,
  showEmoji: PropTypes.bool,
};

export default TimerDisplay;
