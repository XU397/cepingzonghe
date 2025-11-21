import React, { useEffect, useState, useRef } from 'react';
import { useDroneImagingContext } from '../context/DroneImagingContext';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import styles from '../styles/Page01_Cover.module.css';

/**
 * Page01_Cover - Cover/Introduction Page
 *
 * FR-001, FR-002: First page of the drone imaging submodule.
 * - 40-second countdown timer before checkbox can be enabled
 * - Checkbox must be checked to proceed
 * - Validation with error message
 * - CLICK_BLOCKED event on validation failure
 */
export default function Page01_Cover() {
  const { logOperation, navigateToPage, setAnswer } = useDroneImagingContext();

  // State for countdown and checkbox
  const [countdown, setCountdown] = useState(40);
  const [isChecked, setIsChecked] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Page enter/exit logging
  useEffect(() => {
    logOperation({
      targetElement: 'page',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page01_Cover',
      time: formatTimestamp(new Date()),
    });

    return () => {
      logOperation({
        targetElement: 'page',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page01_Cover',
        time: formatTimestamp(new Date()),
      });
    };
  }, [logOperation]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      return undefined;
    }

    timerRef.current = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [countdown]);

  // Handle checkbox change
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsChecked(checked);
    setError('');

    logOperation({
      targetElement: 'P1_确认阅读',
      eventType: checked ? EventTypes.CHECKBOX_CHECK : EventTypes.CHECKBOX_UNCHECK,
      value: checked ? 'checked' : 'unchecked',
      time: formatTimestamp(new Date()),
    });

    // Save answer for Flow-level validation
    setAnswer('P1_确认阅读', checked ? '已确认' : '');
  };

  // Handle next button click (used by Flow frame fallback)
  const handleNext = () => {
    // Validate checkbox is checked
    if (!isChecked) {
      setError('请先阅读注意事项并勾选确认后再继续');

      // Log CLICK_BLOCKED event
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: 'checkbox_not_checked',
        time: formatTimestamp(new Date()),
      });
      return;
    }

    // Log successful click
    logOperation({
      targetElement: 'next_button',
      eventType: EventTypes.CLICK,
      value: 'navigate_to_background',
      time: formatTimestamp(new Date()),
    });

    const frameNextButton = document.querySelector<HTMLButtonElement>(
      '[data-testid="frame-next-button"]',
    );
    if (frameNextButton) {
      frameNextButton.click();
      return;
    }

    // Fallback for standalone (non-Flow) usage
    navigateToPage('background');
  };

  // Determine countdown display state
  const isCountdownActive = countdown > 0;

  return (
    <div className={styles.coverContainer} data-testid="page-cover">
      <div className={styles.coverContent}>
        {/* Title section */}
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            无人机航拍科学探究
            <span className={styles.titleUnderline} />
          </h1>
        </div>

        {/* Notice area with badge */}
        <div className={styles.noticeArea}>
          <span className={styles.noticeBadge}>注意事项</span>
          <ul className={styles.noticeList}>
            <li>
              作答时间为 <span className={styles.highlightBold}>20 分钟</span>，时间结束后，系统将自动跳转到下一个测评环节。
            </li>
            <li>
              请按顺序回答每页问题，
              <span className={styles.highlight}>上一页题目未完成作答，将无法点击进入下一页</span>。
            </li>
            <li>
              答题时，
              <span className={styles.highlightBold}>不要提前点击“下一页”</span>
              查看后面的内容，
              <span className={styles.highlight}>否则将无法返回上一页</span>。
            </li>
            <li>
              遇到系统故障、死机、死循环等特殊情况时，
              <span className={styles.highlightBold}>请举手示意老师</span>。
            </li>
          </ul>
        </div>

        {/* Confirmation box */}
        <div className={styles.confirmationBox} data-testid="confirmation-box">
          {/* Checkbox */}
          <div className={styles.checkboxWrapper}>
            <label
              className={`${styles.checkboxLabel} ${
                isCountdownActive ? styles.disabled : ''
              }`}
            >
              <input
                type="checkbox"
                className={styles.checkbox}
                checked={isChecked}
                onChange={handleCheckboxChange}
                disabled={isCountdownActive}
                data-testid="confirm-checkbox"
              />
              <span className={styles.checkboxText}>我已阅读并理解以上注意事项</span>
            </label>
          </div>

          {/* Countdown button - hidden once countdown completes */}
          {isCountdownActive && (
            <div className={styles.countdownButton} data-testid="countdown-display">
              请仔细阅读注意事项，{countdown} 秒后可勾选确认……
            </div>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className={styles.errorMessage} data-testid="error-message">
            {error}
          </div>
        )}

        {/* Hidden next button for Flow frame fallback (not visible in UI) */}
        <button
          type="button"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: 0,
            opacity: 0,
            pointerEvents: 'none',
            border: 0,
          }}
          tabIndex={-1}
          onClick={handleNext}
          data-testid="next-button"
          aria-hidden="true"
        >
          开始学习
        </button>
      </div>
    </div>
  );
}

