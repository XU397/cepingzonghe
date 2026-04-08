# GRADE-4 LEGACY MODULE KNOWLEDGE BASE

## OVERVIEW

Legacy module implementation for train-ticket assessment. Remains route-compatible while selective logic migrates to shared utilities/submodule patterns.

## WHERE TO LOOK

| Task                   | Location                                      | Notes                      |
| ---------------------- | --------------------------------------------- | -------------------------- |
| Module entry           | src/modules/grade-4/index.jsx                 | module definition and boot |
| Core pages             | src/modules/grade-4/pages/\*                  | legacy page flow           |
| Shared module state    | src/modules/grade-4/context/Grade4Context.jsx | module-local state         |
| Interactive components | src/modules/grade-4/components/\*             | map/timeline/controls      |

## CONVENTIONS

- Keep route and resume behavior stable for backend URL contracts.
- Favor incremental extraction to shared helpers rather than broad rewrites.
- Maintain existing page ordering semantics unless explicitly migrated.

## ANTI-PATTERNS

- Breaking `getInitialPage` compatibility.
- Forking shared submission conventions locally.
- Refactoring across unrelated pages during targeted bugfixes.

## QUICK CHECK

- Confirm page resume still lands on expected grade-4 page IDs.
- Keep legacy route URL and module definition fields backward compatible.
- Use shared submission/timer utilities before adding new local helpers.
