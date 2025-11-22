import React, { useState, useEffect } from 'react';
import { usePvSandContext } from '../context/PvSandContext';
import styles from '../styles/Page04ExperimentDesign.module.css';
import withPanelImg from '../assets/images/experiment-with-panel.png';
import noPanelImg from '../assets/images/experiment-no-panel.png';

const Page04ExperimentDesign: React.FC = () => {
  const {
    logOperation,
    setPageStartTime,
    collectAnswer,
    currentPageId,
    answers
  } = usePvSandContext();

  const [designText, setDesignText] = useState('');
  const [showError, setShowError] = useState(false);
  const minChars = 10; // Updated to 10 to match Component.tsx validation

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
        // Auto-hide error after 3 seconds
        setTimeout(() => setShowError(false), 3000);
      }
    };

    window.addEventListener('pv-sand-validation-error', handleValidationError);
    return () => {
      window.removeEventListener('pv-sand-validation-error', handleValidationError);
    };
  }, [designText, minChars]);

  useEffect(() => {
    const startTime = new Date();
    setPageStartTime(startTime);

    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: currentPageId,
      time: startTime.toISOString()
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: 'page_exit',
        value: currentPageId,
        time: new Date().toISOString()
      });
    };
  }, [logOperation, setPageStartTime, currentPageId]);

  const handleTextChange = (text: string) => {
    setDesignText(text);

    collectAnswer({
      targetElement: 'designReason',
      value: text
    });

    logOperation({
      targetElement: '问题1输入框',
      eventType: 'change',
      value: text,
      time: new Date().toISOString()
    });
  };

  const isValid = designText.length >= minChars;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>光伏治沙</h1>

      <div className={styles.contentWrapper}>
          <div className={styles.leftSection}>
            <div className={styles.instructionBox}>
              <p className={styles.instructionText}>
                本实验旨在探究光伏板是否通过影响风速来调节土壤水分蒸发。实验步骤如下：
              </p>
              <p className={styles.stepText}>
                1）在光伏治沙基地内，选取相邻的两块区域，分别位于光伏板正下方和无光伏板覆盖的裸露地带；
              </p>
              <p className={styles.stepText}>
                2）在每个区域内，分别于20厘米、50厘米、100厘米高度设置风速仪；
              </p>
              <p className={styles.stepText}>
                3）实验开始，记录各风速仪测得的风速值。
              </p>
            </div>

            <div className={styles.imageContainer}>
              <div className={styles.imageWrapper}>
                <div className={styles.imagePlaceholder}>
                  <img
                    src={withPanelImg}
                    alt="有光伏板区域实验场景"
                    className={styles.experimentImage}
                  />
                </div>
                <div className={styles.imageLabel}>
                  <span className={styles.bullet}>•</span>
                  有板区
                </div>
              </div>

              <div className={styles.imageWrapper}>
                <div className={styles.imagePlaceholder}>
                  <img
                    src={noPanelImg}
                    alt="无光伏板区域实验场景"
                    className={styles.experimentImage}
                  />
                </div>
                <div className={styles.imageLabel}>
                  <span className={styles.bullet}>•</span>
                  无板区
                </div>
              </div>
            </div>
          </div>

          <div className={styles.rightSection}>
            <div className={styles.questionBox}>
              <p className={styles.questionText}>
                <span className={styles.questionLabel}>问题1：</span>
                为什么要在无板区和有板区分别放置两套相同的测量仪器？请写出原因。
              </p>

              <textarea
                value={designText}
                onChange={(e) => handleTextChange(e.target.value)}
                className={styles.textArea}
                placeholder="请输入您的回答..."
              />
              <div style={{ textAlign: 'right', fontSize: '12px', color: isValid ? 'green' : 'red', marginTop: '5px' }}>
                {designText.length}/{minChars} 字符
              </div>

              {showError && (
                <div className={styles.errorMessage}>
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

