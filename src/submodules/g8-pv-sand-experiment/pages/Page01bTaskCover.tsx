import React, { useState, useEffect } from 'react';
import { usePvSandContext } from '../context/PvSandContext';
import styles from '../styles/Page01bTaskCover.module.css';
import backgroundImage from '../assets/images/pv-sand-background.jpg';

const Page01bTaskCover: React.FC = () => {
  const {
    logOperation,
    setPageStartTime,
    collectAnswer,
    currentPageId,
    answers
  } = usePvSandContext();

  const [countdown, setCountdown] = useState(30); // Reduced to 5s for testing, originally 38
  const [canCheck, setCanCheck] = useState(false);
  const [showError, setShowError] = useState(false);

  // Sync local state with answers
  const isChecked = answers['instructions_read'] === 'true';

  // Listen for validation errors from frame
  useEffect(() => {
    const handleValidationError = () => {
      if (!isChecked && canCheck) {
        setShowError(true);
        // Auto-hide error after 3 seconds
        setTimeout(() => setShowError(false), 3000);
      }
    };

    window.addEventListener('pv-sand-validation-error', handleValidationError);
    return () => {
      window.removeEventListener('pv-sand-validation-error', handleValidationError);
    };
  }, [isChecked, canCheck]);

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
      setCanCheck(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown(prev => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  const handleCheckboxChange = () => {
    if (!canCheck) return;

    const newChecked = !isChecked;

    collectAnswer({
      targetElement: 'instructions_read',
      value: newChecked ? 'true' : 'false'
    });

    logOperation({
      targetElement: '确认复选框',
      eventType: 'click',
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
          光伏治沙
          <div className={styles.titleUnderline}></div>
        </div>

        <div className={styles.noticeCard}>
          <div className={styles.labelTag}>请仔细阅读</div>

          <ul className={styles.noticeList}>
            <li>
              作答时间共<span className={styles.highlight}>20分钟</span>时间结束后，系统将自动跳转到下一个测评环节。
            </li>
            <li>
              请按顺序回答每页问题，<span className={styles.highlightRed}>上一页题目未完成作答</span>，<span className={styles.highlightRed}>将无法点击进入下一页</span>。
            </li>
            <li>
              答题时，<span className={styles.highlightRed}>不要提前点击"下一页"</span>查看后面的内容，<span className={styles.highlightRed}>否则将无法返回上一页</span>。
            </li>
            <li>
              遇到系统故障、死机、死循环等特殊情况时，<span className={styles.highlightRed}>请举手示意老师</span>。
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

          {showError && (
            <div className={styles.errorMessage}>
              请先勾选"我已阅读并理解上述注意事项"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Page01bTaskCover;

