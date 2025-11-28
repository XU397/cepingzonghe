# g8-drone-imaging 迁移清单与样例快照

## 1. 迁移页清单

### 1.1 页面列表

**重要说明:** 本文档假设 g8-drone-imaging 为 Flow 中第1个子模块（stepIndex=0）。实际部署时，pageNumber 将根据子模块在 Flow 中的实际位置动态计算：`pageNumber = encodeCompositePageNum(stepIndex, subPageNum)`。

| pageNumber | subPageNum | pageId | 标题/描述 | 类型 | 特殊处理 |
|------------|------------|--------|----------|------|---------|
| 0.1 | 1 | cover | 封面与注意事项确认 | 过渡页/计时 | 40秒倒计时+复选框确认;计时期间禁用复选框 |
| 0.2 | 2 | background | 背景知识介绍 | 过渡页/自动计时 | 5秒阅读计时;自动完成无需输入 |
| 0.3 | 3 | hypothesis | 问题1-控制变量理由 | 问卷/输入 | textarea,最少5字符;校验阻断 |
| 0.4 | 4 | experiment_free | 自由探索实验 | 实验/交互 | 模拟器交互;至少1次拍照;记录实验操作序列 |
| 0.5 | 5 | focal_analysis | 问题2-焦距分析 | 问卷/单选+实验 | 单选题(3选项);可继续实验操作 |
| 0.6 | 6 | height_analysis | 问题3-高度分析 | 问卷/单选+实验 | 单选题(3选项);可继续实验操作 |
| 0.7 | 7 | conclusion | 问题4-总结结论 | 问卷/复合+完成 | 单选(2选项)+textarea(最少5字符);模块完成页 |

### 1.2 特殊处理标注

**计时页面:**
- **Page01 (0.1)**: 40秒倒计时，计时期间复选框禁用，必须记录 `timer_start` 和 `timer_stop/timer_complete` 事件
- **Page02 (0.2)**: 5秒阅读计时，自动完成，记录 `timer_start`、`timer_stop` 和 `reading_complete` 事件

**阻断校验页面（必须提供 click_blocked 示例）:**
- **Page01 (0.1)**: 未勾选确认 → `click_blocked` 含 `missing: ["P0.1_确认阅读"]`
- **Page03 (0.3)**: 输入<5字符 → `click_blocked` 含 `missing: ["P0.3_控制变量理由"]`
- **Page04 (0.4)**: 未进行实验拍照 → `click_blocked` 含 `missing: ["experiment_captures"]`
- **Page05 (0.5)**: 未选择答案 → `click_blocked` 含 `missing: ["P0.5_最小GSD焦距"]`
- **Page06 (0.6)**: 未选择答案 → `click_blocked` 含 `missing: ["P0.6_GSD变化趋势"]`
- **Page07 (0.7)**: 未选择或理由<5字符 → `click_blocked` 含 `missing: ["P0.7_优先调整因素"]` 或 `["P0.7_理由说明"]`

**复杂实验操作页面:**
- **Page04 (0.4)**: 模拟器交互(高度选择、焦距调整、拍照、重置)，需完整记录所有 `simulation_operation` 操作序列
- **Page05-06 (0.5, 0.6)**: 问卷+实验并存，实验操作可选但若有操作需记录
- **Page07 (0.7)**: 展示图表，仅问卷无实验操作

### 1.3 目标元素 (targetElement) 清单

**前缀规则:** `P${pageNumber}_<业务ID>`,其中 pageNumber 格式为 `<stepIndex>.<subPageNum>`

**示例（假设 stepIndex=0）:**

| pageNumber | targetElement | 类型 | 说明 |
|------------|---------------|------|------|
| 0.1 | P0.1_确认阅读 | checkbox | 注意事项确认复选框 |
| 0.1 | P0.1_countdown | timer | 40秒倒计时 |
| 0.2 | P0.2_reading_timer | timer | 5秒阅读计时 |
| 0.3 | P0.3_控制变量理由 | textarea | 控制变量原因输入 |
| 0.4 | P0.4_experiment_captures | json | 实验拍照历史(JSON字符串) |
| 0.5 | P0.5_最小GSD焦距 | radio | 焦距分析单选题 |
| 0.6 | P0.6_GSD变化趋势 | radio | 高度分析单选题 |
| 0.7 | P0.7_优先调整因素 | radio | 优先调整因素单选题 |
| 0.7 | P0.7_理由说明 | textarea | 理由说明输入 |

**系统元素:**
- `page`: 页面级事件（page_enter, page_exit, reading_complete等）
- `module`: 模块级事件（flow_context, auto_submit, page_submit_success等）
- `next_button`: 导航按钮事件
- `capture_button`: 拍照按钮
- `reset_button`: 重置按钮

**注意:** 旧实现使用 `P1_`、`P3_` 等前缀，迁移时需替换为 `P0.1_`、`P0.3_` 等新格式。

### 1.4 pageDesc 格式规范

所有 MarkObject 的 `pageDesc` 字段必须遵循以下格式：

```
[{flowId}/{submoduleId}/{stepIndex}] {页面标题}
```

**注意:** stepIndex 直接使用数字，不带 "step" 前缀。

