## Tasks: add-module-router-and-registry

## 1. 注册与接口
- [x] 1.1 规格化 `ModuleRegistry.register({ moduleId, url, getInitialPage, ... })`
- [x] 1.2 规格化 `ModuleRouter.resolve({ url, pageNum })`
- [x] 1.3 将 FlowModule 注册到 Registry，路由到 `/flow/<id>`

## 2. 恢复策略
- [x] 2.1 从 `{ url, pageNum }` 恢复页面（超界回落到注意事项页）
- [x] 2.2 刷新恢复：读取 `core.moduleUrl` 与 `core.pageNum`（通过 STORAGE_KEYS）
