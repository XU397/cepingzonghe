# G7-Questionnaire 迁移详细清单与样例快照

本文档补全 `migrate-grade7-questionnaire-submission` 提案，提供迁移页清单、期望数据快照样例及验证计划。

---

## 零、重要前提：Flow 体系下的两层编码

### 0.1 编码体系说明

本迁移方案基于 **Flow 编排体系**，页码采用 **两层编码**：

**第一层：子模块内部**（固定不变）
- `submoduleId`: **g7-questionnaire**
- `subPageNum`: **0, 1, 2, 3, 4, 5, 6, 7, 8**（子模块内部的相对页码）
- CMI 接口：`getInitialPage(subPageNum)` 返回 pageId

**第二层：提交层转换**（运行时动态）
- `pageNumber = encodeCompositePageNum(stepIndex, subPageNum)`
- **stepIndex** 由 **Flow 配置**决定（登录时后端返回），**不是子模块的固定属性**
- 格式：`<stepIndex>.<subPageNum>`（例如：`0.3`、`1.5`、`2.8`）

### 0.2 关键概念澄清

**❌ 常见误解**：
- g7-questionnaire 的 stepIndex 永远是 1（实验后的问卷）
- stepIndex 可以硬编码在代码中

**✅ 正确理解**：
- **stepIndex 由 Flow 配置动态决定**，同一子模块在不同 Flow 中的 stepIndex 可能完全不同
- 登录时后端返回：`{ url: '/flow/<flowId>', progress: { stepIndex, modulePageNum } }`
- FlowModule 运行时将 stepIndex 注入到子模块组件，子模块使用该值生成 pageNumber
- **禁止在代码中硬编码 stepIndex**

### 0.3 示例说明

**Flow A**（问卷单独运行）：
- Step 0: g7-questionnaire（**stepIndex = 0**）
  - subPageNum: 0, 1, 2, ..., 8
  - pageNumber: **"0.0", "0.1", "0.2", ..., "0.8"**
  - pageDesc: `[flow-questionnaire-only/g7-questionnaire/0] 问卷调查说明`

**Flow B**（实验 + 问卷）：
- Step 0: g7-experiment（stepIndex = 0）
- Step 1: g7-questionnaire（**stepIndex = 1**）
  - subPageNum: 0, 1, 2, ..., 8
  - pageNumber: **"1.0", "1.1", "1.2", ..., "1.8"**
  - pageDesc: `[flow-full-assessment/g7-questionnaire/1] 问卷调查说明`

**Flow C**（多模块组合）：
- Step 0: g4-experiment
- Step 1: g7-experiment
- Step 2: g7-questionnaire（**stepIndex = 2**）
  - pageNumber: **"2.0", "2.1", ..., "2.8"**

### 0.4 本文档约定与警示

**约定**：
- **本文档所有示例默认使用 stepIndex = 0**（问卷作为 Flow 第一步的场景）
- pageDesc 前缀示例：`[<flowId>/g7-questionnaire/<stepIndex>]`
- 实际 flowId 和 stepIndex 由运行时的 Flow 配置决定

**⚠️ 实施警示**：
- ❌ **禁止在代码中硬编码 stepIndex = 0**（或任何固定值）
- ✅ **必须从 Flow 上下文（props 或 context）动态获取 stepIndex**
- ✅ **所有 pageNumber、pageDesc、targetElement、flow_context 必须使用运行时的 stepIndex**
- ✅ **Schema 校验必须接受任意 stepIndex**（`/^\d+\.[0-8]$/`）

---

## 一、迁移页清单

### 1.1 页面总览

**⚠️ 重要说明**：
- **subPageNum**（第一列）：子模块内部固定的相对页码（0-8），不随 Flow 变化
- **pageNumber**（第二列）：运行时生成的复合页码 `<stepIndex>.<subPageNum>`
  - **表格中使用 stepIndex=0 仅作默认示例**
  - 实际 stepIndex 由 **Flow 配置决定**，可能是 0、1、2 或任何非负整数
  - 代码实现**禁止硬编码 stepIndex**，必须从 Flow 上下文动态获取

| subPageNum (固定) | pageNumber (假设 stepIndex=0) | 旧页码 | pageId | 页面标题 | 题目数量 | 题目类型 | 特殊处理 |
|-------------------|------------------------------|--------|--------|----------|---------|---------|---------|
| **0** | `<stepIndex>.0` (示例: 0.0) | 20 | Page_20_Questionnaire_Intro | 问卷调查说明 | 0 | 说明页 | 🕐 **首页**：启动10分钟问卷计时器 + 注入 flow_context |
| **1** | `<stepIndex>.1` (示例: 0.1) | 21 | Page_21_Curiosity_Questions | 好奇心问卷 | 9 | likert4 (4选项) | - |
| **2** | `<stepIndex>.2` (示例: 0.2) | 22 | Page_22_Creativity_Questions | 创造力问卷 | 9 | likert4 (4选项) | - |
| **3** | `<stepIndex>.3` (示例: 0.3) | 23 | Page_23_Imagination_Questions | 想象力问卷 | 10 | likert4 (4选项) | - |
| **4** | `<stepIndex>.4` (示例: 0.4) | 24 | Page_24_Science_Efficacy_Questions | 科学自效能问卷 | 5 | confidence (4选项) | - |
| **5** | `<stepIndex>.5` (示例: 0.5) | 25 | Page_25_Environment_Questions | 创造环境问卷 | 11 | likert4 (4选项) | - |
| **6** | `<stepIndex>.6` (示例: 0.6) | 26 | Page_26_School_Activities | 校内科学活动参与频率 | 7 | frequency5 (5选项) | - |
| **7** | `<stepIndex>.7` (示例: 0.7) | 27 | Page_27_Outschool_Activities | 校外科学活动参与频率 | 7 | frequency5 (5选项) | - |
| **8** | `<stepIndex>.8` (示例: 0.8) | 28 | Page_28_Effort_Submit | 学习努力程度评估 | 3 | scale10 (10选项) | ⏱️ **尾页**：超时自动提交 |

