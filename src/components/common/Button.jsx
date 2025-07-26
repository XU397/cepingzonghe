import PropTypes from 'prop-types';
import styles from './Button.module.css'; // CSS Module for styling

/**
 * @file Button.jsx
 * @description General-purpose button component.
 */

/**
 * General-purpose Button component.
 *
 * @param {object} props - The properties for the button.
 * @param {function} props.onClick - Function to call when the button is clicked.
 * @param {string} props.text - Text to display on the button.
 * @param {boolean} [props.disabled=false] - Whether the button is disabled.
 * @param {string} [props.variant='primary'] - Button style variant (e.g., 'primary', 'secondary', 'warning').
 * @param {string} [props.className] - Additional CSS classes for custom styling.
 * @param {React.ReactNode} [props.children] - Alternative to text prop, allows for complex content.
 * @param {string} [props.tooltipText] - Text to display on hover as a tooltip.
 * @returns {React.ReactElement} The button element.
 */
const Button = ({ 
  onClick, 
  text = null,
  disabled = false, 
  variant = 'primary', 
  className = '',
  children = null,
  tooltipText = null,
  ...rest // Allow other native button attributes like 'type'
}) => {
  const buttonContent = children || text;

  return (
    <button
      type="button" // Default to type button to prevent form submissions unless specified
      className={`
        ${styles.button} 
        ${styles[variant]} 
        ${disabled ? styles.disabled : ''}
        ${className}
      `}
      onClick={onClick}
      disabled={disabled}
      title={tooltipText} // HTML native tooltip
      {...rest}
    >
      {buttonContent}
    </button>
  );
};

Button.propTypes = {
  onClick: PropTypes.func.isRequired,
  text: PropTypes.string,
  children: PropTypes.node,
  disabled: PropTypes.bool,
  variant: PropTypes.oneOf(['primary', 'secondary', 'warning', 'success', 'danger', 'info', 'light', 'dark']),
  className: PropTypes.string,
  tooltipText: PropTypes.string,
};

export default Button; 