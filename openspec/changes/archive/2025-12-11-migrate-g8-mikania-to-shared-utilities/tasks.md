# Tasks: 迁移 g8-mikania-experiment 至共享操作管理 Utility

## Task 0: 扩展 RESERVED_ELEMENTS 支持中文（前置依赖）

**目标**：扩展共享层的 `RESERVED_ELEMENTS` 集合，添加中文保留元素映射

**文件**：`src/shared/services/submission/submoduleAdapter/constants.ts`

**背景**：当前 `RESERVED_ELEMENTS` 只包含英文 token，但 g8-mikania 使用中文 `页面` 作为 targetElement，导致 `isReservedElement('页面')` 返回 `false`。

**变更**：
```typescript
// 当前
export const RESERVED_ELEMENTS: Set<string> = new Set<string>([
  'page',
  'next_button',
  'prev_button',
  'module',
  'flow_context',
  'task_timer',
  'countdown',
]);

// 扩展后
export const RESERVED_ELEMENTS: Set<string> = new Set<string>([
  'page', '页面',
  'next_button', '下一步按钮',
  'prev_button', '上一步按钮',
  'module',
  'flow_context',
  'task_timer',
  'countdown',
]);
```

**验证**：
- [x] `isReservedElement('页面')` 返回 `true`
- [x] `isReservedElement('page')` 返回 `true`
- [x] 现有测试通过

**依赖**：无

---

## Task 1: 引入共享 Utility 并重构操作序号管理

**目标**：将 Component.jsx 的操作序号管理从自实现迁移到 `createOperationSequence`，使用共享 Utility 的 `injectFlowContext` 和 `shouldInjectFlowContext`

**文件**：`src/submodules/g8-mikania-experiment/Component.jsx`

**API 约束**：
- `injectFlowContext(operations, flowContext, sequence)` - 需要完整 operations 数组
- `shouldInjectFlowContext(operations, flowContext)` - 需要检查 operations 中是否已有 flow_context

由于这两个 API 都需要 operations 数组，必须在 Reducer 内部调用，采用 **Reducer 工厂闭包** 模式。

**变更**：
1. 导入共享 Utility：
   ```javascript
   import {
     createOperationSequence,
     injectFlowContext,
     shouldInjectFlowContext,
   } from '@shared/services/submission/submoduleAdapter';
   ```

2. 在组件顶层创建 sequence ref：
   ```javascript
   const sequenceRef = useRef(createOperationSequence());
   ```

