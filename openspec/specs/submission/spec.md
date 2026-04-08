# 提交工具规格（Submission Spec）

## Purpose
本规格定义统一的页面提交 Hook 与其配套工具（事件枚举、MarkObject 工具）的行为，确保所有交互模块与 `openspec/specs/assessment-core/spec.md` 中的“每次下一页前提交”要求保持一致，并与 `openspec/specs/data-format/spec.md` 的数据结构完全对齐。
## Requirements
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

### Requirement: 标准事件集合与数据格式一致性
`usePageSubmission` SHALL 暴露与 Data Format Spec 一致的事件枚举，并负责前缀与上下文注入，不允许绕过枚举或手写前缀。

#### Scenario: 事件枚举与前缀
- THEN 事件枚举 SHALL 覆盖：`page_enter`、`page_exit`、`click`、`change`、`input`、`input_blur`、`input_focus`、`input_change`、`input_delete`、`select_change`、`radio_select`、`checkbox_check`、`checkbox_uncheck`、`modal_open`、`modal_close`、`view_material`、`timer_start`、`timer_stop`、`timer_complete`、`simulation_timing_started`、`simulation_run_result`、`simulation_operation`、`questionnaire_answer`、`flow_context`、`auto_submit`、`next_click`、`page_submit_success`、`page_submit_failed`、`click_blocked`；新增事件 MUST 同步规格与枚举；
- AND Hook SHALL 为所有 `operationList/answerList` 的 `targetElement` 添加 `P${pageNumber}_...` 前缀，并使用 `<submoduleIndex>.<pageIndexTwoDigits>` 页码编码（`submoduleIndex = stepIndex + 1`，两位零填充）。

#### Scenario: Flow 上下文与缺失项记录
- THEN Hook SHALL 自动注入一次 `flow_context`（含 `flowId/stepIndex/submoduleId/moduleName/pageId?`），缺失 Flow 信息时记录日志但不阻断其他操作；
- AND 在校验阻断或禁用点击时 MUST 记录 `click_blocked` 事件，`value.missing` 列表标识未满足的字段或前置条件。

#### Scenario: 提交结果事件
- WHEN `submit()` 完成且准备导航
- THEN MUST 追加 `page_submit_success`（含耗时/通道信息若可用）；
- WHEN 重试后仍失败或遇到不可恢复错误
- THEN MUST 追加 `page_submit_failed`，`value` 携带最后错误摘要，保持与 Assessment Core 错误处理对齐。

### Requirement: 行为埋点包装组件
提交工具链 SHALL 提供输入/选择/按钮等包装组件,自动生成标准事件与前缀,减少手写遗漏。
#### Scenario: 组件输出一致性
- THEN 输入类包装组件 SHALL 自动输出 focus/change/delete/blur 事件,value 采用快照或 `{ prev, next }`,删除可使用 `{ action: 'delete', prevLength, nextLength }`;选择类包装组件 SHALL 输出 select_change/checkbox_* 等事件并附当前选中值;按钮包装组件 SHALL 输出 click/next_click 并在阻断时生成 click_blocked。

### Requirement: 提交守卫与唯一入口约束
工具链 MUST 阻断绕过统一 Hook 或使用旧格式的提交路径，确保 DEV 仅按新规范实现。

#### Scenario: CI/Lint 阻断绕行
- WHEN 执行 CI/Lint
- THEN 工具链 SHALL 禁止直接 `fetch /stu/saveHcMark`、禁止手写 `pageNumber` 为 `M*`/冒号格式/`0.*` 前缀或自造 `targetElement` 前缀、禁止跳过 `usePageSubmission`；违反时 CI MUST 失败；
- AND 校验 `pageNumber` 格式 MUST 满足正则 `^[1-9]\d*\.\d{2}$`，不符合则阻断。

### Requirement: 最小事件集合守卫
构建/测试/Lint MUST 检查页面是否具备最小必要事件与前缀,防止漏埋点。
#### Scenario: 守卫规则
- THEN 校验 SHALL 确认每页存在 `page_enter`、`page_exit`、`next_click`(或等效 next 操作)、阻断时的 `click_blocked`(含 missing 列表),以及输入/选择类的 focus/change/delete/blur 或 select_change 事件;目标元素前缀 `P${pageNumber}_...` 必须符合规范;缺失时构建/CI MUST 失败。

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

#### Scenario: g8-mikania-experiment 迁移至灵活组合模式
- GIVEN g8-mikania-experiment 子模块当前自实现操作序号管理（Component.jsx:221-259）
- WHEN 迁移至灵活组合模式
- THEN 子模块 SHALL 使用 `createOperationSequence` 管理操作序号
- AND 子模块 SHALL 在 action creator 层调用 `sequence.next()` 生成 code
- AND 子模块 SHALL 在 SET_PAGE dispatch 前调用 `sequence.reset()` 重置序号
- AND 子模块 SHALL 移除 Reducer state 中的 `operationSequence` 字段
- AND 子模块 SHALL 移除 buildMark 中的备用 flow_context 注入逻辑

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

#### Scenario: g8-mikania-experiment 保留元素合规
- GIVEN g8-mikania-experiment 页面组件当前为保留元素添加了前缀（Page00_Notice.jsx:30-31）
- WHEN 修复保留元素前缀问题
- THEN 页面组件 SHALL 使用 `isReservedElement` 函数判断元素是否为保留元素
- AND page_enter / page_exit 事件的 targetElement SHALL 为 `页面`（无前缀）
- AND flow_context 事件的 targetElement SHALL 为 `flow_context`（无前缀）
- AND 业务元素 SHALL 保持 `P${pageNumber}_` 前缀

---

### Requirement: MarkObject 输出字段顺序
提交适配层（usePageSubmission / createMarkObject / PageFrame 提交管道）SHALL 在序列化 MarkObject 时按固定顺序输出字段，以便审计与外部工具读取。

#### Scenario: 固定字段排序
- GIVEN 需要输出或提交 MarkObject
- WHEN 进行序列化或构建提交 payload
- THEN 字段顺序 SHALL 按以下顺序输出：`pageNumber`，`pageDesc`，`operationList`，`answerList`，`beginTime`，`endTime`，`imgList`

#### Scenario: 字段全量输出
- GIVEN 需要输出 MarkObject
- THEN 所有字段 SHALL 始终存在（`imgList` 等空集合也需输出为空数组），并按上述顺序排列

#### Scenario: 统一责任归属
- GIVEN 需要满足字段排序规范
- WHEN 使用统一提交管道（usePageSubmission/PageFrame/createMarkObject）
- THEN 排序责任 SHALL 由共享提交/控制层统一处理
- AND 子模块/页面实现 SHALL NOT 手工重新排序字段

#### Scenario: 适用范围
- GIVEN 任何 MarkObject 序列化场景
- THEN 排序与全量输出规范 SHALL 适用于提交 payload、日志输出、快照/调试导出等所有落盘或传输的 MarkObject 表达

## Cross-References
- `openspec/specs/data-format/spec.md`：MarkObject 与 Operation 字段格式、标准事件集合。
- `openspec/specs/assessment-core/spec.md`：页面提交顺序、进入/退出事件与 Flow 运行术语。
