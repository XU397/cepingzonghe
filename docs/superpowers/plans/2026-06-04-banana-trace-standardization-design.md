# Banana Trace Standardization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert `g8-banana-browning-experiment` standard task pages from legacy operation events to L2 trace events while keeping the existing `/stu/saveHcMark` Mark envelope unchanged.

**Architecture:** Add a shared trace layer under `src/shared/services/submission/trace/` that builds and validates L2 operation objects from the synced engineering contracts. Add banana-specific `TRACE_PAGE_CONFIGS` and thin page hooks so pages emit `START_PAGE`, content, text, experiment, answer, table, submit, and finish events through the existing `logOperation()` queue. Make the shared submission pipeline mode-aware so L2 pages skip legacy lifecycle/`flow_context` injection, while `intro_notice` and other modules stay legacy.

**Tech Stack:** React 18, Vite 4, TypeScript, Vitest, Testing Library, existing `usePageSubmission`, `AssessmentPageFrame`, and synced JSON contracts in `docs/子模块数据上报规范/engineering_contracts/`.

---

## Source Requirements

- Spec: `docs/superpowers/specs/2026-06-04-banana-trace-standardization-design.md`
- Review: `docs/superpowers/specs/2026-06-04-banana-trace-L0-L2-implementation-path-review.md`
- Contracts:
  - `docs/子模块数据上报规范/engineering_contracts/event_schema.v2.1.json`
  - `docs/子模块数据上报规范/engineering_contracts/field_registry.v2.1.json`
  - `docs/子模块数据上报规范/engineering_contracts/content_registry.banana.v2.1.json`
  - `docs/子模块数据上报规范/engineering_contracts/rule_config.v2.1.json`
  - `docs/子模块数据上报规范/engineering_contracts/acceptance_cases/*.json`

## Blast Radius Already Checked

GitNexus impact was run before this plan was written:

- `usePageSubmission` (`src/shared/services/submission/usePageSubmission.js`): HIGH risk, 4 direct callers, 2 affected processes, 3 affected modules. Keep changes opt-in through `lifecycleMode: 'l2-trace'`.
- `validateMarkObject` (`src/shared/services/submission/schema.ts`): HIGH risk, direct caller is `submitInternal`. Do not weaken legacy validation; add a separate trace validator.
- `G8BananaBrowningProvider` (`src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx`): LOW risk, direct caller `G8BananaBrowningExperiment`.
- `AssessmentPageFrame` (`src/shared/ui/PageFrame/AssessmentPageFrame.jsx`): LOW risk in GitNexus output, but it is shared UI; pass new props through without changing defaults.
- `PAGE_CONFIGS` (`src/submodules/g8-banana-browning-experiment/mapping.ts`): LOW risk; do not change existing `PAGE_CONFIGS` entries.
- `SimulationPanel` (`src/submodules/g8-banana-browning-experiment/components/SimulationPanel.tsx`): LOW risk after disambiguating the function symbol.

## File Structure

- Modify: `src/submodules/g8-banana-browning-experiment/mapping.ts`
  - Add `TRACE_PAGE_CONFIGS`, page lookup helpers, and registry-backed field/question/content IDs.
- Create: `src/shared/services/submission/trace/types.ts`
  - Shared trace event/value/config interfaces and `SubmissionLifecycleMode`.
- Create: `src/shared/services/submission/trace/contracts.ts`
  - Imports synced JSON contracts and exposes event/page registry helpers.
- Create: `src/shared/services/submission/trace/logger.ts`
  - Builds `TraceOperationDraft` objects and sends them to existing `logOperation()`.
- Create: `src/shared/services/submission/trace/collectors/text.ts`
  - Debounced text focus/change/blur collector with forced flush.
- Create: `src/shared/services/submission/trace/collectors/experiment.ts`
  - Experiment parameter/run/reset collector with duplicate run suppression.
- Create: `src/shared/services/submission/trace/collectors/dynamicTable.ts`
  - Stable row ID generation and table operation events.
- Create: `src/shared/services/submission/trace/validators/validateTraceMark.ts`
  - L2 trace-only Mark validation using event schema and registries.
- Create: `src/shared/services/submission/trace/index.ts`
  - Public exports.
- Modify: `src/shared/services/submission/usePageSubmission.js`
  - Add `lifecycleMode` and `traceValidator` options; preserve legacy default.
- Modify: `src/shared/ui/PageFrame/AssessmentPageFrame.jsx`
  - Pass `lifecycleMode` and `traceValidator` through `submission`.
- Modify: `src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx`
  - Keep object `value` for L2 and avoid legacy `flow_context` injection for non-legacy start events.
- Create: `src/submodules/g8-banana-browning-experiment/trace/useBananaTraceLogger.ts`
  - Banana-specific hook that binds `TRACE_PAGE_CONFIGS`, flow context, and page number.
- Modify: `src/submodules/g8-banana-browning-experiment/Component.tsx`
  - Use L2 submission mode for `TRACE_PAGE_CONFIGS` pages and emit `SUBMIT_ATTEMPT`.
- Modify pages:
  - `src/submodules/g8-banana-browning-experiment/pages/Page02BananaBrowning.tsx`
  - `src/submodules/g8-banana-browning-experiment/pages/Page03BananaMystery.tsx`
  - `src/submodules/g8-banana-browning-experiment/pages/Page04BananaBrowningReading.tsx`
  - `src/submodules/g8-banana-browning-experiment/pages/Page05BananaBrowning.tsx`
  - `src/submodules/g8-banana-browning-experiment/pages/Page06BananaBrowningDesign.tsx`
  - `src/submodules/g8-banana-browning-experiment/pages/Page07BananaBrowningEvaluation.tsx`
  - `src/submodules/g8-banana-browning-experiment/pages/Page08BananaBrowning.tsx`
  - `src/submodules/g8-banana-browning-experiment/pages/Page09BananaBrowningSimulationMain.tsx`
  - `src/submodules/g8-banana-browning-experiment/pages/Page10SimulationQuestion1.tsx`
  - `src/submodules/g8-banana-browning-experiment/pages/Page11SimulationQuestion2.tsx`
  - `src/submodules/g8-banana-browning-experiment/pages/Page12SimulationQuestion3.tsx`
  - `src/submodules/g8-banana-browning-experiment/pages/Page13SolutionSelection.tsx`
  - `src/submodules/g8-banana-browning-experiment/pages/Page14TaskCompletion.tsx`
- Keep legacy: `src/submodules/g8-banana-browning-experiment/pages/Page01Notice.tsx`
  - Do not convert `intro_notice` to L2 in this change.
- Tests:
  - Create: `src/submodules/g8-banana-browning-experiment/__tests__/trace-config.test.ts`
  - Create: `src/shared/services/submission/trace/__tests__/logger.test.ts`
  - Create: `src/shared/services/submission/trace/__tests__/collectors.test.ts`
  - Create: `src/shared/services/submission/trace/__tests__/validateTraceMark.test.ts`
  - Modify: `src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts`
  - Modify: `src/submodules/g8-banana-browning-experiment/__tests__/submission.snapshot.test.ts`

---

### Task 0: Preflight Guardrails

**Files:**
- Read only: repository status and GitNexus impact output

- [ ] **Step 1: Confirm the current dirty worktree**

Run:

```powershell
git status --short
```

Expected: output may include existing user changes such as `docs/superpowers/specs/2026-06-04-banana-trace-standardization-design.md`, `.claude/*`, fullscreen hooks, and contract docs. Do not revert or commit unrelated files.

- [ ] **Step 2: Re-run focused impact checks before editing shared symbols**

Run:

```powershell
npx gitnexus impact usePageSubmission --direction upstream
npx gitnexus impact validateMarkObject --direction upstream
npx gitnexus impact G8BananaBrowningProvider --direction upstream
```

Expected: `usePageSubmission` and `validateMarkObject` are HIGH risk; proceed only because the implementation is opt-in and preserves legacy defaults.

- [ ] **Step 3: Run baseline tests for the affected suites**

Run:

```powershell
npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/mapping.test.ts src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts src/shared/services/submission/__tests__/submission-format.snapshot.test.js
```

Expected: PASS before edits, or record any pre-existing failures in the task handoff before changing code.

- [ ] **Step 4: Commit nothing**

Run:

```powershell
git status --short
```

Expected: no new files from Task 0. This task is a safety checkpoint only.

---

### Task 1: Banana Trace Page Config

**Files:**
- Modify: `src/submodules/g8-banana-browning-experiment/mapping.ts`
- Create: `src/submodules/g8-banana-browning-experiment/__tests__/trace-config.test.ts`

- [ ] **Step 1: Write the failing trace config test**

Create `src/submodules/g8-banana-browning-experiment/__tests__/trace-config.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import {
  PAGE_CONFIGS,
  TRACE_PAGE_CONFIGS,
  getPageConfig,
  getTracePageConfigByLegacyPageId,
  getTracePageConfigByStandardPageId,
  isTraceStandardPage,
} from '../mapping';

describe('g8 banana trace page config', () => {
  it('keeps legacy PAGE_CONFIGS stable and adds exactly 13 L2 pages', () => {
    expect(PAGE_CONFIGS).toHaveLength(14);
    expect(TRACE_PAGE_CONFIGS).toHaveLength(13);
    expect(isTraceStandardPage('intro_notice')).toBe(false);
    expect(getTracePageConfigByLegacyPageId('intro_notice')).toBeUndefined();
  });

  it('maps every L2 trace page back to an existing legacy page', () => {
    TRACE_PAGE_CONFIGS.forEach((config, index) => {
      expect(config.pageIndex).toBe(index + 1);
      expect(getPageConfig(config.legacyPageId)).toBeDefined();
      expect(getTracePageConfigByLegacyPageId(config.legacyPageId)).toBe(config);
      expect(getTracePageConfigByStandardPageId(config.standardPageId)).toBe(config);
      expect(config.lifecycleMode).toBe('l2-trace');
      expect(config.pageType).toMatch(/^[A-E]\d_/);
    });
  });

  it('uses registry page IDs in the required order', () => {
    expect(TRACE_PAGE_CONFIGS.map(config => config.standardPageId)).toEqual([
      'page_01_intro',
      'page_02_question_generation',
      'page_03_factor_selection',
      'page_04_transition',
      'page_05_plan_generation',
      'page_06_method_evaluation',
      'page_07_experiment_intro',
      'page_08_simulation_explore',
      'page_09_experiment_question_1',
      'page_10_experiment_question_2',
      'page_11_experiment_question_3',
      'page_12_solution_selection',
      'page_13_finish',
    ]);
  });

  it('binds critical fields, questions, content, and experiment params', () => {
    expect(getTracePageConfigByLegacyPageId('banana_mystery')?.requiredFields).toEqual([
      'input_question_1',
    ]);
    expect(getTracePageConfigByLegacyPageId('banana_browning_reading')?.requiredFields).toEqual([
      'factor_options',
    ]);
    expect(getTracePageConfigByLegacyPageId('banana_browning_design')?.requiredFields).toEqual([
      'input_idea_1',
      'input_idea_2',
      'input_idea_3',
    ]);
    expect(getTracePageConfigByLegacyPageId('simulation_question_1')?.questions).toEqual({
      Q5: {
        questionId: 'question_1',
        fieldId: 'question_1_answer',
        options: {
          A: 'option_a',
          B: 'option_b',
          C: 'option_c',
          D: 'option_d',
        },
      },
    });
    expect(getTracePageConfigByLegacyPageId('solution_selection')?.requiredFields).toEqual([
      'plan_table',
      'reason_text',
    ]);
    expect(getTracePageConfigByLegacyPageId('solution_selection')?.fieldIds).toEqual([
      'chart_evidence_1',
      'plan_table',
      'reason_text',
    ]);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/trace-config.test.ts
```

