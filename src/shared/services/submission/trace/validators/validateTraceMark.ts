import {
  getContentRegistryPage,
  getFieldRegistryPage,
  hasContentId,
  hasFieldId,
  hasQuestionId,
  TRACE_EVENT_TYPES,
  TRACE_PAGE_TYPES,
  TRACE_TARGET_TYPES,
} from '../contracts';
import type { TraceEventValue } from '../types';

const EVENT_TYPE_SET = new Set<string>(TRACE_EVENT_TYPES);
const PAGE_TYPE_SET = new Set<string>(TRACE_PAGE_TYPES);
const TARGET_TYPE_SET = new Set<string>(TRACE_TARGET_TYPES);
const TRACE_TIMESTAMP_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}(Z|[+-]\d{2}:\d{2})$/;
const VALIDATION_STATUS_SET = new Set(['success', 'blocked', 'auto', 'timeout', 'none']);

const TEXT_EVENTS = new Set(['TEXT_FOCUS', 'TEXT_CHANGE', 'TEXT_BLUR']);
const CONTENT_EVENTS = new Set([
  'CONTENT_EXPOSE',
  'CONTENT_ACTIVATE',
  'CONTENT_VIEW',
  'OPEN_MODAL',
  'CLOSE_MODAL',
]);
const ANSWER_EVENTS = new Set(['CHECKBOX_TOGGLE', 'SELECT_ANSWER']);
const ROW_EVENTS = new Set(['ADD_ROW', 'DELETE_ROW', 'SET_PLAN_PARAM', 'SELECT_BEST']);
const CHART_EVENTS = new Set(['CHART_HOVER']);
const EXP_PARAM_EVENTS = new Set(['SET_EXP_PARAM']);
const EXP_EXECUTE_EVENTS = new Set(['EXECUTE_EXP']);
const EXP_RESET_EVENTS = new Set(['RESET_EXP']);
const SUBMIT_EVENTS = new Set(['SUBMIT_ATTEMPT']);
const LEGACY_EVENT_TYPES = new Set([
  'page_enter',
  'page_exit',
  'next_click',
  'auto_submit',
  'flow_context',
  'input_change',
  'radio_select',
  'checkbox_check',
  'checkbox_uncheck',
  'simulation_operation',
  'simulation_run_result',
  'click',
  'change',
]);

const assertCondition = (condition: unknown, message: string) => {
  if (!condition) {
    throw new Error(`TraceMark validation failed: ${message}`);
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const asValueObject = (operation: any, index: number): TraceEventValue => {
  assertCondition(
    isRecord(operation.value),
    `operationList[${index}].value must be an object`
  );
  return operation.value as TraceEventValue;
};

const requireStringField = (
  value: TraceEventValue,
  key: keyof TraceEventValue,
  index: number
): string => {
  const fieldValue = value[key];
  assertCondition(
    typeof fieldValue === 'string' && fieldValue.length > 0,
    `operationList[${index}].value.${String(key)} is required`
  );
  return fieldValue as string;
};

const getTraceRegistryPage = (pageId: string): Record<string, unknown> | undefined =>
  getFieldRegistryPage(pageId) || getContentRegistryPage(pageId);

const pageHasQuestionRegistry = (pageId: string): boolean => {
  const fieldPage = getFieldRegistryPage(pageId);
  const questions = isRecord(fieldPage?.questions) ? fieldPage.questions : {};
  return Object.keys(questions).length > 0;
};

const addOptionIds = (optionIds: Set<string>, value: unknown) => {
  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (typeof item === 'string') {
        optionIds.add(item);
      } else if (isRecord(item)) {
        const id = item.option_id ?? item.optionId ?? item.id;
        if (typeof id === 'string') {
          optionIds.add(id);
        }
      }
    });
    return;
  }

  if (isRecord(value)) {
    Object.keys(value).forEach((id) => optionIds.add(id));
  }
};

const getRegisteredOptionIds = (pageId: string, questionId: string): string[] => {
  const fieldPage = getFieldRegistryPage(pageId);
  const questions = isRecord(fieldPage?.questions) ? fieldPage.questions : {};
  const fields = isRecord(fieldPage?.fields) ? fieldPage.fields : {};
  const question = isRecord(questions[questionId]) ? questions[questionId] : undefined;
  const optionIds = new Set<string>();

  if (question) {
    addOptionIds(optionIds, question.option_ids);
    addOptionIds(optionIds, question.options);
    addOptionIds(optionIds, question.option_slots);

    const answerFieldId = typeof question.answer_field_id === 'string' ? question.answer_field_id : '';
    const answerField = isRecord(fields[answerFieldId]) ? fields[answerFieldId] : undefined;
    if (answerField) {
      addOptionIds(optionIds, answerField.option_ids);
      addOptionIds(optionIds, answerField.options);
      addOptionIds(optionIds, answerField.option_slots);
    }
  }

  if (optionIds.size === 0 && isRecord(fieldPage?.option_slots)) {
    addOptionIds(optionIds, fieldPage.option_slots);
  }

  return [...optionIds];
};

