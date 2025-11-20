/**
 * @file PvSandContext.test.tsx
 * @description PvSandContext日志功能和状态管理测试
 * @author Claude (Test Infrastructure)
 * @created 2025-11-19
 * 
 * 测试覆盖:
 * - Context Provider功能
 * - 操作日志记录
 * - 答案收集机制
 * - 状态管理和同步
 * - 流程上下文集成
 * - 错误处理和降级
 */

import { render, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { PvSandProvider, usePvSandContext } from '../context/PvSandContext';
import { 
  createMockExperimentState,
  createMockAnswerDraft,
  setupFakeTimers,
  expectLocalStorageCall
} from './testUtils.jsx';

// Mock数据提交服务
vi.mock('@shared/services/submission', () => ({
  useSubmission: () => ({
    submitPageData: vi.fn().mockResolvedValue({ success: true }),
    isSubmitting: false,
    error: null
  })
}));

const TestComponent = () => {
  const context = usePvSandContext();
  
  return (
    <div>
      <div data-testid="current-page">{context.currentPageId}</div>
      <div data-testid="operations-count">{context.operations.length}</div>
      <div data-testid="answers-count">{context.answers.length}</div>
      <button 
        onClick={() => context.logOperation({
          targetElement: '测试按钮',
          eventType: 'click',
          value: '测试值',
          time: new Date().toISOString()
        })}
        data-testid="log-operation"
      >
        Log Operation
      </button>
      <button
        onClick={() => context.collectAnswer({
          targetElement: '测试输入',
          value: '测试答案'
        })}
        data-testid="collect-answer"
      >
        Collect Answer
      </button>
      <button
        onClick={() => context.navigateToPage('page05-tutorial')}
        data-testid="navigate"
      >
        Navigate
      </button>
    </div>
  );
};

const defaultProps = {
  initialPageId: 'page04-experiment-design',
  flowContext: null
};

describe('PvSandContext 测试', () => {

  beforeEach(() => {
    setupFakeTimers();
    vi.clearAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Context Provider 基本功能', () => {
    it('应该正确提供初始状态', () => {
      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      expect(result.current.currentPageId).toBe('page04-experiment-design');
      expect(result.current.operations).toEqual([]);
      expect(result.current.answers).toEqual([]);
      expect(result.current.experimentState).toBeDefined();
      expect(result.current.answerDraft).toBeDefined();
    });

    it('应该在没有Provider时抛出错误', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      expect(() => {
        renderHook(() => usePvSandContext());
      }).toThrow('usePvSandContext must be used within a PvSandProvider');

      consoleErrorSpy.mockRestore();
    });

    it('应该接受自定义的初始状态', () => {
      const customExperimentState = createMockExperimentState({
        experiment1: {
          height50cm: { currentSpeed: 3, isComplete: true },
          heightGround: { currentSpeed: 3, isComplete: true },
          isComplete: true,
          startTime: '2025-11-19T10:00:00Z',
          endTime: '2025-11-19T10:05:00Z'
        }
      });

      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider 
            {...defaultProps}
            initialExperimentState={customExperimentState}
          >
            {children}
          </PvSandProvider>
        )
      });

      expect(result.current.experimentState.experiment1.isComplete).toBe(true);
    });
  });

  describe('操作日志功能', () => {
    it('应该记录用户操作', async () => {
      const user = userEvent.setup();
      
      render(
        <PvSandProvider {...defaultProps}>
          <TestComponent />
        </PvSandProvider>
      );

      const logButton = screen.getByTestId('log-operation');
      await user.click(logButton);

      expect(screen.getByTestId('operations-count')).toHaveTextContent('1');
    });

    it('应该自动添加时间戳', async () => {
      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      act(() => {
        result.current.logOperation({
          targetElement: '测试',
          eventType: 'click',
          value: '测试值'
          // 没有提供time字段
        });
      });

      expect(result.current.operations[0]).toHaveProperty('time');
      expect(result.current.operations[0].time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('应该支持页面进入和退出日志', async () => {
      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      act(() => {
        result.current.logOperation({
          targetElement: '页面',
          eventType: 'page_enter',
          value: 'Page_04_ExperimentDesign',
          time: new Date().toISOString()
        });
      });

      act(() => {
        result.current.logOperation({
          targetElement: '页面',
          eventType: 'page_exit',
          value: 'Page_04_ExperimentDesign',
          time: new Date().toISOString()
        });
      });

      expect(result.current.operations).toHaveLength(2);
      expect(result.current.operations[0].eventType).toBe('page_enter');
      expect(result.current.operations[1].eventType).toBe('page_exit');
    });

    it('应该过滤重复操作', async () => {
      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      const operation = {
        targetElement: '重复按钮',
        eventType: 'click' as const,
        value: '相同值',
        time: '2025-11-19T10:00:00.000Z'
      };

      // 连续记录相同操作
      act(() => {
        result.current.logOperation(operation);
        result.current.logOperation(operation);
        result.current.logOperation(operation);
      });

      // 应该只记录一次，或者有去重逻辑
      expect(result.current.operations.length).toBeLessThanOrEqual(2);
    });

    it('应该限制操作日志数量', async () => {
      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      // 记录大量操作
      act(() => {
        for (let i = 0; i < 1500; i++) {
          result.current.logOperation({
            targetElement: `按钮${i}`,
            eventType: 'click',
            value: `值${i}`,
            time: new Date().toISOString()
          });
        }
      });

      // 应该限制在合理范围内（如1000条）
      expect(result.current.operations.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('答案收集功能', () => {
    it('应该收集用户答案', async () => {
      const user = userEvent.setup();
      
      render(
        <PvSandProvider {...defaultProps}>
          <TestComponent />
        </PvSandProvider>
      );

      const collectButton = screen.getByTestId('collect-answer');
      await user.click(collectButton);

      expect(screen.getByTestId('answers-count')).toHaveTextContent('1');
    });

    it('应该支持覆盖相同元素的答案', async () => {
      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      // 收集同一元素的不同答案
      act(() => {
        result.current.collectAnswer({
          targetElement: 'question1',
          value: '第一个答案'
        });
      });

      act(() => {
        result.current.collectAnswer({
          targetElement: 'question1',
          value: '修改后的答案'
        });
      });

      expect(result.current.answers).toHaveLength(1);
      expect(result.current.answers[0].value).toBe('修改后的答案');
    });

    it('应该验证答案格式', async () => {
      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // 提供无效答案
      act(() => {
        result.current.collectAnswer({
          targetElement: '',  // 空元素名
          value: null as any  // 无效值
        });
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid answer format')
      );

      consoleWarnSpy.mockRestore();
    });

    it('应该自动生成答案时间戳', async () => {
      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      act(() => {
        result.current.collectAnswer({
          targetElement: 'test-element',
          value: 'test-value'
        });
      });

      expect(result.current.answers[0]).toHaveProperty('timestamp');
    });
  });

  describe('页面导航功能', () => {
    it('应该支持页面导航', async () => {
      const user = userEvent.setup();
      
      render(
        <PvSandProvider {...defaultProps}>
          <TestComponent />
        </PvSandProvider>
      );

      expect(screen.getByTestId('current-page')).toHaveTextContent('page04-experiment-design');

      const navigateButton = screen.getByTestId('navigate');
      await user.click(navigateButton);

      expect(screen.getByTestId('current-page')).toHaveTextContent('page05-tutorial');
    });

    it('应该在导航时记录页面切换日志', async () => {
      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      act(() => {
        result.current.navigateToPage('page06-experiment1');
      });

      // 应该记录页面退出和进入日志
      const exitLog = result.current.operations.find(
        op => op.eventType === 'page_exit' && op.value.includes('page04')
      );
      const enterLog = result.current.operations.find(
        op => op.eventType === 'page_enter' && op.value.includes('page06')
      );

      expect(exitLog).toBeDefined();
      expect(enterLog).toBeDefined();
    });

    it('应该验证目标页面有效性', async () => {
      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      act(() => {
        result.current.navigateToPage('invalid-page-id' as any);
      });

      expect(result.current.currentPageId).toBe('page04-experiment-design'); // 不应该改变
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid page ID: invalid-page-id')
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('状态管理和持久化', () => {
    it('应该自动保存状态到localStorage', async () => {
      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      act(() => {
        result.current.updateExperimentState({
          experiment1: { isComplete: true }
        });
      });

      expectLocalStorageCall('setItem', 
        expect.stringContaining('g8-pv-sand-experiment'),
        expect.any(String)
      );
    });

    it('应该从localStorage恢复状态', () => {
      const savedState = createMockExperimentState({
        experiment1: { isComplete: true }
      });

      localStorage.setItem(
        'module.g8-pv-sand-experiment.state',
        JSON.stringify(savedState)
      );

      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      expect(result.current.experimentState.experiment1.isComplete).toBe(true);
    });

    it('应该处理localStorage读取失败', () => {
      localStorage.setItem(
        'module.g8-pv-sand-experiment.state',
        'invalid json'
      );

      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      // 应该使用默认状态
      expect(result.current.experimentState).toBeDefined();
    });

    it('应该清理过期数据', async () => {
      const expiredData = {
        timestamp: Date.now() - 24 * 60 * 60 * 1000 * 7, // 7天前
        data: createMockExperimentState()
      };

      localStorage.setItem(
        'module.g8-pv-sand-experiment.state',
        JSON.stringify(expiredData)
      );

      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      // 应该清理过期数据，使用默认状态
      expect(result.current.experimentState.experiment1.isComplete).toBe(false);
    });
  });

  describe('流程上下文集成', () => {
    it('应该支持流程上下文', () => {
      const flowContext = {
        flowId: 'science-experiment-flow',
        stepIndex: 2
      };

      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps} flowContext={flowContext}>
            {children}
          </PvSandProvider>
        )
      });

      expect(result.current.flowContext).toEqual(flowContext);
    });

    it('应该在流程上下文下记录特殊格式的日志', async () => {
      const flowContext = {
        flowId: 'test-flow',
        stepIndex: 1
      };

      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps} flowContext={flowContext}>
            {children}
          </PvSandProvider>
        )
      });

      act(() => {
        result.current.logOperation({
          targetElement: '测试按钮',
          eventType: 'click',
          value: '测试值',
          time: new Date().toISOString()
        });
      });

      // 日志应该包含流程信息
      const logEntry = result.current.operations[0];
      expect(logEntry.flowContext).toEqual(flowContext);
    });

    it('应该支持流程步骤间的数据传递', async () => {
      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider 
            {...defaultProps} 
            flowContext={{ flowId: 'test', stepIndex: 1 }}
          >
            {children}
          </PvSandProvider>
        )
      });

      act(() => {
        result.current.setFlowContext({
          flowId: 'test',
          stepIndex: 2,
          sharedData: { experiment1Result: 'success' }
        });
      });

      expect(result.current.flowContext.sharedData).toEqual({
        experiment1Result: 'success'
      });
    });
  });

  describe('错误处理和降级', () => {
    it('应该处理操作日志存储失败', async () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn().mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      expect(() => {
        act(() => {
          result.current.logOperation({
            targetElement: '测试',
            eventType: 'click',
            value: '测试',
            time: new Date().toISOString()
          });
        });
      }).not.toThrow();

      // 恢复原方法
      localStorage.setItem = originalSetItem;
    });

    it('应该在内存不足时限制操作历史', async () => {
      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      // Mock memory warning
      const originalMemory = (performance as any).memory;
      (performance as any).memory = { usedJSHeapSize: 50 * 1024 * 1024 }; // 50MB

      // 大量操作
      act(() => {
        for (let i = 0; i < 2000; i++) {
          result.current.logOperation({
            targetElement: `element${i}`,
            eventType: 'click',
            value: `value${i}`,
            time: new Date().toISOString()
          });
        }
      });

      // 应该触发内存清理
      expect(result.current.operations.length).toBeLessThan(2000);

      // 恢复原值
      (performance as any).memory = originalMemory;
    });

    it('应该提供降级的日志功能', async () => {
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      
      // 模拟localStorage完全失效
      Object.defineProperty(window, 'localStorage', {
        value: null,
        writable: true
      });

      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      act(() => {
        result.current.logOperation({
          targetElement: '测试',
          eventType: 'click',
          value: '测试',
          time: new Date().toISOString()
        });
      });

      // 应该fallback到console.log
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[PvSand Operation]')
      );

      consoleLogSpy.mockRestore();
    });
  });

  describe('性能优化', () => {
    it('应该防抖状态更新', async () => {
      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      const updateSpy = vi.fn();
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = updateSpy;

      // 连续快速更新
      act(() => {
        result.current.updateExperimentState({ experiment1: { isComplete: false } });
        result.current.updateExperimentState({ experiment1: { isComplete: true } });
        result.current.updateExperimentState({ experiment2: { isComplete: false } });
      });

      // 应该合并或防抖更新
      expect(updateSpy.mock.calls.length).toBeLessThan(3);

      localStorage.setItem = originalSetItem;
    });

    it('应该使用虚拟化处理大量日志', async () => {
      const { result } = renderHook(() => usePvSandContext(), {
        wrapper: ({ children }) => (
          <PvSandProvider {...defaultProps}>
            {children}
          </PvSandProvider>
        )
      });

      // 添加大量操作
      act(() => {
        for (let i = 0; i < 5000; i++) {
          result.current.logOperation({
            targetElement: `element${i}`,
            eventType: 'click',
            value: `large data ${i}`.repeat(100), // 大量数据
            time: new Date().toISOString()
          });
        }
      });

      // 应该有内存管理机制
      const memoryUsage = JSON.stringify(result.current.operations).length;
      expect(memoryUsage).toBeLessThan(1024 * 1024); // 小于1MB
    });
  });
});