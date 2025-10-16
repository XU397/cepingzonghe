/**
 * Page02_Intro - 情景引入页面 (页码 1)
 *
 * 功能:
 * - 显示背景故事介绍
 * - 显示蜂蜜图片
 * - 提供"下一页"按钮
 * - 启动40分钟探究任务计时器
 */

import { useEffect, useCallback, useState } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import { useDataLogger } from '../hooks/useDataLogger';
import PageLayout from '../components/layout/PageLayout';
import styles from '../styles/ExplorationPages.module.css';

const Page02_Intro = () => {
  const {
    logOperation,
    clearOperations,
    currentPageOperations,
    navigateToPage,
    startTaskTimer
  } = useTrackingContext();

  const { submitPageData } = useDataLogger();
  const [pageStartTime] = useState(() => new Date());

  // 记录页面进入/退出 + 启动40分钟计时器
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'Page_01_Intro',
      value: '蜂蜜的奥秘',
      time: new Date().toISOString()
    });

    // T097: 启动40分钟探究任务计时器
    startTaskTimer();
    console.log('[Page02_Intro] 已启动40分钟探究任务计时器');

    return () => {
      logOperation({
        action: 'page_exit',
        target: 'Page_01_Intro',
        value: '蜂蜜的奥秘',
        time: new Date().toISOString()
      });
    };
  }, [logOperation, startTaskTimer]);

  // 处理"下一页"点击
  const handleNextClick = useCallback(async () => {
    logOperation({
      action: 'button_click',
      target: 'next_page_button',
      value: '下一页',
      time: new Date().toISOString()
    });

    try {
      const pageEndTime = new Date();
      const markObject = {
        pageNumber: '1',
        pageDesc: '蜂蜜的奥秘',
        operationList: currentPageOperations.map(op => ({
          targetElement: op.target,
          eventType: op.action,
          value: op.value || '',
          time: op.time || new Date(op.timestamp).toISOString()
        })),
        answerList: [],
        beginTime: formatDateTime(pageStartTime),
        endTime: formatDateTime(pageEndTime),
        imgList: []
      };

      const success = await submitPageData(markObject);
      if (success) {
        clearOperations();
        await navigateToPage(2);
      }
    } catch (error) {
      console.error('[Page02_Intro] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [currentPageOperations, pageStartTime, logOperation, submitPageData, clearOperations, navigateToPage]);

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        <div className={styles.splitLayout}>
          {/* 左侧: 背景介绍 */}
          <div className={styles.leftPanel}>
            <h2 className={styles.sectionTitle}>蜂蜜的奥秘</h2>
            <div className={styles.textContent}>
              <p className={styles.paragraph}>
                蜂蜜源自大自然的馈赠，富含多种有益成分。成都的中学生小明在超市购买了一瓶蜂蜜，存放一段时间后，他发现蜂蜜的状态似乎发生了变化。
              </p>
              <p className={styles.paragraph}>
                这是怎么回事呢？请你和他一起探索吧！
              </p>
            </div>
          </div>

          {/* 右侧: 蜂蜜图片 */}
          <div className={styles.rightPanel}>
            <div className={styles.imageContainer}>
              <img
                src="/assets/grade-7-tracking/honey-jar.jpg"
                alt="蜂蜜罐"
                className={styles.mainImage}
                onError={(e) => {
                  // 图片加载失败时显示占位符
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle" font-size="20"%3E蜂蜜图片%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
          </div>
        </div>

        {/* 下一页按钮 */}
        <div className={styles.buttonContainer}>
          <button onClick={handleNextClick} className={styles.nextButton}>
            下一页
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

export default Page02_Intro;
