import React from 'react';
import { useGrade4Context } from '../context/Grade4Context';
import { moduleConfig } from '../moduleConfig';
import './GlobalTimer.css';

const GlobalTimer = () => {
  const { globalTimer } = useGrade4Context();

  // 格式化时间显示 (mm:ss)
  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 如果计时器未激活或已完成，不显示
  if (!globalTimer.isActive || globalTimer.isCompleted) {
    return null;
  }

  // 判断是否为警告/严重状态（从配置读取阈值）
  const warningThresholdSeconds = moduleConfig?.settings?.warningThresholdSeconds ?? 5 * 60;
  const criticalThresholdSeconds = moduleConfig?.settings?.criticalThresholdSeconds ?? 60;
  const isCritical = globalTimer.remainingTime <= criticalThresholdSeconds;
  const isWarning = !isCritical && (globalTimer.remainingTime <= warningThresholdSeconds);

  return (
    <div className={`global-timer ${isCritical ? 'critical' : isWarning ? 'warning' : ''}`}>
      <div className="timer-icon">⏰</div>
      <div className="timer-text">
        <span className="timer-label">剩余时间</span>
        <span className="timer-value">{formatTime(globalTimer.remainingTime)}</span>
        {(isWarning || isCritical) && (
          <span className="timer-hint">
            {isCritical ? '⚠️ 最后一分钟，请尽快完成' : `⚠️ 少于${Math.ceil(warningThresholdSeconds/60)}分钟`}
          </span>
        )}
      </div>
    </div>
  );
};

export default GlobalTimer;
