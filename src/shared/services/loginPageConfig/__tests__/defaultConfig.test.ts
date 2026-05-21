import { describe, it, expect } from 'vitest';
import { DEFAULT_LOGIN_PAGE_CONFIG } from '../defaultConfig';

describe('DEFAULT_LOGIN_PAGE_CONFIG', () => {
  it('has all required logo fields', () => {
    expect(DEFAULT_LOGIN_PAGE_CONFIG.logo).toHaveProperty('displayType');
    expect(DEFAULT_LOGIN_PAGE_CONFIG.logo).toHaveProperty('position');
  });

  it('has all required title fields', () => {
    expect(DEFAULT_LOGIN_PAGE_CONFIG.title.highlightText).toBeTruthy();
    expect(DEFAULT_LOGIN_PAGE_CONFIG.title.mainText).toBeTruthy();
  });

  it('has loginBoxTitle', () => {
    expect(DEFAULT_LOGIN_PAGE_CONFIG.loginBoxTitle).toBeTruthy();
  });

  it('has password config', () => {
    expect(DEFAULT_LOGIN_PAGE_CONFIG.password).toHaveProperty('hidden');
    expect(DEFAULT_LOGIN_PAGE_CONFIG.password).toHaveProperty('defaultPasswordPolicy');
    expect(DEFAULT_LOGIN_PAGE_CONFIG.password.defaultPasswordPolicy).toBe('fixed_1234');
  });

  it('matches current hardcoded values', () => {
    expect(DEFAULT_LOGIN_PAGE_CONFIG.title.highlightText).toBe('学生问题解决能力');
    expect(DEFAULT_LOGIN_PAGE_CONFIG.title.mainText).toBe('监测平台');
    expect(DEFAULT_LOGIN_PAGE_CONFIG.title.subtitleText).toBe('数据驱动的监测与分析平台');
    expect(DEFAULT_LOGIN_PAGE_CONFIG.loginBoxTitle).toBe('请登录，开启你的科学探究之旅');
    expect(DEFAULT_LOGIN_PAGE_CONFIG.logo.displayType).toBe('image');
    expect(DEFAULT_LOGIN_PAGE_CONFIG.password.hidden).toBe(false);
  });
});
