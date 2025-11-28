import { describe, expect, it } from 'vitest';
import EventTypes from '@shared/services/submission/eventTypes.js';
import {
  ALLOWED_EVENT_TYPES,
  RESERVED_TARGET_ELEMENTS,
  validateMarkObject,
  type MarkObject,
  type Operation,
  type Answer,
} from '@shared/services/submission/schema.ts';

type CategoryFlags = {
  requiresInput?: boolean;
  requiresRadio?: boolean;
  requiresCheckbox?: boolean;
  requiresSimulation?: boolean;
  requiresClickBlocked?: boolean;
};

type MarkFixture = MarkObject & {
  pageId: string;
  expectedAnswerLabels: string[];
  categories: CategoryFlags;
};

const FLOW_ID = 'flow-demo';
const SUBMODULE_ID = 'g8-pv-sand-experiment';
const STEP_INDEX = 0;
const FLOW_PREFIX = `${FLOW_ID}/${SUBMODULE_ID}/${STEP_INDEX}`;
const ISO_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/;
const PAGE_DESC_PREFIX = new RegExp(`^\\[${FLOW_ID}/${SUBMODULE_ID}/${STEP_INDEX}\\]`);

const baseTime = Date.parse('2025-11-22T10:00:00Z');
const isoTime = (offsetSeconds: number) => new Date(baseTime + offsetSeconds * 1000).toISOString();

const withCodes = <T extends object>(items: T[]): Array<T & { code: number }> =>
  items.map((item, index) => ({ ...item, code: index + 1 }));

const flowContextOp = (pageId: string, timeOffset: number): Operation => ({
  targetElement: 'flow_context',
  eventType: EventTypes.FLOW_CONTEXT,
  value: { flowId: FLOW_ID, submoduleId: SUBMODULE_ID, stepIndex: STEP_INDEX, pageId },
  time: isoTime(timeOffset),
});

const submitSuccessOp = (pageNumber: string, timeOffset: number): Operation => ({
  targetElement: `P${pageNumber}_submit`,
  eventType: EventTypes.PAGE_SUBMIT_SUCCESS,
  value: { duration: timeOffset, channel: 'usePageSubmission' },
  time: isoTime(timeOffset),
});

const clickBlockedValue = (reason: string, missing: string[], offset: number) => ({
  reason,
  missing,
  timestamp: isoTime(offset),
});

const createMark = (config: {
  pageNumber: string;
  pageId: string;
  pageDesc: string;
  operations: Operation[];
  answers: Answer[];
  beginOffset: number;
  endOffset: number;
  expectedAnswerLabels: string[];
  categories: CategoryFlags;
}): MarkFixture => ({
  pageNumber: config.pageNumber,
  pageDesc: config.pageDesc,
  operationList: withCodes(config.operations),
  answerList: withCodes(config.answers),
  beginTime: isoTime(config.beginOffset),
  endTime: isoTime(config.endOffset),
  imgList: [],
  pageId: config.pageId,
  expectedAnswerLabels: config.expectedAnswerLabels,
  categories: config.categories,
});

