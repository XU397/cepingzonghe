# Spec Delta: 提交工具规格（Submission）

## 变更类型
本变更为 submission 规范新增操作管理 Utility 的要求。

---

## ADDED Requirements

### Requirement: 操作序号管理 Utility（createOperationSequence）
提交工具链 SHALL 提供独立的序号管理 utility，支持全托管和灵活组合两种接入模式。

#### Scenario: 序号生成与重置
- WHEN 子模块需要管理操作序号
- THEN 工具链 SHALL 提供 `createOperationSequence()` 函数（无参数）
- AND 返回的 `OperationSequence` 对象 SHALL 包含：
  - `next(): number` - 返回下一个序号并自增（首次调用返回 1）
  - `reset(): void` - 重置序号到初始状态
  - `current(): number` - 返回当前序号（不自增）
- AND 序号 MUST 从 1 开始，符合 `operationList.code` 规范要求
- AND 函数 MUST NOT 接受 initialValue 参数（断点续做恢复的是页面位置，不是操作序号）

#### Scenario: 页面切换时重置
- WHEN 页面切换（currentPageId 变化）
- THEN 子模块 MUST 调用 `sequence.reset()` 重置序号
- AND 重置后 `next()` MUST 返回 1
- AND 此行为与 useOperationLogger 的 clearOperations 一致

### Requirement: Flow Context 注入 Utility（injectFlowContext）
提交工具链 SHALL 提供独立的 flow_context 注入 utility，确保注入时机和格式的一致性。

#### Scenario: 注入位置与格式
- WHEN 子模块需要注入 flow_context 事件
- THEN 工具链 SHALL 提供 `injectFlowContext(operations, flowContext, sequence, options?)` 函数
- AND 函数 SHALL 返回新的 operations 数组（不修改原数组）
- AND flow_context 事件 SHALL 包含：
  - `code: number` - 使用 sequence.next() 生成
  - `targetElement: 'flow_context'` - 固定值，属于保留元素，不加前缀
  - `eventType: 'flow_context'` - 固定值
  - `value: string` - flowContext 对象的 JSON.stringify() 结果
  - `time: string` - 格式为 `YYYY-MM-DD HH:mm:ss`，使用 formatTimestamp() 生成

#### Scenario: FlowContext 对象结构
- GIVEN flowContext 对象传入 injectFlowContext
- THEN flowContext MUST 包含以下必填字段：
  - `flowId: string` - Flow 唯一标识
  - `stepIndex: number` - 当前步骤索引（从 0 开始）
  - `submoduleId: string` - 子模块标识
  - `moduleName: string` - 子模块显示名称（与基线 data-format/spec.md 保持一致）
- AND flowContext MAY 包含以下可选字段：
  - `pageId?: string` - 当前页面 ID

> **注**：基线 `data-format/spec.md:32` 要求 `flow_context.value` 包含 `moduleName`。
> 现有实现 `usePageSubmission.js` 未包含此字段，需在本变更实现时补齐。

#### Scenario: 注入位置与 page_enter 依赖
- WHEN 调用 injectFlowContext
- THEN flow_context 事件 SHALL 插入到 page_enter 事件之后（唯一合规位置）
- AND 函数 MUST NOT 提供 `start`/`end` 等其他位置选项（避免破坏事件顺序规范）
- AND 若 operations 中不存在 page_enter 事件：
  - Flow 场景：函数 SHALL 抛出错误或返回失败，提示调用方先补齐 page_enter
  - 测试场景：MAY 提供 `allowMissingPageEnter: true` 选项以跳过检查（仅用于单元测试）
- 此约束确保符合规范要求的事件顺序：`page_enter` → `flow_context` → 其他业务事件

#### Scenario: 避免重复注入
- WHEN 子模块需要检查是否应注入 flow_context
- THEN 工具链 SHALL 提供 `shouldInjectFlowContext(operations, flowContext)` 函数
- AND 函数 SHALL 返回 `false` 当：
  - flowContext 为 null 或 undefined
  - operations 中已存在 eventType 为 'flow_context' 的事件
- AND 函数 SHALL 返回 `true` 当上述条件都不满足

### Requirement: 页面状态重置 Utility（createPageStateResetter）
提交工具链 SHALL 提供页面切换时的状态重置 utility，封装标准重置动作。

#### Scenario: 重置器创建与使用
- WHEN 子模块需要在页面切换时重置状态
- THEN 工具链 SHALL 提供 `createPageStateResetter(sequence, setFlowContextInjected?)` 工厂函数
- AND 返回的 resetter 函数 SHALL：
  - 调用 `sequence.reset()` 重置序号
  - 若提供 `setFlowContextInjected`，调用 `setFlowContextInjected(false)` 重置注入标记
