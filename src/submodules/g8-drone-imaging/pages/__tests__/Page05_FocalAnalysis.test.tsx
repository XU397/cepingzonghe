import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Page05_FocalAnalysis from '../Page05_FocalAnalysis';
import { DroneImagingProvider, useDroneImagingContext } from '../../context/DroneImagingContext';
import type { PageId } from '../../mapping';

function CurrentPageIdIndicator() {
  const { currentPageId } = useDroneImagingContext();
  return <div data-testid="current-page-id">{currentPageId}</div>;
}

function renderPage(initialPageId: PageId = 'focal_analysis') {
  return render(
    <DroneImagingProvider initialPageId={initialPageId}>
      <CurrentPageIdIndicator />
      <Page05_FocalAnalysis />
    </DroneImagingProvider>
  );
}

describe('Page05_FocalAnalysis', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('初始渲染应展示焦距分析问题和三个选项（对应说明书 Page 5 基础结构）', () => {
    renderPage();

    expect(screen.getByText('焦距分析')).toBeInTheDocument();
    expect(screen.getByText('当飞行高度相同时，哪种焦距的GSD最小？')).toBeInTheDocument();

    expect(screen.getByLabelText('A. 8毫米')).toBeInTheDocument();
    expect(screen.getByLabelText('B. 24毫米')).toBeInTheDocument();
    expect(screen.getByLabelText('C. 50毫米')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: '下一步' })).toBeInTheDocument();
  });

  it('未选择任何选项时点击“下一步”应提示错误并停留在本页（对应 Page 5 校验失败：“请选择一个答案后再继续”）', async () => {
    renderPage();

    const nextButton = screen.getByRole('button', { name: '下一步' });
    const currentPage = screen.getByTestId('current-page-id');

    expect(currentPage).toHaveTextContent('focal_analysis');

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('请选择一个答案后再继续')).toBeInTheDocument();
    });
    expect(screen.getByTestId('current-page-id')).toHaveTextContent('focal_analysis');
  });

  it('选择任一选项后点击“下一步”应进入高度分析页面（对应 Page 5 校验通过：answers[Q5_1] !== undefined）', async () => {
    renderPage();

    const optionC = screen.getByLabelText('C. 50毫米');
    const nextButton = screen.getByRole('button', { name: '下一步' });

    fireEvent.click(optionC);
    expect(optionC).toBeChecked();

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-page-id')).toHaveTextContent('height_analysis');
    });
  });
});

