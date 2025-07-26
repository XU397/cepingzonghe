import { useEffect, useRef } from 'react';

/**
 * 浏览器关闭处理的自定义Hook
 * 
 * 功能：
 * 1. 监听页面关闭事件（保持状态持久化）
 * 2. 保留所有认证和状态信息以便恢复
 * 3. 只在特定操作时清除缓存（如问卷完成后点击按钮）
 * 
 * @param {Function} clearFunction - 清除缓存的回调函数（仅用于手动清除）
 */
export const useBrowserCloseHandler = (clearFunction) => {
  const isRefreshRef = useRef(false);
  const beforeUnloadTimeRef = useRef(0);

  useEffect(() => {
    /**
     * 处理页面即将卸载事件
     * 保存会话状态，不清除缓存
     */
    const handleBeforeUnload = (event) => {
      beforeUnloadTimeRef.current = Date.now();
      
      // 检查是否是刷新操作
      const isRefresh = (
        event.persisted || 
        (window.performance && 
         window.performance.navigation && 
         window.performance.navigation.type === window.performance.navigation.TYPE_RELOAD)
      );

      isRefreshRef.current = isRefresh;
      
      console.log('[BrowserCloseHandler] beforeunload触发，保持状态持久化:', {
        isRefresh: isRefreshRef.current,
        persisted: event.persisted,
        navigationType: window.performance?.navigation?.type,
        timestamp: beforeUnloadTimeRef.current
      });

      // 记录会话结束时间到localStorage，用于计算倒计时恢复
      localStorage.setItem('lastSessionEndTime', beforeUnloadTimeRef.current.toString());
      
      // 不再设置清除缓存的标志，保持状态持久化
      console.log('[BrowserCloseHandler] 页面关闭/刷新，保持用户状态和倒计时');
    };

    /**
     * 处理页面卸载事件
     * 保持会话状态持久化
     */
    const handleUnload = () => {
      const now = Date.now();
      const timeDiff = now - beforeUnloadTimeRef.current;
      
      console.log('[BrowserCloseHandler] unload触发，保持状态持久化:', {
        isRefresh: isRefreshRef.current,
        timeDiff,
        beforeUnloadTime: beforeUnloadTimeRef.current
      });

      // 更新最后会话结束时间，用于计算倒计时恢复
      localStorage.setItem('lastSessionEndTime', now.toString());
      
      // 不再根据是否刷新来清除数据，始终保持状态
      console.log('[BrowserCloseHandler] 保持用户状态和倒计时数据，下次打开时继续');
      
      // 移除任何可能存在的清除标志
      localStorage.removeItem('shouldClearOnNextSession');
    };

    /**
     * 处理页面可见性变化
     * 用于检测页面是否被隐藏（可能是关闭标签页）
     */
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // 页面被隐藏，可能是用户切换标签页或关闭标签页
        const now = Date.now();
        sessionStorage.setItem('pageHiddenTime', now.toString());
        
        console.log('[BrowserCloseHandler] 页面被隐藏，时间:', now);
      } else if (document.visibilityState === 'visible') {
        // 页面重新可见
        const hiddenTime = sessionStorage.getItem('pageHiddenTime');
        if (hiddenTime) {
          const hiddenDuration = Date.now() - parseInt(hiddenTime);
          console.log('[BrowserCloseHandler] 页面重新可见，隐藏时长:', hiddenDuration);
          sessionStorage.removeItem('pageHiddenTime');
        }
      }
    };

    // 添加事件监听器
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 新会话检测逻辑（现在用于状态恢复而非清除）
    const checkNewSession = () => {
      const now = Date.now();
      const lastSessionEndTime = localStorage.getItem('lastSessionEndTime');
      const sessionStartTime = sessionStorage.getItem('sessionStartTime');
      
      console.log('[BrowserCloseHandler] 会话检查（保持状态模式）:', {
        hasSessionStart: !!sessionStartTime,
        lastSessionEndTime: lastSessionEndTime ? new Date(parseInt(lastSessionEndTime)).toLocaleString() : null,
        currentTime: new Date(now).toLocaleString()
      });
      
      // 如果sessionStorage中没有sessionStartTime，说明是新会话
      if (!sessionStartTime) {
        console.log('[BrowserCloseHandler] 🆕 检测到新会话，保持用户状态以便恢复');
        sessionStorage.setItem('sessionStartTime', now.toString());
        
        // 不再设置清除标志，而是标记为状态恢复会话
        console.log('[BrowserCloseHandler] 💾 新会话将恢复之前的用户状态和倒计时');
      } else {
        console.log('[BrowserCloseHandler] 🔄 继续现有会话');
      }
    };
    
    // 执行新会话检测
    checkNewSession();
    
    // 检查旧的localStorage标志（向后兼容）
    const oldCacheCleared = localStorage.getItem('cacheCleared');
    if (oldCacheCleared === 'true') {
      console.log('[BrowserCloseHandler] 检测到旧的缓存清除标志，清除中...');
      localStorage.removeItem('cacheCleared');
      localStorage.removeItem('lastClearTime');
    }

    // 清理函数
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearFunction]);

  /**
   * 手动清除缓存的方法
   * 可以在组件中调用，用于测试或其他场景
   */
  const clearCache = () => {
    console.log('[BrowserCloseHandler] 手动清除缓存...');
    if (typeof clearFunction === 'function') {
      clearFunction();
    }
  };

  return { clearCache };
};

export default useBrowserCloseHandler; 