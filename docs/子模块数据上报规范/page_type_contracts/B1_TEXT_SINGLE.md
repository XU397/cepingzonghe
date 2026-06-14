---
title: page_type_contract B1_TEXT_SINGLE
type: documentation
status: draft
source: design
last_verified: 2026-06-14
contract_id: page_type_contract
page_type: B1_TEXT_SINGLE
canonical_source: cp-code
version: v2.2
standard_page_ids:
  - page_02_question_generation
---

# page_type_contract: B1_TEXT_SINGLE

## 页面族

单输入文本生成页。学生看材料（聊天/对话/资料）、构思问题、在单个文本框输入/修正、提交或补救。

## 字段角色（field_role）

| field_id | field_role | required | group_id | text_product_role | 说明 |
|----------|-----------|----------|----------|-------------------|------|
| `input_question_1` | `text_input` | true | `question_generation` | `science_question` | 单个文本输入框，承载学生生成的科学问题 |

来源：`field_registry.v2.2.json` → `page_02_question_generation.fields`。`text_product_role: science_question` 表达结构角色，不绑定主题（banana/honey 主题内容进入文案与 content_registry）。

## 必采 L2 事件

| 事件 | 说明 |
|------|------|
| `START_PAGE` | `initial_visible_content_ids` 声明默认可见的聊天气泡/指令文本（如 banana Page02 的 `instruction_text_02_01` + 首个 `chat_bubble_02_01`）。 |
| `TEXT_FOCUS` | 学生聚焦 `input_question_1` 文本框。`focusDebounceMs`(300) 去抖。 |
| `TEXT_CHANGE` | 文本变更，`textDebounceMs`(2000) 去抖 + `textThrottleCharDelta`(10) 节流；`value_after` 默认留空（不逐字上报）。 |
| `TEXT_BLUR` | 失焦时保存最终文本边界；`textBlurMinChar`(1) 为有效证据下限。 |
| `SUBMIT_ATTEMPT` | 提交触发；若 `validation_status: blocked`（如空文本），后续 `PAGE_IDLE` 进入 `after_blocked_submit` 阶段。 |
| `PAGE_IDLE` | 见 A1_FLOW；B1 页常出现 `initial_before_first_action`（看材料后才输入）和 `after_blocked_submit`（空提交后补救）。 |
| `CHAT_SCROLL` / `CONTENT_EXPOSE` | 聊天区/资料卡滚动与内容曝光；banana Page02 对应 `chat_bubble_02_*` 系列。 |

## 可选 L2 事件

| 事件 | 适用场景 |
|------|---------|
| `CHAT_VIEWPORT_ENTER` / `CHAT_VIEWPORT_LEAVE` | 聊天气泡进入/离开视口（若有视口观测需求）。 |
| `CONTENT_ACTIVATE` | 学生主动展开/激活某内容块（非默认揭示）。 |
| `PAGE_HIDDEN` / `PAGE_VISIBLE` | 通用条件上报。 |

## registry 约束

- `field_registry`：`required_fields: ["input_question_1"]`；`field_role` 必须为 `text_input`。
- `content_registry`：聊天气泡、指令文本必须注册 `content_id`，并标注 `is_key_evidence` / `evidence_role`（如 `context_opening` / `phenomenon_observation` / `problem_trigger` / `variable_hint` / `investigation_prompt` / `task_instruction`）。
- 默认可见内容 `auto_reveal_is_passive: true`——前端不把"默认可见"当主动阅读证据。

## 验收模式

- acceptance case 应覆盖：`START_PAGE` → `CHAT_SCROLL`/`CONTENT_EXPOSE`（看材料）→ `TEXT_FOCUS` → `TEXT_CHANGE` → `TEXT_BLUR` → `SUBMIT_ATTEMPT`。
- 应有空提交补救路径 case（`validation_status: blocked` → `PAGE_IDLE(after_blocked_submit)` → 重新输入 → 通过）。
- 文本事件不逐字；`TEXT_BLUR` 保存最终文本边界。

## 实例页

- Page02 `page_02_question_generation`：banana 实例含 5 个聊天气泡 + 1 个指令文本 + `input_question_1`。
