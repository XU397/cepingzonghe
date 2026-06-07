---
title: g8 banana browning standard submodule golden example
type: documentation
status: verified
source: code
last_verified: 2026-06-07
standard_id: standard-submodule
standard_version: v1.0
profile_id: science-inquiry-experiment
profile_version: v1.0
golden_reference_commit: 327e164f62d1e1fda76b34ac585e78ecf03f65af
source_refs:
  - 'src/submodules/g8-banana-browning-experiment'
  - 'D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\00-requirement-brief.md'
  - 'D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\repo-cp.md'
  - 'D:\myproject\cp-banana-trace-standardization\docs\superpowers\specs\2026-06-07-standard-submodule-construction-design.md'
---

# G8 Banana Browning Golden Example

`src/submodules/g8-banana-browning-experiment/` is the cp golden reference for `standard-submodule` `v1.0` and `science-inquiry-experiment` `v1.0`.

Golden reference commit:

```text
327e164f62d1e1fda76b34ac585e78ecf03f65af
```

This document is a navigation summary. It does not duplicate the full banana implementation.

## Why Banana Is the Reference

- It uses the standard Flow submodule structure.
- `mapping.ts` owns page metadata, answer mapping, trace page config, and submission mapping.
- `Component.tsx` routes page rendering through provider/frame wiring.
- `context/G8BananaBrowningContext.tsx` owns answer state and stable operation logging.
- `trace/` connects page behavior to shared trace contracts.
- `__tests__/` includes mapping, submission, trace config, acceptance, hook, and page-event coverage.

## Key Paths

- Submodule definition: `src/submodules/g8-banana-browning-experiment/index.tsx`
- Runtime composition: `src/submodules/g8-banana-browning-experiment/Component.tsx`
- Mapping source: `src/submodules/g8-banana-browning-experiment/mapping.ts`
- Context state: `src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx`
- Page components: `src/submodules/g8-banana-browning-experiment/pages/`
- Trace helpers: `src/submodules/g8-banana-browning-experiment/trace/`
- Tests: `src/submodules/g8-banana-browning-experiment/__tests__/`

## Representative Page Families

- Page02: question generation, active material/chat evidence, and `PAGE_IDLE` behavior.
- Page04: material reading, factor selection, and field/content registry alignment.
- Page06/Page07: long-text collection and text event boundaries.
- Page09-Page12: simulation operation, question-bound fields, data/evidence inspection, and charts/tables.
- Page13: solution selection and reason text evidence.
- Page14: finish/submit boundary and trace flush behavior.

## Tests to Consult

- `mapping.test.ts` for mapping contract coverage.
- `submission-format.test.ts` and `submission.snapshot.test.ts` for MarkObject shape.
- `trace-config.test.ts` for trace metadata/config expectations.
- `trace-acceptance.test.ts` for acceptance fixture behavior.
- `trace-hooks.test.tsx` and `trace-page-events.test.tsx` for hook/event behavior.

## Reuse Guidance

Use banana to learn the implementation pattern. Do not copy banana page content, field IDs, content IDs, or fixtures into a new submodule unless the new requirement explicitly reuses that same domain content.
