## Proposal: add-heartbeat-and-progress-sync

## Why
- 在 Flow 运行时可选上报心跳/进度，支持掉线恢复与后端监控。

## What Changes
- 新增 `useHeartbeat` 与 Progress 回写策略；
- 与 Flow Orchestrator 集成，按步或定时回写。

## Impact
- 提升可观测性与跨端恢复能力。
