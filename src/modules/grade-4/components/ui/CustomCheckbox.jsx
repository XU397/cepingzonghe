/**
 * 自定义复选框组件
 * 提供方形选择框的视觉样式和交互功能，符合PDF设计要求
 */

import { useCallback } from 'react';
import './CustomCheckbox.css';

/**
 * 自定义复选框组件
 * @param {Object} props - 组件属性
 * @param {string|number} props.id - 复选框的唯一标识符
 * @param {string} props.label - 复选框显示的文本标签
 * @param {boolean} props.checked - 复选框是否被选中
 * @param {function} props.onChange - 选择状态变化时的回调函数
 * @param {boolean} [props.disabled=false] - 是否禁用复选框
 * @param {string} [props.className] - 额外的CSS类名
 * @returns {JSX.Element} 自定义复选框组件
 */
const CustomCheckbox = ({ 
  id, 
  label, 
  checked, 
  onChange, 
  disabled = false,
  className = ''
}) => {
  // 处理键盘导航
  const handleKeyDown = useCallback((event) => {
    if (disabled) return;
    
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onChange();
    }
  }, [onChange, disabled]);

  // 处理点击事件
  const handleClick = useCallback(() => {
    if (disabled) return;
    onChange();
  }, [onChange, disabled]);

  const containerClasses = [
    'custom-checkbox',
    checked ? 'checked' : '',
    disabled ? 'disabled' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={containerClasses}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="checkbox"
      aria-checked={checked}
      aria-disabled={disabled}
      aria-labelledby={`checkbox-label-${id}`}
      tabIndex={disabled ? -1 : 0}
    >
      <div className="checkbox-box">
        {checked && (
          <div className="checkmark" aria-hidden="true">
            ✓
          </div>
        )}
      </div>
      <span 
        id={`checkbox-label-${id}`}
        className="checkbox-label"
      >
        {label}
      </span>
    </div>
  );
};

export default CustomCheckbox;