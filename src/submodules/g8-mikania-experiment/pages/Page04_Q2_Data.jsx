/**
 * Page 04 - 实验数据 + Q2
 *
 * 左侧继续显示实验面板用于数据收集，右侧为Q2单选题
 * Q2: 哪种浓度对薇甘菊种子发芽的抑制作用最强？
 */

import { useEffect, useState } from 'react';
import { useMikaniaExperiment } from '../Component';
import ExperimentPanel from '../components/ExperimentPanel';
import styles from '../styles/Page04_Q2_Data.module.css';

function Page04Q2Data() {
  const {
    state,
    setAnswer,
    logOperation,
    validateCurrentPage,
    getCurrentValidationErrors,
    logClickBlocked,
    navigateToNextPage,
    isSubmitting,
  } = useMikaniaExperiment();

  const [selectedOption, setSelectedOption] = useState(state.answers.Q2_抑制作用浓度 || '');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

  // 记录页面进入
  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: 'page_04_q2_data',
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: 'page_exit',
        value: 'page_04_q2_data',
      });
    };
  }, [logOperation]);

  // 处理选项变化
  const handleOptionChange = (option) => {
    setSelectedOption(option);
    setAnswer('Q2_抑制作用浓度', option);

    // 清除错误提示
    if (showError) {
      setShowError(false);
      setErrorMessage('');
    }

    // 记录操作
    logOperation({
      targetElement: 'Q2_抑制作用浓度',
      eventType: 'change',
      value: option,
    });
  };

  // 处理下一页点击 (T051, T052)
  const handleNext = async () => {
    console.log('[Page04_Q2_Data] handleNext 被调用');
    console.log('[Page04_Q2_Data] 当前选项:', selectedOption);
    console.log('[Page04_Q2_Data] 答案状态:', state.answers.Q2_抑制作用浓度);

    const isValid = validateCurrentPage();
    console.log('[Page04_Q2_Data] 验证结果:', isValid);

    if (!isValid) {
      const errors = getCurrentValidationErrors();
      console.log('[Page04_Q2_Data] 验证错误:', errors);
      const errorMsg = errors.Q2_抑制作用浓度 || '请完成当前问题';
      setShowError(true);
      setErrorMessage(errorMsg);

      // Log click_blocked event (T051)
      logClickBlocked('validation_failed', ['Q2_抑制作用浓度']);
      return;
    }

    // Clear errors and proceed
    setShowError(false);
    setErrorMessage('');
    setIsNavigating(true);

    logOperation({
      targetElement: '下一页按钮',
      eventType: 'click',
      value: 'page_04_q2_data',
    });

    console.log('[Page04_Q2_Data] 准备调用 navigateToNextPage');
    try {
      await navigateToNextPage();
      console.log('[Page04_Q2_Data] navigateToNextPage 完成');
    } catch (error) {
      console.error('[Page04_Q2_Data] navigateToNextPage 出错:', error);
    } finally {
      setIsNavigating(false);
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
        <h2 className={styles.panelTitle}>实验数据收集</h2>
        <p className={styles.instructions}>
          请继续操作实验，观察不同浓度下的发芽率数据，然后回答右侧问题。
        </p>
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
          {showError && (
            <div className={styles.errorHint}>{errorMessage}</div>
          )}
        </div>

        {/* 下一页按钮 */}
        <div className={styles.actionRow}>
          <button
            className={styles.nextButton}
            onClick={handleNext}
            disabled={isNavigating || isSubmitting}
          >
            {isNavigating || isSubmitting ? '提交中...' : '下一页'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Page04Q2Data;
