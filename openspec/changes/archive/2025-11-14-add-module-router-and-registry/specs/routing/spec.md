## ADDED Requirements

### Requirement: 模块注册与路由
前端 MUST 提供 `ModuleRegistry` 与 `ModuleRouter` 以统一登录直达与页面恢复。

#### Scenario: 登录直达
- WHEN 后端返回 `{ url, pageNum }`
- THEN `ModuleRouter` SHALL 使用 `ModuleRegistry.getByUrl(url)` 定位模块并调用 `getInitialPage(pageNum)` 渲染对应页面；
- AND 持久化 `core.module/url` 与 `core.page/pageNum` 以供刷新恢复。

### Requirement: Flow 入口与重挂载
`/flow/:flowId` MUST 作为受管路由注册，并在 flowId 变更时重挂载。

#### Scenario: flowId 变更重挂载
- WHEN 从 `/flow/A` 导航到 `/flow/B`
- THEN 路由层 SHALL 以 `key=flowId` 重建 `FlowModule`；
- AND `FlowModule` 内部 SHALL 在 `useEffect([flowId])` 中销毁/重建 Orchestrator，以避免跨 Flow 进度串写。

### Requirement: 刷新恢复与越界回落
刷新恢复 MUST 读取 `core.module/url`, `core.page/pageNum`，并在页码越界时回落到“注意事项页”。

#### Scenario: 越界回落
- WHEN `pageNum` 缺失或超出映射范围
- THEN `getInitialPage(pageNum)` SHALL 返回“注意事项页”作为默认。

