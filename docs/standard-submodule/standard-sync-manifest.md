---
title: cp standard submodule sync manifest
type: documentation
status: verified
source: design
last_verified: 2026-06-07
source_refs:
  - 'D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\00-requirement-brief.md'
  - 'D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\repo-cp.md'
  - 'D:\myproject\cp-banana-trace-standardization\docs\superpowers\specs\2026-06-07-standard-submodule-construction-design.md'
standard_id: standard-submodule
standard_version: v1.0
profile_id: science-inquiry-experiment
profile_version: v1.0
canonical_source:
  owner: assessment-platform-kb
  path: 'D:\myproject\assessment-platform-kb\标准\子模块构建标准'
  package_readme: '标准/子模块构建标准/README.md'
  standard_file: '标准/子模块构建标准/standard-submodule-v1.0.md'
  profile_file: '标准/子模块构建标准/science-inquiry-experiment-profile-v1.0.md'
  manifest_file: '标准/子模块构建标准/standard-sync-manifest.md'
frontend_handbook:
  repo: cp
  worktree_path: 'D:\myproject\cp-banana-trace-standardization'
  target_main_repo: 'D:\myproject\cp'
  package_path: 'docs/standard-submodule'
sync_policy:
  canonical_only:
    - l0_l1_l2_concepts
    - cross_repo_responsibilities
    - standard_version_lifecycle
    - canonical_standard_semantics
  mirrored_with_version:
    - event_minimum_requirements
    - science_inquiry_page_types
    - acceptance_review_checklist
  implementation_local:
    - cp_code_paths
    - cp_test_commands
    - cp_template_layout
    - cp_local_caveats
hash_algorithm:
  id: heading-section-utf8-lf-v1
  description: Read the referenced Markdown file as UTF-8, normalize CRLF and CR to LF, locate the exact heading line, include that heading line and all following source text until the next heading of the same or higher level, preserve the section's original trailing LF characters, and compute SHA-256 over those UTF-8 bytes.
  includes_heading_line: true
  newline_normalization: LF
  section_end: before_next_heading_same_or_higher_level
  preserve_trailing_lf: true
mirrors:
  - section_id: event_minimum_requirements
    canonical_path: '标准/子模块构建标准/standard-submodule-v1.0.md'
    canonical_anchor: key-event-expectations-for-v10
    canonical_commit: pending:kb-standard-package-uncommitted
    canonical_content_hash: sha256:7770fea89508c779c682915e0149f1b6395d40f81e142f66802091b035ea0d30
    local_path: 'docs/standard-submodule/frontend-implementation-handbook.md'
    local_anchor: event-minimum-requirements
    local_content_hash: sha256:c04bf73aa328e77777c09bb20d01820be231efe08e454927a3ed08f4ae3d3586
    mirror_policy: summary-with-version
    last_verified_at: '2026-06-07T12:27:30+08:00'
    verified_by_change_id: 2026-06-07-standard-submodule-construction-v1
  - section_id: science_inquiry_page_types
    canonical_path: '标准/子模块构建标准/science-inquiry-experiment-profile-v1.0.md'
    canonical_anchor: 适用页面类型
    canonical_commit: pending:kb-standard-package-uncommitted
    canonical_content_hash: sha256:63ed27d672cdcf2a41346764db087d2968dfe1dbcd239c4a9bead4a0c2d84ae8
    local_path: 'docs/standard-submodule/science-inquiry-experiment-handbook.md'
    local_anchor: science-inquiry-page-types
    local_content_hash: sha256:559d56a7b397153d8e2c8aafc03cbd74c60e39838b3722d05e507b26b36a3d52
    mirror_policy: summary-with-version
    last_verified_at: '2026-06-07T12:27:30+08:00'
    verified_by_change_id: 2026-06-07-standard-submodule-construction-v1
  - section_id: acceptance_review_checklist
    canonical_path: '标准/子模块构建标准/science-inquiry-experiment-profile-v1.0.md'
    canonical_anchor: review-checklist
    canonical_commit: pending:kb-standard-package-uncommitted
    canonical_content_hash: sha256:56862dff9aab128a26038c33bf37e10925ba7fe2954414f1685bfc6af2fb5cff
    local_path: 'docs/standard-submodule/templates/review-checklist.md'
    local_anchor: review-checklist
    local_content_hash: sha256:abce069ea25a3423c2b275b9478a74f5132a02cb02b27501922bc9b5f254e317
    mirror_policy: checklist-with-version
    last_verified_at: '2026-06-07T12:27:30+08:00'
    verified_by_change_id: 2026-06-07-standard-submodule-construction-v1
  - section_id: trace_contracts_v2_2_canonical
    canonical_path: '标准/子模块构建标准/standard-sync-manifest.md'
    canonical_anchor: trace-contracts-v2-2
    canonical_commit: pending:kb-canonical-sync-after-closeout
    canonical_content_hash: pending:kb-canonical-sync-after-closeout
    local_path: 'docs/子模块数据上报规范/engineering_contracts/README.md'
    local_anchor: 本轮-canonical-声明2026-06-14跨库需求-2026-06-14-science-inquiry-trace-contract-v2-1
    local_content_hash: pending:computed-on-archive
    mirror_policy: implementation-local
    last_verified_at: '2026-06-14T00:00:00+08:00'
    verified_by_change_id: 2026-06-14-science-inquiry-trace-contract-v2-1
    notes: >
      v2.2 contracts (event_schema/field_registry/content_registry/rule_config) 的 docs↔src
      字节级同步由 contracts-sync 测试强制，不依赖本 manifest mirror 行。
      本行登记本轮（science-inquiry-trace-contract-v2-1）的 v2.2 runtime contract 文档化落点与 page_type_contract
      实现手册引用关系。KB canonical 同步（page_type/page_id 命名修订、page_type_contract 概念吸收）
      留待 KB 主 session 在 closeout 时决定。
