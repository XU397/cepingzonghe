# g7-tracking-experiment 模块迁移详细说明

---

## 零、重要前提：Flow 体系下的两层编码

### 0.1 编码体系说明

本迁移方案基于 **Flow 编排体系**，页码采用 **两层编码**：

**第一层：子模块内部**（固定不变）
- `submoduleId`: **g7-tracking-experiment**
- `subPageNum`: **1, 2, 3, ..., 14**（子模块内部的相对页码，从 1 开始）
- CMI 接口：`getInitialPage(subPageNum)` 返回 pageId

**第二层：提交层转换**（运行时动态）
- `pageNumber = encodeCompositePageNum(stepIndex, subPageNum)`
- **stepIndex** 由 **Flow 配置**决定（登录时后端返回），**不是子模块的固定属性**
- 格式：`<stepIndex>.<subPageNum>`（例如：`0.1`、`1.6`、`2.14`）

### 0.2 关键概念澄清

**❌ 常见误解**：
- g7-tracking-experiment 的 stepIndex 永远是 0（或任何固定值）
- stepIndex 可以硬编码在代码中

**✅ 正确理解**：
- **stepIndex 由 Flow 配置动态决定**，同一子模块在不同 Flow 中的 stepIndex 可能完全不同
- 登录时后端返回：`{ url: '/flow/<flowId>', progress: { stepIndex, modulePageNum } }`
- FlowModule 运行时将 stepIndex 注入到子模块组件，子模块使用该值生成 pageNumber
- **禁止在代码中硬编码 stepIndex**

### 0.3 示例说明

**Flow A**（实验单独运行）：
- Step 0: g7-tracking-experiment（**stepIndex = 0**）
  - subPageNum: 1, 2, 3, ..., 14
  - pageNumber: **"0.1", "0.2", "0.3", ..., "0.14"**
  - pageDesc: `[flow-experiment-only/g7-tracking-experiment/0] 注意事项`

**Flow B**（实验 + 问卷）：
- Step 0: g4-experiment（stepIndex = 0）
- Step 1: g7-tracking-experiment（**stepIndex = 1**）
  - subPageNum: 1, 2, 3, ..., 14
  - pageNumber: **"1.1", "1.2", "1.3", ..., "1.14"**
  - pageDesc: `[flow-full-assessment/g7-tracking-experiment/1] 注意事项`

**Flow C**（多模块组合）：
- Step 0: g4-experiment
- Step 1: g7-experiment
- Step 2: g7-tracking-experiment（**stepIndex = 2**）
  - pageNumber: **"2.1", "2.2", ..., "2.14"**

### 0.4 本文档约定与警示

**约定**：
- **本文档所有示例默认使用 stepIndex = 0**（实验作为 Flow 第一步的最常见场景）
- pageDesc 前缀示例：`[<flowId>/g7-tracking-experiment/<stepIndex>]`
- 实际 flowId 和 stepIndex 由运行时的 Flow 配置决定

**⚠️ 实施警示**：
- ❌ **禁止在代码中硬编码 stepIndex = 0**（或任何固定值）
- ✅ **必须从 Flow 上下文（props 或 context）动态获取 stepIndex**
- ✅ **所有 pageNumber、pageDesc、targetElement、flow_context 必须使用运行时的 stepIndex**
- ✅ **Schema 校验必须接受任意 stepIndex**（`/^\d+\.(1[0-4]|[1-9])$/`）

---

## 一、迁移页清单

### 1.1 交互实验子模块（14页）

**⚠️ 重要说明**：
- **subPageNum**（第一列）：子模块内部固定的相对页码（1-14，从 1 开始），不随 Flow 变化
- **pageNumber**（第二列）：运行时生成的复合页码 `<stepIndex>.<subPageNum>`
  - **表格中使用 stepIndex=0 仅作默认示例**
  - 实际 stepIndex 由 **Flow 配置决定**，可能是 0、1、2 或任何非负整数
  - 代码实现**禁止硬编码 stepIndex**，必须从 Flow 上下文动态获取

| subPageNum (固定) | pageNumber (假设 stepIndex=0) | pageId | 页面标题 | 类型 | 特殊处理 | 备注 |
|------------------|----------------------------|--------|---------|------|---------|------|
| **1** | `<stepIndex>.1` (示例: 0.1) | Page_00_1_Precautions | 注意事项 | 过渡页 | **40秒倒计时自动提交** | timer_start/timer_complete/auto_submit，复选框校验阻断 |
| **2** | `<stepIndex>.2` (示例: 0.2) | Page_01_Intro | 蜂蜜的奥秘 | 实验-介绍 | - | 简单展示页 |
| **3** | `<stepIndex>.3` (示例: 0.3) | Page_02_Question | 提出问题 | 实验-问题 | - | 简单展示页 |
| **4** | `<stepIndex>.4` (示例: 0.4) | Page_03_Resource | 资料阅读 | 实验-资源 | - | 简单展示页 |
| **5** | `<stepIndex>.5` (示例: 0.5) | Page_04_Hypothesis | 假设陈述 | 实验-假设 | - | 展示天气图，无输入 |
| **6** | `<stepIndex>.6` (示例: 0.6) | Page_05_Design | 方案设计 | 实验-设计 | **输入校验阻断** | 含单选/多选题，click_blocked 含 missing 列表 |
| **7** | `<stepIndex>.7` (示例: 0.7) | Page_06_Evaluation | 方案评估 | 实验-评估 | **输入校验阻断** | 含单选题，需 focus/change/blur 完整链路 |
| **8** | `<stepIndex>.8` (示例: 0.8) | Page_07_Transition | 过渡页 | 实验-过渡 | - | 实验开始提示 |
| **9** | `<stepIndex>.9` (示例: 0.9) | Page_08_Experiment | 模拟实验 | **实验-核心操作** | **复杂实验操作+计时** | simulation_timing_started/simulation_run_result，参数调整，实验历史记录（最多10次） |
| **10** | `<stepIndex>.10` (示例: 0.10) | Page_09_Analysis1 | 实验分析1 | 实验-分析 | **输入校验阻断** | 含输入框，需完整 focus/change/delete/blur |
| **11** | `<stepIndex>.11` (示例: 0.11) | Page_10_Analysis2 | 实验分析2 | 实验-分析 | **输入校验阻断** | 含输入框 |
| **12** | `<stepIndex>.12` (示例: 0.12) | Page_11_Analysis3 | 实验分析3 | 实验-分析 | **输入校验阻断** | 含输入框 |
| **13** | `<stepIndex>.13` (示例: 0.13) | Page_12_Solution | 方案选择 | 实验-选择 | **输入校验阻断** | 含单选题 |
| **14** | `<stepIndex>.14` (示例: 0.14) | Page_13_Summary | 任务总结 | 实验-总结 | - | 展示页 |

