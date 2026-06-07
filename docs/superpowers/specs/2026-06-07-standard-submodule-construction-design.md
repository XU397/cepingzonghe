# Standard Submodule Construction Design

Date: 2026-06-07
Repository: `D:\myproject\cp-banana-trace-standardization`
Status: design candidate after user approval and review updates; implementation still requires explicit final approval and a new KB requirement/change-id before editing KB long-term standards or cp handbook files.

## Source Inputs

- User direction: use the G8 banana browning submodule as the golden reference for a reusable standard submodule construction system.
- Confirmed target shape: general submodule skeleton plus a detailed science inquiry experiment profile.
- Confirmed deliverable depth: documentation, templates, and synchronization guardrails.
- Confirmed documentation ownership: KB is the canonical standard; cp contains the frontend implementation handbook.
- Current frontend worktree: `D:\myproject\cp-banana-trace-standardization`, later to be merged back into `D:\myproject\cp`.
- Golden banana implementation snapshot: `327e164f62d1e1fda76b34ac585e78ecf03f65af`.
- Initial design document commit: `a79c60388131f0f3d68d290ad9fd01fa451d25b4`; any later review-fix commit must be recorded separately from the golden implementation snapshot and from the future mainline merge commit.
- Recent cross-repo closeout: `2026-06-06-banana-trace-page-idle-compliance` archived as complete in the KB.

## Problem

The banana trace standardization work produced a high-quality implementation pattern, but the pattern currently exists as project knowledge spread across code, trace contracts, acceptance fixtures, review fixes, OpenSpec artifacts, and KB closeout notes. Future submodule work needs a reusable standard that explains how to construct pages, model L0/L1/L2 behavior, submit MarkObject data, align frontend and backend contracts, and validate the result without drifting between the KB and cp repository docs.

Without a formal standard package, future submodules can repeat the same classes of defects found during banana review:

- Runtime contracts drift from authoritative engineering contracts.
- Page content IDs and field IDs do not map to registries.
- L0 page facts, L1 behavior semantics, and L2 reported facts are mixed together.
- Default visible content is mistaken for active reading evidence.
- `TEXT_CHANGE`, `TEXT_BLUR`, `PAGE_IDLE`, and `SUBMIT_ATTEMPT` boundaries are under-specified.
- Acceptance tests validate inline or stale fixtures instead of canonical contract examples.
- Frontend and backend documentation diverges because both sides copy standard text without a synchronization mechanism.

## Goals

- Establish `standard-submodule-v1.0` as the general construction standard for Flow submodules.
- Establish `science-inquiry-experiment-profile-v1.0` as the first detailed profile, using `g8-banana-browning-experiment` as the golden reference.
- Define a clear L0/L1/L2 model for page construction and trace reporting.
- Define MarkObject and submission expectations at the standard level while keeping implementation details in the cp handbook.
- Provide reusable templates for page modeling, L2 event matrices, registry planning, acceptance cases, and review checklists.
- Add a KB/cp synchronization model that prevents long-term drift.
- Add guidance to KB base docs and cp `AGENTS.md` so future agents know when and how to update standards.
- Preserve branch worktree reality: this cp work happens in `D:\myproject\cp-banana-trace-standardization` and must later merge to `D:\myproject\cp`.

## Non-Goals

- Do not implement the standard package in this design document.
- Do not modify `D:\myproject\cp` directly.
- Do not turn the frontend into a backend tagging engine; cp remains responsible for L0/L1/L2 facts and MarkObject submission, not L3/HMM/ability labels.
- Do not deeply specify questionnaire profile behavior in v1.0; reserve it for a later profile.
- Do not build the full `check:standard-sync` script in the first documentation-only pass unless a later implementation plan explicitly includes it.
- Do not copy the complete KB standard text into cp docs.

## Responsibility Boundaries

### Knowledge Base

The KB is the canonical source for submodule construction standards. It owns standard semantics, cross-repo boundaries, version lifecycle, and archived decision history. Standard semantic changes must go through a KB requirement/change-id.

### cp Frontend

