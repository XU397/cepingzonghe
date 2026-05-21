import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writeConfigCache, readConfigCache } from '../cache';
import type { LoginPageConfig } from '../types';

const mockConfig: LoginPageConfig = {
  cacheVersion: 'v1',
  logo: { displayType: 'image', position: 'top_left' },
  title: { highlightText: 'Test', mainText: 'Platform' },
  loginBoxTitle: 'Login',
  password: { hidden: false, defaultPasswordPolicy: 'fixed_1234' },
};

describe('loginPageConfig cache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes and reads config cache', () => {
    writeConfigCache(mockConfig);
    const cached = readConfigCache();
    expect(cached).toEqual(mockConfig);
  });

  it('returns null when no cache exists', () => {
    expect(readConfigCache()).toBeNull();
  });

  it('handles corrupted cache gracefully', () => {
    localStorage.setItem('hci-login-page-config', 'not-json');
    expect(readConfigCache()).toBeNull();
  });

  it('handles localStorage unavailable', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    writeConfigCache(mockConfig);
    expect(spy).toThrow();
    spy.mockRestore();
  });
});
