## 1. Preflight and Dependency Gates

- [x] 1.1 Re-read [00-requirement-brief.md](D:/myproject/assessment-platform-kb/需求/2026-06-07-standard-submodule-construction-v1/00-requirement-brief.md), [repo-cp.md](D:/myproject/assessment-platform-kb/需求/2026-06-07-standard-submodule-construction-v1/repo-cp.md), and [the approved design document](../../../docs/superpowers/specs/2026-06-07-standard-submodule-construction-design.md) before editing cp docs.
- [x] 1.2 Confirm the apply session is in `D:\myproject\cp-banana-trace-standardization`, not `D:\myproject\cp`, and record current branch/head for manifest fields.
- [x] 1.3 Verify whether the KB canonical standard package is ready; if it is not ready, limit cp work to local drafts and keep final mirror metadata gated.
- [x] 1.4 Confirm KB standard/profile identifiers, canonical paths, anchors, and KB manifest shape before finalizing cp `standard-sync-manifest.md`.
- [x] 1.5 Record any conflict between current cp facts and the requirement package as a pending confirmation rather than expanding runtime scope.

## 2. Handbook Package

- [x] 2.1 Create `docs/standard-submodule/README.md` as the cp entry point that states KB is canonical, links the three source inputs, and explains the package layout.
- [x] 2.2 Create `docs/standard-submodule/frontend-implementation-handbook.md` covering cp mapping, context, pages, Component, trace, MarkObject submission, and test responsibilities with links to existing cp source/docs.
- [x] 2.3 Create `docs/standard-submodule/science-inquiry-experiment-handbook.md` for `science-inquiry-experiment` `v1.0`, including representative page families and frontend trace expectations.
- [x] 2.4 Create `docs/standard-submodule/examples/g8-banana-browning-experiment.md` as a golden example summary referencing `src/submodules/g8-banana-browning-experiment/` and the golden snapshot without duplicating every implementation detail.
- [x] 2.5 Ensure handbook sections distinguish canonical-only KB definitions, mirrored-with-version summaries, and cp implementation-local guidance.

## 3. Templates

- [x] 3.1 Create `docs/standard-submodule/templates/page-l0-l1-matrix.md` with page identity, initial visible content, L0 content/items, L0 fields, and L1 behavior planning fields.
- [x] 3.2 Create `docs/standard-submodule/templates/l2-event-matrix.md` with event type, emission condition, target IDs, required metadata, backend usage, and tests.
- [x] 3.3 Create `docs/standard-submodule/templates/field-content-registry.md` with ID, type, page, label, required flag, registry version, and notes fields.
- [x] 3.4 Create `docs/standard-submodule/templates/acceptance-case.md` with standard/profile versions, page ID, required events, backend validation, backend-only L2-to-L3 scope, diagnostics, and fixtures.
- [x] 3.5 Create `docs/standard-submodule/templates/review-checklist.md` with L0/L1/L2, registry, start-page metadata, `PAGE_IDLE`, `SUBMIT_ATTEMPT`, fixture authority, sync coverage, and clean-checkout test checks.

## 4. Manifest and Agent Protocol

- [x] 4.1 Create `docs/standard-submodule/standard-sync-manifest.md` with machine-readable YAML frontmatter for standard/profile identifiers, canonical source, frontend handbook, sync policy, mirrors, last verification, and worktree status.
- [x] 4.2 Populate manifest mirror entries with canonical/local path, anchor, content hash or explicit pending marker, mirror policy, verification time or explicit pending marker, and verifying change-id.
- [x] 4.3 Record golden reference commit `327e164f62d1e1fda76b34ac585e78ecf03f65af`, current approved design commit `ce60fd3`, branch completion placeholder, mainline merge status, and mainline merge commit placeholder as distinct values.
- [x] 4.4 Update `AGENTS.md` with `STANDARD SUBMODULE SYNC PROTOCOL` trigger conditions, KB requirement/change-id rules, cp-only implementation-detail rules, and worktree-to-main merge reminder.
- [x] 4.5 Ensure `AGENTS.md` remains navigation/process guidance and does not copy the canonical standard body.

## 5. Validation

- [x] 5.1 Verify the final diff touches only expected cp apply targets such as `docs/standard-submodule/**` and `AGENTS.md`; do not touch runtime code or `D:\myproject\cp`.
- [x] 5.2 Verify all required handbook, template, example, and manifest files exist.
- [x] 5.3 Verify source links to `00-requirement-brief.md`, `repo-cp.md`, and the approved design document are present in the handbook package and manifest where relevant.
- [x] 5.4 Verify manifest frontmatter parses as YAML and contains all required top-level fields and mirror metadata fields.
- [x] 5.5 Run placeholder, mojibake, and control-character checks; allow only intentional manifest pending fields for branch/mainline or not-yet-finalized KB mirror metadata.
- [x] 5.6 Run `openspec validate add-standard-submodule-construction-v1 --type change --strict` and `openspec status --change add-standard-submodule-construction-v1`.
- [x] 5.7 If any code or submission/trace contracts are unexpectedly touched, run the relevant existing regression commands such as `npm run lint`, `npm run lint:submission`, `npm run test:submission-format`, and `npm run test:submission`; otherwise document why documentation checks are sufficient.

## 6. Completion and Cross-Repo Handoff

- [x] 6.1 Before claiming cp completion, confirm KB and cp manifests share `standard_id`, `standard_version`, `profile_id`, and `profile_version`.
- [x] 6.2 Keep `branch_completion_commit` pending until the cp implementation commit exists, and keep `mainline_merge_commit` pending until this branch merges into `D:\myproject\cp`.
- [x] 6.3 Document that post-archive repo-result writeback must use the requirement return prompt and write only `D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\repo-results\cp.md`.
- [x] 6.4 Document that the repo result must include archive path, commit hash, completed cp docs/protocol files, validation results, unresolved KB dependency notes, and suggested long-term KB updates.