const marks: MarkFixture[] = [
  createMark({
    pageNumber: '0.1',
    pageId: 'instructions_cover',
    pageDesc: `[${FLOW_PREFIX}] 任务C：光伏治沙封面`,
    operations: [
      {
        targetElement: 'P0.1_page',
        eventType: EventTypes.PAGE_ENTER,
        value: 'instructions_cover',
        time: isoTime(0),
      },
      {
        targetElement: 'P0.1_timer',
        eventType: EventTypes.TIMER_START,
        value: JSON.stringify({ duration: 30, unit: 'second' }),
        time: isoTime(1),
      },
      {
        targetElement: 'P0.1_block',
        eventType: EventTypes.CLICK_BLOCKED,
        value: clickBlockedValue('countdown_not_finished', ['instructions_read'], 2),
        time: isoTime(2),
      },
      {
        targetElement: 'P0.1_timer',
        eventType: EventTypes.TIMER_COMPLETE,
        value: JSON.stringify({ duration: 30, unit: 'second', remaining: 0 }),
        time: isoTime(31),
      },
      {
        targetElement: 'P0.1_confirm',
        eventType: EventTypes.CHECKBOX_CHECK,
        value: 'checked',
        time: isoTime(32),
      },
      {
        targetElement: 'P0.1_next',
        eventType: EventTypes.NEXT_CLICK,
        value: 'to_background_notice',
        time: isoTime(33),
      },
      {
        targetElement: 'P0.1_page',
        eventType: EventTypes.PAGE_EXIT,
        value: 'instructions_cover',
        time: isoTime(34),
      },
      flowContextOp('instructions_cover', 35),
      submitSuccessOp('0.1', 36),
    ],
    answers: [
      {
        targetElement: 'P0.1_确认：已阅读任务C封面注意事项并勾选复选框？',
        value: 'A. 是，已阅读并确认',
      },
    ],
    beginOffset: 0,
    endOffset: 36,
    expectedAnswerLabels: ['确认：已阅读任务C封面注意事项并勾选复选框？'],
    categories: { requiresClickBlocked: true },
  }),
  createMark({
    pageNumber: '0.2',
    pageId: 'background_notice',
    pageDesc: `[${FLOW_PREFIX}] 背景引入说明`,
    operations: [
      {
        targetElement: 'P0.2_page',
        eventType: EventTypes.PAGE_ENTER,
        value: 'background_notice',
        time: isoTime(40),
      },
      {
        targetElement: 'P0.2_timer',
        eventType: EventTypes.TIMER_START,
        value: JSON.stringify({ duration: 5, unit: 'second', autoSubmit: true }),
        time: isoTime(41),
      },
      {
        targetElement: 'P0.2_block',
        eventType: EventTypes.CLICK_BLOCKED,
        value: clickBlockedValue('countdown_running', ['background_read'], 42),
        time: isoTime(42),
      },
      {
        targetElement: 'P0.2_timer',
        eventType: EventTypes.TIMER_COMPLETE,
        value: JSON.stringify({
          duration: 5,
          unit: 'second',
          remaining: 0,
          trigger: 'auto_submit',
        }),
        time: isoTime(46),
      },
      {
        targetElement: 'P0.2_system',
        eventType: EventTypes.AUTO_SUBMIT,
        value: { reason: 'timer_expired', duration_seconds: 5 },
        time: isoTime(46),
      },
      {
        targetElement: 'P0.2_page',
        eventType: EventTypes.PAGE_EXIT,
        value: 'background_notice',
        time: isoTime(47),
      },
      flowContextOp('background_notice', 47),
      submitSuccessOp('0.2', 48),
    ],
    answers: [
      {
        targetElement: 'P0.2_确认：已阅读背景引入说明？',
        value: 'A. 是，已阅读背景说明',
      },
    ],
    beginOffset: 40,
    endOffset: 48,
    expectedAnswerLabels: ['确认：已阅读背景引入说明？'],
    categories: { requiresClickBlocked: true },
  }),
  createMark({
    pageNumber: '0.3',
    pageId: 'experiment_design',
    pageDesc: `[${FLOW_PREFIX}] 实验方案设计`,
    operations: [
      {
        targetElement: 'P0.3_page',
        eventType: EventTypes.PAGE_ENTER,
        value: 'experiment_design',
        time: isoTime(80),
      },
      {
        targetElement: 'P0.3_设计原因输入框',
        eventType: EventTypes.INPUT_FOCUS,
        value: '',
        time: isoTime(81),
      },
      {
        targetElement: 'P0.3_设计原因输入框',
        eventType: EventTypes.INPUT_CHANGE,
        value: { prev: '', next: '为了对照实验', prevLength: 0, nextLength: 6 },
        time: isoTime(82),
      },
      {
        targetElement: 'P0.3_设计原因输入框',
        eventType: EventTypes.INPUT_DELETE,
        value: { action: 'delete', prevLength: 6, nextLength: 4 },
        time: isoTime(83),
      },
      {
        targetElement: 'P0.3_设计原因输入框',
        eventType: EventTypes.INPUT_CHANGE,
        value: {
          prev: '为了对照实验',
          next: '为了对照实验，排除其他变量干扰',
          prevLength: 4,
          nextLength: 16,
        },
        time: isoTime(84),
      },
      {
        targetElement: 'P0.3_设计原因输入框',
        eventType: EventTypes.INPUT_BLUR,
        value: '为了对照实验，排除其他变量干扰',
        time: isoTime(85),
      },
      {
        targetElement: 'P0.3_next',
        eventType: EventTypes.CLICK_BLOCKED,
        value: clickBlockedValue('input_too_short', ['designReason'], 86),
        time: isoTime(86),
      },
      {
        targetElement: 'P0.3_next',
        eventType: EventTypes.NEXT_CLICK,
        value: 'go_tutorial',
        time: isoTime(87),
      },
      {
        targetElement: 'P0.3_page',
        eventType: EventTypes.PAGE_EXIT,
        value: 'experiment_design',
        time: isoTime(88),
      },
      flowContextOp('experiment_design', 88),
      submitSuccessOp('0.3', 89),
    ],
    answers: [
      {
        targetElement: 'P0.3_问题1：请描述实验方案设计思路',
        value: '为了对照实验，排除其他变量干扰',
      },
    ],
    beginOffset: 80,
    endOffset: 89,
    expectedAnswerLabels: ['问题1：请描述实验方案设计思路'],
    categories: { requiresInput: true, requiresClickBlocked: true },
  }),
  createMark({
    pageNumber: '0.4',
    pageId: 'tutorial_simulation',
    pageDesc: `[${FLOW_PREFIX}] 模拟实验操作指引`,
    operations: [
      {
        targetElement: 'P0.4_page',
        eventType: EventTypes.PAGE_ENTER,
        value: 'tutorial_simulation',
        time: isoTime(120),
      },
      {
        targetElement: 'P0.4_高度调节',
        eventType: EventTypes.SIMULATION_OPERATION,
        value: { action: 'adjust_height', toHeight: 20 },
        time: isoTime(121),
      },
      {
        targetElement: 'P0.4_开始按钮',
        eventType: EventTypes.SIMULATION_TIMING_STARTED,
        value: { height: 20, context: 'tutorial' },
        time: isoTime(122),
      },
      {
        targetElement: 'P0.4_实验结果',
        eventType: EventTypes.SIMULATION_RUN_RESULT,
        value: { height: 20, withPanelSpeed: 2.09, withoutPanelSpeed: 2.37 },
        time: isoTime(123),
      },
      {
        targetElement: 'P0.4_next',
        eventType: EventTypes.CLICK_BLOCKED,
        value: clickBlockedValue('tutorial_not_completed', ['tutorialCompleted'], 124),
        time: isoTime(124),
      },
      {
        targetElement: 'P0.4_next',
        eventType: EventTypes.NEXT_CLICK,
        value: 'go_experiment_task1',
        time: isoTime(125),
      },
      {
        targetElement: 'P0.4_page',
        eventType: EventTypes.PAGE_EXIT,
        value: 'tutorial_simulation',
        time: isoTime(126),
      },
      flowContextOp('tutorial_simulation', 126),
      submitSuccessOp('0.4', 127),
    ],
    answers: [
      {
        targetElement: 'P0.4_确认：已完成模拟教程？',
        value: 'A. 已完成模拟教程',
      },
    ],
    beginOffset: 120,
    endOffset: 127,
    expectedAnswerLabels: ['确认：已完成模拟教程？'],
    categories: { requiresSimulation: true, requiresClickBlocked: true },
  }),
  createMark({
    pageNumber: '0.5',
    pageId: 'experiment_task1',
    pageDesc: `[${FLOW_PREFIX}] 实验探究-1`,
    operations: [
      {
        targetElement: 'P0.5_page',
        eventType: EventTypes.PAGE_ENTER,
        value: 'experiment_task1',
        time: isoTime(160),
      },
      {
        targetElement: 'P0.5_高度调节',
        eventType: EventTypes.SIMULATION_OPERATION,
        value: { action: 'adjust_height', toHeight: 50 },
        time: isoTime(161),
      },
      {
        targetElement: 'P0.5_开始按钮',
        eventType: EventTypes.SIMULATION_TIMING_STARTED,
        value: { height: 50, context: 'experiment_task1' },
        time: isoTime(162),
      },
      {
        targetElement: 'P0.5_实验结果',
        eventType: EventTypes.SIMULATION_RUN_RESULT,
        value: {
          heightLevel: 50,
          withPanelSpeed: 2.25,
          noPanelSpeed: 2.62,
          timestamp: isoTime(163),
        },
        time: isoTime(163),
      },
      {
        targetElement: 'P0.5_单选题',
        eventType: EventTypes.RADIO_SELECT,
        value: 'A. 有光伏板区风速更小',
        time: isoTime(164),
      },
      {
        targetElement: 'P0.5_next',
        eventType: EventTypes.CLICK_BLOCKED,
        value: clickBlockedValue('choice_required', ['experiment1Choice'], 165),
        time: isoTime(165),
      },
      {
        targetElement: 'P0.5_next',
        eventType: EventTypes.NEXT_CLICK,
        value: 'go_experiment_task2',
        time: isoTime(166),
      },
      {
        targetElement: 'P0.5_page',
        eventType: EventTypes.PAGE_EXIT,
        value: 'experiment_task1',
        time: isoTime(167),
      },
      flowContextOp('experiment_task1', 167),
      submitSuccessOp('0.5', 168),
    ],
    answers: [
      {
        targetElement: 'P0.5_问题2：根据实验探究-1结果，哪一区域的风速更小？',
        value: 'A. 有光伏板区风速更小',
      },
      {
        targetElement: 'P0.5_实验探究1：实验历史数据',
        value:
          '{"collectedData":{"heightLevel":50,"withPanelSpeed":2.25,"noPanelSpeed":2.62,"timestamp":"' +
          isoTime(163) +
          '"}}',
      },
    ],
    beginOffset: 160,
    endOffset: 168,
    expectedAnswerLabels: [
      '问题2：根据实验探究-1结果，哪一区域的风速更小？',
      '实验探究1：实验历史数据',
    ],
    categories: {
      requiresSimulation: true,
      requiresRadio: true,
      requiresClickBlocked: true,
    },
  }),
  createMark({
    pageNumber: '0.6',
    pageId: 'experiment_task2',
    pageDesc: `[${FLOW_PREFIX}] 实验探究-2`,
    operations: [
      {
        targetElement: 'P0.6_page',
        eventType: EventTypes.PAGE_ENTER,
        value: 'experiment_task2',
        time: isoTime(200),
      },
      {
        targetElement: 'P0.6_高度调节',
        eventType: EventTypes.SIMULATION_OPERATION,
        value: { action: 'adjust_height', toHeight: 100 },
        time: isoTime(201),
      },
      {
        targetElement: 'P0.6_开始按钮',
        eventType: EventTypes.SIMULATION_TIMING_STARTED,
        value: { height: 100, context: 'experiment_task2' },
        time: isoTime(202),
      },
      {
        targetElement: 'P0.6_实验结果',
        eventType: EventTypes.SIMULATION_RUN_RESULT,
        value: {
          heightLevel: 100,
          withPanelSpeed: 1.66,
          noPanelSpeed: 2.77,
          timestamp: isoTime(203),
        },
        time: isoTime(203),
      },
      {
        targetElement: 'P0.6_多选题',
        eventType: EventTypes.CHECKBOX_CHECK,
        value: '选择: 在无板区风速随高度增加而减小；在有板区风速随高度增加而增大',
        time: isoTime(204),
      },
      {
        targetElement: 'P0.6_多选题',
        eventType: EventTypes.CHECKBOX_UNCHECK,
        value: '取消选择: 在两区域，风速都随高度增加而增加',
        time: isoTime(205),
      },
      {
        targetElement: 'P0.6_next',
        eventType: EventTypes.CLICK_BLOCKED,
        value: clickBlockedValue('multi_select_required', ['experiment2Analysis'], 206),
        time: isoTime(206),
      },
      {
        targetElement: 'P0.6_next',
        eventType: EventTypes.NEXT_CLICK,
        value: 'go_conclusion',
        time: isoTime(207),
      },
      {
        targetElement: 'P0.6_page',
        eventType: EventTypes.PAGE_EXIT,
        value: 'experiment_task2',
        time: isoTime(208),
      },
      flowContextOp('experiment_task2', 208),
      submitSuccessOp('0.6', 209),
    ],
    answers: [
      {
        targetElement: 'P0.6_问题3：风速随高度变化的描述，正确的是？',
        value: JSON.stringify([
          '在无板区，风速随高度增加而减小；在有板区风速随高度增加而增大',
        ]),
      },
      {
        targetElement: 'P0.6_实验探究2：实验历史数据',
        value:
          '{"collectedData":{"heightLevel":100,"withPanelSpeed":1.66,"noPanelSpeed":2.77,"timestamp":"' +
          isoTime(203) +
          '"}}',
      },
    ],
    beginOffset: 200,
    endOffset: 209,
    expectedAnswerLabels: [
      '问题3：风速随高度变化的描述，正确的是？',
      '实验探究2：实验历史数据',
    ],
    categories: {
      requiresSimulation: true,
      requiresCheckbox: true,
      requiresClickBlocked: true,
    },
  }),
  createMark({
    pageNumber: '0.7',
    pageId: 'conclusion_analysis',
    pageDesc: `[${FLOW_PREFIX}] 结论分析`,
    operations: [
      {
        targetElement: 'P0.7_page',
        eventType: EventTypes.PAGE_ENTER,
        value: 'conclusion_analysis',
        time: isoTime(240),
      },
      {
        targetElement: 'P0.7_单选题',
        eventType: EventTypes.RADIO_SELECT,
        value: 'A. 是，光伏板有效改变近地表风速',
        time: isoTime(241),
      },
      {
        targetElement: 'P0.7_理由输入框',
        eventType: EventTypes.INPUT_FOCUS,
        value: '',
        time: isoTime(242),
      },
      {
        targetElement: 'P0.7_理由输入框',
        eventType: EventTypes.INPUT_CHANGE,
        value: { prev: '', next: '风速下降，蒸发减弱', prevLength: 0, nextLength: 10 },
        time: isoTime(243),
      },
      {
        targetElement: 'P0.7_理由输入框',
        eventType: EventTypes.INPUT_DELETE,
        value: { action: 'delete', prevLength: 10, nextLength: 8 },
        time: isoTime(244),
      },
      {
        targetElement: 'P0.7_理由输入框',
        eventType: EventTypes.INPUT_CHANGE,
        value: {
          prev: '风速下降，蒸发减弱',
          next: '风速下降，蒸发减弱，说明光伏板起到遮挡作用',
          prevLength: 8,
          nextLength: 19,
        },
        time: isoTime(245),
      },
      {
        targetElement: 'P0.7_理由输入框',
        eventType: EventTypes.INPUT_BLUR,
        value: '风速下降，蒸发减弱，说明光伏板起到遮挡作用',
        time: isoTime(246),
      },
      {
        targetElement: 'P0.7_next',
        eventType: EventTypes.CLICK_BLOCKED,
        value: clickBlockedValue('conclusion_incomplete', ['selectedOption', 'reason'], 247),
        time: isoTime(247),
      },
      {
        targetElement: 'P0.7_next',
        eventType: EventTypes.NEXT_CLICK,
        value: 'complete_flow',
        time: isoTime(248),
      },
      {
        targetElement: 'P0.7_page',
        eventType: EventTypes.PAGE_EXIT,
        value: 'conclusion_analysis',
        time: isoTime(249),
      },
      flowContextOp('conclusion_analysis', 249),
      submitSuccessOp('0.7', 250),
    ],
    answers: [
      {
        targetElement: 'P0.7_问题4：光伏板是否能够有效改变近地表风速？',
        value: 'A. 是，光伏板有效改变近地表风速',
      },
      {
        targetElement: 'P0.7_问题4理由：请结合数据说明理由',
        value: '风速下降，蒸发减弱，说明光伏板起到遮挡作用',
      },
    ],
    beginOffset: 240,
    endOffset: 250,
    expectedAnswerLabels: [
      '问题4：光伏板是否能够有效改变近地表风速？',
      '问题4理由：请结合数据说明理由',
    ],
    categories: {
      requiresInput: true,
      requiresRadio: true,
      requiresClickBlocked: true,
    },
  }),
];

