import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const CONTRACT_FILES = [
  'event_schema.v2.1.json',
  'field_registry.v2.1.json',
  'content_registry.banana.v2.1.json',
  'rule_config.v2.1.json',
  'event_schema.v2.2.json',
  'field_registry.v2.2.json',
  'content_registry.banana.v2.2.json',
  'rule_config.v2.2.json',
] as const;

const readContract = (baseDir: string, fileName: string) =>
  readFileSync(resolve(process.cwd(), baseDir, fileName), 'utf8');

type JsonRecord = Record<string, any>;

const readRuntimeEventSchema = () =>
  JSON.parse(
    readContract('src/shared/services/submission/trace/contracts', 'event_schema.v2.2.json')
  ) as JsonRecord;

const readDocsFixture = (fileName: string) =>
  JSON.parse(
    readContract('docs/子模块数据上报规范/engineering_contracts/acceptance_cases', fileName)
  ) as JsonRecord;

const getEventRule = (schema: JsonRecord, eventType: string) => {
  const rules = Array.isArray(schema.allOf) ? schema.allOf : [];
  return rules.find((rule: JsonRecord) => {
    const eventTypeRule = rule?.if?.properties?.eventType;
    const eventTypes = Array.isArray(eventTypeRule?.enum)
      ? eventTypeRule.enum
      : typeof eventTypeRule?.const === 'string'
        ? [eventTypeRule.const]
        : [];
    return eventTypes.includes(eventType);
  }) as JsonRecord | undefined;
};

const getValueRequiredForEvent = (schema: JsonRecord, eventType: string): string[] =>
  getEventRule(schema, eventType)?.then?.properties?.value?.required || [];

const getMetadataRequiredForEvent = (schema: JsonRecord, eventType: string): string[] =>
  getEventRule(schema, eventType)?.then?.properties?.value?.properties?.metadata?.required || [];

