import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Page03_Hypothesis from '../Page03_Hypothesis';
import { DroneImagingProvider, useDroneImagingContext } from '../../context/DroneImagingContext';
import type { PageId } from '../../mapping';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';

function CurrentPageIdIndicator() {
  const { currentPageId } = useDroneImagingContext();
  return <div data-testid="current-page-id">{currentPageId}</div>;
}

function FrameNextButton() {
  const { navigateToPage } = useDroneImagingContext();

  return (
    <button
      type="button"
      data-testid="frame-next-button"
      onClick={() => navigateToPage('experiment_free')}
    >
      下一步
    </button>
  );
}

function renderPage(initialPageId: PageId = 'hypothesis') {
  return render(
    <DroneImagingProvider initialPageId={initialPageId}>
      <CurrentPageIdIndicator />
      <Page03_Hypothesis />
      <FrameNextButton />
    </DroneImagingProvider>
  );
}

const STEP_INDEX = 0;
const HYPOTHESIS_PREFIX = `P${encodeCompositePageNum(STEP_INDEX + 1, 3)}_`;
const CONTROL_VARIABLE_REASON_ID = `${HYPOTHESIS_PREFIX}控制变量理由`;

describe('Page03_Hypothesis', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('初始渲染应展示航拍背景提示和假设输入区域（对应说明书 Page 3 基础结构）', () => {
    renderPage();

    expect(screen.getByText('无人机航拍')).toBeInTheDocument();
    expect(
      screen.getByText(/本实验旨在探究飞行高度与镜头焦距对无人机地面采样距离/),
    ).toBeInTheDocument();
    expect(screen.getByText('问题1：', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByPlaceholderText('请写下你的假设...')).toBeInTheDocument();
    expect(screen.getByTestId('next-button')).toBeInTheDocument();
  });

  it('输入少于或等于 5 个字符时点击“开始实验”应提示错误并停留在当前页（对应 Page 3 校验失败：“请输入至少5个字符的思考内容”）', async () => {
    renderPage();

    const textarea = screen.getByPlaceholderText('请写下你的假设...');
    const nextButton = screen.getByTestId('next-button');
    const currentPage = screen.getByTestId('current-page-id');

    expect(currentPage).toHaveTextContent('hypothesis');

    fireEvent.change(textarea, { target: { value: '测试' } });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('请输入至少5个字符的思考内容')).toBeInTheDocument();
    });
    expect(screen.getByTestId('current-page-id')).toHaveTextContent('hypothesis');
  });

  it(`输入超过 5 个字符后可以进入实验页面（对应 Page 3 校验通过：answers[${CONTROL_VARIABLE_REASON_ID}].length > 5）`, async () => {
    renderPage();

    const textarea = screen.getByPlaceholderText('请写下你的假设...');
    const nextButton = screen.getByTestId('next-button');

    fireEvent.change(textarea, { target: { value: '这是一个超过五个字的假设内容' } });
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByTestId('current-page-id')).toHaveTextContent('experiment_free');
    });
  });
});
