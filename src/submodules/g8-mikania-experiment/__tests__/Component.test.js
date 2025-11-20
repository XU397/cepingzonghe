import { describe, it, expect } from 'vitest';
import { QUESTION_CODE_MAP, validatePage } from '../Component.jsx';

const defaultAnswers = {
  Q1_控制变量原因: null,
  Q2_抑制作用浓度: null,
  Q3_发芽率趋势: null,
  Q4a_菟丝子有效性: null,
  Q4b_结论理由: null,
};

const buildState = (overrides = {}) => {
  const state = {
    noticeCountdown: 38,
    noticeConfirmed: false,
    answers: { ...defaultAnswers },
    ...overrides,
  };

  if (overrides.answers) {
    state.answers = { ...defaultAnswers, ...overrides.answers };
  }

  return state;
};

describe('Component exports', () => {
  it('maintains the canonical question code mapping', () => {
    expect(QUESTION_CODE_MAP).toEqual({
      Q1: 1,
      Q2: 2,
      Q3: 3,
      Q4a: 4,
      Q4b: 5,
    });
  });

  describe('validatePage', () => {
    it('requires countdown结束且勾选确认才能离开 Page 00', () => {
      expect(validatePage('page_00_notice', buildState())).toBe(false);
      expect(
        validatePage(
          'page_00_notice',
          buildState({ noticeCountdown: 0, noticeConfirmed: true }),
        ),
      ).toBe(true);
    });

    it('enforces文本长度与单选题的规则', () => {
      expect(
        validatePage('page_02_step_q1', buildState({ answers: { Q1_控制变量原因: '1234' } })),
      ).toBe(false);
      expect(
        validatePage('page_02_step_q1', buildState({ answers: { Q1_控制变量原因: '12345' } })),
      ).toBe(true);

      expect(
        validatePage(
          'page_04_q2_data',
          buildState({ answers: { Q2_抑制作用浓度: 'Z' } }),
        ),
      ).toBe(false);
      expect(
        validatePage(
          'page_04_q2_data',
          buildState({ answers: { Q2_抑制作用浓度: 'A' } }),
        ),
      ).toBe(true);

      expect(
        validatePage(
          'page_05_q3_trend',
          buildState({ answers: { Q3_发芽率趋势: 'B' } }),
        ),
      ).toBe(true);
    });

    it('requires Page 06 判断题和填空题均满足条件', () => {
      expect(
        validatePage(
          'page_06_q4_conc',
          buildState({
            answers: {
              Q4a_菟丝子有效性: '是',
              Q4b_结论理由: '太短',
            },
          }),
        ),
      ).toBe(false);

      expect(
        validatePage(
          'page_06_q4_conc',
          buildState({
            answers: {
              Q4a_菟丝子有效性: '否',
              Q4b_结论理由: '已经超过十个字符的结论理由',
            },
          }),
        ),
      ).toBe(true);
    });

    it('always允许无必填要求的页面通过', () => {
      expect(validatePage('page_01_intro', buildState())).toBe(true);
      expect(validatePage('page_03_sim_exp', buildState())).toBe(true);
      expect(validatePage('unknown', buildState())).toBe(true);
    });
  });
});
