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
import PageLayout from '../components/layout/PageLayout';
import styles from '../styles/Page02_Intro.module.css';
import { PAGE_MAPPING } from '../config.js';

const Page02_Intro = () => {
  const {
    session,
    logOperation,
    clearOperations,
    navigateToPage,
    startTaskTimer,
    buildMarkObject,
    submitPageData
  } = useTrackingContext();
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
      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(String(session.currentPage), pageInfo?.desc || '蜂蜜的奥秘');

      const success = await submitPageData(markObject);
      if (success) {
        clearOperations();
        await navigateToPage(2);
      }
    } catch (error) {
      console.error('[Page02_Intro] 导航失败:', error);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [session, logOperation, submitPageData, clearOperations, navigateToPage, buildMarkObject]);

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        <div className={styles.contentWrapper}>
          {/* 文字内容区域 */}
          <div className={styles.textContent}>
            <h2 className={styles.title}>蜂蜜的奥秘</h2>
            <p className={styles.paragraph}>
              蜂蜜源自大自然的馈赠，富含多种有益成分。成都的中学生小明在超市购买了一瓶蜂蜜，存放一段时间后，他发现蜂蜜的状态似乎发生了变化。
            </p>
            <p className={styles.paragraph}>
              这是怎么回事呢？请你和他一起探索吧！
            </p>
          </div>

          {/* 下一页按钮 */}
          <div className={styles.buttonContainer}>
            <button onClick={handleNextClick} className={styles.nextButton}>
              下一页
            </button>
          </div>
        </div>
      </div>
    </PageLayout>
  );
};

export default Page02_Intro;
