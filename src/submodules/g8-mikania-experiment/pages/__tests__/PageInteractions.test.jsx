import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, beforeEach, describe, expect, it } from 'vitest';
import Page00Notice from '../Page00_Notice.jsx';
import Page01Intro from '../Page01_Intro.jsx';
import Page02StepQ1 from '../Page02_Step_Q1.jsx';
import Page03SimExp from '../Page03_Sim_Exp.jsx';
import Page04Q2Data from '../Page04_Q2_Data.jsx';
import Page05Q3Trend from '../Page05_Q3_Trend.jsx';
import Page06Q4Conc from '../Page06_Q4_Conc.jsx';

const defaultAnswers = {
  Q1_控制变量原因: '',
  Q2_抑制作用浓度: '',
  Q3_发芽率趋势: '',
  Q4a_菟丝子有效性: '',
  Q4b_结论理由: '',
};

const defaultExperimentState = {
  concentration: '0mg/ml',
  days: 1,
  hasStarted: false,
  currentResult: null,
};

const buildMockContext = (overrides = {}) => {
  const base = {
    state: {
      noticeCountdown: 0,
      noticeConfirmed: false,
      answers: { ...defaultAnswers },
      experimentState: { ...defaultExperimentState },
      ...overrides.state,
    },
    setAnswer: vi.fn(),
    setExperimentState: vi.fn(),
    tickNoticeCountdown: vi.fn(),
    confirmNotice: vi.fn(),
    logOperation: vi.fn(),
    validateCurrentPage: vi.fn().mockReturnValue(true),
    getCurrentValidationErrors: vi.fn().mockReturnValue({}),
    logClickBlocked: vi.fn(),
    navigateToNextPage: vi.fn().mockResolvedValue(undefined),
    isSubmitting: false,
    ...overrides,
  };

  // Merge nested answers/experimentState when overrides provided
  base.state.answers = { ...defaultAnswers, ...(overrides.state?.answers || {}) };
  base.state.experimentState = {
    ...defaultExperimentState,
    ...(overrides.state?.experimentState || {}),
  };

  return base;
};

let mockContext = buildMockContext();

vi.mock('../../Component', () => ({
  useMikaniaExperiment: () => mockContext,
}));

beforeEach(() => {
  mockContext = buildMockContext();
});

describe('Page00_Notice', () => {
  it('logs enter/exit and blocks checkbox before countdown ends', () => {
    const ctx = buildMockContext({ state: { noticeCountdown: 5 } });
    mockContext = ctx;
    const { unmount } = render(<Page00Notice />);

    expect(ctx.logOperation).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'page_enter', value: 'page_00_notice' }),
    );
    expect(screen.getByRole('checkbox')).toBeDisabled();

    unmount();
    expect(ctx.logOperation).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'page_exit', value: 'page_00_notice' }),
    );
  });

  it('enables checkbox after countdown and records confirmation', async () => {
    const ctx = buildMockContext({
      state: { noticeCountdown: 0, noticeConfirmed: false },
    });
    mockContext = ctx;
    render(<Page00Notice />);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeDisabled();

    await userEvent.click(checkbox);
    expect(ctx.confirmNotice).toHaveBeenCalledWith(true);
    expect(ctx.logOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        targetElement: 'P1_注意事项确认',
        eventType: 'change',
        value: 'checked',
      }),
    );
  });
});

describe('Page01_Intro', () => {
  it('records page enter/exit for background page', () => {
    const ctx = buildMockContext();
    mockContext = ctx;
    const { unmount } = render(<Page01Intro />);

    expect(ctx.logOperation).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'page_01_intro', eventType: 'page_enter' }),
    );

    unmount();
    expect(ctx.logOperation).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'page_01_intro', eventType: 'page_exit' }),
    );
  });
});

describe('Page02_Step_Q1', () => {
  it('blocks next when validation fails and shows error hint', async () => {
    const ctx = buildMockContext({
      validateCurrentPage: vi.fn().mockReturnValue(false),
      getCurrentValidationErrors: vi.fn().mockReturnValue({
        Q1_控制变量原因: '至少5个字符',
      }),
    });
    mockContext = ctx;
    render(<Page02StepQ1 />);

    await userEvent.click(screen.getByRole('button', { name: '下一页' }));

    expect(await screen.findByText('至少5个字符')).toBeInTheDocument();
    expect(ctx.logClickBlocked).toHaveBeenCalledWith('validation_failed', ['Q1_控制变量原因']);
    expect(ctx.navigateToNextPage).not.toHaveBeenCalled();
  });

  it('submits and clears error when validation passes', async () => {
    const ctx = buildMockContext({
      validateCurrentPage: vi.fn().mockReturnValue(true),
      navigateToNextPage: vi.fn().mockResolvedValue(undefined),
    });
    mockContext = ctx;
    render(<Page02StepQ1 />);

    await userEvent.type(screen.getByRole('textbox'), '有效答案文本');
    await userEvent.click(screen.getByRole('button', { name: '下一页' }));

    await waitFor(() => expect(ctx.navigateToNextPage).toHaveBeenCalled());
  });

  it('disables next button while submitting', () => {
    const ctx = buildMockContext({ isSubmitting: true });
    mockContext = ctx;
    render(<Page02StepQ1 />);

    expect(screen.getByRole('button', { name: '提交中...' })).toBeDisabled();
  });
});

