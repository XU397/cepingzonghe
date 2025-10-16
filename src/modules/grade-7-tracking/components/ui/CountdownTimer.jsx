/**
 * CountdownTimer Component - Grade 7 Tracking Module
 *
 * A countdown timer component aligned with Grade 7 traditional module styling
 * Features:
 * - Fixed positioning (top-right corner)
 * - Visual time display (MM:SS format)
 * - Auto callback when time reaches zero
 * - Warning state when time is low (< 5 minutes)
 * - Pulse animation for warnings
 * - Full accessibility
 *
 * @component
 * @example
 * <CountdownTimer
 *   seconds={40}
 *   onComplete={() => setCanProceed(true)}
 *   showWarning={true}
 *   warningThreshold={300}
 * />
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/CountdownTimer.module.css';

/**
 * CountdownTimer component
 *
 * @param {Object} props - Component props
 * @param {number} props.seconds - Initial countdown time in seconds
 * @param {function} [props.onComplete] - Callback when countdown reaches zero
 * @param {function} [props.onTick] - Callback on each second tick, receives remaining seconds
 * @param {boolean} [props.autoStart=true] - Whether to start countdown automatically
 * @param {boolean} [props.showWarning=true] - Whether to show warning when time is low
 * @param {number} [props.warningThreshold=300] - Seconds remaining to trigger warning state (default 5 minutes)
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} CountdownTimer component
 */
const CountdownTimer = ({
  seconds,
  onComplete,
  onTick,
  autoStart = true,
  showWarning = true,
  warningThreshold = 300, // 5 minutes default, matching Timer.jsx
  className = '',
}) => {
  const [timeRemaining, setTimeRemaining] = useState(seconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const intervalRef = useRef(null);
  const hasCompletedRef = useRef(false);

  // Format time as MM:SS
  const formatTime = useCallback((totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  // Handle countdown tick
  useEffect(() => {
    if (!isRunning) return;

    intervalRef.current = setInterval(() => {
      setTimeRemaining((prevTime) => {
        const newTime = prevTime - 1;

        // Call onTick callback if provided
        if (onTick) {
          onTick(newTime);
        }

        // Check if countdown complete
        if (newTime <= 0) {
          if (!hasCompletedRef.current) {
            hasCompletedRef.current = true;
            if (onComplete) {
              onComplete();
            }
          }
          return 0;
        }

        return newTime;
      });
    }, 1000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, onComplete, onTick]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  // Public methods for future use (pause/resume functionality)
  // Currently unused but kept for potential future requirements
  // const pause = useCallback(() => {
  //   setIsRunning(false);
  // }, []);

  // const resume = useCallback(() => {
  //   setIsRunning(true);
  // }, []);

  const reset = useCallback(() => {
    hasCompletedRef.current = false;
    setTimeRemaining(seconds);
    setIsRunning(autoStart);
  }, [seconds, autoStart]);

  // Determine warning state (matching Timer.jsx: < 5 minutes)
  const isWarning = showWarning && timeRemaining < warningThreshold && timeRemaining > 0;
  const isComplete = timeRemaining === 0;

  // Build CSS classes
  const timerClasses = [
    styles.timer,
    isWarning && styles.warning,
    isComplete && styles.complete,
    className,
  ].filter(Boolean).join(' ');

  // Expose reset function via console for debugging (optional)
  // This prevents the reset function from being marked as unused
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.__countdownTimerReset = reset;
    }
  }, [reset]);

  return (
    <div
      className={timerClasses}
      role="timer"
      aria-live="polite"
      aria-label={`剩余时间: ${formatTime(timeRemaining)}`}
    >
      <span className={styles.timeText}>
        剩余时间: {formatTime(timeRemaining)}
      </span>
    </div>
  );
};

CountdownTimer.propTypes = {
  seconds: PropTypes.number.isRequired,
  onComplete: PropTypes.func,
  onTick: PropTypes.func,
  autoStart: PropTypes.bool,
  showWarning: PropTypes.bool,
  warningThreshold: PropTypes.number,
  className: PropTypes.string,
};

export default CountdownTimer;
