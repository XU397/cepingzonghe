# Spec Delta: 提交工具规格（Submission）- g8-mikania 合规性迁移

## 变更类型
本变更为 **合规性迁移**，将 g8-mikania-experiment 子模块迁移至符合现有 submission spec 的实现。

---

## MODIFIED Requirements

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

## Cross-References

- `openspec/specs/submission/spec.md`：子模块接入模式选择（第 135-149 行）
- `openspec/specs/submission/spec.md`：targetElement 前缀规则 - 保留元素例外（第 151-171 行）
- `docs/子模块数据规范1205.md`：第 10 节操作管理 Utility
- `src/submodules/g8-mikania-experiment/Component.jsx`：待迁移代码
