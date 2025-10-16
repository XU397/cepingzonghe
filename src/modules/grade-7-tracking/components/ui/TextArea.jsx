/**
 * TextArea Component - Grade 7 Tracking Module
 *
 * A controlled textarea component with:
 * - Character count display
 * - Maximum length limit
 * - Placeholder support
 * - Auto-resize option
 * - Full accessibility
 *
 * @component
 * @example
 * <TextArea
 *   id="hypothesis"
 *   value={text}
 *   onChange={setText}
 *   maxLength={500}
 *   placeholder="请输入您的假设..."
 *   showCharCount={true}
 * />
 */

import { useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/TextArea.module.css';

/**
 * TextArea component
 *
 * @param {Object} props - Component props
 * @param {string} props.id - Unique identifier for the textarea
 * @param {string} props.value - Current text value (controlled)
 * @param {function} props.onChange - Callback when text changes, receives new value
 * @param {string} [props.placeholder] - Placeholder text
 * @param {number} [props.maxLength] - Maximum number of characters allowed
 * @param {boolean} [props.showCharCount=false] - Whether to show character count
 * @param {boolean} [props.disabled=false] - Whether textarea is disabled
 * @param {boolean} [props.autoResize=false] - Whether to auto-resize based on content
 * @param {number} [props.rows=4] - Initial number of rows
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.ariaLabel] - Accessible label for screen readers
 * @returns {JSX.Element} TextArea component
 */
const TextArea = ({
  id,
  value,
  onChange,
  placeholder = '',
  maxLength,
  showCharCount = false,
  disabled = false,
  autoResize = false,
  rows = 4,
  className = '',
  ariaLabel,
}) => {
  const textareaRef = useRef(null);

  // Handle text change
  const handleChange = useCallback((event) => {
    const newValue = event.target.value;

    // Enforce max length if specified
    if (maxLength && newValue.length > maxLength) {
      return;
    }

    onChange(newValue);
  }, [onChange, maxLength]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      // Reset height to auto to get proper scrollHeight
      textarea.style.height = 'auto';
      // Set height to scrollHeight to fit content
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }, [value, autoResize]);

  // Calculate remaining characters
  const remainingChars = maxLength ? maxLength - value.length : null;
  const isNearLimit = maxLength && remainingChars <= maxLength * 0.1; // 10% threshold

  // Build CSS classes
  const containerClasses = [
    styles.textareaContainer,
    disabled && styles.disabled,
    className,
  ].filter(Boolean).join(' ');

  const textareaClasses = [
    styles.textarea,
    isNearLimit && styles.nearLimit,
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      <textarea
        ref={textareaRef}
        id={id}
        className={textareaClasses}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        aria-label={ariaLabel}
        aria-describedby={showCharCount ? `${id}-char-count` : undefined}
      />
      {showCharCount && maxLength && (
        <div
          id={`${id}-char-count`}
          className={[
            styles.charCount,
            isNearLimit && styles.charCountWarning,
          ].filter(Boolean).join(' ')}
          aria-live="polite"
        >
          {remainingChars} / {maxLength} 字符
        </div>
      )}
    </div>
  );
};

TextArea.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  maxLength: PropTypes.number,
  showCharCount: PropTypes.bool,
  disabled: PropTypes.bool,
  autoResize: PropTypes.bool,
  rows: PropTypes.number,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default TextArea;
