/**
 * ExperimentPanel/index.jsx - Main Experiment Panel Component
 *
 * Main container with grid layout (3 columns):
 * - Left: Concentration selector (3 radio buttons)
 * - Center: SVG experiment area with PetriDish and Dropper
 * - Right: Result display showing germination rate
 * - Bottom: Control bar with Reset, Days, and Start buttons
 */

import { useState, useCallback } from 'react';
import { useMikaniaExperiment } from '../../Component';
import {
  getGerminationRate,
  getSproutedSeedCount,
  CONCENTRATION_OPTIONS,
  DAYS_RANGE,
  isValidConcentration,
  isValidDays,
} from '../../utils/experimentData';
import PetriDish from './PetriDish';
import Dropper from './Dropper';
import SeedDisplay from './SeedDisplay';
import styles from '../../styles/ExperimentPanel.module.css';

/**
 * Validate and normalize concentration value (T054)
 * @param {number} value - Concentration value to validate
 * @returns {number} Valid concentration value (0, 5, or 10)
 */
function validateConcentration(value) {
  if (!isValidConcentration(value)) {
    console.warn(`[ExperimentPanel] Invalid concentration ${value}, using default 0`);
    return 0;
  }
  return value;
}

/**
 * Validate and normalize days value (T054)
 * @param {number} value - Days value to validate
 * @returns {number} Valid days value (1-7)
 */
function validateDays(value) {
  if (!isValidDays(value)) {
    console.warn(`[ExperimentPanel] Invalid days ${value}, using default`);
    return Math.max(DAYS_RANGE.min, Math.min(DAYS_RANGE.max, value || DAYS_RANGE.min));
  }
  return value;
}

/**
 * ExperimentPanel Component
 */
