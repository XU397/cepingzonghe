# Heartbeat 无限循环 Bug 报告

**日期**: 2025-11-19
**状态**: 待修复
**严重程度**: 高

## 问题描述

启用 `useHeartbeat` 后，Flow 页面进入无限循环，不断发送 GET 和 POST 请求直到后端 socket hang up。

## 症状

1. 页面卡在 "正在加载测评..." 状态
2. Network 面板显示数百个交替的请求:
   - GET /stu/api/flows/g7-experiment-003
   - POST /stu/api/flows/g7-experiment-003/progress
3. 控制台显示连续的 `[useHeartbeat] Flush success` 日志
4. 后端最终 socket hang up

## 根本原因分析

### 循环路径（推测）

1. `loadFlowState` 完成后调用 `setState` 更新状态
2. 状态更新导致 `heartbeatEnabled` 从 false 变为 true
3. `useHeartbeat` 的 useEffect 触发，调用 `flushQueue` 和 `sendHeartbeat`
4. heartbeat POST 请求成功
5. 某处代码（可能是 `orchestrator.updateProgress` 或状态订阅）触发新的 `loadFlowState`
6. 回到步骤 1，形成循环

### 关键观察

- 禁用 heartbeat (`enabled: false`) 后循环消失
- 循环在 Flow 首次加载时就开始，不需要用户交互
- GET 和 POST 交替出现，说明每次 heartbeat 后都触发了 loadFlow

## 尝试过的修复

### 1. flushQueue 添加锁
- 文件: `src/hooks/useHeartbeat.ts:51-91`
- 方法: 添加 `flushingFlows` Set 防止并发 flush
- 结果: ❌ 无效

### 2. 添加初始化标志
- 文件: `src/hooks/useHeartbeat.ts`
- 方法: 使用 `initializedForFlowRef` 防止重复初始化
- 结果: ❌ 无效

### 3. 移除 enabled 依赖
- 文件: `src/hooks/useHeartbeat.ts:192`
- 方法: 将 `enabled` 从 useEffect 依赖中移除，使用 ref
- 结果: ❌ 无效

### 4. 添加启动延迟
- 文件: `src/hooks/useHeartbeat.ts:148-182`
- 方法: 500ms 延迟后检查 enabled 状态
- 结果: ❌ 无效

## 临时解决方案

禁用 heartbeat:
```javascript
// src/flows/FlowModule.jsx:569
enabled: false, // heartbeatEnabled - 暂时禁用
```

## 需要进一步调查

1. **为什么 heartbeat POST 会触发 loadFlowState?**
   - 检查是否有 useEffect 监听 heartbeat 相关状态
   - 检查 orchestrator.updateProgress 是否触发了状态更新

2. **哪个组件在响应 heartbeat 状态变化?**
   - 在 FlowModule 中添加更多日志
   - 使用 React DevTools Profiler 追踪重新渲染

3. **后端返回的数据是否触发了状态更新?**
   - 检查 progress POST 的响应
   - 检查是否有数据导致前端状态不稳定

## 建议的修复方向

1. **完全解耦 heartbeat 和 loadFlow**
   - heartbeat 不应该触发任何状态更新
   - heartbeat 只负责发送当前进度，不处理响应

2. **使用 debounce/throttle**
   - 对 loadFlowState 添加限流
   - 确保短时间内不会重复调用

3. **重新设计状态更新逻辑**
   - 减少状态依赖，避免级联更新
   - 使用 useReducer 替代多个 useState

## 受影响的文件

- `src/flows/FlowModule.jsx` - 主编排组件
- `src/hooks/useHeartbeat.ts` - 心跳 hook
- `src/flows/orchestrator/FlowOrchestrator.ts` - 编排器类

## 测试建议

修复后需要测试:
1. Flow 首次加载正常（无循环）
2. 页面间导航正常
3. 进度正确保存
4. 刷新恢复正常
5. 心跳按预期间隔发送（15秒）
