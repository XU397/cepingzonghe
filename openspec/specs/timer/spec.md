# timer Specification

## Purpose
为前端 Flow/CMI 与年级模块提供统一、可复用的计时器能力，涵盖主任务、问卷与注意事项的计时、UI 呈现、跨刷新恢复及 once-only 超时去重行为，确保各模块对剩余时间、自动跳转与环境差异（DEV/PROD）遵循一致规范。
## Requirements
### Requirement: 统一计时器引擎（TimerService）
交互前端 SHALL 提供统一的 TimerService，以覆盖主任务、问卷与注意事项三类计时能力，并保障跨刷新恢复与到期自动跳转的一致行为。

#### Scenario: API
- WHEN 子模块启动各自计时
- THEN 服务 SHALL 提供 `startTask(duration?)`、`startQuestionnaire(duration?)`、`startNotice(duration?)`、`pause/resume/reset`；
- AND SHALL 通过回调或事件总线触发 `onTimeout(type)`（只触发一次）。

#### Scenario: 持久化与离线扣减
- WHEN 用户刷新或离线后恢复
- THEN 服务 SHALL 在 localStorage 持久化开始时间与剩余秒数；
- AND 页面恢复时 SHALL 按离线时间扣减并继续；
- AND 超时后 SHALL 标记并停止计时，触发自动跳转。

### Requirement: 统一计时器显示（TimerDisplay）
计时器 UI MUST 复用七年级既有的计时展示样式，并向所有模块暴露一致的视觉与阈值配置。

#### Scenario: UI 与阈值
- WHEN 组件渲染剩余时间
- THEN 视觉 SHALL 与 7 年级像素级一致；
- AND 默认 <300s 进入警告态、<60s 进入严重态，且可通过 props 覆盖。

### Requirement: 注意事项计时与一次性超时
平台 SHALL 提供注意事项计时默认 40 秒，并保证超时事件只触发一次且可跨模块/子模块去重。

#### Scenario: 注意事项计时默认值
- WHEN 调用 `startNotice()` 未显式传参
- THEN 服务 SHALL 使用 40 秒作为默认时长；
- AND DEV/PROD 可按需展示不同提示，但行为一致。

#### Scenario: 超时只触发一次
- WHEN 计时结束
- THEN 服务 SHALL 使用 `core.timer/timeoutFired.<scope>` 标记去重；
- AND Flow 切换子模块时 SHALL 清理上一个 scope 的标记。