**编码公式**：
```typescript
// 运行时动态计算（禁止硬编码）
const stepIndex = flowContext.stepIndex; // 从 Flow 上下文获取
const pageNumber = `${stepIndex}.${subPageNum}`; // 例如："0.6", "1.9", "2.14"
const pageDesc = `[${flowId}/${submoduleId}/${stepIndex}] ${pageTitle}`;
const targetElementPrefix = `P${pageNumber}_`; // 例如："P0.6_", "P1.9_"
```

> 总计 14 页（交互实验子模块 `<stepIndex>.1` ~ `<stepIndex>.14`），本变更仅覆盖 g7-tracking-experiment，问卷子模块已拆分且不在本提案范围，完成页由 Flow 独立配置。

---

## 二、样例快照（期望 MarkObject）

### 2.0 样例说明与假设条件

**本节所有样例假设**：
- **Flow ID**: `flow-experiment-only`（实验单独运行的 Flow）
- **stepIndex**: `0`（g7-tracking-experiment 在该 Flow 中作为第一步）
- **submoduleId**: `g7-tracking-experiment`

**动态字段格式**：
- **pageNumber** 格式：`<stepIndex>.<subPageNum>` = `0.1` - `0.14`（假设 stepIndex=0）
- **pageDesc** 格式：`[<flowId>/<submoduleId>/<stepIndex>] <pageTitle>`
  - 示例：`[flow-experiment-only/g7-tracking-experiment/0] 注意事项`
- **targetElement** 前缀：`P<pageNumber>_...` = `P0.1_...` - `P0.14_...`
- **flow_context.value**: 包含真实 `flowId`、`submoduleId`、`stepIndex`

**⚠️ 实际运行时**：
- Flow 配置可能不同，stepIndex 可能是 1、2、3 等任意值
- 所有动态字段（pageNumber、pageDesc、targetElement、flow_context）会相应变化
- **代码实现禁止硬编码这些示例值**

---

### 2.1 样例 1：输入页 - Page_05_Design（方案设计）

**场景描述**：
- 包含单选题和多选题
- 需要输入校验阻断
- 需完整记录 focus/change/blur 链路

**假设 Flow 上下文**（运行时动态获取）：
- flowId = "flow-experiment-only"
- stepIndex = 0
- submoduleId = "g7-tracking-experiment"
- subPageNum = 6

**期望 MarkObject**：

```json
{
  "pageNumber": "0.6",
  "pageDesc": "[flow-experiment-only/g7-tracking-experiment/0] 方案设计",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "Page_05_Design",
      "time": "2025-01-15 10:23:45",
      "pageId": "Page_05_Design"
    },
    {
      "code": 2,
      "targetElement": "flow_context",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-experiment-only\",\"submoduleId\":\"g7-tracking-experiment\",\"stepIndex\":0,\"moduleName\":\"7年级追踪测评-蜂蜜黏度探究\",\"pageId\":\"Page_05_Design\"}",
      "time": "2025-01-15 10:23:45",
      "pageId": "Page_05_Design"
    },
    {
      "code": 3,
      "targetElement": "P0.6_Q1_控制变量",
      "eventType": "input_focus",
      "value": "",
      "time": "2025-01-15 10:24:12"
    },
    {
      "code": 4,
      "targetElement": "P0.6_Q1_控制变量",
      "eventType": "input_change",
      "value": "{\"prev\":\"\",\"next\":\"温\"}",
      "time": "2025-01-15 10:24:13"
    },
    {
      "code": 5,
      "targetElement": "P0.6_Q1_控制变量",
      "eventType": "input_change",
      "value": "{\"prev\":\"温\",\"next\":\"温度\"}",
      "time": "2025-01-15 10:24:14"
    },
    {
      "code": 6,
      "targetElement": "P0.6_Q1_控制变量",
      "eventType": "input_blur",
      "value": "温度",
      "time": "2025-01-15 10:24:16"
    },
    {
      "code": 7,
      "targetElement": "P0.6_Q2_自变量",
      "eventType": "radio_select",
      "value": "含水量",
      "time": "2025-01-15 10:24:20"
    },
    {
      "code": 8,
      "targetElement": "P0.6_Q3_因变量",
      "eventType": "checkbox_check",
      "value": "黏度",
      "time": "2025-01-15 10:24:25"
    },
    {
      "code": 9,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "下一页",
      "time": "2025-01-15 10:24:30",
      "pageId": "Page_05_Design"
    },
    {
      "code": 10,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "Page_05_Design",
      "time": "2025-01-15 10:24:31",
      "pageId": "Page_05_Design"
    },
    {
      "code": 11,
      "targetElement": "提交管道",
      "eventType": "page_submit_success",
      "value": "{\"pageNumber\":\"0.6\",\"duration\":46,\"channel\":\"usePageSubmission\"}",
      "time": "2025-01-15 10:24:31",
      "pageId": "Page_05_Design"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.6_Q1_控制变量",
      "value": "温度"
    },
    {
      "code": 2,
      "targetElement": "P0.6_Q2_自变量",
      "value": "含水量"
    },
    {
      "code": 3,
      "targetElement": "P0.6_Q3_因变量",
      "value": "黏度"
    }
  ],
  "beginTime": "2025-01-15 10:23:45",
  "endTime": "2025-01-15 10:24:31",
  "imgList": []
}
```

