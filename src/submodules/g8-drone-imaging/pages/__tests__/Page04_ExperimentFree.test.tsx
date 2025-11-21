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

function renderPage(initialPageId: PageId = 'experiment_free') {
  return render(
    <DroneImagingProvider initialPageId={initialPageId}>
      <CurrentPageIdIndicator />
      <Page04_ExperimentFree />
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
    expect(screen.getByText('操作说明')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '重置实验' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '拍照记录' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '继续下一页' })).toBeInTheDocument();
  });

  it('无强制校验时应始终允许点击“下一步”进入焦距分析页面（对应 Page 4 校验规则：无强制要求）', async () => {
    renderPage();

    const nextButton = screen.getByRole('button', { name: '继续下一页' });
    const currentPage = screen.getByTestId('current-page-id');

    expect(currentPage).toHaveTextContent('experiment_free');
    expect(nextButton).not.toBeDisabled();

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-page-id')).toHaveTextContent('focal_analysis');
    });
  });
});
