/**
 * Page02_QuestionnaireNotice - 问卷说明页 (页码 13)
 *
 * 功能:
 * - 显示问卷说明标题
 * - 恭喜完成实验的语句
 * - 4条说明要点
 * - "开始作答"按钮
 * - T099: 启动10分钟问卷计时器
 */

import { useState, useEffect, useCallback } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import { useDataLogger } from '../hooks/useDataLogger';
import PageLayout from '../components/layout/PageLayout';
import Button from '../components/ui/Button';
import styles from '../styles/Page02_QuestionnaireNotice.module.css';

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

  // 处理"开始作答"点击
  const handleStartClick = useCallback(async () => {
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
          time: op.time || new Date(op.timestamp).toISOString(),
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
      <div className={styles.noticeContainer}>
        <div className={styles.congratsSection}>
          <div className={styles.congratsIcon}>
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h1 className={styles.congratsTitle}>恭喜你完成了实验部分!</h1>
          <p className={styles.congratsSubtitle}>接下来请完成以下问卷调查</p>
        </div>

        <div className={styles.instructionsSection}>
          <h2 className={styles.instructionsTitle}>问卷说明</h2>

          <ul className={styles.instructionsList}>
            <li className={styles.instructionItem}>
              <span className={styles.itemNumber}>1</span>
              <span className={styles.itemText}>
                本问卷共有<strong>27道题目</strong>，分为<strong>8个页面</strong>，预计需要<strong>10-15分钟</strong>完成。
              </span>
            </li>
            <li className={styles.instructionItem}>
              <span className={styles.itemNumber}>2</span>
              <span className={styles.itemText}>
                所有题目均为<strong>必答题</strong>，请根据你的真实想法选择最符合的选项。
              </span>
            </li>
            <li className={styles.instructionItem}>
              <span className={styles.itemNumber}>3</span>
              <span className={styles.itemText}>
                每个页面完成所有问题后，才能点击&quot;下一页&quot;按钮继续作答。
              </span>
            </li>
            <li className={styles.instructionItem}>
              <span className={styles.itemNumber}>4</span>
              <span className={styles.itemText}>
                问卷没有对错之分，请<strong>如实填写</strong>，你的答案将被严格保密。
              </span>
            </li>
          </ul>
        </div>

        <div className={styles.buttonContainer}>
          <Button variant="primary" size="large" onClick={handleStartClick}>
            开始作答
          </Button>
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