The cp repository owns the frontend implementation handbook, templates, examples, page L0/L1/L2 artifacts, MarkObject generation, trace event generation, frontend contract copies, and frontend tests. cp docs explain how to implement the KB standard in this codebase; they are not the canonical standard source.

### assessment-platform-backend

The backend owns runtime contract loading, schema/registry validation, canonical hash policy, L2-to-L3 tagging, quality diagnostics, and backend acceptance fixtures. It consumes frontend L2 facts; it does not rely on cp docs as the source of contract truth.

### Research Specifications

Research documents define behavior semantics and tagging expectations. They inform engineering contracts but do not replace runtime event schemas, registries, fixtures, or backend validation.

### xspj-service

`xspj-service` is out of scope for this standard unless future evidence proves it participates in L2/L3 trace processing. It is not the L2-to-L3 algorithm backend for this work.

## Standard Package Shape

### KB Canonical Standard

Create or update the canonical standard package only under an approved KB requirement/change-id. Write long-term `标准/` files only when that requirement explicitly authorizes the long-term standard update:

```text
D:\myproject\assessment-platform-kb\标准\子模块构建标准\
  README.md
  standard-submodule-v1.0.md
  science-inquiry-experiment-profile-v1.0.md
  standard-sync-manifest.md
```

Recommended responsibilities:

- `README.md`: entry point, current standard versions, supported profiles, links to cp handbook.
- `standard-submodule-v1.0.md`: general Flow submodule construction standard, including submission, trace, test, and contract boundaries.
- `science-inquiry-experiment-profile-v1.0.md`: detailed science inquiry experiment profile, using banana as the golden reference.
- `standard-sync-manifest.md`: canonical mapping between KB standards, cp handbooks, mirrored sections, standard versions, commits, and merge status.

Future split candidates after v1.0 stabilizes:

```text
l0-l1-page-model-v1.0.md
l2-trace-reporting-v1.0.md
markobject-submission-v1.0.md
```

### cp Implementation Handbook

Create the frontend implementation package in the cp worktree:

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

Recommended responsibilities:

- `README.md`: cp entry point; explicitly states that KB is canonical.
- `frontend-implementation-handbook.md`: cp-specific mapping/context/pages/Component/trace/submission/tests implementation guide.
- `science-inquiry-experiment-handbook.md`: frontend implementation guide for the science inquiry experiment profile.
- `templates/*`: copyable working templates for future submodules.
- `examples/g8-banana-browning-experiment.md`: golden example summary for banana, without duplicating all implementation details.
- `standard-sync-manifest.md`: cp-local declaration of which KB standard version this handbook implements.

## L0/L1/L2 Model

Every standard page must be described through three distinct layers.

### L0: Page Facts

L0 records objective page facts: content, controls, fields, default visibility, active triggers, charts, tables, and required/optional fields. L0 does not mean the student has read, understood, or acted on anything.

Minimum L0 fields:

```text
page_id
legacy_page_id
page_type
page_index
page_title
main_instruction
initial_visible_content_ids
content_items
fields
controls
charts_or_tables
required_fields
optional_fields
```

Rules:

- Stable IDs are required for fields and content items.
- `initial_visible_content_ids` means default opportunity to view, not active reading.
- Active content must declare its active trigger.
- Required fields must map to answer sources or trace evidence.

### L1: Behavior Semantics

L1 records what the user can do and what each behavior means at the page-task level. L1 distinguishes active and passive behavior but does not generate L3 labels or ability judgments.

Minimum L1 fields:

```text
behavior_id
behavior_name
trigger
active_or_passive
related_l0_id
expected_l2_events
required_for_completion
required_for_backend_tagging_input
notes
```

Rules:

- Every L1 behavior must state expected L2 evidence.
- Active behaviors must not be inferred from default visibility alone.
- Evidence gaps can be warnings or quality diagnostics instead of contract failures.
- `required_for_backend_tagging_input` only means the behavior is expected evidence for backend tagging; it never means cp generates tags.

### L2: Engineering Facts

L2 records frontend trace events that can be validated, submitted, and consumed by backend tagging. L2 events must map back to L0 IDs and L1 behaviors.

Minimum L2 matrix fields:

