# g8-pv-sand-experiment 迁移页清单与样例快照

## 1. 迁移页面清单

### 1.1 页面列表（按 subPageNum 顺序）

| pageNumber | subPageNum | pageId | 标题 | 类型 | 特殊处理 | 备注 |
|------------|------------|--------|------|------|----------|------|
| S.1 | 1 | instructions_cover | 任务C：光伏治沙封面 | 过渡/notice | 🔴 计时自动提交(30s) + 阻断校验 | 复选框确认，倒计时自动解锁 |
| S.2 | 2 | background_notice | 背景引入说明 | 过渡/notice | 🔴 计时自动提交(5s) | 自动写入 background_read=true |
| S.3 | 3 | experiment_design | 实验方案设计 | 实验/输入 | 🔴 阻断校验(≥10字符) | 输入框埋点需记录 focus/change/delete/blur |
| S.4 | 4 | tutorial_simulation | 模拟实验操作指引 | 实验/教程 | 🔴 阻断校验(tutorialCompleted) | 实验操作(高度调节/开始/重置)全记录 |
| S.5 | 5 | experiment_task1 | 实验探究-1 | 实验/单选 | 🔴 阻断校验(单选必填) | 单选 + 实验操作，记录实验数据到 experimentState |
| S.6 | 6 | experiment_task2 | 实验探究-2 | 实验/多选 | 🔴 阻断校验(至少1项) | 多选 checkbox + 实验操作 |
| S.7 | 7 | conclusion_analysis | 结论分析 | 实验/问卷 | 🔴 阻断校验(单选 + ≥10字符) | 单选 + 输入框组合 |

**说明：**
- **pageNumber 格式**：`<stepIndex>.<subPageNum>`（新规范，去除 `M` 前缀，使用 `.` 分隔）
  - **stepIndex**：子模块在 **Flow 中的位置索引**（0-based）
    - 第一个子模块：stepIndex = 0
    - 第二个子模块：stepIndex = 1
    - 第三个子模块：stepIndex = 2，以此类推
  - **subPageNum**：页面在子模块内的序号（1-based），本模块为 1-7
  - **S 占位符**：上表中的 `S` 表示 stepIndex 由 Flow 上下文动态确定，样例快照假设 stepIndex=0

**实际 pageNumber 示例：**
- 若本模块作为 Flow 第 1 个子模块（stepIndex=0）：`0.1`, `0.2`, `0.3` ... `0.7`
- 若本模块作为 Flow 第 2 个子模块（stepIndex=1）：`1.1`, `1.2`, `1.3` ... `1.7`
- 若本模块作为 Flow 第 3 个子模块（stepIndex=2）：`2.1`, `2.2`, `2.3` ... `2.7`

- **🔴 特殊处理标记**：
  - 计时自动提交：subPageNum 1 (30s 倒计时)、subPageNum 2 (5s 倒计时)
  - 阻断校验：所有页面均需在"下一页"前校验，校验失败记录 `click_blocked` 事件

### 1.2 页面类型分布
- **过渡页/notice**：2 页（instructions_cover, background_notice）
- **输入页**：2 页（experiment_design, conclusion_analysis 含输入）
- **实验操作页**：4 页（tutorial_simulation, experiment_task1, experiment_task2）
- **问卷选择页**：3 页（experiment_task1, experiment_task2, conclusion_analysis）

### 1.3 answerList 格式规范
- **targetElement 使用完整问题文本**（或实验历史等描述性标识），禁止题目ID，参考 `docs/submodule-submission-guidelines.md` 第16-97行。
- **value 填写完整选项内容**：单选/判断题包含选项标签（如 `"A. 有光伏板区风速更小"`），多选题列出所有选中选项的完整文本；输入题保留用户填写的完整文本。
- **operationList 仍使用 `P<pageNumber>_` 前缀** 追踪控件交互，answerList 与交互前缀区分。

---

## 2. 样例快照（期望 MarkObject）

**重要说明**：以下样例快照假设 **g8-pv-sand-experiment 作为 Flow 中的第 1 个子模块（stepIndex=0）**。如果实际 Flow 中该模块位于其他位置，所有 `pageNumber` 和 `targetElement` 前缀中的 stepIndex 需相应调整。

### 2.1 样例 1：过渡页（计时倒计时后手动提交）
**页面**：subPageNum=1, instructions_cover（任务封面，30s 倒计时）
**pageNumber**：`0.1`（假设 stepIndex=0）