**编码公式**：
```typescript
// 运行时动态计算（禁止硬编码）
const stepIndex = flowContext.stepIndex; // 从 Flow 上下文获取
const pageNumber = `${stepIndex}.${subPageNum}`; // 例如："0.5", "1.3", "2.8"
const pageDesc = `[${flowId}/${submoduleId}/${stepIndex}] ${pageTitle}`;
const targetElementPrefix = `P${pageNumber}_`; // 例如："P0.5_", "P1.3_"
```

### 1.2 页面分类

**按类型分类**：
- **说明页**：subPageNum 0（启动计时器，无题目）
- **纯问卷页**：subPageNum 1-8（共8页题目）
- **计时页**：subPageNum 0（首页启动计时器）
- **自动提交页**：subPageNum 8（计时到期或手动完成后跳转完成页）

**按交互特点分类**：
- **单选题页面**：全部（每题必选一个选项）
- **阻断校验页**：全部（未完成必答题时阻断"下一页"点击）

### 1.3 特殊处理标注

#### subPageNum 0 - 问卷首页（说明页 + 计时启动 + Flow 上下文注入）
- **计时器逻辑**：
  - 启动 10 分钟倒计时（`QUESTIONNAIRE_DURATION = 600 秒`）
  - 同时启动 AppContext 的 `startQuestionnaireTimer`（显示用）
  - 记录 `timer_start` 事件
- **Flow 上下文注入**：
  - **必须**在首页注入 `flow_context` 事件（运行时动态值）
  - `flow_context.value` 包含：`{ flowId, submoduleId, stepIndex, moduleName, pageId }`
- **事件要求**：
  - 必须包含 `page_enter`、`flow_context`、`timer_start`、`next_click`、`page_exit`
  - 此页无题目，无需 select_change 事件

#### subPageNum 8 - 问卷尾页（自动提交或超时）
- **提交逻辑**：
  - 用户完成所有题目后点击"提交问卷"按钮 → 记录 `next_click`（value: "提交问卷"）
  - 计时到期自动提交 → 记录 `timer_complete` + `auto_submit`
  - 提交成功后跳转到完成页或下一个 Flow 步骤
- **答案处理**：
  - 超时未作答的题目：填充 `"超时未回答"`
  - 已作答题目：正常记录选项标签文本
- **事件要求**：
  - 正常完成：`page_enter` → 选择事件 → `next_click` → `page_submit_success` → `page_exit`
  - 超时提交：`page_enter` → 选择事件 → `timer_complete` → `auto_submit` → `page_submit_success`/`page_submit_failed` → `page_exit`

#### 全部问卷页面 - 阻断校验
- **校验规则**：所有题目必答（每题必选一个选项）
- **阻断行为**：
  - 用户点击"下一页"但未完成所有题目 → 记录 `click_blocked`
  - `click_blocked.value` 必须包含缺失项列表（**使用运行时的 pageNumber**）
  - 示例：`{ "reason": "未完成所有必答题", "missing": ["P0.5_问题4", "P0.5_问题6"] }`（假设 stepIndex=0）
  - 显示警告提示："请完成本页所有必答题后再继续"

---

## 二、样例快照（期望 MarkObject）

### 2.0 样例说明与假设条件

**本节所有样例假设**：
- **Flow ID**: `flow-questionnaire-only`（问卷单独运行的 Flow）
- **stepIndex**: `0`（g7-questionnaire 在该 Flow 中作为第一步）
- **submoduleId**: `g7-questionnaire`

**动态字段格式**：
- **pageNumber** 格式：`<stepIndex>.<subPageNum>` = `0.0` - `0.8`（假设 stepIndex=0）
- **pageDesc** 格式：`[<flowId>/<submoduleId>/<stepIndex>] <pageTitle>`
  - 示例：`[flow-questionnaire-only/g7-questionnaire/0] 好奇心问卷`
- **targetElement** 前缀：`P<pageNumber>_...` = `P0.1_...` - `P0.8_...`
- **flow_context.value**: 包含真实 `flowId`、`submoduleId`、`stepIndex`

**⚠️ 实际运行时**：
- Flow 配置可能不同，stepIndex 可能是 1、2、3 等任意值
- 所有动态字段（pageNumber、pageDesc、targetElement、flow_context）会相应变化
- **代码实现禁止硬编码这些示例值**

