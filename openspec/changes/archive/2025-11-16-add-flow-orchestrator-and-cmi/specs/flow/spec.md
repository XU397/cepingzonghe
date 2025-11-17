## ADDED Requirements

### Requirement: FlowDefinition 与 Progress 协议
Flow 系统 MUST 定义标准化的 FlowDefinition 与 Progress 协议，以驱动前端编排与进度恢复。

#### Scenario: 结构
- WHEN 定义一个拼装式评测流
- THEN FlowDefinition SHALL 包含：`flowId/name/url/version/status/steps[]`；
- AND `steps[i]` 至少包含 `submoduleId`，可选 `variant/overrides/transitionPage`；
- AND Progress SHALL 包含：`stepIndex/modulePageNum`（或 pageId）。

### Requirement: Orchestrator 行为
FlowOrchestrator MUST 按协议运行并调度子模块，确保步进、过渡与持久化的一致性。

#### Scenario: 运行时
- WHEN 前端进入 `/flow/<id>`
- THEN FlowModule SHALL 加载 definition 与 progress；
- AND Orchestrator SHALL 定位 `stepIndex/modulePageNum` 并加载子模块 Component；
- AND 子模块完成/超时 SHALL 进入 TransitionPage，随后 `stepIndex+1`；
- AND 前端 SHALL 持久化 `flow.<id>.stepIndex/modulePageNum`（可选回写后端）。

#### Scenario: 包装器桥接回调
- WHEN 子模块在遗留系统内发生“下一页/完成/超时”
- THEN 包装器 Component SHALL 调用 `flowContext.updateModuleProgress/ onComplete/ onTimeout` 通知 Orchestrator；
- AND 遗留模块/Provider MUST NOT 直接写 flow 进度到本地存储，避免与 Orchestrator 状态竞争。

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