describe('Page03_Sim_Exp', () => {
  it('logs page lifecycle events', () => {
    const ctx = buildMockContext();
    mockContext = ctx;
    const { unmount } = render(<Page03SimExp />);

    expect(ctx.logOperation).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'page_03_sim_exp', eventType: 'page_enter' }),
    );
    unmount();
    expect(ctx.logOperation).toHaveBeenCalledWith(
      expect.objectContaining({ value: 'page_03_sim_exp', eventType: 'page_exit' }),
    );
  });
});

describe('Page04_Q2_Data', () => {
  it('blocks navigation when option missing and shows hint', async () => {
    const ctx = buildMockContext({
      validateCurrentPage: vi.fn().mockReturnValue(false),
      getCurrentValidationErrors: vi.fn().mockReturnValue({
        Q2_抑制作用浓度: '请选择一个选项',
      }),
    });
    mockContext = ctx;
    render(<Page04Q2Data />);

    await userEvent.click(screen.getByRole('button', { name: /^下一页$/ }));
    expect(await screen.findByText('请选择一个选项')).toBeInTheDocument();
    expect(ctx.logClickBlocked).toHaveBeenCalledWith('validation_failed', ['Q2_抑制作用浓度']);
  });

  it('records choice change and proceeds on valid state', async () => {
    const ctx = buildMockContext({
      validateCurrentPage: vi.fn().mockReturnValue(true),
      navigateToNextPage: vi.fn().mockResolvedValue(undefined),
    });
    mockContext = ctx;
    render(<Page04Q2Data />);

    await userEvent.click(screen.getByRole('button', { name: /5mg\/ml/ }));
    expect(ctx.setAnswer).toHaveBeenCalledWith('Q2_抑制作用浓度', 'B');
    expect(ctx.logOperation).toHaveBeenCalledWith(
      expect.objectContaining({
        targetElement: 'Q2_抑制作用浓度',
        eventType: 'change',
        value: 'B',
      }),
    );

    await userEvent.click(screen.getByRole('button', { name: /^下一页$/ }));
    await waitFor(() => expect(ctx.navigateToNextPage).toHaveBeenCalled());
  });
});

describe('Page05_Q3_Trend', () => {
  it('shows validation hint when selection missing', async () => {
    const ctx = buildMockContext({
      validateCurrentPage: vi.fn().mockReturnValue(false),
      getCurrentValidationErrors: vi.fn().mockReturnValue({
        Q3_发芽率趋势: '请选择一个选项',
      }),
    });
    mockContext = ctx;
    render(<Page05Q3Trend />);

    await userEvent.click(screen.getByRole('button', { name: /^下一页$/ }));
    expect(await screen.findByText('请选择一个选项')).toBeInTheDocument();
    expect(ctx.logClickBlocked).toHaveBeenCalledWith('validation_failed', ['Q3_发芽率趋势']);
  });

  it('logs option change and allows navigation on success', async () => {
    const ctx = buildMockContext({
      validateCurrentPage: vi.fn().mockReturnValue(true),
      navigateToNextPage: vi.fn().mockResolvedValue(undefined),
    });
    mockContext = ctx;
    render(<Page05Q3Trend />);

    await userEvent.click(screen.getByRole('button', { name: /浓度越高/ }));
    expect(ctx.setAnswer).toHaveBeenCalledWith('Q3_发芽率趋势', 'B');

    await userEvent.click(screen.getByRole('button', { name: /^下一页$/ }));
    await waitFor(() => expect(ctx.navigateToNextPage).toHaveBeenCalled());
  });
});

describe('Page06_Q4_Conc', () => {
  it('surfacing both errors and blocking submit when answers missing', async () => {
    const ctx = buildMockContext({
      validateCurrentPage: vi.fn().mockReturnValue(false),
      getCurrentValidationErrors: vi.fn().mockReturnValue({
        Q4a_菟丝子有效性: '请选择"是"或"否"',
        Q4b_结论理由: '至少10个字符，当前0个',
      }),
    });
    mockContext = ctx;
    render(<Page06Q4Conc />);

    await userEvent.click(screen.getByRole('button', { name: '提交' }));
    expect(await screen.findByText('请选择"是"或"否"')).toBeInTheDocument();
    expect(await screen.findByText('至少10个字符，当前0个')).toBeInTheDocument();
    expect(ctx.logClickBlocked).toHaveBeenCalledWith(
      'validation_failed',
      ['Q4a_菟丝子有效性', 'Q4b_结论理由'],
    );
    expect(ctx.navigateToNextPage).not.toHaveBeenCalled();
  });

  it('propagates value changes and submits when valid', async () => {
    const ctx = buildMockContext({
      validateCurrentPage: vi.fn().mockReturnValue(true),
      navigateToNextPage: vi.fn().mockResolvedValue(undefined),
    });
    mockContext = ctx;
    render(<Page06Q4Conc />);

    await userEvent.click(screen.getByRole('button', { name: /^是$/ }));
    await userEvent.type(screen.getByRole('textbox'), '充足且合理的结论文本');

    expect(ctx.setAnswer).toHaveBeenCalledWith('Q4a_菟丝子有效性', '是');
    expect(ctx.setAnswer).toHaveBeenCalledWith('Q4b_结论理由', expect.stringContaining('充足且合理'));

    await userEvent.click(screen.getByRole('button', { name: '提交' }));
    await waitFor(() => expect(ctx.navigateToNextPage).toHaveBeenCalled());
  });

  it('disables submit while submitting', () => {
    const ctx = buildMockContext({ isSubmitting: true });
    mockContext = ctx;
    render(<Page06Q4Conc />);

    expect(screen.getByRole('button', { name: '提交中...' })).toBeDisabled();
  });
});
