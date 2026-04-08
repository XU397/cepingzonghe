# Proposal: add-timer-display-control

## Why

在某些线下考试场景中，需要由监考人员统一控制考试时间，而非系统自动控制。当前系统的倒计时时钟会显示给学生，可能造成焦虑或与线下监考时间不一致。需要新增"隐藏倒计时显示"功能，允许管理后台配置是否向学生显示倒计时 UI。

**核心原则**：只影响 UI 显示，不改变任何倒计时逻辑。计时器依然正常运行、记录、超时触发，只是学生端看不到倒计时时钟。

## What Changes

- **登录响应扩展**：后端在登录响应中新增 `displayOptions.hideTimerDisplay` 字段
- **AppContext 状态管理**：新增 `displayOptions` 状态及持久化逻辑，登录时强制覆盖旧值
- **TimerDisplay 组件**：新增 `hidden` prop 和基于 Context 的自动隐藏逻辑
- **TimerContainer 适配**：读取 AppContext 配置，传递给 TimerDisplay
- **各子模块 Timer 组件**：适配统一的隐藏逻辑（所有计时 UI 入口统一遵守）

## Impact

- Affected specs:
  - `timer` - 新增 TimerDisplay 隐藏控制要求（含隐藏范围约束）
  - `flow` - 新增 displayOptions 协议要求（含类型容错）
- Affected code:
  - `src/context/AppContext.jsx` - 状态管理
  - `src/pages/LoginPage.jsx` - 解析 displayOptions
  - `src/shared/ui/TimerDisplay/index.jsx` - 新增 hidden prop
  - `src/shared/ui/TimerDisplay/TimerContainer.jsx` - 读取配置
  - 各子模块中使用 Timer 的组件（统一适配隐藏逻辑）

## Key Design Decisions

1. **配置优先级**：登录返回值 > localStorage 持久化值（避免旧账号污染）
2. **隐藏范围**：所有计时 UI（task/questionnaire/notice）统一遵守
3. **类型容错**：非布尔值视为 `false`，输出警告日志
4. **会话隔离**：登录时强制覆盖 localStorage，而非 key 命名空间化

## Out of Scope

- 管理后台 UI 实现（由管理端团队负责）
- 后端接口实现（由后端团队负责）
- 全局倒计时替代子模块倒计时（更复杂的方案，暂不实施）
