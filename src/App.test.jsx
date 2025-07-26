/**
 * @file App.test.jsx
 * @description 测试主应用组件的模块系统激活功能
 * @author James (Developer)
 * @created 2025-07-26
 */

import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

// Mock 模块路由器
vi.mock('./modules/ModuleRouter.jsx', () => ({
  default: vi.fn().mockImplementation(({ globalContext, authInfo }) => (
    <div data-testid="module-router">
      <div data-testid="module-url">{authInfo?.url}</div>
      <div data-testid="exam-no">{authInfo?.examNo}</div>
      Mock ModuleRouter
    </div>
  ))
}));

// Mock AppContext
vi.mock('./context/AppContext', () => ({
  AppProvider: ({ children }) => <div data-testid="app-provider">{children}</div>,
  useAppContext: vi.fn()
}));

// Mock 其他组件
vi.mock('./components/common/Timer', () => ({
  default: () => <div data-testid="timer">Timer</div>
}));

vi.mock('./components/common/UserInfoBar', () => ({
  default: () => <div data-testid="user-info-bar">UserInfoBar</div>
}));

vi.mock('./components/PageRouter', () => ({
  default: () => <div data-testid="page-router">PageRouter</div>
}));

vi.mock('./components/common/StepNavigation', () => ({
  default: () => <div data-testid="step-navigation">StepNavigation</div>
}));

vi.mock('./components/questionnaire/QuestionnaireTimer', () => ({
  default: () => <div data-testid="questionnaire-timer">QuestionnaireTimer</div>
}));

vi.mock('./components/questionnaire/QuestionnaireNavigation', () => ({
  default: () => <div data-testid="questionnaire-navigation">QuestionnaireNavigation</div>
}));

vi.mock('./components/debug/ApiConfigDebug', () => ({
  default: () => <div data-testid="api-config-debug">ApiConfigDebug</div>
}));

vi.mock('./utils/pageMappings', () => ({
  isQuestionnairePage: vi.fn().mockReturnValue(false),
  getQuestionnaireStepNumber: vi.fn().mockReturnValue(1),
  TOTAL_QUESTIONNAIRE_STEPS: 9
}));

const { useAppContext } = vi.mocked(await import('./context/AppContext'));

