import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Page04_ExperimentFree from '../Page04_ExperimentFree';
import { DroneImagingProvider, useDroneImagingContext } from '../../context/DroneImagingContext';
import type { PageId } from '../../mapping';

function CurrentPageIdIndicator() {
  const { currentPageId } = useDroneImagingContext();
  return <div data-testid="current-page-id">{currentPageId}</div>;
}

function FrameNextButton() {
  const { experimentState, navigateToPage } = useDroneImagingContext();
  const canProceed = experimentState.captureHistory.length > 0;

  return (
    <button
      type="button"
      data-testid="frame-next-button"
      onClick={() => navigateToPage('focal_analysis')}
      disabled={!canProceed}
    >
      下一步
    </button>
  );
}

function renderPage(initialPageId: PageId = 'experiment_free') {
  return render(
    <DroneImagingProvider initialPageId={initialPageId}>
      <CurrentPageIdIndicator />
      <Page04_ExperimentFree />
      <FrameNextButton />
    </DroneImagingProvider>
  );
}

describe('Page04_ExperimentFree', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('初始渲染应展示自由探索实验界面和控制按钮（对应说明书 Page 4 基础结构）', () => {
    renderPage();

    expect(screen.getByText('自由探索实验')).toBeInTheDocument();
    expect(
      screen.getByText('接下来，我们将在计算机上通过模拟实验的方式开展探究。右侧为实验互动界面。'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置实验' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '拍照记录' })).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeInTheDocument();
  });

  it('未完成拍照时应阻止进入下一页，完成一次拍照后允许继续（对应 Page 4 校验规则：需至少一次实验操作）', async () => {
    renderPage();

    const nextButton = screen.getByTestId('next-button');
    const frameNextButton = screen.getByTestId('frame-next-button');
    const currentPage = screen.getByTestId('current-page-id');

    expect(currentPage).toHaveTextContent('experiment_free');
    expect(frameNextButton).toBeDisabled();

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('请至少完成一次实验操作后再继续')).toBeInTheDocument();
      expect(screen.getByTestId('current-page-id')).toHaveTextContent('experiment_free');
    });

    // 完成一次拍照
    fireEvent.click(screen.getByRole('button', { name: '设置飞行高度为100米' }));

    const captureButton = screen.getByTestId('capture-button');
    expect(captureButton).not.toBeDisabled();
    fireEvent.click(captureButton);

    await waitFor(() => {
      expect(screen.queryByTestId('error-message')).not.toBeInTheDocument();
      expect(screen.getByTestId('frame-next-button')).not.toBeDisabled();
    });

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-page-id')).toHaveTextContent('focal_analysis');
    });
  });
});
