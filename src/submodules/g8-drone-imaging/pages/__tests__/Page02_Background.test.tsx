import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Page02_Background from '../Page02_Background';
import { DroneImagingProvider, useDroneImagingContext } from '../../context/DroneImagingContext';
import type { PageId } from '../../mapping';
import { EventTypes } from '@shared/services/submission/eventTypes';

function CurrentPageIdIndicator() {
  const { currentPageId } = useDroneImagingContext();
  return <div data-testid="current-page-id">{currentPageId}</div>;
}

function FrameNextButton() {
  const { navigateToPage, operations } = useDroneImagingContext();
  const canProceed = operations.some(
    (op) =>
      op.eventType === EventTypes.READING_COMPLETE &&
      (op.value === 'Page02_Background' || op.targetElement === 'page'),
  );

  return (
    <button
      type="button"
      data-testid="frame-next-button"
      onClick={() => navigateToPage('hypothesis')}
      disabled={!canProceed}
      aria-label="下一步"
    >
      下一步
    </button>
  );
}

function renderPage(initialPageId: PageId = 'background') {
  return render(
    <DroneImagingProvider initialPageId={initialPageId}>
      <CurrentPageIdIndicator />
      <Page02_Background />
      <FrameNextButton />
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

  it('初始渲染应展示航拍背景介绍和阅读计时器（对应说明书 Page 2 基础结构）', () => {
    renderPage();

    expect(screen.getByText('无人机航拍')).toBeInTheDocument();
    expect(screen.getByText('请阅读以下内容')).toBeInTheDocument();
    expect(
      screen.getByText(/无人机航拍技术是一种高效、灵活的遥感探测手段/),
    ).toBeInTheDocument();
    expect(screen.getByTestId('timer-count')).toHaveTextContent('5秒');
  });

  it('阅读计时未完成时“下一步”按钮应禁用，计时结束后解锁（对应 Page 2 校验：阅读时间 >= 5秒）', async () => {
    renderPage();

    const nextButton = screen.getByTestId('frame-next-button');
    expect(nextButton).toBeDisabled();

    // 快进 5 秒完成阅读计时
    for (let i = 0; i < 5; i += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    }

    expect(screen.getByText('阅读完成，可以继续')).toBeInTheDocument();
    expect(screen.getByTestId('frame-next-button')).not.toBeDisabled();
  });

  it('阅读计时完成后点击“下一步”应跳转到假设页面（对应 Page 2 校验通过：允许继续）', async () => {
    renderPage();

    const nextButton = screen.getByTestId('frame-next-button');
    const currentPage = screen.getByTestId('current-page-id');

    expect(currentPage).toHaveTextContent('background');

    for (let i = 0; i < 5; i += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1000);
      });
    }

    expect(nextButton).not.toBeDisabled();

    fireEvent.click(nextButton);

    vi.useRealTimers();
    await waitFor(() => {
      expect(screen.getByTestId('current-page-id')).toHaveTextContent('hypothesis');
    });
  });
});
