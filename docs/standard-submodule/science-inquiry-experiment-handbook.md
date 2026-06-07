---
title: cp science inquiry experiment implementation handbook
type: documentation
status: verified
source: design
last_verified: 2026-06-07
standard_id: standard-submodule
standard_version: v1.0
profile_id: science-inquiry-experiment
profile_version: v1.0
source_refs:
  - 'D:\myproject\assessment-platform-kb\标准\子模块构建标准\science-inquiry-experiment-profile-v1.0.md'
  - 'D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\00-requirement-brief.md'
  - 'D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\repo-cp.md'
  - 'D:\myproject\cp-banana-trace-standardization\docs\superpowers\specs\2026-06-07-standard-submodule-construction-design.md'
---

# Science Inquiry Experiment Handbook

This handbook adapts the KB `science-inquiry-experiment` `v1.0` profile for cp frontend implementation. It is a cp implementation guide, not the canonical profile.

## Profile Identity

- `standard_id`: `standard-submodule`
- `standard_version`: `v1.0`
- `profile_id`: `science-inquiry-experiment`
- `profile_version`: `v1.0`
- Golden reference: `src/submodules/g8-banana-browning-experiment/`
- Golden reference commit: `327e164f62d1e1fda76b34ac585e78ecf03f65af`

## Science Inquiry Page Types

This section mirrors a versioned summary from the KB profile.

The profile covers these page families or equivalent steps:

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

## Frontend Implementation Rules

- Model page facts first: page ID, page type, page index, content IDs, field IDs, and main instruction.
- Separate L1 behavior semantics from L2 event implementation.
- Emit L2 events only for frontend-observed engineering facts.
- Keep answer/scoring values in `answerList`; keep trace evidence in `operationList`.
- Use the shared frame/submission path rather than direct API calls.
- Use trace contracts and registries as runtime authority for event/field/content shape.
- Treat L2-to-L3 tagging as backend responsibility.

## Representative Banana Coverage

Use the banana submodule as a map, not as text to copy:

- Page02 (`Page02BananaBrowning.tsx`): question generation, active material/chat evidence, and idle behavior.
- Page04 (`Page04BananaBrowningReading.tsx`): material reading, factor selection, and content/field registry alignment.
- Page06 and Page07 (`Page06BananaBrowningDesign.tsx`, `Page07BananaBrowningEvaluation.tsx`): long text collection and text focus/change/blur boundaries.
- Page09 to Page12: simulation operation, simulation questions, data/evidence inspection, and question-bound field bindings.
- Page13 (`Page13SolutionSelection.tsx`): solution selection evidence and reason text.
- Page14 (`Page14TaskCompletion.tsx`): finish/submit boundary and trace flush behavior.

Related local files:

- `src/submodules/g8-banana-browning-experiment/mapping.ts`
- `src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx`
- `src/submodules/g8-banana-browning-experiment/trace/fieldBindings.ts`
- `src/submodules/g8-banana-browning-experiment/trace/pageStartMetadata.ts`
- `src/submodules/g8-banana-browning-experiment/trace/useBananaTraceLogger.ts`
- `src/submodules/g8-banana-browning-experiment/__tests__/trace-acceptance.test.ts`

## Page Slice Build Order

For each page family:

1. Fill the page L0/L1 matrix.
2. Fill the L2 event matrix.
3. Register field/content IDs or map them to existing registries.
4. Implement the page UI and context updates.
5. Wire trace helpers through stable context operations.
6. Verify MarkObject `answerList`, `operationList`, and `flow_context`.
7. Add acceptance fixtures and tests.

## Profile Caveats

- This v1.0 profile is for science inquiry experiment submodules.
- Questionnaire-specific profile rules are intentionally out of scope.
- Backend quality diagnostics may report missing or low-quality L2 evidence, but cp must not fabricate frontend events to satisfy diagnostics.
- If a future submodule needs new standard semantics, create or use a KB requirement/change-id before changing cp docs alone.
