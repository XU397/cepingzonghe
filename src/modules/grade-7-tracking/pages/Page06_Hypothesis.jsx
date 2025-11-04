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
import { PAGE_MAPPING } from '../config.js';
import Button from '../components/ui/Button.jsx';
import PageLayout from '../components/layout/PageLayout.jsx';
import styles from '../styles/Page06_Hypothesis.module.css';

// 引入天气图片
import weatherImage from '../../../assets/images/天气图片.png';

const Page06_Hypothesis = () => {
  const { session, logOperation, clearOperations, buildMarkObject, navigateToPage, submitPageData } = useTrackingContext();
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
          <h1 className={styles.title}>蜂蜜变稀</h1>
        </div>

        {/* 主内容区域 - 左右并列布局 */}
        <div className={styles.content}>
          {/* 左侧：文字区域 */}
          <div className={styles.leftPanel}>
            {/* 假设陈述文本 */}
            <div className={styles.hypothesisText}>
              <p>
                蜂蜜黏度受多种因素影响。小明分析认为，蜂蜜变稀可能与其存放于橱柜、暴露在成都高温多雨的环境有关（当月天气见右图）。他进而提出假设：环境温度和水分含量是影响蜂蜜黏度变化的关键因素。
              </p>
            </div>

            {/* 引导文字 */}
            <div className={styles.guideText}>
              <p>
                接下来，请你通过实验，探究小明的假设是否正确吧！
              </p>
            </div>
          </div>

          {/* 右侧：天气图片 */}
          <div className={styles.rightPanel}>
            <div className={styles.weatherImageContainer}>
              <img
                src={weatherImage}
                alt="成都当月天气情况"
                className={styles.weatherImage}
              />
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
