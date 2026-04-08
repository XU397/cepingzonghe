/**
 * @file testUtils.js
 * @description 光伏治沙模块测试辅助工具集
 * @author Claude (Test Infrastructure)
 * @created 2025-11-19
 * 
 * 提供功能:
 * - Context Provider包装器
 * - Mock数据工厂
 * - 自定义渲染函数
 * - 测试断言辅助工具
 */

import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import PvSandContext from '../context/PvSandContext';
import { WindSpeedData, ExperimentState, AnswerDraft } from '../types';

// === Mock 数据工厂 ===

/**
 * 创建测试用的风速数据
 */
export const createMockWindSpeedData = (overrides = {}) => ({
  speeds: [0, 1, 2, 3, 4, 5],
  currentSpeed: 0,
  isSimulating: false,
  simulationProgress: 0,
  results: {
    '0': { sandBlown: 0, efficiency: 1.0 },
    '1': { sandBlown: 12, efficiency: 0.97 },
    '2': { sandBlown: 28, efficiency: 0.92 },
    '3': { sandBlown: 45, efficiency: 0.85 },
    '4': { sandBlown: 65, efficiency: 0.75 },
    '5': { sandBlown: 88, efficiency: 0.60 }
  },
  ...overrides
});

/**
 * 创建测试用的实验状态
 */
export const createMockExperimentState = (overrides = {}) => ({
  experiment1: {
    height50cm: createMockWindSpeedData(),
    heightGround: createMockWindSpeedData({ currentSpeed: 2 }),
    isComplete: false,
    startTime: null,
    endTime: null
  },
  experiment2: {
    heights: {
      '30': createMockWindSpeedData(),
      '50': createMockWindSpeedData(),
      '70': createMockWindSpeedData(),
      '100': createMockWindSpeedData()
    },
    currentHeight: '50',
    isComplete: false,
    startTime: null,
    endTime: null
  },
  ...overrides
});

/**
 * 创建测试用的答案草稿
 */
export const createMockAnswerDraft = (overrides = {}) => ({
  pageAnswers: {},
  experimentAnswers: {
    designReason: '',
    tutorialCompleted: false,
    experiment1Choice: null,
    experiment2Analysis: '',
    conclusionAnswers: {
      question1: '',
      question2: '',
      question3: ''
    }
  },
  metadata: {
    submoduleId: 'g8-pv-sand-experiment',
    version: '1.0.0',
    createdAt: '2025-11-19T00:00:00.000Z',
    lastSavedAt: '2025-11-19T00:00:00.000Z',
    totalPages: 5,
    completedPages: []
  },
  ...overrides
});

/**
 * 创建测试用的PvSandContext值
 */
const deriveAnswersFromDraft = (draft = {}) => {
  const answers = {};

  // 将页面答案展开为扁平结构
  if (draft.pageAnswers) {
    Object.values(draft.pageAnswers).forEach((pageAns) => {
      Object.entries(pageAns).forEach(([key, val]) => {
        answers[key] = val?.value ?? val;
      });
    });
  }

  // 同步实验答案以便页面预填充
  if (draft.experimentAnswers) {
    const { conclusionAnswers, ...rest } = draft.experimentAnswers;
    Object.entries(rest).forEach(([key, val]) => {
      answers[key] = val;
    });

    if (conclusionAnswers) {
      Object.entries(conclusionAnswers).forEach(([key, val]) => {
        answers[key] = val;
      });
    }
  }

  return answers;
};