```json
{
  "pageNumber": "0.1",
  "pageDesc": "[flow-g8-experiment-2024/g8-pv-sand-experiment/0] 任务C：光伏治沙封面",
  "operationList": [
    {
      "code": 1,
      "targetElement": "P0.1_页面",
      "eventType": "page_enter",
      "value": "instructions_cover",
      "time": "2025-11-22 10:00:00"
    },
    {
      "code": 2,
      "targetElement": "P0.1_倒计时",
      "eventType": "timer_start",
      "value": "{\"duration\":30,\"unit\":\"seconds\"}",
      "time": "2025-11-22 10:00:00"
    },
    {
      "code": 3,
      "targetElement": "P0.1_倒计时",
      "eventType": "timer_complete",
      "value": "{\"remaining\":0,\"elapsed\":30}",
      "time": "2025-11-22 10:00:30"
    },
    {
      "code": 4,
      "targetElement": "P0.1_确认复选框",
      "eventType": "checkbox_check",
      "value": "checked",
      "time": "2025-11-22 10:00:33"
    },
    {
      "code": 5,
      "targetElement": "P0.1_下一页按钮",
      "eventType": "next_click",
      "value": "navigate_to_background_notice",
      "time": "2025-11-22 10:00:35"
    },
    {
      "code": 6,
      "targetElement": "P0.1_页面",
      "eventType": "page_exit",
      "value": "instructions_cover",
      "time": "2025-11-22 10:00:35"
    },
    {
      "code": 7,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-pv-sand-experiment\",\"stepIndex\":0,\"pageId\":\"instructions_cover\"}",
      "time": "2025-11-22 10:00:35"
    },
    {
      "code": 8,
      "targetElement": "P0.1_提交",
      "eventType": "page_submit_success",
      "value": "{\"duration\":35,\"channel\":\"usePageSubmission\"}",
      "time": "2025-11-22 10:00:35"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "确认：已阅读任务C封面注意事项并勾选复选框？",
      "value": "A. 是，已阅读并确认"
    }
  ],
  "beginTime": "2025-11-22 10:00:00",
  "endTime": "2025-11-22 10:00:35",
  "imgList": []
}
```

**关键点：**
- **pageNumber**: `0.1`（stepIndex=0, subPageNum=1）
- **pageDesc**: `[flow-g8-experiment-2024/g8-pv-sand-experiment/0]` 格式为 `[flowId/submoduleId/stepIndex]`
- **targetElement 前缀**: `P0.1_...`（与 pageNumber 一致）
  - 倒计时事件：`timer_start` / `timer_complete`（value 使用结构化 JSON）
  - 复选框事件：`checkbox_check`
- **手动提交**：用户勾选确认框后点击"下一页"（有 next_click）
- **flow_context 自动注入**：由提交层自动添加，targetElement 为 "系统"，value 包含 flowId/submoduleId/stepIndex/pageId
- page_submit_success 含耗时/通道信息

---

### 2.1b 样例 1b：计时自动提交页（auto_submit）
**页面**：subPageNum=2, background_notice（背景引入，5s 倒计时自动通过）
**pageNumber**：`0.2`（假设 stepIndex=0）

```json
{
  "pageNumber": "0.2",
  "pageDesc": "[flow-g8-experiment-2024/g8-pv-sand-experiment/0] 背景引入说明",
  "operationList": [
    {
      "code": 1,
      "targetElement": "P0.2_页面",
      "eventType": "page_enter",
      "value": "background_notice",
      "time": "2025-11-22 10:01:00"
    },
    {
      "code": 2,
      "targetElement": "P0.2_倒计时",
      "eventType": "timer_start",
      "value": "{\"duration\":5,\"unit\":\"seconds\",\"autoSubmit\":true}",
      "time": "2025-11-22 10:01:00"
    },
    {
      "code": 3,
      "targetElement": "P0.2_倒计时",
      "eventType": "timer_complete",
      "value": "{\"remaining\":0,\"elapsed\":5,\"trigger\":\"auto_submit\"}",
      "time": "2025-11-22 10:01:05"
    },
    {
      "code": 4,
      "targetElement": "P0.2_系统",
      "eventType": "auto_submit",
      "value": "{\"reason\":\"timer_expired\",\"duration_seconds\":5}",
      "time": "2025-11-22 10:01:05"
    },
    {
      "code": 5,
      "targetElement": "P0.2_页面",
      "eventType": "page_exit",
      "value": "background_notice",
      "time": "2025-11-22 10:01:05"
    },
    {
      "code": 6,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-pv-sand-experiment\",\"stepIndex\":0,\"pageId\":\"background_notice\"}",
      "time": "2025-11-22 10:01:05"
    },
    {
      "code": 7,
      "targetElement": "P0.2_提交",
      "eventType": "page_submit_success",
      "value": "{\"duration\":5,\"channel\":\"usePageSubmission\",\"trigger\":\"auto\"}",
      "time": "2025-11-22 10:01:05"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "确认：已阅读背景引入说明？",
      "value": "A. 是，已阅读背景说明"
    }
  ],
  "beginTime": "2025-11-22 10:01:00",
  "endTime": "2025-11-22 10:01:05",
  "imgList": []
}
```

**关键点：**
- **pageNumber**: `0.2`（stepIndex=0, subPageNum=2）
- **自动提交链路**：`timer_start` → `timer_complete` → `auto_submit` → `page_exit` → `flow_context` → `page_submit_success`
- **无 next_click**：因为是自动提交，用户无需点击"下一页"
- `auto_submit` 事件：targetElement 为 `P0.2_系统`，value 含触发原因（timer_expired）
- `page_submit_success` 的 value 含 `trigger: "auto"` 标识自动提交

