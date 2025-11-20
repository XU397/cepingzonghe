# Tasks: g8-mikania-experiment (Mikania Control Experiment Module)

**Input**: Design documents from `/specs/feature/g8-mikania-experiment/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md
**Branch**: `feature/g8-mikania-experiment`
**Date**: 2025-11-19

**Tests**: Manual testing per acceptance scenarios (no automated tests required per research.md)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## User Stories Summary

- **US1 (P1)**: Core experiment flow - 7 pages with interactive experiment panel
- **US2 (P2)**: Data logging and submission - operation/answer tracking
- **US3 (P3)**: Page restoration and progress sync - localStorage persistence
- **US4 (P4)**: Timer management and timeout handling

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [x] T001 [P] Create directory structure: `src/submodules/g8-mikania-experiment/` with pages/, components/, styles/, utils/, assets/ subdirectories
- [x] T002 [P] Create CSS variables and base styles in `src/submodules/g8-mikania-experiment/styles/variables.css` with unified color scheme
- [x] T003 Create germination rate data model in `src/submodules/g8-mikania-experiment/utils/experimentData.js` with getGerminationRate, getGerminationByConcentration functions

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Create page mapping and navigation modes in `src/submodules/g8-mikania-experiment/mapping.js` with PAGE_MAP, PAGE_TO_STEP, PAGE_MODES, getNextPageId, getPageSubNum functions
- [x] T005 Create SubmoduleDefinition export in `src/submodules/g8-mikania-experiment/index.jsx` with submoduleId, displayName, version, Component, getInitialPage
- [x] T006 Create main component with Context+Reducer state management in `src/submodules/g8-mikania-experiment/Component.jsx` including ModuleState, action types, reducer, and navigation logic

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Core Experiment Flow (Priority: P1) MVP

**Goal**: Students complete 7-page linear experiment flow with interactive experiment panel, answering all questions and reaching conclusions

**Independent Test**: Complete full 7-page flow, operate experiment panel correctly, answer all questions

### Page Components (Sequential Implementation)

- [x] T007 [US1] Create Page00_Notice.jsx in `src/submodules/g8-mikania-experiment/pages/Page00_Notice.jsx` with 38-second countdown timer and checkbox confirmation
- [x] T008 [US1] Create Page00_Notice.module.css in `src/submodules/g8-mikania-experiment/styles/Page00_Notice.module.css` with notice styling and disabled checkbox state
- [x] T009 [US1] Create Page01_Intro.jsx in `src/submodules/g8-mikania-experiment/pages/Page01_Intro.jsx` with task background content and next button
- [x] T010 [US1] Create Page01_Intro.module.css in `src/submodules/g8-mikania-experiment/styles/Page01_Intro.module.css` with intro page styling
- [x] T011 [US1] Create Page02_Step_Q1.jsx in `src/submodules/g8-mikania-experiment/pages/Page02_Step_Q1.jsx` with experiment steps display and Q1 text input (>=5 chars)
- [x] T012 [US1] Create Page02_Step_Q1.module.css in `src/submodules/g8-mikania-experiment/styles/Page02_Step_Q1.module.css` with steps layout and input styling
- [x] T013 [US1] Create Page03_Sim_Exp.jsx in `src/submodules/g8-mikania-experiment/pages/Page03_Sim_Exp.jsx` with ExperimentPanel integration and observation area
- [x] T014 [US1] Create Page03_Sim_Exp.module.css in `src/submodules/g8-mikania-experiment/styles/Page03_Sim_Exp.module.css` with experiment page layout

### ExperimentPanel Components (Core Interactive Feature)

- [x] T015 [P] [US1] Create ExperimentPanel container in `src/submodules/g8-mikania-experiment/components/ExperimentPanel/index.jsx` with concentration selector, days adjuster, start/reset buttons
- [x] T016 [P] [US1] Create PetriDish SVG component in `src/submodules/g8-mikania-experiment/components/ExperimentPanel/PetriDish.jsx` with seed display and germination state
- [x] T017 [P] [US1] Create Dropper SVG component in `src/submodules/g8-mikania-experiment/components/ExperimentPanel/Dropper.jsx` with CSS animation for dropping motion
- [x] T018 [P] [US1] Create SeedDisplay component in `src/submodules/g8-mikania-experiment/components/ExperimentPanel/SeedDisplay.jsx` with germination rate visualization
- [x] T019 [US1] Create ExperimentPanel.module.css in `src/submodules/g8-mikania-experiment/styles/ExperimentPanel.module.css` with 60FPS animation keyframes

### Question Pages (Continue Flow)

- [x] T020 [US1] Create Page04_Q2_Data.jsx in `src/submodules/g8-mikania-experiment/pages/Page04_Q2_Data.jsx` with Q2 multiple choice (A/B/C) for concentration inhibition
- [x] T021 [US1] Create Page04_Q2_Data.module.css in `src/submodules/g8-mikania-experiment/styles/Page04_Q2_Data.module.css` with choice button styling
- [x] T022 [US1] Create ChartPanel component in `src/submodules/g8-mikania-experiment/components/ChartPanel/index.jsx` with germination rate trend display
- [x] T023 [US1] Create Page05_Q3_Trend.jsx in `src/submodules/g8-mikania-experiment/pages/Page05_Q3_Trend.jsx` with Q3 multiple choice (A/B/C) for trend analysis
- [x] T024 [US1] Create Page05_Q3_Trend.module.css in `src/submodules/g8-mikania-experiment/styles/Page05_Q3_Trend.module.css` with trend page styling
- [x] T025 [US1] Create Page06_Q4_Conc.jsx in `src/submodules/g8-mikania-experiment/pages/Page06_Q4_Conc.jsx` with Q4a yes/no choice and Q4b text input (>=10 chars)
- [x] T026 [US1] Create Page06_Q4_Conc.module.css in `src/submodules/g8-mikania-experiment/styles/Page06_Q4_Conc.module.css` with conclusion page styling

### Validation Logic

- [x] T027 [US1] Implement page validation functions in Component.jsx for each page's required fields (noticeConfirmed, Q1>=5chars, Q2/Q3 selected, Q4a+Q4b>=10chars)
- [x] T028 [US1] Add completion logic in Page06 to call flowContext.onComplete() after final submission (without calling updateModuleProgress)

**Checkpoint**: User Story 1 complete - full experiment flow functional with all interactions and questions

---

## Phase 4: User Story 2 - Data Logging and Submission (Priority: P2)

**Goal**: System records all user interactions and submits complete MarkObject data on each page transition

**Independent Test**: Verify submitted MarkObject contains complete operationList and answerList with correct pageNumber format

### Operation Logging

- [x] T029 [US2] Add page_enter/page_exit logging in each page component using logOperation with ISO timestamp
- [x] T030 [P] [US2] Implement change event logging for all input fields (Q1, Q4b text inputs)
- [x] T031 [P] [US2] Implement exp_start event logging in ExperimentPanel with concentration and days parameters
- [x] T032 [P] [US2] Implement exp_reset event logging in ExperimentPanel with previous state
- [x] T033 [P] [US2] Implement exp_param_change event logging for concentration/days changes with old/new values

### Answer Collection

- [x] T034 [US2] Create answer collection utilities in Component.jsx to transform ModuleState.answers to Answer[] format
- [x] T035 [US2] Implement answer code mapping: Q1->1, Q2->2, Q3->3, Q4a->4, Q4b->5 with targetElement format P{pageNumber}_{questionId}

### MarkObject Construction

- [x] T036 [US2] Create MarkObject builder function using encodeCompositePageNum(flowContext.stepIndex, subPageNum) for pageNumber
- [x] T037 [US2] Integrate usePageSubmission hook in Component.jsx for all page transitions with submit() call
- [x] T038 [US2] Implement pageDesc mapping for all 7 pages (e.g., "注意事项", "任务背景", "实验步骤", "模拟实验", "数据分析", "趋势分析", "结论验证")

**Checkpoint**: User Story 2 complete - all interactions logged and data submits correctly

---

## Phase 5: User Story 3 - Page Restoration and Progress Sync (Priority: P3)

**Goal**: System restores page position and state after page refresh or reconnection

**Independent Test**: Operate experiment on page 3, refresh browser, verify restoration to correct page with preserved state

### localStorage Persistence

- [x] T039 [P] [US3] Implement answers persistence in localStorage with key `module.g8-mikania-experiment.answers` - save on each answer change
- [x] T040 [P] [US3] Implement experimentState persistence in localStorage with key `module.g8-mikania-experiment.experimentState` - save on state change
- [x] T041 [P] [US3] Implement noticeConfirmed persistence in localStorage with key `module.g8-mikania-experiment.noticeConfirmed`
- [x] T042 [US3] Implement localStorage loading in Component.jsx useEffect to restore state on mount

### Page Restoration

- [x] T043 [US3] Implement getInitialPage function in index.jsx to map flowContext.modulePageNum to correct pageId using PAGE_MAP
- [x] T044 [US3] Handle edge cases in getInitialPage: null/undefined pageNum returns 'page_00_notice', invalid pageNum returns first page
- [x] T045 [US3] Implement answer backfill on page mount - restore previous answers to input fields from ModuleState.answers

**Checkpoint**: User Story 3 complete - page and state restoration works correctly

---

## Phase 6: User Story 4 - Timer Management and Timeout Handling (Priority: P4)

**Goal**: System provides 20-minute task timer with automatic submission on expiration

**Independent Test**: Set short test time, wait for expiration, verify auto-submit and timeout marker

### Timer Integration

- [x] T046 [US4] Integrate flowContext timer display in Component.jsx - timer managed by Flow container
- [x] T047 [US4] Implement timeout detection by subscribing to flowContext timer state

### Timeout Auto-Submit

- [x] T048 [US4] Create onTimeout handler in Component.jsx to auto-submit current page data
- [x] T049 [US4] Mark unanswered items as "超时未回答" in answer values during timeout submission
- [x] T050 [US4] Call flowContext.onTimeout() after successful timeout submission

**Checkpoint**: User Story 4 complete - timer management and timeout handling works correctly

---

## Phase 7: Polish and Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Error Handling

- [x] T051 [P] Implement click_blocked event logging when validation fails with JSON value containing reason and missing fields
- [x] T052 [P] Add validation error messages display for each required field (character count hints, required selection hints)
- [x] T053 Implement network error handling with retry UI - display unified error tray on submission failure

### Edge Cases

- [x] T054 [P] Handle experiment parameter out of range - use default values and log warning
- [x] T055 [P] Handle missing flowContext (standalone debug mode) - use stepIndex=0, skip Flow progress APIs
- [x] T056 Implement 401 session expiry detection with auto-redirect to login page

### Final Integration

- [x] T057 Test complete 7-page flow with all interactions and submissions
- [x] T058 Verify navigation mode integration - pages 0-1 use 'hidden' mode, pages 2-6 use 'experiment' mode
- [x] T059 Run quickstart.md verification checklist for all acceptance scenarios

---

## Dependencies and Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion - Core MVP
- **User Story 2 (Phase 4)**: Depends on US1 pages existing (but can implement logging as pages are built)
- **User Story 3 (Phase 5)**: Depends on US1 and US2 state structure
- **User Story 4 (Phase 6)**: Depends on US2 submission mechanism
- **Polish (Phase 7)**: Depends on all user stories being complete

### Within Phase 3 (US1) Dependencies

```
T007-T008 (Page00) -> T009-T010 (Page01) -> T011-T012 (Page02)
                                                    |
                                                    v
