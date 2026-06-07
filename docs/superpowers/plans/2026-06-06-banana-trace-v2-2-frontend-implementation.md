# Banana Trace v2.2 Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the cp frontend banana trace output consume backend `science-inquiry-trace-v2.2` literals, emit compliant `PAGE_IDLE`, and align Page02 reading/text evidence with backend v2.2 fixtures.

**Architecture:** Keep L2 event construction centralized in `src/shared/services/submission/trace/logger.ts` and contract loading centralized in `src/shared/services/submission/trace/contracts.ts`. Add small shared collectors/helpers for PAGE_IDLE and Page02 chat scroll, then wire them through the existing banana context/page flow without changing backend, admin, xspj-service, or `D:\myproject\cp`.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Testing Library, static JSON contracts, existing shared submission trace runtime.

---

## Source Of Truth

- Backend handoff/result: `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\repo-results\assessment-platform-backend.md`
- OpenSpec change: `openspec/changes/support-banana-trace-page-idle-compliance/`
- Superpowers design spec: `docs/superpowers/specs/2026-06-06-banana-trace-v2-2-frontend-implementation-design.md`
- Backend runtime contracts: `D:\myproject\assessment-platform-backend\ruoyi-system\src\main\resources\trace-contracts\v2.2\`
- Backend fixture tests: `D:\myproject\assessment-platform-backend\ruoyi-system\src\test\resources\trace-contracts\v2.2\acceptance_cases\`

## Mandatory Contract Literals

Use these literal values from static contract JSON at runtime. Do not compute hashes in frontend runtime code.

```ts
schema_version = 'science-inquiry-trace-v2.2'
field_registry_version = 'science-inquiry-field-registry-v2.2'
field_registry_hash = '93f0d6b95a7ae9615bf9bc0604fd81fa52d47712c9f3eda8670875e6646bcc54'
content_registry_version = 'science-inquiry-content-registry-banana-v2.2'
content_registry_hash = '2460fbe2bfea3036543ed10377f795d494797eea0cdcc8f0767843951cc97d35'
rule_config_version = 'rule-config-v2.2'
rule_config_hash = 'c29da8988f93be25b69d4b7f82df417fb2f70741c4d0eb923de9e69531fd5d83'
pageIdleThresholdMs = 5000
```

`PAGE_IDLE` threshold wording and implementation must use `idle_duration_ms >= pageIdleThresholdMs` / `>= 5000ms`.

`CHAT_SCROLL` and `viewport_state` field names are canonical from backend v2.2 fixtures:

```ts
CHAT_SCROLL.metadata = {
  scroll_delta: number,
  scroll_direction: 'up' | 'down',
  visible_content_ids_before: string[],
  visible_content_ids_after: string[],
  phase: string,
}

