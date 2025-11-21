import React, { useCallback } from 'react';
import { useDroneImagingContext } from '../context/DroneImagingContext';
import { FocalLength } from '../utils/gsdLookup';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import styles from '../styles/DroneSimulator.module.css';

interface FocalLengthSelectorProps {
  disabled?: boolean;
}

// Available focal length steps
const FOCAL_STEPS: FocalLength[] = [8, 24, 50];

/**
 * FocalLengthSelector Component
 *
 * Dashboard-style focal length selector with up/down arrow buttons.
 * Steps through 8mm, 24mm, 50mm focal lengths.
 */
export default function FocalLengthSelector({ disabled = false }: FocalLengthSelectorProps) {
  const { experimentState, setFocalLength, logOperation } = useDroneImagingContext();
  const { currentFocalLength } = experimentState;

  // Find current index in steps
  const currentIndex = FOCAL_STEPS.indexOf(currentFocalLength);

  const adjustFocal = useCallback((direction: number) => {
    if (disabled) return;

    const newIndex = currentIndex + direction;

    // Bounds check
    if (newIndex < 0 || newIndex >= FOCAL_STEPS.length) return;

    const newFocalLength = FOCAL_STEPS[newIndex];

    // Log operation
    logOperation({
      targetElement: `focal_${direction > 0 ? 'up' : 'down'}`,
      eventType: EventTypes.SIMULATION_OPERATION,
      value: `set_focal_${newFocalLength}mm`,
      time: formatTimestamp(new Date()),
    });

    // Update focal length in context
    setFocalLength(newFocalLength);
  }, [disabled, currentIndex, setFocalLength, logOperation]);

  return (
    <div className={styles.focalControlWrapper}>
      <div className={styles.focalDevice}>
        <div className={styles.focalArrows}>
          <button
            className={`${styles.arrowBtn} ${styles.arrowUp}`}
            onClick={() => adjustFocal(1)}
            disabled={disabled || currentIndex >= FOCAL_STEPS.length - 1}
            aria-label="增加焦距"
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 8l-6 6h12z"/>
            </svg>
          </button>
          <button
            className={`${styles.arrowBtn} ${styles.arrowDown}`}
            onClick={() => adjustFocal(-1)}
            disabled={disabled || currentIndex <= 0}
            aria-label="减少焦距"
          >
            <svg viewBox="0 0 24 24">
              <path d="M12 16l6-6H6z"/>
            </svg>
          </button>
        </div>
        <div className={styles.focalDisplay}>
          {currentFocalLength}mm
        </div>
      </div>
      <div className={styles.focalLabel}>镜头焦距</div>
    </div>
  );
}
