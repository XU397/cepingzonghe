## MODIFIED Requirements

### Requirement: Orchestrator 行为
Flow Orchestrator MUST remain React.StrictMode-safe by isolating FlowContext instances per module and capturing render counts for regression tracking.

#### Scenario: StrictMode 兼容
- **WHEN** Flow 入口运行在 <React.StrictMode> 下
- **THEN** FlowModule/子模块 MUST 通过独立的 FlowContext（或等效机制）传递稳定的 Context
- **AND** StrictMode 双重挂载期间不得触发子模块连续 mount/unmount，且 5 秒内渲染次数不得超过 100 次
- **AND** 自动化验收（Playwright/MCP）MUST 记录渲染计数，作为 StrictMode 兼容性的证据

## ADDED Requirements

### Requirement: Flow 渲染稳定性监控
Flow orchestration MUST 提供渲染稳定性打点，以快速识别子模块的渲染放大问题。

#### Scenario: 子模块渲染稳定性
- **WHEN** Flow Definition 中包含 g7-tracking 等子模块
- **THEN** 子模块包装器 MUST 仅订阅所需的 FlowContext 字段，并禁止将完整 userContext/flowContext 放入依赖数组
- **AND** DEV 模式 SHOULD 暴露渲染计数/装载计数日志，便于检测 15 秒窗口内超过 80 次渲染的异常
- **AND** Playwright/MCP 验收脚本 SHALL 统计并断言该阈值，作为性能回归基线
