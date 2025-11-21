import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Page06_HeightAnalysis from '../Page06_HeightAnalysis';
import { DroneImagingProvider, useDroneImagingContext } from '../../context/DroneImagingContext';
import type { PageId } from '../../mapping';

function CurrentPageIdIndicator() {
  const { currentPageId } = useDroneImagingContext();
  return <div data-testid="current-page-id">{currentPageId}</div>;
}

function renderPage(initialPageId: PageId = 'height_analysis') {
  return render(
    <DroneImagingProvider initialPageId={initialPageId}>
      <CurrentPageIdIndicator />
      <Page06_HeightAnalysis />
    </DroneImagingProvider>
  );
}

describe('Page06_HeightAnalysis', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('初始渲染应展示高度分析问题和三个选项（对应说明书 Page 6 基础结构）', () => {
    renderPage();

    expect(screen.getByText('高度分析')).toBeInTheDocument();
    expect(screen.getByText('当镜头焦距相同时，飞行高度升高，GSD会如何变化？')).toBeInTheDocument();

    expect(screen.getByLabelText('A. 增大')).toBeInTheDocument();
    expect(screen.getByLabelText('B. 减小')).toBeInTheDocument();
    expect(screen.getByLabelText('C. 不变')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: '下一步' })).toBeInTheDocument();
  });

  it('未选择任何选项时点击“下一步”应提示错误并停留在本页（对应 Page 6 校验失败：“请选择一个答案后再继续”）', async () => {
    renderPage();

    const nextButton = screen.getByRole('button', { name: '下一步' });
    const currentPage = screen.getByTestId('current-page-id');

    expect(currentPage).toHaveTextContent('height_analysis');

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('请选择一个答案后再继续')).toBeInTheDocument();
    });
    expect(screen.getByTestId('current-page-id')).toHaveTextContent('height_analysis');
  });

  it('选择任一选项后点击“下一步”应进入结论页面（对应 Page 6 校验通过：answers[Q6_1] !== undefined）', async () => {
    renderPage();

    const optionA = screen.getByLabelText('A. 增大');
    const nextButton = screen.getByRole('button', { name: '下一步' });

    fireEvent.click(optionA);
    expect(optionA).toBeChecked();

    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-page-id')).toHaveTextContent('conclusion');
    });
  });
});

