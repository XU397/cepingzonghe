---
title: page_05_plan_generation confirmation
type: page_instance_confirmation
status: approved
last_verified: 2026-06-14
module_id: g8-banana-browning-experiment
page_index: 5
page_type: B2_TEXT_MULTI_PARALLEL
variance_level: V0
---

```yaml
page_confirmation:
  module_id: g8-banana-browning-experiment
  page_index: 5
  standard_page_id: page_05_plan_generation
  legacy_page_id: banana_browning_design
  page_number: "6"
  pageDesc: 香蕉变黑：方案设计

  page_type: B2_TEXT_MULTI_PARALLEL
  page_type_contract_ref: ../../../子模块数据上报规范/page_type_contracts/B2_TEXT_MULTI_PARALLEL.md

  l0_page_facts:
    content_items: [plan_generation_instruction]
    fields: [input_idea_1, input_idea_2, input_idea_3]
    controls: [text_input, text_input, text_input]
    default_visible_content_ids: [plan_generation_instruction]
    active_triggers: [focus, text_change, blur, submit]

  registry_mapping:
    field_ids: [input_idea_1, input_idea_2, input_idea_3]
    content_ids: [plan_generation_instruction]
    option_ids: []
    param_ids: []
    row_ids: []

  variance_report:
    level: V0
    items: []
    impact: no variance
    requires_user_decision: false

  acceptance_expectations:
    - START_PAGE(initial_visible=[plan_generation_instruction])
    - 每个框 TEXT_FOCUS → TEXT_CHANGE → TEXT_BLUR
    - 跨框切换 metadata 带 field_id 变化
    - SUBMIT_ATTEMPT；3 必填字段校验 + 空提交补救
    - 参考 [page05_multi_idea_generation.json](../../../子模块数据上报规范/engineering_contracts/acceptance_cases/page05_multi_idea_generation.json)

  user_confirmation_status: approved
  confirmed_at: 2026-06-14
  notes: 3 并行输入框方案生成页。
```
