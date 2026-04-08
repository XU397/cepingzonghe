import { describe, it, expect, vi } from 'vitest';
import { validateMappingConfig } from '@shared/services/submission/submoduleAdapter';
import {
  PAGE_CONFIGS,
  PAGE_DESC_MAP,
  PAGE_QUESTIONS,
  QUESTION_CODE_MAP,
  QUESTION_TEXT_MAP,
  ANSWER_KEY_TO_QUESTION,
  PAGE_ORDER,
  getInitialPage,
  resolvePageNum,
  getNavigationMode,
  getNextPageId,
  getSubPageNumByPageId,
  getTotalSteps,
  getStepIndex,
  isLastPage,
  isFirstPage,
  getDefaultTimers,
  SUBMODULE_MAPPING_CONFIG,
  TASK_DURATION,
} from '../mapping';

describe('g8-mikania mapping utilities', () => {
  const defaultPage = PAGE_CONFIGS[0].pageId;

  it('maps subPageNum to pageId and falls back to the default page', () => {
    PAGE_CONFIGS.forEach(({ subPageNum, pageId }) => {
      expect(getInitialPage(subPageNum)).toBe(pageId);
      expect(resolvePageNum(subPageNum)).toBe(pageId);
    });

    expect(getInitialPage(defaultPage)).toBe(defaultPage);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(getInitialPage('999')).toBe(defaultPage);
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('returns correct navigation mode and step index for each page', () => {
    PAGE_CONFIGS.forEach(({ pageId, navigationMode, stepIndex }) => {
      expect(getNavigationMode(pageId)).toBe(navigationMode);
      expect(getStepIndex(pageId)).toBe(stepIndex);
    });

    expect(getNavigationMode('unknown')).toBe('experiment');
    expect(getStepIndex('unknown')).toBe(0);
  });

  it('returns the next page id in the fixed order', () => {
    PAGE_ORDER.forEach((pageId, idx) => {
      const expected = idx === PAGE_ORDER.length - 1 ? null : PAGE_ORDER[idx + 1];
      expect(getNextPageId(pageId)).toBe(expected);
    });

    // 未知页面返回 null
    expect(getNextPageId('unknown')).toBeNull();
  });

  it('provides page sub numbers and defaults to the first page', () => {
    PAGE_CONFIGS.forEach(({ subPageNum, pageId }) => {
      expect(getSubPageNumByPageId(pageId)).toBe(subPageNum);
    });

    expect(getSubPageNumByPageId('not-exist')).toBe(1);
  });

  it('exposes navigation helpers and timer defaults', () => {
    expect(getTotalSteps()).toBe(PAGE_CONFIGS.filter((cfg) => cfg.navigationMode !== 'hidden').length);
    expect(isFirstPage('page_00_notice')).toBe(true);
    expect(isFirstPage('page_01_intro')).toBe(false);
    expect(isLastPage('page_06_q4_conc')).toBe(true);
    expect(isLastPage('page_05_q3_trend')).toBe(false);
    expect(getDefaultTimers()).toEqual({ task: TASK_DURATION });
  });

  it('exposes SubmoduleMappingConfig with consistent maps and formatter', () => {
    expect(SUBMODULE_MAPPING_CONFIG.PAGE_DESC_MAP).toBe(PAGE_DESC_MAP);
    expect(SUBMODULE_MAPPING_CONFIG.PAGE_QUESTIONS).toBe(PAGE_QUESTIONS);
    expect(SUBMODULE_MAPPING_CONFIG.QUESTION_CODE_MAP).toBe(QUESTION_CODE_MAP);
    expect(SUBMODULE_MAPPING_CONFIG.QUESTION_TEXT_MAP).toBe(QUESTION_TEXT_MAP);
    expect(SUBMODULE_MAPPING_CONFIG.ANSWER_KEY_TO_QUESTION).toBe(ANSWER_KEY_TO_QUESTION);
    expect(SUBMODULE_MAPPING_CONFIG.PAGE_CONFIGS.map((cfg) => cfg.pageId)).toEqual(
      PAGE_CONFIGS.map((cfg) => cfg.pageId),
    );

    const formatter = SUBMODULE_MAPPING_CONFIG.formatAnswer;
    expect(typeof formatter).toBe('function');
    expect(formatter?.('Q2', 'A')).toBe('A. 0mg/ml');
    expect(formatter?.('Q2', '0mg/ml')).toBe('A. 0mg/ml');
    expect(formatter?.('Q4a', '是')).toBe('A. 是');
    expect(formatter?.('Q1', '说明理由')).toBe('说明理由');
    expect(formatter?.('Q3', 'B')).toBe('B. 逐渐降低');
    expect(formatter?.('Q3', null)).toBe('');
  });

  it('应通过 validateMappingConfig 验证', () => {
    const result = validateMappingConfig(SUBMODULE_MAPPING_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
