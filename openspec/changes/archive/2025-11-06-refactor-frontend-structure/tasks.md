## Tasks: refactor-frontend-structure

## 1. 目录与脚手架
- [x] 1.1 创建 `src/app`, `src/flows`, `src/submodules`
- [x] 1.2 为 `shared/{ui,services,types,styles}` 增加 README 占位
- [x] 1.3 新增示例文件：`app/AppShell.jsx`, `flows/FlowOrchestrator.js`, `submodules/index.js`

## 2. 构建与别名
- [x] 2.1 扩展 Vite aliases：`@`, `@app`, `@flows`, `@submodules`, `@shared`, `@hooks`, `@utils`, `@components`, `@modules`, `@pages`, `@services`
- [x] 2.2 构建验证通过（`npm run build`）

## 3. 顶层入口迁移
- [x] 3.1 `main.jsx` 切换至 `@app/AppShell`
- [x] 3.2 在 `AppShell` 中提供 `AppProviders` 占位以承载 Provider/编排

## 4. 文档与记录
- [x] 4.1 增加 `IMPLEMENTATION_SUMMARY.md`
- [x] 4.2 完成 `proposal.md` 与 `tasks.md`

## 附注
- 本变更不包含心跳 Hook 与 API 客户端实现；`useHeartbeat.ts` 已提供最小占位以支持后续变更（见 `add-heartbeat-and-progress-sync`）。