**示例（假设 stepIndex=0）:**
- `[g8-assessment-flow/g8-drone-imaging/0] 封面与注意事项确认`
- `[g8-assessment-flow/g8-drone-imaging/0] 背景知识介绍`
- `[g8-assessment-flow/g8-drone-imaging/0] 问题1-控制变量理由`

---

## 2. 样例快照 (期望 MarkObject)

### 2.1 样例1: Page01_Cover (计时+确认页) - 正常完成

**场景:** 用户进入页面，等待40秒倒计时，勾选确认，点击"下一页"成功提交

```json
{
  "pageNumber": "0.1",
  "pageDesc": "[g8-assessment-flow/g8-drone-imaging/0] 封面与注意事项确认",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "Page01_Cover",
      "time": "2025-01-15 10:00:00"
    },
    {
      "code": 2,
      "targetElement": "module",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"cover\"}",
      "time": "2025-01-15 10:00:00"
    },
    {
      "code": 3,
      "targetElement": "P0.1_countdown",
      "eventType": "timer_start",
      "value": "{\"duration\":40,\"unit\":\"seconds\"}",
      "time": "2025-01-15 10:00:00"
    },
    {
      "code": 4,
      "targetElement": "P0.1_countdown",
      "eventType": "timer_stop",
      "value": "{\"reason\":\"countdown_finished\",\"elapsed\":40}",
      "time": "2025-01-15 10:00:40"
    },
    {
      "code": 5,
      "targetElement": "P0.1_确认阅读",
      "eventType": "checkbox_check",
      "value": "checked",
      "time": "2025-01-15 10:00:42"
    },
    {
      "code": 6,
      "targetElement": "next_button",
      "eventType": "next_click",
      "value": "navigate_to_background",
      "time": "2025-01-15 10:00:45"
    },
    {
      "code": 7,
      "targetElement": "page",
      "eventType": "page_exit",
      "value": "Page01_Cover",
      "time": "2025-01-15 10:00:45"
    },
    {
      "code": 8,
      "targetElement": "module",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":45000,\"channel\":\"flow\"}",
      "time": "2025-01-15 10:00:45"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.1_确认阅读",
      "value": "已确认"
    }
  ],
  "beginTime": "2025-01-15 10:00:00",
  "endTime": "2025-01-15 10:00:45",
  "imgList": []
}
```

### 2.2 样例1-阻断: Page01_Cover - 未勾选确认

**场景:** 用户等待计时完成但未勾选确认框就点击下一步

```json
{
  "pageNumber": "0.1",
  "pageDesc": "[g8-assessment-flow/g8-drone-imaging/0] 封面与注意事项确认",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "Page01_Cover",
      "time": "2025-01-15 10:00:00"
    },
    {
      "code": 2,
      "targetElement": "module",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"cover\"}",
      "time": "2025-01-15 10:00:00"
    },
    {
      "code": 3,
      "targetElement": "P0.1_countdown",
      "eventType": "timer_start",
      "value": "{\"duration\":40,\"unit\":\"seconds\"}",
      "time": "2025-01-15 10:00:00"
    },
    {
      "code": 4,
      "targetElement": "P0.1_countdown",
      "eventType": "timer_stop",
      "value": "{\"reason\":\"countdown_finished\",\"elapsed\":40}",
      "time": "2025-01-15 10:00:40"
    },
    {
      "code": 5,
      "targetElement": "next_button",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"checkbox_not_checked\",\"missing\":[\"P0.1_确认阅读\"]}",
      "time": "2025-01-15 10:00:42"
    }
  ],
  "answerList": [],
  "beginTime": "2025-01-15 10:00:00",
  "endTime": "2025-01-15 10:00:42",
  "imgList": []
}
```

---

### 2.3 样例2: Page02_Background (阅读计时页) - 正常完成

**场景:** 用户进入页面，阅读5秒后自动允许继续

```json
{
  "pageNumber": "0.2",
  "pageDesc": "[g8-assessment-flow/g8-drone-imaging/0] 背景知识介绍",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "Page02_Background",
      "time": "2025-01-15 10:01:00"
    },
    {
      "code": 2,
      "targetElement": "module",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"background\"}",
      "time": "2025-01-15 10:01:00"
    },
    {
      "code": 3,
      "targetElement": "P0.2_reading_timer",
      "eventType": "timer_start",
      "value": "{\"duration\":5,\"unit\":\"seconds\"}",
      "time": "2025-01-15 10:01:00"
    },
    {
      "code": 4,
      "targetElement": "P0.2_reading_timer",
      "eventType": "timer_stop",
      "value": "{\"reason\":\"reading_time_finished\",\"elapsed\":5}",
      "time": "2025-01-15 10:01:05"
    },
    {
      "code": 5,
      "targetElement": "page",
      "eventType": "reading_complete",
      "value": "Page02_Background",
      "time": "2025-01-15 10:01:05"
    },
    {
      "code": 6,
      "targetElement": "next_button",
      "eventType": "next_click",
      "value": "navigate_to_hypothesis",
      "time": "2025-01-15 10:01:08"
    },
    {
      "code": 7,
      "targetElement": "page",
      "eventType": "page_exit",
      "value": "Page02_Background",
      "time": "2025-01-15 10:01:08"
    },
    {
      "code": 8,
      "targetElement": "module",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":8000,\"channel\":\"flow\"}",
      "time": "2025-01-15 10:01:08"
    }
  ],
  "answerList": [],
  "beginTime": "2025-01-15 10:01:00",
  "endTime": "2025-01-15 10:01:08",
  "imgList": []
}
```

