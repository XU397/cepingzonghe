---
title: page_10_experiment_question_2 confirmation
type: page_instance_confirmation
status: approved
last_verified: 2026-06-14
module_id: g8-banana-browning-experiment
page_index: 10
page_type: D2_SIMULATION_QUESTION
variance_level: V0
---

```yaml
page_confirmation:
  module_id: g8-banana-browning-experiment
  page_index: 10
  standard_page_id: page_10_experiment_question_2
  legacy_page_id: simulation_question_2
  page_number: "11"
  pageDesc: 模拟实验 + 问题2

  page_type: D2_SIMULATION_QUESTION
  page_type_contract_ref: ../../../子模块数据上报规范/page_type_contracts/D2_SIMULATION_QUESTION.md

  l0_page_facts:
    content_items: []
    fields: [question_2_answer]
    controls: [exp_panel, single_choice]
    default_visible_content_ids: []
    active_triggers: [set_exp_param, execute_exp, select_answer, submit]

  registry_mapping:
    field_ids: [question_2_answer]
    content_ids: []
    option_ids: [option_a, option_b]
    param_ids: [exp_param_days]
    row_ids: []
    questions:
      Q6: { question_id: question_2, field_id: question_2_answer, options: {A: option_a, B: option_b} }

  variance_report:
    level: V0
    items: []
    impact: no variance
    requires_user_decision: false

  acceptance_expectations:
    - 同 page_09 三种路径
    - SELECT_ANSWER(question_2, option_*)；每页只当前题
    - SUBMIT_ATTEMPT；question_2_answer 必填校验
    - 参考 [page10_experiment_question.json](../../../子模块数据上报规范/engineering_contracts/acceptance_cases/page10_experiment_question.json)

  user_confirmation_status: approved
  confirmed_at: 2026-06-14
  notes: Q6 常温储存品种，2 选项。
```