---

### 样例 1：subPageNum 0 - 问卷说明页（计时启动 + Flow 上下文）

**场景描述**：用户进入问卷说明页，阅读说明后点击"开始答题"进入第一页问卷。

**假设 Flow 上下文**（运行时动态获取）：
- flowId = "flow-questionnaire-only"
- stepIndex = 0
- submoduleId = "g7-questionnaire"
- subPageNum = 0

**期望 MarkObject**：

```json
{
  "pageNumber": "0.0",
  "pageDesc": "[flow-questionnaire-only/g7-questionnaire/0] 问卷调查说明",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "Page_20_Questionnaire_Intro",
      "time": "2025-11-24 14:00:00",
      "pageId": "Page_20_Questionnaire_Intro"
    },
    {
      "code": 2,
      "targetElement": "flow_context",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-questionnaire-only\",\"submoduleId\":\"g7-questionnaire\",\"stepIndex\":0,\"moduleName\":\"7年级蒸馒头测评-问卷部分\",\"pageId\":\"Page_20_Questionnaire_Intro\"}",
      "time": "2025-11-24 14:00:00",
      "pageId": "Page_20_Questionnaire_Intro"
    },
    {
      "code": 3,
      "targetElement": "问卷计时器",
      "eventType": "timer_start",
      "value": "600",
      "time": "2025-11-24 14:00:01",
      "pageId": "Page_20_Questionnaire_Intro"
    },
    {
      "code": 4,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "开始答题",
      "time": "2025-11-24 14:00:15",
      "pageId": "Page_20_Questionnaire_Intro"
    },
    {
      "code": 5,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "Page_20_Questionnaire_Intro",
      "time": "2025-11-24 14:00:15",
      "pageId": "Page_20_Questionnaire_Intro"
    },
    {
      "code": 6,
      "targetElement": "提交管道",
      "eventType": "page_submit_success",
      "value": "{\"pageNumber\":\"0.0\",\"questionCount\":0,\"answerCount\":0}",
      "time": "2025-11-24 14:00:16",
      "pageId": "Page_20_Questionnaire_Intro"
    }
  ],
  "answerList": [],
  "beginTime": "2025-11-24 14:00:00",
  "endTime": "2025-11-24 14:00:15",
  "imgList": []
}
```

**关键验证点**：
- ✅ `pageNumber` 使用复合格式 `<stepIndex>.<subPageNum>` = `"0.0"`（运行时动态生成）
- ✅ `pageDesc` 包含完整前缀 `[flowId/submoduleId/stepIndex] <title>`
- ✅ **`flow_context` 事件自动注入**（子模块首页必需），包含：
  - `flowId`: 真实的 Flow ID（非 null）
  - `submoduleId`: g7-questionnaire
  - `stepIndex`: 运行时的值（示例中为 0）
  - `moduleName`: 子模块显示名称
  - `pageId`: 当前页面 ID
- ✅ `operationList` 包含 `page_enter`、`flow_context`、`timer_start`、`next_click`、`page_exit`、`page_submit_success`
- ✅ `answerList` 为空（此页无题目）
- ✅ `code` 连续自增，由提交层生成

---

### 样例 2：subPageNum 1 - 好奇心问卷（likert4 类型，完整流程）

**场景描述**：用户进入好奇心问卷页（9题），全部作答后点击"下一页"成功提交。

**假设 Flow 上下文**（运行时动态获取）：
- flowId = "flow-questionnaire-only"
- stepIndex = 0
- submoduleId = "g7-questionnaire"
- subPageNum = 1

**期望 MarkObject**：

```json
{
  "pageNumber": "0.1",
  "pageDesc": "[flow-questionnaire-only/g7-questionnaire/0] 好奇心问卷",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "Page_21_Curiosity_Questions",
      "time": "2025-11-24 14:00:20",
      "pageId": "Page_21_Curiosity_Questions"
    },
    {
      "code": 2,
      "targetElement": "P0.1_问题1",
      "eventType": "input_focus",
      "value": "我对许多不同事物有好奇心。",
      "time": "2025-11-24 14:00:25",
      "pageId": "Page_21_Curiosity_Questions"
    },
    {
      "code": 3,
      "targetElement": "P0.1_问题1",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"C\",\"label\":\"比较同意\"}",
      "time": "2025-11-24 14:00:27",
      "pageId": "Page_21_Curiosity_Questions"
    },
    {
      "code": 4,
      "targetElement": "P0.1_问题1",
      "eventType": "input_blur",
      "value": "C",
      "time": "2025-11-24 14:00:28",
      "pageId": "Page_21_Curiosity_Questions"
    },
    {
      "comment": "... 省略问题2-9的选择事件（每题3个事件：focus → select_change → blur）..."
    },
    {
      "code": 29,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "下一页",
      "time": "2025-11-24 14:02:10",
      "pageId": "Page_21_Curiosity_Questions"
    },
    {
      "code": 30,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "Page_21_Curiosity_Questions",
      "time": "2025-11-24 14:02:10",
      "pageId": "Page_21_Curiosity_Questions"
    },
    {
      "code": 31,
      "targetElement": "提交管道",
      "eventType": "page_submit_success",
      "value": "{\"pageNumber\":\"0.1\",\"questionCount\":9,\"answerCount\":9}",
      "time": "2025-11-24 14:02:11",
      "pageId": "Page_21_Curiosity_Questions"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.1_问题1",
      "value": "比较同意"
    },
    {
      "code": 2,
      "targetElement": "P0.1_问题2",
      "value": "非常同意"
    },
    {
      "comment": "... 省略问题3-8 ..."
    },
    {
      "code": 9,
      "targetElement": "P0.1_问题9",
      "value": "比较同意"
    }
  ],
  "beginTime": "2025-11-24 14:00:20",
  "endTime": "2025-11-24 14:02:10",
  "imgList": []
}
```

