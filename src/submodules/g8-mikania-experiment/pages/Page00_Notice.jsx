/**
 * Page 00 - 注意事项页
 *
 * 38秒倒计时后可勾选确认，勾选后可点击下一页
 */

import { useEffect, useState } from 'react';
import { useMikaniaExperiment } from '../Component';
import styles from '../styles/Page00_Notice.module.css';

function Page00Notice() {
  const {
    state,
    tickNoticeCountdown,
    confirmNotice,
    logOperation,
    navigateToNextPage,
    validateCurrentPage,
    isSubmitting,
  } = useMikaniaExperiment();

  const [isNavigating, setIsNavigating] = useState(false);

  const { noticeCountdown, noticeConfirmed } = state;

  // 记录页面进入/退出
  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: 'page_00_notice',
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: 'page_exit',
        value: 'page_00_notice',
      });
    };
  }, [logOperation]);

  // 倒计时逻辑
  useEffect(() => {
    if (noticeCountdown <= 0) return;

    const timer = setInterval(() => {
      tickNoticeCountdown();
    }, 1000);

    return () => clearInterval(timer);
  }, [noticeCountdown, tickNoticeCountdown]);

  // 处理复选框变更
  const handleCheckboxChange = (e) => {
    const checked = e.target.checked;
    confirmNotice(checked);

    // 记录操作 - 使用标准事件类型
    logOperation({
      targetElement: 'P1_注意事项确认',
      eventType: checked ? 'checkbox_check' : 'checkbox_uncheck',
      value: checked ? 'checked' : 'unchecked',
    });
  };

  const isCheckboxDisabled = noticeCountdown > 0;

  // 处理下一页点击
  const handleNextClick = async () => {
    if (!validateCurrentPage()) {
      logOperation({
        targetElement: '下一页按钮',
        eventType: 'click_blocked',
        value: '验证未通过',
      });
      console.warn('[Page00_Notice] 验证未通过，无法继续');
      return;
    }

    setIsNavigating(true);
    logOperation({
      targetElement: '下一页按钮',
      eventType: 'click',
      value: 'page_00_notice',
    });

    try {
      console.log('[Page00_Notice] 调用 navigateToNextPage...');
      await navigateToNextPage();
      console.log('[Page00_Notice] navigateToNextPage 完成');
    } catch (error) {
      console.error('[Page00_Notice] navigateToNextPage 出错:', error);
    } finally {
      setIsNavigating(false);
    }
  };

  const canProceed = noticeCountdown <= 0 && noticeConfirmed;
  const isButtonDisabled = !canProceed || isNavigating || isSubmitting;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>薇甘菊防治实验</h1>
      <div className={styles.titleUnderline}></div>

      {/* 注意事项卡片 */}
      <div className={styles.noticeCard}>
        <span className={styles.readLabel}>请仔细阅读</span>
        <ul className={styles.noticeList}>
          <li>作答时间共<span className={styles.highlight}>20分钟</span>，时间结束后，系统将自动跳转到下一个测评环节。</li>
          <li>请按顺序回答每页问题，<span className={styles.underline}>上一页题目未完成作答</span>，<span className={styles.underline}>将无法点击进入下一页</span>。</li>
          <li>答题时，<span className={styles.underline}>不要提前点击"下一页"</span>查看后面的内容，<span className={styles.underline}>否则将无法返回上一页</span>。</li>
          <li>遇到系统故障、死机、死循环等特殊情况时，<span className={styles.underline}>请举手示意老师</span>。</li>
        </ul>
      </div>

      {/* 复选框卡片 */}
      <div className={styles.checkboxCard}>
        <div className={styles.checkboxContainer}>
          <label className={`${styles.checkboxLabel} ${isCheckboxDisabled ? styles.disabled : ''}`}>
            <input
              type="checkbox"
              checked={noticeConfirmed}
              onChange={handleCheckboxChange}
              disabled={isCheckboxDisabled}
              className={styles.checkbox}
            />
            <span className={styles.checkboxText}>我已阅读并理解上述注意事项</span>
          </label>
        </div>

        <p className={styles.countdownText}>
          {noticeCountdown > 0
            ? `请仔细阅读注意事项，${noticeCountdown}秒后可勾选确认...`
            : '请勾选确认后点击下一页。'
          }
        </p>
      </div>

      {/* 下一页按钮 */}
      <div className={styles.buttonContainer}>
        <button
          type="button"
          className={`${styles.nextButton} ${isButtonDisabled ? styles.disabled : ''}`}
          onClick={handleNextClick}
          disabled={isButtonDisabled}
        >
          {isNavigating || isSubmitting ? '提交中...' : '继续'}
        </button>
      </div>
    </div>
  );
}

export default Page00Notice;
