## Context

This is the cp frontend repository design for KB change `2026-06-06-banana-trace-page-idle-compliance`. Backend has completed contract-gate apply and published final `science-inquiry-trace-v2.2` contract literals in:

- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\repo-results\assessment-platform-backend.md`

Required input sources:

- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\00-requirement-brief.md`
- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\repo-cp.md`
- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\frontend-page02-trace-compliance-issue-report.md`
- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\frontend-contract-gate-feedback.md`
- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\repo-results\assessment-platform-backend.md`

Proposal-time frontend facts (before this change was applied):

- Banana trace runtime is centered on `src/shared/services/submission/trace/logger.ts`, `contracts.ts`, `types.ts`, `validators/validateTraceMark.ts`, and collectors under `src/shared/services/submission/trace/collectors/`.
- At proposal time the frontend runtime remained v2.1: `TRACE_SCHEMA_VERSION = science-inquiry-trace-v2.1`, runtime `event_schema.v2.1.json` lacked `PAGE_IDLE`, and existing registry hashes were the old frontend/doc literals. The implemented runtime now targets v2.2.
- `createPageTraceLogger()` injects trace schema and registry metadata into every L2 event via `value.metadata`; `START_PAGE` uses that same path.
- Page02 (`Page03BananaMystery.tsx`, canonical `page_02_question_generation`, page type `B1_TEXT_SINGLE`) currently supports `CONTENT_ACTIVATE` on chat bubble click and uses `createTextEventCollector()` for `TEXT_FOCUS` / `TEXT_CHANGE` / `TEXT_BLUR`.
- No unified page visibility/window focus tracker or `PAGE_IDLE` collector exists yet.

Backend-published v2.2 literals to consume:

| Item | Value |
|---|---|
| schema_version | `science-inquiry-trace-v2.2` |
| field_registry_version | `science-inquiry-field-registry-v2.2` |
| field_registry_hash | `93f0d6b95a7ae9615bf9bc0604fd81fa52d47712c9f3eda8670875e6646bcc54` |
| content_registry_version | `science-inquiry-content-registry-banana-v2.2` |
| content_registry_hash | `2460fbe2bfea3036543ed10377f795d494797eea0cdcc8f0767843951cc97d35` |
| ruleConfigVersion | `rule-config-v2.2` |
| ruleConfigHash | `c29da8988f93be25b69d4b7f82df417fb2f70741c4d0eb923de9e69531fd5d83` |
| pageIdleThresholdMs | `5000` |

Backend fixture targets:

- `D:\myproject\assessment-platform-backend\ruoyi-system\src\test\resources\trace-contracts\v2.2\acceptance_cases\page02_question_generation.json`
- `D:\myproject\assessment-platform-backend\ruoyi-system\src\test\resources\trace-contracts\v2.2\acceptance_cases\page02_page_idle.json`

## Goals / Non-Goals

**Goals:**

- Sync cp frontend runtime/static trace contracts to backend-published v2.2 literals.
- Keep runtime reporting hash-free: frontend consumes literal version/hash fields from static contract files and may only use tests/build checks for drift detection.
- Add `PAGE_IDLE` as compliant L2 context only when page is visible and window is focused.
- Add/keep `START_PAGE.metadata.initial_visible_content_ids`, `main_instruction_visible`, and `viewport_state` as safe metadata.
- Add Page02 active reading evidence through first-version `CONTENT_ACTIVATE` and `CHAT_SCROLL` support.
- Preserve real text debounce/throttle behavior and accept that short-input collapsed timing can remain backend WARN-level quality evidence.
- Verify against backend v2.2 fixtures and write cp repo result after implementation.

**Non-Goals:**

- No backend, admin, xspj-service, scoring, L3 label, `sequence_json`, HMM/Viterbi, L4, or historical data migration work.
- No expansion of banana Content Registry to all 13 pages.
- No active `CONTENT_EXPOSE` requirement in this first frontend apply unless backend later makes it mandatory.
- No fake input timing to eliminate backend WARN diagnostics.

## Decisions

### 1. Consume backend v2.2 literal contract values

Frontend will switch from v2.1 static contract files to backend-published v2.2 static contract files/literals. `contracts.ts` should continue reading version/hash fields from JSON, but the JSON values must be copied/synced from backend canonical resources. Runtime code must not compute registry hashes.

Rationale: backend keeps registry mismatch as FATAL and has published literal values; frontend runtime hash calculation would create a second source of truth.

### 2. Keep contract files mirrored in frontend with drift tests

Frontend should keep runtime contracts under `src/shared/services/submission/trace/contracts/` and docs mirrors under `docs/子模块数据上报规范/engineering_contracts/`, then add drift tests comparing runtime/docs/backend fixture expectations where practical.