---

### 2.2 样例 2：输入页（focus/change/delete/blur 完整链路）
**页面**：subPageNum=3, experiment_design（实验方案设计，输入≥10字符）
**pageNumber**：`0.3`（假设 stepIndex=0）

```json
{
  "pageNumber": "0.3",
  "pageDesc": "[flow-g8-experiment-2024/g8-pv-sand-experiment/0] 实验方案设计",
  "operationList": [
    {
      "code": 1,
      "targetElement": "P0.3_页面",
      "eventType": "page_enter",
      "value": "experiment_design",
      "time": "2025-11-22 10:05:00"
    },
    {
      "code": 2,
      "targetElement": "P0.3_问题1输入框",
      "eventType": "input_focus",
      "value": "",
      "time": "2025-11-22 10:05:10"
    },
    {
      "code": 3,
      "targetElement": "P0.3_问题1输入框",
      "eventType": "input_change",
      "value": "{\"prev\":\"\",\"next\":\"为了对照\",\"prevLength\":0,\"nextLength\":4}",
      "time": "2025-11-22 10:05:15"
    },
    {
      "code": 4,
      "targetElement": "P0.3_问题1输入框",
      "eventType": "input_change",
      "value": "{\"prev\":\"为了对照\",\"next\":\"为了对照实验的需要\",\"prevLength\":4,\"nextLength\":9}",
      "time": "2025-11-22 10:05:20"
    },
    {
      "code": 5,
      "targetElement": "P0.3_问题1输入框",
      "eventType": "input_delete",
      "value": "{\"action\":\"delete\",\"prev\":\"为了对照实验的需要\",\"next\":\"为了对照实验\",\"prevLength\":9,\"nextLength\":7}",
      "time": "2025-11-22 10:05:25"
    },
    {
      "code": 6,
      "targetElement": "P0.3_问题1输入框",
      "eventType": "input_change",
      "value": "{\"prev\":\"为了对照实验\",\"next\":\"为了对照实验，排除其他变量干扰\",\"prevLength\":7,\"nextLength\":16}",
      "time": "2025-11-22 10:05:30"
    },
    {
      "code": 7,
      "targetElement": "P0.3_问题1输入框",
      "eventType": "input_blur",
      "value": "为了对照实验，排除其他变量干扰",
      "time": "2025-11-22 10:05:35"
    },
    {
      "code": 8,
      "targetElement": "P0.3_下一页按钮",
      "eventType": "next_click",
      "value": "前往下一页",
      "time": "2025-11-22 10:05:40"
    },
    {
      "code": 9,
      "targetElement": "P0.3_页面",
      "eventType": "page_exit",
      "value": "experiment_design",
      "time": "2025-11-22 10:05:40"
    },
    {
      "code": 10,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-pv-sand-experiment\",\"stepIndex\":0,\"pageId\":\"experiment_design\"}",
      "time": "2025-11-22 10:05:40"
    },
    {
      "code": 11,
      "targetElement": "P0.3_提交",
      "eventType": "page_submit_success",
      "value": "{\"duration\":40,\"channel\":\"usePageSubmission\"}",
      "time": "2025-11-22 10:05:40"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "问题1：请描述本次光伏治沙实验的方案设计思路",
      "value": "为了对照实验，排除其他变量干扰"
    }
  ],
  "beginTime": "2025-11-22 10:05:00",
  "endTime": "2025-11-22 10:05:40",
  "imgList": []
}
```

**关键点：**
- **pageNumber**: `0.3`（stepIndex=0, subPageNum=3）
- **targetElement 前缀**: `P0.3_...`
- 输入链路：`input_focus` → `input_change` (多次) → `input_delete` → `input_change` → `input_blur`
- `input_change` / `input_delete` 的 value 使用 `{prev, next, prevLength, nextLength}` 结构记录增删变化
- **flow_context 自动注入**：由提交层添加
- answerList 仅含最终非空答案

---

### 2.3 样例 3：实验操作页（实验参数调整 + 运行结果）
**页面**：subPageNum=5, experiment_task1（实验探究-1，单选题 + 实验操作）
**pageNumber**：`0.5`（假设 stepIndex=0）

