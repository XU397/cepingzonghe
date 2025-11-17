## Context
- 三个模块（G4/G7/G7-Tracking）需要以最小侵入接入统一提交/计时/框架与导航，支持灰度与回滚。

## Goals / Non-Goals
- Goals:
  - 定义接入顺序、特性开关与回滚方案。
  - 确保 DEV 可放行、PROD 失败阻断路径一致。
- Non-Goals:
  - 不一次性重构所有模块内部实现。

## Decisions
- 特性开关：`core.features/{submission,timer,frame}` 分模块可控；
- 兼容策略：旧导航/计时器开关化或隐藏，避免重复驱动；
- 监控：关键路径埋点（提交成功/失败、401、超时跳转）。

## Phasing / Migration Plan
1) 试点：G7-Tracking 接入提交/计时/框架；
2) 推广：G7 接入；
3) 收尾：G4 接入与清理旧实现；
4) 灰度：按批次或用户群分阶段开启；
5) 回滚：开关关闭恢复旧路径；

## Risks / Trade-offs
- 混合期复杂度提高：通过清单与分支保护控制；
- 不一致行为暴露：以统一规范为准，及时同步差异。

