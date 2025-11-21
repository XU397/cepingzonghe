import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Page01_Cover from '../Page01_Cover';
import { DroneImagingProvider, useDroneImagingContext } from '../../context/DroneImagingContext';
import type { PageId } from '../../mapping';

// 在测试中辅助观察当前页面 ID，验证导航是否发生
function CurrentPageIdIndicator() {
  const { currentPageId } = useDroneImagingContext();
  return <div data-testid="current-page-id">{currentPageId}</div>;
}

function renderPage(initialPageId: PageId = 'cover') {
  return render(
    <DroneImagingProvider initialPageId={initialPageId}>
      <CurrentPageIdIndicator />
      <Page01_Cover />
    </DroneImagingProvider>
  );
}

describe('Page01_Cover', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('初始渲染应展示标题和注意事项区域（对应说明书封面页面基础结构）', () => {
    renderPage();

    expect(screen.getByText('无人机航拍交互课堂')).toBeInTheDocument();
    expect(screen.getByText('注意事项')).toBeInTheDocument();
    expect(screen.getByText('我已阅读并理解以上注意事项')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '开始学习' })).toBeInTheDocument();
  });

  it('未勾选确认复选框时点击“开始学习”应显示错误提示且停留在当前页（对应 Page 1 校验失败：提示“请先阅读注意事项并勾选确认后再继续”）', () => {
    renderPage();

    const currentPage = screen.getByTestId('current-page-id');
    const nextButton = screen.getByRole('button', { name: '开始学习' });

    expect(currentPage).toHaveTextContent('cover');

    fireEvent.click(nextButton);

    expect(screen.getByText('请先阅读注意事项并勾选确认后再继续')).toBeInTheDocument();
    expect(currentPage).toHaveTextContent('cover');
  });

  it('倒计时结束并勾选确认后，应允许进入背景页面（对应 Page 1 校验通过：倒计时结束 AND 勾选确认框）', async () => {
    renderPage();

    const checkbox = screen.getByRole('checkbox');

    // 初始倒计时内复选框应禁用
    expect(checkbox).toBeDisabled();

    // 快进 30 秒让倒计时结束
    act(() => {
      vi.advanceTimersByTime(30000);
    });

    await waitFor(() => {
      expect(screen.getByText('阅读完成')).toBeInTheDocument();
      expect(screen.getByRole('checkbox')).not.toBeDisabled();
    });

    // 勾选确认
    fireEvent.click(screen.getByRole('checkbox'));
    expect(screen.getByRole('checkbox')).toBeChecked();

    // 点击开始学习，触发导航
    fireEvent.click(screen.getByRole('button', { name: '开始学习' }));

    await waitFor(() => {
      expect(screen.getByTestId('current-page-id')).toHaveTextContent('background');
    });
  });
});

