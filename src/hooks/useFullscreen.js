import { useState, useEffect, useCallback } from 'react';

/**
 * 全屏管理 Hook
 * 提供全屏请求、退出和状态监听功能
 */
const useFullscreen = () => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 检查当前是否处于全屏状态
  const checkFullscreen = useCallback(() => {
    const fullscreenElement =
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement;

    return !!fullscreenElement;
  }, []);

  // 请求进入全屏
  const enterFullscreen = useCallback(async () => {
    try {
      const element = document.documentElement;

      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }

      console.log('[Fullscreen] 已进入全屏模式');
      return true;
    } catch (error) {
      console.error('[Fullscreen] 进入全屏失败:', error);
      return false;
    }
  }, []);

  // 退出全屏
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      }

      console.log('[Fullscreen] 已退出全屏模式');
      return true;
    } catch (error) {
      console.error('[Fullscreen] 退出全屏失败:', error);
      return false;
    }
  }, []);

  // 切换全屏状态
  const toggleFullscreen = useCallback(async () => {
    if (checkFullscreen()) {
      return await exitFullscreen();
    } else {
      return await enterFullscreen();
    }
  }, [checkFullscreen, enterFullscreen, exitFullscreen]);

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = checkFullscreen();
      setIsFullscreen(isNowFullscreen);

      console.log('[Fullscreen] 全屏状态变化:', isNowFullscreen ? '全屏' : '退出全屏');
    };

    // 添加多种浏览器兼容的事件监听
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    // 初始检查
    handleFullscreenChange();

    // 清理事件监听
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [checkFullscreen]);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
};

export default useFullscreen;
