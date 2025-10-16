/**
 * Page10_Experiment - 模拟实验页面
 *
 * 功能:
 * - 左右分栏布局:左侧实验操作区,右侧说明区
 * - 集成BeakerSelector、TemperatureControl、BallDropAnimation、TimerDisplay
 * - 实验控制逻辑:"开始实验"/"重置实验"按钮
 * - 实验历史记录(最多3次)
 * - 支持实验参数的实时验证
 *
 * T045a/b/c - Page10_Experiment页面(3个子任务)
 * FR-017 to FR-027
 */

import { useCallback, useEffect, useState } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import { useDataLogger } from '../hooks/useDataLogger';
import BeakerSelector from '../components/experiment/BeakerSelector';
import TemperatureControl from '../components/experiment/TemperatureControl';
import BallDropAnimation from '../components/experiment/BallDropAnimation';
import TimerDisplay from '../components/experiment/TimerDisplay';
import useExperiment from '../hooks/useExperiment';
import { WATER_CONTENT_OPTIONS, TEMPERATURE_OPTIONS } from '../config';
import styles from '../styles/Page10_Experiment.module.css';

const Page10_Experiment = () => {
  const {
    logOperation,
    collectAnswer,
    clearOperations,
    buildMarkObject,
    navigateToPage
  } = useTrackingContext();

  const { submitPageData } = useDataLogger();
  const [isNavigating, setIsNavigating] = useState(false);

  const {
    selectedWaterContent,
    selectedTemperature,
    experimentState,
    currentFallTime,
    isAnimating,
    experimentHistory,
    selectWaterContent,
    selectTemperature,
    canStartExperiment,
    startExperiment,
    completeExperiment,
    resetExperiment,
    hasCompletedExperiment
  } = useExperiment();

  // 记录页面进入
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: '页面',
      value: 'Page10_Experiment',
      time: new Date().toISOString()
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: '页面',
        value: 'Page10_Experiment',
        time: new Date().toISOString()
      });
    };
  }, [logOperation]);

  // 处理量筒选择
  const handleWaterContentChange = useCallback((waterContent) => {
    selectWaterContent(waterContent);
    logOperation({
      action: '点击',
      target: '量筒选择器',
      value: `${waterContent}%`,
      time: new Date().toISOString()
    });
  }, [selectWaterContent, logOperation]);

  // 处理温度选择
  const handleTemperatureChange = useCallback((temperature) => {
    selectTemperature(temperature);
    logOperation({
      action: '点击',
      target: '温度控制器',
      value: `${temperature}°C`,
      time: new Date().toISOString()
    });
  }, [selectTemperature, logOperation]);

  // 处理开始实验
  const handleStartExperiment = useCallback(() => {
    const fallTime = startExperiment();
    if (fallTime !== null) {
      logOperation({
        action: '点击',
        target: '开始实验按钮',
        value: JSON.stringify({
          waterContent: selectedWaterContent,
          temperature: selectedTemperature,
          expectedFallTime: fallTime
        }),
        time: new Date().toISOString()
      });
    }
  }, [startExperiment, selectedWaterContent, selectedTemperature, logOperation]);

  // 处理动画结束
  const handleAnimationEnd = useCallback(() => {
    completeExperiment();
    logOperation({
      action: '完成',
      target: '实验动画',
      value: JSON.stringify({
        waterContent: selectedWaterContent,
        temperature: selectedTemperature,
        fallTime: currentFallTime
      }),
      time: new Date().toISOString()
    });

    // 收集实验结果作为答案
    collectAnswer({
      targetElement: `实验记录_${experimentHistory.length + 1}`,
      value: JSON.stringify({
        waterContent: selectedWaterContent,
        temperature: selectedTemperature,
        fallTime: currentFallTime
      })
    });
  }, [completeExperiment, selectedWaterContent, selectedTemperature, currentFallTime, experimentHistory.length, logOperation, collectAnswer]);

  // 处理重置实验
  const handleResetExperiment = useCallback(() => {
    resetExperiment();
    logOperation({
      action: '点击',
      target: '重置实验按钮',
      value: '重置实验',
      time: new Date().toISOString()
    });
  }, [resetExperiment, logOperation]);

  // 处理下一页
  const handleNextPage = useCallback(async () => {
    if (!hasCompletedExperiment() || isNavigating) {
      return;
    }

    setIsNavigating(true);

    try {
      logOperation({
        action: '点击',
        target: '下一页按钮',
        value: '完成实验,进入分析',
        time: new Date().toISOString()
      });

      // 收集所有实验历史记录
      collectAnswer({
        targetElement: '实验历史记录',
        value: JSON.stringify(experimentHistory)
      });

      // 构建并提交MarkObject
      const markObject = buildMarkObject('10', '模拟实验');
      const success = await submitPageData(markObject);

      if (success) {
        clearOperations();
        await navigateToPage(11);
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page10_Experiment] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
      setIsNavigating(false);
    }
  }, [hasCompletedExperiment, isNavigating, experimentHistory, logOperation, collectAnswer, buildMarkObject, submitPageData, clearOperations, navigateToPage]);

  return (
    <div className={styles.container}>
      <div className={styles.pageTitle}>
        <h2>模拟实验:蜂蜜黏度测量</h2>
        <p className={styles.subtitle}>利用落球法测量不同条件下蜂蜜的黏度</p>
      </div>

      <div className={styles.contentLayout}>
        {/* 左侧:实验操作区 */}
        <div className={styles.leftPanel}>
          <div className={styles.experimentSection}>
            <h3 className={styles.sectionTitle}>实验参数设置</h3>

            <div className={styles.parameterSection}>
              <BeakerSelector
                selectedWaterContent={selectedWaterContent}
                onWaterContentChange={handleWaterContentChange}
                disabled={isAnimating}
                waterContentOptions={WATER_CONTENT_OPTIONS}
              />
            </div>

            <div className={styles.parameterSection}>
              <TemperatureControl
                selectedTemperature={selectedTemperature}
                onTemperatureChange={handleTemperatureChange}
                disabled={isAnimating}
                temperatureOptions={TEMPERATURE_OPTIONS}
              />
            </div>
          </div>

          <div className={styles.animationSection}>
            <h3 className={styles.sectionTitle}>实验演示</h3>
            <div className={styles.experimentDisplay}>
              <BallDropAnimation
                fallTime={currentFallTime || 5}
                isAnimating={isAnimating}
                onAnimationEnd={handleAnimationEnd}
                beakerHeight={300}
                ballSize={20}
              />
              <TimerDisplay
                time={currentFallTime}
                isRunning={isAnimating}
                label="下落时间"
                unit="秒"
                showMilliseconds
                size="large"
              />
            </div>
          </div>

          <div className={styles.controlSection}>
            <button
              type="button"
              className={`${styles.controlButton} ${styles.startButton}`}
              onClick={handleStartExperiment}
              disabled={!canStartExperiment() || isAnimating}
            >
              {experimentState === 'idle' || experimentState === 'selecting'
                ? '开始实验'
                : experimentState === 'animating'
                ? '实验进行中...'
                : '再次实验'}
            </button>

            <button
              type="button"
              className={`${styles.controlButton} ${styles.resetButton}`}
              onClick={handleResetExperiment}
              disabled={isAnimating}
            >
              重置实验
            </button>
          </div>

          {experimentHistory.length > 0 && (
            <div className={styles.historySection}>
              <h4 className={styles.historySectionTitle}>
                实验记录 ({experimentHistory.length}/3)
              </h4>
              <div className={styles.historyList}>
                {experimentHistory.map((record, index) => (
                  <div key={record.id} className={styles.historyItem}>
                    <span className={styles.historyIndex}>#{index + 1}</span>
                    <span className={styles.historyDetails}>
                      含水量 {record.waterContent}% · 温度 {record.temperature}°C
                    </span>
                    <span className={styles.historyTime}>
                      {record.fallTime.toFixed(1)}秒
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 右侧:说明区 */}
        <div className={styles.rightPanel}>
          <div className={styles.instructionCard}>
            <div className={styles.characterAvatar}>
              <div className={styles.avatarCircle}>小明</div>
            </div>

            <div className={styles.dialogueBubble}>
              <p>
                我想利用<strong>落球法</strong>测量蜂蜜的黏度。
              </p>
              <p>
                通过观察小钢球在不同条件下的蜂蜜中下落的时间，
                我可以比较不同含水量和温度对蜂蜜黏度的影响。
              </p>
            </div>
          </div>

          <div className={styles.stepsCard}>
            <h4 className={styles.stepsTitle}>实验步骤</h4>
            <ol className={styles.stepsList}>
              <li>选择一个量筒(对应不同的蜂蜜含水量)</li>
              <li>设置环境温度(5个温度档位可选)</li>
              <li>点击&quot;开始实验&quot;按钮,观察小球下落</li>
              <li>记录小球从顶部落到底部的时间</li>
              <li>可以重复实验,探索不同条件的影响</li>
            </ol>
          </div>

          <div className={styles.hintCard}>
            <div className={styles.hintIcon}>💡</div>
            <div className={styles.hintContent}>
              <strong>提示:</strong>
              <p>含水量越高,黏度越低,小球下落越快</p>
              <p>温度越高,黏度越低,小球下落越快</p>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.navigationFooter}>
        <button
          type="button"
          className={styles.nextButton}
          onClick={handleNextPage}
          disabled={!hasCompletedExperiment() || isNavigating}
        >
          {hasCompletedExperiment()
            ? (isNavigating ? '跳转中...' : '完成实验,进入分析')
            : '请先完成至少一次实验'}
        </button>
      </div>
    </div>
  );
};

export default Page10_Experiment;
