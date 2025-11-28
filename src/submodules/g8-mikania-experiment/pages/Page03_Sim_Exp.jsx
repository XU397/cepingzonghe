/**
 * Page 03 - 模拟实验页
 *
 * 包含实验面板组件（ExperimentPanel）的容器
 * 用户可以操作变量控制实验
 */

import { useEffect, useMemo, useState } from 'react';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { getPageSubNum } from '../mapping';
import { useMikaniaExperiment } from '../Component';
import ExperimentPanel from '../components/ExperimentPanel';
import styles from '../styles/Page03_Sim_Exp.module.css';

function Page03SimExp() {
  const {
    state,
    logOperation,
    validateCurrentPage,
    getCurrentMissingFields,
    flowContext,
  } = useMikaniaExperiment();

  const [error, setError] = useState('');
  const subPageNum = getPageSubNum(state.currentPageId);
  const flowStepIndex = flowContext?.stepIndex;
  const pageNumber = useMemo(() => {
    return typeof flowStepIndex === 'number' ? `${flowStepIndex}.${subPageNum}` : String(subPageNum);
  }, [flowStepIndex, subPageNum]);
  const targetPrefix = useMemo(() => `P${pageNumber}_`, [pageNumber]);
  const nextButtonTarget = `${targetPrefix}下一页按钮`;

  // 记录页面进入
  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: EventTypes.PAGE_ENTER,
      value: 'page_03_sim_exp',
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: EventTypes.PAGE_EXIT,
        value: 'page_03_sim_exp',
      });
    };
  }, [logOperation]);

  // 错误提示自动隐藏：10秒后清除
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError('');
    }, 10000); // 10秒后自动隐藏

    return () => clearTimeout(timer);
  }, [error]);

  // 处理下一页点击（由 Frame 调用）
  const handleNext = () => {
    // 验证是否至少完成一次实验
    if (!validateCurrentPage()) {
      const missing = getCurrentMissingFields();

      // 显示错误提示
      setError('请至少完成一次实验操作后再继续');

      // 记录阻断事件
      logOperation({
        targetElement: nextButtonTarget,
        eventType: EventTypes.CLICK_BLOCKED,
        value: JSON.stringify({
          reason: 'validation_failed',
          missing,
        }),
      });
      return;
    }

    // 清除错误提示
    setError('');

    // 记录成功点击
    logOperation({
      targetElement: nextButtonTarget,
      eventType: EventTypes.NEXT_CLICK,
      value: 'navigate_to_q2_data',
    });

    // 触发 Frame 的下一页按钮
    const frameNextButton = document.querySelector('[data-testid="frame-next-button"]');
    if (frameNextButton) {
      frameNextButton.click();
    }
  };

  return (
    <div className={styles.container}>
      {/* Two-column layout */}
      <div className={styles.mainContent}>
        {/* Left panel: Instructions */}
        <div className={styles.leftPanel}>
          <h2 className={styles.panelTitle}>模拟实验探究</h2>
          <p className={styles.introText}>
            接下来，我们将在计算机上通过模拟实验的方式开展探究。右侧为模拟实验互动界面。
          </p>
          <ul className={styles.stepsList}>
            <li className={styles.stepItem}>
              单击左上方橙色框<span className={styles.sampleConc}>(数字)mg/ml</span>，可设置菟丝子水浸液浓度。
            </li>
            <li className={styles.stepItem}>
              单击下方 <span className={styles.arrowBtnUp}>▲</span><span className={styles.arrowBtnDown}>▼</span> 按钮，可设置处理时间。
            </li>
            <li className={styles.stepItem}>
              单击<span className={styles.sampleStart}>开始</span>按钮，观察培养皿中种子的生长。
            </li>
            <li className={styles.stepItem}>
              实验结束后，在右上方绿色框<span className={styles.sampleRate}>--%</span>中查看种子发芽率。
            </li>
            <li className={styles.stepItem}>
              单击<span className={styles.sampleReset}>重置</span>按钮，可重新开始。
            </li>
          </ul>
        </div>

        {/* Right panel: Experiment area */}
        <div className={styles.rightPanel}>
          <ExperimentPanel pageNumber={pageNumber} />

          {/* Error message for validation - placed below experiment area */}
          {error && (
            <div className={styles.errorMessage} data-testid="error-message">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* 隐藏的下一页按钮，用于 Frame 回调 */}
      <button
        type="button"
        style={{
          position: 'absolute',
          width: 1,
          height: 1,
          padding: 0,
          margin: 0,
          opacity: 0,
          pointerEvents: 'none',
          border: 0,
        }}
        tabIndex={-1}
        onClick={handleNext}
        data-testid="next-button"
        aria-hidden="true"
      >
        下一页
      </button>
    </div>
  );
}

export default Page03SimExp;
