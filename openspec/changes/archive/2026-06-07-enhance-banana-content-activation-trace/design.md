## Context

Banana trace v2.2 already records page lifecycle, text input, submit attempts, chart/table operations, simulation actions, and Page02-style content activation. The review and follow-up requirements identified remaining content-reading gaps: Page03 material cards are incomplete and only partially traced, Page05/Page06 guidance materials above response inputs are not trace-visible, and Page12 top decision guidance is not trace-visible.

The affected runtime is frontend-only and uses the existing L2 trace event types from `science-inquiry-trace-v2.2`. The implementation must keep runtime contracts under `src/shared/services/submission/trace/contracts/` synchronized with docs mirrors under `docs/子模块数据上报规范/engineering_contracts/`, because emitted `content_id` values are validated against the banana v2.2 Content Registry.

## Goals / Non-Goals

**Goals:**

- Restore Page03 material reading UI to five material cards and trace every card open/close with stable registry-backed IDs.
- Add Page05, Page06, and Page12 low-noise content activation tracing for instruction/material blocks that users actively hover or touch.
- Reuse Page02-style activation semantics: record aggregated `CONTENT_ACTIVATE` evidence only after meaningful dwell, never raw `mousemove` streams.
- Keep all new content IDs registered in the v2.2 banana Content Registry and mirrored docs contract.
- Add tests that exercise modal open/close and activation threshold behavior.

**Non-Goals:**

- No backend API, schema event-type, L3/L4, scoring, or database changes.
- No recording of raw material text, raw DOM snapshots, or full modal content in trace payloads.
- No broad redesign of banana page layout beyond restoring the missing Page03 material cards and adding trace handlers.
- No change to final-page `page_13_finish` semantics; that page remains submodule-local and is unrelated to batch completion.

## Decisions

### 1. Use existing L2 event types and stable content IDs

Page03 material card open/close will emit `OPEN_MODAL` and `CLOSE_MODAL` with the material card `content_id`. Page05/Page06/Page12 reading areas will emit `CONTENT_ACTIVATE` with registry-backed `content_id` values.

Rationale: these event types already exist in the v2.2 schema and logger, so no backend contract shape changes are required. Stable IDs make validation deterministic and avoid sending content details.

Alternatives considered:

- Add a new `MOUSE_ENTER` / `MOUSE_LEAVE` event pair. Rejected because it would produce noisy data and require schema/backend updates.
- Emit `CONTENT_VIEW` on page load. Rejected because the requirement is active reading behavior, not default exposure.

### 2. Implement Page02-style low-noise activation as a reusable frontend helper

A reusable banana helper will track hover/touch start and end times, then emit `CONTENT_ACTIVATE` only when dwell meets the effective activation threshold. The helper will attach normal DOM handlers to target content blocks and include safe metadata such as `activation_type`, `dwell_ms`, `source_ui_id`, and page-local context.

Rationale: Page05/Page06/Page12 all need the same semantics. Centralizing the threshold and metadata reduces inconsistent page-local implementations.

Alternatives considered:

- Inline handlers in each page. Rejected because thresholds and metadata would drift.
- Continuous mouse movement logging. Rejected because the trace specification forbids high-frequency mousemove evidence.

### 3. Keep Page03 modal content private

Page03 will restore/register five material cards, but traces will only report which card was opened/closed and modal dwell duration. The modal body copy, images, and student state will not be serialized into operation metadata.

Rationale: the user explicitly said details can be omitted, and trace contracts only need behavioral evidence that the content layer was opened and closed.

### 4. Update runtime and docs contracts together

Every new `content_id` emitted by Page03/Page05/Page06/Page12 must be added to both runtime and docs content registry mirrors. Hash literals and fixture expectations must be updated as part of the same change.

Rationale: validator and contract-sync tests treat registry drift as a submission compliance risk.

## Risks / Trade-offs

- [Risk] Page03 historical content may be partially reconstructed from local docs/assets rather than backend source text -> Mitigation: preserve available local content/assets and keep trace payload independent of modal content details.
- [Risk] Activation thresholds may miss very short glances -> Mitigation: follow Page02-style effective activation rules to favor meaningful evidence over noise.
- [Risk] Registry hash changes can break fixtures/tests -> Mitigation: recalculate content registry hash once after all registry edits and update every hardcoded expectation found by search.
- [Risk] Tests using timers can become flaky -> Mitigation: use fake timers or deterministic Date mocking for threshold tests.

## Migration Plan

1. Add the new banana content IDs to runtime and docs v2.2 content registry files.
2. Restore Page03 material cards to five visible cards and wire `OPEN_MODAL` / `CLOSE_MODAL` for each card.
3. Add a reusable activation helper and wire Page05/Page06/Page12 content blocks to it.
4. Update hash literals, fixtures, and contract tests for the changed content registry.
5. Add focused page tests and run OpenSpec, trace, submission, and build verification.

## Open Questions

None. The Page03/Page04 content-card requirement is treated as approved by the user's latest clarification, and Page04's role as a transition-style page does not block restoring the five material cards.
