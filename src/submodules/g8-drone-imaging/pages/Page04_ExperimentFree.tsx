import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDroneImagingContext } from '../context/DroneImagingContext';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import DroneSimulator from '../components/DroneSimulator';
import HeightSelector from '../components/HeightSelector';
import FocalLengthSelector from '../components/FocalLengthSelector';
import GSDDisplay from '../components/GSDDisplay';
import styles from '../styles/Page04_Experiment.module.css';

/**
 * Page04_ExperimentFree - Free Exploration Experiment Page
 *
 * Allows students to freely explore the relationship between:
 * - Drone flight height (100m, 200m, 300m)
 * - Camera focal length (8mm, 24mm, 50mm)
 * - Ground Sample Distance (GSD)
 *
 * Validation for Flow: must perform at least one capture before proceeding.
 */
export default function Page04_ExperimentFree() {
  const { experimentState, logOperation, capture, resetExperiment, getPagePrefix } = useDroneImagingContext();
  const pagePrefix = getPagePrefix(4);

  const { currentHeight } = experimentState;
  const [showFovCone, setShowFovCone] = useState(false);
  const [error, setError] = useState('');
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Capture is only enabled when a height is selected (not 0)
  const canCapture = currentHeight !== 0;

  // Cleanup on unmount
  useEffect(() => () => {
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
  }, []);

  // Handle capture/start experiment
  const handleCapture = useCallback(() => {
    // Only allow capture if height is selected
    if (!canCapture) return;

    // Trigger flash effect
    setShowFovCone(true);

    // Log the capture operation
    logOperation({
      targetElement: `${pagePrefix}capture_button`,
      eventType: EventTypes.SIMULATION_OPERATION,
      value: JSON.stringify({
        action: 'capture',
        height: experimentState.currentHeight,
        focal: experimentState.currentFocalLength,
        gsd: Number(experimentState.currentGSD.toFixed(2)),
      }),
      time: formatTimestamp(new Date()),
    });

    // Record capture in context
    capture();

    // Clear error and its timeout if exists
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setError('');

    // Hide FOV cone after a delay
    flashTimeoutRef.current = setTimeout(() => {
      setShowFovCone(false);
    }, 2000);
  }, [experimentState, capture, logOperation, canCapture, pagePrefix]);

  // Handle reset
  const handleReset = useCallback(() => {
    logOperation({
      targetElement: `${pagePrefix}reset_button`,
      eventType: EventTypes.SIMULATION_OPERATION,
      value: JSON.stringify({ action: 'reset_experiment' }),
      time: formatTimestamp(new Date()),
    });

    resetExperiment();
    setShowFovCone(false);

    // Clear any pending timeouts
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }
  }, [resetExperiment, logOperation, pagePrefix]);

  // Validate for Flow "next" – used by hidden button
  const handleNext = () => {
    if (!experimentState.captureHistory || experimentState.captureHistory.length === 0) {
      // Clear any existing error timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }

      // Set error message with shake animation
      setError('请至少完成一次实验操作后再继续');

      // Auto-clear error after 10 seconds
      errorTimeoutRef.current = setTimeout(() => {
        setError('');
        errorTimeoutRef.current = null;
      }, 10000);

      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: JSON.stringify({
          reason: 'no_experiment_capture',
          missing: ['experiment_captures'],
        }),
        time: formatTimestamp(new Date()),
      });
      return;
    }

    logOperation({
      targetElement: 'next_button',
      eventType: EventTypes.CLICK,
      value: 'navigate_to_focal_analysis',
      time: formatTimestamp(new Date()),
    });

    const frameNextButton = document.querySelector<HTMLButtonElement>(
      '[data-testid="frame-next-button"]',
    );
    if (frameNextButton) {
      frameNextButton.click();
    }
  };

  return (
    <div className={styles.experimentContainer} data-testid="page-experiment">
      {/* Two-column layout */}
      <div className={styles.twoColumnLayout}>
        {/* Left column: Instructions */}
        <div className={styles.leftPanel}>
          <h2 className={styles.panelTitle}>自由探索实验</h2>
          <p className={styles.introText}>
            接下来，我们将在计算机上通过模拟实验的方式开展探究。右侧为实验互动界面。
          </p>
          <ul className={styles.instructionList}>
            <li>
              单击左上方橙色框<span className={styles.sampleHeight}>100米</span><span className={styles.sampleHeight}>200米</span><span className={styles.sampleHeight}>300米</span>，可设置无人机飞行高度。
            </li>
            <li>
              单击下方 <span className={styles.arrowBtnUp}>▲</span><span className={styles.arrowBtnDown}>▼</span> 按钮，可调整镜头焦距。
            </li>
            <li>
              单击<span className={styles.sampleCapture}>拍照</span>按钮，无人机将自动拍摄一张航拍照片。
            </li>
            <li>
              实验结束后，在右上角绿色框<span className={styles.sampleGSD}>--</span>内查看所对应的地面采样距离（GSD）数值。
            </li>
            <li>
              单击<span className={styles.sampleReset}>重置</span>按钮，可重新开始。
            </li>
          </ul>

          {/* Error message for Flow validation */}
          {error && (
            <div className={styles.errorMessage} data-testid="error-message">
              {error}
            </div>
          )}
        </div>

        {/* Right column: Experiment unit (simulator + controls) */}
        <div className={styles.rightPanel}>
          <div className={styles.experimentUnit}>
            {/* Simulator wrapper with HeightSelector and GSDDisplay overlays */}
            <div className={styles.simulatorWrapper}>
              <DroneSimulator showFovCone={showFovCone} />
              <HeightSelector />
              <GSDDisplay />
            </div>

            {/* Control bar inside right panel */}
            <div className={styles.controlBar}>
              <button
                className={styles.resetBtn}
                onClick={handleReset}
                aria-label="重置实验"
                data-testid="reset-button"
              >
                重置
              </button>

              <FocalLengthSelector />

              <button
                className={`${styles.captureBtn} ${!canCapture ? styles.disabled : ''}`}
                onClick={handleCapture}
                disabled={!canCapture}
                aria-label="拍照记录"
                data-testid="capture-button"
              >
                拍照
              </button>
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

