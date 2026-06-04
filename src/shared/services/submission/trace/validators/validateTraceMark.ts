import {
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

const TEXT_EVENTS = new Set(['TEXT_FOCUS', 'TEXT_CHANGE', 'TEXT_BLUR']);
const CONTENT_EVENTS = new Set(['CONTENT_EXPOSE', 'CONTENT_ACTIVATE', 'CONTENT_VIEW']);
const ANSWER_EVENTS = new Set(['CHECKBOX_TOGGLE', 'SELECT_ANSWER']);
const ROW_EVENTS = new Set(['ADD_ROW', 'DELETE_ROW', 'SET_PLAN_PARAM', 'SELECT_BEST']);
const EXP_EVENTS = new Set(['EXECUTE_EXP']);
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

const asValueObject = (operation: any): TraceEventValue => {
  assertCondition(
    operation.value && typeof operation.value === 'object' && !Array.isArray(operation.value),
    `operationList[${operation.code - 1}].value must be an object`
  );
  return operation.value as TraceEventValue;
};

const validateOperation = (operation: any, index: number) => {
  assertCondition(operation.code === index + 1, `operationList[${index}].code must be ${index + 1}`);
  assertCondition(typeof operation.targetElement === 'string' && operation.targetElement.length > 0, `operationList[${index}].targetElement is required`);
  assertCondition(!LEGACY_EVENT_TYPES.has(operation.eventType), `operationList[${index}].eventType is legacy, not L2 trace eventType`);
  assertCondition(EVENT_TYPE_SET.has(operation.eventType), `operationList[${index}].eventType is not an L2 trace eventType`);
  assertCondition(typeof operation.time === 'string' && operation.time.length > 0, `operationList[${index}].time is required`);

  const value = asValueObject(operation);
  assertCondition(typeof value.trace_id === 'string' && value.trace_id.length > 0, `operationList[${index}].value.trace_id is required`);
  assertCondition(typeof value.page_id === 'string' && value.page_id.length > 0, `operationList[${index}].value.page_id is required`);
  assertCondition(PAGE_TYPE_SET.has(value.page_type), `operationList[${index}].value.page_type is invalid`);
  assertCondition(TARGET_TYPE_SET.has(value.target_type), `operationList[${index}].value.target_type is invalid`);
  assertCondition(value.metadata && typeof value.metadata === 'object', `operationList[${index}].value.metadata is required`);

  if (TEXT_EVENTS.has(operation.eventType)) {
    assertCondition(value.field_id && hasFieldId(value.page_id, value.field_id), `operationList[${index}].value.field_id is not in Field Registry`);
  }
  if (CONTENT_EVENTS.has(operation.eventType)) {
    assertCondition(value.content_id && hasContentId(value.page_id, value.content_id), `operationList[${index}].value.content_id is not in Content Registry`);
  }
  if (ANSWER_EVENTS.has(operation.eventType)) {
    assertCondition(value.question_id, `operationList[${index}].value.question_id is required`);
    assertCondition(value.option_id, `operationList[${index}].value.option_id is required`);
    if (String(value.page_id).startsWith('page_09') || String(value.page_id).startsWith('page_10') || String(value.page_id).startsWith('page_11')) {
      assertCondition(value.question_id && hasQuestionId(value.page_id, value.question_id), `operationList[${index}].value.question_id is not in Field Registry`);
    }
  }
  if (ROW_EVENTS.has(operation.eventType)) {
    assertCondition(value.row_id, `operationList[${index}].value.row_id is required`);
  }
  if (EXP_EVENTS.has(operation.eventType)) {
    assertCondition(value.exp_run_id, `operationList[${index}].value.exp_run_id is required`);
  }
  if (SUBMIT_EVENTS.has(operation.eventType)) {
    assertCondition(value.submit_attempt_id, `operationList[${index}].value.submit_attempt_id is required`);
    assertCondition(value.validation_status, `operationList[${index}].value.validation_status is required`);
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
