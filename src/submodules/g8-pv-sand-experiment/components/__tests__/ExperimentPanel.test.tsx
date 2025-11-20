/**
 * @file ExperimentPanel.test.tsx
 * @description 实验面板组件RTL测试
 * @author Claude (Test Infrastructure)
 * @created 2025-11-19
 * 
 * 测试覆盖:
 * - 实验控制面板交互
 * - 数据显示和可视化
 * - 状态管理集成
 * - 错误处理和降级
 * - 用户体验流程
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import ExperimentPanel from '../ExperimentPanel';
import { 
  renderWithPvSandContext,
  setupPage06Scenario,
  expectOperationLogged,
  expectExperimentStateUpdate
} from '../../__tests__/testUtils.jsx';

// Mock子组件
vi.mock('../WindSpeedSimulator', () => ({
  default: ({ height, isAnimating, animationProgress, windData }: any) => (
    <div data-testid="wind-speed-simulator">
      <span>Height: {height}cm</span>
      <span>Animating: {isAnimating ? 'yes' : 'no'}</span>
      <span>Progress: {Math.round(animationProgress * 100)}%</span>
      <span>WindSpeed: {windData.withPanel} / {windData.noPanel}</span>
    </div>
  )
}));

vi.mock('../HeightController', () => ({
  default: ({ currentHeight, onHeightChange, disabled }: any) => (
    <div data-testid="height-controller">
      <span>Current: {currentHeight}cm</span>
      <button 
        onClick={() => onHeightChange(70)} 
        disabled={disabled}
        data-testid="height-button"
      >
        Change Height
      </button>
    </div>
  )
}));

const defaultProps = {
  experimentType: 'experiment1' as const,
  onComplete: vi.fn()
};

describe('ExperimentPanel 组件测试', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染和布局', () => {
    it('应该渲染实验控制界面', () => {
      const contextValue = setupPage06Scenario();
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      expect(screen.getByRole('main')).toHaveAccessibleName('实验操作面板');
      expect(screen.getByTestId('wind-speed-simulator')).toBeInTheDocument();
      expect(screen.getByTestId('height-controller')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '开始实验' })).toBeInTheDocument();
    });

    it('应该显示实验类型标题', () => {
      const contextValue = setupPage06Scenario();
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} experimentType="experiment2" />, 
        { contextValue }
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('实验2：多高度对比');
    });

    it('应该根据实验状态显示正确的控制组件', () => {
      const contextValue = setupPage06Scenario();
      contextValue.experimentState.experiment1.isComplete = false;
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      expect(screen.getByRole('button', { name: '开始实验' })).not.toBeDisabled();
      expect(screen.getByTestId('height-controller')).toHaveTextContent('Current: 50cm');
    });
  });

  describe('实验控制流程', () => {
    it('点击开始应该启动实验', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage06Scenario();
      contextValue.experimentState.experiment1.isComplete = false;
      contextValue.updateExperimentState = vi.fn();
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      const startButton = screen.getByRole('button', { name: '开始实验' });
      await user.click(startButton);

      expectExperimentStateUpdate(contextValue.updateExperimentState, {
        'experiment1.height50cm.isSimulating': true
      });

      expectOperationLogged(contextValue.logOperation, {
        targetElement: '开始实验按钮',
        eventType: 'click',
        value: '启动实验1_50cm高度'
      });
    });

    it('实验进行时应该禁用控制元素', () => {
      const contextValue = setupPage06Scenario();
      contextValue.experimentState.experiment1.height50cm.isSimulating = true;
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      expect(screen.getByRole('button', { name: '停止实验' })).toBeInTheDocument();
      expect(screen.getByTestId('height-controller')).toHaveTextContent('disabled');
      expect(screen.getByText('实验进行中，请稍候...')).toBeInTheDocument();
    });

    it('实验完成后应该显示结果和下一步按钮', async () => {
      const contextValue = setupPage06Scenario();
      contextValue.experimentState.experiment1.isComplete = true;
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      expect(screen.getByRole('button', { name: '重新实验' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '继续下一步' })).toBeInTheDocument();
      expect(screen.getByText('实验完成！')).toBeInTheDocument();
      
      // 验证结果显示
      expect(screen.getByText(/50cm高度.+效果更佳/)).toBeInTheDocument();
    });

    it('应该支持实验重置功能', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage06Scenario();
      contextValue.resetExperiment = vi.fn();
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      const resetButton = screen.getByRole('button', { name: '重新实验' });
      await user.click(resetButton);

      expect(contextValue.resetExperiment).toHaveBeenCalledWith('experiment1');
      
      expectOperationLogged(contextValue.logOperation, {
        targetElement: '重置按钮',
        eventType: 'click',
        value: '重置实验1'
      });
    });
  });

  describe('高度控制集成', () => {
    it('应该正确传递高度控制属性', () => {
      const contextValue = setupPage06Scenario();
      contextValue.experimentState.experiment1.height50cm.currentSpeed = 2;
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      const heightController = screen.getByTestId('height-controller');
      expect(heightController).toHaveTextContent('Current: 50cm');
    });

    it('高度变更应该更新实验状态', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage06Scenario();
      contextValue.updateExperimentState = vi.fn();
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      const changeHeightButton = screen.getByTestId('height-button');
      await user.click(changeHeightButton);

      expectExperimentStateUpdate(contextValue.updateExperimentState, {
        'experiment1.currentHeight': 70
      });
    });

    it('实验进行时应该锁定高度调节', () => {
      const contextValue = setupPage06Scenario();
      contextValue.experimentState.experiment1.height50cm.isSimulating = true;
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      const heightController = screen.getByTestId('height-controller');
      expect(heightController).toHaveTextContent('disabled');
    });
  });

  describe('数据可视化集成', () => {
    it('应该正确传递风速数据给可视化组件', () => {
      const contextValue = setupPage06Scenario();
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      const simulator = screen.getByTestId('wind-speed-simulator');
      expect(simulator).toHaveTextContent('Height: 50cm');
      expect(simulator).toHaveTextContent('WindSpeed: 45 / 88'); // 根据mock数据
    });

    it('应该反映动画状态', () => {
      const contextValue = setupPage06Scenario();
      contextValue.experimentState.experiment1.height50cm.isSimulating = true;
      contextValue.experimentState.experiment1.height50cm.simulationProgress = 0.6;
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      const simulator = screen.getByTestId('wind-speed-simulator');
      expect(simulator).toHaveTextContent('Animating: yes');
      expect(simulator).toHaveTextContent('Progress: 60%');
    });

    it('实验完成时应该显示最终数据', () => {
      const contextValue = setupPage06Scenario();
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      expect(screen.getByText('实验数据汇总')).toBeInTheDocument();
      expect(screen.getByText(/50cm高度.*沙尘飞散.*45.*kg/)).toBeInTheDocument();
      expect(screen.getByText(/地面高度.*沙尘飞散.*88.*kg/)).toBeInTheDocument();
    });
  });

  describe('用户体验优化', () => {
    it('应该显示实验进度指示', () => {
      const contextValue = setupPage06Scenario();
      contextValue.experimentState.experiment1.height50cm.isSimulating = true;
      contextValue.experimentState.experiment1.height50cm.simulationProgress = 0.7;
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '70');
      expect(screen.getByText('实验进度: 70%')).toBeInTheDocument();
    });

    it('应该提供操作提示', () => {
      const contextValue = setupPage06Scenario();
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      expect(screen.getByText('请选择测量高度并开始实验')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '查看操作指引' })).toBeInTheDocument();
    });

    it('应该显示实验耗时信息', async () => {
      const contextValue = setupPage06Scenario();
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      expect(screen.getByText(/实验用时.*5.*分钟/)).toBeInTheDocument();
    });

    it('应该支持键盘导航', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage06Scenario();
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      // Tab导航到开始按钮
      await user.tab();
      expect(document.activeElement).toHave.attribute('data-testid', 'start-button');

      // 按Space启动
      await user.keyboard(' ');
      
      expectOperationLogged(contextValue.logOperation, {
        targetElement: '开始实验按钮',
        eventType: 'keydown',
        value: '键盘启动实验'
      });
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该处理无效的实验类型', () => {
      const contextValue = setupPage06Scenario();
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} experimentType={'invalid' as any} />, 
        { contextValue }
      );

      expect(screen.getByText('不支持的实验类型')).toBeInTheDocument();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid experiment type: invalid')
      );

      consoleWarnSpy.mockRestore();
    });

    it('应该处理实验状态不一致', () => {
      const contextValue = setupPage06Scenario();
      // 设置不一致的状态
      contextValue.experimentState.experiment1.isComplete = true;
      contextValue.experimentState.experiment1.height50cm.isSimulating = true;
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      expect(screen.getByRole('alert')).toHaveTextContent('实验状态异常，请重新开始');
      expect(screen.getByRole('button', { name: '重置实验' })).toBeInTheDocument();
    });

    it('应该处理网络连接问题', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage06Scenario();
      
      // Mock网络错误
      contextValue.updateExperimentState = vi.fn().mockRejectedValue(
        new Error('Network error')
      );
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      const startButton = screen.getByRole('button', { name: '开始实验' });
      await user.click(startButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          '网络连接问题，请检查网络后重试'
        );
      });
    });

    it('应该优雅处理组件卸载', () => {
      const contextValue = setupPage06Scenario();
      contextValue.experimentState.experiment1.height50cm.isSimulating = true;
      
      const { unmount } = renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('可访问性(a11y)', () => {
    it('应该具有适当的ARIA标签和角色', () => {
      const contextValue = setupPage06Scenario();
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      expect(screen.getByRole('main')).toHaveAccessibleName('实验操作面板');
      expect(screen.getByRole('region', { name: '实验控制' })).toBeInTheDocument();
      expect(screen.getByRole('region', { name: '实验数据' })).toBeInTheDocument();
    });

    it('应该为屏幕阅读器提供状态公告', () => {
      const contextValue = setupPage06Scenario();
      contextValue.experimentState.experiment1.height50cm.isSimulating = true;
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      expect(screen.getByRole('status')).toHaveTextContent('实验正在进行中');
    });

    it('应该支持高对比度模式', () => {
      const contextValue = setupPage06Scenario();
      
      // Mock高对比度媒体查询
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });
      
      renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      const mainPanel = screen.getByRole('main');
      expect(mainPanel).toHaveAttribute('data-high-contrast', 'true');
    });
  });

  describe('性能优化', () => {
    it('应该避免不必要的重新渲染', () => {
      const contextValue = setupPage06Scenario();
      const renderSpy = vi.fn();
      
      const TestPanel = (props: any) => {
        renderSpy();
        return <ExperimentPanel {...props} />;
      };

      const { rerender } = renderWithPvSandContext(
        <TestPanel {...defaultProps} />, 
        { contextValue }
      );

      // 使用相同的props重新渲染
      rerender(<TestPanel {...defaultProps} />);

      expect(renderSpy).toHaveBeenCalledTimes(2); // 初次 + 1次重渲染
    });

    it('应该正确清理定时器和事件监听器', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
      const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
      
      const contextValue = setupPage06Scenario();
      const { unmount } = renderWithPvSandContext(
        <ExperimentPanel {...defaultProps} />, 
        { contextValue }
      );

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(removeEventListenerSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
  });
});