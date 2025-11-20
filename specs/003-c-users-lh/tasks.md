# Tasks: 光伏治沙交互实验子模块

**Input**: Design documents from `/specs/003-c-users-lh/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)  
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic CMI structure

- [ ] T001 Create submodule directory structure `src/submodules/g8-pv-sand-experiment/` with subdirs: pages/, components/, hooks/, styles/, constants/
- [ ] T002 [P] Add color variables for sky gradients in `src/styles/global.css`: --sky-gradient-top, --sky-gradient-bottom
- [ ] T003 [P] Create base TypeScript interfaces in `src/submodules/g8-pv-sand-experiment/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core CMI infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create constants file `src/submodules/g8-pv-sand-experiment/constants/windSpeedData.ts` with WIND_SPEED_DATA and HEIGHT_LEVELS
- [ ] T005 Create mapping file `src/submodules/g8-pv-sand-experiment/mapping.ts` with page ID mappings and CMI helper functions
- [ ] T006 [P] Create base context `src/submodules/g8-pv-sand-experiment/context/PvSandContext.tsx` for module state management
- [ ] T007 [P] Create custom hooks `src/submodules/g8-pv-sand-experiment/hooks/useExperimentState.tsx` for experiment state logic
- [ ] T008 [P] Create custom hooks `src/submodules/g8-pv-sand-experiment/hooks/useAnswerDrafts.tsx` for answer persistence
- [ ] T009 Create main component `src/submodules/g8-pv-sand-experiment/Component.tsx` with page routing and context setup
- [ ] T010 Create CMI definition `src/submodules/g8-pv-sand-experiment/index.tsx` with full SubmoduleDefinition export
- [ ] T011 Register submodule in `src/submodules/registry.ts` by adding g8PvSandExperimentSubmodule to registry map

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 完成实验前置引导流程 (Priority: P1) 🎯 MVP

**Goal**: 学生完成注意事项阅读、任务背景了解的引导流程，为实验做好准备

**Independent Test**: 可以独立启动模块，验证3个引导页面的显示、倒计时功能和确认机制，验证能够进入实验阶段

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create Page01InstructionsCover component in `src/submodules/g8-pv-sand-experiment/pages/Page01InstructionsCover.tsx` with 38s countdown and checkbox validation
- [ ] T013 [P] [US1] Create Page02Cover component in `src/submodules/g8-pv-sand-experiment/pages/Page02Cover.tsx` with start button and background image
- [ ] T014 [P] [US1] Create Page03Background component in `src/submodules/g8-pv-sand-experiment/pages/Page03Background.tsx` with 5s reading timer and background content
- [ ] T015 [P] [US1] Create CSS Module `src/submodules/g8-pv-sand-experiment/styles/Page01InstructionsCover.module.css` for notice page styling
- [ ] T016 [P] [US1] Create CSS Module `src/submodules/g8-pv-sand-experiment/styles/Page02Cover.module.css` for cover page styling  
- [ ] T017 [P] [US1] Create CSS Module `src/submodules/g8-pv-sand-experiment/styles/Page03Background.module.css` for background page styling
- [ ] T018 [US1] Implement countdown timers (38s and 5s) with proper cleanup and state management in respective page components
- [ ] T019 [US1] Implement navigation validation - checkbox must be checked on Page01, timer must complete on Page03
- [ ] T020 [US1] Add page lifecycle logging (page_enter/page_exit events) for all 3 pages using standard event types
- [ ] T021 [US1] Add operation logging for critical interactions (checkbox check, start button click, timer completion)

**Checkpoint**: At this point, User Story 1 should be fully functional - students can navigate through guidance pages with proper timers and validation

---

## Phase 4: User Story 2 - 设计并执行光伏治沙实验 (Priority: P2)

**Goal**: 学生设计实验方案并通过SVG仿真界面操作实验，观察光伏板对风速的影响

**Independent Test**: 可以独立测试实验设计输入、SVG动画交互、风速数据收集功能，验证实验仿真的准确性

### Implementation for User Story 2

