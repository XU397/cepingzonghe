/**
 * Page 02 - 实验步骤展示 + Q1
 *
 * 左侧显示实验步骤和培养皿图片，右侧为Q1填空题
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { getPageSubNum } from '../mapping';
import { useMikaniaExperiment } from '../Component';
import styles from '../styles/Page02_Step_Q1.module.css';
import petriDishImage from '../assets/images/培养皿.jpg';

function Page02StepQ1() {
  const {
    state,
    setAnswer,
    logOperation,
    validateCurrentPage,
    getCurrentMissingFields,
    flowContext,
  } = useMikaniaExperiment();

  const [inputValue, setInputValue] = useState(state.answers.Q1_控制变量原因 || '');
  const [error, setError] = useState('');
  const prevValueRef = useRef(state.answers.Q1_控制变量原因 || '');

  const subPageNum = getPageSubNum(state.currentPageId);
  const flowStepIndex = flowContext?.stepIndex;
  const pageNumber = useMemo(() => {
    return typeof flowStepIndex === 'number' ? `${flowStepIndex}.${subPageNum}` : String(subPageNum);
  }, [flowStepIndex, subPageNum]);
  const questionTarget = useMemo(() => `P${pageNumber}_Q1_控制变量原因`, [pageNumber]);

  // 记录页面进入
  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: EventTypes.PAGE_ENTER,
      value: 'page_02_step_q1',
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: EventTypes.PAGE_EXIT,
        value: 'page_02_step_q1',
      });
    };
  }, [logOperation]);

  const handleInputFocus = () => {
    logOperation({
      targetElement: questionTarget,
      eventType: EventTypes.INPUT_FOCUS,
      value: prevValueRef.current || '',
    });
  };

  // 处理输入变化
  const handleInputChange = (e) => {
    const nextValue = e.target.value;
    const prevValue = prevValueRef.current || '';
    const payload = {
      prev: prevValue,
      next: nextValue,
      prevLength: prevValue.length,
      nextLength: nextValue.length,
    };

    setInputValue(nextValue);
    setAnswer('Q1_控制变量原因', nextValue);

    // 清除错误提示
    if (error && nextValue.length >= 5) {
      setError('');
    }

    logOperation({
      targetElement: questionTarget,
      eventType: EventTypes.INPUT_CHANGE,
      value: JSON.stringify(payload),
    });

    if (nextValue.length < prevValue.length) {
      logOperation({
        targetElement: questionTarget,
        eventType: EventTypes.INPUT_DELETE,
        value: JSON.stringify({
          action: 'delete',
          ...payload,
        }),
      });
    }

    prevValueRef.current = nextValue;
  };

  const handleInputBlur = () => {
    logOperation({
      targetElement: questionTarget,
      eventType: EventTypes.INPUT_BLUR,
      value: prevValueRef.current || '',
    });
  };

  // 处理下一页点击（由 Frame 调用）
  const handleNext = () => {
    // 验证必填项
    if (!validateCurrentPage()) {
      const missing = getCurrentMissingFields();

      // 显示错误提示
      setError('请输入至少5个字符的回答');

      // 记录阻断事件
      logOperation({
        targetElement: '下一页按钮',
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
      targetElement: '下一页按钮',
      eventType: EventTypes.NEXT_CLICK,
      value: 'navigate_to_sim_exp',
    });

    // 触发 Frame 的下一页按钮
    const frameNextButton = document.querySelector('[data-testid="frame-next-button"]');
    if (frameNextButton) {
      frameNextButton.click();
    }
  };

  const charCount = inputValue.length;
  const minChars = 5;

  return (
    <div className={styles.container}>
      {/* 页面标题 */}
      <h1 className={styles.pageTitle}>薇甘菊防治实验</h1>

      {/* 主布局区域 */}
      <div className={styles.mainContent}>
        {/* 左侧：实验步骤 */}
        <div className={styles.leftPanel}>
          <div className={styles.experimentCard}>
            <p className={styles.experimentIntro}>
              本实验旨在探究菟丝子水浸液对薇甘菊种子发芽的抑制作用，并分析其浓度效应。实验步骤如下：
            </p>

            <h3 className={styles.stepsTitle}>
              <span className={styles.stepsIcon}>📋</span>
              实验步骤
            </h3>
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

            {/* 培养皿区域 */}
            <div className={styles.petriDishSection}>
              <h4 className={styles.petriDishTitle}>
                <span className={styles.stepsIcon}>🧫</span>
                实验培养皿
              </h4>
              <div className={styles.petriDishGrid}>
                <div className={styles.petriDishItem}>
                  <img
                    src={petriDishImage}
                    alt="培养皿1 - 0mg/ml"
                    className={styles.petriDishImage}
                  />
                  <p className={styles.petriDishLabel}>培养皿1</p>
                </div>
                <div className={styles.petriDishItem}>
                  <img
                    src={petriDishImage}
                    alt="培养皿2 - 5mg/ml"
                    className={styles.petriDishImage}
                  />
                  <p className={styles.petriDishLabel}>培养皿2</p>
                </div>
                <div className={styles.petriDishItem}>
                  <img
                    src={petriDishImage}
                    alt="培养皿3 - 10mg/ml"
                    className={styles.petriDishImage}
                  />
                  <p className={styles.petriDishLabel}>培养皿3</p>
                </div>
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
                className={`${styles.textInput} ${error ? styles.textInputError : ''}`}
                value={inputValue}
                onFocus={handleInputFocus}
                onChange={handleInputChange}
                onBlur={handleInputBlur}
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
            {error && (
              <div className={styles.errorMessage} data-testid="error-message">
                {error}
              </div>
            )}
          </div>
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

export default Page02StepQ1;
