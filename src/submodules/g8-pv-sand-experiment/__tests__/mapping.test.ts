import { describe, it, expect } from 'vitest';
import {
  PAGE_CONFIGS,
  PAGE_DESC_MAP,
  PAGE_QUESTIONS,
  QUESTION_CODE_MAP,
  QUESTION_TEXT_MAP,
  ANSWER_KEY_TO_QUESTION,
  QUESTION_OPTIONS_MAP,
  INTERNAL_TO_STANDARD_KEY,
  getPageIdBySubPageNum,
  getSubPageNumByPageId,
  getPageConfig,
  getAllPageIds,
  getInitialPageId,
  formatAnswerValue,
  SUBMODULE_MAPPING_CONFIG,
  HISTORY_CODE_BASE,
} from '../mapping';
import { validateMappingConfig } from '@shared/services/submission/submoduleAdapter';

const expectedPageOrder = [
  'instructions_cover',
  'background_notice',
  'experiment_design',
  'tutorial_simulation',
  'experiment_task1',
  'experiment_task2',
  'conclusion_analysis',
] as const;

const expectedStepIndex = [0, 1, 2, 3, 4, 5, 6];

describe('g8-pv-sand-experiment mapping', () => {
  describe('PAGE_CONFIGS 常量', () => {
    it('包含7个页面并保持顺序与关键字段', () => {
      expect(PAGE_CONFIGS).toHaveLength(expectedPageOrder.length);

      expectedPageOrder.forEach((pageId, index) => {
        const config = PAGE_CONFIGS[index];

        expect(config.pageId).toBe(pageId);
        expect(config.subPageNum).toBe(index + 1);
        expect(config.pageDesc).toBe(PAGE_DESC_MAP[pageId]);
        expect(['notice', 'experiment']).toContain(config.type);
        expect(['hidden', 'experiment', 'questionnaire']).toContain(config.navigationMode);
        expect(config.stepIndex).toBe(expectedStepIndex[index]);
        expect(config.pageDesc.length).toBeGreaterThan(0);
      });
    });

    it('subPageNum 与 pageId 双向映射一致，并提供完整配置', () => {
      expectedPageOrder.forEach((pageId, index) => {
        const subPageNum = index + 1;

        expect(getPageIdBySubPageNum(subPageNum)).toBe(pageId);
        expect(getSubPageNumByPageId(pageId)).toBe(subPageNum);
        expect(getPageConfig(pageId)).toMatchObject({ pageId, subPageNum });
      });

      expect(getPageIdBySubPageNum(0)).toBe('instructions_cover');
      expect(getPageIdBySubPageNum(999)).toBe('instructions_cover');
      expect(getSubPageNumByPageId('unknown' as any)).toBe(1);
      expect(getPageConfig('unknown' as any)).toBeUndefined();
    });

    it('getAllPageIds 返回有序页面列表', () => {
      expect(getAllPageIds()).toEqual([...expectedPageOrder]);
    });
  });

  describe('映射常量完整性', () => {
    it('PAGE_DESC_MAP 与 PAGE_CONFIGS 对齐且无空值', () => {
      expect(Object.keys(PAGE_DESC_MAP)).toEqual([...expectedPageOrder]);
      Object.values(PAGE_DESC_MAP).forEach((desc) => {
        expect(typeof desc).toBe('string');
        expect(desc.length).toBeGreaterThan(0);
      });
    });

    it('PAGE_QUESTIONS / ANSWER_KEY_TO_QUESTION / QUESTION_CODE_MAP 对齐', () => {
      const answerKeys = expectedPageOrder.flatMap((pageId) => PAGE_QUESTIONS[pageId]);
      expect(answerKeys.length).toBeGreaterThan(0);
      expect(Object.keys(PAGE_QUESTIONS)).toEqual([...expectedPageOrder]);

      answerKeys.forEach((answerKey) => {
        const questionId = ANSWER_KEY_TO_QUESTION[answerKey];
        expect(typeof questionId).toBe('string');
        expect(QUESTION_CODE_MAP[questionId]).toBeGreaterThan(0);
        expect(QUESTION_TEXT_MAP[questionId]).toBeTruthy();
      });

      const codes = Object.values(QUESTION_CODE_MAP);
      expect(new Set(codes).size).toBe(codes.length);
    });

    it('QUESTION_OPTIONS_MAP 提供单选题选项文案', () => {
      expect(QUESTION_OPTIONS_MAP.Q2.A).toBe('有板区');
      expect(QUESTION_OPTIONS_MAP.Q2.B).toBe('无板区');
      expect(QUESTION_OPTIONS_MAP.Q4a.A).toBe('是');
      expect(QUESTION_OPTIONS_MAP.Q4a.B).toBe('否');
    });

    it('INTERNAL_TO_STANDARD_KEY 映射到标准答案键', () => {
      const allAnswerKeys = expectedPageOrder.flatMap((pageId) => PAGE_QUESTIONS[pageId]);
      Object.values(INTERNAL_TO_STANDARD_KEY).forEach((standardKey) => {
        expect(allAnswerKeys).toContain(standardKey);
      });
    });

    it('HISTORY_CODE_BASE 使用规范化起始值', () => {
      expect(HISTORY_CODE_BASE).toBe(100);
    });
  });

  describe('getInitialPageId 页面恢复逻辑', () => {
    it('无参数或 <=1 时回到封面页', () => {
      expect(getInitialPageId()).toBe('instructions_cover');
      expect(getInitialPageId(1)).toBe('instructions_cover');
      expect(getInitialPageId(0)).toBe('instructions_cover');
    });

    it('在范围内返回对应页面', () => {
      expect(getInitialPageId(2)).toBe('background_notice');
      expect(getInitialPageId(3)).toBe('experiment_design');
      expect(getInitialPageId(5)).toBe('experiment_task1');
      expect(getInitialPageId(7)).toBe('conclusion_analysis');
    });

    it('浮点数向下取整，超出范围返回最后一页', () => {
      expect(getInitialPageId(4.9)).toBe('tutorial_simulation');
      expect(getInitialPageId(6.1)).toBe('experiment_task2');
      expect(getInitialPageId(99)).toBe('conclusion_analysis');
    });
  });

  describe('formatAnswerValue 答案格式化', () => {
    it('将选项值格式化为含选项文案的字符串', () => {
      expect(formatAnswerValue('Q2', 'A')).toBe('A. 有板区');
      expect(formatAnswerValue('Q2', 'B')).toBe('B. 无板区');
      expect(formatAnswerValue('Q2', 'withPanel')).toBe('A. 有板区');
      expect(formatAnswerValue('Q2', 'noPanel')).toBe('B. 无板区');
      expect(formatAnswerValue('Q4a', '是')).toBe('A. 是');
      expect(formatAnswerValue('Q4a', '否')).toBe('B. 否');
      expect(formatAnswerValue('Q4a', 'B')).toBe('B. 否');
    });

    it('未配置选项的题目按原值返回，空值输出空字符串', () => {
      expect(formatAnswerValue('Q3', '风速随高度递减')).toBe('风速随高度递减');
      expect(formatAnswerValue('Q99', '自定义值')).toBe('自定义值');
      expect(formatAnswerValue('Q2', null)).toBe('');
      expect(formatAnswerValue('Q2', undefined)).toBe('');
      expect(formatAnswerValue('Q2', '')).toBe('');
    });
  });

  describe('SUBMODULE_MAPPING_CONFIG 验证', () => {
    it('通过 validateMappingConfig 校验', () => {
      const result = validateMappingConfig(SUBMODULE_MAPPING_CONFIG);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(SUBMODULE_MAPPING_CONFIG.PAGE_CONFIGS).toHaveLength(expectedPageOrder.length);
    });

    it('每个 PAGE_CONFIG 包含规范要求的必备字段', () => {
      const requiredFields = [
        'pageId',
        'subPageNum',
        'title',
        'questionKeys',
        'type',
        'navigationMode',
        'stepIndex',
        'pageDesc',
      ] as const;

      SUBMODULE_MAPPING_CONFIG.PAGE_CONFIGS.forEach((config, index) => {
        requiredFields.forEach((field) => {
          expect(config).toHaveProperty(field);
          // 验证字段不为 undefined
          expect((config as Record<string, unknown>)[field]).not.toBeUndefined();
        });

        // 验证字段类型
        expect(typeof config.pageId).toBe('string');
        expect(typeof config.subPageNum).toBe('number');
        expect(typeof config.title).toBe('string');
        expect(Array.isArray(config.questionKeys)).toBe(true);

        // 验证扩展字段类型（规范 §3.1 要求）
        const extConfig = config as Record<string, unknown>;
        expect(['notice', 'experiment']).toContain(extConfig.type);
        expect(['hidden', 'experiment', 'questionnaire']).toContain(extConfig.navigationMode);
        expect(typeof extConfig.stepIndex).toBe('number');
        expect(typeof extConfig.pageDesc).toBe('string');

        // 验证 title 与 pageDesc 非空
        expect(config.title.length).toBeGreaterThan(0);
        expect((extConfig.pageDesc as string).length).toBeGreaterThan(0);

        // 验证 subPageNum 与索引对应
        expect(config.subPageNum).toBe(index + 1);
      });
    });

    it('PAGE_CONFIGS 的 pageId 与 expectedPageOrder 对齐', () => {
      const pageIds = SUBMODULE_MAPPING_CONFIG.PAGE_CONFIGS.map((c) => c.pageId);
      expect(pageIds).toEqual([...expectedPageOrder]);
    });
  });
});
