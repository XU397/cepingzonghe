import { z } from 'zod';
import EventTypes, { EventTypeValues } from './eventTypes.js';

const REQUIRED_EVENT_TYPES = [
  'page_enter',
  'page_exit',
  'page_submit_success',
  'page_submit_failed',
  'flow_context',
  'click',
  'change',
  'input',
  'input_focus',
  'input_change',
  'input_blur',
  'input_delete',
  'focus',
  'blur',
  'select_change',
  'radio_select',
  'checkbox_check',
  'checkbox_uncheck',
  'timer_start',
  'timer_stop',
  'timer_complete',
  'next_click',
  'click_blocked',
  'auto_submit',
] as const;

/**
 * allowedEventTypes 统一收敛 schema + 运行时枚举，防止页面遗漏新增事件类型。
 * 只要 EventTypes 增补，这里的列表会自动覆盖（并兼容额外的强制事件集合）。
 */
export const ALLOWED_EVENT_TYPES = Object.freeze([
  ...new Set([...EventTypeValues, ...REQUIRED_EVENT_TYPES]),
]);

const EVENT_TYPE_SET = new Set<string>(ALLOWED_EVENT_TYPES);
const INPUT_EVENT_TYPES = new Set<string>([
  'input',
  'input_focus',
  'input_change',
  'input_blur',
  'input_delete',
]);

const DATETIME_REGEX = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
const ISO_8601_REGEX =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?$/;
const LEGACY_PAGE_NUMBER_REGEX = /^M\d+:\d+$/;
const PAGE_NUMBER_PATTERN = /^\d+\.\d+$/;
const TARGET_ELEMENT_PREFIX_REGEX = /^P\d+(?:\.\d+)?_.+/;

export const RESERVED_TARGET_ELEMENTS = Object.freeze(
  [
    'flow_context',
    'page',
    'page_submission',
  ] as const,
);

const RESERVED_TARGET_ELEMENT_SET = new Set<string>(RESERVED_TARGET_ELEMENTS);

export interface Operation {
  code: number;
  targetElement: string;
  eventType: string;
  value: string | Record<string, unknown>;
  time: string;
  pageId?: string;
}

export interface Answer {
  code: number;
  targetElement: string;
  value: string;
}

export interface MarkObject {
  pageNumber: string;
  pageDesc: string;
  operationList: Operation[];
  answerList: Answer[];
  beginTime: string;
  endTime: string;
  imgList: unknown[];
}

const isPlainRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const inputValueSnapshotSchema = z.object({
  prev: z.string({ required_error: 'prev 不能为空' }),
  next: z.string({ required_error: 'next 不能为空' }),
});

const inputValueDeleteSchema = z.object({
  action: z.literal('delete', {
    errorMap: () => ({ message: "action 必须为 'delete'" }),
  }),
  prevLength: z.number({ invalid_type_error: 'prevLength 必须为数字' })
    .int('prevLength 必须为整数')
    .min(0, 'prevLength 不能为负数'),
  nextLength: z.number({ invalid_type_error: 'nextLength 必须为数字' })
    .int('nextLength 必须为整数')
    .min(0, 'nextLength 不能为负数'),
});

const genericObjectSchema = z.record(z.any());

/**
 * pageNumber 统一使用 Flow 点分格式：<stepIndex>.<subPageNum>（如 "0.3"）。
 */
export function isValidPageNumber(pageNum: string): boolean {
  if (typeof pageNum !== 'string') return false;
  const normalized = pageNum.trim();
  if (normalized.length === 0) return false;
  if (LEGACY_PAGE_NUMBER_REGEX.test(normalized)) {
    return false;
  }
  return PAGE_NUMBER_PATTERN.test(normalized);
}

export function isValidTargetElement(target: string): boolean {
  if (typeof target !== 'string') return false;
  const normalized = target.trim();
  if (normalized.length === 0) return false;
  if (RESERVED_TARGET_ELEMENT_SET.has(normalized)) {
    return true;
  }
  return TARGET_ELEMENT_PREFIX_REGEX.test(normalized);
}

const timeSchema = z
  .string({ required_error: '时间字段不能为空' })
  .refine((value) => validateTimeFormat(value), {
    message: "时间格式必须为 'YYYY-MM-DD HH:mm:ss' 或 ISO 8601",
  });

