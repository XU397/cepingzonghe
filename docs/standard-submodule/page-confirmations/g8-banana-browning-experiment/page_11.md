---
title: page_11_experiment_question_3 confirmation
type: page_instance_confirmation
status: approved
last_verified: 2026-06-14
module_id: g8-banana-browning-experiment
page_index: 11
page_type: D2_SIMULATION_QUESTION
variance_level: V0
---

```yaml
page_confirmation:
  module_id: g8-banana-browning-experiment
  page_index: 11
  standard_page_id: page_11_experiment_question_3
  legacy_page_id: simulation_question_3
  page_number: "12"
  pageDesc: 模拟实验 + 问题3

  page_type: D2_SIMULATION_QUESTION
  page_type_contract_ref: ../../../子模块数据上报规范/page_type_contracts/D2_SIMULATION_QUESTION.md

  l0_page_facts:
    content_items: []
    fields: [question_3_answer]
    controls: [exp_panel, single_choice]
    default_visible_content_ids: []
    active_triggers: [set_exp_param, execute_exp, select_answer, submit]

  registry_mapping:
    field_ids: [question_3_answer]
    content_ids: []
    option_ids: [option_a, option_b, option_c]
    param_ids: [exp_param_days]
    row_ids: []
    questions:
      Q7: { question_id: question_3, field_id: question_3_answer, options: {A: option_a, B: option_b, C: option_c} }

  variance_report:
    level: V0
    items: []
    impact: no variance
    requires_user_decision: false

  acceptance_expectations:
    - 同 page_09 三种路径
    - SELECT_ANSWER(question_3, option_*)；每页只当前题
    - 三题题组结束边界
    - SUBMIT_ATTEMPT；question_3_answer 必填校验
    - 参考 [page11_experiment_question.json](../../../子模块数据上报规范/engineering_contracts/acceptance_cases/page11_experiment_question.json)

  user_confirmation_status: approved
  confirmed_at: 2026-06-14
  notes: Q7 平缓温度，3 选项。三题题组结束。
```
