---
title: page_type_contract B2_TEXT_MULTI_PARALLEL
type: documentation
status: draft
source: design
last_verified: 2026-06-14
contract_id: page_type_contract
page_type: B2_TEXT_MULTI_PARALLEL
canonical_source: cp-code
version: v2.2
standard_page_ids:
  - page_05_plan_generation
---

# page_type_contract: B2_TEXT_MULTI_PARALLEL

## 页面族

多输入框并行方案生成页。学生在 N 个并行文本框（banana 为 3 个）中分别填写方案/想法，支持跨框切换、补填、修改。

> **命名说明**：本类型 canonical 名为 `B2_TEXT_MULTI_PARALLEL`（见 `mapping.ts` 与 `event_schema.v2.2.json`）。KB 草案 §4 的 `B2_TEXT_MULTI` 为简写笔误，待 KB 修订。

## 字段角色（field_role）

| field_id | field_role | required | group_id | field_index | text_product_role |
|----------|-----------|----------|----------|-------------|-------------------|
| `input_idea_1` | `text_input` | true | `plan_ideas` | 1 | `plan_idea` |
| `input_idea_2` | `text_input` | true | `plan_ideas` | 2 | `plan_idea` |
| `input_idea_3` | `text_input` | true | `plan_ideas` | 3 | `plan_idea` |

来源：`field_registry.v2.2.json` → `page_05_plan_generation.fields`。`field_index` 表达槽位顺序，`text_product_role: plan_idea` 表达结构角色。

**V2 差异提示**：若某模块的方案生成页有不同数量的输入框（如蜂蜜黏度需要 4 个想法），属于 V2 结构差异，需扩展 field_registry 后才能实施。

## 必采 L2 事件

| 事件 | 说明 |
|------|------|
| `START_PAGE` | 初始可见内容（如 `plan_generation_instruction`）。 |
| `TEXT_FOCUS` | 每个 `input_idea_N` 独立 focus 事件。 |
| `TEXT_CHANGE` | 去抖 + 节流；`value_after` 默认留空。 |
| `TEXT_BLUR` | 每个框失焦时保存最终文本边界。 |
| `SUBMIT_ATTEMPT` | 提交；`required` 字段未填则 `validation_status: blocked`。 |
| `PAGE_IDLE` | 跨框切换间隙、初始构思等待。 |

**关键**：跨框切换必须在 metadata 体现 `field_id` 变化，便于下游分析跨框行为序列。

## 可选 L2 事件

| 事件 | 适用场景 |
|------|---------|
| `CONTENT_EXPOSE` / `CONTENT_ACTIVATE` | 指令文本或提示卡片曝光/激活。 |
| `PAGE_HIDDEN` / `PAGE_VISIBLE` | 通用。 |

## registry 约束

- `field_registry`：`required_fields` 必须覆盖所有 `input_idea_*`；每个字段 `field_role: text_input` + `group_id: plan_ideas` + `field_index`。
- `content_registry`：指令文本（如 `plan_generation_instruction`，`evidence_role: measurement_metric_guidance`）必须注册。

## 验收模式

- acceptance case 应覆盖：跨框切换序列（如 idea1→idea2→idea1 修正）、补填路径（先空后补）、空提交补救。
- 验证每个框的 `TEXT_FOCUS`/`TEXT_CHANGE`/`TEXT_BLUR` 三元组完整。

## 实例页

- Page05 `page_05_plan_generation`：banana 实例含 3 个并行输入框 + `plan_generation_instruction`。
