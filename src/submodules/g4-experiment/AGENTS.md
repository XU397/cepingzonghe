# G4 EXPERIMENT SUBMODULE KNOWLEDGE BASE

## OVERVIEW

Large interactive submodule (map/timeline/ticket flow) used in modern flow runtime while preserving legacy domain behavior.

## WHERE TO LOOK

| Task                     | Location                                                   | Notes                         |
| ------------------------ | ---------------------------------------------------------- | ----------------------------- |
| Definition entry         | src/submodules/g4-experiment/index.ts                      | registration contract         |
| Navigation + submit hook | src/submodules/g4-experiment/hooks/useG4Navigation.js      | unified submission wiring     |
| Page map and constants   | src/submodules/g4-experiment/constants/\*, mapping helpers | route/page semantics          |
| Complex interactions     | src/submodules/g4-experiment/components/\*                 | drag/drop and map UI behavior |

## CONVENTIONS

- Keep sequencing rules in hooks/constants, not duplicated across pages.
- Route submission through shared pipeline; keep operation/answer targets normalized.
- Preserve compatibility with existing grade-4 evaluation flow and page numbering.

## ANTI-PATTERNS

- Reintroducing direct backend calls in page components.
- Cross-importing internal module code instead of shared abstractions.
- Mixing legacy and flow page-number formats in the same submit path.

## QUICK CHECK

- Confirm navigation hook still drives submission lifecycle consistently.
- Keep page constants/mapping as single source of truth.
- Re-test map/timeline interactions after state-shape changes.
