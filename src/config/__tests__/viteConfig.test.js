import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOGIN_CONFIG_TARGET,
  resolveLoginConfigTarget,
} from '../viteProxyTargets.js';

describe('Vite login page config proxy target', () => {
  it('defaults to the public admin backend instead of the student API backend', () => {
    expect(resolveLoginConfigTarget({ VITE_API_TARGET: 'http://student-api.example' })).toBe(
      DEFAULT_LOGIN_CONFIG_TARGET
    );
  });

  it('uses VITE_LOGIN_CONFIG_TARGET when provided', () => {
    expect(
      resolveLoginConfigTarget({
        VITE_LOGIN_CONFIG_TARGET: 'http://login-config.example',
        VITE_ADMIN_API_TARGET: 'http://admin.example',
      })
    ).toBe('http://login-config.example');
  });

  it('falls back to VITE_ADMIN_API_TARGET before the built-in default', () => {
    expect(resolveLoginConfigTarget({ VITE_ADMIN_API_TARGET: 'http://admin.example' })).toBe(
      'http://admin.example'
    );
  });
});
