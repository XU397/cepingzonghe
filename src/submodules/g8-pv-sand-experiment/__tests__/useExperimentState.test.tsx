/**
 * @file useExperimentState.test.tsx
 * @description useExperimentState Hook状态机测试
 * @author Claude (Test Infrastructure)
 * @created 2025-11-19
 * 
 * 测试覆盖:
 * - 实验状态机流转(idle → running → completed)
 * - 高度调节和验证逻辑
 * - 动画进度计算
 * - 数据收集和持久化
 * - 错误处理和边界情况
 * - sessionStorage状态恢复
 */

import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useExperimentState } from '../hooks/useExperimentState';
import { 
  createMockPvSandProvider,
  createMockContextValue,
  createMockExperimentState,
  setupFakeTimers,
  waitForAsyncOperations,
  expectOperationLogged,
  setupTestLocalStorage
} from './testUtils.jsx';
import { ANIMATION_DURATION } from '../constants/windSpeedData';

// Mock usePvSandContext hook
vi.mock('../context/PvSandContext', () => ({
  usePvSandContext: vi.fn()
}));

import { usePvSandContext } from '../context/PvSandContext';

// Mock constants
vi.mock('../constants/windSpeedData', async () => {
  const actual = await vi.importActual('../constants/windSpeedData');
  return {
    ...actual,
    ANIMATION_DURATION: 2000, // 缩短动画时间用于测试
    getWindSpeedData: vi.fn((height) => ({
      withPanel: height * 0.8, // 简化的计算
      noPanel: height * 1.2
    })),
    validateHeightLevel: vi.fn((height) => [30, 50, 70, 100].includes(height))
  };
});

const mockContextValue = createMockContextValue();
const TestWrapper = createMockPvSandProvider(mockContextValue);