- [ ] T022 [P] [US2] Create Page04ExperimentDesign component in `src/submodules/g8-pv-sand-experiment/pages/Page04ExperimentDesign.tsx` with text input validation (min 5 chars)
- [ ] T023 [P] [US2] Create Page05Tutorial component in `src/submodules/g8-pv-sand-experiment/pages/Page05Tutorial.tsx` with tutorial interaction guide
- [ ] T024 [P] [US2] Create Page06Experiment1 component in `src/submodules/g8-pv-sand-experiment/pages/Page06Experiment1.tsx` for 50cm height comparison experiment
- [ ] T025 [P] [US2] Create Page07Experiment2 component in `src/submodules/g8-pv-sand-experiment/pages/Page07Experiment2.tsx` for trend analysis experiment
- [ ] T026 [P] [US2] Create WindSpeedSimulator component in `src/submodules/g8-pv-sand-experiment/components/WindSpeedSimulator.tsx` with SVG animation and data display
- [ ] T027 [P] [US2] Create HeightController component in `src/submodules/g8-pv-sand-experiment/components/HeightController.tsx` for 20/50/100cm height selection
- [ ] T028 [P] [US2] Create ExperimentPanel component in `src/submodules/g8-pv-sand-experiment/components/ExperimentPanel.tsx` for start/reset controls
- [ ] T029 [P] [US2] Create CSS Module `src/submodules/g8-pv-sand-experiment/styles/WindSpeedSimulator.module.css` with 60FPS animation styles and hardware acceleration
- [ ] T030 [P] [US2] Create CSS Module `src/submodules/g8-pv-sand-experiment/styles/Page04ExperimentDesign.module.css` for design page layout
- [ ] T031 [P] [US2] Create CSS Module `src/submodules/g8-pv-sand-experiment/styles/Page05Tutorial.module.css` for tutorial page styling
- [ ] T032 [P] [US2] Create CSS Module `src/submodules/g8-pv-sand-experiment/styles/Page06Experiment1.module.css` for experiment page layout
- [ ] T033 [P] [US2] Create CSS Module `src/submodules/g8-pv-sand-experiment/styles/Page07Experiment2.module.css` for experiment page layout
- [ ] T034 [US2] Implement SVG wind speed animation with 2-second duration using CSS animations and JavaScript control
- [ ] T035 [US2] Integrate WIND_SPEED_DATA constants into WindSpeedSimulator for consistent experimental results
- [ ] T036 [US2] Implement height parameter switching (20/50/100cm) with corresponding data lookup from constants
- [ ] T037 [US2] Add experiment operation logging (start_experiment, height_change, reset_experiment events) with detailed values
- [ ] T038 [US2] Implement text input validation for Page04 with minimum 5 character requirement and real-time feedback
- [ ] T039 [US2] Add answer collection for experiment design text input and choice selections
- [ ] T040 [US2] Implement device performance detection and SVG animation fallback for low-performance devices

**Checkpoint**: At this point, User Stories 1 AND 2 should work independently - students can complete guidance and run experiments

---

## Phase 5: User Story 3 - 数据分析与结论总结 (Priority: P3)

**Goal**: 学生分析不同高度下光伏板对风速影响的实验数据，得出科学结论

**Independent Test**: 可以独立测试数据可视化组件、问答交互和结论提交功能，验证学生能够正确分析实验结果

### Implementation for User Story 3

- [ ] T041 [P] [US3] Create Page08Analysis component in `src/submodules/g8-pv-sand-experiment/pages/Page08Analysis.tsx` with data visualization and conclusion questions
- [ ] T042 [P] [US3] Create DataVisualization component in `src/submodules/g8-pv-sand-experiment/components/DataVisualization.tsx` using Recharts for line charts
- [ ] T043 [P] [US3] Create CSS Module `src/submodules/g8-pv-sand-experiment/styles/Page08Analysis.module.css` for analysis page layout
- [ ] T044 [P] [US3] Create CSS Module `src/submodules/g8-pv-sand-experiment/styles/DataVisualization.module.css` for chart styling  
- [ ] T045 [US3] Implement line chart visualization showing wind speed data across different heights (20/50/100cm)
- [ ] T046 [US3] Create comparison visualization between "with panel" vs "no panel" wind speeds using dual lines
- [ ] T047 [US3] Add chart legend, axis labels, and data point annotations for clear data interpretation
- [ ] T048 [US3] Implement conclusion questions with text area inputs and validation for required answers
- [ ] T049 [US3] Add answer collection for all conclusion questions with proper targetElement naming (P5.8_结论问题1, etc.)
- [ ] T050 [US3] Implement final page validation - all conclusion answers must be filled before submission
- [ ] T051 [US3] Add comprehensive operation logging for data visualization interactions and answer inputs

**Checkpoint**: All user stories should now be independently functional - complete experimental workflow from guidance to conclusion

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Integration, optimization and final touches that affect multiple user stories

