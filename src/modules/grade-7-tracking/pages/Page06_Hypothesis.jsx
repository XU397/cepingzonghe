/**
 * Page06_Hypothesis - 假设陈述页面
 *
 * FR-013: 显示假设陈述文本,展示成都天气图
 *
 * 页面内容:
 * - 标题: "提出假设"
 * - 假设陈述文本
 * - 成都天气图展示
 * - "下一页"按钮 (无需额外交互即可点击)
 *
 * @component
 */

import { useEffect, useState, useCallback } from 'react';
import { useTrackingContext } from '../context/TrackingProvider.jsx';
import { useDataLogger } from '../hooks/useDataLogger.js';
import { PAGE_MAPPING } from '../config.js';
import Button from '../components/ui/Button.jsx';
import PageLayout from '../components/layout/PageLayout.jsx';
import styles from '../styles/Page06_Hypothesis.module.css';

// 引入天气图 (假设路径)
// import weatherChartImg from '../assets/images/weather-chart.jpg'; // T104: 使用占位符替代

const Page06_Hypothesis = () => {
  const { session, logOperation, clearOperations, buildMarkObject, navigateToPage } = useTrackingContext();
  const { submitPageData } = useDataLogger();
  const [isNavigating, setIsNavigating] = useState(false);

  // 页面进入日志
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'page_06_hypothesis',
      value: '假设陈述页面',
      time: new Date().toISOString()
    });

    return () => {
      // 页面离开日志
      logOperation({
        action: 'page_exit',
        target: 'page_06_hypothesis',
        value: '假设陈述页面',
        time: new Date().toISOString()
      });
    };
  }, [logOperation]);

  // 处理"下一页"点击
  const handleNextPage = useCallback(async () => {
    if (isNavigating) return;

    setIsNavigating(true);

    try {
      logOperation({
        action: 'click_next',
        target: 'next_button',
        value: 'page_06_to_page_07',
        time: new Date().toISOString()
      });

      // 构建并提交MarkObject
      // 从session获取当前页码而不是硬编码
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
  }, [isNavigating, session, logOperation, buildMarkObject, submitPageData, clearOperations, navigateToPage]);

  return (
    <PageLayout showNavigation={true} showTimer={true}>
      <div className={styles.pageContainer}>
        {/* 页面标题 */}
        <div className={styles.header}>
          <h1 className={styles.title}>提出假设</h1>
        </div>

      {/* 主内容区域 */}
      <div className={styles.content}>
        {/* 左侧: 假设陈述文本 */}
        <div className={styles.hypothesisSection}>
          <div className={styles.hypothesisCard}>
            <div className={styles.hypothesisIcon}>💡</div>
            <h2 className={styles.hypothesisTitle}>科学假设</h2>
            <p className={styles.hypothesisText}>
              根据收集的资料和影响因素分析，我们提出以下假设：
            </p>
            <div className={styles.hypothesisStatement}>
              <p className={styles.statementHighlight}>
                环境温度和水分含量是影响蜂蜜黏度变化的关键因素。
              </p>
              <ul className={styles.statementDetails}>
                <li>
                  <strong>温度因素：</strong>
                  环境温度越高，蜂蜜的黏度越低，流动性越好。
                </li>
                <li>
                  <strong>含水量因素：</strong>
                  蜂蜜含水量越高，黏度越低，更容易流动。
                </li>
                <li>
                  <strong>综合影响：</strong>
                  温度和含水量共同作用，影响蜂蜜的黏度特性。
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* 右侧: 成都天气图 */}
        <div className={styles.weatherSection}>
          <div className={styles.weatherCard}>
            <h2 className={styles.weatherTitle}>成都当月天气情况</h2>
            <div className={styles.weatherImageContainer}>
              <img
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3C/svg%3E" // T104: SVG占位符
                alt="成都天气图"
                className={styles.weatherImage}
                onError={(e) => {
                  // 图片加载失败时显示占位符
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className={styles.weatherPlaceholder}>
                <div className={styles.placeholderIcon}>📊</div>
                <p className={styles.placeholderText}>成都天气数据图表</p>
                <p className={styles.placeholderDetails}>
                  显示温度、湿度、降雨量等气象信息
                </p>
              </div>
            </div>
            <div className={styles.weatherDescription}>
              <p>
                成都地处盆地，气候湿润，年平均相对湿度约为82%，
                这可能是影响蜂蜜含水量的重要环境因素。
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 底部按钮区域 */}
      <div className={styles.footer}>
        <Button
          onClick={handleNextPage}
          disabled={isNavigating}
          loading={isNavigating}
          variant="primary"
          ariaLabel="进入下一页"
        >
          下一页
        </Button>
      </div>
      </div>
    </PageLayout>
  );
};

export default Page06_Hypothesis;
