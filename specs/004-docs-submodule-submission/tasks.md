# Tasks: 子模块数据提交标准化

**Input**: Design documents from `/specs/004-docs-submodule-submission/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: 快照测试用于验证提交数据格式，作为实现的一部分包含在各用户故事中。

**Organization**: 任务按用户故事组织，支持独立实现和测试。

## Format: `[ID] [P?] [Story] Description`
- **[P]**: 可并行执行（不同文件，无依赖）
- **[Story]**: 所属用户故事（US1, US2, US3, US4, US5）
- 包含精确文件路径

## Path Conventions
- **共享适配器**: `src/shared/services/submission/submoduleAdapter/`
- **子模块**: `src/submodules/<name>/` 或 `src/modules/<name>/`
- **测试**: `src/shared/services/submission/__tests__/`

---

## Phase 1: Setup (共享基础设施)

**Purpose**: 创建共享适配器目录结构和基础常量

- [x] T001 [P] 创建目录结构 `src/shared/services/submission/submoduleAdapter/`
- [x] T002 [P] 创建常量文件 `src/shared/services/submission/submoduleAdapter/constants.ts` (RESERVED_ELEMENTS, DEFAULTS)
- [x] T003 [P] 创建类型定义 `src/shared/services/submission/submoduleAdapter/types.ts` (Operation, AnswerEntry, MarkObject, FlowContext, SubmoduleMappingConfig)
- [x] T004 **RESERVED_ELEMENTS 对表确认**: 扫描现有子模块中所有无前缀的 targetElement，确保 RESERVED_ELEMENTS 列表覆盖所有系统级事件名
  - 执行命令: `grep -r "targetElement.*['\"]" src/submodules/ src/modules/grade-7-tracking/ | grep -v "P[0-9]"`
  - 确认列表: page, next_button, prev_button, module, flow_context, task_timer, countdown
- [x] T005 创建导出入口 `src/shared/services/submission/submoduleAdapter/index.ts`

---

## Phase 2: User Story 1 - 共享提交适配层基础设施 (Priority: P0) 🎯 MVP

**Goal**: 提供统一的 `usePageMeta`、`useOperationLogger`、`collectAnswers`、`validateMarkBeforeSubmit`、`buildPageDesc`、`appendExperimentHistory`、`validateMappingConfig` 工具函数

**Independent Test**: 单元测试验证各工具函数的输入输出符合规范

### Implementation for User Story 1

- [x] T006 [P] [US1] 实现 `usePageMeta` Hook 在 `src/shared/services/submission/submoduleAdapter/usePageMeta.ts`
  - 输入: stepIndex, subPageNum
  - 输出: pageNumber (格式 `<index>.<twoDigits>`), targetPrefix (`P${pageNumber}_`), prefixTarget 函数
  - 使用现有 `encodeCompositePageNum` 函数

- [x] T007 [P] [US1] 实现 `useOperationLogger` Hook 在 `src/shared/services/submission/submoduleAdapter/useOperationLogger.ts`
  - **接收 `options: { pageNumber, targetPrefix, flowContext }` 参数**
  - 管理 codeRef（每页从 1 开始）
  - 为业务元素自动添加 targetPrefix 前缀
  - 为保留元素豁免前缀（使用 RESERVED_ELEMENTS）
  - 在首次 PAGE_ENTER 后自动注入 flow_context
  - 提供 clearOperations 重置函数

- [x] T008 [P] [US1] 实现 `collectAnswers` 函数在 `src/shared/services/submission/submoduleAdapter/collectAnswers.ts`
  - 输入: pageId, answers, SubmoduleMappingConfig
  - 输出: AnswerEntry[] (code 来自 QUESTION_CODE_MAP 映射, targetElement 为 QUESTION_TEXT_MAP 完整题干)
  - **不处理实验历史**（实验历史由 `appendExperimentHistory` 独立处理）

- [x] T009 [P] [US1] 实现 `buildPageDesc` 函数在 `src/shared/services/submission/submoduleAdapter/buildPageDesc.ts`
  - 输入: pageTitle, flowContext (可选)
  - Flow 模式下输出: `[flowId/submoduleId/stepIndex] pageTitle`
  - 独立模式下输出: pageTitle

- [x] T010 [P] [US1] 实现 `appendExperimentHistory` 函数在 `src/shared/services/submission/submoduleAdapter/appendExperimentHistory.ts`
  - 输入: `answerList, data, { targetElement, historyCodeBase }`
  - **单条追加**实验历史到 answerList
  - code **固定为** `historyCodeBase`（不使用 index 递增）
  - targetElement **由调用方传入**（如 `P1.05_实验历史`）

- [x] T011 [P] [US1] 实现 `validateMarkBeforeSubmit` 函数在 `src/shared/services/submission/submoduleAdapter/validateMark.ts`
  - 校验 pageNumber 格式 `/^[1-9]\d*\.\d{2}$/`
  - 校验 targetElement 前缀（保留元素豁免）
  - 校验 code 从 1 开始连续递增
  - 校验必填事件（page_enter, page_exit）
  - **Flow 模式下强制校验 operationList 包含 flow_context 事件**

- [x] T012 [P] [US1] 实现 `validateMappingConfig` 函数在 `src/shared/services/submission/submoduleAdapter/validateMappingConfig.ts`
  - 校验必填字段存在: PAGE_CONFIGS, PAGE_DESC_MAP, PAGE_QUESTIONS, QUESTION_CODE_MAP, QUESTION_TEXT_MAP, ANSWER_KEY_TO_QUESTION, getSubPageNumByPageId
  - 校验字段类型正确
  - 校验 QUESTION_CODE_MAP 中的 code 无重复
  - **校验 QUESTION_CODE_MAP 对 ANSWER_KEY_TO_QUESTION 的覆盖完整性**（遍历 PAGE_QUESTIONS 中所有问题键，通过 ANSWER_KEY_TO_QUESTION 映射后检查 QUESTION_CODE_MAP 是否有对应 code）

- [x] T013 [US1] 更新导出入口 `src/shared/services/submission/submoduleAdapter/index.ts` 导出所有工具

- [x] T014 [US1] 编写单元测试 `src/shared/services/submission/__tests__/submoduleAdapter.test.ts`
  - usePageMeta 格式验证
  - useOperationLogger: options 参数、code 递增、targetPrefix 前缀、clearOperations 重置
  - collectAnswers: 映射转换（不含实验历史）
  - buildPageDesc: Flow 模式前缀、独立模式原标题
  - appendExperimentHistory: 单条追加、code 固定为 historyCodeBase
  - validateMarkBeforeSubmit: 各项校验（含 flow_context 强制校验）
  - validateMappingConfig: 必填字段、code 去重、**覆盖完整性校验**

**Checkpoint**: 共享适配器完成，可独立测试各工具函数

---

## Phase 3: User Story 2 - g8-pv-sand 子模块修复 (Priority: P1)

**Goal**: 修复 g8-pv-sand 的 pageNumber 编码和 targetElement 前缀不一致问题

**Independent Test**: 快照测试验证 g8-pv-sand 提交数据格式符合规范

### Implementation for User Story 2

- [x] T015 [US2] 创建 g8-pv-sand 映射配置 `src/submodules/g8-pv-sand-experiment/mapping.ts`
  - PAGE_CONFIGS (各页面配置)
  - PAGE_DESC_MAP (页面描述)
  - PAGE_QUESTIONS (每页问题键)
  - QUESTION_CODE_MAP (问题 ID → code)
  - QUESTION_TEXT_MAP (问题 ID → 完整题干)
  - ANSWER_KEY_TO_QUESTION (答案键映射)
  - HISTORY_CODE_BASE = 100

- [x] T016 [US2] 修复 `src/submodules/g8-pv-sand-experiment/context/PvSandContext.tsx`
  - 修改 getPagePrefix 使用 `encodeCompositePageNum(stepIndex + 1, subPageNum)`
  - 确保 targetPrefix 与 pageNumber 编码一致

- [x] T017 [US2] 修改 `src/submodules/g8-pv-sand-experiment/Component.tsx`
  - buildMark 使用 `encodeCompositePageNum(stepIndex + 1, subPageNum)` 编码 pageNumber
  - 使用共享 `buildPageDesc` 在 Flow 模式下包含 `[flowId/submoduleId/stepIndex]` 前缀
  - 使用共享 `appendExperimentHistory` 处理实验历史

- [x] T018 [US2] 确保页面导航时重置 operations 和 codeRef
  - navigateToPage 调用前执行 clearOperations()

- [x] T019 [US2] 编写快照测试 `src/submodules/g8-pv-sand-experiment/__tests__/submission.snapshot.test.ts`
  - 测试 experiment_design 页面
  - 测试 experiment_task1 页面

**Checkpoint**: g8-pv-sand 提交数据格式符合规范，可作为其他子模块参考

---

## Phase 4: User Story 3 - g8-mikania 子模块修复 (Priority: P2)

**Goal**: 修复 g8-mikania 的独立模式 pageNumber 格式、flow_context 注入和 pageDesc 前缀问题

**Independent Test**: 快照测试验证 g8-mikania 在独立模式和 Flow 模式下的提交数据格式

### Implementation for User Story 3

- [x] T020 [US3] 创建 g8-mikania 映射配置 `src/submodules/g8-mikania-experiment/mapping.ts`
  - 同 US2 格式

- [x] T021 [US3] 修改 `src/submodules/g8-mikania-experiment/Component.jsx`
  - 独立模式 pageNumber 使用 `encodeCompositePageNum(1, subPageNum)` 而非 `padStart(2, '0')`
  - 集成 useOperationLogger 确保 flow_context 自动注入
  - **使用共享 `buildPageDesc` 在 Flow 模式下包含 `[flowId/submoduleId/stepIndex]` 前缀**

- [x] T022 [US3] 修改各页面组件的 targetElement
  - 业务元素使用 `P${pageNumber}_...` 前缀
  - 保留元素豁免

- [x] T023 [US3] 修改实验历史 answerList
  - 使用共享 `appendExperimentHistory` 处理实验历史

- [x] T024 [US3] 编写快照测试 `src/submodules/g8-mikania-experiment/__tests__/submission.snapshot.test.ts`
  - 测试 page_02_step_q1 页面
  - 测试 page_03_sim_exp 页面
  - **验证 Flow 模式下 pageDesc 包含前缀**

**Checkpoint**: g8-mikania 两种模式下提交数据格式统一

---

## Phase 5: User Story 4 - g8-drone 子模块修复 (Priority: P3)

**Goal**: 修复 g8-drone 的 targetElement 无前缀和答案 code 依赖遍历顺序问题

**Independent Test**: 快照测试和 Schema 校验验证 g8-drone 提交数据格式

### Implementation for User Story 4

- [x] T025 [US4] 创建 g8-drone 映射配置 `src/submodules/g8-drone-imaging/mapping.ts`
  - 重点：QUESTION_CODE_MAP 固定映射（不依赖遍历顺序）
  - experiment_captures 使用 `P${pageNumber}_experiment_captures` 格式

- [x] T026 [US4] 修改 `src/submodules/g8-drone-imaging/context/DroneImagingContext.tsx`
  - logOperation 为业务元素添加 `P${pageNumber}_` 前缀

- [x] T027 [US4] 修改 `src/submodules/g8-drone-imaging/Component.tsx`
  - flow_context 强制注入（不依赖 targetElement === 'page' 条件）
  - answerList code 从 QUESTION_CODE_MAP 获取
  - 使用共享 `buildPageDesc` 生成 pageDesc

- [x] T028 [US4] 修改各页面组件
  - 所有业务元素 targetElement 添加前缀
  - experiment_captures 格式化

- [x] T029 [US4] 编写快照测试 `src/submodules/g8-drone-imaging/__tests__/submission.snapshot.test.ts`
  - 测试 hypothesis 页面
  - 测试 experiment_free 页面
  - 测试 conclusion 页面

**Checkpoint**: g8-drone 所有 targetElement 规范化，code 映射稳定

---

## Phase 6: User Story 5 - g7-experiment 子模块适配 (Priority: P4)

**Goal**: 将 g7-experiment 从 AppContext 透传模式迁移到共享适配器模式

**Independent Test**: 对比迁移前后的提交数据格式验证兼容性

### Implementation for User Story 5

- [x] T030 [US5] 创建 g7 映射配置 `src/modules/grade-7/mapping.ts`
  - 映射现有 AppContext 字段到标准格式

- [x] T031 [US5] 创建适配器桥接层 `src/modules/grade-7/adapter.ts`
  - 封装 AppContext 中的 currentPageData
  - 通过 collectAnswers 规范化 answerList
  - **使用共享 `usePageMeta` 生成规范化的 pageNumber**

- [x] T032 [US5] 修改 `src/modules/grade-7/wrapper.jsx`
  - 集成适配器
  - **使用共享 `buildPageDesc` 在 Flow 模式下包含前缀**
  - operationList 添加前缀和 flow_context

- [x] T033 [US5] 验证向后兼容性
  - 确保现有 AppContext 调用方式不变
  - 仅在输出层转换格式

- [x] T034 [US5] 编写对比测试 `src/modules/grade-7/__tests__/submission.snapshot.test.ts`
  - 测试 Page_02_Introduction
  - 测试 Page_10_Hypothesis_Focus
  - **验证 pageNumber 格式符合规范**
  - **验证 Flow 模式下 pageDesc 包含前缀**

**Checkpoint**: g7 迁移完成，保持向后兼容

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 全局校验、文档更新、代码清理

- [x] T035 [P] 更新 `docs/submodule-submission-guidelines.md` 添加适配器使用说明
- [x] T036 运行所有快照测试确认无回归
- [x] T037 运行 ESLint 确认无新增警告
- [x] T038 [P] 更新 `src/shared/services/submission/index.ts` 导出 submoduleAdapter
- [x] T039 验证 quickstart.md 中的示例代码可运行

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 无依赖，立即开始
- **US1 (Phase 2)**: 依赖 Phase 1 完成 - 其他所有 US 的基础
- **US2-US5 (Phase 3-6)**: 均依赖 US1 完成
  - US2-US5 之间无依赖，可并行实施
  - 建议按优先级顺序：P1 → P2 → P3 → P4
- **Polish (Phase 7)**: 依赖所有目标 US 完成

### User Story Dependencies

```
Phase 1: Setup
    ↓
