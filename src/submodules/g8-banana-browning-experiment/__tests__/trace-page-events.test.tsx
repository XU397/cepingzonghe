import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { CHART_HOVER_MIN_MS } from '@shared/services/submission/trace';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  G8BananaBrowningProvider,
  useG8BananaBrowningContext,
} from '../context/G8BananaBrowningContext';
import page12SolutionSelection from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page12_solution_selection.json';
import Page03BananaMystery from '../pages/Page03BananaMystery';
import Page13SolutionSelection from '../pages/Page13SolutionSelection';
import type { PageId } from '../mapping';

const { traceLogger } = vi.hoisted(() => ({
  traceLogger: {
    startPage: vi.fn(),
    contentActivate: vi.fn(),
    openModal: vi.fn(),
    closeModal: vi.fn(),
    textFocus: vi.fn(),
    textChange: vi.fn(),
    textBlur: vi.fn(),
    pageIdle: vi.fn(),
    chatScroll: vi.fn(),
    chartHover: vi.fn(),
    addRow: vi.fn(),
    deleteRow: vi.fn(),
    setPlanParam: vi.fn(),
    selectBest: vi.fn(),
  },
}));

vi.mock('../trace/useBananaTraceLogger', async () => {
  const actual: any = await vi.importActual('../context/G8BananaBrowningContext');

  return {
    useBananaTraceLogger: (options: { pageId?: string; pageNumber?: string } = {}) => {
      const { logOperation } = actual.useG8BananaBrowningContext();
      const pageId = options.pageId ?? 'banana_mystery';
      const pageNumber = options.pageNumber ?? '1.3';
      traceLogger.startPage.mockImplementation((metadata: Record<string, unknown> = {}) => {
        logOperation({
          targetElement: `P${pageNumber}_page`,
          eventType: 'START_PAGE',
          value: {
            trace_id: `test_trace_start_page_${Date.now()}`,
            page_id: pageId,
            page_type: 'B1_TEXT_SINGLE',
            target_type: 'page',
            metadata,
          },
          time: new Date().toISOString(),
        });
      });
      traceLogger.textFocus.mockImplementation((fieldId: string) => {
        logOperation({
          targetElement: fieldId,
          eventType: 'TEXT_FOCUS',
          value: {
            trace_id: `test_trace_text_focus_${Date.now()}`,
            page_id: pageId,
            page_type: 'B1_TEXT_SINGLE',
            target_type: 'text',
            field_id: fieldId,
            metadata: {},
          },
          time: new Date().toISOString(),
        });
      });
      traceLogger.pageIdle.mockImplementation(() => {
        logOperation({
          targetElement: 'page',
          eventType: 'PAGE_IDLE',
          value: {
            trace_id: `test_trace_page_idle_${Date.now()}`,
            page_id: pageId,
            page_type: 'B1_TEXT_SINGLE',
            target_type: 'page',
            metadata: {},
          },
          time: new Date().toISOString(),
        });
      });

      return traceLogger;
    },
    validateTraceMark: vi.fn(),
  };
});

vi.mock('recharts', async () => {
  const ReactModule = await import('react');
  const passthrough = ({ children }: { children?: React.ReactNode }) =>
    ReactModule.createElement(ReactModule.Fragment, null, children);
  const noop = () => null;

  return {
    ResponsiveContainer: passthrough,
    LineChart: ({
      children,
      onMouseMove,
      onTouchMove,
      onMouseLeave,
    }: {
      children?: React.ReactNode;
      onMouseMove?: (_state: unknown) => void;
      onTouchMove?: (_state: unknown) => void;
      onMouseLeave?: () => void;
    }) =>
      ReactModule.createElement(
        'div',
        {
          'data-testid': 'line-chart',
          onMouseMove: () =>
            onMouseMove?.({
              activeLabel: '12',
              activePayload: [
                {
                  dataKey: '10℃-海南香蕉',
                  value: 0.23,
                  payload: {
                    day: '12',
                    '10℃-海南香蕉': 0.23,
                    '18℃-海南香蕉': 0.4,
                  },
                },
              ],
            }),
          onTouchMove: () =>
            onTouchMove?.({
              activeLabel: '12',
              activePayload: [
                {
                  dataKey: '10℃-海南香蕉',
                  value: 0.23,
                  payload: {
                    day: '12',
                    '10℃-海南香蕉': 0.23,
                    '18℃-海南香蕉': 0.4,
                  },
                },
              ],
            }),
          onMouseLeave,
        },
        children
      ),
    Line: noop,
    XAxis: noop,
    YAxis: noop,
    CartesianGrid: noop,
    Tooltip: noop,
    Legend: noop,
  };
});