**关键验证点**：
- ✅ `pageNumber` = `"0.1"`（运行时动态生成）
- ✅ `pageDesc` = `"[flow-questionnaire-only/g7-questionnaire/0] 好奇心问卷"`
- ✅ `targetElement` 使用前缀 `P<pageNumber>_问题N` = `P0.1_问题1`（运行时动态生成）
- ✅ `operationList` 包含每题的 `input_focus` → `select_change` → `input_blur` 序列
- ✅ `select_change.value` 为 JSON 对象字符串：`{"prev":null,"next":"C","label":"比较同意"}`
- ✅ `answerList` 仅包含非空答案，值为选项标签文本（"比较同意"、"非常同意" 等）
- ✅ `code` 连续自增

---

### 样例 3：subPageNum 6 - 校内科学活动（frequency5 类型，阻断恢复）

**场景描述**：用户进入校内科学活动参与频率页（7题），有2题未作答，点击"下一页"被阻断，补充答案后成功提交。

**假设 Flow 上下文**（运行时动态获取）：
- flowId = "flow-questionnaire-only"
- stepIndex = 0
- submoduleId = "g7-questionnaire"
- subPageNum = 6

**期望 MarkObject**：

```json
{
  "pageNumber": "0.6",
  "pageDesc": "[flow-questionnaire-only/g7-questionnaire/0] 校内科学活动参与频率",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "Page_26_School_Activities",
      "time": "2025-11-24 14:08:00",
      "pageId": "Page_26_School_Activities"
    },
    {
      "code": 2,
      "targetElement": "P0.6_问题1",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"C\",\"label\":\"大约每月一次或两次\"}",
      "time": "2025-11-24 14:08:10"
    },
    {
      "comment": "... 问题2-3选择 ..."
    },
    {
      "comment": "... 问题4未作答，跳过 ..."
    },
    {
      "code": 5,
      "targetElement": "P0.6_问题5",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"D\",\"label\":\"大约每星期一次或两次\"}",
      "time": "2025-11-24 14:08:30"
    },
    {
      "comment": "... 问题6未作答，跳过 ..."
    },
    {
      "code": 6,
      "targetElement": "P0.6_问题7",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"C\",\"label\":\"大约每月一次或两次\"}",
      "time": "2025-11-24 14:08:35"
    },
    {
      "code": 7,
      "targetElement": "下一页按钮",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"未完成所有必答题\",\"missing\":[\"P0.6_问题4\",\"P0.6_问题6\"]}",
      "time": "2025-11-24 14:08:40",
      "pageId": "Page_26_School_Activities"
    },
    {
      "code": 8,
      "targetElement": "P0.6_问题4",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"E\",\"label\":\"每天或几乎每天\"}",
      "time": "2025-11-24 14:08:50"
    },
    {
      "code": 9,
      "targetElement": "P0.6_问题6",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"B\",\"label\":\"大约每年一次或两次\"}",
      "time": "2025-11-24 14:08:55"
    },
    {
      "code": 10,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "下一页",
      "time": "2025-11-24 14:09:00",
      "pageId": "Page_26_School_Activities"
    },
    {
      "code": 11,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "Page_26_School_Activities",
      "time": "2025-11-24 14:09:00",
      "pageId": "Page_26_School_Activities"
    },
    {
      "code": 12,
      "targetElement": "提交管道",
      "eventType": "page_submit_success",
      "value": "{\"pageNumber\":\"0.6\",\"questionCount\":7,\"answerCount\":7}",
      "time": "2025-11-24 14:09:01",
      "pageId": "Page_26_School_Activities"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.6_问题1",
      "value": "大约每月一次或两次"
    },
    {
      "comment": "... 问题2-7的答案 ..."
    },
    {
      "code": 7,
      "targetElement": "P0.6_问题7",
      "value": "大约每月一次或两次"
    }
  ],
  "beginTime": "2025-11-24 14:08:00",
  "endTime": "2025-11-24 14:09:00",
  "imgList": []
}
```

**关键验证点**：
- ✅ `click_blocked` 事件包含 `missing` 数组，**使用运行时的 pageNumber 前缀**（`P0.6_问题4`）
- ✅ 阻断后补充答案，再次点击成功
- ✅ `answerList` 最终包含全部 7 个答案（补充后）
- ✅ 5选项类型（frequency5）的标签文本正确映射