```json
{
  "pageNumber": "0.5",
  "pageDesc": "[flow-g8-experiment-2024/g8-pv-sand-experiment/0] 实验探究-1",
  "operationList": [
    {
      "code": 1,
      "targetElement": "P0.5_页面",
      "eventType": "page_enter",
      "value": "experiment_task1",
      "time": "2025-11-22 10:15:00"
    },
    {
      "code": 2,
      "targetElement": "P0.5_高度调节",
      "eventType": "simulation_operation",
      "value": "调整高度: 20cm",
      "time": "2025-11-22 10:15:10"
    },
    {
      "code": 3,
      "targetElement": "P0.5_开始按钮",
      "eventType": "simulation_timing_started",
      "value": "开始测量 - 高度20cm",
      "time": "2025-11-22 10:15:15"
    },
    {
      "code": 4,
      "targetElement": "P0.5_实验结果",
      "eventType": "simulation_run_result",
      "value": "{\"heightLevel\":20,\"withPanelSpeed\":2.09,\"noPanelSpeed\":2.37,\"timestamp\":\"2025-11-22T10:15:17.000Z\"}",
      "time": "2025-11-22 10:15:17"
    },
    {
      "code": 5,
      "targetElement": "P0.5_高度调节",
      "eventType": "simulation_operation",
      "value": "调整高度: 50cm",
      "time": "2025-11-22 10:15:25"
    },
    {
      "code": 6,
      "targetElement": "P0.5_开始按钮",
      "eventType": "simulation_timing_started",
      "value": "开始测量 - 高度50cm",
      "time": "2025-11-22 10:15:30"
    },
    {
      "code": 7,
      "targetElement": "P0.5_实验结果",
      "eventType": "simulation_run_result",
      "value": "{\"heightLevel\":50,\"withPanelSpeed\":2.25,\"noPanelSpeed\":2.62,\"timestamp\":\"2025-11-22T10:15:32.000Z\"}",
      "time": "2025-11-22 10:15:32"
    },
    {
      "code": 8,
      "targetElement": "P0.5_重置按钮",
      "eventType": "simulation_operation",
      "value": "重置实验",
      "time": "2025-11-22 10:15:40"
    },
    {
      "code": 9,
      "targetElement": "P0.5_实验结果选择题",
      "eventType": "radio_select",
      "value": "有光伏板区风速更小",
      "time": "2025-11-22 10:15:50"
    },
    {
      "code": 10,
      "targetElement": "P0.5_下一页按钮",
      "eventType": "next_click",
      "value": "前往下一页",
      "time": "2025-11-22 10:16:00"
    },
    {
      "code": 11,
      "targetElement": "P0.5_页面",
      "eventType": "page_exit",
      "value": "experiment_task1",
      "time": "2025-11-22 10:16:00"
    },
    {
      "code": 12,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-pv-sand-experiment\",\"stepIndex\":0,\"pageId\":\"experiment_task1\"}",
      "time": "2025-11-22 10:16:00"
    },
    {
      "code": 13,
      "targetElement": "P0.5_提交",
      "eventType": "page_submit_success",
      "value": "{\"duration\":60,\"channel\":\"usePageSubmission\"}",
      "time": "2025-11-22 10:16:00"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "问题2：根据实验探究-1结果，哪一区域的风速更小？",
      "value": "A. 有光伏板区风速更小"
    },
    {
      "code": 2,
      "targetElement": "实验探究1：实验历史数据",
      "value": "{\"collectedData\":{\"heightLevel\":50,\"withPanelSpeed\":2.25,\"noPanelSpeed\":2.62,\"timestamp\":\"2025-11-22T10:15:32.000Z\"}}"
    }
  ],
  "beginTime": "2025-11-22 10:15:00",
  "endTime": "2025-11-22 10:16:00",
  "imgList": []
}
```

**关键点：**
- **pageNumber**: `0.5`（stepIndex=0, subPageNum=5）
- **targetElement 前缀**: `P0.5_...`
- 实验操作事件：`simulation_operation`（参数调整/重置）、`simulation_timing_started`（开始实验）、`simulation_run_result`（结果记录）
- `simulation_run_result` 的 value 为 JSON 字符串，包含实验数据
- **单选题使用 `radio_select` 事件**（见"事件策略说明"章节）
- **flow_context 自动注入**：由提交层添加
- answerList 包含两条：1) 用户选择的答案，2) 实验历史数据（JSON 字符串）

---

### 2.4 样例 4：阻断校验（click_blocked 含 missing 列表）
**页面**：subPageNum=3, experiment_design（用户未输入时点击"下一页"）
**pageNumber**：`0.3`（假设 stepIndex=0）

