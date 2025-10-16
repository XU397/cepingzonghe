/**
 * RadioButtonGroup - 单选按钮组组件
 *
 * 功能:
 * - 支持4选项/5选项/10选项模式
 * - 单选逻辑(互斥选择)
 * - 选中状态视觉反馈
 * - 键盘导航支持(Tab, 箭头键)
 * - 无障碍性支持(ARIA属性)
 *
 * @component
 */

import { useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/RadioButtonGroup.module.css';

/**
 * RadioButtonGroup Component
 *
 * @param {Object} props
 * @param {Array<{value: string, label: string}>} props.options - 选项数组
 * @param {string|null} props.value - 当前选中的值
 * @param {Function} props.onChange - 选择变化回调 (value) => void
 * @param {string} props.name - 单选组名称(必须唯一)
 * @param {string} [props.orientation='vertical'] - 布局方向: 'horizontal' | 'vertical'
 * @param {boolean} [props.disabled=false] - 是否禁用
 * @param {string} [props.ariaLabel] - ARIA标签(用于屏幕阅读器)
 */
const RadioButtonGroup = ({
  options = [],
  value,
  onChange,
  name,
  orientation = 'vertical',
  disabled = false,
  ariaLabel,
}) => {
  const radioGroupRef = useRef(null);

  // 处理选项变化 (Must be called before any conditional returns)
  const handleChange = useCallback(
    (optionValue) => {
      if (disabled) return;
      if (onChange && typeof onChange === 'function') {
        onChange(optionValue);
      }
    },
    [disabled, onChange]
  );

  // 处理键盘导航 (Must be called before any conditional returns)
  const handleKeyDown = useCallback(
    (event, currentIndex) => {
      const { key } = event;

      // 支持箭头键导航
      if (key === 'ArrowDown' || key === 'ArrowRight') {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % options.length;
        const nextValue = options[nextIndex].value;
        handleChange(nextValue);

        // 聚焦到下一个radio按钮
        const radioButtons = radioGroupRef.current?.querySelectorAll('input[type="radio"]');
        if (radioButtons && radioButtons[nextIndex]) {
          radioButtons[nextIndex].focus();
        }
      } else if (key === 'ArrowUp' || key === 'ArrowLeft') {
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + options.length) % options.length;
        const prevValue = options[prevIndex].value;
        handleChange(prevValue);

        // 聚焦到上一个radio按钮
        const radioButtons = radioGroupRef.current?.querySelectorAll('input[type="radio"]');
        if (radioButtons && radioButtons[prevIndex]) {
          radioButtons[prevIndex].focus();
        }
      }
    },
    [options, handleChange]
  );

  // 验证props after hooks
  if (!name) {
    console.error('[RadioButtonGroup] "name" prop is required for radio button groups');
  }

  if (!Array.isArray(options) || options.length === 0) {
    console.warn('[RadioButtonGroup] "options" should be a non-empty array');
    return null;
  }

  // 检测选项数量，应用对应的布局样式
  const optionCountClass = (() => {
    const count = options.length;
    if (count <= 4) return styles.options4;
    if (count === 5) return styles.options5;
    if (count >= 10) return styles.options10;
    return styles.optionsDefault;
  })();

  return (
    <div
      ref={radioGroupRef}
      className={`${styles.radioButtonGroup} ${
        orientation === 'horizontal' ? styles.horizontal : styles.vertical
      } ${optionCountClass}`}
      role="radiogroup"
      aria-label={ariaLabel || '单选项组'}
      aria-disabled={disabled}
    >
      {options.map((option, index) => {
        const isChecked = value === option.value;
        const radioId = `${name}-${option.value}`;

        return (
          <label
            key={option.value}
            htmlFor={radioId}
            className={`${styles.radioLabel} ${isChecked ? styles.checked : ''} ${
              disabled ? styles.disabled : ''
            }`}
          >
            <input
              type="radio"
              id={radioId}
              name={name}
              value={option.value}
              checked={isChecked}
              onChange={() => handleChange(option.value)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              disabled={disabled}
              className={styles.radioInput}
              aria-checked={isChecked}
            />
            <span className={styles.radioControl}>
              <span className={styles.radioIndicator}></span>
            </span>
            <span className={styles.radioText}>{option.label}</span>
          </label>
        );
      })}
    </div>
  );
};

RadioButtonGroup.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.string.isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  disabled: PropTypes.bool,
  ariaLabel: PropTypes.string,
};

export default RadioButtonGroup;
