## Context
- 计时在多个模块分散实现，行为不一致；需要统一引擎、显示与跨刷新恢复，并提供一次性超时保护。

## Goals / Non-Goals
- Goals:
  - TimerService（task/questionnaire/notice），跨刷新恢复、只触发一次的超时事件。
  - TimerDisplay 视觉复用与阈值配置。
  - 默认注意事项 40s；Flow/CMI 默认计时配置。
- Non-Goals:
  - 不改后端规则，仅前端行为统一。

## Decisions
- 键名：`core.timer/taskStartTime`, `core.timer/remainingTime`, `core.timer/timeoutFired.<scope>`。
- 精度：1s tick，允许浏览器节流，恢复时以时间差校正。
- 并发保护：`timeoutFired.<scope>` 去重；Flow 切步清理。
- Hook：`useTimer(type, { onTimeout })`；UI 容器 `TimerContainer` 连接服务。

## APIs
- `TimerService.startTask(duration?)`, `startQuestionnaire(duration?)`, `startNotice(duration=40)`
- `pause()`, `resume()`, `reset()`；状态订阅 `onTick`、超时 `onTimeout`。
- `TimerDisplay`：`variant`, `remainingSeconds`, `warningThreshold`, `criticalThreshold`。

## Risks / Trade-offs
- 双重计时冲突：模块内旧计时关闭或只展示态；统一引擎兜底。

## Migration Plan
1) 输出服务/Hook/UI；
2) 先接入 G7-Tracking，再推广；
3) Flow/CMI 默认计时对接。