```json
{
  "pageNumber": "0.3",
  "pageDesc": "[flow-g8-experiment-2024/g8-pv-sand-experiment/0] 实验方案设计",
  "operationList": [
    {
      "code": 1,
      "targetElement": "P0.3_页面",
      "eventType": "page_enter",
      "value": "experiment_design",
      "time": "2025-11-22 10:20:00"
    },
    {
      "code": 2,
      "targetElement": "P0.3_问题1输入框",
      "eventType": "input_focus",
      "value": "",
      "time": "2025-11-22 10:20:10"
    },
    {
      "code": 3,
      "targetElement": "P0.3_问题1输入框",
      "eventType": "input_change",
      "value": "{\"prev\":\"\",\"next\":\"测试\",\"prevLength\":0,\"nextLength\":2}",
      "time": "2025-11-22 10:20:15"
    },
    {
      "code": 4,
      "targetElement": "P0.3_问题1输入框",
      "eventType": "input_blur",
      "value": "测试",
      "time": "2025-11-22 10:20:20"
    },
    {
      "code": 5,
      "targetElement": "P0.3_下一页按钮",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"validation_failed\",\"missing\":[\"designReason: 至少需要10个字符(当前2字符)\"],\"timestamp\":\"2025-11-22T10:20:25.000Z\"}",
      "time": "2025-11-22 10:20:25"
    },
    {
      "code": 6,
      "targetElement": "P0.3_问题1输入框",
      "eventType": "input_focus",
      "value": "测试",
      "time": "2025-11-22 10:20:30"
    },
    {
      "code": 7,
      "targetElement": "P0.3_问题1输入框",
      "eventType": "input_change",
      "value": "{\"prev\":\"测试\",\"next\":\"测试补充内容以满足字数要求\",\"prevLength\":2,\"nextLength\":13}",
      "time": "2025-11-22 10:20:35"
    },
    {
      "code": 8,
      "targetElement": "P0.3_问题1输入框",
      "eventType": "input_blur",
      "value": "测试补充内容以满足字数要求",
      "time": "2025-11-22 10:20:40"
    },
    {
      "code": 9,
      "targetElement": "P0.3_下一页按钮",
      "eventType": "next_click",
      "value": "前往下一页",
      "time": "2025-11-22 10:20:45"
    },
    {
      "code": 10,
      "targetElement": "P0.3_页面",
      "eventType": "page_exit",
      "value": "experiment_design",
      "time": "2025-11-22 10:20:45"
    },
    {
      "code": 11,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-pv-sand-experiment\",\"stepIndex\":0,\"pageId\":\"experiment_design\"}",
      "time": "2025-11-22 10:20:45"
    },
    {
      "code": 12,
      "targetElement": "P0.3_提交",
      "eventType": "page_submit_success",
      "value": "{\"duration\":45,\"channel\":\"usePageSubmission\"}",
      "time": "2025-11-22 10:20:45"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "问题1：请描述本次光伏治沙实验的方案设计思路",
      "value": "测试补充内容以满足字数要求"
    }
  ],
  "beginTime": "2025-11-22 10:20:00",
  "endTime": "2025-11-22 10:20:45",
  "imgList": []
}
```

**关键点：**
- **pageNumber**: `0.3`（stepIndex=0, subPageNum=3）
- `click_blocked` 事件的 value 包含：`reason`、`missing` 列表（具体缺失项及原因）、`timestamp`
- 阻断后用户修正输入，再次点击成功

---

### 2.5 样例 5：多选题（checkbox_check / checkbox_uncheck）
**页面**：subPageNum=6, experiment_task2（实验探究-2，多选题）
**pageNumber**：`0.6`（假设 stepIndex=0）

```json
{
  "pageNumber": "0.6",
  "pageDesc": "[flow-g8-experiment-2024/g8-pv-sand-experiment/0] 实验探究-2",
  "operationList": [
    {
      "code": 1,
      "targetElement": "P0.6_页面",
      "eventType": "page_enter",
      "value": "experiment_task2",
      "time": "2025-11-22 10:25:00"
    },
    {
      "code": 2,
      "targetElement": "P0.6_选项1",
      "eventType": "checkbox_check",
      "value": "在两区域，风速都随高度增加而增加",
      "time": "2025-11-22 10:25:10"
    },
    {
      "code": 3,
      "targetElement": "P0.6_选项2",
      "eventType": "checkbox_check",
      "value": "在两区域，风速都随高度增加而减小",
      "time": "2025-11-22 10:25:15"
    },
    {
      "code": 4,
      "targetElement": "P0.6_选项1",
      "eventType": "checkbox_uncheck",
      "value": "在两区域，风速都随高度增加而增加",
      "time": "2025-11-22 10:25:20"
    },
    {
      "code": 5,
      "targetElement": "P0.6_选项3",
      "eventType": "checkbox_check",
      "value": "在无板区，风速随高度增加而增大；在有板区，风速随高度增加而减小",
      "time": "2025-11-22 10:25:25"
    },
    {
      "code": 6,
      "targetElement": "P0.6_下一页按钮",
      "eventType": "next_click",
      "value": "前往下一页",
      "time": "2025-11-22 10:25:30"
    },
    {
      "code": 7,
      "targetElement": "P0.6_页面",
      "eventType": "page_exit",
      "value": "experiment_task2",
      "time": "2025-11-22 10:25:30"
    },
    {
      "code": 8,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-pv-sand-experiment\",\"stepIndex\":0,\"pageId\":\"experiment_task2\"}",
      "time": "2025-11-22 10:25:30"
    },
    {
      "code": 9,
      "targetElement": "P0.6_提交",
      "eventType": "page_submit_success",
      "value": "{\"duration\":30,\"channel\":\"usePageSubmission\"}",
      "time": "2025-11-22 10:25:30"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "问题3：结合实验探究-2，哪些结论是正确的？",
      "value": "[\"B. 在两区域，风速都随高度增加而减小\",\"C. 在无板区，风速随高度增加而增大；在有板区，风速随高度增加而减小\"]"
    }
  ],
  "beginTime": "2025-11-22 10:25:00",
  "endTime": "2025-11-22 10:25:30",
  "imgList": []
}
```

