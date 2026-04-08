# 设计文档：g8-mikania-experiment 操作管理迁移

## 1. 当前实现分析

### 1.1 操作序号管理

**位置**：`Component.jsx:221-259`

```javascript
case ACTION_TYPES.LOG_OPERATION: {
  const operation = {
    ...operationData,
    code: state.operationSequence,  // 自实现：从 state 读取序号
  };
  // ...
  return {
    ...state,
    operationSequence: nextSequence,  // 自实现：递增序号
  };
}
```

**问题**：
- 序号存储在 Reducer state 中，与操作日志耦合
- 手动管理递增逻辑，容易出错
- 不符合规范要求使用 `createOperationSequence`

### 1.2 flow_context 注入

**位置**：`Component.jsx:232-251`

```javascript
if (isPageEnter && hasFlowContext && !state.flowContextInjected) {
  newOperations.push({
    code: nextSequence,
    targetElement: 'flow_context',
    eventType: EventTypes.FLOW_CONTEXT,
    value: JSON.stringify({ ... }),
    time: formatTimestamp(new Date()),
  });
  nextSequence += 1;
  injected = true;
}
```

**问题**：
- 手动实现注入逻辑
- 未使用 `shouldInjectFlowContext` 检查
- 未使用 `injectFlowContext` 函数

### 1.3 备用注入逻辑

**位置**：`Component.jsx:427-444`

```javascript
if (flowContext?.flowId && !hasFlowContext) {
  operationList = [
    { code: 1, ... },
    ...operationList.map((op, idx) => ({ ...op, code: idx + 2 })),
  ];
}
```

**问题**：
- 重新映射所有 code，可能导致数据不一致
- 与 Reducer 中的注入逻辑重复
- 违反"单一职责"原则

---

## 2. 目标架构

### 2.1 核心问题：共享 Utility API 需要 operations 数组

**问题**：共享 Utility 的 API 设计决定了实现方式：
- `injectFlowContext(operations, flowContext, sequence)` - 需要完整 operations 数组
- `shouldInjectFlowContext(operations, flowContext)` - 需要完整 operations 数组

由于 operations 存储在 Reducer state 中，这些函数必须在 Reducer 内部调用。

**解决方案**：采用 **Reducer 工厂闭包** 模式：
- sequence 对象存储在组件的 useRef 中
- action creator 在 dispatch **之前** 调用 `sequence.next()` 生成操作的 code
- action creator 在 dispatch **之前** 调用 `sequence.reset()` 重置序号
- Reducer 通过工厂闭包访问 sequenceRef，在 `injectFlowContext` 内部调用 `sequence.next()` 生成 flow_context 的 code

### 2.2 架构变更

**API 约束分析**：

共享 Utility 的 API 签名决定了实现方式：
- `injectFlowContext(operations, flowContext, sequence)` - 需要完整 operations 数组
- `shouldInjectFlowContext(operations, flowContext)` - 需要完整 operations 数组检查是否已注入

由于这两个函数都需要 operations 数组，而 operations 存储在 Reducer state 中，因此必须在 Reducer 内部调用。这决定了采用 **Reducer 工厂闭包** 模式。

```
┌─────────────────────────────────────────────────────────────────┐
│                     MikaniaExperimentComponent                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  // 1. 组件层：持有 sequence ref                                 │
│  const sequenceRef = useRef(createOperationSequence());         │
│                                                                 │
│  // 2. 创建可访问 sequenceRef 的 Reducer（工厂模式）             │
│  const reducer = useMemo(                                       │
│    () => createMikaniaReducer(sequenceRef, flowContext),        │
│    [flowContext]                                                │
│  );                                                             │
│                                                                 │
│  // 3. Action Creator 层：dispatch 前生成 code                  │
│  const logOperation = useCallback((operation) => {              │
│    const code = sequenceRef.current.next();                     │
│    dispatch({                                                   │
│      type: LOG_OPERATION,                                       │
│      payload: { ...operation, code },                           │
│    });                                                          │
│  }, []);                                                        │
│                                                                 │
│  const setPage = useCallback((pageId) => {                      │
│    sequenceRef.current.reset();                                 │
│    dispatch({ type: SET_PAGE, payload: pageId });               │
│  }, []);                                                        │
│                                                                 │
│  // 4. Reducer 工厂：通过闭包访问 sequenceRef 和 flowContext    │
│  function createMikaniaReducer(sequenceRef, flowContext) {      │
│    return function mikaniaReducer(state, action) {              │
│      switch (action.type) {                                     │
│        case LOG_OPERATION: {                                    │
│          const operation = action.payload;                      │
│          let operations = [...state.operations, operation];     │
│                                                                 │
│          // 使用共享 Utility 检查并注入 flow_context            │
│          if (operation.eventType === 'page_enter' &&            │
│              shouldInjectFlowContext(operations, flowContext) &&│
│              !state.flowContextInjected) {                      │
│            operations = injectFlowContext(                      │
│              operations,                                        │
│              flowContext,                                       │
│              sequenceRef.current  // 闭包访问                   │
│            );                                                   │
│            return { ...state, operations, flowContextInjected: true };│
│          }                                                      │
│          return { ...state, operations };                       │
│        }                                                        │
│        case SET_PAGE:                                           │
│          return { ...state, operations: [], flowContextInjected: false };│
│      }                                                          │
│    };                                                           │
│  }                                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**设计权衡说明**：

Reducer 通过闭包访问 `sequenceRef` 会在 `injectFlowContext` 内部调用 `sequence.next()`，这使 Reducer 不是严格意义上的纯函数。这是 API 设计决定的约束：

1. `injectFlowContext` 需要 operations 数组来定位 page_enter 位置
2. `shouldInjectFlowContext` 需要 operations 数组来检查是否已存在 flow_context
3. operations 存储在 state 中，只能在 Reducer 内访问

这种有限度的非纯是可接受的，因为：
- 副作用仅限于 sequence.next()（生成递增数字）
- 相同的 state + action 仍产生确定的新 state（code 值依赖 sequence 状态）
- 与 useOperationLogger 的实现方式一致

### 2.3 数据流（修正后）

```
LOG_OPERATION 流程（普通操作）：

