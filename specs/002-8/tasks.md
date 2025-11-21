# Tasks: 无人机航拍交互课堂子模块 (g8-drone-imaging)

**Input**: Design documents from `/specs/002-8/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not explicitly requested - skipped.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions
- **Submodule root**: `src/submodules/g8-drone-imaging/`
- **Shared services**: `src/shared/services/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create submodule directory structure per plan.md
  ```bash
  mkdir -p src/submodules/g8-drone-imaging/{context,pages,components,utils,styles,assets/images}
  ```

- [X] T002 [P] Extend EventTypes enumeration - add CLICK_BLOCKED, AUTO_SUBMIT, READING_COMPLETE to `src/shared/services/submission/eventTypes.js`

- [X] T003 [P] Verify SubmoduleDefinition interface in `src/shared/types/flow.ts` matches design spec requirements

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create GSD lookup table utility in `src/submodules/g8-drone-imaging/utils/gsdLookup.ts`
  - Export GSD_LOOKUP_TABLE with all 9 combinations
  - Export lookupGSD(height, focalLength) function
  - Export calculateBlurAmount(gsd) function

- [X] T005 Create page mapping configuration in `src/submodules/g8-drone-imaging/mapping.ts`
  - Define PAGE_CONFIGS array with subPageNum, pageId, type, navigationMode, stepIndex
  - Export getPageIdBySubPageNum() function
  - Export getSubPageNumByPageId() function

- [X] T006 Create DroneImagingContext in `src/submodules/g8-drone-imaging/context/DroneImagingContext.tsx`
  - Define DroneImagingContextValue interface inline
  - Implement Provider with state: currentPageId, answers, operations, experimentState, pageStartTime
  - Implement actions: navigateToPage, setAnswer, getAnswer, logOperation, clearOperations
  - Implement experiment actions: setHeight, setFocalLength, capture, resetExperiment
  - Implement persistence: saveToStorage, loadFromStorage with localStorage namespace `module.g8-drone-imaging.*`
  - Export useDroneImagingContext hook

- [X] T007 Create SubmoduleDefinition entry point in `src/submodules/g8-drone-imaging/index.tsx`
  - Export G8DroneImagingSubmodule implementing SubmoduleDefinition interface
  - Implement getInitialPage(subPageNum) using mapping.ts
  - Implement getTotalSteps() returning 6
  - Implement getNavigationMode(pageId)
  - Implement getDefaultTimers() returning { task: 1200 } (20 minutes)

- [X] T008 Create main Component wrapper in `src/submodules/g8-drone-imaging/Component.tsx`
  - Wrap children in DroneImagingProvider
  - Implement page router based on currentPageId
  - Handle onComplete and onError callbacks
  - Lazy load page components

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 完成无人机航拍模拟实验 (Priority: P1) 🎯 MVP

**Goal**: Students can adjust drone height and focal length, capture images, and observe GSD values with corresponding blur effects

**Independent Test**: Navigate to Page 4 (experiment_free), adjust all 9 parameter combinations, verify GSD displays correctly and blur effect matches

### Implementation for User Story 1

- [X] T009 [P] [US1] Create DroneSimulator component in `src/submodules/g8-drone-imaging/components/DroneSimulator.tsx`
  - Convert SVG animation from `docs/SVG动画参考/无人机交互动画.html`
  - Render drone SVG with position animation based on height
  - Implement blur filter with CSS filter: blur() based on GSD
  - Add capture flash effect
  - Connect to DroneImagingContext for state

- [X] T010 [P] [US1] Create HeightSelector component in `src/submodules/g8-drone-imaging/components/HeightSelector.tsx`
  - Render 3 height buttons (100m, 200m, 300m)
  - Highlight active selection
  - Call context.setHeight on click
  - Log SIMULATION_OPERATION event

- [X] T011 [P] [US1] Create FocalLengthSelector component in `src/submodules/g8-drone-imaging/components/FocalLengthSelector.tsx`
  - Render 3 focal length buttons (8mm, 24mm, 50mm)
  - Highlight active selection
  - Call context.setFocalLength on click
  - Log SIMULATION_OPERATION event

