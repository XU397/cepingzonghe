# SUBMODULES KNOWLEDGE BASE

## OVERVIEW

`src/submodules` hosts reusable flow steps. Submodules are loaded via `submoduleRegistry` and executed under `FlowModule` orchestration.

## WHERE TO LOOK

| Task                    | Location                            | Notes                                       |
| ----------------------- | ----------------------------------- | ------------------------------------------- |
| Registry and validation | src/submodules/registry.ts          | required fields + dynamic registration      |
| Type contract           | src/shared/types/flow.ts            | `SubmoduleDefinition` shape                 |
| Flow integration points | src/flows/FlowModule.jsx            | `onComplete`, `onTimeout`, progress updates |
| Example mapping helper  | src/submodules/\_example/mapping.ts | composite page mapping patterns             |

## CONVENTIONS

- Submodule must define: `submoduleId`, `Component`, `getInitialPage`, `getTotalSteps`, `getNavigationMode`.
- Integrate submit/log operations through shared frame/submission layer.
- Keep migration-friendly boundaries: submodule internals should not leak into legacy modules.

## ANTI-PATTERNS

- Direct network submission from submodule pages.
- Hard-coded page prefixes instead of shared mapping helpers.
- Missing lifecycle hooks for completion/timeout wiring in flow context.

## QUICK CHECK

- Ensure registry validation passes required submodule fields.
- Verify each submodule emits flow-compatible completion/timeout signals.
- Keep mapping and submission logic centralized, not duplicated per page.
