import { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';

/**
 * 通用文本输入组件
 * 支持单行和多行文本输入，并记录焦点和失焦事件
 * 
 * @param {Object} props - 组件属性
 * @param {string} props.value - 输入框的值
 * @param {Function} props.onChange - 值变化时的回调函数
 * @param {string} props.placeholder - 占位提示文本
 * @param {boolean} props.isMultiline - 是否为多行文本输入
 * @param {Function} props.onFocus - 获取焦点时的回调函数
 * @param {Function} props.onBlur - 失去焦点时的回调函数
 * @param {string} props.elementDesc - 元素描述，用于日志记录
 * @param {string} props.label - 输入框标签
 * @param {boolean} props.required - 是否必填
 * @param {number} props.rows - 多行文本框的行数
 * @param {string} props.id - 输入框ID
 * @param {boolean} props.disabled - 是否禁用
 * @param {string} [props.className] - 外部传入的 CSS 类名
 * @param {Object} [props.style] - 外部传入的样式对象
 */
const TextInput = ({
  value = '',
  onChange,
  placeholder = '',
  isMultiline = false,
  onFocus,
  onBlur,
  elementDesc = '文本输入框',
  label = '',
  required = false,
  rows = 5,
  id,
  disabled = false,
  className = '',
  style,
  ...rest
}) => {
  const { logOperation } = useAppContext();
  const [isFocused, setIsFocused] = useState(false);
  const [timeoutId, setTimeoutId] = useState(null);
  
  // 清除定时器
  useEffect(() => {
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [timeoutId]);
  
  /**
   * 处理输入值变化
   * @param {Object} e - 事件对象
   */
  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange && onChange(newValue);
    
    // 如果用户停止输入一段时间后，记录操作
    if (timeoutId) clearTimeout(timeoutId);
    const newTimeoutId = setTimeout(() => {
      // 记录用户停止输入后的值
      logOperation({
        targetElement: elementDesc,
        eventType: 'INPUT_CHANGE',
        value: newValue.substring(0, 50) + (newValue.length > 50 ? '...' : '')
      });
    }, 1000);
    
    setTimeoutId(newTimeoutId);
  };
  
  /**
   * 处理获取焦点事件
   * @param {Object} e - 事件对象
   */
  const handleFocus = (e) => {
    setIsFocused(true);
    logOperation({
      targetElement: elementDesc,
      eventType: 'FOCUS'
    });
    onFocus && onFocus(e);
  };
  
  /**
   * 处理失去焦点事件
   * @param {Object} e - 事件对象
   */
  const handleBlur = (e) => {
    setIsFocused(false);
    logOperation({
      targetElement: elementDesc,
      eventType: 'BLUR',
      value: e.target.value.substring(0, 50) + (e.target.value.length > 50 ? '...' : '')
    });
    onBlur && onBlur(e);
  };
  
  // 动态生成输入框ID
  const inputId = id || `text-input-${elementDesc.replace(/\s+/g, '-').toLowerCase()}`;
  
  // Combine global class with any specific classes and external classNames
  const combinedClassName = `custom-text-input ${isMultiline ? 'textarea' : ''} ${isFocused ? 'focused' : ''} ${className}`.trim();

  return (
    <div className="form-control">
      {label && (
        <label 
          htmlFor={inputId} 
          className="input-label"
        >
          {label}{required && <span style={{ color: 'var(--danger-color)', marginLeft: '4px' }}>*</span>}
        </label>
      )}
      
      {isMultiline ? (
        <textarea
          id={inputId}
          className={combinedClassName}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          rows={rows}
          disabled={disabled}
          style={style}
          {...rest}
        />
      ) : (
        <input
          id={inputId}
          type="text"
          className={combinedClassName}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          style={style}
          {...rest}
        />
      )}
    </div>
  );
};

export default TextInput; 