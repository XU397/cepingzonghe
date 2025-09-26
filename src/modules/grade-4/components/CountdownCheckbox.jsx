/**
 * 倒计时复选框组件
 * 提供带有倒计时功能的复选框，倒计时期间禁用，完成后启用
 */

import { useCallback } from 'react';
import { useCountdownTimer } from '../hooks/useCountdownTimer';
import { useGrade4Context } from '../context/Grade4Context';
import styles from './CountdownCheckbox.module.css';

/**
 * 倒计时复选框组件
 * @param {Object} props - 组件属性
 * @param {number} props.initialTime - 初始倒计时时间（秒，默认40）
 * @param {string} props.label - 复选框标签文本
 * @param {Function} props.onComplete - 倒计时完成回调
 * @param {Function} props.onChange - 复选框状态变化回调
 * @param {boolean} props.checked - 复选框选中状态（受控）
 * @param {string} props.className - 自定义CSS类名
 * @param {Object} props.style - 自定义样式
 */
const CountdownCheckbox = ({
  initialTime = 40,
  label = '我已阅读上述注意事项',
  onComplete,
  onChange,
  checked = false,
  className = '',
  style = {},
  ...rest
}) => {
  const { logOperation, noticesActions } = useGrade4Context();

  // 倒计时完成回调
  const handleTimerComplete = useCallback(() => {
    // 更新Context状态
    noticesActions.setTimerCompleted(true);
    
    // 记录倒计时开始操作（如果还没记录过）
    logOperation({
      targetElement: '40秒倒计时',
      eventType: 'timer_start',
      value: '开始40秒强制阅读倒计时'
    });
    
    // 调用外部回调
    if (onComplete) {
      onComplete();
    }
  }, [noticesActions, logOperation, onComplete]);

  // 每秒更新回调
  const handleTick = useCallback((remainingTime) => {
    noticesActions.setTimerRemaining(remainingTime);
  }, [noticesActions]);

  // 使用倒计时Hook
  const {
    isCompleted,
    formatTime
  } = useCountdownTimer({
    initialTime,
    onComplete: handleTimerComplete,
    onTick: handleTick,
    autoStart: true
  });

  // 复选框变化处理
  const handleCheckboxChange = useCallback((event) => {
    const isChecked = event.target.checked;
    
    // 更新Context状态
    noticesActions.setAcknowledged(isChecked);
    
    // 调用外部回调
    if (onChange) {
      onChange(event);
    }
  }, [noticesActions, onChange]);

  // 渲染标签文本
  const renderLabel = () => {
    if (isCompleted) {
      return label;
    }
    
    return `${label}(${formatTime()})`;
  };

  // 组件样式类名
  const checkboxClassName = `${styles.countdownCheckbox} ${!isCompleted ? styles.disabled : ''} ${styles.fadeIn} ${className}`;
  const inputClassName = styles.checkboxInput;
  const labelClassName = `${styles.checkboxLabel} ${!isCompleted ? styles.disabled : styles.completed}`;

  return (
    <label 
      className={checkboxClassName}
      style={style}
      title={isCompleted ? '点击确认已阅读' : `请等待 ${formatTime()} 后再确认`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={!isCompleted}
        onChange={handleCheckboxChange}
        className={inputClassName}
        {...rest}
      />
      <span className={labelClassName}>
        {renderLabel()}
      </span>
    </label>
  );
};

export default CountdownCheckbox;