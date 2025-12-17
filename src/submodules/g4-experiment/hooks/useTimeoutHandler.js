import { useEffect, useRef, useCallback } from 'react';
import { useG4Context } from '../context/G4Context';

const TIMEOUT_PLACEHOLDER = '超时未回答';

/**
 * Hook 监听全局计时器超时，自动提交当前页并跳转到完成页
 * @param {Object} options
 * @param {Function} options.handleNextPage - 导航函数
 * @param {Function} options.collectAnswer - 收集答案函数
 */
export function useTimeoutHandler({ handleNextPage, collectAnswer }) {
  const { flowContext } = useG4Context();
  const hasTriggeredRef = useRef(false);

  const handleTimeout = useCallback(async () => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;

    console.warn('[g4-experiment] 超时处理：自动提交当前页并跳转到完成页');

    // 记录超时事件到答案
    collectAnswer({
      targetElement: '超时标记',
      value: TIMEOUT_PLACEHOLDER,
    });

    // 提交当前页并导航到完成页
    try {
      await handleNextPage({
        nextPageId: 'task-completion',
        validate: () => true, // 超时时跳过校验
      });
    } catch (error) {
      console.error('[g4-experiment] 超时提交失败:', error);
      // 即使提交失败也导航到完成页
    }
  }, [handleNextPage, collectAnswer]);

  useEffect(() => {
    if (!flowContext?.getTimerSnapshot) return;

    const checkTimeout = () => {
      const snapshot = flowContext.getTimerSnapshot();
      if (snapshot && snapshot.remainingTime <= 0 && !hasTriggeredRef.current) {
        handleTimeout();
      }
    };

    // 初始检查
    checkTimeout();

    // 定期检查（每秒）
    const interval = setInterval(checkTimeout, 1000);

    return () => clearInterval(interval);
  }, [flowContext, handleTimeout]);

  // 重置触发标记（用于测试或页面重置）
  const resetTrigger = useCallback(() => {
    hasTriggeredRef.current = false;
  }, []);

  return { resetTrigger, hasTriggered: hasTriggeredRef.current };
}

export default useTimeoutHandler;
