# g8-mikania-experiment 模块迁移清单与样例快照

## 1. 迁移页清单

### 总览
模块共 **7 个页面**，分为 3 类：过渡页、输入/选择页、实验操作页。

| subPageNum | pageNumber | pageId | 页面标题 | 类型 | 问题数 | 特殊处理 |
|------------|------------|--------|----------|------|--------|----------|
| 1 | `<stepIndex>.1` | `page_00_notice` | 注意事项 | hidden | 0 | **38秒倒计时** + 确认框校验 |
| 2 | `<stepIndex>.2` | `page_01_intro` | 任务背景 | experiment | 0 | 无校验，可直接通过 |
| 3 | `<stepIndex>.3` | `page_02_step_q1` | 实验步骤+Q1 | experiment | 1 | Q1文本框 ≥5字符 |
| 4 | `<stepIndex>.4` | `page_03_sim_exp` | 模拟实验 | experiment | 0 | 需至少完成一次实验运行 |
| 5 | `<stepIndex>.5` | `page_04_q2_data` | 数据分析+Q2 | experiment | 1 | Q2单选题（A/B/C） |
| 6 | `<stepIndex>.6` | `page_05_q3_trend` | 趋势分析+Q3 | experiment | 1 | Q3单选题（A/B/C） |
| 7 | `<stepIndex>.7` | `page_06_q4_conc` | 结论+Q4 | experiment | 2 | Q4a判断题 + Q4b输入题(≥10字符)，**最后一页** |

**关键概念说明**:
- **pageNumber 格式**: `<stepIndex>.<subPageNum>`（组合页码）
- **stepIndex**: 子模块在 **Flow 中的顺序**（由 Flow 提供，**非子模块内部页面序号**）
  - 如果是 Flow 中的第1个子模块，stepIndex = 0
  - 如果是 Flow 中的第2个子模块，stepIndex = 1  - 依此类推
- **subPageNum**: 子模块内的页码，从 1 开始（对应后端 pageNum）
- **示例**: 假设本子模块是 Flow 中的第 2 个（stepIndex=1）：
  - page_00_notice → pageNumber = `1.1`
  - page_01_intro → pageNumber = `1.2`
  - page_02_step_q1 → pageNumber = `1.3`
  - ...
  - page_06_q4_conc → pageNumber = `1.7`

### 特殊处理页面说明

#### 1. `page_00_notice` - 倒计时确认页
- **倒计时机制**: 38秒本地倒计时（非统一 timer），期间禁用确认框
- **阻断校验**: 倒计时未结束或未勾选确认框时阻断
- **现有事件**: `checkbox_check/uncheck`, `click_blocked`（含 missing 列表）
- **无需补全**: 倒计时为页面内部逻辑，不需要 timer_start/complete（与 AssessmentPageFrame 的 timer 无关）
- **click_blocked**: value 需包含 `missing: ['倒计时未结束']` 或 `missing: ['注意事项确认']`

#### 2. `page_03_sim_exp` - 实验操作页
- **实验状态**: 需记录浓度选择、天数调整、开始/重置操作
- **运行结果**: 实验运行后记录发芽率结果
- **现有事件**:
  - `simulation_operation` (已实现，含 operation 类型: param_change/start/reset)
    - 浓度调整: `{operation:'param_change', param:'concentration', oldValue, newValue}`
    - 天数调整: `{operation:'param_change', param:'days', oldValue, newValue}`
    - 开始: `{operation:'start', concentration, days, expectedRate}`
    - 重置: `{operation:'reset', previousConcentration, previousDays}`
- **需补全事件**:
  - `simulation_timing_started` (动画开始，3.5秒)
  - `simulation_run_result` (动画结束，含实际结果数据)
  - 将多次实验历史记录为 Answer（JSON字符串）
- **阻断校验**: 未完成至少一次实验时阻断，missing: `['未完成实验操作']`

#### 3. `page_06_q4_conc` - 最后一页
- **双重校验**: Q4a判断题 + Q4b输入题（≥10字符）
- **提交按钮**: 按钮文案为"提交"而非"下一步"
- **阻断分段**: 需分别标识缺失项 `['Q4a_菟丝子有效性']` 和 `['Q4b_结论理由']`

