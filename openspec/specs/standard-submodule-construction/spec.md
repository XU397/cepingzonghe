# standard-submodule-construction Specification

## Purpose
Define the cp-visible standard submodule construction capability: the frontend implementation handbook package, synchronization manifest, template set, banana golden-example guidance, agent sync protocol, dependency gates, and validation expectations for building standard Flow submodules against the KB canonical standard.
## Requirements
### Requirement: Canonical Source Boundary
The cp standard submodule construction package MUST identify the KB standard as canonical and MUST treat cp documentation as frontend implementation guidance.

#### Scenario: Agent opens cp handbook entry point
- **WHEN** an agent reads `docs/standard-submodule/README.md`
- **THEN** the document states that the KB standard is canonical, links to the cross-repo requirement inputs, and explains that cp docs are implementation handbooks rather than independent standard definitions

#### Scenario: Canonical-only topic is needed
- **WHEN** cp guidance needs L0/L1/L2 definitions, cross-repo responsibility boundaries, standard version lifecycle, or canonical standard semantics
- **THEN** the cp document links to the KB canonical source instead of duplicating the full standard body

### Requirement: cp Handbook Package
The cp repository MUST provide a `docs/standard-submodule/` package with navigation, frontend implementation guidance, profile guidance, templates, a banana golden-example summary, and a sync manifest.

#### Scenario: Handbook package is present
- **WHEN** the cp repository is checked after apply
- **THEN** `docs/standard-submodule/README.md`, `frontend-implementation-handbook.md`, `science-inquiry-experiment-handbook.md`, `standard-sync-manifest.md`, `templates/page-l0-l1-matrix.md`, `templates/l2-event-matrix.md`, `templates/field-content-registry.md`, `templates/acceptance-case.md`, `templates/review-checklist.md`, and `examples/g8-banana-browning-experiment.md` exist

#### Scenario: Frontend implementation guidance is used
- **WHEN** an agent builds or migrates a standard Flow submodule in cp
- **THEN** `frontend-implementation-handbook.md` describes cp-specific mapping, context, page, Component, trace, MarkObject submission, and test responsibilities with links to current cp code and docs

#### Scenario: Science inquiry profile guidance is used
- **WHEN** an agent builds or migrates a science inquiry experiment submodule
- **THEN** `science-inquiry-experiment-handbook.md` identifies the profile version, representative page families, frontend trace expectations, and the banana golden reference without requiring every banana page implementation detail to be copied

### Requirement: Template Coverage
The cp handbook package MUST include copyable templates for page modeling, L2 event planning, registry planning, acceptance cases, and review checks.

#### Scenario: Page modeling template is used
- **WHEN** an agent creates a page-level planning artifact from `templates/page-l0-l1-matrix.md`
- **THEN** the template captures page identity, legacy page identity, page type, page index, main instruction, initial visible content IDs, L0 content items, L0 fields, and L1 behaviors

#### Scenario: L2 event template is used
- **WHEN** an agent creates an L2 trace plan from `templates/l2-event-matrix.md`
- **THEN** the template captures event type, emission condition, target type, target ID, field ID, content ID, required metadata, backend usage, and tests

#### Scenario: Review checklist is used
- **WHEN** a reviewer checks a new standard submodule implementation
- **THEN** the checklist covers stable L0 IDs, L1 active/passive separation, L2 event matrix, registry alignment, start-page metadata, `PAGE_IDLE`, `SUBMIT_ATTEMPT`, fixture authority, runtime/docs sync coverage, and clean-checkout tests

### Requirement: Sync Manifest Metadata
The cp package MUST provide a machine-readable sync manifest that records standard/profile identifiers, KB canonical source metadata, cp handbook metadata, sync policy buckets, mirror metadata, and worktree/mainline traceability.

#### Scenario: Manifest frontmatter is inspected
- **WHEN** `docs/standard-submodule/standard-sync-manifest.md` is read by a future manual or scripted checker
- **THEN** YAML frontmatter includes `standard_id`, `standard_version`, `profile_id`, `profile_version`, `canonical_source`, `frontend_handbook`, `sync_policy`, `mirrors`, `last_verified`, and `worktree_status`

#### Scenario: Mirror entry is audited
- **WHEN** a `mirrors[]` entry is inspected
- **THEN** it includes canonical path, canonical anchor, canonical commit or pending marker, canonical content hash or pending marker, local path, local anchor, local content hash or pending marker, mirror policy, last verified time or pending marker, and verifying change-id or pending marker

#### Scenario: Worktree and merge states are distinguished
- **WHEN** the manifest records implementation progress
- **THEN** it distinguishes the banana golden reference commit, initial or approved design reference, cp branch completion commit, mainline merge status, and mainline merge commit

### Requirement: Agent Sync Protocol
The cp repository MUST update `AGENTS.md` with a `STANDARD SUBMODULE SYNC PROTOCOL` that routes standard-sensitive work through the KB standard and cp manifest.

#### Scenario: Standard-sensitive work begins
- **WHEN** an agent changes Flow submodule construction, L0/L1 page modeling, L2 trace reporting, MarkObject submission, trace contracts, registries, acceptance fixtures, or submodule pages with L2 trace effects
- **THEN** `AGENTS.md` instructs the agent to read the KB standard and cp manifest before making changes

#### Scenario: Semantic standard change is identified
- **WHEN** an agent determines that a change affects standard semantics
- **THEN** `AGENTS.md` instructs the agent not to update cp docs alone and to create or use a KB requirement/change-id

#### Scenario: cp-only implementation detail changes
- **WHEN** a change affects only cp implementation details
- **THEN** `AGENTS.md` allows updating cp handbook/templates without changing the standard version unless the KB standard itself changes

### Requirement: Cross-Repo Apply Gates
The cp implementation MUST respect the KB-first sequencing for final standard metadata while allowing cp proposal planning to proceed in parallel.

#### Scenario: cp proposal artifacts are created before KB apply is complete
- **WHEN** cp proposal, design, specs, and tasks are written
- **THEN** they record that apply finalization depends on KB canonical standard paths, anchors, versions, and manifest shape

#### Scenario: cp manifest is finalized
- **WHEN** cp apply prepares to claim completion or write repo-results
- **THEN** KB and cp manifests use matching `standard_id`, `standard_version`, `profile_id`, and `profile_version`, and unresolved canonical mirror metadata is not silently treated as complete

### Requirement: v1.0 Scope and Validation
The cp change MUST remain documentation/manual-guardrail focused in v1.0 and MUST verify that the handbook package is complete and clean.

#### Scenario: Runtime scope is reviewed
- **WHEN** the change diff is reviewed
- **THEN** it contains no runtime code, backend tagging, admin, xspj-service, or `D:\myproject\cp` changes unless a later approved scope change explicitly adds them

#### Scenario: Documentation quality checks run
- **WHEN** apply validation is performed
- **THEN** file existence, required links, manifest frontmatter, placeholder text, mojibake, control characters, and accidental dependence on untracked local artifacts are checked

#### Scenario: Automated sync checker is requested
- **WHEN** someone asks whether v1.0 includes a full `check:standard-sync` command or CI guard
- **THEN** the cp proposal records it as a future Phase 2 guardrail unless a separate approved change expands the scope