- [X] T012 [P] [US1] Create GSDDisplay component in `src/submodules/g8-drone-imaging/components/GSDDisplay.tsx`
  - Display current GSD value with unit (厘米/像素)
  - Format to 2 decimal places
  - Animate value changes

- [X] T013 [P] [US1] Create DroneSimulator styles in `src/submodules/g8-drone-imaging/styles/DroneSimulator.module.css`
  - Style simulation container
  - Drone position transitions (cubic-bezier)
  - Blur filter animations
  - Control panel layout
  - Capture flash effect

- [X] T014 [US1] Create Page04_Experiment component in `src/submodules/g8-drone-imaging/pages/Page04_Experiment.tsx`
  - Compose DroneSimulator, HeightSelector, FocalLengthSelector, GSDDisplay
  - Implement experiment free exploration mode
  - Add capture and reset buttons
  - Log PAGE_ENTER/PAGE_EXIT events
  - No mandatory validation (FR-008: record operations only)

- [X] T015 [P] [US1] Create Page04_Experiment styles in `src/submodules/g8-drone-imaging/styles/Page04_Experiment.module.css`
  - Main experiment layout
  - Control panel positioning
  - Button styles

**Checkpoint**: User Story 1 complete - students can perform full drone simulation experiment

---

## Phase 4: User Story 2 - 完成实验数据分析与结论 (Priority: P2)

**Goal**: Students analyze experiment data, answer questions about focal length and height impact, and write conclusions

**Independent Test**: Complete Pages 5, 6, 7 - verify radio validation, text input validation (>5 chars), and data submission

### Implementation for User Story 2

- [X] T016 [P] [US2] Create Page05_FocalAnalysis component in `src/submodules/g8-drone-imaging/pages/Page05_FocalAnalysis.tsx`
  - Display focal length impact question (Q5_1)
  - Render radio options for minimum GSD focal length
  - Validate selection before navigation (FR-009)
  - Log RADIO_SELECT events
  - Submit answer with targetElement 'P5_最小GSD焦距'

- [X] T017 [P] [US2] Create Page06_HeightAnalysis component in `src/submodules/g8-drone-imaging/pages/Page06_HeightAnalysis.tsx`
  - Display height impact question (Q6_1)
  - Render radio options for GSD change trend
  - Validate selection before navigation (FR-009)
  - Log RADIO_SELECT events
  - Submit answer with targetElement 'P6_GSD变化趋势'

- [X] T018 [P] [US2] Create Page07_Conclusion component in `src/submodules/g8-drone-imaging/pages/Page07_Conclusion.tsx`
  - Display conclusion questions (Q7_1, Q7_2)
  - Render radio options for priority adjustment factor
  - Render textarea for reason explanation
  - Validate both fields (radio selected AND text > 5 chars) (FR-010)
  - Log RADIO_SELECT and INPUT_CHANGE events
  - Handle module completion callback

- [X] T019 [P] [US2] Create Page05_FocalAnalysis styles in `src/submodules/g8-drone-imaging/styles/Page05_FocalAnalysis.module.css`
  - Question text styling
  - Radio group layout
  - Reference image area (if needed)

- [X] T020 [P] [US2] Create Page06_HeightAnalysis styles in `src/submodules/g8-drone-imaging/styles/Page06_HeightAnalysis.module.css`
  - Question text styling
  - Radio group layout

- [X] T021 [P] [US2] Create Page07_Conclusion styles in `src/submodules/g8-drone-imaging/styles/Page07_Conclusion.module.css`
  - Vertical stacked layout
  - Radio group at top
  - Textarea below
  - Submit button area

**Checkpoint**: User Story 2 complete - students can complete full data analysis workflow

---

## Phase 5: User Story 3 - 阅读背景知识与形成假设 (Priority: P3)

**Goal**: Students read background information and form hypotheses about variable control

**Independent Test**: Complete Pages 2 and 3 - verify 5-second forced reading and text validation (>5 chars)

### Implementation for User Story 3

