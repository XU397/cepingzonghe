import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDroneImagingContext } from '../context/DroneImagingContext';
import styles from '../styles/DroneSimulator.module.css';

interface DroneSimulatorProps {
  showFovCone?: boolean;
}

/**
 * DroneSimulator Component
 *
 * Renders the SVG-based drone animation with:
 * - Drone icon that moves based on height
 * - Ground elements that blur based on GSD (only after capture)
 * - FOV cone visualization
 * - Propeller rotation animation
 */
export default function DroneSimulator({ showFovCone = false }: DroneSimulatorProps) {
  const { experimentState } = useDroneImagingContext();
  const { currentHeight, currentFocalLength, currentGSD, blurAmount, hasCaptured } = experimentState;

  const [flashActive, setFlashActive] = useState(false);
  const [coneVisible, setConeVisible] = useState(false);

  // Calculate drone Y position based on height
  // Mapping: 0 -> Y=350 (ground), 100m -> Y=250, 200m -> Y=150, 300m -> Y=50
  const getDroneY = (height: number): number => {
    switch (height) {
      case 0: return 350;   // Ground level
      case 100: return 250;
      case 200: return 150;
      case 300: return 50;
      default: return 350;
    }
  };

  const droneY = getDroneY(currentHeight);

  // Calculate FOV cone width based on focal length
  // 8mm = wide angle (150), 24mm = normal (80), 50mm = telephoto (40)
  const getFovWidth = useCallback(() => {
    switch (currentFocalLength) {
      case 8: return 150;
      case 24: return 80;
      case 50: return 40;
      default: return 80;
    }
  }, [currentFocalLength]);

  // Update cone visibility when showFovCone changes
  useEffect(() => {
    setConeVisible(showFovCone);
  }, [showFovCone]);

  // Trigger flash animation
  const triggerFlash = useCallback(() => {
    setFlashActive(true);
    setConeVisible(true);
    setTimeout(() => {
      setFlashActive(false);
    }, 150);
  }, []);

  // Expose triggerFlash for parent components
  const simulatorRef = useRef<{ triggerFlash: () => void }>({ triggerFlash });

  useEffect(() => {
    simulatorRef.current.triggerFlash = triggerFlash;
  }, [triggerFlash]);

  // Calculate FOV cone path
  const fovWidth = getFovWidth();
  const fovPath = `M450,${droneY} L${450 - fovWidth},400 L${450 + fovWidth},400 Z`;

  // Only apply blur after capture
  const effectiveBlurAmount = hasCaptured ? blurAmount : 0;

  return (
    <div className={styles.stageArea}>
      <svg viewBox="0 0 900 480" preserveAspectRatio="xMidYMid slice">
        <defs>
          {/* Blur filter for ground elements */}
          <filter id="groundBlur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation={effectiveBlurAmount} />
          </filter>

          {/* Drone icon definition */}
          <g id="droneIcon">
            {/* Arms */}
            <path d="M-40,-8 L40,-8" stroke="#455a64" strokeWidth="4" strokeLinecap="round"/>
            <path d="M-40,8 L40,8" stroke="#455a64" strokeWidth="4" strokeLinecap="round"/>
            {/* Body */}
            <rect x="-18" y="-12" width="36" height="24" rx="6" fill="#eceff1" stroke="#455a64" strokeWidth="2"/>
            <circle cx="0" cy="0" r="8" fill="#29b6f6" stroke="#01579b" strokeWidth="2"/>
            {/* Propellers */}
            <g className={styles.propeller} transform="translate(-40, -8)">
              <line x1="-10" x2="10" stroke="#333" strokeWidth="2"/>
            </g>
            <g className={styles.propeller} transform="translate(40, -8)">
              <line x1="-10" x2="10" stroke="#333" strokeWidth="2"/>
            </g>
            <g className={styles.propeller} transform="translate(-40, 8)">
              <line x1="-10" x2="10" stroke="#333" strokeWidth="2"/>
            </g>
            <g className={styles.propeller} transform="translate(40, 8)">
              <line x1="-10" x2="10" stroke="#333" strokeWidth="2"/>
            </g>
          </g>

          {/* Tree definition */}
          <g id="tree">
            <path d="M-10,0 L10,0 L0,-40 Z" fill="#66bb6a"/>
            <rect x="-2" y="0" width="4" height="10" fill="#795548"/>
          </g>
        </defs>

        {/* Ground layer (with blur effect) */}
        <g className={styles.groundLayer} style={{ filter: 'url(#groundBlur)' }}>
          {/* Mountains */}
          <path d="M0,300 L200,150 L400,300 L600,200 L900,350 L900,480 L0,480 Z" fill="#c5e1a5" stroke="none"/>
          {/* Grass base */}
          <path d="M-50,480 L950,480 L950,300 L-50,300 Z" fill="#dcedc8"/>

          {/* Decorative trees */}
          <use href="#tree" x="100" y="320" transform="scale(1.5)"/>
          <use href="#tree" x="150" y="340" transform="scale(1.2)"/>
          <use href="#tree" x="800" y="330" transform="scale(1.4)"/>
          <use href="#tree" x="750" y="310" transform="scale(1.1)"/>

          {/* House */}
          <g transform="translate(450, 360)">
            {/* Main body */}
            <rect x="-60" y="-50" width="120" height="90" fill="#fff3e0" stroke="#5d4037" strokeWidth="3"/>
            {/* Red roof */}
            <path d="M-70,-50 L0,-100 L70,-50 Z" fill="#ff7043" stroke="#5d4037" strokeWidth="3"/>
            {/* Door */}
            <rect x="-20" y="10" width="40" height="40" fill="#8d6e63" stroke="#3e2723" strokeWidth="2"/>
            {/* Windows */}
            <rect x="-45" y="-30" width="25" height="25" fill="#81d4fa" stroke="#0277bd" strokeWidth="2"/>
            <rect x="20" y="-30" width="25" height="25" fill="#81d4fa" stroke="#0277bd" strokeWidth="2"/>
            {/* Chimney */}
            <rect x="30" y="-90" width="20" height="30" fill="#8d6e63"/>
          </g>
        </g>

        {/* FOV cone (visible during capture) */}
        <path
          className={`${styles.fovCone} ${coneVisible ? styles.visible : ''}`}
          d={fovPath}
          fill="rgba(255, 255, 255, 0.3)"
          stroke="rgba(255, 255, 255, 0.5)"
          strokeDasharray="5,5"
        />

        {/* Drone (not blurred) */}
        <g
          className={styles.droneGroup}
          transform={`translate(450, ${droneY}) scale(0.8)`}
        >
          <use href="#droneIcon"/>
        </g>
      </svg>

      {/* Flash overlay for capture effect */}
      <div className={`${styles.flashOverlay} ${flashActive ? styles.active : ''}`} />
    </div>
  );
}

// Export ref type for parent components
export type DroneSimulatorRef = {
  triggerFlash: () => void;
};
