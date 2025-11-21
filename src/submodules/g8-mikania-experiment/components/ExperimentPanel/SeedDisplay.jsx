/**
 * SeedDisplay.jsx - Germination Rate Display Component
 *
 * Shows germination rate percentage and seed count.
 * Provides visual feedback based on rate.
 */

import styles from '../../styles/ExperimentPanel.module.css';
import { TOTAL_SEEDS } from '../../utils/experimentData';

/**
 * SeedDisplay Component
 *
 * @param {Object} props
 * @param {number|null} props.germinationRate - Germination rate percentage (0-100)
 */
function SeedDisplay({ germinationRate = null }) {
  // Calculate germinated count
  const germinatedCount = germinationRate !== null
    ? Math.round((germinationRate / 100) * TOTAL_SEEDS)
    : 0;

  // Format display text
  const rateText = germinationRate !== null
    ? `${germinationRate}%`
    : '--%';

  return (
    <div className={styles.seedDisplayContainer}>
      {/* Main rate display */}
      <div className={styles.resultBox}>
        {rateText}
      </div>

      {/* Seed count details */}
      {germinationRate !== null && (
        <div className={styles.seedCount}>
          {germinatedCount}/{TOTAL_SEEDS} 发芽
        </div>
      )}
    </div>
  );
}

export default SeedDisplay;
