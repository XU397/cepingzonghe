/**
 * TimerContainer - 连接 TimerService 与 TimerDisplay 的容器组件
 *
 * 功能:
 * - 自动订阅 TimerService 状态
 * - 自动渲染 TimerDisplay
 * - 简化使用 (开箱即用)
 *
 * 使用示例:
 * ```jsx
 * // 基础用法
 * <TimerContainer type="task" />
 *
 * // 自定义阈值
 * <TimerContainer
 *   type="questionnaire"
 *   warningThreshold={180}
 *   criticalThreshold={30}
 * />
 *
 * // 带超时回调
 * <TimerContainer
 *   type="notice"
 *   onTimeout={() => navigate('/next')}
 *   onTick={(remaining) => console.log(remaining)}
 * />
 * ```
 *
 * @component
 */

import { useTimer } from '../../services/timers/useTimer.js';
import TimerDisplay from './index.jsx';
import PropTypes from 'prop-types';

/**
 * TimerContainer 组件
 *
 * @param {Object} props
 * @param {string} props.type - 计时器类型: 'task' | 'questionnaire' | 'notice'
 * @param {Function} [props.onTimeout] - 超时回调
 * @param {Function} [props.onTick] - 每秒回调
 * @param {number} [props.warningThreshold=300] - 警告阈值 (秒)
 * @param {number} [props.criticalThreshold=60] - 严重阈值 (秒)
 * @param {string} [props.label] - 自定义标签文本
 * @param {boolean} [props.showEmoji=true] - 是否显示 emoji
 * @param {string} [props.className] - 额外 CSS 类名
 * @returns {JSX.Element | null}
 */
const TimerContainer = ({
  type,
  onTimeout,
 onTick,
  warningThreshold = 300,
  criticalThreshold = 60,
  label,
  showEmoji = true,
  className = '',
  scope,
}) => {
  const { remaining } = useTimer(type, {
    onTimeout,
    onTick,
    scope,
  });

  // 如果剩余时间为 0 且已超时，可以选择不显示
  // 这里选择始终显示 (显示 00:00)
  // if (remaining === 0 && isTimeout) {
  //   return null;
  // }

  return (
    <TimerDisplay
      variant={type}
      remainingSeconds={remaining}
      warningThreshold={warningThreshold}
      criticalThreshold={criticalThreshold}
      label={label}
      showEmoji={showEmoji}
      className={className}
    />
  );
};

TimerContainer.propTypes = {
  type: PropTypes.oneOf(['task', 'questionnaire', 'notice']).isRequired,
  onTimeout: PropTypes.func,
  onTick: PropTypes.func,
  warningThreshold: PropTypes.number,
  criticalThreshold: PropTypes.number,
  label: PropTypes.string,
  showEmoji: PropTypes.bool,
  className: PropTypes.string,
  scope: PropTypes.string,
};

export default TimerContainer;
