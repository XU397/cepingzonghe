# Grade7-Experiment 模块提交迁移设计文档

## Context

### 背景
grade7-experiment 模块（蒸馒头实验）是 7 年级传统评测模块，目前使用自建的提交逻辑：
- 手写 `buildMarkObject`、`submitPageData`
- 直接调用 `fetch('/stu/saveHcMark', ...)`
- 使用旧格式页码（纯数字）、targetElement（无前缀）
- 缺少完整的行为轨迹事件（input_focus/change/delete、click_blocked 等）

### 约束
- **零破坏原则**：迁移过程中不影响其他模块
- **向后兼容**：迁移期间保留旧数据支持（后端）
- **WSL2 环境**：测试配置需使用 `pool: 'vmThreads'`

### 利益相关方
- **前端开发**：执行迁移实施
- **后端开发**：适配新格式数据（已由统一管道变更完成）
- **测试团队**：快照测试和验收测试
- **产品经理**：确保数据分析需求满足

---

## Goals / Non-Goals

### Goals
1. ✅ 将 grade7-experiment 模块迁移到统一提交管道（`usePageSubmission`）
2. ✅ 补全完整行为轨迹事件（focus/change/delete/blur, click_blocked, simulation_* 等）
3. ✅ 统一页码/前缀格式（`<stepIndex>.<subPageNum>`；operationList 使用 `P${pageNumber}_...`，answerList 使用完整问题文本）
4. ✅ 提供快照测试基线（5个典型页面）
5. ✅ 启用 CI/Lint 守卫防止回退

### Non-Goals
- ❌ 不修改后端 API 接口（已由统一管道变更完成）
- ❌ 不改变用户可见的 UI/UX
- ❌ 不优化模块业务逻辑（仅迁移提交格式）
- ❌ 不处理历史数据清洗（后端责任）

---

## Decisions

### Decision 1: 使用 `usePageSubmission` 作为唯一提交入口
**选择**: 所有页面通过 `usePageSubmission` Hook 提交，移除直连 API 调用

**理由**:
- 统一提交逻辑，减少重复代码
- 自动注入 flow_context、code 自增、时间格式化
- 内置 Schema 校验和重试机制

**替代方案**:
- 保留自建 `buildMarkObject` + 套壳调用统一 API → 增加维护成本，容易遗漏注入逻辑
- 混用新旧提交路径 → 数据格式不一致，难以追踪

### Decision 2: 实验历史作为单条 Answer 存储
**选择**: 多次实验记录作为 JSON 字符串存储为一条 Answer

**理由**:
- 保持 answerList 简洁（每题一个答案）
- 完整保留实验历史结构（含时间戳、参数、结果）
- 后端可直接 JSON.parse 获取完整历史

**格式示例**:
```json
{
  "targetElement": "实验历史：蒸馒头实验参数记录",
  "value": "[{\"id\":1700000000,\"timestamp\":\"2025-11-22T14:35:15Z\",\"data\":[{\"Temp\":100,\"Volume\":15.2},{\"Temp\":95,\"Volume\":14.8}]}]"
}
```

### Decision 3: 计时页倒计时结束自动提交
**选择**: 注意事项页 40秒倒计时结束后，即使未勾选复选框也允许提交（记录为超时）

**理由**:
- 避免用户被卡住无法继续
- 通过 `auto_submit` 事件区分正常提交和超时提交
- 后端可根据事件类型判断用户行为

**替代方案**:
- 强制要求勾选复选框 → 可能导致用户无法继续测评
- 倒计时结束直接跳转 → 缺少用户确认，体验不佳

## AnswerList 格式规范
- **targetElement 使用完整问题文本**，禁止题目ID；实验历史/元数据可使用描述性标识，参考 `docs/submodule-submission-guidelines.md` 第16-97行。
- **value 填写完整选项内容**：单选/判断题包含选项标签与完整文本（如 `"A. 已阅读并同意"`），输入题保留用户完整输入；占位/超时答案同样绑定在问题文本上。
- **operationList.targetElement 继续使用 `P<pageNumber>_...` 前缀** 追踪控件交互，与 answerList 角色区分。

---

## Migration Plan

### 1. 迁移页面清单

