/**
 * Page13_Summary - 任务总结页面 (页码 13)
 *
 * 功能:
 * - 显示探究任务完成总结
 * - 提供"继续"按钮进入问卷说明页
 */

import { useEffect, useCallback, useState } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import PageLayout from '../components/layout/PageLayout';
import styles from '../styles/ExplorationPages.module.css';
import summaryStyles from '../styles/Page13_Summary.module.css';
import { PAGE_MAPPING } from '../config.js';

const Page13_Summary = () => {
  const {
    session,
    logOperation,
    clearOperations,
    navigateToPage,
    buildMarkObject,
    submitPageData
  } = useTrackingContext();

  const [pageStartTime] = useState(() => new Date());

  // 记录页面进入/退出
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'Page_13_Summary',
      value: '任务总结',
      time: new Date().toISOString()
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: 'Page_13_Summary',
        value: '任务总结',
        time: new Date().toISOString()
      });
    };
  }, [logOperation]);

  // 处理"继续"点击
  const handleContinueClick = useCallback(async () => {
    logOperation({
      action: 'button_click',
      target: 'continue_button',
      value: '继续',
      time: new Date().toISOString()
    });

    try {
      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(String(session.currentPage), pageInfo?.desc || '任务总结');

      const success = await submitPageData(markObject);
      if (success) {
        clearOperations();
        await navigateToPage(0.2); // 跳转到问卷说明页
      }
    } catch (error) {
      console.error('[Page13_Summary] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [session, logOperation, submitPageData, clearOperations, navigateToPage, buildMarkObject]);

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        <div className={summaryStyles.summaryContainer}>
          <div className={summaryStyles.summaryCard}>
            <h1 className={summaryStyles.title}>任务完成</h1>

            <div className={summaryStyles.content}>
              <div className={summaryStyles.icon}>
                <svg viewBox="0 0 100 100" className={summaryStyles.checkIcon}>
                  <circle cx="50" cy="50" r="45" fill="#4caf50" />
                  <path
                    d="M30 50 L45 65 L70 35"
                    stroke="white"
                    strokeWidth="8"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <p className={summaryStyles.conclusionText}>
              根据实验数据，结合小明家蜂蜜常储于 28℃的情况，推断变稀后的蜂蜜含水量约为 19%，但所购蜂蜜原始成分表标注的含水量为 15%。由此，小明得出结论：蜂蜜变稀是因含水量增加，这可能确实与成都降水多，湿度高有关。
              </p>

              <div className={summaryStyles.congratsBox}>
                <p className={summaryStyles.congratsText}>
                  恭喜你完成了蜂蜜黏度探究任务！
                </p>
                <p className={summaryStyles.nextStepText}>
                  接下来，请继续完成问卷调查部分。
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 继续按钮 */}
        <div className={styles.buttonContainer}>
          <button onClick={handleContinueClick} className={summaryStyles.continueButton}>
            继续
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

// 统一改为由 Provider 进行时间与结构标准化

export default Page13_Summary;