---

## 1.5 answerList格式规范
- **targetElement 使用完整问题文本**（非题目ID），便于评分理解问题上下文，参考 `docs/submodule-submission-guidelines.md` 第16-97行。
- **value 使用完整选项内容**：单选题格式为 `"A. 选项文本"`，多选题逗号分隔完整选项，输入题保留用户完整输入。
- **operationList 仍使用题目ID前缀**（如 `P1.3_Q1_控制变量原因`），两者用途区分清晰。

---

## 2. 样例快照（期望 MarkObject）

**假设场景**: 所有样例假设 g8-mikania-experiment 是 Flow 中的**第2个子模块**（stepIndex = 1）

### 样例 1: `page_00_notice` (1.1) - 计时过渡页

**场景**: 用户进入页面 → 倒计时38秒 → 倒计时结束 → 勾选确认框 → 点击下一步

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
      "time": "2025-11-22 10:00:00"
    },
    {
      "code": 2,
      "targetElement": "P1.1_注意事项确认",
      "eventType": "checkbox_check",
      "value": "checked",
      "time": "2025-11-22 10:00:40"
    },
    {
      "code": 3,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "navigate_to_intro",
      "time": "2025-11-22 10:00:42"
    },
    {
      "code": 4,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "page_00_notice",
      "time": "2025-11-22 10:00:42"
    },
    {
      "code": 5,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-mikania-experiment\",\"stepIndex\":1,\"pageId\":\"page_00_notice\"}",
      "time": "2025-11-22 10:00:42"
    },
    {
      "code": 6,
      "targetElement": "系统",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":120}",
      "time": "2025-11-22 10:00:42"
    }
  ],
  "answerList": [],
  "beginTime": "2025-11-22 10:00:00",
  "endTime": "2025-11-22 10:00:42",
  "imgList": []
}
```

**阻断场景快照** (倒计时未结束就点击下一步):
```json
{
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "page_00_notice",
      "time": "2025-11-22 10:00:00"
    },
    {
      "code": 2,
      "targetElement": "下一页按钮",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"validation_failed\",\"missing\":[\"倒计时未结束\",\"注意事项确认\"]}",
      "time": "2025-11-22 10:00:10"
    }
  ]
}
```

---

### 样例 2: `page_02_step_q1` (1.3) - 输入页（含完整输入变更链）

**场景**: 进入页面 → 聚焦输入框 → 输入"为了" → 删除"了" → 继续输入"控制变量" → 失焦 → 点击下一步

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
      "time": "2025-11-22 10:01:00"
    },
    {
      "code": 2,
      "targetElement": "P1.3_Q1_控制变量原因",
      "eventType": "input_focus",
      "value": "",
      "time": "2025-11-22 10:01:05"
    },
    {
      "code": 3,
      "targetElement": "P1.3_Q1_控制变量原因",
      "eventType": "input_change",
      "value": "{\"prev\":\"\",\"next\":\"为了\"}",
      "time": "2025-11-22 10:01:08"
    },
    {
      "code": 4,
      "targetElement": "P1.3_Q1_控制变量原因",
      "eventType": "input_delete",
      "value": "{\"action\":\"delete\",\"prev\":\"为了\",\"next\":\"为\"}",
      "time": "2025-11-22 10:01:10"
    },
    {
      "code": 5,
      "targetElement": "P1.3_Q1_控制变量原因",
      "eventType": "input_change",
      "value": "{\"prev\":\"为\",\"next\":\"为控制变量\"}",
      "time": "2025-11-22 10:01:15"
    },
    {
      "code": 6,
      "targetElement": "P1.3_Q1_控制变量原因",
      "eventType": "input_blur",
      "value": "为控制变量",
      "time": "2025-11-22 10:01:20"
    },
    {
      "code": 7,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "navigate_to_sim_exp",
      "time": "2025-11-22 10:01:25"
    },
    {
      "code": 8,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "page_02_step_q1",
      "time": "2025-11-22 10:01:25"
    },
    {
      "code": 9,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-mikania-experiment\",\"stepIndex\":1,\"pageId\":\"page_02_step_q1\"}",
      "time": "2025-11-22 10:01:25"
    },
    {
      "code": 10,
      "targetElement": "系统",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":95}",
      "time": "2025-11-22 10:01:25"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "问题1：为什么在每组实验中，都要确保其他条件一致？",
      "value": "为控制变量"
    }
  ],
  "beginTime": "2025-11-22 10:01:00",
  "endTime": "2025-11-22 10:01:25",
  "imgList": []
}
```

