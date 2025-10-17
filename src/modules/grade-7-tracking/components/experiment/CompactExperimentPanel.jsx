/**
 * CompactExperimentPanel - 紧凑型实验面板
 *
 * 用于分析页面的左侧实验区，空间更紧凑
 * 功能简化，只保留核心交互
 */

import { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/CompactExperimentPanel.module.css';

const CompactExperimentPanel = ({
  waterContentOptions = [15, 17, 19, 21],
  temperatureOptions = [25, 30, 35, 40, 45],
  onExperimentStart,
  onExperimentComplete,
  onReset
}) => {
  const [selectedWaterContent, setSelectedWaterContent] = useState(null);
  const [selectedTemperature, setSelectedTemperature] = useState(25);
  const [fallTime, setFallTime] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [ballPosition, setBallPosition] = useState(0);
  const [experimentHistory, setExperimentHistory] = useState([]);

  // 开始实验
  const handleStart = useCallback(() => {
    if (!selectedWaterContent || isAnimating) return;

    setIsAnimating(true);
    setBallPosition(0);

    // 调用回调获取下落时间
    const time = onExperimentStart ? onExperimentStart(selectedWaterContent, selectedTemperature) : 5.0;
    setFallTime(time);

    // 动画
    const startTime = Date.now();
    const duration = time * 1000;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setBallPosition(progress * 100);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // 动画完成
        setIsAnimating(false);

        // 添加到历史
        const record = {
          id: Date.now(),
          waterContent: selectedWaterContent,
          temperature: selectedTemperature,
          fallTime: time
        };
        setExperimentHistory(prev => [...prev, record]);

        if (onExperimentComplete) {
          onExperimentComplete(record);
        }
      }
    };

    requestAnimationFrame(animate);
  }, [selectedWaterContent, selectedTemperature, isAnimating, onExperimentStart, onExperimentComplete]);

  // 重置
  const handleReset = useCallback(() => {
    setBallPosition(0);
    setFallTime(0);
    setIsAnimating(false);

    if (onReset) {
      onReset();
    }
  }, [onReset]);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>继续实验</h3>
      <p className={styles.hint}>你可以继续进行实验来验证你的答案</p>

      {/* 参数选择 */}
      <div className={styles.controls}>
        {/* 含水量选择 */}
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>含水量</label>
          <div className={styles.buttonGroup}>
            {waterContentOptions.map(wc => (
              <button
                key={wc}
                type="button"
                className={`${styles.selectButton} ${selectedWaterContent === wc ? styles.selected : ''}`}
                onClick={() => setSelectedWaterContent(wc)}
                disabled={isAnimating}
              >
                {wc}%
              </button>
            ))}
          </div>
        </div>

        {/* 温度选择 */}
        <div className={styles.controlGroup}>
          <label className={styles.controlLabel}>温度</label>
          <div className={styles.buttonGroup}>
            {temperatureOptions.map(temp => (
              <button
                key={temp}
                type="button"
                className={`${styles.selectButton} ${selectedTemperature === temp ? styles.selected : ''}`}
                onClick={() => setSelectedTemperature(temp)}
                disabled={isAnimating}
              >
                {temp}°
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 实验显示区 */}
      <div className={styles.experimentDisplay}>
        <div className={styles.beaker}>
          {/* 蜂蜜液体 */}
          <div
            className={styles.honey}
            style={{
              height: selectedWaterContent ? `${(selectedWaterContent / 21) * 60}%` : '30%'
            }}
          />

          {/* 小球 */}
          {(isAnimating || fallTime > 0) && (
            <div
              className={styles.ball}
              style={{
                top: `${ballPosition}%`
              }}
            />
          )}
        </div>

        {/* 时间显示 */}
        <div className={styles.timeDisplay}>
          {fallTime > 0 ? `${fallTime.toFixed(1)}秒` : '--'}
        </div>
      </div>

      {/* 操作按钮 */}
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.startButton}
          onClick={handleStart}
          disabled={!selectedWaterContent || isAnimating}
        >
          {isAnimating ? '实验中...' : '开始实验'}
        </button>
        <button
          type="button"
          className={styles.resetButton}
          onClick={handleReset}
          disabled={isAnimating}
        >
          重置
        </button>
      </div>

      {/* 历史记录（最近2条） */}
      {experimentHistory.length > 0 && (
        <div className={styles.history}>
          <div className={styles.historyTitle}>最近实验:</div>
          {experimentHistory.slice(-2).map((record) => (
            <div key={record.id} className={styles.historyItem}>
              {record.waterContent}% · {record.temperature}°C → {record.fallTime.toFixed(1)}s
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

CompactExperimentPanel.propTypes = {
  waterContentOptions: PropTypes.arrayOf(PropTypes.number),
  temperatureOptions: PropTypes.arrayOf(PropTypes.number),
  onExperimentStart: PropTypes.func,
  onExperimentComplete: PropTypes.func,
  onReset: PropTypes.func
};

export default CompactExperimentPanel;
