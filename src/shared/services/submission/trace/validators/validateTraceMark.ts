import {
  CHART_HOVER_MIN_MS,
  CONTENT_REGISTRY_HASH,
  CONTENT_REGISTRY_VERSION,
  FIELD_REGISTRY_HASH,
  FIELD_REGISTRY_VERSION,
  getContentRegistryPage,
  getFieldRegistryPage,
  hasContentId,
  hasFieldId,
  hasQuestionId,
  PAGE_IDLE_THRESHOLD_MS,
  RULE_CONFIG_HASH,
  RULE_CONFIG_VERSION,
  TRACE_EVENT_TYPES,
  TRACE_PAGE_TYPES,
  TRACE_SCHEMA_VERSION,
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
]);
const MODAL_EVENTS = new Set(['OPEN_MODAL', 'CLOSE_MODAL']);
const ANSWER_EVENTS = new Set(['CHECKBOX_TOGGLE', 'SELECT_ANSWER']);
const ROW_EVENTS = new Set(['ADD_ROW', 'DELETE_ROW', 'SET_PLAN_PARAM', 'SELECT_BEST']);
const CHART_EVENTS = new Set(['CHART_HOVER']);
const PAGE_IDLE_PHASES = new Set([
  'initial_before_first_action',
  'after_blocked_submit',
  'between_effective_events',
]);
const PAGE_IDLE_EVENTS = new Set(['PAGE_IDLE']);
const CHAT_SCROLL_EVENTS = new Set(['CHAT_SCROLL']);
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

interface ValidatableOperation extends Record<string, unknown> {
  code?: unknown;
  targetElement?: unknown;
  eventType?: unknown;
  time?: unknown;
  value?: unknown;
}

interface ValidatableMark extends Record<string, unknown> {
  operationList: unknown[];
}

