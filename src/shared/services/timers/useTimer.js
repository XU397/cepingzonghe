/**
 * useTimer Hook - 简化 TimerService 在 React 组件中的使用
 *
 * 功能:
 * - 自动订阅计时器状态变化
 * - 自动清理 (组件卸载时)
 * - 提供便捷的 API
 *
 * 使用示例:
 * ```jsx
 * function MyComponent() {
 *   const { remaining, start, pause, resume, reset } = useTimer('task', {
 *     onTimeout: () => {
 *       console.log('超时了!');
 *       navigate('/timeout');
 *     },
 *     onTick: (remaining) => {
 *       if (remaining === 60) {
 *         alert('还剩1分钟!');
 *       }
 *     }
 *   });
 *
 *   return (
 *     <div>
 *       <p>剩余时间: {remaining}秒</p>
 *       <button onClick={() => start(600)}>开始</button>
 *       <button onClick={pause}>暂停</button>
 *       <button onClick={resume}>恢复</button>
 *       <button onClick={reset}>重置</button>
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import TimerService from './TimerService.js';

/**
 * useTimer Hook
 *
 * @param {string} type - 计时器类型: 'task' | 'questionnaire' | 'notice'
 * @param {Object} options - 配置选项
 * @param {Function} [options.onTimeout] - 超时回调
 * @param {Function} [options.onTick] - 每秒回调 (接收 remaining 参数)
 * @param {boolean} [options.autoStart=false] - 是否自动启动
 * @param {number} [options.duration] - 自动启动时的时长 (秒)
 * @param {string} [options.scope] - once-only 去重作用域 (例如 flow::module::step)
 * @returns {Object}
 */
export function useTimer(type, options = {}) {
  const {
    onTimeout,
    onTick,
    autoStart = false,
    duration,
    scope,
  } = options;

  const [remaining, setRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isTimeout, setIsTimeout] = useState(false);

  const timerRef = useRef(null);
  const updateIntervalRef = useRef(null);

  const resolveStartOptions = useCallback(
    (startArg) => {
      if (typeof startArg === 'function') {
        return {
          onTimeout: startArg,
          scope,
          force: false,
        };
      }

      if (startArg && typeof startArg === 'object') {
        return {
          onTimeout: startArg.onTimeout ?? onTimeout ?? null,
          scope: startArg.scope ?? scope,
          force: startArg.force ?? false,
        };
      }

      return {
        onTimeout: onTimeout ?? null,
        scope,
        force: false,
      };
    },
    [onTimeout, scope],
  );

  // 获取计时器实例
  useEffect(() => {
    timerRef.current = TimerService.getInstance(type);

    // 初始化状态
    setRemaining(timerRef.current.getRemaining());
    setIsRunning(timerRef.current.isRunning);
    setIsPaused(timerRef.current.isPaused());
    setIsTimeout(timerRef.current.isTimeout());

    console.log(`[useTimer:${type}] Hook 初始化`, {
      remaining: timerRef.current.getRemaining(),
      isRunning: timerRef.current.isRunning,
    });
  }, [type]);

  // 注册回调
  useEffect(() => {
    if (!timerRef.current) return;

    if (onTimeout) {
      timerRef.current.onTimeout(onTimeout);
    }

    if (onTick) {
      timerRef.current.onTick(onTick);
    }

    return () => {
      if (onTimeout) {
        timerRef.current.offTimeout(onTimeout);
      }
      if (onTick) {
        timerRef.current.offTick(onTick);
      }
    };
  }, [onTimeout, onTick]);

  // 定期更新状态 (从 localStorage 同步)
  useEffect(() => {
    if (!timerRef.current) return;

    updateIntervalRef.current = setInterval(() => {
      setRemaining(timerRef.current.getRemaining());
      setIsRunning(timerRef.current.isRunning);
      setIsPaused(timerRef.current.isPaused());
      setIsTimeout(timerRef.current.isTimeout());
    }, 500); // 每 500ms 同步一次

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
    };
  }, []);

  // 自动启动
  useEffect(() => {
    if (autoStart && duration && timerRef.current) {
      console.log(`[useTimer:${type}] 自动启动计时器, duration=${duration}`, {
        scope,
      });
      const startOptions = resolveStartOptions({
        onTimeout,
        scope,
        force: false,
      });
      timerRef.current.start(duration, startOptions);
      setIsRunning(true);
      setIsPaused(false);
      setIsTimeout(false);
    }
  }, [autoStart, duration, onTimeout, resolveStartOptions, scope, type]);

  // API 方法
  const start = useCallback((durationSeconds, startArg) => {
    if (!timerRef.current) return;
    const startOptions = resolveStartOptions(
      typeof startArg === 'undefined' ? undefined : startArg,
    );
    timerRef.current.start(durationSeconds, startOptions);
    setIsRunning(true);
    setIsPaused(false);
    setIsTimeout(false);
    console.log(`[useTimer:${type}] 启动计时器, duration=${durationSeconds}`, {
      scope: startOptions.scope,
      force: startOptions.force,
    });
  }, [resolveStartOptions, type]);

  const pause = useCallback(() => {
    if (!timerRef.current) return;
    timerRef.current.pause();
    setIsRunning(false);
    setIsPaused(true);
    console.log(`[useTimer:${type}] 暂停计时器`);
  }, [type]);

  const resume = useCallback(() => {
    if (!timerRef.current) return;
    timerRef.current.resume();
    setIsRunning(true);
    setIsPaused(false);
    console.log(`[useTimer:${type}] 恢复计时器`);
  }, [type]);

  const reset = useCallback(() => {
    if (!timerRef.current) return;
    timerRef.current.reset();
    setRemaining(0);
    setIsRunning(false);
    setIsPaused(false);
    setIsTimeout(false);
    console.log(`[useTimer:${type}] 重置计时器`);
  }, [type]);

  const stop = useCallback(() => {
    if (!timerRef.current) return;
    timerRef.current.stop();
    setIsRunning(false);
    console.log(`[useTimer:${type}] 停止计时器`);
  }, [type]);

  // 工具方法
  const formatTime = useCallback((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  return {
    // 状态
    remaining,
    isRunning,
    isPaused,
    isTimeout,
    duration: timerRef.current?.getDuration() || 0,

    // 控制方法
    start,
    pause,
    resume,
    reset,
    stop,

    // 工具方法
    formatTime: () => formatTime(remaining),
    getDebugInfo: () => timerRef.current?.getDebugInfo() || {},

    // 计算属性
    progress: timerRef.current?.getDuration()
      ? ((timerRef.current.getDuration() - remaining) / timerRef.current.getDuration()) * 100
      : 0,
  };
}

export default useTimer;
