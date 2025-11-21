import React, { useCallback } from 'react';
import { useDroneImagingContext } from '../context/DroneImagingContext';
import { Height } from '../utils/gsdLookup';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import styles from '../styles/DroneSimulator.module.css';

interface HeightSelectorProps {
  disabled?: boolean;
}

/**
 * HeightSelector Component
 *
 * Renders three height selection buttons (100m, 200m, 300m)
 * and updates the drone height in context.
 * Initially no height is selected (height = 0).
 */
export default function HeightSelector({ disabled = false }: HeightSelectorProps) {
  const { experimentState, setHeight, logOperation } = useDroneImagingContext();
  const { currentHeight } = experimentState;

  // Available heights for selection (excludes 0 which is "no selection")
  const heights: (100 | 200 | 300)[] = [100, 200, 300];

  const handleHeightChange = useCallback((height: 100 | 200 | 300) => {
    if (disabled || height === currentHeight) return;

    // Log operation
    logOperation({
      targetElement: `height_button_${height}`,
      eventType: EventTypes.SIMULATION_OPERATION,
      value: `set_height_${height}m`,
      time: formatTimestamp(new Date()),
    });

    // Update height in context
    setHeight(height);
  }, [disabled, currentHeight, setHeight, logOperation]);

  return (
    <div className={styles.controlHeight}>
      <div className={styles.sectionTitle}>飞行高度</div>
      {heights.map((height) => (
        <button
          key={height}
          className={`${styles.heightBtn} ${currentHeight === height ? styles.active : ''}`}
          onClick={() => handleHeightChange(height)}
          disabled={disabled}
          aria-pressed={currentHeight === height}
          aria-label={`设置飞行高度为${height}米`}
        >
          {height}米
        </button>
      ))}
    </div>
  );
}