Implementation can either replace v2.1 files with v2.2-named files or add v2.2 files and update imports. Prefer explicit v2.2 filenames if the current test setup can be updated cleanly, because it makes backend version alignment visible.

### 3. Implement PAGE_IDLE as a shared trace collector

Add a shared boundary-based idle collector, not page-local timers. It should:

- Use `pageIdleThresholdMs=5000` from v2.2 rule config and emit only when `idle_duration_ms >= pageIdleThresholdMs` (`>= 5000ms`).
- Track effective event boundaries through the trace logger/context.
- Track `document.visibilityState === 'visible'` and `document.hasFocus()`/window focus state.
- Emit only when `page_visible=true` and `window_focused=true` for the full candidate segment.
- Use only these phases: `initial_before_first_action`, `after_blocked_submit`, `between_effective_events`.
- Not emit `finish_page_idle` until a later backend/main-session spec defines it.

### 4. Treat START_PAGE initial visible metadata as context, not reading evidence

`START_PAGE.metadata.initial_visible_content_ids` may be omitted or empty. If non-empty, every id must come from backend v2.2 banana Content Registry. `main_instruction_visible` and `viewport_state` should avoid raw DOM snapshots and raw student text. Backend v2.2 fixtures are canonical for `viewport_state` field names: `width`, `height`, and `scroll_y`.

For Page02, chat auto reveal can be represented as safe metadata such as `chat_auto_reveal_summary`, but it must not be active reading evidence.

### 5. Page02 first-version reading evidence is CONTENT_ACTIVATE + CHAT_SCROLL

`CONTENT_ACTIVATE` already exists conceptually and is the lowest-risk first event. Add `CHAT_SCROLL` aggregation for user scroll, explicitly filtering programmatic auto-scroll/replay behavior. Backend v2.2 fixtures are canonical for `CHAT_SCROLL` field names: `scroll_delta`, `scroll_direction`, `visible_content_ids_before`, `visible_content_ids_after`, and `phase`. Active `CONTENT_EXPOSE` remains optional and out of first-version required scope.

### 6. Preserve text collector behavior, do not forge cadence

`createTextEventCollector()` already supports character-threshold and debounce-based `TEXT_CHANGE`. Implementation should verify long-answer paths and submit flush behavior, but must not generate artificial `TEXT_CHANGE` timestamps solely to avoid backend `PAGE02_COLLAPSED_TEXT_TIMING` WARN.

## Risks / Trade-offs

- [Risk] Copying backend v2.2 files manually can drift later -> Mitigation: add contract-sync tests and document backend literals in tests.
- [Risk] Explicit v2.2 files require import/test updates -> Mitigation: keep change scoped to `src/shared/services/submission/trace/*` and banana trace tests.
- [Risk] Programmatic chat auto-scroll may be mistaken as user reading -> Mitigation: tag/suppress auto scroll windows and only aggregate user-originated scroll events.
- [Risk] Idle segment crosses hidden/blurred time -> Mitigation: discard or split candidate segment; do not emit compliant `PAGE_IDLE` for hidden/unfocused intervals.
- [Risk] Short answers naturally collapse text timing -> Mitigation: keep backend WARN quality behavior; do not fake cadence.
- [Risk] `initial_visible_content_ids` outside Page02/Page03/Page12 could fail registry validation -> Mitigation: allow empty/missing outside registry-covered pages and validate non-empty ids locally.

## Migration Plan

1. Sync v2.2 runtime/static contracts and fixtures from backend read-only resources into frontend contract mirrors.
2. Update contract loading constants/imports so emitted metadata reports v2.2 literals and `pageIdleThresholdMs=5000`.
3. Add `PAGE_IDLE` type/schema/logger/validator support and a boundary-based idle collector.
4. Wire effective event boundaries through banana trace logger/context and Page02/PageFrame submit flow.
5. Add Page02 `CHAT_SCROLL` aggregation and verify existing `CONTENT_ACTIVATE` remains registry-valid.
6. Add/adjust tests for contract sync, backend v2.2 Page02/PAGE_IDLE fixture shape, `CHAT_SCROLL` and `viewport_state` field names, visibility/focus gating, idle phases, and text cadence.
7. Run focused tests and broader submission checks.
8. Write `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\repo-results\cp.md` after implementation and verification.

## Implementation Plan Decisions

- Use explicit v2.2 imports for banana trace runtime while leaving existing v2.1 files in place for historical reference until a separate retention decision removes them.
- Read `pageIdleThresholdMs` from backend `rule_config.v2.2.json` using the existing `thresholds.*.value` loader shape; runtime emits only when `idle_duration_ms >= pageIdleThresholdMs` (`>= 5000ms`).
- Add a shared `chatScroll()` logger helper so Page02 uses backend v2.2 fixture field names consistently in runtime and tests.
