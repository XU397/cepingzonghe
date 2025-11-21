import React, { useState, useEffect } from 'react';
import { usePvSandContext } from '../context/PvSandContext';
import { useAnswerDrafts } from '../hooks/useAnswerDrafts';
import { getPageInfo, getNextPageId } from '../mapping';
import Sidebar from '../components/Sidebar';
import styles from '../styles/Page03Background.module.css';
import backgroundImage from '../assets/images/background.jpg';

const Page03Background: React.FC = () => {
  const { 
    logOperation, 
    navigateToPage, 
    setPageStartTime 
  } = usePvSandContext();
  
  const { collectPageAnswers, markPageCompleted } = useAnswerDrafts();
  
  const [countdown, setCountdown] = useState(5);
  const [canProceed, setCanProceed] = useState(false);

  const currentPageId = 'page03-background';
  const pageInfo = getPageInfo(currentPageId);

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
    if (countdown <= 0) {
      setCanProceed(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleNext = () => {
    if (!canProceed) {
      logOperation({
        targetElement: '下一步',
        eventType: 'click_blocked',
        value: '阅读时间未满5秒',
        time: new Date().toISOString()
      });
      return;
    }

    logOperation({
      targetElement: '继续实验按钮',
      eventType: 'click',
      value: '进入实验设计阶段',
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
      <Sidebar currentStep={1} totalSteps={6} variant="background" />

      {/* 主内容区域 */}
      <div className={styles.mainContent}>
        <h1 className={styles.title}>光伏治沙</h1>
        
        <div className={styles.contentArea}>
          <div className={styles.textSection}>
            <p className={styles.description}>
              2024年11月，中国库布齐沙漠通过"光伏项目"成功使6000多平方公里沙漠变为"能源绿洲"。这一成就引发了同学们的思考：光伏板为何能有效减少水分蒸发，以实现保水治沙？他们推测，<strong>改变地表风速可能是关键机制</strong>。为此，同学们设计了一项实地观测研究，以探究光伏板对风速的影响。
            </p>
          </div>
          
          <div className={styles.imageSection}>
            <img
              src={backgroundImage}
              alt="光伏治沙项目示意图"
              className={styles.pvImage}
            />
          </div>
        </div>
        
        <div className={styles.navigation}>
          <button
            onClick={handleNext}
            disabled={!canProceed}
            className={`${styles.nextButton} ${!canProceed ? styles.disabled : ''}`}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default Page03Background;