## Proposal: add-module-router-and-registry

## Why
- 将模块注册与路由能力规格化，统一“登录直达 + 刷新恢复 + Flow 入口”的行为，避免实现漂移。

## What Changes
- 定义 `ModuleRegistry`/`ModuleRouter` 接口与注册约定；
- 新增受管路由：`/flow/:flowId`（以 `key=flowId` 重挂载）；
- 统一从 `{ url, pageNum }` 恢复页面与持久化键名。

## Impact
- 登录与恢复路径一致；Flow 与普通模块共用入口；路由问题定位与扩展更清晰。