**关键验证点**：
- ✅ `pageNumber` 使用复合格式 `<stepIndex>.<subPageNum>` = `"0.6"`（运行时动态生成）
- ✅ `pageDesc` 包含完整前缀 `[flowId/submoduleId/stepIndex] <title>`
- ✅ `targetElement` 使用前缀 `P<pageNumber>_*` = `P0.6_*`（运行时动态生成）
- ✅ **`flow_context` 事件自动注入**，包含：
  - `flowId`: 真实的 Flow ID（非 null）
  - `submoduleId`: g7-tracking-experiment
  - `stepIndex`: 运行时的值（示例中为 0）
  - `moduleName`: 子模块显示名称
  - `pageId`: 当前页面 ID

**阻断场景（未填写必答题）**：

```json
{
  "pageNumber": "0.6",
  "pageDesc": "[flow-experiment-only/g7-tracking-experiment/0] 方案设计",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "Page_05_Design",
      "time": "2025-01-15 10:23:45",
      "pageId": "Page_05_Design"
    },
    {
      "code": 2,
      "targetElement": "flow_context",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-experiment-only\",\"submoduleId\":\"g7-tracking-experiment\",\"stepIndex\":0,\"moduleName\":\"7年级追踪测评-蜂蜜黏度探究\",\"pageId\":\"Page_05_Design\"}",
      "time": "2025-01-15 10:23:45",
      "pageId": "Page_05_Design"
    },
    {
      "code": 3,
      "targetElement": "下一页按钮",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"未完成所有必答题\",\"missing\":[\"P0.6_Q1_控制变量\",\"P0.6_Q2_自变量\",\"P0.6_Q3_因变量\"]}",
      "time": "2025-01-15 10:24:10",
      "pageId": "Page_05_Design"
    },
    {
      "code": 4,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "Page_05_Design",
      "time": "2025-01-15 10:24:11",
      "pageId": "Page_05_Design"
    },
    {
      "code": 5,
      "targetElement": "提交管道",
      "eventType": "page_submit_failed",
      "value": "{\"reason\":\"blocked_missing_required\",\"missing\":[\"P0.6_Q1_控制变量\",\"P0.6_Q2_自变量\",\"P0.6_Q3_因变量\"]}",
      "time": "2025-01-15 10:24:11",
      "pageId": "Page_05_Design"
    }
  ],
  "answerList": [],
  "beginTime": "2025-01-15 10:23:45",
  "endTime": "2025-01-15 10:24:11",
  "imgList": []
}
```

**关键验证点**：
- ✅ `click_blocked` 事件包含 `missing` 数组，**使用运行时的 pageNumber 前缀**（`P0.6_*`）

---

### 2.2 样例 2：实验页 - Page_08_Experiment（模拟实验）

**场景描述**：
- 复杂实验操作（参数调整、计时、运行实验）
- 实验历史记录（最多10次）
- 需记录 simulation_timing_started / simulation_run_result

**假设 Flow 上下文**（运行时动态获取）：
- flowId = "flow-experiment-only"
- stepIndex = 0
- submoduleId = "g7-tracking-experiment"
- subPageNum = 9

**期望 MarkObject**：

```json
{
  "pageNumber": "0.9",
  "pageDesc": "[flow-experiment-only/g7-tracking-experiment/0] 模拟实验",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "Page_08_Experiment",
      "time": "2025-01-15 10:30:00",
      "pageId": "Page_08_Experiment"
    },
    {
      "code": 2,
      "targetElement": "flow_context",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-experiment-only\",\"submoduleId\":\"g7-tracking-experiment\",\"stepIndex\":0,\"moduleName\":\"7年级追踪测评-蜂蜜黏度探究\",\"pageId\":\"Page_08_Experiment\"}",
      "time": "2025-01-15 10:30:00",
      "pageId": "Page_08_Experiment"
    },
    {
      "code": 3,
      "targetElement": "P0.9_温度控制",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"temperature_change\",\"from\":25,\"to\":30}",
      "time": "2025-01-15 10:30:15"
    },
    {
      "code": 4,
      "targetElement": "P0.9_量筒选择",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"select_beaker\",\"waterContent\":15}",
      "time": "2025-01-15 10:30:20"
    },
    {
      "code": 5,
      "targetElement": "P0.9_计时开始按钮",
      "eventType": "simulation_timing_started",
      "value": "温度30°C",
      "time": "2025-01-15 10:30:25"
    },
    {
      "code": 6,
      "targetElement": "P0.9_模拟实验运行结果",
      "eventType": "simulation_run_result",
      "value": "{\"Run_ID\":\"run_Page_08_Experiment_1\",\"Set_Temperature\":30,\"Results\":[{\"WaterContent\":15,\"FallTime\":16.5},{\"WaterContent\":17,\"FallTime\":14.2},{\"WaterContent\":19,\"FallTime\":12.8},{\"WaterContent\":21,\"FallTime\":11.3}]}",
      "time": "2025-01-15 10:30:42"
    },
    {
      "code": 7,
      "targetElement": "P0.9_温度控制",
      "eventType": "simulation_operation",
      "value": "{\"action\":\"temperature_change\",\"from\":30,\"to\":35}",
      "time": "2025-01-15 10:31:10"
    },
    {
      "code": 8,
      "targetElement": "P0.9_计时开始按钮",
      "eventType": "simulation_timing_started",
      "value": "温度35°C",
      "time": "2025-01-15 10:31:15"
    },
    {
      "code": 9,
      "targetElement": "P0.9_模拟实验运行结果",
      "eventType": "simulation_run_result",
      "value": "{\"Run_ID\":\"run_Page_08_Experiment_2\",\"Set_Temperature\":35,\"Results\":[{\"WaterContent\":15,\"FallTime\":13.2},{\"WaterContent\":17,\"FallTime\":11.5},{\"WaterContent\":19,\"FallTime\":10.1},{\"WaterContent\":21,\"FallTime\":8.9}]}",
      "time": "2025-01-15 10:31:29"
    },
    {
      "code": 10,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "下一页",
      "time": "2025-01-15 10:32:00",
      "pageId": "Page_08_Experiment"
    },
    {
      "code": 11,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "Page_08_Experiment",
      "time": "2025-01-15 10:32:01",
      "pageId": "Page_08_Experiment"
    },
    {
      "code": 12,
      "targetElement": "提交管道",
      "eventType": "page_submit_success",
      "value": "{\"pageNumber\":\"0.9\",\"duration\":121,\"channel\":\"usePageSubmission\"}",
      "time": "2025-01-15 10:32:01",
      "pageId": "Page_08_Experiment"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.9_实验历史记录",
      "value": "[{\"runId\":1,\"temperature\":30,\"waterContent\":15,\"fallTime\":16.5},{\"runId\":2,\"temperature\":35,\"waterContent\":15,\"fallTime\":13.2}]"
    }
  ],
  "beginTime": "2025-01-15 10:30:00",
  "endTime": "2025-01-15 10:32:01",
  "imgList": []
}
```

