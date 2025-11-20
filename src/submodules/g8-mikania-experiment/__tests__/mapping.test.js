import { describe, it, expect, vi } from 'vitest';
import {
  PAGE_MAP,
  PAGE_MODES,
  PAGE_ORDER,
  getInitialPage,
  getNavigationMode,
  getNextPageId,
  getPageSubNum,
  getTotalSteps,
  getStepIndex,
  isLastPage,
  isFirstPage,
  getDefaultTimers,
  TASK_DURATION,
} from '../mapping';

describe('g8-mikania mapping utilities', () => {
  it('maps subPageNum to pageId and falls back to notice page', () => {
    Object.entries(PAGE_MAP).forEach(([subPageNum, pageId]) => {
      expect(getInitialPage(subPageNum)).toBe(pageId);
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getInitialPage('999')).toBe('page_00_notice');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('returns correct navigation mode for each page', () => {
    Object.entries(PAGE_MODES).forEach(([pageId, mode]) => {
      expect(getNavigationMode(pageId)).toBe(mode);
    });

    // 未定义页面默认为 experiment 模式
    expect(getNavigationMode('unknown')).toBe('experiment');
  });

  it('returns the next page id in the fixed order', () => {
    PAGE_ORDER.forEach((pageId, idx) => {
      const expected = idx === PAGE_ORDER.length - 1 ? null : PAGE_ORDER[idx + 1];
      expect(getNextPageId(pageId)).toBe(expected);
    });

    // 未知页面返回 null
    expect(getNextPageId('unknown')).toBeNull();
  });

  it('provides page sub numbers and defaults to 1', () => {
    Object.entries(PAGE_MAP).forEach(([subPageNum, pageId]) => {
      expect(getPageSubNum(pageId)).toBe(subPageNum);
    });

    expect(getPageSubNum()).toBe('1');
    expect(getPageSubNum('not-exist')).toBe('1');
  });

  it('exposes navigation helpers and timer defaults', () => {
    expect(getTotalSteps()).toBe(5);
    expect(getStepIndex('page_00_notice')).toBe(0);
    expect(getStepIndex('page_06_q4_conc')).toBe(5);
    expect(getStepIndex('unknown')).toBe(0);

    expect(isFirstPage('page_00_notice')).toBe(true);
    expect(isFirstPage('page_01_intro')).toBe(false);
    expect(isLastPage('page_06_q4_conc')).toBe(true);
    expect(isLastPage('page_05_q3_trend')).toBe(false);

    expect(getDefaultTimers()).toEqual({ task: TASK_DURATION });
  });
});
