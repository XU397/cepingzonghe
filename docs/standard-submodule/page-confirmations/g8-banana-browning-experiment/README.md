---
title: banana 13-page instance confirmations (golden reference)
type: documentation
status: draft
source: design
last_verified: 2026-06-14
module_id: g8-banana-browning-experiment
contract_version: v2.2
golden_reference_commit: 327e164f62d1e1fda76b34ac585e78ecf03f65af
---

# g8-banana-browning-experiment 13 页确认包（golden reference）

本目录是 banana 模块的 13 页 `page_instance_confirmation`，作为后续蜂蜜黏度、蒸馒头等同构模块的**范例参照**。

## 共性声明（批量审核基础）

banana 是本标准契约的 golden reference——8 份 `page_type_contract` 与本目录 13 页确认包都是从 banana 代码事实抽象出来的，因此 13 页**全部为 V0**（`variance_report.level: V0`，与对应 page_type_contract 完全一致）。

- `module_id`: `g8-banana-browning-experiment`
- `contract_version`: v2.2
- field_registry: `src/shared/services/submission/trace/contracts/field_registry.v2.2.json`（`registry_version: science-inquiry-field-registry-v2.2`）
- content_registry: `src/shared/services/submission/trace/contracts/content_registry.banana.v2.2.json`（`registry_version: science-inquiry-content-registry-banana-v2.2`）
- rule_config: `rule-config-v2.2`
- golden reference 代码：`src/submodules/g8-banana-browning-experiment/`（commit `327e164f...`）
- mapping 事实源：`src/submodules/g8-banana-browning-experiment/mapping.ts` 的 `TRACE_PAGE_CONFIGS`

## 14 PAGE_CONFIGS vs 13 trace 页

banana 的 `PAGE_CONFIGS` 有 14 项，但 `intro_notice`（注意事项，subPageNum=1）**不计入 13 页 trace 拓扑**——它采用 `navigationMode: hidden`，不加载子模块计时器，不产生 trace 事件。13 页 trace 从 `page_01_intro`（subPageNum=2，pageIndex=1）起。

详见 `page_00_notice.md`（注意事项页说明）。

## 13 页索引

| pageIndex | 文件 | standard_page_id | page_type | V-level |
|-----------|------|------------------|-----------|---------|
| 1 | [page_01.md](page_01.md) | `page_01_intro` | A1_FLOW | V0 |
| 2 | [page_02.md](page_02.md) | `page_02_question_generation` | B1_TEXT_SINGLE | V0 |
| 3 | [page_03.md](page_03.md) | `page_03_factor_selection` | C1_INFO_SELECTION | V0 |
| 4 | [page_04.md](page_04.md) | `page_04_transition` | A1_FLOW | V0 |
| 5 | [page_05.md](page_05.md) | `page_05_plan_generation` | B2_TEXT_MULTI_PARALLEL | V0 |
| 6 | [page_06.md](page_06.md) | `page_06_method_evaluation` | B3_TEXT_MATRIX_EVALUATION | V0 |
| 7 | [page_07.md](page_07.md) | `page_07_experiment_intro` | A1_FLOW | V0 |
| 8 | [page_08.md](page_08.md) | `page_08_simulation_explore` | D1_SIMULATION_ONLY | V0 |
| 9 | [page_09.md](page_09.md) | `page_09_experiment_question_1` | D2_SIMULATION_QUESTION | V0 |
| 10 | [page_10.md](page_10.md) | `page_10_experiment_question_2` | D2_SIMULATION_QUESTION | V0 |
| 11 | [page_11.md](page_11.md) | `page_11_experiment_question_3` | D2_SIMULATION_QUESTION | V0 |
| 12 | [page_12.md](page_12.md) | `page_12_solution_selection` | E1_CHART_PLAN_DECISION | V0 |
| 13 | [page_13.md](page_13.md) | `page_13_task_finish` | A1_FLOW | V0 |

## 批量审核说明

13 页均为 V0，可按 [`page-type-event-matrix.md`](../../../子模块数据上报规范/page-type-event-matrix.md) 的 R 单元格批量核对 acceptance_expectations。每页文件列出该页具体的 registry 映射与验收路径，作为审计证据。
