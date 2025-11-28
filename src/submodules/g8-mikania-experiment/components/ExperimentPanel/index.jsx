/**
 * ExperimentPanel/index.jsx - Main Experiment Panel Component
 *
 * Main container with grid layout (3 columns):
 * - Left: Concentration selector (3 radio buttons)
 * - Center: SVG experiment area with PetriDish and Dropper
 * - Right: Result display showing germination rate
 * - Bottom: Control bar with Reset, Days, and Start buttons
 */

import { useState, useCallback, useMemo } from 'react';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { formatTimestamp } from '@/shared/services/dataLogger.js';
import { useMikaniaExperiment } from '../../Component';
import {
  getGerminationRate,
  getSproutedSeedCount,
  CONCENTRATION_OPTIONS,
  DAYS_RANGE,
  isValidConcentration,
  isValidDays,
} from '../../utils/experimentData';
import { getPageSubNum } from '../../mapping';
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
function ExperimentPanel({ pageNumber }) {
  const {
    state,
    setExperimentState,
    logOperation,
    flowContext,
  } = useMikaniaExperiment();

  const { experimentState } = state;
  const subPageNum = getPageSubNum(state.currentPageId);
  const flowStepIndex = flowContext?.stepIndex;
  const computedPageNumber = useMemo(() => {
    return typeof flowStepIndex === 'number'
      ? `${flowStepIndex}.${subPageNum}`
      : String(subPageNum);
  }, [flowStepIndex, subPageNum]);
  const effectivePageNumber = pageNumber || computedPageNumber;
  const pageTargetPrefix = useMemo(() => {
    if (!effectivePageNumber) return '';
    return `P${effectivePageNumber}_`;
  }, [effectivePageNumber]);
  const buildTarget = useCallback((suffix) => `${pageTargetPrefix}${suffix}`, [pageTargetPrefix]);

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
      targetElement: buildTarget('浓度选择器'),
      eventType: EventTypes.SIMULATION_OPERATION,
      value: JSON.stringify({
        operation: 'param_change',
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
  }, [isAnimating, experimentState.concentration, buildTarget, logOperation, setExperimentState]);

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
      targetElement: buildTarget('天数选择器'),
      eventType: EventTypes.SIMULATION_OPERATION,
      value: JSON.stringify({
        operation: 'param_change',
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
  }, [isAnimating, currentDays, buildTarget, logOperation, setExperimentState]);

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
      targetElement: buildTarget('开始按钮'),
      eventType: EventTypes.SIMULATION_OPERATION,
      value: JSON.stringify({
        operation: 'start',
        concentration: `${concValue}mg/ml`,
        days,
        expectedRate,
      }),
    });

    logOperation({
      targetElement: buildTarget('开始按钮'),
      eventType: EventTypes.SIMULATION_TIMING_STARTED,
      value: JSON.stringify({
        concentration: `${concValue}mg/ml`,
        days,
        duration_ms: 3500,
      }),
    });

    // Start animation
    setIsAnimating(true);

    // Update state to started
    setExperimentState({
      hasStarted: true,
      currentResult: null,
    });

    // Animation sequence timing
    // - Dropper moves down: 0-0.75s
    // - Bulb squeeze + drop falls: 0.8-2s
    // - Seeds sprout: 2.2s
    // - Show result: 3.5s

    // Show result after animation completes
    setTimeout(() => {
      const sproutedCount = getSproutedSeedCount(concValue, days);
      const timestamp = formatTimestamp(new Date());

      logOperation({
        targetElement: buildTarget('实验结果'),
        eventType: EventTypes.SIMULATION_RUN_RESULT,
        value: JSON.stringify({
          concentration: `${concValue}mg/ml`,
          days,
          germinationRate: expectedRate,
          sproutedCount,
          timestamp,
        }),
      });

      const runs = Array.isArray(experimentState.history) ? experimentState.history : [];
      setExperimentState({
        currentResult: expectedRate,
        history: [
          ...runs,
          {
            concentration: `${concValue}mg/ml`,
            days,
            germinationRate: expectedRate,
            timestamp,
          },
        ],
      });
      setIsAnimating(false);
    }, 3500);
  }, [isAnimating, currentConcValue, currentDays, buildTarget, experimentState.history, logOperation, setExperimentState]);

  /**
   * Handle experiment reset
   */
  const handleReset = useCallback(() => {
    if (isAnimating) return;

    // Log reset event
    logOperation({
      targetElement: buildTarget('重置按钮'),
      eventType: EventTypes.SIMULATION_OPERATION,
      value: JSON.stringify({
        operation: 'reset',
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
  }, [isAnimating, experimentState.concentration, experimentState.days, buildTarget, logOperation, setExperimentState]);

  // Calculate germinated count for display using validated values
  const germinatedCount = experimentState.currentResult !== null
    ? getSproutedSeedCount(currentConcValue, currentDays)
    : 0;

  return (
    <div className={styles.mainContainer}>
      {/* Background Layer - Spans full width of top row */}
      <div className={styles.backgroundLayer}>
        <svg
          viewBox="0 0 1200 600"
          xmlns="http://www.w3.org/2000/svg"
          className={styles.backgroundSvg}
          preserveAspectRatio="xMidYMid slice"
        >
          <g id="lab-background-full">
            {/* Wall */}
            <rect x="0" y="0" width="1200" height="420" fill="#f0f4f8" />
            {/* Wall decorative stripe */}
            <rect x="0" y="120" width="1200" height="60" fill="#e1e8ed" />

            {/* Table Surface */}
            <rect x="0" y="420" width="1200" height="180" fill="#cfd8dc" />
            {/* Table Top Edge Highlight */}
            <rect x="0" y="420" width="1200" height="6" fill="#eceff1" />
            {/* Table Front Edge Shadow */}
            <rect x="0" y="426" width="1200" height="12" fill="#b0bec5" />
          </g>
        </svg>
      </div>

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
          viewBox="0 0 600 400"
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
