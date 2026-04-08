import { describe, expect, it } from 'vitest';
import { validateMappingConfig } from '@shared/services/submission/submoduleAdapter';
import {
  PAGE_CONFIGS,
  PAGE_DESC_MAP,
  PAGE_QUESTIONS,
  QUESTION_CODE_MAP,
  QUESTION_TEXT_MAP,
  ANSWER_KEY_TO_QUESTION,
  QUESTION_OPTIONS_MAP,
  getPageIdBySubPageNum,
  getSubPageNumByPageId,
  getPageConfig,
  getAllPageIds,
  getInitialPageId,
  formatAnswerValue,
  SUBMODULE_MAPPING_CONFIG,
} from '../mapping';

describe('g8-banana-browning-experiment mapping', () => {
  it('PAGE_CONFIGS should be non-empty and ordered', () => {
    expect(PAGE_CONFIGS.length).toBe(14);

    PAGE_CONFIGS.forEach((config, index) => {
      expect(config.subPageNum).toBe(index + 1);
      expect(config.pageDesc).toBe(PAGE_DESC_MAP[config.pageId]);
    });
  });

  it('pageId and subPageNum should map bidirectionally', () => {
    PAGE_CONFIGS.forEach(config => {
      expect(getPageIdBySubPageNum(config.subPageNum)).toBe(config.pageId);
      expect(getSubPageNumByPageId(config.pageId)).toBe(config.subPageNum);
      expect(getPageConfig(config.pageId)).toMatchObject({
        pageId: config.pageId,
      });
    });
  });

  it('getAllPageIds should return ordered page ids', () => {
    expect(getAllPageIds()).toEqual(PAGE_CONFIGS.map(config => config.pageId));
  });

  it('getInitialPageId should follow recovery rules', () => {
    expect(getInitialPageId()).toBe(PAGE_CONFIGS[0].pageId);
    expect(getInitialPageId(1)).toBe(PAGE_CONFIGS[0].pageId);
    expect(getInitialPageId(4.8)).toBe('banana_browning_reading');
    expect(getInitialPageId(99)).toBe(PAGE_CONFIGS[PAGE_CONFIGS.length - 1].pageId);
  });

  it('banana simulation question metadata should match the real mapping', () => {
    expect(Object.keys(PAGE_QUESTIONS)).toEqual(PAGE_CONFIGS.map(config => config.pageId));

    expect(PAGE_QUESTIONS.simulation_question_1).toEqual(['Q5_海南香蕉变黑时间']);
    expect(PAGE_QUESTIONS.simulation_question_2).toEqual(['Q6_常温储存品种']);
    expect(PAGE_QUESTIONS.simulation_question_3).toEqual(['Q7_平缓温度']);

    expect(QUESTION_CODE_MAP).toMatchObject({
      Q5: 12,
      Q6: 13,
      Q7: 14,
    });

    expect(QUESTION_TEXT_MAP).toMatchObject({
      Q5: '在模拟实验中，2℃条件下储存的海南香蕉，从开始到完全变黑需要多长时间？',
      Q6: '模拟实验表明，哪个品种的香蕉更适合在常温下储存？',
      Q7: '在模拟实验中，菲律宾香蕉在不同温度下储存时，黑变速度变化最平缓的是哪种温度条件？',
    });

    expect(ANSWER_KEY_TO_QUESTION).toMatchObject({
      Q5_海南香蕉变黑时间: 'Q5',
      Q6_常温储存品种: 'Q6',
      Q7_平缓温度: 'Q7',
    });

    expect(QUESTION_OPTIONS_MAP).toMatchObject({
      Q5: {
        A: '3天',
        B: '6天',
        C: '9天',
        D: '12天',
        E: '15天',
      },
      Q6: {
        A: '海南香蕉',
        B: '菲律宾香蕉',
      },
      Q7: {
        A: '2℃',
        B: '10℃',
        C: '18℃',
      },
    });

    expect(Object.keys(QUESTION_OPTIONS_MAP.Q5)).toEqual(['A', 'B', 'C', 'D', 'E']);
    expect(Object.keys(QUESTION_OPTIONS_MAP.Q6)).toEqual(['A', 'B']);
    expect(Object.keys(QUESTION_OPTIONS_MAP.Q7)).toEqual(['A', 'B', 'C']);
  });

  it('formatAnswerValue Q5 should normalize option labels and raw text', () => {
    expect(formatAnswerValue('Q5', 'A')).toBe('A. 3天');
    expect(formatAnswerValue('Q5', 'E')).toBe('E. 15天');
    expect(formatAnswerValue('Q5', '15天')).toBe('E. 15天');
  });

  it('formatAnswerValue should normalize Q6 and Q7 raw option text', () => {
    expect(formatAnswerValue('Q6', '海南香蕉')).toBe('A. 海南香蕉');
    expect(formatAnswerValue('Q7', '18℃')).toBe('C. 18℃');
  });

  it('formatAnswerValue unknown values should pass through', () => {
    expect(formatAnswerValue('Q5', '未知选项')).toBe('未知选项');
  });

  it('SUBMODULE_MAPPING_CONFIG should expose formatAnswerValue', () => {
    expect(SUBMODULE_MAPPING_CONFIG.formatAnswer).toBe(formatAnswerValue);
  });

  it('SUBMODULE_MAPPING_CONFIG should pass validateMappingConfig', () => {
    const result = validateMappingConfig(SUBMODULE_MAPPING_CONFIG);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