- [X] T022 [P] [US3] Create Page02_Background component in `src/submodules/g8-drone-imaging/pages/Page02_Background.tsx`
  - Display background knowledge content (drone imaging, GSD concept)
  - Implement 5-second forced reading timer (FR-003)
  - Disable next button until timer completes
  - Log READING_COMPLETE event when timer ends
  - Use .splitLayout with text left, image placeholder right

- [X] T023 [P] [US3] Create Page03_Hypothesis component in `src/submodules/g8-drone-imaging/pages/Page03_Hypothesis.tsx`
  - Display hypothesis question (Q3_1: variable control reasoning)
  - Render textarea for student input
  - Validate text length > 5 characters (FR-004)
  - Show error message "请输入至少5个字符的思考内容"
  - Log INPUT_CHANGE events
  - Submit answer with targetElement 'P3_控制变量理由'

- [X] T024 [P] [US3] Create Page02_Background styles in `src/submodules/g8-drone-imaging/styles/Page02_Background.module.css`
  - Split layout (.splitLayout)
  - Text content area left
  - Image placeholder area right
  - Reading timer display

- [X] T025 [P] [US3] Create Page03_Hypothesis styles in `src/submodules/g8-drone-imaging/styles/Page03_Hypothesis.module.css`
  - Split layout
  - Question text left
  - Textarea right
  - Character count indicator

**Checkpoint**: User Story 3 complete - students can read background and form hypotheses

---

## Phase 6: User Story 4 - 确认注意事项并开始评测 (Priority: P4)

**Goal**: Students read notice, wait for countdown, and confirm before starting assessment

**Independent Test**: Enter Page 1 - verify 30-second countdown, checkbox disabled during countdown, enabled after, validation on proceed

### Implementation for User Story 4

- [X] T026 [US4] Create Page01_Cover component in `src/submodules/g8-drone-imaging/pages/Page01_Cover.tsx`
  - Display assessment notice content
  - Implement 30-second countdown timer (FR-001)
  - Disable checkbox during countdown
  - Enable checkbox after countdown completes
  - Validate checkbox checked before navigation (FR-002)
  - Show error "请先阅读注意事项并勾选确认后再继续"
  - Log CLICK_BLOCKED if validation fails
  - Log PAGE_ENTER/PAGE_EXIT events
  - Use .coverContent centered layout

- [X] T027 [P] [US4] Create Page01_Cover styles in `src/submodules/g8-drone-imaging/styles/Page01_Cover.module.css`
  - Centered content layout (.coverContent)
  - Countdown timer display at top
  - Notice text area
  - Checkbox styling (disabled/enabled states)
  - Next button at bottom

**Checkpoint**: User Story 4 complete - students can confirm notice and start assessment

---

## Phase 7: User Story 5 - 中途刷新后恢复进度 (Priority: P5)

**Goal**: System restores progress and filled answers after page refresh

**Independent Test**: Fill answers on any page, refresh browser, verify same page loads with answers restored

### Implementation for User Story 5

- [X] T028 [US5] Implement progress persistence in DroneImagingContext
  - Save currentPageId to localStorage on navigation
  - Save answers to localStorage on setAnswer
  - Save experimentHistory to localStorage on capture
  - Load all state in loadFromStorage called on mount

- [X] T029 [US5] Implement answer restoration in all page components
  - Call context.getAnswer(questionId) on mount
  - Pre-fill textarea/radio with restored value
  - Restore experiment state (height, focal, captureHistory)

- [X] T030 [US5] Handle initial page recovery in Component.tsx
  - Read initialPageId prop from Flow system
  - Map to correct pageId using mapping.ts
  - Pass to DroneImagingProvider

**Checkpoint**: User Story 5 complete - all progress persists across refreshes

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T031 [P] Add placeholder images to `src/submodules/g8-drone-imaging/assets/images/`
  - Background page illustration placeholder
  - Any other required placeholders

- [X] T032 Implement timer expiration handling in Component.tsx
  - Handle 20-minute task timer from container
  - On expiration: fill unanswered with "超时未回答"
  - Log AUTO_SUBMIT event
  - Call onComplete callback

- [X] T033 Implement data submission integration
  - Use createMarkObject for each page
  - Build operationList and answerList from context
  - Call container's defaultSubmit before navigation
  - Handle submission errors with retry

