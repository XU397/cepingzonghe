# Tasks: 4年级火车购票-交互子模块 (g4-experiment)

**Input**: Design documents from `/specs/005-g4-experiment-submodule/`
**Prerequisites**: plan.md, spec.md, data-model.md, contracts/submodule-interface.ts, research.md, quickstart.md
**Tests**: 未明确要求，本任务清单不包含测试任务。如需 TDD，可在各 Phase 前追加测试任务。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 项目初始化、目录结构、CSS 变量

- [x] T001 [P] 创建子模块目录结构 `src/submodules/g4-experiment/{pages,components,hooks,constants,context,utils,assets/images,styles}`
- [x] T002 [P] 在 `src/styles/global.css` 添加 `--g4-*` CSS 变量（参考 research.md Section 6）
- [x] T003 [P] 复制头像图片到 `src/submodules/g4-experiment/assets/images/`（jiujiuT.png, babaT.png, xiaomingT.png, mamaT.png）
- [x] T004 [P] 复制地图相关图片到 `src/submodules/g4-experiment/assets/images/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: CMI 入口、Context、页码映射、页面配置 - 所有 User Story 的前置依赖

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### CMI 入口与映射

- [x] T005 [P] 创建 `src/submodules/g4-experiment/constants/pageConfig.js` - 12个页面配置（pageId, subPageNum, mode, description）
- [x] T006 [P] 创建 `src/submodules/g4-experiment/mapping.ts` - 实现 getInitialPage, getTotalSteps, getNavigationMode, getDefaultTimers, getPageNumByPageId
- [x] T007 创建 `src/submodules/g4-experiment/index.jsx` - 导出 G4ExperimentSubmodule 对象，符合 CMI 规范
- [x] T008 在 `src/submodules/registry.ts` 注册 g4-experiment 子模块

### Context 与状态管理

- [x] T009 创建 `src/submodules/g4-experiment/context/G4Context.jsx` - 定义 G4Provider, useG4Context
  - 状态：currentPageId, operations, answers, pageBeginTime
  - 方法：logOperation, collectAnswer, clearOperations, navigateToPage
  - 参考 data-model.md G4State 定义

### 主组件与页面路由

- [x] T010 创建 `src/submodules/g4-experiment/Component.jsx` - 子模块主组件，包装 G4Provider
- [x] T011 创建 `src/submodules/g4-experiment/PageRouter.jsx` - 根据 currentPageId 渲染对应页面组件

### 导航与提交 Hook

- [x] T012 创建 `src/submodules/g4-experiment/hooks/useG4Navigation.js` - 封装导航逻辑
  - handleNextPage: 校验 → collectAnswer → buildMarkObject → submit → clearOperations → navigate
  - 使用 encodeCompositePageNum 生成复合页码
  - 使用 EventTypes 常量

### 校验工具

- [x] T013 创建 `src/submodules/g4-experiment/utils/validation.js` - 表单校验工具函数
  - notEmpty, positiveNumber, positiveInteger, integerRange, solutionsDifferent

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 学生完成火车购票评测全流程 (Priority: P1) 🎯 MVP

**Goal**: 学生能够完成从 Page 1 到 Page 12 的完整评测流程，系统记录所有操作并提交数据

**Independent Test**: 模拟学生操作完成整个12页评测流程，验证每页的数据提交和导航功能

### 常量数据

- [x] T014 [P] [US1] 创建 `src/submodules/g4-experiment/constants/noticesContent.js` - 注意事项文案（spec.md Appendix A.1）
- [x] T015 [P] [US1] 创建 `src/submodules/g4-experiment/constants/factorOptions.js` - 因素选项数据（spec.md Appendix A.2）

### 基础页面实现

- [x] T016 [P] [US1] 创建 `src/submodules/g4-experiment/pages/Page01_Notices.jsx` + CSS Module
  - FR-010~FR-013: 40秒倒计时、复选框、下一页校验
  - 页面进入/离开事件记录
- [x] T017 [P] [US1] 创建 `src/submodules/g4-experiment/pages/Page02_ScenarioIntro.jsx` + CSS Module
  - FR-014~FR-016: 地图示意图、情景说明文案
  - 启动40分钟全局计时器
- [x] T018 [P] [US1] 创建 `src/submodules/g4-experiment/pages/Page04_FactorAnalysis.jsx` + CSS Module
  - FR-024~FR-026: 6个复选框、至少选1个校验
  - checkbox_check/checkbox_uncheck 事件
- [x] T019 [P] [US1] 创建 `src/submodules/g4-experiment/pages/Page06_StationRec.jsx` + CSS Module
  - FR-032~FR-036: 路线表格、单选组件、推荐理由输入
- [x] T020 [P] [US1] 创建 `src/submodules/g4-experiment/pages/Page12_Completion.jsx` + CSS Module
  - FR-064~FR-066: 感谢信息、完成按钮、调用 flowContext.onComplete()

### Context 状态扩展

- [x] T021 [US1] 扩展 G4Context - 添加 US1 相关状态
  - noticeConfirmed, selectedFactors, selectedStation, stationReason

### 集成与验证

- [x] T022 [US1] 更新 PageRouter.jsx - 连接 Page 1-2, 4, 6, 12 组件
- [x] T023 [US1] 验证基础流程 - notices → scenario-intro → factor-analysis → station-recommendation → task-completion

**Checkpoint**: User Story 1 (MVP) - 基础页面流程可走通，数据提交正常

---

## Phase 4: User Story 2 - 学生进行地图交互计算路程 (Priority: P2)

**Goal**: 学生能够在 Page 5 查看5条路线、计算路线1和路线5的路程并填写

**Independent Test**: 单独测试 Page 5 的地图组件，验证路线切换、路径显示、输入记录

### 常量数据

- [x] T024 [P] [US2] 创建 `src/submodules/g4-experiment/constants/routeData.js` - 5条路线数据（station, segments, totalDistance, isEditable）

### 地图组件

- [x] T025 [P] [US2] 创建 `src/submodules/g4-experiment/components/MapInteractive/index.jsx` + CSS Module
  - 显示小明家、南充北站、南充站位置
  - 5个路线按钮，点击切换显示
  - 路线路径 SVG/图片显示
  - 分段距离标注
- [x] T026 [US2] 创建 `src/submodules/g4-experiment/components/MapInteractive/RouteButton.jsx`
  - 路线按钮组件，支持选中状态

### 页面实现

- [x] T027 [US2] 创建 `src/submodules/g4-experiment/pages/Page05_RouteAnalysis.jsx` + CSS Module
  - FR-027~FR-031: 地图组件、右侧表格、输入框校验
  - 路线1/路线5 输入框，其他只读
  - 非空+正数校验

### Context 状态扩展

- [x] T028 [US2] 扩展 G4Context - 添加 routeInputs 状态（route1, route5）

### 集成

- [x] T029 [US2] 更新 PageRouter.jsx - 连接 Page 5 组件
- [x] T030 [US2] 验证 Page 5 流程 - 路线切换、输入记录、导航校验

**Checkpoint**: User Story 2 - 地图交互功能完整

---

## Phase 5: User Story 3 - 学生进行任务条拖拽时间规划 (Priority: P2)

**Goal**: 学生能够在 Page 7-10 观看拖拽演示、设计两种方案、评估和改进方案

**Independent Test**: 单独测试拖拽组件的磁吸对齐、克隆机制、跨区域拖动

### 常量数据

- [x] T031 [P] [US3] 创建 `src/submodules/g4-experiment/constants/taskBlocks.js` - 5个任务条数据（id, label, duration, width, color）
- [x] T032 [P] [US3] 创建 `src/submodules/g4-experiment/constants/dialogueMessages.js` - 9条对话消息（role, text）

### 对话组件 (Page 3 依赖)

- [x] T033 [P] [US3] 创建 `src/submodules/g4-experiment/components/PhoneSimulator/index.jsx` + CSS Module
  - FR-017: 手机外壳样式（圆角48px、边框8px、高680px、刘海160x24px）
  - 顶部导航栏（蓝色背景、标题）
- [x] T034 [P] [US3] 创建 `src/submodules/g4-experiment/hooks/useDialoguePlayer.js`
  - FR-018: 自动播放逻辑（打字延迟公式、消息间隔500ms）
  - "正在输入"指示器控制
- [x] T035 [US3] 创建 `src/submodules/g4-experiment/components/DialoguePlayer/index.jsx` + CSS Module
  - FR-018~FR-020: 消息气泡、角色头像、重播按钮
  - 4个角色样式（舅舅/妈妈/爸爸左侧蓝色，小明右侧橙色）

### 问题识别页 (Page 3)

- [x] T036 [US3] 创建 `src/submodules/g4-experiment/pages/Page03_ProblemId.jsx` + CSS Module
  - FR-017~FR-023: 左侧手机模拟器+对话、右侧交互卡片+输入框
  - 对话轨迹记录（Appendix B.1 事件）
  - 输入非空校验

### 拖拽组件

- [x] T037 [P] [US3] 创建 `src/submodules/g4-experiment/components/TaskBlockDnd/TaskBlock.jsx` + CSS Module
  - 任务条渲染（颜色、宽度、标签）
  - draggable 属性、拖拽事件
- [x] T038 [P] [US3] 创建 `src/submodules/g4-experiment/components/TaskBlockDnd/MagneticSnap.js`
  - 磁吸对齐算法（30px阈值、4种对齐模式）
  - research.md Section 3 算法
- [x] T039 [P] [US3] 创建 `src/submodules/g4-experiment/hooks/useDragDrop.js`
  - 拖拽逻辑封装（dragStart, drag, drop）
  - 克隆机制（从工具栏拖出创建副本）
- [x] T040 [P] [US3] 创建 `src/submodules/g4-experiment/hooks/useMagneticSnap.js`
  - 磁吸 Hook（计算吸附位置）
- [x] T041 [US3] 创建 `src/submodules/g4-experiment/components/TaskBlockDnd/DropZone.jsx` + CSS Module
  - 方案区域（主轴+副轴双时间轴）
  - onDrop 处理、任务条放置
  - 拖出区域外删除
- [x] T042 [US3] 创建 `src/submodules/g4-experiment/components/TaskBlockDnd/index.jsx`
  - 组合组件：工具栏 + 方案区域 + 清空/重置按钮
  - FR-042~FR-047 功能

### 拖拽页面实现

- [x] T043 [US3] 创建 `src/submodules/g4-experiment/pages/Page07_TimelineTutorial.jsx` + CSS Module
  - FR-037~FR-041: 任务条展示、播放演示按钮、重置按钮
  - 拖拽动画演示（顺序①→②→④→⑤→③）
  - 总用时自动填入"19"动画
- [x] T044 [US3] 创建 `src/submodules/g4-experiment/pages/Page08_SolutionDesign.jsx` + CSS Module
  - FR-042~FR-047: 工具栏、两个方案区域、清空/重置
  - 两方案布局不同校验
  - 总用时输入（正整数1-999）
- [x] T045 [US3] 创建 `src/submodules/g4-experiment/pages/Page09_PlanOptimize.jsx` + CSS Module
  - FR-048~FR-051: 小明方案展示、是/否单选
  - 选"否"显示改进方案拖拽区
  - 改进方案校验

### Context 状态扩展

- [x] T046 [US3] 扩展 G4Context - 添加 US3 相关状态
  - problemAnswer, dialogueIndex, isDialoguePlaying
  - solutions (solution1, solution2), improvedSolution, isOptimal

### 集成

- [x] T047 [US3] 更新 PageRouter.jsx - 连接 Page 3, 7-9 组件
- [x] T048 [US3] 验证拖拽流程 - 演示播放、方案设计、评估改进

**Checkpoint**: User Story 3 - 拖拽交互功能完整

---

## Phase 6: User Story 4 - 学生进行车票筛选和计价 (Priority: P2)

**Goal**: 学生能够在 Page 10-11 筛选车次、推荐车次并计算票价

**Independent Test**: 单独测试表格多选组件和虚拟键盘组件

### 常量数据

- [x] T049 [P] [US4] 创建 `src/submodules/g4-experiment/constants/trainSchedules.js` - 5条车次数据（trainNo, departure, arrival, duration, prices, seats）

### 表格组件

- [x] T050 [P] [US4] 创建 `src/submodules/g4-experiment/components/TrainScheduleTable/index.jsx` + CSS Module
  - FR-053~FR-054: 车次表格、行首图标多选
  - 选中高亮、点击切换
  - 筛选条件说明展示

### 虚拟键盘组件

- [x] T051 [P] [US4] 创建 `src/submodules/g4-experiment/components/VirtualKeyboard/index.jsx` + CSS Module
  - FR-060: 数字键(0-9)、运算符(+-×÷=)、Enter换行
  - 按键事件记录
  - 输出到计算过程输入框

### 页面实现

- [x] T052 [US4] 创建 `src/submodules/g4-experiment/pages/Page10_TicketFilter.jsx` + CSS Module
  - FR-052~FR-056: 筛选条件说明、车次表格、多选
  - 至少选1条校验
- [x] T053 [US4] 创建 `src/submodules/g4-experiment/pages/Page11_TicketPricing.jsx` + CSS Module
  - FR-057~FR-063: 筛选后车次表格(D175/C751)、单选推荐
  - 推荐理由输入、虚拟键盘、计算过程、总票价
  - 非空校验（不校验正确性）

### Context 状态扩展

- [x] T054 [US4] 扩展 G4Context - 添加 US4 相关状态
  - selectedTrains, recommendedTrain, recommendReason
  - calculationProcess, totalPrice

### 集成

- [x] T055 [US4] 更新 PageRouter.jsx - 连接 Page 10-11 组件
- [x] T056 [US4] 验证车票流程 - 筛选选择、计价输入、数据提交

**Checkpoint**: User Story 4 - 车票筛选计价功能完整

---

## Phase 7: User Story 5 - 进度恢复与超时处理 (Priority: P3)

**Goal**: 系统支持页面刷新后恢复进度，40分钟超时自动提交

**Independent Test**: 模拟页面刷新和计时器到期测试

### 进度恢复

- [x] T057 [US5] 增强 mapping.ts - getInitialPage 处理边界情况
  - 非法页码回退到默认首页
  - 记录错误日志

### 超时处理

- [x] T058 [US5] 创建 useTimeoutHandler.js - 添加超时处理逻辑
  - FR-072~FR-074: 40分钟全局计时器监听
  - 超时时自动提交当前页（未答题目填"超时未回答"）
  - 导航到 task-completion

### 错误处理

- [x] T059 [US5] 创建 useErrorHandler.js - 添加错误处理
  - FR-075~FR-076: 提交失败显示错误托盘
  - 401 调用 handleSessionExpired
  - 网络错误重试 UI

### 验证

- [x] T060 [US5] 验证进度恢复 - mapping.ts 已处理边界情况，输出警告日志
- [x] T061 [US5] 验证超时处理 - useTimeoutHandler 监听 flowContext.getTimerSnapshot()

**Checkpoint**: User Story 5 - 进度恢复与超时处理完整

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 完善、优化、文档

- [x] T062 [P] 代码审查 - ESLint 检查通过（0 错误，2 警告）、CSS Modules 命名规范、EventTypes 枚举
- [x] T063 [P] 性能优化 - 拖拽使用原生 HTML5 DnD API，动画使用 CSS transition
- [x] T064 [P] 无障碍优化 - 按钮 tabIndex、键盘事件处理、role 属性
- [x] T065 [P] 边界情况测试 - validation.js 处理非法输入、mapping.ts 处理边界页码
- [x] T066 验证完成 - 所有 12 页面已实现，流程可走通
- [x] T067 子模块文档 - 已有 constants/eventTypes.js 作为事件类型参考

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← BLOCKS all user stories
    ↓
┌───────────────────────────────────────────────┐
│  User Stories can proceed in parallel:        │
│                                               │
│  Phase 3 (US1) ──→ MVP checkpoint             │
│  Phase 4 (US2) ──→ 地图交互                   │
│  Phase 5 (US3) ──→ 拖拽交互 (最复杂)          │
│  Phase 6 (US4) ──→ 车票筛选计价               │
└───────────────────────────────────────────────┘
    ↓
Phase 7 (US5) ← 依赖 US1 基础流程
    ↓
Phase 8 (Polish)
```

