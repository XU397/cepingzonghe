# 提交工具规格（Submission Spec）

## Purpose
本规格定义统一的页面提交 Hook 与其配套工具（事件枚举、MarkObject 工具）的行为，确保所有交互模块与 `openspec/specs/assessment-core/spec.md` 中的“每次下一页前提交”要求保持一致，并与 `openspec/specs/data-format/spec.md` 的数据结构完全对齐。

## Requirements
### Requirement: 统一提交 Hook（usePageSubmission）
前端交互层 SHALL 提供统一的 `usePageSubmission` Hook，作为所有模块页面提交的单一入口，以保证提交策略与异常处理的一致性。

#### Scenario: API 与返回值
- WHEN 页面需要在导航前提交数据
- THEN 该 Hook SHALL 暴露 `submit({ markOverride? }): Promise<boolean>`；
- AND 内部 SHALL 按 Data Format Spec 构建 MarkObject（除非提供 `markOverride`），从而满足 `openspec/specs/assessment-core/spec.md` 中“每次‘下一页’操作前提交当前页数据”的契约；
- AND 成功时返回 `true`，失败时返回 `false` 并提供错误信息用于 UI 呈现。

#### Scenario: 重试与会话过期（401）
- GIVEN 存在网络瞬时失败
- WHEN 提交出现非 401 错误
- THEN 该 Hook SHALL 按 1s、2s、4s 的退避策略最多重试 3 次；
- WHEN 接口返回 401/Unauthorized 或业务判定会话过期
- THEN 该 Hook MUST 调用 `handleSessionExpired` 执行统一登出/清理，并 SHALL 不再重试。

#### Scenario: 与页面框架集成
- GIVEN 使用统一页面框架 AssessmentPageFrame
- WHEN 用户点击“下一页”
- THEN 框架 SHALL 默认调用 `usePageSubmission.submit()`；成功后执行导航，失败时阻断（DEV 可配置放行），并通过错误托盘展示信息；
- AND 框架 SHALL 暴露 `onBefore/onAfter/onError` 钩子以便页面进行扩展处理。

### Requirement: 标准事件集合与数据格式一致性
`usePageSubmission` SHALL 提供标准事件枚举，并确保所有 `operationList` 事件类型满足 Data Format Spec 的集合，新增的 Flow/提交事件也必须纳入该枚举供模块复用。

#### Scenario: 事件枚举
- THEN 事件枚举 SHALL 覆盖 `page_enter`、`page_exit`、`click`、`input`、`input_blur`、`radio_select`、`checkbox_check`、`checkbox_uncheck`、`modal_open`、`modal_close`、`view_material`、`timer_start`、`timer_stop`、`simulation_timing_started`、`simulation_run_result`、`simulation_operation`、`questionnaire_answer`；
- AND ALSO SHALL 包含 `flow_context`、`page_submit_success`、`page_submit_failed` 以满足 Flow 运行与提交链路观测需求；
- AND 平台 MAY 继续暴露 `session_expired`、`network_error` 等内部错误事件，只要遵循 Data Format Spec 中“可扩展但不得破坏现有语义”的约束；
- AND 任何新事件类型 MUST 通过 Data Format Spec 评审后才能加入该枚举，保持交叉规范一致。

#### Scenario: Flow 上下文事件
- GIVEN 正在 Flow 运行时进入某子模块的首个页面
- WHEN `usePageSubmission` 记录该页面的首条操作
- THEN MUST 写入一次 `flow_context` 操作，其 `value` 为对象并包含 `flowId/submoduleId/stepIndex/pageId?` 信息，用于与 `openspec/specs/assessment-core/spec.md` 的页面恢复与 Flow 追踪术语对齐；
- AND 若 Flow 信息缺失，SHALL 记录日志并跳过追加而不破坏其他操作。

#### Scenario: 提交结果事件
- WHEN `submit()` 成功完成并准备执行下一步
- THEN MUST 追加 `page_submit_success` 操作，记录提交耗时/通道信息（若可用），用于后端判定“成功提交”时刻；
- WHEN 重试后依然失败或遇到不可恢复错误
- THEN MUST 追加 `page_submit_failed` 操作，并把最后一次错误摘要放入 `value`（字符串或对象），以便与 Assessment Core 的错误处理日志对齐。

## Cross-References
- `openspec/specs/data-format/spec.md`：MarkObject 与 Operation 字段格式、标准事件集合。
- `openspec/specs/assessment-core/spec.md`：页面提交顺序、进入/退出事件与 Flow 运行术语。