**关键点：**
- **pageNumber**: `0.6`（stepIndex=0, subPageNum=6）
- **targetElement 前缀**: `P0.6_...`
- **多选题使用 `checkbox_check` / `checkbox_uncheck` 事件**（见"事件策略说明"章节）
- **flow_context 自动注入**：由提交层添加
- answerList 的 value 为 JSON 数组字符串（包含所有选中项）

---

### 2.6 补充样例：更多 click_blocked 阻断场景

#### 2.6a Page 1 阻断（未勾选复选框）
**场景**：倒计时完成，但用户未勾选确认框即点击"下一页"
```json
{
  "code": 7,
  "targetElement": "P0.1_下一页按钮",
  "eventType": "click_blocked",
  "value": "{\"reason\":\"validation_failed\",\"missing\":[\"instructions_confirmation: 请勾选确认框\"],\"timestamp\":\"2025-11-22T10:00:35.000Z\"}",
  "time": "2025-11-22 10:00:35"
}
```

#### 2.6b Page 4 阻断（未完成实验）
**场景**：未完成至少1次实验即点击"下一页"
```json
{
  "code": 5,
  "targetElement": "P0.4_下一页按钮",
  "eventType": "click_blocked",
  "value": "{\"reason\":\"validation_failed\",\"missing\":[\"tutorialCompleted: 请至少完成1次实验操作\"],\"experimentCount\":0,\"timestamp\":\"2025-11-22T10:10:00.000Z\"}",
  "time": "2025-11-22 10:10:00"
}
```

#### 2.6c Page 5 阻断（单选题未选择）
**场景**：未选择单选题答案即点击"下一页"
```json
{
  "code": 8,
  "targetElement": "P0.5_下一页按钮",
  "eventType": "click_blocked",
  "value": "{\"reason\":\"validation_failed\",\"missing\":[\"experiment1Choice: 请选择一个选项\"],\"timestamp\":\"2025-11-22T10:15:30.000Z\"}",
  "time": "2025-11-22 10:15:30"
}
```

#### 2.6d Page 6 阻断（多选题未选择）
**场景**：未选择任何多选项即点击"下一页"
```json
{
  "code": 6,
  "targetElement": "P0.6_下一页按钮",
  "eventType": "click_blocked",
  "value": "{\"reason\":\"validation_failed\",\"missing\":[\"experiment2Analysis: 请至少选择1个选项\"],\"selectedCount\":0,\"timestamp\":\"2025-11-22T10:25:15.000Z\"}",
  "time": "2025-11-22 10:25:15"
}
```

#### 2.6e Page 7 阻断（组合校验失败）
**场景**：单选题已选，但输入框字符数不足
```json
{
  "code": 9,
  "targetElement": "P0.7_下一页按钮",
  "eventType": "click_blocked",
  "value": "{\"reason\":\"validation_failed\",\"missing\":[\"conclusionReason: 至少需要10个字符(当前5字符)\"],\"timestamp\":\"2025-11-22T10:30:20.000Z\"}",
  "time": "2025-11-22 10:30:20"
}
```

**关键点：**
- 所有 `click_blocked` 的 value 必须包含：
  - `reason`: 固定为 `"validation_failed"`
  - `missing`: 数组，列出所有未满足的校验项（格式：`"字段名: 具体原因"`）
  - `timestamp`: ISO 8601 格式时间戳
  - 可选字段：如 `experimentCount`、`selectedCount` 等辅助信息

---

## 2.7 事件策略说明

### 选择题事件：radio_select vs select_change

**决策**：本模块使用 **`radio_select`** 作为单选题事件，**`checkbox_check/uncheck`** 作为多选题事件。

**理由**：
1. **Schema 兼容性**：Data Format Spec（`openspec/specs/data-format`）明确支持 `radio_select`、`checkbox_check`、`checkbox_uncheck`、`select_change` 四种选择事件
2. **语义明确性**：
   - `radio_select` - 单选按钮（`<input type="radio">`）的选择行为，符合本模块问卷单选题场景
   - `checkbox_check/uncheck` - 复选框（`<input type="checkbox">`）的勾选/取消，符合多选题场景
   - `select_change` - 下拉列表（`<select>`）的选项变更，本模块不涉及
3. **已有实践**：g8-mikania-experiment 迁移已使用 `radio_select` 作为单选题事件，保持一致性
4. **实现现状**：
   - 当前代码（Page06Experiment1.tsx, Page07Experiment2.tsx）已使用 `radio_select` / `checkbox_*` 事件记录
   - 无需修改现有事件类型，仅需确保前缀/格式对齐