const validateOperation = (operation: any, index: number) => {
  assertCondition(operation.code === index + 1, `operationList[${index}].code must be ${index + 1}`);
  assertCondition(typeof operation.targetElement === 'string' && operation.targetElement.length > 0, `operationList[${index}].targetElement is required`);
  assertCondition(!LEGACY_EVENT_TYPES.has(operation.eventType), `operationList[${index}].eventType is legacy, not L2 trace eventType`);
  assertCondition(EVENT_TYPE_SET.has(operation.eventType), `operationList[${index}].eventType is not an L2 trace eventType`);
  assertCondition(typeof operation.time === 'string' && operation.time.length > 0, `operationList[${index}].time is required`);
  assertCondition(TRACE_TIMESTAMP_PATTERN.test(operation.time), `operationList[${index}].time must match trace timestamp format`);

  const value = asValueObject(operation, index);
  assertCondition(typeof value.trace_id === 'string' && value.trace_id.length > 0, `operationList[${index}].value.trace_id is required`);
  assertCondition(typeof value.page_id === 'string' && value.page_id.length > 0, `operationList[${index}].value.page_id is required`);
  const registeredPage = getTraceRegistryPage(value.page_id);
  assertCondition(registeredPage, `operationList[${index}].value.page_id is not found in trace registry`);
  assertCondition(typeof value.target_id === 'string' && value.target_id.length > 0, `operationList[${index}].value.target_id is required`);
  assertCondition(PAGE_TYPE_SET.has(value.page_type), `operationList[${index}].value.page_type is invalid`);
  if (typeof registeredPage?.page_type === 'string') {
    assertCondition(
      value.page_type === registeredPage.page_type,
      `operationList[${index}].value.page_type does not match trace registry`
    );
  }
  assertCondition(TARGET_TYPE_SET.has(value.target_type), `operationList[${index}].value.target_type is invalid`);
  assertCondition(isRecord(value.metadata), `operationList[${index}].value.metadata is required`);

  if (TEXT_EVENTS.has(operation.eventType)) {
    const fieldId = requireStringField(value, 'field_id', index);
    assertCondition(hasFieldId(value.page_id, fieldId), `operationList[${index}].value.field_id is not in Field Registry`);
  }
  if (CONTENT_EVENTS.has(operation.eventType)) {
    const contentId = requireStringField(value, 'content_id', index);
    assertCondition(hasContentId(value.page_id, contentId), `operationList[${index}].value.content_id is not in Content Registry`);
  }
  if (ANSWER_EVENTS.has(operation.eventType)) {
    const questionId = requireStringField(value, 'question_id', index);
    const optionId = requireStringField(value, 'option_id', index);
    if (pageHasQuestionRegistry(value.page_id)) {
      assertCondition(hasQuestionId(value.page_id, questionId), `operationList[${index}].value.question_id is not in Field Registry`);
    }
    const registeredOptionIds = getRegisteredOptionIds(value.page_id, questionId);
    if (registeredOptionIds.length > 0) {
      assertCondition(
        registeredOptionIds.includes(optionId),
        `operationList[${index}].value.option_id is not in Field Registry`
      );
    }
  }
  if (ROW_EVENTS.has(operation.eventType)) {
    requireStringField(value, 'row_id', index);
  }
  if (operation.eventType === 'SET_PLAN_PARAM') {
    requireStringField(value, 'param_id', index);
  }
  if (CHART_EVENTS.has(operation.eventType)) {
    requireStringField(value, 'chart_id', index);
    requireStringField(value, 'point_id', index);
  }
  if (EXP_PARAM_EVENTS.has(operation.eventType)) {
    requireStringField(value, 'param_id', index);
    requireStringField(value, 'param_name', index);
  }
  if (EXP_EXECUTE_EVENTS.has(operation.eventType)) {
    requireStringField(value, 'exp_run_id', index);
  }
  if (EXP_RESET_EVENTS.has(operation.eventType)) {
    assertCondition(
      isRecord(value.metadata.param_snapshot_before_reset) && typeof value.metadata.reset_count === 'number',
      `operationList[${index}].value reset metadata is required`
    );
  }
  if (SUBMIT_EVENTS.has(operation.eventType)) {
    requireStringField(value, 'submit_attempt_id', index);
    const validationStatus = requireStringField(value, 'validation_status', index);
    assertCondition(
      VALIDATION_STATUS_SET.has(validationStatus),
      `operationList[${index}].value.validation_status is invalid`
    );
  }
};

export function validateTraceMark(mark: any) {
  assertCondition(mark && typeof mark === 'object', 'mark must be an object');
  assertCondition(Array.isArray(mark.operationList), 'operationList must be an array');
  assertCondition(mark.operationList.length > 0, 'operationList must not be empty');
  mark.operationList.forEach(validateOperation);
  assertCondition(
    mark.operationList.some((operation: any) => operation.eventType === 'START_PAGE'),
    'operationList must contain START_PAGE'
  );
  return mark;
}
