# Proposal: add-unified-page-submission-hook

## Why
- 现有模块（Grade-7、Grade-4、Grade-7-Tracking）存在多套提交流程/错误处理路径，维护成本高且行为不一致。
- 需要对齐 Data Format Spec（MarkObject）并统一 401 过期处理、指数重试、失败阻断策略，降低新模块接入门槛。

## What Changes
- 新增“统一提交 Hook”规范与实现契约（Submission Capability）。
- 约定 Hook API、重试与 401 行为、与 PageFrame 的集成方式。
- 渐进替换现有模块内的自定义提交逻辑。
- 将 Hook/事件枚举落地到 `shared/services/submission/`，并在首次进入子模块时写入 `flow_context` 操作。

## Impact
- FE 交互端：所有模块提交路径统一；
- 与后端接口保持兼容：沿用 `/saveHcMark` + FormData；
- 便于引入 Flow 编排后稳定复用。
