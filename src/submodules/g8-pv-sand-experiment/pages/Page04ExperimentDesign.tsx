import React, { useState, useEffect, useRef } from 'react';
import { usePvSandContext } from '../context/PvSandContext';
import EventTypes from '@shared/services/submission/eventTypes.js';
import styles from '../styles/Page04ExperimentDesign.module.css';
import withPanelImg from '../assets/images/experiment-with-panel.png';
import noPanelImg from '../assets/images/experiment-no-panel.png';

const Page04ExperimentDesign: React.FC = () => {
  const {
    logOperation,
    setPageStartTime,
    collectAnswer,
    answers,
    getPagePrefix,
  } = usePvSandContext();

  // 规范化的 targetElement 前缀
  const targetPrefix = getPagePrefix();
  const questionTarget = `${targetPrefix}Q1_实验设计原因`;

  const [designText, setDesignText] = useState('');
  const [showError, setShowError] = useState(false);
  const minChars = 10; // Updated to 10 to match Component.tsx validation
  const pageInitializedRef = useRef(false);

  // Initialize from saved answers
  useEffect(() => {
    const savedReason = answers['designReason'];
    if (savedReason && typeof savedReason === 'string') {
      setDesignText(savedReason);
    }
  }, []); // Run once on mount

  // Listen for validation errors from frame
  useEffect(() => {
    const handleValidationError = () => {
      const isValid = (designText || '').toString().trim().length >= minChars;
      if (!isValid) {
        setShowError(true);
        logOperation({
          targetElement: `${targetPrefix}下一页按钮`,
          eventType: EventTypes.CLICK_BLOCKED,
          value: JSON.stringify({
            reason: 'input_too_short',
            missing: ['Q1_实验设计原因'],
          }),
          time: new Date().toISOString(),
        });
        // Auto-hide error after 3 seconds
        setTimeout(() => setShowError(false), 3000);
      }
    };

    window.addEventListener('pv-sand-validation-error', handleValidationError);
    return () => {
      window.removeEventListener('pv-sand-validation-error', handleValidationError);
    };
  }, [designText, minChars, targetPrefix, logOperation]);

  useEffect(() => {
    if (pageInitializedRef.current) {
      return;
    }
    pageInitializedRef.current = true;

    const startTime = new Date();
    setPageStartTime(startTime);
  }, [setPageStartTime]);

  const handleTextChange = (text: string) => {
    const prev = designText;
    setDesignText(text);

    collectAnswer({
      targetElement: 'designReason',
      value: text
    });

    const isDelete = text.length < prev.length;
    const eventType = isDelete ? EventTypes.INPUT_DELETE : EventTypes.INPUT_CHANGE;
    const value = isDelete
      ? {
          action: 'delete',
          prevLength: prev.length,
          nextLength: text.length,
        }
      : {
          prev,
          next: text,
        };

    logOperation({
      targetElement: questionTarget,
      eventType,
      value: JSON.stringify(value),
      time: new Date().toISOString()
    });
  };

  const handleFocus = () => {
    logOperation({
      targetElement: questionTarget,
      eventType: EventTypes.INPUT_FOCUS,
      value: designText ?? '',
      time: new Date().toISOString(),
    });
  };

  const handleBlur = () => {
    logOperation({
      targetElement: questionTarget,
      eventType: EventTypes.INPUT_BLUR,
      value: designText ?? '',
      time: new Date().toISOString()
    });
  };

  const isValid = designText.length >= minChars;

  return (
    <div className={styles.designContainer} data-testid="page-experiment-design">
      <h2 className={styles.pageTitle}>光伏治沙</h2>

      {/* Split layout: 3/4 left (experiment steps) + 1/4 right (question & input) */}
      <div className={styles.splitLayout}>
        {/* Left content - Experiment Steps */}
        <div className={styles.leftContent}>
          {/* Experimental Background */}
          <div className={styles.backgroundSection}>
            <div className={styles.backgroundTitle}>📋 实验背景</div>
            <div className={styles.backgroundText}>
              本实验旨在探究光伏板是否通过影响风速来调节土壤水分蒸发。实验步骤如下：
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
                <div className={styles.stepTitle}>选择实验区域</div>
                <div className={styles.stepContent}>
                  在光伏治沙基地内<br />
                  选取相邻的两块区域<br />
                  <span className={styles.stepHighlight}>光伏板正下方 & 裸露地带</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>②</div>
                <div className={styles.stepIcon}>🌡️</div>
                <div className={styles.stepTitle}>设置测量仪器</div>
                <div className={styles.stepContent}>
                  在每个区域内<br />
                  分别于不同高度设置风速仪<br />
                  <span className={styles.stepHighlight}>20cm、50cm、100cm</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className={styles.stepCard}>
                <div className={styles.stepNumber}>③</div>
                <div className={styles.stepIcon}>📊</div>
                <div className={styles.stepTitle}>记录实验数据</div>
                <div className={styles.stepContent}>
                  实验开始后<br />
                  记录各风速仪测得的<br />
                  <span className={styles.stepHighlight}>风速值</span>
                </div>
              </div>
            </div>

            <div className={styles.stepsFooterNote}>
              通过对比两个区域不同高度的风速数据，分析光伏板对风速的影响规律。
            </div>
          </div>

          {/* Images Section - Below steps */}
          <div className={styles.imagesSection}>
            <div className={styles.imageCard}>
              <div className={styles.imageWrapper}>
                <img
                  src={withPanelImg}
                  alt="有光伏板区域实验场景"
                  className={styles.experimentImage}
                />
              </div>
              <div className={styles.imageLabel}>
                <span className={styles.bullet}>•</span>
                有板区实验场景
              </div>
            </div>

            <div className={styles.imageCard}>
              <div className={styles.imageWrapper}>
                <img
                  src={noPanelImg}
                  alt="无光伏板区域实验场景"
                  className={styles.experimentImage}
                />
              </div>
              <div className={styles.imageLabel}>
                <span className={styles.bullet}>•</span>
                无板区实验场景
              </div>
            </div>
          </div>
        </div>

        {/* Right content - Question & Input (1/4 width) */}
        <div className={styles.rightContent}>
          {/* Question Section */}
          <div className={styles.questionSection}>
            <div className={styles.questionBadge}>💡 问题 1</div>
            <div className={styles.questionContent}>
              <strong>为什么要在无板区和有板区分别放置两套相同的测量仪器？</strong>请写出原因。
            </div>
          </div>

          {/* Input Area */}
          <div className={styles.textareaWrapper}>
            <textarea
              value={designText}
              onChange={(e) => handleTextChange(e.target.value)}
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="请写下你的思考..."
              className={`${styles.textarea} ${showError ? styles.error : ''}`}
              data-testid="design-textarea"
            />

            {/* Character counter */}
            <div className={styles.charCounter}>
              <span className={isValid ? `${styles.charCount} ${styles.valid}` : styles.charCount}>
                已输入 {designText.length} 字
              </span>
              <span className={styles.minCharsHint}>
                最少 {minChars} 字
              </span>
            </div>

            {/* Error message */}
            {showError && (
              <div className={styles.errorMessage} data-testid="error-message">
                实验设计原因至少需要 {minChars} 个字符
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page04ExperimentDesign;
