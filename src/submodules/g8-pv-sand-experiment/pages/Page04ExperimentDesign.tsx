import React, { useState, useEffect } from 'react';
import { usePvSandContext } from '../context/PvSandContext';
import { useAnswerDrafts } from '../hooks/useAnswerDrafts';
import { getNextPageId } from '../mapping';
import Sidebar from '../components/Sidebar';
import styles from '../styles/Page04ExperimentDesign.module.css';
import withPanelImg from '../assets/images/experiment-with-panel.png';
import noPanelImg from '../assets/images/experiment-no-panel.png';

const Page04ExperimentDesign: React.FC = () => {
  const {
    logOperation,
    navigateToPage,
    setPageStartTime
  } = usePvSandContext();

  const {
    updateExperimentAnswer,
    validateExperimentDesign,
    collectPageAnswers,
    markPageCompleted,
    answerDraft
  } = useAnswerDrafts();

  const [designText, setDesignText] = useState('');
  const [isValid, setIsValid] = useState(false);

  const currentPageId = 'page04-experiment-design';
  const minChars = 5;

  // 从answerDraft恢复已保存的答案(仅在初始化时执行一次)
  useEffect(() => {
    if (answerDraft.experimentAnswers.designReason) {
      setDesignText(answerDraft.experimentAnswers.designReason);
    }
  }, []);

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
  }, [logOperation, setPageStartTime]);

  useEffect(() => {
    setIsValid(designText.length >= minChars);
  }, [designText, minChars]);

  const handleTextChange = (text: string) => {
    setDesignText(text);
    updateExperimentAnswer('designReason', text);

    logOperation({
      targetElement: '问题1输入框',
      eventType: 'input',
      value: text,
      time: new Date().toISOString()
    });
  };

  const handleNext = () => {
    const isValidForNext = validateExperimentDesign();

    if (!isValidForNext) {
      logOperation({
        targetElement: '下一页',
        eventType: 'click_blocked',
        value: `文本长度不足${minChars}字符 (当前: ${designText.length})`,
        time: new Date().toISOString()
      });
      alert(`请至少输入${minChars}个字符 (当前: ${designText.length}字符)`);
      return;
    }

    logOperation({
      targetElement: '下一页按钮',
      eventType: 'click',
      value: '进入下一页',
      time: new Date().toISOString()
    });

    collectPageAnswers(currentPageId);
    markPageCompleted(currentPageId);

    const nextPageId = getNextPageId(currentPageId);
    if (nextPageId) {
      navigateToPage(nextPageId);
    }
  };

  return (
    <div className={styles.container}>
      <Sidebar currentStep={2} totalSteps={6} variant="experiment" />

      <div className={styles.mainContent}>
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
                placeholder=""
              />
            </div>
          </div>
        </div>

        <div className={styles.navigation}>
          <button
            onClick={handleNext}
            disabled={!isValid}
            className={`${styles.nextButton} ${!isValid ? styles.disabled : ''}`}
            title={!isValid ? `请至少输入${minChars}个字符 (当前: ${designText.length})` : ''}
          >
            下一页 {!isValid && `(${designText.length}/${minChars})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page04ExperimentDesign;