describe('trace runtime contracts', () => {
  it.each(CONTRACT_FILES)('keeps runtime %s byte-for-byte synced with engineering_contracts', fileName => {
    const docsContract = readContract(
      'docs/子模块数据上报规范/engineering_contracts',
      fileName
    );
    const runtimeContract = readContract(
      'src/shared/services/submission/trace/contracts',
      fileName
    );

    expect(runtimeContract).toBe(docsContract);
  });

  it('keeps v2.2 contract hashes aligned with backend-canonical acceptance fixtures', () => {
    const fieldRegistry = JSON.parse(
      readContract('src/shared/services/submission/trace/contracts', 'field_registry.v2.2.json')
    ) as JsonRecord;
    const contentRegistry = JSON.parse(
      readContract('src/shared/services/submission/trace/contracts', 'content_registry.banana.v2.2.json')
    ) as JsonRecord;
    const ruleConfig = JSON.parse(
      readContract('src/shared/services/submission/trace/contracts', 'rule_config.v2.2.json')
    ) as JsonRecord;
    const startPageMetadata =
      readDocsFixture('page02_question_generation.json').input.operationList[0].value.metadata;

    expect(fieldRegistry.registry_hash).toBe(startPageMetadata.field_registry_hash);
    expect(contentRegistry.registry_hash).toBe(startPageMetadata.content_registry_hash);
    expect(ruleConfig.ruleConfigHash).toBe(startPageMetadata.rule_config_hash);
  });

  it.each(['ADD_ROW', 'DELETE_ROW', 'SET_PLAN_PARAM', 'SELECT_BEST'])(
    'requires table event %s to carry row_id without the legacy field_id schema requirement',
    eventType => {
      const requiredFields = getValueRequiredForEvent(readRuntimeEventSchema(), eventType);

      expect(requiredFields).toEqual(expect.arrayContaining(['row_id']));
      expect(requiredFields).not.toContain('field_id');
    }
  );

  it('requires submit attempts to carry backend v2.2 attempt fields', () => {
    const schema = readRuntimeEventSchema();
    const requiredFields = getValueRequiredForEvent(schema, 'SUBMIT_ATTEMPT');

    expect(requiredFields).toEqual(
      expect.arrayContaining(['submit_attempt_id', 'validation_status'])
    );
    expect(requiredFields).not.toContain('metadata');
    expect(getMetadataRequiredForEvent(schema, 'SUBMIT_ATTEMPT')).not.toContain('submit_trigger');
  });

  it('requires chart hovers to carry backend v2.2 chart and point identifiers', () => {
    const schema = readRuntimeEventSchema();
    const requiredFields = getValueRequiredForEvent(schema, 'CHART_HOVER');

    expect(requiredFields).toEqual(expect.arrayContaining(['chart_id', 'point_id']));
    expect(requiredFields).not.toContain('metadata');
    expect(getMetadataRequiredForEvent(schema, 'CHART_HOVER')).not.toEqual(
      expect.arrayContaining(['hover_ms', 'data_snapshot'])
    );
  });

  it('locks backend v2.2 PAGE_IDLE threshold and metadata fields', () => {
    const schema = readRuntimeEventSchema();
    const ruleConfig = JSON.parse(
      readContract('src/shared/services/submission/trace/contracts', 'rule_config.v2.2.json')
    ) as JsonRecord;
    const pageIdleFixture = readDocsFixture('page02_page_idle.json');
    const pageIdleOperation = pageIdleFixture.input.operationList.find(
      (operation: JsonRecord) => operation.eventType === 'PAGE_IDLE'
    ) as JsonRecord | undefined;

    expect(pageIdleOperation).toBeDefined();

    expect(getMetadataRequiredForEvent(schema, 'PAGE_IDLE')).toEqual(
      expect.arrayContaining([
        'idle_duration_ms',
        'idle_phase',
        'page_visible',
        'window_focused',
      ])
    );
    expect(ruleConfig.thresholds.pageIdleThresholdMs.value).toBe(5000);
    expect(pageIdleOperation!.value.metadata.threshold_ms).toBe(
      ruleConfig.thresholds.pageIdleThresholdMs.value
    );
    expect(pageIdleOperation!.value.metadata.idle_duration_ms).toBeGreaterThanOrEqual(
      ruleConfig.thresholds.pageIdleThresholdMs.value
    );
  });

  it('uses backend v2.2 fixture fields for CHAT_SCROLL and viewport_state', () => {
    const page02Fixture = readDocsFixture('page02_question_generation.json');
    const startPage = page02Fixture.input.operationList.find(
      (operation: JsonRecord) => operation.eventType === 'START_PAGE'
    ) as JsonRecord | undefined;
    const chatScroll = page02Fixture.input.operationList.find(
      (operation: JsonRecord) => operation.eventType === 'CHAT_SCROLL'
    ) as JsonRecord | undefined;

    expect(startPage).toBeDefined();
    expect(chatScroll).toBeDefined();
    expect(Object.keys(startPage!.value.metadata.viewport_state).sort()).toEqual([
      'height',
      'scroll_y',
      'width',
    ]);
    expect(Object.keys(chatScroll!.value.metadata).sort()).toEqual([
      'phase',
      'scroll_delta',
      'scroll_direction',
      'visible_content_ids_after',
      'visible_content_ids_before',
    ]);
  });

  it('keeps v2.2 banana factor options and submodule finish page IDs aligned with runtime', () => {
    const fieldRegistry = JSON.parse(
      readContract('src/shared/services/submission/trace/contracts', 'field_registry.v2.2.json')
    ) as JsonRecord;
    const factorOptions =
      fieldRegistry.pages.page_03_factor_selection.fields.factor_selection.options;

    expect(Object.keys(factorOptions)).toEqual(['option_a', 'option_b', 'option_c', 'option_d']);
    expect(fieldRegistry.pages.page_13_task_finish).toBeDefined();
    expect(fieldRegistry.pages.page_13_finish).toBeUndefined();
  });

  it('registers all enhanced banana content activation IDs in v2.2 content registry', () => {
    const contentRegistry = JSON.parse(
      readContract('src/shared/services/submission/trace/contracts', 'content_registry.banana.v2.2.json')
    ) as JsonRecord;

    expect(Object.keys(contentRegistry.pages.page_03_factor_selection.content_blocks)).toEqual([
      'factor_card_1',
      'factor_card_2',
      'factor_card_3',
      'factor_card_4',
      'factor_card_5',
    ]);
    expect(Object.keys(contentRegistry.pages.page_05_plan_generation.content_blocks)).toEqual([
      'plan_generation_instruction',
    ]);
    expect(Object.keys(contentRegistry.pages.page_06_method_evaluation.content_blocks)).toEqual([
      'method_material_1',
      'method_material_2',
      'method_material_3',
    ]);
    expect(Object.keys(contentRegistry.pages.page_12_solution_selection.content_blocks)).toEqual([
      'chart_note_12_01',
      'solution_selection_instruction',
    ]);
  });
});
