## MODIFIED Requirements

### Requirement: 统一计时器显示（TimerDisplay）
计时器 UI MUST 复用七年级既有的计时展示样式，并向所有模块暴露一致的视觉与阈值配置。组件 SHALL 支持通过配置隐藏 UI 显示，但不影响底层计时逻辑。

#### Scenario: UI 与阈值
- **WHEN** 组件渲染剩余时间
- **THEN** 视觉 SHALL 与 7 年级像素级一致
- **AND** 默认 <300s 进入警告态、<60s 进入严重态，且可通过 props 覆盖

#### Scenario: 隐藏显示控制
- **WHEN** 管理后台配置 `hideTimerDisplay: true` 且后端在登录响应中返回该配置
- **THEN** TimerDisplay 组件 SHALL 不渲染任何 UI（返回 `null`）
- **AND** 底层计时器（TimerService）SHALL 正常运行，包括计时、持久化、超时触发
- **AND** 超时回调 SHALL 正常执行（如自动跳转至下一页/完成页）

#### Scenario: 隐藏范围与组件约束
- **WHEN** `hideTimerDisplay: true` 生效时
- **THEN** 以下所有计时 UI 入口 SHALL 统一遵守隐藏规则：
  - `TimerDisplay` 组件（task/questionnaire/notice 三种变体）
  - `TimerContainer` 容器组件
  - 各子模块中使用的 Timer 组件（如 `GlobalTimer`、`QuestionnaireTimer` 等）
- **AND** 所有新增的计时 UI 组件 MUST 复用 `TimerDisplay` 或读取相同的 `shouldHideTimer` 配置
- **AND** 子模块自有 Timer 组件 SHOULD 通过 AppContext 的 `shouldHideTimer` 判断是否渲染

#### Scenario: 默认行为
- **WHEN** 后端未返回 `displayOptions` 或 `hideTimerDisplay` 字段
- **THEN** 前端 SHALL 使用默认值 `false`（显示倒计时）
- **AND** 行为与现有版本完全一致

#### Scenario: 配置优先级与持久化
- **WHEN** 用户登录成功
- **THEN** 前端 SHALL 以后端返回的 `displayOptions` 为准，强制覆盖 localStorage 中的旧值
- **AND** localStorage 仅作为页面刷新时的过渡恢复手段
- **AND** 登录返回值优先级 > localStorage 持久化值

#### Scenario: 刷新恢复
- **WHEN** 用户在已登录状态下刷新页面（未触发新登录）
- **THEN** 前端 SHALL 从 localStorage 恢复 `displayOptions` 配置
- **AND** Timer 隐藏状态 SHALL 保持不变

#### Scenario: 登出清理
- **WHEN** 用户登出
- **THEN** 前端 SHALL 清理 `displayOptions` 相关的 localStorage 数据
- **AND** 下次登录时重新从后端获取配置
