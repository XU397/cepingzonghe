/**
 * Page02_QuestionnaireNotice - 问卷说明页 (页码 0.2)
 */

import { useState, useEffect, useCallback } from 'react';
import { ClipboardList, Check } from 'lucide-react';
import { useTrackingContext } from '../context/TrackingContext';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/ui/Button';
import styles from '../styles/Page02_QuestionnaireNotice.module.css';

const READING_TIME_SECONDS = 10;

const Page02_QuestionnaireNotice = () => {
  const {
    logOperation,
    collectAnswer,
    clearOperations,
    navigateToPage,
    buildMarkObject,
    submitPageData,
  } = useTrackingContext();

  const [countdown, setCountdown] = useState(READING_TIME_SECONDS);
  const [canProceed, setCanProceed] = useState(false);

  // 记录页面进入
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'Page_13_QuestionnaireNotice',
      value: '问卷说明页',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: 'Page_13_QuestionnaireNotice',
        value: '问卷说明页',
        time: new Date().toISOString(),
      });
    };
  }, [logOperation]);

  // 倒计时逻辑
  useEffect(() => {
    if (countdown <= 0) {
      setCanProceed(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        const newValue = prev - 1;
        if (newValue <= 0) {
          setCanProceed(true);
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // 处理"开始作答"点击
  const handleStartClick = useCallback(async () => {
    if (!canProceed) return;

    logOperation({
      action: 'button_click',
      target: 'start_questionnaire_button',
      value: '开始作答',
      time: new Date().toISOString(),
    });

    try {
      collectAnswer({
        targetElement: 'questionnaire_notice_read',
        value: '已阅读问卷说明',
      });

      const markObject = buildMarkObject('0.2', '问卷说明');

      // 提交数据
      const success = await submitPageData(markObject);

      if (success) {
        // 清空操作记录
        clearOperations();

        // T099: 不在此页启动计时器，将在问卷第一页启动
        // 计时器会在进入问卷第一页时自动启动
        console.log('[Page02_QuestionnaireNotice] 准备进入问卷，计时器将在问卷第一页启动');

        // 导航到第一个问卷页面 (页码14)
        await navigateToPage(14);
      }
    } catch (error) {
      console.error('[Page02_QuestionnaireNotice] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [
    canProceed,
    logOperation,
    collectAnswer,
    buildMarkObject,
    submitPageData,
    clearOperations,
    navigateToPage,
  ]);

  return (
    <PageLayout showNavigation={false} showTimer={false}>
      <div className={styles.pageContainer}>
        {/* 标题区域 - 剪贴板图标 + 调查问卷说明 */}
        <div className={styles.titleSection}>
          <div className={styles.clipboardIcon} aria-hidden="true">
            <ClipboardList strokeWidth={2} />
          </div>
          <h1 className={styles.pageTitle}>调查问卷说明</h1>
        </div>

        {/* 内容容器 */}
        <div className={styles.contentContainer}>
          {/* 蓝色提示框 */}
          <div className={styles.congratsBox}>
            <p className={styles.congratsText}>
              恭喜完成探究任务!接下来,你将进入问卷调查部分<strong>(10分钟)</strong>。
            </p>
          </div>

          {/* 说明列表 - 带复选标记 */}
          <div className={styles.instructionsBox}>
            <ul className={styles.checkList}>
              <li className={styles.checkItem}>
                <span className={styles.checkIcon} aria-hidden="true">
                  <Check />
                </span>
                <span className={styles.checkText}>
                  在本问卷中,
                  回答没有正确或错误之分，你只需要根据自己的真实情况填写即可。如有不明白的地方或不确定如何作答，可以提问。
                </span>
              </li>
              <li className={styles.checkItem}>
                <span className={styles.checkIcon} aria-hidden="true">
                  <Check />
                </span>
                <span className={styles.checkText}>
                  你可以使用屏幕下方的"下一页"按钮来回答下一个问题。
                </span>
              </li>
              <li className={styles.checkItem}>
                <span className={styles.checkIcon} aria-hidden="true">
                  <Check />
                </span>
                <span className={styles.checkText}>
                  你和其他人的答案将会合并计算成总数和平均数，我们不会辨别个别参加者。
                </span>
              </li>
              <li className={styles.checkItem}>
                <span className={styles.checkIcon} aria-hidden="true">
                  <Check />
                </span>
                <span className={styles.checkText}>你提供的答案会绝对保密。</span>
              </li>
            </ul>

            {/* 感谢语 */}
            <p className={styles.thankYouText}>感谢你的配合！</p>
          </div>

          {/* 倒计时提示 (黄色背景) */}
          {!canProceed && (
            <div
              className={styles.countdownBox}
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <p className={styles.countdownText}>
                请仔细阅读说明，<span className={styles.countdownNumber}>{countdown}</span>
                秒后可开始作答...
              </p>
            </div>
          )}

          {/* 开始作答按钮 - 倒计时结束后显示 */}
          {canProceed && (
            <div className={styles.buttonContainer}>
              <Button
                variant="primary"
                size="large"
                onClick={handleStartClick}
                ariaLabel="开始作答问卷"
              >
                开始作答
              </Button>
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Page02_QuestionnaireNotice;