- [X] T034 [P] Add operation code sequencing
  - Maintain operation counter in context
  - Assign sequential codes to operations
  - Assign sequential codes to answers

- [X] T035 Run quickstart.md validation checklist
  - Verify all 7 pages accessible
  - Verify all validation rules work
  - Verify all 9 GSD combinations correct
  - Verify data submission format

- [X] T036 [P] Code cleanup and ESLint fixes
  - Run `npm run lint` on submodule
  - Fix any TypeScript errors
  - Ensure CSS Modules properly imported

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - User stories can proceed in priority order (P1 → P2 → P3 → P4 → P5)
  - Or in parallel if multiple developers available
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Phase 2 - Core experiment, no dependencies
- **User Story 2 (P2)**: Can start after Phase 2 - May use experiment components from US1
- **User Story 3 (P3)**: Can start after Phase 2 - Independent pages
- **User Story 4 (P4)**: Can start after Phase 2 - Entry page, independent
- **User Story 5 (P5)**: Depends on US1-US4 pages existing for persistence testing

### Within Each User Story

- Components before pages (DroneSimulator before Page04)
- Styles can parallel with components [P]
- Page composition depends on all its components

### Parallel Opportunities

**Phase 2 (Foundation)**:
- T004, T005 can parallel (different files)
- T006, T007, T008 sequential (dependencies)

**Phase 3 (US1)**:
- T009, T010, T011, T012, T013 all [P] (different files)
- T014 depends on T009-T012
- T015 can parallel with T014

**Phase 4 (US2)**:
- T016, T017, T018, T019, T020, T021 all [P] (different files)

**Phase 5 (US3)**:
- T022, T023, T024, T025 all [P] (different files)

---

## Parallel Example: User Story 1

```bash
# Launch all components in parallel:
Task: "Create DroneSimulator component" (T009)
Task: "Create HeightSelector component" (T010)
Task: "Create FocalLengthSelector component" (T011)
Task: "Create GSDDisplay component" (T012)
Task: "Create DroneSimulator styles" (T013)

# Then sequential:
Task: "Create Page04_Experiment component" (T014) - depends on T009-T012
Task: "Create Page04_Experiment styles" (T015) - can parallel with T014
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundation (T004-T008)
3. Complete Phase 3: User Story 1 (T009-T015)
4. **STOP and VALIDATE**: Test drone simulation with all 9 combinations
5. Demo core experiment functionality

### Incremental Delivery

1. Setup + Foundation → Core infrastructure ready
2. Add US1 (Experiment) → Can demo core simulation
3. Add US2 (Analysis) → Full assessment flow
4. Add US3 (Background) → Complete learning context
5. Add US4 (Notice) → Proper entry flow
6. Add US5 (Recovery) → Robustness
7. Polish → Production ready

### Recommended Execution Order

For single developer, follow priority order:
1. Foundation (T001-T008) - Must complete first
2. US1: P1 Experiment (T009-T015) - Core value
3. US4: P4 Notice (T026-T027) - Entry point
4. US3: P3 Background (T022-T025) - Context
5. US2: P2 Analysis (T016-T021) - Completion
6. US5: P5 Recovery (T028-T030) - Robustness
7. Polish (T031-T036) - Production ready

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- DroneSimulator is the most complex component - prioritize SVG conversion
- localStorage keys must use `module.g8-drone-imaging.*` namespace
- All events must use EventTypes enum, not strings
- Time format: YYYY-MM-DD HH:mm:ss

---

## Summary

- **Total Tasks**: 36
- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundation)**: 5 tasks
- **Phase 3 (US1 Experiment)**: 7 tasks (MVP)
- **Phase 4 (US2 Analysis)**: 6 tasks
- **Phase 5 (US3 Background)**: 4 tasks
- **Phase 6 (US4 Notice)**: 2 tasks
- **Phase 7 (US5 Recovery)**: 3 tasks
- **Phase 8 (Polish)**: 6 tasks
- **Parallel Opportunities**: 23 tasks marked [P]
- **MVP Scope**: Phase 1-3 (15 tasks)
