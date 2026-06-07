## Why

The banana trace v2.2 frontend now captures page lifecycle, text input, simulation, and table interactions, but several material-reading and instruction-reading areas are still invisible to trace data. This leaves gaps in evidence for whether students inspected key page content before acting.

## What Changes

- Register additional stable banana content IDs for Page03 material cards, Page05 idea guidance text, Page06 method text/image materials, and Page12 decision prompt text.
- Emit modal lifecycle events for all Page03 material cards: `OPEN_MODAL` on card open and `CLOSE_MODAL` with `dwell_ms` on close.
- Emit aggregated `CONTENT_ACTIVATE` events for Page05, Page06, and Page12 instructional/material content when hover/touch/click activation reaches the effective threshold.
- Reuse the Page02-style content activation policy: record stable content block IDs and effective activation metadata, not raw high-frequency mouse movement.
- Add tests and contract sync guards so new content IDs and emitted events stay aligned with v2.2 runtime/docs contracts.

## Capabilities

### New Capabilities
- `banana-content-activation-trace`: Captures banana material and instruction content activation using stable content IDs and low-noise L2 trace events.

### Modified Capabilities
- None.

## Impact

- Affected frontend files under `src/submodules/g8-banana-browning-experiment/`.
- Affected trace contracts under `src/shared/services/submission/trace/contracts/` and mirrored docs under `docs/子模块数据上报规范/engineering_contracts/`.
- Affected tests under `src/submodules/g8-banana-browning-experiment/__tests__/` and shared trace contract tests.
- No backend API shape change; existing `operationList` event types are reused.