---

### 2.4 样例3: Page03_Hypothesis (输入页) - 正常完成

**场景:** 用户进入页面，多次输入/修改文本（含删除操作），最终提交

```json
{
  "pageNumber": "0.3",
  "pageDesc": "[g8-assessment-flow/g8-drone-imaging/0] 问题1-控制变量理由",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "Page03_Hypothesis",
      "time": "2025-01-15 10:02:00"
    },
    {
      "code": 2,
      "targetElement": "module",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"hypothesis\"}",
      "time": "2025-01-15 10:02:00"
    },
    {
      "code": 3,
      "targetElement": "P0.3_控制变量理由",
      "eventType": "input_focus",
      "value": "",
      "time": "2025-01-15 10:02:05"
    },
    {
      "code": 4,
      "targetElement": "P0.3_控制变量理由",
      "eventType": "input_change",
      "value": "{\"prev\":\"\",\"next\":\"为了\"}",
      "time": "2025-01-15 10:02:06"
    },
    {
      "code": 5,
      "targetElement": "P0.3_控制变量理由",
      "eventType": "input_change",
      "value": "{\"prev\":\"为了\",\"next\":\"为了确保实验结果\"}",
      "time": "2025-01-15 10:02:10"
    },
    {
      "code": 6,
      "targetElement": "P0.3_控制变量理由",
      "eventType": "input_delete",
      "value": "{\"action\":\"delete\",\"prevLength\":8,\"nextLength\":5}",
      "time": "2025-01-15 10:02:12"
    },
    {
      "code": 7,
      "targetElement": "P0.3_控制变量理由",
      "eventType": "input_change",
      "value": "{\"prev\":\"为了确保\",\"next\":\"为了确保实验的准确性和可靠性,需要控制无关变量\"}",
      "time": "2025-01-15 10:02:20"
    },
    {
      "code": 8,
      "targetElement": "P0.3_控制变量理由",
      "eventType": "input_blur",
      "value": "为了确保实验的准确性和可靠性,需要控制无关变量",
      "time": "2025-01-15 10:02:25"
    },
    {
      "code": 9,
      "targetElement": "next_button",
      "eventType": "next_click",
      "value": "navigate_to_experiment",
      "time": "2025-01-15 10:02:30"
    },
    {
      "code": 10,
      "targetElement": "page",
      "eventType": "page_exit",
      "value": "Page03_Hypothesis",
      "time": "2025-01-15 10:02:30"
    },
    {
      "code": 11,
      "targetElement": "module",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":30000,\"channel\":\"flow\"}",
      "time": "2025-01-15 10:02:30"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.3_控制变量理由",
      "value": "为了确保实验的准确性和可靠性,需要控制无关变量"
    }
  ],
  "beginTime": "2025-01-15 10:02:00",
  "endTime": "2025-01-15 10:02:30",
  "imgList": []
}
```

### 2.5 样例3-阻断: Page03_Hypothesis - 输入不足5字符

**场景:** 用户输入少于5字符就尝试提交

```json
{
  "pageNumber": "0.3",
  "pageDesc": "[g8-assessment-flow/g8-drone-imaging/0] 问题1-控制变量理由",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "Page03_Hypothesis",
      "time": "2025-01-15 10:02:00"
    },
    {
      "code": 2,
      "targetElement": "module",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"hypothesis\"}",
      "time": "2025-01-15 10:02:00"
    },
    {
      "code": 3,
      "targetElement": "P0.3_控制变量理由",
      "eventType": "input_focus",
      "value": "",
      "time": "2025-01-15 10:02:05"
    },
    {
      "code": 4,
      "targetElement": "P0.3_控制变量理由",
      "eventType": "input_change",
      "value": "{\"prev\":\"\",\"next\":\"为了\"}",
      "time": "2025-01-15 10:02:06"
    },
    {
      "code": 5,
      "targetElement": "P0.3_控制变量理由",
      "eventType": "input_blur",
      "value": "为了",
      "time": "2025-01-15 10:02:08"
    },
    {
      "code": 6,
      "targetElement": "next_button",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"input_too_short\",\"missing\":[\"P0.3_控制变量理由\"],\"currentLength\":2,\"requiredLength\":5}",
      "time": "2025-01-15 10:02:10"
    }
  ],
  "answerList": [],
  "beginTime": "2025-01-15 10:02:00",
  "endTime": "2025-01-15 10:02:10",
  "imgList": []
}
```

---

### 2.6 样例4: Page04_ExperimentFree (自由实验页) - 正常完成

**场景:** 用户进行模拟实验操作（选择高度、调整焦距、拍照、重置、再次拍照）