**不使用 `select_change` 的原因**：
- 本模块所有选择题均使用 `<input type="radio/checkbox">` 实现，非 `<select>` 下拉列表
- `select_change` 适用于下拉选择器场景，语义与本模块不符

**标准事件映射**：
| UI 组件类型 | eventType | 使用场景 |
|------------|-----------|----------|
| 单选按钮组（radio） | `radio_select` | 问题1、问题2（实验探究-1）、结论分析（单选部分） |
| 复选框组（checkbox） | `checkbox_check` / `checkbox_uncheck` | 问题3（实验探究-2 多选）、封面复选框确认 |
| 下拉列表（select） | `select_change` | 本模块不涉及 |

---

## 3. 验证与测试计划

### 3.1 快照/Fixture 对照清单

| subPageNum | pageId | 快照类型 | 验证点 | 对照样例 | 备注 |
|------------|--------|---------|--------|---------|------|
| 1 | instructions_cover | 计时手动提交 | timer_start/complete, checkbox_check, next_click | 样例 2.1 | pageNumber=S.1（示例中=0.1） |
| 3 | experiment_design | 输入完整链路 | input_focus/change/delete/blur, click_blocked (missing) | 样例 2.2, 2.4 | pageNumber=S.3（示例中=0.3） |
| 5 | experiment_task1 | 实验操作 + 单选 | simulation_*, radio_select, 实验数据 Answer | 样例 2.3 | pageNumber=S.5（示例中=0.5） |
| 6 | experiment_task2 | 实验操作 + 多选 | simulation_*, checkbox_check/uncheck, JSON 数组 Answer | 样例 2.5 | pageNumber=S.6（示例中=0.6） |
| 7 | conclusion_analysis | 单选 + 输入 | radio_select + input_*, 组合校验 | 组合样例 2.2+2.3 | pageNumber=S.7（示例中=0.7） |

### 3.2 历史数据兼容/清洗需求

**背景**：g8-pv-sand-experiment 是新模块，**无历史数据**，无需兼容旧格式。

**清洗需求**：无

### 3.3 依赖守卫

#### 3.3.1 Schema 校验（Zod/JSON Schema）
- **位置**：`@shared/services/submission/schema.ts`
- **检查项**：
  - ✅ `pageNumber` 格式：`^\d+\.\d+$`（如 `0.1`, `1.3`, `2.7`）
  - ✅ `pageDesc` 前缀：`^\[[\w-]+\/[\w-]+\/\d+\]`（三段式格式：flowId/submoduleId/stepIndex，如 `[flow-g8-experiment-2024/g8-pv-sand-experiment/0]`）
  - ✅ `operationList.targetElement` 前缀：`^P\d+\.\d+_`（如 `P0.3_问题1输入框`，前缀与 pageNumber 匹配）
  - ✅ `answerList.targetElement` 使用完整问题文本（或实验历史描述），不可使用题目ID，参考 `docs/submodule-submission-guidelines.md` 第16-97行
  - ✅ 单选/判断题 `answerList.value` 必须包含选项标签与完整选项内容（如 `"A. 有光伏板区风速更小"`）
  - ✅ `eventType` 枚举合规：必须在 [Data Format Spec](../../update-unified-submission-pipeline/specs/data-format/spec.md) 定义的事件集合内
  - ✅ `code` 连续自增：从 1 开始，无跳号
  - ✅ `time` 格式：`YYYY-MM-DD HH:mm:ss`
  - ✅ `answerList` 无空值：所有 Answer.value 非空字符串

#### 3.3.2 最小事件集合检查（Lint/CI）
每个页面的 `operationList` **必须包含**：
- ✅ `page_enter` × 1（进入页面）
- ✅ `page_exit` × 1（离开页面）
- ✅ `next_click` × 1（或等效 click 标记下一步）
- ✅ `page_submit_success` / `page_submit_failed` × 1（提交结果）
- ✅ **输入类控件**：`input_focus` → `input_change` / `input_delete` → `input_blur`（完整序列）
- ✅ **选择类控件**：`radio_select` / `checkbox_check` / `checkbox_uncheck` / `select_change`（至少 1 次）
- ✅ **实验操作**：`simulation_operation` / `simulation_timing_started` / `simulation_run_result`（根据页面类型）
- ✅ **阻断场景**：`click_blocked`（含 `missing` 列表）

**缺失时**：构建/CI **MUST** 失败，输出详细错误：
```
❌ 页面 0.3 (experiment_design) 缺失必需事件：
  - 缺少 input_focus 事件（输入框 "P0.3_问题1输入框"）
  - 缺少 click_blocked 事件（未记录校验失败阻断）
```

#### 3.3.3 targetElement 前缀/事件枚举合规 Lint
**规则**：
- 禁止 `targetElement` 使用旧前缀（如 `M2:3_...`、`M*_...`）
- 禁止 `eventType` 使用非枚举值（如 `click_button`、`input_text`）
- 禁止手写 `code`（必须由提交层自增）
- 禁止手写 `time`（必须由提交层统一格式化）
- 禁止直接调用 `fetch /stu/saveHcMark`（必须通过 `usePageSubmission`）

