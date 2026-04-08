# Feature Specification: 子模块数据提交标准化

**Feature Branch**: `004-docs-submodule-submission`
**Created**: 2025-12-04
**Status**: Draft
**Input**: 基于 `docs/submodule-submission-analysis-report.md` v2.1.1 (PO 终审通过)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 共享提交适配层基础设施 (Priority: P0)

作为开发者，我需要一套共享的提交适配工具，使所有子模块能够以统一的方式构建和提交数据，避免各模块独立实现导致的格式不一致问题。

**Why this priority**: 这是所有后续迁移工作的基础。没有共享基础设施，每个子模块仍需独立维护提交逻辑，无法实现真正的统一。

**Independent Test**: 可以通过创建共享工具库并编写单元测试独立验证，无需修改任何现有子模块代码。

**Acceptance Scenarios**:

1. **Given** 开发者需要生成页面编号, **When** 调用 `usePageMeta(stepIndex, subPageNum)`, **Then** 返回统一格式的 pageNumber (`<submoduleIndex>.<pageIndexTwoDigits>`) 和 targetPrefix (`P${pageNumber}_`)
2. **Given** 开发者需要记录操作日志, **When** 使用 `useOperationLogger({ pageNumber, targetPrefix, flowContext })` 记录事件, **Then** 自动为业务元素添加 targetPrefix 前缀、为保留元素豁免前缀、在首次 PAGE_ENTER 后注入 flow_context、code 从 1 递增
3. **Given** 开发者需要收集答案, **When** 调用 `collectAnswers(pageId, answers, config)`, **Then** 根据映射配置生成规范化的 answerList（code 来自映射、targetElement 为完整题干）
4. **Given** 开发者需要提交前校验, **When** 调用 `validateMarkBeforeSubmit(mark, flowContext)`, **Then** 返回校验结果，包含 pageNumber 格式、targetElement 前缀、code 连续性、必填事件检查；**且** 当 flowContext 存在时，必须校验 operationList 包含 flow_context 事件
5. **Given** 开发者需要构建页面描述, **When** 调用 `buildPageDesc(pageTitle, flowContext)`, **Then** Flow 模式下返回 `[flowId/submoduleId/stepIndex] pageTitle` 格式，独立模式下返回原标题
6. **Given** 开发者需要追加实验历史到答案列表, **When** 调用 `appendExperimentHistory(answerList, data, { targetElement, historyCodeBase })`, **Then** 单条追加实验历史，code 固定为 `historyCodeBase`，targetElement 由调用方传入（如 `P1.05_实验历史`）

---

### User Story 2 - g8-pv-sand 子模块修复 (Priority: P1)

作为开发者，我需要修复 g8-pv-sand 子模块的数据提交实现，使其完全符合统一规范，作为其他子模块迁移的参考实现。

**Why this priority**: g8-pv-sand 的 getPagePrefix 与 pageNumber 编码不一致是严重问题（导致操作前缀与提交页码不匹配），必须优先修复。修复后可作为其他模块迁移的参考。

**Independent Test**: 可以通过快照测试验证 g8-pv-sand 提交数据格式是否符合规范。

**Acceptance Scenarios**:

1. **Given** g8-pv-sand 子模块处于 Flow 模式, **When** 构建提交数据, **Then** pageNumber 使用 `encodeCompositePageNum(stepIndex + 1, subPageNum)` 编码
2. **Given** g8-pv-sand 的 getPagePrefix 函数, **When** 生成 targetElement 前缀, **Then** 使用与 pageNumber 相同的编码逻辑（stepIndex + 1，两位零填充）
3. **Given** g8-pv-sand 处于 Flow 模式, **When** 构建 pageDesc, **Then** 包含 `[flowId/submoduleId/stepIndex]` 前缀
4. **Given** g8-pv-sand 的实验页面有实验历史, **When** 构建 answerList, **Then** 实验历史使用独立的 HISTORY_CODE_BASE（如 100），避免与题目 code 冲突
5. **Given** 用户从一页导航到下一页, **When** 调用 navigateToPage, **Then** operations 和 codeRef 被重置（code 从 1 重新开始）

---

### User Story 3 - g8-mikania 子模块修复 (Priority: P2)

作为开发者，我需要修复 g8-mikania 子模块在独立模式和 Flow 模式下的数据提交实现。

**Why this priority**: g8-mikania 的独立模式 pageNumber 格式不符合规范，且缺少 flow_context 注入，影响数据追踪。

**Independent Test**: 可以通过快照测试验证修复后的提交数据格式。

