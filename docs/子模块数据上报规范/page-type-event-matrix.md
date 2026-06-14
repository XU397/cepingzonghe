---
title: page-type-event-matrix (8 × 28)
type: documentation
status: draft
source: design
last_verified: 2026-06-14
standard_id: science-inquiry-13page-trace-contract
contract_version: v2.2
canonical_source: cp-code
---

# page-type-event-matrix

8 种 page_type × 28 个 L2 事件的总表。每格取值：

- **R** = Required（必采，该 page_type 页面 MUST 上报）
- **O** = Optional（可选，视页面具体内容而定）
- **—** = Not Applicable（该 page_type 禁止或不适用）
- **R\*** = 条件必采（满足条件时 MUST，见脚注）
- 带数字上标的 `R¹`/`R³` 或 `—⁴` = 带脚注的条件必采/不适用，详见对应脚注（R1/R2/R3/R4）

本表是 [`page_type_contracts/`](page_type_contracts/) 8 份契约的可审计索引。事件名取自 `src/shared/services/submission/trace/types.ts` 的 `L2TraceEventType`（与 `event_schema.v2.2.json` enum 一致）。

## 矩阵

| L2 事件 \ page_type | A1_FLOW | B1_TEXT_SINGLE | B2_TEXT_MULTI_PARALLEL | B3_TEXT_MATRIX_EVALUATION | C1_INFO_SELECTION | D1_SIMULATION_ONLY | D2_SIMULATION_QUESTION | E1_CHART_PLAN_DECISION |
|---|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| `START_PAGE` | R | R | R | R | R | R | R | R |
| `PAGE_HIDDEN` | O | O | O | O | O | O | O | O |
| `PAGE_VISIBLE` | O | O | O | O | O | O | O | O |
| `PAGE_IDLE` | R | R | R | R | R | R | R | R |
| `SUBMIT_ATTEMPT` | R | R | R | R | R | R | R | R |
| `TASK_FINISH` | R¹ | — | — | — | — | — | — | — |
| `CONTENT_EXPOSE` | O² | O | O | O | O | — | — | O |
| `CONTENT_ACTIVATE` | O | O | O | O | O | — | — | O |
| `CONTENT_VIEW` | O | O | O | O | O | O | O | O |
| `CHAT_SCROLL` | O² | O | — | — | — | — | — | — |
| `CHAT_VIEWPORT_ENTER` | O | O | — | — | — | — | — | — |
| `CHAT_VIEWPORT_LEAVE` | O | O | — | — | — | — | — | — |
| `OPEN_MODAL` | O | O | O | O | R | O | O | O |
| `CLOSE_MODAL` | O | O | O | O | R | O | O | O |
| `CHART_HOVER` | — | — | — | — | — | — | — | R |
| `TEXT_FOCUS` | — | R | R | R | — | — | — | R³ |
| `TEXT_CHANGE` | — | R | R | R | — | — | — | R³ |
| `TEXT_BLUR` | — | R | R | R | — | — | — | R³ |
| `CHECKBOX_TOGGLE` | — | — | — | — | R | — | — | — |
| `SELECT_ANSWER` | — | — | — | — | — | —⁴ | R | — |
| `SET_EXP_PARAM` | — | — | — | — | — | R | R | — |
| `EXECUTE_EXP` | — | — | — | — | — | R | R | — |
| `RESET_EXP` | — | — | — | — | — | O | O | — |
| `ADD_ROW` | — | — | — | — | — | — | — | R |
| `DELETE_ROW` | — | — | — | — | — | — | — | O |
| `SET_PLAN_PARAM` | — | — | — | — | — | — | — | R |
| `SELECT_BEST` | — | — | — | — | — | — | — | R |
| `TIMER_COMPLETE` | O | O | O | O | O | O | O | O |

## 脚注

- **R¹ TASK_FINISH**：仅 Page13 `page_13_task_finish` 必采；其他 A1_FLOW 页（Page01/04/07）用 `SUBMIT_ATTEMPT` 作为边界。`TASK_FINISH` 只用于任务结束页生命周期，不直接作为 L3 探究行为标签。
- **O² CONTENT_EXPOSE / CHAT_SCROLL on A1_FLOW**：仅当该过渡页含动态揭示内容或聊天/资料卡滚动区时可选；默认可见内容**不**重复生成主动 `CONTENT_EXPOSE`。
- **R³ TEXT_* on E1_CHART_PLAN_DECISION**：仅 `reason_text` 字段触发 `TEXT_FOCUS`/`TEXT_CHANGE`/`TEXT_BLUR`；图表与方案表不触发文本事件。
- **—⁴ SELECT_ANSWER on D1_SIMULATION_ONLY**：D1 页禁止 `SELECT_ANSWER`（draft §6；Page08 禁止）。若有选择题应归入 D2。

## 全局通用事件说明

- `START_PAGE` 全类型必采，`value.metadata` 必须携带 7 个 registry literal（schema_version / field_registry_version+hash / content_registry_version+hash / rule_config_version+hash）+ `page_index` + `legacy_page_id`。
- `PAGE_IDLE` 全类型 R 的含义是**必须具备采集能力**（page mount 时 collector 就绪，见 `useBananaPageIdle`），**满足 idle 条件（可见+聚焦+无有效交互超过 `pageIdleThresholdMs`(5000)）才实际生成事件**。R 不表示每个 MarkObject 必须出现该事件——学生全程无空闲则该页无 PAGE_IDLE 事件，属正常。三阶段 `initial_before_first_action` / `after_blocked_submit` / `between_effective_events`；禁止轮询/逐秒/mousemove。
- `SUBMIT_ATTEMPT` 全类型必采，必须含 `submit_attempt_id` + `validation_status` + `submit_trigger`。
- `PAGE_HIDDEN` / `PAGE_VISIBLE` / `TIMER_COMPLETE` 全类型可选（条件上报）。

## 事实源与运行时强制

- 本矩阵是**文档级契约**，填补 `TRACE_PAGE_CONFIGS`（`mapping.ts`）只声明 `requiredFields` 而无事件矩阵的代码缺口。
- 运行时强制校验**不在本轮做**（见 OpenSpec change `science-inquiry-trace-contract-v2-1` design.md Deferred）；当前运行时校验由 `validateTraceMark.ts` 承担（schema shape + registry hash bond + per-event 语义不变量），但**不**按 page_type 校验事件矩阵覆盖。
- 矩阵的每个 R 单元格在后续同构模块重构时，应作为该页 `page_instance_confirmation` 的 `acceptance_expectations` 校对依据。
