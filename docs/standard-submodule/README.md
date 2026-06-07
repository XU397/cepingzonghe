---
title: cp standard submodule implementation handbook
type: documentation
status: verified
source: design
last_verified: 2026-06-07
standard_id: standard-submodule
standard_version: v1.0
profile_id: science-inquiry-experiment
profile_version: v1.0
source_refs:
  - 'D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\00-requirement-brief.md'
  - 'D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\repo-cp.md'
  - 'D:\myproject\cp-banana-trace-standardization\docs\superpowers\specs\2026-06-07-standard-submodule-construction-design.md'
---

# cp Standard Submodule Implementation Handbook

This package is the cp frontend implementation handbook for standard Flow submodules. It is not the canonical standard.

Canonical source:

- KB package: `D:\myproject\assessment-platform-kb\标准\子模块构建标准`
- Requirement brief: `D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\00-requirement-brief.md`
- cp requirement: `D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\repo-cp.md`
- Approved design: `D:\myproject\cp-banana-trace-standardization\docs\superpowers\specs\2026-06-07-standard-submodule-construction-design.md`

If this package conflicts with the KB standard, use the KB standard as canonical and record a follow-up to repair the cp handbook.

## Package Layout

- `frontend-implementation-handbook.md` - cp-specific implementation guidance for mapping, context, pages, frame wiring, trace, submission, and tests.
- `science-inquiry-experiment-handbook.md` - cp implementation guidance for `science-inquiry-experiment` `v1.0`.
- `standard-sync-manifest.md` - machine-readable sync metadata for KB/cp standard alignment.
- `templates/page-l0-l1-matrix.md` - page fact and behavior planning template.
- `templates/l2-event-matrix.md` - L2 trace event planning template.
- `templates/field-content-registry.md` - content/field registry planning template.
- `templates/acceptance-case.md` - acceptance case planning template.
- `templates/review-checklist.md` - standard submodule review checklist.
- `examples/g8-banana-browning-experiment.md` - golden reference summary for the banana implementation.

## How to Use This Package

1. Read the KB canonical standard first.
2. Read `standard-sync-manifest.md` and confirm `standard_id`, `standard_version`, `profile_id`, and `profile_version`.
3. Use `frontend-implementation-handbook.md` for cp code paths and implementation responsibilities.
4. Use `science-inquiry-experiment-handbook.md` for experiment profile page families and trace expectations.
5. Copy the templates into a requirement or submodule working area before building page slices.
6. Use `examples/g8-banana-browning-experiment.md` to navigate the golden implementation without copying every banana detail into a new submodule.

## Sync Categories

- Canonical only: concept definitions, cross-repo responsibility boundaries, standard version lifecycle, and standard semantics. Link to KB; do not copy the full body here.
- Mirrored with version: short summaries such as event minimum requirements, science inquiry page types, and review checklist items. These require source/version metadata in `standard-sync-manifest.md`.
- Implementation local: cp code paths, cp test commands, template layout, and local caveats. cp owns these sections.

## Current Pending Confirmations

- No runtime-code conflict was found while creating this handbook package.
- The KB standard package exists, but the KB standard files are not committed yet; `standard-sync-manifest.md` keeps `canonical_commit` as an explicit pending gate.
- The design history has two distinct references: initial design commit `a79c60388131f0f3d68d290ad9fd01fa451d25b4` and approved design commit `ce60fd3`.
- `branch_completion_commit` remains pending until this cp apply work is committed.
- `mainline_merge_commit` remains pending until this branch merges to `D:\myproject\cp`.

## Cross-Repo Handoff After Archive

After this OpenSpec change is implemented and archived, use the return prompt from:

```text
D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\return-prompts.md
```

Write only the cp result file:

```text
D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\repo-results\cp.md
```

The repo result must include:

- OpenSpec archive path.
- cp commit hash.
- Completed cp docs/protocol files.
- Validation results.
- Unresolved KB dependency notes, especially pending KB canonical commit fields.
- Suggested long-term KB updates for the main closeout session.

## Validation

For documentation-only updates, verify:

- All files in this package exist.
- `standard-sync-manifest.md` frontmatter parses as YAML.
- Source links point to the requirement brief, repo-cp requirement, approved design, and KB canonical package.
- Mirrored sections have manifest entries with canonical/local paths, anchors, hash fields, mirror policy, verification time, and change-id fields.
- No runtime code or `D:\myproject\cp` files are changed by this handbook update.

If runtime code, submission, or trace contracts are touched unexpectedly, run the relevant existing checks such as `npm run lint`, `npm run lint:submission`, `npm run test:submission-format`, and `npm run test:submission`.
