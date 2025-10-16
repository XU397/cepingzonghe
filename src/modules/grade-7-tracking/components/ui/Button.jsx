/**
 * Button Component - Grade 7 Tracking Module
 *
 * A reusable button component with support for:
 * - Multiple style variants (primary, secondary, danger)
 * - Disabled state
 * - Loading state with spinner
 * - Full accessibility support
 *
 * @component
 * @example
 * <Button onClick={handleClick} variant="primary">
 *   Click Me
 * </Button>
 */

import { useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/Button.module.css';

/**
 * Button component
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Button content (text, icons, etc.)
 * @param {function} [props.onClick] - Click handler function
 * @param {('primary'|'secondary'|'danger')} [props.variant='primary'] - Button style variant
 * @param {boolean} [props.disabled=false] - Whether button is disabled
 * @param {boolean} [props.loading=false] - Whether button is in loading state
 * @param {('button'|'submit'|'reset')} [props.type='button'] - HTML button type
 * @param {string} [props.className] - Additional CSS classes
 * @param {string} [props.ariaLabel] - Accessible label for screen readers
 * @returns {JSX.Element} Button component
 */
const Button = ({
  children,
  onClick,
  variant = 'primary',
  disabled = false,
  loading = false,
  type = 'button',
  className = '',
  ariaLabel,
}) => {
  // Handle click event
  const handleClick = useCallback((event) => {
    if (disabled || loading) {
      event.preventDefault();
      return;
    }
    if (onClick) {
      onClick(event);
    }
  }, [onClick, disabled, loading]);

  // Build CSS classes
  const buttonClasses = [
    styles.button,
    styles[variant],
    disabled && styles.disabled,
    loading && styles.loading,
    className,
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-busy={loading}
    >
      {loading && (
        <span className={styles.spinner} aria-hidden="true">
          <span className={styles.spinnerIcon}></span>
        </span>
      )}
      <span className={loading ? styles.buttonTextLoading : styles.buttonText}>
        {children}
      </span>
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger']),
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default Button;
