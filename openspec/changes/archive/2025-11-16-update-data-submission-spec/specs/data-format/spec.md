## ADDED Requirements

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