---

### 样例 4：subPageNum 8 - 努力评估（scale10 类型，计时到期自动提交）

**场景描述**：用户进入努力评估页（3题），回答2题后计时到期触发自动提交。

**假设 Flow 上下文**（运行时动态获取）：
- flowId = "flow-questionnaire-only"
- stepIndex = 0
- submoduleId = "g7-questionnaire"
- subPageNum = 8

**期望 MarkObject**：

```json
{
  "pageNumber": "0.8",
  "pageDesc": "[flow-questionnaire-only/g7-questionnaire/0] 学习努力程度评估",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "Page_28_Effort_Submit",
      "time": "2025-11-24 14:09:30",
      "pageId": "Page_28_Effort_Submit"
    },
    {
      "code": 2,
      "targetElement": "P0.8_问题1",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"H\",\"label\":\"8\"}",
      "time": "2025-11-24 14:09:40"
    },
    {
      "code": 3,
      "targetElement": "P0.8_问题2",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"I\",\"label\":\"9\"}",
      "time": "2025-11-24 14:09:50"
    },
    {
      "comment": "... 问题3未作答，计时到期 ..."
    },
    {
      "code": 4,
      "targetElement": "问卷计时器",
      "eventType": "timer_complete",
      "value": "600",
      "time": "2025-11-24 14:10:00",
      "pageId": "Page_28_Effort_Submit"
    },
    {
      "code": 5,
      "targetElement": "提交管道",
      "eventType": "auto_submit",
      "value": "{\"reason\":\"问卷计时到期\",\"remainingQuestions\":[\"P0.8_问题3\"]}",
      "time": "2025-11-24 14:10:00",
      "pageId": "Page_28_Effort_Submit"
    },
    {
      "code": 6,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "Page_28_Effort_Submit",
      "time": "2025-11-24 14:10:00",
      "pageId": "Page_28_Effort_Submit"
    },
    {
      "code": 7,
      "targetElement": "提交管道",
      "eventType": "page_submit_success",
      "value": "{\"pageNumber\":\"0.8\",\"questionCount\":3,\"answerCount\":3,\"timeoutSubmit\":true}",
      "time": "2025-11-24 14:10:01",
      "pageId": "Page_28_Effort_Submit"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.8_问题1",
      "value": "8"
    },
    {
      "code": 2,
      "targetElement": "P0.8_问题2",
      "value": "9"
    },
    {
      "code": 3,
      "targetElement": "P0.8_问题3",
      "value": "超时未回答"
    }
  ],
  "beginTime": "2025-11-24 14:09:30",
  "endTime": "2025-11-24 14:10:00",
  "imgList": []
}
```

**关键验证点**：
- ✅ `timer_complete` 事件标记计时到期
- ✅ `auto_submit` 事件说明自动提交原因，**使用运行时的 pageNumber 前缀**
- ✅ `answerList` 中未作答题目填充 `"超时未回答"` 占位文本
- ✅ `page_submit_success.value` 包含 `timeoutSubmit: true` 标识
- ✅ 10分制选项标签为数字字符串（"1"-"10"）

---

## 三、验证/测试计划

### 3.1 快照验证策略

#### 3.1.1 快照覆盖范围

**必须包含的快照**：
1. **subPageNum 0 - 问卷说明页（计时 + flow_context）** ✅
   - 验证：计时器启动、**flow_context 注入**、无题目交互
2. **subPageNum 1 - 好奇心问卷（完整流程）** ✅
   - 验证：9题完整答题、focus/blur/change 序列、答案完整
3. **subPageNum 6 - 校内科学活动（阻断与补充）** ✅
   - 验证：`click_blocked` 含 missing 列表、补充后成功提交
4. **subPageNum 8 - 努力评估（超时自动提交）** ✅
   - 验证：`timer_complete` + `auto_submit`、超时占位答案

**可选增补快照**（不同 stepIndex）：
5. **subPageNum 1（stepIndex=1）**：验证 Flow B 场景（实验 + 问卷）

#### 3.1.2 Fixture 文件结构

