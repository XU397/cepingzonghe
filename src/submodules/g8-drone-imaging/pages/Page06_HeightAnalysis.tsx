import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDroneImagingContext } from '../context/DroneImagingContext';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import DroneSimulator from '../components/DroneSimulator';
import HeightSelector from '../components/HeightSelector';
import FocalLengthSelector from '../components/FocalLengthSelector';
import GSDDisplay from '../components/GSDDisplay';
import styles from '../styles/Page06_HeightAnalysis.module.css';

/**
 * Page06_HeightAnalysis - Height Analysis Page
 *
 * FR-009: Students analyze how flight height affects GSD at fixed focal length.
 * - Two-column layout: questions on left, experiment on right
 * - Radio option group (NOT textarea!)
 * - Question: '当镜头焦距相同时，飞行高度升高，GSD会如何变化？'
 * - Options: A. 增大, B. 减小, C. 不变
 * - Validation: must select to proceed
 * - targetElement: P<pageNumber>_GSD变化趋势（随 stepIndex 动态生成）
 * - RADIO_SELECT event logging
 */

interface RadioOption {
  value: string;
  label: string;
}

const RADIO_OPTIONS: RadioOption[] = [
  { value: 'A', label: 'A. 增大' },
  { value: 'B', label: 'B. 减小' },
  { value: 'C', label: 'C. 不变' },
];

export default function Page06_HeightAnalysis() {
  const {
    experimentState,
    logOperation,
    setAnswer,
    getAnswer,
    capture,
    resetExperiment,
    questionIds,
    getPagePrefix,
  } = useDroneImagingContext();
  const gsdTrendQuestionId = questionIds.gsdTrend;
  const pagePrefix = getPagePrefix(6);

  // State
  const [selectedValue, setSelectedValue] = useState(getAnswer(gsdTrendQuestionId) || '');
  const [error, setError] = useState('');
  const [showFovCone, setShowFovCone] = useState(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { currentHeight } = experimentState;
  const canCapture = currentHeight !== 0;

  // Clear any pending timeouts on unmount
  useEffect(() => () => {
    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }
  }, []);

  // Handle radio selection
  const handleRadioChange = (option: RadioOption) => {
    const value = option.value;
    setSelectedValue(value);

    // Clear error and its timeout if exists
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    setError('');

    // Save answer
    setAnswer(gsdTrendQuestionId, option.label);

    // Log RADIO_SELECT event
    logOperation({
      targetElement: gsdTrendQuestionId,
      eventType: EventTypes.RADIO_SELECT,
      value: value,
      time: formatTimestamp(new Date()),
    });
  };

  // Handle capture
  const handleCapture = useCallback(() => {
    if (!canCapture) return;

    setShowFovCone(true);

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

    capture();

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

    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }
  }, [resetExperiment, logOperation, pagePrefix]);

  // Handle next button click (used by Flow frame fallback)
  const handleNext = () => {
    // Validate selection
    if (!selectedValue) {
      // Clear any existing error timeout
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }

      // Set error message with shake animation
      setError('请选择一个答案后再继续');

      // Auto-clear error after 10 seconds
      errorTimeoutRef.current = setTimeout(() => {
        setError('');
        errorTimeoutRef.current = null;
      }, 10000);

      // Log CLICK_BLOCKED event
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: JSON.stringify({
          reason: 'no_selection',
          missing: [gsdTrendQuestionId],
        }),
        time: formatTimestamp(new Date()),
      });
      return;
    }

    // Log successful click
    logOperation({
      targetElement: 'next_button',
      eventType: EventTypes.CLICK,
      value: 'navigate_to_conclusion',
      time: formatTimestamp(new Date()),
    });

    const frameNextButton =
      document.querySelector<HTMLButtonElement>('[data-testid="frame-next-button"]');
    if (frameNextButton) {
      frameNextButton.click();
    }
  };

  return (
    <div className={styles.analysisContainer} data-testid="page-height-analysis">
      {/* Two-column layout */}
      <div className={styles.twoColumnLayout}>
        {/* Left column: Experiment unit */}
        <div className={styles.leftPanel}>
          <div className={styles.experimentUnit}>
            {/* Simulator wrapper with HeightSelector and GSDDisplay overlays */}
            <div className={styles.simulatorWrapper}>
              <DroneSimulator showFovCone={showFovCone} />
              <HeightSelector />
              <GSDDisplay />
            </div>

            {/* Control bar */}
            <div className={styles.controlBar}>
              <button
                className={styles.resetBtn}
                onClick={handleReset}
                aria-label="重置实验"
              >
                重置
              </button>

              <FocalLengthSelector />

              <button
                className={`${styles.captureBtn} ${!canCapture ? styles.disabled : ''}`}
                onClick={handleCapture}
                disabled={!canCapture}
                aria-label="拍照记录"
              >
                拍照
              </button>
            </div>
          </div>
        </div>

        {/* Right column: Questions */}
        <div className={styles.rightPanel}>
          <h2 className={styles.panelTitle}>高度分析</h2>

          {/* Question box */}
          <div className={styles.questionBox}>
            <p className={styles.questionText}>
              <strong>问题3：</strong> 根据模拟实验，随着飞行高度的增加，地面采样距离（GSD）呈现出怎样的变化趋势？
            </p>
          </div>

          {/* Radio group */}
          <div className={styles.radioGroup} data-testid="height-radio-group">
            {RADIO_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`${styles.radioOption} ${selectedValue === option.value ? styles.selected : ''}`}
              >
                <input
                  type="radio"
                  name="height_analysis"
                  value={option.value}
                  checked={selectedValue === option.value}
                  onChange={() => handleRadioChange(option)}
                  className={styles.radioInput}
                  data-testid={`radio-height-${option.value}`}
                />
                <span className={styles.radioLabel}>{option.label}</span>
              </label>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className={styles.errorMessage} data-testid="error-message">
              {error}
            </div>
          )}
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
