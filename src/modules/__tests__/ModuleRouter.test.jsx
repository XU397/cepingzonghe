/**
 * 模块路由器测试文件
 * 验证顶层模块路由器的核心功能
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ModuleRouter from '../ModuleRouter.jsx';

// Mock 模块注册表
const mockModuleRegistry = {
  initialize: vi.fn().mockResolvedValue(undefined),
  getModuleByUrl: vi.fn(),
  getByUrl: vi.fn(),
  getAllModules: vi.fn().mockReturnValue([]),
  getAllUrlMappings: vi.fn().mockReturnValue({})
};

// Mock 模块
const mockModule = {
  moduleId: 'test-module',
  displayName: '测试模块',
  url: '/test',
  version: '1.0.0',
  ModuleComponent: ({ userContext, initialPageId }) => (
    <div data-testid="mock-module">
      <div>模块ID: {userContext?.examNo}</div>
      <div>初始页面: {initialPageId}</div>
    </div>
  ),
  getInitialPage: vi.fn().mockReturnValue('test-page'),
  onInitialize: vi.fn().mockResolvedValue(undefined),
  onDestroy: vi.fn()
};

// Mock 动态导入
vi.mock('../ModuleRegistry.js', () => ({
  default: mockModuleRegistry
}));

const mockedNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => mockedNavigate,
}));

describe('ModuleRouter', () => {
  const mockGlobalContext = {
    currentPageId: 'Page_01_Test',
    remainingTime: 3600,
    taskStartTime: Date.now(),
    batchCode: 'TEST_BATCH',
    examNo: 'TEST_EXAM',
    pageNum: '1',
    currentPageData: {},
    pageEnterTime: Date.now(),
    isLoggedIn: true,
    isAuthenticated: true,
    authToken: 'test-token',
    currentUser: { studentName: '测试学生' },
    moduleUrl: '/test',
    isTaskFinished: false,
    isTimeUp: false,
    logOperation: vi.fn(),
    collectAnswer: vi.fn()
  };

  const mockAuthInfo = {
    url: '/test',
    pageNum: '1',
    examNo: 'TEST_EXAM',
    batchCode: 'TEST_BATCH'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockModuleRegistry.getModuleByUrl.mockReturnValue(mockModule);
    mockModuleRegistry.getByUrl.mockReturnValue(mockModule);
    mockedNavigate.mockReset();
  });

  it('应该正确初始化模块系统', async () => {
    render(
      <ModuleRouter 
        globalContext={mockGlobalContext}
        authInfo={mockAuthInfo}
      />
    );

    await waitFor(() => {
      expect(mockModuleRegistry.initialize).toHaveBeenCalled();
    });
  });

  it('应该根据URL加载正确的模块', async () => {
    render(
      <ModuleRouter 
        globalContext={mockGlobalContext}
        authInfo={mockAuthInfo}
      />
    );

    await waitFor(() => {
      expect(mockModuleRegistry.getByUrl).toHaveBeenCalledWith('/test');
    });
  });

  it('应该正确构造用户上下文', async () => {
    render(
      <ModuleRouter 
        globalContext={mockGlobalContext}
        authInfo={mockAuthInfo}
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('mock-module')).toBeInTheDocument();
      expect(screen.getByText('模块ID: TEST_EXAM')).toBeInTheDocument();
    });
  });

  it('应该处理页面恢复', async () => {
    const authInfoWithPageNum = {
      ...mockAuthInfo,
      pageNum: '5'
    };

    render(
      <ModuleRouter 
        globalContext={mockGlobalContext}
        authInfo={authInfoWithPageNum}
      />
    );

    await waitFor(() => {
      expect(mockModule.getInitialPage).toHaveBeenCalledWith('5');
      expect(screen.getByText('初始页面: test-page')).toBeInTheDocument();
    });
  });

  it('应该处理模块加载错误', async () => {
    mockModuleRegistry.getByUrl.mockReturnValue(null);
    mockModuleRegistry.getModuleByUrl.mockReturnValue(null);

    render(
      <ModuleRouter 
        globalContext={mockGlobalContext}
        authInfo={mockAuthInfo}
      />
    );

    await waitFor(() => {
      expect(
        screen.getByText('模块加载失败: 未找到URL对应的模块: /test')
      ).toBeInTheDocument();
    });
  });

  it('应该调用模块生命周期方法', async () => {
    const { unmount } = render(
      <ModuleRouter 
        globalContext={mockGlobalContext}
        authInfo={mockAuthInfo}
      />
    );

    await waitFor(() => {
      expect(mockModule.onInitialize).toHaveBeenCalled();
    });

    unmount();

    expect(mockModule.onDestroy).toHaveBeenCalled();
  });

  it('应该显示加载状态', () => {
    mockModuleRegistry.initialize.mockImplementation(() => new Promise(() => {}));

    render(
      <ModuleRouter 
        globalContext={mockGlobalContext}
        authInfo={mockAuthInfo}
      />
    );

    expect(screen.getByText('正在加载测评模块...')).toBeInTheDocument();
    expect(screen.getByText('目标模块: /test')).toBeInTheDocument();
  });

});
