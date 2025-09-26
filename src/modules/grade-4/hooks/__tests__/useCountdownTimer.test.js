/**
 * 倒计时Hook测试
 * 验证倒计时逻辑、状态管理和回调功能
 */

import { renderHook, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import { useCountdownTimer } from '../useCountdownTimer';

describe('useCountdownTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('初始化', () => {
    it('应该使用默认配置初始化', () => {
      const { result } = renderHook(() => useCountdownTimer({}));

      expect(result.current.timeRemaining).toBe(40);
      expect(result.current.isActive).toBe(true);
      expect(result.current.isCompleted).toBe(false);
      expect(result.current.progress).toBe(0);
    });

    it('应该接受自定义初始时间', () => {
      const { result } = renderHook(() => 
        useCountdownTimer({ initialTime: 10 })
      );

      expect(result.current.timeRemaining).toBe(10);
    });

    it('应该支持禁用自动开始', () => {
      const { result } = renderHook(() => 
        useCountdownTimer({ autoStart: false })
      );

      expect(result.current.isActive).toBe(false);
    });
  });

  describe('倒计时功能', () => {
    it('应该正确执行倒计时', () => {
      const { result } = renderHook(() => 
        useCountdownTimer({ initialTime: 5 })
      );

      expect(result.current.timeRemaining).toBe(5);

      // 模拟1秒过去
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(4);

      // 模拟再过2秒
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeRemaining).toBe(2);
    });

    it('应该在倒计时完成时停止并触发回调', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => 
        useCountdownTimer({ initialTime: 2, onComplete })
      );

      expect(result.current.isCompleted).toBe(false);

      // 完成倒计时
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isActive).toBe(false);
      expect(result.current.isCompleted).toBe(true);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('应该在每秒触发onTick回调', () => {
      const onTick = vi.fn();
      renderHook(() => 
        useCountdownTimer({ initialTime: 3, onTick })
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(onTick).toHaveBeenCalledWith(2);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(onTick).toHaveBeenCalledWith(1);
    });

    it('应该正确计算进度百分比', () => {
      const { result } = renderHook(() => 
        useCountdownTimer({ initialTime: 10 })
      );

      expect(result.current.progress).toBe(0);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.progress).toBe(20); // 2/10 * 100%

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.progress).toBe(70); // 7/10 * 100%
    });
  });

  describe('控制功能', () => {
    it('应该支持手动开始倒计时', () => {
      const { result } = renderHook(() => 
        useCountdownTimer({ autoStart: false })
      );

      expect(result.current.isActive).toBe(false);

      act(() => {
        result.current.start();
      });

      expect(result.current.isActive).toBe(true);

      // 验证倒计时开始工作
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.timeRemaining).toBe(39);
    });

    it('应该支持暂停倒计时', () => {
      const { result } = renderHook(() => 
        useCountdownTimer({ initialTime: 10 })
      );

      // 运行2秒
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeRemaining).toBe(8);

      // 暂停
      act(() => {
        result.current.pause();
      });

      expect(result.current.isActive).toBe(false);

      // 再过2秒，时间应该不变
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeRemaining).toBe(8);
    });

    it('应该支持重置倒计时', () => {
      const { result } = renderHook(() => 
        useCountdownTimer({ initialTime: 10 })
      );

      // 运行3秒
      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(result.current.timeRemaining).toBe(7);

      // 重置
      act(() => {
        result.current.reset();
      });

      expect(result.current.timeRemaining).toBe(10);
      expect(result.current.isActive).toBe(true);
      expect(result.current.isCompleted).toBe(false);
      expect(result.current.progress).toBe(0);
    });

    it('应该在完成后阻止重新开始', () => {
      const { result } = renderHook(() => 
        useCountdownTimer({ initialTime: 1 })
      );

      // 完成倒计时
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isCompleted).toBe(true);

      // 尝试重新开始（应该被忽略）
      act(() => {
        result.current.start();
      });

      expect(result.current.isActive).toBe(false);
      expect(result.current.isCompleted).toBe(true);
    });
  });

  describe('时间格式化', () => {
    it('应该正确格式化秒数', () => {
      const { result } = renderHook(() => 
        useCountdownTimer({ initialTime: 45 })
      );

      expect(result.current.formatTime()).toBe('45s');

      act(() => {
        vi.advanceTimersByTime(15000);
      });

      expect(result.current.formatTime()).toBe('30s');
    });

    it('应该正确格式化分钟和秒数', () => {
      const { result } = renderHook(() => 
        useCountdownTimer({ initialTime: 125 }) // 2分5秒
      );

      expect(result.current.formatTime()).toBe('2:05');

      act(() => {
        vi.advanceTimersByTime(10000);
      });

      expect(result.current.formatTime()).toBe('1:55');
    });

    it('应该处理0秒的情况', () => {
      const { result } = renderHook(() => 
        useCountdownTimer({ initialTime: 1 })
      );

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.formatTime()).toBe('0s');
    });
  });

  describe('边界情况', () => {
    it('应该处理0初始时间', () => {
      const onComplete = vi.fn();
      const { result } = renderHook(() => 
        useCountdownTimer({ initialTime: 0, onComplete })
      );

      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isCompleted).toBe(false);

      // 立即完成
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.isCompleted).toBe(true);
      expect(onComplete).toHaveBeenCalled();
    });

    it('应该处理负数初始时间', () => {
      const { result } = renderHook(() => 
        useCountdownTimer({ initialTime: -5 })
      );

      expect(result.current.timeRemaining).toBe(-5);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      // 负数时间直接完成
      expect(result.current.timeRemaining).toBe(0);
      expect(result.current.isCompleted).toBe(true);
    });

    it('应该正确清理定时器', () => {
      const { unmount } = renderHook(() => 
        useCountdownTimer({ initialTime: 10 })
      );

      // 卸载应该不会产生错误
      expect(() => unmount()).not.toThrow();
    });

    it('应该在组件重新渲染时保持状态一致性', () => {
      const { result, rerender } = renderHook(
        ({ time }) => useCountdownTimer({ initialTime: time }),
        { initialProps: { time: 10 } }
      );

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(result.current.timeRemaining).toBe(8);

      // 重新渲染
      rerender({ time: 10 });

      // 状态应该保持不变
      expect(result.current.timeRemaining).toBe(8);
    });
  });

  describe('调试信息', () => {
    it('应该提供调试信息', () => {
      const { result } = renderHook(() => 
        useCountdownTimer({ initialTime: 15 })
      );

      expect(result.current.debug).toEqual({
        initialTime: 15,
        timeRemaining: 15,
        isActive: true,
        isCompleted: false,
        hasTimer: true
      });

      // 暂停后检查调试信息
      act(() => {
        result.current.pause();
      });

      expect(result.current.debug.isActive).toBe(false);
      expect(result.current.debug.hasTimer).toBe(false);
    });
  });
});