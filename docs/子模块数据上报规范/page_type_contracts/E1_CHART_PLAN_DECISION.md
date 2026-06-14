---
title: page_type_contract E1_CHART_PLAN_DECISION
type: documentation
status: draft
source: design
last_verified: 2026-06-14
contract_id: page_type_contract
page_type: E1_CHART_PLAN_DECISION
canonical_source: cp-code
version: v2.2
standard_page_ids:
  - page_12_solution_selection
---

# page_type_contract: E1_CHART_PLAN_DECISION

## 页面族

图表证据 + 方案表 + 决策页。学生查看图表证据、在动态方案表中填入参数行、选择最佳方案、撰写理由文本。

> **命名说明**：canonical 名 `E1_CHART_PLAN_DECISION`。KB 草案 §4 的 `E1_SOLUTION_SELECTION` 为简写笔误，待 KB 修订。

## 字段角色（field_role）

| field_id | field_role | required | group_id | 说明 |
|----------|-----------|----------|----------|------|
| `chart_evidence_1` | `chart` | false | `solution_evidence` | 图表证据（悬停查看） |
| `plan_table` | `dynamic_table` | true | `solution_plan` | 动态方案表，`row_id_required: true` |
| `reason_text` | `text_input` | true | `solution_reason` | 理由文本，`text_product_role: decision_reason` |

来源：`field_registry.v2.2.json` → `page_12_solution_selection`。

**param_slots**：`plan_param_1`（banana display: 品种）、`plan_param_2`（banana display: 温度）。主题词只在 `display_name_by_module`，不进 field_id/param_id。

## 必采 L2 事件

| 事件 | 说明 |
|------|------|
| `START_PAGE` | 初始可见图表/指令。 |
| `CHART_HOVER` | 悬停图表证据；metadata 带 `chart_id` + `point_id` + `hover_ms`（`chartHoverMinMs`(500) 为有效悬停下限）+ `data_snapshot`。 |
| `ADD_ROW` / `DELETE_ROW` | 方案表增删行；metadata 带 `field_id: plan_table` + `row_id`。 |
| `SET_PLAN_PARAM` | 设置方案参数；metadata 带 `param_id` + `param_name`。 |
| `TEXT_FOCUS` / `TEXT_CHANGE` / `TEXT_BLUR` | `reason_text` 文本边界。 |
| `SELECT_BEST` | 选择最佳方案。 |
| `SUBMIT_ATTEMPT` | 提交；`plan_table` + `reason_text` 必填校验。 |
| `PAGE_IDLE` | 全局必采采集能力（学生空闲时聚合生成，见 page-type-event-matrix 全类型 R）。 |

## 可选 L2 事件

| 事件 | 适用场景 |
|------|---------|
| `CONTENT_EXPOSE` / `CONTENT_ACTIVATE` | 图表说明（`chart_note_12_01`）、指令文本（`solution_selection_instruction`）曝光。 |
| `PAGE_HIDDEN` / `PAGE_VISIBLE` | 通用条件上报（后台/切tab/失焦）。 |

## registry 约束

- `field_registry`：`chart_evidence_1`（chart）+ `plan_table`（dynamic_table，`row_id_required`）+ `reason_text`（text_input）+ `param_slots`。
- `content_registry`：`chart_note_12_01`（`evidence_role: chart_interpretation_hint`）+ `solution_selection_instruction`（`evidence_role: solution_constraint_instruction`）必须注册。

## 验收模式

- acceptance case 应覆盖：图表悬停查看 → 填方案表行 → 设参数 → 选最佳 → 写理由 → 提交。
- 验证 `CHART_HOVER` 的 `hover_ms ≥ 500` + `data_snapshot` 完整。
- 验证 `ADD_ROW`/`DELETE_ROW` 的 `row_id` 唯一性。

## 实例页

- Page12 `page_12_solution_selection`：banana 实例含 chart_evidence_1 + plan_table + reason_text + 2 个 param_slots + 2 个 content_blocks。

**V2 差异提示**：若某模块的方案参数数量、表格行结构或图表类型与 banana 不同，属 V2 结构差异。