**模块总览**: grade7-experiment 模块共 **6 个页面**

| pageNumber | pageId | 标题 | 类型 | 特殊处理 |
|-----------|--------|------|------|---------|
| `1.1` | Page_00_1_Notice | 注意事项 | 计时页 | **40秒倒计时** + 复选框确认 |
| `1.2` | Page_01_Intro | 情境引入 | 过渡页 | 简单展示页 |
| `1.3` | Page_02_Question | 提出问题 | **输入页** | 文本输入框，需完整 focus → change → blur 链路 |
| `1.4` | Page_03_Experiment | **模拟实验** | **实验页** | 温度/容器选择，计时，结果记录，需记录 simulation_* 事件 |
| `1.5` | Page_04_Conclusion | 得出结论 | **输入页** | 文本输入框 |
| `1.6` | Page_05_Completion | 完成页 | 完成页 | 最终页面，无需提交 |

**StepIndex note**: all pages share the same Flow stepIndex (example uses 1); subPageNum increments 1~6; mixing multiple stepIndex values is not allowed.
**特殊处理说明**:
- **计时页（1.1 - 超时链路）**:
  - **正常链路**: `timer_start` → `timer_complete` → `checkbox_check` → `next_click` → 提交
  - **超时链路**: `timer_start` → `timer_complete` → **用户未勾选/未点击** → **40秒后自动触发** → `auto_submit` → `page_exit` → `page_submit_success/failed`
  - **关键要求**: 超时提交 MUST 走 `usePageSubmission` 的超时分支，Hook 自动补齐占位答案（如 `"超时未确认"`）并追加 `auto_submit` 事件
  - 阻断记录：倒计时未完成时点击"下一页"记录 `click_blocked`（missing: `["timer_complete"]`）
- **Input pages (1.3, 1.5)**: capture input_focus/input_change(prev/next)/input_delete(if any)/input_blur
- **Experiment page (1.4)**:
  - 参数选择：`select_change`（温度/容器选择，**统一使用 select_change，不使用 radio_select**）
  - 实验操作：`simulation_operation`（参数调整）, `simulation_timing_started`（开始计时）, `simulation_run_result`（结果，含 Run_ID/Set_Temp/Results）

---

### 2. 样例快照（期望 MarkObject）

#### 2.1 输入页样例：Page_02_Question（提出问题）

**场景**: 用户输入问题 → 点击下一页 → 成功提交

```json
{
  "pageNumber": "1.3",
  "pageDesc": "[grade7-experiment/experiment/1] 提出问题",
  "operationList": [
    {
      "code": 1,
      "targetElement": "P1.3_页面",
      "eventType": "page_enter",
      "value": "Page_02_Question",
      "time": "2025-11-22 14:30:00",
      "pageId": "Page_02_Question"
    },
    {
      "code": 2,
      "targetElement": "P1.3_页面",
      "eventType": "flow_context",
      "value": {
        "flowId": "grade7-experiment",
        "stepIndex": 1,
        "submoduleId": "experiment",
        "moduleName": "Grade7ExperimentModule",
        "pageId": "Page_02_Question"
      },
      "time": "2025-11-22 14:30:00",
      "pageId": "Page_02_Question"
    },
    {
      "code": 3,
      "targetElement": "P1.3_question_input",
      "eventType": "input_focus",
      "value": "聚焦输入框",
      "time": "2025-11-22 14:30:05",
      "pageId": "Page_02_Question"
    },
    {
      "code": 4,
      "targetElement": "P1.3_question_input",
      "eventType": "input_change",
      "value": {
        "prev": "",
        "next": "温度"
      },
      "time": "2025-11-22 14:30:07",
      "pageId": "Page_02_Question"
    },
    {
      "code": 5,
      "targetElement": "P1.3_question_input",
      "eventType": "input_change",
      "value": {
        "prev": "温度",
        "next": "温度如何影响"
      },
      "time": "2025-11-22 14:30:10",
      "pageId": "Page_02_Question"
    },
    {
      "code": 6,
      "targetElement": "P1.3_question_input",
      "eventType": "input_delete",
      "value": {
        "action": "delete",
        "prev": "温度如何影响",
        "next": "温度如何"
      },
      "time": "2025-11-22 14:30:12",
      "pageId": "Page_02_Question"
    },
    {
      "code": 7,
      "targetElement": "P1.3_question_input",
      "eventType": "input_change",
      "value": {
        "prev": "温度如何",
        "next": "温度如何影响馒头体积？"
      },
      "time": "2025-11-22 14:30:20",
      "pageId": "Page_02_Question"
    },
    {
      "code": 8,
      "targetElement": "P1.3_question_input",
      "eventType": "input_blur",
      "value": "离开输入框",
      "time": "2025-11-22 14:30:22",
      "pageId": "Page_02_Question"
    },
    {
      "code": 9,
      "targetElement": "P1.3_next_button",
      "eventType": "next_click",
      "value": "下一页",
      "time": "2025-11-22 14:30:25",
      "pageId": "Page_02_Question"
    },
    {
      "code": 10,
      "targetElement": "P1.3_页面",
      "eventType": "page_exit",
      "value": "Page_02_Question",
      "time": "2025-11-22 14:30:25",
      "pageId": "Page_02_Question"
    },
    {
      "code": 11,
      "targetElement": "P1.3_页面",
      "eventType": "page_submit_success",
      "value": {
        "duration": "350ms",
        "channel": "unified-submission-pipeline"
      },
      "time": "2025-11-22 14:30:25",
      "pageId": "Page_02_Question"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "问题：请写出你想探究的科学问题",
      "value": "温度如何影响馒头体积？"
    }
  ],
  "beginTime": "2025-11-22 14:30:00",
  "endTime": "2025-11-22 14:30:25",
  "imgList": []
}
```