```json
{
  "pageNumber": "0.4",
  "pageDesc": "[g8-assessment-flow/g8-drone-imaging/0] 自由探索实验",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "Page04_ExperimentFree",
      "time": "2025-01-15 10:03:00"
    },
    {
      "code": 2,
      "targetElement": "module",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"experiment_free\"}",
      "time": "2025-01-15 10:03:00"
    },
    {
      "code": 3,
      "targetElement": "height_selector",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"set_height\",\"value\":100}",
      "time": "2025-01-15 10:03:05"
    },
    {
      "code": 4,
      "targetElement": "focal_selector",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"set_focal\",\"value\":24}",
      "time": "2025-01-15 10:03:08"
    },
    {
      "code": 5,
      "targetElement": "capture_button",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"capture\",\"height\":100,\"focalLength\":24,\"gsd\":1.00}",
      "time": "2025-01-15 10:03:10"
    },
    {
      "code": 6,
      "targetElement": "height_selector",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"set_height\",\"value\":200}",
      "time": "2025-01-15 10:03:15"
    },
    {
      "code": 7,
      "targetElement": "focal_selector",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"set_focal\",\"value\":50}",
      "time": "2025-01-15 10:03:18"
    },
    {
      "code": 8,
      "targetElement": "capture_button",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"capture\",\"height\":200,\"focalLength\":50,\"gsd\":0.96}",
      "time": "2025-01-15 10:03:20"
    },
    {
      "code": 9,
      "targetElement": "reset_button",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"reset_experiment\"}",
      "time": "2025-01-15 10:03:25"
    },
    {
      "code": 10,
      "targetElement": "height_selector",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"set_height\",\"value\":300}",
      "time": "2025-01-15 10:03:30"
    },
    {
      "code": 11,
      "targetElement": "capture_button",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"capture\",\"height\":300,\"focalLength\":8,\"gsd\":9.04}",
      "time": "2025-01-15 10:03:35"
    },
    {
      "code": 12,
      "targetElement": "next_button",
      "eventType": "next_click",
      "value": "navigate_to_focal_analysis",
      "time": "2025-01-15 10:03:40"
    },
    {
      "code": 13,
      "targetElement": "page",
      "eventType": "page_exit",
      "value": "Page04_ExperimentFree",
      "time": "2025-01-15 10:03:40"
    },
    {
      "code": 14,
      "targetElement": "module",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":40000,\"channel\":\"flow\"}",
      "time": "2025-01-15 10:03:40"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.4_experiment_captures",
      "value": "[{\"height\":100,\"focalLength\":24,\"gsd\":1.00,\"timestamp\":\"2025-01-15 10:03:10\"},{\"height\":200,\"focalLength\":50,\"gsd\":0.96,\"timestamp\":\"2025-01-15 10:03:20\"},{\"height\":300,\"focalLength\":8,\"gsd\":9.04,\"timestamp\":\"2025-01-15 10:03:35\"}]"
    }
  ],
  "beginTime": "2025-01-15 10:03:00",
  "endTime": "2025-01-15 10:03:40",
  "imgList": []
}
```

### 2.7 样例4-阻断: Page04_ExperimentFree - 未进行实验

**场景:** 用户进入页面但未进行任何拍照就尝试提交

```json
{
  "pageNumber": "0.4",
  "pageDesc": "[g8-assessment-flow/g8-drone-imaging/0] 自由探索实验",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "Page04_ExperimentFree",
      "time": "2025-01-15 10:03:00"
    },
    {
      "code": 2,
      "targetElement": "module",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"experiment_free\"}",
      "time": "2025-01-15 10:03:00"
    },
    {
      "code": 3,
      "targetElement": "height_selector",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"set_height\",\"value\":100}",
      "time": "2025-01-15 10:03:05"
    },
    {
      "code": 4,
      "targetElement": "focal_selector",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"set_focal\",\"value\":24}",
      "time": "2025-01-15 10:03:08"
    },
    {
      "code": 5,
      "targetElement": "next_button",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"no_experiment_capture\",\"missing\":[\"experiment_captures\"]}",
      "time": "2025-01-15 10:03:10"
    }
  ],
  "answerList": [],
  "beginTime": "2025-01-15 10:03:00",
  "endTime": "2025-01-15 10:03:10",
  "imgList": []
}
```

---

### 2.8 样例5: Page05_FocalAnalysis (问卷+实验页) - 正常完成

**场景:** 用户回答问题并选择选项（可选进行实验）

```json
{
  "pageNumber": "0.5",
  "pageDesc": "[g8-assessment-flow/g8-drone-imaging/0] 问题2-焦距分析",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "Page05_FocalAnalysis",
      "time": "2025-01-15 10:04:00"
    },
    {
      "code": 2,
      "targetElement": "module",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"focal_analysis\"}",
      "time": "2025-01-15 10:04:00"
    },
    {
      "code": 3,
      "targetElement": "height_selector",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"set_height\",\"value\":100}",
      "time": "2025-01-15 10:04:05"
    },
    {
      "code": 4,
      "targetElement": "focal_selector",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"set_focal\",\"value\":50}",
      "time": "2025-01-15 10:04:08"
    },
    {
      "code": 5,
      "targetElement": "capture_button",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"capture\",\"height\":100,\"focalLength\":50,\"gsd\":0.48}",
      "time": "2025-01-15 10:04:10"
    },
    {
      "code": 6,
      "targetElement": "P0.5_最小GSD焦距",
      "eventType": "radio_select",
      "value": "C",
      "time": "2025-01-15 10:04:15"
    },
    {
      "code": 7,
      "targetElement": "next_button",
      "eventType": "next_click",
      "value": "navigate_to_height_analysis",
      "time": "2025-01-15 10:04:20"
    },
    {
      "code": 8,
      "targetElement": "page",
      "eventType": "page_exit",
      "value": "Page05_FocalAnalysis",
      "time": "2025-01-15 10:04:20"
    },
    {
      "code": 9,
      "targetElement": "module",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":20000,\"channel\":\"flow\"}",
      "time": "2025-01-15 10:04:20"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.5_最小GSD焦距",
      "value": "C"
    }
  ],
  "beginTime": "2025-01-15 10:04:00",
  "endTime": "2025-01-15 10:04:20",
  "imgList": []
}
```