```text
event_type
when_to_emit
target_type
target_id
field_id
content_id
value_before
value_after
metadata_required
metadata_optional
contract_validation
backend_usage
test_case
```

Key event expectations for v1.0:

- `START_PAGE`: include schema/registry metadata, flow context, page index, legacy page id, initial visible content IDs, and viewport state where applicable.
- `CONTENT_ACTIVATE`: emit for user-originated activation of content; can support active reading evidence.
- `CHAT_SCROLL`: emit only for user-originated scroll, not automatic scroll.
- `TEXT_FOCUS`: record focus-start value and character counts.
- `TEXT_CHANGE`: preserve natural debounce/throttle cadence; do not fabricate events to appease backend quality warnings.
- `TEXT_BLUR`: preserve correct before/after semantics.
- `PAGE_IDLE`: emit only for visible and focused idle intervals meeting threshold. The frontend must never emit or derive L3 labels, sequence observations, HMM inputs, or ability labels; backend owns any downstream L2-to-L3 use.
- `SUBMIT_ATTEMPT`: include `submit_trigger`, validation status, and missing fields.

## MarkObject Submission Standard

The standard must describe MarkObject expectations without duplicating every cp implementation detail.

Required concepts:

- `operationList` contains ordered L2 operations.
- `answerList` contains scoring/answer values and remains distinct from trace evidence.
- `value.page_id` is canonical; legacy page ids remain compatibility metadata where needed.
- `flow_context` must identify flow, submodule, page, step index, and module context.
- `beginTime` and `endTime` describe page-level submission envelope timing.
- `pageNumber` and `pageDesc` must remain stable and traceable to mapping definitions.
- `imgList` remains present for compatibility even when empty.

## Science Inquiry Experiment Profile v1.0

The first detailed profile should use banana to define common science inquiry page families:

- Introduction or instruction page.
- Question generation page.
- Material/content reading page.
- Variable or factor selection page.
- Hypothesis or prediction page.
- Design-plan page.
- Simulation or experiment operation page.
- Evidence chart/table inspection page.
- Solution evaluation or selection page.
- Finish/submit page.

Golden banana coverage should cite representative page types rather than requiring all 13 pages to be fully rewritten in the standard:

- Page02: text question generation, active chat/material evidence, `PAGE_IDLE`.
- Page04: content reading, factor selection, field/content registry alignment.
- Page06/Page07: long-text collector and text boundary semantics.
- Page12/Page13: plan table, evidence chart, reason text, selection evidence.
- Finish page: task finish, submit, trace flush boundaries.

## Synchronization Policy

Use three synchronization categories.

### Canonical Only

KB owns the text. cp may link to it but must not copy the full standard definition.

Examples:

- L0/L1/L2 concept definitions.
- Cross-repo responsibility boundaries.
- Standard version lifecycle.
- Canonical standard semantics.

### Mirrored With Version

cp may mirror a summary or table, but must include source, standard version, and verification metadata.

Examples:

- Event minimum requirements summary.
- Science inquiry page type list.
- Acceptance checklist.

### Implementation Local

cp owns the content because it is repository-specific.

Examples:

- cp code paths.
- Test command examples.
- Template file layout.
- Local implementation caveats.

## Manifest Requirements

Both KB and cp must maintain a manifest. Use Markdown files with YAML frontmatter as the single machine-readable source in v1.0; prose below the frontmatter can explain the fields, but scripts must read only the frontmatter.

Required fields:

