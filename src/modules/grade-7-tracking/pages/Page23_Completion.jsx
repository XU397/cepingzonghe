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
  const { logOperation, userContext } = useTrackingContext();

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

    try {
      // 优先使用上层提供的登出能力，确保清理状态与缓存
      if (userContext && typeof userContext.handleLogout === 'function') {
        userContext.handleLogout();
        return; // App 会自动渲染登录页
      }

      // 兜底：手动清理关键缓存并刷新
      const keysToRemove = [
        'isAuthenticated',
        'currentUser',
        'batchCode',
        'examNo',
        'pageNum',
        'isTaskFinished',
        'taskStartTime',
        'remainingTime',
        'currentPageId',
        'isQuestionnaireCompleted',
        'questionnaireAnswers',
        'isQuestionnaireStarted',
        'questionnaireStartTime',
        'questionnaireRemainingTime',
        'moduleUrl',
        'lastUserId',
        'lastSessionEndTime',
        'shouldClearOnNextSession',
        'cacheCleared',
        'lastClearTime',
        // 追踪测评（grade-7-tracking）本地持久化：确保再次进入时从首屏开始
        'tracking_sessionId',
        'tracking_session',
        'tracking_experimentTrials',
        'tracking_chartData',
        'tracking_textResponses',
        'tracking_questionnaireAnswers'
      ];
      keysToRemove.forEach(k => localStorage.removeItem(k));
      window.location.href = '/';
    } catch (e) {
      // 最终兜底：强制刷新
      window.location.reload();
    }
  }, [logOperation, userContext]);

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