```
src/shared/services/submission/__tests__/fixtures/
├── g7-questionnaire/
│   ├── subpage-0-stepindex-0-intro.json           # 样例1：说明页（stepIndex=0）
│   ├── subpage-1-stepindex-0-complete.json        # 样例2：好奇心完整流程（stepIndex=0）
│   ├── subpage-6-stepindex-0-blocked.json         # 样例3：阻断恢复（stepIndex=0）
│   ├── subpage-8-stepindex-0-timeout.json         # 样例4：超时提交（stepIndex=0）
│   ├── subpage-1-stepindex-1-complete.json        # 额外：stepIndex=1 的问卷快照（验证动态性）
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

const G7QuestionnaireSchema = z.object({
  // 复合页码：支持任意 stepIndex，subPageNum 固定 0-8
  pageNumber: z.string().regex(/^\d+\.[0-8]$/),

  // pageDesc 前缀：[flowId/submoduleId/stepIndex] <title>
  pageDesc: z.string().regex(/^\[[\w-]+\/g7-questionnaire\/\d+\]/),

  operationList: z.array(
    z.object({
      code: z.number().int().positive(),
      targetElement: z.string(),
      eventType: z.enum([
        'page_enter', 'page_exit',
        'input_focus', 'input_blur', 'select_change',
        'next_click', 'click_blocked',
        'timer_start', 'timer_complete', 'auto_submit',
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
      // targetElement 前缀：P<stepIndex>.<subPageNum>_问题N
      targetElement: z.string().regex(/^P\d+\.[0-8]_问题\d+$/),
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

**问卷页面额外要求**（subPageNum 1-8）：
- ✅ 至少 1 次 `select_change`（用户选择）

**特殊页面额外要求**：
- **subPageNum 0（首页）**：必须包含 `timer_start` + **`flow_context`**
  - `flow_context.value` 必须包含：`{ flowId, submoduleId, stepIndex, moduleName }`
  - flowId **不能为 null**
  - stepIndex **必须与 pageNumber 第一段一致**
- **阻断场景**：必须包含 `click_blocked`（含 missing 列表，使用运行时的 pageNumber 前缀）
- **subPageNum 8（尾页超时）**：必须包含 `timer_complete` + `auto_submit`

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
// 4. 正则：/^P\d+\.[0-8]_/
```

**检查脚本示例**：

```bash
# CI 检查：扫描代码中硬编码的 stepIndex
npm run lint:hardcoded-stepindex

# 检查逻辑：
# ❌ const pageNumber = "0.6"; // 硬编码 stepIndex
# ❌ const targetElement = "P0.6_问题1"; // 硬编码
# ✅ const pageNumber = `${flowContext.stepIndex}.${subPageNum}`;
# ✅ const targetElement = `P${pageNumber}_问题1`;
```

### 3.4 Lint 守卫规则

#### 3.4.1 禁止直连接口

```bash
# CI 检查：禁止直接调用 /stu/saveHcMark
grep -r "'/stu/saveHcMark'" src/pages/questionnaire/
# 应返回 0 条结果（仅允许在 usePageSubmission 中调用）
```

#### 3.4.2 禁止硬编码 stepIndex

```bash
# CI 检查：禁止硬编码 stepIndex
grep -rE 'stepIndex\s*=\s*[0-9]' src/pages/questionnaire/
# 应返回 0 条结果（禁止 stepIndex = 0 或任何固定值）

# 允许的写法：
# const { stepIndex } = flowContext; // 从上下文获取
# const pageNumber = encodeCompositePageNum(stepIndex, subPageNum);
```

### 3.5 历史数据兼容性

#### 3.5.1 兼容性策略

**问题**：旧数据使用 `pageNumber: "20"` 格式，新数据使用 `"<stepIndex>.<subPageNum>"`，后端需要识别。

**解决方案**：
1. **迁移期**（2周）：
   - 前端提交时在 `flow_context` 中添加 `legacyPageNum: "20"` 字段（可选）
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
src/shared/services/submission/__tests__/g7-questionnaire.test.js

# 测试用例：
- [x] Schema 校验：合法 MarkObject 通过（支持任意 stepIndex）
- [x] Schema 校验：非法页码被拒绝（0.9, 1.10, M2:0）
- [x] Schema 校验：缺失必需事件被拒绝
- [x] targetElement 前缀：P0.6_问题1 通过，P20_问题1 被拒绝
- [x] targetElement 前缀：P1.6_问题1 通过（stepIndex=1）
- [x] stepIndex 一致性：pageNumber "0.6" 但 targetElement 用 "P1.6_" → 失败
- [x] stepIndex 一致性：flow_context.stepIndex=0 但 pageNumber="1.6" → 失败
- [x] 答案过滤：空答案不入列
- [x] 超时占位：未作答题目填充"超时未回答"
- [x] code 自增：提交层生成连续 code
- [x] flow_context 注入：首页必须包含 flow_context 事件，包含 flowId/stepIndex
- [x] flow_context 校验：flowId 不能为 null
```

### 4.2 集成测试

```bash
# 测试环境：Mock 模式
npm run dev

# 手动测试步骤（Flow 模式 - stepIndex=0）：
1. 登录 → 后端返回 { url: '/flow/flow-questionnaire-only', progress: { stepIndex: 0, modulePageNum: 0 } }
2. 进入 FlowModule → 加载 g7-questionnaire（stepIndex=0）
3. 进入问卷说明页（subPageNum 0）→ 验证：
   - 计时器启动
   - flow_context 注入（包含 flowId="flow-questionnaire-only", stepIndex=0）
   - pageNumber = "0.0"
4. 点击"开始答题" → 进入好奇心问卷（subPageNum 1，pageNumber="0.1"）
5. 不完整答题 → 点击"下一页" → 验证阻断提示（missing 列表使用 P0.1_ 前缀）
6. 补充答案 → 成功进入下一页（subPageNum 2，pageNumber="0.2"）
7. 完成所有问卷 → 验证跳转到完成页或下一个 Flow 步骤
8. 检查提交数据（DevTools → Network → /stu/saveHcMark）：
   - pageNumber 格式："0.0" - "0.8"
   - pageDesc 包含：[flow-questionnaire-only/g7-questionnaire/0]
   - targetElement 使用 P0.0_, P0.1_, ..., P0.8_ 前缀
   - flow_context 包含 flowId + stepIndex=0
   - operationList 包含 flow_context + focus/blur/change/next_click
   - answerList 仅包含非空答案

