/**
 * 倒计时复选框组件测试
 * 验证倒计时逻辑、状态变化和用户交互
 */

// Test file for CountdownCheckbox component
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import CountdownCheckbox from '../CountdownCheckbox';
import { Grade4Provider } from '../../context/Grade4Context';

// 测试工具组件：提供 Grade4Provider 包装
const TestWrapper = ({ children }) => {
  const mockAuthInfo = {
    batchCode: 'TEST_BATCH_001',
    examNo: 'TEST_STUDENT_001'
  };

  return (
    <Grade4Provider authInfo={mockAuthInfo} globalContext={null}>
      {children}
    </Grade4Provider>
  );
};

// 渲染带有Provider的CountdownCheckbox
const renderCountdownCheckbox = (props = {}) => {
  const defaultProps = {
    initialTime: 5, // 使用较短时间便于测试
    label: '测试复选框',
    ...props
  };

  return render(
    <TestWrapper>
      <CountdownCheckbox {...defaultProps} />
    </TestWrapper>
  );
};

describe('CountdownCheckbox', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  describe('初始状态', () => {
    it('应该显示禁用的复选框和倒计时', () => {
      renderCountdownCheckbox();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
      expect(checkbox).not.toBeChecked();
      expect(screen.getByText(/测试复选框\(5s\)/)).toBeInTheDocument();
    });

    it('应该接受自定义初始时间', () => {
      renderCountdownCheckbox({ initialTime: 10 });

      expect(screen.getByText(/测试复选框\(10s\)/)).toBeInTheDocument();
    });

    it('应该接受自定义标签文本', () => {
      renderCountdownCheckbox({ label: '自定义标签' });

      expect(screen.getByText(/自定义标签\(5s\)/)).toBeInTheDocument();
    });
  });

  describe('倒计时功能', () => {
    it('应该正确执行倒计时', async () => {
      renderCountdownCheckbox({ initialTime: 3 });

      // 验证初始状态
      expect(screen.getByText(/3s/)).toBeInTheDocument();

      // 模拟1秒过去
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/2s/)).toBeInTheDocument();
      });

      // 模拟再过1秒
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/1s/)).toBeInTheDocument();
      });
    });

    it('应该在倒计时完成后激活复选框', async () => {
      const onComplete = vi.fn();
      renderCountdownCheckbox({ initialTime: 2, onComplete });

      const checkbox = screen.getByRole('checkbox');
      
      // 验证初始禁用状态
      expect(checkbox).toBeDisabled();

      // 完成倒计时
      act(() => {
        vi.advanceTimersByTime(2000);
      });

      // 验证完成后状态
      await waitFor(() => {
        expect(checkbox).not.toBeDisabled();
        expect(screen.getByText('测试复选框')).toBeInTheDocument();
        expect(screen.queryByText(/\d+s/)).not.toBeInTheDocument();
      });

      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('应该处理倒计时为0的情况', async () => {
      renderCountdownCheckbox({ initialTime: 0 });

      const checkbox = screen.getByRole('checkbox');
      
      // 应该立即启用
      await waitFor(() => {
        expect(checkbox).not.toBeDisabled();
      });
    });
  });

  describe('用户交互', () => {
    it('应该在倒计时完成后响应点击事件', async () => {
      const onChange = vi.fn();
      renderCountdownCheckbox({ initialTime: 1, onChange });

      const checkbox = screen.getByRole('checkbox');

      // 完成倒计时
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(checkbox).not.toBeDisabled();
      });

      // 点击复选框
      fireEvent.click(checkbox);

      expect(checkbox).toBeChecked();
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          target: expect.objectContaining({
            checked: true
          })
        })
      );
    });

    it('应该在倒计时期间忽略点击事件', () => {
      const onChange = vi.fn();
      renderCountdownCheckbox({ initialTime: 5, onChange });

      const checkbox = screen.getByRole('checkbox');

      // 尝试点击（应该被忽略）
      fireEvent.click(checkbox);

      expect(checkbox).not.toBeChecked();
      expect(onChange).not.toHaveBeenCalled();
    });

    it('应该支持受控模式', async () => {
      const onChange = vi.fn();
      const { rerender } = renderCountdownCheckbox({
        initialTime: 1,
        checked: false,
        onChange
      });

      // 完成倒计时
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      const checkbox = screen.getByRole('checkbox');
      
      await waitFor(() => {
        expect(checkbox).not.toBeDisabled();
      });

      expect(checkbox).not.toBeChecked();

      // 重新渲染为选中状态
      rerender(
        <TestWrapper>
          <CountdownCheckbox
            initialTime={1}
            checked={true}
            onChange={onChange}
            label="测试复选框"
          />
        </TestWrapper>
      );

      expect(screen.getByRole('checkbox')).toBeChecked();
    });
  });

  describe('可访问性', () => {
    it('应该提供适当的title提示', () => {
      renderCountdownCheckbox({ initialTime: 5 });

      const label = screen.getByText(/测试复选框\(5s\)/);
      const container = label.closest('label');
      
      expect(container).toHaveAttribute('title', '请等待 5s 后再确认');
    });

    it('应该在倒计时完成后更新title提示', async () => {
      renderCountdownCheckbox({ initialTime: 1 });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const label = screen.getByText('测试复选框');
        const container = label.closest('label');
        expect(container).toHaveAttribute('title', '点击确认已阅读');
      });
    });

    it('应该使用适当的语义HTML结构', () => {
      renderCountdownCheckbox();

      const checkbox = screen.getByRole('checkbox');
      const label = screen.getByText(/测试复选框/);
      
      expect(checkbox).toBeInTheDocument();
      expect(label.tagName).toBe('SPAN');
      expect(checkbox.closest('label')).toContainElement(label);
    });
  });

  describe('样式和视觉状态', () => {
    it('应该根据倒计时状态应用不同样式', () => {
      renderCountdownCheckbox({ initialTime: 5 });

      const checkbox = screen.getByRole('checkbox');
      const label = checkbox.closest('label');

      // 验证禁用状态的样式属性
      expect(label).toHaveStyle({ cursor: 'not-allowed' });
    });

    it('应该在倒计时完成后更新样式', async () => {
      renderCountdownCheckbox({ initialTime: 1 });

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox');
        const label = checkbox.closest('label');
        expect(label).toHaveStyle({ cursor: 'pointer' });
      });
    });

    it('应该接受自定义CSS类名和样式', () => {
      const customStyle = { fontSize: '20px' };
      renderCountdownCheckbox({
        className: 'custom-checkbox',
        style: customStyle
      });

      const label = screen.getByRole('checkbox').closest('label');
      expect(label).toHaveClass('countdown-checkbox', 'custom-checkbox');
      expect(label).toHaveStyle(customStyle);
    });
  });

  describe('边界情况', () => {
    it('应该处理非常大的初始时间', () => {
      renderCountdownCheckbox({ initialTime: 999999 });

      expect(screen.getByText(/999999s/)).toBeInTheDocument();
    });

    it('应该处理负数初始时间', async () => {
      renderCountdownCheckbox({ initialTime: -1 });

      const checkbox = screen.getByRole('checkbox');
      
      // 负数应该被当作0处理，立即启用
      await waitFor(() => {
        expect(checkbox).not.toBeDisabled();
      });
    });

    it('应该正确清理定时器', () => {
      const { unmount } = renderCountdownCheckbox({ initialTime: 10 });

      // 卸载组件不应该导致错误
      expect(() => unmount()).not.toThrow();
    });
  });
});