**阻断场景快照** (输入少于5字符):
```json
{
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "page_02_step_q1",
      "time": "2025-11-22 10:01:00"
    },
    {
      "code": 2,
      "targetElement": "P1.3_Q1_控制变量原因",
      "eventType": "input_change",
      "value": "{\"prev\":\"\",\"next\":\"为了\"}",
      "time": "2025-11-22 10:01:08"
    },
    {
      "code": 3,
      "targetElement": "下一页按钮",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"validation_failed\",\"missing\":[\"Q1_控制变量原因\"]}",
      "time": "2025-11-22 10:01:10"
    }
  ],
  "answerList": []
}
```

---

### 样例 3: `page_03_sim_exp` (1.4) - 实验操作页

**场景**: 进入页面 → 调整浓度为5mg/ml → 调整天数为5 → 点击开始 → 等待运行结束（发芽率65%） → 点击下一步

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
      "time": "2025-11-22 10:02:00"
    },
    {
      "code": 2,
      "targetElement": "P1.4_浓度选择器",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"set_concentration\",\"prev\":\"0mg/ml\",\"next\":\"5mg/ml\"}",
      "time": "2025-11-22 10:02:05"
    },
    {
      "code": 3,
      "targetElement": "P1.4_天数选择器",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"set_days\",\"prev\":1,\"next\":5}",
      "time": "2025-11-22 10:02:10"
    },
    {
      "code": 4,
      "targetElement": "P1.4_开始按钮",
      "eventType": "simulation_timing_started",
      "value": "{\"concentration\":\"5mg/ml\",\"days\":5}",
      "time": "2025-11-22 10:02:15"
    },
    {
      "code": 5,
      "targetElement": "P1.4_实验结果",
      "eventType": "simulation_run_result",
      "value": "{\"concentration\":\"5mg/ml\",\"days\":5,\"germinationRate\":65,\"timestamp\":\"2025-11-22 10:02:20\"}",
      "time": "2025-11-22 10:02:20"
    },
    {
      "code": 6,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "navigate_to_q2_data",
      "time": "2025-11-22 10:02:25"
    },
    {
      "code": 7,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "page_03_sim_exp",
      "time": "2025-11-22 10:02:25"
    },
    {
      "code": 8,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-mikania-experiment\",\"stepIndex\":1,\"pageId\":\"page_03_sim_exp\"}",
      "time": "2025-11-22 10:02:25"
    },
    {
      "code": 9,
      "targetElement": "系统",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":105}",
      "time": "2025-11-22 10:02:25"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P1.4_实验历史",
      "value": "{\"runs\":[{\"concentration\":\"5mg/ml\",\"days\":5,\"germinationRate\":65,\"timestamp\":\"2025-11-22 10:02:20\"}]}"
    }
  ],
  "beginTime": "2025-11-22 10:02:00",
  "endTime": "2025-11-22 10:02:25",
  "imgList": []
}
```

**阻断场景快照** (未完成实验):
```json
{
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "page_03_sim_exp",
      "time": "2025-11-22 10:02:00"
    },
    {
      "code": 2,
      "targetElement": "P1.4_浓度选择器",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"set_concentration\",\"prev\":\"0mg/ml\",\"next\":\"5mg/ml\"}",
      "time": "2025-11-22 10:02:05"
    },
    {
      "code": 3,
      "targetElement": "下一页按钮",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"validation_failed\",\"missing\":[\"未完成实验操作\"]}",
      "time": "2025-11-22 10:02:10"
    }
  ],
  "answerList": []
}
```

---

### 样例 4: `page_04_q2_data` (1.5) - 选择页

**场景**: 进入页面 → 选择选项A → 改选B → 改选C → 点击下一步

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
      "time": "2025-11-22 10:03:00"
    },
    {
      "code": 2,
      "targetElement": "P1.5_Q2_抑制作用浓度",
      "eventType": "radio_select",
      "value": "A",
      "time": "2025-11-22 10:03:05"
    },
    {
      "code": 3,
      "targetElement": "P1.5_Q2_抑制作用浓度",
      "eventType": "radio_select",
      "value": "B",
      "time": "2025-11-22 10:03:10"
    },
    {
      "code": 4,
      "targetElement": "P1.5_Q2_抑制作用浓度",
      "eventType": "radio_select",
      "value": "C",
      "time": "2025-11-22 10:03:15"
    },
    {
      "code": 5,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "navigate_to_q3_trend",
      "time": "2025-11-22 10:03:20"
    },
    {
      "code": 6,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "page_04_q2_data",
      "time": "2025-11-22 10:03:20"
    },
    {
      "code": 7,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-mikania-experiment\",\"stepIndex\":1,\"pageId\":\"page_04_q2_data\"}",
      "time": "2025-11-22 10:03:20"
    },
    {
      "code": 8,
      "targetElement": "系统",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":88}",
      "time": "2025-11-22 10:03:20"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "问题2：根据实验结果，哪种浓度的菟丝子提取液对薇甘菊种子萌发抑制作用最强？",
      "value": "C. 10mg/ml"
    }
  ],
  "beginTime": "2025-11-22 10:03:00",
  "endTime": "2025-11-22 10:03:20",
  "imgList": []
}
```

