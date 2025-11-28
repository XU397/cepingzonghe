## Why
- g8 mikania 实验模块存在手写提交/事件/前缀，与统一 Schema 不一致，输入/阻断/next_click 等轨迹不全，影响行为分析。
- 需迁移到统一提交管道和包装组件，确保数据结构与事件枚举一致。

## What Changes
- 接入新版 `usePageSubmission` + Schema，统一页码 `<stepIndex>.<subPageNum>`、`P${pageNumber}_...` 前缀、flow_context 注入，移除直连/手写 code/时间。
- 补齐埋点：输入/选择 focus/change/blur/delete、next_click，实验操作/运行结果，阻断 `click_blocked`。
- answerList 仅非空；超时写占位；快照/校验验证。

## Detailed Migration Plan

详见 [design.md](./design.md)（包含完整迁移页清单、6个详细样例快照、验证计划）

### 关键概念

**pageNumber 格式**: `<stepIndex>.<subPageNum>`
- **stepIndex**: 子模块在 Flow 中的位置索引（0-based，运行时确定）
  - Flow 第1个子模块 → stepIndex = 0
  - Flow 第2个子模块 → stepIndex = 1
- **subPageNum**: 子模块内页面编号（1-based，固定）
  - page_00_notice → 1，page_02_step_q1 → 3，page_06_q4_conc → 7

**示例**: 若 g8-mikania-experiment 是 Flow 中第2个子模块（stepIndex=1）：
- page_00_notice → pageNumber = `1.1`，targetElement 前缀 `P1.1_`
- page_02_step_q1 → pageNumber = `1.3`，targetElement 前缀 `P1.3_`

---

## 完整 MarkObject 样例

以下样例假设 **stepIndex = 1**（该子模块是 Flow 中第2个），展示关键字段格式。

### 样例 1: 输入页 (page_02_step_q1)

**完整输入链路**: focus → change → delete → blur → next_click

```json
{
  "pageNumber": "1.3",
  "pageDesc": "[flow-g8-experiment-2024/g8-mikania-experiment/1] 实验步骤",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "page_02_step_q1",
      "time": "2025-11-22 10:17:30",
      "pageId": "page_02_step_q1"
    },
    {
      "code": 2,
      "targetElement": "P1.3_Q1_控制变量原因",
      "eventType": "input_focus",
      "value": "",
      "time": "2025-11-22 10:17:35"
    },
    {
      "code": 3,
      "targetElement": "P1.3_Q1_控制变量原因",
      "eventType": "input_change",
      "value": "{\"prev\":\"\",\"next\":\"为了确保\",\"prevLength\":0,\"nextLength\":4}",
      "time": "2025-11-22 10:17:38"
    },
    {
      "code": 4,
      "targetElement": "P1.3_Q1_控制变量原因",
      "eventType": "input_delete",
      "value": "{\"action\":\"delete\",\"prev\":\"为了确保\",\"next\":\"为了\",\"prevLength\":4,\"nextLength\":2}",
      "time": "2025-11-22 10:17:40"
    },
    {
      "code": 5,
      "targetElement": "P1.3_Q1_控制变量原因",
      "eventType": "input_change",
      "value": "{\"prev\":\"为了\",\"next\":\"为了控制变量\",\"prevLength\":2,\"nextLength\":7}",
      "time": "2025-11-22 10:17:45"
    },
    {
      "code": 6,
      "targetElement": "P1.3_Q1_控制变量原因",
      "eventType": "input_blur",
      "value": "为了控制变量",
      "time": "2025-11-22 10:17:50"
    },
    {
      "code": 7,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "navigate_to_sim_exp",
      "time": "2025-11-22 10:17:55"
    },
    {
      "code": 8,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "page_02_step_q1",
      "time": "2025-11-22 10:17:55"
    },
    {
      "code": 9,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-mikania-experiment\",\"stepIndex\":1,\"pageId\":\"page_02_step_q1\"}",
      "time": "2025-11-22 10:17:55"
    },
    {
      "code": 10,
      "targetElement": "系统",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":98}",
      "time": "2025-11-22 10:17:55"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P1.3_Q1",
      "value": "为了控制变量"
    }
  ],
  "beginTime": "2025-11-22 10:17:30",
  "endTime": "2025-11-22 10:17:55",
  "imgList": []
}
```

