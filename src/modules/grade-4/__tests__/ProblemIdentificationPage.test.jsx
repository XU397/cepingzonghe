/**
 * ProblemIdentificationPage 组件测试
 * 验证问题识别页面的功能和交互
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ProblemIdentificationPage from '../pages/02-ProblemIdentificationPage';
import { Grade4Provider } from '../context/Grade4Context';

// Mock the Grade4Context
const mockGrade4Context = {
  logOperation: vi.fn(),
  collectAnswer: vi.fn(),
  setCurrentPage: vi.fn(),
  setNavigationStep: vi.fn(),
  setProblemStatement: vi.fn(),
  problemStatement: '',
  submitCurrentPageData: vi.fn(),
  formatTimestamp: vi.fn(() => '2025-07-26 15:35:00'),
};

// Mock useGrade4Context hook
vi.mock('../context/Grade4Context', async () => {
  const actual = await vi.importActual('../context/Grade4Context');
  return {
    ...actual,
    useGrade4Context: () => mockGrade4Context,
  };
});

describe('ProblemIdentificationPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确渲染问题识别页面', () => {
    render(
      <Grade4Provider>
        <ProblemIdentificationPage />
      </Grade4Provider>
    );
    
    // 验证页面标题
    expect(screen.getByText('问题识别')).toBeInTheDocument();
    expect(screen.getByText('四年级火车购票测评')).toBeInTheDocument();
    
    // 验证对话界面
    expect(screen.getByText('假期安排讨论群')).toBeInTheDocument();
    const chatImage = screen.getByAltText('假期安排讨论群对话');
    expect(chatImage).toBeInTheDocument();
    expect(chatImage).toHaveAttribute('src', '/src/assets/images/g4-p2-talk.png');
    
    // 验证问题提示
    expect(screen.getByText(/根据上面的对话，你认为小明需要解决什么问题/)).toBeInTheDocument();
    
    // 验证文本输入框
    const textArea = screen.getByPlaceholderText('请在此处输入你的回答...');
    expect(textArea).toBeInTheDocument();
    
    // 验证下一页按钮初始状态为禁用
    const nextButton = screen.getByText('下一页');
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).toBeDisabled();
  });

  it('应该在页面加载时设置正确的状态', () => {
    render(
      <Grade4Provider>
        <ProblemIdentificationPage />
      </Grade4Provider>
    );
    
    // 验证页面设置
    expect(mockGrade4Context.setCurrentPage).toHaveBeenCalledWith(3);
    expect(mockGrade4Context.setNavigationStep).toHaveBeenCalledWith('2');
    
    // 验证页面进入记录
    expect(mockGrade4Context.logOperation).toHaveBeenCalledWith({
      targetElement: '页面',
      eventType: 'page_enter',
      value: '进入问题识别页面'
    });
  });

  it('应该正确处理用户输入', async () => {
    const user = userEvent.setup();
    
    render(
      <Grade4Provider>
        <ProblemIdentificationPage />
      </Grade4Provider>
    );
    
    const textArea = screen.getByPlaceholderText('请在此处输入你的回答...');
    const nextButton = screen.getByText('下一页');
    
    // 初始状态：按钮禁用
    expect(nextButton).toBeDisabled();
    
    // 输入文本
    const testInput = '小明需要制定火车出行计划';
    await user.type(textArea, testInput);
    
    // 验证输入被记录
    expect(mockGrade4Context.setProblemStatement).toHaveBeenCalledWith(testInput);
    expect(mockGrade4Context.logOperation).toHaveBeenCalledWith({
      targetElement: '问题识别文本框',
      eventType: 'text_input',
      value: `用户输入：${testInput}`
    });
    
    // 验证按钮变为启用状态
    await waitFor(() => {
      expect(nextButton).not.toBeDisabled();
    });
    
    // 验证输入内容显示
    expect(textArea).toHaveValue(testInput);
  });

  it('应该在用户删除内容后禁用按钮', async () => {
    const user = userEvent.setup();
    
    render(
      <Grade4Provider>
        <ProblemIdentificationPage />
      </Grade4Provider>
    );
    
    const textArea = screen.getByPlaceholderText('请在此处输入你的回答...');
    const nextButton = screen.getByText('下一页');
    
    // 输入文本
    await user.type(textArea, '测试文本');
    await waitFor(() => {
      expect(nextButton).not.toBeDisabled();
    });
    
    // 清空输入
    await user.clear(textArea);
    
    // 验证按钮重新禁用
    await waitFor(() => {
      expect(nextButton).toBeDisabled();
    });
  });

  it('应该在提交时收集答案并导航', async () => {
    mockGrade4Context.submitCurrentPageData.mockResolvedValue();
    
    const user = userEvent.setup();
    
    render(
      <Grade4Provider>
        <ProblemIdentificationPage />
      </Grade4Provider>
    );
    
    const textArea = screen.getByPlaceholderText('请在此处输入你的回答...');
    const testInput = '小明需要制定火车出行计划';
    
    // 输入文本
    await user.type(textArea, testInput);
    
    // 等待按钮启用并点击
    const nextButton = screen.getByText('下一页');
    await waitFor(() => {
      expect(nextButton).not.toBeDisabled();
    });
    
    fireEvent.click(nextButton);
    
    // 验证操作记录
    expect(mockGrade4Context.logOperation).toHaveBeenCalledWith({
      targetElement: '下一页按钮',
      eventType: 'button_click',
      value: '点击提交问题识别答案并进入下一页'
    });
    
    // 验证答案收集
    expect(mockGrade4Context.collectAnswer).toHaveBeenCalledWith({
      targetElement: '小明需要解决的问题',
      value: testInput
    });
    
    // 验证数据提交
    await waitFor(() => {
      expect(mockGrade4Context.submitCurrentPageData).toHaveBeenCalled();
    });
  });

  it('应该显示字符计数', async () => {
    const user = userEvent.setup();
    
    render(
      <Grade4Provider>
        <ProblemIdentificationPage />
      </Grade4Provider>
    );
    
    const textArea = screen.getByPlaceholderText('请在此处输入你的回答...');
    
    // 初始状态
    expect(screen.getByText('已输入 0 个字符')).toBeInTheDocument();
    
    // 输入文本
    const testInput = '测试';
    await user.type(textArea, testInput);
    
    // 验证字符计数更新
    expect(screen.getByText('已输入 2 个字符')).toBeInTheDocument();
  });

  it('应该在输入为空时显示警告', () => {
    render(
      <Grade4Provider>
        <ProblemIdentificationPage />
      </Grade4Provider>
    );
    
    // 验证警告文本
    expect(screen.getByText('请输入您的回答')).toBeInTheDocument();
  });

  it('应该显示正确的导航高亮状态', () => {
    render(
      <Grade4Provider>
        <ProblemIdentificationPage />
      </Grade4Provider>
    );
    
    // 验证导航项
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    
    // 验证第2项高亮（问题识别页面）
    const secondNavItem = screen.getByText('2').closest('.nav-item');
    expect(secondNavItem).toHaveClass('highlighted');
  });

  it('应该在数据提交失败时显示错误', async () => {
    mockGrade4Context.submitCurrentPageData.mockRejectedValue(new Error('提交失败'));
    
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    const user = userEvent.setup();
    
    render(
      <Grade4Provider>
        <ProblemIdentificationPage />
      </Grade4Provider>
    );
    
    const textArea = screen.getByPlaceholderText('请在此处输入你的回答...');
    await user.type(textArea, '测试答案');
    
    const nextButton = screen.getByText('下一页');
    await waitFor(() => {
      expect(nextButton).not.toBeDisabled();
    });
    
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('数据提交失败，请重试');
    });
    
    alertSpy.mockRestore();
  });
});