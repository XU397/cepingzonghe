/**
 * TimerDisplay 组件隐藏开关测试
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TimerDisplay from '..';

describe('TimerDisplay', () => {
  it('hidden=false 时应正常渲染计时器', () => {
    render(<TimerDisplay remainingSeconds={120} hidden={false} />);

    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(screen.getByText('剩余时间: 02:00')).toBeInTheDocument();
  });

  it('hidden=true 时应返回 null 不渲染内容', () => {
    const { container } = render(<TimerDisplay remainingSeconds={120} hidden />);

    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });
});
