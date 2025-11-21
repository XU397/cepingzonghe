import React, { useState, useEffect } from 'react';
import { usePvSandContext } from '../context/PvSandContext';
import { useAnswerDrafts } from '../hooks/useAnswerDrafts';
import { getNextPageId } from '../mapping';
import Sidebar from '../components/Sidebar';
import WindSpeedometer from '../components/WindSpeedometer';
import styles from '../styles/Page05Tutorial.module.css';

const Page07Experiment2: React.FC = () => {
  const {
    logOperation,
    navigateToPage,
    setPageStartTime
  } = usePvSandContext();

  const {
    updateExperimentAnswer,
    collectPageAnswers,
    markPageCompleted,
    answerDraft
  } = useAnswerDrafts();

  const [selectedOption, setSelectedOption] = useState<string>(
    answerDraft.experimentAnswers.experiment2Analysis || ''
  );
  const [heightIndex, setHeightIndex] = useState(0); // 0: 0cm, 1: 20cm, 2: 50cm, 3: 100cm
  const [leftSpeed, setLeftSpeed] = useState(0);
  const [rightSpeed, setRightSpeed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const currentPageId = 'page07-experiment2';

  // 实验数据: [0cm, 20cm, 50cm, 100cm]
  const heightOptions = [0, 20, 50, 100];
  const withPanelData = [0, 2.09, 2.25, 1.66];
  const withoutPanelData = [0, 2.37, 2.62, 2.77];

  const currentHeight = heightOptions[heightIndex];

  const options = [
    '在两区域，风速都随高度增加而增加',
    '在两区域，风速都随高度增加而减小',
    '在无板区，风速随高度增加而增大；在有板区，风速随高度增加而减小',
    '在无板区，风速随高度增加而减小；在有板区，风速随高度增加而增大'
  ];

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

  const handleOptionChange = (option: string) => {
    setSelectedOption(option);
    updateExperimentAnswer('experiment2Analysis', option);

    logOperation({
      targetElement: '选项',
      eventType: 'click',
      value: option,
      time: new Date().toISOString()
    });
  };

  const handleHeightChange = (delta: number) => {
    const newIndex = Math.max(0, Math.min(3, heightIndex + delta));
    setHeightIndex(newIndex);

    logOperation({
      targetElement: '高度调节',
      eventType: 'click',
      value: `调节到${heightOptions[newIndex]}cm`,
      time: new Date().toISOString()
    });
  };

  const handleReset = () => {
    setLeftSpeed(0);
    setRightSpeed(0);
    setIsRunning(false);

    logOperation({
      targetElement: '重置按钮',
      eventType: 'click',
      value: '重置实验',
      time: new Date().toISOString()
    });
  };

  const handleStart = () => {
    if (isRunning) return;
    setIsRunning(true);

    logOperation({
      targetElement: '开始按钮',
      eventType: 'click',
      value: `开始测量-高度${currentHeight}cm`,
      time: new Date().toISOString()
    });

    setTimeout(() => {
      setLeftSpeed(withPanelData[heightIndex]);
      setRightSpeed(withoutPanelData[heightIndex]);
      setIsRunning(false);
    }, 2000);
  };

  const handleNext = () => {
    logOperation({
      targetElement: '下一页按钮',
      eventType: 'click',
      value: '点击下一页',
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
      <Sidebar currentStep={5} totalSteps={6} variant="experiment" />

      <div className={styles.mainContent}>
        <h1 className={styles.title}>光伏治沙</h1>
        
        <div className={styles.contentArea}>
          <div className={styles.leftContent}>
            <div className={styles.questionBox}>
              <p className={styles.questionTitle}>
                <strong>问题3：</strong>根据实验模拟，关于风速随高度变化的描述，正确的是?
              </p>

              <div className={styles.options}>
                {options.map((option, index) => (
                  <label key={index} className={styles.optionItem}>
                    <input
                      type="radio"
                      name="experiment2"
                      value={option}
                      checked={selectedOption === option}
                      onChange={() => handleOptionChange(option)}
                    />
                    <span className={styles.optionText}>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className={styles.experimentContainer}>
            <div className={styles.panelHeader}>
              <span className={styles.panelTitle}>有光伏板</span>
              <span className={styles.panelTitle}>无光伏板</span>
            </div>

            <div className={styles.windDisplay}>
              <svg viewBox="0 0 600 300" className={styles.windSimulator}>
                {/* 地平线 */}
                <line x1="20" y1="280" x2="580" y2="280" stroke="#ffd99e" strokeWidth="4" strokeLinecap="round" />

                {/* 风速仪 (左侧有板) */}
                <WindSpeedometer
                  x={150}
                  speed={(isRunning && currentHeight > 0) ? withPanelData[heightIndex] : 0}
                  isSpinning={isRunning && currentHeight > 0}
                  heightPercent={currentHeight}
                  showPanel={true}
                  size={{ width: 200, height: 300 }}
                />
                {/* 风速仪 (右侧无板) */}
                <WindSpeedometer
                  x={450}
                  speed={(isRunning && currentHeight > 0) ? withoutPanelData[heightIndex] : 0}
                  isSpinning={isRunning && currentHeight > 0}
                  heightPercent={currentHeight}
                  showPanel={false}
                  size={{ width: 200, height: 300 }}
                />

                {/* 地面遮挡层 (白色遮挡，模拟杆子插入地下) */}
                <rect x="0" y="282" width="600" height="100" fill="#ffffff" />
                <rect x="0" y="282" width="600" height="20" fill="#f5f5f5" opacity="0.1" />
              </svg>
            </div>

            <div className={styles.windLabel}>风速</div>

            <div className={styles.speedDisplayRow}>
              <div className={styles.windValue}>
                {leftSpeed > 0 ? `${leftSpeed}m/s` : '0'}
              </div>
              <div className={styles.windValue}>
                {rightSpeed > 0 ? `${rightSpeed}m/s` : '0'}
              </div>
            </div>

            <div className={styles.heightControls}>
              <button
                className={styles.heightButton}
                onClick={() => handleHeightChange(-1)}
                disabled={heightIndex <= 0}
              >
                －
              </button>
              <div className={styles.heightDisplay}>
                <span>{currentHeight}cm</span>
                <span className={styles.heightLabel}>测量高度</span>
              </div>
              <button
                className={styles.heightButton}
                onClick={() => handleHeightChange(1)}
                disabled={heightIndex >= 3}
              >
                ＋
              </button>
            </div>

            <div className={styles.controlPanel}>
              <button
                className={styles.resetButton}
                onClick={handleReset}
              >
                重置
              </button>

              <button
                className={`${styles.startButton} ${isRunning ? styles.running : ''}`}
                onClick={handleStart}
                disabled={isRunning}
              >
                开始
              </button>
            </div>
          </div>
        </div>
        
        <div className={styles.navigation}>
          <button onClick={handleNext} className={styles.nextButton}>
            下一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page07Experiment2;
