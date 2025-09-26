/**
 * ScenarioIntroPage 组件测试
 * 验证情景介绍页面的功能和交互
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ScenarioIntroPage from '../pages/01-ScenarioIntroPage';
import { Grade4Provider } from '../context/Grade4Context';

// Mock the Grade4Context
const mockGrade4Context = {
  logOperation: vi.fn(),
  setCurrentPage: vi.fn(),
  setNavigationStep: vi.fn(),
  submitCurrentPageData: vi.fn(),
  navigateToPage: vi.fn(),
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

describe('ScenarioIntroPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确渲染情景介绍页面', () => {
    render(
      <Grade4Provider>
        <ScenarioIntroPage />
      </Grade4Provider>
    );
    
    // 验证页面标题
    expect(screen.getByText('情景介绍')).toBeInTheDocument();
    expect(screen.getByText('四年级火车购票测评')).toBeInTheDocument();
    
    // 验证形象图片
    const scenarioImage = screen.getByAltText('情景介绍形象图');
    expect(scenarioImage).toBeInTheDocument();
    expect(scenarioImage).toHaveAttribute('src', '/src/assets/images/g4-p1-xx.png');
    
    // 验证引言文本存在
    expect(screen.getByText(/暑假即将到来/)).toBeInTheDocument();
    expect(screen.getByText(/在这个测评中，你将帮助小明一家/)).toBeInTheDocument();
    
    // 验证下一页按钮
    const nextButton = screen.getByText('下一页');
    expect(nextButton).toBeInTheDocument();
    expect(nextButton).not.toBeDisabled();
  });

  it('应该在页面加载时记录进入操作', () => {
    render(
      <Grade4Provider>
        <ScenarioIntroPage />
      </Grade4Provider>
    );
    
    // 验证页面设置调用
    expect(mockGrade4Context.setCurrentPage).toHaveBeenCalledWith(2);
    expect(mockGrade4Context.setNavigationStep).toHaveBeenCalledWith('1');
    
    // 验证操作记录
    expect(mockGrade4Context.logOperation).toHaveBeenCalledWith({
      targetElement: '页面',
      eventType: 'page_enter',
      value: '进入情景介绍页面'
    });
  });

  it('应该在点击下一页按钮时提交数据并导航', async () => {
    mockGrade4Context.submitCurrentPageData.mockResolvedValue();
    
    render(
      <Grade4Provider>
        <ScenarioIntroPage />
      </Grade4Provider>
    );
    
    const nextButton = screen.getByText('下一页');
    fireEvent.click(nextButton);
    
    // 验证点击操作记录
    expect(mockGrade4Context.logOperation).toHaveBeenCalledWith({
      targetElement: '下一页按钮',
      eventType: 'button_click',
      value: '点击进入问题识别页面'
    });
    
    // 等待异步操作完成
    await waitFor(() => {
      expect(mockGrade4Context.submitCurrentPageData).toHaveBeenCalled();
      expect(mockGrade4Context.navigateToPage).toHaveBeenCalledWith('problem-identification');
    });
  });

  it('应该在数据提交失败时显示错误提示', async () => {
    mockGrade4Context.submitCurrentPageData.mockRejectedValue(new Error('提交失败'));
    
    // Mock window.alert
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    render(
      <Grade4Provider>
        <ScenarioIntroPage />
      </Grade4Provider>
    );
    
    const nextButton = screen.getByText('下一页');
    fireEvent.click(nextButton);
    
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('数据提交失败，请重试');
    });
    
    alertSpy.mockRestore();
  });

  it('应该包含完整的左侧导航栏', () => {
    render(
      <Grade4Provider>
        <ScenarioIntroPage />
      </Grade4Provider>
    );
    
    // 验证导航项存在
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    
    // 验证第1项高亮
    const firstNavItem = screen.getByText('1').closest('.nav-item');
    expect(firstNavItem).toHaveClass('highlighted');
  });

  it('应该具有响应式布局', () => {
    render(
      <Grade4Provider>
        <ScenarioIntroPage />
      </Grade4Provider>
    );
    
    // 验证主要布局容器
    expect(screen.getByText('情景介绍').closest('.scenario-container')).toBeInTheDocument();
    expect(screen.getByText('下一页').closest('.navigation-area')).toBeInTheDocument();
  });
});