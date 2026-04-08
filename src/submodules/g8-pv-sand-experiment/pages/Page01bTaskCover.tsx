import React, { useState, useEffect, useRef } from 'react';
import { usePvSandContext } from '../context/PvSandContext';
import EventTypes from '@shared/services/submission/eventTypes.js';
import styles from '../styles/Page01bTaskCover.module.css';
import backgroundImage from '../assets/images/pv-sand-background.jpg';

const Page01bTaskCover: React.FC = () => {
  const {
    logOperation,
    setPageStartTime,
    collectAnswer,
    currentPageId,
    answers,
    taskDurationMinutes,
    getPagePrefix
  } = usePvSandContext();

  const targetPrefix = getPagePrefix();

  const [countdown, setCountdown] = useState(30); // Reduced to 5s for testing, originally 38
  const [canCheck, setCanCheck] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const timerCompletedRef = useRef(false);

  // Sync local state with answers
  const isChecked = answers['instructions_read'] === 'true';

  // Listen for validation errors from frame
  useEffect(() => {
    const handleValidationError = () => {
      let message = '';
      let reason = '';
      let missing: string[] = [];

      if (!canCheck) {
        message = '请仔细阅读注意事项，倒计时结束后才能继续';
        reason = 'countdown_not_finished';
        missing = ['timer_completed'];
      } else if (!isChecked) {
        message = '请勾选我已阅读并理解上述注意事项';
        reason = 'checkbox_not_checked';
        missing = ['instructions_read'];
      }

      if (message) {
        setErrorMessage(message);
        logOperation({
          targetElement: `${targetPrefix}下一页按钮`,
          eventType: EventTypes.CLICK_BLOCKED,
          value: {
            reason,
            missing,
            timestamp: new Date().toISOString(),
          },
          time: new Date().toISOString(),
        });
        // Auto-hide error after 3 seconds
        setTimeout(() => setErrorMessage(''), 3000);
      }
    };

    window.addEventListener('pv-sand-validation-error', handleValidationError);
    return () => {
      window.removeEventListener('pv-sand-validation-error', handleValidationError);
    };
  }, [canCheck, isChecked, logOperation, targetPrefix]);

  // 页面初始化：设置开始时间和启动计时器
  // 注意：page_enter/page_exit 由 AssessmentPageFrame 自动记录，此处不再手动记录
  // 参考 g8-mikania-experiment 的规范实现
  const pageInitializedRef = useRef(false);

  useEffect(() => {
    // 防止重复初始化（React StrictMode 或 logOperation 变化时）
    if (pageInitializedRef.current) {
      return;
    }
    pageInitializedRef.current = true;

    const startTime = new Date();
    setPageStartTime(startTime);

    // 计时开始埋点
    logOperation({
      targetElement: `${targetPrefix}任务计时器`,
      eventType: EventTypes.TIMER_START,
      value: {
        duration: 30,
        unit: 'seconds',
      },
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
          value: {
            duration: 30,
            unit: 'seconds',
            remaining: 0,
          },
          time: new Date().toISOString(),
        });
        collectAnswer({
          targetElement: 'timer_completed',
          value: 'true',
        });
      }
      setCanCheck(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleCheckboxChange = () => {
    if (!canCheck) {
      logOperation({
        targetElement: `${targetPrefix}确认复选框`,
        eventType: EventTypes.CLICK_BLOCKED,
        value: {
          reason: 'countdown_not_finished',
          missing: ['instructions_read'],
          timestamp: new Date().toISOString(),
        },
        time: new Date().toISOString(),
      });
      return;
    }

    const newChecked = !isChecked;

    collectAnswer({
      targetElement: 'instructions_read',
      value: newChecked ? 'true' : 'false'
    });

    logOperation({
      targetElement: `${targetPrefix}阅读确认复选框`,
      eventType: newChecked ? EventTypes.CHECKBOX_CHECK : EventTypes.CHECKBOX_UNCHECK,
      value: newChecked ? '已勾选' : '取消勾选',
      time: new Date().toISOString()
    });
  };

  return (
    <div className={styles.container}>
      <img
        src={backgroundImage}
        alt="光伏治沙背景"
        className={styles.backgroundImage}
      />

      <div className={styles.content}>
        <div className={styles.title}>
          光伏治沙科学探究
          <div className={styles.titleUnderline}></div>
        </div>

        <div className={styles.noticeCard}>
          <div className={styles.labelTag}>请仔细阅读</div>

          <ul className={styles.noticeList}>
            <li>
            本次测试一共两个任务，作答时间共<span className={styles.highlight}>{taskDurationMinutes}分钟</span>，当前是第一个任务，大约需要<span className={styles.highlight}>20分钟</span>完成，请注意时间分配。
            </li>
            <li>
              请按顺序回答每页问题，上一页题目未完成作答，将无法点击进入下一页。
            </li>
            <li style={{ fontSize: '20px' }}>
              答题时，<span className={styles.highlightRed}>不要提前点击"下一页"</span>查看后面的内容，<span className={styles.highlightRed}>否则将无法返回上一页</span>。
            </li>
            <li>
              遇到系统故障、死机、死循环等特殊情况时，请举手示意老师。
            </li>
          </ul>
        </div>

        <div className={styles.confirmCard}>
          <div className={styles.checkboxRow}>
            <input
              type="checkbox"
              id="confirmCheckbox"
              checked={isChecked}
              onChange={handleCheckboxChange}
              disabled={!canCheck}
              className={styles.checkbox}
            />
            <label htmlFor="confirmCheckbox" className={styles.checkboxLabel}>
              我已阅读并理解上述注意事项
            </label>
          </div>

          {!canCheck && (
            <button
              className={`${styles.confirmButton} ${styles.disabled}`}
              disabled={true}
            >
              请仔细阅读注意事项，<span className={styles.countdownNumber}>{countdown}</span> 秒后可勾选确认...
            </button>
          )}

          {errorMessage && (
            <div className={styles.errorMessage}>
              {errorMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page01bTaskCover;
