import React, { useEffect, useRef } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import completionImage from '@assets/images/xjbs12.jpg';
import styles from '../styles/Page14TaskCompletion.module.css';

const Page14TaskCompletion: React.FC = () => {
  const { logOperation, setPageStartTime, getPagePrefix } = useG8BananaBrowningContext();
  const targetPrefix = getPagePrefix();
  const hasLoggedEnter = useRef(false);

  useEffect(() => {
    if (hasLoggedEnter.current) return;
    hasLoggedEnter.current = true;
    setPageStartTime(new Date());
    logOperation({
      targetElement: `${targetPrefix}页面进入`,
      eventType: EventTypes.PAGE_ENTER,
      value: '任务完成页',
      time: new Date().toISOString(),
    });
  }, [logOperation, setPageStartTime, targetPrefix]);

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.leftSection}>
          <img
            src={completionImage}
            alt="小明和香蕉探究任务完成"
            className={styles.completionImage}
          />
        </div>
        <div className={styles.rightSection}>
          <div className={styles.content}>
            <div className={styles.iconWrapper}>
              <svg className={styles.checkIcon} viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#22c55e" />
                <path
                  d="M8 12l2.5 2.5L16 9"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className={styles.title}>任务完成！</h1>
            <p className={styles.message}>
              经过一番探究，终于找到了香蕉快速变黑的"元凶"——
              储存温度过低。不仅如此，你还帮小明解决了为家庭聚会选购香蕉的难题。感谢你对小明的帮助！
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page14TaskCompletion;
