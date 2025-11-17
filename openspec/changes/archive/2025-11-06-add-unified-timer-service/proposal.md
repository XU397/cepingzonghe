# Proposal: add-unified-timer-service

## Why
- 现有计时器实现分散（AppContext/Tracking/Grade4），行为与持久化不一致，四年级存在跨刷新与超时自动跳转缺口。

## What Changes
- 新增统一计时器引擎（主任务/问卷/注意事项），提供 start/pause/resume/reset API 与 once-only 超时事件；
- 统一离线时间扣减与本地持久化键名；
- 统一 UI 显示（TimerDisplay），警告/严重阈值一致。
- 将 TimerService 输出至 `shared/services/timers/`，TimerDisplay 抽取到 `shared/ui/TimerDisplay`，并提供 Flow/CMI 默认计时配置。

## Impact
- FE 交互端计时一致化，降低错误与维护成本；
- 与 Flow/CMI 配合，按子模块覆盖默认时长。