**关键格式点**:
- `pageNumber`: "1.3" (stepIndex.subPageNum)
- `pageDesc`: "[grade7-experiment/experiment/1] ???????"
- `targetElement`: "P1.3_question_input" (P${pageNumber}_...)
- `input_change` value: `{ "prev": "温度", "next": "温度如何影响" }`
- `input_delete` value: `{ "action": "delete", "prev": "温度如何影响", "next": "温度如何" }`

---

#### 2.2 实验页样例：Page_03_Experiment（模拟实验）

**场景**: 用户选择参数 → 开始实验 → 记录结果 → 重复实验 → 点击下一页

```json
{
  "pageNumber": "1.4",
  "pageDesc": "[grade7-experiment/experiment/1] 模拟实验",
  "operationList": [
    {
      "code": 1,
      "targetElement": "P1.4_页面",
      "eventType": "page_enter",
      "value": "Page_03_Experiment",
      "time": "2025-11-22 14:35:00",
      "pageId": "Page_03_Experiment"
    },
    {
      "code": 2,
      "targetElement": "P1.4_页面",
      "eventType": "flow_context",
      "value": {
        "flowId": "grade7-experiment",
        "stepIndex": 1,
        "submoduleId": "experiment",
        "moduleName": "Grade7ExperimentModule",
        "pageId": "Page_03_Experiment"
      },
      "time": "2025-11-22 14:35:00",
      "pageId": "Page_03_Experiment"
    },
    {
      "code": 3,
      "targetElement": "P1.4_temperature_selector",
      "eventType": "select_change",
      "value": "100",
      "time": "2025-11-22 14:35:05",
      "pageId": "Page_03_Experiment"
    },
    {
      "code": 4,
      "targetElement": "P1.4_container_selector",
      "eventType": "select_change",
      "value": "容器A",
      "time": "2025-11-22 14:35:08",
      "pageId": "Page_03_Experiment"
    },
    {
      "code": 5,
      "targetElement": "P1.4_start_button",
      "eventType": "simulation_timing_started",
      "value": "温度100°C",
      "time": "2025-11-22 14:35:10",
      "pageId": "Page_03_Experiment"
    },
    {
      "code": 6,
      "targetElement": "P1.4_experiment_result",
      "eventType": "simulation_run_result",
      "value": {
        "Run_ID": "run_Page_03_Experiment_1",
        "Set_Temp": 100,
        "Results": [
          { "Temp": 100, "Volume": 15.2 },
          { "Temp": 95, "Volume": 14.8 },
          { "Temp": 90, "Volume": 14.1 }
        ]
      },
      "time": "2025-11-22 14:35:15",
      "pageId": "Page_03_Experiment"
    },
    {
      "code": 7,
      "targetElement": "P1.4_reset_button",
      "eventType": "click",
      "value": "重置实验",
      "time": "2025-11-22 14:35:20",
      "pageId": "Page_03_Experiment"
    },
    {
      "code": 8,
      "targetElement": "P1.4_temperature_selector",
      "eventType": "select_change",
      "value": "90",
      "time": "2025-11-22 14:35:25",
      "pageId": "Page_03_Experiment"
    },
    {
      "code": 9,
      "targetElement": "P1.4_start_button",
      "eventType": "simulation_timing_started",
      "value": "温度90°C",
      "time": "2025-11-22 14:35:27",
      "pageId": "Page_03_Experiment"
    },
    {
      "code": 10,
      "targetElement": "P1.4_experiment_result",
      "eventType": "simulation_run_result",
      "value": {
        "Run_ID": "run_Page_03_Experiment_2",
        "Set_Temp": 90,
        "Results": [
          { "Temp": 90, "Volume": 12.5 },
          { "Temp": 85, "Volume": 12.1 },
          { "Temp": 80, "Volume": 11.8 }
        ]
      },
      "time": "2025-11-22 14:35:32",
      "pageId": "Page_03_Experiment"
    },
    {
      "code": 11,
      "targetElement": "P1.4_next_button",
      "eventType": "next_click",
      "value": "下一页",
      "time": "2025-11-22 14:35:40",
      "pageId": "Page_03_Experiment"
    },
    {
      "code": 12,
      "targetElement": "P1.4_页面",
      "eventType": "page_exit",
      "value": "Page_03_Experiment",
      "time": "2025-11-22 14:35:40",
      "pageId": "Page_03_Experiment"
    },
    {
      "code": 13,
      "targetElement": "P1.4_页面",
      "eventType": "page_submit_success",
      "value": {
        "duration": "420ms",
        "channel": "unified-submission-pipeline"
      },
      "time": "2025-11-22 14:35:40",
      "pageId": "Page_03_Experiment"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "实验历史：蒸馒头实验参数记录",
      "value": "[{\"id\":1700000000,\"timestamp\":\"2025-11-22T14:35:15.000Z\",\"data\":[{\"Temp\":100,\"Volume\":15.2},{\"Temp\":95,\"Volume\":14.8},{\"Temp\":90,\"Volume\":14.1}]},{\"id\":1700000001,\"timestamp\":\"2025-11-22T14:35:32.000Z\",\"data\":[{\"Temp\":90,\"Volume\":12.5},{\"Temp\":85,\"Volume\":12.1},{\"Temp\":80,\"Volume\":11.8}]}]"
    }
  ],
  "beginTime": "2025-11-22 14:35:00",
  "endTime": "2025-11-22 14:35:40",
  "imgList": []
}
```

