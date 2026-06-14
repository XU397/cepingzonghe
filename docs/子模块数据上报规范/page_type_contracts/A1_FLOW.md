---
title: page_type_contract A1_FLOW
type: documentation
status: draft
source: design
last_verified: 2026-06-14
contract_id: page_type_contract
page_type: A1_FLOW
canonical_source: cp-code
version: v2.2
standard_page_ids:
  - page_01_intro
  - page_04_transition
  - page_07_experiment_intro
  - page_13_task_finish
---

# page_type_contract: A1_FLOW

## 页面族

背景 / 流程 / 阶段过渡 / 结束页。承担任务进入边界、阶段切换边界、任务完成结算边界。**不承载探究行为观测的字段输入**（`required_fields: []`）。

## 字段角色（field_role）

`A1_FLOW` 页面**无必填字段**（`field_registry.v2.2.json` 中 Page01/04/07/13 的 `required_fields: []`，`fields: {}`）。页面事实由内容块（content_blocks）和初始可见性承载，不绑定输入字段。

## 必采 L2 事件

| 事件 | 说明 |
|------|------|
| `START_PAGE` | 页面渲染完成且学生可交互；`value.metadata` 必须携带 7 个 canonical literal（schema/field_registry/content_registry/rule_config 的 version+hash）+ `page_index` + `legacy_page_id`。初始可见内容 ID 在 `initial_visible_content_ids` 声明（若该页有内容块）。 |
| `PAGE_IDLE` | 仅在页面可见、窗口聚焦、无有效交互超过 `pageIdleThresholdMs`(5000) 时由前端聚合生成。三阶段：`initial_before_first_action` / `after_blocked_submit` / `between_effective_events`。禁止轮询、逐秒上报、mousemove。 |
| `SUBMIT_ATTEMPT` | 点击下一页/提交/自动提交触发；必须含 `submit_attempt_id` + `validation_status` + `submit_trigger`。A1_FLOW 页通常 `validation_status: passed`（无字段校验）。 |

**特殊**：Page13（`page_13_task_finish`）用 `TASK_FINISH` 替代/伴随 `SUBMIT_ATTEMPT` 作为任务结束边界。`TASK_FINISH` 只用于任务结束页生命周期，不直接作为 L3 探究行为标签。

## 可选 L2 事件

| 事件 | 适用场景 |
|------|---------|
| `PAGE_HIDDEN` / `PAGE_VISIBLE` | 页面后台、切 tab、窗口失焦或恢复时条件上报（与 page-type-event-matrix 全类型 O 一致）。 |
| `CONTENT_EXPOSE` | 仅当该过渡页有动态揭示的内容块（非默认可见）时上报。默认可见内容**不**重复生成主动 `CONTENT_EXPOSE`。 |
| `CHAT_SCROLL` | 仅当该页含聊天区/资料卡滚动区时。 |
| `TIMER_COMPLETE` | 仅当计时器到时触发跳转（通常对应超时策略）。 |

## registry 约束

- `field_registry`：`A1_FLOW` 页 `required_fields` 必须为 `[]`；若实际页面有字段，则**不是 A1_FLOW**，应归入对应输入型 page_type（V2/V3 差异）。
- `content_registry`：A1_FLOW 页若有内容块（如背景说明、过渡提示），必须在 content_registry 注册 `content_id`；前端只引用 ID，不重复全文。
- `START_PAGE.metadata` 必须声明 field/content registry version/hash，即使该页无字段。

## 验收模式

- A1_FLOW 页的 acceptance case 应至少覆盖：`START_PAGE` →（`PAGE_IDLE` 按全局规则采集，满足 idle 条件才出现，见 page-type-event-matrix 全局说明）→ `SUBMIT_ATTEMPT`/`TASK_FINISH` 生命周期闭环。
- 不应有 `TEXT_FOCUS` / `SELECT_ANSWER` / `EXECUTE_EXP` 等输入/实验事件（若出现说明 page_type 归属错误）。
- Page13 结束页 acceptance 重点验证 `TASK_FINISH` 触发与 trace flush。

## 实例页

- Page01 `page_01_intro`：任务进入边界。
- Page04 `page_04_transition`：方案设计阶段边界。
- Page07 `page_07_experiment_intro`：实验阶段边界。
- Page13 `page_13_task_finish`：任务完成结算边界（用 `TASK_FINISH`）。