用户操作
    │
    ▼
Action Creator: logOperation(operation)
    │
    ├─ 1. code = sequenceRef.current.next()
    │
    ▼
dispatch({ type: LOG_OPERATION, payload: { ...operation, code } })
    │
    ▼
Reducer (工厂闭包):
    ├─ 2. operations = [...state.operations, payload]
    ├─ 3. 检查 eventType !== 'page_enter' → 跳过注入
    └─ 4. return { ...state, operations }


LOG_OPERATION 流程（page_enter + flow_context）：

page_enter 事件
    │
    ▼
Action Creator: logOperation(operation)
    │
    ├─ 1. code = sequenceRef.current.next()  // page_enter 的 code
    │
    ▼
dispatch({ type: LOG_OPERATION, payload: { ...operation, code } })
    │
    ▼
Reducer (工厂闭包):
    ├─ 2. operations = [...state.operations, payload]
    ├─ 3. 检查 eventType === 'page_enter' → 继续
    ├─ 4. shouldInjectFlowContext(operations, flowContext) → true
    ├─ 5. !state.flowContextInjected → true
    ├─ 6. operations = injectFlowContext(operations, flowContext, sequenceRef.current)
    │     └─ injectFlowContext 内部调用 sequence.next() 生成 flow_context 的 code
    └─ 7. return { ...state, operations, flowContextInjected: true }


SET_PAGE 流程：

navigateToPage(pageId)
    │
    ▼
Action Creator: setPage(pageId)
    │
    ├─ 1. sequenceRef.current.reset()
    │
    ▼
dispatch({ type: SET_PAGE, payload: pageId })
    │
    ▼
Reducer (工厂闭包):
    └─ return { ...state, operations: [], flowContextInjected: false }
