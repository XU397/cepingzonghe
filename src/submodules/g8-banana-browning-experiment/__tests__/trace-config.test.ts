import { describe, expect, it } from 'vitest';
import {
  PAGE_CONFIGS,
  TRACE_PAGE_CONFIGS,
  getPageConfig,
  getTracePageConfigByLegacyPageId,
  getTracePageConfigByStandardPageId,
  isTraceStandardPage,
} from '../mapping';

describe('g8 banana trace page config', () => {
  it('keeps legacy PAGE_CONFIGS stable and adds exactly 13 L2 pages', () => {
    expect(PAGE_CONFIGS).toHaveLength(14);
    expect(TRACE_PAGE_CONFIGS).toHaveLength(13);
    expect(isTraceStandardPage('page_01_intro')).toBe(true);
    expect(isTraceStandardPage('intro_notice')).toBe(false);
    expect(getTracePageConfigByLegacyPageId('intro_notice')).toBeUndefined();
  });

  it('maps every L2 trace page back to an existing legacy page', () => {
    TRACE_PAGE_CONFIGS.forEach((config, index) => {
      expect(config.pageIndex).toBe(index + 1);
      expect(getPageConfig(config.legacyPageId)).toBeDefined();
      expect(getTracePageConfigByLegacyPageId(config.legacyPageId)).toBe(config);
      expect(getTracePageConfigByStandardPageId(config.standardPageId)).toBe(config);
      expect(config.lifecycleMode).toBe('l2-trace');
      expect(config.pageType).toMatch(/^[A-E]\d_/);
    });
  });

  it('uses registry page IDs in the required order', () => {
    expect(TRACE_PAGE_CONFIGS.map(config => config.standardPageId)).toEqual([
      'page_01_intro',
      'page_02_question_generation',
      'page_03_factor_selection',
      'page_04_transition',
      'page_05_plan_generation',
      'page_06_method_evaluation',
      'page_07_experiment_intro',
      'page_08_simulation_explore',
      'page_09_experiment_question_1',
      'page_10_experiment_question_2',
      'page_11_experiment_question_3',
      'page_12_solution_selection',
      'page_13_finish',
    ]);
  });

  it('binds critical fields, questions, content, and experiment params', () => {
    expect(getTracePageConfigByLegacyPageId('banana_mystery')?.requiredFields).toEqual([
      'input_question_1',
    ]);
    expect(getTracePageConfigByLegacyPageId('banana_mystery')?.contentIds).toEqual([
      'chat_bubble_02_01',
      'chat_bubble_02_02',
      'chat_bubble_02_03',
      'chat_bubble_02_04',
      'chat_bubble_02_05',
      'instruction_text_02_01',
    ]);
    expect(getTracePageConfigByLegacyPageId('banana_browning_reading')?.requiredFields).toEqual([
      'factor_selection',
    ]);
    expect(getTracePageConfigByLegacyPageId('banana_browning_reading')?.contentIds).toEqual([
      'factor_card_1',
      'factor_card_2',
    ]);
    expect(getTracePageConfigByLegacyPageId('banana_browning_design')?.requiredFields).toEqual([
      'input_idea_1',
      'input_idea_2',
      'input_idea_3',
    ]);
    expect(getTracePageConfigByLegacyPageId('simulation_question_1')?.questions).toEqual({
      Q5: {
        questionId: 'question_1',
        fieldId: 'question_1_answer',
        options: {
          A: 'option_a',
          B: 'option_b',
          C: 'option_c',
          D: 'option_d',
          E: 'option_e',
        },
      },
    });
    expect(getTracePageConfigByLegacyPageId('simulation_question_2')?.questions).toEqual({
      Q6: {
        questionId: 'question_2',
        fieldId: 'question_2_answer',
        options: {
          A: 'option_a',
          B: 'option_b',
        },
      },
    });
    expect(getTracePageConfigByLegacyPageId('simulation_question_3')?.questions).toEqual({
      Q7: {
        questionId: 'question_3',
        fieldId: 'question_3_answer',
        options: {
          A: 'option_a',
          B: 'option_b',
          C: 'option_c',
        },
      },
    });
    [
      'banana_browning_simulation_main',
      'simulation_question_1',
      'simulation_question_2',
      'simulation_question_3',
    ].forEach(pageId => {
      expect(getTracePageConfigByLegacyPageId(pageId)?.experimentParams).toEqual({
        days: 'exp_param_days',
      });
    });
    expect(getTracePageConfigByLegacyPageId('solution_selection')?.requiredFields).toEqual([
      'plan_table',
      'reason_text',
    ]);
    expect(getTracePageConfigByLegacyPageId('solution_selection')?.fieldIds).toEqual([
      'chart_evidence_1',
      'plan_table',
      'reason_text',
    ]);
  });
});