describe('useExperimentState Hook 测试', () => {

  beforeEach(() => {
    vi.clearAllMocks();
    setupFakeTimers();
    sessionStorage.clear();
    
    // 重置mock context
    Object.assign(mockContextValue, createMockContextValue({
      experimentState: {
        currentHeight: 50,
        isRunning: false,
        isCompleted: false,
        animationState: 'idle',
        animationStartTime: null,
        collectedData: null,
        operationHistory: []
      }
    }));
    
    // 设置mock hook返回值
    vi.mocked(usePvSandContext).mockReturnValue(mockContextValue);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('初始状态和sessionStorage恢复', () => {
    it('应该使用默认的实验状态', () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      expect(result.current.experimentState).toEqual(
        expect.objectContaining({
          currentHeight: 50,
          isRunning: false,
          isCompleted: false,
          animationState: 'idle',
          animationStartTime: null,
          collectedData: null
        })
      );

      expect(result.current.isExperimentReady()).toBe(true);
      expect(result.current.canChangeHeight()).toBe(true);
    });

    it('应该从sessionStorage恢复状态', () => {
      const savedState = {
        currentHeight: 70,
        isCompleted: true,
        animationState: 'completed',
        collectedData: {
          heightLevel: 70,
          withPanelSpeed: 56,
          noPanelSpeed: 84,
          timestamp: '2025-11-19T10:00:00.000Z'
        }
      };

      sessionStorage.setItem(
        'g8-pv-sand-experiment.experimentState',
        JSON.stringify(savedState)
      );

      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      expect(mockContextValue.updateExperimentState).toHaveBeenCalledWith(savedState);
    });

    it('应该处理sessionStorage读取失败', () => {
      sessionStorage.setItem(
        'g8-pv-sand-experiment.experimentState', 
        'invalid json'
      );

      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      // 应该不抛出异常，使用默认状态
      expect(result.current.experimentState.currentHeight).toBe(50);
    });

    it('应该自动保存状态到sessionStorage', () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      // 触发状态更新
      act(() => {
        result.current.changeHeight(70);
      });

      // 验证sessionStorage被调用
      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'g8-pv-sand-experiment.experimentState',
        expect.stringContaining('"currentHeight":70')
      );
    });
  });

  describe('实验启动和状态机流转', () => {
    it('应该正确启动实验', async () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      expect(result.current.isExperimentReady()).toBe(true);

      act(() => {
        result.current.startExperiment();
      });

      // 验证立即状态更新
      expect(mockContextValue.updateExperimentState).toHaveBeenCalledWith({
        isRunning: true,
        isCompleted: false,
        animationState: 'starting',
        animationStartTime: expect.any(Number),
        collectedData: null
      });

      expectOperationLogged(mockContextValue.logOperation, {
        targetElement: '开始按钮',
        eventType: 'click',
        value: '开始实验_高度50cm'
      });

      // 模拟100ms后转为running状态
      act(() => {
        vi.advanceTimersByTime(100);
      });

      expect(mockContextValue.updateExperimentState).toHaveBeenCalledWith({
        animationState: 'running'
      });
    });

    it('应该在动画完成后自动完成实验', async () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      act(() => {
        result.current.startExperiment();
      });

      // 模拟完整动画时间
      act(() => {
        vi.advanceTimersByTime(ANIMATION_DURATION);
      });

      // 验证实验完成
      expect(mockContextValue.updateExperimentState).toHaveBeenCalledWith({
        isRunning: false,
        isCompleted: true,
        animationState: 'completed',
        collectedData: {
          heightLevel: 50,
          withPanelSpeed: 40, // 50 * 0.8
          noPanelSpeed: 60,   // 50 * 1.2
          timestamp: expect.any(String)
        },
        operationHistory: expect.arrayContaining([
          expect.objectContaining({
            action: 'start_experiment',
            toValue: 'height_50cm',
            timestamp: expect.any(String)
          })
        ])
      });

      expectOperationLogged(mockContextValue.logOperation, {
        targetElement: '实验数据',
        eventType: 'change'
      });
    });

    it('正在运行时不应该允许重复启动', () => {
      // 设置运行中的状态
      const runningContextValue = createMockContextValue({
        experimentState: {
          currentHeight: 50,
          isRunning: true,
          isCompleted: false,
          animationState: 'running',
          animationStartTime: Date.now(),
          collectedData: null,
          operationHistory: []
        }
      });

      const RunningTestWrapper = createMockPvSandProvider(runningContextValue);
      const { result } = renderHook(() => useExperimentState(), { wrapper: RunningTestWrapper });

      const initialUpdateCallCount = runningContextValue.updateExperimentState.mock.calls.length;

      act(() => {
        result.current.startExperiment();
      });

      // 不应该有新的状态更新
      expect(runningContextValue.updateExperimentState).toHaveBeenCalledTimes(initialUpdateCallCount);
      expect(result.current.isExperimentReady()).toBe(false);
    });
  });

  describe('实验重置功能', () => {
    it('应该正确重置实验状态', () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      act(() => {
        result.current.resetExperiment();
      });

      expect(mockContextValue.updateExperimentState).toHaveBeenCalledWith({
        isRunning: false,
        isCompleted: false,
        animationState: 'idle',
        animationStartTime: null,
        collectedData: null,
        operationHistory: expect.arrayContaining([
          expect.objectContaining({
            action: 'reset_experiment',
            timestamp: expect.any(String)
          })
        ])
      });

      expectOperationLogged(mockContextValue.logOperation, {
        targetElement: '重置按钮',
        eventType: 'click',
        value: '重置实验'
      });
    });

    it('重置后应该允许重新启动', () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      // 重置
      act(() => {
        result.current.resetExperiment();
      });

      // 应该能够重新启动
      expect(result.current.isExperimentReady()).toBe(true);
      expect(result.current.canChangeHeight()).toBe(true);
    });
  });

  describe('高度调节功能', () => {
    it('应该正确调节实验高度', () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      act(() => {
        result.current.changeHeight(70);
      });

      expect(mockContextValue.updateExperimentState).toHaveBeenCalledWith({
        currentHeight: 70,
        isCompleted: false,
        collectedData: null,
        operationHistory: expect.arrayContaining([
          expect.objectContaining({
            action: 'height_change',
            fromValue: '50cm',
            toValue: '70cm',
            timestamp: expect.any(String)
          })
        ])
      });

      expectOperationLogged(mockContextValue.logOperation, {
        targetElement: '高度调节器',
        eventType: 'click',
        value: '调节高度_从50到70cm'
      });
    });

    it('应该验证高度值的有效性', () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      const initialUpdateCallCount = mockContextValue.updateExperimentState.mock.calls.length;

      // 尝试设置无效高度
      act(() => {
        result.current.changeHeight(999 as any);
      });

      // 不应该更新状态（validateHeightLevel返回false）
      expect(mockContextValue.updateExperimentState).toHaveBeenCalledTimes(initialUpdateCallCount);
    });

    it('实验运行时不应该允许调节高度', () => {
      const runningContextValue = createMockContextValue({
        experimentState: {
          currentHeight: 50,
          isRunning: true,
          isCompleted: false,
          animationState: 'running',
          animationStartTime: Date.now(),
          collectedData: null,
          operationHistory: []
        }
      });

      const RunningTestWrapper = createMockPvSandProvider(runningContextValue);
      const { result } = renderHook(() => useExperimentState(), { wrapper: RunningTestWrapper });

      const initialUpdateCallCount = runningContextValue.updateExperimentState.mock.calls.length;

      act(() => {
        result.current.changeHeight(70);
      });

      // 不应该更新状态
      expect(runningContextValue.updateExperimentState).toHaveBeenCalledTimes(initialUpdateCallCount);
      expect(result.current.canChangeHeight()).toBe(false);
    });
  });

  describe('动画进度计算', () => {
    it('idle状态应该返回0进度', () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      expect(result.current.getAnimationProgress()).toBe(0);
    });

    it('completed状态应该返回1进度', () => {
      const completedContextValue = createMockContextValue({
        experimentState: {
          currentHeight: 50,
          isRunning: false,
          isCompleted: true,
          animationState: 'completed',
          animationStartTime: null,
          collectedData: null,
          operationHistory: []
        }
      });

      const CompletedTestWrapper = createMockPvSandProvider(completedContextValue);
      const { result } = renderHook(() => useExperimentState(), { wrapper: CompletedTestWrapper });

      expect(result.current.getAnimationProgress()).toBe(1);
    });

    it('running状态应该根据时间计算进度', () => {
      const startTime = Date.now();
      const runningContextValue = createMockContextValue({
        experimentState: {
          currentHeight: 50,
          isRunning: true,
          isCompleted: false,
          animationState: 'running',
          animationStartTime: startTime,
          collectedData: null,
          operationHistory: []
        }
      });

      const RunningTestWrapper = createMockPvSandProvider(runningContextValue);
      const { result } = renderHook(() => useExperimentState(), { wrapper: RunningTestWrapper });

      // 模拟过去一半时间
      act(() => {
        vi.advanceTimersByTime(ANIMATION_DURATION / 2);
      });

      expect(result.current.getAnimationProgress()).toBeCloseTo(0.5, 1);

      // 模拟完整时间
      act(() => {
        vi.advanceTimersByTime(ANIMATION_DURATION / 2);
      });

      expect(result.current.getAnimationProgress()).toBeCloseTo(1, 1);
    });

    it('超过动画时间应该限制为1', () => {
      const startTime = Date.now() - ANIMATION_DURATION * 2; // 2倍时间前开始
      const overtimeContextValue = createMockContextValue({
        experimentState: {
          currentHeight: 50,
          isRunning: true,
          isCompleted: false,
          animationState: 'running',
          animationStartTime: startTime,
          collectedData: null,
          operationHistory: []
        }
      });

      const OvertimeTestWrapper = createMockPvSandProvider(overtimeContextValue);
      const { result } = renderHook(() => useExperimentState(), { wrapper: OvertimeTestWrapper });

      expect(result.current.getAnimationProgress()).toBe(1);
    });
  });

  describe('风速数据获取', () => {
    it('应该根据当前高度获取风速数据', () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      const windData = result.current.getCurrentWindData();

      expect(windData).toEqual({
        withPanel: 40, // 50 * 0.8
        noPanel: 60    // 50 * 1.2
      });
    });

    it('高度变更后应该获取新的风速数据', () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      act(() => {
        result.current.changeHeight(100);
      });

      const windData = result.current.getCurrentWindData();

      expect(windData).toEqual({
        withPanel: 80,  // 100 * 0.8
        noPanel: 120    // 100 * 1.2
      });
    });
  });

  describe('状态查询函数', () => {
    it('isExperimentReady应该正确反映准备状态', () => {
      // idle状态应该ready
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });
      expect(result.current.isExperimentReady()).toBe(true);

      // running状态不应该ready
      const runningContextValue = createMockContextValue({
        experimentState: {
          currentHeight: 50,
          isRunning: true,
          isCompleted: false,
          animationState: 'running',
          animationStartTime: Date.now(),
          collectedData: null,
          operationHistory: []
        }
      });

      const RunningTestWrapper = createMockPvSandProvider(runningContextValue);
      const { result: runningResult } = renderHook(() => useExperimentState(), { wrapper: RunningTestWrapper });
      expect(runningResult.current.isExperimentReady()).toBe(false);

      // completed状态应该ready（但animationState不是idle）
      const completedContextValue = createMockContextValue({
        experimentState: {
          currentHeight: 50,
          isRunning: false,
          isCompleted: true,
          animationState: 'completed',
          animationStartTime: null,
          collectedData: null,
          operationHistory: []
        }
      });

      const CompletedTestWrapper = createMockPvSandProvider(completedContextValue);
      const { result: completedResult } = renderHook(() => useExperimentState(), { wrapper: CompletedTestWrapper });
      expect(completedResult.current.isExperimentReady()).toBe(false); // animationState不是idle
    });

    it('canChangeHeight应该正确反映高度调节能力', () => {
      // 非running状态应该可以调节
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });
      expect(result.current.canChangeHeight()).toBe(true);

      // running状态不应该可以调节
      const runningContextValue = createMockContextValue({
        experimentState: {
          currentHeight: 50,
          isRunning: true,
          isCompleted: false,
          animationState: 'running',
          animationStartTime: Date.now(),
          collectedData: null,
          operationHistory: []
        }
      });

      const RunningTestWrapper = createMockPvSandProvider(runningContextValue);
      const { result: runningResult } = renderHook(() => useExperimentState(), { wrapper: RunningTestWrapper });
      expect(runningResult.current.canChangeHeight()).toBe(false);
    });
  });

  describe('操作历史记录', () => {
    it('应该记录实验启动操作', () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      act(() => {
        result.current.startExperiment();
      });

      // 等待完成
      act(() => {
        vi.advanceTimersByTime(ANIMATION_DURATION);
      });

      expect(mockContextValue.updateExperimentState).toHaveBeenCalledWith(
        expect.objectContaining({
          operationHistory: expect.arrayContaining([
            expect.objectContaining({
              action: 'start_experiment',
              toValue: 'height_50cm'
            })
          ])
        })
      );
    });

    it('应该记录高度调节操作', () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      act(() => {
        result.current.changeHeight(70);
      });

      expect(mockContextValue.updateExperimentState).toHaveBeenCalledWith(
        expect.objectContaining({
          operationHistory: expect.arrayContaining([
            expect.objectContaining({
              action: 'height_change',
              fromValue: '50cm',
              toValue: '70cm'
            })
          ])
        })
      );
    });

    it('应该记录重置操作', () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      act(() => {
        result.current.resetExperiment();
      });

      expect(mockContextValue.updateExperimentState).toHaveBeenCalledWith(
        expect.objectContaining({
          operationHistory: expect.arrayContaining([
            expect.objectContaining({
              action: 'reset_experiment'
            })
          ])
        })
      );
    });
  });

  describe('边界情况和错误处理', () => {
    it('应该处理动画开始时间为null的情况', () => {
      const nullTimeContextValue = createMockContextValue({
        experimentState: {
          currentHeight: 50,
          isRunning: true,
          isCompleted: false,
          animationState: 'running',
          animationStartTime: null, // 异常情况
          collectedData: null,
          operationHistory: []
        }
      });

      const NullTimeTestWrapper = createMockPvSandProvider(nullTimeContextValue);
      const { result } = renderHook(() => useExperimentState(), { wrapper: NullTimeTestWrapper });

      expect(result.current.getAnimationProgress()).toBe(0);
    });

    it('应该处理实验状态不一致的情况', () => {
      const inconsistentContextValue = createMockContextValue({
        experimentState: {
          currentHeight: 50,
          isRunning: false, // 不运行
          isCompleted: false,
          animationState: 'running', // 但动画在运行
          animationStartTime: Date.now(),
          collectedData: null,
          operationHistory: []
        }
      });

      const InconsistentTestWrapper = createMockPvSandProvider(inconsistentContextValue);
      const { result } = renderHook(() => useExperimentState(), { wrapper: InconsistentTestWrapper });

      // 应该按照animationState判断
      expect(result.current.getAnimationProgress()).toBeGreaterThan(0);
      expect(result.current.isExperimentReady()).toBe(false);
    });

    it('应该处理sessionStorage写入失败', () => {
      const originalSetItem = sessionStorage.setItem;
      sessionStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      // 不应该抛出异常
      expect(() => {
        act(() => {
          result.current.changeHeight(70);
        });
      }).not.toThrow();

      // 恢复原方法
      sessionStorage.setItem = originalSetItem;
    });
  });

  describe('集成场景测试', () => {
    it('完整实验流程', async () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      // 1. 初始状态验证
      expect(result.current.isExperimentReady()).toBe(true);
      expect(result.current.canChangeHeight()).toBe(true);
      expect(result.current.getAnimationProgress()).toBe(0);

      // 2. 调节高度
      act(() => {
        result.current.changeHeight(70);
      });

      // 3. 启动实验
      act(() => {
        result.current.startExperiment();
      });

      expect(result.current.isExperimentReady()).toBe(false);
      expect(result.current.canChangeHeight()).toBe(false);

      // 4. 等待实验完成
      act(() => {
        vi.advanceTimersByTime(ANIMATION_DURATION);
      });

      // 5. 验证最终状态
      const finalWindData = result.current.getCurrentWindData();
      expect(finalWindData).toEqual({
        withPanel: 56, // 70 * 0.8
        noPanel: 84    // 70 * 1.2
      });

      // 6. 重置实验
      act(() => {
        result.current.resetExperiment();
      });

      expect(result.current.isExperimentReady()).toBe(true);
    });

    it('多次实验数据应该累积记录', () => {
      const { result } = renderHook(() => useExperimentState(), { wrapper: TestWrapper });

      // 第一次实验
      act(() => {
        result.current.startExperiment();
        vi.advanceTimersByTime(ANIMATION_DURATION);
      });

      // 重置
      act(() => {
        result.current.resetExperiment();
      });

      // 改变高度
      act(() => {
        result.current.changeHeight(100);
      });

      // 第二次实验
      act(() => {
        result.current.startExperiment();
        vi.advanceTimersByTime(ANIMATION_DURATION);
      });

      // 操作历史应该包含所有操作
      const lastCall = mockContextValue.updateExperimentState.mock.calls[
        mockContextValue.updateExperimentState.mock.calls.length - 1
      ];
      
      expect(lastCall[0].operationHistory).toHaveLength(4); // start -> reset -> change -> start
    });
  });
});