**关键验证点**：
- ✅ 实验操作事件使用 `simulation_timing_started` 和 `simulation_run_result`
- ✅ `value` 字段支持对象类型（JSON 字符串化）
- ✅ 实验历史记录作为 answerList 的一项

---

### 2.3 样例 3：计时自动提交 - Page_00_1_Precautions（注意事项）

**场景描述**：
- 40秒倒计时自动提交
- 复选框校验阻断
- 需记录 timer_start / timer_complete / auto_submit

**假设 Flow 上下文**（运行时动态获取）：
- flowId = "flow-experiment-only"
- stepIndex = 0
- submoduleId = "g7-tracking-experiment"
- subPageNum = 1

**期望 MarkObject**：

```json
{
  "pageNumber": "0.1",
  "pageDesc": "[flow-experiment-only/g7-tracking-experiment/0] 注意事项",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "Page_00_1_Precautions",
      "time": "2025-01-15 10:00:00",
      "pageId": "Page_00_1_Precautions"
    },
    {
      "code": 2,
      "targetElement": "flow_context",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-experiment-only\",\"submoduleId\":\"g7-tracking-experiment\",\"stepIndex\":0,\"moduleName\":\"7年级追踪测评-蜂蜜黏度探究\",\"pageId\":\"Page_00_1_Precautions\"}",
      "time": "2025-01-15 10:00:00",
      "pageId": "Page_00_1_Precautions"
    },
    {
      "code": 3,
      "targetElement": "P0.1_倒计时器",
      "eventType": "timer_start",
      "value": "{\"duration\":40,\"scope\":\"module.g7-tracking.notice\"}",
      "time": "2025-01-15 10:00:00"
    },
    {
      "code": 4,
      "targetElement": "下一页按钮",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"倒计时未完成\",\"missing\":[\"timer_not_complete\"]}",
      "time": "2025-01-15 10:00:10",
      "pageId": "Page_00_1_Precautions"
    },
    {
      "code": 5,
      "targetElement": "P0.1_倒计时器",
      "eventType": "timer_complete",
      "value": "倒计时结束",
      "time": "2025-01-15 10:00:40"
    },
    {
      "code": 6,
      "targetElement": "P0.1_阅读确认复选框",
      "eventType": "checkbox_check",
      "value": "已阅读注意事项",
      "time": "2025-01-15 10:00:42"
    },
    {
      "code": 7,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "下一页",
      "time": "2025-01-15 10:00:45",
      "pageId": "Page_00_1_Precautions"
    },
    {
      "code": 8,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "Page_00_1_Precautions",
      "time": "2025-01-15 10:00:46",
      "pageId": "Page_00_1_Precautions"
    },
    {
      "code": 9,
      "targetElement": "提交管道",
      "eventType": "page_submit_success",
      "value": "{\"pageNumber\":\"0.1\",\"duration\":46,\"channel\":\"usePageSubmission\"}",
      "time": "2025-01-15 10:00:46",
      "pageId": "Page_00_1_Precautions"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.1_阅读确认复选框",
      "value": "已阅读注意事项"
    }
  ],
  "beginTime": "2025-01-15 10:00:00",
  "endTime": "2025-01-15 10:00:46",
  "imgList": []
}
```

**关键验证点**：
- ✅ `timer_start` 事件标记计时启动
- ✅ `timer_complete` 事件标记计时到期
- ✅ `click_blocked` 事件说明阻断原因

---

## 三、验证/测试计划

### 3.1 快照验证策略

#### 3.1.1 快照覆盖范围

**必须包含的快照**：
1. **subPageNum 1 - 注意事项（计时自动提交）** ✅
   - 验证：timer_start/timer_complete/click_blocked
2. **subPageNum 6 - 方案设计（输入校验阻断）** ✅
   - 验证：focus/change/blur/click_blocked 含 missing 列表
3. **subPageNum 9 - 模拟实验（实验操作）** ✅
   - 验证：simulation_timing_started/simulation_run_result/实验历史

**可选增补快照**（不同 stepIndex）：
4. **subPageNum 1（stepIndex=1）**：验证 Flow B 场景（多模块 Flow）
5. **subPageNum 10-13 - 分析页**（不同输入类型）

#### 3.1.2 Fixture 文件结构

```
src/shared/services/submission/__tests__/fixtures/
├── g7-tracking-experiment/
│   ├── subpage-1-stepindex-0-notice.json          # 样例3：注意事项（stepIndex=0）
│   ├── subpage-6-stepindex-0-design.json          # 样例1：方案设计（stepIndex=0）
│   ├── subpage-6-stepindex-0-blocked.json         # 样例1：方案设计阻断（stepIndex=0）
│   ├── subpage-9-stepindex-0-experiment.json      # 样例2：模拟实验（stepIndex=0）
│   ├── subpage-1-stepindex-1-notice.json          # 额外：stepIndex=1 的注意事项快照（验证动态性）
│   └── README.md                                   # 快照说明文档
```

每个 fixture 文件包含：
- `flowContext`：{ flowId, stepIndex, submoduleId }（**运行时动态值**）
- `subPageNum`：子模块内部页码（固定值）
- `expected`：期望的 MarkObject
- `scenario`：场景描述

### 3.2 Schema 校验规则

#### 3.2.1 必需字段校验

