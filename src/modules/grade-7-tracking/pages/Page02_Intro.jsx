import { useEffect, useCallback, useState } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import PageLayout from '../components/layout/PageLayout';
import HoneyBackground from '../components/visualizations/HoneyBackground';
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
    submitPageData,
  } = useTrackingContext();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'Page_01_Intro',
      value: '蜂蜜的奥秘',
      time: new Date().toISOString(),
    });

    startTaskTimer();

    return () => {
      logOperation({
        action: 'page_exit',
        target: 'Page_01_Intro',
        value: '蜂蜜的奥秘',
        time: new Date().toISOString(),
      });
    };
  }, [logOperation, startTaskTimer]);

  const handleNextClick = useCallback(async () => {
    if (isNavigating) return;

    setIsNavigating(true);

    try {
      logOperation({
        action: 'click_next',
        target: 'next_button',
        value: 'page_01_to_page_02',
        time: new Date().toISOString(),
      });

      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(
        String(session.currentPage),
        pageInfo?.desc || '蜂蜜的奥秘'
      );

      const success = await submitPageData(markObject);
      if (success) {
        clearOperations();
        await navigateToPage(2);
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page02_Intro] 导航失败:', error);
      setIsNavigating(false);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [
    session,
    logOperation,
    submitPageData,
    clearOperations,
    navigateToPage,
    buildMarkObject,
    isNavigating,
  ]);

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <HoneyBackground />
      <div className={styles.pageContainer}>
        <div className={styles.glassCard}>
          <h1 className={styles.title}>
            蜂蜜的奥秘
            <span className={styles.titleIcon}>🍯</span>
          </h1>
          <p className={styles.contentText}>
            蜂蜜源自大自然的馈赠，富含多种有益成分。成都的中中学生
            <span className={styles.highlight}>小明</span>
            在超市购买了一瓶蜂蜜，存放一段时间后，他发现蜂蜜的状态似乎发生了变化。
          </p>
          <p className={styles.contentText}>这是怎么回事呢？请你和他一起探索吧！</p>
          <footer className={styles.footer}>
            <button
              className={styles.btnPrimary}
              onClick={handleNextClick}
              disabled={isNavigating}
              aria-label="进入下一页"
            >
              <span>{isNavigating ? '提交中...' : '下一页'}</span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </footer>
        </div>
      </div>
    </PageLayout>
  );
};

export default Page02_Intro;