standard_verification:
  kb_change_id: 2026-06-07-standard-submodule-construction-v1
  golden_reference_commit: 327e164f62d1e1fda76b34ac585e78ecf03f65af
  initial_design_doc_commit: a79c60388131f0f3d68d290ad9fd01fa451d25b4
  approved_design_doc_commit: ce60fd3
  cp_branch_completion_commit: 36b870086428750c3f5b5d383b3ed69bc2300dc0
  backend_commit: optional
worktree_status:
  source_worktree: 'D:\myproject\cp-banana-trace-standardization'
  target_repo: 'D:\myproject\cp'
  branch: 2026-06-04-banana-trace-standardization
  golden_reference_commit: 327e164f62d1e1fda76b34ac585e78ecf03f65af
  design_doc_commit: ce60fd3
  branch_completion_commit: 36b870086428750c3f5b5d383b3ed69bc2300dc0
  mainline_merge_status: merged
  mainline_merge_commit: 7f52bb6
known_dependency_gates:
  - canonical_commit remains pending until the KB standard package is committed.
  - trace_contracts_v2_2_canonical row's canonical_commit/hash remain pending until KB 主 session 在跨库需求 2026-06-14-science-inquiry-trace-contract-v2-1 closeout 时决定是否扩展 manifest 到 JSON contracts 登记，并吸收 page_type_contract 概念与 page_type/page_id 命名修订。
---

# Standard Sync Manifest

This manifest is the cp-local machine-readable declaration for the standard submodule handbook package.

## Field Notes

- `standard_id`, `standard_version`, `profile_id`, and `profile_version` must match the KB manifest.
- `canonical_source` points to the KB package. KB remains canonical.
- `frontend_handbook` points to this cp worktree and target main repository.
- `sync_policy` separates canonical-only, mirrored-with-version, and implementation-local sections.
- `hash_algorithm` defines how mirror section content hashes are recomputed.
- `mirrors[]` records auditable metadata for cp summaries that mirror KB content.
- `notes`（可选字段，由 `2026-06-14-science-inquiry-trace-contract-v2-1` 引入）：用于 implementation-local mirror 行补充人读说明，不参与 hash 计算；现有 KB-mirrored 行不使用该字段。本仓 manifest 当前无机器解析消费者；若未来引入 KB 同步脚本，需将 `notes` 正式纳入 mirrors[] schema 或迁移至 `known_dependency_gates`。
- `standard_verification` and `worktree_status` keep golden, design, branch completion, and mainline merge commits separate.

## Resolved Fields

The following dependency gates have been resolved:

- Branch completion commit: `36b870086428750c3f5b5d383b3ed69bc2300dc0` (cp branch final commit).
- Mainline merge: commit `7f52bb6`, merged to `D:\myproject\cp` main.

## Remaining Pending Fields

- KB canonical mirror commits remain `pending:kb-standard-package-uncommitted` in mirrors[] until the KB standard package is committed in the KB repository.
- `trace_contracts_v2_2_canonical` row (added by `2026-06-14-science-inquiry-trace-contract-v2-1`) 的 `canonical_commit` / `canonical_content_hash` / `local_content_hash` 保持 pending，直到 KB 主 session closeout 时决定：是否扩展 manifest 到 JSON contracts 登记、是否吸收 page_type_contract 概念为 canonical、以及 page_type/page_id 命名修订是否落地。v2.2 contracts 的 docs↔src 字节同步本身由 contracts-sync 测试强制，不依赖本行。
