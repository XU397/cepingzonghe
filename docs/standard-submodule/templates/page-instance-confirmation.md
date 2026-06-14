---
title: page_instance_confirmation template
type: template
status: draft
source: design
last_verified: 2026-06-14
standard_id: science-inquiry-13page-trace-contract
contract_version: v2.2
---

# Page Instance Confirmation Template（第二层：实例级确认包）

> 本模板是 [`page_type_contract`](../../子模块数据上报规范/page_type_contracts/) 的**实例绑定与审计证据**，不是重复定义类型级标准。
>
> 每页代码实施前必须拥有一份 `user_confirmation_status: approved` 的确认包。未 approved 的页面不得进入代码实现。

## 使用方式

为科学探究 13 页同构模块的每一页复制本模板，填入实际页面事实。产物路径：`docs/standard-submodule/page-confirmations/<moduleId>/page_NN.md`。

V0/V1 页可简化差异详情（variance_report.items 可为空或仅列主题替换），**但仍必须逐页填写基础字段与 registry_mapping**（content/field/option/param 映射不可省略，对齐 spec Requirement 2 最低记录要求）；V2/V3 页必须展开 §差异详情。

## 模板正文

```yaml
page_confirmation:
  module_id: <子模块 ID，如 g8-banana-browning-experiment / honey-viscosity / steamed-bun>
  page_index: <1-13>
  standard_page_id: <代码 canonical，如 page_02_question_generation>
  legacy_page_id: <遗留 pageId，如 banana_mystery；无则留空>
  page_number: <复合页码，如 2.03>
  pageDesc: <页面描述，如 香蕉的奥秘>

  # 第一层绑定
  page_type: <8 种之一：A1_FLOW / B1_TEXT_SINGLE / B2_TEXT_MULTI_PARALLEL / B3_TEXT_MATRIX_EVALUATION / C1_INFO_SELECTION / D1_SIMULATION_ONLY / D2_SIMULATION_QUESTION / E1_CHART_PLAN_DECISION>
  page_type_contract_ref: <指向 page_type_contracts/<TYPE>.md 的相对链接>

  # L0 页面事实（实际页面）
  l0_page_facts:
    content_items: [<content_id 列表，对齐 content_registry>]
    fields: [<field_id 列表，对齐 field_registry>]
    controls: [<控件列表：text_input / checkbox_group / single_choice / chart / dynamic_table / exp_panel 等>]
    default_visible_content_ids: [<默认可见 content_id>]
    active_triggers: [<主动触发列表：click / scroll / hover / focus / exp_run 等>]

  # registry 映射（实际绑定）
  registry_mapping:
    field_ids: [<field_id，必须存在于 field_registry>]
    content_ids: [<content_id，必须存在于 content_registry>]
    option_ids: [<option_id>]
    param_ids: [<param_id，如 exp_param_days / plan_param_1>]
    row_ids: [<row_id，E1 方案表>]

  # 第二层：差异审计
  variance_report:
    level: <V0 | V1 | V2 | V3>
    items: [<差异项列表；V0 为空数组 []>]
    impact: <影响说明；V0 写 no variance>
    requires_user_decision: <true | false；V0/V1 通常 false，V2/V3 通常 true>

  # V1 主题替换（仅 level=V1 时填）
  theme_substitutions: [<{ standard_content: <标准内容>, module_content: <本模块内容> }>]
  # 或引用 content_registry 映射：content_registry_ref: <相对链接>

  # 验收预期
  acceptance_expectations:
    - <预期事件序列要点，引用 page-type-event-matrix 的 R 单元格>
    - <特殊路径，如 空提交补救 / 直接跳过>

  # 用户确认状态
  user_confirmation_status: <pending | approved | rejected | needs_revision>
  confirmed_at: <ISO 8601，approved 时填>
  confirmed_by: <确认人>
  notes: <可选备注>
```

## 差异分级填写指引

### V0（无差异）

页面拓扑、字段数量、事件、验收与 page_type_contract 完全一致，只替换主题内容。`variance_report.level: V0`，`items: []`，`impact: no variance`。可批量审核但仍需逐页填基础字段与 registry_mapping（不可省略）。

### V1（主题配置差异）

蜂蜜/馒头替换香蕉内容，选项文案或图表数据不同，但**结构槽位不变**（字段数、选项数、参数数一致）。用 `theme_substitutions` 或 `content_registry_ref` 表达，**不展开完整字段差异**。可批量审核。

### V2（结构差异）

字段数量、选项数量、实验参数数量、页面布局或必填规则变化。**必须单页沟通**，确认扩展 field_registry/profile 后才能实施。必须填 `items`（逐项列差异）+ `impact` + `requires_user_decision: true`。

### V3（标准破坏性差异）

页面数量/顺序改变、事件字典不足、L2/L3 边界改变、需要新 page_type。**必须暂停实施**，先升级 KB 标准或另建需求。`requires_user_decision: true`。

## 注意事项页（不计入 13 页）

独立的注意事项/说明页（如 banana `intro_notice`）**不**使用本模板，不计入 13 页 trace 拓扑，采用 `hidden` 导航模式，不加载子模块计时器。如需记录，在该模块确认包目录单独建 `page_00_notice.md` 标注 `out_of_trace_topology: true`。
