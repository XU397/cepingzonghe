/**
 * Page 02 - 实验步骤展示 + Q1
 *
 * 左侧显示实验步骤和培养皿图片，右侧为Q1填空题
 */

import { useEffect, useState } from 'react';
import { useMikaniaExperiment } from '../Component';
import styles from '../styles/Page02_Step_Q1.module.css';
import petriDishImage from '../assets/images/培养皿.jpg';

function Page02StepQ1() {
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

  const [inputValue, setInputValue] = useState(state.answers.Q1_控制变量原因 || '');
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isNavigating, setIsNavigating] = useState(false);

  // 记录页面进入
  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: 'page_02_step_q1',
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: 'page_exit',
        value: 'page_02_step_q1',
      });
    };
  }, [logOperation]);

  // 处理输入变化
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    setAnswer('Q1_控制变量原因', value);

    // 清除错误提示
    if (showError && value.length >= 5) {
      setShowError(false);
      setErrorMessage('');
    }

    // 记录操作
    logOperation({
      targetElement: 'Q1_控制变量原因',
      eventType: 'change',
      value: value,
    });
  };

  // 处理下一页点击 (T051, T052)
  const handleNext = async () => {
    console.log('[Page02_Step_Q1] handleNext 被调用');
    console.log('[Page02_Step_Q1] 当前输入值:', inputValue);
    console.log('[Page02_Step_Q1] 答案状态:', state.answers.Q1_控制变量原因);

    const isValid = validateCurrentPage();
    console.log('[Page02_Step_Q1] 验证结果:', isValid);

    if (!isValid) {
      const errors = getCurrentValidationErrors();
      console.log('[Page02_Step_Q1] 验证错误:', errors);
      const errorMsg = errors.Q1_控制变量原因 || '请完成当前问题';
      setShowError(true);
      setErrorMessage(errorMsg);

      // Log click_blocked event (T051)
      logClickBlocked('validation_failed', ['Q1_控制变量原因']);
      return;
    }

    // Clear errors and proceed
    setShowError(false);
    setErrorMessage('');
    setIsNavigating(true);

    logOperation({
      targetElement: '下一页按钮',
      eventType: 'click',
      value: 'page_02_step_q1',
    });

    console.log('[Page02_Step_Q1] 准备调用 navigateToNextPage');
    try {
      await navigateToNextPage();
      console.log('[Page02_Step_Q1] navigateToNextPage 完成');
    } catch (error) {
      console.error('[Page02_Step_Q1] navigateToNextPage 出错:', error);
    } finally {
      setIsNavigating(false);
    }
  };

  const charCount = inputValue.length;
  const minChars = 5;
  const isButtonDisabled = isNavigating || isSubmitting;

  return (
    <div className={styles.container}>
      {/* 页面标题 - 独立一行 */}
      <h1 className={styles.pageTitle}>薇甘菊防治</h1>

      {/* 左侧：实验步骤 */}
      <div className={styles.leftPanel}>
        <div className={styles.experimentCard}>
          <p className={styles.experimentIntro}>
            本实验旨在探究菟丝子水浸液对薇甘菊种子发芽的抑制作用，并分析其浓度效应。实验步骤如下：
          </p>

          <div className={styles.stepsList}>
            <p className={styles.stepItem}>
              1）准备300颗健康且大小一致的薇甘菊种子，平均分成3组；
            </p>
            <p className={styles.stepItem}>
              2）分别用浓度为0mg/ml，5mg/ml，10mg/ml的菟丝子水浸液对三组种子进行浸泡处理；
            </p>
            <p className={styles.stepItem}>
              3）准备三个装有相同类型和质量土壤的培养皿，将处理后的三组种子分别播种于对应的培养皿中，每皿100颗；
            </p>
            <p className={styles.stepItem}>
              4）除水浸液浓度外，确保其他条件（如温度、光照）完全相同。连续观察7天，每日定时记录各组种子的发芽率。
            </p>
          </div>

          {/* 培养皿图片区域 */}
          <div className={styles.petriDishGrid}>
            <div className={styles.petriDishItem}>
              <img
                src={petriDishImage}
                alt="培养皿1"
                className={styles.petriDishImage}
              />
              <p className={styles.petriDishLabel}>• 培养皿1</p>
            </div>
            <div className={styles.petriDishItem}>
              <img
                src={petriDishImage}
                alt="培养皿2"
                className={styles.petriDishImage}
              />
              <p className={styles.petriDishLabel}>• 培养皿2</p>
            </div>
            <div className={styles.petriDishItem}>
              <img
                src={petriDishImage}
                alt="培养皿3"
                className={styles.petriDishImage}
              />
              <p className={styles.petriDishLabel}>• 培养皿3</p>
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：问题 Q1 */}
      <div className={styles.rightPanel}>
        <div className={styles.questionCard}>
          <p className={styles.questionTitle}>
            <span className={styles.questionLabel}>问题1：</span>
            为什么在每个培养皿中放置相同的100颗薇甘菊种子？请写出原因。
          </p>
          <div className={styles.inputContainer}>
            <textarea
              className={`${styles.textInput} ${showError ? styles.textInputError : ''}`}
              value={inputValue}
              onChange={handleInputChange}
              placeholder="请输入您的答案（至少5个字符）..."
              rows={6}
            />
            <div className={styles.charCounter}>
              <span className={charCount < minChars ? styles.insufficientChars : styles.sufficientChars}>
                {charCount}
              </span>
              <span className={styles.charRequirement}>/{minChars} 字符</span>
            </div>
          </div>
          {showError && (
            <div className={styles.errorHint}>{errorMessage}</div>
          )}
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
    </div>
  );
}

export default Page02StepQ1;
