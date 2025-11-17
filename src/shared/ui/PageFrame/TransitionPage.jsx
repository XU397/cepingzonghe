import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import styles from './transition.module.css';

const STATUS_ICONS = {
  success: '✅',
  info: 'ℹ️',
  warning: '⚠️',
};

export function TransitionPage({
  title = '已完成当前部分',
  message = '请稍候，系统将引导你进入下一部分。',
  detail,
  tip,
  status = 'success',
  icon,
  autoNextSeconds = 0,
  onNext,
  buttonLabel = '继续',
  secondaryActionLabel,
  onSecondaryAction,
  children,
}) {
  const [counter, setCounter] = useState(autoNextSeconds);

  useEffect(() => {
    if (!autoNextSeconds || autoNextSeconds <= 0) {
      setCounter(0);
      return undefined;
    }
    setCounter(autoNextSeconds);
    let cancelled = false;
    const timer = setInterval(() => {
      setCounter((prev) => {
        if (prev <= 1) {
          if (!cancelled) {
            clearInterval(timer);
            onNext?.();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [autoNextSeconds, onNext]);

  const resolvedIcon = useMemo(() => {
    if (icon) return icon;
    return STATUS_ICONS[status] || STATUS_ICONS.success;
  }, [icon, status]);

  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${styles[status] || ''}`}>
        <div className={styles.icon} aria-hidden="true">
          {resolvedIcon}
        </div>

        <h1 className={styles.title}>{title}</h1>
        {message && <p className={styles.message}>{message}</p>}
        {detail && <p className={styles.detail}>{detail}</p>}
        {children}

        {counter > 0 && (
          <p className={styles.countdown}>
            将在 <strong>{counter}</strong> 秒后自动继续
          </p>
        )}

        {(onNext || onSecondaryAction) && (
          <div className={styles.actions}>
            {onNext && (
              <button type="button" className={styles.primary} onClick={onNext}>
                {counter > 0 ? '立即继续' : buttonLabel}
              </button>
            )}
            {onSecondaryAction && (
              <button type="button" className={styles.secondary} onClick={onSecondaryAction}>
                {secondaryActionLabel || '稍后处理'}
              </button>
            )}
          </div>
        )}

        {tip && <div className={styles.tip}>{tip}</div>}
      </div>
    </div>
  );
}

TransitionPage.propTypes = {
  title: PropTypes.string,
  message: PropTypes.string,
  detail: PropTypes.string,
  tip: PropTypes.string,
  status: PropTypes.oneOf(['success', 'info', 'warning']),
  icon: PropTypes.node,
  autoNextSeconds: PropTypes.number,
  onNext: PropTypes.func,
  buttonLabel: PropTypes.string,
  secondaryActionLabel: PropTypes.string,
  onSecondaryAction: PropTypes.func,
  children: PropTypes.node,
};

export default TransitionPage;
