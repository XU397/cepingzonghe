## Context

This design implements the cp side of the cross-repo requirement:

- [Requirement brief](D:/myproject/assessment-platform-kb/需求/2026-06-07-standard-submodule-construction-v1/00-requirement-brief.md)
- [cp repository requirement](D:/myproject/assessment-platform-kb/需求/2026-06-07-standard-submodule-construction-v1/repo-cp.md)
- [Approved design document](../../../docs/superpowers/specs/2026-06-07-standard-submodule-construction-design.md)
- Proposal: [proposal.md](proposal.md)
- Spec: [specs/standard-submodule-construction/spec.md](specs/standard-submodule-construction/spec.md)

The cp worktree is `D:\myproject\cp-banana-trace-standardization` on branch `2026-06-04-banana-trace-standardization`; it must later merge back to `D:\myproject\cp`, but this proposal must not modify `D:\myproject\cp`. Current repository facts checked during proposal:

- `docs/standard-submodule/` is absent.
- `src/submodules/g8-banana-browning-experiment/` exists and is the frontend golden reference.
- `docs/子模块数据上报规范/`, `src/shared/services/submission/trace/`, `docs/submodule-page-build-process.md`, and `docs/submission-spec.md` already exist and should be linked or summarized instead of copied wholesale.
- `AGENTS.md` does not yet contain a `STANDARD SUBMODULE SYNC PROTOCOL`.

The cross-repo brief recommends KB-first apply sequencing: KB canonical standard files, standard/profile identifiers, anchors, and manifest shape are upstream inputs for the cp handbook and manifest. cp proposal artifacts can be prepared in parallel with the KB proposal, but cp implementation must gate final mirror metadata on the KB standard package being available.

## Goals / Non-Goals

**Goals:**

- Add a cp-local implementation handbook package under `docs/standard-submodule/` that makes the KB canonical standard executable for frontend agents.
- Define cp guidance for standard Flow submodule structure, mapping, context, pages, trace, MarkObject submission, and test expectations.
- Add a science inquiry experiment profile handbook that uses `g8-banana-browning-experiment` as the golden reference without duplicating every implementation detail.
- Add copyable templates for page L0/L1 modeling, L2 event matrices, registry planning, acceptance cases, and review checklist.
- Add `standard-sync-manifest.md` with machine-readable frontmatter for standard/profile identifiers, sync categories, mirror metadata, golden reference commit, branch completion fields, and future mainline merge fields.
- Update `AGENTS.md` so future cp agents know when KB standard coordination is required.
- Use documentation/manual guardrails in v1.0 and leave automated `check:standard-sync` as a future Phase 2 item.

**Non-Goals:**

- Do not change runtime code, submission logic, trace logger behavior, backend tagging behavior, admin UI/API, or xspj-service.
- Do not modify `D:\myproject\cp` directly.
- Do not make cp generate L3 labels, HMM/Viterbi observations, sequence JSON, L4 features, scoring data, or ability judgments.
- Do not duplicate the full KB canonical standard body inside cp docs.
- Do not implement full CI enforcement or a new `check:standard-sync` script in v1.0 unless a later approved change explicitly scopes it.
- Do not deeply define a questionnaire profile in this version.

## Decisions

### Decision 1: cp handbook is implementation-local, not canonical

The cp package will state that the KB standard is canonical and cp docs are implementation handbooks. Canonical-only topics such as L0/L1/L2 concept definitions, cross-repo responsibility boundaries, and standard version lifecycle will be linked to KB rather than copied in full.

**Rationale:** The requirement explicitly prevents two independent standard definitions. Keeping cp implementation-local avoids drift while still helping frontend agents act on the standard.

**Alternative considered:** Copy the entire KB standard into cp. This was rejected because it creates an immediate drift surface and violates the KB/cp responsibility split.

### Decision 2: Use the design document package shape directly

Apply will create:

```text
docs/standard-submodule/
  README.md
  frontend-implementation-handbook.md
  science-inquiry-experiment-handbook.md
  standard-sync-manifest.md
  templates/
    page-l0-l1-matrix.md
    l2-event-matrix.md
    field-content-registry.md
    acceptance-case.md
    review-checklist.md
  examples/
    g8-banana-browning-experiment.md
```

**Rationale:** This structure matches the approved design and repo-cp acceptance criteria, and separates navigation, frontend implementation guidance, profile guidance, templates, example, and sync metadata.

**Alternative considered:** Fold all guidance into existing docs such as `docs/submodule-page-build-process.md` or `docs/submission-spec.md`. This was rejected because those docs are broader historical/project references and would make standard sync boundaries harder to audit.

### Decision 3: Keep v1.0 validation as manual/documentation guardrails

The apply tasks will verify file existence, required links, frontmatter, manifest fields, placeholder/mojibake/control-character absence, and no unintended runtime changes. Existing commands such as `npm run lint`, `npm run lint:submission`, `npm run test:submission-format`, and `npm run test:submission` may be listed as optional regression checks if implementation touches no code, but v1.0 does not add a new script.

**Rationale:** The requirement says full CI enforcement is not required in v1.0 unless the repo-local design scopes it in. A documentation-first pass reduces implementation risk and avoids creating a brittle checker before the KB manifest is finalized.

**Alternative considered:** Add `check:standard-sync` now. This was rejected for v1.0 because KB canonical paths, anchors, and content hashes are the dependency that should stabilize first; the script remains a future Phase 2 guardrail.

