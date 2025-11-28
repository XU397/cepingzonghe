import React from 'react';
import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import Page07_Conclusion from '../Page07_Conclusion';
import { DroneImagingProvider, useDroneImagingContext } from '../../context/DroneImagingContext';
import type { PageId } from '../../mapping';
import { encodeCompositePageNum } from '@shared/utils/pageMapping';

class ResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

global.ResizeObserver = ResizeObserver as unknown as typeof ResizeObserver;

function CurrentPageIdIndicator() {
  const { currentPageId } = useDroneImagingContext();
  return <div data-testid="current-page-id">{currentPageId}</div>;
}

function renderPage(initialPageId: PageId = 'conclusion') {
  return render(
    <DroneImagingProvider initialPageId={initialPageId}>
      <CurrentPageIdIndicator />
      <Page07_Conclusion />
    </DroneImagingProvider>
  );
}

const STEP_INDEX = 0;
const CONCLUSION_PREFIX = `P${encodeCompositePageNum(STEP_INDEX, 7)}_`;
const PRIORITY_FACTOR_ID = `${CONCLUSION_PREFIX}优先调整因素`;
const PRIORITY_REASON_ID = `${CONCLUSION_PREFIX}理由说明`;

describe('Page07_Conclusion', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('初始渲染应展示总结结论标题和单选+文本区域（对应说明书 Page 7 基础结构）', () => {
    renderPage();

    expect(screen.getByText('总结结论')).toBeInTheDocument();
    expect(screen.getByText('问题4：', { selector: 'strong' })).toBeInTheDocument();
    expect(screen.getByText(/应优先考虑降低飞行高度还是调整镜头焦距/)).toBeInTheDocument();
    expect(screen.getByText('请说明你的理由：')).toBeInTheDocument();

    expect(screen.getByLabelText('A. 飞行高度')).toBeInTheDocument();
    expect(screen.getByLabelText('B. 镜头焦距')).toBeInTheDocument();

    expect(screen.getByTestId('next-button')).toBeInTheDocument();
  });

  it(`未选择优先调整因素时点击“完成实验”应提示错误并停留在本页（对应 Page 7 校验失败：缺少 ${PRIORITY_FACTOR_ID}）`, async () => {
    renderPage();

    const submitButton = screen.getByTestId('next-button');
    const currentPage = screen.getByTestId('current-page-id');

    expect(currentPage).toHaveTextContent('conclusion');

    fireEvent.click(submitButton);

    await waitFor(() => {
      // 当前实现的错误文案为“请选择一个答案”
      expect(screen.getByText('请选择一个答案')).toBeInTheDocument();
    });
    expect(screen.getByTestId('current-page-id')).toHaveTextContent('conclusion');
  });

  it('选择优先调整因素但理由不足 5 个字符时应提示长度错误（对应 Page 7 校验失败：“请输入至少5个字符的理由说明”）', async () => {
    renderPage();

    const optionA = screen.getByLabelText('A. 飞行高度');
    const textarea = screen.getByPlaceholderText('请写下你的理由...');
    const submitButton = screen.getByTestId('next-button');

    fireEvent.click(optionA);
    expect(optionA).toBeChecked();

    fireEvent.change(textarea, { target: { value: '理由' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('请输入至少 5 个字符的理由说明')).toBeInTheDocument();
    });
  });

  it(`选择优先调整因素且理由超过 5 个字符时应通过校验且不再显示错误（对应 Page 7 校验通过：${PRIORITY_FACTOR_ID} & ${PRIORITY_REASON_ID} 满足条件）`, async () => {
    renderPage();

    const optionB = screen.getByLabelText('B. 镜头焦距');
    const textarea = screen.getByPlaceholderText('请写下你的理由...');
    const submitButton = screen.getByTestId('next-button');

    fireEvent.click(optionB);
    expect(optionB).toBeChecked();

    fireEvent.change(textarea, { target: { value: '这是一个足够长的理由说明' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByText('请选择一个答案')).not.toBeInTheDocument();
      expect(screen.queryByText('请输入至少 5 个字符的理由说明')).not.toBeInTheDocument();
    });
  });
});
