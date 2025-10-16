/**
 * Page01_Notice - 注意事项页面 (页码 0.1)
 *
 * 功能:
 * - 显示4条注意事项
 * - 提供复选框确认阅读
 * - 40秒倒计时
 * - 复选框勾选或倒计时结束后激活"下一页"按钮
 */

import { useState, useEffect, useCallback } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import { useDataLogger } from '../hooks/useDataLogger';
import PageLayout from '../components/layout/PageLayout';
import styles from '../styles/Page01_Notice.module.css';

const COUNTDOWN_DURATION = 40; // 40秒

const Page01_Notice = () => {
  const {
    logOperation,
    collectAnswer,
    clearOperations,
    buildMarkObject,
    navigateToPage
  } = useTrackingContext();

  const { submitPageData } = useDataLogger();
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const [countdown, setCountdown] = useState(COUNTDOWN_DURATION);
  const [isTimerComplete, setIsTimerComplete] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // 记录页面进入
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'Page_00_1_Precautions',
      value: '注意事项页',
      time: new Date().toISOString()
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: 'Page_00_1_Precautions',
        value: '注意事项页',
        time: new Date().toISOString()
      });
    };
  }, [logOperation]);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown > 0 && !isCheckboxChecked) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (countdown === 0 && !isTimerComplete) {
      setIsTimerComplete(true);
      logOperation({
        action: 'timer_complete',
        target: 'notice_countdown',
        value: '倒计时结束',
        time: new Date().toISOString()
      });
    }
  }, [countdown, isCheckboxChecked, isTimerComplete, logOperation]);

  // 处理复选框变化
  const handleCheckboxChange = useCallback((event) => {
    const checked = event.target.checked;
    setIsCheckboxChecked(checked);

    logOperation({
      action: checked ? 'checkbox_check' : 'checkbox_uncheck',
      target: '注意事项复选框',
      value: checked ? '勾选' : '取消勾选',
      time: new Date().toISOString()
    });
  }, [logOperation]);

  // 格式化时间显示
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 判断是否可以点击下一页
  const canGoNext = isCheckboxChecked || isTimerComplete;

  // 处理"下一页"点击
  const handleNextClick = useCallback(async () => {
    if (!canGoNext || isNavigating) {
      return;
    }

    setIsNavigating(true);

    logOperation({
      action: 'button_click',
      target: '下一页按钮',
      value: '前往情景引入页',
      time: new Date().toISOString()
    });

    try {
      // 收集答案
      collectAnswer({
        targetElement: 'notice_agreement',
        value: isCheckboxChecked ? '已阅读并同意' : '倒计时结束'
      });

      // 构建MarkObject
      const markObject = buildMarkObject('0.1', '注意事项');

      // 提交数据
      const success = await submitPageData(markObject);

      if (success) {
        // 清空操作记录
        clearOperations();

        // 导航到下一页
        await navigateToPage(1);
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page01_Notice] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
      setIsNavigating(false);
    }
  }, [canGoNext, isNavigating, isCheckboxChecked, logOperation, collectAnswer, buildMarkObject, submitPageData, clearOperations, navigateToPage]);

  return (
    <PageLayout showNavigation={false} showTimer={false}>
      <div className={styles.noticeContainer}>
        <h1 className={styles.title}>注意事项</h1>

        <div className={styles.noticeContent}>
          <div className={styles.alertBox}>
            <ul className={styles.noticeList}>
              <li className={styles.noticeItem}>
                作答时间共<strong>50分钟</strong>(其中测评时间40分钟，问卷调查<strong>10分钟</strong>)，时间结束后，系统将自动退出答题界面。
              </li>
              <li className={styles.noticeItem}>
                请按顺序回答每页问题，<strong>上一页题目未完成作答，将无法点击进入下一页。</strong>
              </li>
              <li className={styles.noticeItem}>
                答题时，<strong>不要提前点击"下一页"</strong>查看后面的内容，<strong>否则将无法返回上一页。</strong>
              </li>
              <li className={styles.noticeItem}>
                遇到系统故障、死机、死循环等特殊情况时，<strong>请举手示意老师。</strong>
              </li>
            </ul>
          </div>

          <div className={styles.agreementSection}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={isCheckboxChecked}
                onChange={handleCheckboxChange}
                className={styles.checkbox}
              />
              <span className={styles.checkboxText}>我已阅读并理解以上注意事项</span>
            </label>

            {!isCheckboxChecked && !isTimerComplete && (
              <div className={styles.countdownText}>
                ({formatTime(countdown)})
              </div>
            )}
          </div>

          <button
            onClick={handleNextClick}
            disabled={!canGoNext || isNavigating}
            className={`${styles.nextButton} ${canGoNext ? styles.active : styles.disabled}`}
          >
            {isNavigating ? '跳转中...' : '继续'}
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default Page01_Notice;
