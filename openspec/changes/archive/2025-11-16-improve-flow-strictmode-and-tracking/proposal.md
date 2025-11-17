# Change Proposal: improve-flow-strictmode-and-tracking

## Why
- Flow 系统当前只能在禁用 React StrictMode 的前提下工作，StrictMode 双重挂载会触发 `FlowAppContextBridge` 与 `AppContext` 的渲染循环，导致 g4/g7 模块持续 mount/unmount（2100+ 次/15 秒），存在长期架构风险。
- `g7-tracking-experiment` 子模块内部依赖管理不当，哪怕在非 StrictMode 模式也持续产生 159 次 mount/unmount，影响页面性能与行为可预测性。
- 以上问题已在 `docs/STRICTMODE_AND_G7_TRACKING_REQUIREMENTS.md` 定义为技术债务，需形成正式需求与实施路径。

## What Changes
- 为 Flow 子树设计并实现独立 FlowContext/FlowProvider，使 orchestrator、progress、Flow 专用 `usePageSubmission` 与 `AppContext` 解耦；在 StrictMode 下维持 Phase D 的 57 条日志指标。
- 先行修复 `g7-tracking-experiment` 在非 StrictMode 模式下的 159 次重复渲染，将其降至 ≤80 条/15秒，为 StrictMode 恢复铺路。
- 在 FlowContext 落地前提供临时缓解：路由级别对 `/flow/*` 禁用 StrictMode，传统模块仍保持 StrictMode，以降低风险窗口。
- 更新 Flow 规范，记录 StrictMode/FlowContext 分层与子模块渲染稳定性要求；扩展 Playwright/MCP 脚本以输出 Flow 与 g7-tracking 的渲染计数。

## Impact
- FlowModule/FlowAppContextBridge 将经历逐步迁移：在引入 FlowContext 前需提供路由级 StrictMode 保护，迁移期间保留可回退的 Bridge。
- FlowContext 需要访问 AppContext 的用户信息、计时器状态与数据提交 hook，`usePageSubmission` 将移入 FlowProvider，子模块包装器要新增 `useFlowContext` 回退逻辑。
- `g7-tracking-experiment`、`TrackingProvider`、`Grade7Wrapper` 等目录要进行依赖梳理，确保优化在非 StrictMode 与 StrictMode 下表现一致。
- 测试面：`/flow/test-flow-1`、`/flow/test-flow-2`、传统模块（/seven-grade, /four-grade）均需回归；Playwright/MCP 报告新增 StrictMode/g7-tracking 渲染统计。
- 文档面：`docs/STRICTMODE_AND_G7_TRACKING_REQUIREMENTS.md` 作为需求基线，需要在各阶段结束后同步更新；OpenSpec 规范新增 StrictMode 与渲染稳定性条目需通过 `openspec validate` 校验。