export const createMockContextValue = (overrides = {}) => {
  const mockAnswerDraft = overrides.answerDraft ?? createMockAnswerDraft();
  const mockExperimentState = overrides.experimentState ?? createMockExperimentState();
  const initialOperations = overrides.operations ?? overrides.operationLogs ?? [];

  const mockValue = {
    // 页面状态
    currentPageId: 'page01-instructions-cover',
    navigateToPage: vi.fn(),
    canNavigateNext: vi.fn(() => true),
    canNavigatePrevious: vi.fn(() => false),
    pageStartTime: null,
    flowContext: null,
    operationSequence: 1,
    answerSequence: 1,

    // 状态数据
    experimentState: mockExperimentState,
    answerDraft: mockAnswerDraft,
    operationLogs: initialOperations,
    operations: initialOperations,
    answerList: [],
    answers: deriveAnswersFromDraft(mockAnswerDraft),
    taskDurationMinutes: 20,

    // Actions
    dispatch: vi.fn(),
    logOperation: vi.fn(),
    collectAnswer: vi.fn(),
    clearOperations: vi.fn(),
    clearAnswers: vi.fn(),
    setPageStartTime: vi.fn(),
    updateExperimentState: vi.fn(),
    updateAnswerDraft: vi.fn(),
    resetSequences: vi.fn(),
    setFlowContext: vi.fn(),
    getPagePrefix: vi.fn(() => ''),
    resetExperiment: vi.fn(),

    ...overrides
  };

  const normalizedOperations = overrides.operations ?? overrides.operationLogs ?? mockValue.operationLogs ?? [];
  mockValue.operationLogs = normalizedOperations;
  mockValue.operations = normalizedOperations;

  if (!overrides.answers) {
    mockValue.answers = deriveAnswersFromDraft(mockValue.answerDraft);
  }

  // 便于测试断言：将最终值回填到传入的对象
  if (overrides && typeof overrides === 'object') {
    Object.assign(overrides, mockValue);
  }

  return mockValue;
};

// === Mock Provider 工厂 ===

/**
 * 创建带Mock上下文的测试Provider
 * 使用直接Mock usePvSandContext hook的方式
 */
export const createMockPvSandProvider = (contextValue = {}) => {
  const mockValue = createMockContextValue(contextValue);
  
  return ({ children }) => {
    return (
      <PvSandContext.Provider value={mockValue}>
        {children}
      </PvSandContext.Provider>
    );
  };
};

// === 自定义渲染函数 ===

/**
 * 带PvSandContext的渲染函数
 */
export const renderWithPvSandContext = (ui, options = {}) => {
  const { contextValue = {}, ...renderOptions } = options;

  const mockValue = createMockContextValue(contextValue);

  const MockProvider = ({ children }) => (
    <PvSandContext.Provider value={mockValue}>
      {children}
    </PvSandContext.Provider>
  );

  return render(ui, {
    wrapper: MockProvider,
    ...renderOptions
  });
};

/**
 * 渲染包含所有必要Provider的组件
 */
export const renderWithAllProviders = (ui, options = {}) => {
  const { contextValue = {}, ...renderOptions } = options;

  const mockValue = createMockContextValue(contextValue);

  const AllTheProviders = ({ children }) => (
    <PvSandContext.Provider value={mockValue}>
      {children}
    </PvSandContext.Provider>
  );

  return render(ui, {
    wrapper: AllTheProviders,
    ...renderOptions
  });
};

// === 测试断言辅助函数 ===

/**
 * 验证操作日志调用
 */
export const expectOperationLogged = (mockLogOperation, expectedOperation) => {
  expect(mockLogOperation).toHaveBeenCalledWith(
    expect.objectContaining({
      targetElement: expectedOperation.targetElement,
      eventType: expectedOperation.eventType,
      value: expectedOperation.value,
      time: expect.any(String)
    })
  );
};

/**
 * 验证答案收集调用
 */
export const expectAnswerCollected = (mockCollectAnswer, expectedAnswer) => {
  expect(mockCollectAnswer).toHaveBeenCalledWith(
    expect.objectContaining({
      targetElement: expectedAnswer.targetElement,
      value: expectedAnswer.value
    })
  );
};

/**
 * 验证页面导航调用
 */
export const expectPageNavigation = (mockNavigateToPage, expectedPageId) => {
  expect(mockNavigateToPage).toHaveBeenCalledWith(expectedPageId);
};

/**
 * 验证实验状态更新
 */
export const expectExperimentStateUpdate = (mockUpdateExperimentState, expectedUpdate) => {
  expect(mockUpdateExperimentState).toHaveBeenCalledWith(
    expect.objectContaining(expectedUpdate)
  );
};

// === 测试场景设置函数 ===

/**
 * 设置页面04实验设计测试场景
 */
export const setupPage04Scenario = () => ({
  currentPageId: 'page04-experiment-design',
  answerDraft: createMockAnswerDraft({
    experimentAnswers: {
      designReason: '因为光伏板高度会影响风沙的流动模式',
      tutorialCompleted: false,
      experiment1Choice: null,
      experiment2Analysis: '',
      conclusionAnswers: {
        question1: '',
        question2: '',
        question3: ''
      }
    }
  })
});

