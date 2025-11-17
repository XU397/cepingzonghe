## Context
- Flow 运行时希望上报“心跳/进度”，便于后端观测与跨端恢复；要求失败不阻断前端流程。

## Goals / Non-Goals
- Goals:
  - 提供 `useHeartbeat` Hook 与最小 payload `{ flowId, stepIndex, modulePageNum, ts }`。
  - 触发策略：切页立即+间隔节流（如 15s）。
  - 失败降级：本地缓存队列，后续补写；不影响用户操作。
- Non-Goals:
  - 不用于权限/风控强校验；不上报敏感数据。

## Decisions
- 节流：默认 15s（可配置）+ 切页即时一次。
- 幂等：后端以 `(flowId, stepIndex, modulePageNum, minuteBucket)` 幂等去重。
- 本地缓存：`flow.<id>.heartbeatQueue`（仅保留最近 N 条，N=50）。
- 失败策略：离线/失败 → 入队；网络恢复/下次触发时批量 flush。
- 开关：Feature flag `core.heartbeat/enabled`，默认关闭，灰度开启。

## APIs
- `useHeartbeat({ flowId, stepIndex, modulePageNum, enabled })`：内部管理定时器与 flush。
- `endpoints.PROGRESS_WRITE`：心跳/进度回写端点（与后端对齐）。

## Risks / Trade-offs
- 过多上报：通过节流与合并降低压力。
- 隐私：仅上报最小进度信息，不含内容数据。

## Migration Plan
1) 实现 Hook 与本地队列；
2) Orchestrator 集成（切页触发），默认关闭；
3) 约定后端幂等与限流策略后再灰度开启。

## Open Questions
- 灰度策略与开关承载位置（环境变量 vs 远端配置）。