**关键格式点**:
- 参数选择：`select_change` 事件
- 实验操作：`simulation_timing_started`（开始）, `simulation_run_result`（结果）
- `simulation_run_result` value 结构：`{ Run_ID, Set_Temp, Results: [{Temp, Volume}, ...] }`
- 复杂数据：实验历史作为 JSON 字符串存储为单条 Answer

---

#### 2.3 计时页样例：Page_00_1_Notice（注意事项）

**场景**: 40秒倒计时 → 用户提前勾选复选框 → 倒计时结束 → 点击下一页

```json
{
  "pageNumber": "1.1",
  "pageDesc": "[grade7-experiment/experiment/1] 注意事项",
  "operationList": [
    {
      "code": 1,
      "targetElement": "P1.1_页面",
      "eventType": "page_enter",
      "value": "Page_00_1_Notice",
      "time": "2025-11-22 14:00:00",
      "pageId": "Page_00_1_Notice"
    },
    {
      "code": 2,
      "targetElement": "P1.1_页面",
      "eventType": "flow_context",
      "value": {
        "flowId": "grade7-experiment",
        "stepIndex": 1,
        "submoduleId": "experiment",
        "moduleName": "Grade7ExperimentModule",
        "pageId": "Page_00_1_Notice"
      },
      "time": "2025-11-22 14:00:00",
      "pageId": "Page_00_1_Notice"
    },
    {
      "code": 3,
      "targetElement": "P1.1_notice_countdown",
      "eventType": "timer_start",
      "value": "倒计时开始（40秒）",
      "time": "2025-11-22 14:00:00",
      "pageId": "Page_00_1_Notice"
    },
    {
      "code": 4,
      "targetElement": "P1.1_next_button",
      "eventType": "click_blocked",
      "value": {
        "reason": "倒计时未完成",
        "missing": ["timer_complete"]
      },
      "time": "2025-11-22 14:00:15",
      "pageId": "Page_00_1_Notice"
    },
    {
      "code": 5,
      "targetElement": "P1.1_notice_agreement",
      "eventType": "checkbox_check",
      "value": "勾选",
      "time": "2025-11-22 14:00:35",
      "pageId": "Page_00_1_Notice"
    },
    {
      "code": 6,
      "targetElement": "P1.1_notice_countdown",
      "eventType": "timer_complete",
      "value": "倒计时结束",
      "time": "2025-11-22 14:00:40",
      "pageId": "Page_00_1_Notice"
    },
    {
      "code": 7,
      "targetElement": "P1.1_next_button",
      "eventType": "next_click",
      "value": "继续",
      "time": "2025-11-22 14:00:42",
      "pageId": "Page_00_1_Notice"
    },
    {
      "code": 8,
      "targetElement": "P1.1_页面",
      "eventType": "page_exit",
      "value": "Page_00_1_Notice",
      "time": "2025-11-22 14:00:42",
      "pageId": "Page_00_1_Notice"
    },
    {
      "code": 9,
      "targetElement": "P1.1_页面",
      "eventType": "page_submit_success",
      "value": {
        "duration": "250ms",
        "channel": "unified-submission-pipeline"
      },
      "time": "2025-11-22 14:00:42",
      "pageId": "Page_00_1_Notice"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "确认：已阅读并同意注意事项？",
      "value": "A. 已阅读并同意"
    }
  ],
  "beginTime": "2025-11-22 14:00:00",
  "endTime": "2025-11-22 14:00:42",
  "imgList": []
}
```