# 手动测试步骤（Flow 模式 - stepIndex=1，验证动态性）：
1. 修改 Mock 数据：stepIndex = 1, flowId = "flow-full-assessment"
2. 进入问卷说明页 → 验证：
   - pageNumber = "1.0"（不是 "0.0"）
   - pageDesc = "[flow-full-assessment/g7-questionnaire/1] ..."
   - targetElement = P1.0_...（不是 P0.0_）
   - flow_context.stepIndex = 1（不是 0）
3. 完成问卷 → 验证所有页面的 pageNumber："1.0" - "1.8"
```

### 4.3 快照测试

```bash
# 快照测试文件
src/shared/services/submission/__tests__/submission-format.snapshot.test.js

# 测试逻辑：
describe('G7-Questionnaire Submission Format', () => {
  it('should match snapshot for subPageNum 0 (stepIndex=0, intro page)', () => {
    const fixture = require('./fixtures/g7-questionnaire/subpage-0-stepindex-0-intro.json');
    const flowContext = { flowId: 'flow-questionnaire-only', stepIndex: 0, submoduleId: 'g7-questionnaire' };
    const result = buildMarkObject(flowContext, fixture.subPageNum, fixture.inputs);

    expect(result.pageNumber).toBe('0.0');
    expect(result.pageDesc).toContain('[flow-questionnaire-only/g7-questionnaire/0]');
    expect(result.operationList.find(op => op.eventType === 'flow_context')).toBeDefined();
    expect(result).toMatchSnapshot();
  });

  it('should match snapshot for subPageNum 1 (stepIndex=0, curiosity questions)', () => {
    // ...
  });

  it('should match snapshot for subPageNum 6 (stepIndex=0, blocked recovery)', () => {
    // ...
  });

  it('should match snapshot for subPageNum 8 (stepIndex=0, timeout submit)', () => {
    // ...
  });

  it('should work with different stepIndex (stepIndex=1)', () => {
    const fixture = require('./fixtures/g7-questionnaire/subpage-1-stepindex-1-complete.json');
    const flowContext = { flowId: 'flow-full-assessment', stepIndex: 1, submoduleId: 'g7-questionnaire' };
    const result = buildMarkObject(flowContext, fixture.subPageNum, fixture.inputs);

    expect(result.pageNumber).toBe('1.1'); // 不是 0.1
    expect(result.pageDesc).toContain('[flow-full-assessment/g7-questionnaire/1]'); // 不是 0
    expect(result.answerList[0].targetElement).toMatch(/^P1\.1_/); // 不是 P0.1_
  });
});
```

---

## 五、迁移验收标准

### 5.1 代码质量

- [ ] 所有问卷页面使用 `usePageSubmission` Hook
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

- [ ] 每页至少包含：`page_enter` + `page_exit` + `next_click`/`auto_submit` + `page_submit_success`
- [ ] 选择控件记录：`input_focus` → `select_change` → `input_blur`
- [ ] 阻断场景记录：`click_blocked`（含 missing 列表，**使用运行时的 pageNumber 前缀**）
- [ ] 计时页面记录：`timer_start`（subPageNum 0）、`timer_complete`（subPageNum 8超时）
- [ ] **首页必须包含 `flow_context` 事件**：
  - ✅ `flow_context.value.flowId` 不为 null
  - ✅ `flow_context.value.stepIndex` 与运行时一致
  - ✅ `flow_context.value.submoduleId = "g7-questionnaire"`

### 5.4 答案处理

- [ ] `answerList` 仅包含非空答案（选项标签文本）
- [ ] 超时未作答题目填充 `"超时未回答"`
- [ ] 答案数量与题目数量一致（包括占位答案）

### 5.5 测试覆盖

- [ ] 单元测试：Schema 校验、前缀验证、答案过滤、flow_context 注入、**stepIndex 一致性校验** - 覆盖率 ≥ 80%
- [ ] 快照测试：4个典型场景（说明页/完整/阻断/超时）+ **不同 stepIndex**（0和1） - 快照匹配 100%
- [ ] 集成测试：手动验证完整问卷流程（Flow 模式，**测试 stepIndex=0 和 stepIndex=1**） - 通过

### 5.6 Flow 适配与动态性

- [ ] CMI 包装器导出：`submoduleId = "g7-questionnaire"`
- [ ] CMI 接口实现：`getInitialPage(subPageNum)` 正确映射（0-8 → pageId）
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

## 六、附录

### 6.1 问卷题目清单（58题）

| subPageNum | 页面 | 题目数量 | 题目ID | 题目类型 | 选项数量 |
|------------|------|---------|--------|---------|---------|
| 0 | 问卷说明 | 0 | - | 说明页 | - |
| 1 | 好奇心问卷 | 9 | curiosity_q1-9 | likert4 | 4 |
| 2 | 创造力问卷 | 9 | creativity_q1-9 | likert4 | 4 |
| 3 | 想象力问卷 | 10 | imagination_q1-10 | likert4 | 4 |
| 4 | 科学自效能问卷 | 5 | efficacy_q1-5 | confidence | 4 |
| 5 | 创造环境问卷 | 11 | environment_q1-11 | likert4 | 4 |
| 6 | 校内科学活动 | 7 | school_act_q1-7 | frequency5 | 5 |
| 7 | 校外科学活动 | 7 | outschool_act_q1-7 | frequency5 | 5 |
| 8 | 努力评估 | 3 | effort_q1-3 | scale10 | 10 |
| **总计** | **9页** | **58题** | - | - | - |

### 6.2 选项标签映射

#### likert4（李克特4级量表）
- A: 非常不同意
- B: 比较不同意
- C: 比较同意
- D: 非常同意

#### confidence（自信程度4级）
- A: 一点也不自信
- B: 不太自信
- C: 自信
- D: 非常自信

#### frequency5（频率5级量表）
- A: 没有或几乎没有
- B: 大约每年一次或两次
- C: 大约每月一次或两次
- D: 大约每星期一次或两次
- E: 每天或几乎每天

#### scale10（10分制评分）
- A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8, I: 9, J: 10

### 6.3 CMI 包装器实现参考

```javascript
// src/modules/grade-7/submodules/g7-questionnaire.js