```typescript
// src/shared/services/submission/schema.ts

import { z } from 'zod';

const G7TrackingExperimentSchema = z.object({
  // 复合页码：支持任意 stepIndex，subPageNum 固定 1-14
  pageNumber: z.string().regex(/^\d+\.(1[0-4]|[1-9])$/),

  // pageDesc 前缀：[flowId/submoduleId/stepIndex] <title>
  pageDesc: z.string().regex(/^\[[\w-]+\/g7-tracking-experiment\/\d+\]/),

  operationList: z.array(
    z.object({
      code: z.number().int().positive(),
      targetElement: z.string(),
      eventType: z.enum([
        'page_enter', 'page_exit',
        'input_focus', 'input_blur', 'input_change', 'input_delete',
        'select_change', 'radio_select', 'checkbox_check', 'checkbox_uncheck',
        'next_click', 'click_blocked',
        'timer_start', 'timer_stop', 'timer_complete',
        'simulation_timing_started', 'simulation_run_result', 'simulation_operation',
        'flow_context',
        'page_submit_success', 'page_submit_failed'
      ]),
      value: z.string(),
      time: z.string().regex(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/),
      pageId: z.string().optional()
    })
  ).min(1),

  answerList: z.array(
    z.object({
      code: z.number().int().positive(),
      // targetElement 前缀：P<stepIndex>.<subPageNum>_*
      targetElement: z.string().regex(/^P\d+\.(1[0-4]|[1-9])_/),
      value: z.string().min(1) // 非空答案
    })
  ),

  beginTime: z.string(),
  endTime: z.string(),
  imgList: z.array(z.any()).default([])
});

// ⚠️ 关键校验：stepIndex 与 pageNumber 一致性
function validateStepIndexConsistency(markObject, flowContext) {
  const expectedPrefix = `${flowContext.stepIndex}.`;
  if (!markObject.pageNumber.startsWith(expectedPrefix)) {
    throw new Error(
      `pageNumber "${markObject.pageNumber}" 与 stepIndex ${flowContext.stepIndex} 不一致。` +
      `期望前缀: "${expectedPrefix}"`
    );
  }

  // 验证 targetElement 前缀
  const expectedTargetPrefix = `P${flowContext.stepIndex}.`;
  markObject.answerList.forEach(answer => {
    if (!answer.targetElement.startsWith(expectedTargetPrefix)) {
      throw new Error(
        `targetElement "${answer.targetElement}" 前缀与 stepIndex ${flowContext.stepIndex} 不一致`
      );
    }
  });

  // 验证 pageDesc 包含正确的 stepIndex
  const pageDescPattern = new RegExp(`\\[.+/.+/${flowContext.stepIndex}\\]`);
  if (!pageDescPattern.test(markObject.pageDesc)) {
    throw new Error(
      `pageDesc "${markObject.pageDesc}" 未包含正确的 stepIndex ${flowContext.stepIndex}`
    );
  }

  // 验证 flow_context 的 stepIndex
  const flowContextEvent = markObject.operationList.find(op => op.eventType === 'flow_context');
  if (flowContextEvent) {
    const flowContextValue = JSON.parse(flowContextEvent.value);
    if (flowContextValue.stepIndex !== flowContext.stepIndex) {
      throw new Error(
        `flow_context.stepIndex ${flowContextValue.stepIndex} 与运行时 stepIndex ${flowContext.stepIndex} 不一致`
      );
    }
  }
}
```

#### 3.2.2 事件集合完整性校验

**最小必需事件**（每页必须包含）：
- ✅ `page_enter`（进入页面）
- ✅ `page_exit`（离开页面）
- ✅ `next_click` 或 `auto_submit`（提交触发）
- ✅ `page_submit_success` 或 `page_submit_failed`（提交结果）

**特殊页面额外要求**：
- **subPageNum 1（注意事项页）**：必须包含 `timer_start` + **`flow_context`**
  - `flow_context.value` 必须包含：`{ flowId, submoduleId, stepIndex, moduleName }`
  - flowId **不能为 null**
  - stepIndex **必须与 pageNumber 第一段一致**
- **阻断场景**：必须包含 `click_blocked`（含 missing 列表，使用运行时的 pageNumber 前缀）
- **subPageNum 9（模拟实验）**：必须包含 `simulation_timing_started` + `simulation_run_result`

### 3.3 targetElement 前缀校验

**Lint 规则**（ESLint 插件或自定义脚本）：

```javascript
// .eslintrc.submission-rules.json

{
  "rules": {
    "submission/valid-target-element-prefix": "error",
    "submission/no-hardcoded-stepindex": "error"
  }
}

// 规则实现：
// 1. 禁止手写 targetElement 不含 P<stepIndex>.<subPageNum>_ 前缀
// 2. 禁止硬编码 stepIndex（如 "P0.6_"）
// 3. 必须使用动态生成：`P${flowContext.stepIndex}.${subPageNum}_`
// 4. 正则：/^P\d+\.(1[0-4]|[1-9])_/
```

**检查脚本示例**：

```bash
# CI 检查：扫描代码中硬编码的 stepIndex
npm run lint:hardcoded-stepindex

# 检查逻辑：
# ❌ const pageNumber = "0.6"; // 硬编码 stepIndex
# ❌ const targetElement = "P0.6_Q1_控制变量"; // 硬编码
# ✅ const pageNumber = `${flowContext.stepIndex}.${subPageNum}`;
# ✅ const targetElement = `P${pageNumber}_Q1_控制变量`;
```

### 3.4 Lint 守卫规则

#### 3.4.1 禁止直连接口

```bash
# CI 检查：禁止直接调用 /stu/saveHcMark
grep -r "'/stu/saveHcMark'" src/modules/grade-7-tracking/pages/
# 应返回 0 条结果（仅允许在 usePageSubmission 中调用）
```

#### 3.4.2 禁止硬编码 stepIndex

```bash
# CI 检查：禁止硬编码 stepIndex
grep -rE 'stepIndex\s*=\s*[0-9]' src/modules/grade-7-tracking/
# 应返回 0 条结果（禁止 stepIndex = 0 或任何固定值）

# 允许的写法：
# const { stepIndex } = flowContext; // 从上下文获取
# const pageNumber = encodeCompositePageNum(stepIndex, subPageNum);
```

### 3.5 历史数据兼容性

#### 3.5.1 兼容性策略