**关键点**:
- `pageNumber`: `1.3`（stepIndex=1, subPageNum=3）
- `pageDesc`: 含 Flow 前缀 `[flowId/submoduleId/stepIndex]`
- `targetElement`: 使用 `P1.3_` 前缀（与 pageNumber 一致）
- `operationList`:
  - 包含 `page_enter/exit`, `input_focus/blur/change/delete`, `next_click`
  - 自动注入 `flow_context`（由提交层）
  - 自动追加 `page_submit_success`（由提交层）
- `answerList`: 仅最终答案（非空）
- `code`: 连续自增（提交层统一生成）
- `time`: 统一格式 `YYYY-MM-DD HH:mm:ss`

---

### 样例 2: 实验操作页 (page_03_sim_exp)

**实验流程**: 参数调整 → 开始实验 → 记录结果 → 实验历史存为 Answer

```json
{
  "pageNumber": "1.4",
  "pageDesc": "[flow-g8-experiment-2024/g8-mikania-experiment/1] 模拟实验",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "page_03_sim_exp",
      "time": "2025-11-22 10:18:00",
      "pageId": "page_03_sim_exp"
    },
    {
      "code": 2,
      "targetElement": "P1.4_实验面板-浓度选择",
      "eventType": "simulation_operation",
      "value": "{\"operation\":\"param_change\",\"param\":\"concentration\",\"oldValue\":\"0mg/ml\",\"newValue\":\"5mg/ml\"}",
      "time": "2025-11-22 10:18:05"
    },
    {
      "code": 3,
      "targetElement": "P1.4_实验面板-天数调整",
      "eventType": "simulation_operation",
      "value": "{\"operation\":\"param_change\",\"param\":\"days\",\"oldValue\":1,\"newValue\":5}",
      "time": "2025-11-22 10:18:10"
    },
    {
      "code": 4,
      "targetElement": "P1.4_实验面板-开始按钮",
      "eventType": "simulation_operation",
      "value": "{\"operation\":\"start\",\"concentration\":\"5mg/ml\",\"days\":5}",
      "time": "2025-11-22 10:18:15"
    },
    {
      "code": 5,
      "targetElement": "P1.4_实验面板",
      "eventType": "simulation_timing_started",
      "value": "{\"duration_ms\":3500}",
      "time": "2025-11-22 10:18:15"
    },
    {
      "code": 6,
      "targetElement": "P1.4_实验面板",
      "eventType": "simulation_run_result",
      "value": "{\"concentration\":\"5mg/ml\",\"days\":5,\"germinationRate\":65,\"sproutedCount\":65}",
      "time": "2025-11-22 10:18:19"
    },
    {
      "code": 7,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "navigate_to_q2_data",
      "time": "2025-11-22 10:18:25"
    },
    {
      "code": 8,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "page_03_sim_exp",
      "time": "2025-11-22 10:18:25"
    },
    {
      "code": 9,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-mikania-experiment\",\"stepIndex\":1,\"pageId\":\"page_03_sim_exp\"}",
      "time": "2025-11-22 10:18:25"
    },
    {
      "code": 10,
      "targetElement": "系统",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":105}",
      "time": "2025-11-22 10:18:25"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P1.4_实验历史",
      "value": "{\"experiments\":[{\"concentration\":\"5mg/ml\",\"days\":5,\"germinationRate\":65}]}"
    }
  ],
  "beginTime": "2025-11-22 10:18:00",
  "endTime": "2025-11-22 10:18:25",
  "imgList": []
}
```

**关键点**:
- `simulation_operation`: 参数调整（浓度/天数/开始）
- `simulation_timing_started`: 动画开始（3.5秒）
- `simulation_run_result`: 实验结果（发芽率、发芽数）
- `answerList`: 实验历史作为 JSON 字符串单条 Answer

---

### 样例 3: 单选题页 (page_04_q2_data)

**选择流程**: 未选择阻断 → 选择答案 → 提交成功

