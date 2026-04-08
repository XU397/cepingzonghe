# Tasks: add-timer-display-control

## 1. AppContext 状态管理扩展

- [x] 1.1 在 AppContext 中新增 `displayOptions` 状态（含 localStorage 初始化）
- [x] 1.2 新增 `updateDisplayOptions(options, { forceOverwrite })` 方法，支持强制覆盖
- [x] 1.3 新增 `shouldHideTimer` 计算属性
- [x] 1.4 新增 `parseDisplayOptions(raw)` 工具函数，含类型容错（非布尔值视为 false + 警告日志）
- [x] 1.5 登出时清理 `core.displayOptions/*` localStorage 键

## 2. 登录流程适配

- [x] 2.1 在 `handleLoginSuccess` 中解析 `displayOptions` 字段
- [x] 2.2 调用 `updateDisplayOptions()` 并强制覆盖旧值（避免旧账号配置污染）
- [x] 2.3 处理字段缺失情况（使用默认值 `{ hideTimerDisplay: false }`）

## 3. TimerDisplay 组件适配

- [x] 3.1 在 `TimerDisplay` 组件中新增 `hidden` prop
- [x] 3.2 `hidden=true` 时返回 `null`
- [x] 3.3 更新 PropTypes 定义
- [x] 3.4 编写单元测试验证隐藏行为

## 4. TimerContainer 适配

- [x] 4.1 在 `TimerContainer` 中读取 AppContext 的 `shouldHideTimer`
- [x] 4.2 将 `hidden` prop 传递给 `TimerDisplay`
- [x] 4.3 编写集成测试验证配置传递

## 5. 子模块 Timer 组件适配

- [x] 5.1 检查并列出所有使用 Timer 的子模块组件
- [x] 5.2 `GlobalTimer`（Grade-4）适配 `shouldHideTimer`
- [x] 5.3 `QuestionnaireTimer` 适配 `shouldHideTimer`
- [x] 5.4 其他子模块自有 Timer 组件适配（如有）

## 6. 文档与验证

- [x] 6.1 更新 `src/shared/services/timers/README.md` 新增隐藏功能说明
- [ ] 6.2 手动验证：Mock 登录响应 `hideTimerDisplay: true`，确认所有 Timer 不显示
- [ ] 6.3 手动验证：切换账号登录，确认旧配置被覆盖
- [ ] 6.4 手动验证：刷新页面后配置保持
- [ ] 6.5 手动验证：非布尔值类型时输出警告日志并默认显示
- [x] 6.6 运行 `npm run lint` 确保无错误（本次修改的文件已通过）
- [x] 6.7 运行 `npm test` 确保测试通过（TimerDisplay/TimerContainer 测试 4/4 通过）

## Dependencies

- **后端依赖**：登录接口返回 `displayOptions.hideTimerDisplay` 字段
- **管理端依赖**：无（前端可独立完成，配置由后端控制）

## Parallel Work

- 任务 1-3 可并行开发
- 任务 4 依赖任务 1 和 3 完成
- 任务 5 依赖任务 1 完成
- 任务 6 在所有代码完成后执行