- AND resetter 函数 MAY 接受可选参数 `{ resetFlowContextFlag?: boolean }`，默认为 true

### Requirement: 子模块接入模式选择
提交工具链 SHALL 支持两种接入模式，子模块可根据场景选择。

#### Scenario: 全托管模式（推荐新模块）
- WHEN 子模块选择全托管模式
- THEN 子模块 SHALL 使用 `useOperationLogger` Hook
- AND Hook SHALL 内部使用 createOperationSequence、injectFlowContext 和 createPageStateResetter
- AND 子模块 MUST NOT 手动管理序号或注入 flow_context

#### Scenario: 灵活组合模式（兼容老模块）
- WHEN 子模块选择灵活组合模式
- THEN 子模块 MAY 直接使用 createOperationSequence、injectFlowContext 和 createPageStateResetter
- AND 子模块 MUST 在页面切换时调用 sequence.reset() 或使用 pageStateResetter
- AND 子模块 MUST 在 page_enter 后调用 injectFlowContext（若有 flowContext）
- AND 子模块 MUST 使用 shouldInjectFlowContext 避免重复注入

### Requirement: targetElement 前缀规则 - 保留元素例外
提交工具链 SHALL 明确 targetElement 前缀规则的例外情况，补充基线 `data-format/spec.md:23` 的约束。

> 原文见 data-format/spec.md:23：`operationList/answerList` 中的 `targetElement` SHALL start with `P${pageNumber}_<业务ID>`

#### Scenario: 保留元素免除前缀规则
- GIVEN 系统定义了一组保留元素（reserved elements）
- WHEN 生成 Operation 的 targetElement 字段
- THEN 保留元素 SHALL NOT 添加 `P${pageNumber}_` 前缀
- AND 保留元素集合 SHALL 包含（但不限于）：
  - `flow_context` - Flow 上下文事件
  - `page` - 页面级事件
  - `next_button` - 导航按钮
  - `prev_button` - 导航按钮
  - `module` - 模块级事件
  - `task_timer` - 任务计时器
  - `countdown` - 倒计时
- AND 工具链 SHALL 提供 `isReservedElement(element: string): boolean` 函数用于判断
- AND 工具链 SHALL 提供 `RESERVED_ELEMENTS: Set<string>` 常量用于查询

> **实现参考**：`src/shared/services/submission/submoduleAdapter/constants.ts` 已定义保留元素集合。

---

## MODIFIED Requirements

### Requirement: 统一提交 Hook（usePageSubmission）
提交工具链 SHALL 扩展现有 usePageSubmission 的约束，增加重复注入检测和灵活组合模式要求。

> 原文见 submission/spec.md "统一提交 Hook（usePageSubmission）"

#### Scenario: 输入约束与自动注入
- GIVEN 页面接入 usePageSubmission
- THEN 子模块仅需提供 `getUserContext`、`getFlowContext`、`pageMeta`(pageId/pageTitle/subPageNum)、`answers`(非空)与业务 `operations`；
- AND 子模块 MUST NOT 手写 `pageNumber/targetElement/flow_context/code/time` 或直接 `fetch /stu/saveHcMark`，由提交层统一编码与提交；
- **AND 子模块若使用灵活组合模式，MUST 使用工具链提供的 `createOperationSequence` 和 `injectFlowContext` 管理序号和上下文注入。**

#### Scenario: 提交层重复注入检测
- GIVEN 提交层准备自动注入 flow_context
- WHEN operationList 中已存在 eventType 为 'flow_context' 的事件
- THEN 提交层 SHALL 跳过注入，不重复添加 flow_context 事件
- AND 提交层 SHALL 使用与 shouldInjectFlowContext 相同的检测逻辑
- 此机制确保全托管模式和灵活组合模式都不会产生重复的 flow_context 事件

---

## Cross-References

- `openspec/specs/data-format/spec.md`：MarkObject 与 Operation 字段格式（第23行 targetElement 前缀规则）
- `openspec/specs/assessment-core/spec.md`：页面提交顺序、进入/退出事件
- `docs/子模块数据规范1205.md`：第10章 操作管理 Utility 使用指南
- `src/shared/types/flow.ts`：FlowContextValue 类型定义（需同步更新）
- `src/shared/services/submission/submoduleAdapter/constants.ts`：保留元素集合与判断函数
