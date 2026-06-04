import eventSchema from './contracts/event_schema.v2.1.json';
import fieldRegistry from './contracts/field_registry.v2.1.json';
import contentRegistry from './contracts/content_registry.banana.v2.1.json';
import ruleConfig from './contracts/rule_config.v2.1.json';
import type { L2PageType, L2TraceEventType } from './types';

type JsonRecord = Record<string, any>;

const eventSchemaRecord = eventSchema as JsonRecord;
const fieldRegistryRecord = fieldRegistry as JsonRecord;
const contentRegistryRecord = contentRegistry as JsonRecord;
const ruleConfigRecord = ruleConfig as JsonRecord;

export const TRACE_SCHEMA_VERSION = 'science-inquiry-trace-v2.1';
export const TRACE_EVENT_SCHEMA_ID = String(eventSchemaRecord.$id || 'science-inquiry-event-schema-v2.1');
export const FIELD_REGISTRY_VERSION = String(fieldRegistryRecord.registry_version);
export const FIELD_REGISTRY_HASH = String(fieldRegistryRecord.registry_hash);
export const CONTENT_REGISTRY_VERSION = String(contentRegistryRecord.registry_version);
export const CONTENT_REGISTRY_HASH = String(contentRegistryRecord.registry_hash);
export const RULE_CONFIG_VERSION = String(ruleConfigRecord.ruleConfigVersion);
export const RULE_CONFIG_HASH = String(ruleConfigRecord.ruleConfigHash);

export const TRACE_EVENT_TYPES = Object.freeze(
  eventSchemaRecord.properties.eventType.enum as L2TraceEventType[]
);

export const TRACE_PAGE_TYPES = Object.freeze(
  eventSchemaRecord.properties.value.properties.page_type.enum as L2PageType[]
);

export const TRACE_TARGET_TYPES = Object.freeze(
  eventSchemaRecord.properties.value.properties.target_type.enum as string[]
);

export const TEXT_DEBOUNCE_MS = Number(ruleConfigRecord.thresholds.textDebounceMs.value);
export const TEXT_THROTTLE_CHAR_DELTA = Number(
  ruleConfigRecord.thresholds.textThrottleCharDelta.value
);
export const EXP_RUN_DEBOUNCE_MS = Number(ruleConfigRecord.thresholds.expRunDebounceMs.value);

export const getFieldRegistryPage = (standardPageId: string): JsonRecord | undefined =>
  fieldRegistryRecord.pages?.[standardPageId];

export const getContentRegistryPage = (standardPageId: string): JsonRecord | undefined =>
  contentRegistryRecord.pages?.[standardPageId];

export const hasFieldId = (standardPageId: string, fieldId: string): boolean =>
  Boolean(getFieldRegistryPage(standardPageId)?.fields?.[fieldId]);

export const hasQuestionId = (standardPageId: string, questionId: string): boolean =>
  Boolean(getFieldRegistryPage(standardPageId)?.questions?.[questionId]);

export const hasContentId = (standardPageId: string, contentId: string): boolean =>
  Boolean(getContentRegistryPage(standardPageId)?.content_blocks?.[contentId]);
