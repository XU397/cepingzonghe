/**
 * @file setupTests.js
 * @description 光伏治沙模块专用测试环境配置
 * @author Claude (Test Infrastructure)
 * @created 2025-11-19
 * 
 * 配置功能:
 * - 支持SVG组件测试 (happy-dom替代jsdom for Recharts)
 * - Mock工具和Fake timers支持
 * - React Testing Library最佳实践配置
 * - 模块特定Mock预设
 */

import { vi } from 'vitest';
import '@testing-library/jest-dom';

// === Mock 全局对象 ===

// Mock localStorage with better error handling
const localStorageMock = {
  store: new Map(),
  getItem: vi.fn((key) => localStorageMock.store.get(key) || null),
  setItem: vi.fn((key, value) => {
    if (typeof value !== 'string') {
      throw new Error('localStorage value must be a string');
    }
    localStorageMock.store.set(key, value);
  }),
  removeItem: vi.fn((key) => localStorageMock.store.delete(key)),
  clear: vi.fn(() => localStorageMock.store.clear()),
  key: vi.fn((index) => Array.from(localStorageMock.store.keys())[index] || null),
  get length() { return localStorageMock.store.size; }
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
  writable: true
});

// Mock ResizeObserver for SVG components
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock requestAnimationFrame for animations
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 16); // 60 FPS
});

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id);
});

// Mock performance.now for timing tests
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => [])
  },
  writable: true
});

// Mock SVG elements for Recharts compatibility
const createSVGElementMock = (tagName) => {
  const element = document.createElement(tagName);
  // Add SVG-specific methods
  element.createSVGRect = vi.fn(() => ({
    x: 0, y: 0, width: 0, height: 0
  }));
  element.getBBox = vi.fn(() => ({
    x: 0, y: 0, width: 100, height: 50
  }));
  element.getScreenCTM = vi.fn(() => null);
  element.getComputedTextLength = vi.fn(() => 0);
  return element;
};

const originalCreateElement = document.createElement.bind(document);
document.createElement = vi.fn((tagName, options) => {
  if (['svg', 'path', 'circle', 'rect', 'text', 'g', 'defs', 'clipPath'].includes(tagName)) {
    return createSVGElementMock(tagName);
  }
  return originalCreateElement(tagName, options);
});

// Mock console methods but keep error/warn for debugging
const originalConsole = { ...console };
global.console = {
  ...originalConsole,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: originalConsole.warn, // Keep warnings for debugging
  error: originalConsole.error, // Keep errors for debugging
  group: vi.fn(),
  groupEnd: vi.fn(),
  groupCollapsed: vi.fn(),
  time: vi.fn(),
  timeEnd: vi.fn()
};

// === Test 环境工具函数 ===

/**
 * 重置所有Mock状态
 */
export const resetAllMocks = () => {
  vi.clearAllMocks();
  localStorageMock.clear();
  
  // Reset console mocks
  console.log.mockClear();
  console.debug.mockClear();
  console.info.mockClear();
};

/**
 * 创建测试用的localStorage数据
 */
export const setupTestLocalStorage = (data = {}) => {
  Object.entries(data).forEach(([key, value]) => {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
  });
};

/**
 * 验证localStorage调用
 */
export const expectLocalStorageCall = (method, key, value) => {
  if (method === 'setItem') {
    expect(localStorage.setItem).toHaveBeenCalledWith(key, value);
  } else if (method === 'getItem') {
    expect(localStorage.getItem).toHaveBeenCalledWith(key);
  } else if (method === 'removeItem') {
    expect(localStorage.removeItem).toHaveBeenCalledWith(key);
  }
};

// 测试前重置
beforeEach(() => {
  resetAllMocks();
});

// 测试后清理
afterEach(() => {
  // 恢复真实时间
  vi.useRealTimers();
});