```yaml
standard_id: standard-submodule
standard_version: v1.0
profile_id: science-inquiry-experiment
profile_version: v1.0
canonical_source:
  owner: assessment-platform-kb
  path: D:\myproject\assessment-platform-kb\标准\子模块构建标准
frontend_handbook:
  repo: cp
  worktree_path: D:\myproject\cp-banana-trace-standardization
  target_main_repo: D:\myproject\cp
sync_policy:
  canonical_only:
    - l0_l1_l2_concepts
    - cross_repo_responsibilities
    - standard_version_lifecycle
  mirrored_with_version:
    - event_minimum_requirements
    - science_inquiry_page_types
    - acceptance_review_checklist
  implementation_local:
    - cp_code_paths
    - cp_test_commands
    - cp_template_layout
mirrors:
  - section_id: event_minimum_requirements
    canonical_path: 标准/子模块构建标准/standard-submodule-v1.0.md
    canonical_anchor: key-event-expectations-for-v10
    canonical_commit: pending
    canonical_content_hash: pending
    local_path: docs/standard-submodule/frontend-implementation-handbook.md
    local_anchor: event-minimum-requirements
    local_content_hash: pending
    mirror_policy: summary-with-version
    last_verified_at: pending
    verified_by_change_id: pending
last_verified:
  kb_change_id: pending
  golden_reference_commit: 327e164f62d1e1fda76b34ac585e78ecf03f65af
  initial_design_doc_commit: a79c60388131f0f3d68d290ad9fd01fa451d25b4
  cp_branch_completion_commit: pending
  backend_commit: optional
worktree_status:
  source_worktree: D:\myproject\cp-banana-trace-standardization
  target_repo: D:\myproject\cp
  branch: 2026-06-04-banana-trace-standardization
  golden_reference_commit: 327e164f62d1e1fda76b34ac585e78ecf03f65af
  design_doc_commit: pending
  branch_completion_commit: pending
  mainline_merge_status: pending
  mainline_merge_commit: pending
```

After merge to mainline, update `mainline_merge_status` and `mainline_merge_commit` through a follow-up KB requirement or closeout update. Do not reuse the golden reference commit as the design document, branch completion, or mainline merge commit.

## Base Documentation Updates

### KB `00-index.md`

Add a standards entry that points to:

```text
标准/子模块构建标准/README.md
```

The entry should identify it as the canonical standard package for submodule construction, L0/L1/L2 modeling, MarkObject submission, and science inquiry experiment profile guidance.

### KB `VAULT_RULES.md`

Add standard synchronization rules:

- `标准/` is a long-term canonical knowledge area.
- Standard semantic changes must use a concrete KB requirement directory, for example `需求/2026-06-07-standard-submodule-construction-v1/`.
- Repository agents should not directly mutate long-term standard files unless explicitly authorized by the current cross-repo requirement.
- Repository sessions should write standard update suggestions into `repo-results`.
- Main sessions decide during closeout whether to update `标准/` and manifests.
- cp `docs/standard-submodule/` is an implementation handbook, not the canonical source.
- If KB standard and cp handbook conflict, use KB as canonical and create a follow-up to fix the inconsistency.

### cp `AGENTS.md`

Add `STANDARD SUBMODULE SYNC PROTOCOL` with these requirements:

- When changing Flow submodule construction, L0/L1 page modeling, L2 trace reporting, MarkObject submission, trace contracts, registries, or acceptance fixtures, read the KB standard and cp manifest first.
- If a change affects standard semantics, do not update cp docs alone; create or use a KB requirement/change-id.
- If a change only affects cp implementation details, update cp handbook/templates without changing the standard version unless the standard itself changes.
- When changing `docs/standard-submodule/`, `docs/子模块数据上报规范/`, trace contracts, acceptance fixtures, or submodule mapping/pages with L2 trace effects, check whether the standard manifest needs updating.
- Record that this worktree is `D:\myproject\cp-banana-trace-standardization` and must later merge to `D:\myproject\cp`.

Optional future update: add a corresponding backend `AGENTS.md` protocol for trace contracts and tagging standard changes.

## Templates

### Page L0/L1 Matrix

Required sections:

```text
page_id:
legacy_page_id:
page_type:
page_index:
main_instruction:
initial_visible_content_ids:

L0 content_items:
| content_id | content_type | default_visible | active_trigger | notes |

L0 fields:
| field_id | field_type | required | answer_key | notes |

L1 behaviors:
| behavior_id | trigger | active/passive | related_l0_id | expected_l2 | required_for_backend_tagging_input |
```

### L2 Event Matrix

Required table:

```text
| event_type | when_to_emit | target_type | target_id | field_id | content_id | required_metadata | backend_usage | tests |
```

### Field/Content Registry Planning

Required table:

```text
| id | type | page_id | label | required | registry_version | notes |
```