### 2.9 样例5-阻断: Page05_FocalAnalysis - 未选择答案

**场景:** 用户未选择任何选项就尝试提交

```json
{
  "pageNumber": "0.5",
  "pageDesc": "[g8-assessment-flow/g8-drone-imaging/0] 问题2-焦距分析",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "Page05_FocalAnalysis",
      "time": "2025-01-15 10:04:00"
    },
    {
      "code": 2,
      "targetElement": "module",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"focal_analysis\"}",
      "time": "2025-01-15 10:04:00"
    },
    {
      "code": 3,
      "targetElement": "next_button",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"no_selection\",\"missing\":[\"P0.5_最小GSD焦距\"]}",
      "time": "2025-01-15 10:04:05"
    }
  ],
  "answerList": [],
  "beginTime": "2025-01-15 10:04:00",
  "endTime": "2025-01-15 10:04:05",
  "imgList": []
}
```

---

### 2.10 样例6: Page06_HeightAnalysis (问卷+实验页) - 正常完成

**场景:** 用户回答问题并选择选项

```json
{
  "pageNumber": "0.6",
  "pageDesc": "[g8-assessment-flow/g8-drone-imaging/0] 问题3-高度分析",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "Page06_HeightAnalysis",
      "time": "2025-01-15 10:05:00"
    },
    {
      "code": 2,
      "targetElement": "module",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"height_analysis\"}",
      "time": "2025-01-15 10:05:00"
    },
    {
      "code": 3,
      "targetElement": "P0.6_GSD变化趋势",
      "eventType": "radio_select",
      "value": "A",
      "time": "2025-01-15 10:05:05"
    },
    {
      "code": 4,
      "targetElement": "next_button",
      "eventType": "next_click",
      "value": "navigate_to_conclusion",
      "time": "2025-01-15 10:05:10"
    },
    {
      "code": 5,
      "targetElement": "page",
      "eventType": "page_exit",
      "value": "Page06_HeightAnalysis",
      "time": "2025-01-15 10:05:10"
    },
    {
      "code": 6,
      "targetElement": "module",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":10000,\"channel\":\"flow\"}",
      "time": "2025-01-15 10:05:10"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.6_GSD变化趋势",
      "value": "A"
    }
  ],
  "beginTime": "2025-01-15 10:05:00",
  "endTime": "2025-01-15 10:05:10",
  "imgList": []
}
```

### 2.11 样例6-阻断: Page06_HeightAnalysis - 未选择答案

**场景:** 用户未选择任何选项就尝试提交

```json
{
  "pageNumber": "0.6",
  "pageDesc": "[g8-assessment-flow/g8-drone-imaging/0] 问题3-高度分析",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "Page06_HeightAnalysis",
      "time": "2025-01-15 10:05:00"
    },
    {
      "code": 2,
      "targetElement": "module",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"height_analysis\"}",
      "time": "2025-01-15 10:05:00"
    },
    {
      "code": 3,
      "targetElement": "next_button",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"no_selection\",\"missing\":[\"P0.6_GSD变化趋势\"]}",
      "time": "2025-01-15 10:05:05"
    }
  ],
  "answerList": [],
  "beginTime": "2025-01-15 10:05:00",
  "endTime": "2025-01-15 10:05:05",
  "imgList": []
}
```

---

### 2.12 样例7: Page07_Conclusion (复合问卷+完成页) - 正常完成

**场景:** 用户选择单选并输入理由说明

