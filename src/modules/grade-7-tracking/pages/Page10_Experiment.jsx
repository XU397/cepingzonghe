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
      <h1 className={styles.pageTitle}>蜂蜜黏度: 模拟实验</h1>

      <div className={styles.contentLayout}>
        {/* 左侧:说明面板 */}
        <div className={styles.instructionsPanel}>
          <h2 className={styles.instructionsTitle}>模拟实验步骤如下：</h2>
          <ol className={styles.stepsList}>
            <li>准备4个量筒,分别装有不同含水量的蜂蜜(15%、17%、19%、21%)；</li>
            <li>准备5个恒温箱,分别设其温度为 25°C、30°C、35°C、40°C、45°C；</li>
            <li>选择量筒和温度后,将量筒放入恒温箱,记录小钢球从顶部落到底部的时间。</li>
          </ol>

          <hr className={styles.divider} />

          <h3 className={styles.instructionsSectionTitle}>【说明】右侧为实验互动界面:</h3>
          <ul className={styles.instructionsList}>
            <li>选择量筒(对应不同的蜂蜜含水量:15%、17%、19%、21%)。</li>
            <li>调节温度控制器设置环境温度(25°C-45°C,共5档)。</li>
            <li>设置完成后,单击&quot;开始实验&quot;按钮,小球会在量筒中下落。</li>
            <li>下落结束后,计时器显示小球的下落时间。</li>
            <li>单击&quot;重置实验&quot;可重新开始。</li>
          </ul>

          <div className={styles.hintBox}>
            <div className={styles.hintIcon}>💡</div>
            <div className={styles.hintContent}>
              <strong>提示：</strong>
              <p>含水量越高,黏度越低,小球下落越快</p>
              <p>温度越高,黏度越低,小球下落越快</p>
            </div>
          </div>
        </div>

        {/* 右侧:实验环境面板 */}
        <div className={styles.simulationEnvironmentPanel}>
          <div className={styles.experimentContainer}>
            {/* 实验参数选择区 */}
            <div className={styles.parameterSelectionArea}>
              <BeakerSelector
                selectedWaterContent={selectedWaterContent}
                onWaterContentChange={handleWaterContentChange}
                disabled={isAnimating}
                waterContentOptions={WATER_CONTENT_OPTIONS}
              />
              <TemperatureControl
                selectedTemperature={selectedTemperature}
                onTemperatureChange={handleTemperatureChange}
                disabled={isAnimating}
                temperatureOptions={TEMPERATURE_OPTIONS}
              />
            </div>

            {/* 实验动画显示区 */}
            <div className={styles.experimentDisplayArea}>
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

            {/* 控制按钮区 */}
            <div className={styles.controlButtonsArea}>
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

            {/* 实验历史记录 */}
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
        </div>
      </div>

      {/* 底部导航按钮 */}
      <div className={styles.navigationFooter}>
        <button
          type="button"
          className={styles.nextButton}
          onClick={handleNextPage}
          disabled={!hasCompletedExperiment() || isNavigating}
        >
          {hasCompletedExperiment()
            ? (isNavigating ? '跳转中...' : '下一页')
            : '请先完成至少一次实验'}
        </button>
      </div>
    </div>
  );
};

export default Page10_Experiment;
