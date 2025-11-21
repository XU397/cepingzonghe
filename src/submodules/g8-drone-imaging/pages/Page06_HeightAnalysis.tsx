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
 * - targetElement: 'P6_GSD变化趋势'
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
  const { experimentState, logOperation, setAnswer, getAnswer, capture, resetExperiment } =
    useDroneImagingContext();

  // State
  const [selectedValue, setSelectedValue] = useState(getAnswer('P6_GSD变化趋势') || '');
  const [error, setError] = useState('');
  const [showFovCone, setShowFovCone] = useState(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { currentHeight } = experimentState;
  const canCapture = currentHeight !== 0;

  // Page enter/exit logging
  useEffect(() => {
    logOperation({
      targetElement: 'page',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page06_HeightAnalysis',
      time: formatTimestamp(new Date()),
    });

    return () => {
      logOperation({
        targetElement: 'page',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page06_HeightAnalysis',
        time: formatTimestamp(new Date()),
      });

      // Clear any pending timeouts
      if (flashTimeoutRef.current) {
        clearTimeout(flashTimeoutRef.current);
      }
    };
  }, [logOperation]);

  // Handle radio selection
  const handleRadioChange = (value: string) => {
    setSelectedValue(value);
    setError('');

    // Save answer
    setAnswer('P6_GSD变化趋势', value);

    // Log RADIO_SELECT event
    logOperation({
      targetElement: 'P6_GSD变化趋势',
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
      value: `capture_h${experimentState.currentHeight}_f${experimentState.currentFocalLength}_gsd${experimentState.currentGSD.toFixed(2)}`,
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
      value: 'reset_experiment',
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
      setError('请选择一个答案后再继续');

      // Log CLICK_BLOCKED event
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: 'no_selection',
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
        {/* Left column: Questions */}
        <div className={styles.leftPanel}>
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
                  onChange={() => handleRadioChange(option.value)}
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

        {/* Right column: Experiment unit */}
        <div className={styles.rightPanel}>
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
