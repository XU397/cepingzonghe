# Banana Trace v2.2 Frontend Implementation Design

Date: 2026-06-06
Repository: `D:\myproject\cp-banana-trace-standardization`
Status: design ready for user review; no frontend runtime code implemented by this document.

## Source Inputs

- Backend result: `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\repo-results\assessment-platform-backend.md`
- Frontend OpenSpec change: `openspec/changes/support-banana-trace-page-idle-compliance/`
- Frontend contract feedback: `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\frontend-contract-gate-feedback.md`
- Backend fixtures to align with:
  - `D:\myproject\assessment-platform-backend\ruoyi-system\src\test\resources\trace-contracts\v2.2\acceptance_cases\page02_question_generation.json`
  - `D:\myproject\assessment-platform-backend\ruoyi-system\src\test\resources\trace-contracts\v2.2\acceptance_cases\page02_page_idle.json`

## Confirmed Backend Contract

The frontend must consume backend-published literal values and must not compute registry hashes at runtime:

| Field | Literal value |
|---|---|
| `schema_version` | `science-inquiry-trace-v2.2` |
| `field_registry_version` | `science-inquiry-field-registry-v2.2` |
| `field_registry_hash` | `93f0d6b95a7ae9615bf9bc0604fd81fa52d47712c9f3eda8670875e6646bcc54` |
| `content_registry_version` | `science-inquiry-content-registry-banana-v2.2` |
| `content_registry_hash` | `2460fbe2bfea3036543ed10377f795d494797eea0cdcc8f0767843951cc97d35` |
| `ruleConfigVersion` | `rule-config-v2.2` |
| `ruleConfigHash` | `c29da8988f93be25b69d4b7f82df417fb2f70741c4d0eb923de9e69531fd5d83` |
| `pageIdleThresholdMs` | `5000` |

First-version `idle_phase` values are exactly:

- `initial_before_first_action`
- `after_blocked_submit`
- `between_effective_events`

`finish_page_idle` is explicitly out of scope until a later spec defines it.

## Goals

- Switch frontend trace runtime/static contracts to backend v2.2 literals.
- Keep version/hash reporting literal-driven from static contracts; no frontend runtime hash calculation.
- Add `PAGE_IDLE` as a valid L2 event only for page-visible, window-focused gaps where `idle_duration_ms >= pageIdleThresholdMs` (`>= 5000ms`).
- Add safe `START_PAGE.value.metadata` support for initial visible context.
- Align Page02 active reading evidence with backend fixtures through `CONTENT_ACTIVATE` and `CHAT_SCROLL`.
- Preserve real text debounce/throttle timing and do not fabricate `TEXT_CHANGE` cadence.
- Verify with frontend unit/fixture tests and backend v2.2 fixture shapes before writing cp repo result.

## Non-Goals

- Do not modify backend, admin frontend, xspj-service, or `D:\myproject\cp`.
- Do not generate L3 labels, `sequence_json`, HMM/Viterbi observations, L4 features, scoring data, or ability judgments in the frontend.
- Do not expand banana Content Registry to all 13 pages in this change.
- Do not make active `CONTENT_EXPOSE` mandatory for Page02 first version.
- Do not fake intermediate text events to suppress backend WARN quality diagnostics.

## Current Frontend State

This section describes the pre-implementation baseline captured on 2026-06-06; after this change, the banana runtime loads explicit v2.2 contract files.

Relevant files:

- Before this change, `src/shared/services/submission/trace/contracts.ts` loaded v2.1 JSON and exported schema/registry/rule constants.
- `src/shared/services/submission/trace/logger.ts` injects schema/registry metadata into every L2 operation value.
- `src/shared/services/submission/trace/types.ts` defines L2 event types but currently lacks `PAGE_IDLE`.
- `src/shared/services/submission/trace/validators/validateTraceMark.ts` validates event metadata and registry ids.
- `src/shared/services/submission/trace/collectors/text.ts` already supports debounce/throttle `TEXT_CHANGE` and blur/submit flushes.
- `src/submodules/g8-banana-browning-experiment/pages/Page03BananaMystery.tsx` is Page02 UI and currently emits chat `CONTENT_ACTIVATE` on bubble click.
- `src/submodules/g8-banana-browning-experiment/Component.tsx` already emits blocked `SUBMIT_ATTEMPT`, which can anchor `after_blocked_submit` idle.
- No shared visibility/focus tracker or `PAGE_IDLE` collector exists yet.

## Architecture

### Contract Layer

Keep static JSON contracts as the runtime source for literal reporting:

```text
src/shared/services/submission/trace/contracts/*.json
  -> contracts.ts exports literals and thresholds
  -> logger.ts injects metadata into L2 event values
  -> validators/tests verify emitted Mark JSON
```

Implementation should either add explicit v2.2 filenames or replace the current v2.1 imports with v2.2 imports. Prefer explicit v2.2 filenames if tests can be updated cleanly, because the backend contract version is then visible in code and drift tests.

### Trace Logger Layer

`createPageTraceLogger()` remains the single event construction path. Add:

- `PAGE_IDLE` emit helper with required metadata.
- Optional helper methods for `CHAT_SCROLL` if current generic `emit()` usage would be too page-local.
- Contract metadata injection remains centralized and literal-driven.

### Idle Collection Layer

Add a boundary-based collector that does not poll. It observes effective frontend trace events and visibility/focus state:

