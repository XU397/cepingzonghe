import React from 'react';
import styles from './ExperimentPanel.module.css';

interface ExperimentPanelProps {
  isRunning: boolean;
  isCompleted: boolean;
  onStart: () => void;
  onReset: () => void;
  collectedData: {
    heightLevel: number;
    withPanelSpeed: number;
    noPanelSpeed: number;
    timestamp: string;
  } | null;
}

const ExperimentPanel: React.FC<ExperimentPanelProps> = ({
  isRunning,
  isCompleted,
  onStart,
  onReset,
  collectedData
}) => {

  const getStatusText = () => {
    if (isRunning) return '实验进行中...';
    if (isCompleted) return '实验已完成';
    return '准备开始实验';
  };

  const getStatusColor = () => {
    if (isRunning) return '#f59e0b';
    if (isCompleted) return '#10b981';
    return '#64748b';
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.title}>实验控制面板</h3>
        <div className={styles.statusIndicator}>
          <div 
            className={styles.statusDot}
            style={{ backgroundColor: getStatusColor() }}
          />
          <span 
            className={styles.statusText}
            style={{ color: getStatusColor() }}
          >
            {getStatusText()}
          </span>
        </div>
      </div>

      <div className={styles.controlButtons}>
        <button
          className={`${styles.button} ${styles.startButton}`}
          onClick={onStart}
          disabled={isRunning}
        >
          <span className={styles.buttonIcon}>
            {isRunning ? '⏳' : '▶️'}
          </span>
          <span className={styles.buttonText}>
            {isRunning ? '实验中' : '开始实验'}
          </span>
        </button>

        <button
          className={`${styles.button} ${styles.resetButton}`}
          onClick={onReset}
          disabled={isRunning || !isCompleted}
        >
          <span className={styles.buttonIcon}>🔄</span>
          <span className={styles.buttonText}>重新实验</span>
        </button>
      </div>

      {/* 实验步骤提示 */}
      <div className={styles.stepsGuide}>
        <h4 className={styles.stepsTitle}>实验步骤</h4>
        <ol className={styles.stepsList}>
          <li className={`${styles.step} ${!isRunning && !isCompleted ? styles.active : ''}`}>
            点击"开始实验"按钮
          </li>
          <li className={`${styles.step} ${isRunning ? styles.active : ''}`}>
            观察2秒风速仿真动画
          </li>
          <li className={`${styles.step} ${isCompleted ? styles.active : ''}`}>
            查看实验数据结果
          </li>
        </ol>
      </div>

      {/* 数据收集区 */}
      {collectedData && (
        <div className={styles.dataSection}>
          <h4 className={styles.dataTitle}>实验数据</h4>
          <div className={styles.dataGrid}>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>测量高度</span>
              <span className={styles.dataValue}>
                {collectedData.heightLevel}cm
              </span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>有板区风速</span>
              <span className={`${styles.dataValue} ${styles.withPanel}`}>
                {collectedData.withPanelSpeed} m/s
              </span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>无板区风速</span>
              <span className={`${styles.dataValue} ${styles.noPanel}`}>
                {collectedData.noPanelSpeed} m/s
              </span>
            </div>
            <div className={styles.dataItem}>
              <span className={styles.dataLabel}>速度差值</span>
              <span className={`${styles.dataValue} ${styles.difference}`}>
                {Math.abs(collectedData.noPanelSpeed - collectedData.withPanelSpeed).toFixed(2)} m/s
              </span>
            </div>
          </div>
          
          {/* 实验时间 */}
          <div className={styles.timestamp}>
            <span className={styles.timestampLabel}>实验时间：</span>
            <span className={styles.timestampValue}>
              {new Date(collectedData.timestamp).toLocaleString('zh-CN', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
              })}
            </span>
          </div>
        </div>
      )}

      {/* 提示信息 */}
      <div className={styles.tips}>
        <div className={styles.tipItem}>
          <span className={styles.tipIcon}>💡</span>
          <span className={styles.tipText}>
            实验将进行2秒钟的风速模拟
          </span>
        </div>
        
        {isCompleted && (
          <div className={styles.tipItem}>
            <span className={styles.tipIcon}>📊</span>
            <span className={styles.tipText}>
              实验数据已采集完成，可以进行结果分析
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExperimentPanel;