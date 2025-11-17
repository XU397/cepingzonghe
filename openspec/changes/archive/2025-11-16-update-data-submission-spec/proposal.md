# Proposal: update-data-submission-spec

## Why
- 将现有《数据格式规范文档》（docs/data-format-specifications.md）纳入 OpenSpec 体系，成为所有模块共享、可追溯、可验证的权威数据格式标准。
- 对齐 Assessment Core 规格中对 MarkObject 的定义，补充 `Operation.value` 允许对象、可选 `pageId`、事件类型集合等细化约束。

## What Changes
- 新增规格：`specs/data-format/spec.md`（数据提交格式规格）
- 修改核心规格：`specs/assessment-core/spec.md` 中“MarkObject 字段”“操作日志事件类型”与 Data Format 对齐
- 明确兼容策略：后端兼容有/无 `code/pageId` 两类格式；时间统一 `YYYY-MM-DD HH:mm:ss`
- 扩充标准事件枚举，新增 `flow_context` 并要求统一暴露位置。

## Impact
- 影响所有评测模块的数据提交实现（Grade-4、Grade-7、Grade-7-Tracking 以及未来拼装流）
- 影响 shared 提交工具（`src/shared/services/dataLogger.js`）与模块专用提交 Hook（如 Tracking 的 `useDataLogger`）的参数约束与构建逻辑
