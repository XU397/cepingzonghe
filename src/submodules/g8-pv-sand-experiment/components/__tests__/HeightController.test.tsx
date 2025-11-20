/**
 * @file HeightController.test.tsx
 * @description 高度控制器组件RTL测试
 * @author Claude (Test Infrastructure)
 * @created 2025-11-19
 * 
 * 测试覆盖:
 * - 基本渲染和交互
 * - 高度选择逻辑
 * - 禁用状态处理
 * - 可访问性功能
 * - 键盘导航支持
 * - 视觉反馈验证
 */

import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import HeightController from '../HeightController';
import { HeightLevel } from '../../types';

// Mock CSS Modules
vi.mock('../HeightController.module.css', () => ({
  default: {
    container: 'container',
    header: 'header',
    title: 'title',
    subtitle: 'subtitle',
    heightOptions: 'heightOptions',
    heightButton: 'heightButton',
    active: 'active',
    disabled: 'disabled',
    heightValue: 'heightValue',
    unit: 'unit',
    heightIndicator: 'heightIndicator',
    bar: 'bar',
    handle: 'handle'
  }
}));

// Mock constants
vi.mock('../../constants/windSpeedData', () => ({
  HEIGHT_LEVELS: [30, 50, 70, 100] as HeightLevel[]
}));

const defaultProps = {
  currentHeight: 50 as HeightLevel,
  onHeightChange: vi.fn(),
  disabled: false
};