**问题**：旧数据使用 `pageNumber: "M2:11"` 或 `"Page_*"` 格式，新数据使用 `"<stepIndex>.<subPageNum>"`，后端需要识别。

**解决方案**：
1. **迁移期**（2周）：
   - 前端提交时在 `flow_context` 中添加 `legacyPageNum` 字段（可选）
   - 后端同时支持新旧两种页码格式的查询
2. **过渡期后**：
   - 后端数据清洗脚本：将旧格式数据转换为新格式（可选）
   - 前端停止写入 `legacyPageNum`

#### 3.5.2 数据清洗需求

**是否需要**：**否**（历史数据保持原样，仅新提交使用新格式）

**原因**：
- 旧数据已入库，修改风险高
- 分析时可通过 `pageNumber` 格式区分新旧数据
- 新旧数据可并存，按批次（batchCode）区分

---

## 四、测试执行清单

### 4.1 单元测试

```bash
# 测试文件位置
src/shared/services/submission/__tests__/g7-tracking-experiment.test.js

# 测试用例：
- [x] Schema 校验：合法 MarkObject 通过（支持任意 stepIndex）
- [x] Schema 校验：非法页码被拒绝（0.15, 1.0, M2:11）
- [x] Schema 校验：缺失必需事件被拒绝
- [x] targetElement 前缀：P0.6_Q1_控制变量 通过，Page_*_* 被拒绝
- [x] targetElement 前缀：P1.6_Q1_控制变量 通过（stepIndex=1）
- [x] stepIndex 一致性：pageNumber "0.6" 但 targetElement 用 "P1.6_" → 失败
- [x] stepIndex 一致性：flow_context.stepIndex=0 但 pageNumber="1.6" → 失败
- [x] 答案过滤：空答案不入列
- [x] code 自增：提交层生成连续 code
- [x] flow_context 注入：首页必须包含 flow_context 事件，包含 flowId/stepIndex
- [x] flow_context 校验：flowId 不能为 null
```

### 4.2 集成测试

```bash
# 测试环境：Mock 模式
npm run dev

# 手动测试步骤（Flow 模式 - stepIndex=0）：
1. 登录 → 后端返回 { url: '/flow/flow-experiment-only', progress: { stepIndex: 0, modulePageNum: 1 } }
2. 进入 FlowModule → 加载 g7-tracking-experiment（stepIndex=0）
3. 进入注意事项页（subPageNum 1）→ 验证：
   - 计时器启动
   - flow_context 注入（包含 flowId="flow-experiment-only", stepIndex=0）
   - pageNumber = "0.1"
4. 完成所有实验页 → 验证跳转到总结页
5. 检查提交数据（DevTools → Network → /stu/saveHcMark）：
   - pageNumber 格式："0.1" - "0.14"
   - pageDesc 包含：[flow-experiment-only/g7-tracking-experiment/0]
   - targetElement 使用 P0.1_, P0.2_, ..., P0.14_ 前缀
   - flow_context 包含 flowId + stepIndex=0
   - operationList 包含 flow_context + focus/blur/change/next_click
   - answerList 仅包含非空答案

# 手动测试步骤（Flow 模式 - stepIndex=1，验证动态性）：
1. 修改 Mock 数据：stepIndex = 1, flowId = "flow-full-assessment"
2. 进入注意事项页 → 验证：
   - pageNumber = "1.1"（不是 "0.1"）
   - pageDesc = "[flow-full-assessment/g7-tracking-experiment/1] ..."
   - targetElement = P1.1_倒计时器（不是 P0.1_）
   - flow_context.stepIndex = 1（不是 0）
3. 完成实验 → 验证所有页面的 pageNumber："1.1" - "1.14"
```

### 4.3 快照测试

```bash
# 快照测试文件
src/shared/services/submission/__tests__/submission-format.snapshot.test.js

# 测试逻辑：
describe('G7-Tracking-Experiment Submission Format', () => {
  it('should match snapshot for subPageNum 1 (stepIndex=0, notice)', () => {
    const fixture = require('./fixtures/g7-tracking-experiment/subpage-1-stepindex-0-notice.json');
    const flowContext = { flowId: 'flow-experiment-only', stepIndex: 0, submoduleId: 'g7-tracking-experiment' };
    const result = buildMarkObject(flowContext, fixture.subPageNum, fixture.inputs);

    expect(result.pageNumber).toBe('0.1');
    expect(result.pageDesc).toContain('[flow-experiment-only/g7-tracking-experiment/0]');
    expect(result.operationList.find(op => op.eventType === 'flow_context')).toBeDefined();
    expect(result).toMatchSnapshot();
  });

  it('should match snapshot for subPageNum 6 (stepIndex=0, design)', () => {
    // ...
  });

  it('should match snapshot for subPageNum 9 (stepIndex=0, experiment)', () => {
    // ...
  });

  it('should work with different stepIndex (stepIndex=1)', () => {
    const fixture = require('./fixtures/g7-tracking-experiment/subpage-1-stepindex-1-notice.json');
    const flowContext = { flowId: 'flow-full-assessment', stepIndex: 1, submoduleId: 'g7-tracking-experiment' };
    const result = buildMarkObject(flowContext, fixture.subPageNum, fixture.inputs);

    expect(result.pageNumber).toBe('1.1'); // 不是 0.1
    expect(result.pageDesc).toContain('[flow-full-assessment/g7-tracking-experiment/1]'); // 不是 0
    expect(result.answerList[0]?.targetElement || result.operationList[0].targetElement).toMatch(/^P1\.1_/); // 不是 P0.1_
  });
});
```

---

## 五、迁移验收标准

### 5.1 代码质量

- [ ] 所有实验页面使用 `usePageSubmission` Hook
- [ ] 移除所有直连 `/stu/saveHcMark` 的代码
- [ ] 移除手写 `pageNumber`/`targetElement` 前缀逻辑
- [ ] **禁止硬编码 stepIndex**（必须从 Flow 上下文获取）
- [ ] Lint 检查通过（0 warnings, 0 errors）

### 5.2 数据格式

