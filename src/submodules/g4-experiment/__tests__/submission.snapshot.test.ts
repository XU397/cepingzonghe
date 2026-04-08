import { describe, it, expect } from 'vitest';
import { validateMappingConfig as validateSharedMappingConfig } from '@shared/services/submission/submoduleAdapter';
import { PAGE_CONFIGS } from '../constants/pageConfig';
import {
  ANSWER_KEY_TO_QUESTION,
  PAGE_DESC_MAP,
  PAGE_QUESTIONS,
  QUESTION_CODE_MAP,
  QUESTION_TEXT_MAP,
  SUBMODULE_MAPPING_CONFIG,
  validateMappingConfig,
} from '../mapping';

describe('g4-experiment 提交数据快照', () => {
  describe('Mapping 配置验证', () => {
    it('应通过配置验证', () => {
      const result = validateMappingConfig();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('所有页面应有描述', () => {
      PAGE_CONFIGS.forEach(({ pageId }) => {
        expect(PAGE_DESC_MAP[pageId]).toBeDefined();
        expect(PAGE_DESC_MAP[pageId]).not.toBe('');
      });
    });

    it('所有问题应有编码', () => {
      Object.values(PAGE_QUESTIONS)
        .flat()
        .forEach(questionKey => {
          const questionId = ANSWER_KEY_TO_QUESTION[questionKey];
          expect(questionId).toBeDefined();
          expect(QUESTION_CODE_MAP[questionId]).toBeDefined();
        });
    });
  });

  describe('PAGE_QUESTIONS 配置完整性', () => {
    it('页面 ID 与 PAGE_CONFIGS 对齐且问题键映射有效', () => {
      const pageIds = PAGE_CONFIGS.map(config => config.pageId);
      expect(Object.keys(PAGE_QUESTIONS)).toEqual(pageIds);

      Object.entries(PAGE_QUESTIONS).forEach(([pageId, questionKeys]) => {
        expect(Array.isArray(questionKeys)).toBe(true);
        questionKeys.forEach(questionKey => {
          const questionId = ANSWER_KEY_TO_QUESTION[questionKey];
          expect(questionId).toBeDefined();
          expect(QUESTION_CODE_MAP[questionId]).toBeDefined();
          expect(QUESTION_TEXT_MAP[questionId]).toBeDefined();
        });
      });
    });
  });

  describe('SUBMODULE_MAPPING_CONFIG 结构', () => {
    it('包含规范字段并通过共享适配器校验', () => {
      expect(SUBMODULE_MAPPING_CONFIG.PAGE_CONFIGS.map(config => config.pageId)).toEqual(
        PAGE_CONFIGS.map(config => config.pageId)
      );
      SUBMODULE_MAPPING_CONFIG.PAGE_CONFIGS.forEach(config => {
        expect(typeof config.title).toBe('string');
      });
      expect(SUBMODULE_MAPPING_CONFIG.PAGE_DESC_MAP).toBe(PAGE_DESC_MAP);
      expect(SUBMODULE_MAPPING_CONFIG.PAGE_QUESTIONS).toBe(PAGE_QUESTIONS);
      expect(SUBMODULE_MAPPING_CONFIG.QUESTION_CODE_MAP).toBe(QUESTION_CODE_MAP);
      expect(SUBMODULE_MAPPING_CONFIG.QUESTION_TEXT_MAP).toBe(QUESTION_TEXT_MAP);
      expect(SUBMODULE_MAPPING_CONFIG.ANSWER_KEY_TO_QUESTION).toBe(ANSWER_KEY_TO_QUESTION);
      expect(typeof SUBMODULE_MAPPING_CONFIG.getSubPageNumByPageId).toBe('function');
      expect(typeof SUBMODULE_MAPPING_CONFIG.formatAnswer).toBe('function');

      const sharedResult = validateSharedMappingConfig(SUBMODULE_MAPPING_CONFIG);
      expect(sharedResult.valid).toBe(true);
      expect(sharedResult.errors).toHaveLength(0);
    });
  });
});
