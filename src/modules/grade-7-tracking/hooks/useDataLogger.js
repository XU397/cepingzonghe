import { useCallback } from 'react';
import { usePageSubmission } from '@shared/services/submission/usePageSubmission.js';
import { useTrackingContextSelector } from '../context/TrackingProvider.jsx';

/**
 * Data Logger Hook for Grade 7 Tracking Module
 *
 * Manages data submission to the backend API with retry logic and error handling.
 * Implements the data submission contract specified in CLAUDE.md and quickstart.md.
 *
 * T096 - 实现401错误自动登出
 *
 * @returns {Object} Data logger interface
 * @property {Function} submitPageData - Submit page data with retry logic
 * @property {boolean} isSubmitting - Whether a submission is currently in progress
 * @property {Error|null} lastError - Last error that occurred during submission
 */
export function useDataLogger() {
  // 仅选择必要标量，避免订阅整个 session 对象
  const { batchCode, examNo } = useTrackingContextSelector((store) => ({
    batchCode: store.session?.batchCode,
    examNo: store.session?.examNo,
  }));

  // 从 TrackingProvider 暴露的 userContext 中读取 Flow 上下文（如有）
  const { flowContextGetter, flowContextValue } = useTrackingContextSelector((store) => ({
    flowContextGetter: store.userContext?.getFlowContext,
    flowContextValue: store.userContext?.flowContext || null,
  }));

  const getUserContext = useCallback(() => ({
    batchCode: batchCode || localStorage.getItem('batchCode') || '',
    examNo: examNo || localStorage.getItem('examNo') || '',
  }), [batchCode, examNo]);

  const handleSessionExpired = useCallback((error) => {
    console.error('[useDataLogger] 🚫 会话已过期 (401)，执行自动登出', error);

    try {
      alert('您的登录会话已过期，请重新登录');
    } catch (alertError) {
      console.warn('[useDataLogger] 无法弹出提示', alertError);
    }

    try {
      localStorage.clear();
      sessionStorage.clear();
      console.log('[useDataLogger] 已清除本地存储数据');
    } catch (storageError) {
      console.error('[useDataLogger] 清除本地存储失败:', storageError);
    }

    try {
      window.location.href = '/';
    } catch (redirectError) {
      console.error('[useDataLogger] 重定向失败', redirectError);
    }
  }, []);

  const {
    submit,
    isSubmitting,
    lastError,
    clearError,
  } = usePageSubmission({
    getUserContext,
    getFlowContext: flowContextGetter || (flowContextValue ? (() => flowContextValue) : undefined),
    handleSessionExpired,
    allowProceedOnFailureInDev: true,
    logger: console,
  });

  const submitPageData = useCallback(async (markObject) => {
    clearError();
    return submit({ markOverride: markObject });
  }, [clearError, submit]);

  return {
    submitPageData,
    isSubmitting,
    lastError,
  };
}
