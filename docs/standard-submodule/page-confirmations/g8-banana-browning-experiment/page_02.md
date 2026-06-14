---
title: page_02_question_generation confirmation
type: page_instance_confirmation
status: approved
last_verified: 2026-06-14
module_id: g8-banana-browning-experiment
page_index: 2
page_type: B1_TEXT_SINGLE
variance_level: V0
---

```yaml
page_confirmation:
  module_id: g8-banana-browning-experiment
  page_index: 2
  standard_page_id: page_02_question_generation
  legacy_page_id: banana_mystery
  page_number: "3"
  pageDesc: 香蕉的奥秘

  page_type: B1_TEXT_SINGLE
  page_type_contract_ref: ../../../子模块数据上报规范/page_type_contracts/B1_TEXT_SINGLE.md

  l0_page_facts:
    content_items:
      [chat_bubble_02_01, chat_bubble_02_02, chat_bubble_02_03, chat_bubble_02_04, chat_bubble_02_05, instruction_text_02_01]
    fields: [input_question_1]
    controls: [text_input, chat_scroll_region]
    default_visible_content_ids: [instruction_text_02_01, chat_bubble_02_01]
    active_triggers: [focus, text_change, blur, scroll, submit]

  registry_mapping:
    field_ids: [input_question_1]
    content_ids:
      [chat_bubble_02_01, chat_bubble_02_02, chat_bubble_02_03, chat_bubble_02_04, chat_bubble_02_05, instruction_text_02_01]
    option_ids: []
    param_ids: []
    row_ids: []

  variance_report:
    level: V0
    items: []
    impact: no variance
    requires_user_decision: false

  acceptance_expectations:
    - START_PAGE(initial_visible=[instruction_text_02_01, chat_bubble_02_01])
    - CHAT_SCROLL / CONTENT_EXPOSE 看材料
    - TEXT_FOCUS → TEXT_CHANGE → TEXT_BLUR on input_question_1
    - SUBMIT_ATTEMPT；空提交补救路径 PAGE_IDLE(after_blocked_submit)
    - 参考 [page02_question_generation.json](../../../子模块数据上报规范/engineering_contracts/acceptance_cases/page02_question_generation.json) 与 [page02_page_idle.json](../../../子模块数据上报规范/engineering_contracts/acceptance_cases/page02_page_idle.json)

  user_confirmation_status: approved
  confirmed_at: 2026-06-14
  notes: 单输入文本生成页，5 聊天气泡 + 1 指令文本。
```