const assertCondition = (condition: unknown, message: string): asserts condition => {
  if (!condition) {
    throw new Error(`TraceMark validation failed: ${message}`);
  }
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

const asOperationObject = (operation: unknown, index: number): ValidatableOperation => {
  assertCondition(
    isRecord(operation),
    `operationList[${index}] must be an object`
  );
  return operation;
};

const asValueObject = (operation: ValidatableOperation, index: number): TraceEventValue => {
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

const requireMetadataString = (
  metadata: Record<string, unknown>,
  key: string,
  index: number
): string => {
  const metadataValue = metadata[key];
  assertCondition(
    typeof metadataValue === 'string' && metadataValue.trim().length > 0,
    `operationList[${index}].value.metadata.${key} is required`
  );
  return metadataValue as string;
};

const requireMetadataStringArray = (
  metadata: Record<string, unknown>,
  key: string,
  index: number
): string[] => {
  const metadataValue = metadata[key];
  assertCondition(
    Array.isArray(metadataValue) &&
      metadataValue.every((item) => typeof item === 'string' && item.length > 0),
    `operationList[${index}].value.metadata.${key} must be a string array`
  );
  return metadataValue as string[];
};

const assertMetadataLiteral = (
  metadata: Record<string, unknown>,
  key: string,
  expectedValue: string,
  index: number
) => {
  assertCondition(
    metadata[key] === expectedValue,
    `operationList[${index}].value.metadata.${key} must be ${expectedValue}`
  );
};

const CANONICAL_METADATA_LITERALS = [
  ['schema_version', TRACE_SCHEMA_VERSION],
  ['field_registry_version', FIELD_REGISTRY_VERSION],
  ['field_registry_hash', FIELD_REGISTRY_HASH],
  ['content_registry_version', CONTENT_REGISTRY_VERSION],
  ['content_registry_hash', CONTENT_REGISTRY_HASH],
  ['rule_config_version', RULE_CONFIG_VERSION],
  ['rule_config_hash', RULE_CONFIG_HASH],
] as const;

const assertStartPageMetadataLiterals = (
  metadata: Record<string, unknown>,
  index: number
) => {
  CANONICAL_METADATA_LITERALS.forEach(([key, expectedValue]) => {
    assertMetadataLiteral(metadata, key, expectedValue, index);
  });
};

const assertPresentMetadataLiterals = (
  metadata: Record<string, unknown>,
  index: number
) => {
  CANONICAL_METADATA_LITERALS.forEach(([key, expectedValue]) => {
    if (Object.prototype.hasOwnProperty.call(metadata, key)) {
      assertMetadataLiteral(metadata, key, expectedValue, index);
    }
  });
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

const validateOperation = (operation: unknown, index: number, operations: unknown[] = []) => {
  const operationObject = asOperationObject(operation, index);
  const eventType = operationObject.eventType;
  assertCondition(
    Number.isInteger(operationObject.code) && operationObject.code > 0,
    `operationList[${index}].code must be a positive integer`
  );
  if (index > 0) {
    const previousOperation = isRecord(operations[index - 1]) ? operations[index - 1] : {};
    assertCondition(
      Number.isInteger(previousOperation.code) && operationObject.code > previousOperation.code,
      `operationList[${index}].code must be greater than previous operation code`
    );
  }
  assertCondition(typeof operationObject.targetElement === 'string' && operationObject.targetElement.length > 0, `operationList[${index}].targetElement is required`);
  assertCondition(typeof eventType === 'string' && eventType.length > 0, `operationList[${index}].eventType is required`);
  assertCondition(!LEGACY_EVENT_TYPES.has(eventType), `operationList[${index}].eventType is legacy, not L2 trace eventType`);
  assertCondition(EVENT_TYPE_SET.has(eventType), `operationList[${index}].eventType is not an L2 trace eventType`);
  assertCondition(typeof operationObject.time === 'string' && operationObject.time.length > 0, `operationList[${index}].time is required`);
  assertCondition(TRACE_TIMESTAMP_PATTERN.test(operationObject.time), `operationList[${index}].time must match trace timestamp format`);

  const value = asValueObject(operationObject, index);
  assertCondition(typeof value.trace_id === 'string' && value.trace_id.length > 0, `operationList[${index}].value.trace_id is required`);
  assertCondition(typeof value.page_id === 'string' && value.page_id.length > 0, `operationList[${index}].value.page_id is required`);
  const registryPageId = value.page_id;
  const registeredPage = getTraceRegistryPage(registryPageId);
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

  if (eventType === 'START_PAGE') {
    assertStartPageMetadataLiterals(value.metadata, index);
  } else {
    assertPresentMetadataLiterals(value.metadata, index);
  }
  if (TEXT_EVENTS.has(eventType)) {
    const fieldId = requireStringField(value, 'field_id', index);
    assertCondition(hasFieldId(registryPageId, fieldId), `operationList[${index}].value.field_id is not in Field Registry`);
  }
  if (CONTENT_EVENTS.has(eventType)) {
    const contentId = requireStringField(value, 'content_id', index);
    assertCondition(hasContentId(registryPageId, contentId), `operationList[${index}].value.content_id is not in Content Registry`);
  }
  if (MODAL_EVENTS.has(eventType)) {
    assertCondition(
      typeof value.target_id === 'string' && hasContentId(registryPageId, value.target_id),
      `operationList[${index}].value.target_id is not in Content Registry`
    );
  }
  if (ANSWER_EVENTS.has(eventType)) {
    const questionId = requireStringField(value, 'question_id', index);
    const optionId = requireStringField(value, 'option_id', index);
    if (pageHasQuestionRegistry(registryPageId)) {
      assertCondition(hasQuestionId(registryPageId, questionId), `operationList[${index}].value.question_id is not in Field Registry`);
    }
    const registeredOptionIds = getRegisteredOptionIds(registryPageId, questionId);
    if (registeredOptionIds.length > 0) {
      assertCondition(
        registeredOptionIds.includes(optionId),
        `operationList[${index}].value.option_id is not in Field Registry`
      );
    }
  }
  if (ROW_EVENTS.has(eventType)) {
    const fieldId = requireStringField(value, 'field_id', index);
    assertCondition(hasFieldId(registryPageId, fieldId), `operationList[${index}].value.field_id is not in Field Registry`);
    requireStringField(value, 'row_id', index);
  }
  if (eventType === 'SET_PLAN_PARAM') {
    requireStringField(value, 'param_id', index);
  }
  if (CHART_EVENTS.has(eventType)) {
    const chartId = requireStringField(value, 'chart_id', index);
    requireStringField(value, 'point_id', index);
    assertCondition(
      hasFieldId(registryPageId, chartId),
      `operationList[${index}].value.chart_id is not in Field Registry`
    );
    assertCondition(
      typeof value.metadata.hover_ms === 'number' &&
        !Number.isNaN(value.metadata.hover_ms) &&
        value.metadata.hover_ms >= CHART_HOVER_MIN_MS,
      `operationList[${index}].value.metadata.hover_ms must be at least ${CHART_HOVER_MIN_MS}`
    );
    assertCondition(
      isRecord(value.metadata.data_snapshot),
      `operationList[${index}].value.metadata.data_snapshot is required`
    );
  }
  if (PAGE_IDLE_EVENTS.has(eventType)) {
    assertCondition(
      value.target_id === 'page',
      `operationList[${index}].value.target_id must be page for PAGE_IDLE`
    );
    assertCondition(
      value.target_type === 'page',
      `operationList[${index}].value.target_type must be page for PAGE_IDLE`
    );
    assertCondition(
      typeof value.metadata.idle_duration_ms === 'number' &&
        Number.isFinite(value.metadata.idle_duration_ms) &&
        value.metadata.idle_duration_ms >= PAGE_IDLE_THRESHOLD_MS,
      `operationList[${index}].value.metadata.idle_duration_ms must be at least ${PAGE_IDLE_THRESHOLD_MS}`
    );
    const idlePhase = requireMetadataString(value.metadata, 'idle_phase', index);
    assertCondition(
      PAGE_IDLE_PHASES.has(idlePhase),
      `operationList[${index}].value.metadata.idle_phase is invalid`
    );
    assertCondition(
      value.metadata.page_visible === true,
      `operationList[${index}].value.metadata.page_visible must be true`
    );
    assertCondition(
      value.metadata.window_focused === true,
      `operationList[${index}].value.metadata.window_focused must be true`
    );
    assertCondition(
      value.metadata.threshold_ms === PAGE_IDLE_THRESHOLD_MS,
      `operationList[${index}].value.metadata.threshold_ms must be ${PAGE_IDLE_THRESHOLD_MS}`
    );
  }
  if (CHAT_SCROLL_EVENTS.has(eventType)) {
    assertCondition(
      value.target_id === 'chat_window',
      `operationList[${index}].value.target_id must be chat_window for CHAT_SCROLL`
    );
    assertCondition(
      value.target_type === 'content',
      `operationList[${index}].value.target_type must be content for CHAT_SCROLL`
    );
    assertCondition(
      typeof value.metadata.scroll_delta === 'number' && Number.isFinite(value.metadata.scroll_delta),
      `operationList[${index}].value.metadata.scroll_delta must be numeric`
    );
    const scrollDirection = requireMetadataString(value.metadata, 'scroll_direction', index);
    assertCondition(
      scrollDirection === 'up' || scrollDirection === 'down',
      `operationList[${index}].value.metadata.scroll_direction is invalid`
    );
    const beforeContentIds = requireMetadataStringArray(
      value.metadata,
      'visible_content_ids_before',
      index
    );
    const afterContentIds = requireMetadataStringArray(
      value.metadata,
      'visible_content_ids_after',
      index
    );
    const assertVisibleContentIdsRegistered = (key: string, contentIds: string[]) => {
      contentIds.forEach((contentId) => {
        assertCondition(
          hasContentId(registryPageId, contentId),
          `operationList[${index}].value.metadata.${key} contains unregistered content_id "${contentId}"`
        );
      });
    };
    assertVisibleContentIdsRegistered('visible_content_ids_before', beforeContentIds);
    assertVisibleContentIdsRegistered('visible_content_ids_after', afterContentIds);
    requireMetadataString(value.metadata, 'phase', index);
  }
  if (EXP_PARAM_EVENTS.has(eventType)) {
    requireStringField(value, 'param_id', index);
    requireStringField(value, 'param_name', index);
  }
  if (EXP_EXECUTE_EVENTS.has(eventType)) {
    requireStringField(value, 'exp_run_id', index);
  }
  if (EXP_RESET_EVENTS.has(eventType)) {
    assertCondition(
      isRecord(value.metadata.param_snapshot_before_reset) && typeof value.metadata.reset_count === 'number',
      `operationList[${index}].value reset metadata is required`
    );
  }
  if (SUBMIT_EVENTS.has(eventType)) {
    requireStringField(value, 'submit_attempt_id', index);
    const validationStatus = requireStringField(value, 'validation_status', index);
    assertCondition(
      VALIDATION_STATUS_SET.has(validationStatus),
      `operationList[${index}].value.validation_status is invalid`
    );
    assertCondition(
      typeof value.metadata.submit_trigger === 'string' && value.metadata.submit_trigger.length > 0,
      `operationList[${index}].value.metadata.submit_trigger is required`
    );
  }
};

export function validateTraceMark(mark: unknown): ValidatableMark {
  assertCondition(isRecord(mark), 'mark must be an object');
  assertCondition(Array.isArray(mark.operationList), 'operationList must be an array');
  assertCondition(mark.operationList.length > 0, 'operationList must not be empty');
  mark.operationList.forEach(validateOperation);
  assertCondition(
    mark.operationList.some((operation) => isRecord(operation) && operation.eventType === 'START_PAGE'),
    'operationList must contain START_PAGE'
  );
  return mark;
}
