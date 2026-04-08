# SHARED LAYER KNOWLEDGE BASE

## OVERVIEW

`src/shared` is the integration spine: APIs, submission normalization, timers, storage keys, and reusable UI/types.

## WHERE TO LOOK

| Task                   | Location                                            | Notes                                               |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------- |
| API clients/endpoints  | src/shared/services/api/\*                          | `/stu/*` conventions and flow APIs                  |
| Submission hook        | src/shared/services/submission/usePageSubmission.js | normalization, retries, flow_context, lifecycle ops |
| Submission schema      | src/shared/services/submission/schema.ts            | payload invariants enforced in tests and CI         |
| Timer behavior         | src/shared/services/timers/\*                       | scoped timer lifecycle                              |
| Page frame integration | src/shared/ui/PageFrame/AssessmentPageFrame.jsx     | submission context + page lifecycle events          |

## CONVENTIONS

- Shared services define canonical behavior; feature code should compose, not fork, these implementations.
- Keep `pageNumber`, `targetElement`, and event-type conventions in one place (submission + pageMapping helpers).
- Preserve backward compatibility in shared APIs used by both modules and submodules.

## ANTI-PATTERNS

- Direct per-feature API wrappers duplicating `apiClient` behavior.
- Feature-local schema variants that diverge from `schema.ts`.
- Silent retries/empty catches that hide submission integrity failures.

## QUICK CHECK

- Treat shared submission schema as contract; update tests with schema edits.
- Preserve compatibility for both legacy modules and modern submodules.
- Keep endpoint and payload helpers centralized in shared services.
