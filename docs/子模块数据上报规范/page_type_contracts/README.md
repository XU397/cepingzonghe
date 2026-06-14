---
title: page_type_contracts 索引
type: documentation
status: draft
source: design
last_verified: 2026-06-14
standard_id: science-inquiry-13page-trace-contract
contract_version: v2.2
canonical_source: cp-code
---

# page_type_contracts 索引（第一层：类型级标准契约）

本目录是科学探究 13 页同构任务**第一层**标准契约（`page_type_contract`）。每份契约定义一种 page_type 的可复用页面拓扑、字段角色（field_role）、必采/可选 L2 事件、registry 约束和验收模式。

> **权威说明**：本目录由 cp 仓库基于 `g8-banana-browning-experiment` golden reference 起草，sync-manifest 标记为 `implementation_local`。KB canonical 化由 KB 主 session 在跨库需求 `2026-06-14-science-inquiry-trace-contract-v2-1` closeout 时决定。如本目录与 KB canonical 标准冲突，以 KB 为准并记录 follow-up。

## 8 种 page_type 契约清单

| page_type | 契约文件 | 标准页位 | 页面族 |
|-----------|---------|---------|--------|
| `A1_FLOW` | [A1_FLOW.md](A1_FLOW.md) | Page01 / Page04 / Page07 / Page13 | 背景/流程/过渡/结束 |
| `B1_TEXT_SINGLE` | [B1_TEXT_SINGLE.md](B1_TEXT_SINGLE.md) | Page02 | 单输入文本生成 |
| `B2_TEXT_MULTI_PARALLEL` | [B2_TEXT_MULTI_PARALLEL.md](B2_TEXT_MULTI_PARALLEL.md) | Page05 | 多输入框并行方案生成 |
| `B3_TEXT_MATRIX_EVALUATION` | [B3_TEXT_MATRIX_EVALUATION.md](B3_TEXT_MATRIX_EVALUATION.md) | Page06 | 方法 × 优缺点矩阵评价 |
| `C1_INFO_SELECTION` | [C1_INFO_SELECTION.md](C1_INFO_SELECTION.md) | Page03 | 资料卡 + 多选判断 |
| `D1_SIMULATION_ONLY` | [D1_SIMULATION_ONLY.md](D1_SIMULATION_ONLY.md) | Page08 | 纯模拟实验 |
| `D2_SIMULATION_QUESTION` | [D2_SIMULATION_QUESTION.md](D2_SIMULATION_QUESTION.md) | Page09 / Page10 / Page11 | 模拟实验 + 单选题 |
| `E1_CHART_PLAN_DECISION` | [E1_CHART_PLAN_DECISION.md](E1_CHART_PLAN_DECISION.md) | Page12 | 图表证据 + 方案表 + 决策 |

## 命名规范

- **page_type 命名以 cp 代码事实为 canonical**（见 `src/submodules/g8-banana-browning-experiment/mapping.ts` 的 `TracePageType` 与 `src/shared/services/submission/trace/contracts/event_schema.v2.2.json` 的 `page_type` 枚举）。
- **standardPageId 命名同样以代码为 canonical**（见 `field_registry.v2.2.json` 的 `pages` 键）。KB 草案 §4 中的简写（如 `page_01_background`、`page_04_transition_to_design`）视为待修订笔误，已作为跨库需求 `2026-06-14-science-inquiry-trace-contract-v2-1` 的回传项。
- 字段角色（`field_role`）只表达结构槽位，**不含主题词**（banana/honey/steamed-bread）。主题内容只能进入模块配置、`display_name`、Content Registry。

## 事件矩阵

每份契约的"必采/可选 L2 事件"段是 [`page-type-event-matrix.md`](../page-type-event-matrix.md)（8×28 总表）的逐类型细化。总表是契约的可审计索引。

## 事实源

- 字段语义：`src/shared/services/submission/trace/contracts/field_registry.v2.2.json`
- 内容语义：`src/shared/services/submission/trace/contracts/content_registry.banana.v2.2.json`（banana 实例；蜂蜜/馒头需各自生成 content_registry）
- 事件 schema：`src/shared/services/submission/trace/contracts/event_schema.v2.2.json`
- 阈值：`src/shared/services/submission/trace/contracts/rule_config.v2.2.json`
- banana 运行时绑定：`src/submodules/g8-banana-browning-experiment/mapping.ts`（`TRACE_PAGE_CONFIGS`）
