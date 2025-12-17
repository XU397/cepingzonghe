import { useEffect, useCallback, useState } from 'react';

/**
 * Hook 处理提交错误，显示错误提示
 * @param {Object} options
 * @param {Error|null} options.lastError - 最近的错误
 * @param {Function} options.onSessionExpired - 会话过期回调
 */
export function useErrorHandler({ lastError, onSessionExpired }) {
  const [errorMessage, setErrorMessage] = useState(null);
  const [showRetry, setShowRetry] = useState(false);

  useEffect(() => {
    if (!lastError) {
      setErrorMessage(null);
      setShowRetry(false);
      return;
    }

    const errorStr = lastError.message || String(lastError);

    // 401 未授权 - 会话过期
    if (errorStr.includes('401') || errorStr.includes('Unauthorized')) {
      console.warn('[g4-experiment] 会话已过期，需要重新登录');
      setErrorMessage('登录已过期，请重新登录');
      if (typeof onSessionExpired === 'function') {
        onSessionExpired();
      }
      return;
    }

    // 网络错误
    if (errorStr.includes('Network') || errorStr.includes('fetch') || errorStr.includes('网络')) {
      setErrorMessage('网络连接失败，请检查网络后重试');
      setShowRetry(true);
      return;
    }

    // 通用错误
    setErrorMessage('提交失败，请重试');
    setShowRetry(true);
  }, [lastError, onSessionExpired]);

  const clearError = useCallback(() => {
    setErrorMessage(null);
    setShowRetry(false);
  }, []);

  return {
    errorMessage,
    showRetry,
    clearError,
  };
}

export default useErrorHandler;