Expected: FAIL because `TRACE_PAGE_CONFIGS` and lookup helpers are not exported.

- [ ] **Step 3: Add trace config types and data**

In `src/submodules/g8-banana-browning-experiment/mapping.ts`, add these exports after `PageConfig`:

```typescript
export type TracePageType =
  | 'A1_FLOW'
  | 'B1_TEXT_SINGLE'
  | 'B2_TEXT_MULTI_PARALLEL'
  | 'B3_TEXT_MATRIX_EVALUATION'
  | 'C1_INFO_SELECTION'
  | 'D1_SIMULATION_ONLY'
  | 'D2_SIMULATION_QUESTION'
  | 'E1_CHART_PLAN_DECISION';

export type TraceLifecycleMode = 'l2-trace';

export interface TraceQuestionBinding {
  questionId: string;
  fieldId: string;
  options: Record<string, string>;
}

export interface TracePageConfig {
  legacyPageId: PageId;
  standardPageId: string;
  pageIndex: number;
  pageType: TracePageType;
  lifecycleMode: TraceLifecycleMode;
  requiredFields: string[];
  fieldIds?: string[];
  contentIds?: string[];
  questions?: Record<string, TraceQuestionBinding>;
  experimentParams?: Record<string, string>;
}
```

Add these exports after `PAGE_CONFIGS`:

```typescript
export const TRACE_PAGE_CONFIGS: TracePageConfig[] = [
  {
    legacyPageId: 'page_02_banana_browning',
    standardPageId: 'page_01_intro',
    pageIndex: 1,
    pageType: 'A1_FLOW',
    lifecycleMode: 'l2-trace',
    requiredFields: [],
  },
  {
    legacyPageId: 'banana_mystery',
    standardPageId: 'page_02_question_generation',
    pageIndex: 2,
    pageType: 'B1_TEXT_SINGLE',
    lifecycleMode: 'l2-trace',
    requiredFields: ['input_question_1'],
    contentIds: [
      'chat_bubble_02_01',
      'chat_bubble_02_02',
      'chat_bubble_02_03',
      'chat_bubble_02_04',
      'chat_bubble_02_05',
      'instruction_text_02_01',
    ],
  },
  {
    legacyPageId: 'banana_browning_reading',
    standardPageId: 'page_03_factor_selection',
    pageIndex: 3,
    pageType: 'C1_INFO_SELECTION',
    lifecycleMode: 'l2-trace',
    requiredFields: ['factor_options'],
    contentIds: ['card_1', 'card_2', 'card_3'],
  },
  {
    legacyPageId: 'page_05_banana_browning',
    standardPageId: 'page_04_transition',
    pageIndex: 4,
    pageType: 'A1_FLOW',
    lifecycleMode: 'l2-trace',
    requiredFields: [],
  },
  {
    legacyPageId: 'banana_browning_design',
    standardPageId: 'page_05_plan_generation',
    pageIndex: 5,
    pageType: 'B2_TEXT_MULTI_PARALLEL',
    lifecycleMode: 'l2-trace',
    requiredFields: ['input_idea_1', 'input_idea_2', 'input_idea_3'],
  },
  {
    legacyPageId: 'banana_browning_evaluation',
    standardPageId: 'page_06_method_evaluation',
    pageIndex: 6,
    pageType: 'B3_TEXT_MATRIX_EVALUATION',
    lifecycleMode: 'l2-trace',
    requiredFields: [
      'method_1_advantage',
      'method_1_disadvantage',
      'method_2_advantage',
      'method_2_disadvantage',
      'method_3_advantage',
      'method_3_disadvantage',
    ],
  },
  {
    legacyPageId: 'page_08_banana_browning',
    standardPageId: 'page_07_experiment_intro',
    pageIndex: 7,
    pageType: 'A1_FLOW',
    lifecycleMode: 'l2-trace',
    requiredFields: [],
  },
  {
    legacyPageId: 'banana_browning_simulation_main',
    standardPageId: 'page_08_simulation_explore',
    pageIndex: 8,
    pageType: 'D1_SIMULATION_ONLY',
    lifecycleMode: 'l2-trace',
    requiredFields: [],
    experimentParams: {
      days: 'exp_param_days',
    },
  },
  {
    legacyPageId: 'simulation_question_1',
    standardPageId: 'page_09_experiment_question_1',
    pageIndex: 9,
    pageType: 'D2_SIMULATION_QUESTION',
    lifecycleMode: 'l2-trace',
    requiredFields: ['question_1_answer'],
    experimentParams: {
      days: 'exp_param_days',
    },
    questions: {
      Q5: {
        questionId: 'question_1',
        fieldId: 'question_1_answer',
        options: {
          A: 'option_a',
          B: 'option_b',
          C: 'option_c',
          D: 'option_d',
        },
      },
    },
  },
  {
    legacyPageId: 'simulation_question_2',
    standardPageId: 'page_10_experiment_question_2',
    pageIndex: 10,
    pageType: 'D2_SIMULATION_QUESTION',
    lifecycleMode: 'l2-trace',
    requiredFields: ['question_2_answer'],
    experimentParams: {
      days: 'exp_param_days',
    },
    questions: {
      Q6: {
        questionId: 'question_2',
        fieldId: 'question_2_answer',
        options: {
          A: 'option_a',
          B: 'option_b',
          C: 'option_c',
          D: 'option_d',
        },
      },
    },
  },
  {
    legacyPageId: 'simulation_question_3',
    standardPageId: 'page_11_experiment_question_3',
    pageIndex: 11,
    pageType: 'D2_SIMULATION_QUESTION',
    lifecycleMode: 'l2-trace',
    requiredFields: ['question_3_answer'],
    experimentParams: {
      days: 'exp_param_days',
    },
    questions: {
      Q7: {
        questionId: 'question_3',
        fieldId: 'question_3_answer',
        options: {
          A: 'option_a',
          B: 'option_b',
          C: 'option_c',
          D: 'option_d',
        },
      },
    },
  },
  {
    legacyPageId: 'solution_selection',
    standardPageId: 'page_12_solution_selection',
    pageIndex: 12,
    pageType: 'E1_CHART_PLAN_DECISION',
    lifecycleMode: 'l2-trace',
    requiredFields: ['plan_table', 'reason_text'],
    fieldIds: ['chart_evidence_1', 'plan_table', 'reason_text'],
    contentIds: ['chart_note_12_01'],
  },
  {
    legacyPageId: 'task_completion',
    standardPageId: 'page_13_finish',
    pageIndex: 13,
    pageType: 'A1_FLOW',
    lifecycleMode: 'l2-trace',
    requiredFields: [],
  },
];

export function getTracePageConfigByLegacyPageId(
  pageId: string
): TracePageConfig | undefined {
  return TRACE_PAGE_CONFIGS.find(config => config.legacyPageId === pageId);
}

export function getTracePageConfigByStandardPageId(
  pageId: string
): TracePageConfig | undefined {
  return TRACE_PAGE_CONFIGS.find(config => config.standardPageId === pageId);
}

export function isTraceStandardPage(pageId: string): boolean {
  return Boolean(getTracePageConfigByLegacyPageId(pageId));
}
```

- [ ] **Step 4: Run the trace config test**

Run:

```powershell
npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/trace-config.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/submodules/g8-banana-browning-experiment/mapping.ts src/submodules/g8-banana-browning-experiment/__tests__/trace-config.test.ts
git commit -m "feat: add banana L2 trace page config"
```

Expected: commit contains only the mapping/test files from this task.

---

### Task 2: Shared Trace Logger

**Files:**
- Create: `src/shared/services/submission/trace/types.ts`
- Create: `src/shared/services/submission/trace/contracts.ts`
- Create: `src/shared/services/submission/trace/logger.ts`
- Create: `src/shared/services/submission/trace/index.ts`
- Create: `src/shared/services/submission/trace/__tests__/logger.test.ts`

- [ ] **Step 1: Write the failing logger tests**

Create `src/shared/services/submission/trace/__tests__/logger.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest';
import { createPageTraceLogger } from '../logger';
import { TRACE_EVENT_TYPES } from '../contracts';

describe('createPageTraceLogger', () => {
  const baseOptions = {
    page: {
      legacyPageId: 'simulation_question_1',
      standardPageId: 'page_09_experiment_question_1',
      pageIndex: 9,
      pageType: 'D2_SIMULATION_QUESTION' as const,
      lifecycleMode: 'l2-trace' as const,
      requiredFields: ['question_1_answer'],
    },
    pageNumber: '1.10',
    flowContext: {
      flowId: 'flow-g8',
      submoduleId: 'g8-banana-browning-experiment',
      stepIndex: 0,
      moduleName: '8年级香蕉变黑科学探究',
      pageId: 'simulation_question_1',
    },
    logOperation: vi.fn(),
    now: () => new Date('2026-06-03T02:10:00.000Z'),
    idFactory: {
      traceId: () => 'trace-1',
      submitAttemptId: () => 'submit-1',
      expRunId: (pageId: string, runSeq: number) => `${pageId}-run-${runSeq}`,
      rowId: (pageId: string, rowSeq: number) => `${pageId}-row-${rowSeq}`,
    },
  };

  it('loads L2 event types from the synced contract', () => {
    expect(TRACE_EVENT_TYPES).toContain('START_PAGE');
    expect(TRACE_EVENT_TYPES).toContain('TEXT_BLUR');
    expect(TRACE_EVENT_TYPES).toContain('EXECUTE_EXP');
    expect(TRACE_EVENT_TYPES).not.toContain('page_enter');
  });

  it('emits START_PAGE with registry metadata and flow context', () => {
    const logger = createPageTraceLogger(baseOptions);
    const operation = logger.startPage({
      initial_state: { selectedOption: null },
    });

    expect(operation).toMatchObject({
      targetElement: 'P1.10_page',
      eventType: 'START_PAGE',
      time: '2026-06-03T10:10:00.000+08:00',
      pageId: 'simulation_question_1',
      value: {
        trace_id: 'trace-1',
        page_id: 'page_09_experiment_question_1',
        page_type: 'D2_SIMULATION_QUESTION',
        target_id: 'page',
        target_type: 'page',
        metadata: {
          schema_version: 'science-inquiry-trace-v2.1',
          field_registry_version: 'science-inquiry-field-registry-v2.1',
          content_registry_version: 'science-inquiry-content-registry-banana-v2.1',
          page_index: 9,
          legacy_page_id: 'simulation_question_1',
          flow_context: baseOptions.flowContext,
          initial_state: { selectedOption: null },
        },
      },
    });
    expect(baseOptions.logOperation).toHaveBeenCalledWith(operation);
  });

  it('emits SELECT_ANSWER without allocating a code', () => {
    const logger = createPageTraceLogger(baseOptions);
    const operation = logger.selectAnswer({
      questionId: 'question_1',
      optionId: 'option_b',
      optionText: 'B. 6天',
      valueBefore: 'option_a',
      targetId: 'question_1_option_b',
      questionIndex: 1,
      totalQuestionCount: 3,
    });

    expect(operation).not.toHaveProperty('code');
    expect(operation).toMatchObject({
      targetElement: 'P1.10_question_1_option_b',
      eventType: 'SELECT_ANSWER',
      value: {
        question_id: 'question_1',
        option_id: 'option_b',
        value_before: 'option_a',
        value_after: 'option_b',
        metadata: {
          option_text: 'B. 6天',
          question_index: 1,
          total_question_count: 3,
        },
      },
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npx vitest run src/shared/services/submission/trace/__tests__/logger.test.ts
```

