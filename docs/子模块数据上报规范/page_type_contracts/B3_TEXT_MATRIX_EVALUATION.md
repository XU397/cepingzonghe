---
title: page_type_contract B3_TEXT_MATRIX_EVALUATION
type: documentation
status: draft
source: design
last_verified: 2026-06-14
contract_id: page_type_contract
page_type: B3_TEXT_MATRIX_EVALUATION
canonical_source: cp-code
version: v2.2
standard_page_ids:
  - page_06_method_evaluation
---

# page_type_contract: B3_TEXT_MATRIX_EVALUATION

## 页面族

方法 × 优缺点矩阵评价页。学生为 M 种方法（banana 为 3 种）各填写优点与缺点，覆盖全部方法、跨方法切换。

> **命名说明**：canonical 名 `B3_TEXT_MATRIX_EVALUATION`。KB 草案 §4 的 `B3_METHOD_EVALUATION` 为简写笔误，待 KB 修订。

## 字段角色（field_role）

| field_id | field_role | required | group_id | method_slot | evaluation_side |
|----------|-----------|----------|----------|-------------|-----------------|
| `method_1_advantage` | `text_input` | true | `method_evaluation` | `method_1` | `advantage` |
| `method_1_disadvantage` | `text_input` | true | `method_evaluation` | `method_1` | `disadvantage` |
| `method_2_advantage` | `text_input` | true | `method_evaluation` | `method_2` | `advantage` |
| `method_2_disadvantage` | `text_input` | true | `method_evaluation` | `method_2` | `disadvantage` |
| `method_3_advantage` | `text_input` | true | `method_evaluation` | `method_3` | `advantage` |
| `method_3_disadvantage` | `text_input` | true | `method_evaluation` | `method_3` | `disadvantage` |

来源：`field_registry.v2.2.json` → `page_06_method_evaluation`。`method_slot` + `evaluation_side` 是下游通用算法依赖的结构语义（不依赖主题词）。

**method_slots 主题映射**：`method_1/2/3` 的 `display_name` 在 `field_registry` 的 `method_slots.*.display_name_by_module` 声明（banana：图像法/网格法/称重法）。主题词只进 display_name，不进 field_id。

## 必采 L2 事件

继承 B2 的全部必采事件（每个 `method_N_advantage/disadvantage` 独立的 `TEXT_FOCUS`/`TEXT_CHANGE`/`TEXT_BLUR`），并强调：

| 事件 | 额外要求 |
|------|---------|
| `TEXT_FOCUS` / `TEXT_BLUR` | metadata 必须带 `method_slot` + `evaluation_side`，便于跨方法切换分析。 |
| `SUBMIT_ATTEMPT` | 6 个必填字段全覆盖校验。 |
| `PAGE_IDLE` | 全局必采采集能力（学生空闲时聚合生成，见 page-type-event-matrix 全类型 R）。 |

## 可选 L2 事件

| 事件 | 适用场景 |
|------|---------|
| `CONTENT_EXPOSE` / `CONTENT_ACTIVATE` | 方法材料卡片（如 `method_material_1/2/3`）曝光/激活。 |
| `OPEN_MODAL` / `CLOSE_MODAL` | 若方法详情通过弹窗展示。 |
| `PAGE_HIDDEN` / `PAGE_VISIBLE` | 通用条件上报（后台/切tab/失焦）。 |

## registry 约束

- `field_registry`：6 个字段 + `method_slots`（含 `slot_index` + `display_name_by_module`）。
- `content_registry`：方法材料（`method_material_*`，`evidence_role: image_method_context` / `grid_method_context` / `weigh_method_context`）必须注册。

## 验收模式

- acceptance case 应覆盖：跨方法切换序列、跨优缺点切换、空提交补救、6 字段全覆盖。
- 验证 `method_slot` + `evaluation_side` 在文本事件 metadata 中正确携带。

## 实例页

- Page06 `page_06_method_evaluation`：banana 实例含 3 方法 × 2 优缺点 = 6 字段 + 3 个方法材料。
