import { useState, useCallback } from 'react';

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastError, setLastError] = useState(null);

  /**
   * Handle 401 Unauthorized error - session expired
   * Clears local storage and redirects to login page
   */
  const handleSessionExpired = useCallback(() => {
    console.error('[useDataLogger] 🚫 会话已过期 (401)，执行自动登出');

    // Show user-friendly message
    alert('您的登录会话已过期，请重新登录');

    // Clear all local storage data
    try {
      localStorage.clear();
      console.log('[useDataLogger] 已清除本地存储数据');
    } catch (error) {
      console.error('[useDataLogger] 清除本地存储失败:', error);
    }

    // Redirect to login page
    try {
      window.location.href = '/login';
    } catch (error) {
      console.error('[useDataLogger] 跳转登录页失败:', error);
      // Fallback: try reload
      window.location.reload();
    }
  }, []);

  /**
   * Submit page data to backend API
   *
   * Implements retry logic with exponential backoff:
   * - 3 attempts total (initial + 2 retries)
   * - Delays: 1s, 2s, 4s between attempts
   * - Does NOT retry on 401 (session expired) errors
   *
   * @param {Object} markObject - Page mark data object
   * @param {string} markObject.pageNumber - Page number as string
   * @param {string} markObject.pageDesc - Page description
   * @param {Array} markObject.operationList - List of user operations
   * @param {Array} markObject.answerList - List of user answers
   * @param {string} markObject.beginTime - Start time (YYYY-MM-DD HH:mm:ss)
   * @param {string} markObject.endTime - End time (YYYY-MM-DD HH:mm:ss)
   * @param {Array} [markObject.imgList] - List of images (optional)
   * @returns {Promise<boolean>} True if submission succeeded, false otherwise
   */
  const submitPageData = useCallback(async (markObject) => {
    setIsSubmitting(true);
    setLastError(null);

    // Retry configuration
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s (exponential backoff)

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        console.log(`[useDataLogger] 尝试提交数据 (${attempt + 1}/${MAX_RETRIES})`, {
          pageNumber: markObject.pageNumber,
          pageDesc: markObject.pageDesc,
          operationCount: markObject.operationList?.length || 0,
          answerCount: markObject.answerList?.length || 0
        });

        // Prepare FormData (as per API contract)
        const formData = new FormData();
        formData.append('jsonStr', JSON.stringify(markObject));

        // Submit to backend
        const response = await fetch('/stu/saveHcMark', {
          method: 'POST',
          body: formData,
          // Let browser set Content-Type with boundary for FormData
          credentials: 'same-origin' // Include cookies for session management
        });

        // Check for 401 status BEFORE parsing response
        if (response.status === 401) {
          console.error('[useDataLogger] ❌ 检测到401状态码，会话已过期');
          setIsSubmitting(false);
          handleSessionExpired();
          return false; // Don't retry, user will be redirected
        }

        // Parse response
        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          console.error('[useDataLogger] ❌ JSON解析失败:', parseError);
          throw new Error('服务器返回了无效的响应格式');
        }

        // Check for success
        if (response.ok && result.code === 200) {
          console.log('[useDataLogger] ✅ 数据提交成功:', {
            pageNumber: markObject.pageNumber,
            pageDesc: markObject.pageDesc
          });
          setIsSubmitting(false);
          return true;
        }

        // Handle business-level 401 error (in JSON response)
        if (result.code === 401) {
          console.error('[useDataLogger] ❌ 业务层401错误，会话已失效:', result.msg);
          setIsSubmitting(false);
          handleSessionExpired();
          return false; // Don't retry, user will be redirected
        }

        // Other business errors - log and continue to retry
        const errorMsg = result.msg || `业务错误 ${result.code}`;
        console.warn(`[useDataLogger] ⚠️ 提交失败 (尝试 ${attempt + 1}/${MAX_RETRIES}):`, errorMsg);

        // If this was the last attempt, throw the error
        if (attempt === MAX_RETRIES - 1) {
          throw new Error(errorMsg);
        }

      } catch (error) {
        // Log network or other errors
        console.warn(`[useDataLogger] ⚠️ 网络或其他错误 (尝试 ${attempt + 1}/${MAX_RETRIES}):`, error.message);

        // If this was the last attempt, set error and return false
        if (attempt === MAX_RETRIES - 1) {
          setLastError(error);
          setIsSubmitting(false);
          console.error('[useDataLogger] ❌ 所有重试失败，数据提交失败');
          return false;
        }
      }

      // Wait before retrying (if not the last attempt)
      if (attempt < MAX_RETRIES - 1) {
        const delay = RETRY_DELAYS[attempt];
        console.log(`[useDataLogger] ⏳ 等待 ${delay}ms 后重试...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // This should never be reached, but handle it defensively
    setIsSubmitting(false);
    console.error('[useDataLogger] ❌ 意外退出重试循环');
    return false;
  }, [handleSessionExpired]);

  return {
    submitPageData,
    isSubmitting,
    lastError
  };
}