START_PAGE.metadata.viewport_state = {
  width: number,
  height: number,
  scroll_y: number,
}
```

## File Structure

- Modify: `src/shared/services/submission/trace/contracts.ts` - v2.2 imports, literal exports, `PAGE_IDLE_THRESHOLD_MS`.
- Modify: `src/shared/services/submission/trace/types.ts` - add `PAGE_IDLE` and related metadata types if needed.
- Modify: `src/shared/services/submission/trace/logger.ts` - inject rule config literals and add `pageIdle()` / `chatScroll()` helpers.
- Modify: `src/shared/services/submission/trace/index.ts` - export new collector/helper modules.
- Create: `src/shared/services/submission/trace/collectors/pageIdle.ts` - boundary-based visible/focused idle collector.
- Create: `src/shared/services/submission/trace/collectors/pageIdle.test.ts` - collector unit tests.
- Modify: `src/shared/services/submission/trace/validators/validateTraceMark.ts` - validate `PAGE_IDLE`, `CHAT_SCROLL`, v2.2 metadata.
- Modify: `src/shared/services/submission/trace/__tests__/contracts-sync.test.ts` - v2.2 drift tests for runtime/docs/backend fixtures.
- Modify: `src/shared/services/submission/trace/__tests__/logger.test.ts` - v2.2 metadata, `PAGE_IDLE`, `CHAT_SCROLL` helpers.
- Modify: `src/shared/services/submission/trace/__tests__/validateTraceMark.test.ts` - valid/invalid `PAGE_IDLE` and fixture validation.
- Modify: `src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx` - trace operation observer registration.
- Modify: `src/submodules/g8-banana-browning-experiment/trace/useTracePageStart.ts` - start idle candidate after `START_PAGE`.
- Create: `src/submodules/g8-banana-browning-experiment/trace/useBananaPageIdle.ts` - hook wiring collector to trace events.
- Create: `src/submodules/g8-banana-browning-experiment/trace/pageStartMetadata.ts` - safe viewport/start metadata helpers.
- Modify: `src/submodules/g8-banana-browning-experiment/pages/Page03BananaMystery.tsx` - Page02 `START_PAGE` metadata and user `CHAT_SCROLL`.
- Modify: `src/submodules/g8-banana-browning-experiment/__tests__/trace-acceptance.test.ts` - backend v2.2 fixtures and PAGE_IDLE fixture acceptance.
- Modify: `src/submodules/g8-banana-browning-experiment/__tests__/trace-page-events.test.tsx` - Page02 scroll/auto-scroll/text tests.
- Copy/create: `src/shared/services/submission/trace/contracts/*.v2.2.json` - runtime contract mirrors.
- Copy/create: `docs/子模块数据上报规范/engineering_contracts/*.v2.2.json` - docs contract mirrors.
- Copy/create: `docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page02_question_generation.json` - backend v2.2 fixture.
- Copy/create: `docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page02_page_idle.json` - backend v2.2 fixture.
- Write after implementation: `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\repo-results\cp.md`.

## Task 1: Sync v2.2 Static Contracts And Backend Fixtures

**Files:**
- Create/copy: `src/shared/services/submission/trace/contracts/event_schema.v2.2.json`
- Create/copy: `src/shared/services/submission/trace/contracts/field_registry.v2.2.json`
- Create/copy: `src/shared/services/submission/trace/contracts/content_registry.banana.v2.2.json`
- Create/copy: `src/shared/services/submission/trace/contracts/rule_config.v2.2.json`
- Create/copy: `docs/子模块数据上报规范/engineering_contracts/event_schema.v2.2.json`
- Create/copy: `docs/子模块数据上报规范/engineering_contracts/field_registry.v2.2.json`
- Create/copy: `docs/子模块数据上报规范/engineering_contracts/content_registry.banana.v2.2.json`
- Create/copy: `docs/子模块数据上报规范/engineering_contracts/rule_config.v2.2.json`
- Copy: `docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page02_question_generation.json`
- Copy: `docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page02_page_idle.json`

- [ ] **Step 1: Copy backend canonical contract files into runtime and docs mirrors**

Run:

```powershell
$backendMain = 'D:\myproject\assessment-platform-backend\ruoyi-system\src\main\resources\trace-contracts\v2.2'
$backendCases = 'D:\myproject\assessment-platform-backend\ruoyi-system\src\test\resources\trace-contracts\v2.2\acceptance_cases'
$runtimeContracts = 'src\shared\services\submission\trace\contracts'
$docsContracts = 'docs\子模块数据上报规范\engineering_contracts'
$docsCases = Join-Path $docsContracts 'acceptance_cases'
New-Item -ItemType Directory -Force $runtimeContracts, $docsContracts, $docsCases | Out-Null

'event_schema.v2.2.json',
'field_registry.v2.2.json',
'content_registry.banana.v2.2.json',
'rule_config.v2.2.json' | ForEach-Object {
  Copy-Item -LiteralPath (Join-Path $backendMain $_) -Destination (Join-Path $runtimeContracts $_) -Force
  Copy-Item -LiteralPath (Join-Path $backendMain $_) -Destination (Join-Path $docsContracts $_) -Force
}

'page02_question_generation.json',
'page02_page_idle.json' | ForEach-Object {
  Copy-Item -LiteralPath (Join-Path $backendCases $_) -Destination (Join-Path $docsCases $_) -Force
}
```

Expected: command exits 0 and all six frontend files exist.

- [ ] **Step 2: Verify copied literals before touching TypeScript**

Run:

```powershell
rg -n "science-inquiry-trace-v2\.2|science-inquiry-field-registry-v2\.2|pageIdleThresholdMs|PAGE_IDLE|CHAT_SCROLL|viewport_state" `
  src/shared/services/submission/trace/contracts `
  docs/子模块数据上报规范/engineering_contracts
```

Expected: output includes v2.2 schema/registry values, `pageIdleThresholdMs`, `PAGE_IDLE`, `CHAT_SCROLL`, and `viewport_state`.

## Task 2: Contract Loader And Metadata Injection

**Files:**
- Modify: `src/shared/services/submission/trace/contracts.ts`
- Modify: `src/shared/services/submission/trace/logger.ts`
- Modify: `src/shared/services/submission/trace/__tests__/contracts-sync.test.ts`
- Modify: `src/shared/services/submission/trace/__tests__/logger.test.ts`

- [ ] **Step 1: Write failing contract-sync tests for v2.2 filenames and backend fixture fields**

In `src/shared/services/submission/trace/__tests__/contracts-sync.test.ts`, replace the v2.1 filename list and runtime schema reader with:

```ts
const CONTRACT_FILES = [
  'event_schema.v2.2.json',
  'field_registry.v2.2.json',
  'content_registry.banana.v2.2.json',
  'rule_config.v2.2.json',
] as const;

const readRuntimeEventSchema = () =>
  JSON.parse(
    readContract('src/shared/services/submission/trace/contracts', 'event_schema.v2.2.json')
  ) as JsonRecord;

const readDocsFixture = (fileName: string) =>
  JSON.parse(
    readContract('docs/子模块数据上报规范/engineering_contracts/acceptance_cases', fileName)
  ) as JsonRecord;
```

Add these tests in the same `describe('trace runtime contracts', ...)` block:

```ts
it('locks backend v2.2 PAGE_IDLE threshold and metadata fields', () => {
  const schema = readRuntimeEventSchema();
  const ruleConfig = JSON.parse(
    readContract('src/shared/services/submission/trace/contracts', 'rule_config.v2.2.json')
  ) as JsonRecord;
  const pageIdleFixture = readDocsFixture('page02_page_idle.json');
  const pageIdleOperation = pageIdleFixture.input.operationList.find(
    (operation: JsonRecord) => operation.eventType === 'PAGE_IDLE'
  ) as JsonRecord;

  expect(getValueRequiredForEvent(schema, 'PAGE_IDLE')).toEqual(
    expect.arrayContaining(['metadata'])
  );
  expect(getMetadataRequiredForEvent(schema, 'PAGE_IDLE')).toEqual(
    expect.arrayContaining([
      'idle_duration_ms',
      'idle_phase',
      'page_visible',
      'window_focused',
      'threshold_ms',
    ])
  );
  expect(ruleConfig.thresholds.pageIdleThresholdMs.value).toBe(5000);
  expect(pageIdleOperation.value.metadata.idle_duration_ms).toBeGreaterThanOrEqual(
    ruleConfig.thresholds.pageIdleThresholdMs.value
  );
});

it('uses backend v2.2 fixture fields for CHAT_SCROLL and viewport_state', () => {
  const page02Fixture = readDocsFixture('page02_question_generation.json');
  const startPage = page02Fixture.input.operationList.find(
    (operation: JsonRecord) => operation.eventType === 'START_PAGE'
  ) as JsonRecord;
  const chatScroll = page02Fixture.input.operationList.find(
    (operation: JsonRecord) => operation.eventType === 'CHAT_SCROLL'
  ) as JsonRecord;

  expect(Object.keys(startPage.value.metadata.viewport_state).sort()).toEqual([
    'height',
    'scroll_y',
    'width',
  ]);
  expect(Object.keys(chatScroll.value.metadata).sort()).toEqual([
    'phase',
    'scroll_delta',
    'scroll_direction',
    'visible_content_ids_after',
    'visible_content_ids_before',
  ]);
});
```

- [ ] **Step 2: Run tests to verify they fail before loader changes**

Run:

```powershell
npx vitest run src/shared/services/submission/trace/__tests__/contracts-sync.test.ts src/shared/services/submission/trace/__tests__/logger.test.ts
```

Expected before implementation: failure from v2.1 imports/metadata or missing v2.2 assertions.

- [ ] **Step 3: Update contract loader to explicit v2.2 files and PAGE_IDLE threshold**

In `src/shared/services/submission/trace/contracts.ts`, change imports and exports to:

```ts
import eventSchema from './contracts/event_schema.v2.2.json';
import fieldRegistry from './contracts/field_registry.v2.2.json';
import contentRegistry from './contracts/content_registry.banana.v2.2.json';
import ruleConfig from './contracts/rule_config.v2.2.json';
```

Replace the schema version and threshold aliases with:

```ts
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
```

Add this alias below existing numeric threshold aliases:

```ts
export const PAGE_IDLE_THRESHOLD_MS = requireNumericRuleThreshold('pageIdleThresholdMs');
```

- [ ] **Step 4: Inject rule config literals in logger metadata**

In `src/shared/services/submission/trace/logger.ts`, extend imports:

```ts
import {
  CONTENT_REGISTRY_HASH,
  CONTENT_REGISTRY_VERSION,
  FIELD_REGISTRY_HASH,
  FIELD_REGISTRY_VERSION,
  RULE_CONFIG_HASH,
  RULE_CONFIG_VERSION,
  TRACE_SCHEMA_VERSION,
} from './contracts';
```

In `createValue().metadata`, add:

```ts
rule_config_version: RULE_CONFIG_VERSION,
rule_config_hash: RULE_CONFIG_HASH,
```

Keep invariant metadata after caller metadata so caller-provided values cannot override the v2.2 literals.

- [ ] **Step 5: Update logger tests for v2.2 metadata**

In `src/shared/services/submission/trace/__tests__/logger.test.ts`, update the START_PAGE expectation:

```ts
metadata: {
  schema_version: 'science-inquiry-trace-v2.2',
  field_registry_version: 'science-inquiry-field-registry-v2.2',
  field_registry_hash: '93f0d6b95a7ae9615bf9bc0604fd81fa52d47712c9f3eda8670875e6646bcc54',
  content_registry_version: 'science-inquiry-content-registry-banana-v2.2',
  content_registry_hash: '2460fbe2bfea3036543ed10377f795d494797eea0cdcc8f0767843951cc97d35',
  rule_config_version: 'rule-config-v2.2',
  rule_config_hash: 'c29da8988f93be25b69d4b7f82df417fb2f70741c4d0eb923de9e69531fd5d83',
  page_index: 9,
  legacy_page_id: 'simulation_question_1',
  flow_context: baseOptions.flowContext,
  initial_state: { selectedOption: null },
}
```

Add threshold assertions:

```ts
expect(PAGE_IDLE_THRESHOLD_MS).toBe(5000);
expect(TRACE_RULE_THRESHOLDS).toMatchObject({
  textDebounceMs: 2000,
  textThrottleCharDelta: 10,
  expRunDebounceMs: 1000,
  pageIdleThresholdMs: 5000,
});
```

- [ ] **Step 6: Run focused contract/logger tests**

Run:

```powershell
npx vitest run src/shared/services/submission/trace/__tests__/contracts-sync.test.ts src/shared/services/submission/trace/__tests__/logger.test.ts
```

Expected after implementation: both test files pass.

## Task 3: PAGE_IDLE Event Type, Logger Helper, And Validator

**Files:**
- Modify: `src/shared/services/submission/trace/types.ts`
- Modify: `src/shared/services/submission/trace/logger.ts`
- Modify: `src/shared/services/submission/trace/validators/validateTraceMark.ts`
- Modify: `src/shared/services/submission/trace/__tests__/logger.test.ts`
- Modify: `src/shared/services/submission/trace/__tests__/validateTraceMark.test.ts`

- [ ] **Step 1: Write failing logger test for PAGE_IDLE and CHAT_SCROLL helpers**

Add to `src/shared/services/submission/trace/__tests__/logger.test.ts`:

```ts
it('emits PAGE_IDLE only with backend v2.2 metadata names', () => {
  const logger = createPageTraceLogger(baseOptions);
  const operation = logger.pageIdle({
    idleDurationMs: 6200,
    idlePhase: 'initial_before_first_action',
    pageVisible: true,
    windowFocused: true,
  });

  expect(operation).toMatchObject({
    targetElement: 'P1.10_page',
    eventType: 'PAGE_IDLE',
    value: {
      target_id: 'page',
      target_type: 'page',
      metadata: {
        idle_duration_ms: 6200,
        idle_phase: 'initial_before_first_action',
        page_visible: true,
        window_focused: true,
        threshold_ms: 5000,
      },
    },
  });
});

it('emits CHAT_SCROLL with backend fixture field names', () => {
  const logger = createPageTraceLogger({
    ...baseOptions,
    page: {
      legacyPageId: 'banana_mystery',
      standardPageId: 'page_02_question_generation',
      pageIndex: 2,
      pageType: 'B1_TEXT_SINGLE' as const,
      lifecycleMode: 'l2-trace' as const,
      requiredFields: ['input_question_1'],
    },
    pageNumber: '1.03',
  });
  const operation = logger.chatScroll({
    scrollDelta: -420,
    scrollDirection: 'up',
    visibleContentIdsBefore: ['chat_bubble_02_03'],
    visibleContentIdsAfter: ['chat_bubble_02_01'],
    phase: 'before_input',
  });

  expect(operation).toMatchObject({
    targetElement: 'P1.03_chat_window',
    eventType: 'CHAT_SCROLL',
    value: {
      target_id: 'chat_window',
      target_type: 'content',
      metadata: {
        scroll_delta: -420,
        scroll_direction: 'up',
        visible_content_ids_before: ['chat_bubble_02_03'],
        visible_content_ids_after: ['chat_bubble_02_01'],
        phase: 'before_input',
      },
    },
  });
});
```

- [ ] **Step 2: Write failing validator tests for PAGE_IDLE acceptance and rejection**

Add to `src/shared/services/submission/trace/__tests__/validateTraceMark.test.ts`:

```ts
const page02StartPage = {
  ...validMark.operationList[0],
  targetElement: 'P1.03_page',
  pageId: 'banana_mystery',
  value: {
    ...validMark.operationList[0].value,
    page_id: 'page_02_question_generation',
    page_type: 'B1_TEXT_SINGLE',
    metadata: {
      schema_version: 'science-inquiry-trace-v2.2',
      field_registry_version: 'science-inquiry-field-registry-v2.2',
      content_registry_version: 'science-inquiry-content-registry-banana-v2.2',
    },
  },
};

const createPageIdleOperation = (metadataPatch: Record<string, unknown>) =>
  createOperation('PAGE_IDLE', {
    page_id: 'page_02_question_generation',
    page_type: 'B1_TEXT_SINGLE',
    target_id: 'page',
    target_type: 'page',
    metadata: {
      idle_duration_ms: 6200,
      idle_phase: 'initial_before_first_action',
      page_visible: true,
      window_focused: true,
      threshold_ms: 5000,
      ...metadataPatch,
    },
  });

it('accepts PAGE_IDLE when idle_duration_ms >= pageIdleThresholdMs and visible/focused are true', () => {
  expect(() =>
    validateTraceMark(markWithOperations([page02StartPage, createPageIdleOperation({})]))
  ).not.toThrow();
});

it.each([
  [{ idle_duration_ms: 4999 }, /idle_duration_ms/i],
  [{ idle_phase: 'finish_page_idle' }, /idle_phase/i],
  [{ page_visible: false }, /page_visible/i],
  [{ window_focused: false }, /window_focused/i],
  [{ threshold_ms: 4000 }, /threshold_ms/i],
])('rejects invalid PAGE_IDLE metadata %j', (metadataPatch, message) => {
  expect(() =>
    validateTraceMark(markWithOperations([page02StartPage, createPageIdleOperation(metadataPatch)]))
  ).toThrow(message);
});
```

- [ ] **Step 3: Add PAGE_IDLE to shared event type union**

In `src/shared/services/submission/trace/types.ts`, add `PAGE_IDLE` after `PAGE_VISIBLE`:

```ts
  | 'PAGE_IDLE'
```

Add exported types near other trace interfaces:

```ts
export type PageIdlePhase =
  | 'initial_before_first_action'
  | 'after_blocked_submit'
  | 'between_effective_events';

export interface PageIdleOptions {
  idleDurationMs: number;
  idlePhase: PageIdlePhase;
  pageVisible: true;
  windowFocused: true;
  time?: Date;
}

export interface ChatScrollOptions {
  scrollDelta: number;
  scrollDirection: 'up' | 'down';
  visibleContentIdsBefore: string[];
  visibleContentIdsAfter: string[];
  phase: string;
  time?: Date;
}
```

- [ ] **Step 4: Add logger helpers**

In `src/shared/services/submission/trace/logger.ts`, import `PAGE_IDLE_THRESHOLD_MS` and the new option types:

```ts
import {
  CONTENT_REGISTRY_HASH,
  CONTENT_REGISTRY_VERSION,
  FIELD_REGISTRY_HASH,
  FIELD_REGISTRY_VERSION,
  PAGE_IDLE_THRESHOLD_MS,
  RULE_CONFIG_HASH,
  RULE_CONFIG_VERSION,
  TRACE_SCHEMA_VERSION,
} from './contracts';
import type {
  ChatScrollOptions,
  L2TraceEventType,
  PageIdleOptions,
  TraceEventValue,
  TraceFlowContext,
  TraceIdFactory,
  TraceOperationDraft,
  TracePageLike,
  TraceTargetType,
} from './types';
```

Add methods to the returned logger object:

```ts
    pageIdle(options: PageIdleOptions) {
      return emit(
        'PAGE_IDLE',
        {},
        {
          targetId: 'page',
          targetType: 'page',
          time: options.time,
          metadata: {
            idle_duration_ms: options.idleDurationMs,
            idle_phase: options.idlePhase,
            page_visible: options.pageVisible,
            window_focused: options.windowFocused,
            threshold_ms: PAGE_IDLE_THRESHOLD_MS,
          },
        }
      );
    },
    chatScroll(options: ChatScrollOptions) {
      return emit(
        'CHAT_SCROLL',
        {},
        {
          targetId: 'chat_window',
          targetType: 'content',
          time: options.time,
          metadata: {
            scroll_delta: options.scrollDelta,
            scroll_direction: options.scrollDirection,
            visible_content_ids_before: options.visibleContentIdsBefore,
            visible_content_ids_after: options.visibleContentIdsAfter,
            phase: options.phase,
          },
        }
      );
    },
```

- [ ] **Step 5: Validate PAGE_IDLE and CHAT_SCROLL metadata**

In `src/shared/services/submission/trace/validators/validateTraceMark.ts`, import `PAGE_IDLE_THRESHOLD_MS`:

```ts
  PAGE_IDLE_THRESHOLD_MS,
```

Add constants:

```ts
const PAGE_IDLE_PHASES = new Set([
  'initial_before_first_action',
  'after_blocked_submit',
  'between_effective_events',
]);
const PAGE_IDLE_EVENTS = new Set(['PAGE_IDLE']);
const CHAT_SCROLL_EVENTS = new Set(['CHAT_SCROLL']);
```

Add helpers:

```ts
const requireMetadataString = (
  metadata: Record<string, unknown>,
  key: string,
  index: number
): string => {
  const fieldValue = metadata[key];
  assertCondition(
    typeof fieldValue === 'string' && fieldValue.length > 0,
    `operationList[${index}].value.metadata.${key} is required`
  );
  return fieldValue;
};

const requireMetadataStringArray = (
  metadata: Record<string, unknown>,
  key: string,
  index: number
): string[] => {
  const fieldValue = metadata[key];
  assertCondition(
    Array.isArray(fieldValue) && fieldValue.every(item => typeof item === 'string'),
    `operationList[${index}].value.metadata.${key} must be a string array`
  );
  return fieldValue as string[];
};
```

Add validation branches in `validateOperation()`:

```ts
  if (PAGE_IDLE_EVENTS.has(operation.eventType)) {
    assertCondition(value.target_type === 'page', `operationList[${index}].value.target_type must be page for PAGE_IDLE`);
    assertCondition(
      typeof value.metadata.idle_duration_ms === 'number' &&
        value.metadata.idle_duration_ms >= PAGE_IDLE_THRESHOLD_MS,
      `operationList[${index}].value.metadata.idle_duration_ms must be >= ${PAGE_IDLE_THRESHOLD_MS}`
    );
    const idlePhase = requireMetadataString(value.metadata, 'idle_phase', index);
    assertCondition(
      PAGE_IDLE_PHASES.has(idlePhase),
      `operationList[${index}].value.metadata.idle_phase is invalid`
    );
    assertCondition(value.metadata.page_visible === true, `operationList[${index}].value.metadata.page_visible must be true`);
    assertCondition(value.metadata.window_focused === true, `operationList[${index}].value.metadata.window_focused must be true`);
    assertCondition(
      value.metadata.threshold_ms === PAGE_IDLE_THRESHOLD_MS,
      `operationList[${index}].value.metadata.threshold_ms must be ${PAGE_IDLE_THRESHOLD_MS}`
    );
  }
  if (CHAT_SCROLL_EVENTS.has(operation.eventType)) {
    assertCondition(value.target_type === 'content', `operationList[${index}].value.target_type must be content for CHAT_SCROLL`);
    assertCondition(typeof value.metadata.scroll_delta === 'number', `operationList[${index}].value.metadata.scroll_delta must be numeric`);
    const direction = requireMetadataString(value.metadata, 'scroll_direction', index);
    assertCondition(direction === 'up' || direction === 'down', `operationList[${index}].value.metadata.scroll_direction is invalid`);
    requireMetadataStringArray(value.metadata, 'visible_content_ids_before', index).forEach(contentId =>
      assertCondition(hasContentId(value.page_id, contentId), `operationList[${index}].value.metadata.visible_content_ids_before contains unknown content id`)
    );
    requireMetadataStringArray(value.metadata, 'visible_content_ids_after', index).forEach(contentId =>
      assertCondition(hasContentId(value.page_id, contentId), `operationList[${index}].value.metadata.visible_content_ids_after contains unknown content id`)
    );
    requireMetadataString(value.metadata, 'phase', index);
  }
```

- [ ] **Step 6: Run logger and validator tests**

Run:

```powershell
npx vitest run src/shared/services/submission/trace/__tests__/logger.test.ts src/shared/services/submission/trace/__tests__/validateTraceMark.test.ts
```

Expected after implementation: both test files pass.

## Task 4: Boundary-Based PAGE_IDLE Collector

**Files:**
- Create: `src/shared/services/submission/trace/collectors/pageIdle.ts`
- Create: `src/shared/services/submission/trace/collectors/pageIdle.test.ts`
- Modify: `src/shared/services/submission/trace/index.ts`

- [ ] **Step 1: Write collector tests before implementation**

Create `src/shared/services/submission/trace/collectors/pageIdle.test.ts`:

```ts
import { describe, expect, it, vi } from 'vitest';
import { PAGE_IDLE_THRESHOLD_MS } from '../contracts';
import { createPageIdleCollector } from './pageIdle';

const createCollector = (initialTime = 0) => {
  let nowMs = initialTime;
  const logger = {
    pageIdle: vi.fn(),
  };
  const collector = createPageIdleCollector({
    logger,
    thresholdMs: PAGE_IDLE_THRESHOLD_MS,
    now: () => new Date(nowMs),
    isPageVisible: () => true,
    isWindowFocused: () => true,
  });

  return {
    logger,
    collector,
    setNow: (nextNowMs: number) => {
      nowMs = nextNowMs;
    },
  };
};

describe('createPageIdleCollector', () => {
  it('emits initial_before_first_action when idle_duration_ms >= pageIdleThresholdMs', () => {
    const harness = createCollector(0);
    harness.collector.start('initial_before_first_action');
    harness.setNow(5000);

    harness.collector.onEffectiveEvent('TEXT_FOCUS');

    expect(harness.logger.pageIdle).toHaveBeenCalledWith({
      idleDurationMs: 5000,
      idlePhase: 'initial_before_first_action',
      pageVisible: true,
      windowFocused: true,
      time: new Date(5000),
    });
  });

  it('does not emit when idle_duration_ms < pageIdleThresholdMs', () => {
    const harness = createCollector(0);
    harness.collector.start('initial_before_first_action');
    harness.setNow(4999);

    harness.collector.onEffectiveEvent('TEXT_FOCUS');

    expect(harness.logger.pageIdle).not.toHaveBeenCalled();
  });

  it('starts after_blocked_submit after a blocked submit boundary', () => {
    const harness = createCollector(0);
    harness.collector.start('initial_before_first_action');
    harness.setNow(1000);
    harness.collector.onEffectiveEvent('SUBMIT_ATTEMPT', { validationStatus: 'blocked' });
    harness.setNow(7000);
    harness.collector.onEffectiveEvent('TEXT_FOCUS');

    expect(harness.logger.pageIdle).toHaveBeenCalledWith(
      expect.objectContaining({
        idleDurationMs: 6000,
        idlePhase: 'after_blocked_submit',
      })
    );
  });

  it('discards hidden or unfocused candidate segments', () => {
    let visible = true;
    const logger = { pageIdle: vi.fn() };
    const collector = createPageIdleCollector({
      logger,
      thresholdMs: PAGE_IDLE_THRESHOLD_MS,
      now: () => new Date(6000),
      isPageVisible: () => visible,
      isWindowFocused: () => true,
    });

    collector.start('initial_before_first_action', new Date(0));
    visible = false;
    collector.handleVisibilityOrFocusChange();
    visible = true;
    collector.onEffectiveEvent('TEXT_FOCUS');

    expect(logger.pageIdle).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run collector test and verify it fails**

Run:

```powershell
npx vitest run src/shared/services/submission/trace/collectors/pageIdle.test.ts
```

Expected before implementation: fail because `./pageIdle` does not exist.

- [ ] **Step 3: Implement the collector**

Create `src/shared/services/submission/trace/collectors/pageIdle.ts`:

```ts
import type { L2TraceEventType, PageIdleOptions, PageIdlePhase } from '../types';

interface PageIdleLogger {
  pageIdle(_options: PageIdleOptions): unknown;
}

interface PageIdleCollectorOptions {
  logger: PageIdleLogger;
  thresholdMs: number;
  now?: () => Date;
  isPageVisible?: () => boolean;
  isWindowFocused?: () => boolean;
}

interface EffectiveEventOptions {
  validationStatus?: string;
}

interface IdleCandidate {
  startedAt: Date;
  phase: PageIdlePhase;
  validVisibleFocusedSegment: boolean;
}

const DEFAULT_NOW = () => new Date();
const DEFAULT_VISIBLE = () =>
  typeof document === 'undefined' ? true : document.visibilityState === 'visible';
const DEFAULT_FOCUSED = () =>
  typeof document === 'undefined' ? true : document.hasFocus();

const isTrackedEffectiveEvent = (eventType: L2TraceEventType) =>
  !new Set<L2TraceEventType>([
    'START_PAGE',
    'PAGE_IDLE',
    'PAGE_HIDDEN',
    'PAGE_VISIBLE',
    'TASK_FINISH',
    'TIMER_COMPLETE',
  ]).has(eventType);

export function createPageIdleCollector(options: PageIdleCollectorOptions) {
  const now = options.now || DEFAULT_NOW;
  const isPageVisible = options.isPageVisible || DEFAULT_VISIBLE;
  const isWindowFocused = options.isWindowFocused || DEFAULT_FOCUSED;
  let candidate: IdleCandidate | null = null;

  const isVisibleAndFocused = () => isPageVisible() && isWindowFocused();

  const start = (phase: PageIdlePhase, startedAt: Date = now()) => {
    candidate = {
      startedAt,
      phase,
      validVisibleFocusedSegment: isVisibleAndFocused(),
    };
  };

  const closeCandidate = (closedAt: Date = now()) => {
    if (!candidate) {
      return;
    }

    const idleDurationMs = closedAt.getTime() - candidate.startedAt.getTime();
    if (
      candidate.validVisibleFocusedSegment &&
      isVisibleAndFocused() &&
      idleDurationMs >= options.thresholdMs
    ) {
      options.logger.pageIdle({
        idleDurationMs,
        idlePhase: candidate.phase,
        pageVisible: true,
        windowFocused: true,
        time: closedAt,
      });
    }
  };

  const nextPhaseAfterEvent = (
    eventType: L2TraceEventType,
    eventOptions: EffectiveEventOptions = {}
  ): PageIdlePhase => {
    if (eventType === 'SUBMIT_ATTEMPT' && eventOptions.validationStatus === 'blocked') {
      return 'after_blocked_submit';
    }
    return 'between_effective_events';
  };

  return {
    start,
    onEffectiveEvent(eventType: L2TraceEventType, eventOptions: EffectiveEventOptions = {}) {
      if (!isTrackedEffectiveEvent(eventType)) {
        return;
      }
      const boundaryTime = now();
      closeCandidate(boundaryTime);
      start(nextPhaseAfterEvent(eventType, eventOptions), boundaryTime);
    },
    flushBoundary() {
      const boundaryTime = now();
      closeCandidate(boundaryTime);
      start('between_effective_events', boundaryTime);
    },
    handleVisibilityOrFocusChange() {
      if (candidate && !isVisibleAndFocused()) {
        candidate.validVisibleFocusedSegment = false;
      }
    },
    dispose() {
      candidate = null;
    },
  };
}
```

- [ ] **Step 4: Export the collector**

In `src/shared/services/submission/trace/index.ts`, add:

```ts
export * from './collectors/pageIdle';
```

- [ ] **Step 5: Run collector tests**

Run:

```powershell
npx vitest run src/shared/services/submission/trace/collectors/pageIdle.test.ts
```

Expected after implementation: collector tests pass.

## Task 5: Wire PAGE_IDLE Into Banana Trace Runtime

**Files:**
- Modify: `src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx`
- Create: `src/submodules/g8-banana-browning-experiment/trace/useBananaPageIdle.ts`
- Modify: `src/submodules/g8-banana-browning-experiment/trace/useTracePageStart.ts`
- Modify: `src/submodules/g8-banana-browning-experiment/__tests__/trace-page-events.test.tsx`

- [ ] **Step 1: Add failing test for idle observer wiring**

In `src/submodules/g8-banana-browning-experiment/__tests__/trace-page-events.test.tsx`, extend the mocked logger:

```ts
pageIdle: vi.fn(),
chatScroll: vi.fn(),
```

Add a test:

```ts
it('Page03 flushes PAGE_IDLE only for visible and focused idle segments', () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-06-03T02:00:00.000Z'));
  renderPage('banana_mystery', <Page03BananaMystery />);

  act(() => {
    vi.setSystemTime(new Date('2026-06-03T02:00:05.000Z'));
  });
  fireEvent.focus(screen.getByPlaceholderText('请在此处输入你的回答。'));

  expect(traceLogger.pageIdle).toHaveBeenCalledWith(
    expect.objectContaining({
      idleDurationMs: 5000,
      idlePhase: 'initial_before_first_action',
      pageVisible: true,
      windowFocused: true,
    })
  );
});
```

- [ ] **Step 2: Add trace operation observer support in banana context**

In `src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx`, add this type near context interfaces:

```ts
type TraceOperationObserver = (_operation: OperationLog) => void;
```

Add to `G8BananaBrowningContextValue`:

```ts
registerTraceOperationObserver: (_observer: TraceOperationObserver) => () => void;
```

In the provider, add:

```ts
const traceOperationObserversRef = useRef(new Set<TraceOperationObserver>());
```

After `operationWithCode` is pushed in `logOperation`, notify observers:

```ts
traceOperationObserversRef.current.forEach(observer => observer(operationWithCode));
```

Add registration callback:

```ts
const registerTraceOperationObserver = useCallback((observer: TraceOperationObserver) => {
  traceOperationObserversRef.current.add(observer);
  return () => {
    traceOperationObserversRef.current.delete(observer);
  };
}, []);
```

Add `registerTraceOperationObserver` to `contextValue` and the `useMemo` dependency list.

- [ ] **Step 3: Add banana idle hook**

Create `src/submodules/g8-banana-browning-experiment/trace/useBananaPageIdle.ts`:

```ts
import { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  PAGE_IDLE_THRESHOLD_MS,
  createPageIdleCollector,
  type L2TraceEventType,
  type PageIdleOptions,
} from '@shared/services/submission/trace';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';

interface BananaPageIdleLogger {
  pageIdle(_options: PageIdleOptions): unknown;
}

const isTraceOperationValue = (value: unknown): value is Record<string, unknown> =>
  Boolean(value && typeof value === 'object' && !Array.isArray(value));

export function useBananaPageIdle(logger: BananaPageIdleLogger | null) {
  const {
    registerTraceCollectorFlush,
    registerTraceOperationObserver,
  } = useG8BananaBrowningContext();
  const loggerRef = useRef(logger);
  loggerRef.current = logger;

  const collector = useMemo(
    () =>
      createPageIdleCollector({
        logger: {
          pageIdle: options => loggerRef.current?.pageIdle(options),
        },
        thresholdMs: PAGE_IDLE_THRESHOLD_MS,
      }),
    []
  );

  const startInitial = useCallback(
    (startedAt?: Date) => collector.start('initial_before_first_action', startedAt),
    [collector]
  );

  useEffect(() => {
    const unsubscribe = registerTraceOperationObserver(operation => {
      if (!isTraceOperationValue(operation.value)) {
        return;
      }
      const validationStatus =
        typeof operation.value.validation_status === 'string'
          ? operation.value.validation_status
          : undefined;
      collector.onEffectiveEvent(operation.eventType as L2TraceEventType, {
        validationStatus,
      });
    });
    return unsubscribe;
  }, [collector, registerTraceOperationObserver]);

  useEffect(() => registerTraceCollectorFlush(() => collector.flushBoundary()), [
    collector,
    registerTraceCollectorFlush,
  ]);

  useEffect(() => {
    const handleBoundaryInvalidation = () => collector.handleVisibilityOrFocusChange();
    document.addEventListener('visibilitychange', handleBoundaryInvalidation);
    window.addEventListener('blur', handleBoundaryInvalidation);
    window.addEventListener('focus', handleBoundaryInvalidation);
    return () => {
      document.removeEventListener('visibilitychange', handleBoundaryInvalidation);
      window.removeEventListener('blur', handleBoundaryInvalidation);
      window.removeEventListener('focus', handleBoundaryInvalidation);
      collector.dispose();
    };
  }, [collector]);

  return { startInitial };
}
```

- [ ] **Step 4: Start initial candidate after START_PAGE**

In `src/submodules/g8-banana-browning-experiment/trace/useTracePageStart.ts`, import the hook:

```ts
import { useBananaPageIdle } from './useBananaPageIdle';
```

After `traceLogger` creation:

```ts
const pageIdle = useBananaPageIdle(traceLogger);
```

Inside the effect after `traceLogger.startPage(metadataRef.current);`, add:

```ts
pageIdle.startInitial(new Date());
```

Add `pageIdle` to the effect dependency list. If this causes repeated starts because object identity changes, destructure `const { startInitial } = pageIdle;` and depend on `startInitial`.

- [ ] **Step 5: Run idle wiring test**

Run:

```powershell
npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/trace-page-events.test.tsx
```

Expected after implementation: Page03 text tests and PAGE_IDLE wiring test pass.

## Task 6: Page02 START_PAGE Metadata And CHAT_SCROLL

**Files:**
- Create: `src/submodules/g8-banana-browning-experiment/trace/pageStartMetadata.ts`
- Modify: `src/submodules/g8-banana-browning-experiment/pages/Page03BananaMystery.tsx`
- Modify: `src/submodules/g8-banana-browning-experiment/__tests__/trace-page-events.test.tsx`

- [ ] **Step 1: Add failing Page02 tests for viewport_state and CHAT_SCROLL**

Add to `src/submodules/g8-banana-browning-experiment/__tests__/trace-page-events.test.tsx`:

```ts
it('Page03 starts with backend fixture-shaped visible metadata', () => {
  Object.defineProperty(window, 'innerWidth', { value: 1280, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: 720, configurable: true });
  Object.defineProperty(window, 'scrollY', { value: 0, configurable: true });

  renderPage('banana_mystery', <Page03BananaMystery />);

  expect(traceLogger.startPage).toHaveBeenCalledWith(
    expect.objectContaining({
      initial_visible_content_ids: ['instruction_text_02_01', 'chat_bubble_02_01'],
      main_instruction_visible: true,
      viewport_state: {
        width: 1280,
        height: 720,
        scroll_y: 0,
      },
    })
  );
});

it('Page03 emits CHAT_SCROLL for user-originated chat scroll with backend fixture field names', () => {
  renderPage('banana_mystery', <Page03BananaMystery />);
  const chatBody = screen.getByTestId('page02-chat-body');

  Object.defineProperty(chatBody, 'scrollTop', { value: 420, writable: true });
  fireEvent.scroll(chatBody);
  Object.defineProperty(chatBody, 'scrollTop', { value: 0, writable: true });
  fireEvent.scroll(chatBody);

  expect(traceLogger.chatScroll).toHaveBeenCalledWith(
    expect.objectContaining({
      scrollDelta: -420,
      scrollDirection: 'up',
      visibleContentIdsBefore: expect.any(Array),
      visibleContentIdsAfter: expect.any(Array),
      phase: 'before_input',
    })
  );
});
```

- [ ] **Step 2: Implement safe page-start metadata helper**

Create `src/submodules/g8-banana-browning-experiment/trace/pageStartMetadata.ts`:

```ts
export interface ViewportState {
  width: number;
  height: number;
  scroll_y: number;
}

export const getViewportState = (): ViewportState => ({
  width: typeof window === 'undefined' ? 0 : window.innerWidth,
  height: typeof window === 'undefined' ? 0 : window.innerHeight,
  scroll_y: typeof window === 'undefined' ? 0 : window.scrollY,
});

export const buildPage02StartMetadata = () => ({
  initial_visible_content_ids: ['instruction_text_02_01', 'chat_bubble_02_01'],
  main_instruction_visible: true,
  viewport_state: getViewportState(),
});
```

- [ ] **Step 3: Add CHAT_SCROLL props and visible id extraction to Page02 chat component**

In `src/submodules/g8-banana-browning-experiment/pages/Page03BananaMystery.tsx`, extend `DialoguePhoneProps`:

```ts
  onUserScroll: (_payload: {
    scrollDelta: number;
    scrollDirection: 'up' | 'down';
    visibleContentIdsBefore: string[];
    visibleContentIdsAfter: string[];
  }) => void;
  readPhase: string;
```

Add helpers inside `DialoguePhone`:

```ts
  const lastScrollTopRef = useRef(0);
  const visibleIdsBeforeRef = useRef<string[]>([]);
  const suppressProgrammaticScrollRef = useRef(false);

  const getVisibleContentIds = useCallback(() => {
    const container = chatBodyRef.current;
    if (!container) {
      return [];
    }
    const containerRect = container.getBoundingClientRect();
    return Array.from(container.querySelectorAll<HTMLElement>('[data-content-id]'))
      .filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.bottom >= containerRect.top && rect.top <= containerRect.bottom;
      })
      .map(element => element.dataset.contentId)
      .filter((contentId): contentId is string => Boolean(contentId));
  }, []);
```

Wrap programmatic scroll suppression in `scrollToBottom()`:

```ts
suppressProgrammaticScrollRef.current = true;
setTimeout(() => {
  suppressProgrammaticScrollRef.current = false;
  visibleIdsBeforeRef.current = getVisibleContentIds();
  lastScrollTopRef.current = chatBodyRef.current?.scrollTop || 0;
}, 150);
```

Add scroll handler:

```ts
  const handleScroll = useCallback(() => {
    const container = chatBodyRef.current;
    if (!container || suppressProgrammaticScrollRef.current) {
      return;
    }
    const nextScrollTop = container.scrollTop;
    const scrollDelta = nextScrollTop - lastScrollTopRef.current;
    if (scrollDelta === 0) {
      return;
    }
    const visibleContentIdsBefore = visibleIdsBeforeRef.current;
    const visibleContentIdsAfter = getVisibleContentIds();
    onUserScroll({
      scrollDelta,
      scrollDirection: scrollDelta < 0 ? 'up' : 'down',
      visibleContentIdsBefore,
      visibleContentIdsAfter,
    });
    lastScrollTopRef.current = nextScrollTop;
    visibleIdsBeforeRef.current = visibleContentIdsAfter;
  }, [getVisibleContentIds, onUserScroll]);
```

Change chat body div:

```tsx
<div
  className={styles.chatBody}
  ref={chatBodyRef}
  onScroll={handleScroll}
  data-testid="page02-chat-body"
>
```

Add `data-content-id` to each message row for registry-backed visible ids:

```tsx
data-content-id={`chat_bubble_02_${String(idx + 1).padStart(2, '0')}`}
```

- [ ] **Step 4: Wire Page02 metadata and chatScroll logger**

In `Page03BananaMystery.tsx`, import:

```ts
import { buildPage02StartMetadata } from '../trace/pageStartMetadata';
```

Change the `useTracePageStart` metadata:

```ts
metadata: buildPage02StartMetadata(),
```

Track input phase:

```ts
const [hasInputFocus, setHasInputFocus] = useState(false);
```

Update focus/blur handlers:

```ts
const handleInputFocus = useCallback(() => {
  setHasInputFocus(true);
  getTextCollector()?.onFocus(inputValue);
}, [getTextCollector, inputValue]);

const handleInputBlur = useCallback(() => {
  getTextCollector()?.onBlur(inputValue, {
    source_answer_key: 'Q1_科学问题',
  });
}, [getTextCollector, inputValue]);
```

Add scroll callback:

```ts
const handleUserScroll = useCallback(
  (payload: {
    scrollDelta: number;
    scrollDirection: 'up' | 'down';
    visibleContentIdsBefore: string[];
    visibleContentIdsAfter: string[];
  }) => {
    traceLogger?.chatScroll({
      ...payload,
      phase: hasInputFocus ? 'during_input' : 'before_input',
    });
  },
  [hasInputFocus, traceLogger]
);
```

Pass props:

```tsx
<DialoguePhone
  messages={dialogueMessages}
  onMessageClick={handleMessageClick}
  onUserScroll={handleUserScroll}
  readPhase={hasInputFocus ? 'during_input' : 'before_input'}
/>
```

- [ ] **Step 5: Run Page02 focused tests**

Run:

```powershell
npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/trace-page-events.test.tsx
```

Expected after implementation: Page02 metadata, `CHAT_SCROLL`, text flush, and Page13 existing tests pass.

## Task 7: Backend Fixture Drift And Acceptance Tests

**Files:**
- Modify: `src/submodules/g8-banana-browning-experiment/__tests__/trace-acceptance.test.ts`
- Modify: `src/shared/services/submission/trace/__tests__/contracts-sync.test.ts`
- Modify: `src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts`

- [ ] **Step 1: Update acceptance fixture imports and case ids to v2.2 Page02/PageIdle**

In `src/submodules/g8-banana-browning-experiment/__tests__/trace-acceptance.test.ts`, import:

```ts
import page02PageIdle from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page02_page_idle.json';
```

Update required case ids:

```ts
const REQUIRED_CASE_IDS = [
  'page02_question_generation_v2_2',
  'page02_page_idle_v2_2',
  'page05_multi_idea_generation_v2_1',
  'page08_direct_skip_v2_1_3',
  'page09_experiment_question_v2_1',
  'page12_solution_selection_v2_1',
  'page13_task_finish_v2_1_3',
];
```

Update cases:

```ts
const cases: AcceptanceCase[] = [
  page02QuestionGeneration,
  page02PageIdle,
  page05MultiIdeaGeneration,
  page08DirectSkip,
  page09ExperimentQuestion,
  page12SolutionSelection,
  page13TaskFinish,
];
```

- [ ] **Step 2: Add fixture shape assertions for backend-canonical field names**

Add in `trace-acceptance.test.ts`:

```ts
it('keeps Page02 fixture field names aligned with backend v2.2', () => {
  const startPage = getFixtureOperation(page02QuestionGeneration, 'START_PAGE');
  const chatScroll = getFixtureOperation(page02QuestionGeneration, 'CHAT_SCROLL');
  const pageIdle = getFixtureOperation(page02PageIdle, 'PAGE_IDLE');

  expect(startPage.value.metadata).toMatchObject({
    schema_version: 'science-inquiry-trace-v2.2',
    field_registry_version: 'science-inquiry-field-registry-v2.2',
    field_registry_hash: '93f0d6b95a7ae9615bf9bc0604fd81fa52d47712c9f3eda8670875e6646bcc54',
    content_registry_version: 'science-inquiry-content-registry-banana-v2.2',
    content_registry_hash: '2460fbe2bfea3036543ed10377f795d494797eea0cdcc8f0767843951cc97d35',
    rule_config_version: 'rule-config-v2.2',
    rule_config_hash: 'c29da8988f93be25b69d4b7f82df417fb2f70741c4d0eb923de9e69531fd5d83',
  });
  expect(Object.keys(startPage.value.metadata.viewport_state).sort()).toEqual([
    'height',
    'scroll_y',
    'width',
  ]);
  expect(Object.keys(chatScroll.value.metadata).sort()).toEqual([
    'phase',
    'scroll_delta',
    'scroll_direction',
    'visible_content_ids_after',
    'visible_content_ids_before',
  ]);
  expect(pageIdle.value.metadata.idle_duration_ms).toBeGreaterThanOrEqual(5000);
  expect(pageIdle.value.metadata).toMatchObject({
    idle_phase: 'initial_before_first_action',
    page_visible: true,
    window_focused: true,
    threshold_ms: 5000,
  });
});
```

- [ ] **Step 3: Ensure fixture validation accepts PAGE_IDLE and CHAT_SCROLL**

Run:

```powershell
npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/trace-acceptance.test.ts src/shared/services/submission/trace/__tests__/validateTraceMark.test.ts
```

Expected after implementation: v2.2 Page02 and PAGE_IDLE fixtures validate without throwing.

- [ ] **Step 4: Preserve text cadence tests**

Run:

```powershell
npx vitest run src/shared/services/submission/trace/collectors/text.test.ts src/submodules/g8-banana-browning-experiment/__tests__/trace-page-events.test.tsx
```

Expected after implementation: text collector still emits real debounce/char-delta changes and still flushes short blur/submit without fabricated intermediate `TEXT_CHANGE` events.

If `collectors/text.test.ts` does not exist, create `src/shared/services/submission/trace/collectors/text.test.ts` with:

```ts
import { describe, expect, it, vi } from 'vitest';
import { createTextEventCollector } from './text';

describe('createTextEventCollector cadence', () => {
  it('emits TEXT_CHANGE on debounce before blur for natural long input', () => {
    vi.useFakeTimers();
    const logger = {
      textFocus: vi.fn(),
      textChange: vi.fn(),
      textBlur: vi.fn(),
    };
    const collector = createTextEventCollector({
      fieldId: 'input_question_1',
      logger,
      debounceMs: 2000,
      throttleCharDelta: 10,
    });

    collector.onFocus('');
    collector.onChange('香蕉皮为什么会很快变黑');
    vi.advanceTimersByTime(2000);

    expect(logger.textChange).toHaveBeenCalledWith(
      'input_question_1',
      '',
      '香蕉皮为什么会很快变黑',
      expect.objectContaining({ flush_reason: 'debounce' })
    );
    expect(logger.textBlur).not.toHaveBeenCalled();
    vi.useRealTimers();
  });

  it('keeps short input blur flush collapsed without fake cadence', () => {
    const logger = {
      textFocus: vi.fn(),
      textChange: vi.fn(),
      textBlur: vi.fn(),
    };
    const collector = createTextEventCollector({
      fieldId: 'input_question_1',
      logger,
      debounceMs: 2000,
      throttleCharDelta: 10,
    });

    collector.onFocus('');
    collector.onChange('香蕉');
    collector.onBlur('香蕉');

    expect(logger.textChange).toHaveBeenCalledTimes(1);
    expect(logger.textChange).toHaveBeenCalledWith(
      'input_question_1',
      '',
      '香蕉',
      expect.objectContaining({ flush_reason: 'blur' })
    );
    expect(logger.textBlur).toHaveBeenCalledTimes(1);
  });
});
```

## Task 8: Verification, OpenSpec Task Updates, Graphify, And Repo Result

**Files:**
- Modify: `openspec/changes/support-banana-trace-page-idle-compliance/tasks.md`
- Write: `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\repo-results\cp.md`

- [ ] **Step 1: Run focused trace tests**

Run:

```powershell
npx vitest run src/shared/services/submission/trace/__tests__ src/shared/services/submission/trace/collectors src/submodules/g8-banana-browning-experiment/__tests__
```

Expected: all focused trace/banana tests pass.

- [ ] **Step 2: Run required submission guard commands**

Run:

```powershell
npm run lint:submission
npm run test:submission-format
npm run test:submission
```

Expected: all three commands exit 0. If an existing unrelated failure appears, capture exact failing test and do not mark the OpenSpec task complete.

- [ ] **Step 3: Validate OpenSpec after implementation**

Run:

```powershell
openspec validate support-banana-trace-page-idle-compliance --strict
```

Expected: validation passes.

- [ ] **Step 4: Rebuild graphify after code changes**

Run:

```powershell
python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"
```

Expected: command exits 0 and updates `graphify-out/`.

- [ ] **Step 5: Update OpenSpec tasks**

In `openspec/changes/support-banana-trace-page-idle-compliance/tasks.md`, mark completed tasks with `[x]` only for work that passed verification. Keep any unverified or blocked tasks as `[ ]` and add a short note under that task.

- [ ] **Step 6: Write cp repo result**

Create or update `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\repo-results\cp.md` with this structure:

```md
# cp Frontend Result - support-banana-trace-page-idle-compliance

Date: 2026-06-06
Repository: `D:\myproject\cp-banana-trace-standardization`

## Summary

- Switched frontend runtime/static trace contracts to backend `science-inquiry-trace-v2.2` literals.
- START_PAGE metadata consumes backend literal versions/hashes and includes safe Page02 viewport metadata.
- PAGE_IDLE emits only when `idle_duration_ms >= pageIdleThresholdMs` (`>= 5000ms`) and page/window are visible/focused.
- Page02 active reading evidence covers `CONTENT_ACTIVATE` and user-originated `CHAT_SCROLL` with backend fixture field names.
- TEXT_CHANGE cadence remains natural; short blur flush is not fabricated.

## Changed Files

- `src/shared/services/submission/trace/contracts.ts`
- `src/shared/services/submission/trace/logger.ts`
- `src/shared/services/submission/trace/types.ts`
- `src/shared/services/submission/trace/validators/validateTraceMark.ts`
- `src/shared/services/submission/trace/collectors/pageIdle.ts`
- `src/submodules/g8-banana-browning-experiment/trace/useBananaPageIdle.ts`
- `src/submodules/g8-banana-browning-experiment/trace/pageStartMetadata.ts`
- `src/submodules/g8-banana-browning-experiment/pages/Page03BananaMystery.tsx`
- `src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx`
- `src/shared/services/submission/trace/__tests__/*`
- `src/submodules/g8-banana-browning-experiment/__tests__/*`
- `docs/子模块数据上报规范/engineering_contracts/*v2.2.json`
- `docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page02_question_generation.json`
- `docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page02_page_idle.json`

## Verification

- `npx vitest run src/shared/services/submission/trace/__tests__ src/shared/services/submission/trace/collectors src/submodules/g8-banana-browning-experiment/__tests__` - PASS
- `npm run lint:submission` - PASS
- `npm run test:submission-format` - PASS
- `npm run test:submission` - PASS
- `openspec validate support-banana-trace-page-idle-compliance --strict` - PASS
- `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` - PASS

## Backend v2.2 Fixture Alignment

- `page02_question_generation.json`: aligned for START_PAGE literals, `viewport_state`, `CONTENT_ACTIVATE`, `CHAT_SCROLL`, and text timing policy.
- `page02_page_idle.json`: aligned for `PAGE_IDLE` metadata and `idle_duration_ms >= pageIdleThresholdMs`.

## Remaining Main-Session Decisions

- Confirm whether production must retain v2.1 contract files for historical submissions; frontend runtime now targets v2.2 for banana L2 trace.
```

If any verification command fails, replace `PASS` with `FAIL`, include the exact command output summary, and list the blocking file/test under `Remaining Main-Session Decisions`.

## Final Checklist

- [ ] No backend repository files modified.
- [ ] No `D:\myproject\cp` main directory files modified.
- [ ] Runtime metadata reports v2.2 literal values and does not compute hashes.
- [ ] `PAGE_IDLE` uses only `initial_before_first_action`, `after_blocked_submit`, `between_effective_events`.
- [ ] `finish_page_idle` is not emitted.
- [ ] `idle_duration_ms >= pageIdleThresholdMs` / `>= 5000ms` is enforced.
- [ ] `CHAT_SCROLL` uses backend fixture field names.
- [ ] `viewport_state` uses backend fixture field names.
- [ ] Backend v2.2 fixtures are included in frontend drift/fixture tests.
- [ ] Short-input blur flush remains natural and is not faked.
