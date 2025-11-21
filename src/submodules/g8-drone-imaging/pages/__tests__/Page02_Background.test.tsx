import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Page02_Background from '../Page02_Background';
import { DroneImagingProvider, useDroneImagingContext } from '../../context/DroneImagingContext';
import type { PageId } from '../../mapping';

function CurrentPageIdIndicator() {
  const { currentPageId } = useDroneImagingContext();
  return <div data-testid="current-page-id">{currentPageId}</div>;
}

function renderPage(initialPageId: PageId = 'background') {
  return render(
    <DroneImagingProvider initialPageId={initialPageId}>
      <CurrentPageIdIndicator />
      <Page02_Background />
    </DroneImagingProvider>
  );
}

describe('Page02_Background', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('初始渲染应展示背景知识标题和 GSD 说明（对应说明书 Page 2 基础结构）', () => {
    renderPage();

    expect(screen.getByText('背景知识')).toBeInTheDocument();
    expect(screen.getByText('什么是GSD?')).toBeInTheDocument();
    expect(screen.getByText('影响GSD的因素')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '下一步' })).toBeInTheDocument();
  });

  it('阅读计时未完成时“下一步”按钮应禁用，计时结束后解锁（对应 Page 2 校验：阅读时间 >= 5秒）', async () => {
    renderPage();

    const nextButton = screen.getByRole('button', { name: '下一步' });
    expect(nextButton).toBeDisabled();

    // 快进 5 秒完成阅读计时
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(screen.getByText('阅读完成，可以继续')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '下一步' })).not.toBeDisabled();
    });
  });

  it('阅读计时完成后点击“下一步”应跳转到假设页面（对应 Page 2 校验通过：允许继续）', async () => {
    renderPage();

    const nextButton = screen.getByRole('button', { name: '下一步' });
    const currentPage = screen.getByTestId('current-page-id');

    expect(currentPage).toHaveTextContent('background');

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(nextButton).not.toBeDisabled();
    });

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-page-id')).toHaveTextContent('hypothesis');
    });
  });
});

