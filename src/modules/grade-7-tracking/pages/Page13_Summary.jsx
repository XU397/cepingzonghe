/**
 * Page13_Summary - 任务总结页面 (页码 13)
 *
 * 功能:
 * - 显示探究任务完成总结
 * - 提供"继续"按钮进入问卷说明页
 */

import { useEffect, useCallback, useState } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import { useDataLogger } from '../hooks/useDataLogger';
import PageLayout from '../components/layout/PageLayout';
import styles from '../styles/ExplorationPages.module.css';
import summaryStyles from '../styles/Page13_Summary.module.css';

const Page13_Summary = () => {
  const {
    logOperation,
    clearOperations,
    currentPageOperations,
    navigateToPage
  } = useTrackingContext();

  const { submitPageData } = useDataLogger();
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
      const pageEndTime = new Date();
      const markObject = {
        pageNumber: '13',
        pageDesc: '任务总结',
        operationList: currentPageOperations.map(op => ({
          targetElement: op.target,
          eventType: op.action,
          value: op.value || '',
          time: formatDateTime(new Date(op.time || op.timestamp))
        })),
        answerList: [],
        beginTime: formatDateTime(pageStartTime),
        endTime: formatDateTime(pageEndTime),
        imgList: []
      };

      const success = await submitPageData(markObject);
      if (success) {
        clearOperations();
        await navigateToPage(0.2); // 跳转到问卷说明页
      }
    } catch (error) {
      console.error('[Page13_Summary] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [currentPageOperations, pageStartTime, logOperation, submitPageData, clearOperations, navigateToPage]);

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
                实验数据显示，小明家28℃环境下蜂蜜的含水量约为19%。通过改变温度，蜂蜜的黏度确实发生了变化。同时，蜂蜜含水量的增加也会导致黏度下降。
              </p>

              <p className={summaryStyles.conclusionText}>
                结合成都夏季平均温度和湿度数据，可以推测小明家蜂蜜变稀的现象，确实可能与成都多雨的高湿度环境有关。
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

// 辅助函数: 格式化日期时间
function formatDateTime(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export default Page13_Summary;
