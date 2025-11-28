/**
 * Page 04 - 实验数据 + Q2
 *
 * 左侧继续显示实验面板用于数据收集，右侧为Q2单选题
 * Q2: 哪种浓度对薇甘菊种子发芽的抑制作用最强？
 */

import { useEffect, useMemo, useState } from 'react';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { getPageSubNum } from '../mapping';
import { useMikaniaExperiment } from '../Component';
import ExperimentPanel from '../components/ExperimentPanel';
import styles from '../styles/Page04_Q2_Data.module.css';

function Page04Q2Data() {
  const {
    state,
    setAnswer,
    logOperation,
    validateCurrentPage,
    getCurrentMissingFields,
    flowContext,
  } = useMikaniaExperiment();

  const [selectedOption, setSelectedOption] = useState(state.answers.Q2_抑制作用浓度 || '');
  const [error, setError] = useState('');

  const subPageNum = getPageSubNum(state.currentPageId);
  const flowStepIndex = flowContext?.stepIndex;
  const pageNumber = useMemo(() => {
    return typeof flowStepIndex === 'number' ? `${flowStepIndex}.${subPageNum}` : String(subPageNum);
  }, [flowStepIndex, subPageNum]);
  const targetPrefix = useMemo(() => `P${pageNumber}_`, [pageNumber]);
  const questionTarget = `${targetPrefix}Q2_抑制作用浓度`;
  const nextButtonTarget = `${targetPrefix}下一页按钮`;
  const pageTarget = `${targetPrefix}页面`;

  // 记录页面进入
  useEffect(() => {
    logOperation({
      targetElement: pageTarget,
      eventType: EventTypes.PAGE_ENTER,
      value: 'page_04_q2_data',
    });

    return () => {
      logOperation({
        targetElement: pageTarget,
        eventType: EventTypes.PAGE_EXIT,
        value: 'page_04_q2_data',
      });
    };
  }, [logOperation, pageTarget]);

  // 错误提示自动隐藏：10秒后清除
  useEffect(() => {
    if (!error) return;

    const timer = setTimeout(() => {
      setError('');
    }, 10000); // 10秒后自动隐藏

    return () => clearTimeout(timer);
  }, [error]);

  // 处理选项变化
  const handleOptionChange = (option) => {
    setSelectedOption(option);
    setAnswer('Q2_抑制作用浓度', option);

    // 清除错误提示
    if (error) {
      setError('');
    }

    logOperation({
      targetElement: questionTarget,
      eventType: EventTypes.RADIO_SELECT,
      value: option,
    });
  };

  // 处理下一页点击（由 Frame 调用）
  const handleNext = () => {
    // 验证必填项
    if (!validateCurrentPage()) {
      const missing = getCurrentMissingFields();

      // 显示错误提示
      setError('请选择一个选项');

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
      value: 'navigate_to_q3_trend',
    });

    // 触发 Frame 的下一页按钮
    const frameNextButton = document.querySelector('[data-testid="frame-next-button"]');
    if (frameNextButton) {
      frameNextButton.click();
    }
  };

  const options = [
    { value: 'A', label: '0mg/ml' },
    { value: 'B', label: '5mg/ml' },
    { value: 'C', label: '10mg/ml' },
  ];

  return (
    <div className={styles.container}>
      {/* 页面标题 */}
      <h1 className={styles.pageTitle}>薇甘菊防治</h1>

      {/* 左侧：实验面板 */}
      <div className={styles.leftPanel}>
        <div className={styles.experimentContainer}>
          <ExperimentPanel />
        </div>
      </div>

      {/* 右侧：问题 Q2 */}
      <div className={styles.rightPanel}>
        <h2 className={styles.panelTitle}>问题 2</h2>
        <div className={styles.questionCard}>
          <p className={styles.questionText}>
          根据模拟实验，在第5天时，哪种浓度的菟丝子水浸液对薇甘菊种子发芽的抑制作用最强？
          </p>
          <div className={styles.optionsContainer}>
            {options.map((option) => (
              <button
                key={option.value}
                className={`${styles.optionButton} ${
                  selectedOption === option.value ? styles.optionSelected : ''
                }`}
                onClick={() => handleOptionChange(option.value)}
              >
                <span className={styles.optionLabel}>{option.value}</span>
                <span className={styles.optionText}>{option.label}</span>
              </button>
            ))}
          </div>
          {error && (
            <div className={styles.errorHint}>
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

export default Page04Q2Data;
