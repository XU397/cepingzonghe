import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLoginPageConfig } from '../api';

describe('fetchLoginPageConfig', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns config on successful response', async () => {
    const mockConfig = {
      logo: { displayType: 'image', position: 'top_left' },
      title: { highlightText: 'Test', mainText: 'Platform' },
      loginBoxTitle: 'Login',
      password: { hidden: true, defaultPasswordPolicy: 'fixed_1234' },
    };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 200, data: mockConfig }),
    });

    const result = await fetchLoginPageConfig();
    expect(result).toEqual(mockConfig);
  });

  it('returns null when data is null', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 200, data: null }),
    });

    const result = await fetchLoginPageConfig();
    expect(result).toBeNull();
  });

  it('throws on network failure', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));

    await expect(fetchLoginPageConfig()).rejects.toThrow('Network error');
  });

  it('throws on non-ok response', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: false,
      status: 500,
    });

    await expect(fetchLoginPageConfig()).rejects.toThrow('returned 500');
  });

  it('throws on non-200 code in response body', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ code: 500, msg: 'Server error' }),
    });

    await expect(fetchLoginPageConfig()).rejects.toThrow('Server error');
  });
});
