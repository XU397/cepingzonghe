import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import AppContext from '@/context/AppContext.jsx';
import STORAGE_KEYS from '@shared/services/storage/storageKeys.js';
import UserInfoBar from '../UserInfoBar.jsx';

function renderWithContext(value, props = {}) {
  return render(
    <AppContext.Provider value={value}>
      <UserInfoBar {...props} />
    </AppContext.Provider>
  );
}

describe('UserInfoBar visibility', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
    localStorage.clear();
  });

  it('renders on module/flow routes when forced even before AppContext auth has hydrated', () => {
    localStorage.setItem(STORAGE_KEYS.CORE_USER, JSON.stringify({ studentName: '测试学生' }));
    localStorage.setItem(STORAGE_KEYS.CORE_BATCH_CODE, 'B001');
    localStorage.setItem(STORAGE_KEYS.CORE_EXAM_NO, 'E001');

    renderWithContext({ currentUser: null, isAuthenticated: false }, { forceVisible: true });

    expect(screen.getByText('测试学生')).toBeInTheDocument();
    expect(screen.getByText(/批次：B001/)).toBeInTheDocument();
    expect(screen.getByText(/考号：E001/)).toBeInTheDocument();
  });

  it('still hides when not forced and no authenticated user exists', () => {
    const { container } = renderWithContext({ currentUser: null, isAuthenticated: false });

    expect(container.firstChild).toBeNull();
  });

  it('does not render a stale default user when forced without an effective user', () => {
    const { container } = renderWithContext({ currentUser: null, isAuthenticated: false }, { forceVisible: true });

    expect(container.firstChild).toBeNull();
  });

  it('uses a stable platform name instead of the default image alt text', () => {
    localStorage.setItem(STORAGE_KEYS.CORE_USER, JSON.stringify({ studentName: '测试学生' }));

    renderWithContext({ currentUser: null, isAuthenticated: false }, { forceVisible: true });

    expect(screen.getByText('学生问题解决能力监测平台')).toBeInTheDocument();
    expect(screen.queryByText('Logo')).not.toBeInTheDocument();
  });
});
