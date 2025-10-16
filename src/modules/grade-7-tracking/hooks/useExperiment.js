/**
 * useExperiment Hook - 实验状态管理
 *
 * 功能:
 * - 管理实验参数选择(量筒、温度)
 * - 管理实验历史记录(最多3次)
 * - 集成physicsModel.js计算下落时间
 * - 追踪实验状态(idle, selecting, animating, completed)
 * - 提供重置实验功能
 *
 * T044 - useExperiment Hook
 */

import { useState, useCallback, useRef } from 'react';
import { calculateFallTime, validateExperimentParameters } from '../utils/physicsModel';

const useExperiment = () => {
  // 当前实验参数
  const [selectedWaterContent, setSelectedWaterContent] = useState(null);
  const [selectedTemperature, setSelectedTemperature] = useState(null);

  // 实验状态
  const [experimentState, setExperimentState] = useState('idle'); // idle | selecting | animating | completed
  const [currentFallTime, setCurrentFallTime] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);

  // 实验历史记录(最多3次)
  const [experimentHistory, setExperimentHistory] = useState([]);
  const animationStartTimeRef = useRef(null);
  const experimentCountRef = useRef(0);

  /**
   * 选择含水量
   */
  const selectWaterContent = useCallback((waterContent) => {
    setSelectedWaterContent(waterContent);
    if (selectedTemperature !== null) {
      setExperimentState('selecting');
    }
  }, [selectedTemperature]);

  /**
   * 选择温度
   */
  const selectTemperature = useCallback((temperature) => {
    setSelectedTemperature(temperature);
    if (selectedWaterContent !== null) {
      setExperimentState('selecting');
    }
  }, [selectedWaterContent]);

  /**
   * 检查是否可以开始实验
   */
  const canStartExperiment = useCallback(() => {
    return (
      selectedWaterContent !== null &&
      selectedTemperature !== null &&
      experimentState !== 'animating'
    );
  }, [selectedWaterContent, selectedTemperature, experimentState]);

  /**
   * 开始实验
   */
  const startExperiment = useCallback(() => {
    if (!canStartExperiment()) {
      console.warn('[useExperiment] Cannot start: missing parameters or animation in progress');
      return null;
    }

    // 验证参数
    const validation = validateExperimentParameters(selectedWaterContent, selectedTemperature);
    if (!validation.isValid) {
      console.error('[useExperiment] Invalid parameters:', validation.error);
      return null;
    }

    // 计算下落时间
    const fallTime = calculateFallTime(selectedWaterContent, selectedTemperature);
    setCurrentFallTime(fallTime);
    setExperimentState('animating');
    setIsAnimating(true);
    animationStartTimeRef.current = Date.now();

    console.log('[useExperiment] Starting experiment:', {
      waterContent: selectedWaterContent,
      temperature: selectedTemperature,
      fallTime
    });

    return fallTime;
  }, [canStartExperiment, selectedWaterContent, selectedTemperature]);

  /**
   * 完成实验(动画结束时调用)
   */
  const completeExperiment = useCallback(() => {
    if (experimentState !== 'animating') {
      console.warn('[useExperiment] Cannot complete: not animating');
      return;
    }

    const animationEndTime = Date.now();
    const actualDuration = animationEndTime - animationStartTimeRef.current;

    // 记录到历史
    const experimentRecord = {
      id: experimentCountRef.current++,
      waterContent: selectedWaterContent,
      temperature: selectedTemperature,
      fallTime: currentFallTime,
      timestamp: animationEndTime,
      duration: actualDuration
    };

    setExperimentHistory((prev) => {
      // 最多保留3次实验记录
      const updated = [...prev, experimentRecord];
      return updated.slice(-3);
    });

    setExperimentState('completed');
    setIsAnimating(false);

    console.log('[useExperiment] Experiment completed:', experimentRecord);
  }, [experimentState, selectedWaterContent, selectedTemperature, currentFallTime]);

  /**
   * 重置实验
   */
  const resetExperiment = useCallback(() => {
    setSelectedWaterContent(null);
    setSelectedTemperature(null);
    setCurrentFallTime(null);
    setExperimentState('idle');
    setIsAnimating(false);
    animationStartTimeRef.current = null;

    console.log('[useExperiment] Experiment reset');
  }, []);

  /**
   * 清空历史记录
   */
  const clearHistory = useCallback(() => {
    setExperimentHistory([]);
    experimentCountRef.current = 0;
    console.log('[useExperiment] History cleared');
  }, []);

  /**
   * 获取特定条件下的历史记录
   */
  const getHistoryByConditions = useCallback((waterContent, temperature) => {
    return experimentHistory.filter(
      (record) =>
        record.waterContent === waterContent && record.temperature === temperature
    );
  }, [experimentHistory]);

  /**
   * 获取最佳(最短)下落时间
   */
  const getBestFallTime = useCallback(() => {
    if (experimentHistory.length === 0) return null;

    return experimentHistory.reduce((best, current) => {
      return !best || current.fallTime < best.fallTime ? current : best;
    }, null);
  }, [experimentHistory]);

  /**
   * 检查是否已完成至少一次实验
   */
  const hasCompletedExperiment = useCallback(() => {
    return experimentHistory.length > 0;
  }, [experimentHistory]);

  return {
    // 当前状态
    selectedWaterContent,
    selectedTemperature,
    experimentState,
    currentFallTime,
    isAnimating,

    // 历史记录
    experimentHistory,
    experimentCount: experimentCountRef.current,

    // 操作方法
    selectWaterContent,
    selectTemperature,
    canStartExperiment,
    startExperiment,
    completeExperiment,
    resetExperiment,
    clearHistory,

    // 查询方法
    getHistoryByConditions,
    getBestFallTime,
    hasCompletedExperiment
  };
};

export default useExperiment;
