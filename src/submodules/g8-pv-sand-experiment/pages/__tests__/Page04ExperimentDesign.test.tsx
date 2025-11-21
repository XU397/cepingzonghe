/**
 * @file Page04ExperimentDesign.test.tsx
 * @description 实验设计页面组件测试
 * @author Claude (Test Infrastructure)
 * @created 2025-11-19
 * 
 * 测试覆盖:
 * - 页面渲染和交互
 * - 表单验证逻辑
 * - 答案收集和保存
 * - 页面导航流程
 * - 可访问性支持
 * - 错误处理
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Page04ExperimentDesign from '../Page04ExperimentDesign';
import { 
  renderWithPvSandContext,
  setupPage04Scenario,
  expectOperationLogged,
  expectAnswerCollected,
  expectPageNavigation
} from '../../__tests__/testUtils.jsx';

// Mock子组件
vi.mock('../../components/ExperimentPanel', () => ({
  default: ({ onComplete }: any) => (
    <div data-testid="experiment-panel">
      <button onClick={onComplete} data-testid="experiment-complete">
        Complete Experiment
      </button>
    </div>
  )
}));

describe('Page04ExperimentDesign 页面测试', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('基础页面渲染', () => {
    it('应该正确渲染页面结构', () => {
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      expect(screen.getByRole('main')).toHaveAccessibleName('实验方案设计');
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('实验方案设计');
      expect(screen.getByText(/请设计实验方案/)).toBeInTheDocument();
    });

    it('应该显示实验背景信息', () => {
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      expect(screen.getByRole('region', { name: '实验背景' })).toBeInTheDocument();
      expect(screen.getByText(/光伏治沙是一种新兴的生态修复技术/)).toBeInTheDocument();
      expect(screen.getByText(/不同高度的光伏板对风沙的影响/)).toBeInTheDocument();
    });

    it('应该显示实验设计表单', () => {
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      expect(screen.getByRole('form', { name: '实验设计表单' })).toBeInTheDocument();
      expect(screen.getByRole('textbox', { name: /设计原因/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '提交设计方案' })).toBeInTheDocument();
    });
  });

  describe('表单交互和验证', () => {
    it('应该支持输入实验设计原因', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      const testInput = '测试不同高度光伏板对风沙流动的影响效果';
      
      await user.type(textarea, testInput);

      expect(textarea).toHaveValue(testInput);
      
      expectOperationLogged(contextValue.logOperation, {
        targetElement: '实验设计原因输入框',
        eventType: 'change',
        value: expect.stringContaining(testInput)
      });
    });

    it('应该实时显示字符计数', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      await user.type(textarea, 'hello');

      expect(screen.getByText('5/200 字符')).toBeInTheDocument();
    });

    it('应该验证最小字符数要求', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      const submitButton = screen.getByRole('button', { name: '提交设计方案' });

      // 输入不足5个字符
      await user.type(textarea, 'abc');
      await user.click(submitButton);

      expect(screen.getByRole('alert')).toHaveTextContent(
        '设计原因至少需要5个字符'
      );
      expect(submitButton).toBeDisabled();
    });

    it('应该验证最大字符数限制', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      const longText = 'a'.repeat(201); // 超过200字符限制

      await user.type(textarea, longText);

      expect(screen.getByRole('alert')).toHaveTextContent(
        '设计原因不能超过200个字符'
      );
      expect(screen.getByText('201/200 字符')).toHaveClass('text-error');
    });

    it('应该在有效输入时启用提交按钮', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      const submitButton = screen.getByRole('button', { name: '提交设计方案' });

      expect(submitButton).toBeDisabled();

      await user.type(textarea, '测试光伏板高度对风沙流动的影响');

      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('数据保存和恢复', () => {
    it('应该保存输入内容到答案草稿', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      await user.type(textarea, '测试实验设计原因');

      // 验证updateAnswerDraft被调用
      expect(contextValue.updateAnswerDraft).toHaveBeenCalledWith(
        expect.objectContaining({
          experimentAnswers: expect.objectContaining({
            designReason: expect.stringContaining('测试实验设计原因')
          })
        })
      );
    });

    it('应该从答案草稿恢复之前的输入', () => {
      const contextValue = setupPage04Scenario();
      contextValue.answerDraft.experimentAnswers.designReason = '之前保存的设计原因';
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      expect(textarea).toHaveValue('之前保存的设计原因');
    });

    it('应该在页面卸载时自动保存', () => {
      const contextValue = setupPage04Scenario();
      
      const { unmount } = renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      unmount();

      expectOperationLogged(contextValue.logOperation, {
        targetElement: '页面',
        eventType: 'page_exit',
        value: 'Page_04_ExperimentDesign'
      });
    });
  });

  describe('页面导航', () => {
    it('成功提交后应该导航到下一页', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      const submitButton = screen.getByRole('button', { name: '提交设计方案' });

      await user.type(textarea, '完整的实验设计原因描述');
      await user.click(submitButton);

      await waitFor(() => {
        expectPageNavigation(contextValue.navigateToPage, 'page05-tutorial');
      });

      expectAnswerCollected(contextValue.collectAnswer, {
        targetElement: 'P4_实验设计问题1',
        value: expect.stringContaining('完整的实验设计原因描述')
      });
    });

    it('应该支持返回上一页', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const backButton = screen.getByRole('button', { name: '返回上一页' });
      await user.click(backButton);

      expectPageNavigation(contextValue.navigateToPage, 'page03-background');
    });

    it('应该在导航前确认未保存的更改', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      await user.type(textarea, '未保存的内容');

      const backButton = screen.getByRole('button', { name: '返回上一页' });
      await user.click(backButton);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('您有未保存的更改')).toBeInTheDocument();
    });
  });

  describe('可访问性支持', () => {
    it('应该具有适当的ARIA标签', () => {
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const main = screen.getByRole('main');
      expect(main).toHaveAccessibleName('实验方案设计');
      
      const form = screen.getByRole('form');
      expect(form).toHaveAccessibleName('实验设计表单');
      
      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      expect(textarea).toHaveAccessibleDescription();
    });

    it('应该支持键盘导航', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      // Tab导航
      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('textbox', { name: /设计原因/ }));

      await user.tab();
      expect(document.activeElement).toBe(screen.getByRole('button', { name: '提交设计方案' }));
    });

    it('应该为屏幕阅读器提供状态更新', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      await user.type(textarea, 'abc');

      const status = screen.getByRole('status');
      expect(status).toHaveTextContent('当前输入3个字符，需要至少5个字符');
    });

    it('应该支持高对比度模式', () => {
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query === '(prefers-contrast: high)',
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      });

      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const main = screen.getByRole('main');
      expect(main).toHaveAttribute('data-high-contrast', 'true');
    });
  });

  describe('错误处理', () => {
    it('应该处理网络错误', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      contextValue.collectAnswer = vi.fn().mockRejectedValue(new Error('Network error'));
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      const submitButton = screen.getByRole('button', { name: '提交设计方案' });

      await user.type(textarea, '有效的设计原因');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          '保存失败，请检查网络连接后重试'
        );
      });
    });

    it('应该处理无效的上下文状态', () => {
      const invalidContextValue = setupPage04Scenario();
      invalidContextValue.answerDraft = null as any;
      
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue: invalidContextValue }
      );

      expect(screen.getByRole('alert')).toHaveTextContent('页面加载错误，请刷新重试');
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });

    it('应该处理表单验证错误', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      
      // 输入特殊字符和HTML标签
      await user.type(textarea, '<script>alert("xss")</script>');

      expect(screen.getByRole('alert')).toHaveTextContent(
        '输入内容包含不允许的字符'
      );
    });
  });

  describe('用户体验优化', () => {
    it('应该提供输入提示和建议', () => {
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      expect(screen.getByText(/可以从以下角度思考/)).toBeInTheDocument();
      expect(screen.getByText(/风速对沙尘的影响/)).toBeInTheDocument();
      expect(screen.getByText(/光伏板高度的作用/)).toBeInTheDocument();
    });

    it('应该显示进度指示器', () => {
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '4');
      expect(screen.getByText('第4步，共8步')).toBeInTheDocument();
    });

    it('应该自动保存草稿', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      await user.type(textarea, '自动保存测试');

      // 等待自动保存
      await waitFor(() => {
        expect(screen.getByText('已自动保存')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('应该支持撤销和重做', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      
      await user.type(textarea, '原始内容');
      await user.clear(textarea);
      await user.type(textarea, '修改后内容');

      // Ctrl+Z撤销
      await user.keyboard('{Control>}z{/Control}');
      expect(textarea).toHaveValue('原始内容');

      // Ctrl+Y重做
      await user.keyboard('{Control>}y{/Control}');
      expect(textarea).toHaveValue('修改后内容');
    });
  });

  describe('性能测试', () => {
    it('应该防抖输入处理', async () => {
      const user = userEvent.setup();
      const contextValue = setupPage04Scenario();
      
      renderWithPvSandContext(
        <Page04ExperimentDesign />, 
        { contextValue }
      );

      const textarea = screen.getByRole('textbox', { name: /设计原因/ });
      
      // 快速输入
      await user.type(textarea, 'abcdefg', { delay: 10 });

      // updateAnswerDraft应该被防抖，不会每个字符都调用
      expect(contextValue.updateAnswerDraft.mock.calls.length).toBeLessThan(7);
    });

    it('应该优化重新渲染', () => {
      const renderSpy = vi.fn();
      
      const TestPage = () => {
        renderSpy();
        return <Page04ExperimentDesign />;
      };

      const contextValue = setupPage04Scenario();
      const { rerender } = renderWithPvSandContext(
        <TestPage />, 
        { contextValue }
      );

      // 相同props的重新渲染
      rerender(<TestPage />);

      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });
});