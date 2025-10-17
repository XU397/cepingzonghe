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
import IntegratedExperimentPanel from '../components/experiment/IntegratedExperimentPanel';
import { calculateFallTime } from '../utils/physicsModel';
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
  const [experimentHistory, setExperimentHistory] = useState([]);

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

  // 处理开始实验 - 计算所有量筒的下落时间
  const handleExperimentStart = useCallback((waterContent, temperature) => {
    // 记录实验开始
    logOperation({
      action: '点击',
      target: '计时开始按钮',
      value: JSON.stringify({
        waterContent,
        temperature
      }),
      time: new Date().toISOString()
    });

    // 使用物理模型计算下落时间
    const fallTime = calculateFallTime(waterContent, temperature);

    return fallTime;
  }, [logOperation]);

  // 处理实验完成
  const handleExperimentComplete = useCallback((experimentData) => {
    // experimentData 是一个数组，包含所有量筒的数据
    // [{waterContent: 15, fallTime: 16.5}, {waterContent: 17, fallTime: 5.7}, ...]

    logOperation({
      action: '完成',
      target: '实验动画',
      value: JSON.stringify(experimentData),
      time: new Date().toISOString()
    });

    // 添加到历史记录
    setExperimentHistory(prev => [...prev, {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      data: experimentData
    }]);

    // 收集实验结果作为答案
    collectAnswer({
      targetElement: `实验记录_${experimentHistory.length + 1}`,
      value: JSON.stringify(experimentData)
    });
  }, [experimentHistory.length, logOperation, collectAnswer]);

  // 处理重置实验
  const handleReset = useCallback(() => {
    logOperation({
      action: '点击',
      target: '重置实验按钮',
      value: '重置实验',
      time: new Date().toISOString()
    });
  }, [logOperation]);

  // 处理下一页
  const handleNextPage = useCallback(async () => {
    // 检查是否至少完成了一次实验
    if (experimentHistory.length === 0 || isNavigating) {
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
      const markObject = buildMarkObject('8', '模拟实验');
      const success = await submitPageData(markObject);

      if (success) {
        clearOperations();
        await navigateToPage(9);
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page10_Experiment] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
      setIsNavigating(false);
    }
  }, [experimentHistory, isNavigating, logOperation, collectAnswer, buildMarkObject, submitPageData, clearOperations, navigateToPage]);

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
            <li>调节温度后,点击&quot;计时开始&quot;,小钢球会同时在4个量筒中下落,记录各量筒中小球从顶部落到底部的时间。</li>
          </ol>

          <hr className={styles.divider} />

          <h3 className={styles.instructionsSectionTitle}>【说明】右侧为实验互动界面:</h3>
          <ul className={styles.instructionsList}>
            <li>4个量筒对应不同的蜂蜜含水量:15%、17%、19%、21%。</li>
            <li>点击温度计图标可以调节环境温度(25°C-45°C,共5档)。</li>
            <li>设置完温度后,单击&quot;计时开始&quot;按钮,小球会在所有量筒中同时下落。</li>
            <li>下落结束后,绿色横条显示每个量筒中小球的下落时间。</li>
            <li>单击&quot;重置&quot;可以清空时间记录重新开始。</li>
          </ul>

          <div className={styles.hintBox}>
            <div className={styles.hintIcon}>💡</div>
            <div className={styles.hintContent}>
              <strong>提示：</strong>
              <p>含水量越高,黏度越低,小球下落越快</p>
              <p>温度越高,黏度越低,小球下落越快</p>
              <p>请至少进行一次实验才能进入下一页</p>
            </div>
          </div>
        </div>

        {/* 右侧:集成实验面板 */}
        <div className={styles.simulationEnvironmentPanel}>
          <IntegratedExperimentPanel
            waterContentOptions={WATER_CONTENT_OPTIONS}
            temperatureOptions={TEMPERATURE_OPTIONS}
            onExperimentStart={handleExperimentStart}
            onExperimentComplete={handleExperimentComplete}
            onReset={handleReset}
          />

          {/* 实验历史记录 */}
          {experimentHistory.length > 0 && (
            <div className={styles.historySection}>
              <h4 className={styles.historySectionTitle}>
                实验记录 ({experimentHistory.length})
              </h4>
              <div className={styles.historyList}>
                {experimentHistory.map((record, index) => (
                  <div key={record.id} className={styles.historyItem}>
                    <span className={styles.historyIndex}>#{index + 1}</span>
                    <span className={styles.historyDetails}>
                      时间: {record.timestamp.split('T')[1].substring(0, 8)}
                    </span>
                    <span className={styles.historyTime}>
                      {record.data.length} 组数据
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 底部导航按钮 */}
      <div className={styles.navigationFooter}>
        <button
          type="button"
          className={styles.nextButton}
          onClick={handleNextPage}
          disabled={experimentHistory.length === 0 || isNavigating}
        >
          {experimentHistory.length > 0
            ? (isNavigating ? '跳转中...' : '下一页')
            : '请先完成至少一次实验'}
        </button>
      </div>
    </div>
  );
};

export default Page10_Experiment;