export const G7QuestionnaireSubmodule = {
  submoduleId: 'g7-questionnaire',
  displayName: '7年级蒸馒头测评-问卷部分',
  version: '1.0.0',

  // 子模块内部页码 → 页面ID映射（固定不变）
  getInitialPage(subPageNum) {
    const mapping = {
      0: 'Page_20_Questionnaire_Intro',
      1: 'Page_21_Curiosity_Questions',
      2: 'Page_22_Creativity_Questions',
      3: 'Page_23_Imagination_Questions',
      4: 'Page_24_Science_Efficacy_Questions',
      5: 'Page_25_Environment_Questions',
      6: 'Page_26_School_Activities',
      7: 'Page_27_Outschool_Activities',
      8: 'Page_28_Effort_Submit'
    };
    return mapping[subPageNum] || 'Page_20_Questionnaire_Intro';
  },

  getTotalSteps() {
    return 9; // 9 个问卷页面
  },

  getNavigationMode(pageId) {
    return 'questionnaire';
  },

  getDefaultTimers() {
    return {
      questionnaire: 600 // 10分钟
    };
  },

  Component: ({ userContext, initialPageId, flowContext }) => {
    // ⚠️ flowContext: { flowId, stepIndex, submoduleId }（运行时动态值）
    // ❌ 禁止：const stepIndex = 0; // 硬编码
    // ✅ 正确：const { stepIndex } = flowContext;

    if (!flowContext || flowContext.stepIndex === undefined) {
      throw new Error('flowContext.stepIndex 是必需的，禁止硬编码 stepIndex');
    }

    return <QuestionnaireFlow
      userContext={userContext}
      initialPageId={initialPageId}
      flowContext={flowContext} // 传递给页面组件，用于生成 pageNumber
    />;
  }
};
```

### 6.4 动态 pageNumber 生成示例

```javascript
// ❌ 错误示例（硬编码 stepIndex）
const pageNumber = "0.6"; // 禁止！
const targetElement = "P0.6_问题1"; // 禁止！
const pageDesc = "[某流程/g7-questionnaire/0] 问卷"; // 禁止！

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
      targetElement: `${targetPrefix}问题${idx + 1}`, // "P0.6_问题1" 或 "P1.6_问题1"
      value: ans.label
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

### 6.5 相关文档链接

- [统一提交数据格式规范](../../../docs/submission-format-standard.md)
- [数据格式规格](../../specs/data-format/spec.md)
- [提交流程规格](../../specs/submission/spec.md)
- [三端改造方案与职责边界](../../../docs/三端改造方案与职责边界.md)
- [需求-交互前端改造方案](../../../docs/需求-交互前端改造方案.md)
- [FLOW流程下pageNumber的提交规范](../../../docs/FLOW流程下pageNumber的提交规范.md)
- [问卷数据配置](../../src/utils/questionnaireData.js)
- [页面映射配置](../../src/utils/pageMappings.js)

---

**文档版本**：v3.0（修正 Flow 体系理解 + 遵循 QA 审核意见）
**最后更新**：2025-11-24
**维护人**：Claude Code
**审核状态**：待评审（已按 tracking-questionnaire 标准修正）

**修订日志**：
- v3.0：创建完整迁移详情文档
  - 使用 stepIndex=0 作为默认示例（问卷单独运行的最常见场景）
  - 强调 stepIndex 动态性，禁止硬编码
  - pageDesc 格式统一为 `[<flowId>/<submoduleId>/<stepIndex>] <title>`
  - flow_context 包含真实 flowId，不为 null
  - 新增 stepIndex 一致性校验
  - 新增风险检查项：禁止硬编码 stepIndex
  - 提供 4 个完整样例快照（说明页、完整流程、阻断恢复、超时提交）
  - CMI 包装器实现参考与动态 pageNumber 生成示例
