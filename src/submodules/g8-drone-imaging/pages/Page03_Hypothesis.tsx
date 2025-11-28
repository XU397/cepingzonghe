import React, { useEffect, useState } from 'react';
import { useDroneImagingContext } from '../context/DroneImagingContext';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { formatTimestamp } from '@shared/services/dataLogger.js';
import styles from '../styles/Page03_Hypothesis.module.css';

/**
 * Page03_Hypothesis - Hypothesis Formation Page
 *
 * FR-004: Students form their hypothesis about the relationship between
 * height, focal length, and GSD before the experiment.
 * - Textarea input
 * - Validation: text length > 5 characters
 * - Character count indicator
 * - Error message: '请输入至少5个字符的思考内容'
 * - targetElement: P<pageNumber>_控制变量理由（随 stepIndex 动态生成）
 * - INPUT_CHANGE event logging
 */
const MIN_CHARS = 5;

export default function Page03_Hypothesis() {
  const { logOperation, setAnswer, getAnswer, questionIds } = useDroneImagingContext();
  const hypothesisQuestionId = questionIds.controlVariableReason;

  // State
  const [inputValue, setInputValue] = useState(getAnswer(hypothesisQuestionId) || '');
  const [error, setError] = useState('');

  // Page enter/exit logging
  useEffect(() => {
    logOperation({
      targetElement: 'page',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page03_Hypothesis',
      time: formatTimestamp(new Date()),
    });

    return () => {
      logOperation({
        targetElement: 'page',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page03_Hypothesis',
        time: formatTimestamp(new Date()),
      });
    };
  }, [logOperation]);

  // Handle input change
  const handleInputFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    logOperation({
      targetElement: hypothesisQuestionId,
      eventType: EventTypes.INPUT_FOCUS,
      value: e.target.value || '',
      time: formatTimestamp(new Date()),
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const prevValue = inputValue;
    setInputValue(value);
    setError('');

    setAnswer(hypothesisQuestionId, value);

    logOperation({
      targetElement: hypothesisQuestionId,
      eventType: EventTypes.INPUT_CHANGE,
      value: JSON.stringify({ prev: prevValue, next: value }),
      time: formatTimestamp(new Date()),
    });
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    logOperation({
      targetElement: hypothesisQuestionId,
      eventType: EventTypes.INPUT_BLUR,
      value: e.target.value || '',
      time: formatTimestamp(new Date()),
    });
  };

  // Handle next button click
  const handleNext = () => {
    // Validate input length
    if (inputValue.length <= MIN_CHARS) {
      setError('请输入至少5个字符的思考内容');

      // Log CLICK_BLOCKED event
      logOperation({
        targetElement: 'next_button',
        eventType: EventTypes.CLICK_BLOCKED,
        value: JSON.stringify({
          reason: 'input_too_short',
          missing: [hypothesisQuestionId],
          currentLength: inputValue.length,
          requiredLength: MIN_CHARS + 1,
        }),
        time: formatTimestamp(new Date()),
      });
      return;
    }

    // Log successful click
    logOperation({
      targetElement: 'next_button',
      eventType: EventTypes.CLICK,
      value: 'navigate_to_experiment',
      time: formatTimestamp(new Date()),
    });

    const frameNextButton =
      document.querySelector<HTMLButtonElement>('[data-testid=\"frame-next-button\"]');
    if (frameNextButton) {
      frameNextButton.click();
    }
  };

  // Character count styling
  const charCount = inputValue.length;
  const charCountClass = charCount > MIN_CHARS
    ? `${styles.charCount} ${styles.valid}`
    : charCount > 0
      ? `${styles.charCount} ${styles.warning}`
      : styles.charCount;

  return (
    <div className={styles.hypothesisContainer} data-testid="page-hypothesis">
      <h2 className={styles.pageTitle}>无人机航拍</h2>

      {/* Split layout: 3/4 left (experiment steps) + 1/4 right (question & input) */}
      <div className={styles.splitLayout}>
        {/* Left content - Experiment Steps (Proposal A style) */}
        <div className={styles.leftContent}>
          {/* Experimental Background */}
          <div className={styles.backgroundSection}>
            <div className={styles.backgroundTitle}>📋 实验背景</div>
            <div className={styles.backgroundText}>
              本实验旨在探究飞行高度与镜头焦距对无人机地面采样距离（GSD）的影响。实验步骤如下：
            </div>
          </div>

          {/* Experiment Steps Section */}
          <div className={styles.stepsSection}>
            <div className={styles.stepsTitle}>📋 实验步骤提示</div>

            <div className={styles.stepsContainer}>
              {/* Step 1 */}
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>①</div>
                <div className={styles.stepIcon}>📍</div>
                <div className={styles.stepTitle}>选择实验场地</div>
                <div className={styles.stepContent}>
                  选择平坦开阔的实验场地<br />
                  设置<span className={styles.stepHighlight}>三个不同飞行高度</span><br />
                  (100米、200米、300米)
                </div>
              </div>

              {/* Step 2 */}
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>②</div>
                <div className={styles.stepIcon}>📷</div>
                <div className={styles.stepTitle}>调整相机焦距</div>
                <div className={styles.stepContent}>
                  在同一高度下<br />
                  分别调整无人机相机镜头焦距为<br />
                  <span className={styles.stepHighlight}>8mm、24mm、50mm</span> <br />
                  进行航拍
                </div>
              </div>

              {/* Step 3 */}
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>③</div>
                <div className={styles.stepIcon}>✓</div>
                <div className={styles.stepTitle}>确保参数一致</div>
                <div className={styles.stepContent}>
                  除高度和焦距外<br />
                  确保<span className={styles.stepHighlight}>其他参数完全一致</span><br />
                  (相机分辨率、天气条件等)
                </div>
              </div>

            </div>

            <div className={styles.stepsFooterNote}>
              每次航拍后，通过影像处理软件计算对应的地面采样距离（GSD，单位：厘米/像素）。
            </div>
          </div>

        </div>

        {/* Right content - Question & Input (1/4 width) */}
        <div className={styles.rightContent}>
          {/* Question Section */}
          <div className={styles.questionSection}>
            <div className={styles.questionBadge}>💡 问题 1</div>
            <div className={styles.questionContent}>
              <strong>为什么在每次航拍时，都需要确保相机分辨率和天气条件等一致？</strong>请写出原因。
            </div>
          </div>



          {/* Input Area */}
          <div className={styles.textareaWrapper}>
            <textarea
              value={inputValue}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onBlur={handleInputBlur}
              placeholder="请写下你的假设..."
              className={`${styles.textarea} ${error ? styles.error : ''}`}
              data-testid="hypothesis-textarea"
            />

            {/* Character counter */}
            <div className={styles.charCounter}>
              <span className={charCountClass}>
                已输入 {charCount} 字
              </span>
              <span className={styles.minCharsHint}>
                最少 {MIN_CHARS} 字
              </span>
            </div>

            {/* Error message */}
            {error && (
              <div className={styles.errorMessage} data-testid="error-message">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hidden next button for Flow frame fallback (not visible in UI) */}
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
        开始实验
      </button>
    </div>
  );
}
