/**
 * ErrorBoundary 组件测试
 * 验证错误边界的功能
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';
import ErrorBoundary from '../ErrorBoundary';

// 模拟一个会抛出错误的组件
const ThrowError = ({ shouldThrow }) => {
  if (shouldThrow) {
    throw new Error('测试错误');
  }
  return <div>正常组件</div>;
};

describe('ErrorBoundary', () => {
  // 抑制console.error以避免测试输出噪音
  const originalError = console.error;
  beforeEach(() => {
    console.error = vi.fn();
  });
  
  afterEach(() => {
    console.error = originalError;
  });

  it('应该在没有错误时正常渲染子组件', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('正常组件')).toBeInTheDocument();
  });

  it('应该在发生错误时显示错误界面', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('页面加载遇到问题')).toBeInTheDocument();
    expect(screen.getByText('很抱歉，当前页面出现了技术问题。请刷新页面重试。')).toBeInTheDocument();
    expect(screen.getByText('刷新页面')).toBeInTheDocument();
  });

  it('应该提供刷新页面的按钮', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );

    const refreshButton = screen.getByText('刷新页面');
    expect(refreshButton).toBeInTheDocument();
  });
});