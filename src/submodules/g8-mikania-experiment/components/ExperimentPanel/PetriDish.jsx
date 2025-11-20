/**
 * PetriDish.jsx - SVG Petri Dish Component
 *
 * Displays petri dish with seeds that germinate based on rate.
 * Green seeds = germinated, gray seeds = not germinated.
 */

import { useRef, useMemo } from 'react';
import styles from '../../styles/ExperimentPanel.module.css';
import { TOTAL_SEEDS } from '../../utils/experimentData';

/**
 * Generate random seed positions within ellipse
 * @param {number} count - Number of seeds
 * @param {number} rx - Ellipse x radius
 * @param {number} ry - Ellipse y radius
 * @returns {Array} Array of {x, y} positions
 */
function generateSeedPositions(count, rx = 120, ry = 50) {
  const positions = [];

  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random());
    const x = r * rx * Math.cos(angle);
    const y = r * ry * Math.sin(angle);
    positions.push({ x, y, rotation: Math.random() * 180 });
  }

  // Sort by y for proper layering
  return positions.sort((a, b) => a.y - b.y);
}

/**
 * Single Seed with Sprout
 */
function Seed({ x, y, rotation, isSprouted }) {
  const randomScale = useMemo(() => 0.8 + Math.random() * 0.5, []);

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Seed body */}
      <ellipse
        cx={0}
        cy={0}
        rx={4}
        ry={2.5}
        className={styles.seedBase}
        transform={`rotate(${rotation})`}
      />

      {/* Sprout group */}
      <g
        className={`${styles.sproutGroup} ${isSprouted ? styles.sproutVisible : ''}`}
        style={isSprouted ? { transform: `scale(${randomScale})` } : undefined}
      >
        {/* Stem */}
        <path
          d="M0,0 Q-2,-10 0,-20"
          className={styles.sproutStem}
        />
        {/* Left leaf */}
        <ellipse
          cx={-5}
          cy={-20}
          rx={5}
          ry={2.5}
          transform="rotate(-30 -5 -20)"
          className={styles.sproutLeaf}
        />
        {/* Right leaf */}
        <ellipse
          cx={5}
          cy={-20}
          rx={5}
          ry={2.5}
          transform="rotate(30 5 -20)"
          className={styles.sproutLeaf}
        />
      </g>
    </g>
  );
}

/**
 * PetriDish Component
 *
 * @param {Object} props
 * @param {number} props.germinatedCount - Number of seeds that have germinated
 * @param {boolean} props.showSeeds - Whether to show seeds
 */
function PetriDish({ germinatedCount = 0, showSeeds = true }) {
  const seedPositions = useRef(generateSeedPositions(TOTAL_SEEDS));

  // Determine which seeds are sprouted (random selection)
  const sproutedIndices = useMemo(() => {
    const indices = Array.from({ length: TOTAL_SEEDS }, (_, i) => i);
    // Shuffle
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return new Set(indices.slice(0, germinatedCount));
  }, [germinatedCount]);

  return (
    <g transform="translate(200, 310)">
      {/* Shadow */}
      <ellipse
        cx={0}
        cy={10}
        rx={145}
        ry={65}
        fill="rgba(0,0,0,0.15)"
      />

      {/* Dish outer rim */}
      <ellipse
        cx={0}
        cy={0}
        rx={150}
        ry={70}
        fill="#f5f5f5"
        stroke="#cfd8dc"
        strokeWidth={3}
      />

      {/* Dish interior (soil) */}
      <ellipse
        cx={0}
        cy={5}
        rx={140}
        ry={60}
        fill="#5d4037"
      />

      {/* Soil texture dots */}
      <circle cx={-50} cy={-20} r={2} fill="#3e2723" opacity={0.4} />
      <circle cx={60} cy={30} r={3} fill="#3e2723" opacity={0.4} />
      <circle cx={20} cy={-40} r={2} fill="#3e2723" opacity={0.4} />

      {/* Seeds layer */}
      {showSeeds && seedPositions.current.map((pos, index) => (
        <Seed
          key={index}
          x={pos.x}
          y={pos.y}
          rotation={pos.rotation}
          isSprouted={sproutedIndices.has(index)}
        />
      ))}
    </g>
  );
}

export default PetriDish;
