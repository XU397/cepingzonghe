## Tasks: add-heartbeat-and-progress-sync

## 1. Hook 与策略
- [x] 1.1 实现 `useHeartbeat({ flowId, stepIndex, modulePageNum })`
  - 代码：`src/hooks/useHeartbeat.ts:1`
- [x] 1.2 设计回写策略：按时间间隔或页面切换触发
  - 默认 15s 定时；切步即时上报；见 `setInterval` 实现
- [x] 1.3 失败降级：仅本地持久化，稍后补写
  - 本地队列键：`flow.<flowId>.heartbeatQueue`；`flushQueue()` 启动即尝试

## 2. 编排器集成
- [x] 2.1 Orchestrator 调用 Hook 并在切步时触发回写
  - 集成点：`src/flows/FlowModule.jsx:140`
- [x] 2.2 规范回写 payload 与端点（文档）
  - 端点：`endpoints.flow.updateProgress(flowId)`；文档：`HEARTBEAT_PAYLOAD.md`，字段：`{ flowId, stepIndex, modulePageNum, ts }`
- [x] 2.3 DEV Mock 端点（仅开发环境）
  - 已在 `vite.config.js:86-89` 实现，拦截 `/api/flows/:flowId/progress` POST 请求，返回 200
- [x] 2.4 监控与诊断
  - 在 DEV 控制台打印完整 payload、响应状态、错误详情与队列长度；提供 `window.__flowHeartbeatDebug` 调试对象（见 `useHeartbeat.ts`）

## 验收
- [x] 切步即时上报一次；运行期每 15s 上报一次
- [x] 离线/失败后恢复能 flush 历史队列
- [x] DEV 环境可观察到 payload 与响应（Mock 或真实端点）
