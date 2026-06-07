---
title: cp frontend implementation handbook for standard submodules
type: documentation
status: verified
source: design
last_verified: 2026-06-07
standard_id: standard-submodule
standard_version: v1.0
profile_id: science-inquiry-experiment
profile_version: v1.0
source_refs:
  - 'D:\myproject\assessment-platform-kb\标准\子模块构建标准\standard-submodule-v1.0.md'
  - 'D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\00-requirement-brief.md'
  - 'D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\repo-cp.md'
  - 'D:\myproject\cp-banana-trace-standardization\docs\superpowers\specs\2026-06-07-standard-submodule-construction-design.md'
---

# Frontend Implementation Handbook

This handbook explains how cp implements `standard-submodule` `v1.0`. It is implementation-local unless a section is explicitly marked as mirrored with version metadata in `standard-sync-manifest.md`.

## Canonical Boundaries

- KB owns standard semantics, L0/L1/L2 concepts, responsibility boundaries, and version lifecycle.
- cp owns frontend implementation guidance: source layout, mapping conventions, context plumbing, page composition, trace collection, MarkObject submission wiring, tests, and local validation commands.
- Backend owns runtime contract loading, schema/registry validation, L2-to-L3 tagging, diagnostics, sequence/HMM processing, scoring, and ability labels.
- cp must not generate L3 labels, HMM/Viterbi observations, `sequence_json`, L4 features, scoring data, or ability judgments.

## Standard Submodule Shape

Use this structure for new standard submodules:

```text
src/submodules/{submoduleId}/
  index.tsx
  Component.tsx
  mapping.ts
  types.ts
  context/
  pages/
  trace/
  __tests__/
```

Responsibilities:

- `index.tsx` exports the `SubmoduleDefinition` used by `src/submodules/registry.ts`.
- `Component.tsx` composes the provider and `AssessmentPageFrame`, then owns the page submit/navigation pipeline.
- `mapping.ts` is the single source for page IDs, page numbers, page descriptions, question/field/content mappings, and submodule mapping config.
- `context/` owns answers, operations, stable `logOperation`, and flow context injection.
- `pages/` owns UI semantics and interactions; pages do not call `/stu/saveHcMark` directly.
- `trace/` owns submodule-local trace helpers and bindings that adapt shared trace contracts to page behavior.
- `__tests__/` covers mapping, submission format, trace config, acceptance fixtures, and page events.

Reference implementations:

- Standard reference: `src/submodules/g8-banana-browning-experiment/`
- Standard alternate: `src/submodules/g8-pv-sand-experiment/`
- Shared frame: `src/shared/ui/PageFrame/AssessmentPageFrame.jsx`
- Submission hook: `src/shared/services/submission/usePageSubmission.js`
- Submission adapter utilities: `src/shared/services/submission/submoduleAdapter/`
- Page mapping utilities: `src/shared/utils/pageMapping.ts`

## Mapping and Page Identity

Each standard submodule must define stable IDs before page implementation:

- Canonical `page_id` for L0/L1/L2 planning.
- Legacy compatibility page ID if the submodule wraps or migrates older pages.
- `pageIndex` or equivalent step index for Flow order.
- `pageNumber` and `pageDesc` used by MarkObject submission.
- Stable field IDs and content IDs that align with registries and acceptance fixtures.
- Flow context fields that identify flow, submodule, page, step index, and module context.

Do not hand-write page prefixes inside page components. Use mapping/config helpers so MarkObject and trace payloads can be traced back to one page definition.

## Context and Operation Logging

The context layer should:

- Store answer drafts separately from trace operations.
- Expose stable `logOperation` and page-specific update helpers.
- Append L2 operations in user-observed order.
- Inject `flow_context` through the shared submission path.
- Clear page-scoped operations only after successful page submission/navigation according to the component pipeline.

Keep `operationList` and `answerList` distinct:

- `operationList` is ordered L2 engineering evidence.
- `answerList` is scoring/answer data.