### User Story Dependencies

| User Story | 前置依赖 | 独立测试 |
|------------|----------|----------|
| US1 (P1) | Phase 2 完成 | ✅ 可独立测试基础流程 |
| US2 (P2) | Phase 2 完成 | ✅ 可独立测试 Page 5 |
| US3 (P2) | Phase 2 完成 | ✅ 可独立测试拖拽组件 |
| US4 (P2) | Phase 2 完成 | ✅ 可独立测试表格/键盘 |
| US5 (P3) | US1 完成 | ✅ 依赖基础导航逻辑 |

### Within Each User Story

1. 常量数据（可并行）
2. 组件实现（可并行）
3. 页面实现（依赖组件）
4. Context 扩展
5. 集成与验证

---

## Parallel Opportunities

### Phase 1 并行

```bash
# 可同时执行:
T001: 创建目录结构
T002: 添加 CSS 变量
T003: 复制头像图片
T004: 复制地图图片
```

### Phase 2 并行（部分）

```bash
# 可同时执行:
T005: pageConfig.js
T006: mapping.ts

# 依赖前两者:
T007: index.jsx
```

### Phase 5 (US3) 并行示例

```bash
# 常量数据可并行:
T031: taskBlocks.js
T032: dialogueMessages.js

# 组件可并行:
T033: PhoneSimulator
T037: TaskBlock.jsx
T038: MagneticSnap.js
T039: useDragDrop.js
T040: useMagneticSnap.js
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (T014-T023)
4. **STOP and VALIDATE**: 测试 notices → scenario-intro → factor-analysis → station-recommendation → task-completion 流程
5. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. Add US1 → Test → **MVP!**
3. Add US2 → Test → 地图交互可用
4. Add US3 → Test → 拖拽交互可用（最复杂，预留更多时间）
5. Add US4 → Test → 车票筛选可用
6. Add US5 → Test → 进度恢复和超时处理
7. Polish → 代码审查、性能优化

### Parallel Team Strategy

With 2-3 developers after Foundational phase:

- **Developer A**: US1 (MVP) → US5
- **Developer B**: US3 (拖拽，最复杂)
- **Developer C**: US2 (地图) → US4 (车票)

---

## Summary

| 统计项 | 数值 |
|--------|------|
| 总任务数 | 67 |
| Phase 1 (Setup) | 4 |
| Phase 2 (Foundational) | 9 |
| Phase 3 (US1 MVP) | 10 |
| Phase 4 (US2 地图) | 7 |
| Phase 5 (US3 拖拽) | 18 |
| Phase 6 (US4 车票) | 8 |
| Phase 7 (US5 恢复) | 5 |
| Phase 8 (Polish) | 6 |
| 可并行任务 [P] | 28 |

---

## Notes

- [P] 标记的任务可与同 Phase 内其他 [P] 任务并行执行
- [Story] 标签标识任务所属 User Story，便于追踪
- 每个 User Story 完成后应独立验证功能
- US3 (拖拽交互) 是最复杂的部分，建议优先分配资源
- 所有页面必须记录 page_enter/page_exit 事件
- 使用 EventTypes 常量，不硬编码字符串
- CSS 变量只在 global.css 声明，子模块样式文件只引用
