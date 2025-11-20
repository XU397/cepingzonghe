import { describe, it, expect } from 'vitest';
import {
  validatePage,
  getMissingFields,
  getValidationErrors,
} from '../Component.jsx';

const defaultAnswers = {
  Q1_控制变量原因: null,
  Q2_抑制作用浓度: null,
  Q3_发芽率趋势: null,
  Q4a_菟丝子有效性: null,
  Q4b_结论理由: null,
};

const buildState = (overrides = {}) => {
  const base = {
    noticeCountdown: 38,
    noticeConfirmed: false,
    answers: { ...defaultAnswers },
    ...overrides,
  };

  if (overrides.answers) {
    base.answers = { ...defaultAnswers, ...overrides.answers };
  }

  return base;
};

describe('validation rules', () => {
  it('enforces countdown + checkbox on notice page', () => {
    const locked = buildState();
    expect(validatePage('page_00_notice', locked)).toBe(false);
    expect(getMissingFields('page_00_notice', locked)).toEqual(['倒计时未结束', '注意事项确认']);

    const countdownDone = buildState({ noticeCountdown: 0, noticeConfirmed: false });
    expect(validatePage('page_00_notice', countdownDone)).toBe(false);
    expect(getValidationErrors('page_00_notice', countdownDone)).toHaveProperty('checkbox');

    const ready = buildState({ noticeCountdown: 0, noticeConfirmed: true });
    expect(validatePage('page_00_notice', ready)).toBe(true);
  });

  it('requires minimum lengths and whitelisted options', () => {
    const q1TooShort = buildState({ answers: { Q1_控制变量原因: '1234' } });
    expect(validatePage('page_02_step_q1', q1TooShort)).toBe(false);
    expect(getValidationErrors('page_02_step_q1', q1TooShort).Q1_控制变量原因).toContain('当前4个');

    const q1Ok = buildState({ answers: { Q1_控制变量原因: '12345' } });
    expect(getMissingFields('page_02_step_q1', q1Ok)).toEqual([]);

    const invalidSingleChoice = buildState({ answers: { Q2_抑制作用浓度: 'Z' } });
    expect(validatePage('page_04_q2_data', invalidSingleChoice)).toBe(false);
    expect(getMissingFields('page_04_q2_data', invalidSingleChoice)).toEqual(['Q2_抑制作用浓度']);

    const validSingleChoice = buildState({ answers: { Q3_发芽率趋势: 'B' } });
    expect(validatePage('page_05_q3_trend', validSingleChoice)).toBe(true);
  });

  it('demands both Q4 answers and surfaces granular errors', () => {
    const missingAll = buildState();
    expect(validatePage('page_06_q4_conc', missingAll)).toBe(false);
    expect(getMissingFields('page_06_q4_conc', missingAll)).toEqual([
      'Q4a_菟丝子有效性',
      'Q4b_结论理由',
    ]);

    const partial = buildState({
      answers: { Q4a_菟丝子有效性: '是', Q4b_结论理由: 'short' },
    });
    const errors = getValidationErrors('page_06_q4_conc', partial);
    expect(errors).toMatchObject({
      Q4b_结论理由: expect.stringContaining('至少10个字符'),
    });

    const satisfied = buildState({
      answers: { Q4a_菟丝子有效性: '否', Q4b_结论理由: '足够长的结论文本' },
    });
    expect(validatePage('page_06_q4_conc', satisfied)).toBe(true);
    expect(getValidationErrors('page_06_q4_conc', satisfied)).toEqual({});
  });
});
