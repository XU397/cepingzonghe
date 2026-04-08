/**
 * Page10_Experiment - 模拟实验页面
 *
 * 功能:
 * - 左右分栏布局:左侧实验操作区,右侧说明区
 * - 集成BeakerSelector、TemperatureControl、BallDropAnimation、TimerDisplay
 * - 实验控制逻辑:"开始实验"/"重置实验"按钮
 * - 实验历史记录(最多10次)
 * - 支持实验参数的实时验证
 *
 * T045a/b/c - Page10_Experiment页面(3个子任务)
 * FR-017 to FR-027
 */

import { useCallback, useEffect, useState } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import IntegratedExperimentPanel from '../components/experiment/IntegratedExperimentPanel';
import PageLayout from '../components/layout/PageLayout.jsx';
import { calculateFallTime } from '../utils/physicsModel';
import { WATER_CONTENT_OPTIONS, TEMPERATURE_OPTIONS, PAGE_MAPPING } from '../config';
import styles from '../styles/Page10_Experiment.module.css';
import jianhaoImg from '../../../assets/images/jianhao71.png';
import jiahaoImg from '../../../assets/images/jiahao71.png';
import jishikaishiImg from '../../../assets/images/jishikaishi71.png';
import chongzhiImg from '../../../assets/images/chongzhi71.png';
import jishikuangImg from '../../../assets/images/jishikuang71.png';

const Page10_Experiment = () => {
  const {
    session,
    logOperation,
    collectAnswer,
    clearOperations,
    buildMarkObject,
    navigateToPage,
    submitPageData,
  } = useTrackingContext();

  const [isNavigating, setIsNavigating] = useState(false);
  const [experimentHistory, setExperimentHistory] = useState([]);

  // 记录页面进入
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: '页面',
      value: 'Page10_Experiment',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: '页面',
        value: 'Page10_Experiment',
        time: new Date().toISOString(),
      });
    };
  }, [logOperation]);

  // 处理开始实验 - 计算所有量筒的下落时间
  const handleExperimentStart = useCallback(
    (waterContent, temperature) => {
      // 记录实验开始
      // 🔧 修改：使用 simulation_timing_started eventType 以匹配7年级蒸馒头模块
      logOperation({
        action: 'simulation_timing_started',
        target: '计时开始按钮',
        value: `温度${temperature}°C`,
        time: new Date().toISOString(),
      });

      // 使用物理模型计算下落时间
      const fallTime = calculateFallTime(waterContent, temperature);

      return fallTime;
    },
    [logOperation]
  );

  // 处理实验完成
  const handleExperimentComplete = useCallback(
    experimentData => {
      // experimentData 是一个数组，包含所有量筒的数据
      // [{waterContent: 15, temperature: 30, fallTime: 16.5}, ...]

      // 🔧 修改：构建符合7年级蒸馒头模块格式的 simulation_run_result
      const runId = experimentHistory.length + 1;
      const temperature = experimentData[0]?.temperature || 25; // 获取当前实验的温度

      // 构建结果数组，格式与蒸馒头模块类似
      const resultsForLog = experimentData.map(item => ({
        WaterContent: item.waterContent, // 含水量 (类似蒸馒头的 Temp)
        FallTime: item.fallTime, // 下落时间 (类似蒸馒头的 Volume)
      }));

      logOperation({
        action: 'simulation_run_result',
        target: '模拟实验运行结果',
        value: {
          Run_ID: `run_Page_10_Experiment_${runId}`,
          Set_Temperature: temperature, // 设定温度
          Results: resultsForLog,
        },
        time: new Date().toISOString(),
      });

      // 添加到历史记录
      setExperimentHistory(prev => [
        ...prev,
        {
          id: Date.now(),
          timestamp: new Date().toISOString(),
          data: experimentData,
        },
      ]);

      // 收集实验结果作为答案
      collectAnswer({
        targetElement: `实验记录_${runId}`,
        value: JSON.stringify(experimentData),
      });
    },
    [experimentHistory.length, logOperation, collectAnswer]
  );

  // 处理重置实验
  const handleReset = useCallback(() => {
    logOperation({
      action: '点击',
      target: '重置实验按钮',
      value: '重置实验',
      time: new Date().toISOString(),
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
        time: new Date().toISOString(),
      });

      // 收集所有实验历史记录
      collectAnswer({
        targetElement: '实验历史记录',
        value: JSON.stringify(experimentHistory),
      });

      // 构建并提交MarkObject
      // 从session获取当前页码而不是硬编码
      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(String(session.currentPage), pageInfo?.desc || '模拟实验');
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
  }, [
    experimentHistory,
    isNavigating,
    logOperation,
    collectAnswer,
    buildMarkObject,
    submitPageData,
    clearOperations,
    navigateToPage,
    session,
  ]);

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div className={styles.badge}>8</div>
          <div className={styles.headerContent}>
            <h1 className={styles.pageTitle}>蜂蜜变稀：模拟实验</h1>
          </div>
        </header>

        <div className={styles.contentLayout}>
          {/* 左侧:说明面板 */}
          <div className={styles.instructionsPanel}>
            <h2 className={styles.instructionsTitle}>模拟实验步骤如下：</h2>
            <ol className={styles.stepsList}>
              <li>取含水量为15%, 17%, 19%, 21%的蜂蜜各200ml，分别放入4个量筒中；</li>
              <li>将量筒放入恒温箱中，恒温箱温度可设为25℃, 30℃, 35℃, 40℃, 45℃；</li>
              <li>释放量筒上方的小钢球，记录小钢球下落至量筒底部的总用时；</li>
            </ol>

            <hr className={styles.divider} />

            <h3 className={styles.instructionsSectionTitle}>【说明】右侧为实验互动界面:</h3>
            <ul className={styles.instructionsList}>
              <li>
                单击
                <img src={jianhaoImg} alt="-" className={styles.inlineIcon} />
                <img src={jiahaoImg} alt="+" className={styles.inlineIcon} />
                可调整温度；
              </li>
              <li>
                设好温度后，单击
                <img src={jishikaishiImg} alt="计时开始" className={styles.inlineButton} />
                ，小钢球会下落至量筒底部，量筒下方时间框
                <img src={jishikuangImg} alt="时间框" className={styles.inlineIcon} />
                显示下落总用时；
              </li>
              <li>
                单击
                <img src={chongzhiImg} alt="重置" className={styles.inlineButton} />
                可重新开始。
              </li>
            </ul>

            {/* 删除了黄色提示框 hintBox */}
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
          </div>
        </div>

        {/* 底部导航按钮 */}
        <footer className={styles.navigationFooter}>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleNextPage}
            disabled={experimentHistory.length === 0 || isNavigating}
          >
            <span>
              {experimentHistory.length > 0
                ? isNavigating
                  ? '提交中...'
                  : '下一页'
                : '请先完成至少一次实验'}
            </span>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </footer>
      </div>
    </PageLayout>
  );
};

export default Page10_Experiment;