**关键格式点**:
- 计时事件：`timer_start`, `timer_complete`
- 复选框：`checkbox_check`
- 阻断校验：倒计时未完成时点击记录 `click_blocked`，missing: `["timer_complete"]`

---

#### 2.4 阻断场景样例：Page_02_Question（未填写输入框）

**场景**: 用户未输入内容 → 点击下一页 → 阻断 → 输入后成功提交

```json
{
  "pageNumber": "1.3",
  "pageDesc": "[grade7-experiment/experiment/1] 提出问题",
  "operationList": [
    {
      "code": 1,
      "targetElement": "P1.3_页面",
      "eventType": "page_enter",
      "value": "Page_02_Question",
      "time": "2025-11-22 14:30:00",
      "pageId": "Page_02_Question"
    },
    {
      "code": 2,
      "targetElement": "P1.3_页面",
      "eventType": "flow_context",
      "value": {
        "flowId": "grade7-experiment",
        "stepIndex": 1,
        "submoduleId": "experiment",
        "moduleName": "Grade7ExperimentModule",
        "pageId": "Page_02_Question"
      },
      "time": "2025-11-22 14:30:00",
      "pageId": "Page_02_Question"
    },
    {
      "code": 3,
      "targetElement": "P1.3_next_button",
      "eventType": "click_blocked",
      "value": {
        "reason": "未完成必填输入",
        "missing": ["question_input"]
      },
      "time": "2025-11-22 14:30:05",
      "pageId": "Page_02_Question"
    },
    {
      "code": 4,
      "targetElement": "P1.3_question_input",
      "eventType": "input_focus",
      "value": "聚焦输入框",
      "time": "2025-11-22 14:30:10",
      "pageId": "Page_02_Question"
    },
    {
      "code": 5,
      "targetElement": "P1.3_question_input",
      "eventType": "input_change",
      "value": {
        "prev": "",
        "next": "温度如何影响馒头体积？"
      },
      "time": "2025-11-22 14:30:20",
      "pageId": "Page_02_Question"
    },
    {
      "code": 6,
      "targetElement": "P1.3_question_input",
      "eventType": "input_blur",
      "value": "离开输入框",
      "time": "2025-11-22 14:30:22",
      "pageId": "Page_02_Question"
    },
    {
      "code": 7,
      "targetElement": "P1.3_next_button",
      "eventType": "next_click",
      "value": "下一页",
      "time": "2025-11-22 14:30:25",
      "pageId": "Page_02_Question"
    },
    {
      "code": 8,
      "targetElement": "P1.3_页面",
      "eventType": "page_exit",
      "value": "Page_02_Question",
      "time": "2025-11-22 14:30:25",
      "pageId": "Page_02_Question"
    },
    {
      "code": 9,
      "targetElement": "P1.3_页面",
      "eventType": "page_submit_success",
      "value": {
        "duration": "300ms",
        "channel": "unified-submission-pipeline"
      },
      "time": "2025-11-22 14:30:25",
      "pageId": "Page_02_Question"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "问题：请写出你想探究的科学问题",
      "value": "温度如何影响馒头体积？"
    }
  ],
  "beginTime": "2025-11-22 14:30:00",
  "endTime": "2025-11-22 14:30:25",
  "imgList": []
}
```

