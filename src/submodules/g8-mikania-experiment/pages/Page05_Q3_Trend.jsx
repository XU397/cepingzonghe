/**
 * Page 05 - 实验数据 + Q3
 *
 * 左侧显示实验面板（ExperimentPanel），右侧为Q3单选题
 * Q3: 根据实验数据分析发芽率趋势
 */

import { useEffect, useState } from 'react';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { isReservedElement } from '@shared/services/submission/submoduleAdapter';
import { useMikaniaExperiment } from '../Component';
import ExperimentPanel from '../components/ExperimentPanel';
import styles from '../styles/Page05_Q3_Trend.module.css';

function Page05Q3Trend() {
  const {
    state,
    setAnswer,
    logOperation,
    validateCurrentPage,
    getCurrentMissingFields,
    targetPrefix,
  } = useMikaniaExperiment();

  const [selectedOption, setSelectedOption] = useState(state.answers.Q3_发芽率趋势 || '');
  const [error, setError] = useState('');

  const pageTargetPrefix = targetPrefix || '';
  const questionTarget = `${pageTargetPrefix}Q3_发芽率趋势`;
  const nextButtonTarget = isReservedElement('下一页按钮') ? '下一页按钮' : `${pageTargetPrefix}下一页按钮`;

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
    setAnswer('Q3_发芽率趋势', option);

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
      value: 'navigate_to_q4_conc',
    });

    // 触发 Frame 的下一页按钮
    const frameNextButton = document.querySelector('[data-testid="frame-next-button"]');
    if (frameNextButton) {
      frameNextButton.click();
    }
  };

  const options = [
    { value: 'A', label: '逐渐升高' },
    { value: 'B', label: '逐渐降低' },
    { value: 'C', label: '保持不变' },
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

      {/* 右侧：问题 Q3 */}
      <div className={styles.rightPanel}>
        <h2 className={styles.panelTitle}>问题 3</h2>
        <div className={styles.questionCard}>
          <p className={styles.questionText}>
          根据模拟实验，薇甘菊种子的发芽率随菟丝子水浸液浓度升高如何变化？
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

export default Page05Q3Trend;
