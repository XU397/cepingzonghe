---
title: page_08_simulation_explore confirmation
type: page_instance_confirmation
status: approved
last_verified: 2026-06-14
module_id: g8-banana-browning-experiment
page_index: 8
page_type: D1_SIMULATION_ONLY
variance_level: V0
---

```yaml
page_confirmation:
  module_id: g8-banana-browning-experiment
  page_index: 8
  standard_page_id: page_08_simulation_explore
  legacy_page_id: banana_browning_simulation_main
  page_number: "9"
  pageDesc: 香蕉变黑：模拟实验（主界面）

  page_type: D1_SIMULATION_ONLY
  page_type_contract_ref: ../../../子模块数据上报规范/page_type_contracts/D1_SIMULATION_ONLY.md

  l0_page_facts:
    content_items: []
    fields: []
    controls: [exp_panel]
    default_visible_content_ids: []
    active_triggers: [set_exp_param, execute_exp, reset_exp, click_next]

  registry_mapping:
    field_ids: []
    content_ids: []
    option_ids: []
    param_ids: [exp_param_days]
    row_ids: []

  variance_report:
    level: V0
    items: []
    impact: no variance
    requires_user_decision: false

  acceptance_expectations:
    - START_PAGE
    - SET_EXP_PARAM(days) → EXECUTE_EXP(exp_run_id) → 可选 RESET_EXP
    - 允许无实验直接下一页（SUBMIT_ATTEMPT passed）
    - 禁止 SELECT_ANSWER（D1 无选择题）
    - 参考 [page08_direct_skip.json](../../../子模块数据上报规范/engineering_contracts/acceptance_cases/page08_direct_skip.json)
    - usePriorExp=true：实验结果可被 Page09-11 消费

  user_confirmation_status: approved
  confirmed_at: 2026-06-14
  notes: 纯模拟实验页，参数 days。允许直接跳过。
```
