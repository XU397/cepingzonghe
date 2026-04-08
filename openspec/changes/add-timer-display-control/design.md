# Design: add-timer-display-control

## Context

当前评测系统的倒计时机制：
- 每个子模块有独立的倒计时（task/questionnaire/notice）
- 管理后台可以设置每个子模块的倒计时时长
- 学生端会显示倒计时时钟

**业务场景**：
- 线下考试需要统一时间控制，由监考人员人工控制
- 部分学生看到倒计时会产生焦虑
- 需要灵活调整而不破坏现有逻辑

## Goals / Non-Goals

**Goals**:
- 允许通过后端配置隐藏学生端的倒计时显示
- 倒计时逻辑完全不变（计时、持久化、超时触发等）
- 向后兼容（旧版本前端/后端正常工作）
- 最小化代码改动

**Non-Goals**:
- 不实现"全局倒计时替代子模块倒计时"
- 不修改倒计时逻辑本身
- 不涉及管理后台和后端实现

## Decisions

### Decision 1: 配置存储位置

**选择**：在 AppContext 中新增 `displayOptions` 状态

**理由**：
- AppContext 已是全局状态管理中心
- 便于所有 Timer 组件访问
- 支持 localStorage 持久化（刷新后保持）

**替代方案**：
- FlowContext 中存储 - 但非 Flow 模式的模块也需要此功能
- 独立 Context - 增加复杂度，无明显收益

### Decision 2: 配置优先级规则

**选择**：登录返回值 > localStorage 持久化值

**规则**：
1. **登录时**：后端返回的 `displayOptions` 强制覆盖 localStorage 旧值
2. **刷新时**：从 localStorage 恢复（登录后的过渡手段）
3. **登出时**：清理 localStorage

**理由**：
- 避免旧账号配置污染新会话
- 保证每次登录都以后端配置为准
- localStorage 仅用于页面刷新时的状态恢复

**代码示意**：
```javascript
// handleLoginSuccess 中
const displayOptions = parseDisplayOptions(response.obj.displayOptions);
// 强制覆盖，不管之前存储了什么
updateDisplayOptions(displayOptions, { forceOverwrite: true });
```

### Decision 3: TimerDisplay 组件适配方式

**选择**：新增 `hidden` prop，组件内部判断是否渲染

**理由**：
- 最小侵入性修改
- 保持组件职责清晰
- 便于单元测试

**代码示意**：
```jsx
// TimerDisplay 组件
const TimerDisplay = ({ hidden = false, ...props }) => {
  if (hidden) return null;
  // 原有渲染逻辑
};
```

### Decision 4: 隐藏范围与组件约束

**选择**：所有计时 UI 统一遵守隐藏规则

**覆盖范围**：
- `TimerDisplay` 组件（task/questionnaire/notice）
- `TimerContainer` 容器组件
- `GlobalTimer`（Grade-4）
- `QuestionnaireTimer`
- 各子模块自有 Timer 组件

**实施策略**：
1. **统一入口**：优先让子模块复用 `TimerDisplay` 或 `TimerContainer`
2. **兼容适配**：子模块自有 Timer 组件读取 AppContext 的 `shouldHideTimer`
3. **强制约束**：新增 Timer 组件必须复用统一配置

### Decision 5: 配置传递链路

**选择**：AppContext -> TimerContainer -> TimerDisplay

**数据流**：
```
后端响应 displayOptions.hideTimerDisplay
    |
LoginPage 解析并调用 updateDisplayOptions()
    |
AppContext 存储 + localStorage 持久化（强制覆盖）
    |
TimerContainer 读取 shouldHideTimer
    |
TimerDisplay hidden={shouldHideTimer}
```

### Decision 6: 类型容错处理

**选择**：非布尔值视为 `false`

**规则**：
```javascript
function parseHideTimerDisplay(value) {
  if (typeof value === 'boolean') {
    return value;
  }
  // 非布尔值（字符串、对象、null、undefined）视为 false
  if (value !== undefined && value !== null) {
    console.warn('[displayOptions] hideTimerDisplay 期望 Boolean，收到:', typeof value, value);
  }
  return false;
}
```

**理由**：
- 保守策略：异常情况下默认显示倒计时
- 便于排查：输出警告日志
- 健壮性：不因类型错误导致崩溃

### Decision 7: localStorage Key 命名

**选择**：`core.displayOptions/hideTimerDisplay`

**理由**：
- 遵循项目 `core.*` 命名空间约定
- 与 `core.timer/*` 等键名风格一致

**关于用户隔离**：
- 当前设计依赖登录时强制覆盖，而非 key 命名空间化
- 理由：displayOptions 是会话级配置，登录即重置
- 若未来需要更强隔离，可扩展为 `core.displayOptions/{batchCode}/{examNo}/hideTimerDisplay`

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 后端未返回字段 | 使用默认值 `false`（显示倒计时） |
| localStorage 数据损坏 | try-catch + 默认值兜底 |
| 旧版子模块未适配 | 统一在 TimerContainer 层处理，子模块无需修改 |
| 非布尔值类型 | 视为 `false` + 控制台警告 |
| 旧账号配置污染 | 登录时强制覆盖 localStorage |
| 用户直接关页未登出 | 下次登录时强制覆盖，短暂遗留可接受 |

## Migration Plan

1. **Phase 1**（本提案）：
   - 前端实现 displayOptions 状态管理
   - TimerDisplay 组件适配
   - 等待后端接口就绪前，功能不可用（默认显示）

2. **Phase 2**（后端）：
   - 后端在登录响应中返回 `displayOptions.hideTimerDisplay`
   - 功能自动生效

3. **Rollback**：
   - 后端不返回 `displayOptions` 即可回退
   - 前端代码无需修改

## Open Questions

- 无（方案已确定）
