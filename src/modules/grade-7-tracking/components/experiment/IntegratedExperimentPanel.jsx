/**
 * IntegratedExperimentPanel - 集成实验面板组件
 *
 * 完全按照7年级蒸馒头实验的UI设计
 * 包含: 4个量筒(带小球动画) + 时间显示条 + 温度控制 + 控制按钮
 */

import { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import styles from '../../styles/IntegratedExperimentPanel.module.css';

const IntegratedExperimentPanel = ({
  waterContentOptions = [15, 17, 19, 21],
  temperatureOptions = [25, 30, 35, 40, 45],
  onExperimentStart,
  onExperimentComplete,
  onReset
}) => {
  // 当前选中的温度
  const [selectedTemperature, setSelectedTemperature] = useState(25);

  // 每个量筒的状态
  const [beakerStates, setBeakerStates] = useState(
    waterContentOptions.map(wc => ({
      waterContent: wc,
      fallTime: 0,
      isAnimating: false,
      hasCompleted: false
    }))
  );

  // 重置所有量筒
  const handleReset = useCallback(() => {
    setBeakerStates(waterContentOptions.map(wc => ({
      waterContent: wc,
      fallTime: 0,
      isAnimating: false,
      hasCompleted: false
    })));

    if (onReset) {
      onReset();
    }
  }, [waterContentOptions, onReset]);

  // 开始实验
  const handleStartExperiment = useCallback(() => {
    if (onExperimentStart) {
      // 为每个量筒获取下落时间
      const experimentData = waterContentOptions.map(wc => {
        const fallTime = onExperimentStart(wc, selectedTemperature);
        return { waterContent: wc, fallTime };
      });

      // 更新所有量筒状态为动画中
      setBeakerStates(experimentData.map(data => ({
        waterContent: data.waterContent,
        fallTime: data.fallTime,
        isAnimating: true,
        hasCompleted: false
      })));

      // 找到最长的下落时间
      const maxFallTime = Math.max(...experimentData.map(d => d.fallTime));

      // 在最长时间后标记所有动画完成
      setTimeout(() => {
        setBeakerStates(prev => prev.map(state => ({
          ...state,
          isAnimating: false,
          hasCompleted: true
        })));

        if (onExperimentComplete) {
          onExperimentComplete(experimentData);
        }
      }, maxFallTime * 1000);
    }
  }, [waterContentOptions, selectedTemperature, onExperimentStart, onExperimentComplete]);

  // 判断是否正在进行实验
  const isExperimenting = beakerStates.some(state => state.isAnimating);

  return (
    <div className={styles.container}>
      {/* 4个量筒横向排列 */}
      <div className={styles.beakersRow}>
        {beakerStates.map((beaker) => (
          <BeakerWithBall
            key={beaker.waterContent}
            waterContent={beaker.waterContent}
            fallTime={beaker.fallTime}
            isAnimating={beaker.isAnimating}
            hasCompleted={beaker.hasCompleted}
          />
        ))}
      </div>

      {/* 绿色时间显示条 */}
      <div className={styles.timeBar}>
        <div className={styles.timeLabel}>时间</div>
        <div className={styles.timeValues}>
          {beakerStates.map((beaker) => (
            <div key={beaker.waterContent} className={styles.timeValue}>
              {beaker.hasCompleted ? beaker.fallTime.toFixed(1) : '0.0'}
            </div>
          ))}
        </div>
      </div>

      {/* 底部控制区 */}
      <div className={styles.controlsRow}>
        {/* 重置按钮 */}
        <button
          type="button"
          className={styles.resetButton}
          onClick={handleReset}
          disabled={isExperimenting}
        >
          重置
        </button>

        {/* 温度控制 */}
        <TemperatureSelector
          selectedTemperature={selectedTemperature}
          temperatureOptions={temperatureOptions}
          onTemperatureChange={setSelectedTemperature}
          disabled={isExperimenting}
        />

        {/* 计时开始按钮 */}
        <button
          type="button"
          className={styles.startButton}
          onClick={handleStartExperiment}
          disabled={isExperimenting}
        >
          计时开始
        </button>
      </div>
    </div>
  );
};

/**
 * 根据含水量计算蜂蜜颜色（渐变）
 * 含水量越高，黏度越低，颜色越浅
 * 使用更明亮的黄色系
 */
const getHoneyColor = (waterContent) => {
  const colorMap = {
    15: 'linear-gradient(180deg, #F0C05A 0%, #E5A839 100%)', // 明亮深金黄色
    17: 'linear-gradient(180deg, #F5D76E 0%, #EFBC47 100%)', // 明亮中深金黄色
    19: 'linear-gradient(180deg, #FFE082 0%, #FFD54F 100%)', // 明亮中浅金黄色
    21: 'linear-gradient(180deg, #FFEB99 0%, #FFE066 100%)'  // 明亮浅金黄色
  };
  return colorMap[waterContent] || 'linear-gradient(180deg, #F5D76E 0%, #EFBC47 100%)';
};

/**
 * 带小球的量筒组件
 */
const BeakerWithBall = ({ waterContent, fallTime, isAnimating, hasCompleted }) => {
  const [ballPosition, setBallPosition] = useState(0); // 0% to 100%

  useEffect(() => {
    if (isAnimating && fallTime > 0) {
      // 小球从量筒外部（-10%）开始下落到底部（94%）
      setBallPosition(-10);

      // 启动动画
      const startTime = Date.now();
      const duration = fallTime * 1000; // 转换为毫秒

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // 从 -10% 到 94%
        setBallPosition(-10 + progress * 104);

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isAnimating, fallTime]);

  // 重置或初始状态时，确保小球位于量筒外部上方（被夹子夹着）
  useEffect(() => {
    if (!isAnimating && !hasCompleted) {
      setBallPosition(-10); // 小球在量筒外部上方
    }
  }, [isAnimating, hasCompleted]);

  return (
    <div className={styles.beakerContainer}>
      {/* 夹子（圆环）- 始终显示在量筒上方 */}
      <div className={styles.clipper}>
        <div className={styles.clipperRing}></div>
        <div className={styles.clipperHook}></div>
      </div>

      {/* 量筒外框 */}
      <div className={styles.beaker}>
        {/* 刻度线 */}
        <div className={styles.scales}>
          {[250, 200, 150, 100, 50].map(mark => (
            <div key={mark} className={styles.scaleLine}>
              <span className={styles.scaleLabel}>{mark}</span>
            </div>
          ))}
        </div>

        {/* 蜂蜜液体 - 填满整个量筒，根据含水量显示不同深度的黄色 */}
        <div
          className={styles.honeyLiquid}
          style={{
            height: '100%',
            background: getHoneyColor(waterContent)
          }}
        />

        {/* 小球：初始在量筒外部上方（被夹子夹着），计时开始后下落 */}
        <div
          className={styles.ball}
          style={{
            top: `${ballPosition}%`,
            transition: isAnimating ? 'none' : 'top 0.3s ease'
          }}
        />
      </div>

      {/* 浓度标签 */}
      <div className={styles.concentrationLabel}>{waterContent}%</div>
    </div>
  );
};

BeakerWithBall.propTypes = {
  waterContent: PropTypes.number.isRequired,
  fallTime: PropTypes.number.isRequired,
  isAnimating: PropTypes.bool.isRequired,
  hasCompleted: PropTypes.bool.isRequired
};

/**
 * 温度选择器组件 (上下按钮控制样式 - 仿照蒸馒头实验)
 */
const TemperatureSelector = ({
  selectedTemperature,
  temperatureOptions,
  onTemperatureChange,
  disabled
}) => {
  const handleDecreaseTemperature = () => {
    const currentIndex = temperatureOptions.indexOf(selectedTemperature);
    if (currentIndex > 0) {
      onTemperatureChange(temperatureOptions[currentIndex - 1]);
    }
  };

  const handleIncreaseTemperature = () => {
    const currentIndex = temperatureOptions.indexOf(selectedTemperature);
    if (currentIndex < temperatureOptions.length - 1) {
      onTemperatureChange(temperatureOptions[currentIndex + 1]);
    }
  };

  const isMinTemperature = selectedTemperature <= temperatureOptions[0];
  const isMaxTemperature = selectedTemperature >= temperatureOptions[temperatureOptions.length - 1];

  return (
    <div className={styles.temperatureSelector}>
      <button
        type="button"
        className={styles.temperatureAdjustButton}
        onClick={handleDecreaseTemperature}
        disabled={disabled || isMinTemperature}
        aria-label="降低温度"
      >
        -
      </button>
      <span className={styles.temperatureDisplay}>
        <span className={styles.thermometerIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="10" y="3" width="4" height="12" rx="2" />
            <circle cx="12" cy="18" r="3" />
          </svg>
        </span>
        {selectedTemperature}°C
      </span>
      <button
        type="button"
        className={styles.temperatureAdjustButton}
        onClick={handleIncreaseTemperature}
        disabled={disabled || isMaxTemperature}
        aria-label="升高温度"
      >
        +
      </button>
    </div>
  );
};

TemperatureSelector.propTypes = {
  selectedTemperature: PropTypes.number.isRequired,
  temperatureOptions: PropTypes.arrayOf(PropTypes.number).isRequired,
  onTemperatureChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

IntegratedExperimentPanel.propTypes = {
  waterContentOptions: PropTypes.arrayOf(PropTypes.number),
  temperatureOptions: PropTypes.arrayOf(PropTypes.number),
  onExperimentStart: PropTypes.func,
  onExperimentComplete: PropTypes.func,
  onReset: PropTypes.func
};

export default IntegratedExperimentPanel;
