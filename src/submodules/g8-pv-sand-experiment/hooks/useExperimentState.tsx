import { useCallback, useEffect } from 'react';
import { usePvSandContext } from '../context/PvSandContext';
import { HeightLevel, ExperimentState } from '../types';
import { getWindSpeedData, validateHeightLevel, ANIMATION_DURATION } from '../constants/windSpeedData';

export const useExperimentState = () => {
  const { 
    experimentState, 
    updateExperimentState, 
    logOperation 
  } = usePvSandContext();

  const startExperiment = useCallback(() => {
    if (experimentState.isRunning) return;

    const startTime = Date.now();
    
    updateExperimentState({
      isRunning: true,
      isCompleted: false,
      animationState: 'starting',
      animationStartTime: startTime,
      collectedData: null
    });

    logOperation({
      targetElement: '开始按钮',
      eventType: 'click',
      value: `开始实验_高度${experimentState.currentHeight}cm`,
      time: new Date().toISOString()
    });

    setTimeout(() => {
      updateExperimentState({
        animationState: 'running'
      });
    }, 100);

    setTimeout(() => {
      completeExperiment();
    }, ANIMATION_DURATION);
  }, [experimentState, updateExperimentState, logOperation]);

  const completeExperiment = useCallback(() => {
    const windData = getWindSpeedData(experimentState.currentHeight);
    const timestamp = new Date().toISOString();

    const collectedData = {
      heightLevel: experimentState.currentHeight,
      withPanelSpeed: windData.withPanel,
      noPanelSpeed: windData.noPanel,
      timestamp
    };

    updateExperimentState({
      isRunning: false,
      isCompleted: true,
      animationState: 'completed',
      collectedData,
      operationHistory: [
        ...experimentState.operationHistory,
        {
          action: 'start_experiment' as const,
          toValue: `height_${experimentState.currentHeight}cm`,
          timestamp
        }
      ]
    });

    logOperation({
      targetElement: '实验数据',
      eventType: 'change',
      value: JSON.stringify(collectedData),
      time: timestamp
    });
  }, [experimentState, updateExperimentState, logOperation]);

  const resetExperiment = useCallback(() => {
    updateExperimentState({
      isRunning: false,
      isCompleted: false,
      animationState: 'idle',
      animationStartTime: null,
      collectedData: null,
      operationHistory: [
        ...experimentState.operationHistory,
        {
          action: 'reset_experiment' as const,
          timestamp: new Date().toISOString()
        }
      ]
    });

    logOperation({
      targetElement: '重置按钮',
      eventType: 'click',
      value: '重置实验',
      time: new Date().toISOString()
    });
  }, [experimentState, updateExperimentState, logOperation]);

  const changeHeight = useCallback((newHeight: HeightLevel) => {
    if (!validateHeightLevel(newHeight) || experimentState.isRunning) {
      return;
    }

    const previousHeight = experimentState.currentHeight;

    updateExperimentState({
      currentHeight: newHeight,
      isCompleted: false,
      collectedData: null,
      operationHistory: [
        ...experimentState.operationHistory,
        {
          action: 'height_change' as const,
          fromValue: `${previousHeight}cm`,
          toValue: `${newHeight}cm`,
          timestamp: new Date().toISOString()
        }
      ]
    });

    logOperation({
      targetElement: '高度调节器',
      eventType: 'click',
      value: `调节高度_从${previousHeight}到${newHeight}cm`,
      time: new Date().toISOString()
    });
  }, [experimentState, updateExperimentState, logOperation]);

  const getAnimationProgress = useCallback((): number => {
    if (
      experimentState.animationState !== 'running' || 
      !experimentState.animationStartTime
    ) {
      return experimentState.animationState === 'completed' ? 1 : 0;
    }

    const elapsed = Date.now() - experimentState.animationStartTime;
    return Math.min(elapsed / ANIMATION_DURATION, 1);
  }, [experimentState.animationState, experimentState.animationStartTime]);

  const getCurrentWindData = useCallback(() => {
    return getWindSpeedData(experimentState.currentHeight);
  }, [experimentState.currentHeight]);

  const isExperimentReady = useCallback(() => {
    return (
      !experimentState.isRunning && 
      experimentState.animationState === 'idle'
    );
  }, [experimentState.isRunning, experimentState.animationState]);

  const canChangeHeight = useCallback(() => {
    return !experimentState.isRunning;
  }, [experimentState.isRunning]);

  useEffect(() => {
    const savedState = sessionStorage.getItem('g8-pv-sand-experiment.experimentState');
    if (savedState) {
      try {
        const parsedState: Partial<ExperimentState> = JSON.parse(savedState);
        updateExperimentState(parsedState);
      } catch (error) {
        console.warn('Failed to restore experiment state from sessionStorage:', error);
      }
    }
  }, [updateExperimentState]);

  useEffect(() => {
    sessionStorage.setItem(
      'g8-pv-sand-experiment.experimentState',
      JSON.stringify(experimentState)
    );
  }, [experimentState]);

  return {
    experimentState,
    startExperiment,
    resetExperiment,
    changeHeight,
    getAnimationProgress,
    getCurrentWindData,
    isExperimentReady,
    canChangeHeight
  };
};