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
import IntegratedExperimentPanel from '../components/experiment/IntegratedExperimentPanel';
import PageLayout from '../components/layout/PageLayout.jsx';
import { calculateFallTime } from '../utils/physicsModel';
import { WATER_CONTENT_OPTIONS, TEMPERATURE_OPTIONS, PAGE_MAPPING } from '../config';
import styles from '../styles/AnalysisPage.module.css';

const Page12_Analysis2 = () => {
  const {
    session,
    logOperation,
    collectAnswer,
    clearOperations,
    buildMarkObject,
    navigateToPage
  } = useTrackingContext();

  const { submitPageData } = useDataLogger();
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // 记录页面进入
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

  // 处理实验开始 - 计算所有量筒的下落时间
  const handleExperimentStart = useCallback((waterContent, temperature) => {
    logOperation({
      action: '点击',
      target: '计时开始按钮_分析页2',
      value: JSON.stringify({ waterContent, temperature }),
      time: new Date().toISOString()
    });

    // 使用物理模型计算下落时间
    const fallTime = calculateFallTime(waterContent, temperature);
    return fallTime;
  }, [logOperation]);

  // 处理实验完成
  const handleExperimentComplete = useCallback((experimentData) => {
    // experimentData 是一个数组，包含所有量筒的数据
    logOperation({
      action: '完成',
      target: '实验动画_分析页2',
      value: JSON.stringify(experimentData),
      time: new Date().toISOString()
    });
  }, [logOperation]);

  // 处理重置
  const handleReset = useCallback(() => {
    logOperation({
      action: '点击',
      target: '重置按钮_分析页',
      value: '重置实验',
      time: new Date().toISOString()
    });
  }, [logOperation]);

  // 处理答案选择
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
      // 从session获取当前页码而不是硬编码
      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(String(session.currentPage), pageInfo?.desc || '实验分析2');
      const success = await submitPageData(markObject);

      if (success) {
        clearOperations();
        await navigateToPage(11);
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page12_Analysis2] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
      setIsNavigating(false);
    }
  }, [selectedAnswer, isNavigating, logOperation, collectAnswer, buildMarkObject, submitPageData, clearOperations, navigateToPage, session]);

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.container}>
        <div className={styles.pageTitle}>
          <h2>实验分析(2/3)</h2>
        </div>

      <div className={styles.contentLayout}>
        {/* 左侧:实验操作区 - 4个量筒同时下落 */}
        <div className={styles.leftPanel}>
          <IntegratedExperimentPanel
            waterContentOptions={WATER_CONTENT_OPTIONS}
            temperatureOptions={TEMPERATURE_OPTIONS}
            onExperimentStart={handleExperimentStart}
            onExperimentComplete={handleExperimentComplete}
            onReset={handleReset}
          />
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
    </PageLayout>
  );
};

export default Page12_Analysis2;
