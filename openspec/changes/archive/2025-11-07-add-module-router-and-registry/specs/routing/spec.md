## ADDED Requirements

### Requirement: 模块注册与路由
前端 MUST 提供 `ModuleRegistry` 与 `ModuleRouter` 以统一登录直达与页面恢复逻辑。

#### Scenario: 登录直达
- WHEN 后端返回 `{ url, pageNum }`
- THEN `ModuleRouter` SHALL 使用 `ModuleRegistry.getByUrl(url)` 定位模块并调用 `getInitialPage(pageNum)`，渲染对应页面；
- AND 记录 `core.module/url` 与 `core.page/pageNum` 以供刷新恢复。

### Requirement: Flow 入口
`/flow/<flowId>` MUST 作为受管模块注册，接受 progress 恢复。

#### Scenario: Flow 路由
- WHEN 访问 `/flow/<id>`
- THEN `ModuleRouter` SHALL 跳转到 FlowModule，并交由 Orchestrator 根据 Progress 定位页面。

