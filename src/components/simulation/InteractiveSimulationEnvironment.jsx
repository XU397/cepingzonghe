/**
 * @file InteractiveSimulationEnvironment.jsx
 * @description 模拟实验主环境组件，集成量筒和控制器。
 */
import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import MeasuringCylinder from './MeasuringCylinder';
import SimulationControls from './SimulationControls';
import { simulationTableData } from '../../utils/simulationData';
import { useAppContext } from '../../context/AppContext';
import EventTypes from '@shared/services/submission/eventTypes.js';
import styles from './InteractiveSimulationEnvironment.module.css';

const INITIAL_VOLUME = 70; // ml
const TEMPERATURES = [20, 25, 30, 35, 40]; // °C
const ANIMATION_DURATION = 1500; // ms, 应与MeasuringCylinder.module.css中的动画时长一致
const DEFAULT_TIME = 1; // hour

/**
 * 模拟实验主环境组件
 * @param {object} props - 组件属性
 * @param {string} [props.pageId=null] - 当前页面的ID。现在 logOperation 从 AppContext 获取，此prop基本不再需要。
 * @param {Function} [props.onTimingStart] - "计时开始"按钮点击时的回调函数，接收选定的时间作为参数。
 * @param {Function} [props.onTimingStarted] - 兼容旧命名的计时开始回调。
 * @param {Function} [props.onLogOperation] - 可选的埋点函数，用于将实验事件写入统一操作列表。
 */
const InteractiveSimulationEnvironment = ({
  pageId = null,
  onTimingStart,
  onTimingStarted,
  onLogOperation
}) => {
  const [selectedTime, setSelectedTime] = useState(DEFAULT_TIME);
  const [cylinderVolumes, setCylinderVolumes] = useState(() => {
    const initialVolumes = {};
    TEMPERATURES.forEach(temp => {
      initialVolumes[temp] = INITIAL_VOLUME;
    });
    return initialVolumes;
  });
  const [isTiming, setIsTiming] = useState(false);
  const [runIdCounter, setRunIdCounter] = useState(0);

  const { logOperation: contextLogOperation, currentPageId } = useAppContext();
  const emitOperation = useCallback((operation) => {
    const logger = onLogOperation || contextLogOperation;
    if (typeof logger === 'function') {
      logger(operation);
    }
  }, [contextLogOperation, onLogOperation]);

  const handleTimeChange = (newTime) => {
    if (newTime === selectedTime) return;
    const prevTime = selectedTime;
    setSelectedTime(newTime);
    emitOperation({
      targetElement: 'time_selector',
      eventType: EventTypes.SIMULATION_OPERATION,
      value: {
        action: 'adjust_time',
        prev: `${prevTime}小时`,
        next: `${newTime}小时`,
      },
    });
  };

  const handleStartTiming = () => {
    if (isTiming) return;

    setIsTiming(true);
    const newRunId = runIdCounter + 1;
    setRunIdCounter(newRunId);

    emitOperation({
      targetElement: 'start_button',
      eventType: EventTypes.SIMULATION_TIMING_STARTED,
      value: {
        selectedTime,
        unit: 'hour',
      },
    });

    const timingStartHandler = onTimingStart || onTimingStarted;
    if (timingStartHandler) {
      timingStartHandler(selectedTime);
    }

    const newVolumes = {};
    TEMPERATURES.forEach(temp => {
      const timeDataForSelectedHour = simulationTableData.volumeData[selectedTime];
      if (timeDataForSelectedHour && typeof timeDataForSelectedHour[temp] !== 'undefined') {
        newVolumes[temp] = timeDataForSelectedHour[temp];
      } else {
        newVolumes[temp] = cylinderVolumes[temp] || INITIAL_VOLUME;
        console.warn(`模拟数据缺失: 时间 ${selectedTime}h, 温度 ${temp}°C. 使用当前/初始体积.`);
      }
    });

    setCylinderVolumes(newVolumes);

    const resultsForLog = TEMPERATURES.map(temp => ({
      Temp: temp,
      Volume: newVolumes[temp],
    }));

    emitOperation({
      targetElement: 'simulation_result',
      eventType: EventTypes.SIMULATION_RUN_RESULT,
      value: {
        Run_ID: `run_${pageId || currentPageId || 'simulation'}_${newRunId}`,
        Set_Time: selectedTime,
        Results: resultsForLog,
      }
    });

    setTimeout(() => {
      setIsTiming(false);
    }, ANIMATION_DURATION);
  };

  const handleReset = () => {
    if (isTiming) return;

    emitOperation({
      targetElement: 'reset_button',
      eventType: EventTypes.SIMULATION_OPERATION,
      value: { action: 'reset' },
    });

    setSelectedTime(DEFAULT_TIME);
    const initialVolumes = {};
    TEMPERATURES.forEach(temp => {
      initialVolumes[temp] = INITIAL_VOLUME;
    });
    setCylinderVolumes(initialVolumes);
  };

  return (
    <div className={styles.simulationEnvironmentContainer}>
      <div className={styles.measuringCylindersArea}>
        {TEMPERATURES.map(temp => (
          <MeasuringCylinder
            key={`cylinder-${temp}`}
            temperatureLabel={`${temp}°C`}
            currentVolume={cylinderVolumes[temp] || INITIAL_VOLUME}
            maxVolume={250}
            initialVolume={INITIAL_VOLUME}
          />
        ))}
      </div>
      <SimulationControls
        currentTime={selectedTime}
        onTimeChange={handleTimeChange}
        onStartTiming={handleStartTiming}
        onReset={handleReset}
        isTiming={isTiming}
        isMinTimeReached={selectedTime <= 1}
        isMaxTimeReached={selectedTime >= 8}
      />
    </div>
  );
};

InteractiveSimulationEnvironment.propTypes = {
  pageId: PropTypes.string,
  onTimingStart: PropTypes.func,
  onTimingStarted: PropTypes.func,
  onLogOperation: PropTypes.func,
};

export default InteractiveSimulationEnvironment; 
