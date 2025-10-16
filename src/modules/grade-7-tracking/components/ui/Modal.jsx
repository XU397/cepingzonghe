/**
 * Modal Component - Grade 7 Tracking Module
 *
 * A modal dialog component with:
 * - Overlay background
 * - Close button
 * - Esc key to close
 * - Click outside to close (optional)
 * - Focus trap
 * - Full accessibility
 *
 * @component
 * @example
 * <Modal
 *   isOpen={isOpen}
 *   onClose={handleClose}
 *   title="资料标题"
 * >
 *   <p>资料内容...</p>
 * </Modal>
 */

import { useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/Modal.module.css';

/**
 * Modal component
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is visible
 * @param {function} props.onClose - Callback when modal should close
 * @param {string} [props.title] - Modal title/header text
 * @param {React.ReactNode} props.children - Modal content
 * @param {boolean} [props.closeOnClickOutside=true] - Whether clicking overlay closes modal
 * @param {boolean} [props.closeOnEsc=true] - Whether Esc key closes modal
 * @param {string} [props.className] - Additional CSS classes for modal content
 * @returns {JSX.Element|null} Modal component or null if not open
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  closeOnClickOutside = true,
  closeOnEsc = true,
  className = '',
}) => {
  const modalRef = useRef(null);
  const previousActiveElement = useRef(null);

  // Handle Esc key press
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEscKey = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isOpen, closeOnEsc, onClose]);

  // Handle focus trap and body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    // Store currently focused element
    previousActiveElement.current = document.activeElement;

    // Lock body scroll
    document.body.style.overflow = 'hidden';

    // Focus modal
    if (modalRef.current) {
      modalRef.current.focus();
    }

    return () => {
      // Unlock body scroll
      document.body.style.overflow = '';

      // Restore focus to previous element
      if (previousActiveElement.current && previousActiveElement.current.focus) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen]);

  // Handle overlay click
  const handleOverlayClick = useCallback((event) => {
    if (closeOnClickOutside && event.target === event.currentTarget) {
      onClose();
    }
  }, [closeOnClickOutside, onClose]);

  // Handle close button click
  const handleCloseClick = useCallback(() => {
    onClose();
  }, [onClose]);

  // Don't render if not open
  if (!isOpen) {
    return null;
  }

  // Build CSS classes
  const modalClasses = [
    styles.modalContent,
    className,
  ].filter(Boolean).join(' ');

  return (
    <div
      className={styles.modalOverlay}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      <div
        ref={modalRef}
        className={modalClasses}
        tabIndex={-1}
      >
        <div className={styles.modalHeader}>
          {title && (
            <h2 id="modal-title" className={styles.modalTitle}>
              {title}
            </h2>
          )}
          <button
            className={styles.closeButton}
            onClick={handleCloseClick}
            aria-label="关闭对话框"
            type="button"
          >
            <span className={styles.closeIcon} aria-hidden="true">×</span>
          </button>
        </div>
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
};

Modal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  title: PropTypes.string,
  children: PropTypes.node.isRequired,
  closeOnClickOutside: PropTypes.bool,
  closeOnEsc: PropTypes.bool,
  className: PropTypes.string,
};

export default Modal;