/**
 * 设置页面06实验1测试场景
 */
export const setupPage06Scenario = () => ({
  currentPageId: 'page06-experiment1',
  experimentState: createMockExperimentState({
    experiment1: {
      height50cm: createMockWindSpeedData({
        currentSpeed: 3,
        isSimulating: false,
        results: {
          '3': { sandBlown: 45, efficiency: 0.85 }
        }
      }),
      heightGround: createMockWindSpeedData({
        currentSpeed: 3,
        isSimulating: false,
        results: {
          '3': { sandBlown: 88, efficiency: 0.60 }
        }
      }),
      isComplete: true,
      startTime: '2025-11-19T10:00:00.000Z',
      endTime: '2025-11-19T10:05:00.000Z'
    }
  }),
  answerDraft: createMockAnswerDraft({
    experimentAnswers: {
      designReason: '测试光伏板高度对风沙的影响',
      tutorialCompleted: true,
      experiment1Choice: 'height50cm',
      experiment2Analysis: '',
      conclusionAnswers: {
        question1: '',
        question2: '',
        question3: ''
      }
    }
  })
});

/**
 * 设置页面07实验2测试场景
 */
export const setupPage07Scenario = () => ({
  currentPageId: 'page07-experiment2',
  experimentState: createMockExperimentState({
    experiment2: {
      heights: {
        '30': createMockWindSpeedData({ isComplete: true }),
        '50': createMockWindSpeedData({ isComplete: true }),
        '70': createMockWindSpeedData({ isComplete: true }),
        '100': createMockWindSpeedData({ isComplete: true })
      },
      currentHeight: '100',
      isComplete: true,
      startTime: '2025-11-19T10:10:00.000Z',
      endTime: '2025-11-19T10:20:00.000Z'
    }
  }),
  answerDraft: createMockAnswerDraft({
    experimentAnswers: {
      designReason: '测试不同高度对风沙治理效果的影响',
      tutorialCompleted: true,
      experiment1Choice: 'height50cm',
      experiment2Analysis: '随着高度增加，沙尘飞散程度降低，发电效率提升',
      conclusionAnswers: {
        question1: '',
        question2: '',
        question3: ''
      }
    }
  })
});

// === Fake Timer 辅助函数 ===

/**
 * 设置假时间环境
 */
export const setupFakeTimers = () => {
  vi.useFakeTimers();
  const now = new Date('2025-11-19T10:00:00.000Z');
  vi.setSystemTime(now);
  return now;
};

/**
 * 模拟异步操作完成
 */
export const waitForAsyncOperations = async (ms = 0) => {
  return new Promise(resolve => {
    vi.advanceTimersByTime(ms);
    setTimeout(resolve, 0);
  });
};

/**
 * 模拟倒计时进行
 */
export const simulateCountdown = (seconds) => {
  for (let i = 0; i < seconds; i++) {
    vi.advanceTimersByTime(1000);
  }
};

// === SVG/Canvas 测试工具 ===

/**
 * Mock SVG元素渲染尺寸
 */
export const mockSVGDimensions = (element, dimensions = { width: 400, height: 300 }) => {
  if (element && element.getBBox) {
    element.getBBox.mockReturnValue({
      x: 0,
      y: 0,
      width: dimensions.width,
      height: dimensions.height
    });
  }
};

/**
 * 验证SVG元素存在
 */
export const expectSVGElementExists = (container, selector) => {
  const svgElement = container.querySelector(selector);
  expect(svgElement).toBeInTheDocument();
  return svgElement;
};

// === 错误处理测试工具 ===

/**
 * 模拟网络错误
 */
export const simulateNetworkError = () => {
  const error = new Error('Network request failed');
  error.code = 'NETWORK_ERROR';
  return error;
};

/**
 * 模拟验证错误
 */
export const simulateValidationError = (field, message) => ({
  field,
  message,
  type: 'validation'
});

// Re-export from setupTests.js to avoid duplication
export { setupTestLocalStorage, expectLocalStorageCall } from './setupTests.js';

export { vi };