### Decision 4: Manifest frontmatter is the machine-readable sync source

`docs/standard-submodule/standard-sync-manifest.md` will use YAML frontmatter for:

- `standard_id: standard-submodule`
- `standard_version: v1.0`
- `profile_id: science-inquiry-experiment`
- `profile_version: v1.0`
- canonical KB source metadata
- cp handbook metadata
- sync policy buckets
- `mirrors[]` entries with canonical/local path, anchor, content hash, mirror policy, last verified timestamp, and verifying change-id
- golden reference, initial/approved design references as applicable, branch completion, and future mainline merge fields

**Rationale:** Machine-readable frontmatter enables later lightweight validation without forcing a script into v1.0.

**Alternative considered:** Store sync metadata only in prose. This was rejected because prose cannot reliably support later drift detection or closeout auditing.

### Decision 5: Mirror only short summaries with version metadata

cp may mirror summaries for event minimum requirements, science inquiry page types, and acceptance/review checklist content. It must link rather than copy canonical definitions for L0/L1/L2 concepts, cross-repo responsibilities, and standard lifecycle.

**Rationale:** This follows the approved synchronization policy and gives agents useful local checklists while preserving KB authority.

**Alternative considered:** Avoid all mirrored summaries. This was rejected because agents working in cp need local, copyable operational guidance and templates.

### Decision 6: AGENTS.md gets navigation/process rules only

`AGENTS.md` will gain a `STANDARD SUBMODULE SYNC PROTOCOL` that tells future agents when to read the KB standard and cp manifest, when to create or use a KB requirement/change-id, and when to update the cp handbook or manifest. It will not copy standard body text.

**Rationale:** `AGENTS.md` is the right place for agent workflow rules, but not for canonical standard content.

**Alternative considered:** Put all workflow rules only inside `docs/standard-submodule/README.md`. This was rejected because AGENTS instructions are read first by repository agents and must route standard-sensitive work early.

## Sequencing and Dependency Gates

**Can run in parallel with KB proposal:**

- cp OpenSpec proposal/design/specs/tasks creation.
- Current cp fact discovery and local impact analysis.
- Drafting the intended cp file tree, validation strategy, and task breakdown.

**Should wait for KB standard package before cp apply finalization:**

- Final canonical KB paths and anchors in `standard-sync-manifest.md`.
- Canonical content hashes and KB manifest alignment.
- `mirrors[]` `canonical_commit`, `canonical_content_hash`, `last_verified_at`, and `verified_by_change_id` values.
- Any mirrored summary text that depends on the final KB standard wording.
- Repo-result writeback that claims KB/cp manifest alignment.

**May be drafted during cp apply if KB is still pending, but must not close with unresolved final fields:**

- Local-only handbook sections such as cp code paths, test commands, and template layout.
- `AGENTS.md` protocol text that references the KB requirement and states KB is canonical.
- Placeholder manifest fields explicitly marked `pending` while waiting for the KB package.

## Risks / Trade-offs

- [Risk] cp docs accidentally become a second canonical standard -> Mitigation: state KB authority in `README.md`, handbook intro, manifest, and `AGENTS.md`; link canonical-only topics instead of copying them.
- [Risk] cp apply starts before KB canonical anchors/hashes exist -> Mitigation: keep final manifest mirror metadata as a dependency gate and block repo-result writeback until alignment is verified.
- [Risk] The banana example duplicates implementation details that drift from code -> Mitigation: summarize representative page types and link `src/submodules/g8-banana-browning-experiment/`, trace contracts, and acceptance fixtures instead of restating everything.
- [Risk] Documentation-only validation misses syntax or encoding issues -> Mitigation: include explicit file existence, frontmatter, placeholder, mojibake, control-character, and link checks in tasks.
- [Risk] Future agents mistake branch completion for mainline merge completion -> Mitigation: manifest separates golden reference, initial/approved design, branch completion, mainline merge status, and mainline merge commit.

## Migration Plan

1. Wait for proposal approval and KB standard package readiness before applying final cp mirror metadata.
2. Create the `docs/standard-submodule/` package and local-only cp handbook sections.
3. Add or finalize manifest frontmatter using KB standard/profile identifiers and canonical paths.
4. Add `STANDARD SUBMODULE SYNC PROTOCOL` to `AGENTS.md`.
5. Run documentation validation and any agreed existing regression commands.
6. After implementation/archive, write only the cp repo-result requested by the cross-repo requirement.
7. After this branch is merged into `D:\myproject\cp`, update mainline merge fields through a follow-up closeout/update; do not reuse the golden reference commit as the mainline merge commit.

Rollback is documentation-only: remove the newly added `docs/standard-submodule/` package and the `AGENTS.md` protocol section before merge. No runtime rollback is expected because runtime code is out of scope.

## Open Questions / Pending Confirmations

- KB canonical standard paths, anchors, content hashes, and KB manifest fields must be finalized before cp manifest alignment can be complete.
- `branch_completion_commit` must remain pending until cp implementation completes; `mainline_merge_commit` must remain pending until this branch merges into `D:\myproject\cp`.
- The design document records an initial design document commit `a79c60388131f0f3d68d290ad9fd01fa451d25b4`, while the requirement brief records the current approved design commit `ce60fd3`; apply should record these as distinct fields or notes rather than collapse them.
- `check:standard-sync` is treated as a future Phase 2 guardrail in this proposal; creating it now would require a separate approval or an explicit scope change.
