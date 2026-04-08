import { useEffect, useState, useCallback } from 'react';
import { useTrackingContext } from '../context/TrackingProvider.jsx';
import { PAGE_MAPPING } from '../config.js';
import PageLayout from '../components/layout/PageLayout.jsx';
import WeatherCalendar from '../components/visualizations/WeatherCalendar.jsx';
import styles from '../styles/Page06_Hypothesis.module.css';

const Page06_Hypothesis = () => {
  const {
    session,
    logOperation,
    clearOperations,
    buildMarkObject,
    navigateToPage,
    submitPageData,
  } = useTrackingContext();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleMouseEnter = useCallback(
    (blockId, blockName) => {
      logOperation({
        action: 'hover_enter',
        target: blockId,
        value: blockName,
        time: new Date().toISOString(),
      });
    },
    [logOperation]
  );

  const handleMouseLeave = useCallback(
    (blockId, blockName) => {
      logOperation({
        action: 'hover_leave',
        target: blockId,
        value: blockName,
        time: new Date().toISOString(),
      });
    },
    [logOperation]
  );

  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'page_06_hypothesis',
      value: '假设陈述页面',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: 'page_06_hypothesis',
        value: '假设陈述页面',
        time: new Date().toISOString(),
      });
    };
  }, [logOperation]);

  const handleNextPage = useCallback(async () => {
    if (isNavigating) return;

    setIsNavigating(true);

    try {
      logOperation({
        action: 'click_next',
        target: 'next_button',
        value: 'page_06_to_page_07',
        time: new Date().toISOString(),
      });

      const pageInfo = PAGE_MAPPING[session.currentPage];
      const markObject = buildMarkObject(String(session.currentPage), pageInfo?.desc || '假设陈述');
      const success = await submitPageData(markObject);

      if (success) {
        clearOperations();
        await navigateToPage(5);
      } else {
        throw new Error('数据提交失败');
      }
    } catch (error) {
      console.error('[Page06_Hypothesis] 导航失败:', error);
      setIsNavigating(false);
      alert(error.message || '页面跳转失败，请重试');
    }
  }, [
    isNavigating,
    session,
    logOperation,
    buildMarkObject,
    submitPageData,
    clearOperations,
    navigateToPage,
  ]);

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        <header className={styles.header}>
          <div className={styles.badge}>4</div>
          <div className={styles.headerContent}>
            <h1 className={styles.title}>蜂蜜变稀：提出假设</h1>
          </div>
        </header>

        <div className={styles.content}>
          <div className={styles.leftPanel}>
            <div
              className={styles.hypothesisText}
              onMouseEnter={() => handleMouseEnter('hypothesis_text_1', '假设陈述文本')}
              onMouseLeave={() => handleMouseLeave('hypothesis_text_1', '假设陈述文本')}
            >
              <p>
                蜂蜜黏度受多种因素影响。小明分析认为，蜂蜜变稀可能与其存放于橱柜、暴露在成都高温多雨的环境有关（当月天气见右图）。
                <strong>他进而提出假设：</strong>
              </p>
            </div>

            <div
              className={styles.guideText}
              onMouseEnter={() => handleMouseEnter('guide_text', '引导文字')}
              onMouseLeave={() => handleMouseLeave('guide_text', '引导文字')}
            >
              <p>"环境温度和水分含量是影响蜂蜜黏度变化的关键因素。"</p>
            </div>
            <div
              className={styles.hypothesisText}
              onMouseEnter={() => handleMouseEnter('hypothesis_text_2', '探究引导文本')}
              onMouseLeave={() => handleMouseLeave('hypothesis_text_2', '探究引导文本')}
            >
              <p>接下来，请你通过实验，探究小明的假设是否正确吧！</p>
            </div>
          </div>

          <div className={styles.rightPanel}>
            <div
              className={styles.weatherCalendarContainer}
              onMouseEnter={() => handleMouseEnter('weather_calendar', '天气日历')}
              onMouseLeave={() => handleMouseLeave('weather_calendar', '天气日历')}
            >
              <WeatherCalendar />
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <button
            className={styles.btnPrimary}
            onClick={handleNextPage}
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
    </PageLayout>
  );
};

export default Page06_Hypothesis;
