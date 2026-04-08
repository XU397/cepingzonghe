import React from 'react';
import { HeightLevel } from '../types';
import { HEIGHT_LEVELS } from '../constants/windSpeedData';
import styles from './HeightController.module.css';

interface HeightControllerProps {
  currentHeight: HeightLevel;
  onHeightChange: (height: HeightLevel) => void;
  disabled?: boolean;
}

const HeightController: React.FC<HeightControllerProps> = ({
  currentHeight,
  onHeightChange,
  disabled = false
}) => {
  
  const handleHeightSelect = (height: HeightLevel) => {
    if (!disabled && height !== currentHeight) {
      onHeightChange(height);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>测量高度控制</h3>
        <p className={styles.subtitle}>
          {disabled ? '当前实验锁定高度' : '选择风速测量高度'}
        </p>
      </div>

      <div className={styles.heightOptions}>
        {HEIGHT_LEVELS.map((height) => (
          <button
            key={height}
            className={`
              ${styles.heightButton} 
              ${currentHeight === height ? styles.active : ''}
              ${disabled ? styles.disabled : ''}
            `}
            onClick={() => handleHeightSelect(height)}
            disabled={disabled}
          >
            <div className={styles.heightValue}>
              {height}
              <span className={styles.unit}>cm</span>
            </div>
            
            {/* 高度可视化指示器 */}
            <div className={styles.heightIndicator}>
              <div 
                className={styles.heightBar}
                style={{ 
                  height: `${(height / 100) * 60}px`,
                  background: currentHeight === height 
                    ? 'linear-gradient(180deg, #3b82f6 0%, #1e40af 100%)'
                    : 'linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%)'
                }}
              />
            </div>
            
            {currentHeight === height && !disabled && (
              <div className={styles.activeIndicator}>
                <span className={styles.checkmark}>✓</span>
              </div>
            )}
            
            {disabled && currentHeight === height && (
              <div className={styles.lockIndicator}>
                <span className={styles.lockIcon}>🔒</span>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* 高度说明 */}
      <div className={styles.heightDescription}>
        <div className={styles.descriptionItem}>
          <span className={styles.heightLabel}>20cm</span>
          <span className={styles.description}>近地面风速</span>
        </div>
        <div className={styles.descriptionItem}>
          <span className={styles.heightLabel}>50cm</span>
          <span className={styles.description}>中层风速</span>
        </div>
        <div className={styles.descriptionItem}>
          <span className={styles.heightLabel}>100cm</span>
          <span className={styles.description}>上层风速</span>
        </div>
      </div>

      {/* 当前状态显示 */}
      <div className={styles.currentStatus}>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>当前测量高度</span>
          <span className={styles.currentValue}>
            {currentHeight}cm
          </span>
          {disabled && (
            <span className={styles.lockedText}>
              （实验期间锁定）
            </span>
          )}
        </div>
      </div>

      {/* 操作提示 */}
      {!disabled && (
        <div className={styles.hint}>
          <span className={styles.hintIcon}>💡</span>
          <span className={styles.hintText}>
            点击不同高度进行切换
          </span>
        </div>
      )}
    </div>
  );
};

export default HeightController;