```text
START_PAGE
  -> idle candidate begins
first effective event after `idle_duration_ms >= pageIdleThresholdMs` (`>= 5000ms`) while visible/focused
  -> emit PAGE_IDLE(initial_before_first_action)
blocked SUBMIT_ATTEMPT
  -> idle candidate begins with after_blocked_submit phase
ordinary effective event
  -> closes prior candidate and opens next between_effective_events candidate
```

Candidate segments are discarded or reset if page visibility becomes hidden or the window loses focus.

### START_PAGE Metadata Layer

Add a helper to derive safe page-start metadata:

- `initial_visible_content_ids`: may be omitted or empty; non-empty ids must exist in backend v2.2 Content Registry.
- `main_instruction_visible`: boolean matching backend v2.2 fixture expectations.
- `viewport_state`: use backend v2.2 fixture field names as canonical: `width`, `height`, and `scroll_y`; do not include raw DOM snapshots or student text.
- Page02 auto-reveal summary may be included if backend fixture expects it, but it remains context, not active reading evidence.

### Page02 Reading Layer

First-version active reading events:

- Keep/validate `CONTENT_ACTIVATE` for chat bubble activation using registered `chat_bubble_02_*` ids.
- Add `CHAT_SCROLL` for user-originated chat scroll aggregation using backend v2.2 fixture field names as canonical: `scroll_delta`, `scroll_direction`, `visible_content_ids_before`, `visible_content_ids_after`, and `phase`.
- Suppress programmatic auto-scroll and replay scroll from active evidence.
- Do not require active `CONTENT_EXPOSE` unless backend later changes fixtures.

### Text Timing Layer

Keep the current collector behavior:

- `TEXT_CHANGE` fires on debounce or character threshold where naturally reached.
- `TEXT_CHANGE.value_after` remains null/empty by default.
- `TEXT_BLUR.value_after` carries final complete text.
- Short input blur flush is allowed and may remain backend WARN quality evidence.

## Data Flow

```text
Backend v2.2 contracts/fixtures (read-only source)
  -> frontend static contract copies
  -> contracts.ts exports literal versions/hashes/threshold
  -> createPageTraceLogger injects metadata
  -> Page02 / idle collectors emit L2 operations
  -> validateTraceMark and banana tests assert v2.2 compliance
  -> Mark JSON sent through existing submission pipeline
```

## Error Handling And Boundaries

- Unknown non-empty `content_id` should fail local validation before backend FATAL.
- Hidden/unfocused idle candidates should not be emitted as compliant `PAGE_IDLE`.
- Missing active reading evidence should be avoided by implementation, but backend treats it as WARN/quality gap rather than registry/schema FATAL.
- Collapsed short text timing should not be fixed by fake events; backend WARN is acceptable for natural short-input behavior.
- backend v2.2 fixtures are canonical for `CHAT_SCROLL` and `viewport_state` field names; frontend drift/fixture tests must compare against `page02_question_generation.json` and `page02_page_idle.json`.

## Testing Strategy

Required focused tests:

- Contract-sync tests for v2.2 literals and docs/runtime consistency.
- Logger tests for v2.2 metadata injection and `PAGE_IDLE` helper.
- Validator tests for `PAGE_IDLE` required metadata, legal phases, hidden/unfocused rejection, and registry-backed content ids.
- Text collector tests that demonstrate long-answer non-blur-only `TEXT_CHANGE` and short blur flush allowance.
- Page02 tests for `CONTENT_ACTIVATE`, user-originated `CHAT_SCROLL`, and auto-scroll suppression.
- Drift/fixture alignment tests that load backend v2.2 `page02_question_generation.json` and `page02_page_idle.json` and assert frontend fixture/event shapes use the same `CHAT_SCROLL`, `viewport_state`, and `PAGE_IDLE` field names.

Suggested commands after implementation:

```powershell
npx vitest run src/shared/services/submission/trace/__tests__ src/submodules/g8-banana-browning-experiment/__tests__
npm run lint:submission
npm run test:submission-format
npm run test:submission
```

## Implementation Order For Future Plan

1. Sync v2.2 contracts and backend fixtures into frontend static locations.
2. Update contract loader/constants and drift tests.
3. Add `PAGE_IDLE` type/logger/validator support.
4. Add visibility/focus tracker and boundary-based idle collector.
5. Add `START_PAGE` initial visible metadata helper.
6. Add Page02 `CHAT_SCROLL` and validate existing `CONTENT_ACTIVATE`.
7. Align tests and fixtures.
8. Run verification.
9. Write `repo-results/cp.md` after runtime implementation and verification.

## Implementation Plan Decisions

- Use explicit v2.2 imports for banana trace runtime while leaving v2.1 files present for historical reference until a separate retention decision removes them.
- Add a shared `chatScroll()` logger helper so Page02 runtime and tests emit backend fixture field names exactly.
- Read `pageIdleThresholdMs` from backend `rule_config.v2.2.json` and enforce `idle_duration_ms >= pageIdleThresholdMs` (`>= 5000ms`).

## Acceptance Criteria

- Emitted Page02 `START_PAGE.value.metadata` uses backend v2.2 literals exactly.
- Frontend `PAGE_IDLE` validates only for visible/focused segments where `idle_duration_ms >= pageIdleThresholdMs` (`>= 5000ms`) and uses only the three first-version phases.
- Page02 emits registry-valid active reading evidence through `CONTENT_ACTIVATE` and/or `CHAT_SCROLL`.
- Page02 text events preserve natural collector cadence without fabricated timing.
- Frontend tests pass against backend v2.2 fixture expectations.
- cp repo result is written only after implementation and verification evidence exists.
