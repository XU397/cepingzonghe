## Context
- 统一模块注册（Registry）与路由（Router），支持登录直达 `{ url, pageNum }` 与 `/flow/<id>`。

## Goals / Non-Goals
- Goals:
  - 规范注册项：`moduleId/url/getInitialPage/...`。
  - 登录直达与刷新恢复的统一算法与持久化键名。
  - FlowModule 作为受管模块注册。
- Non-Goals:
  - 不重写业务模块内部路由。

## Decisions
- 键名：`core.module/url`, `core.page/pageNum`；刷新优先读本地，后端登录结果优先生效。
- 越界回落：`getInitialPage(pageNum)` 超界 → 返回“注意事项页”。
- 与 React Router 集成：保留现有 `BrowserRouter`，在顶层统一导入 ModuleRouter。
- Registry 形态：简单 Map + 工厂函数。

## APIs / Types
- `ModuleRegistry.register(mod: { moduleId, url, version, getInitialPage, ModuleComponent, getFeatures? })`
- `ModuleRegistry.getByUrl(url)`
- `ModuleRouter.resolve({ url, pageNum }) => { ModuleComponent, initialPageId }`

## Risks / Trade-offs
- 与旧路径并存导致歧义：通过注册唯一 URL 并在路由前归一化处理。

## Migration Plan
1) 定义 Registry 与 Router 占位实现；
2) 注册既有模块与 FlowModule；
3) 登录成功路径切换到 Router；
4) 渐进将模块自有计算逻辑迁移到 `getInitialPage`。

## Open Questions
- 是否需要别名 URL（兼容历史链接）。

