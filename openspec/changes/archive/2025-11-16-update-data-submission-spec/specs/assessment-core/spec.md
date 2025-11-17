## MODIFIED Requirements

### Requirement: 标准化 MarkObject 结构（数据提交契约）
平台 MUST 使用统一的 MarkObject 结构提交页面数据；字段定义与事件类型集合与“数据提交格式规格（Data Format Spec）”保持一致。

#### Scenario: MarkObject 字段（更新）
- THEN `operationList` 的 `value` 允许为 `string | object`；`Operation` 支持可选 `pageId` 字段；
- AND 事件类型集合引用 Data Format 规格；
- AND 时间格式保持 `YYYY-MM-DD HH:mm:ss`。

### Requirement: 操作日志与页面进入/退出记录
平台 MUST 按 Data Format 规格维护操作日志与页面进入/退出事件的类型集合，以覆盖实验与问卷阶段的所有行为。

#### Scenario: 事件类型对齐
- THEN 操作日志事件类型 SHALL 与 Data Format 规格保持一致，至少包含 `page_enter/page_exit/page_submit_success/page_submit_failed/flow_context` 并区分实验与问卷类别；
- AND 页面进入/退出事件必须记录在统一的事件集合中；
- AND 新增或扩展的事件类型 MUST 同步更新 Data Format 规格。
