/**
 * Page 03 - 模拟实验页
 *
 * 包含实验面板组件（ExperimentPanel）的容器
 * 用户可以操作变量控制实验
 */

import { useEffect, useState } from 'react';
import { useMikaniaExperiment } from '../Component';
import ExperimentPanel from '../components/ExperimentPanel';
import styles from '../styles/Page03_Sim_Exp.module.css';

function Page03SimExp() {
  const {
    logOperation,
    navigateToNextPage,
    isSubmitting,
  } = useMikaniaExperiment();

  const [isNavigating, setIsNavigating] = useState(false);

  // 记录页面进入
  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: 'page_03_sim_exp',
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: 'page_exit',
        value: 'page_03_sim_exp',
      });
    };
  }, [logOperation]);

  // 处理下一页点击
  const handleNext = async () => {
    console.log('[Page03] 下一页按钮被点击');
    setIsNavigating(true);

    logOperation({
      targetElement: '下一页按钮',
      eventType: 'click',
      value: 'page_03_sim_exp',
    });

    console.log('[Page03] 开始导航到下一页');
    try {
      await navigateToNextPage();
      console.log('[Page03] 导航成功');
    } catch (error) {
      console.error('[Page03] 导航失败:', error);
    } finally {
      setIsNavigating(false);
    }
  };

  const isButtonDisabled = isNavigating || isSubmitting;

  return (
    <div className={styles.container}>
      {/* 页面标题 */}
      <h1 className={styles.pageTitle}>薇甘菊防治</h1>

      {/* 主内容区域 - 左右布局 */}
      <div className={styles.mainContent}>
        {/* 左侧：实验步骤说明 */}
        <div className={styles.leftPanel}>
          <div className={styles.instructionCard}>
            <p className={styles.introText}>
              接下来，我们将在计算机上通过模拟实验的方式开展探究。右侧为模拟实验互动界面：
            </p>
            <ul className={styles.stepsList}>
              <li className={styles.stepItem}>
                单击左上方橙色框<span className={styles.sampleConc}>0mg/ml</span>，可设置菟丝子水浸液浓度。
              </li>
              <li className={styles.stepItem}>
                单击下方 <span className={styles.arrowBtnUp}>▲</span><span className={styles.arrowBtnDown}>▼</span> 按钮，可设置处理时间。
              </li>
              <li className={styles.stepItem}>
                单击<span className={styles.sampleStart}>开始</span>按钮，观察培养皿中种子的生长。
              </li>
              <li className={styles.stepItem}>
                实验结束后，在右上方绿色框<span className={styles.sampleRate}>0%</span>中查看种子发芽率。
              </li>
              <li className={styles.stepItem}>
                单击<span className={styles.sampleReset}>重置</span>按钮，可重新开始。
              </li>
            </ul>
          </div>
        </div>

        {/* 右侧：实验面板 */}
        <div className={styles.rightPanel}>
          <ExperimentPanel />
        </div>
      </div>

      {/* 下一页按钮 */}
      <div className={styles.buttonContainer}>
        <button
          type="button"
          className={`${styles.nextButton} ${isButtonDisabled ? styles.disabled : ''}`}
          onClick={handleNext}
          disabled={isButtonDisabled}
        >
          {isNavigating || isSubmitting ? '提交中...' : '下一页'}
        </button>
      </div>
    </div>
  );
}

export default Page03SimExp;
