/**
 * Page23_Completion - 问卷完成页面 (页码 22)
 *
 * 功能:
 * - 显示问卷完成信息
 * - 提供返回登录页面按钮
 * - 记录页面访问日志
 */

import { useEffect, useCallback } from 'react';
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
      value: '问卷完成页',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        action: 'page_exit',
        target: 'Page_22_Completion',
        value: '问卷完成页',
        time: new Date().toISOString(),
      });
    };
  }, [logOperation]);

  // 处理返回登录页面
  const handleReturnToLogin = useCallback(() => {
    logOperation({
      action: 'button_click',
      target: 'return_to_login_button',
      value: '返回登录页面',
      time: new Date().toISOString(),
    });

    // 跳转到登录页面
    window.location.href = '/';
  }, [logOperation]);

  return (
    <PageLayout showNavigation={false} showTimer={false}>
      <div className={styles.completionContainer}>
        <div className={styles.completionCard}>
          {/* 标题 */}
          <h1 className={styles.title}>问卷已完成</h1>

          {/* 感谢信息 */}
          <div className={styles.messageBox}>
            <p className={styles.message}>
              感谢你的参与！你的回答已成功提交。祝你学习进步，生活愉快！
            </p>
            <p className={styles.message}>你现在可以返回登录页面了。</p>
          </div>

          {/* 返回按钮 */}
          <button
            className={styles.returnButton}
            onClick={handleReturnToLogin}
            type="button"
          >
            返回登录页面
          </button>
        </div>
      </div>
    </PageLayout>
  );
};

export default Page23_Completion;
