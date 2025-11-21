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
  const { logOperation, navigateToPage } = useDroneImagingContext();

  // State for reading timer
  const [readingTimer, setReadingTimer] = useState(5);
  const [isReadingComplete, setIsReadingComplete] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Page enter/exit logging
  useEffect(() => {
    logOperation({
      targetElement: 'page',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page02_Background',
      time: formatTimestamp(new Date()),
    });

    return () => {
      logOperation({
        targetElement: 'page',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page02_Background',
        time: formatTimestamp(new Date()),
      });
    };
  }, [logOperation]);

  // Reading timer
  useEffect(() => {
    if (readingTimer > 0) {
      timerRef.current = setTimeout(() => {
        setReadingTimer(prev => prev - 1);
      }, 1000);
    } else if (readingTimer === 0 && !isReadingComplete) {
      // Timer completed - log READING_COMPLETE event
      setIsReadingComplete(true);
      logOperation({
        targetElement: 'page',
        eventType: EventTypes.READING_COMPLETE,
        value: 'Page02_Background',
        time: formatTimestamp(new Date()),
      });
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [readingTimer, isReadingComplete, logOperation]);

  // Handle next button click
  const handleNext = () => {
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
    <div className={styles.backgroundContainer} data-testid="page-background">
      <h2 className={styles.pageTitle}>无人机航拍</h2>

      {/* Reading timer display */}
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

      {/* Split layout */}
      <div className={styles.splitLayout}>
        {/* Left content - text */}
        <div className={styles.leftContent}>
          <div className={`${styles.infoBox} ${styles.primary}`}>
            <p className={styles.infoBoxText}>
              无人机航拍技术是一种高效、灵活的遥感探测手段，已广泛应用于测绘、资源调查与应急救援等领域。在学校开展的无人机兴趣课上，同学们了解到，航拍成像的一个关键指标是"地面采样距离（GSD）",它决定了照片的清晰程度：GSD数值越大，图像就越模糊。同学们推测：无人机的飞行高度和镜头焦距可能是影响GSD的两个关键因素，并为此展开了实验探究。
            </p>
          </div>
        </div>

        {/* Right content - image */}
        <div className={styles.rightContent}>
          <img
            src={backgroundImage}
            alt="无人机航拍示意图"
            className={styles.backgroundImage}
          />
        </div>
      </div>

    </div>
  );
}
