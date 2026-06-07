## Why

The banana trace standardization work created a reliable Flow submodule implementation pattern, but the reusable knowledge is still split across code, trace contracts, acceptance fixtures, historical OpenSpec artifacts, cp docs, and the cross-repo KB. Future Flow submodules need a cp-local implementation handbook that executes the KB canonical standard without becoming a second canonical source.

Source inputs:
- [Requirement brief](D:/myproject/assessment-platform-kb/需求/2026-06-07-standard-submodule-construction-v1/00-requirement-brief.md)
- [cp repository requirement](D:/myproject/assessment-platform-kb/需求/2026-06-07-standard-submodule-construction-v1/repo-cp.md)
- [Approved design document](../../../docs/superpowers/specs/2026-06-07-standard-submodule-construction-design.md)

## What Changes

- Add a cp implementation handbook package under `docs/standard-submodule/` with:
  - `README.md`
  - `frontend-implementation-handbook.md`
  - `science-inquiry-experiment-handbook.md`
  - `standard-sync-manifest.md`
  - templates for page L0/L1 modeling, L2 events, field/content registry planning, acceptance cases, and review checklist
  - `examples/g8-banana-browning-experiment.md` as the golden example summary
- Update cp `AGENTS.md` with a `STANDARD SUBMODULE SYNC PROTOCOL` so future agents know when to read the KB standard, cp manifest, trace contracts, and handbooks.
- Establish the cp manifest as the auditable implementation declaration for `standard-submodule` `v1.0` and `science-inquiry-experiment` `v1.0`, including mirror metadata and separate golden-reference, branch-completion, and future mainline-merge fields.
- Keep v1.0 documentation/manual-guardrail focused: do not add runtime code, backend tagging behavior, admin/xspj changes, or a full `check:standard-sync` CI gate in this proposal.
- Record dependency gates: cp proposal work can proceed in parallel with the KB proposal, but cp apply must wait for finalized KB canonical paths, versions, and manifest shape before finalizing cp handbook mirror metadata.

## Capabilities

### New Capabilities
- `standard-submodule-construction`: Defines the cp-visible standard submodule construction handbook package, synchronization protocol, manifest requirements, template set, banana golden-example expectations, dependency gates, and validation criteria for future Flow submodule builds.

### Modified Capabilities
- None. Existing runtime capabilities such as `submission`, `flow`, `frontend-structure`, and `banana-trace-l2-compliance` are referenced as implementation context but their runtime requirements are not changed by this documentation/manual-guardrail proposal.

## Impact

- Affected repository: cp worktree at `D:\myproject\cp-banana-trace-standardization` only; do not modify `D:\myproject\cp`.
- Affected files during apply:
  - `docs/standard-submodule/**`
  - `AGENTS.md`
- Current code facts:
  - `docs/standard-submodule/` does not exist yet.
  - `src/submodules/g8-banana-browning-experiment/` exists and is the golden frontend reference.
  - `docs/子模块数据上报规范/`, `src/shared/services/submission/trace/`, `docs/submodule-page-build-process.md`, and `docs/submission-spec.md` exist and should be referenced, not rewritten wholesale.
  - Available repo-local validation commands include `npm run lint`, `npm run lint:submission`, `npm run test:submission-format`, and `npm run test:submission`.
- Cross-repo dependency:
  - KB standard files, canonical anchors, manifest fields, and canonical content hashes are upstream inputs for cp apply.
  - If KB and cp guidance conflict, KB is canonical; record the conflict and pending confirmation instead of expanding cp scope.