### Acceptance Case Template

Required fields:

```text
case_id:
standard_version:
profile_version:
page_id:
required_events:
expected_backend_validation:
l2_to_l3_scope: backend_only
expected_backend_diagnostics:
fixtures:
```

### Review Checklist

Minimum checklist:

```text
- [ ] L0 content and field IDs are stable.
- [ ] L1 active/passive behavior is separated.
- [ ] L2 event matrix exists.
- [ ] Field/content registry entries align with L0 IDs.
- [ ] START_PAGE metadata includes required versions/hashes and initial visible context where applicable.
- [ ] PAGE_IDLE follows visible/focused threshold semantics.
- [ ] SUBMIT_ATTEMPT includes submit_trigger.
- [ ] Acceptance fixtures import or mirror authoritative fixtures correctly.
- [ ] Runtime/docs contracts have sync coverage.
- [ ] Tests pass in clean checkout.
```

## Validation and Rollout

### Phase 1: Documentation and Manual Guardrails

- Create KB standard package.
- Create cp implementation handbook package.
- Add manifests.
- Add KB base navigation/rules.
- Add cp `AGENTS.md` protocol.
- Use manual review checklist to enforce sync.

### Phase 2: Lightweight Script Guardrails

Add a future `check:standard-sync` command that verifies:

- cp manifest references existing KB standard version.
- cp docs contain required frontmatter.
- mirrored sections declare source and standard version.
- every `mirrors[]` item has canonical/local path, anchor, content hash, mirror policy, last verified time, and verifying change-id.
- the checker recomputes local mirrored-section hashes and fails when they no longer match manifest values.
- trace contract version/hash declarations match manifest values where applicable.

### Phase 3: CI Guardrails

Trigger standard sync checks when PRs touch:

- `docs/standard-submodule/**`
- `docs/子模块数据上报规范/**`
- `src/shared/services/submission/trace/contracts/**`
- `src/shared/services/submission/trace/contracts.ts`
- `src/shared/services/submission/trace/logger.ts`
- `src/shared/services/submission/trace/validators/**`
- `src/submodules/*/mapping.ts`
- `src/submodules/*/pages/**` when L2 trace behavior changes
- `src/submodules/*/__tests__/*acceptance*`
- MarkObject/submission pipeline files

Start as warning-only if needed; make blocking after the checks stabilize.

## Acceptance Criteria

- KB standard package exists and clearly identifies the canonical standard source.
- cp implementation handbook and templates exist and declare they are not canonical.
- KB and cp manifests exist and reference the same `standard_id`, `standard_version`, `profile_id`, and `profile_version`.
- KB `00-index.md` links to the standard package.
- KB `VAULT_RULES.md` explains standard synchronization rules.
- cp `AGENTS.md` explains the standard submodule sync protocol.
- Banana golden example explains how `g8-banana-browning-experiment` satisfies the standard.
- The package distinguishes branch worktree completion from mainline merge completion.
- No file depends on untracked local artifacts.
- No changes are made to `D:\myproject\cp`.

## Implementation Planning Notes

This design should become the source for a new KB requirement/change-id before implementation. Recommended implementation flow:

1. Create a new KB requirement for `standard-submodule-construction-v1`.
2. Write KB canonical standard docs under that requirement or directly into `标准/` only if explicitly authorized.
3. Update cp handbook files in the current worktree under the same change-id.
4. Update cp `AGENTS.md` and KB base docs as part of the same change.
5. Write repo-results and close out the KB requirement.
6. After merging the cp branch into `D:\myproject\cp`, update the manifest mainline merge fields.

## Spec Self-Review

- Placeholder scan: no unresolved placeholder is intended as implementation input; `pending` values are deliberate manifest states before implementation and merge.
- Consistency check: KB is canonical, cp is implementation handbook, backend owns contracts/tagging, and frontend does not generate L3 labels.
- Scope check: v1.0 covers general skeleton plus science inquiry experiment profile; questionnaire profile remains future work.
- Ambiguity check: standard semantic changes require KB requirement/change-id; cp-only implementation details can update cp handbooks without standard version changes.