const isReservedTarget = (target: string) => RESERVED_TARGET_ELEMENTS.includes(target as any);

const expectMinimalEvents = (mark: MarkFixture) => {
  const events = new Set(mark.operationList.map((op) => op.eventType));
  expect(events.has(EventTypes.PAGE_ENTER)).toBe(true);
  expect(events.has(EventTypes.PAGE_EXIT)).toBe(true);
  expect(events.has(EventTypes.FLOW_CONTEXT)).toBe(true);
  expect(events.has(EventTypes.PAGE_SUBMIT_SUCCESS)).toBe(true);
  if (mark.categories.requiresInput) {
    expect(events.has(EventTypes.INPUT_FOCUS)).toBe(true);
    expect(events.has(EventTypes.INPUT_CHANGE)).toBe(true);
    expect(events.has(EventTypes.INPUT_BLUR)).toBe(true);
  }
  if (mark.categories.requiresRadio) {
    expect(events.has(EventTypes.RADIO_SELECT)).toBe(true);
  }
  if (mark.categories.requiresCheckbox) {
    expect(
      events.has(EventTypes.CHECKBOX_CHECK) || events.has(EventTypes.CHECKBOX_UNCHECK),
    ).toBe(true);
  }
  if (mark.categories.requiresSimulation) {
    expect(events.has(EventTypes.SIMULATION_OPERATION)).toBe(true);
    expect(events.has(EventTypes.SIMULATION_TIMING_STARTED)).toBe(true);
    expect(events.has(EventTypes.SIMULATION_RUN_RESULT)).toBe(true);
  }
  if (mark.categories.requiresClickBlocked) {
    expect(events.has(EventTypes.CLICK_BLOCKED)).toBe(true);
  }
};