const FLOW_CONTEXT = {
  flowId: 'flow-1',
  submoduleId: 'g8-banana-browning-experiment',
  stepIndex: 0,
};

let readOperationsSnapshot: (() => Array<{ code: number; eventType: string }>) | null = null;

const TraceProbe = () => {
  const { flushTraceCollectors, getOperationsSnapshot } = useG8BananaBrowningContext();
  readOperationsSnapshot = getOperationsSnapshot;

  return (
    <button type="button" data-testid="flush-trace-collectors" onClick={flushTraceCollectors}>
      flush
    </button>
  );
};

const renderPage = (pageId: PageId, page: React.ReactNode) =>
  render(
    <G8BananaBrowningProvider initialPageId={pageId} initialFlowContext={FLOW_CONTEXT}>
      {page}
      <TraceProbe />
    </G8BananaBrowningProvider>
  );

const page12FixtureChartHover = page12SolutionSelection.input.operationList.find(
  operation => operation.eventType === 'CHART_HOVER'
);

const setConfigurableWindowNumber = (
  key: 'innerWidth' | 'innerHeight' | 'scrollY',
  value: number
) => {
  Object.defineProperty(window, key, {
    configurable: true,
    writable: true,
    value,
  });
};

const restoreWindowProperty = (
  key: 'innerWidth' | 'innerHeight' | 'scrollY',
  descriptor: PropertyDescriptor | undefined
) => {
  if (descriptor) {
    Object.defineProperty(window, key, descriptor);
    return;
  }

  delete (window as unknown as Record<string, unknown>)[key];
};

const REGISTRY_BACKED_CHAT_CONTENT_IDS = [
  'chat_bubble_02_01',
  'chat_bubble_02_02',
  'chat_bubble_02_03',
  'chat_bubble_02_04',
  'chat_bubble_02_05',
];

const makeRect = (top: number, bottom: number): DOMRect =>
  ({
    x: 0,
    y: top,
    width: 320,
    height: bottom - top,
    top,
    right: 320,
    bottom,
    left: 0,
    toJSON: () => ({}),
  }) as DOMRect;

const setVisibleChatRects = (chatBody: HTMLElement) => {
  chatBody.getBoundingClientRect = vi.fn(() => makeRect(0, 500));
  Array.from(chatBody.querySelectorAll<HTMLElement>('[data-content-id]')).forEach(
    (element, index) => {
      element.getBoundingClientRect = vi.fn(() => makeRect(index * 80, index * 80 + 60));
    }
  );
};

