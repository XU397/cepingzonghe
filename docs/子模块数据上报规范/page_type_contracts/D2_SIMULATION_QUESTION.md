---
title: page_type_contract D2_SIMULATION_QUESTION
type: documentation
status: draft
source: design
last_verified: 2026-06-14
contract_id: page_type_contract
page_type: D2_SIMULATION_QUESTION
canonical_source: cp-code
version: v2.2
standard_page_ids:
  - page_09_experiment_question_1
  - page_10_experiment_question_2
  - page_11_experiment_question_3
---

# page_type_contract: D2_SIMULATION_QUESTION

## 页面族

模拟实验 + 单选题页。学生在同一页内既可操作模拟实验，又回答一道单选题；支持先实验后作答、先作答再回实验、选择修正。

**每页只承载一道题**：Page09/10/11 各自独立题号、选项和 `content_id`（draft §4）。前端只上报当前页当前题的 `SELECT_ANSWER`。

## 字段角色（field_role）

以 Page09 为例（Page10/11 同构，题号不同）：

| field_id | field_role | required | group_id | question_id | options |
|----------|-----------|----------|----------|-------------|---------|
| `question_1_answer` | `single_choice` | true | `experiment_questions` | `question_1` | A/B/C/D/E（banana Page09 为 5 选项） |

来源：`field_registry.v2.2.json` → `page_09/10/11_experiment_question_*`。Page10 banana 为 2 选项，Page11 为 3 选项——**选项数量是 per-question 配置，不是类型级固定值**。

## 必采 L2 事件

继承 D1 的 `SET_EXP_PARAM` / `EXECUTE_EXP`（必采）与 `RESET_EXP`（可选，D1 允许无重置路径），并增加：

| 事件 | 说明 |
|------|------|
| `SELECT_ANSWER` | 选择某选项；metadata 带 `question_id` + `option_id`。每页只上报当前页当前题。 |
| `SUBMIT_ATTEMPT` | 提交；`required` 字段（`question_N_answer`）未选则 `validation_status: blocked`。 |
| `PAGE_IDLE` | 全局必采采集能力（学生空闲时聚合生成，见 page-type-event-matrix 全类型 R）。 |

## 可选 L2 事件

| 事件 | 适用场景 |
|------|---------|
| `PAGE_HIDDEN` / `PAGE_VISIBLE` | 通用条件上报（后台/切tab/失焦）。 |

**禁止事件**：无（D2 允许 `SELECT_ANSWER`）。

## registry 约束

- `field_registry`：每个 D2 页有独立 `question_N` + `question_N_answer`；`questions` 结构含 `question_index` + `answer_field_id` + `required`。
- `experimentParams`：D2 页可复用 D1 的实验参数映射（`usePriorExp: true` 允许读 Page08 上下文）。
- 选项 ID（`option_a/b/...`）在 `questions.*.options` 注册，与 field_registry options 对齐。

## 验收模式

- acceptance case 应覆盖三种路径：先实验后作答、先作答再回实验、选择修正（选 A 改 B）。
- 每页验收只含当前题的 `SELECT_ANSWER`。
- `page09/10/11_experiment_question.json` 是标准验收 case。

## 实例页

- Page09 `page_09_experiment_question_1`：banana Q5，5 选项。
- Page10 `page_10_experiment_question_2`：banana Q6，2 选项。
- Page11 `page_11_experiment_question_3`：banana Q7，3 选项。

**V2 差异提示**：若某模块的实验题数量 ≠ 3，或选项结构不同，属 V2/V3 差异（题目数量变化可能触发 V3，需评估是否破坏 13 页拓扑）。
