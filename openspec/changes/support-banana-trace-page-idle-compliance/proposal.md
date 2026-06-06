## Why

Backend has completed the contract-gate apply for `support-banana-trace-page-idle-compliance` and published the canonical `science-inquiry-trace-v2.2` literals. The cp frontend now needs to consume those backend-published contracts and implement only its student-side L2 trace responsibilities so Page02 and `PAGE_IDLE` Mark JSON can pass backend v2.2 validation without frontend-generated labels or hash drift.

Source links:
- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\00-requirement-brief.md`
- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\repo-cp.md`
- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\frontend-page02-trace-compliance-issue-report.md`
- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\frontend-contract-gate-feedback.md`
- `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\repo-results\assessment-platform-backend.md`
- `D:\myproject\cp-banana-trace-standardization\docs\子模块数据上报规范\04-OpenSpec变更交接说明-PAGE_IDLE.md`
- `D:\myproject\cp-banana-trace-standardization\docs\子模块数据上报规范\01轨迹上报规范.md`
- `D:\myproject\cp-banana-trace-standardization\docs\子模块数据上报规范\03香蕉变黑每页L0-L1轨迹清单.md`

## What Changes

- Switch frontend runtime/static banana trace contracts to backend-published `science-inquiry-trace-v2.2` literals:
  - `schema_version=science-inquiry-trace-v2.2`
  - `field_registry_version=science-inquiry-field-registry-v2.2`
  - `field_registry_hash=93f0d6b95a7ae9615bf9bc0604fd81fa52d47712c9f3eda8670875e6646bcc54`
  - `content_registry_version=science-inquiry-content-registry-banana-v2.2`
  - `content_registry_hash=2460fbe2bfea3036543ed10377f795d494797eea0cdcc8f0767843951cc97d35`
  - `ruleConfigVersion=rule-config-v2.2`
  - `ruleConfigHash=c29da8988f93be25b69d4b7f82df417fb2f70741c4d0eb923de9e69531fd5d83`
  - `pageIdleThresholdMs=5000`
- Ensure frontend reporting consumes backend-published literal values from static contracts; do not compute registry hashes at runtime.
- Add frontend runtime support for `PAGE_IDLE` with required metadata and only these first-version phases: `initial_before_first_action`, `after_blocked_submit`, `between_effective_events`.
- Generate `PAGE_IDLE` only when `page_visible=true` and `window_focused=true`; hidden/blurred gaps are not compliant `PAGE_IDLE` in this change.
- Add `START_PAGE.value.metadata` support for `initial_visible_content_ids`, `main_instruction_visible`, and `viewport_state`; missing/empty `initial_visible_content_ids` is allowed, but non-empty ids must come from backend v2.2 banana Content Registry.
- Align Page02 active reading evidence with backend v2.2 fixtures using `CONTENT_ACTIVATE` and/or `CHAT_SCROLL`; active `CONTENT_EXPOSE` is not mandatory for this change.
- Preserve realistic `TEXT_CHANGE` debounce/throttle timing where it naturally occurs; do not fake input cadence to avoid backend WARN-level collapsed timing diagnostics.
- Validate frontend output against backend v2.2 fixtures `page02_question_generation.json` and `page02_page_idle.json` after implementation.

Scope boundaries:
- This proposal covers only `D:\myproject\cp-banana-trace-standardization`; it does not modify `D:\myproject\cp`.
- This proposal does not modify `assessment-platform-backend`, `assessment-platform-admin`, or `xspj-service`.
- This proposal does not create frontend L3 labels, `sequence_json`, HMM/Viterbi behavior, L4 features, scoring changes, or management trace tagging APIs.
- This proposal does not expand banana Content Registry to all 13 pages.

## Capabilities

### New Capabilities
- `banana-trace-l2-compliance`: Banana frontend L2 trace compliance for backend v2.2 contracts, `PAGE_IDLE`, initial visible content context, Page02 reading evidence, and Page02 text-event cadence.

### Modified Capabilities
- None. Existing repository-wide submission/data-format specs remain in place; this change adds a banana-specific L2 trace capability because banana trace runtime uses a separate L2 contract path from the legacy generic operation format.

## Impact

- Affected frontend areas: `src/shared/services/submission/trace/*`, `src/submodules/g8-banana-browning-experiment/trace/*`, `src/submodules/g8-banana-browning-experiment/mapping.ts`, `src/submodules/g8-banana-browning-experiment/Component.tsx`, and Page02 UI code in `src/submodules/g8-banana-browning-experiment/pages/Page03BananaMystery.tsx`.
- Affected contract assets: `src/shared/services/submission/trace/contracts/*.json` and `docs/子模块数据上报规范/engineering_contracts/*.json`.
- Affected tests: banana trace tests under `src/submodules/g8-banana-browning-experiment/__tests__/` and shared trace tests under `src/shared/services/submission/trace/__tests__/`.
- Backend dependency has moved from “contract unresolved” to “v2.2 published”; frontend implementation should now use backend literals and fixtures from `D:\myproject\assessment-platform-backend` as read-only inputs.
- Completion requires writing cp results to `D:\myproject\assessment-platform-kb\需求\2026-06-06-banana-trace-page-idle-compliance\repo-results\cp.md` after code implementation and verification, not during proposal/design-only work.
