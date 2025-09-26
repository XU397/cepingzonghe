/**
 * 倒计时Hook
 * 提供可重用的倒计时功能，支持自定义时间和回调
 */

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 倒计时Hook
 * @param {Object} options - 配置选项
 * @param {number} options.initialTime - 初始时间（秒）
 * @param {Function} options.onComplete - 倒计时完成回调
 * @param {Function} options.onTick - 每秒回调（可选）
 * @param {boolean} options.autoStart - 是否自动开始（默认true）
 * @returns {Object} 倒计时状态和控制函数
 */
export const useCountdownTimer = ({
  initialTime = 40,
  onComplete = null,
  onTick = null,
  autoStart = true
}) => {
  const [timeRemaining, setTimeRemaining] = useState(initialTime);
  const [isActive, setIsActive] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);
  
  // 使用ref来存储定时器ID，避免内存泄漏
  const intervalRef = useRef(null);
  
  // 清除定时器
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // 开始倒计时
  const start = useCallback(() => {
    if (isCompleted) return;
    setIsActive(true);
  }, [isCompleted]);

  // 暂停倒计时
  const pause = useCallback(() => {
    setIsActive(false);
  }, []);

  // 重置倒计时
  const reset = useCallback(() => {
    clearTimer();
    setTimeRemaining(initialTime);
    setIsActive(autoStart);
    setIsCompleted(false);
  }, [initialTime, autoStart, clearTimer]);

  // 主要的倒计时效果
  useEffect(() => {
    if (!isActive || isCompleted) {
      clearTimer();
      return;
    }

    intervalRef.current = setInterval(() => {
      setTimeRemaining(prevTime => {
        const newTime = prevTime - 1;
        
        // 调用每秒回调
        if (onTick) {
          onTick(newTime);
        }
        
        // 检查是否完成
        if (newTime <= 0) {
          setIsActive(false);
          setIsCompleted(true);
          
          // 调用完成回调
          if (onComplete) {
            // 使用setTimeout确保状态更新完成后再调用回调
            setTimeout(() => onComplete(), 0);
          }
          
          return 0;
        }
        
        return newTime;
      });
    }, 1000);

    // 清理函数
    return clearTimer;
  }, [isActive, isCompleted, onTick, onComplete, clearTimer]);

  // 组件卸载时清理定时器
  useEffect(() => {
    return clearTimer;
  }, [clearTimer]);

  // 格式化时间显示
  const formatTime = useCallback((seconds) => {
    if (seconds <= 0) return '0s';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    return `${remainingSeconds}s`;
  }, []);

  // 返回状态和控制函数
  return {
    // 状态
    timeRemaining,
    isActive,
    isCompleted,
    
    // 控制函数
    start,
    pause,
    reset,
    
    // 工具函数
    formatTime: () => formatTime(timeRemaining),
    
    // 百分比进度（用于进度条等）
    progress: ((initialTime - timeRemaining) / initialTime) * 100,
    
    // 调试信息
    debug: {
      initialTime,
      timeRemaining,
      isActive,
      isCompleted,
      hasTimer: !!intervalRef.current
    }
  };
};

export default useCountdownTimer;