- [ ] T052 [P] Implement usePageSubmission Hook integration in `src/submodules/g8-pv-sand-experiment/Component.tsx` with proper MarkObject construction
- [ ] T053 [P] Add Flow context bridge component `src/submodules/g8-pv-sand-experiment/components/FlowBridge.tsx` for progress synchronization  
- [ ] T054 [P] Implement answer draft persistence using localStorage with module-specific keys (module.g8-pv-sand-experiment.answers)
- [ ] T055 [P] Implement experiment state persistence using sessionStorage with automatic recovery on page refresh
- [ ] T056 [P] Add error boundaries and fallback UI for SVG animation failures with graceful degradation
- [ ] T057 [P] Create shared CSS Module `src/submodules/g8-pv-sand-experiment/styles/shared.module.css` for common styling patterns
- [ ] T058 Implement proper page number encoding using dot-separated format (H.1, H.2, H.3, 1.4, 2.5, 3.6, 4.7, 5.8)
- [ ] T059 Add pageDesc formatting with flow context prefix ([flowId/g8-pv-sand-experiment/stepIndex] page description)
- [ ] T060 Implement navigation mode logic (hidden for pages 1-3, experiment for pages 4-8) in mapping.ts
- [ ] T061 Add input validation with click_blocked event logging for failed validation attempts
- [ ] T062 Implement timer configuration support through options.timers prop with 20-minute default
- [ ] T063 Add comprehensive ESLint check and fix any warnings to achieve zero-warning compliance
- [ ] T064 Add UTF-8 encoding verification for all source files ensuring proper Chinese character display
- [ ] T065 Run full integration test of complete user workflow from Page 1 to Page 8 with data submission

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Uses constants from Phase 2, independent of US1
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) - Uses data visualization, independent of US1/US2

### Within Each User Story

- Page components marked [P] can be created in parallel
- CSS modules marked [P] can be created in parallel
- Components must exist before integration tasks
- Styling should be completed before testing animations
- Data integration happens after component structure is ready

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, all user stories can start in parallel (if team capacity allows)
- Page components within each story marked [P] can be developed simultaneously
- CSS modules marked [P] can be styled in parallel
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 2

```bash
# Launch all page components for User Story 2 together:
Task: "Create Page04ExperimentDesign component"
Task: "Create Page05Tutorial component" 
Task: "Create Page06Experiment1 component"
Task: "Create Page07Experiment2 component"

# Launch all core components for User Story 2 together:
Task: "Create WindSpeedSimulator component"
Task: "Create HeightController component"
Task: "Create ExperimentPanel component"

# Launch all CSS modules for User Story 2 together:
Task: "Create WindSpeedSimulator CSS module"
Task: "Create Page04ExperimentDesign CSS module"
Task: "Create Page05Tutorial CSS module"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Guidance Flow)
4. **STOP and VALIDATE**: Test guidance pages independently with proper timers and validation
5. Deploy/demo basic submodule integration with Flow system

### Incremental Delivery

1. Complete Setup + Foundational → CMI foundation ready
2. Add User Story 1 → Test guidance flow independently → Demo guidance workflow (MVP!)
3. Add User Story 2 → Test experiment simulation independently → Demo interactive experiments
4. Add User Story 3 → Test data analysis independently → Demo complete educational workflow
5. Each story adds substantial educational value without breaking previous functionality

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together (T001-T011)
2. Once Foundational is done:
   - Developer A: User Story 1 - Guidance pages (T012-T021)
   - Developer B: User Story 2 - Experiment simulation (T022-T040) 
   - Developer C: User Story 3 - Data analysis (T041-T051)
3. Stories complete and integrate through shared context and constants
4. Team collaborates on Polish phase for final integration (T052-T065)

---

## Summary

**Total Tasks**: 65 tasks across 6 phases
**Task Distribution by User Story**:
- Setup & Foundational: 11 tasks
- User Story 1 (Guidance): 10 tasks
- User Story 2 (Experiment): 19 tasks  
- User Story 3 (Analysis): 11 tasks
- Polish & Integration: 14 tasks

**Parallel Opportunities**: 31 tasks marked [P] can run in parallel within their phases
**Independent Test Criteria**: Each user story can be validated independently without requiring others
**MVP Scope**: User Story 1 provides a complete guidance workflow suitable for initial demonstration

## Notes

- [P] tasks = different files, no dependencies within phase
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Focus on CMI interface compliance and Flow system integration
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All file paths use absolute paths within the submodule structure
- Strict adherence to project constitution and coding standards required