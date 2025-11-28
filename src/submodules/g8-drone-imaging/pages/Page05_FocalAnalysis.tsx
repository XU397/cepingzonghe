import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useDroneImagingContext } from '../context/DroneImagingContext';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import DroneSimulator from '../components/DroneSimulator';
import HeightSelector from '../components/HeightSelector';
import FocalLengthSelector from '../components/FocalLengthSelector';
import GSDDisplay from '../components/GSDDisplay';
import styles from '../styles/Page05_FocalAnalysis.module.css';

/**
 * Page05_FocalAnalysis - Focal Length Analysis Page
 *
 * FR-009: Students analyze how focal length affects GSD at fixed height.
 * - Two-column layout: questions on left, experiment on right
 * - Radio option group (NOT textarea!)
 * - Question: '当飞行高度相同时，哪种焦距的GSD最小？'
 * - Options: A. 8毫米, B. 24毫米, C. 50毫米
 * - Validation: must select to proceed
 * - targetElement: P<pageNumber>_最小GSD焦距（随 stepIndex 动态生成）
 * - RADIO_SELECT event logging
 */

interface RadioOption {
  value: string;
  label: string;
}

const RADIO_OPTIONS: RadioOption[] = [
  { value: 'A', label: 'A. 8毫米' },
  { value: 'B', label: 'B. 24毫米' },
  { value: 'C', label: 'C. 50毫米' },
];

export default function Page05_FocalAnalysis() {
  const { experimentState, logOperation, setAnswer, getAnswer, capture, resetExperiment, questionIds } =
    useDroneImagingContext();
  const focalQuestionId = questionIds.minGsdFocal;

  // State
  const [selectedValue, setSelectedValue] = useState(getAnswer(focalQuestionId) || '');
  const [error, setError] = useState('');
  const [showFovCone, setShowFovCone] = useState(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { currentHeight } = experimentState;
  const canCapture = currentHeight !== 0;

  // Page enter/exit logging
  useEffect(() => {
    logOperation({
      targetElement: 'page',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page05_FocalAnalysis',
      time: formatTimestamp(new Date()),
    });

    return () => {
      logOperation({
        targetElement: 'page',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page05_FocalAnalysis',
        time: formatTimestamp(new Date()),
      });

      // Clear any pending timeouts
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, [logOperation]);

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
    setAnswer(focalQuestionId, option.label);

    // Log RADIO_SELECT event
    logOperation({
      targetElement: focalQuestionId,
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
      targetElement: 'capture_button',
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
  }, [experimentState, capture, logOperation, canCapture]);

  // Handle reset
  const handleReset = useCallback(() => {
    logOperation({
      targetElement: 'reset_button',
      eventType: EventTypes.SIMULATION_OPERATION,
      value: JSON.stringify({ action: 'reset_experiment' }),
      time: formatTimestamp(new Date()),
    });

    resetExperiment();
    setShowFovCone(false);

    if (flashTimeoutRef.current) {
      clearTimeout(flashTimeoutRef.current);
    }
  }, [resetExperiment, logOperation]);

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
          missing: [focalQuestionId],
        }),
        time: formatTimestamp(new Date()),
      });
      return;
    }

    // Log successful click
    logOperation({
      targetElement: 'next_button',
      eventType: EventTypes.CLICK,
      value: 'navigate_to_height_analysis',
      time: formatTimestamp(new Date()),
    });

    const frameNextButton =
      document.querySelector<HTMLButtonElement>('[data-testid="frame-next-button"]');
    if (frameNextButton) {
      frameNextButton.click();
    }
  };

  return (
    <div className={styles.analysisContainer} data-testid="page-focal-analysis">
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
          <h2 className={styles.panelTitle}>焦距分析</h2>

          {/* Question box */}
          <div className={styles.questionBox}>
            <p className={styles.questionText}>
              <strong>问题2：</strong> 根据模拟实验，当飞行高度为100米时，使用何种焦距可以使地面采样距离（GSD）达到最小？
            </p>
          </div>

          {/* Radio group */}
          <div className={styles.radioGroup} data-testid="focal-radio-group">
            {RADIO_OPTIONS.map((option) => (
              <label
                key={option.value}
                className={`${styles.radioOption} ${selectedValue === option.value ? styles.selected : ''}`}
              >
                <input
                  type="radio"
                  name="focal_analysis"
                  value={option.value}
                  checked={selectedValue === option.value}
                  onChange={() => handleRadioChange(option)}
                  className={styles.radioInput}
                  data-testid={`radio-focal-${option.value}`}
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