```json
{
  "pageNumber": "0.7",
  "pageDesc": "[g8-assessment-flow/g8-drone-imaging/0] 问题4-总结结论",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "Page07_Conclusion",
      "time": "2025-01-15 10:06:00"
    },
    {
      "code": 2,
      "targetElement": "module",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"conclusion\"}",
      "time": "2025-01-15 10:06:00"
    },
    {
      "code": 3,
      "targetElement": "P0.7_优先调整因素",
      "eventType": "radio_select",
      "value": "B",
      "time": "2025-01-15 10:06:05"
    },
    {
      "code": 4,
      "targetElement": "P0.7_理由说明",
      "eventType": "input_focus",
      "value": "",
      "time": "2025-01-15 10:06:08"
    },
    {
      "code": 5,
      "targetElement": "P0.7_理由说明",
      "eventType": "input_change",
      "value": "{\"prev\":\"\",\"next\":\"根据图表数据\"}",
      "time": "2025-01-15 10:06:10"
    },
    {
      "code": 6,
      "targetElement": "P0.7_理由说明",
      "eventType": "input_change",
      "value": "{\"prev\":\"根据图表数据\",\"next\":\"根据图表数据，调整镜头焦距对GSD的影响更大，能更有效降低GSD值\"}",
      "time": "2025-01-15 10:06:20"
    },
    {
      "code": 7,
      "targetElement": "P0.7_理由说明",
      "eventType": "input_blur",
      "value": "根据图表数据，调整镜头焦距对GSD的影响更大，能更有效降低GSD值",
      "time": "2025-01-15 10:06:25"
    },
    {
      "code": 8,
      "targetElement": "next_button",
      "eventType": "next_click",
      "value": "experiment_complete",
      "time": "2025-01-15 10:06:30"
    },
    {
      "code": 9,
      "targetElement": "page",
      "eventType": "page_exit",
      "value": "Page07_Conclusion",
      "time": "2025-01-15 10:06:30"
    },
    {
      "code": 10,
      "targetElement": "module",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":30000,\"channel\":\"flow\",\"isModuleComplete\":true}",
      "time": "2025-01-15 10:06:30"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.7_优先调整因素",
      "value": "B"
    },
    {
      "code": 2,
      "targetElement": "P0.7_理由说明",
      "value": "根据图表数据，调整镜头焦距对GSD的影响更大，能更有效降低GSD值"
    }
  ],
  "beginTime": "2025-01-15 10:06:00",
  "endTime": "2025-01-15 10:06:30",
  "imgList": []
}
```

### 2.13 样例7-阻断A: Page07_Conclusion - 未选择单选

**场景:** 用户仅输入理由但未选择单选选项

```json
{
  "pageNumber": "0.7",
  "pageDesc": "[g8-assessment-flow/g8-drone-imaging/0] 问题4-总结结论",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "Page07_Conclusion",
      "time": "2025-01-15 10:06:00"
    },
    {
      "code": 2,
      "targetElement": "module",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"conclusion\"}",
      "time": "2025-01-15 10:06:00"
    },
    {
      "code": 3,
      "targetElement": "P0.7_理由说明",
      "eventType": "input_focus",
      "value": "",
      "time": "2025-01-15 10:06:05"
    },
    {
      "code": 4,
      "targetElement": "P0.7_理由说明",
      "eventType": "input_change",
      "value": "{\"prev\":\"\",\"next\":\"调整镜头焦距效果更好\"}",
      "time": "2025-01-15 10:06:10"
    },
    {
      "code": 5,
      "targetElement": "P0.7_理由说明",
      "eventType": "input_blur",
      "value": "调整镜头焦距效果更好",
      "time": "2025-01-15 10:06:12"
    },
    {
      "code": 6,
      "targetElement": "next_button",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"validation_failed\",\"missing\":[\"P0.7_优先调整因素\"]}",
      "time": "2025-01-15 10:06:15"
    }
  ],
  "answerList": [],
  "beginTime": "2025-01-15 10:06:00",
  "endTime": "2025-01-15 10:06:15",
  "imgList": []
}
```

### 2.14 样例7-阻断B: Page07_Conclusion - 理由不足5字符

**场景:** 用户选择了单选但理由少于5字符

```json
{
  "pageNumber": "0.7",
  "pageDesc": "[g8-assessment-flow/g8-drone-imaging/0] 问题4-总结结论",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "Page07_Conclusion",
      "time": "2025-01-15 10:06:00"
    },
    {
      "code": 2,
      "targetElement": "module",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"conclusion\"}",
      "time": "2025-01-15 10:06:00"
    },
    {
      "code": 3,
      "targetElement": "P0.7_优先调整因素",
      "eventType": "radio_select",
      "value": "B",
      "time": "2025-01-15 10:06:05"
    },
    {
      "code": 4,
      "targetElement": "P0.7_理由说明",
      "eventType": "input_focus",
      "value": "",
      "time": "2025-01-15 10:06:08"
    },
    {
      "code": 5,
      "targetElement": "P0.7_理由说明",
      "eventType": "input_change",
      "value": "{\"prev\":\"\",\"next\":\"更好\"}",
      "time": "2025-01-15 10:06:10"
    },
    {
      "code": 6,
      "targetElement": "P0.7_理由说明",
      "eventType": "input_blur",
      "value": "更好",
      "time": "2025-01-15 10:06:12"
    },
    {
      "code": 7,
      "targetElement": "next_button",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"validation_failed\",\"missing\":[\"P0.7_理由说明\"],\"currentLength\":2,\"requiredLength\":5}",
      "time": "2025-01-15 10:06:15"
    }
  ],
  "answerList": [],
  "beginTime": "2025-01-15 10:06:00",
  "endTime": "2025-01-15 10:06:15",
  "imgList": []
}
```

---

### 2.15 样例8: 模块级超时自动提交

**场景:** 用户在 Page03 时模块计时器到期，系统自动提交所有已完成页答案并填充占位值

