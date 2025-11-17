## Context
- 需要支持 `/flow/<flowId>` 入口的拼装式测评，按 `steps[].submoduleId` 动态加载子模块。
- 与 CMI 包装器协作，提供统一的提交/计时/过渡与进度持久化。

## Goals / Non-Goals
- Goals:
  - FlowDefinition/Progress 协议与 Orchestrator 运行时。
  - 复合页码解析与 `pageDesc` 增强（包含 `[flowId/submoduleId/stepIndex]`）。
  - 一次性 `flow_context` 打点与本地进度持久化。
- Non-Goals:
  - 不重写业务题页面；通过包装器输出 CMI。

## Decisions
- 路由与生命周期：
  - 受管路由：`/flow/:flowId`，以 `key=flowId` 重挂载 FlowModule；
  - 组件内防御：在 `useEffect([flowId])` 中销毁/重建 Orchestrator，避免跨 Flow 复用；
- 存储：`flow.<id>.stepIndex/modulePageNum/flags.*`；一次性打点去重位于 `flags.flowContextLogged.<stepIndex>`。
- Orchestrator 主要职责：
  1) 加载 definition+progress；
  2) 解析复合页码 → 定位 `stepIndex/subPageNum`；
  3) 动态加载 `submodules/registry.ts` 的 Component；
  4) 注入统一提交/计时；
  5) 完成/超时 → TransitionPage → 进入下一步；
  6) 持久化 progress 与一次性打点。
- CMI 接口：`submoduleId/displayName/version/Component/getInitialPage/getTotalSteps/getNavigationMode/getDefaultTimers/[onInitialize/onDestroy]`。
- pageDesc：在提交链路中前置追加 `[flowId/submoduleId/stepIndex]`。

## Process & Governance
- 本迭代属于“按既有提案修正实现偏差”，不新开 proposal；
- 将 P0 阻断项直接落到本变更的 tasks，并在“模块注册与路由”变更中同步登记路由 wiring；

## APIs / Types
- `FlowOrchestrator.load(flowId): Promise<{definition, progress}>`
- `FlowOrchestrator.resolve(def, prog): { stepIndex, modulePageNum, initialPageId }`
- `FlowOrchestrator.enter(step): ReactElement`
- `types`: `FlowDefinition`, `Progress`, `FlowStep`, `CMI` 放在 `shared/types/flow.ts`。

## Risks / Trade-offs
- 进度一致性：本地与后端可能不一致 → 以后端为准，失败时降级用本地。
- 子模块差异：通过包装器适配，暴露最小必要接口。

## Migration Plan
1) 编写 `submodules/registry.ts` 与 5 个包装器（g7/g7-q/g7t/g7t-q/g4）。
2) 实现 Orchestrator；
3) 接入 FlowModule 与路由注册；
4) 小流量试点验证（仅一个 Flow）。

## Open Questions
- 进度回写与后端的幂等与频率限制（与 heartbeat 提案协同）。
