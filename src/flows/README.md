Flows coordinate multi-step interactions and cross-page logic.

Purpose
- Encapsulate orchestration, routing flows, and progression state.
- Independent from page implementations; reuse across submodules.

Notes
- Reference shared services via `@shared/services`.
- Keep flow-specific UI under `@shared/ui` when reusable.
