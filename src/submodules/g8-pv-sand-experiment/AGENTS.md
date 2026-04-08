# G8 PV SAND SUBMODULE KNOWLEDGE BASE

## OVERVIEW

Flow-oriented TypeScript submodule with explicit mapping and submission format coverage.

## WHERE TO LOOK

| Task                   | Location                                           | Notes                                    |
| ---------------------- | -------------------------------------------------- | ---------------------------------------- |
| Submodule definition   | src/submodules/g8-pv-sand-experiment/index.ts      | registry-facing contract                 |
| Main runtime component | src/submodules/g8-pv-sand-experiment/Component.tsx | page orchestration and interaction state |
| Mapping logic          | src/submodules/g8-pv-sand-experiment/mapping.ts    | canonical page/step translation          |
| Submission tests       | src/submodules/g8-pv-sand-experiment/**tests**/\*  | snapshot + format assertions             |

## CONVENTIONS

- Keep submission payload shape aligned with shared submission schema.
- Route page metadata through mapping helpers; avoid per-page duplicated number logic.
- Preserve existing test fixtures when changing operation/answer semantics.

## ANTI-PATTERNS

- Introducing pageNumber variants outside `<stepIndex>.<subPageNum>` conventions.
- Direct fetch calls for marks.
- Skipping flow-context lifecycle events in operation list generation.

## QUICK CHECK

- Keep mapping outputs aligned with submission page-number format.
- Re-run format + snapshot tests after payload or event changes.
- Ensure frame/hook integration remains the only submit path.
