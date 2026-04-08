/**
 * Page 00 - 注意事项页
 *
 * 38秒倒计时后可勾选确认，勾选后可点击下一页
 */

import { useEffect, useState } from 'react';
import { EventTypes } from '@shared/services/submission/eventTypes';
import { isReservedElement } from '@shared/services/submission/submoduleAdapter';
import { useMikaniaExperiment } from '../Component';
import styles from '../styles/Page00_Notice.module.css';

function Page00Notice() {
  const {
    state,
    tickNoticeCountdown,
    confirmNotice,
    logOperation,
    validateCurrentPage,
    getCurrentMissingFields,
    targetPrefix,
    taskDurationMinutes,
  } = useMikaniaExperiment();

  const { noticeCountdown, noticeConfirmed } = state;
  const [showError, setShowError] = useState(false);

  const pageTargetPrefix = targetPrefix || '';
  const checkboxTarget = `${pageTargetPrefix}注意事项确认`;
  const nextButtonTarget = isReservedElement('下一页按钮') ? '下一页按钮' : `${pageTargetPrefix}下一页按钮`;

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

    // 清除错误提示
    if (checked && showError) {
      setShowError(false);
    }

    logOperation({
      targetElement: checkboxTarget,
      eventType: checked ? EventTypes.CHECKBOX_CHECK : EventTypes.CHECKBOX_UNCHECK,
      value: checked ? 'checked' : 'unchecked',
    });
  };

  const isCheckboxDisabled = noticeCountdown > 0;

  // 处理下一页点击（由 Frame 调用）
  const handleNextClick = () => {
    // 验证必填项
    if (!validateCurrentPage()) {
      const missing = getCurrentMissingFields();

      // 显示错误提示
      setShowError(true);

      // 记录阻断事件
      logOperation({
        targetElement: nextButtonTarget,
        eventType: EventTypes.CLICK_BLOCKED,
        value: JSON.stringify({
          reason: 'validation_failed',
          missing,
        }),
      });
      return;
    }

    // 清除错误提示
    setShowError(false);

    // 记录成功点击
    logOperation({
      targetElement: nextButtonTarget,
      eventType: EventTypes.NEXT_CLICK,
      value: 'navigate_to_intro',
    });

    // 触发 Frame 的下一页按钮
    const frameNextButton = document.querySelector('[data-testid="frame-next-button"]');
    if (frameNextButton) {
      frameNextButton.click();
    }
  };

  return (
    <div className={styles.container} data-testid="page-notice">
      <div className={styles.contentWrapper}>
        {/* 标题区域 */}
        <div className={styles.titleSection}>
          <h1 className={styles.title}>薇甘菊防治科学探究</h1>
          <div className={styles.titleUnderline}></div>
        </div>

        {/* 注意事项卡片 */}
        <div className={styles.noticeCard}>
          <span className={styles.readLabel}>请仔细阅读</span>
          <ul className={styles.noticeList}>
            <li>本次测试一共两个任务，作答时间共<span className={styles.highlight}>{taskDurationMinutes}分钟</span>，当前是第一个任务，大约需要<span className={styles.highlight}>20分钟</span>完成，请注意时间分配。</li>
            <li>请按顺序回答每页问题，上一页题目未完成作答，将无法点击进入下一页。</li>
            <li style={{ fontSize: '20px' }}>答题时，<span className={styles.underline}>不要提前点击&quot;下一页&quot;</span>查看后面的内容，<span className={styles.underline}>否则将无法返回上一页</span>。</li>
            <li>遇到系统故障、死机、死循环等特殊情况时，请举手示意老师。</li>
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
                data-testid="confirm-checkbox"
              />
              <span className={styles.checkboxText}>我已阅读并理解上述注意事项</span>
            </label>
          </div>

          {noticeCountdown > 0 && (
            <p className={styles.countdownText}>
              请仔细阅读注意事项，{noticeCountdown}秒后可勾选确认...
            </p>
          )}

          {showError && (
            <p className={styles.errorText}>
              {noticeCountdown > 0
                ? '请等待倒计时结束后勾选确认'
                : '请勾选：“我已阅读并理解上述注意事项“后继续'}
            </p>
          )}
        </div>

        {/* 隐藏的下一页按钮，用于 Frame 回调 */}
        <button
          type="button"
          style={{
            position: 'absolute',
            width: 1,
            height: 1,
            padding: 0,
            margin: 0,
            opacity: 0,
            pointerEvents: 'none',
            border: 0,
          }}
          tabIndex={-1}
          onClick={handleNextClick}
          data-testid="next-button"
          aria-hidden="true"
        >
          继续
        </button>
      </div>
    </div>
  );
}

export default Page00Notice;
