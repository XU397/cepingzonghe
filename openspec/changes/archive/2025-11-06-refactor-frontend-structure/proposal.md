## Proposal: refactor-frontend-structure

## Why
- 为统一提交、计时、Flow 编排等跨模块能力提供稳定的目录骨架，确保后续能力扩展有清晰落点并降低迁移风险。

## What Changes
- 新增并规范化目录：`app/`, `flows/`, `submodules/`, `shared/{ui,services,types,styles}`。
- 扩展 Vite 路径别名，统一通过 `@` 系列别名访问新结构。
- 提供顶层入口外壳 `AppShell`，集中承载 Provider 与编排入口。
- 补充 README 占位与迁移说明，指导渐进式迁移。

## Impact
- 代码组织清晰，复用层（shared/）与业务层解耦；
- 通过别名兼容旧路径，降低迁移风险。