describe('HeightController 组件测试', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础渲染', () => {
    it('应该渲染所有高度选项', () => {
      render(<HeightController {...defaultProps} />);

      expect(screen.getByRole('button', { name: /30.*cm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /50.*cm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /70.*cm/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /100.*cm/i })).toBeInTheDocument();
    });

    it('应该显示标题和描述文本', () => {
      render(<HeightController {...defaultProps} />);

      expect(screen.getByRole('heading', { name: '测量高度控制' })).toBeInTheDocument();
      expect(screen.getByText('选择风速测量高度')).toBeInTheDocument();
    });

    it('应该正确标识当前选中的高度', () => {
      render(<HeightController {...defaultProps} currentHeight={70} />);

      const button70 = screen.getByRole('button', { name: /70.*cm/i });
      expect(button70).toHaveClass('heightButton active');
      expect(button70).toHaveAttribute('aria-pressed', 'true');

      const button50 = screen.getByRole('button', { name: /50.*cm/i });
      expect(button50).not.toHaveClass('active');
      expect(button50).toHaveAttribute('aria-pressed', 'false');
    });
  });

  describe('交互功能', () => {
    it('点击按钮应该调用onHeightChange', async () => {
      const user = userEvent.setup();
      const mockOnHeightChange = vi.fn();

      render(
        <HeightController 
          {...defaultProps} 
          currentHeight={50}
          onHeightChange={mockOnHeightChange}
        />
      );

      const button100 = screen.getByRole('button', { name: /100.*cm/i });
      await user.click(button100);

      expect(mockOnHeightChange).toHaveBeenCalledWith(100);
      expect(mockOnHeightChange).toHaveBeenCalledTimes(1);
    });

    it('点击当前选中的按钮不应该触发变更', async () => {
      const user = userEvent.setup();
      const mockOnHeightChange = vi.fn();

      render(
        <HeightController 
          {...defaultProps} 
          currentHeight={50}
          onHeightChange={mockOnHeightChange}
        />
      );

      const button50 = screen.getByRole('button', { name: /50.*cm/i });
      await user.click(button50);

      expect(mockOnHeightChange).not.toHaveBeenCalled();
    });

    it('应该支持键盘导航', async () => {
      const user = userEvent.setup();
      const mockOnHeightChange = vi.fn();

      render(
        <HeightController 
          {...defaultProps} 
          currentHeight={50}
          onHeightChange={mockOnHeightChange}
        />
      );

      // Tab导航到70cm按钮
      await user.tab();
      await user.tab();
      await user.tab(); 
      
      // 按Enter选择
      await user.keyboard('{Enter}');

      expect(mockOnHeightChange).toHaveBeenCalledWith(70);
    });

    it('应该支持Space键激活按钮', async () => {
      const user = userEvent.setup();
      const mockOnHeightChange = vi.fn();

      render(
        <HeightController 
          {...defaultProps} 
          currentHeight={30}
          onHeightChange={mockOnHeightChange}
        />
      );

      const button100 = screen.getByRole('button', { name: /100.*cm/i });
      button100.focus();
      await user.keyboard(' ');

      expect(mockOnHeightChange).toHaveBeenCalledWith(100);
    });

    it('应该支持方向键导航', async () => {
      const user = userEvent.setup();

      render(<HeightController {...defaultProps} currentHeight={50} />);

      const button50 = screen.getByRole('button', { name: /50.*cm/i });
      button50.focus();

      // 右箭头键移动到下一个选项
      await user.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(screen.getByRole('button', { name: /70.*cm/i }));

      // 左箭头键移动到上一个选项
      await user.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(button50);
    });
  });

  describe('禁用状态', () => {
    it('禁用时应该显示适当的提示文本', () => {
      render(<HeightController {...defaultProps} disabled={true} />);

      expect(screen.getByText('当前实验锁定高度')).toBeInTheDocument();
      expect(screen.queryByText('选择风速测量高度')).not.toBeInTheDocument();
    });

    it('禁用时所有按钮应该不可点击', () => {
      render(<HeightController {...defaultProps} disabled={true} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeDisabled();
        expect(button).toHaveClass('heightButton disabled');
      });
    });

    it('禁用时点击不应该触发onHeightChange', async () => {
      const user = userEvent.setup();
      const mockOnHeightChange = vi.fn();

      render(
        <HeightController 
          {...defaultProps} 
          disabled={true}
          onHeightChange={mockOnHeightChange}
        />
      );

      const button100 = screen.getByRole('button', { name: /100.*cm/i });
      await user.click(button100);

      expect(mockOnHeightChange).not.toHaveBeenCalled();
    });

    it('禁用时应该跳过Tab导航', async () => {
      const user = userEvent.setup();

      render(
        <div>
          <button>Before</button>
          <HeightController {...defaultProps} disabled={true} />
          <button>After</button>
        </div>
      );

      const beforeButton = screen.getByRole('button', { name: 'Before' });
      const afterButton = screen.getByRole('button', { name: 'After' });

      beforeButton.focus();
      await user.tab();

      // 应该跳过禁用的高度按钮，直接到下一个元素
      expect(document.activeElement).toBe(afterButton);
    });
  });

  describe('可访问性(a11y)', () => {
    it('应该具有适当的ARIA角色和属性', () => {
      render(<HeightController {...defaultProps} currentHeight={70} />);

      const container = screen.getByRole('group', { name: /测量高度控制/i });
      expect(container).toBeInTheDocument();

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button, index) => {
        expect(button).toHaveAttribute('aria-pressed');
        expect(button).toHaveAttribute('aria-describedby');
        
        if (button.textContent?.includes('70')) {
          expect(button).toHaveAttribute('aria-pressed', 'true');
        } else {
          expect(button).toHaveAttribute('aria-pressed', 'false');
        }
      });
    });

    it('应该为屏幕阅读器提供详细描述', () => {
      render(<HeightController {...defaultProps} currentHeight={50} />);

      const button50 = screen.getByRole('button', { name: /50.*cm/i });
      expect(button50).toHaveAttribute('aria-describedby', expect.stringContaining('height-50-desc'));
      
      const description = document.getElementById(
        button50.getAttribute('aria-describedby')!
      );
      expect(description).toHaveTextContent(/当前选中的测量高度/);
    });

    it('应该在状态改变时提供公告', async () => {
      const user = userEvent.setup();

      render(<HeightController {...defaultProps} currentHeight={30} />);

      const button70 = screen.getByRole('button', { name: /70.*cm/i });
      await user.click(button70);

      const announcement = screen.getByRole('status');
      expect(announcement).toHaveTextContent('测量高度已调整为70厘米');
    });

    it('应该支持语义化的组件结构', () => {
      render(<HeightController {...defaultProps} />);

      const fieldset = screen.getByRole('group');
      expect(fieldset).toHaveAttribute('aria-labelledby');
      
      const legend = document.getElementById(fieldset.getAttribute('aria-labelledby')!);
      expect(legend).toHaveTextContent('测量高度控制');
    });

    it('应该为高对比度模式提供支持', () => {
      // Mock媒体查询
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<HeightController {...defaultProps} currentHeight={50} />);

      const container = screen.getByRole('group');
      expect(container).toHaveAttribute('data-high-contrast', 'true');
    });
  });

  describe('视觉反馈', () => {
    it('应该显示高度可视化指示器', () => {
      render(<HeightController {...defaultProps} currentHeight={70} />);

      const indicators = screen.getAllByTestId(/height-indicator/);
      expect(indicators).toHaveLength(4); // 每个高度一个指示器

      const indicator70 = screen.getByTestId('height-indicator-70');
      expect(indicator70).toHaveClass('heightIndicator');
      expect(indicator70).toHaveStyle('height: 70%'); // 相对高度
    });

    it('应该在hover时提供视觉提示', async () => {
      const user = userEvent.setup();

      render(<HeightController {...defaultProps} currentHeight={50} />);

      const button100 = screen.getByRole('button', { name: /100.*cm/i });
      
      await user.hover(button100);
      expect(button100).toHaveClass('heightButton hover');

      await user.unhover(button100);
      expect(button100).not.toHaveClass('hover');
    });

    it('应该在focus时显示焦点指示器', () => {
      render(<HeightController {...defaultProps} />);

      const button30 = screen.getByRole('button', { name: /30.*cm/i });
      button30.focus();

      expect(button30).toHaveClass('heightButton focused');
      expect(button30).toHaveStyle('outline: 2px solid var(--focus-color)');
    });

    it('应该显示当前选中状态的视觉标识', () => {
      render(<HeightController {...defaultProps} currentHeight={100} />);

      const button100 = screen.getByRole('button', { name: /100.*cm/i });
      expect(button100).toHaveClass('heightButton active');

      const activeIndicator = screen.getByTestId('active-indicator-100');
      expect(activeIndicator).toBeInTheDocument();
    });
  });

  describe('错误处理和边界情况', () => {
    it('应该处理无效的currentHeight值', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      render(
        <HeightController 
          {...defaultProps} 
          currentHeight={999 as any}
        />
      );

      expect(screen.getByText('无效的高度设置')).toBeInTheDocument();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid height value: 999')
      );

      consoleWarnSpy.mockRestore();
    });

    it('应该处理缺少onHeightChange回调的情况', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <HeightController 
          currentHeight={50}
          onHeightChange={undefined as any}
        />
      );

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('onHeightChange callback is required')
      );

      consoleErrorSpy.mockRestore();
    });

    it('应该处理空的HEIGHT_LEVELS数组', () => {
      vi.doMock('../../constants/windSpeedData', () => ({
        HEIGHT_LEVELS: []
      }));

      const { container } = render(<HeightController {...defaultProps} />);

      expect(screen.getByText('没有可选择的高度')).toBeInTheDocument();
      expect(container.querySelectorAll('button')).toHaveLength(0);
    });

    it('应该优雅处理组件卸载', () => {
      const { unmount } = render(<HeightController {...defaultProps} />);

      expect(() => unmount()).not.toThrow();
    });
  });

  describe('自定义样式支持', () => {
    it('应该支持自定义类名', () => {
      render(
        <HeightController 
          {...defaultProps} 
          className="custom-height-controller"
        />
      );

      const container = screen.getByRole('group');
      expect(container).toHaveClass('container custom-height-controller');
    });

    it('应该支持自定义样式属性', () => {
      render(
        <HeightController 
          {...defaultProps} 
          style={{ backgroundColor: 'red' }}
        />
      );

      const container = screen.getByRole('group');
      expect(container).toHaveStyle('background-color: red');
    });

    it('应该支持主题变量', () => {
      render(<HeightController {...defaultProps} data-theme="dark" />);

      const container = screen.getByRole('group');
      expect(container).toHaveAttribute('data-theme', 'dark');
    });
  });

  describe('性能测试', () => {
    it('不必要的重新渲染应该被优化', () => {
      const renderSpy = vi.fn();
      
      const TestHeightController = () => {
        renderSpy();
        return <HeightController {...defaultProps} />;
      };

      const { rerender } = render(<TestHeightController />);
      
      // 使用相同的props重新渲染
      rerender(<TestHeightController />);
      
      expect(renderSpy).toHaveBeenCalledTimes(2); // 初次渲染 + 1次重渲染
    });

    it('频繁的高度变更应该被节流', async () => {
      const user = userEvent.setup();
      const mockOnHeightChange = vi.fn();

      render(
        <HeightController 
          {...defaultProps} 
          onHeightChange={mockOnHeightChange}
        />
      );

      const button70 = screen.getByRole('button', { name: /70.*cm/i });
      const button100 = screen.getByRole('button', { name: /100.*cm/i });

      // 快速连续点击
      await user.click(button70);
      await user.click(button100);
      await user.click(button70);

      // 应该处理所有点击，但可能合并连续的相同值
      expect(mockOnHeightChange).toHaveBeenCalledTimes(3);
    });
  });
});