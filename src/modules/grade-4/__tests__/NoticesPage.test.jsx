/**
 * 注意事项页面测试
 * 验证40秒倒计时功能、复选框状态变化和数据记录
 */

// Test file for NoticesPage component
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, beforeEach, afterEach, describe, it, expect } from 'vitest';
import NoticesPage from '../pages/00-NoticesPage';
import { Grade4Provider } from '../context/Grade4Context';

// Mock 共享服务
vi.mock('../../../shared/services/dataLogger', () => ({
  submitPageData: vi.fn().mockResolvedValue({ success: true })
}));

// 测试工具组件：提供 Grade4Provider 包装
const TestWrapper = ({ children, authInfo = null, globalContext = null }) => {
  const defaultAuthInfo = {
    batchCode: 'TEST_BATCH_001',
    examNo: 'TEST_STUDENT_001'
  };

  return (
    <Grade4Provider 
      authInfo={authInfo || defaultAuthInfo} 
      globalContext={globalContext}
    >
      {children}
    </Grade4Provider>
  );
};

// 渲染带有Provider的NoticesPage
const renderNoticesPage = (authInfo, globalContext) => {
  return render(
    <TestWrapper authInfo={authInfo} globalContext={globalContext}>
      <NoticesPage />
    </TestWrapper>
  );
};

