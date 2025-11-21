/**
 * Dropper.jsx - SVG Dropper Component with Animation
 *
 * Animated dropper that moves down, drops liquid, and returns up.
 * Uses CSS keyframes for smooth 60FPS animation.
 */

import styles from '../../styles/ExperimentPanel.module.css';

/**
 * Dropper Component
 *
 * @param {Object} props
 * @param {boolean} props.isAnimating - Whether the dropper animation is playing
 */
function Dropper({ isAnimating = false }) {
  return (
    <>
      {/* Water drop */}
      <circle
        id="water-drop"
        cx={0}
        cy={0}
        r={0}
        className={`${styles.drop} ${isAnimating ? styles.dropFallingAction : ''}`}
      />

      {/* Dropper group */}
      <g
        id="dropper-group"
        className={`${styles.dropperGroup} ${isAnimating ? styles.dropperMoveAction : ''}`}
      >
        {/* Rubber bulb (top) */}
        <g
          id="dropper-bulb"
          className={`${styles.dropperBulb} ${isAnimating ? styles.bulbSqueezeAction : ''}`}
        >
          {/* Bulb shape */}
          <path
            d="M-16,-80 Q-25,-100 0,-120 Q25,-100 16,-80 Z"
            fill="#d32f2f"
          />
          {/* Bulb base */}
          <rect
            x={-16}
            y={-80}
            width={32}
            height={10}
            rx={2}
            fill="#d32f2f"
          />
        </g>

        {/* Glass tube body */}
        <g id="dropper-body">
          {/* Main tube */}
          <rect
            x={-8}
            y={-70}
            width={16}
            height={100}
            fill="rgba(255,255,255,0.9)"
            stroke="#90a4ae"
            strokeWidth={1.5}
          />

          {/* Measurement lines */}
          <line
            x1={-4}
            y1={-50}
            x2={4}
            y2={-50}
            stroke="#90a4ae"
            strokeWidth={1}
          />
          <line
            x1={-4}
            y1={-30}
            x2={4}
            y2={-30}
            stroke="#90a4ae"
            strokeWidth={1}
          />
          <line
            x1={-4}
            y1={-10}
            x2={4}
            y2={-10}
            stroke="#90a4ae"
            strokeWidth={1}
          />

          {/* Liquid inside tube */}
          <rect
            x={-6}
            y={-20}
            width={12}
            height={60}
            fill="#ef5350"
            opacity={0.8}
          />

          {/* Tube tip (glass) */}
          <path
            d="M-8,30 L-2,50 L2,50 L8,30 Z"
            fill="rgba(255,255,255,0.9)"
            stroke="#90a4ae"
            strokeWidth={1.5}
          />

          {/* Liquid in tip */}
          <path
            d="M-6,30 L-1,48 L1,48 L6,30 Z"
            fill="#ef5350"
            opacity={0.8}
          />
        </g>
      </g>
    </>
  );
}

export default Dropper;
