# 注意：本变更不修改规格，仅实现迁移

本变更 `migrate-g8-mikania-submission` 是 `update-unified-submission-pipeline` 变更的**实现子集**，专注于 g8-mikania-experiment 模块的具体迁移工作。

## MODIFIED Requirements

### Requirement: g8-mikania-experiment 模块迁移到统一提交管道

g8-mikania-experiment 子模块 MUST 迁移到统一提交格式，遵循 `update-unified-submission-pipeline` 变更中定义的所有规格要求。

#### Scenario: 模块接入统一提交 Hook

**引用规格**: `openspec/changes/update-unified-submission-pipeline/specs/submission/spec.md`

- WHEN g8-mikania-experiment 模块的任一页面需要提交数据
- THEN 该模块 MUST 使用 `usePageSubmission` Hook 作为唯一提交入口
- AND 该模块 MUST 提供：`getUserContext`, `getFlowContext`, `pageMeta`, `answers` (已过滤空值), `operations` (业务埋点)
- AND 该模块 MUST NOT 直接调用 `fetch /stu/saveHcMark` 或手写 `pageNumber/targetElement/code/time`
- AND 提交层 SHALL 自动注入 `flow_context`, `page_submit_success/failed` 事件

#### Scenario: 页码与前缀格式迁移

**引用规格**: `openspec/changes/update-unified-submission-pipeline/specs/data-format/spec.md`

- WHEN g8-mikania-experiment 模块构建 MarkObject
- THEN `pageNumber` SHALL 使用 `<stepIndex>.<subPageNum>` 格式（如 `2.3`），不再使用纯数字或 `M*` 前缀
- AND `pageDesc` SHALL 包含 `[flowId/submoduleId/stepIndex]` 前缀（有 Flow 时）
- AND `targetElement` SHALL 使用 `P${pageNumber}_<业务ID>` 格式（如 `P2.3_Q1_控制变量原因`）
- AND 该模块 MUST 移除所有旧格式页码/前缀的遗留代码

#### Scenario: 事件补全要求

**引用规格**: `openspec/changes/update-unified-submission-pipeline/specs/data-format/spec.md` (Operation 结构与事件类别)

- WHEN g8-mikania-experiment 模块的页面包含输入控件
- THEN 该页面 MUST 记录 `input_focus`, `input_change`, `input_delete`, `input_blur` 事件序列
- AND `input_change` 的 value SHOULD 使用 `{prev, next, prevLength, nextLength}` 结构

- WHEN g8-mikania-experiment 模块的页面包含选择控件（单选/复选）
- THEN 该页面 MUST 使用 `select_change` (含 `{prev, next, option}`) 或 `checkbox_check/uncheck` 事件

- WHEN g8-mikania-experiment 模块的实验操作页（page_03）需要记录实验过程
- THEN 该页面 MUST 记录 `simulation_operation` (参数调整/开始/重置), `simulation_timing_started`, `simulation_run_result` 事件
- AND 实验历史 MUST 作为单条 Answer 存储，value 为 JSON 字符串

- WHEN 用户点击下一页或提交按钮
- THEN 该页面 MUST 记录 `next_click` 事件

- WHEN 校验失败阻断用户前进
- THEN 该页面 MUST 记录 `click_blocked` 事件，value 包含 `missing` 数组

#### Scenario: 快照测试与守卫

**引用规格**: `openspec/changes/update-unified-submission-pipeline/specs/submission/spec.md` (提交守卫与唯一入口约束)

- WHEN g8-mikania-experiment 模块完成迁移
- THEN 该模块 MUST 提供快照测试基线（覆盖 7 个页面的典型场景）
- AND 所有快照 MUST 通过 Schema 校验（验证 pageNumber 格式、事件枚举、code 连续性、targetElement 前缀）
- AND CI/Lint MUST 禁止直连 `/stu/saveHcMark`、手写前缀、绕过 `usePageSubmission`
- AND 最小事件集合守卫 MUST 验证每页包含 `page_enter/exit/next_click` 以及对应控件的事件序列

---

## 实现说明

本 spec delta 不引入新的规格要求，仅确认 g8-mikania-experiment 模块遵循 `update-unified-submission-pipeline` 变更中已定义的所有规格。

**关键文档引用**:
- 统一提交规范: `openspec/changes/update-unified-submission-pipeline/specs/submission/spec.md`
- 数据格式规范: `openspec/changes/update-unified-submission-pipeline/specs/data-format/spec.md`
- 模块迁移详细设计: `design.md`（本变更目录下）
