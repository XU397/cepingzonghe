/**
 * Page11_Analysis1 - 实验分析页面1
 *
 * 功能:
 * - 保留左侧实验区(允许继续实验)
 * - 右侧显示单选题:"在40℃条件下,含水量为多少时下落时间最短?"
 * - 选项:15%, 17%, 19%, 21%
 * - FR-028, FR-029, FR-032
 *
 * T047 - Page11_Analysis1页面
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

const Page11_Analysis1 = () => {
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

  // 记录页面进入
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: '页面',
      value: 'Page11_Analysis1',
      time: new Date().toISOString()
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: '页面',
        value: 'Page11_Analysis1',
        time: new Date().toISOString()
      });
    };
  }, [logOperation]);

  // 处理答案选择
  const handleAnswerChange = useCallback((answer) => {
    setSelectedAnswer(answer);

    logOperation({
      action: '单选',
      target: '实验分析题1',
      value: answer,
      time: new Date().toISOString()
    });
  }, [logOperation]);

  // 处理下一页
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
        targetElement: 'analysis_q1',
        value: selectedAnswer
      });

      // 构建并提交MarkObject
      const markObject = buildMarkObject('11', '实验分析1');
      const success = await submitPageData(markObject);

      if (success) {
        clearOperations();
        await navigateToPage(12);
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page11_Analysis1] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
      setIsNavigating(false);
    }
  }, [selectedAnswer, isNavigating, logOperation, collectAnswer, buildMarkObject, submitPageData, clearOperations, navigateToPage]);

  return (
    <div className={styles.container}>
      <div className={styles.pageTitle}>
        <h2>实验分析(1/3)</h2>
      </div>

      <div className={styles.contentLayout}>
        {/* 左侧:实验操作区(保留) */}
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

        {/* 右侧:问题区 */}
        <div className={styles.rightPanel}>
          <div className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <span className={styles.questionNumber}>问题 1</span>
            </div>

            <div className={styles.questionBody}>
              <p className={styles.questionText}>
                模拟实验表明,在<strong>40℃</strong>条件下,蜂蜜的含水量为多少时,小钢球的下落时间<strong>最短</strong>?
              </p>

              <div className={styles.optionsGroup} role="radiogroup">
                {WATER_CONTENT_OPTIONS.map((option) => (
                  <label
                    key={option}
                    className={`${styles.optionLabel} ${
                      selectedAnswer === `${option}%` ? styles.selected : ''
                    }`}
                  >
                    <input
                      type="radio"
                      name="analysis_q1"
                      value={`${option}%`}
                      checked={selectedAnswer === `${option}%`}
                      onChange={() => handleAnswerChange(`${option}%`)}
                      className={styles.optionInput}
                    />
                    <span className={styles.optionText}>{option}%</span>
                  </label>
                ))}
              </div>

              {selectedAnswer && (
                <div className={styles.answerHint}>
                  <div className={styles.hintIcon}>💡</div>
                  <div className={styles.hintText}>
                    提示:含水量越高,黏度越低,小球下落越快
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

export default Page11_Analysis1;
