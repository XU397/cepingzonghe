# G7 TRACKING MODULE KNOWLEDGE BASE

## OVERVIEW

Legacy-style module with rich interaction pages; partially modernized by shared submission/timer primitives.

## WHERE TO LOOK

| Task                   | Location                                            | Notes                                 |
| ---------------------- | --------------------------------------------------- | ------------------------------------- |
| Module entry           | src/modules/grade-7-tracking/index.jsx              | module definition + exports           |
| Page mapping           | src/modules/grade-7-tracking/utils/pageMapping.js   | page ID/page number mapping           |
| Submission integration | src/modules/grade-7-tracking/hooks/useDataLogger.js | hooks into shared submission pipeline |
| Context state          | src/modules/grade-7-tracking/context/\*             | module-local state and transitions    |

## CONVENTIONS

- Prefer shared submission contracts (`usePageSubmission`) over local fetch wiring.
- Keep page-level behavior isolated in `pages/`; push reusable logic into `hooks/` or `utils/`.
- Maintain compatibility with module resume behavior (`getInitialPage` + page mapping).

## ANTI-PATTERNS

- Direct `/stu/saveHcMark` calls.
- Bypassing unified operation/answer normalization.
- Changing page numbering format away from composite flow-compatible conventions.

## QUICK CHECK

- Validate `useDataLogger` submit path still goes through shared services.
- Keep page mapping stable when changing page IDs or sequence.
- Re-run submission format tests after payload-shape changes.
