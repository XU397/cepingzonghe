# G8 DRONE IMAGING SUBMODULE KNOWLEDGE BASE

## OVERVIEW

TypeScript-heavy submodule with page-map driven flow navigation and shared submission integration.

## WHERE TO LOOK

| Task                 | Location                                      | Notes                                |
| -------------------- | --------------------------------------------- | ------------------------------------ |
| Submodule definition | src/submodules/g8-drone-imaging/index.ts      | exported definition used by registry |
| Main component       | src/submodules/g8-drone-imaging/Component.tsx | page routing + submission hooks      |
| Page mapping         | src/submodules/g8-drone-imaging/mapping.ts    | page ID, step/page translation       |
| Tests/snapshots      | src/submodules/g8-drone-imaging/**tests**/\*  | format and lifecycle verification    |

## CONVENTIONS

- Keep page transitions and numbering centralized in `mapping.ts`.
- Use shared submission APIs (`usePageSubmission`, frame context) for all submit paths.
- Respect flow context injection (`flow_context`) for auditability.

## ANTI-PATTERNS

- Side-channel submit logic outside the unified submission hook.
- Ad-hoc operation event names that bypass `EventTypes`.
- Diverging from existing snapshot-driven submission format tests.

## QUICK CHECK

- Keep `mapping.ts` authoritative for page/number translation.
- Validate snapshot tests when operation or answer fields change.
- Confirm flow-context operation is present in submit payloads.
