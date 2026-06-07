## 1. Contract And Trace Helper

- [x] 1.1 Add all new Page03, Page05, Page06, and Page12 content IDs to runtime and docs banana v2.2 content registries.
- [x] 1.2 Recalculate content registry hash literals and update all tests/fixtures that assert the content registry hash.
- [x] 1.3 Add a reusable low-noise banana content activation helper for hover/touch activation threshold handling.

## 2. Page Runtime Implementation

- [x] 2.1 Restore Page03 material reading UI to five material cards/options while preserving factor-selection behavior.
- [x] 2.2 Wire Page03 material card open/close to `OPEN_MODAL` and `CLOSE_MODAL` with dwell duration for every card.
- [x] 2.3 Wire Page05 guidance text above the three plan inputs to aggregated `CONTENT_ACTIVATE`.
- [x] 2.4 Wire Page06 method text/image material blocks to individually identifiable aggregated `CONTENT_ACTIVATE`.
- [x] 2.5 Wire Page12 top decision guidance text to aggregated `CONTENT_ACTIVATE`.

## 3. Tests And Verification

- [x] 3.1 Add/update page trace tests for Page03 modal open/close and Page05/Page06/Page12 activation threshold behavior.
- [x] 3.2 Add/update contract sync tests so all newly emitted content IDs are registry-valid and docs/runtime mirrors stay synchronized.
- [x] 3.3 Run OpenSpec strict validation and focused trace/submission test suites.
- [x] 3.4 Run required broader verification (`npm run lint:submission`, `npm run test:submission-format`, `npm run test:submission`, and build if feasible).
- [x] 3.5 Update project memory and graphify code graph after code changes.
