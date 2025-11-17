## Context
- 需要将 Flow 入口纳入受管路由，并统一登录直达/刷新恢复逻辑，与现有 `ModuleRouter`/`ModuleRegistry` 协作。

## Goals / Non-Goals
- Goals:
  - 受管路由 `/flow/:flowId`，并通过 `key=flowId` 强制重挂载；
  - `ModuleRegistry`/`ModuleRouter` 的职责边界与接口；
  - 登录直达/刷新恢复的算法与键名。
- Non-Goals:
  - 不重写业务模块内部页面路由。

## Decisions
- React Router：将 FlowModule 作为独立 Route，保障 `useParams()` 可用；
- Remount：Route 元素使用 `key=flowId`；FlowModule 内部仍以 `useEffect([flowId])` 防御性重建 Orchestrator；
- 解析：`ModuleRouter.resolve({ url, pageNum })` 使用 `ModuleRegistry.getByUrl(url)` + `getInitialPage(pageNum)`；
- 持久化键：`core.module/url`, `core.page/pageNum`；
- 越界回落：统一返回“注意事项页”。

## Risks / Trade-offs
- 双通路渲染（直渲染 vs Route 渲染）可能混淆：Flow 场景强制 Route；其余保持兼容。

## Migration Plan
1) 添加 Route 与 key；
2) 更新 `ModuleRouter` 的分流逻辑（flow URL → Route，其他 → 旧渲染）；
3) 文档化恢复算法与键名；
4) 联调 FlowModule 防御性重建。

