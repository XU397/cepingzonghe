import React from 'react';
import { useDroneImagingContext } from '../context/DroneImagingContext';
import styles from '../styles/DroneSimulator.module.css';

/**
 * GSDDisplay Component
 *
 * Displays the current Ground Sample Distance (GSD) value
 * with proper formatting and units.
 * Only shows the value after capture has occurred.
 */
export default function GSDDisplay() {
  const { experimentState } = useDroneImagingContext();
  const { currentGSD, hasCaptured } = experimentState;

  // Format GSD to 2 decimal places, or show "--" if not captured
  const displayValue = hasCaptured ? currentGSD.toFixed(2) : '--';

  return (
    <div className={styles.displayGsd}>
      <div className={styles.sectionTitle}>地面采样距离 (GSD)</div>
      <div
        className={styles.gsdBox}
        aria-label={hasCaptured ? `GSD值: ${displayValue}厘米每像素` : 'GSD值: 未测量'}
      >
        {displayValue}
      </div>
      <div className={styles.gsdUnit}>厘米/像素</div>
    </div>
  );
}