**Acceptance Scenarios**:

1. **Given** g8-mikania 在独立模式运行, **When** 构建 pageNumber, **Then** 使用 `encodeCompositePageNum(1, subPageNum)` 而非 `padStart(2, '0')`
2. **Given** g8-mikania 处于 Flow 模式, **When** 记录操作日志, **Then** flow_context 在首次 PAGE_ENTER 后自动注入
3. **Given** g8-mikania 的实验历史, **When** 写入 answerList, **Then** 使用 HISTORY_CODE_BASE 而非固定 code 1
4. **Given** g8-mikania 的 targetElement, **When** 记录操作, **Then** 业务元素使用 `P${pageNumber}_...` 前缀，保留元素豁免
5. **Given** g8-mikania 处于 Flow 模式, **When** 构建 pageDesc, **Then** 包含 `[flowId/submoduleId/stepIndex]` 前缀

---

### User Story 4 - g8-drone 子模块修复 (Priority: P3)

作为开发者，我需要修复 g8-drone 子模块的 targetElement 前缀和答案 code 映射问题。

**Why this priority**: g8-drone 大量 targetElement 无前缀，flow_context 仅条件注入，答案 code 依赖遍历顺序。工作量较大但不影响其他模块。

**Independent Test**: 可以通过快照测试和 Schema 校验验证修复效果。

**Acceptance Scenarios**:

1. **Given** g8-drone 记录操作日志, **When** targetElement 为业务元素, **Then** 使用 `P${pageNumber}_...` 前缀
2. **Given** g8-drone 处于 Flow 模式, **When** 首次 PAGE_ENTER 事件, **Then** flow_context 强制注入（不依赖 targetElement === 'page' 条件）
3. **Given** g8-drone 构建 answerList, **When** 确定答案 code, **Then** 从 QUESTION_CODE_MAP 映射获取而非使用遍历索引
4. **Given** g8-drone 有实验记录, **When** 构建 answerList, **Then** experiment_captures 使用 `P${pageNumber}_experiment_captures` 格式

---

### User Story 5 - g7-experiment 子模块适配 (Priority: P4)

作为开发者，我需要将 g7-experiment 从旧的 AppContext 透传模式迁移到共享适配器模式。

**Why this priority**: g7 架构差异最大，依赖 AppContext，改造风险较高，需要其他模块验证共享适配器稳定后再进行。

**Independent Test**: 可以通过对比迁移前后的提交数据格式验证。

**Acceptance Scenarios**:

1. **Given** g7-experiment 需要生成页面编号, **When** 构建 pageNumber, **Then** 使用共享适配器的 `usePageMeta` 生成规范化的 pageNumber（格式 `<submoduleIndex>.<pageIndexTwoDigits>`）
2. **Given** g7-experiment 的 currentPageData, **When** 构建 answerList, **Then** 通过共享适配器的 collectAnswers 规范化
3. **Given** g7-experiment 的 operationList, **When** 构建提交数据, **Then** 通过共享适配器添加前缀和 flow_context
4. **Given** g7-experiment 处于 Flow 模式, **When** 构建 pageDesc, **Then** 通过共享适配器的 `buildPageDesc` 生成包含 `[flowId/submoduleId/stepIndex]` 前缀的描述

---

### Edge Cases