```json
{
  "pageNumber": "0.3",
  "pageDesc": "[g8-assessment-flow/g8-drone-imaging/0] 问题1-控制变量理由（超时自动提交）",
  "operationList": [
    {
      "code": 1,
      "targetElement": "page",
      "eventType": "page_enter",
      "value": "Page03_Hypothesis",
      "time": "2025-01-15 10:20:00"
    },
    {
      "code": 2,
      "targetElement": "module",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"hypothesis\"}",
      "time": "2025-01-15 10:20:00"
    },
    {
      "code": 3,
      "targetElement": "P0.3_控制变量理由",
      "eventType": "input_focus",
      "value": "",
      "time": "2025-01-15 10:20:05"
    },
    {
      "code": 4,
      "targetElement": "P0.3_控制变量理由",
      "eventType": "input_change",
      "value": "{\"prev\":\"\",\"next\":\"为\"}",
      "time": "2025-01-15 10:20:06"
    },
    {
      "code": 5,
      "targetElement": "module",
      "eventType": "timer_complete",
      "value": "{\"reason\":\"task_timer_expired\",\"totalElapsed\":1200}",
      "time": "2025-01-15 10:20:10"
    },
    {
      "code": 6,
      "targetElement": "module",
      "eventType": "auto_submit",
      "value": "{\"reason\":\"timer_expired\",\"currentPage\":\"hypothesis\"}",
      "time": "2025-01-15 10:20:10"
    },
    {
      "code": 7,
      "targetElement": "page",
      "eventType": "page_exit",
      "value": "Page03_Hypothesis",
      "time": "2025-01-15 10:20:10"
    },
    {
      "code": 8,
      "targetElement": "module",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":10000,\"channel\":\"flow\",\"auto_submit\":true}",
      "time": "2025-01-15 10:20:10"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.1_确认阅读",
      "value": "已确认"
    },
    {
      "code": 2,
      "targetElement": "P0.3_控制变量理由",
      "value": "超时未回答"
    },
    {
      "code": 3,
      "targetElement": "P0.4_experiment_captures",
      "value": "超时未回答"
    },
    {
      "code": 4,
      "targetElement": "P0.5_最小GSD焦距",
      "value": "超时未回答"
    },
    {
      "code": 5,
      "targetElement": "P0.6_GSD变化趋势",
      "value": "超时未回答"
    },
    {
      "code": 6,
      "targetElement": "P0.7_优先调整因素",
      "value": "超时未回答"
    },
    {
      "code": 7,
      "targetElement": "P0.7_理由说明",
      "value": "超时未回答"
    }
  ],
  "beginTime": "2025-01-15 10:00:00",
  "endTime": "2025-01-15 10:20:10",
  "imgList": []
}
```

---

## 3. 快照文件清单

**存放位置:** `src/submodules/g8-drone-imaging/pages/__tests__/__snapshots__/`

### 3.1 必需快照文件

| 文件名 | 覆盖场景 | 验证重点 |
|--------|---------|---------|
| `Page01_Cover.snap.json` | 正常提交 + 未勾选阻断 | timer_start/stop, checkbox_check, click_blocked.missing |
| `Page02_Background.snap.json` | 正常阅读完成 | timer_start/stop, reading_complete |
| `Page03_Hypothesis.snap.json` | 正常输入 + 输入不足阻断 | input_focus/change/delete/blur 序列, click_blocked.missing |
| `Page04_ExperimentFree.snap.json` | 正常实验操作 + 未拍照阻断 | simulation_operation 序列, click_blocked.missing |
| `Page05_FocalAnalysis.snap.json` | 正常选择 + 未选择阻断 | radio_select, click_blocked.missing |
| `Page06_HeightAnalysis.snap.json` | 正常选择 + 未选择阻断 | radio_select, click_blocked.missing |
| `Page07_Conclusion.snap.json` | 正常提交 + 两种阻断（未选/理由不足） | radio_select, input序列, click_blocked.missing |
| `ModuleTimeout.snap.json` | 超时自动提交 | timer_complete, auto_submit, 占位答案 |

### 3.2 快照生成标准

**每个快照必须包含:**
1. 完整 operationList（从 page_enter 到 page_submit_success/failed）
2. 正确的 code 序列（从1连续递增，无重复）
3. 规范的 pageDesc 格式：`[flowId/submoduleId/stepIndex] 页面标题`
4. 正确的 targetElement 前缀：`P${pageNumber}_<业务ID>`
5. 结构化的 value 字段（timer、input_change等使用JSON格式）
6. 所有必需事件：flow_context, page_enter/exit, next_click, page_submit_success

**阻断场景快照额外要求:**
- 必须包含 `click_blocked` 事件
- value 必须为 JSON 格式，包含 `reason` 和 `missing` 数组
- missing 数组中的元素必须使用正确的 targetElement 前缀

---

## 4. 校验清单

### 4.1 Schema 校验

**所有快照必须通过以下校验:**

```typescript
// @shared/services/submission/schema.ts
- pageNumber 格式: /^\d+\.\d+$/
- targetElement 前缀: /^P\d+\.\d+_.+$/ 或系统元素（page/module/next_button等）
- eventType: 必须在 EventTypes 枚举中
- code: 从1开始连续递增，无重复
- time: "YYYY-MM-DD HH:mm:ss" 格式
- pageDesc: 必须包含 [flowId/submoduleId/stepIndex] 前缀
```

