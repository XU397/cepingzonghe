/**
 * Page02_QuestionnaireNotice - 问卷说明页 (页码 13)
 *
 * 功能:
 * - 显示问卷说明标题 (带剪贴板图标)
 * - 蓝色提示框: 恭喜完成实验
 * - 4条带复选标记的说明要点
 * - 感谢语句
 * - 2秒倒计时提示 (黄色背景)
 * - "开始作答"按钮 (倒计时期间禁用)
 * - T099: 启动10分钟问卷计时器
 */

import { useState, useEffect, useCallback } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import { useDataLogger } from '../hooks/useDataLogger';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/ui/Button';
import styles from '../styles/Page02_QuestionnaireNotice.module.css';

const READING_TIME_SECONDS = 2; // 2秒倒计时

const Page02_QuestionnaireNotice = () => {
  const {
    logOperation,
    clearOperations,
    navigateToPage,
    currentPageOperations,
    userContext
  } = useTrackingContext();

  const { submitPageData } = useDataLogger();
  const [pageStartTime] = useState(() => new Date());
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
      setCountdown((prev) => {
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
      // 构建MarkObject
      const pageEndTime = new Date();
      const markObject = {
        pageNumber: '13',
        pageDesc: '问卷说明',
        operationList: currentPageOperations.map((op) => ({
          targetElement: op.target,
          eventType: op.action,
          value: op.value || '',
          time: formatDateTime(new Date(op.time || op.timestamp)),
        })),
        answerList: [
          {
            targetElement: 'questionnaire_notice_read',
            value: '已阅读问卷说明',
          },
        ],
        beginTime: formatDateTime(pageStartTime),
        endTime: formatDateTime(pageEndTime),
        imgList: [],
      };

      // 提交数据
      const success = await submitPageData(markObject);

      if (success) {
        // 清空操作记录
        clearOperations();

        // T099: 启动10分钟问卷计时器
        if (userContext?.helpers?.startTaskTimer) {
          const tenMinutes = 10 * 60; // 秒
          userContext.helpers.startTaskTimer(tenMinutes);
          console.log('[Page02_QuestionnaireNotice] 已启动10分钟问卷计时器');
        } else {
          console.warn('[Page02_QuestionnaireNotice] startTaskTimer helper 不可用');
        }

        // 导航到第一个问卷页面 (页码14)
        await navigateToPage(14);
      }
    } catch (error) {
      console.error('[Page02_QuestionnaireNotice] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [
    canProceed,
    currentPageOperations,
    pageStartTime,
    logOperation,
    submitPageData,
    clearOperations,
    navigateToPage,
    userContext,
  ]);

  return (
    <PageLayout showNavigation={false} showTimer={true}>
      <div className={styles.pageContainer}>
        {/* 标题区域 - 剪贴板图标 + 调查问卷说明 */}
        <div className={styles.titleSection}>
          <div className={styles.clipboardIcon}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
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
                <span className={styles.checkIcon}>✓</span>
                <span className={styles.checkText}>
                  在本问卷中, 回答没有正确或错误之分，你只需要根据自己的真实情况填写即可。如有不明白的地方或不确定如何作答，可以提问。
                </span>
              </li>
              <li className={styles.checkItem}>
                <span className={styles.checkIcon}>✓</span>
                <span className={styles.checkText}>
                  你可以使用屏幕右下角的下一页按钮来回答下一个问题。
                </span>
              </li>
              <li className={styles.checkItem}>
                <span className={styles.checkIcon}>✓</span>
                <span className={styles.checkText}>
                  你和其他人的答案将会合并计算成总数和平均数，我们不会辨别个别参加者。
                </span>
              </li>
              <li className={styles.checkItem}>
                <span className={styles.checkIcon}>✓</span>
                <span className={styles.checkText}>
                  你提供的答案会绝对保密。
                </span>
              </li>
            </ul>

            {/* 感谢语 */}
            <p className={styles.thankYouText}>感谢你的配合！</p>
          </div>

          {/* 倒计时提示 (黄色背景) */}
          {!canProceed && (
            <div className={styles.countdownBox}>
              <p className={styles.countdownText}>
                请仔细阅读说明，<span className={styles.countdownNumber}>{countdown}</span>秒后可开始作答...
              </p>
            </div>
          )}

          {/* 开始作答按钮 */}
          <div className={styles.buttonContainer}>
            <Button
              variant="primary"
              size="large"
              onClick={handleStartClick}
              disabled={!canProceed}
            >
              开始作答
            </Button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

// 辅助函数: 格式化日期时间为 "YYYY-MM-DD HH:mm:ss"
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export default Page02_QuestionnaireNotice;
