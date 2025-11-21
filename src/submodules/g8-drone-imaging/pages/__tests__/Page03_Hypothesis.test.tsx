import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Page03_Hypothesis from '../Page03_Hypothesis';
import { DroneImagingProvider, useDroneImagingContext } from '../../context/DroneImagingContext';
import type { PageId } from '../../mapping';

function CurrentPageIdIndicator() {
  const { currentPageId } = useDroneImagingContext();
  return <div data-testid="current-page-id">{currentPageId}</div>;
}

function renderPage(initialPageId: PageId = 'hypothesis') {
  return render(
    <DroneImagingProvider initialPageId={initialPageId}>
      <CurrentPageIdIndicator />
      <Page03_Hypothesis />
    </DroneImagingProvider>
  );
}

describe('Page03_Hypothesis', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('初始渲染应展示“提出假设”标题和文本输入区域（对应说明书 Page 3 基础结构）', () => {
    renderPage();

    expect(screen.getByText('提出假设')).toBeInTheDocument();
    expect(screen.getByText('思考： 飞行高度和镜头焦距如何影响GSD？')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请写下你的假设...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '开始实验' })).toBeInTheDocument();
  });

  it('输入少于或等于 5 个字符时点击“开始实验”应提示错误并停留在当前页（对应 Page 3 校验失败：“请输入至少5个字符的思考内容”）', async () => {
    renderPage();

    const textarea = screen.getByPlaceholderText('请写下你的假设...');
    const nextButton = screen.getByRole('button', { name: '开始实验' });
    const currentPage = screen.getByTestId('current-page-id');

    expect(currentPage).toHaveTextContent('hypothesis');

    fireEvent.change(textarea, { target: { value: '测试' } });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('请输入至少5个字符的思考内容')).toBeInTheDocument();
    });
    expect(screen.getByTestId('current-page-id')).toHaveTextContent('hypothesis');
  });

  it('输入超过 5 个字符后可以进入实验页面（对应 Page 3 校验通过：answers[Q3_1].length > 5）', async () => {
    renderPage();

    const textarea = screen.getByPlaceholderText('请写下你的假设...');
    const nextButton = screen.getByRole('button', { name: '开始实验' });

    fireEvent.change(textarea, { target: { value: '这是一个超过五个字的假设内容' } });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-page-id')).toHaveTextContent('experiment_free');
    });
  });
});

