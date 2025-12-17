import { useEffect, useRef, useState } from 'react';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { isReservedElement } from '@shared/services/submission/submoduleAdapter';
import { NOTICE_ITEMS, NOTICE_CHECKBOX_LABEL } from '../constants/noticesContent';
import { useG4Context } from '../context/G4Context';
import styles from './Page01_Notices.module.css';

function Page01_Notices() {
  const {
    state,
    logOperation,
    confirmNotice,
    tickNoticeCountdown,
    validateCurrentPage,
    getCurrentMissingFields,
    targetPrefix,
  } = useG4Context();
  const { noticeCountdown, noticeConfirmed } = state;
  const [showError, setShowError] = useState(false);
  const initialCountdownRef = useRef(noticeCountdown);

  const pageTargetPrefix = targetPrefix || '';
  const checkboxTarget = `${pageTargetPrefix}注意事项确认`;
  const nextButtonTarget = isReservedElement('下一页按钮')
    ? '下一页按钮'
    : `${pageTargetPrefix}下一页按钮`;
  const pageTarget = isReservedElement('页面') ? '页面' : `${pageTargetPrefix}页面`;
  const timerTarget = `${pageTargetPrefix}阅读倒计时`;

  useEffect(() => {
    logOperation({
      targetElement: pageTarget,
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_01_注意事项',
    });
  }, [logOperation, pageTarget]);

  useEffect(() => {
    if (noticeCountdown <= 0) return undefined;

    const timerId = window.setInterval(() => {
      tickNoticeCountdown();
    }, 1000);

    if (noticeCountdown === initialCountdownRef.current) {
      logOperation({
        targetElement: timerTarget,
        eventType: EventTypes.TIMER_START,
        value: `${initialCountdownRef.current}s`,
      });
    }

    return () => window.clearInterval(timerId);
  }, [noticeCountdown, tickNoticeCountdown, logOperation, timerTarget]);

  useEffect(() => {
    if (noticeCountdown === 0) {
      logOperation({
        targetElement: timerTarget,
        eventType: EventTypes.TIMER_COMPLETE,
        value: 'reading',
      });
    }
  }, [noticeCountdown, logOperation, timerTarget]);

  const isCheckboxDisabled = noticeCountdown > 0;

  const handleCheckboxChange = (event) => {
    const checked = event.target.checked;
    confirmNotice(checked);

    if (checked && showError) {
      setShowError(false);
    }

    logOperation({
      targetElement: checkboxTarget,
      eventType: checked ? EventTypes.CHECKBOX_CHECK : EventTypes.CHECKBOX_UNCHECK,
      value: checked ? 'checked' : 'unchecked',
    });
  };

  const handleNextClick = async () => {
    if (!validateCurrentPage()) {
      const missing = getCurrentMissingFields();
      setShowError(true);

      logOperation({
        targetElement: nextButtonTarget,
        eventType: EventTypes.CLICK_BLOCKED,
        value: JSON.stringify({
          reason: 'validation_failed',
          missing,
        }),
      });
      return;
    }

    setShowError(false);

    logOperation({
      targetElement: nextButtonTarget,
      eventType: EventTypes.NEXT_CLICK,
      value: 'notices_next',
    });
    logOperation({
      targetElement: pageTarget,
      eventType: EventTypes.PAGE_EXIT,
      value: 'Page_01_注意事项',
    });

    const frameNextButton = document.querySelector('[data-testid="frame-next-button"]');
    if (frameNextButton) {
      frameNextButton.click();
    }
  };

  return (
    <div className={styles.page} data-testid="page-notices">
      <div className={styles.titleSection}>
        <h1 className={styles.title}>4年级火车购票-交互课堂</h1>
        <p className={styles.subtitle}>开始前请阅读并确认以下注意事项</p>
      </div>

      <div className={styles.noticeCard}>
        <span className={styles.readLabel}>请仔细阅读</span>
        <ul className={styles.noticeList}>
          {NOTICE_ITEMS.map((item) => (
            <li key={item.id} className={styles.noticeItem}>
              {item.text}
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.checkboxCard}>
        <div className={styles.checkboxRow}>
          <label className={`${styles.checkboxLabel} ${isCheckboxDisabled ? styles.disabled : ''}`}>
            <input
              type="checkbox"
              checked={noticeConfirmed}
              onChange={handleCheckboxChange}
              disabled={isCheckboxDisabled}
              className={styles.checkbox}
              data-testid="confirm-checkbox"
            />
            <span className={styles.checkboxText}>{NOTICE_CHECKBOX_LABEL}</span>
          </label>
          <span className={styles.countdownBadge}>
            {noticeCountdown > 0 ? `${noticeCountdown}s` : '已可继续'}
          </span>
        </div>

        {noticeCountdown > 0 && <p className={styles.countdownText}>请认真阅读，倒计时结束后再勾选确认。</p>}

        {showError && (
          <p className={styles.errorText}>
            {noticeCountdown > 0 ? '请等待倒计时结束后勾选确认' : '请勾选“我已阅读并理解火车购票注意事项”后继续'}
          </p>
        )}
      </div>

      {/* 隐藏的下一页按钮，用于 Frame 回调 */}
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
        onClick={handleNextClick}
        data-testid="next-button"
        aria-hidden="true"
      >
        下一页
      </button>
    </div>
  );
}

export default Page01_Notices;
