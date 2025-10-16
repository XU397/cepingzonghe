/**
 * Page12_Analysis2 - 实验分析页面2
 *
 * 功能:
 * - 保留左侧实验区(允许继续实验)
 * - 右侧显示单选题:"当含水量为15%时,温度至少需要达到多少度,才能使小钢球的下落时间小于5秒?"
 * - 选项:25℃, 30℃, 35℃, 40℃, 45℃
 * - FR-030
 *
 * T048 - Page12_Analysis2页面
 */

import { useState, useCallback, useEffect } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import { useDataLogger } from '../hooks/useDataLogger';
import BeakerSelector from '../components/experiment/BeakerSelector';
import TemperatureControl from '../components/experiment/TemperatureControl';
import BallDropAnimation from '../components/experiment/BallDropAnimation';
import TimerDisplay from '../components/experiment/TimerDisplay';
import useExperiment from '../hooks/useExperiment';
import { WATER_CONTENT_OPTIONS, TEMPERATURE_OPTIONS } from '../config';
import styles from '../styles/AnalysisPage.module.css';

const Page12_Analysis2 = () => {
  const {
    logOperation,
    collectAnswer,
    clearOperations,
    buildMarkObject,
    navigateToPage
  } = useTrackingContext();

  const { submitPageData } = useDataLogger();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const {
    selectedWaterContent,
    selectedTemperature,
    currentFallTime,
    isAnimating,
    experimentHistory,
    selectWaterContent,
    selectTemperature,
    canStartExperiment,
    startExperiment,
    completeExperiment,
    resetExperiment
  } = useExperiment();

  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: '页面',
      value: 'Page12_Analysis2',
      time: new Date().toISOString()
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: '页面',
        value: 'Page12_Analysis2',
        time: new Date().toISOString()
      });
    };
  }, [logOperation]);

  const handleAnswerChange = useCallback((answer) => {
    setSelectedAnswer(answer);

    logOperation({
      action: '单选',
      target: '实验分析题2',
      value: answer,
      time: new Date().toISOString()
    });
  }, [logOperation]);

  const handleNextPage = useCallback(async () => {
    if (!selectedAnswer || isNavigating) {
      return;
    }

    setIsNavigating(true);

    try {
      logOperation({
        action: '点击',
        target: '下一页按钮',
        value: '下一题',
        time: new Date().toISOString()
      });

      // 收集答案
      collectAnswer({
        targetElement: 'analysis_q2',
        value: selectedAnswer
      });

      // 构建并提交MarkObject
      const markObject = buildMarkObject('12', '实验分析2');
      const success = await submitPageData(markObject);

      if (success) {
        clearOperations();
        await navigateToPage(13);
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page12_Analysis2] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
      setIsNavigating(false);
    }
  }, [selectedAnswer, isNavigating, logOperation, collectAnswer, buildMarkObject, submitPageData, clearOperations, navigateToPage]);

  return (
    <div className={styles.container}>
      <div className={styles.pageTitle}>
        <h2>实验分析(2/3)</h2>
      </div>

      <div className={styles.contentLayout}>
        <div className={styles.leftPanel}>
          <div className={styles.experimentZone}>
            <h3 className={styles.zoneTitle}>继续实验</h3>
            <p className={styles.zoneHint}>你可以继续进行实验来验证你的答案</p>

            <div className={styles.compactBeakerSelector}>
              <BeakerSelector
                selectedWaterContent={selectedWaterContent}
                onWaterContentChange={selectWaterContent}
                disabled={isAnimating}
                waterContentOptions={WATER_CONTENT_OPTIONS}
              />
            </div>

            <div className={styles.compactTemperatureControl}>
              <TemperatureControl
                selectedTemperature={selectedTemperature}
                onTemperatureChange={selectTemperature}
                disabled={isAnimating}
                temperatureOptions={TEMPERATURE_OPTIONS}
              />
            </div>

            <div className={styles.experimentDisplay}>
              <BallDropAnimation
                fallTime={currentFallTime || 5}
                isAnimating={isAnimating}
                onAnimationEnd={completeExperiment}
                beakerHeight={250}
                ballSize={18}
              />
              <TimerDisplay
                time={currentFallTime}
                isRunning={isAnimating}
                label="下落时间"
                size="medium"
              />
            </div>

            <div className={styles.experimentControls}>
              <button
                type="button"
                className={styles.startButton}
                onClick={startExperiment}
                disabled={!canStartExperiment()}
              >
                开始实验
              </button>
              <button
                type="button"
                className={styles.resetButton}
                onClick={resetExperiment}
                disabled={isAnimating}
              >
                重置
              </button>
            </div>

            {experimentHistory.length > 0 && (
              <div className={styles.miniHistory}>
                <strong>实验记录:</strong>
                {experimentHistory.slice(-2).map((record) => (
                  <div key={record.id} className={styles.miniHistoryItem}>
                    {record.waterContent}%·{record.temperature}°C: {record.fallTime.toFixed(1)}s
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.rightPanel}>
          <div className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <span className={styles.questionNumber}>问题 2</span>
            </div>

            <div className={styles.questionBody}>
              <p className={styles.questionText}>
                模拟实验表明,当蜂蜜的含水量为<strong>15%</strong>时,温度至少需要达到多少度,才能使小钢球的下落时间<strong>小于5秒</strong>?
              </p>

              <div className={styles.optionsGroup} role="radiogroup">
                {TEMPERATURE_OPTIONS.map((option) => (
                  <label
                    key={option}
                    className={`${styles.optionLabel} ${
                      selectedAnswer === `${option}°C` ? styles.selected : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="analysis_q2"
                      value={`${option}°C`}
                      checked={selectedAnswer === `${option}°C`}
                      onChange={() => handleAnswerChange(`${option}°C`)}
                      className={styles.optionInput}
                    />
                    <span className={styles.optionText}>{option}°C</span>
                  </label>
                ))}
              </div>

              {selectedAnswer && (
                <div className={styles.answerHint}>
                  <div className={styles.hintIcon}>💡</div>
                  <div className={styles.hintText}>
                    提示:温度越高,黏度越低,小球下落越快
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className={styles.navigationFooter}>
        <button
          type="button"
          className={styles.nextButton}
          onClick={handleNextPage}
          disabled={!selectedAnswer || isNavigating}
        >
          {selectedAnswer ? (isNavigating ? '跳转中...' : '下一题') : '请先回答问题'}
        </button>
      </div>
    </div>
  );
};

export default Page12_Analysis2;
