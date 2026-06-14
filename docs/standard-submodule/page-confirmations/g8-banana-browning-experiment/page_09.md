---
title: page_09_experiment_question_1 confirmation
type: page_instance_confirmation
status: approved
last_verified: 2026-06-14
module_id: g8-banana-browning-experiment
page_index: 9
page_type: D2_SIMULATION_QUESTION
variance_level: V0
---

```yaml
page_confirmation:
  module_id: g8-banana-browning-experiment
  page_index: 9
  standard_page_id: page_09_experiment_question_1
  legacy_page_id: simulation_question_1
  page_number: "10"
  pageDesc: 模拟实验 + 问题1

  page_type: D2_SIMULATION_QUESTION
  page_type_contract_ref: ../../../子模块数据上报规范/page_type_contracts/D2_SIMULATION_QUESTION.md

  l0_page_facts:
    content_items: []
    fields: [question_1_answer]
    controls: [exp_panel, single_choice]
    default_visible_content_ids: []
    active_triggers: [set_exp_param, execute_exp, select_answer, submit]

  registry_mapping:
    field_ids: [question_1_answer]
    content_ids: []
    option_ids: [option_a, option_b, option_c, option_d, option_e]
    param_ids: [exp_param_days]
    row_ids: []
    questions:
      Q5: { question_id: question_1, field_id: question_1_answer, options: {A: option_a, B: option_b, C: option_c, D: option_d, E: option_e} }

  variance_report:
    level: V0
    items: []
    impact: no variance
    requires_user_decision: false

  acceptance_expectations:
    - 先实验后作答 / 先作答再回实验 / 选择修正 三种路径
    - SELECT_ANSWER(question_1, option_*)；每页只当前题
    - SUBMIT_ATTEMPT；question_1_answer 必填校验
    - 参考 [page09_experiment_question.json](../../../子模块数据上报规范/engineering_contracts/acceptance_cases/page09_experiment_question.json)

  user_confirmation_status: approved
  confirmed_at: 2026-06-14
  notes: Q5 海南香蕉变黑时间，5 选项。
```
