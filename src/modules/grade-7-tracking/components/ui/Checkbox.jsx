/**
 * Checkbox Component - Grade 7 Tracking Module
 *
 * A controlled checkbox component with:
 * - Square selection box with checkmark
 * - Keyboard navigation support
 * - Disabled state
 * - Full accessibility
 *
 * @component
 * @example
 * <Checkbox
 *   id="notice-1"
 *   label="我已阅读注意事项"
 *   checked={checked}
 *   onChange={() => setChecked(!checked)}
 * />
 */

import { useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/Checkbox.module.css';

/**
 * Checkbox component
 *
 * @param {Object} props - Component props
 * @param {string|number} props.id - Unique identifier for the checkbox
 * @param {string} props.label - Label text displayed next to checkbox
 * @param {boolean} props.checked - Whether checkbox is checked (controlled)
 * @param {function} props.onChange - Callback function when checked state changes
 * @param {boolean} [props.disabled=false] - Whether checkbox is disabled
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Checkbox component
 */
const Checkbox = ({
  id,
  label,
  checked,
  onChange,
  disabled = false,
  className = '',
}) => {
  // Handle keyboard navigation (Space/Enter to toggle)
  const handleKeyDown = useCallback((event) => {
    if (disabled) return;

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onChange(!checked);
    }
  }, [onChange, disabled, checked]);

  // Handle click event
  const handleClick = useCallback(() => {
    if (disabled) return;
    onChange(!checked);
  }, [onChange, disabled, checked]);

  // Build CSS classes
  const containerClasses = [
    styles.checkboxContainer,
    checked && styles.checked,
    disabled && styles.disabled,
    className,
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
      <div className={styles.checkboxBox}>
        {checked && (
          <div className={styles.checkmark} aria-hidden="true">
            ✓
          </div>
        )}
      </div>
      <span
        id={`checkbox-label-${id}`}
        className={styles.checkboxLabel}
      >
        {label}
      </span>
    </div>
  );
};

Checkbox.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  label: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  className: PropTypes.string,
};

export default Checkbox;
