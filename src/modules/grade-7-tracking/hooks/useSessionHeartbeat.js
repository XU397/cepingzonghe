import { useEffect, useRef } from 'react';

/**
 * Session Heartbeat Custom Hook
 *
 * Implements periodic session validation to detect multi-device login scenarios.
 * Uses the Page Visibility API to pause heartbeat when the page is hidden,
 * optimizing resource usage.
 *
 * T096 - 实现401错误自动登出
 *
 * @param {string} sessionId - Session UUID identifier
 * @param {string} studentCode - Student code identifier
 * @param {Function} onSessionExpired - Callback function invoked when session expires (401 response)
 *
 * @example
 * ```javascript
 * const handleSessionExpired = () => {
 *   // Show modal: "Your account has been logged in on another device"
 *   // Redirect to login page
 * };
 *
 * useSessionHeartbeat(sessionId, studentCode, handleSessionExpired);
 * ```
 */
export function useSessionHeartbeat(sessionId, studentCode, onSessionExpired) {
  const intervalRef = useRef(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    // Guard: skip if required parameters are missing
    if (!sessionId || !studentCode) {
      console.warn('[useSessionHeartbeat] Missing required parameters:', { sessionId, studentCode });
      return;
    }

    console.log('[useSessionHeartbeat] Initializing heartbeat...', {
      sessionId: sessionId.substring(0, 8) + '...',
      studentCode,
    });

    /**
     * Handle 401 Unauthorized error - session expired
     * Clears local storage and redirects to login page
     */
    const handleSessionExpired = () => {
      console.error('[useSessionHeartbeat] 🚫 会话已过期 (401)，执行自动登出');

      // Stop heartbeat immediately
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Show user-friendly message
      alert('您的登录会话已过期，请重新登录');

      // Clear all local storage data
      try {
        localStorage.clear();
        console.log('[useSessionHeartbeat] 已清除本地存储数据');
      } catch (error) {
        console.error('[useSessionHeartbeat] 清除本地存储失败:', error);
      }

      // Invoke custom callback (if provided)
      if (onSessionExpired) {
        onSessionExpired();
      }

      // Redirect to login page
      try {
        window.location.href = '/login';
      } catch (error) {
        console.error('[useSessionHeartbeat] 跳转登录页失败:', error);
        // Fallback: try reload
        window.location.reload();
      }
    };

    /**
     * Check session validity by calling backend API
     */
    const checkSession = async () => {
      // Prevent concurrent checks
      if (isCheckingRef.current) {
        console.log('[useSessionHeartbeat] Check already in progress, skipping...');
        return;
      }

      isCheckingRef.current = true;

      try {
        console.log('[useSessionHeartbeat] Checking session validity...', {
          timestamp: new Date().toISOString(),
        });

        const response = await fetch(
          `/stu/checkSession?sessionId=${encodeURIComponent(sessionId)}&studentCode=${encodeURIComponent(studentCode)}`,
          {
            method: 'GET',
            credentials: 'include', // Include session cookies
          }
        );

        // Check for 401 status BEFORE parsing response
        if (response.status === 401) {
          console.error('[useSessionHeartbeat] ❌ 检测到401状态码，会话已过期');
          handleSessionExpired();
          return;
        }

        const result = await response.json();

        console.log('[useSessionHeartbeat] Server response:', {
          status: response.status,
          code: result.code,
          msg: result.msg,
        });

        // Session expired (business-level 401 error)
        if (result.code === 401) {
          console.error('[useSessionHeartbeat] ❌ 业务层401错误，会话已失效:', result.msg);
          handleSessionExpired();
        } else if (result.code === 200) {
          console.log('[useSessionHeartbeat] ✅ Session valid');
        } else {
          console.warn('[useSessionHeartbeat] ⚠️ Unexpected response code:', result.code);
        }

      } catch (error) {
        // Network errors should NOT trigger session expiration
        // (Could be temporary network issues, server downtime, etc.)
        console.error('[useSessionHeartbeat] ❌ Network error during heartbeat check:', error.message);
        console.log('[useSessionHeartbeat] Continuing heartbeat despite error...');
      } finally {
        isCheckingRef.current = false;
      }
    };

    /**
     * Handle page visibility changes
     * Pause heartbeat when page is hidden, resume when visible
     */
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page hidden: pause heartbeat to save resources
        if (intervalRef.current) {
          console.log('[useSessionHeartbeat] ⏸️ Page hidden, pausing heartbeat');
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // Page visible: resume heartbeat
        if (!intervalRef.current) {
          console.log('[useSessionHeartbeat] ▶️ Page visible, resuming heartbeat');

          // Immediately check session on visibility restore
          checkSession();

          // Restart periodic checks
          intervalRef.current = setInterval(checkSession, 30000); // 30 seconds
          console.log('[useSessionHeartbeat] 💓 Heartbeat interval started (30s)');
        }
      }
    };

    // Register visibility change listener
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Start heartbeat if page is currently visible
    if (!document.hidden) {
      intervalRef.current = setInterval(checkSession, 30000); // 30 seconds
      console.log('[useSessionHeartbeat] 💓 Heartbeat started (30s interval)');
    } else {
      console.log('[useSessionHeartbeat] Page initially hidden, heartbeat will start when visible');
    }

    // Cleanup function
    return () => {
      console.log('[useSessionHeartbeat] 💔 Cleaning up heartbeat...');

      // Clear interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }

      // Remove event listener
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      console.log('[useSessionHeartbeat] ✅ Cleanup complete');
    };
  }, [sessionId, studentCode, onSessionExpired]);
}
