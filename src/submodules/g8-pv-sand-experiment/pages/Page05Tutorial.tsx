import React, { useState, useEffect } from 'react';
import { usePvSandContext } from '../context/PvSandContext';
import { useAnswerDrafts } from '../hooks/useAnswerDrafts';
import { getNextPageId } from '../mapping';
import Sidebar from '../components/Sidebar';
import WindSpeedometer from '../components/WindSpeedometer';
import styles from '../styles/Page05Tutorial.module.css';

const Page05Tutorial: React.FC = () => {
  const {
    logOperation,
    navigateToPage,
    setPageStartTime
  } = usePvSandContext();

  const { collectPageAnswers, markPageCompleted } = useAnswerDrafts();

  const [heightIndex, setHeightIndex] = useState(0); // 0: 0cm, 1: 20cm, 2: 50cm, 3: 100cm
  const [withPanelSpeed, setWithPanelSpeed] = useState(0);
  const [withoutPanelSpeed, setWithoutPanelSpeed] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  const currentPageId = 'page05-tutorial';

  // 实验数据: [0cm, 20cm, 50cm, 100cm]
  const heightOptions = [0, 20, 50, 100];
  const withPanelData = [0, 2.09, 2.25, 1.66];
  const withoutPanelData = [0, 2.37, 2.62, 2.77];

  const currentHeight = heightOptions[heightIndex];

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

  const handleHeightChange = (delta: number) => {
    const newIndex = Math.max(0, Math.min(3, heightIndex + delta));
    setHeightIndex(newIndex);

    logOperation({
      targetElement: '高度调节',
      eventType: 'click',
      value: `调整高度: ${heightOptions[newIndex]}cm`,
      time: new Date().toISOString()
    });
  };

  const handleStart = () => {
    if (isRunning) return;

    setIsRunning(true);
    logOperation({
      targetElement: '开始按钮',
      eventType: 'click',
      value: `开始测量 - 高度${currentHeight}cm`,
      time: new Date().toISOString()
    });

    setTimeout(() => {
      setWithPanelSpeed(withPanelData[heightIndex]);
      setWithoutPanelSpeed(withoutPanelData[heightIndex]);
      setIsRunning(false);
    }, 2000);
  };

  const handleReset = () => {
    setWithPanelSpeed(0);
    setWithoutPanelSpeed(0);
    setHeightIndex(0); // 重置为0cm

    logOperation({
      targetElement: '重置按钮',
      eventType: 'click',
      value: '重置实验',
      time: new Date().toISOString()
    });
  };

  const handleNext = () => {
    logOperation({
      targetElement: '下一页按钮',
      eventType: 'click',
      value: '进入实验页面',
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
      <Sidebar currentStep={3} totalSteps={6} variant="background" />

      {/* 主内容区域 */}
      <div className={styles.mainContent}>
        <h1 className={styles.title}>光伏治沙</h1>
        
        <div className={styles.contentArea}>
          {/* 左侧说明区域 */}
          <div className={styles.leftContent}>
            <div className={styles.instructionBox}>
              <p className={styles.instructionIntro}>
                接下来，我们将在计算机上通过模拟实验的方式开展探究。右侧为实验互动界面：
              </p>
              <div className={styles.stepList}>
                <div className={styles.stepItem}>
                  <span className={styles.checkmark}>✓</span>
                  <span className={styles.stepText}>单击下方 +/− 按钮，可调整风速仪的观测高度；</span>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.checkmark}>✓</span>
                  <span className={styles.stepText}>单击【<strong>开始</strong>】按钮，系统将自动采集数据，并在绿色框内显示该位点的风速值；</span>
                </div>
                <div className={styles.stepItem}>
                  <span className={styles.checkmark}>✓</span>
                  <span className={styles.stepText}>单击【<strong>重置</strong>】按钮，可重新开始。</span>
                </div>
              </div>
            </div>
          </div>

          {/* 右侧实验面板 */}
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
                {withPanelSpeed > 0 ? `${withPanelSpeed}m/s` : '0'}
              </div>
              <div className={styles.windValue}>
                {withoutPanelSpeed > 0 ? `${withoutPanelSpeed}m/s` : '0'}
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
          <button
            onClick={handleNext}
            className={styles.nextButton}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page05Tutorial;