**阻断场景快照** (未选择就点击下一步):
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
      "time": "2025-11-22 10:03:00"
    },
    {
      "code": 2,
      "targetElement": "下一页按钮",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"validation_failed\",\"missing\":[\"Q2_抑制作用浓度\"]}",
      "time": "2025-11-22 10:03:05"
    }
  ],
  "answerList": []
}
```

---

### 样例 5: `page_05_q3_trend` (1.6) - 超时自动提交

**场景**: 进入页面 → 选择答案 → 超时触发自动提交

```json
{
  "pageNumber": "1.6",
  "pageDesc": "[flow-g8-experiment-2024/g8-mikania-experiment/1] 趋势分析",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "page_05_q3_trend",
      "time": "2025-11-22 10:04:00"
    },
    {
      "code": 2,
      "targetElement": "P1.6_Q3_发芽率趋势",
      "eventType": "radio_select",
      "value": "A",
      "time": "2025-11-22 10:04:10"
    },
    {
      "code": 3,
      "targetElement": "系统",
      "eventType": "timer_complete",
      "value": "{\"elapsed\":2400000}",
      "time": "2025-11-22 10:44:00"
    },
    {
      "code": 4,
      "targetElement": "系统",
      "eventType": "auto_submit",
      "value": "{\"reason\":\"timeout\",\"hasAnswer\":true}",
      "time": "2025-11-22 10:44:00"
    },
    {
      "code": 5,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "page_05_q3_trend",
      "time": "2025-11-22 10:44:00"
    },
    {
      "code": 6,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-mikania-experiment\",\"stepIndex\":1,\"pageId\":\"page_05_q3_trend\"}",
      "time": "2025-11-22 10:44:00"
    },
    {
      "code": 7,
      "targetElement": "系统",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":102,\"auto\":true}",
      "time": "2025-11-22 10:44:00"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "问题3：随着菟丝子提取液浓度的增加，薇甘菊种子发芽率呈现出怎样的变化趋势？",
      "value": "A. 下降"
    }
  ],
  "beginTime": "2025-11-22 10:04:00",
  "endTime": "2025-11-22 10:44:00",
  "imgList": []
}
```

**关键点**:
- `timer_complete`: 由统一 timer 触发（40分钟超时）
- `auto_submit`: 标识自动提交，`hasAnswer:true` 表示有答案
- `page_submit_success`: 含 `auto:true` 标识

**超时无答案场景快照**:
```json
{
  "pageNumber": "1.6",
  "pageDesc": "[flow-g8-experiment-2024/g8-mikania-experiment/1] 趋势分析",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "page_05_q3_trend",
      "time": "2025-11-22 10:04:00"
    },
    {
      "code": 2,
      "targetElement": "系统",
      "eventType": "timer_complete",
      "value": "{\"elapsed\":2400000}",
      "time": "2025-11-22 10:44:00"
    },
    {
      "code": 3,
      "targetElement": "系统",
      "eventType": "auto_submit",
      "value": "{\"reason\":\"timeout\",\"hasAnswer\":false}",
      "time": "2025-11-22 10:44:00"
    },
    {
      "code": 4,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "page_05_q3_trend",
      "time": "2025-11-22 10:44:00"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "问题3：随着菟丝子提取液浓度的增加，薇甘菊种子发芽率呈现出怎样的变化趋势？",
      "value": "超时未回答"
    }
  ]
}
```

---

### 样例 6: `page_06_q4_conc` (1.7) - 混合题页（最后一页）

**场景**: 进入页面 → 回答Q4a判断题 → 输入Q4b理由 → 提交

```json
{
  "pageNumber": "1.7",
  "pageDesc": "[flow-g8-experiment-2024/g8-mikania-experiment/1] 结论",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "page_06_q4_conc",
      "time": "2025-11-22 10:05:00"
    },
    {
      "code": 2,
      "targetElement": "P1.7_Q4a_菟丝子有效性",
      "eventType": "radio_select",
      "value": "是",
      "time": "2025-11-22 10:05:10"
    },
    {
      "code": 3,
      "targetElement": "P1.7_Q4b_结论理由",
      "eventType": "input_focus",
      "value": "",
      "time": "2025-11-22 10:05:15"
    },
    {
      "code": 4,
      "targetElement": "P1.7_Q4b_结论理由",
      "eventType": "input_change",
      "value": "{\"prev\":\"\",\"next\":\"菟丝子提取物能显著抑制薇甘菊种子的发芽\"}",
      "time": "2025-11-22 10:05:30"
    },
    {
      "code": 5,
      "targetElement": "P1.7_Q4b_结论理由",
      "eventType": "input_blur",
      "value": "菟丝子提取物能显著抑制薇甘菊种子的发芽",
      "time": "2025-11-22 10:05:35"
    },
    {
      "code": 6,
      "targetElement": "提交按钮",
      "eventType": "next_click",
      "value": "submit_final",
      "time": "2025-11-22 10:05:40"
    },
    {
      "code": 7,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "page_06_q4_conc",
      "time": "2025-11-22 10:05:40"
    },
    {
      "code": 8,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-mikania-experiment\",\"stepIndex\":1,\"pageId\":\"page_06_q4_conc\"}",
      "time": "2025-11-22 10:05:40"
    },
    {
      "code": 9,
      "targetElement": "系统",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":110}",
      "time": "2025-11-22 10:05:40"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "问题4a：菟丝子能否有效防治薇甘菊？",
      "value": "A. 是"
    },
    {
      "code": 2,
      "targetElement": "问题4b：请说明你的理由",
      "value": "菟丝子提取物能显著抑制薇甘菊种子的发芽"
    }
  ],
  "beginTime": "2025-11-22 10:05:00",
  "endTime": "2025-11-22 10:05:40",
  "imgList": []
}
```

**关键点**:
- 双重答案：Q4a 判断题 + Q4b 输入题
- Q4b 必须 ≥10字符
- 最后一页按钮为"提交"而非"下一步"

**阻断场景快照** (仅填写Q4a，Q4b为空):
```json
{
  "pageNumber": "1.7",
  "pageDesc": "[flow-g8-experiment-2024/g8-mikania-experiment/1] 结论",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "page_06_q4_conc",
      "time": "2025-11-22 10:05:00"
    },
    {
      "code": 2,
      "targetElement": "P1.7_Q4a_菟丝子有效性",
      "eventType": "radio_select",
      "value": "是",
      "time": "2025-11-22 10:05:10"
    },
    {
      "code": 3,
      "targetElement": "提交按钮",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"validation_failed\",\"missing\":[\"Q4b_结论理由\"]}",
      "time": "2025-11-22 10:05:15"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "问题4a：菟丝子能否有效防治薇甘菊？",
      "value": "A. 是"
    }
  ]
}
```

**阻断场景快照** (两者都未填写):
```json
{
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "page_06_q4_conc",
      "time": "2025-11-22 10:05:00"
    },
    {
      "code": 2,
      "targetElement": "提交按钮",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"validation_failed\",\"missing\":[\"Q4a_菟丝子有效性\",\"Q4b_结论理由\"]}",
      "time": "2025-11-22 10:05:05"
    }
  ],
  "answerList": []
}
```

---

## 3. 验证/测试计划

### 3.1 快照/Fixture 对照

为以下页面创建快照测试，对照上述样例：

| 页面 | 快照文件 | 测试重点 | 对应样例 |
|------|---------|---------|---------|
| `page_00_notice` | `snapshots/page_00_notice.json` | checkbox_check、NO timer_*、flow_context/page_submit_success | 样例1 |
| `page_00_notice` (阻断) | `snapshots/page_00_notice_blocked.json` | click_blocked含missing列表 | 样例1阻断 |
| `page_02_step_q1` | `snapshots/page_02_step_q1.json` | input_focus/change/delete/blur完整链、prev/next结构 | 样例2 |
| `page_02_step_q1` (阻断) | `snapshots/page_02_step_q1_blocked.json` | 输入<5字符阻断 | 样例2阻断 |
| `page_03_sim_exp` | `snapshots/page_03_sim_exp.json` | simulation_*完整、实验历史JSON | 样例3 |
| `page_03_sim_exp` (阻断) | `snapshots/page_03_sim_exp_blocked.json` | 未完成实验阻断 | 样例3阻断 |
| `page_04_q2_data` | `snapshots/page_04_q2_data.json` | radio_select事件 | 样例4 |
| `page_04_q2_data` (阻断) | `snapshots/page_04_q2_data_blocked.json` | 未选择阻断 | 样例4阻断 |
| `page_05_q3_trend` (超时有答案) | `snapshots/page_05_q3_trend_timeout.json` | timer_complete、auto_submit、auto:true | 样例5 |
| `page_05_q3_trend` (超时无答案) | `snapshots/page_05_q3_trend_timeout_no_answer.json` | 补齐"超时未回答" | 样例5超时无答案 |
| `page_06_q4_conc` | `snapshots/page_06_q4_conc.json` | 双答案、radio+input混合 | 样例6 |
| `page_06_q4_conc` (阻断Q4b) | `snapshots/page_06_q4_conc_blocked_q4b.json` | Q4b缺失阻断 | 样例6阻断1 |
| `page_06_q4_conc` (阻断全部) | `snapshots/page_06_q4_conc_blocked_all.json` | 两者都缺失阻断 | 样例6阻断2 |

### 3.2 历史数据兼容/清洗

**兼容性风险**: **BREAKING** - pageNumber 格式从旧的纯数字（如 `"3"`）改为组合页码（如 `"<stepIndex>.3"`），targetElement 前缀同步变更。

**清洗方案**:
1. 后端需支持解析两种 pageNumber 格式（旧格式 `"N"` vs 新格式 `"stepIndex.N"`）
2. 前端迁移后只输出新格式，旧数据通过后端转换查询时兼容
3. 可选：提供数据迁移脚本，批量更新历史 MarkObject 中的 pageNumber/targetElement 前缀

### 3.3 守卫与规则

#### Schema 校验守卫
- **字段完整性**: 验证 pageNumber 格式 `^\d+\.\d+$`，pageDesc 含前缀 `^\[.*\] `（有 Flow 时）
- **事件枚举**: eventType 必须在允许列表内（含 input_focus/blur/delete、select_change、timer_*、simulation_*）
- **answerList.targetElement**: 必须是完整问题文本（不可使用题目ID），参考 `docs/submodule-submission-guidelines.md` 第16-97行
- **answerList.value**: 单选题必须包含选项标签（如 `"A. 选项内容"`），多选题/输入题按规范保留完整内容
- **code 连续性**: operationList/answerList 的 code 从 1 递增无跳号
- **时间格式**: `YYYY-MM-DD HH:mm:ss`

#### 最小事件集合检查
每页必须包含：
- **基础**: `page_enter` + `page_exit` + `next_click`（或最后一页的提交等效）
- **输入页** (page_02, page_06): 至少有 1 个 input_focus/change/blur 序列
- **选择页** (page_04, page_05, page_06 Q4a): 至少有 1 个 radio_select（现有实现）
- **阻断页**: 若校验失败需有 `click_blocked`，value 含 `missing` 数组
- **倒计时页** (page_00): 本地倒计时逻辑，不需要 timer_start/complete（仅超时场景需要 timer_complete + auto_submit）
- **实验页** (page_03): 需有 simulation_timing_started + simulation_run_result

#### targetElement 前缀/事件合规 Lint
- **operationList 前缀规则**: 所有交互事件的 targetElement 以 `P<pageNumber>_` 开头（如 `P1.3_Q1`），禁止 `M*` 或单数字前缀；answerList 使用完整问题文本
- **事件绑定**: 输入框必须产生 input_* 事件，选择器必须产生 select_change/radio_select
- **禁止项**: 禁止手写 pageNumber、禁止直接 `fetch /stu/saveHcMark`、禁止绕过 usePageSubmission

---

## 4. 迁移落地步骤

### Step 1: 更新数据构建逻辑
- [x] 调整 `Component.jsx` 中的 `buildMark()`:
  - 使用 `encodeCompositePageNum(stepIndex, subPageNum)` 生成 pageNumber
  - pageDesc 添加 `[flowId/submoduleId/stepIndex]` 前缀
  - targetElement 使用组合页码前缀

### Step 2: 补全事件埋点
- [ ] `Page00_Notice.jsx`: 本地倒计时无需 timer_*（与统一 timer 无关）
- [ ] `Page02_Step_Q1.jsx`: 添加 input_focus/blur/delete
- [ ] `Page03_Sim_Exp.jsx`: 添加 simulation_operation/timing_started/run_result，实验历史存为 Answer
- [ ] `Page04_Q2_Data.jsx`: 补全 targetElement 前缀（保留 radio_select）
- [ ] `Page05_Q3_Trend.jsx`: 补全 targetElement 前缀（保留 radio_select）
- [ ] `Page06_Q4_Conc.jsx`: Q4a 补全前缀（保留 radio_select），Q4b 补全 input_focus/blur
- [ ] 所有页面: 添加 next_click 事件（目前仅有 click）

### Step 3: 接入统一 usePageSubmission
- [ ] 移除 Component.jsx 中的 `buildMark` 手写逻辑
- [ ] 使用 `usePageSubmission({ getUserContext, getFlowContext, pageMeta, answers, operations })`
- [ ] 提交层自动注入 flow_context、page_submit_success/failed

### Step 4: 创建快照测试
- [ ] 为上述 4 个典型页面创建 JSON 快照
- [ ] 编写 Vitest 测试用例，验证 buildMark 输出符合 Schema
- [ ] CI 集成，任何格式回退导致测试失败

### Step 5: Lint 守卫
- [ ] 添加 ESLint 规则：禁止 `fetch('/stu/saveHcMark')`
- [ ] 添加自定义 Lint：检查 pageNumber 格式、targetElement 前缀、事件枚举

---

## 5. 验收标准

✅ **数据格式一致性**
- 所有页面 pageNumber 格式为 `<stepIndex>.<subPageNum>`
- pageDesc 包含 `[flowId/submoduleId/stepIndex]` 前缀（有 Flow 时）
- targetElement 前缀使用组合页码

✅ **事件完整性**
- 每页至少含 page_enter/page_exit/next_click
- 输入页含 focus/change/blur 链（可选 input_delete）
- 选择页使用 radio_select（现有实现，保留）或 checkbox_check/uncheck
- 阻断时记录 click_blocked（含 missing 列表）
- 实验页含 simulation_operation/timing_started/run_result
- 超时场景含 timer_complete/auto_submit（由统一 timer 触发）

✅ **守卫生效**
- Schema 校验通过，不合规数据被阻断
- 快照测试全部通过
- Lint 检查无违规（禁止直连接口、手写前缀）

✅ **兼容性**
- 后端能解析新旧两种 pageNumber 格式
- 历史数据查询不受影响（可选：迁移脚本完成清洗）