## Page Components

Page components should be thin semantic views:

- Render task content and controls.
- Update context state for answers.
- Emit interaction events through context or trace helpers.
- Avoid direct API calls and direct `FormData` construction.
- Avoid local ad-hoc page numbers, field IDs, content IDs, or target prefixes.
- Treat default visible content as visible context, not active reading evidence.

Build vertically by page slice: UI, L0/L1 planning, L2 event plan, field/content registry alignment, submission format, and tests should land together for each page family.

## Event Minimum Requirements

This section mirrors a versioned summary from KB `standard-submodule` `v1.0`.

- `START_PAGE` reports schema/registry metadata, flow context, page index, legacy page ID, initial visible content IDs, and viewport state when applicable.
- `CONTENT_ACTIVATE` is emitted only for user-initiated content activation and may be used as active reading evidence.
- `CHAT_SCROLL` records user-initiated scrolling only.
- `TEXT_FOCUS` records focus-start value and character counts.
- `TEXT_CHANGE` keeps natural debounce/throttle timing; do not forge events only to satisfy backend quality warnings.
- `TEXT_BLUR` keeps correct before/after semantics.
- `PAGE_IDLE` is emitted only during page-visible and focus-qualified idle intervals; cp does not derive L3 labels or ability outputs from it.
- `SUBMIT_ATTEMPT` includes submit trigger, validation status, and missing-field information.

## MarkObject Submission

Standard pages submit through `AssessmentPageFrame` and `usePageSubmission`:

1. Page interaction updates context answer and operation state.
2. `Component.tsx` runs validation in the page navigation pipeline.
3. `AssessmentPageFrame` calls the default submit handler.
4. `usePageSubmission` builds MarkObject payload and posts `/stu/saveHcMark`.
5. Navigation or completion happens after the submit lifecycle finishes.

MarkObject expectations:

- `pageNumber` and `pageDesc` come from mapping.
- `beginTime` and `endTime` describe page submission envelope timing.
- `operationList` contains ordered L2 operations.
- `answerList` contains answer/scoring values.
- `flow_context` identifies flow, submodule, page, step index, and module context.
- `imgList` remains present for compatibility even when empty.

## Trace Contracts and Registries

Shared trace contracts currently live under:

- `src/shared/services/submission/trace/contracts.ts`
- `src/shared/services/submission/trace/contracts/`
- `src/shared/services/submission/trace/logger.ts`
- `src/shared/services/submission/trace/validators/`

For banana, the v2.2 contract files are the active shared inputs:

- `event_schema.v2.2.json`
- `field_registry.v2.2.json`
- `content_registry.banana.v2.2.json`
- `rule_config.v2.2.json`

When a submodule changes trace behavior, check whether the standard manifest and trace contract version/hash declarations need an update.

## Tests and Verification

Expected test coverage for standard submodules:

- Mapping compliance tests.
- Submission format/snapshot tests.
- Trace configuration tests.
- Trace hook/page event tests.
- Acceptance fixture tests that use authoritative fixtures or clearly declared mirrors.

Existing banana reference tests:

- `src/submodules/g8-banana-browning-experiment/__tests__/mapping.test.ts`
- `src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts`
- `src/submodules/g8-banana-browning-experiment/__tests__/submission.snapshot.test.ts`
- `src/submodules/g8-banana-browning-experiment/__tests__/trace-acceptance.test.ts`
- `src/submodules/g8-banana-browning-experiment/__tests__/trace-config.test.ts`
- `src/submodules/g8-banana-browning-experiment/__tests__/trace-hooks.test.tsx`
- `src/submodules/g8-banana-browning-experiment/__tests__/trace-page-events.test.tsx`

Repository-level commands:

```bash
npm run lint
npm run lint:submission
npm run test:submission-format
npm run test:submission
npm test
```

For documentation-only standard handbook updates, prefer targeted documentation checks first and run runtime regressions only when code or trace contracts change.
