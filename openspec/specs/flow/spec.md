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

### Requirement: Flow Completion Page
Flow orchestration SHALL render an in-app completion page after all steps finish, instead of redirecting to login.

#### Scenario: Render and stop timers
- **WHEN** FlowOrchestrator detects no remaining steps
- **THEN** FlowModule SHALL render a completion page inside the frame (no external navigation)
- **AND** task/questionnaire timers SHALL be stopped/reset and heartbeat SHALL be disabled while on this page

#### Scenario: Content and CTA
- **WHEN** the completion page is shown
- **THEN** it SHALL support configured title/content and a primary CTA button
- **AND** the CTA SHALL default to navigating to login if no custom link is provided
- **AND** the layout SHALL follow the provided design (祝贺语、说明文本、按钮文案“继续完成问卷调查”、提示语“问卷大约需要10分钟时间。”)

### Requirement: Flow 子模块导航与提交契约
Flow Orchestrator 与子模块包装层 MUST 遵循统一的导航与数据提交契约，避免在 Flow 模式下绕过页面框架和提交流水线。

#### Scenario: 统一导航入口
- WHEN 学生在 Flow 模式下点击「下一页」或等效前进按钮
- THEN 前端 SHALL 通过 Flow 容器提供的 `AssessmentPageFrame` 触发提交与导航（即由框架底部的统一按钮承载前进行为）；
- AND 子模块页面内 SHALL NOT 在 Flow 模式下通过自有按钮直接改变页码而绕过框架（除非该按钮明确委托给框架的前进逻辑）。

#### Scenario: 下一页按钮可用性与页面校验
- WHEN 学生在 Flow 模式下点击「下一页」，但当前页面仍存在未完成的必答题或页面级校验未通过
- THEN 容器层的 `AssessmentPageFrame` 底部“下一页”按钮 SHALL 在非提交中状态保持可点击（即除 `waiting/isSubmitting` 状态外，不因必答题未完成而长期置灰禁用）；
- AND 子模块页面 SHOULD 在自身 UI 中展示明确的错误提示（例如红色文案、高亮字段等），而不是仅依赖按钮禁用态；
- AND 子模块页面 MUST 通过 `Operation` 记录本次“被阻断”的前进尝试及原因（例如使用可扩展的交互事件类型并在 `value` 中写入错误码/提示文案）；
- AND Flow 容器 SHALL 不发起统一提交流水线（不构建 `MarkObject` / 不调用提交流程），也不得推进 Flow Progress，直到页面校验通过。

#### Scenario: Flow 提交流水线的一致性
- WHEN Flow 容器通过 `AssessmentPageFrame + usePageSubmission` 提交当前页面数据
- THEN 提交构建的 `MarkObject` SHALL：
  - 含有与 Data Format Spec 一致的字段集合（`pageNumber/pageDesc/operationList/answerList/beginTime/endTime/imgList`）；
  - 在 `operationList` 中包含至少一个 `flow_context` 事件，且其 `value` 为对象，携带 `flowId/submoduleId/stepIndex/pageId?`；
  - 使用统一工具（如 `enhancePageDesc`）确保 `pageDesc` 带有 `[flowId/submoduleId/stepIndex]` 前缀，并与 `flow_context.value` 一致；
  - 确保 `operationList[].code` 与 `answerList[].code` 从 1 连续递增，时间字段满足 Data Format Spec 要求。

#### Scenario: 与复合页码的协同
- WHEN Flow 使用 Progress `{ stepIndex, modulePageNum }` 或等价信息恢复当前页
- THEN 子模块构建的 `MarkObject.pageNumber` SHALL 与该 Progress 一致（例如使用 `M<stepIndex>:<subPageNum>` 或 `step.sub` 形式编码）；
- AND Flow 容器与子模块 SHOULD 通过统一的页码映射工具（如 `getSubPageNumByPageId` 等）保证 `pageNumber/pageDesc/flow_context` 对同一页面的标识一致。

