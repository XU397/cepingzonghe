---
title: page_type_contract D1_SIMULATION_ONLY
type: documentation
status: draft
source: design
last_verified: 2026-06-14
contract_id: page_type_contract
page_type: D1_SIMULATION_ONLY
canonical_source: cp-code
version: v2.2
standard_page_ids:
  - page_08_simulation_explore
---

# page_type_contract: D1_SIMULATION_ONLY

## 页面族

纯模拟实验页。学生设置实验参数、执行实验、重置；**无必填字段**，允许不做实验直接下一页（draft §4：D1 允许无实验直接下一页）。

## 字段角色（field_role）

`D1_SIMULATION_ONLY` 页面 `required_fields: []`，`fields: {}`（见 `field_registry.v2.2.json` → `page_08_simulation_explore`）。实验参数通过 `experimentParams`（banana: `days: exp_param_days`）而非输入字段承载。

**禁止 `SELECT_ANSWER`**：D1 页不承载选择题（draft §6；Page08 禁止 `SELECT_ANSWER`）。若有选择题，应归入 D2。

## 必采 L2 事件

| 事件 | 说明 |
|------|------|
| `START_PAGE` | 实验区初始状态。 |
| `SET_EXP_PARAM` | 设置实验参数（如 `exp_param_days`）；metadata 带 `param_id` + `param_name`。 |
| `EXECUTE_EXP` | 执行实验；metadata 带 `exp_run_id`。`expRunDebounceMs`(1000) 抑制相同参数重复执行。 |
| `SUBMIT_ATTEMPT` | 下一页触发；通常 `validation_status: passed`（无必填）。 |
| `PAGE_IDLE` | 实验观察期间、参数犹豫期间。 |

## 可选 L2 事件

| 事件 | 适用场景 |
|------|---------|
| `RESET_EXP` | 重置实验；metadata 带 `param_snapshot_before_reset` + `reset_count`。**可选**——D1 允许无实验直接下一页，重置非必采路径。 |
| `PAGE_HIDDEN` / `PAGE_VISIBLE` | 通用。 |

**禁止事件**：`SELECT_ANSWER`（D1 无选择题）。

## registry 约束

- `field_registry`：D1 页 `required_fields: []`；实验参数通过 `experimentParams` 映射（如 `days → exp_param_days`）。
- `usePriorExp: true`（rule_config）：Page09-11 可读取 Page08 的实验上下文。即 D1 的实验结果可被后续 D2 页消费。

## 验收模式

- acceptance case 应覆盖：设参→执行→观察→重置→再执行序列、直接跳过（不实验直接下一页）路径。
- `page08_direct_skip.json` 是直接跳过的标准验收 case。
- 验证 `EXECUTE_EXP` 的 `exp_run_id` 唯一性 + 去抖生效。

## 实例页

- Page08 `page_08_simulation_explore`：banana 实例，实验参数 `days`。

**V2 差异提示**：若某模块的实验参数数量或类型与 banana 不同（如蜂蜜黏度有温度+湿度两参数），属 V2 结构差异，需扩展 `experimentParams`。