Expected: FAIL because the trace package does not exist.

- [ ] **Step 3: Add shared trace types**

Create `src/shared/services/submission/trace/types.ts`:

```typescript
export type SubmissionLifecycleMode = 'legacy' | 'l2-trace';

export type L2TraceEventType =
  | 'START_PAGE'
  | 'PAGE_HIDDEN'
  | 'PAGE_VISIBLE'
  | 'SUBMIT_ATTEMPT'
  | 'TASK_FINISH'
  | 'CONTENT_EXPOSE'
  | 'CONTENT_ACTIVATE'
  | 'CONTENT_VIEW'
  | 'CHAT_SCROLL'
  | 'CHAT_VIEWPORT_ENTER'
  | 'CHAT_VIEWPORT_LEAVE'
  | 'OPEN_MODAL'
  | 'CLOSE_MODAL'
  | 'CHART_HOVER'
  | 'TEXT_FOCUS'
  | 'TEXT_CHANGE'
  | 'TEXT_BLUR'
  | 'CHECKBOX_TOGGLE'
  | 'SELECT_ANSWER'
  | 'SET_EXP_PARAM'
  | 'EXECUTE_EXP'
  | 'RESET_EXP'
  | 'ADD_ROW'
  | 'DELETE_ROW'
  | 'SET_PLAN_PARAM'
  | 'SELECT_BEST'
  | 'TIMER_COMPLETE';

export type L2PageType =
  | 'A1_FLOW'
  | 'B1_TEXT_SINGLE'
  | 'B2_TEXT_MULTI_PARALLEL'
  | 'B3_TEXT_MATRIX_EVALUATION'
  | 'C1_INFO_SELECTION'
  | 'D1_SIMULATION_ONLY'
  | 'D2_SIMULATION_QUESTION'
  | 'E1_CHART_PLAN_DECISION';

export type TraceTargetType =
  | 'page'
  | 'button'
  | 'text'
  | 'checkbox'
  | 'radio'
  | 'modal'
  | 'experiment'
  | 'chart'
  | 'table'
  | 'content'
  | 'timer';

export interface TracePageLike {
  legacyPageId: string;
  standardPageId: string;
  pageIndex: number;
  pageType: L2PageType;
  lifecycleMode: 'l2-trace';
  requiredFields: string[];
}

export interface TraceFlowContext {
  flowId?: string;
  submoduleId?: string;
  stepIndex?: number;
  moduleName?: string;
  pageId?: string;
}

export interface TraceEventValue {
  trace_id: string;
  page_id: string;
  page_type: L2PageType;
  target_id?: string;
  target_type: TraceTargetType;
  field_id?: string;
  content_id?: string;
  question_id?: string;
  option_id?: string;
  row_id?: string;
  param_id?: string;
  param_name?: string;
  chart_id?: string;
  point_id?: string;
  exp_run_id?: string;
  submit_attempt_id?: string;
  value_before?: unknown;
  value_after?: unknown;
  validation_status?: 'success' | 'blocked' | 'auto' | 'timeout' | 'none';
  metadata: Record<string, unknown>;
}

export interface TraceOperationDraft {
  targetElement: string;
  eventType: L2TraceEventType;
  value: TraceEventValue;
  time: string;
  pageId?: string;
}

export interface TraceIdFactory {
  traceId(): string;
  submitAttemptId(): string;
  expRunId(pageId: string, runSeq: number): string;
  rowId(pageId: string, rowSeq: number): string;
}
```

- [ ] **Step 4: Add contract loader**

Create `src/shared/services/submission/trace/contracts.ts`:

```typescript
import eventSchema from '../../../../../docs/子模块数据上报规范/engineering_contracts/event_schema.v2.1.json';
import fieldRegistry from '../../../../../docs/子模块数据上报规范/engineering_contracts/field_registry.v2.1.json';
import contentRegistry from '../../../../../docs/子模块数据上报规范/engineering_contracts/content_registry.banana.v2.1.json';
import ruleConfig from '../../../../../docs/子模块数据上报规范/engineering_contracts/rule_config.v2.1.json';
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
```

- [ ] **Step 5: Add logger implementation**

Create `src/shared/services/submission/trace/logger.ts`:

```typescript
import { buildTargetElementPrefix } from '@shared/utils/pageMapping.ts';
import {
  CONTENT_REGISTRY_HASH,
  CONTENT_REGISTRY_VERSION,
  FIELD_REGISTRY_HASH,
  FIELD_REGISTRY_VERSION,
  TRACE_SCHEMA_VERSION,
} from './contracts';
import type {
  L2TraceEventType,
  TraceEventValue,
  TraceFlowContext,
  TraceIdFactory,
  TraceOperationDraft,
  TracePageLike,
  TraceTargetType,
} from './types';

export interface TraceLoggerOptions {
  page: TracePageLike;
  pageNumber: string;
  flowContext?: TraceFlowContext | null;
  logOperation: (operation: TraceOperationDraft) => void;
  now?: () => Date;
  idFactory?: Partial<TraceIdFactory>;
}

export interface TraceEmitOptions {
  targetId: string;
  targetType: TraceTargetType;
  metadata?: Record<string, unknown>;
  time?: Date;
  emit?: boolean;
}

export interface SelectAnswerOptions {
  questionId: string;
  optionId: string;
  optionText?: string;
  valueBefore?: string | null;
  targetId: string;
  questionIndex?: number;
  totalQuestionCount?: number;
}

export interface SubmitAttemptOptions {
  validationStatus: 'success' | 'blocked' | 'auto' | 'timeout';
  missingFields?: string[];
  targetId?: string;
}

export const formatTraceTimestamp = (date: Date): string => {
  const pad = (value: number, length = 2) => String(value).padStart(length, '0');
  const offsetMinutes = -date.getTimezoneOffset();
  const offsetSign = offsetMinutes >= 0 ? '+' : '-';
  const absoluteOffset = Math.abs(offsetMinutes);
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`,
    `${offsetSign}${pad(Math.floor(absoluteOffset / 60))}:${pad(absoluteOffset % 60)}`,
  ].join('');
};

const defaultIdFactory: TraceIdFactory = {
  traceId: () => `trace_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
  submitAttemptId: () => `submit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  expRunId: (pageId, runSeq) => `${pageId}_exp_run_${runSeq}`,
  rowId: (pageId, rowSeq) => `${pageId}_row_${rowSeq}`,
};

