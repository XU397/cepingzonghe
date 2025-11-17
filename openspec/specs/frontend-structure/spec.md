# frontend-structure Specification

## Purpose
定义交互前端在新架构下的目录组织、入口装配与路径别名规则，为统一提交、计时、页面框架以及 Flow/CMI 能力提供稳定骨架。

## Requirements
### Requirement: 交互前端目录结构
交互前端工程 MUST 按照约定的目录分层组织代码，以支撑可复用的基础能力并保持业务模块的清晰边界。

#### Scenario: 目录要素
- **WHEN** 初始化或重构交互前端工程
- **THEN** 目录 SHALL 包含 `app/`, `flows/`, `submodules/`, `shared/{ui,services,types,styles}`, `hooks/`, `utils/`
- **AND** 现有业务页面 SHALL 保持原目录，通过包装器或桥接模块逐步迁移

#### Scenario: 共享层职责
- **WHEN** 向 `shared/` 目录新增能力
- **THEN** 共享实现 SHALL 仅暴露无状态组件、服务、类型与样式
- **AND** 业务模块逻辑 SHALL 保持在各自 `modules/` 或 `submodules/` 目录中

### Requirement: 前端入口与路径别名配置
统一前端工程 MUST 通过顶层 `AppShell` 和标准化别名暴露共享能力，保证跨模块能力的集中装配与渐进迁移一致性。

#### Scenario: 入口挂载
- **WHEN** 初始化或重构交互前端入口
- **THEN** `src/main.jsx` SHALL 导入 `@app/AppShell` 并以其作为根组件
- **AND** `AppShell` SHALL 暴露 `AppProviders` 等占位用于集中挂载全局 Provider 与 Flow 编排逻辑

#### Scenario: 路径别名
- **WHEN** 配置 Vite 构建工具
- **THEN** `resolve.alias` SHALL 至少包含 `@`, `@app`, `@flows`, `@submodules`, `@shared`, `@hooks`, `@utils`, `@components`, `@modules`, `@pages`, `@services`
- **AND** 每个别名 SHALL 指向新目录结构中的对应子目录，以支持旧模块渐进迁移
