## Proposal: add-module-router-and-registry

## Why
- 将模块注册与路由能力规格化，统一登录直达、刷新恢复与 Flow 入口 `/flow/<id>` 行为。

## What Changes
- 定义 `ModuleRegistry`/`ModuleRouter` 接口与注册约定；
- 将 `/flow/<id>` 作为受管模块注册；
- 统一从后端 `{ url, pageNum }` 恢复页面的算法与边界处理。

## Impact
- 登录直达/恢复路径一致；Flow 与普通模块共用相同路由入口。