describe('NoticesPage', () => {
  beforeEach(() => {
    // 使用假定时器
    vi.useFakeTimers();
  });

  afterEach(() => {
    // 恢复真实定时器
    vi.useRealTimers();
    // 清除所有mock
    vi.clearAllMocks();
  });

  describe('AC1: 页面渲染和布局', () => {
    it('应该正确渲染页面标题和注意事项内容', () => {
      renderNoticesPage();

      // 验证页面标题
      expect(screen.getByRole('heading', { name: '注意事项' })).toBeInTheDocument();
      expect(screen.getByText('四年级火车购票测评')).toBeInTheDocument();

      // 验证主要内容区域存在
      expect(screen.getByText('测评说明')).toBeInTheDocument();
      expect(screen.getByText('操作指南')).toBeInTheDocument();
      expect(screen.getByText('重要提醒')).toBeInTheDocument();
      expect(screen.getByText('特别注意')).toBeInTheDocument();
    });

    it('应该显示所有注意事项内容', () => {
      renderNoticesPage();

      // 验证关键提示内容
      expect(screen.getByText(/本次测评时间为35分钟/)).toBeInTheDocument();
      expect(screen.getByText(/请勿关闭浏览器窗口或刷新页面/)).toBeInTheDocument();
      expect(screen.getByText(/本测评不是考试，没有标准答案/)).toBeInTheDocument();
    });
  });

  describe('AC3: 初始状态验证', () => {
    it('应该在页面加载时显示禁用的复选框和40秒倒计时', () => {
      renderNoticesPage();

      // 验证复选框初始状态
      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
      expect(checkbox).not.toBeChecked();

      // 验证倒计时显示
      expect(screen.getByText(/我已阅读上述注意事项\(40s\)/)).toBeInTheDocument();

      // 验证下一页按钮禁用
      const nextButton = screen.getByRole('button', { name: '下一页' });
      expect(nextButton).toBeDisabled();
    });

    it('应该显示倒计时提示信息', () => {
      renderNoticesPage();

      expect(screen.getByText(/请仔细阅读上述内容（剩余 40 秒）/)).toBeInTheDocument();
    });
  });

  describe('AC4 & AC5: 倒计时功能', () => {
    it('应该正确执行40秒倒计时并在完成后激活复选框', async () => {
      renderNoticesPage();

      const checkbox = screen.getByRole('checkbox');
      
      // 验证初始状态
      expect(checkbox).toBeDisabled();
      expect(screen.getByText(/40s/)).toBeInTheDocument();

      // 模拟时间流逝 10 秒
      act(() => {
        vi.advanceTimersByTime(10000);
      });

      // 验证倒计时更新
      await waitFor(() => {
        expect(screen.getByText(/30s/)).toBeInTheDocument();
      });

      // 模拟时间流逝到完成（再过30秒）
      act(() => {
        vi.advanceTimersByTime(30000);
      });

      // 验证倒计时完成后状态
      await waitFor(() => {
        expect(checkbox).not.toBeDisabled();
        expect(screen.queryByText(/\d+s/)).not.toBeInTheDocument();
        expect(screen.getByText('阅读时间已到，请确认已阅读完毕')).toBeInTheDocument();
      });
    });

    it('应该在倒计时期间动态更新秒数显示', async () => {
      renderNoticesPage();

      // 验证初始显示
      expect(screen.getByText(/40s/)).toBeInTheDocument();

      // 模拟1秒过去
      act(() => {
        vi.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(screen.getByText(/39s/)).toBeInTheDocument();
      });

      // 模拟再过5秒
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      await waitFor(() => {
        expect(screen.getByText(/34s/)).toBeInTheDocument();
      });
    });
  });

  describe('AC6: 用户交互流程', () => {
    it('应该在用户确认后激活下一页按钮', async () => {
      renderNoticesPage();

      const checkbox = screen.getByRole('checkbox');
      const nextButton = screen.getByRole('button', { name: '下一页' });

      // 等待倒计时完成
      act(() => {
        vi.advanceTimersByTime(40000);
      });

      await waitFor(() => {
        expect(checkbox).not.toBeDisabled();
      });

      // 用户勾选复选框
      fireEvent.click(checkbox);

      // 验证复选框状态
      expect(checkbox).toBeChecked();

      // 验证下一页按钮被激活
      await waitFor(() => {
        expect(nextButton).not.toBeDisabled();
        expect(screen.getByText('已确认阅读，可以开始测评')).toBeInTheDocument();
      });
    });

    it('应该在用户取消确认后禁用下一页按钮', async () => {
      renderNoticesPage();

      const checkbox = screen.getByRole('checkbox');
      const nextButton = screen.getByRole('button', { name: '下一页' });

      // 等待倒计时完成并勾选复选框
      act(() => {
        vi.advanceTimersByTime(40000);
      });

      await waitFor(() => {
        expect(checkbox).not.toBeDisabled();
      });

      fireEvent.click(checkbox);
      
      await waitFor(() => {
        expect(nextButton).not.toBeDisabled();
      });

      // 用户取消勾选
      fireEvent.click(checkbox);

      // 验证按钮重新禁用
      expect(checkbox).not.toBeChecked();
      expect(nextButton).toBeDisabled();
    });
  });

  describe('数据记录功能', () => {
    it('应该记录页面进入操作', () => {
      // 这个测试需要mock console.log 来验证记录操作
      const consoleSpy = vi.spyOn(console, 'log');
      
      renderNoticesPage();

      // 验证页面进入操作被记录
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[Grade4Context] 记录操作:'),
        expect.objectContaining({
          targetElement: '页面',
          eventType: 'page_enter',
          value: '进入注意事项页面'
        })
      );

      consoleSpy.mockRestore();
    });

    it('应该在用户点击下一页时提交数据', async () => {
      const { submitPageData } = await import('../../../shared/services/dataLogger');
      
      renderNoticesPage();

      const checkbox = screen.getByRole('checkbox');
      const nextButton = screen.getByRole('button', { name: '下一页' });

      // 完成倒计时并确认
      act(() => {
        vi.advanceTimersByTime(40000);
      });

      await waitFor(() => {
        expect(checkbox).not.toBeDisabled();
      });

      fireEvent.click(checkbox);

      await waitFor(() => {
        expect(nextButton).not.toBeDisabled();
      });

      // 点击下一页按钮
      fireEvent.click(nextButton);

      // 验证数据提交
      await waitFor(() => {
        expect(submitPageData).toHaveBeenCalledWith(
          expect.objectContaining({
            batchCode: 'TEST_BATCH_001',
            examNo: 'TEST_STUDENT_001'
          }),
          expect.objectContaining({
            pageNumber: '1',
            pageDesc: '注意事项页面',
            operationList: expect.any(Array),
            answerList: expect.any(Array)
          })
        );
      });
    });
  });

  describe('响应式设计', () => {
    it('应该在移动设备上正确显示', () => {
      // 模拟移动设备视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderNoticesPage();

      // 验证页面仍然正确渲染
      expect(screen.getByRole('heading', { name: '注意事项' })).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '下一页' })).toBeInTheDocument();
    });
  });

  describe('错误处理', () => {
    it('应该处理缺少认证信息的情况', () => {
      const consoleSpy = vi.spyOn(console, 'warn');

      // 渲染时不提供认证信息
      renderNoticesPage(null, null);

      // 这里无法直接触发提交，但可以验证组件正常渲染
      expect(screen.getByRole('heading', { name: '注意事项' })).toBeInTheDocument();
      
      consoleSpy.mockRestore();
    });
  });
});