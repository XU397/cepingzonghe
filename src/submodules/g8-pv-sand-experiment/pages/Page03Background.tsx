import React, { useState, useEffect, useRef } from 'react';
import { usePvSandContext } from '../context/PvSandContext';
import EventTypes from '@shared/services/submission/eventTypes.js';
import styles from '../styles/Page03Background.module.css';
import backgroundImage from '../assets/images/pv-sand-background.jpg';

const Page03Background: React.FC = () => {
  const {
    logOperation,
    setPageStartTime,
    collectAnswer,
    answers,
    getPagePrefix
  } = usePvSandContext();

  const targetPrefix = getPagePrefix();

  const [countdown, setCountdown] = useState(5);
  const pageInitializedRef = useRef(false);

  // Sync local state with answers
  const canProceed = answers['background_read'] === 'true';

  useEffect(() => {
    if (pageInitializedRef.current) {
      return;
    }
    pageInitializedRef.current = true;

    const startTime = new Date();
    setPageStartTime(startTime);

    // 计时开始埋点
    logOperation({
      targetElement: `${targetPrefix}背景计时器`,
      eventType: EventTypes.TIMER_START,
      value: {
        duration: 5,
        unit: 'seconds',
      },
      time: startTime.toISOString(),
    });

  }, [logOperation, setPageStartTime, targetPrefix]);

  useEffect(() => {
    if (canProceed) {
      return;
    }

    if (countdown <= 0) {
      collectAnswer({
        targetElement: 'background_read',
        value: 'true'
      });
      logOperation({
        targetElement: `${targetPrefix}背景计时器`,
        eventType: EventTypes.TIMER_COMPLETE,
        value: {
          duration: 5,
          unit: 'seconds',
          remaining: 0,
        },
        time: new Date().toISOString(),
      });
      logOperation({
        targetElement: `${targetPrefix}系统`,
        eventType: EventTypes.AUTO_SUBMIT,
        value: {
          reason: 'timer_expired',
          trigger: 'auto_submit',
          duration_seconds: 5,
        },
        time: new Date().toISOString(),
      });
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, canProceed, collectAnswer]);

  return (
    <div className={styles.container}>
      {/* 标题区域 */}
      <div className={styles.header}>
        <h1 className={styles.title}>🌞 光伏治沙 🌿</h1>
      </div>

      {/* 卡片容器 */}
      <div className={styles.cardContainer}>
        {/* 文字卡片 */}
        <div className={styles.card}>
          <span className={styles.cardIcon}>📖</span>
          <h2 className={styles.cardTitle}>项目背景</h2>
          <div className={styles.cardContent}>
            <p>2024年11月，中国库布齐沙漠通过"光伏项目"成功使6000多平方公里沙漠变为"能源绿洲"。</p>
            <br />
            <p>这一成就引发了同学们的思考：光伏板为何能有效减少水分蒸发，以实现保水治沙？他们推测，<strong>改变地表风速可能是关键机制</strong>。</p>
            <br />
            <p>为此，同学们设计了一项实地观测研究，以探究光伏板对风速的影响。</p>
          </div>
        </div>

        {/* 图片卡片 */}
        <div className={`${styles.card} ${styles.imageCard}`}>
          <span className={styles.cardIcon}>🏜️</span>
          <h2 className={styles.cardTitle}>光伏治沙现场</h2>
          <div className={styles.imageWrapper}>
            <img
              src={backgroundImage}
              alt="光伏治沙项目示意图"
              className={styles.pvImage}
            />
          </div>
          <div className={styles.imageCaption}>
            📍 库布齐沙漠光伏项目 · 6000+平方公里能源绿洲
          </div>
        </div>
      </div>

      {/* 高亮框 */}
      <div className={styles.highlightBox}>
        <p className={styles.highlightText}>
          🔬 <strong>研究假设：</strong>光伏板通过改变地表风速，减少水分蒸发，实现保水治沙效果
        </p>
      </div>

      {/* 倒计时提示 */}
      {!canProceed && (
        <div className={styles.countdownContainer}>
          <div className={styles.countdown}>
            ⏱️ 请仔细阅读材料... {countdown}s
          </div>
        </div>
      )}
    </div>
  );
};

export default Page03Background;
