/**
 * TimerContainer 集成测试：验证 AppContext 配置传递到 TimerDisplay
 */

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TimerContainer from '../TimerContainer.jsx';
import AppContext from '@/context/AppContext.jsx';
import { useTimer } from '../../../services/timers/useTimer.js';

vi.mock('../../../services/timers/useTimer.js', () => ({
  useTimer: vi.fn(),
}));

describe('TimerContainer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useTimer.mockReturnValue({ remaining: 120 });
  });

  it('shouldHideTimer=true 时不渲染计时器', () => {
    const { container } = render(
      <AppContext.Provider value={{ shouldHideTimer: true }}>
        <TimerContainer type="task" />
      </AppContext.Provider>
    );

    expect(screen.queryByRole('timer')).not.toBeInTheDocument();
    expect(container.firstChild).toBeNull();
  });

  it('shouldHideTimer=false 时正常渲染计时器', () => {
    render(
      <AppContext.Provider value={{ shouldHideTimer: false }}>
        <TimerContainer type="task" label="测试倒计时" />
      </AppContext.Provider>
    );

    expect(screen.getByRole('timer')).toBeInTheDocument();
    expect(screen.getByText('测试倒计时: 02:00')).toBeInTheDocument();
  });
});