export function createPageTraceLogger(options: TraceLoggerOptions) {
  const idFactory = { ...defaultIdFactory, ...options.idFactory };
  const now = options.now || (() => new Date());
  const targetPrefix = buildTargetElementPrefix(options.pageNumber);

  const createValue = (
    patch: Partial<TraceEventValue>,
    metadata: Record<string, unknown> = {}
  ): TraceEventValue => ({
    trace_id: patch.trace_id || idFactory.traceId(),
    page_id: options.page.standardPageId,
    page_type: options.page.pageType,
    target_id: patch.target_id,
    target_type: patch.target_type || 'page',
    field_id: patch.field_id,
    content_id: patch.content_id,
    question_id: patch.question_id,
    option_id: patch.option_id,
    row_id: patch.row_id,
    param_id: patch.param_id,
    param_name: patch.param_name,
    chart_id: patch.chart_id,
    point_id: patch.point_id,
    exp_run_id: patch.exp_run_id,
    submit_attempt_id: patch.submit_attempt_id,
    value_before: patch.value_before,
    value_after: patch.value_after,
    validation_status: patch.validation_status,
    metadata: {
      schema_version: TRACE_SCHEMA_VERSION,
      field_registry_version: FIELD_REGISTRY_VERSION,
      field_registry_hash: FIELD_REGISTRY_HASH,
      content_registry_version: CONTENT_REGISTRY_VERSION,
      content_registry_hash: CONTENT_REGISTRY_HASH,
      page_index: options.page.pageIndex,
      legacy_page_id: options.page.legacyPageId,
      ...metadata,
    },
  });

  const emit = (
    type: L2TraceEventType,
    patch: Partial<TraceEventValue>,
    emitOptions: TraceEmitOptions
  ): TraceOperationDraft => {
    const value = createValue(
      {
        ...patch,
        target_id: patch.target_id || emitOptions.targetId,
        target_type: patch.target_type || emitOptions.targetType,
      },
      emitOptions.metadata
    );
    const operation: TraceOperationDraft = {
      targetElement: `${targetPrefix}${emitOptions.targetId}`,
      eventType: type,
      value,
      time: formatTraceTimestamp(emitOptions.time || now()),
      pageId: options.page.legacyPageId,
    };
    if (emitOptions.emit !== false) {
      options.logOperation(operation);
    }
    return operation;
  };

  return {
    emit,
    startPage(metadata: Record<string, unknown> = {}) {
      return emit(
        'START_PAGE',
        {},
        {
          targetId: 'page',
          targetType: 'page',
          metadata: {
            flow_context: options.flowContext || null,
            ...metadata,
          },
        }
      );
    },
    textFocus(fieldId: string, valueBefore: string) {
      return emit(
        'TEXT_FOCUS',
        {
          field_id: fieldId,
          value_before: valueBefore,
        },
        {
          targetId: fieldId,
          targetType: 'text',
          metadata: { char_count_before: valueBefore.length },
        }
      );
    },
    textChange(fieldId: string, valueBefore: string, valueAfter: string, metadata = {}) {
      return emit(
        'TEXT_CHANGE',
        {
          field_id: fieldId,
          value_before: valueBefore,
          value_after: null,
        },
        {
          targetId: fieldId,
          targetType: 'text',
          metadata: {
            char_count_before: valueBefore.length,
            char_count_after: valueAfter.length,
            char_delta: valueAfter.length - valueBefore.length,
            ...metadata,
          },
        }
      );
    },
    textBlur(fieldId: string, valueBefore: string, valueAfter: string, metadata = {}) {
      return emit(
        'TEXT_BLUR',
        {
          field_id: fieldId,
          value_before: valueBefore,
          value_after: valueAfter,
        },
        {
          targetId: fieldId,
          targetType: 'text',
          metadata: {
            char_count_before: valueBefore.length,
            char_count_after: valueAfter.length,
            char_delta: valueAfter.length - valueBefore.length,
            ...metadata,
          },
        }
      );
    },
    contentActivate(contentId: string, targetType: TraceTargetType = 'content', metadata = {}) {
      return emit('CONTENT_ACTIVATE', { content_id: contentId }, { targetId: contentId, targetType, metadata });
    },
    openModal(contentId: string, metadata = {}) {
      return emit('OPEN_MODAL', { content_id: contentId }, { targetId: contentId, targetType: 'modal', metadata });
    },
    closeModal(contentId: string, dwellMs: number, metadata = {}) {
      return emit('CLOSE_MODAL', { content_id: contentId }, { targetId: contentId, targetType: 'modal', metadata: { dwell_ms: dwellMs, ...metadata } });
    },
    selectAnswer(options: SelectAnswerOptions) {
      return emit(
        'SELECT_ANSWER',
        {
          question_id: options.questionId,
          option_id: options.optionId,
          value_before: options.valueBefore ?? null,
          value_after: options.optionId,
        },
        {
          targetId: options.targetId,
          targetType: 'radio',
          metadata: {
            option_text: options.optionText,
            question_index: options.questionIndex,
            total_question_count: options.totalQuestionCount,
          },
        }
      );
    },
    setExpParam(paramId: string, paramName: string, valueBefore: unknown, valueAfter: unknown, metadata = {}) {
      return emit(
        'SET_EXP_PARAM',
        {
          param_id: paramId,
          param_name: paramName,
          value_before: valueBefore,
          value_after: valueAfter,
        },
        {
          targetId: paramId,
          targetType: 'experiment',
          metadata,
        }
      );
    },
    executeExp(expRunId: string, metadata = {}) {
      return emit('EXECUTE_EXP', { exp_run_id: expRunId }, { targetId: 'execute_exp', targetType: 'experiment', metadata });
    },
    resetExp(metadata = {}) {
      return emit('RESET_EXP', {}, { targetId: 'reset_exp', targetType: 'experiment', metadata });
    },
    addRow(rowId: string, metadata = {}) {
      return emit('ADD_ROW', { row_id: rowId }, { targetId: rowId, targetType: 'table', metadata });
    },
    deleteRow(rowId: string, metadata = {}) {
      return emit('DELETE_ROW', { row_id: rowId }, { targetId: rowId, targetType: 'table', metadata });
    },
    setPlanParam(rowId: string, paramId: string, valueBefore: unknown, valueAfter: unknown, metadata = {}) {
      return emit(
        'SET_PLAN_PARAM',
        {
          row_id: rowId,
          param_id: paramId,
          value_before: valueBefore,
          value_after: valueAfter,
        },
        {
          targetId: `${rowId}_${paramId}`,
          targetType: 'table',
          metadata,
        }
      );
    },
    selectBest(rowId: string, previousBestRowId: string | null) {
      return emit(
        'SELECT_BEST',
        {
          row_id: rowId,
          value_before: previousBestRowId,
          value_after: rowId,
        },
        {
          targetId: `${rowId}_best`,
          targetType: 'table',
          metadata: {
            previous_best_row_id: previousBestRowId,
            current_best_row_id: rowId,
          },
        }
      );
    },
    submitAttempt(options: SubmitAttemptOptions) {
      return emit(
        'SUBMIT_ATTEMPT',
        {
          submit_attempt_id: idFactory.submitAttemptId(),
          validation_status: options.validationStatus,
        },
        {
          targetId: options.targetId || 'next_button',
          targetType: 'button',
          metadata: {
            missing_fields: options.missingFields || [],
          },
        }
      );
    },
    taskFinish(metadata = {}) {
      return emit('TASK_FINISH', {}, { targetId: 'task_finish', targetType: 'button', metadata });
    },
  };
}
```

- [ ] **Step 6: Add package exports**

Create `src/shared/services/submission/trace/index.ts`:

```typescript
export * from './types';
export * from './contracts';
export * from './logger';
```

- [ ] **Step 7: Run the logger tests**

Run:

```powershell
npx vitest run src/shared/services/submission/trace/__tests__/logger.test.ts
```

Expected: PASS.

- [ ] **Step 8: Commit**

```powershell
git add src/shared/services/submission/trace
git commit -m "feat: add shared L2 trace logger"
```

Expected: commit contains only shared trace logger files and tests.

---

### Task 3: Trace Collectors And Validator

**Files:**
- Create: `src/shared/services/submission/trace/collectors/text.ts`
- Create: `src/shared/services/submission/trace/collectors/experiment.ts`
- Create: `src/shared/services/submission/trace/collectors/dynamicTable.ts`
- Create: `src/shared/services/submission/trace/validators/validateTraceMark.ts`
- Modify: `src/shared/services/submission/trace/index.ts`
- Create: `src/shared/services/submission/trace/__tests__/collectors.test.ts`
- Create: `src/shared/services/submission/trace/__tests__/validateTraceMark.test.ts`

- [ ] **Step 1: Write failing collector tests**

Create `src/shared/services/submission/trace/__tests__/collectors.test.ts`:

```typescript
import { describe, expect, it, vi } from 'vitest';
import { createTextEventCollector } from '../collectors/text';
import { createExperimentEventCollector } from '../collectors/experiment';
import { createDynamicTableEventCollector } from '../collectors/dynamicTable';

describe('trace collectors', () => {
  it('flushes TEXT_CHANGE and TEXT_BLUR on submit', () => {
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
    collector.onChange('香蕉为什么变黑');
    collector.flush('submit');

    expect(logger.textFocus).toHaveBeenCalledWith('input_question_1', '');
    expect(logger.textChange).toHaveBeenCalledWith('input_question_1', '', '香蕉为什么变黑', {
      flush_reason: 'submit',
    });
    expect(logger.textBlur).toHaveBeenCalledWith('input_question_1', '', '香蕉为什么变黑', {
      flush_reason: 'submit',
    });
  });

  it('suppresses duplicate experiment run inside debounce window', () => {
    let currentTime = 1000;
    const logger = {
      setExpParam: vi.fn(),
      executeExp: vi.fn(),
      resetExp: vi.fn(),
    };
    const collector = createExperimentEventCollector({
      standardPageId: 'page_09_experiment_question_1',
      logger,
      nowMs: () => currentTime,
      expRunDebounceMs: 1500,
      expRunIdFactory: (_pageId, seq) => `run-${seq}`,
    });

    expect(collector.execute({ days: 3 }, { black_ratio: 0.5 })).toBe(true);
    expect(collector.execute({ days: 3 }, { black_ratio: 0.5 })).toBe(false);
    currentTime = 2600;
    expect(collector.execute({ days: 3 }, { black_ratio: 0.5 })).toBe(true);
    expect(logger.executeExp).toHaveBeenCalledTimes(2);
  });

  it('keeps stable row IDs for dynamic table operations', () => {
    const logger = {
      addRow: vi.fn(),
      deleteRow: vi.fn(),
      setPlanParam: vi.fn(),
      selectBest: vi.fn(),
    };
    const collector = createDynamicTableEventCollector({
      standardPageId: 'page_12_solution_selection',
      logger,
      rowIdFactory: (pageId, seq) => `${pageId}_row_${seq}`,
    });

    const rowId = collector.addRow({ variety: '海南香蕉', temperature: '10℃' });
    collector.setPlanParam(rowId, 'plan_param_1', '', '海南香蕉');
    collector.selectBest(rowId, null);

    expect(rowId).toBe('page_12_solution_selection_row_1');
    expect(logger.addRow).toHaveBeenCalledWith(rowId, {
      row_snapshot_after_add: { variety: '海南香蕉', temperature: '10℃' },
    });
    expect(logger.selectBest).toHaveBeenCalledWith(rowId, null);
  });
});
```

- [ ] **Step 2: Write failing validator tests**

Create `src/shared/services/submission/trace/__tests__/validateTraceMark.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { validateTraceMark } from '../validators/validateTraceMark';

const validMark = {
  pageNumber: '1.10',
  pageDesc: '模拟实验 + 问题1',
  beginTime: '2026-06-03T10:10:00.000+08:00',
  endTime: '2026-06-03T10:10:30.000+08:00',
  imgList: [],
  answerList: [{ code: 1, targetElement: 'P1.10_Q5', value: 'B. 6天' }],
  operationList: [
    {
      code: 1,
      targetElement: 'P1.10_page',
      eventType: 'START_PAGE',
      time: '2026-06-03T10:10:00.000+08:00',
      pageId: 'simulation_question_1',
      value: {
        trace_id: 'trace-1',
        page_id: 'page_09_experiment_question_1',
        page_type: 'D2_SIMULATION_QUESTION',
        target_id: 'page',
        target_type: 'page',
        metadata: {
          schema_version: 'science-inquiry-trace-v2.1',
          field_registry_version: 'science-inquiry-field-registry-v2.1',
          content_registry_version: 'science-inquiry-content-registry-banana-v2.1',
        },
      },
    },
    {
      code: 2,
      targetElement: 'P1.10_question_1_option_b',
      eventType: 'SELECT_ANSWER',
      time: '2026-06-03T10:10:20.000+08:00',
      pageId: 'simulation_question_1',
      value: {
        trace_id: 'trace-2',
        page_id: 'page_09_experiment_question_1',
        page_type: 'D2_SIMULATION_QUESTION',
        target_id: 'question_1_option_b',
        target_type: 'radio',
        question_id: 'question_1',
        option_id: 'option_b',
        metadata: {},
      },
    },
    {
      code: 3,
      targetElement: 'P1.10_next_button',
      eventType: 'SUBMIT_ATTEMPT',
      time: '2026-06-03T10:10:30.000+08:00',
      pageId: 'simulation_question_1',
      value: {
        trace_id: 'trace-3',
        page_id: 'page_09_experiment_question_1',
        page_type: 'D2_SIMULATION_QUESTION',
        target_id: 'next_button',
        target_type: 'button',
        submit_attempt_id: 'submit-1',
        validation_status: 'success',
        metadata: { missing_fields: [] },
      },
    },
  ],
};