### 4.2 最小事件集合校验

**每个页面快照必须包含:**

| 事件类型 | 必需性 | 说明 |
|---------|-------|------|
| page_enter | 必需 | code=1 或最前 |
| flow_context | 必需 | code=2，紧跟 page_enter |
| page_exit | 必需 | 倒数第二或与 submit 对齐 |
| next_click | 必需（或 click_blocked） | 导航事件 |
| page_submit_success/failed | 必需 | 最后一个事件 |
| click_blocked | 校验页阻断时必需 | 含 missing 数组 |
| input_focus/change/blur | 输入页必需 | 完整序列 |
| radio_select | 单选页必需 | - |
| checkbox_check/uncheck | 复选框页必需 | - |
| timer_start/stop | 计时页必需 | - |
| simulation_operation | 实验页必需 | - |

### 4.3 answerList 校验

- 仅包含非空答案（超时占位 "超时未回答" 除外）
- 所有 targetElement 使用正确前缀
- code 从1递增
- 实验历史作为 JSON 字符串存储
- 阻断场景 answerList 为空数组

### 4.4 CI/Lint 守卫规则

**禁止项:**
1. 直连 `/stu/saveHcMark` 接口
2. 旧前缀格式（P1_, P3_ 等）
3. 未枚举的 eventType（必须使用 EventTypes 枚举）
4. 字符串字面量事件类型
5. 冒号格式页码（M1:P1 等）

**检查命令:**
```bash
# 禁止直连接口
grep -r "fetch('/stu/saveHcMark')" src/submodules/g8-drone-imaging/

# 检测旧前缀
grep -rE "P[1-7]_" src/submodules/g8-drone-imaging/

# 检测未枚举事件
grep -r "eventType:\s*['\"]" src/submodules/g8-drone-imaging/ | grep -v EventTypes
```

---

## 5. 选择事件策略说明

**本模块统一使用 `radio_select` 事件**（不使用 `select_change`）

**理由:**
- 现有实现使用 `radio_select`
- 与其他子模块（g8-mikania-experiment）保持一致
- EventTypes 枚举已包含 `radio_select`

**示例:**
```json
{
  "targetElement": "P0.5_最小GSD焦距",
  "eventType": "radio_select",
  "value": "C"
}
```

---

## 6. 迁移注意事项

### 6.1 stepIndex 动态说明

**重要:** 本文档所有示例假设 `stepIndex=0`（g8-drone-imaging 为 Flow 中第1个子模块）。

实际部署时：
- 若 g8-drone-imaging 为第2个子模块，则 `stepIndex=1`，pageNumber 为 `1.1` 至 `1.7`
- targetElement 前缀相应变为 `P1.1_`, `P1.3_` 等
- pageDesc 格式变为 `[g8-assessment-flow/g8-drone-imaging/step1] ...`

### 6.2 计时链路完整性

**Page01 计时链路:**
```
timer_start (P0.1_countdown, duration:40)
  → [用户等待40秒]
  → timer_stop (reason:countdown_finished)
  → 复选框启用
  → checkbox_check (若用户勾选)
  → next_click (若用户点击)
  → page_submit_success
```

**Page02 计时链路:**
```
timer_start (P0.2_reading_timer, duration:5)
  → [系统自动等待5秒]
  → timer_stop (reason:reading_time_finished)
  → reading_complete (page)
  → 允许继续
  → next_click
  → page_submit_success
```

**模块级超时链路:**
```
[任意页面]
  → timer_complete (module, task_timer_expired)
  → auto_submit (module, timer_expired)
  → 填充所有未答题 "超时未回答"
  → page_submit_success (auto_submit:true)
```

### 6.3 编码规范

**必须使用 UTF-8 编码（无 BOM）:**
- 所有源文件（.js, .jsx, .ts, .tsx, .css, .md, .json）
- 确保中文字符正确显示
- 使用 Write 工具默认 UTF-8 编码

**避免乱码:**
- "已确认" 而非 "已确�?"
- "超时未回答" 而非 "超时未回�?"
- "变化趋势" 而非 "变�?"

---

## 7. 总结

本迁移清单提供了 g8-drone-imaging 子模块迁移至统一提交管道的完整规范，包括：

1. ✅ **7个页面**完整列表与特殊处理说明
2. ✅ **15个样例快照**（7个正常 + 7个阻断 + 1个超时）
3. ✅ **统一 pageDesc 格式**: `[flowId/submoduleId/stepIndex] 标题`
4. ✅ **规范 targetElement 前缀**: `P${pageNumber}_<业务ID>`
5. ✅ **完整事件序列**: flow_context, timer, input, radio_select等
6. ✅ **结构化值格式**: timer/input_change/click_blocked 使用 JSON
7. ✅ **阻断场景完整覆盖**: 所有校验页都有 click_blocked 示例
8. ✅ **快照文件清单**: 8个必需快照文件及生成标准
9. ✅ **校验清单**: Schema/最小事件集/answerList/CI守卫
10. ✅ **计时链路说明**: Page01/Page02/模块超时完整流程

**下一步:** 根据本文档完善 tasks.md，逐页细化实施任务。
