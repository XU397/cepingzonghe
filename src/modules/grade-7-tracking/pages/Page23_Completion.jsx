/**
 * Page23_Completion - 测评完成页面 (页码 22)
 *
 * 功能:
 * - 显示测评完成祝贺信息
 * - 显示感谢语和鼓励性信息
 * - 无导航按钮(测评结束)
 * - 记录页面访问日志
 *
 * T071-T072
 */

import { useEffect } from 'react';
import { useTrackingContext } from '../context/TrackingContext';
import PageLayout from '../components/layout/PageLayout';
import styles from '../styles/Page23_Completion.module.css';

const Page23_Completion = () => {
  const { logOperation } = useTrackingContext();

  // 记录页面进入
  useEffect(() => {
    logOperation({
      action: 'page_enter',
      target: 'Page_22_Completion',
      value: '测评完成页',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: 'Page_22_Completion',
        value: '测评完成页',
        time: new Date().toISOString(),
      });
    };
  }, [logOperation]);

  return (
    <PageLayout showNavigation={false} showTimer={false}>
      <div className={styles.completionContainer}>
        {/* Success Icon */}
        <div className={styles.iconSection}>
          <div className={styles.successIcon}>
            <svg
              className={styles.checkmark}
              width="120"
              height="120"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="16 8 10 14 8 12"></polyline>
            </svg>
          </div>
        </div>

        {/* Congratulations Message */}
        <div className={styles.messageSection}>
          <h1 className={styles.mainTitle}>测评已完成！</h1>
          <p className={styles.subtitle}>恭喜你成功完成了全部测评任务</p>
        </div>

        {/* Thank You Message */}
        <div className={styles.thanksSection}>
          <div className={styles.thanksCard}>
            <div className={styles.thanksIcon}>
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </div>
            <h2 className={styles.thanksTitle}>感谢您的参与！</h2>
            <p className={styles.thanksText}>
              你的认真参与对科学研究非常重要。通过本次测评,你不仅展示了科学探究能力,
              也为教育研究提供了宝贵的数据支持。
            </p>
          </div>
        </div>

        {/* Encouragement Messages */}
        <div className={styles.encouragementSection}>
          <div className={styles.encouragementCard}>
            <div className={styles.encouragementIcon}>🌟</div>
            <h3 className={styles.encouragementTitle}>继续探索</h3>
            <p className={styles.encouragementText}>
              科学的世界充满奥秘,希望你能保持好奇心,继续探索未知的领域。
            </p>
          </div>

          <div className={styles.encouragementCard}>
            <div className={styles.encouragementIcon}>🔬</div>
            <h3 className={styles.encouragementTitle}>勇于实践</h3>
            <p className={styles.encouragementText}>
              动手实验是学习科学的最佳方式,希望你在未来能积极参与更多实践活动。
            </p>
          </div>

          <div className={styles.encouragementCard}>
            <div className={styles.encouragementIcon}>💡</div>
            <h3 className={styles.encouragementTitle}>善于思考</h3>
            <p className={styles.encouragementText}>
              批判性思维是科学素养的重要组成部分,希望你能保持独立思考的习惯。
            </p>
          </div>
        </div>

        {/* Closing Message */}
        <div className={styles.closingSection}>
          <p className={styles.closingText}>
            请等待老师的进一步指示,不要关闭浏览器窗口。
          </p>
          <div className={styles.divider}></div>
          <p className={styles.smallText}>
            本次测评由[研究机构名称]组织 · 数据将被严格保密
          </p>
        </div>
      </div>
    </PageLayout>
  );
};

export default Page23_Completion;
