/**
 * 7年级蒸馒头实验 - 子模块组件
 * 包装现有的 grade-7 模块，提供 CMI 接口
 */

import { useCallback, useEffect, useRef } from 'react';
import { Grade7Wrapper } from '@/modules/grade-7/wrapper';
import { useAppContext } from '@/context/AppContext';
import { getPageNumByPageId } from './mapping';

/**
 * G7 Experiment 子模块组件
 * @param {Object} props
 * @param {Object} props.userContext - 用户上下文
 * @param {string} props.initialPageId - 初始页面 ID
 * @param {Object} props.options - 配置选项
 * @param {Object} props.flowContext - Flow 上下文（可选）
 */
export function G7ExperimentComponent({ userContext, initialPageId, options, flowContext }) {
  const { currentPageId, isTimeUp, isTaskFinished } = useAppContext();
  const lastProgressRef = useRef(null);
  const completionRef = useRef(false);
  const timeoutRef = useRef(false);

  const handlePageChange = useCallback((pageId) => {
    if (!flowContext?.updateModuleProgress || !pageId) {
      return;
    }
    const subPageNum = getPageNumByPageId(pageId);
    if (!subPageNum || lastProgressRef.current === subPageNum) {
      return;
    }
    lastProgressRef.current = subPageNum;
    flowContext.updateModuleProgress(subPageNum);
  }, [flowContext]);

  useEffect(() => {
    handlePageChange(currentPageId);
  }, [currentPageId, handlePageChange]);

  const handleComplete = useCallback(() => {
    if (!flowContext?.onComplete || completionRef.current) {
      return;
    }
    completionRef.current = true;
    flowContext.onComplete();
  }, [flowContext]);

  useEffect(() => {
    if (isTaskFinished || currentPageId === 'Page_19_Task_Completion') {
      handleComplete();
    }
  }, [currentPageId, handleComplete, isTaskFinished]);

  const handleTimeout = useCallback(() => {
    if (!flowContext?.onTimeout || timeoutRef.current) {
      return;
    }
    timeoutRef.current = true;
    flowContext.onTimeout();
  }, [flowContext]);

  useEffect(() => {
    if (isTimeUp) {
      handleTimeout();
    }
  }, [handleTimeout, isTimeUp]);

  useEffect(() => {
    // 新的 Flow 步骤时重置一次性标记
    completionRef.current = false;
    timeoutRef.current = false;
    lastProgressRef.current = null;
  }, [flowContext?.flowId, flowContext?.stepIndex]);

  useEffect(() => {
    console.log('[G7Experiment] Submodule mounted', {
      initialPageId,
      flowContext,
    });

    return () => {
      console.log('[G7Experiment] Submodule unmounted');
    };
  }, [initialPageId, flowContext]);

  // TODO: 当实际实现时，需要：
  // 1. 将 initialPageId 转换为 grade-7 模块的页码
  // 2. 集成 TimerService（如果 options.timers 存在）
  // 3. 在完成时调用 flowContext.onComplete()
  // 4. 在超时时调用 flowContext.onTimeout()
  // 5. 使用 enhancePageDesc 增强提交的 pageDesc

  return (
    <Grade7Wrapper
      userContext={userContext}
      initialPageId={initialPageId}
      flowContext={flowContext}
    />
  );
}