**关键格式点**:
- `click_blocked` 事件：value 包含 `reason` 和 `missing` 数组
- 阻断后继续操作：记录后续的输入事件
- 完成后成功提交：`next_click` + `page_submit_success`

---

#### 2.5 超时场景样例：Page_00_1_Notice（40秒倒计时超时自动提交）

**场景**: 倒计时结束 → 用户未勾选复选框/未点击下一页 → **40秒后自动触发提交** → 补齐占位答案

**关键要求**:
- **MUST 走 `usePageSubmission` 的超时分支**，不能直接调用提交 API
- Hook 层自动补齐占位答案（如 `"超时未确认"`）
- 自动追加 `auto_submit` 事件（在 `timer_complete` 后）
- 自动追加 `page_exit` 和 `page_submit_success/failed` 事件

```json
{
  "pageNumber": "1.1",
  "pageDesc": "[grade7-experiment/experiment/1] 注意事项",
  "operationList": [
    {
      "code": 1,
      "targetElement": "P1.1_页面",
      "eventType": "page_enter",
      "value": "Page_00_1_Notice",
      "time": "2025-11-22 14:00:00",
      "pageId": "Page_00_1_Notice"
    },
    {
      "code": 2,
      "targetElement": "P1.1_页面",
      "eventType": "flow_context",
      "value": {
        "flowId": "grade7-experiment",
        "stepIndex": 1,
        "submoduleId": "experiment",
        "moduleName": "Grade7ExperimentModule",
        "pageId": "Page_00_1_Notice"
      },
      "time": "2025-11-22 14:00:00",
      "pageId": "Page_00_1_Notice"
    },
    {
      "code": 3,
      "targetElement": "P1.1_notice_countdown",
      "eventType": "timer_start",
      "value": "倒计时开始（40秒）",
      "time": "2025-11-22 14:00:00",
      "pageId": "Page_00_1_Notice"
    },
    {
      "code": 4,
      "targetElement": "P1.1_notice_countdown",
      "eventType": "timer_complete",
      "value": "倒计时结束",
      "time": "2025-11-22 14:00:40",
      "pageId": "Page_00_1_Notice"
    },
    {
      "code": 5,
      "targetElement": "P1.1_页面",
      "eventType": "auto_submit",
      "value": {
        "reason": "超时自动提交",
        "triggerTime": "2025-11-22 14:00:40",
        "timeout": 40
      },
      "time": "2025-11-22 14:00:40",
      "pageId": "Page_00_1_Notice"
    },
    {
      "code": 6,
      "targetElement": "P1.1_页面",
      "eventType": "page_exit",
      "value": "Page_00_1_Notice",
      "time": "2025-11-22 14:00:40",
      "pageId": "Page_00_1_Notice"
    },
    {
      "code": 7,
      "targetElement": "P1.1_页面",
      "eventType": "page_submit_success",
      "value": {
        "duration": "280ms",
        "channel": "unified-submission-pipeline"
      },
      "time": "2025-11-22 14:00:40",
      "pageId": "Page_00_1_Notice"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "确认：已阅读并同意注意事项？",
      "value": "超时未确认"
    }
  ],
  "beginTime": "2025-11-22 14:00:00",
  "endTime": "2025-11-22 14:00:40",
  "imgList": []
}
```