const operationSchema: z.ZodType<Operation> = z
  .object({
    code: z.number({ invalid_type_error: 'code 必须为数字' })
      .int('code 必须为整数')
      .min(1, 'code 必须从 1 开始'),
    targetElement: z
      .string({ required_error: 'targetElement 必须为字符串' })
      .default('')
      .refine((value) => isValidTargetElement(value), {
        message: 'targetElement 必须以 "P" 开头（如 "P1_button"），系统保留字段除外',
      }),
    eventType: z
      .string({ required_error: 'eventType 不能为空' })
      .refine((value) => EVENT_TYPE_SET.has(value), {
        message: 'eventType 不属于系统支持的事件类型',
      }),
    value: z.union([z.string(), genericObjectSchema]),
    time: timeSchema,
    pageId: z
      .string({ invalid_type_error: 'pageId 必须为字符串' })
      .min(1, 'pageId 不能为空')
      .optional(),
  })
  .superRefine((operation, ctx) => {
    if (INPUT_EVENT_TYPES.has(operation.eventType)) {
      if (typeof operation.value === 'string') {
        return;
      }

      const snapshotResult = inputValueSnapshotSchema.safeParse(operation.value);
      if (snapshotResult.success) {
        return;
      }

      const deleteResult = inputValueDeleteSchema.safeParse(operation.value);
      if (deleteResult.success) {
        return;
      }

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '输入类事件的 value 必须为字符串、{prev,next} 或 delete 结构',
        path: ['value'],
      });
    }

    if (
      operation.eventType === EventTypes.FLOW_CONTEXT &&
      !isPlainRecord(operation.value)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'flow_context 事件的 value 必须为对象',
        path: ['value'],
      });
    }
  });

const answerSchema: z.ZodType<Answer> = z.object({
  code: z.number({ invalid_type_error: 'answerList.code 必须为数字' })
    .int('answerList.code 必须为整数')
    .min(1, 'answerList.code 必须从 1 开始'),
  targetElement: z
    .string({ required_error: 'answerList.targetElement 必须为字符串' })
    .default('')
    .refine((value) => isValidTargetElement(value), {
      message: 'targetElement 必须以 "P" 开头（如 "P1_button"），系统保留字段除外',
    }),
  value: z
    .string({ required_error: 'answerList.value 必须为字符串' })
    .transform((val) => val.trim())
    .refine((val) => val.length > 0, {
      message: 'answerList 中不允许空答案',
    }),
});

const markObjectSchema: z.ZodType<MarkObject> = z
  .object({
    pageNumber: z
      .string({ required_error: 'pageNumber 必须为字符串' })
      .min(1, 'pageNumber 不能为空')
      .refine((value) => isValidPageNumber(value), {
        message:
          'pageNumber 必须为 Flow 点分格式 <stepIndex>.<subPageNum>（如 "0.3"），不再支持 M 前缀或单数字格式',
      }),
    pageDesc: z
      .string({ required_error: 'pageDesc 必须为字符串' })
      .min(1, 'pageDesc 不能为空'),
    operationList: z
      .array(operationSchema, {
        invalid_type_error: 'operationList 必须为数组',
      })
      .min(1, 'operationList 至少包含一个事件'),
    answerList: z
      .array(answerSchema, { invalid_type_error: 'answerList 必须为数组' })
      .default([]),
    beginTime: timeSchema,
    endTime: timeSchema,
    imgList: z.array(z.any(), { invalid_type_error: 'imgList 必须为数组' }).default([]),
  })
  .superRefine((mark, ctx) => {
    enforceSequentialCodes('operationList', mark.operationList, ctx);
    enforceSequentialCodes('answerList', mark.answerList, ctx);
    ensureRequiredEvents(mark.operationList, ctx);
  });

const enforceSequentialCodes = (
  field: 'operationList' | 'answerList',
  items: Array<{ code: number }>,
  ctx: z.RefinementCtx,
) => {
  items.forEach((item, index) => {
    const expectedCode = index + 1;
    if (item.code !== expectedCode) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field}[${index}].code 必须为 ${expectedCode}`,
        path: [field, index, 'code'],
      });
    }
  });
};

const ensureRequiredEvents = (operationList: Operation[], ctx: z.RefinementCtx) => {
  const eventSet = new Set(operationList.map((operation) => operation.eventType));
  const hasPageEnter = eventSet.has('page_enter');
  const hasPageExit = eventSet.has('page_exit');
  const hasNextOrAuto = eventSet.has('next_click') || eventSet.has('auto_submit');

  if (!hasPageEnter || !hasPageExit || !hasNextOrAuto) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'operationList 必须包含 page_enter、page_exit，以及 next_click 或 auto_submit',
      path: ['operationList'],
    });
  }
};

export const MarkObjectSchema = markObjectSchema;

export function validateMarkObject(mark: unknown): MarkObject {
  const parsed = MarkObjectSchema.safeParse(mark);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join('.') : '数据根节点';
        return `${path}: ${issue.message}`;
      })
      .join('; ');

    throw new Error(`MarkObject 校验失败：${details}`);
  }

  return parsed.data;
}

export function validateEventType(eventType: string): boolean {
  return typeof eventType === 'string' && EVENT_TYPE_SET.has(eventType);
}

export function validateTimeFormat(time: string): boolean {
  if (typeof time !== 'string') return false;
  const normalized = time.trim();
  if (normalized.length === 0) return false;
  if (DATETIME_REGEX.test(normalized)) {
    return true;
  }
  return ISO_8601_REGEX.test(normalized);
}

export function isNonEmptyAnswer(answer: Answer): boolean {
  return typeof answer?.value === 'string' && answer.value.trim().length > 0;
}

export default MarkObjectSchema;
