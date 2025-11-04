/**
 * Page11_Analysis1 - 实验分析页面1
 *
 * 功能:
 * - 保留左侧实验区(允许继续实验)
 * - 右侧显示单选题:"在40℃条件下,含水量为多少时下落时间最长?"
 * - 选项:15%, 17%, 19%, 21%
 * - FR-028, FR-029, FR-032
 *
 * T047 - Page11_Analysis1页面
 */

import { useState, useCallback, useEffect } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import IntegratedExperimentPanel from '../components/experiment/IntegratedExperimentPanel';
import PageLayout from '../components/layout/PageLayout.jsx';
import { calculateFallTime } from '../utils/physicsModel';
import { WATER_CONTENT_OPTIONS, TEMPERATURE_OPTIONS, PAGE_MAPPING } from '../config';
import styles from '../styles/AnalysisPage.module.css';

const Page11_Analysis1 = () => {
  const {
    session,
    logOperation,
    collectAnswer,
    clearOperations,
    buildMarkObject,
    navigateToPage,
    submitPageData
  } = useTrackingContext();

  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

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

  // 处理实验开始 - 计算所有量筒的下落时间
  const handleExperimentStart = useCallback((waterContent, temperature) => {
    logOperation({
      action: '点击',
      target: '计时开始按钮_分析页1',
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
      target: '实验动画_分析页1',
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
      target: '实验分析',
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
        value: '下一页',
        time: new Date().toISOString()
      });

      // 同步构建答案列表，避免依赖异步的 collectAnswer 状态
      const answerList = [
        { targetElement: 'analysis_q1', value: selectedAnswer }
      ];

      // 构建并提交MarkObject
      // 从session获取当前页码而不是硬编码
      const pageInfo = PAGE_MAPPING[session.currentPage];
      // 传入同步构建的 answerList，确保提交时 answerList 不为空
      const markObject = buildMarkObject(
        String(session.currentPage),
        pageInfo?.desc || '实验分析1',
        { answerList }
      );
      const success = await submitPageData(markObject);

      if (success) {
        clearOperations();
        await navigateToPage(10);
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page11_Analysis1] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
      setIsNavigating(false);
    }
  }, [selectedAnswer, isNavigating, logOperation, collectAnswer, buildMarkObject, submitPageData, clearOperations, navigateToPage, session]);

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.container}>
        <div className={styles.pageTitle}>
          <h2>实验分析(1/3)</h2>
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

        {/* 右侧:问题区 */}
        <div className={styles.rightPanel}>
          <div className={styles.questionCard}>
            <div className={styles.questionHeader}>
              <span className={styles.questionNumber}>问题 1</span>
            </div>

            <div className={styles.questionBody}>
              <p className={styles.questionText}>
                模拟实验表明,在<strong>40℃</strong>条件下,蜂蜜的含水量为多少时,小钢球的下落时间<strong>最长</strong>?
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
          {selectedAnswer ? (isNavigating ? '跳转中...' : '下一页') : '请先回答问题'}
        </button>
      </div>
      </div>
    </PageLayout>
  );
};

export default Page11_Analysis1;
