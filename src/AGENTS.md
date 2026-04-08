# SRC KNOWLEDGE BASE

## OVERVIEW

`src/` contains runtime application code. Architecture is hybrid: legacy module routing and modern flow/submodule runtime coexist.

## STRUCTURE

src/
|- app/ # shell + route composition
|- flows/ # flow runtime + orchestrator
|- modules/ # legacy module registry/router and modules
|- submodules/ # reusable flow-integrated submodules
|- shared/ # reusable services/ui/types
|- context/ # global app context/auth/session bridge
`- pages/ # legacy page implementations

## WHERE TO LOOK

| Task                   | Location                     | Notes                               |
| ---------------------- | ---------------------------- | ----------------------------------- |
| Entry render           | src/main.jsx                 | BrowserRouter + AppShell            |
| Route split            | src/app/AppShell.jsx         | `/flow/:flowId` bypasses StrictMode |
| Login/auth state       | src/context/AppContext.jsx   | localStorage + flow bridge data     |
| Flow sequencing        | src/flows/FlowModule.jsx     | orchestrates submodule lifecycle    |
| Legacy module dispatch | src/modules/ModuleRouter.jsx | module fallback path                |

## CONVENTIONS

- Use aliases from `vite.config` (`@`, `@app`, `@flows`, `@modules`, `@submodules`, `@shared`).
- Keep cross-cutting logic in `shared`; keep module-specific logic local to that module/submodule.
- Maintain submission invariants via shared hooks/services, not per-page ad-hoc implementations.

## ANTI-PATTERNS

- Importing module internals across module boundaries.
- Direct backend submission calls from pages/submodules.
- Re-implementing flow/page-number encoding where `pageMapping` helpers already exist.