**关键格式点**:
- **超时触发**: `timer_complete` 后，用户未操作，系统自动触发 `auto_submit`
- **占位答案**: Hook 层自动补齐 `"超时未确认"` 到 answerList（不能为空）
- **事件顺序**: `timer_complete` → `auto_submit` → `page_exit` → `page_submit_success/failed`
- **auto_submit value**: 包含 `reason`, `triggerTime`, `timeout` 等元数据
- **实现要求**: 页面组件监听 `timer_complete` 后，调用 `usePageSubmission` 的超时提交方法（如 `submitOnTimeout()`），而非直接调用 `submit()`

---

### 3. 测试与验证策略

#### 3.1 快照测试（Snapshot Testing）
**文件位置**: `src/modules/grade-7/experiment/__tests__/submission/`

**测试页面**:
1. `Page02Question.snapshot.test.js` - 输入页（含阻断场景）
2. `Page03Experiment.snapshot.test.js` - 实验页
3. `Page01Notice.snapshot.test.js` - 计时页
4. `Page04Conclusion.snapshot.test.js` - 输入页（验证一致性）

**快照基线**:
```
__tests__/fixtures/
├── page01-notice-baseline.json
├── page02-question-baseline.json
├── page02-question-blocked-baseline.json
├── page03-experiment-baseline.json
└── page04-conclusion-baseline.json
```

**校验点**:
- ✅ `pageNumber` 格式：`<stepIndex>.<subPageNum>`
- ✅ `pageDesc` 前缀：`[flowId/submoduleId/stepIndex]`
- ✅ `operationList.targetElement` 前缀：`P${pageNumber}_...`
- ✅ `answerList.targetElement` 使用完整问题文本（或实验历史描述），参考 `docs/submodule-submission-guidelines.md` 第16-97行
- ✅ 单选/判断题 `answerList.value` 含选项标签与完整文本（如 `"A. 已阅读并同意"`）
- ✅ `flow_context` 事件完整
- ✅ 最小事件集合：page_enter/exit + next_click + 输入/选择事件
- ✅ `operationList` code 连续自增
- ✅ `answerList` 仅非空
- ✅ 时间格式：`YYYY-MM-DD HH:mm:ss`

#### 3.2 Schema 校验
**位置**: `@shared/services/submission/schema.ts`

**校验时机**:
- 提交前：`usePageSubmission.submit()` 内部
- 测试时：快照测试自动执行
- CI：所有提交格式快照测试

#### 3.3 最小事件集合守卫
**ESLint 规则**: `eslint-plugin-submission-guard`

**守卫规则**:
- 每页必须有 page_enter/exit
- 输入页必须有 input_focus/change/blur
- 阻断必须记录 click_blocked（含 missing）
- 提交必须记录 next_click + submit_success/failed

#### 3.4 CI/Lint 守卫
**禁止项**:
- 直连 `/stu/saveHcMark`
- 手写旧格式 pageNumber（纯数字或 `M*`）
- 手写 targetElement（无前缀）
- 绕过 `usePageSubmission`

**CI 配置**:
```yaml
# .github/workflows/submission-guard.yml
jobs:
  lint:
    run: npm run lint:submission
  snapshot-test:
    run: npm run test:submission-snapshots
```

---

## Risks / Trade-offs

### Risk 1: 迁移期间数据格式不一致
**影响**: 中（影响数据分析）
**概率**: 中

**缓解措施**:
- 分页逐步迁移，每页独立测试
- Schema 校验阻断不合规数据
- 快照测试确保格式一致性

### Risk 2: 旧代码回退
**影响**: 高（破坏迁移成果）
**概率**: 低

**缓解措施**:
- CI/Lint 守卫阻断旧格式代码
- Code Review 检查清单
- 移除旧代码（buildMarkObject, submitPageData）

### Risk 3: 性能回退
**影响**: 低（用户体验下降）
**概率**: 低

