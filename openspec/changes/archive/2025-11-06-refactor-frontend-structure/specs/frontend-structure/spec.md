## ADDED Requirements

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
