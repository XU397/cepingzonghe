import { describe, expect, it } from 'vitest';
import { shouldHideUserInfoBar, shouldRedirectToFlowRoute } from '../appShellVisibility.js';

describe('AppShell UserInfoBar route visibility', () => {
  it('hides on the root login route only before authentication has loaded', () => {
    expect(shouldHideUserInfoBar('/', { isAuthenticated: false, moduleUrl: '' })).toBe(true);
  });

  it('does not treat a persisted moduleUrl as an active session by itself', () => {
    expect(shouldHideUserInfoBar('/', { isAuthenticated: false, moduleUrl: '/flow/g7' })).toBe(true);
  });

  it('shows on the root route after login while ModuleRouter is preparing/navigating to Flow', () => {
    expect(shouldHideUserInfoBar('/', {
      isAuthenticated: true,
      moduleUrl: '/flow/g7',
      currentUser: { studentName: '测试学生' },
      batchCode: 'B001',
      examNo: 'E001',
    })).toBe(false);
  });

  it('always hides on the explicit login route', () => {
    expect(shouldHideUserInfoBar('/login', { isAuthenticated: true, moduleUrl: '/flow/g7' })).toBe(true);
  });
});

describe('AppShell Flow route delegation', () => {
  it('redirects the root app route to the real Flow route after login', () => {
    expect(shouldRedirectToFlowRoute('/', '/flow/g7', {
      isAuthenticated: true,
      currentUser: { studentName: '测试学生' },
      batchCode: 'B001',
      examNo: 'E001',
    })).toBe(true);
  });

  it('does not redirect once already on the Flow route', () => {
    expect(shouldRedirectToFlowRoute('/flow/g7', '/flow/g7', {
      isAuthenticated: true,
      currentUser: { studentName: '测试学生' },
      batchCode: 'B001',
      examNo: 'E001',
    })).toBe(false);
  });

  it('does not redirect unauthenticated, incomplete, or non-flow sessions', () => {
    expect(shouldRedirectToFlowRoute('/', '/flow/g7', { isAuthenticated: false })).toBe(false);
    expect(shouldRedirectToFlowRoute('/', '/flow/g7', {
      isAuthenticated: true,
      currentUser: null,
      batchCode: 'B001',
      examNo: 'E001',
    })).toBe(false);
    expect(shouldRedirectToFlowRoute('/', '/seven-grade', {
      isAuthenticated: true,
      currentUser: { studentName: '测试学生' },
      batchCode: 'B001',
      examNo: 'E001',
    })).toBe(false);
  });
});
