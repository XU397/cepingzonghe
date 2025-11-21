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
 * - targetElement: 'P3_控制变量理由'
 * - INPUT_CHANGE event logging
 */
const MIN_CHARS = 5;

export default function Page03_Hypothesis() {
  const { logOperation, setAnswer, getAnswer } = useDroneImagingContext();

  // State
  const [inputValue, setInputValue] = useState(getAnswer('P3_控制变量理由') || '');
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
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setError('');

    // Save answer
    setAnswer('P3_控制变量理由', value);

    // Log INPUT_CHANGE event
    logOperation({
      targetElement: 'P3_控制变量理由',
      eventType: EventTypes.INPUT_CHANGE,
      value: value,
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
        value: 'input_too_short',
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

      {/* Split layout */}
      <div className={styles.splitLayout}>
        {/* Left content - question */}
        <div className={styles.leftContent}>
          <div className={styles.questionBox}>
            <p className={styles.questionText}>
            本实验旨在探究飞行高度与镜头焦距对无人机地面采样距离（GSD）的影响。实验步骤如下：
            </p>
          </div>

          <div className={styles.hintBox}>
            <p className={styles.hintText}>1）选择平坦开阔的实验场地，设置三个不同飞行高度（100米，200米，300米）；</p>
            <p className={styles.hintText}>2）在同一高度下，分别调整无人机相机镜头焦距为8毫米, 24毫米, 50毫米进行航拍；</p>
            <p className={styles.hintText}>3）除高度和焦距外，确保其他参数（如相机分辨率，天气条件等）完全一致。每次航拍后，通过影像处理软件计算对应的地面采样距离（GSD，单位：厘米/像素）。</p>
          </div>
        </div>

        {/* Right content - textarea */}
        <div className={styles.rightContent}>
        <p className={styles.description}>
        <strong>问题1：</strong>为什么在每次航拍时，都需要确保相机分辨率和天气条件等一致？请写出原因。
      </p>
          <div className={styles.textareaWrapper}>
            <textarea
              value={inputValue}
              onChange={handleInputChange}
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
