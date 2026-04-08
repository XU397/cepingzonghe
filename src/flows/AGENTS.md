# FLOWS KNOWLEDGE BASE

## OVERVIEW

Flow runtime composes submodules into multi-step assessments with progress restore, transition/completion handling, and timer/session coordination.

## WHERE TO LOOK

| Task                 | Location                                   | Notes                                              |
| -------------------- | ------------------------------------------ | -------------------------------------------------- |
| Flow entry component | src/flows/FlowModule.jsx                   | state machine, navigation guards, completion logic |
| Orchestrator         | src/flows/orchestrator/FlowOrchestrator.ts | definition/progress load, normalize, cache         |
| Context bridge       | src/flows/FlowAppContextBridge.jsx         | AppContext interop and beforeNavigate hooks        |
| Provider             | src/flows/context/FlowProvider.jsx         | flow runtime context                               |

## CONVENTIONS

- Route contract: `/flow/:flowId`.
- Progress sentinel `modulePageNum = 999` indicates completion state.
- Flow progress sync must be resilient (queue + retry path) and should not block local UX.
- Timers are step/scoped; hidden pages should not accidentally start legacy timer state.

## ANTI-PATTERNS

- Treating disposed orchestrators as reusable instances.
- Coupling flow step transition logic to specific submodule page IDs.
- Breaking flow-context operation injection expected by shared submission pipeline.

## QUICK CHECK

- Validate completion sentinel (`999`) behavior on restore and completion paths.
- Keep orchestrator disposal and reload paths idempotent under remounts.
- Ensure progress sync queue/retry remains non-blocking for user navigation.