describe('banana page trace event boundaries', () => {
  beforeEach(() => {
    readOperationsSnapshot = null;
    Object.values(traceLogger).forEach(mock => mock.mockClear());
  });

  afterEach(() => {
    readOperationsSnapshot = null;
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it('Page03 starts with backend fixture-shaped visible metadata', () => {
    const innerWidthDescriptor = Object.getOwnPropertyDescriptor(window, 'innerWidth');
    const innerHeightDescriptor = Object.getOwnPropertyDescriptor(window, 'innerHeight');
    const scrollYDescriptor = Object.getOwnPropertyDescriptor(window, 'scrollY');

    setConfigurableWindowNumber('innerWidth', 1280);
    setConfigurableWindowNumber('innerHeight', 720);
    setConfigurableWindowNumber('scrollY', 0);

    try {
      renderPage('banana_mystery', <Page03BananaMystery />);

      expect(traceLogger.startPage).toHaveBeenCalledWith(
        expect.objectContaining({
          initial_visible_content_ids: ['instruction_text_02_01', 'chat_bubble_02_01'],
          main_instruction_visible: true,
          viewport_state: {
            width: 1280,
            height: 720,
            scroll_y: 0,
          },
        })
      );
    } finally {
      restoreWindowProperty('innerWidth', innerWidthDescriptor);
      restoreWindowProperty('innerHeight', innerHeightDescriptor);
      restoreWindowProperty('scrollY', scrollYDescriptor);
    }
  });

  it('Page03 emits CHAT_SCROLL for user-originated chat scroll with backend fixture field names', () => {
    vi.useFakeTimers();
    renderPage('banana_mystery', <Page03BananaMystery />);

    const chatBody = screen.getByTestId('page02-chat-body');
    Object.defineProperty(chatBody, 'scrollHeight', {
      configurable: true,
      value: 900,
    });

    act(() => {
      vi.runAllTimers();
    });
    setVisibleChatRects(chatBody);

    const registeredIdsInDom = Array.from(
      chatBody.querySelectorAll<HTMLElement>('[data-content-id]')
    ).map(element => element.dataset.contentId);
    expect(registeredIdsInDom).toEqual(REGISTRY_BACKED_CHAT_CONTENT_IDS);
    expect(chatBody.querySelector('[data-content-id="chat_bubble_02_06"]')).toBeNull();
    expect(chatBody.querySelector('[data-content-id="chat_bubble_02_07"]')).toBeNull();

    chatBody.scrollTop = 420;
    fireEvent.scroll(chatBody);
    expect(traceLogger.chatScroll).not.toHaveBeenCalled();

    fireEvent.wheel(chatBody, { deltaY: -420 });
    chatBody.scrollTop = 0;
    fireEvent.scroll(chatBody);

    expect(traceLogger.chatScroll).toHaveBeenCalledTimes(1);
    expect(traceLogger.chatScroll).toHaveBeenCalledWith(
      expect.objectContaining({
        scrollDelta: -420,
        scrollDirection: 'up',
        visibleContentIdsBefore: REGISTRY_BACKED_CHAT_CONTENT_IDS,
        visibleContentIdsAfter: REGISTRY_BACKED_CHAT_CONTENT_IDS,
        phase: 'before_input',
      })
    );
  });

  it('Page03 ignores programmatic dialogue auto-scrolls without user scroll intent', () => {
    vi.useFakeTimers();
    renderPage('banana_mystery', <Page03BananaMystery />);

    const chatBody = screen.getByTestId('page02-chat-body');
    Object.defineProperty(chatBody, 'scrollHeight', {
      configurable: true,
      value: 900,
    });

    act(() => {
      vi.runAllTimers();
    });
    setVisibleChatRects(chatBody);

    chatBody.scrollTop = 900;
    fireEvent.scroll(chatBody);

    expect(traceLogger.chatScroll).not.toHaveBeenCalled();
  });

  it('Page03 flushes the focused question text boundary before submit', () => {
    renderPage('banana_mystery', <Page03BananaMystery />);

    const textarea = screen.getByPlaceholderText('请在此处输入你的回答。');
    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: '香蕉为什么会变黑' } });
    fireEvent.click(screen.getByTestId('flush-trace-collectors'));

    expect(traceLogger.textFocus).toHaveBeenCalledWith('input_question_1', '');
    expect(traceLogger.textChange).toHaveBeenCalledWith(
      'input_question_1',
      '',
      '香蕉为什么会变黑',
      expect.objectContaining({
        source_answer_key: 'Q1_科学问题',
        flush_reason: 'submit',
      })
    );
    expect(traceLogger.textBlur).toHaveBeenCalledWith(
      'input_question_1',
      '',
      '香蕉为什么会变黑',
      expect.objectContaining({
        source_answer_key: 'Q1_科学问题',
        flush_reason: 'submit',
      })
    );
  });

  it('Page03 flushes PAGE_IDLE only for visible and focused idle segments', () => {
    const hasFocusSpy = vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    const visibilityStateSpy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-03T02:00:00.000Z'));

    try {
      renderPage('banana_mystery', <Page03BananaMystery />);

      act(() => {
        vi.setSystemTime(new Date('2026-06-03T02:00:05.000Z'));
      });
      fireEvent.focus(screen.getByPlaceholderText('请在此处输入你的回答。'));

      expect(traceLogger.pageIdle).toHaveBeenCalledTimes(1);
      expect(traceLogger.pageIdle).toHaveBeenCalledWith(
        expect.objectContaining({
          idleDurationMs: 5000,
          idlePhase: 'initial_before_first_action',
          pageVisible: true,
          windowFocused: true,
        })
      );

      const operations = readOperationsSnapshot?.() ?? [];
      const idleIndex = operations.findIndex(operation => operation.eventType === 'PAGE_IDLE');
      const focusIndex = operations.findIndex(operation => operation.eventType === 'TEXT_FOCUS');
      expect(idleIndex).toBeGreaterThan(-1);
      expect(focusIndex).toBeGreaterThan(-1);
      expect(idleIndex).toBeLessThan(focusIndex);
      expect(operations[idleIndex].code).toBeLessThan(operations[focusIndex].code);
    } finally {
      hasFocusSpy.mockRestore();
      visibilityStateSpy.mockRestore();
    }
  });

  it('Page03 discards PAGE_IDLE when the initial segment becomes hidden', () => {
    const hasFocusSpy = vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    const visibilityStateSpy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-03T02:00:00.000Z'));

    try {
      renderPage('banana_mystery', <Page03BananaMystery />);

      visibilityStateSpy.mockReturnValue('hidden');
      document.dispatchEvent(new Event('visibilitychange'));
      visibilityStateSpy.mockReturnValue('visible');
      act(() => {
        vi.setSystemTime(new Date('2026-06-03T02:00:05.000Z'));
      });
      fireEvent.focus(screen.getByPlaceholderText('请在此处输入你的回答。'));

      expect(traceLogger.pageIdle).not.toHaveBeenCalled();
    } finally {
      hasFocusSpy.mockRestore();
      visibilityStateSpy.mockRestore();
    }
  });

  it('Page03 discards PAGE_IDLE when the initial segment becomes unfocused', () => {
    const hasFocusSpy = vi.spyOn(document, 'hasFocus').mockReturnValue(true);
    const visibilityStateSpy = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('visible');
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-03T02:00:00.000Z'));

    try {
      renderPage('banana_mystery', <Page03BananaMystery />);

      hasFocusSpy.mockReturnValue(false);
      window.dispatchEvent(new Event('blur'));
      hasFocusSpy.mockReturnValue(true);
      act(() => {
        vi.setSystemTime(new Date('2026-06-03T02:00:05.000Z'));
      });
      fireEvent.focus(screen.getByPlaceholderText('请在此处输入你的回答。'));

      expect(traceLogger.pageIdle).not.toHaveBeenCalled();
    } finally {
      hasFocusSpy.mockRestore();
      visibilityStateSpy.mockRestore();
    }
  });

  it('Page13 flushes reason text focus/change/blur boundaries before submit', () => {
    renderPage('solution_selection', <Page13SolutionSelection />);

    const textarea = screen.getByPlaceholderText('请在此处输入你的回答。');
    fireEvent.focus(textarea);
    fireEvent.change(textarea, { target: { value: '适合储存12天' } });
    fireEvent.click(screen.getByTestId('flush-trace-collectors'));

    expect(traceLogger.textFocus).toHaveBeenCalledWith('reason_text', '');
    expect(traceLogger.textChange).toHaveBeenCalledWith(
      'reason_text',
      '',
      '适合储存12天',
      expect.objectContaining({
        source_answer_key: 'Q8_理由',
        flush_reason: 'submit',
      })
    );
    expect(traceLogger.textBlur).toHaveBeenCalledWith(
      'reason_text',
      '',
      '适合储存12天',
      expect.objectContaining({
        source_answer_key: 'Q8_理由',
        flush_reason: 'submit',
      })
    );
  });

  it('Page13 emits chart hover evidence only after the configured dwell threshold', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(1000));

    renderPage('solution_selection', <Page13SolutionSelection />);

    fireEvent.mouseMove(screen.getByTestId('line-chart'));

    expect(traceLogger.chartHover).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(CHART_HOVER_MIN_MS - 1);
    });
    expect(traceLogger.chartHover).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(1);
    });

    expect(traceLogger.chartHover).toHaveBeenCalledWith(
      page12FixtureChartHover?.value.chart_id,
      page12FixtureChartHover?.value.point_id,
      expect.objectContaining({
        hover_ms: CHART_HOVER_MIN_MS,
        data_snapshot: expect.objectContaining({
          day: '12',
          series_id: page12FixtureChartHover?.value.metadata.data_snapshot.series_id,
          black_ratio: page12FixtureChartHover?.value.metadata.data_snapshot.black_ratio,
        }),
      })
    );
  });

  it('Page13 does not need a second mousemove to log a threshold-qualified chart hover', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2000));

    renderPage('solution_selection', <Page13SolutionSelection />);

    fireEvent.mouseMove(screen.getByTestId('line-chart'));

    act(() => {
      vi.advanceTimersByTime(CHART_HOVER_MIN_MS);
    });

    expect(traceLogger.chartHover).toHaveBeenCalledTimes(1);
    expect(traceLogger.chartHover).toHaveBeenCalledWith(
      page12FixtureChartHover?.value.chart_id,
      page12FixtureChartHover?.value.point_id,
      expect.objectContaining({
        data_snapshot: expect.objectContaining(
          page12FixtureChartHover?.value.metadata.data_snapshot
        ),
      })
    );
  });

  it('Page13 flushes a threshold-qualified chart hover when leaving before the timer callback runs', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(3000));

    renderPage('solution_selection', <Page13SolutionSelection />);

    fireEvent.mouseMove(screen.getByTestId('line-chart'));

    act(() => {
      vi.setSystemTime(new Date(3000 + CHART_HOVER_MIN_MS));
    });
    fireEvent.mouseLeave(screen.getByTestId('line-chart'));

    expect(traceLogger.chartHover).toHaveBeenCalledWith(
      page12FixtureChartHover?.value.chart_id,
      page12FixtureChartHover?.value.point_id,
      expect.objectContaining({
        hover_ms: CHART_HOVER_MIN_MS,
        data_snapshot: expect.objectContaining(
          page12FixtureChartHover?.value.metadata.data_snapshot
        ),
      })
    );
  });
});