**实施**：
- ESLint 规则：`no-legacy-page-prefix`, `no-direct-submit-api`
- 运行时检查：`usePageSubmission` 内部校验，不合规则 `throw Error` 阻断提交

---

## 4. 迁移后数据一致性验证

### 4.1 单元测试（Vitest）
- **文件**：`src/submodules/g8-pv-sand-experiment/__tests__/submission-format.test.ts`
- **覆盖**：
  - ✅ 每个页面的 MarkObject 符合 Schema
  - ✅ pageNumber / pageDesc / targetElement 前缀正确（根据 Flow stepIndex）
  - ✅ 最小事件集合存在
  - ✅ answerList 无空值
  - ✅ 阻断场景的 click_blocked 含 missing 列表

### 4.2 E2E 测试（Playwright）
- **文件**：`tests/pv-sand-submission.e2e.ts`
- **场景**：
  1. 完整流程（7 个页面）：验证每页提交数据格式
  2. 阻断场景：输入不足 10 字符 → click_blocked → 补全后成功
  3. 实验操作：记录高度调节 → 开始 → 结果 → 重置 → 数据完整
  4. 超时提交：模拟计时到 0 → 自动提交 → auto_submit 事件存在

### 4.3 快照测试（Jest Snapshot）
- **文件**：`src/submodules/g8-pv-sand-experiment/__tests__/snapshots/`
- **基线**（假设 stepIndex=0）：
  - `page-0.1-instructions-cover.snapshot.json`（对照样例 2.1）
  - `page-0.3-experiment-design.snapshot.json`（对照样例 2.2）
  - `page-0.3-blocked.snapshot.json`（对照样例 2.4）
  - `page-0.5-experiment-task1.snapshot.json`（对照样例 2.3）
  - `page-0.6-experiment-task2.snapshot.json`（对照样例 2.5）

**验证命令**：
```bash
npm run test:snapshot -- --update  # 生成基线
npm run test:snapshot              # 对照验证
```

---

## 5. 迁移风险与缓解

### 5.1 风险点
| 风险 | 影响 | 缓解措施 |
|------|------|---------|
| stepIndex 理解错误（混淆子模块内步骤与 Flow 位置） | pageNumber 编码错误，后端解析失败 | 文档明确说明 stepIndex 含义，代码审查检查 |
| 事件粒度缺失（未记录 focus/blur/delete） | 行为链路不完整 | 包装组件自动记录，Lint 检查缺失 |
| 实验数据丢失（未保存 experimentState） | 无法还原实验过程 | answerList 追加一条 JSON 字符串 Answer |
| 阻断校验未记录 click_blocked | 无法分析用户错误 | 框架层统一记录，含 missing 列表 |
| 页码前缀不一致（混用 `M*` / `<stepIndex>.<subPageNum>`） | 后端解析失败 | Schema 校验 + Lint 阻断旧格式 |
| 超时未自动提交 | 数据丢失 | 倒计时到 0 触发 auto_submit |

### 5.2 回滚计划
- **条件**：Schema 校验失败率 >5% 或后端无法解析
- **操作**：
  1. 暂停迁移，回退到旧提交逻辑（直连 `/stu/saveHcMark`）
  2. 修复 Schema / 提交层代码
  3. 重新测试后再次迁移

---

## 附录：事件枚举快速参考

| 事件类型 | 使用场景 | value 示例 |
|---------|---------|-----------|
| `page_enter` | 页面进入 | pageId |
| `page_exit` | 页面离开 | pageId |
| `input_focus` | 输入框获得焦点 | 当前值或 "" |
| `input_change` | 输入框内容变更 | `{prev, next, prevLength, nextLength}` |
| `input_delete` | 显式删除内容 | `{action:'delete', prev, next, prevLength, nextLength}` |
| `input_blur` | 输入框失去焦点 | 最终值 |
| `radio_select` | 单选选中 | 选项文本 |
| `checkbox_check` | 多选勾选 | 选项文本 |
| `checkbox_uncheck` | 多选取消 | 选项文本 |
| `select_change` | 下拉选择变更 | 选中值 |
| `timer_start` | 倒计时开始 | 初始秒数 |
| `timer_complete` | 倒计时结束 | "0" |
| `simulation_operation` | 实验参数调整/重置 | 操作描述 |
| `simulation_timing_started` | 实验开始 | 当前参数 |
| `simulation_run_result` | 实验结果 | JSON 字符串（数据对象） |
| `next_click` | 点击下一页 | "前往下一页" |
| `click_blocked` | 校验阻断 | `{reason, missing[], timestamp}` |
| `page_submit_success` | 提交成功 | `{duration, channel}` |
| `page_submit_failed` | 提交失败 | 错误摘要 |
| `auto_submit` | 超时自动提交 | "timeout_triggered" |
| `flow_context` | Flow 上下文（自动注入） | `{flowId, stepIndex, submoduleId, ...}` |
