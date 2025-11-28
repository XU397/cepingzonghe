import React, { useEffect, useState, useRef } from 'react';
import { useDroneImagingContext } from '../context/DroneImagingContext';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import styles from '../styles/Page02_Background.module.css';
import backgroundImage from '../assets/images/p01.jpg';

/**
 * Page02_Background - Background Information Page
 *
 * FR-003: Introduces the concept of GSD and drone aerial photography.
 * - 5-second forced reading timer
 * - Next button disabled until timer completes
 * - READING_COMPLETE event when timer finishes
 * - Split layout: text on left, image placeholder on right
 */
export default function Page02_Background() {
  const { logOperation, navigateToPage, getPagePrefix } = useDroneImagingContext();
  const pagePrefix = getPagePrefix(2);

  // State for reading timer
  const [readingTimer, setReadingTimer] = useState(5);
  const [isReadingComplete, setIsReadingComplete] = useState(false);
  const [error, setError] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const readingTimerStopRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Page enter/exit logging
  useEffect(() => {
    logOperation({
      targetElement: 'page',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page02_Background',
      time: formatTimestamp(new Date()),
    });

    logOperation({
      targetElement: `${pagePrefix}reading_timer`,
      eventType: EventTypes.TIMER_START,
      value: JSON.stringify({ duration: 5, unit: 'seconds' }),
      time: formatTimestamp(new Date()),
    });

    readingTimerStopRef.current = setTimeout(() => {
      logOperation({
        targetElement: `${pagePrefix}reading_timer`,
        eventType: EventTypes.TIMER_STOP,
        value: JSON.stringify({ reason: 'countdown_finished', elapsed: 5 }),
        time: formatTimestamp(new Date()),
      });
      logOperation({
        targetElement: 'page',
        eventType: EventTypes.READING_COMPLETE,
        value: 'Page02_Background',
        time: formatTimestamp(new Date()),
      });
      setIsReadingComplete(true);
    }, 5000);

    return () => {
      if (readingTimerStopRef.current) {
        clearTimeout(readingTimerStopRef.current);
      }
      logOperation({
        targetElement: 'page',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page02_Background',
        time: formatTimestamp(new Date()),
      });
    };
  }, [logOperation, pagePrefix]);

  // Reading timer
  useEffect(() => {
    if (isReadingComplete) {
      return undefined;
    }

    if (readingTimer >= 0) {
      timerRef.current = setTimeout(() => {
        setReadingTimer(prev => prev - 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [readingTimer, isReadingComplete]);

  // Auto-hide error message after 5 seconds
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError('');
    }, 5000);

    return () => clearTimeout(timer);
  }, [error]);

  // Handle next button click
  const handleNext = () => {
    // Check if reading is complete
    if (!isReadingComplete) {
      setError('请阅读完所有内容后再继续');
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: JSON.stringify({
          reason: 'reading_not_complete',
          remaining_time: readingTimer,
        }),
        time: formatTimestamp(new Date()),
      });
      return;
    }

    logOperation({
      targetElement: 'next_button',
      eventType: EventTypes.CLICK,
      value: 'navigate_to_hypothesis',
      time: formatTimestamp(new Date()),
    });

    const frameNextButton =
      document.querySelector<HTMLButtonElement>('[data-testid=\"frame-next-button\"]');
    if (frameNextButton) {
      frameNextButton.click();
    }
  };

  return (
    <div className={styles.container} data-testid="page-background">
      <div className={styles.content}>
        <h1 className={styles.title}>无人机航拍探究</h1>

        {/* Reading timer display - hidden when complete */}
        {!isReadingComplete && (
          <div className={styles.timerDisplay} data-testid="reading-timer">
            <span className={styles.timerIcon}>&#128337;</span>
            {readingTimer > 0 ? (
              <>
                <span className={styles.timerText}>请阅读以下内容</span>
                <span className={styles.timerCount} data-testid="timer-count">{readingTimer}秒</span>
              </>
            ) : (
              <span className={`${styles.timerText} ${styles.timerComplete}`} data-testid="timer-complete">
                阅读完成，可以继续
              </span>
            )}
          </div>
        )}

        {/* Error message for validation */}
        {error && (
          <div className={styles.errorMessage} data-testid="error-message">
            {error}
          </div>
        )}

        {/* Main layout: text on left, image on right */}
        <div className={styles.mainLayout}>
          {/* Left text section */}
          <div className={styles.textSection}>
            <h2 className={styles.sectionTitle}>
              <span className={styles.icon}>📐</span>
              实验背景
            </h2>

            <p className={styles.description}>
              无人机航拍技术是一种高效、灵活的遥感探测手段，已广泛应用于测绘、资源调查与应急救援等领域。在学校开展的无人机兴趣课上，同学们了解到，航拍成像的一个关键指标是"地面采样距离（GSD）",它决定了照片的清晰程度：GSD数值越大，图像就越模糊。
            </p>

            <div className={styles.highlightBox}>
              <h3 className={styles.highlightTitle}>
                <span className={styles.icon}>🔬</span>
                探究目标
              </h3>
              <p className={styles.highlightText}>
                同学们推测：无人机的飞行高度和镜头焦距可能是影响GSD的两个关键因素，并为此展开了实验探究。让我们一起来验证这个假设，探索影响航拍清晰度的奥秘。
              </p>
            </div>
          </div>

          {/* Right image section */}
          <div className={styles.imageSection}>
            <div className={styles.imageItem}>
              <div className={styles.imageWrapper}>
                <img
                  src={backgroundImage}
                  alt="无人机航拍示意图"
                  className={styles.droneImage}
                />
                <span className={`${styles.imageBadge} ${styles.badgePrimary}`}>
                  航拍技术
                </span>
              </div>
              <p className={styles.imageLabel}>无人机航拍成像示意</p>
            </div>
          </div>
        </div>
      </div>

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
        下一步
      </button>
    </div>
  );
}