- [ ] 所有提交的 `pageNumber` 为 `<stepIndex>.<subPageNum>` 格式（**运行时动态生成**）
- [ ] 所有 `targetElement` 使用 `P<stepIndex>.<subPageNum>_` 前缀（**运行时动态生成**）
- [ ] 所有 `pageDesc` 包含 `[<flowId>/<submoduleId>/<stepIndex>] <title>` 前缀
- [ ] Schema 校验通过率 100%

### 5.3 事件完整性

- [ ] 每页至少包含：`page_enter` + `page_exit` + `next_click` + `page_submit_success`
- [ ] 输入控件记录：`input_focus` → `input_change` → `input_blur`
- [ ] 选择控件记录：`radio_select` / `checkbox_check`
- [ ] 阻断场景记录：`click_blocked`（含 missing 列表，**使用运行时的 pageNumber 前缀**）
- [ ] 计时页面记录：`timer_start` / `timer_complete`
- [ ] 实验页面记录：`simulation_timing_started` / `simulation_run_result`
- [ ] **首页必须包含 `flow_context` 事件**：
  - ✅ `flow_context.value.flowId` 不为 null
  - ✅ `flow_context.value.stepIndex` 与运行时一致
  - ✅ `flow_context.value.submoduleId = "g7-tracking-experiment"`

### 5.4 答案处理

- [ ] `answerList` 仅包含非空答案
- [ ] 实验历史记录作为 JSON 字符串存储

### 5.5 测试覆盖

- [ ] 单元测试：Schema 校验、前缀验证、答案过滤、flow_context 注入、**stepIndex 一致性校验** - 覆盖率 ≥ 80%
- [ ] 快照测试：3个典型场景（注意事项/方案设计/模拟实验）+ **不同 stepIndex**（0和1） - 快照匹配 100%
- [ ] 集成测试：手动验证完整实验流程（Flow 模式，**测试 stepIndex=0 和 stepIndex=1**） - 通过

### 5.6 Flow 适配与动态性

- [ ] CMI 包装器导出：`submoduleId = "g7-tracking-experiment"`
- [ ] CMI 接口实现：`getInitialPage(subPageNum)` 正确映射（1-14 → pageId）
- [ ] **支持任意 stepIndex**（从 Flow 上下文动态获取，禁止硬编码）
- [ ] **stepIndex 一致性**：确认以下字段的 stepIndex 值一致：
  - ✅ `pageNumber` 第一段 = `flowContext.stepIndex`
  - ✅ `targetElement` 前缀 `P<stepIndex>.*` = `flowContext.stepIndex`
  - ✅ `pageDesc` 中 `[.../stepIndex]` = `flowContext.stepIndex`
  - ✅ `flow_context.value.stepIndex` = `flowContext.stepIndex`
- [ ] 支持 Flow 切换（更换 flowId/stepIndex 后所有字段自动更新）

### 5.7 风险检查

- [ ] **禁止硬编码 stepIndex**：
  - ❌ 代码中不存在 `stepIndex = 0` 或任何固定值
  - ❌ 代码中不存在 `"0.6"`、`"P0.6_"` 等硬编码字符串
  - ✅ 所有 stepIndex 从 `flowContext.stepIndex` 或 props 获取
- [ ] **pageNumber 与 stepIndex 一致性**：
  - 提交前校验：`pageNumber.split('.')[0] === String(flowContext.stepIndex)`
  - CI 检查：`validateStepIndexConsistency(markObject, flowContext)`

---

## 六、迁移优先级与风险

### 6.1 迁移优先级

#### 高优先级（P0）

1. **Page_00_1_Precautions**（注意事项）- 入口页，计时逻辑关键
2. **Page_08_Experiment**（模拟实验）- 核心实验页，操作复杂
3. **Page_05_Design**（方案设计）- 典型输入页

#### 中优先级（P1）

4. 其他输入/选择页（Page_06、Page_09-12）

#### 低优先级（P2）

5. 展示页（Page_01-04、Page_07、Page_13）

### 6.2 风险与缓解

| 风险 | 严重性 | 缓解措施 |
|------|--------|---------|
| **页码格式变更导致后端解析失败** | 高 | 后端添加格式兼容层，支持旧格式和新格式 |
| **事件集合变更导致数据分析脚本失败** | 高 | 提前通知数据团队，更新分析脚本 |
| **计时逻辑迁移失败导致超时未提交** | 高 | 在 DEV/UAT 环境充分测试，保留旧逻辑作为降级方案 |
| **实验历史记录格式变更** | 中 | 保持 value 为 JSON 字符串格式，向后兼容 |
| **输入链路事件遗漏** | 中 | Lint 守卫检查最小事件集合，快照测试验证 |

---

## 七、附录

### 7.1 事件枚举完整列表

```typescript
enum EventType {
  // 页面生命周期
  PAGE_ENTER = 'page_enter',
  PAGE_EXIT = 'page_exit',

  // 通用交互
  CLICK = 'click',
  CHANGE = 'change',
  INPUT = 'input',

  // 输入类事件
  INPUT_BLUR = 'input_blur',
  INPUT_FOCUS = 'input_focus',
  INPUT_CHANGE = 'input_change',
  INPUT_DELETE = 'input_delete',

  // 选择类事件
  SELECT_CHANGE = 'select_change',
  RADIO_SELECT = 'radio_select',
  CHECKBOX_CHECK = 'checkbox_check',
  CHECKBOX_UNCHECK = 'checkbox_uncheck',

  // 模态框
  MODAL_OPEN = 'modal_open',
  MODAL_CLOSE = 'modal_close',

  // 资源查看
  VIEW_MATERIAL = 'view_material',

  // 计时器
  TIMER_START = 'timer_start',
  TIMER_STOP = 'timer_stop',
  TIMER_COMPLETE = 'timer_complete',

  // 实验操作
  SIMULATION_TIMING_STARTED = 'simulation_timing_started',
  SIMULATION_RUN_RESULT = 'simulation_run_result',
  SIMULATION_OPERATION = 'simulation_operation',

  // 上下文与自动化
  FLOW_CONTEXT = 'flow_context',
  AUTO_SUBMIT = 'auto_submit',

  // 导航与提交
  NEXT_CLICK = 'next_click',
  PAGE_SUBMIT_SUCCESS = 'page_submit_success',
  PAGE_SUBMIT_FAILED = 'page_submit_failed',
  CLICK_BLOCKED = 'click_blocked',
}
```

