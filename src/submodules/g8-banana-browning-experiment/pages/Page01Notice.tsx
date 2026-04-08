import React, { useEffect, useRef, useState } from 'react';
import EventTypes from '@shared/services/submission/eventTypes.js';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import styles from '../styles/Page01Notice.module.css';

const NOTICE_COUNTDOWN_SECONDS = 30;

const Page01Notice: React.FC = () => {
  const {
    logOperation,
    setPageStartTime,
    collectAnswer,
    answers,
    taskDurationMinutes,
    getPagePrefix,
  } = useG8BananaBrowningContext();
  const targetPrefix = getPagePrefix();

  const [countdown, setCountdown] = useState(NOTICE_COUNTDOWN_SECONDS);
  const [canCheck, setCanCheck] = useState(false);
  const timerCompletedRef = useRef(false);
  const pageInitializedRef = useRef(false);

  const isChecked = answers.instructions_read === 'true';

  useEffect(() => {
    if (pageInitializedRef.current) {
      return;
    }

    pageInitializedRef.current = true;
    const startTime = new Date();
    setPageStartTime(startTime);
    logOperation({
      targetElement: `${targetPrefix}任务计时器`,
      eventType: EventTypes.TIMER_START,
      value: { duration: NOTICE_COUNTDOWN_SECONDS, unit: 'seconds' },
      time: startTime.toISOString(),
    });
  }, [logOperation, setPageStartTime, targetPrefix]);

  useEffect(() => {
    if (countdown <= 0) {
      if (!timerCompletedRef.current) {
        timerCompletedRef.current = true;
        logOperation({
          targetElement: `${targetPrefix}任务计时器`,
          eventType: EventTypes.TIMER_COMPLETE,
          value: { duration: NOTICE_COUNTDOWN_SECONDS, unit: 'seconds', remaining: 0 },
          time: new Date().toISOString(),
        });
        collectAnswer({ targetElement: 'timer_completed', value: 'true' });
      }

      setCanCheck(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setCountdown(previous => previous - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [collectAnswer, countdown, logOperation, targetPrefix]);

  const handleCheckboxChange = () => {
    if (!canCheck) {
      const timestamp = new Date().toISOString();

      logOperation({
        targetElement: `${targetPrefix}阅读确认复选框`,
        eventType: EventTypes.CLICK_BLOCKED,
        value: {
          reason: 'countdown_not_finished',
          missing: ['timer_completed'],
          timestamp,
          remainingSeconds: countdown,
        },
        time: timestamp,
      });
      return;
    }

    const newChecked = !isChecked;
    collectAnswer({
      targetElement: 'instructions_read',
      value: newChecked ? 'true' : 'false',
    });
    logOperation({
      targetElement: `${targetPrefix}阅读确认复选框`,
      eventType: newChecked ? EventTypes.CHECKBOX_CHECK : EventTypes.CHECKBOX_UNCHECK,
      value: newChecked ? '已勾选' : '取消勾选',
      time: new Date().toISOString(),
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>
            8年级香蕉变黑科学探究
            <span className={styles.titleUnderline} />
          </h1>
        </div>

        <div className={styles.noticeArea}>
          <span className={styles.noticeBadge}>注意事项</span>
          <ul className={styles.noticeList}>
            <li>
              本次任务主题为 <span className={styles.highlight}>香蕉变黑</span>，预计用时{' '}
              <span className={styles.highlight}>{taskDurationMinutes} 分钟</span>，请合理安排时间。
            </li>
            <li>请按顺序完成所有页面，先认真阅读说明，再进入后续探究内容。</li>
            <li>
              <span className={styles.highlightRed}>不要在准备不足时提前进入下一页</span>
              ，以免影响后续作答与操作记录。
            </li>
            <li>如遇到设备或页面异常，请保持当前页面并及时示意老师。</li>
          </ul>
        </div>

        <div className={styles.confirmationBox}>
          <div className={styles.checkboxWrapper}>
            <label className={`${styles.checkboxLabel} ${!canCheck ? styles.disabled : ''}`}>
              <input
                type="checkbox"
                checked={isChecked}
                onChange={handleCheckboxChange}
                className={`${styles.checkbox} ${!canCheck ? styles.checkboxPending : ''}`}
                aria-disabled={!canCheck}
              />
              <span>我已阅读并理解上述注意事项</span>
            </label>
          </div>

          {!canCheck && (
            <div className={styles.countdownButton}>
              请仔细阅读注意事项，{countdown} 秒后可勾选确认……
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page01Notice;