```json
{
  "pageNumber": "1.5",
  "pageDesc": "[flow-g8-experiment-2024/g8-mikania-experiment/1] 数据分析",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "page_04_q2_data",
      "time": "2025-11-22 10:19:00",
      "pageId": "page_04_q2_data"
    },
    {
      "code": 2,
      "targetElement": "下一页按钮",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"validation_failed\",\"missing\":[\"Q2_抑制作用浓度\"]}",
      "time": "2025-11-22 10:19:08"
    },
    {
      "code": 3,
      "targetElement": "P1.5_Q2_抑制作用浓度",
      "eventType": "radio_select",
      "value": "C",
      "time": "2025-11-22 10:19:12"
    },
    {
      "code": 4,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "navigate_to_q3_trend",
      "time": "2025-11-22 10:19:15"
    },
    {
      "code": 5,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "page_04_q2_data",
      "time": "2025-11-22 10:19:15"
    },
    {
      "code": 6,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-mikania-experiment\",\"stepIndex\":1,\"pageId\":\"page_04_q2_data\"}",
      "time": "2025-11-22 10:19:15"
    },
    {
      "code": 7,
      "targetElement": "系统",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":87}",
      "time": "2025-11-22 10:19:15"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P1.5_Q2",
      "value": "C"
    }
  ],
  "beginTime": "2025-11-22 10:19:00",
  "endTime": "2025-11-22 10:19:15",
  "imgList": []
}
```

**关键点**:
- `radio_select`: 现有实现使用此事件（保持不变）
- `click_blocked`: 含 `missing` 列表，标识缺失字段
- `answerList`: 仅最终选中答案

---

### 样例 4: 倒计时确认页 (page_00_notice)

**流程**: 倒计时38秒 → 勾选确认框 → 提交

```json
{
  "pageNumber": "1.1",
  "pageDesc": "[flow-g8-experiment-2024/g8-mikania-experiment/1] 注意事项",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "page_00_notice",
      "time": "2025-11-22 10:00:00",
      "pageId": "page_00_notice"
    },
    {
      "code": 2,
      "targetElement": "P1.1_注意事项确认",
      "eventType": "checkbox_check",
      "value": "checked",
      "time": "2025-11-22 10:00:42"
    },
    {
      "code": 3,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "navigate_to_intro",
      "time": "2025-11-22 10:00:45"
    },
    {
      "code": 4,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "page_00_notice",
      "time": "2025-11-22 10:00:45"
    },
    {
      "code": 5,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-mikania-experiment\",\"stepIndex\":1,\"pageId\":\"page_00_notice\"}",
      "time": "2025-11-22 10:00:45"
    },
    {
      "code": 6,
      "targetElement": "系统",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":120}",
      "time": "2025-11-22 10:00:45"
    }
  ],
  "answerList": [],
  "beginTime": "2025-11-22 10:00:00",
  "endTime": "2025-11-22 10:00:45",
  "imgList": []
}
```

**关键点**:
- 38秒倒计时为**本地页面逻辑**，不产生 `timer_start/complete` 事件
- `checkbox_check/uncheck`: 确认框勾选/取消
- `answerList`: 空（无问题答案）

---

## 事件策略明确

**radio_select vs select_change**:
- ✅ **保留 radio_select**（现有实现已使用，Schema 允许）
- ❌ **不强制改为 select_change**（避免不必要的改造成本）
- 📝 仅需补充 targetElement 前缀（`P1.5_Q2_抑制作用浓度`）

**input 事件**:
- ✅ 补全 `input_focus/blur/change/delete` 序列
- ✅ `input_change` value 使用 `{prev, next, prevLength, nextLength}` 格式
- ✅ `input_delete` 明确标记 `{action: 'delete', ...}`

---

## 验证计划

- **Schema 校验**: pageNumber 格式 `^\d+\.\d+$`、事件枚举、code 连续性、时间格式
- **最小事件集合**:
  - 基础: `page_enter/exit/next_click`
  - 输入页: `input_focus/blur/change`（至少1个）
  - 选择页: `radio_select`（现有）或 `checkbox_check/uncheck`
  - 阻断: `click_blocked`（含 missing 列表）
  - 实验页: `simulation_operation/timing_started/run_result`
- **Lint 守卫**: 禁止直连 `/stu/saveHcMark`、手写前缀、绕过 usePageSubmission
- **快照测试**: 基于上述 4 个样例 + design.md 中的 6 个详细样例

---

## Impact
- 规格引用：`openspec/specs/submission`、`openspec/specs/data-format`。
- 代码影响：模块页面埋点/提交、上下文集成、测试。
- 风险：**BREAKING**（前缀/页码/事件变更；旧接口禁用），需 Schema + 快照验证。
