import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';

vi.mock('react-router-dom', () => ({
  __esModule: true,
  useNavigate: () => vi.fn(),
}));

let resolveModuleRoute;
beforeAll(async () => {
  ({ resolveModuleRoute } = await import('../ModuleRouter.jsx'));
});

const createStubRegistry = (moduleDef) => ({
  getByUrl: vi.fn().mockReturnValue(moduleDef),
  initialize: vi.fn().mockResolvedValue(undefined),
});

describe('resolveModuleRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('locates module via registry and持久化 module/page keys', async () => {
    const moduleDef = {
      moduleId: 'test-module',
      displayName: 'Test Module',
      url: '/flow/sample-flow',
      version: '1.0.0',
      ModuleComponent: () => null,
      getInitialPage: vi.fn().mockReturnValue('Page_01_Precautions'),
    };
    const registry = createStubRegistry(moduleDef);

    const result = await resolveModuleRoute(
      {
        url: '/flow/sample-flow',
        pageNum: '3',
      },
      registry
    );

    expect(registry.getByUrl).toHaveBeenCalledWith('/flow/sample-flow');
    expect(moduleDef.getInitialPage).toHaveBeenCalledWith('3');
    expect(result.initialPageId).toBe('Page_01_Precautions');
    expect(localStorage.getItem('core.module/url')).toBe('/flow/sample-flow');
    expect(localStorage.getItem('core.page/pageNum')).toBe('3');
  });

  it('clears stored pageNum when input为空', async () => {
    localStorage.setItem('core.page/pageNum', '9');
    const moduleDef = {
      moduleId: 'test-module',
      displayName: 'Test Module',
      url: '/test',
      version: '1.0.0',
      ModuleComponent: () => null,
      getInitialPage: vi.fn().mockReturnValue('Page_01_Precautions'),
    };
    const registry = createStubRegistry(moduleDef);

    await resolveModuleRoute(
      {
        url: '/test',
        pageNum: null,
      },
      registry
    );

    expect(localStorage.getItem('core.page/pageNum')).toBeNull();
  });
});