### 7.2 targetElement naming

```
Format: P${pageNumber}_<biz_id>

Examples:
- P0.1_timer
- P0.1_ack_checkbox
- P0.6_Q1_control
- P0.6_Q2_input
- P0.6_Q3_output
- P0.6_next_button
- P0.9_temp_control
- P0.9_beaker_select
- P0.9_timer_start
- P0.9_simulation_result
```

### 7.3 pageDesc naming

```
Format (with Flow): [${flowId}/${submoduleId}/${stepIndex}] ${pageTitle}

Examples:
- [flow-experiment-only/g7-tracking-experiment/0] 注意事项
- [flow-experiment-only/g7-tracking-experiment/0] 方案设计
- [flow-experiment-only/g7-tracking-experiment/0] 模拟实验
- [flow-full-assessment/g7-tracking-experiment/1] 实验分析1
```

### 7.4 CMI 包装器实现参考

```javascript
// src/modules/grade-7-tracking/submodules/g7-tracking-experiment.js

export const G7TrackingExperimentSubmodule = {
  submoduleId: 'g7-tracking-experiment',
  displayName: '7年级追踪测评-蜂蜜黏度探究',
  version: '1.0.0',

  // 子模块内部页码 → 页面ID映射（固定不变）
  getInitialPage(subPageNum) {
    const mapping = {
      1: 'Page_00_1_Precautions',
      2: 'Page_01_Intro',
      3: 'Page_02_Question',
      4: 'Page_03_Resource',
      5: 'Page_04_Hypothesis',
      6: 'Page_05_Design',
      7: 'Page_06_Evaluation',
      8: 'Page_07_Transition',
      9: 'Page_08_Experiment',
      10: 'Page_09_Analysis1',
      11: 'Page_10_Analysis2',
      12: 'Page_11_Analysis3',
      13: 'Page_12_Solution',
      14: 'Page_13_Summary'
    };
    return mapping[subPageNum] || 'Page_00_1_Precautions';
  },

  getTotalSteps() {
    return 14; // 14 个实验页面
  },

  getNavigationMode(pageId) {
    return 'experiment';
  },

  getDefaultTimers() {
    return {
      notice: 40,  // 40秒注意事项
      task: 2400   // 40分钟主任务
    };
  },

  Component: ({ userContext, initialPageId, flowContext }) => {
    // ⚠️ flowContext: { flowId, stepIndex, submoduleId }（运行时动态值）
    // ❌ 禁止：const stepIndex = 0; // 硬编码
    // ✅ 正确：const { stepIndex } = flowContext;

    if (!flowContext || flowContext.stepIndex === undefined) {
      throw new Error('flowContext.stepIndex 是必需的，禁止硬编码 stepIndex');
    }

    return <ExperimentFlow
      userContext={userContext}
      initialPageId={initialPageId}
      flowContext={flowContext} // 传递给页面组件，用于生成 pageNumber
    />;
  }
};
```

### 7.5 动态 pageNumber 生成示例

```javascript
// ❌ 错误示例（硬编码 stepIndex）
const pageNumber = "0.6"; // 禁止！
const targetElement = "P0.6_Q1_控制变量"; // 禁止！
const pageDesc = "[某流程/g7-tracking-experiment/0] 方案设计"; // 禁止！

// ✅ 正确示例（运行时动态生成）
import { encodeCompositePageNum, buildTargetElementPrefix, buildPageDescPrefix } from '@shared/utils/pageMapping';

function buildMarkData(flowContext, subPageNum, pageTitle, answers, operations) {
  const { flowId, stepIndex, submoduleId } = flowContext;

  // 动态生成 pageNumber
  const pageNumber = encodeCompositePageNum(stepIndex, subPageNum); // "0.6" 或 "1.6" 等

  // 动态生成 pageDesc 前缀
  const pageDescPrefix = buildPageDescPrefix(flowId, submoduleId, stepIndex); // "[flowId/submoduleId/stepIndex] "
  const pageDesc = `${pageDescPrefix}${pageTitle}`;

  // 动态生成 targetElement 前缀
  const targetPrefix = buildTargetElementPrefix(pageNumber); // "P0.6_" 或 "P1.6_"

  return {
    pageNumber,
    pageDesc,
    answerList: answers.map((ans, idx) => ({
      code: idx + 1,
      targetElement: `${targetPrefix}Q${idx + 1}_${ans.name}`, // "P0.6_Q1_控制变量" 或 "P1.6_Q1_控制变量"
      value: ans.value
    })),
    operationList: operations.map((op, idx) => ({
      code: idx + 1,
      targetElement: op.target.startsWith('P') ? op.target : `${targetPrefix}${op.target}`,
      eventType: op.eventType,
      value: op.value,
      time: op.time
    }))
  };
}
```

### 7.6 相关文档链接

- [统一提交数据格式规范](../../../docs/submission-format-standard.md)
- [数据格式规格](../../specs/data-format/spec.md)
- [提交流程规格](../../specs/submission/spec.md)
- [三端改造方案与职责边界](../../../docs/三端改造方案与职责边界.md)
- [需求-交互前端改造方案](../../../docs/需求-交互前端改造方案.md)
- [FLOW流程下pageNumber的提交规范](../../../docs/FLOW流程下pageNumber的提交规范.md)

---

**文档版本**：v3.0（修正 Flow 体系理解 + 遵循 QA 审核意见）
**最后更新**：2025-11-24
**维护人**：Claude Code
**审核状态**：待评审（已修正 QA 发现的问题）

**修订日志**：
- v3.0：按QA审核意见修正
  - 使用 stepIndex=0 作为默认示例（最常见场景）
  - 强调 stepIndex 动态性，禁止硬编码
  - pageDesc 格式统一为 `[<flowId>/<submoduleId>/<stepIndex>] <title>`
  - flow_context 包含真实 flowId（`flow-experiment-only`），不为 null
  - 新增 stepIndex 一致性校验函数
  - 新增风险检查项：禁止硬编码 stepIndex
  - 添加 CMI 包装器实现示例和动态 pageNumber 生成示例
