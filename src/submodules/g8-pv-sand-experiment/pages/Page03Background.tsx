import React, { useState, useEffect } from 'react';
import { usePvSandContext } from '../context/PvSandContext';
import styles from '../styles/Page03Background.module.css';
import backgroundImage from '../assets/images/pv-sand-background.jpg';

const Page03Background: React.FC = () => {
  const {
    logOperation,
    setPageStartTime,
    collectAnswer,
    currentPageId,
    answers
  } = usePvSandContext();

  const [countdown, setCountdown] = useState(5);

  // Sync local state with answers
  const canProceed = answers['background_read'] === 'true';

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

  useEffect(() => {
    if (countdown <= 0) {
      if (!canProceed) {
        collectAnswer({
          targetElement: 'background_read',
          value: 'true'
        });
      }
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, canProceed, collectAnswer]);

  return (
    <div className={styles.container}>
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

        {!canProceed && (
          <div style={{ textAlign: 'center', marginTop: '20px', color: '#666' }}>
            请仔细阅读... {countdown}s
          </div>
        )}
      </div>
    </div>
  );
};

export default Page03Background;