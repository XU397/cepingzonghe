Source links:
- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\00-requirement-brief.md`
- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\repo-cp.md`
- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\frontend-page02-trace-compliance-issue-report.md`
- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\frontend-contract-gate-feedback.md`
- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\repo-results\assessment-platform-backend.md`

## 1. Contract Sync

- [x] 1.1 Copy or mirror backend v2.2 event schema, field registry, banana content registry, rule config, and acceptance fixtures into the frontend contract locations.
- [x] 1.2 Update frontend contract imports/constants so emitted metadata uses `science-inquiry-trace-v2.2`, v2.2 field/content registry literals, `rule-config-v2.2`, and `pageIdleThresholdMs=5000`.
- [x] 1.3 Ensure frontend runtime does not compute registry hashes; it must report backend-published literal values from static contracts.
- [x] 1.4 Update docs/runtime contract-sync tests to catch v2.2 drift across runtime contracts, docs mirrors, fixtures, accepted event types, page types, and hashes.
  - Review follow-up also checks v2.1 historical mirrors byte-for-byte so legacy contract copies cannot drift while v2.2 remains current runtime.
- [x] 1.5 Confirm non-empty `initial_visible_content_ids` validate against backend v2.2 banana Content Registry, while missing/empty arrays remain allowed outside registry-covered pages.

## 2. PAGE_IDLE Runtime

- [x] 2.1 Add `PAGE_IDLE` to shared trace types, event schema, logger helpers, validator, and focused tests.
- [x] 2.2 Add `pageIdleThresholdMs=5000` access from v2.2 rule config without reusing text/think thresholds.
- [x] 2.3 Implement a boundary-based idle collector that tracks effective event gaps without polling, per-second events, or mousemove streams.
- [x] 2.4 Track `page_visible` via document visibility and `window_focused` via window/document focus state.
- [x] 2.5 Emit compliant `PAGE_IDLE` only when the full candidate segment has `page_visible=true`, `window_focused=true`, and `idle_duration_ms >= pageIdleThresholdMs` (`>= 5000ms`).
- [x] 2.6 Support only first-version phases: `initial_before_first_action`, `after_blocked_submit`, and `between_effective_events`; do not emit `finish_page_idle`.

## 3. START_PAGE Metadata

- [x] 3.1 Add registry-backed metadata helpers for `initial_visible_content_ids`, `main_instruction_visible`, and `viewport_state`.
- [x] 3.2 Keep default visible content in `START_PAGE.value.metadata`, not active `CONTENT_EXPOSE`.
- [x] 3.3 For Page02, add safe chat auto-reveal summary metadata if needed by the backend fixture.
  - Backend v2.2 fixture does not require additional auto-reveal summary fields beyond default visible content metadata.
- [x] 3.4 Ensure `viewport_state` uses backend fixture field names (`width`, `height`, `scroll_y`) and contains no raw DOM snapshots or raw student text.

## 4. Page02 Reading And Text Evidence

- [x] 4.1 Preserve existing `CONTENT_ACTIVATE` for Page02 chat bubbles and validate all emitted ids against backend v2.2 Content Registry.
- [x] 4.2 Add user-originated `CHAT_SCROLL` aggregation for the Page02 chat container using backend fixture field names (`scroll_delta`, `scroll_direction`, `visible_content_ids_before`, `visible_content_ids_after`, `phase`), filtering programmatic auto-scroll/replay behavior.
- [x] 4.3 Do not require active `CONTENT_EXPOSE` for this first version unless backend changes the fixture contract.
- [x] 4.4 Verify long-answer `TEXT_CHANGE` is emitted through real debounce/throttle timing.
- [x] 4.5 Preserve short-input blur flush behavior; do not fake intermediate text events to avoid backend WARN diagnostics.

## 5. Fixture And Test Alignment

- [x] 5.1 Add/align frontend drift and fixture tests with backend `page02_question_generation.json`, including `CHAT_SCROLL` and `viewport_state` field names.
- [x] 5.2 Add/align frontend drift and fixture tests with backend `page02_page_idle.json`, including `idle_duration_ms >= pageIdleThresholdMs` and PAGE_IDLE metadata field names.
- [x] 5.3 Add validator tests for required `PAGE_IDLE` metadata and rejected hidden/unfocused idle segments.
- [x] 5.4 Add Page02 tests for `CONTENT_ACTIVATE`, `CHAT_SCROLL`, text cadence, and submit/blocking interactions.
- [x] 5.5 Run focused tests: `npx vitest run src/shared/services/submission/trace/__tests__ src/submodules/g8-banana-browning-experiment/__tests__`.
  - Verified with expanded collector path: `npx vitest run src/shared/services/submission/trace/__tests__ src/shared/services/submission/trace/collectors src/submodules/g8-banana-browning-experiment/__tests__` (14 files, 180 tests).
  - Review follow-up verification: same expanded command passed (14 files, 185 tests) after v2.1/v2.2 sync coverage and timeout field-inference hardening.
- [x] 5.6 Run required submission checks: `npm run lint:submission`, `npm run test:submission-format`, and `npm run test:submission`.
  - Review follow-up verification also passed `npm run build` and `openspec validate support-banana-trace-page-idle-compliance --strict`.

## 6. Cross-Repo Result

- [x] 6.1 Capture actual cp implementation summary, changed files, and verification commands after apply.
- [x] 6.2 State whether frontend output aligns with backend v2.2 Page02 and PAGE_IDLE fixtures.
- [x] 6.3 Write final cp result to `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\repo-results\cp.md`.
