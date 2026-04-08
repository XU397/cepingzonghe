# G8 MIKANIA SUBMODULE KNOWLEDGE BASE

## OVERVIEW

JS/TS mixed submodule with dedicated mapping and strong integration to shared frame/submission behavior.

## WHERE TO LOOK

| Task                     | Location                                                   | Notes                                 |
| ------------------------ | ---------------------------------------------------------- | ------------------------------------- |
| Submodule entry          | src/submodules/g8-mikania-experiment/index.js              | exported definition and wiring        |
| Mapping                  | src/submodules/g8-mikania-experiment/mapping.ts            | page map, timers, page-number helpers |
| Runtime pages/components | src/submodules/g8-mikania-experiment/pages/_, components/_ | user interaction flow                 |
| Regression tests         | src/submodules/g8-mikania-experiment/**tests**/\*          | submit and flow invariants            |

## CONVENTIONS

- Keep page-number transformation in mapping helpers.
- Use shared frame-driven submission lifecycle (`page_enter`, `next_click`/`auto_submit`, `page_exit`).
- Maintain compatibility with flow progress restore expectations.

## ANTI-PATTERNS

- Writing custom mark payload builders that bypass shared normalization.
- Mutating flow context shape ad-hoc.
- Replacing tested mapping behavior without corresponding test updates.

## QUICK CHECK

- Keep mapping utilities as single source of page-number behavior.
- Confirm submit lifecycle events remain complete and ordered.
- Update tests whenever mapping or payload semantics are touched.
