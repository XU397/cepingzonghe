## Why
- 7 年级追踪问卷模块复用旧前缀/页码与自建提交，未套用统一事件枚举和行为粒度（focus/blur/change/阻断/next_click），轨迹数据不完整。
- 需要与新版提交规范对齐，确保问卷答案与操作日志格式一致，便于行为分析与后端入库。

## What Changes
- 接入新版 `usePageSubmission` + Schema，统一 `<stepIndex>.<subPageNum>` 页码、`P${pageNumber}_...` 前缀、flow_context 注入，移除直连/自建构造。
- 补齐埋点：问卷控件记录 focus/change/blur/select_change，下一页记录 `next_click`，阻断写 `click_blocked`（missing 列表）。
- answerList 仅非空答案（可读文本），超时写占位；增加快照/校验覆盖。

## Impact
- 规格引用：`openspec/specs/submission`、`openspec/specs/data-format`。
- 代码影响：追踪问卷页面/组件埋点、提交入口、上下文/计时器集成、测试。
- 风险：**BREAKING**（页码/前缀/事件集变更；旧接口禁用），需 Schema + 快照验证。

## 详细清单与样例

**⚠️ 重要说明**：pageNumber 格式为 `<stepIndex>.<subPageNum>`，其中 stepIndex 由 Flow 配置动态决定（非固定值），subPageNum 为子模块内部固定页码（0-7）。以下示例默认使用 stepIndex=0（问卷作为 Flow 第一步的最常见场景）。

- **迁移页清单**：8个问卷页面（旧 14-21 → 新 `<stepIndex>.0` - `<stepIndex>.7`，示例假设 stepIndex=0 时为 0.0-0.7），见 [migration-details.md](./migration-details.md#一迁移页清单)
- **样例快照**：3个典型场景（完整流程/阻断恢复/超时提交，stepIndex=0），见 [migration-details.md](./migration-details.md#二样例快照期望-markobject)
- **验证计划**：Schema 校验（支持任意 stepIndex）、stepIndex 一致性校验、Lint 守卫（禁止硬编码）、快照测试，见 [migration-details.md](./migration-details.md#三验证测试计划)
