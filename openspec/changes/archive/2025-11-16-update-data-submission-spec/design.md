## Context
- 将 `docs/data-format-specifications.md` 纳入 OpenSpec，并细化 MarkObject/Operation/Answer 的约束与事件枚举。

## Goals / Non-Goals
- Goals:
  - 明确 `Operation.value` 允许对象、可选 `pageId`、`code` 连续递增。
  - 扩充标准事件（含 `flow_context`、提交成功/失败）。
  - 在 shared 层提供 `validateMarkObject` 与 `EventTypes`。
- Non-Goals:
  - 不立即强制所有模块替换旧实现，允许渐进对齐。

## Decisions
- 事件集中：`shared/services/submission/eventTypes.ts` 单一来源。
- 校验：`validateMarkObject` 做最小校验（必填、类型、code 递增、事件合法）。
- 时间：客户端本地 `YYYY-MM-DD HH:mm:ss`，后端入库统一化。

## Integration
- 与 `specs/assessment-core` 对齐字段与流程；
- 与 `specs/submission` 的 Hook 规范配合，统一提交路径。

## Risks / Trade-offs
- 过度校验可能影响灵活性：先最小集，逐步增强。

## Migration Plan
1) 新增规格文件并通过验证；
2) 输出事件枚举与最小校验；
3) 模块逐步改造提交路径至统一 Hook。