Phase 2: US1 (P0) - 共享适配层 [MVP 基础]
    ↓
    ├── Phase 3: US2 (P1) - g8-pv-sand [参考实现]
    ├── Phase 4: US3 (P2) - g8-mikania
    ├── Phase 5: US4 (P3) - g8-drone
    └── Phase 6: US5 (P4) - g7-experiment
    ↓
Phase 7: Polish
```

### Within Each User Story

- 映射配置 → Context/组件修改 → 快照测试
- 各 [P] 任务可并行

### Parallel Opportunities

**Phase 1 并行**:
```
T001: 创建目录结构
T002: 创建常量文件
T003: 创建类型定义
```

**Phase 2 (US1) 并行**:
```
T006: usePageMeta (返回 pageNumber + targetPrefix)
T007: useOperationLogger (接收 options 对象参数)
T008: collectAnswers (不含实验历史)
T009: buildPageDesc
T010: appendExperimentHistory (单条追加, code 固定)
T011: validateMarkBeforeSubmit
T012: validateMappingConfig (含覆盖完整性校验)
```

**Phase 3-6 (US2-US5) 可并行**:
- 各子模块修复工作相互独立
- 可由不同开发者并行实施

---

## Implementation Strategy

### MVP First (US1 Only)

1. 完成 Phase 1: Setup
2. 完成 Phase 2: US1 (共享适配层)
3. **STOP and VALIDATE**: 单元测试验证各工具函数
4. 可选：仅修复一个子模块验证端到端流程

### Incremental Delivery

1. Setup + US1 → 适配层就绪
2. US2 (g8-pv-sand) → 验证并作为参考 → 评审
3. US3 (g8-mikania) → 验证 → 评审
4. US4 (g8-drone) → 验证 → 评审
5. US5 (g7-experiment) → 验证 → 评审
6. 每个子模块独立完成，不影响其他模块

### Parallel Team Strategy

```
Developer A: US1 (基础设施)
    ↓ 完成后
Developer A: US2 (g8-pv-sand) - 作为参考实现
Developer B: US3 (g8-mikania)
Developer C: US4 (g8-drone)
Developer D: US5 (g7-experiment)
```

---

## Notes

- [P] = 可并行（不同文件，无依赖）
- [Story] = 用户故事标签，便于追踪
- 每个 US 独立可测试
- 提交后运行快照测试验证
- 避免：跨 US 依赖破坏独立性
