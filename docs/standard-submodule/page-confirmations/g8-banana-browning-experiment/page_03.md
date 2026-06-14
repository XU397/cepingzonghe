---
title: page_03_factor_selection confirmation
type: page_instance_confirmation
status: approved
last_verified: 2026-06-14
module_id: g8-banana-browning-experiment
page_index: 3
page_type: C1_INFO_SELECTION
variance_level: V0
---

```yaml
page_confirmation:
  module_id: g8-banana-browning-experiment
  page_index: 3
  standard_page_id: page_03_factor_selection
  legacy_page_id: banana_browning_reading
  page_number: "4"
  pageDesc: 香蕉变黑：资料阅读

  page_type: C1_INFO_SELECTION
  page_type_contract_ref: ../../../子模块数据上报规范/page_type_contracts/C1_INFO_SELECTION.md

  l0_page_facts:
    content_items: [factor_card_1, factor_card_2, factor_card_3, factor_card_4, factor_card_5]
    fields: [factor_selection]
    controls: [checkbox_group, modal]
    default_visible_content_ids: []
    active_triggers: [open_modal, close_modal, checkbox_toggle, submit]

  registry_mapping:
    field_ids: [factor_selection]
    content_ids: [factor_card_1, factor_card_2, factor_card_3, factor_card_4, factor_card_5]
    option_ids: [option_a, option_b, option_c, option_d]
    param_ids: []
    row_ids: []

  variance_report:
    level: V0
    items: []
    impact: no variance
    requires_user_decision: false

  acceptance_expectations:
    - START_PAGE
    - OPEN_MODAL / CLOSE_MODAL 查看资料卡
    - CHECKBOX_TOGGLE 勾选/取消（含修正序列）
    - SUBMIT_ATTEMPT；空提交补救
    - 参考 [page03_factor_selection.json](../../../子模块数据上报规范/engineering_contracts/acceptance_cases/page03_factor_selection.json)

  user_confirmation_status: approved
  confirmed_at: 2026-06-14
  notes: 5 资料卡 + factor_selection 多选（4 选项）。
```
