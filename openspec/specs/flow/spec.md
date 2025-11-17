# flow Specification

## Purpose
TBD - created by archiving change add-flow-orchestrator-and-cmi. Update Purpose after archive.
## Requirements
### Requirement: FlowDefinition 与 Progress 协议
Flow 系统 MUST 定义标准化的 FlowDefinition 与 Progress 协议，以驱动前端编排与进度恢复。

#### Scenario: 结构
- WHEN 定义一个拼装式评测流
- THEN FlowDefinition SHALL 包含：`flowId/name/url/version/status/steps[]`；
- AND `steps[i]` 至少包含 `submoduleId`，可选 `variant/overrides/transitionPage`；
- AND Progress SHALL 包含：`stepIndex/modulePageNum`（或 pageId）。

### Requirement: Orchestrator 行为
Flow Orchestrator MUST remain React.StrictMode-safe by isolating FlowContext instances per module and capturing render counts for regression tracking.

#### Scenario: StrictMode 兼容
- **WHEN** Flow 入口运行在 <React.StrictMode> 下
- **THEN** FlowModule/子模块 MUST 通过独立的 FlowContext（或等效机制）传递稳定的 Context
- **AND** StrictMode 双重挂载期间不得触发子模块连续 mount/unmount，且 5 秒内渲染次数不得超过 100 次
- **AND** 自动化验收（Playwright/MCP）MUST 记录渲染计数，作为 StrictMode 兼容性的证据

### Requirement: 可组合模块接口（CMI）
子模块的包装层 MUST 暴露标准化的 CMI 定义，以支撑 FlowOrchestrator 的动态加载与统一能力接入。

#### Scenario: 必需字段
- WHEN 子模块被注册到 FlowDefinition.steps
- THEN CMI SHALL 提供 `submoduleId/displayName/version` 元数据；
- AND CMI SHALL 暴露 `Component({ userContext, initialPageId, options })` 组件入口；
- AND CMI SHALL 提供 `getInitialPage(subPageNum)`、`getTotalSteps()`、`getNavigationMode(pageId)`、`getDefaultTimers()`。

#### Scenario: 生命周期
- WHEN FlowOrchestrator 初始化或卸载子模块
- THEN 若 CMI 定义 `onInitialize/onDestroy` 钩子，Orchestrator MUST 在对应时机调用；
- AND 所有 CMI 定义 MUST 位于 `submodules/<submoduleId>/` 包装器并在 `submodules/registry.ts` 注册。

### Requirement: Flow 上下文打点
FlowOrchestrator MUST 在进入任一子模块的首个页面时写入一次性 `flow_context` 操作日志，以关联 flowId 与 stepIndex。

#### Scenario: 记录规则
- WHEN 首次进入某子模块的页面
- THEN Orchestrator SHALL 通过统一提交链路记录 `flow_context` Operation，包含 `flowId/submoduleId/stepIndex`；
- AND 相同子模块再次进入时 MUST 不重复记录；
- AND 该 Operation MUST 满足 Data Format Spec 的字段约束。

### Requirement: 复合页码与描述增强
Orchestrator SHALL 支持 `M<stepIndex>:<subPageNum>`/`step.sub` 复合页码，并在 `pageDesc` 追加 `[flowId/submoduleId/stepIndex]` 以增强可观测性。

#### Scenario: 复合页码解析
- WHEN 解析 Progress 或计算下一页
- THEN Orchestrator SHALL 使用统一解析工具得到 `stepIndex/subPageNum`；
- AND 生成的 MarkObject.pageDesc SHALL 附带 `[flowId/submoduleId/stepIndex]` 前缀。

### Requirement: Flow 渲染稳定性监控
Flow orchestration MUST 提供渲染稳定性打点，以快速识别子模块的渲染放大问题。

#### Scenario: 子模块渲染稳定性
- **WHEN** Flow Definition 中包含 g7-tracking 等子模块
- **THEN** 子模块包装器 MUST 仅订阅所需的 FlowContext 字段，并禁止将完整 userContext/flowContext 放入依赖数组
- **AND** DEV 模式 SHOULD 暴露渲染计数/装载计数日志，便于检测 15 秒窗口内超过 80 次渲染的异常
- **AND** Playwright/MCP 验收脚本 SHALL 统计并断言该阈值，作为性能回归基线

### Requirement: Flow 心跳与进度回写（可选）
Flow 运行时 SHALL 提供心跳与进度回写能力，以便后端观测与跨端恢复；失败时不得阻断前端流程。

#### Scenario: 回写策略
- WHEN 进入新页面或间隔达到阈值
- THEN 前端 SHALL 上报 `{ flowId, stepIndex, modulePageNum }` 至后端；
- AND 失败时 SHALL 仅本地记录，后续补写，不影响用户操作。

