---
title: page_type_contract C1_INFO_SELECTION
type: documentation
status: draft
source: design
last_verified: 2026-06-14
contract_id: page_type_contract
page_type: C1_INFO_SELECTION
canonical_source: cp-code
version: v2.2
standard_page_ids:
  - page_03_factor_selection
---

# page_type_contract: C1_INFO_SELECTION

## 页面族

资料卡 + 多选判断页。学生查看若干资料卡（banana 为 5 张），勾选/取消影响因子选项。

## 字段角色（field_role）

| field_id | field_role | required | group_id | selection_mode | options |
|----------|-----------|----------|----------|----------------|---------|
| `factor_selection` | `checkbox_group` | true | `factor_selection` | `multi_select` | `option_a/b/c/d/...` |

来源：`field_registry.v2.2.json` → `page_03_factor_selection`。每个 option 有 `option_index` + `option_role: candidate_factor`。

**questions 结构**：`factor_selection` 同时是 `question_id`，`answer_field_id: factor_selection`。

## 必采 L2 事件

| 事件 | 说明 |
|------|------|
| `START_PAGE` | 初始可见资料卡 ID。 |
| `OPEN_MODAL` / `CLOSE_MODAL` | 资料卡详情弹窗开关；`modalMisclickMaxMs`(300) 抑制误点。 |
| `CHECKBOX_TOGGLE` | 选项勾选/取消；metadata 带 `option_id` + 勾选状态。 |
| `SUBMIT_ATTEMPT` | 提交；多选校验。 |
| `PAGE_IDLE` | 看资料卡期间、选择犹豫期间。 |

## 可选 L2 事件

| 事件 | 适用场景 |
|------|---------|
| `CONTENT_EXPOSE` / `CONTENT_ACTIVATE` | 资料卡曝光/主动激活（`minMeaningfulDwellMs`(800) 为有效查看下限）。 |
| `PAGE_HIDDEN` / `PAGE_VISIBLE` | 通用。 |

## registry 约束

- `field_registry`：`factor_selection` 字段 + `options`（每个 `option_*` 有 `option_index` + `option_role`）。`required: true`。
- `content_registry`：资料卡（`factor_card_*`，`evidence_role: factor_*_context`）必须注册。

## 验收模式

- acceptance case 应覆盖：勾选→取消→重选的修正序列、空提交补救、资料卡查看与选择的关联。
- 验证 `CHECKBOX_TOGGLE` 的 `option_id` 与 field_registry options 一致。

## 实例页

- Page03 `page_03_factor_selection`：banana 实例含 5 张资料卡 + `factor_selection` 多选（4 选项）。

**V2 差异提示**：若某模块的选项数量或资料卡数量与 banana 不同，属 V2 结构差异。
