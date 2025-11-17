# 数据提交格式规格（Data Format Spec）

## Purpose
本规格为平台“数据提交格式”的权威规范，供所有测评模块共享与复用。其约束优先级等同于 Assessment Core 规格中关于数据提交的条款，二者相互引用。
## Requirements
### Requirement: 标准化的 MarkObject 结构
所有页面提交的数据 MUST 使用标准化 `MarkObject`，字段含义与格式如下。

#### Scenario: MarkObject 字段与格式
- THEN `MarkObject` 包含：
  - `pageNumber: string`（允许复合页码编码，如 `M2:11` 或 `2.11`）
  - `pageDesc: string`
  - `operationList: Operation[]`
  - `answerList: Answer[]`
  - `beginTime: string`（`YYYY-MM-DD HH:mm:ss`）
  - `endTime: string`（`YYYY-MM-DD HH:mm:ss`）
  - `imgList: any[]`（可为空数组）

### Requirement: Operation 结构与事件类型
所有操作事件 MUST 符合下述结构约束与事件类型集合。

#### Scenario: Operation 字段
- THEN `Operation` 包含：
  - `code: number`（从 1 递增）
  - `targetElement: string`
  - `eventType: string`（见下文事件表）
  - `value: string | object`（普通操作为字符串；实验类操作允许对象）
  - `time: string`（`YYYY-MM-DD HH:mm:ss`）
  - `pageId?: string`（可选，建议为 `Page_XX_*`，用于后端溯源与排错）

#### Scenario: 标准事件类型表
- THEN `eventType` 应为下列之一（可扩展，但不得破坏现有语义）：
  - `page_enter`、`page_exit`
  - `click`、`input`、`input_blur`
  - `radio_select`、`checkbox_check`、`checkbox_uncheck`
  - `modal_open`、`modal_close`、`view_material`
  - `timer_start`、`timer_stop`
  - 实验类：`simulation_timing_started`、`simulation_run_result`、`simulation_operation`
  - 问卷类：`questionnaire_answer`

### Requirement: Answer 结构
问卷或页面答案 MUST 按如下结构记录。

#### Scenario: Answer 字段
- THEN `Answer` 包含：
  - `code: number`（从 1 递增）
  - `targetElement: string`
  - `value: string`

### Requirement: 本地时间与时区
时间字段 MUST 使用“客户端本地时间”的 `YYYY-MM-DD HH:mm:ss` 字符串提交；后端负责入库统一化（建议 UTC）。

#### Scenario: 使用本地时间字符串提交
- GIVEN 平台准备提交 `MarkObject`
- WHEN 生成 `beginTime/endTime` 字段
- THEN 使用本地时间格式化为 `YYYY-MM-DD HH:mm:ss` 字符串

### Requirement: 提交前校验（前端）
前端 MUST 在提交前执行最少化校验。

#### Scenario: 最少化校验通过
- WHEN 执行提交前校验
- THEN 满足以下条件：
  - `MarkObject` 必需字段存在且类型正确；
  - `operationList/answerList` 为数组且 `code` 连续递增；
  - `eventType` 属于标准集合；
  - 实验事件对象结构满足业务要求（如包含 `Run_ID`/`Set_*`/`Results`）。

### Requirement: 兼容性
数据结构 MUST 在新增字段时保持向后兼容；删除字段 MUST 经至少一个版本周期的公告；后端在过渡期 MUST 兼容是否包含 `code/pageId` 的两种格式。

#### Scenario: 字段兼容策略
- WHEN 引入新增字段或计划删除字段
- THEN 确保新增字段不破坏旧版解析；
- AND 对删除字段进行至少一个版本周期的公告；
- AND 后端在过渡期兼容是否包含 `code/pageId` 的两种格式。

### Requirement: 数据提交格式（Data Format Spec）
所有评测模块 MUST 遵循统一的数据提交格式规范，明确 `MarkObject`、`Operation`、`Answer` 字段与时间格式，并在提交前完成基础校验。

#### Scenario: 关键字段与兼容
- WHEN 构建 MarkObject 准备提交
- THEN `Operation.value` SHALL 允许对象；`Operation.pageId` 为可选；`Answer.code` 与 `Operation.code` SHALL 从 1 递增；
- AND 时间字段 SHALL 统一为 `YYYY-MM-DD HH:mm:ss`；
- AND 兼容期后端 SHALL 兼容有/无 `code/pageId` 的两类格式。

#### Scenario: 标准事件类型
- WHEN 同步或扩展事件枚举
- THEN 标准事件类型 MUST 包含 `page_enter/page_exit/page_submit_success/page_submit_failed/flow_context`；
- AND 枚举 SHALL 由前端在 `shared/services/submission/eventTypes.ts` 暴露；
- AND 任意扩展事件类型 MUST 同步更新该枚举与规范。

## Cross‑References
- 参考文档：`docs/data-format-specifications.md`
- 相关规范：`openspec/specs/assessment-core/spec.md`（数据提交契约与流程）