```

### 2.4 operationSequence 字段的去留

**当前状态**：`state.operationSequence` 存储在 Reducer state 中

**迁移后**：
- **移除** `operationSequence` 字段
- 序号由 `sequenceRef.current` 管理
- 不再需要在 state 中持久化序号（规范明确：断点续做恢复的是页面位置，不是操作序号）

---

## 3. 关键决策

### 3.1 选择灵活组合模式（模式 B）

**原因**：
- g8-mikania 已有成熟的 Reducer 架构
- 全托管模式（useOperationLogger）需要较大重构
- 灵活组合模式可复用现有代码，风险更低

### 3.2 flow_context 注入在 Reducer 工厂闭包内完成

**API 约束**：
- `injectFlowContext(operations, flowContext, sequence)` - 需要完整 operations 数组
- `shouldInjectFlowContext(operations, flowContext)` - 需要检查 operations 中是否已有 flow_context

**解决方案**：由于 API 需要 operations 数组，必须在 Reducer 内部调用，采用 Reducer 工厂闭包模式：

```javascript
// Reducer 工厂
function createMikaniaReducer(sequenceRef, flowContext) {
  return function mikaniaReducer(state, action) {
    switch (action.type) {
      case LOG_OPERATION: {
        const operation = action.payload;
        let operations = [...state.operations, operation];

        // 检查是否需要注入 flow_context（使用共享 Utility）
        const isPageEnter = operation.eventType === EventTypes.PAGE_ENTER;
        if (isPageEnter &&
            shouldInjectFlowContext(operations, flowContext) &&
            !state.flowContextInjected) {
          // 调用共享 Utility 注入 flow_context
          operations = injectFlowContext(
            operations,
            flowContext,
            sequenceRef.current  // 闭包访问，injectFlowContext 内部调用 sequence.next()
          );
          return { ...state, operations, flowContextInjected: true };
        }
        return { ...state, operations };
      }
      case SET_PAGE:
        return { ...state, operations: [], flowContextInjected: false };
    }
  };
}
```

**设计权衡**：
- Reducer 通过闭包访问 sequenceRef，会在 injectFlowContext 内部调用 sequence.next()
- 这是 API 设计决定的约束，与 useOperationLogger 的实现方式一致
- 相同 state + action 仍产生可预测的结果（code 值依赖 sequence 当前状态）

### 3.3 移除备用注入逻辑

**原因**：
- 备用逻辑重新映射 code，违反"code 不可变"原则
- Reducer 中的正常注入应覆盖所有场景
- 简化代码，减少潜在 bug

**替代方案**：
- 保留 `shouldInjectFlowContext` 检查作为防御性编程
- 如果检测到缺失 flow_context，仅记录警告日志

---

## 4. 保留元素处理

### 4.1 保留元素列表

根据规范第 4.1.3 节和 `openspec/specs/submission/spec.md:160-167`，以下元素不添加前缀：

| 中文名称 | 英文常量 | 使用场景 |
|---------|----------|---------|
| `页面` | `page` | page_enter / page_exit |
| `flow_context` | `flow_context` | flow_context 事件 |
| `下一步按钮` | `next_button` | 导航按钮 |
| `上一步按钮` | `prev_button` | 导航按钮 |

### 4.2 实现方式

**前置依赖**：扩展 `RESERVED_ELEMENTS` 支持中文

当前 `src/shared/services/submission/submoduleAdapter/constants.ts` 中的 `RESERVED_ELEMENTS` 只包含英文 token：

```typescript
// 当前实现（仅英文）
export const RESERVED_ELEMENTS: Set<string> = new Set<string>([
  'page',           // 缺少 '页面'
  'next_button',    // 缺少 '下一步按钮'
  'prev_button',    // 缺少 '上一步按钮'
  // ...
]);
```

**问题**：g8-mikania 使用中文 `页面` 作为 targetElement，`isReservedElement('页面')` 会返回 `false`。

**解决方案**：本变更需要先扩展共享层，添加中文映射：

```typescript
// 需要扩展为（中英文对照）
export const RESERVED_ELEMENTS: Set<string> = new Set<string>([
  'page', '页面',
  'next_button', '下一步按钮',
  'prev_button', '上一步按钮',
  'flow_context',  // flow_context 保持英文
  'module',
  'task_timer',
  'countdown',
]);
```

**子模块实现**：扩展共享层后，使用 `isReservedElement` 函数

```javascript
import { isReservedElement } from '@shared/services/submission/submoduleAdapter';

// 页面组件中
const pageTarget = isReservedElement('页面') ? '页面' : `${targetPrefix}页面`;
```

**选择理由**：
- 规范明确要求工具链提供 `isReservedElement` 函数（spec.md:168）
- 使用统一函数可确保与共享层保留元素集合同步
- 扩展共享层支持中文，所有子模块受益
- 避免每个子模块自行判断，减少出错可能

---

## 5. 测试策略

### 5.1 单元测试

| 测试项 | 验证点 | 文件 |
|-------|-------|------|
| 序号生成 | code 从 1 开始连续 | Component.test.js |
| 序号重置 | SET_PAGE 后 code 重置 | Component.test.js |
| flow_context 注入 | 仅注入一次 | Component.test.js |
| 保留元素 | 无前缀 | PageInteractions.test.jsx |

### 5.2 快照测试

| 页面 | 预期变更 |
|-----|---------|
| page_02_step_q1 | flow_context.code 位置正确 |
| page_03_sim_exp | 实验历史 code 正确 |

### 5.3 集成测试

- 完整流程测试（7 个页面）
- 刷新恢复测试
- 提交数据格式验证

---

## 6. 风险评估

| 风险 | 可能性 | 影响 | 缓解措施 |
|-----|-------|------|---------|
| Reducer 与 ref 同步问题 | 中 | 中 | 在 action creator 层处理 |
| 快照测试大量变更 | 高 | 低 | 逐个验证快照内容 |
| 遗漏页面组件修改 | 中 | 中 | 全量搜索 targetPrefix |

---

## 7. 回滚方案

如果迁移后出现问题，可通过以下步骤回滚：

1. 恢复 Component.jsx 的自实现逻辑
2. 恢复页面组件的 targetPrefix 使用
3. 恢复快照文件

由于本次变更仅涉及内部实现，不影响外部 API，回滚风险较低。
