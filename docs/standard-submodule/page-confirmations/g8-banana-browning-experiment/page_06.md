---
title: page_06_method_evaluation confirmation
type: page_instance_confirmation
status: approved
last_verified: 2026-06-14
module_id: g8-banana-browning-experiment
page_index: 6
page_type: B3_TEXT_MATRIX_EVALUATION
variance_level: V0
---

```yaml
page_confirmation:
  module_id: g8-banana-browning-experiment
  page_index: 6
  standard_page_id: page_06_method_evaluation
  legacy_page_id: banana_browning_evaluation
  page_number: "7"
  pageDesc: 香蕉变黑：方案评估

  page_type: B3_TEXT_MATRIX_EVALUATION
  page_type_contract_ref: ../../../子模块数据上报规范/page_type_contracts/B3_TEXT_MATRIX_EVALUATION.md

  l0_page_facts:
    content_items: [method_material_1, method_material_2, method_material_3]
    fields:
      [method_1_advantage, method_1_disadvantage, method_2_advantage, method_2_disadvantage, method_3_advantage, method_3_disadvantage]
    controls: [text_input, text_input, text_input, text_input, text_input, text_input]
    default_visible_content_ids: []
    active_triggers: [focus, text_change, blur, submit]

  registry_mapping:
    field_ids:
      [method_1_advantage, method_1_disadvantage, method_2_advantage, method_2_disadvantage, method_3_advantage, method_3_disadvantage]
    content_ids: [method_material_1, method_material_2, method_material_3]
    option_ids: []
    param_ids: []
    row_ids: []
    method_slots:
      method_1: { display: 图像法 }
      method_2: { display: 网格法 }
      method_3: { display: 称重法 }

  variance_report:
    level: V0
    items: []
    impact: no variance
    requires_user_decision: false

  acceptance_expectations:
    - 每个字段 TEXT_FOCUS → TEXT_CHANGE → TEXT_BLUR，metadata 带 method_slot + evaluation_side
    - 跨方法切换序列
    - SUBMIT_ATTEMPT；6 必填字段校验 + 空提交补救
    - 参考 [page06_method_evaluation.json](../../../子模块数据上报规范/engineering_contracts/acceptance_cases/page06_method_evaluation.json)

  user_confirmation_status: approved
  confirmed_at: 2026-06-14
  notes: 3 方法 × 优缺点 = 6 字段 + 3 方法材料。主题词（图像法/网格法/称重法）只在 display_name。
```
