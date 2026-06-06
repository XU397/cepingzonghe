import eventSchema from './contracts/event_schema.v2.2.json';
import fieldRegistry from './contracts/field_registry.v2.2.json';
import contentRegistry from './contracts/content_registry.banana.v2.2.json';
import ruleConfig from './contracts/rule_config.v2.2.json';
import type { L2PageType, L2TraceEventType } from './types';

type JsonRecord = Record<string, unknown>;

export type TraceRuleThresholdValue = number | boolean | string;

const asJsonRecord = (value: unknown, label: string): JsonRecord => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  throw new Error(`[trace/contracts] Expected ${label} to be an object`);
};

const maybeJsonRecord = (value: unknown): JsonRecord | undefined =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : undefined;

const requiredString = (value: unknown, label: string): string => {
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  throw new Error(`[trace/contracts] Missing required string: ${label}`);
};

const requiredArray = <T>(value: unknown, label: string): T[] => {
  if (Array.isArray(value)) {
    return value as T[];
  }
  throw new Error(`[trace/contracts] Missing required array: ${label}`);
};

const coerceThresholdValue = (value: unknown, label: string): TraceRuleThresholdValue => {
  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    const numericValue = Number(value);
    return value.trim() && !Number.isNaN(numericValue) ? numericValue : value;
  }
  throw new Error(`[trace/contracts] Unsupported threshold value: ${label}`);
};

const createRuleThresholds = (
  thresholds: unknown
): Readonly<Record<string, TraceRuleThresholdValue>> => {
  const thresholdRecord = asJsonRecord(thresholds, 'rule_config.thresholds');
  const entries: Array<[string, TraceRuleThresholdValue]> = Object.entries(thresholdRecord).map(
    ([name, config]) => {
      const configRecord = asJsonRecord(config, `rule_config.thresholds.${name}`);
      return [name, coerceThresholdValue(configRecord.value, `rule_config.thresholds.${name}.value`)];
    }
  );
  return Object.freeze(Object.fromEntries(entries));
};

const eventSchemaRecord = asJsonRecord(eventSchema, 'event schema');
const fieldRegistryRecord = asJsonRecord(fieldRegistry, 'field registry');
const contentRegistryRecord = asJsonRecord(contentRegistry, 'content registry');
const ruleConfigRecord = asJsonRecord(ruleConfig, 'rule config');
const eventSchemaProperties = asJsonRecord(eventSchemaRecord.properties, 'event schema properties');
const eventTypeProperty = asJsonRecord(eventSchemaProperties.eventType, 'event schema eventType');
const eventValueProperty = asJsonRecord(eventSchemaProperties.value, 'event schema value');
const eventValueProperties = asJsonRecord(eventValueProperty.properties, 'event schema value properties');
const pageTypeProperty = asJsonRecord(eventValueProperties.page_type, 'event schema page_type');
const targetTypeProperty = asJsonRecord(eventValueProperties.target_type, 'event schema target_type');
const fieldRegistryPages = asJsonRecord(fieldRegistryRecord.pages, 'field registry pages');
const contentRegistryPages = asJsonRecord(contentRegistryRecord.pages, 'content registry pages');

export const TRACE_SCHEMA_VERSION = 'science-inquiry-trace-v2.2';
export const TRACE_EVENT_SCHEMA_ID = requiredString(eventSchemaRecord.$id, 'event schema $id');
export const FIELD_REGISTRY_VERSION = requiredString(
  fieldRegistryRecord.registry_version,
  'field registry version'
);
export const FIELD_REGISTRY_HASH = requiredString(fieldRegistryRecord.registry_hash, 'field registry hash');
export const CONTENT_REGISTRY_VERSION = requiredString(
  contentRegistryRecord.registry_version,
  'content registry version'
);
export const CONTENT_REGISTRY_HASH = requiredString(
  contentRegistryRecord.registry_hash,
  'content registry hash'
);
export const RULE_CONFIG_VERSION = requiredString(ruleConfigRecord.ruleConfigVersion, 'rule config version');
export const RULE_CONFIG_HASH = requiredString(ruleConfigRecord.ruleConfigHash, 'rule config hash');

export const TRACE_EVENT_TYPES = Object.freeze(
  requiredArray<L2TraceEventType>(eventTypeProperty.enum, 'event schema eventType enum')
);

export const TRACE_PAGE_TYPES = Object.freeze(
  requiredArray<L2PageType>(pageTypeProperty.enum, 'event schema page_type enum')
);

export const TRACE_TARGET_TYPES = Object.freeze(
  requiredArray<string>(targetTypeProperty.enum, 'event schema target_type enum')
);

export const TRACE_RULE_THRESHOLDS = createRuleThresholds(ruleConfigRecord.thresholds);

export const getRuleThreshold = (name: string): TraceRuleThresholdValue | undefined =>
  TRACE_RULE_THRESHOLDS[name];

const requireNumericRuleThreshold = (name: string): number => {
  const value = getRuleThreshold(name);
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  throw new Error(`[trace/contracts] Missing numeric rule threshold: ${name}`);
};

export const TEXT_DEBOUNCE_MS = requireNumericRuleThreshold('textDebounceMs');
export const TEXT_THROTTLE_CHAR_DELTA = requireNumericRuleThreshold('textThrottleCharDelta');
export const EXP_RUN_DEBOUNCE_MS = requireNumericRuleThreshold('expRunDebounceMs');
export const CHART_HOVER_MIN_MS = requireNumericRuleThreshold('chartHoverMinMs');
export const PAGE_IDLE_THRESHOLD_MS = requireNumericRuleThreshold('pageIdleThresholdMs');

export const getFieldRegistryPage = (standardPageId: string): JsonRecord | undefined =>
  maybeJsonRecord(fieldRegistryPages[standardPageId]);

export const getContentRegistryPage = (standardPageId: string): JsonRecord | undefined =>
  maybeJsonRecord(contentRegistryPages[standardPageId]);

export const hasFieldId = (standardPageId: string, fieldId: string): boolean => {
  const fields = maybeJsonRecord(getFieldRegistryPage(standardPageId)?.fields);
  return Boolean(fields?.[fieldId]);
};

export const hasQuestionId = (standardPageId: string, questionId: string): boolean => {
  const questions = maybeJsonRecord(getFieldRegistryPage(standardPageId)?.questions);
  return Boolean(questions?.[questionId]);
};

export const hasContentId = (standardPageId: string, contentId: string): boolean => {
  const contentBlocks = maybeJsonRecord(getContentRegistryPage(standardPageId)?.content_blocks);
  return Boolean(contentBlocks?.[contentId]);
};
