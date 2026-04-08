# MODULES KNOWLEDGE BASE

## OVERVIEW

`src/modules` is the legacy module system. It still drives non-flow routes and wraps older grade implementations.

## WHERE TO LOOK

| Task                  | Location                                                      | Notes                             |
| --------------------- | ------------------------------------------------------------- | --------------------------------- |
| Module registration   | src/modules/ModuleRegistry.js                                 | dynamic imports + URL mapping     |
| Runtime module render | src/modules/ModuleRouter.jsx                                  | initialization and fallback logic |
| Error fallback        | src/modules/ErrorBoundary.jsx, src/modules/ModuleFallback.jsx | runtime resilience                |
| Perf tuning           | src/modules/config/performance.js                             | legacy router performance knobs   |

## CONVENTIONS

- Module definitions must provide: `moduleId`, `displayName`, `url`, `version`, `ModuleComponent`, `getInitialPage`.
- URLs are canonical contracts with backend login response.
- Keep wrapper compatibility for legacy grade modules; avoid breaking existing route contracts.

## ANTI-PATTERNS

- Registering duplicate URLs without explicit migration intent.
- Moving module-specific reusable code into `modules/` when it belongs in `src/shared/`.
- Treating `/flow/*` behavior as legacy module behavior; flow is separate runtime.

## QUICK CHECK

- Keep `ModuleRegistry.initialize()` registration order deterministic.
- Verify fallback behavior when backend `url` has no mapping.
- For cross-cutting behavior, prefer shared adapters over legacy-page rewrites.