T015-T019 (ExperimentPanel) -> T013-T014 (Page03)
                                        |
                                        v
                               T020-T024 (Page04-05)
                                        |
                                        v
                               T025-T028 (Page06 + validation)
```

### Parallel Opportunities

**Phase 1**: T001, T002, T003 can all run in parallel

**Phase 3 (US1)**:
- T015, T016, T017, T018 (ExperimentPanel components) can run in parallel
- CSS modules can be created in parallel with their JSX counterparts

**Phase 4 (US2)**:
- T030, T031, T032, T033 (event logging) can all run in parallel

**Phase 5 (US3)**:
- T039, T040, T041 (localStorage persistence) can all run in parallel

**Phase 7 (Polish)**:
- T051, T052, T054, T055 can run in parallel

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006)
3. Complete Phase 3: User Story 1 (T007-T028)
4. **STOP and VALIDATE**: Test complete 7-page flow with experiment panel
5. Deploy/demo if ready - core assessment functionality complete

### Incremental Delivery

1. Setup + Foundational -> Foundation ready (T001-T006)
2. Add US1 -> Test 7-page flow -> Deploy (MVP!)
3. Add US2 -> Test data logging -> Deploy
4. Add US3 -> Test page restoration -> Deploy
5. Add US4 -> Test timer/timeout -> Deploy
6. Polish -> Final validation -> Release

### Estimated Effort

- **Phase 1 (Setup)**: 0.5 day
- **Phase 2 (Foundational)**: 1 day
- **Phase 3 (US1)**: 3-4 days (most complex - 7 pages + ExperimentPanel)
- **Phase 4 (US2)**: 1 day
- **Phase 5 (US3)**: 0.5 day
- **Phase 6 (US4)**: 0.5 day
- **Phase 7 (Polish)**: 1 day

**Total**: 7-8 days for complete implementation

---

## Notes

- All file paths are relative to repository root
- CSS Modules naming: `ComponentName.module.css`
- Use ISO 8601 timestamps for all operation logging
- pageNumber format: `M{stepIndex}:{subPageNum}` using encodeCompositePageNum
- localStorage namespace: `module.g8-mikania-experiment.*`
- 38-second countdown on Page00 before checkbox can be enabled
- 60FPS target for SVG animations in ExperimentPanel
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently

---

## Task Summary

- **Total Tasks**: 59
- **US1 Tasks**: 22 (T007-T028)
- **US2 Tasks**: 10 (T029-T038)
- **US3 Tasks**: 7 (T039-T045)
- **US4 Tasks**: 5 (T046-T050)
- **Setup Tasks**: 3 (T001-T003)
- **Foundational Tasks**: 3 (T004-T006)
- **Polish Tasks**: 9 (T051-T059)

### Parallel Opportunities

- **Total [P] marked tasks**: 19
- **Key parallel groups**:
  - Setup phase: 3 tasks
  - ExperimentPanel components: 4 tasks
  - Event logging: 5 tasks
  - localStorage persistence: 3 tasks

### MVP Scope Recommendation

For minimum viable product, complete:
- Phase 1: Setup (T001-T003)
- Phase 2: Foundational (T004-T006)
- Phase 3: User Story 1 (T007-T028)

This delivers the core 7-page experiment flow with full interactivity. Add US2-US4 incrementally for data persistence and timer features.