describe('App Component - Module System Activation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('应该在用户未认证时渲染PageRouter', () => {
    // Mock 未认证状态
    useAppContext.mockReturnValue({
      isAuthenticated: false,
      isLoggedIn: false,
      currentPageId: 'Page_01_Login',
      // 其他必需的状态
      moduleUrl: '',
      currentStepNumber: 0,
      totalUserSteps: 0,
      isTaskFinished: false,
      questionnaireRemainingTime: 0,
      isQuestionnaireTimeUp: false,
      setCurrentPageId: vi.fn(),
      setIsTaskFinished: vi.fn(),
      startTaskTimer: vi.fn(),
      submitPageData: vi.fn(),
      logOperation: vi.fn(),
      collectAnswer: vi.fn()
    });

    render(<App />);

    // 验证登录页面渲染
    expect(screen.getByTestId('page-router')).toBeInTheDocument();
    expect(screen.queryByTestId('module-router')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-info-bar')).not.toBeInTheDocument();
  });

  test('应该在用户认证后且有moduleUrl时渲染ModuleRouter', async () => {
    // Mock 认证状态 + 模块URL
    useAppContext.mockReturnValue({
      isAuthenticated: true,
      isLoggedIn: true,
      currentPageId: 'Page_02_Introduction',
      moduleUrl: '/seven-grade', // 关键：提供模块URL
      currentStepNumber: 1,
      totalUserSteps: 10,
      isTaskFinished: false,
      questionnaireRemainingTime: 600000,
      isQuestionnaireTimeUp: false,
      currentUser: {
        studentName: '测试学生',
        schoolName: '测试学校',
        schoolCode: 'TEST001'
      },
      examNo: 'EXAM123',
      batchCode: 'BATCH456',
      remainingTime: 2400000,
      taskStartTime: new Date(),
      setCurrentPageId: vi.fn(),
      setIsTaskFinished: vi.fn(),
      startTaskTimer: vi.fn(),
      submitPageData: vi.fn(),
      logOperation: vi.fn(),
      collectAnswer: vi.fn()
    });

    render(<App />);

    // 验证 ModuleRouter 被渲染
    await waitFor(() => {
      expect(screen.getByTestId('module-router')).toBeInTheDocument();
    });

    // 验证正确的 authInfo 被传递
    expect(screen.getByTestId('module-url')).toHaveTextContent('/seven-grade');
    expect(screen.getByTestId('exam-no')).toHaveTextContent('EXAM123');

    // 验证必要的 UI 组件仍然渲染
    expect(screen.getByTestId('user-info-bar')).toBeInTheDocument();
    expect(screen.getByTestId('timer')).toBeInTheDocument();
  });

  test('应该在用户认证后但没有moduleUrl时渲染传统PageRouter', () => {
    // Mock 认证状态但无模块URL
    useAppContext.mockReturnValue({
      isAuthenticated: true,
      isLoggedIn: true,
      currentPageId: 'Page_02_Introduction',
      moduleUrl: '', // 关键：没有模块URL
      currentStepNumber: 1,
      totalUserSteps: 10,
      isTaskFinished: false,
      questionnaireRemainingTime: 600000,
      isQuestionnaireTimeUp: false,
      currentUser: {
        studentName: '测试学生'
      },
      examNo: 'EXAM123',
      batchCode: 'BATCH456',
      setCurrentPageId: vi.fn(),
      setIsTaskFinished: vi.fn(),
      startTaskTimer: vi.fn(),
      submitPageData: vi.fn(),
      logOperation: vi.fn(),
      collectAnswer: vi.fn()
    });

    render(<App />);

    // 验证传统 PageRouter 被渲染
    expect(screen.getByTestId('page-router')).toBeInTheDocument();
    expect(screen.queryByTestId('module-router')).not.toBeInTheDocument();

    // 验证必要的 UI 组件仍然渲染
    expect(screen.getByTestId('user-info-bar')).toBeInTheDocument();
    expect(screen.getByTestId('timer')).toBeInTheDocument();
  });

  test('应该正确传递globalContext给ModuleRouter', async () => {
    const mockContext = {
      isAuthenticated: true,
      isLoggedIn: true,
      currentPageId: 'Page_15_Test',
      moduleUrl: '/seven-grade',
      currentStepNumber: 5,
      totalUserSteps: 10,
      isTaskFinished: false,
      remainingTime: 1800000,
      taskStartTime: new Date('2024-07-26T10:00:00'),
      currentUser: { studentName: '张三' },
      examNo: 'E123',
      batchCode: 'B456',
      questionnaireRemainingTime: 600000,
      isQuestionnaireTimeUp: false,
      questionnaireData: {},
      questionnaireAnswers: {},
      isQuestionnaireCompleted: false,
      setCurrentPageId: vi.fn(),
      setIsTaskFinished: vi.fn(),
      startTaskTimer: vi.fn(),
      submitPageData: vi.fn(),
      logOperation: vi.fn(),
      collectAnswer: vi.fn()
    };

    useAppContext.mockReturnValue(mockContext);

    // 重新 mock ModuleRouter 以验证传入的 props
    const MockModuleRouter = vi.fn().mockImplementation(({ globalContext, authInfo }) => (
      <div data-testid="module-router">
        <div data-testid="global-context-present">{globalContext ? 'present' : 'missing'}</div>
        <div data-testid="auth-info-present">{authInfo ? 'present' : 'missing'}</div>
      </div>
    ));

    vi.doMock('./modules/ModuleRouter.jsx', () => ({
      default: MockModuleRouter
    }));

    render(<App />);

    await waitFor(() => {
      expect(screen.getByTestId('module-router')).toBeInTheDocument();
    });

    // 验证 ModuleRouter 被正确调用
    expect(MockModuleRouter).toHaveBeenCalledWith(
      expect.objectContaining({
        globalContext: expect.objectContaining({
          currentPageId: 'Page_15_Test',
          moduleUrl: '/seven-grade',
          examNo: 'E123',
          batchCode: 'B456',
          isAuthenticated: true,
          logOperation: expect.any(Function),
          collectAnswer: expect.any(Function)
        }),
        authInfo: expect.objectContaining({
          url: '/seven-grade',
          pageNum: 'Page_15_Test',
          examNo: 'E123',
          batchCode: 'B456'
        })
      }),
      expect.any(Object)
    );
  });

  test('应该在问卷页面正确渲染QuestionnaireTimer', async () => {
    const { isQuestionnairePage } = vi.mocked(await import('./utils/pageMappings'));
    isQuestionnairePage.mockReturnValue(true);

    useAppContext.mockReturnValue({
      isAuthenticated: true,
      isLoggedIn: true,
      currentPageId: 'Page_21_Curiosity_Questions',
      moduleUrl: '/seven-grade',
      currentStepNumber: 1,
      totalUserSteps: 10,
      isTaskFinished: false,
      questionnaireRemainingTime: 300000,
      isQuestionnaireTimeUp: false,
      setCurrentPageId: vi.fn(),
      setIsTaskFinished: vi.fn(),
      startTaskTimer: vi.fn(),
      submitPageData: vi.fn(),
      logOperation: vi.fn(),
      collectAnswer: vi.fn()
    });

    render(<App />);

    // 验证问卷计时器被渲染
    expect(screen.getByTestId('questionnaire-timer')).toBeInTheDocument();
    expect(screen.queryByTestId('timer')).not.toBeInTheDocument();
  });
});