- 子模块在独立模式（无 flowContext）运行时，pageNumber 应默认 stepIndex=1
- 保留元素（page、next_button、flow_context 等）不应添加 P 前缀
- 实验历史 code 应使用独立区间（如 100+），避免与题目 code 冲突
- 页面导航时必须重置 operations 和 codeRef，确保下一页 code 从 1 开始
- 时间格式统一使用 `YYYY-MM-DD HH:mm:ss`

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须提供统一的 `usePageMeta` Hook，根据 stepIndex 和 subPageNum 生成规范化的 pageNumber 和 targetPrefix
- **FR-002**: 系统必须提供 `useOperationLogger` Hook，接收 `{ pageNumber, targetPrefix, flowContext }` 参数，自动为业务元素添加 targetPrefix 前缀、管理 code 递增、在 PAGE_ENTER 后注入 flow_context
- **FR-003**: 系统必须提供 `collectAnswers` 函数，根据配置映射生成规范化的 answerList
- **FR-004**: 系统必须提供 `validateMarkBeforeSubmit` 函数，在提交前校验数据格式；当 flowContext 存在时，必须校验 operationList 包含 flow_context 事件
- **FR-005**: 系统必须定义 `RESERVED_ELEMENTS` 列表，豁免系统级元素的前缀校验；**实施前**必须与现有子模块中所有无前缀的 targetElement 进行对表确认，确保保留元素列表覆盖所有系统级事件名（page、next_button、prev_button、module、flow_context、task_timer、countdown 等）
- **FR-006**: 系统必须定义 `SubmoduleMappingConfig` 接口，包含以下字段：
  - **必填字段**: `PAGE_CONFIGS`（页面配置列表）、`PAGE_DESC_MAP`（页面描述映射）、`PAGE_QUESTIONS`（每页问题键列表）、`QUESTION_CODE_MAP`（问题 ID → code 映射）、`QUESTION_TEXT_MAP`（问题 ID → 完整题干映射）、`ANSWER_KEY_TO_QUESTION`（答案键 → 问题 ID 映射）、`getSubPageNumByPageId`（页面 ID → subPageNum 函数）
  - **可选字段**: `QUESTION_OPTIONS_MAP`（单选题选项映射）、`INTERNAL_TO_STANDARD_KEY`（内部键 → 标准键转换）、`HISTORY_CODE_BASE`（实验历史 code 基数，默认 100）、`getPageConfig`（获取页面配置）、`formatAnswer`（自定义答案格式化器）
  - **校验要求**: 系统必须提供 `validateMappingConfig` 函数，校验必填字段存在且类型正确，校验 QUESTION_CODE_MAP 中的 code 无重复，**校验 QUESTION_CODE_MAP 对 ANSWER_KEY_TO_QUESTION 的覆盖完整性**（即每个 PAGE_QUESTIONS 中的问题键通过 ANSWER_KEY_TO_QUESTION 映射后，必须在 QUESTION_CODE_MAP 中有对应 code）
- **FR-007**: 系统必须提供 `buildPageDesc` 函数，根据 flowContext 生成规范化的页面描述（Flow 模式下包含 `[flowId/submoduleId/stepIndex]` 前缀）
- **FR-008**: 系统必须提供 `appendExperimentHistory` 函数，单条追加实验历史到 answerList，code 固定为调用方传入的 `historyCodeBase`，targetElement 由调用方传入（如 `P1.05_实验历史`）
- **FR-009**: 各子模块必须在页面导航时重置 operations 和 codeRef
- **FR-010**: 各子模块必须为实验历史使用独立的 code 区间（HISTORY_CODE_BASE）

### Key Entities

- **MarkObject**: 提交数据对象，包含 pageNumber、pageDesc、operationList、answerList、beginTime、endTime、imgList（可选）
- **Operation**: 操作日志条目，包含 code（从 1 递增）、targetElement、eventType、value、time
- **AnswerEntry**: 答案条目，包含 code（来自 QUESTION_CODE_MAP）、targetElement（完整题干）、value
- **SubmoduleMappingConfig**: 子模块映射配置接口，详见 FR-006
- **RESERVED_ELEMENTS**: 保留元素集合（page、next_button、prev_button、module、flow_context、task_timer、countdown），豁免前缀校验
- **FlowContext**: Flow 上下文信息，包含 flowId、submoduleId、stepIndex、totalSteps

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 所有 4 个子模块的提交数据通过 `validateMarkBeforeSubmit` 校验，无格式错误
- **SC-002**: 每个子模块至少有 2-3 个典型页面的快照测试，覆盖问答页和实验页
- **SC-003**: 提交数据的 pageNumber 100% 符合 `<submoduleIndex>.<pageIndexTwoDigits>` 格式（如 1.03）
- **SC-004**: 业务元素的 targetElement 100% 符合 `P<pageNumber>_<业务ID>` 前缀格式
- **SC-005**: Flow 模式下所有页面的 operationList 包含 flow_context 事件
- **SC-006**: 每页的 operationList.code 从 1 开始连续递增
- **SC-007**: 实验历史的 code 与题目 code 无冲突（使用独立区间）
- **SC-008**: 迁移完成后，数据解析错误率降至 0%

## Assumptions

1. 现有子模块的核心业务逻辑不变，仅调整数据格式
2. 共享适配器可以逐步引入，不需要一次性全面替换
3. 保留元素列表相对稳定，新增保留元素需经评审
4. g7 的 AppContext 依赖可以通过适配器层隔离，无需重构核心逻辑
5. 后端对新旧数据格式兼容，或已协调好数据格式变更

## Out of Scope

- 后端数据接收和存储逻辑的修改
- 已提交历史数据的迁移或格式转换
- 非评测子模块（如练习模块、演示模块）的迁移
- Flow 编排逻辑的修改