describe('validateTraceMark', () => {
  it('accepts a valid L2 trace mark', () => {
    expect(() => validateTraceMark(validMark)).not.toThrow();
  });

  it('rejects legacy lifecycle events in L2 mode', () => {
    expect(() =>
      validateTraceMark({
        ...validMark,
        operationList: [
          ...validMark.operationList,
          {
            code: 4,
            targetElement: 'P1.10_page',
            eventType: 'page_enter',
            time: '2026-06-03T10:10:31.000+08:00',
            value: 'legacy',
          },
        ],
      })
    ).toThrow(/L2 trace eventType/);
  });

  it('rejects stringified value objects', () => {
    expect(() =>
      validateTraceMark({
        ...validMark,
        operationList: [
          {
            ...validMark.operationList[0],
            value: JSON.stringify(validMark.operationList[0].value),
          },
        ],
      })
    ).toThrow(/value must be an object/);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run:

```powershell
npx vitest run src/shared/services/submission/trace/__tests__/collectors.test.ts src/shared/services/submission/trace/__tests__/validateTraceMark.test.ts
```

Expected: FAIL because collectors and validator do not exist.

- [ ] **Step 4: Add text collector**

Create `src/shared/services/submission/trace/collectors/text.ts`:

```typescript
interface TextLogger {
  textFocus(fieldId: string, valueBefore: string): unknown;
  textChange(
    fieldId: string,
    valueBefore: string,
    valueAfter: string,
    metadata?: Record<string, unknown>
  ): unknown;
  textBlur(
    fieldId: string,
    valueBefore: string,
    valueAfter: string,
    metadata?: Record<string, unknown>
  ): unknown;
}

export interface TextEventCollectorOptions {
  fieldId: string;
  logger: TextLogger;
  debounceMs: number;
  throttleCharDelta: number;
}

export function createTextEventCollector(options: TextEventCollectorOptions) {
  let focusValue = '';
  let currentValue = '';
  let lastLoggedValue = '';
  let timer: ReturnType<typeof setTimeout> | null = null;
  let focused = false;

  const clearTimer = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const logChange = (flushReason: string) => {
    if (currentValue === lastLoggedValue) {
      return;
    }
    options.logger.textChange(options.fieldId, focusValue, currentValue, {
      flush_reason: flushReason,
    });
    lastLoggedValue = currentValue;
  };

  return {
    onFocus(valueBefore: string) {
      focused = true;
      focusValue = valueBefore || '';
      currentValue = focusValue;
      lastLoggedValue = focusValue;
      options.logger.textFocus(options.fieldId, focusValue);
    },
    onChange(valueAfter: string, eventOptions: { isComposing?: boolean } = {}) {
      if (eventOptions.isComposing) {
        return;
      }
      currentValue = valueAfter || '';
      if (Math.abs(currentValue.length - lastLoggedValue.length) >= options.throttleCharDelta) {
        clearTimer();
        logChange('char_delta');
        return;
      }
      clearTimer();
      timer = setTimeout(() => logChange('debounce'), options.debounceMs);
    },
    onBlur(valueAfter: string) {
      currentValue = valueAfter || '';
      clearTimer();
      logChange('blur');
      if (focused) {
        options.logger.textBlur(options.fieldId, focusValue, currentValue, {
          flush_reason: 'blur',
        });
      }
      focused = false;
    },
    flush(reason: 'submit' | 'dispose') {
      clearTimer();
      logChange(reason);
      if (focused) {
        options.logger.textBlur(options.fieldId, focusValue, currentValue, {
          flush_reason: reason,
        });
      }
      focused = false;
    },
    dispose() {
      clearTimer();
    },
  };
}
```

- [ ] **Step 5: Add experiment collector**

Create `src/shared/services/submission/trace/collectors/experiment.ts`:

```typescript
interface ExperimentLogger {
  setExpParam(
    paramId: string,
    paramName: string,
    valueBefore: unknown,
    valueAfter: unknown,
    metadata?: Record<string, unknown>
  ): unknown;
  executeExp(expRunId: string, metadata?: Record<string, unknown>): unknown;
  resetExp(metadata?: Record<string, unknown>): unknown;
}

export interface ExperimentEventCollectorOptions {
  standardPageId: string;
  logger: ExperimentLogger;
  nowMs: () => number;
  expRunDebounceMs: number;
  expRunIdFactory: (standardPageId: string, runSeq: number) => string;
}

export function createExperimentEventCollector(options: ExperimentEventCollectorOptions) {
  let runSeq = 0;
  let resetCount = 0;
  let lastRunAt = 0;
  let lastParamKey = '';
  let paramSnapshot: Record<string, unknown> = {};

  const snapshotKey = (snapshot: Record<string, unknown>) => JSON.stringify(snapshot);

  return {
    setParam(paramId: string, paramName: string, valueAfter: unknown) {
      const valueBefore = paramSnapshot[paramName] ?? null;
      paramSnapshot = { ...paramSnapshot, [paramName]: valueAfter };
      options.logger.setExpParam(paramId, paramName, valueBefore, valueAfter, {
        param_snapshot: paramSnapshot,
      });
    },
    execute(params: Record<string, unknown>, resultSnapshot: Record<string, unknown>) {
      const now = options.nowMs();
      const key = snapshotKey(params);
      if (key === lastParamKey && now - lastRunAt < options.expRunDebounceMs) {
        return false;
      }
      runSeq += 1;
      lastRunAt = now;
      lastParamKey = key;
      paramSnapshot = { ...params };
      const expRunId = options.expRunIdFactory(options.standardPageId, runSeq);
      options.logger.executeExp(expRunId, {
        param_snapshot: params,
        result_snapshot: resultSnapshot,
        click_debounce_applied: false,
        run_seq: runSeq,
      });
      return true;
    },
    reset() {
      resetCount += 1;
      const beforeReset = { ...paramSnapshot };
      paramSnapshot = {};
      options.logger.resetExp({
        param_snapshot_before_reset: beforeReset,
        reset_count: resetCount,
      });
    },
  };
}
```

- [ ] **Step 6: Add dynamic table collector**

Create `src/shared/services/submission/trace/collectors/dynamicTable.ts`:

```typescript
interface DynamicTableLogger {
  addRow(rowId: string, metadata?: Record<string, unknown>): unknown;
  deleteRow(rowId: string, metadata?: Record<string, unknown>): unknown;
  setPlanParam(
    rowId: string,
    paramId: string,
    valueBefore: unknown,
    valueAfter: unknown,
    metadata?: Record<string, unknown>
  ): unknown;
  selectBest(rowId: string, previousBestRowId: string | null): unknown;
}

export interface DynamicTableCollectorOptions {
  standardPageId: string;
  logger: DynamicTableLogger;
  rowIdFactory: (standardPageId: string, rowSeq: number) => string;
}

export function createDynamicTableEventCollector(options: DynamicTableCollectorOptions) {
  let rowSeq = 0;
  const rows = new Map<string, Record<string, unknown>>();

  return {
    addRow(initialSnapshot: Record<string, unknown>) {
      rowSeq += 1;
      const rowId = options.rowIdFactory(options.standardPageId, rowSeq);
      rows.set(rowId, { ...initialSnapshot });
      options.logger.addRow(rowId, {
        row_snapshot_after_add: initialSnapshot,
      });
      return rowId;
    },
    deleteRow(rowId: string, wasBestPlan: boolean) {
      const beforeDelete = rows.get(rowId) || {};
      rows.delete(rowId);
      options.logger.deleteRow(rowId, {
        row_snapshot_before_delete: beforeDelete,
        was_best_plan: wasBestPlan,
      });
    },
    setPlanParam(rowId: string, paramId: 'plan_param_1' | 'plan_param_2', valueBefore: unknown, valueAfter: unknown) {
      const current = rows.get(rowId) || {};
      rows.set(rowId, { ...current, [paramId]: valueAfter });
      options.logger.setPlanParam(rowId, paramId, valueBefore, valueAfter, {
        row_snapshot_after_change: rows.get(rowId),
      });
    },
    selectBest(rowId: string, previousBestRowId: string | null) {
      options.logger.selectBest(rowId, previousBestRowId);
    },
  };
}
```

- [ ] **Step 7: Add trace validator**

Create `src/shared/services/submission/trace/validators/validateTraceMark.ts`:

```typescript
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
      assertCondition(hasQuestionId(value.page_id, value.question_id), `operationList[${index}].value.question_id is not in Field Registry`);
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
```

- [ ] **Step 8: Export collectors and validator**

Modify `src/shared/services/submission/trace/index.ts`:

```typescript
export * from './types';
export * from './contracts';
export * from './logger';
export * from './collectors/text';
export * from './collectors/experiment';
export * from './collectors/dynamicTable';
export * from './validators/validateTraceMark';
```

- [ ] **Step 9: Run collector and validator tests**

Run:

```powershell
npx vitest run src/shared/services/submission/trace/__tests__/collectors.test.ts src/shared/services/submission/trace/__tests__/validateTraceMark.test.ts
```

Expected: PASS.

- [ ] **Step 10: Commit**

```powershell
git add src/shared/services/submission/trace
git commit -m "feat: add L2 trace collectors and validation"
```

Expected: commit contains only shared trace collector/validator files and tests.

---

### Task 4: Submission Lifecycle Mode

**Files:**
- Modify: `src/shared/services/submission/usePageSubmission.js`
- Modify: `src/shared/ui/PageFrame/AssessmentPageFrame.jsx`
- Create: `src/shared/services/submission/trace/__tests__/lifecycle-mode.test.jsx`

- [ ] **Step 1: Write failing lifecycle-mode test**

Create `src/shared/services/submission/trace/__tests__/lifecycle-mode.test.jsx`:

```jsx
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { usePageSubmission } from '../../usePageSubmission.js';

describe('usePageSubmission l2-trace lifecycle mode', () => {
  it('does not inject legacy lifecycle or flow_context operations', async () => {
    const submitImpl = vi.fn().mockResolvedValue({ success: true, code: 200 });
    const traceValidator = vi.fn();
    const operationValue = {
      trace_id: 'trace-1',
      page_id: 'page_09_experiment_question_1',
      page_type: 'D2_SIMULATION_QUESTION',
      target_id: 'page',
      target_type: 'page',
      metadata: {},
    };

    const { result } = renderHook(() =>
      usePageSubmission({
        lifecycleMode: 'l2-trace',
        traceValidator,
        submitImpl,
        getUserContext: () => ({ batchCode: 'B001', examNo: 'E001' }),
        getFlowContext: () => ({
          flowId: 'flow-g8',
          submoduleId: 'g8-banana-browning-experiment',
          stepIndex: 0,
          pageId: 'simulation_question_1',
        }),
        buildMark: () => ({
          pageNumber: '1.10',
          pageDesc: '模拟实验 + 问题1',
          operationList: [
            {
              targetElement: 'P1.10_page',
              eventType: 'START_PAGE',
              value: operationValue,
              time: '2026-06-03T10:10:00.000+08:00',
              pageId: 'simulation_question_1',
            },
          ],
          answerList: [],
          beginTime: '2026-06-03T10:10:00.000+08:00',
          endTime: '2026-06-03T10:10:30.000+08:00',
          imgList: [],
        }),
      })
    );

    await act(async () => {
      await result.current.submit();
    });

    const submittedMark = submitImpl.mock.calls[0][0].mark;
    expect(submittedMark.operationList.map(operation => operation.eventType)).toEqual([
      'START_PAGE',
    ]);
    expect(submittedMark.operationList[0].value).toEqual(operationValue);
    expect(traceValidator).toHaveBeenCalledWith(submittedMark);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```powershell
npx vitest run src/shared/services/submission/trace/__tests__/lifecycle-mode.test.jsx
```

Expected: FAIL because `lifecycleMode` and `traceValidator` are not supported.

- [ ] **Step 3: Update `usePageSubmission` options**

In `src/shared/services/submission/usePageSubmission.js`, add this constant near existing constants:

```javascript
const DEFAULT_LIFECYCLE_MODE = 'legacy';
const L2_TRACE_LIFECYCLE_MODE = 'l2-trace';
```

In the options destructuring inside `usePageSubmission(options = {})`, add:

```javascript
    lifecycleMode = DEFAULT_LIFECYCLE_MODE,
    traceValidator,
```

In the `submitInternal` callback, before `const baseOperations = ensureArray(markCandidate.operationList);`, add:

```javascript
      const isL2TraceMode = lifecycleMode === L2_TRACE_LIFECYCLE_MODE;
```

Replace the existing flow-context/lifecycle block from `const resolvedFlowContext = injectFlowContextOperation(markCandidate);` through `markCandidate.pageDesc = pageDescAfter;` and `ensureLifecycleOperations(...)` with:

```javascript
      const resolvedFlowContext = isL2TraceMode ? null : injectFlowContextOperation(markCandidate);

      debugLog('[usePageSubmission] resolvedFlowContext:', resolvedFlowContext);
      const pageDescBefore = derivePageDesc(markCandidate, resolvedPageMeta);
      debugLog('[usePageSubmission] pageDesc before enhancement:', pageDescBefore);

      const pageDescAfter = isL2TraceMode
        ? pageDescBefore
        : applyPageDescPrefixWithFlow(pageDescBefore, resolvedFlowContext, resolvedPageMeta);
      debugLog('[usePageSubmission] pageDesc after enhancement:', pageDescAfter);
      markCandidate.pageDesc = pageDescAfter;

      if (!isL2TraceMode) {
        markCandidate.operationList = ensureLifecycleOperations(markCandidate.operationList, {
          pageDesc: pageDescAfter,
          pageId: resolvedPageMeta.pageId,
          mode,
          beginTime: markCandidate.beginTime,
        });
      }
```

Replace the validation block:

```javascript
        validateMarkObject(markCandidate);
```

with:

```javascript
        if (isL2TraceMode) {
          if (typeof traceValidator !== 'function') {
            throw new Error('lifecycleMode=\"l2-trace\" requires traceValidator');
          }
          traceValidator(markCandidate);
        } else {
          validateMarkObject(markCandidate);
        }
```

Add `lifecycleMode` and `traceValidator` to the `submitInternal` dependency array.

- [ ] **Step 4: Pass through `AssessmentPageFrame` submission options**

In `src/shared/ui/PageFrame/AssessmentPageFrame.jsx`, add destructured fields:

```javascript
    lifecycleMode: submissionLifecycleMode,
    traceValidator: submissionTraceValidator,
```

Pass them into `usePageSubmission({ ... })`:

```javascript
    lifecycleMode: submissionLifecycleMode,
    traceValidator: submissionTraceValidator,
```

Add PropTypes:

```javascript
    lifecycleMode: PropTypes.oneOf(['legacy', 'l2-trace']),
    traceValidator: PropTypes.func,
```

- [ ] **Step 5: Run lifecycle mode test**

Run:

```powershell
npx vitest run src/shared/services/submission/trace/__tests__/lifecycle-mode.test.jsx
```

Expected: PASS.

- [ ] **Step 6: Run existing shared submission snapshots**

Run:

```powershell
npx vitest run src/shared/services/submission/__tests__/submission-format.snapshot.test.js
```

Expected: PASS, proving legacy default behavior still injects `page_enter`, `next_click` or `auto_submit`, `page_exit`, and one `flow_context`.

- [ ] **Step 7: Commit**

```powershell
git add src/shared/services/submission/usePageSubmission.js src/shared/ui/PageFrame/AssessmentPageFrame.jsx src/shared/services/submission/trace/__tests__/lifecycle-mode.test.jsx
git commit -m "feat: add opt-in L2 trace submission mode"
```

Expected: commit contains only submission mode changes and tests.

---

### Task 5: Banana Trace Hook And Context Compatibility

**Files:**
- Modify: `src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx`
- Create: `src/submodules/g8-banana-browning-experiment/trace/useBananaTraceLogger.ts`
- Create: `src/submodules/g8-banana-browning-experiment/trace/useTracePageStart.ts`
- Create: `src/submodules/g8-banana-browning-experiment/trace/fieldBindings.ts`

- [ ] **Step 1: Create banana field binding constants**

Create `src/submodules/g8-banana-browning-experiment/trace/fieldBindings.ts`:

```typescript
export const BANANA_TEXT_FIELD_BY_ANSWER_KEY: Record<string, string> = {
  Q1_科学问题: 'input_question_1',
  Q3a_想法1: 'input_idea_1',
  Q3b_想法2: 'input_idea_2',
  Q3c_想法3: 'input_idea_3',
  Q4a_图像法优点: 'method_1_advantage',
  Q4b_图像法缺点: 'method_1_disadvantage',
  Q4c_网格法优点: 'method_2_advantage',
  Q4d_网格法缺点: 'method_2_disadvantage',
  Q4e_称重法优点: 'method_3_advantage',
  Q4f_称重法缺点: 'method_3_disadvantage',
  Q8_理由: 'reason_text',
};

export const BANANA_QUESTION_BY_ANSWER_KEY = {
  Q5_海南香蕉变黑时间: {
    questionCode: 'Q5',
    questionId: 'question_1',
    fieldId: 'question_1_answer',
    questionIndex: 1,
    totalQuestionCount: 3,
  },
  Q6_常温储存品种: {
    questionCode: 'Q6',
    questionId: 'question_2',
    fieldId: 'question_2_answer',
    questionIndex: 2,
    totalQuestionCount: 3,
  },
  Q7_平缓温度: {
    questionCode: 'Q7',
    questionId: 'question_3',
    fieldId: 'question_3_answer',
    questionIndex: 3,
    totalQuestionCount: 3,
  },
} as const;

export const optionIdFromOptionLabel = (label: string): string => {
  const normalized = String(label || '').trim();
  if (normalized.startsWith('A')) return 'option_a';
  if (normalized.startsWith('B')) return 'option_b';
  if (normalized.startsWith('C')) return 'option_c';
  if (normalized.startsWith('D')) return 'option_d';
  return normalized;
};
```

- [ ] **Step 2: Add banana trace logger hook**

Create `src/submodules/g8-banana-browning-experiment/trace/useBananaTraceLogger.ts`:

```typescript
import { useMemo } from 'react';
import { createPageTraceLogger, validateTraceMark } from '@shared/services/submission/trace';
import type { TraceFlowContext } from '@shared/services/submission/trace';
import { getTracePageConfigByLegacyPageId, type PageId } from '../mapping';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';

interface UseBananaTraceLoggerOptions {
  pageId: PageId;
  pageNumber: string;
  flowContext?: TraceFlowContext | null;
}

export function useBananaTraceLogger({
  pageId,
  pageNumber,
  flowContext,
}: UseBananaTraceLoggerOptions) {
  const { logOperation } = useG8BananaBrowningContext();
  const page = getTracePageConfigByLegacyPageId(pageId);

  return useMemo(() => {
    if (!page) {
      return null;
    }
    return createPageTraceLogger({
      page,
      pageNumber,
      flowContext,
      logOperation,
    });
  }, [flowContext, logOperation, page, pageNumber]);
}

export { validateTraceMark };
```

- [ ] **Step 3: Add page-start hook**

Create `src/submodules/g8-banana-browning-experiment/trace/useTracePageStart.ts`:

```typescript
import { useEffect } from 'react';
import type { PageId } from '../mapping';
import { useG8BananaBrowningContext } from '../context/G8BananaBrowningContext';
import { useBananaTraceLogger } from './useBananaTraceLogger';
import type { TraceFlowContext } from '@shared/services/submission/trace';

interface UseTracePageStartOptions {
  pageId: PageId;
  pageNumber: string;
  flowContext?: TraceFlowContext | null;
  metadata?: Record<string, unknown>;
}

export function useTracePageStart({
  pageId,
  pageNumber,
  flowContext,
  metadata = {},
}: UseTracePageStartOptions) {
  const { setPageStartTime } = useG8BananaBrowningContext();
  const traceLogger = useBananaTraceLogger({ pageId, pageNumber, flowContext });

  useEffect(() => {
    setPageStartTime(new Date());
    traceLogger?.startPage(metadata);
  }, [metadata, setPageStartTime, traceLogger]);

  return traceLogger;
}
```

- [ ] **Step 4: Make context adapter preserve objects when no legacy adapter is needed**

In `src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx`, replace `normalizeOperationValueForAdapter` with:

```typescript
function normalizeOperationValueForAdapter(value: OperationLog['value']): string {
  if (typeof value === 'string') {
    return value;
  }

  return JSON.stringify(value);
}
```

Keep this function as-is for the legacy adapter path, and do not call it from L2 page logging. Confirm the only caller remains `normalizeOperationsForAdapter()` inside the `PAGE_ENTER` flow-context injection branch. L2 pages emit `START_PAGE`, so that branch is not entered.

- [ ] **Step 5: Commit**

```powershell
git add src/submodules/g8-banana-browning-experiment/trace src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx
git commit -m "feat: add banana trace logger hook"
```

Expected: commit contains only banana trace hook/context compatibility changes.

---

### Task 6: Wire L2 Submission In Banana Frame

**Files:**
- Modify: `src/submodules/g8-banana-browning-experiment/Component.tsx`

- [ ] **Step 1: Import trace helpers**

In `src/submodules/g8-banana-browning-experiment/Component.tsx`, add:

```typescript
import { validateTraceMark } from './trace/useBananaTraceLogger';
import { useBananaTraceLogger } from './trace/useBananaTraceLogger';
import { getTracePageConfigByLegacyPageId } from './mapping';
```

- [ ] **Step 2: Add current trace config and lifecycle mode**

After `const pageConfig = getPageConfig(currentPageId as PageId);`, add:

```typescript
  const tracePageConfig = getTracePageConfigByLegacyPageId(currentPageId);
  const isL2TracePage = Boolean(tracePageConfig);
```

- [ ] **Step 3: Create a frame-level trace logger**

After `const isL2TracePage = Boolean(tracePageConfig);`, add:

```typescript
  const frameTraceLogger = useBananaTraceLogger({
    pageId: currentPageId as PageId,
    pageNumber,
    flowContext: flowContext
      ? {
          flowId: flowContext.flowId,
          submoduleId: flowContext.submoduleId,
          stepIndex: flowContext.stepIndex,
          moduleName: '8年级香蕉变黑科学探究',
          pageId: currentPageId,
        }
      : null,
  });
```

- [ ] **Step 4: Add L2 submission options**

Inside the `submissionConfig` return object, add:

```typescript
      lifecycleMode: isL2TracePage ? 'l2-trace' : 'legacy',
      traceValidator: isL2TracePage ? validateTraceMark : undefined,
```

Add `isL2TracePage` to the `useMemo` dependency array.

- [ ] **Step 5: Emit L2 `SUBMIT_ATTEMPT` before default submit**

In `handleFrameNext`, replace the validation failure logging block with:

```typescript
      if (isL2TracePage) {
        frameTraceLogger?.submitAttempt({
          validationStatus: 'blocked',
          missingFields: validation.missing || [],
          targetId: 'next_button',
        });
      } else {
        logOperation({
          targetElement: `P${pageNumber}_下一页按钮`,
          eventType: EventTypes.CLICK_BLOCKED,
          value: {
            reason: validation.reason,
            missing: validation.missing,
            timestamp,
            message,
          },
          time: timestamp,
          pageId: currentPageId,
        });
      }
```

Before `if (typeof defaultSubmit === 'function')`, add:

```typescript
      if (isL2TracePage) {
        frameTraceLogger?.submitAttempt({
          validationStatus: 'success',
          missingFields: [],
          targetId: 'next_button',
        });
      }
```

- [ ] **Step 6: Run banana submission format test**

Run:

```powershell
npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts
```

Expected: tests may fail on legacy snapshot expectations for standard pages. Keep `intro_notice` expectations passing and proceed to Task 10 for snapshot updates.

- [ ] **Step 7: Commit**

```powershell
git add src/submodules/g8-banana-browning-experiment/Component.tsx
git commit -m "feat: enable L2 trace submission mode for banana pages"
```

Expected: commit contains only `Component.tsx`.

---

### Task 7: Migrate Flow/Text/Content Pages

**Files:**
- Modify: `src/submodules/g8-banana-browning-experiment/pages/Page02BananaBrowning.tsx`
- Modify: `src/submodules/g8-banana-browning-experiment/pages/Page03BananaMystery.tsx`
- Modify: `src/submodules/g8-banana-browning-experiment/pages/Page04BananaBrowningReading.tsx`
- Modify: `src/submodules/g8-banana-browning-experiment/pages/Page05BananaBrowning.tsx`
- Modify: `src/submodules/g8-banana-browning-experiment/pages/Page06BananaBrowningDesign.tsx`
- Modify: `src/submodules/g8-banana-browning-experiment/pages/Page07BananaBrowningEvaluation.tsx`
- Modify: `src/submodules/g8-banana-browning-experiment/pages/Page08BananaBrowning.tsx`

- [ ] **Step 1: Replace standard page enter effects**

For each page in this task, replace legacy `EventTypes.PAGE_ENTER` effects with:

```typescript
const traceLogger = useTracePageStart({
  pageId: '<legacy_page_id>' as PageId,
  pageNumber: getPagePrefix().replace(/^P/, '').replace(/_$/, ''),
  flowContext: undefined,
  metadata: {
    initial_state: {},
  },
});
```

Use the exact `legacy_page_id` for each file:

```text
Page02BananaBrowning.tsx -> page_02_banana_browning
Page03BananaMystery.tsx -> banana_mystery
Page04BananaBrowningReading.tsx -> banana_browning_reading
Page05BananaBrowning.tsx -> page_05_banana_browning
Page06BananaBrowningDesign.tsx -> banana_browning_design
Page07BananaBrowningEvaluation.tsx -> banana_browning_evaluation
Page08BananaBrowning.tsx -> page_08_banana_browning
```

Add imports:

```typescript
import type { PageId } from '../mapping';
import { useTracePageStart } from '../trace/useTracePageStart';
```

Remove `EventTypes` import from files that no longer use legacy events.

- [ ] **Step 2: Replace Page03 text logging**

In `Page03BananaMystery.tsx`, keep `collectAnswer({ targetElement: 'Q1_科学问题', value: nextValue })`. Replace `INPUT_FOCUS`, `INPUT_CHANGE`, `INPUT_BLUR`, and `INPUT_DELETE` operations for the main answer with:

```typescript
traceLogger?.textFocus('input_question_1', inputValue);
traceLogger?.textChange('input_question_1', inputValue, nextValue, {
  source_answer_key: 'Q1_科学问题',
});
traceLogger?.textBlur('input_question_1', inputValue, inputValue, {
  source_answer_key: 'Q1_科学问题',
});
```

Replace chat bubble click/replay logs with:

```typescript
traceLogger?.contentActivate(contentId, 'content', {
  source: 'chat_bubble',
  sequence_index: index + 1,
  speaker_name: speakerName,
});
```

Use content IDs `chat_bubble_02_01` through `chat_bubble_02_05` by `index + 1`.

- [ ] **Step 3: Replace Page04 content and checkbox logging**

In `Page04BananaBrowningReading.tsx`, replace modal open/close logs with:

```typescript
traceLogger?.openModal(item.id, {
  source: 'material_card',
  title: item.title,
});
traceLogger?.closeModal(openOverlayId, Date.now() - modalOpenedAtRef.current, {
  source: 'material_card',
});
```

Replace checkbox logs with:

```typescript
traceLogger?.emit(
  'CHECKBOX_TOGGLE',
  {
    field_id: 'factor_options',
    question_id: 'factor_options',
    option_id: factor.key,
    value_before: selectedFactors,
    value_after: nextSelectedFactors,
  },
  {
    targetId: `factor_options_${factor.key}`,
    targetType: 'checkbox',
    metadata: {
      selected_count: nextSelectedFactors.length,
    },
  }
);
```

- [ ] **Step 4: Replace Page06 and Page07 text logging**

In `Page06BananaBrowningDesign.tsx`, map idea keys to fields:

```typescript
const fieldIdByIdeaKey: Record<string, string> = {
  Q3a_想法1: 'input_idea_1',
  Q3b_想法2: 'input_idea_2',
  Q3c_想法3: 'input_idea_3',
};
```

Replace `EventTypes.INPUT_CHANGE` with:

```typescript
traceLogger?.textChange(fieldIdByIdeaKey[ideaKey], String(answers[ideaKey] || ''), value, {
  source_answer_key: ideaKey,
  field_label: ideaLabel,
});
```

In `Page07BananaBrowningEvaluation.tsx`, map method fields:

```typescript
const fieldIdByAnswerKey: Record<string, string> = {
  Q4a_图像法优点: 'method_1_advantage',
  Q4b_图像法缺点: 'method_1_disadvantage',
  Q4c_网格法优点: 'method_2_advantage',
  Q4d_网格法缺点: 'method_2_disadvantage',
  Q4e_称重法优点: 'method_3_advantage',
  Q4f_称重法缺点: 'method_3_disadvantage',
};
```

Replace `EventTypes.INPUT_CHANGE` with:

```typescript
traceLogger?.textChange(fieldIdByAnswerKey[answerKey], String(answers[answerKey] || ''), value, {
  source_answer_key: answerKey,
  field_label: logLabel,
});
```

- [ ] **Step 5: Keep transition/intro pages minimal**

For `Page02BananaBrowning.tsx`, `Page05BananaBrowning.tsx`, and `Page08BananaBrowning.tsx`, emit only `START_PAGE` unless the page has a real user interaction. Do not add fake content exposure events for auto animations.

- [ ] **Step 6: Run focused tests**

Run:

```powershell
npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts
```

Expected: standard pages no longer contain `page_enter`, `input_change`, `checkbox_check`, `modal_open`, or `modal_close` in L2 mode. `intro_notice` still contains legacy events.

- [ ] **Step 7: Commit**

```powershell
git add src/submodules/g8-banana-browning-experiment/pages/Page02BananaBrowning.tsx src/submodules/g8-banana-browning-experiment/pages/Page03BananaMystery.tsx src/submodules/g8-banana-browning-experiment/pages/Page04BananaBrowningReading.tsx src/submodules/g8-banana-browning-experiment/pages/Page05BananaBrowning.tsx src/submodules/g8-banana-browning-experiment/pages/Page06BananaBrowningDesign.tsx src/submodules/g8-banana-browning-experiment/pages/Page07BananaBrowningEvaluation.tsx src/submodules/g8-banana-browning-experiment/pages/Page08BananaBrowning.tsx
git commit -m "feat: migrate banana text and content pages to L2 trace"
```

Expected: commit contains only the seven page files.

---

### Task 8: Migrate Simulation And Question Pages

**Files:**
- Modify: `src/submodules/g8-banana-browning-experiment/components/SimulationPanel.tsx`
- Modify: `src/submodules/g8-banana-browning-experiment/pages/Page09BananaBrowningSimulationMain.tsx`
- Modify: `src/submodules/g8-banana-browning-experiment/pages/Page10SimulationQuestion1.tsx`
- Modify: `src/submodules/g8-banana-browning-experiment/pages/Page11SimulationQuestion2.tsx`
- Modify: `src/submodules/g8-banana-browning-experiment/pages/Page12SimulationQuestion3.tsx`

- [ ] **Step 1: Change `SimulationPanel` props**

In `SimulationPanel.tsx`, replace the current prop type with:

```typescript
interface SimulationPanelProps {
  traceLogger: {
    setExpParam(paramId: string, paramName: string, valueBefore: unknown, valueAfter: unknown, metadata?: Record<string, unknown>): unknown;
    executeExp(expRunId: string, metadata?: Record<string, unknown>): unknown;
    resetExp(metadata?: Record<string, unknown>): unknown;
  } | null;
}
```

- [ ] **Step 2: Replace simulation events**

In `SimulationPanel.tsx`, replace day increment/decrement legacy `SIMULATION_OPERATION` logs with:

```typescript
traceLogger?.setExpParam('exp_param_days', 'days', selectedDay, nextDay, {
  param_snapshot: { days: nextDay },
});
```

Replace run result logging with:

```typescript
traceLogger?.executeExp(`banana_days_${day}`, {
  param_snapshot: { days: day },
  result_snapshot: {
    day,
    results: buildSimulationResults(day),
  },
  click_debounce_applied: false,
});
```

Replace reset logging with:

```typescript
traceLogger?.resetExp({
  param_snapshot_before_reset: { days: fromDay },
  reset_count: 1,
});
```

- [ ] **Step 3: Pass trace logger into simulation pages**

In `Page09BananaBrowningSimulationMain.tsx`, `Page10SimulationQuestion1.tsx`, `Page11SimulationQuestion2.tsx`, and `Page12SimulationQuestion3.tsx`, replace:

```tsx
<SimulationPanel logOperation={logOperation} targetPrefix={targetPrefix} />
```

with:

```tsx
<SimulationPanel traceLogger={traceLogger} />
```

- [ ] **Step 4: Replace radio select events**

In the three simulation question pages, replace `EventTypes.RADIO_SELECT` logs with:

```typescript
const previousOptionId = selectedOption ? optionIdFromOptionLabel(selectedOption) : null;
const nextOptionId = optionIdFromOptionLabel(text);
traceLogger?.selectAnswer({
  questionId: '<question_id>',
  optionId: nextOptionId,
  optionText: text,
  valueBefore: previousOptionId,
  targetId: `<question_id>_${nextOptionId}`,
  questionIndex: <question_index>,
  totalQuestionCount: 3,
});
```

Use these exact replacements:

```text
Page10SimulationQuestion1.tsx: question_id=question_1, question_index=1
Page11SimulationQuestion2.tsx: question_id=question_2, question_index=2
Page12SimulationQuestion3.tsx: question_id=question_3, question_index=3
```

Import:

```typescript
import { optionIdFromOptionLabel } from '../trace/fieldBindings';
```

- [ ] **Step 5: Run focused tests**

Run:

```powershell
npx vitest run src/submodules/g8-banana-browning-experiment/components/__tests__/SimulationPanel.test.tsx src/submodules/g8-banana-browning-experiment/pages/__tests__/SimulationQuestionPages.test.tsx
```

Expected: update assertions so simulation operations use `SET_EXP_PARAM`, `EXECUTE_EXP`, `RESET_EXP`, and `SELECT_ANSWER`. No `SIMULATION_OPERATION`, `SIMULATION_RUN_RESULT`, or `RADIO_SELECT` remains for L2 pages.

- [ ] **Step 6: Commit**

```powershell
git add src/submodules/g8-banana-browning-experiment/components/SimulationPanel.tsx src/submodules/g8-banana-browning-experiment/pages/Page09BananaBrowningSimulationMain.tsx src/submodules/g8-banana-browning-experiment/pages/Page10SimulationQuestion1.tsx src/submodules/g8-banana-browning-experiment/pages/Page11SimulationQuestion2.tsx src/submodules/g8-banana-browning-experiment/pages/Page12SimulationQuestion3.tsx src/submodules/g8-banana-browning-experiment/components/__tests__/SimulationPanel.test.tsx src/submodules/g8-banana-browning-experiment/pages/__tests__/SimulationQuestionPages.test.tsx
git commit -m "feat: migrate banana simulation pages to L2 trace"
```

Expected: commit contains simulation component, simulation pages, and their focused tests.

---

### Task 9: Migrate Solution Selection And Finish

**Files:**
- Modify: `src/submodules/g8-banana-browning-experiment/pages/Page13SolutionSelection.tsx`
- Modify: `src/submodules/g8-banana-browning-experiment/pages/Page14TaskCompletion.tsx`

- [ ] **Step 1: Add stable row IDs to Page13 state**

In `Page13SolutionSelection.tsx`, ensure each row object has an `id` that is not derived from the array index. Use this row factory:

```typescript
const createSolutionRow = (id: string): SolutionRow => ({
  id,
  variety: '',
  temperature: '',
});
```

Initialize rows with:

```typescript
const [rows, setRows] = useState<SolutionRow[]>(() => [
  createSolutionRow('page_12_solution_selection_row_1'),
]);
```

- [ ] **Step 2: Replace row operation logs**

Replace add/delete/change/star logs with:

```typescript
traceLogger?.addRow(newRow.id, {
  row_snapshot_after_add: newRow,
});

traceLogger?.deleteRow(rowId, {
  row_snapshot_before_delete: rowToDelete,
  was_best_plan: bestId === rowId,
});

traceLogger?.setPlanParam(rowId, 'plan_param_1', previousValue, value, {
  row_snapshot_after_change: nextRow,
});

traceLogger?.setPlanParam(rowId, 'plan_param_2', previousValue, value, {
  row_snapshot_after_change: nextRow,
});

traceLogger?.selectBest(rowId, bestId);
```

- [ ] **Step 3: Replace reason text logging**

For the reason input, keep `collectAnswer({ targetElement: 'Q8_理由', value })` and replace legacy `INPUT_CHANGE` with:

```typescript
traceLogger?.textChange('reason_text', String(answers.Q8_理由 || ''), value, {
  source_answer_key: 'Q8_理由',
});
```

- [ ] **Step 4: Emit task finish on completion page**

In `Page14TaskCompletion.tsx`, replace `PAGE_ENTER` with `START_PAGE` via `useTracePageStart`, then add:

```typescript
useEffect(() => {
  traceLogger?.taskFinish({
    completion_source: 'task_completion_page',
  });
}, [traceLogger]);
```

- [ ] **Step 5: Run solution and completion tests**

Run:

```powershell
npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts -t "solution_selection|task_completion"
```

Expected: `solution_selection` operation events include `ADD_ROW`, `DELETE_ROW`, `SET_PLAN_PARAM`, `SELECT_BEST`, `TEXT_CHANGE`/`TEXT_BLUR`, and `SUBMIT_ATTEMPT`; `task_completion` includes `START_PAGE` and `TASK_FINISH`.

- [ ] **Step 6: Commit**

```powershell
git add src/submodules/g8-banana-browning-experiment/pages/Page13SolutionSelection.tsx src/submodules/g8-banana-browning-experiment/pages/Page14TaskCompletion.tsx
git commit -m "feat: migrate banana solution and finish pages to L2 trace"
```

Expected: commit contains only Page13 and Page14.

---

### Task 10: Acceptance Snapshots And Contract Tests

**Files:**
- Modify: `src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts`
- Modify: `src/submodules/g8-banana-browning-experiment/__tests__/submission.snapshot.test.ts`
- Create: `src/submodules/g8-banana-browning-experiment/__tests__/trace-acceptance.test.ts`

- [ ] **Step 1: Add acceptance case test**

Create `src/submodules/g8-banana-browning-experiment/__tests__/trace-acceptance.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import page02Case from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page02_question_generation.json';
import page05Case from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page05_multi_idea_generation.json';
import page08Case from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page08_direct_skip.json';
import page09Case from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page09_experiment_question.json';
import page12Case from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page12_solution_selection.json';
import page13Case from '../../../../docs/子模块数据上报规范/engineering_contracts/acceptance_cases/page13_task_finish.json';
import { validateTraceMark } from '@shared/services/submission/trace';

const cases = [page02Case, page05Case, page08Case, page09Case, page12Case, page13Case];

describe('banana L2 acceptance contracts', () => {
  it.each(cases)('validates %s', acceptanceCase => {
    const mark = {
      pageNumber: acceptanceCase.input.pageNumber,
      pageDesc: acceptanceCase.input.pageDesc,
      beginTime: acceptanceCase.input.beginTime,
      endTime: acceptanceCase.input.endTime,
      answerList: [],
      imgList: acceptanceCase.input.imgList || [],
      operationList: acceptanceCase.input.operationList,
    };
    expect(() => validateTraceMark(mark)).not.toThrow();
  });
});
```

- [ ] **Step 2: Update banana submission assertions**

In `src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts`, update standard page expectations:

```typescript
const L2_ALLOWED_EVENT_TYPES = new Set([
  'START_PAGE',
  'PAGE_HIDDEN',
  'PAGE_VISIBLE',
  'SUBMIT_ATTEMPT',
  'TASK_FINISH',
  'CONTENT_EXPOSE',
  'CONTENT_ACTIVATE',
  'CONTENT_VIEW',
  'CHAT_SCROLL',
  'CHAT_VIEWPORT_ENTER',
  'CHAT_VIEWPORT_LEAVE',
  'OPEN_MODAL',
  'CLOSE_MODAL',
  'CHART_HOVER',
  'TEXT_FOCUS',
  'TEXT_CHANGE',
  'TEXT_BLUR',
  'CHECKBOX_TOGGLE',
  'SELECT_ANSWER',
  'SET_EXP_PARAM',
  'EXECUTE_EXP',
  'RESET_EXP',
  'ADD_ROW',
  'DELETE_ROW',
  'SET_PLAN_PARAM',
  'SELECT_BEST',
  'TIMER_COMPLETE',
]);

const LEGACY_EVENTS_FORBIDDEN_IN_L2 = new Set([
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

const expectL2TraceOperations = (mark: any) => {
  expect(mark.operationList.some((operation: any) => operation.eventType === 'START_PAGE')).toBe(true);
  mark.operationList.forEach((operation: any) => {
    expect(L2_ALLOWED_EVENT_TYPES.has(operation.eventType)).toBe(true);
    expect(LEGACY_EVENTS_FORBIDDEN_IN_L2.has(operation.eventType)).toBe(false);
    expect(typeof operation.value).toBe('object');
    expect(operation.value).not.toBeNull();
  });
};
```

Keep existing legacy assertions for `intro_notice`.

- [ ] **Step 3: Update inline snapshots**

Run:

```powershell
npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/submission.snapshot.test.ts -u
```

Expected: snapshots update to L2 event names and object values for standard pages. Inspect diff and ensure `intro_notice` still has legacy lifecycle.

- [ ] **Step 4: Run acceptance and banana submission tests**

Run:

```powershell
npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/trace-acceptance.test.ts src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts src/submodules/g8-banana-browning-experiment/__tests__/submission.snapshot.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/submodules/g8-banana-browning-experiment/__tests__/trace-acceptance.test.ts src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts src/submodules/g8-banana-browning-experiment/__tests__/submission.snapshot.test.ts
git commit -m "test: lock banana L2 trace submission contracts"
```

Expected: commit contains only banana trace contract tests and snapshots.

---

### Task 11: Full Verification And Memory Update

**Files:**
- Modify: `docs/project_notes/issues.md`

- [ ] **Step 1: Run required submission checks**

Run:

```powershell
npm run lint:submission
npm run test:submission-format
npm run test:submission
```

Expected: all PASS. If one fails, fix the failing task before continuing.

- [ ] **Step 2: Run broader banana and build checks**

Run:

```powershell
npx vitest run src/submodules/g8-banana-browning-experiment
npm run build
```

Expected: all PASS.

- [ ] **Step 3: Run GitNexus changed-scope audit**

Run:

```powershell
npx gitnexus detect-changes
```

Expected: changed symbols are limited to shared trace submission, banana mapping/context/pages/tests, and `AssessmentPageFrame` pass-through. No unrelated fullscreen hook or settings changes should be included in your commits.

- [ ] **Step 4: Update project memory**

Append this entry to `docs/project_notes/issues.md`:

```markdown
- 2026-06-04: Standardized `g8-banana-browning-experiment` standard task pages to L2 trace events.
  - Added shared trace logger, collectors, validator, banana `TRACE_PAGE_CONFIGS`, and L2 submission mode.
  - `intro_notice` remains legacy/minimal by design; standard pages emit only L2 event names with object `value`.
  - Verified with `npm run lint:submission`, `npm run test:submission-format`, `npm run test:submission`, banana trace tests, and `npm run build`.
```

- [ ] **Step 5: Final status**

Run:

```powershell
git status --short
```

Expected: only intentionally modified tracked files remain if commits are not being created by the executor. If commits were created per task, the worktree should only show unrelated pre-existing user changes.

---

## Self-Review

- Spec coverage:
  - 13 standard pages are covered by `TRACE_PAGE_CONFIGS`; `intro_notice` stays outside L2.
  - Shared logger, collectors, validator, registry contract loading, lifecycle mode, banana page migration, and tests are covered.
  - Existing `/stu/saveHcMark` Mark envelope remains unchanged.
- Placeholder scan:
  - Forbidden placeholder phrases are absent from executable steps.
  - Page migration steps name exact files, exact event names, and exact field/question/content IDs.
- Type consistency:
  - `SubmissionLifecycleMode` is `'legacy' | 'l2-trace'`.
  - `TraceOperationDraft.value` remains an object.
  - `TRACE_PAGE_CONFIGS[*].lifecycleMode` is `'l2-trace'`.
  - `validateTraceMark` is separate from legacy `validateMarkObject`.