describe('g8-pv-sand-experiment submission format', () => {
  it('passes schema validation for all fixtures', () => {
    marks.forEach((mark) => expect(() => validateMarkObject(mark)).not.toThrow());
  });

  it('uses correct pageNumber and pageDesc patterns', () => {
    const pageNumberRegex = /^\d+\.\d+$/;
    const pageDescRegex = /^\[[\w-]+\/[\w-]+\/\d+\]/;
    marks.forEach((mark) => {
      expect(mark.pageNumber).toMatch(pageNumberRegex);
      expect(mark.pageDesc).toMatch(pageDescRegex);
      expect(mark.pageDesc).toMatch(PAGE_DESC_PREFIX);
    });
  });

  it('enforces targetElement prefixes for operations and descriptive labels for answers', () => {
    marks.forEach((mark) => {
      const opPrefix = new RegExp(`^P${mark.pageNumber}_`);
      mark.operationList.forEach((op) => {
        if (!isReservedTarget(op.targetElement)) {
          expect(op.targetElement).toMatch(opPrefix);
        }
      });

      const expectedLabels = new Set(mark.expectedAnswerLabels);
      mark.answerList.forEach((answer) => {
        expect(answer.targetElement).toMatch(opPrefix);
        const suffix = answer.targetElement.replace(opPrefix, '');
        expect(expectedLabels.has(suffix)).toBe(true);
        expect(suffix.length).toBeGreaterThan(4);
      });
    });
  });

  it('only emits allowed event types and sequential codes', () => {
    marks.forEach((mark) => {
      mark.operationList.forEach((op, index) => {
        expect(ALLOWED_EVENT_TYPES.includes(op.eventType)).toBe(true);
        expect(op.code).toBe(index + 1);
      });
      mark.answerList.forEach((answer, index) => {
        expect(answer.code).toBe(index + 1);
      });
    });
  });

  it('answers are non-empty and use full text values', () => {
    marks.forEach((mark) => {
      mark.answerList.forEach((answer) => {
        expect(answer.value.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('click_blocked payloads include reason, missing list, and timestamp', () => {
    marks.forEach((mark) => {
      const blockedEvents = mark.operationList.filter(
        (op) => op.eventType === EventTypes.CLICK_BLOCKED,
      );
      expect(blockedEvents.length).toBeGreaterThan(0);
      blockedEvents.forEach((op) => {
        const value = op.value as Record<string, unknown>;
        expect(typeof value.reason).toBe('string');
        expect((value.reason as string).length).toBeGreaterThan(0);
        expect(Array.isArray(value.missing)).toBe(true);
        expect((value.missing as unknown[]).length).toBeGreaterThan(0);
        expect(typeof value.timestamp).toBe('string');
        expect((value.timestamp as string)).toMatch(ISO_REGEX);
      });
    });
  });

  it('satisfies minimal event sets per page type', () => {
    marks.forEach((mark) => expectMinimalEvents(mark));
  });
});