3. 创建 Reducer 工厂函数：
   ```javascript
   function createMikaniaReducer(sequenceRef, flowContext) {
     return function mikaniaReducer(state, action) {
       switch (action.type) {
         case LOG_OPERATION: {
           const operation = action.payload;
           let operations = [...state.operations, operation];

           // 使用共享 Utility 检查并注入 flow_context
           const isPageEnter = operation.eventType === EventTypes.PAGE_ENTER;
           if (isPageEnter &&
               shouldInjectFlowContext(operations, flowContext) &&
               !state.flowContextInjected) {
             operations = injectFlowContext(
               operations,
               flowContext,
               sequenceRef.current  // 闭包访问
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

4. 使用 useMemo 创建 Reducer：
   ```javascript
   const reducer = useMemo(
     () => createMikaniaReducer(sequenceRef, flowContext),
     [flowContext]
   );
   const [state, dispatch] = useReducer(reducer, initialPageId, createInitialState);
   ```

5. 修改 Action Creator：在 dispatch 前生成 code
   ```javascript
   const logOperation = useCallback((operation) => {
     const code = sequenceRef.current.next();
     dispatch({
       type: LOG_OPERATION,
       payload: { ...operation, code },
     });
   }, []);

   const setPage = useCallback((pageId) => {
     sequenceRef.current.reset();
     dispatch({ type: SET_PAGE, payload: pageId });
   }, []);
   ```

6. 移除 state 中的 `operationSequence` 字段（由 sequenceRef 管理）
7. 保留 state 中的 `flowContextInjected` 字段（Reducer 需要检查）

**设计权衡**：Reducer 通过闭包访问 sequenceRef，会在 injectFlowContext 内部调用 sequence.next()。这是 API 设计决定的约束，与 useOperationLogger 的实现方式一致。

**验证**：
- [x] 单元测试：LOG_OPERATION 后 code 从 1 开始连续递增
- [x] 单元测试：SET_PAGE 后 code 重置为 1
- [x] flow_context 注入时 code 正确（page_enter code + 1）
- [x] shouldInjectFlowContext 正确检查 operations 中是否已有 flow_context
- [x] 快照测试通过

**依赖**：Task 0

---

## Task 2: 修复保留元素前缀问题

**目标**：保留元素（`页面`、`flow_context` 等）不添加 `P${pageNumber}_` 前缀

**文件**：
- `src/submodules/g8-mikania-experiment/pages/Page00_Notice.jsx`
- `src/submodules/g8-mikania-experiment/pages/Page01_Intro.jsx`
- `src/submodules/g8-mikania-experiment/pages/Page02_Step_Q1.jsx`
- `src/submodules/g8-mikania-experiment/pages/Page03_Sim_Exp.jsx`
- `src/submodules/g8-mikania-experiment/pages/Page04_Q2_Data.jsx`
- `src/submodules/g8-mikania-experiment/pages/Page05_Q3_Trend.jsx`
- `src/submodules/g8-mikania-experiment/pages/Page06_Q4_Conc.jsx`

**变更**：
1. 导入 `isReservedElement` 函数：
   ```javascript
   import { isReservedElement } from '@shared/services/submission/submoduleAdapter';
   ```

2. 修改 `pageTarget` 定义，使用 `isReservedElement` 判断：
   ```javascript
   // 当前（错误）
   const pageTarget = `${pageTargetPrefix}页面`;

   // 修复后
   const pageTarget = isReservedElement('页面') ? '页面' : `${pageTargetPrefix}页面`;
   ```

3. 检查其他保留元素（如下一步按钮、倒计时）的使用，统一使用 `isReservedElement` 判断

**验证**：
- [x] page_enter/page_exit 的 targetElement 为 `页面`（无前缀）
- [x] flow_context 的 targetElement 为 `flow_context`（无前缀）
- [x] 业务元素仍保持前缀（如 `P1.03_控制变量输入框`）

**依赖**：Task 0, Task 1

---

## Task 3: 移除 buildMark 中的备用注入逻辑

**目标**：移除 buildMark 中重新映射 code 的备用逻辑，依赖 Reducer 工厂闭包的正常注入

**文件**：`src/submodules/g8-mikania-experiment/Component.jsx`

**变更**：
1. 删除 buildMark 中的备用 flow_context 注入代码块（第 427-445 行）
2. 保留 `shouldInjectFlowContext` 检查作为防御性编程（仅日志警告，不执行注入）
3. 确保 Reducer 工厂闭包的注入逻辑覆盖所有场景

**验证**：
- [x] buildMark 不再修改 operationList 的 code
- [x] flow_context 仅由 Reducer 工厂闭包注入
- [x] 快照测试中 flow_context.code 正确

**依赖**：Task 1

---

## Task 4: 添加 validateMappingConfig 测试

**目标**：使用共享验证函数验证 mapping 配置完整性

**文件**：`src/submodules/g8-mikania-experiment/__tests__/mapping.test.js`

**变更**：
1. 导入 `validateMappingConfig`：
   ```javascript
   import { validateMappingConfig } from '@shared/services/submission/submoduleAdapter';
   ```
2. 添加测试用例：
   ```javascript
   it('应通过 validateMappingConfig 验证', () => {
     const result = validateMappingConfig(SUBMODULE_MAPPING_CONFIG);
     expect(result.valid).toBe(true);
     expect(result.errors).toHaveLength(0);
   });
   ```

**验证**：
- [x] 测试通过
- [x] CI 中 mapping 验证覆盖

**依赖**：无（可并行）

---

## Task 5: 更新快照测试

**目标**：更新快照以反映新的 targetElement 格式和 code 顺序

**文件**：`src/submodules/g8-mikania-experiment/__tests__/submission.snapshot.test.ts`

**变更**：
1. 运行测试，检查快照差异
2. 验证差异符合预期：
   - `页面` 相关操作的 targetElement 无前缀
   - `flow_context` 的 code 符合注入位置（page_enter 之后）
   - 业务操作的 code 连续递增
3. 更新快照

**验证**：
- [x] 快照测试通过
- [x] 快照内容符合规范

**依赖**：Task 1, Task 2, Task 3

---

## Task 6: 端到端验证

**目标**：在开发环境验证完整流程

**验证清单**：
- [x] 启动开发服务器，进入 g8-mikania-experiment 模块
- [x] 完成全部页面流程，观察控制台日志
- [x] 检查提交数据：
  - pageNumber 格式正确（如 `1.03`）
  - operationList.code 从 1 开始连续
  - flow_context 仅出现一次且紧跟 page_enter
  - 保留元素无前缀
- [x] 刷新页面，验证状态恢复正常

**依赖**：Task 1-5 全部完成

---

## 任务依赖图

```
Task 0 (扩展 RESERVED_ELEMENTS)
    │
    ├─────────────────────────────────────────────┐
    │                                             │
    ▼                                             │
Task 1 (Reducer 工厂闭包重构)                      │
    │                                             │
    ├── Task 2 (保留元素前缀) ←────────────────────┘
    │
    └── Task 3 (移除备用注入)                      Task 4 (validateMappingConfig)
              │                                        │
              └────────────┬───────────────────────────┘
                           │
                           ▼
                    Task 5 (更新快照)
                           │
                           ▼
                    Task 6 (E2E 验证)
```

## 验收标准

1. `npm run test:submission` 全部通过
2. `npm run lint` 无错误
3. 快照内容符合 `docs/子模块数据规范1205.md` 第 4、5、10 节要求
4. 代码审查确认未引入新的技术债务
