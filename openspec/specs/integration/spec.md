# Spec: integration

模块集成到统一平台的规范。

## Purpose

定义各模块接入统一平台的标准要求，确保：
- 统一计时管理（TimerService + TimerDisplay）
- 统一数据提交（usePageSubmission + EventTypes）
- 统一页面框架（AssessmentPageFrame + LeftStepperNav）
- 包装器模式（CMI 接口 + FlowContext）
- 灰度发布与回滚能力

## Requirements

### Requirement: 模块接入统一平台规范
各模块 SHALL 通过"开关化/隐藏/包装器"策略接入统一提交/计时/页面框架与导航，确保行为一致且可灰度发布。

#### Scenario: 接入与灰度
- WHEN 模块接入统一平台
- THEN DEV 环境可配置失败放行；PROD 环境失败 SHALL 阻断并提示；
- AND 旧导航/计时器 SHALL 关闭或仅展示态，避免重复驱动逻辑。

#### Scenario: 统一计时接入
- WHEN 模块需要计时功能
- THEN SHALL 使用 `src/shared/services/timers/TimerService.js` 管理计时状态
- AND SHALL 使用 `src/shared/ui/TimerDisplay/` 显示计时器
- AND 计时状态 SHALL 支持跨刷新恢复
- AND 超时行为 SHALL 触发统一的超时跳转逻辑

#### Scenario: 统一提交接入
- WHEN 模块需要提交数据
- THEN SHALL 使用 `src/shared/services/submission/usePageSubmission.js` Hook
- AND SHALL 使用 `EventTypes` 枚举记录事件类型
- AND SHALL 使用 `createMarkObject` 构建提交数据
- AND SHALL 使用 `validateMarkObject` 校验提交数据
- AND 401 错误 SHALL 触发统一的会话过期处理
- AND DEV 环境提交失败 MAY 放行；PROD 环境 SHALL 阻断

#### Scenario: 统一页面框架接入
- WHEN 模块需要页面布局
- THEN SHALL 使用 `src/shared/ui/PageFrame/AssessmentPageFrame.jsx` 作为页面容器
- AND SHALL 使用 `src/shared/ui/LeftStepperNav/` 显示导航（只读模式）
- AND 模块内部旧导航 SHALL 隐藏或禁用交互逻辑

#### Scenario: 包装器模式
- WHEN 模块需要接入 Flow Orchestrator
- THEN SHALL 创建模块包装器于 `src/submodules/<module-id>/`
- AND 包装器 SHALL 实现 CMI 接口（初始化、销毁、事件通知）
- AND 包装器 SHALL 通知 orchestrator 完成/超时/进度事件
- AND 包装器 SHALL 禁止直接写本地进度（由 orchestrator 统一管理）

#### Scenario: 灰度发布与回滚
- WHEN 模块启用统一平台集成
- THEN SHALL 通过环境变量或配置开关控制
- AND SHALL 提供回滚至旧版本的能力
- AND SHALL 记录关键监控指标（提交成功率、超时率、错误率）