function ExperimentPanel() {
  const {
    state,
    setExperimentState,
    logOperation,
  } = useMikaniaExperiment();

  const { experimentState } = state;

  // Local animation state
  const [isAnimating, setIsAnimating] = useState(false);

  // Parse and validate current concentration as number (T054)
  const rawConcValue = parseInt(experimentState.concentration, 10) || 0;
  const currentConcValue = validateConcentration(rawConcValue);

  // Validate current days (T054)
  const currentDays = validateDays(experimentState.days);

  /**
   * Handle concentration change
   */
  const handleConcentrationChange = useCallback((newConcentration) => {
    if (isAnimating) return;

    // Validate the new concentration (T054)
    const validatedConcentration = validateConcentration(newConcentration);

    const oldValue = experimentState.concentration;
    const newValue = `${validatedConcentration}mg/ml`;

    // Log parameter change event
    logOperation({
      targetElement: '实验面板-浓度选择',
      eventType: 'exp_param_change',
      value: JSON.stringify({
        param: 'concentration',
        oldValue,
        newValue,
      }),
    });

    // Update state
    setExperimentState({
      concentration: newValue,
      currentResult: null, // Clear previous result
    });
  }, [isAnimating, experimentState.concentration, logOperation, setExperimentState]);

  /**
   * Handle days change
   */
  const handleDaysChange = useCallback((delta) => {
    if (isAnimating) return;

    const newDays = currentDays + delta;

    // Validate the new days value (T054)
    const validatedDays = validateDays(newDays);

    if (validatedDays === currentDays) return;

    // Log parameter change event
    logOperation({
      targetElement: '实验面板-天数调整',
      eventType: 'exp_param_change',
      value: JSON.stringify({
        param: 'days',
        oldValue: currentDays,
        newValue: validatedDays,
      }),
    });

    // Update state
    setExperimentState({
      days: validatedDays,
      currentResult: null, // Clear previous result
    });
  }, [isAnimating, currentDays, logOperation, setExperimentState]);

  /**
   * Handle experiment start
   */
  const handleStart = useCallback(() => {
    if (isAnimating) return;

    // Use validated values (T054)
    const concValue = currentConcValue;
    const days = currentDays;

    // Get expected germination rate
    const expectedRate = getGerminationRate(concValue, days);

    // Log start event
    logOperation({
      targetElement: '实验面板-开始按钮',
      eventType: 'exp_start',
      value: JSON.stringify({
        concentration: `${concValue}mg/ml`,
        days,
        expectedRate,
      }),
    });

    // Start animation
    setIsAnimating(true);

    // Update state to started
    setExperimentState({
      hasStarted: true,
    });

    // Animation sequence timing
    // - Dropper moves down: 0-0.75s
    // - Bulb squeeze + drop falls: 0.8-2s
    // - Seeds sprout: 2.2s
    // - Show result: 3.5s

    // Show result after animation completes
    setTimeout(() => {
      setExperimentState({
        currentResult: expectedRate,
      });
      setIsAnimating(false);
    }, 3500);
  }, [isAnimating, currentConcValue, currentDays, logOperation, setExperimentState]);

  /**
   * Handle experiment reset
   */
  const handleReset = useCallback(() => {
    if (isAnimating) return;

    // Log reset event
    logOperation({
      targetElement: '实验面板-重置按钮',
      eventType: 'exp_reset',
      value: JSON.stringify({
        previousConcentration: experimentState.concentration,
        previousDays: experimentState.days,
      }),
    });

    // Reset state to defaults
    setExperimentState({
      concentration: '0mg/ml',
      days: 1,
      hasStarted: false,
      currentResult: null,
    });
  }, [isAnimating, experimentState.concentration, experimentState.days, logOperation, setExperimentState]);

  // Calculate germinated count for display using validated values
  const germinatedCount = experimentState.currentResult !== null
    ? getSproutedSeedCount(currentConcValue, currentDays)
    : 0;

  return (
    <div className={styles.mainContainer}>
      {/* Left Panel: Concentration Selector */}
      <div className={styles.sidebarPanel} style={{ gridColumn: '1/2', gridRow: '1/2' }}>
        <div className={styles.panelTitle}>菟丝子水浸液浓度</div>
        <div className={styles.concentrationGroup}>
          {CONCENTRATION_OPTIONS.map((option) => (
            <div key={option.value}>
              <input
                type="radio"
                id={`conc-${option.value}`}
                name="concentration"
                value={option.value}
                checked={experimentState.concentration === option.label}
                onChange={() => handleConcentrationChange(option.value)}
                className={styles.radioBtn}
                disabled={isAnimating}
              />
              <label
                htmlFor={`conc-${option.value}`}
                className={styles.concLabel}
              >
                {option.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Center: SVG Experiment Area */}
      <div className={styles.experimentArea}>
        <svg
          viewBox="0 0 400 400"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.experimentSvg}
        >
          {/* Definitions */}
          <defs>
            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="3" />
              <feOffset dx="2" dy="2" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.3" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Petri Dish with seeds */}
          <PetriDish
            germinatedCount={germinatedCount}
            showSeeds={true}
          />

          {/* Dropper */}
          <Dropper isAnimating={isAnimating} />
        </svg>
      </div>

      {/* Right Panel: Result Display */}
      <div className={styles.sidebarPanel} style={{ gridColumn: '3/4', gridRow: '1/2' }}>
        <div className={styles.panelTitle}>薇甘菊发芽率</div>
        <SeedDisplay germinationRate={experimentState.currentResult} />
      </div>

      {/* Bottom: Control Bar */}
      <div className={styles.controlsBottom}>
        {/* Reset Button */}
        <button
          className={`${styles.btnAction} ${styles.btnReset}`}
          onClick={handleReset}
          disabled={isAnimating}
        >
          重置
        </button>

        {/* Days Control */}
        <div className={styles.daysControl}>
          <div className={styles.daysPanel}>
            <div className={styles.daysBtns}>
              <button
                className={`${styles.btnTiny} ${styles.btnTinyUp}`}
                onClick={() => handleDaysChange(1)}
                disabled={isAnimating || currentDays >= DAYS_RANGE.max}
              >
                &#9650;
              </button>
              <button
                className={`${styles.btnTiny} ${styles.btnTinyDown}`}
                onClick={() => handleDaysChange(-1)}
                disabled={isAnimating || currentDays <= DAYS_RANGE.min}
              >
                &#9660;
              </button>
            </div>
            <div className={styles.daysDisplay}>
              <span>{currentDays}</span>天
            </div>
          </div>
          <div className={styles.daysLabel}>天数</div>
        </div>

        {/* Start Button */}
        <button
          className={`${styles.btnAction} ${styles.btnStart}`}
          onClick={handleStart}
          disabled={isAnimating}
        >
          开始
        </button>
      </div>
    </div>
  );
}

export default ExperimentPanel;
