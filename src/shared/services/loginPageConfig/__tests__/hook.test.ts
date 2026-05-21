import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useLoginPageConfig } from '../index';
import type { LoginPageConfig } from '../types';

const remoteConfig: LoginPageConfig = {
  cacheVersion: 'remote-v1',
  logo: { displayType: 'text', position: 'top_center', text: 'RemoteLogo' },
  title: { highlightText: 'Remote', mainText: 'Title' },
  loginBoxTitle: 'Remote Login',
  password: { hidden: true, defaultPasswordPolicy: 'fixed_1234' },
};

describe('useLoginPageConfig', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('starts with default config', () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'));
    const { result } = renderHook(() => useLoginPageConfig());
    expect(result.current.title.highlightText).toBe('学生问题解决能力');
  });

  it('updates to remote config on successful fetch', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 200, data: remoteConfig }),
    });

    const { result } = renderHook(() => useLoginPageConfig());

    await waitFor(() => {
      expect(result.current.title.highlightText).toBe('Remote');
    });
    expect(result.current.loginBoxTitle).toBe('Remote Login');
  });

  it('falls back to cache when API fails', async () => {
    const cacheEntry = {
      cacheVersion: 'cached-v1',
      config: remoteConfig,
      cachedAt: new Date().toISOString(),
    };
    localStorage.setItem('hci-login-page-config', JSON.stringify(cacheEntry));

    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useLoginPageConfig());

    await waitFor(() => {
      expect(result.current.title.highlightText).toBe('Remote');
    });
  });

  it('stays with default when API fails and no cache', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('fail'));

    const { result } = renderHook(() => useLoginPageConfig());

    await waitFor(() => {
      expect(result.current.title.highlightText).toBe('学生问题解决能力');
    });
  });

  it('caches config after successful fetch', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 200, data: remoteConfig }),
    });

    renderHook(() => useLoginPageConfig());

    await waitFor(() => {
      const cached = JSON.parse(localStorage.getItem('hci-login-page-config') || '{}');
      expect(cached.config.title.highlightText).toBe('Remote');
    });
  });

  it('deduplicates concurrent remote config requests', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 200, data: remoteConfig }),
    });

    const first = renderHook(() => useLoginPageConfig());
    const second = renderHook(() => useLoginPageConfig());

    await waitFor(() => {
      expect(first.result.current.title.highlightText).toBe('Remote');
      expect(second.result.current.title.highlightText).toBe('Remote');
    });
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });
});
