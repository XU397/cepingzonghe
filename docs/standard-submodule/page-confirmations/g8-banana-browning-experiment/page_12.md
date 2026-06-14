---
title: page_12_solution_selection confirmation
type: page_instance_confirmation
status: approved
last_verified: 2026-06-14
module_id: g8-banana-browning-experiment
page_index: 12
page_type: E1_CHART_PLAN_DECISION
variance_level: V0
---

```yaml
page_confirmation:
  module_id: g8-banana-browning-experiment
  page_index: 12
  standard_page_id: page_12_solution_selection
  legacy_page_id: solution_selection
  page_number: "13"
  pageDesc: 方案选择

  page_type: E1_CHART_PLAN_DECISION
  page_type_contract_ref: ../../../子模块数据上报规范/page_type_contracts/E1_CHART_PLAN_DECISION.md

  l0_page_facts:
    content_items: [chart_note_12_01, solution_selection_instruction]
    fields: [chart_evidence_1, plan_table, reason_text]
    controls: [chart, dynamic_table, text_input]
    default_visible_content_ids: []
    active_triggers: [chart_hover, add_row, delete_row, set_plan_param, focus, text_change, blur, select_best, submit]

  registry_mapping:
    field_ids: [chart_evidence_1, plan_table, reason_text]
    content_ids: [chart_note_12_01, solution_selection_instruction]
    option_ids: []
    param_ids: [plan_param_1, plan_param_2]
    row_ids: []  # 运行时动态生成，无静态值
    param_slots:
      plan_param_1: { display: 品种 }
      plan_param_2: { display: 温度 }

  variance_report:
    level: V0
    items: []
    impact: no variance
    requires_user_decision: false

  acceptance_expectations:
    - CHART_HOVER(chart_evidence_1, hover_ms≥500, data_snapshot)
    - ADD_ROW / DELETE_ROW on plan_table，row_id 唯一
    - SET_PLAN_PARAM(plan_param_1/2)
    - reason_text 的 TEXT_FOCUS → TEXT_CHANGE → TEXT_BLUR
    - SELECT_BEST
    - SUBMIT_ATTEMPT；plan_table + reason_text 必填校验
    - 参考 [page12_solution_selection.json](../../../子模块数据上报规范/engineering_contracts/acceptance_cases/page12_solution_selection.json)

  user_confirmation_status: approved
  confirmed_at: 2026-06-14
  notes: 图表证据 + 方案表 + 理由。主题词（品种/温度）只在 param display_name。
```
