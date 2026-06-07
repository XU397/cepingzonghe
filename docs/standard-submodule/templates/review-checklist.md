---
title: standard submodule review checklist
type: template
status: verified
source: design
last_verified: 2026-06-07
standard_id: standard-submodule
standard_version: v1.0
profile_id: science-inquiry-experiment
profile_version: v1.0
source_refs:
  - 'D:\myproject\assessment-platform-kb\标准\子模块构建标准\science-inquiry-experiment-profile-v1.0.md'
---

# Review Checklist

This checklist mirrors a versioned summary from KB `science-inquiry-experiment` `v1.0`.

- [ ] L0 content and field IDs are stable.
- [ ] L1 active/passive behavior is separated.
- [ ] L2 event matrix exists.
- [ ] Field/content registry entries align with L0 IDs.
- [ ] `START_PAGE` metadata includes required versions/hashes and initial visible context where applicable.
- [ ] `PAGE_IDLE` follows visible/focused threshold semantics.
- [ ] `SUBMIT_ATTEMPT` includes `submit_trigger`.
- [ ] Acceptance fixtures import or mirror authoritative fixtures correctly.
- [ ] Runtime/docs contracts have sync coverage.
- [ ] Tests pass in clean checkout.