**缓解措施**:
- 性能基准测试（页面加载 <2s）
- 提交耗时监控（<500ms）
- 优化大数据量提交（实验历史 JSON 压缩）

### Risk 4: 用户体验下降
**影响**: 中（用户无法完成测评）
**概率**: 低

**缓解措施**:
- 计时页倒计时结束允许提交（超时记录）
- 加载状态提示（Spinner）
- 错误提示优化（可读的 Schema 校验错误）

---

## Open Questions

### Q1: 实验历史 JSON 字符串是否需要压缩？
**背景**: 多次实验记录可能较大（10次实验 ~5KB）

**选项**:
- A. 不压缩，直接 JSON.stringify
- B. 使用 LZ-string 压缩
- C. 限制实验次数（最多10次）

**建议**: 先实施 A（不压缩），监控数据大小后决定

### Q2: 倒计时结束未勾选复选框是否允许提交？ ✅ **已决策**
**背景**: 用户可能忽略复选框

**选项**:
- A. 允许提交，记录为超时（`auto_submit`）
- B. 强制要求勾选复选框

**决策**: **实施 A（允许超时提交）** - 已在本提案中明确实现
- 超时链路：`timer_complete` 后 → 监听超时 → 调用 `usePageSubmission.submitOnTimeout()`
- Hook 层自动补齐占位答案（`"超时未确认"`）并追加 `auto_submit` 事件
- 见 design.md § 2.5 超时场景样例 和 spec.md § 计时页面事件与超时提交

### Q3: 选择控件使用 select_change 还是 radio_select？ ✅ **已决策**
**背景**: 统一规范要求选择类事件使用 `select_change`，避免与事件枚举冲突

**选项**:
- A. 统一使用 `select_change`（推荐）
- B. 保留 `radio_select` 并更新规范

**决策**: **实施 A（统一使用 select_change）** - 已在本提案中强制执行
- 实验页（Page_03_Experiment）的温度/容器选择 **MUST 使用 `select_change`**
- **禁止使用 `radio_select`**（已弃用，与统一规范的事件枚举冲突）
- 见 spec.md § 选择控件事件（含实现约束）和 tasks.md § 3.3.2

### Q4: 是否需要迁移历史数据？
**背景**: 已有用户提交的旧格式数据

**选项**:
- A. 前端只提交新格式，后端兼容旧格式（推荐）
- B. 数据清洗脚本转换旧数据

**建议**: 实施 A，后端负责兼容和清洗

---

## 附录

### A. 文件清单
**修改文件**:
```
src/modules/grade-7/experiment/
├── context/ExperimentContext.jsx       # 移除 buildMarkObject
├── hooks/useDataLogger.js              # 移除 submitPageData
├── pages/
│   ├── Page01_Notice.jsx               # 接入 usePageSubmission
│   ├── Page02_Question.jsx             # 补全输入事件
│   ├── Page03_Experiment.jsx           # 补全实验事件
│   └── Page04_Conclusion.jsx           # 补全输入事件
└── __tests__/
    ├── submission/
    │   ├── Page01Notice.snapshot.test.js
    │   ├── Page02Question.snapshot.test.js
    │   ├── Page03Experiment.snapshot.test.js
    │   └── Page04Conclusion.snapshot.test.js
    └── fixtures/
        ├── page01-notice-baseline.json
        ├── page02-question-baseline.json
        ├── page03-experiment-baseline.json
        └── page04-conclusion-baseline.json
```

**新增文件**:
```
@shared/services/submission/
├── schema.ts                           # Schema 定义
└── encodeCompositePageNum.ts           # 页码编码工具

eslint-plugin-submission-guard/         # ESLint 守卫插件
├── rules/
│   ├── no-direct-api-call.js
│   ├── no-manual-prefix.js
│   └── use-unified-submission.js
└── index.js
```

### B. 参考文档
- [统一提交数据格式规范](docs/submission-format-standard.md)
- [数据格式规范](openspec/changes/update-unified-submission-pipeline/specs/data-format/spec.md)
- [提交流程规范](openspec/changes/update-unified-submission-pipeline/specs/submission/spec.md)

---

**文档版本**: v1.0
**最后更新**: 2025-11-22
**状态**: 待评审
