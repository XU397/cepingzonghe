# G7-Tracking-Questionnaire 迁移详细清单与样例快照

本文档补全 `migrate-grade7-tracking-questionnaire-submission` 提案，提供迁移页清单、期望数据快照样例及验证计划。

---

## 零、重要前提：Flow 体系下的两层编码

### 0.1 编码体系说明

本迁移方案基于 **Flow 编排体系**，页码采用 **两层编码**：

**第一层：子模块内部**（固定不变）
- `submoduleId`: **g7-tracking-questionnaire**
- `subPageNum`: **0, 1, 2, 3, 4, 5, 6, 7**（子模块内部的相对页码）
- CMI 接口：`getInitialPage(subPageNum)` 返回 pageId

**第二层：提交层转换**（运行时动态）
- `pageNumber = encodeCompositePageNum(stepIndex, subPageNum)`
- **stepIndex** 由 **Flow 配置**决定（登录时后端返回），**不是子模块的固定属性**
- 格式：`<stepIndex>.<subPageNum>`（例如：`0.3`、`1.5`、`2.7`）

### 0.2 关键概念澄清

**❌ 常见误解**：
- g7-tracking-questionnaire 的 stepIndex 永远是 0（或任何固定值）
- stepIndex 可以硬编码在代码中

**✅ 正确理解**：
- **stepIndex 由 Flow 配置动态决定**，同一子模块在不同 Flow 中的 stepIndex 可能完全不同
- 登录时后端返回：`{ url: '/flow/<flowId>', progress: { stepIndex, modulePageNum } }`
- FlowModule 运行时将 stepIndex 注入到子模块组件，子模块使用该值生成 pageNumber
- **禁止在代码中硬编码 stepIndex**

### 0.3 示例说明

**Flow A**（问卷单独运行）：
- Step 0: g7-tracking-questionnaire（**stepIndex = 0**）
  - subPageNum: 0, 1, 2, ..., 7
  - pageNumber: **"0.0", "0.1", "0.2", ..., "0.7"**
  - pageDesc: `[flow-questionnaire-only/g7-tracking-questionnaire/0] 科学探究态度问卷 (1/8)`

**Flow B**（实验 + 问卷）：
- Step 0: g7-tracking-experiment（stepIndex = 0）
- Step 1: g7-tracking-questionnaire（**stepIndex = 1**）
  - subPageNum: 0, 1, 2, ..., 7
  - pageNumber: **"1.0", "1.1", "1.2", ..., "1.7"**
  - pageDesc: `[flow-full-assessment/g7-tracking-questionnaire/1] 科学探究态度问卷 (1/8)`

**Flow C**（多模块组合）：
- Step 0: g4-experiment
- Step 1: g7-experiment
- Step 2: g7-tracking-questionnaire（**stepIndex = 2**）
  - pageNumber: **"2.0", "2.1", ..., "2.7"**

### 0.4 本文档约定与警示

**约定**：
- **本文档所有示例默认使用 stepIndex = 0**（问卷作为 Flow 第一步的最常见场景）
- pageDesc 前缀示例：`[<flowId>/g7-tracking-questionnaire/<stepIndex>]`
- 实际 flowId 和 stepIndex 由运行时的 Flow 配置决定

**⚠️ 实施警示**：
- ❌ **禁止在代码中硬编码 stepIndex = 0**（或任何固定值）
- ✅ **必须从 Flow 上下文（props 或 context）动态获取 stepIndex**
- ✅ **所有 pageNumber、pageDesc、targetElement、flow_context 必须使用运行时的 stepIndex**
- ✅ **Schema 校验必须接受任意 stepIndex**（`/^\d+\.[0-7]$/`）

---

## 一、迁移页清单

### 1.1 页面总览

**⚠️ 重要说明**：
- **subPageNum**（第一列）：子模块内部固定的相对页码（0-7），不随 Flow 变化
- **pageNumber**（第二列）：运行时生成的复合页码 `<stepIndex>.<subPageNum>`
  - **表格中使用 stepIndex=0 仅作默认示例**
  - 实际 stepIndex 由 **Flow 配置决定**，可能是 0、1、2 或任何非负整数
  - 代码实现**禁止硬编码 stepIndex**，必须从 Flow 上下文动态获取

| subPageNum (固定) | pageNumber (假设 stepIndex=0) | 旧页码 | pageId | 页面标题 | 题目数量 | 题目类型 | 特殊处理 |
|-------------------|------------------------------|--------|--------|----------|---------|---------|---------|
| **0** | `<stepIndex>.0` (示例: 0.0) | 14 | Questionnaire_01 | 科学探究态度问卷 (1/8) | 9 | likert4 (4选项) | 🕐 **首页**：启动10分钟问卷计时器 + 注入 flow_context |
| **1** | `<stepIndex>.1` (示例: 0.1) | 15 | Questionnaire_02 | 科学探究态度问卷 (2/8) | 9 | likert4 (4选项) | - |
| **2** | `<stepIndex>.2` (示例: 0.2) | 16 | Questionnaire_03 | 科学探究态度问卷 (3/8) | 10 | likert4 (4选项) | - |
| **3** | `<stepIndex>.3` (示例: 0.3) | 17 | Questionnaire_04 | 科学探究态度问卷 (4/8) | 5 | confidence (4选项) | - |
| **4** | `<stepIndex>.4` (示例: 0.4) | 18 | Questionnaire_05 | 科学探究态度问卷 (5/8) | 11 | likert4 (4选项) | - |
| **5** | `<stepIndex>.5` (示例: 0.5) | 19 | Questionnaire_06 | 校内科学活动参与频率 (6/8) | 7 | frequency5 (5选项) | - |
| **6** | `<stepIndex>.6` (示例: 0.6) | 20 | Questionnaire_07 | 校外科学活动参与频率 (7/8) | 7 | frequency5 (5选项) | - |
| **7** | `<stepIndex>.7` (示例: 0.7) | 21 | Questionnaire_08 | 学习努力程度评估 (8/8) | 3 | scale10 (10选项) | ⏱️ **尾页**：超时自动提交 |

**编码公式**：
```typescript
// 运行时动态计算（禁止硬编码）
const stepIndex = flowContext.stepIndex; // 从 Flow 上下文获取
const pageNumber = `${stepIndex}.${subPageNum}`; // 例如："0.5", "1.3", "2.7"
const pageDesc = `[${flowId}/${submoduleId}/${stepIndex}] ${pageTitle}`;
const targetElementPrefix = `P${pageNumber}_`; // 例如："P0.5_", "P1.3_"
```

### 1.2 页面分类

**按类型分类**：
- **纯问卷页**（标准流程）：subPageNum 0-7（全部8页）
- **计时页**：subPageNum 0（首页启动计时器）
- **自动提交页**：subPageNum 7（计时到期或手动完成后跳转完成页）

**按交互特点分类**：
- **单选题页面**：全部（每题必选一个选项）
- **阻断校验页**：全部（未完成必答题时阻断"下一页"点击）

### 1.3 特殊处理标注

#### subPageNum 0 - 问卷首页（计时启动 + Flow 上下文注入）
- **计时器逻辑**：
  - 启动 10 分钟倒计时（`QUESTIONNAIRE_DURATION = 600 秒`）
  - 同时启动 AppContext 的 `startQuestionnaireTimer`（显示用）和 TrackingProvider 的内部计时器（超时跳转用）
  - 记录 `timer_start` 事件
- **Flow 上下文注入**：
  - **必须**在首页注入 `flow_context` 事件（运行时动态值）
  - `flow_context.value` 包含：`{ flowId, submoduleId, stepIndex, moduleName, pageId }`
- **事件要求**：
  - 必须包含 `page_enter`、`flow_context`、`timer_start`、选择事件、`next_click`、`page_exit`

#### subPageNum 7 - 问卷尾页（自动提交或超时）
- **提交逻辑**：
  - 用户完成所有题目后点击"提交问卷"按钮 → 记录 `next_click`（value: "提交问卷"）
  - 计时到期自动提交 → 记录 `timer_complete` + `auto_submit`
  - 提交成功后跳转到完成页（pageId: Page_22_Completion）
- **答案处理**：
  - 超时未作答的题目：填充 `"超时未回答"`
  - 已作答题目：正常记录选项标签文本
- **事件要求**：
  - 正常完成：`page_enter` → 选择事件 → `next_click` → `page_submit_success` → `page_exit`
  - 超时提交：`page_enter` → 选择事件 → `timer_complete` → `auto_submit` → `page_submit_success`/`page_submit_failed` → `page_exit`

#### 全部页面 - 阻断校验
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
- **stepIndex**: `0`（g7-tracking-questionnaire 在该 Flow 中作为第一步）
- **submoduleId**: `g7-tracking-questionnaire`

**动态字段格式**：
- **pageNumber** 格式：`<stepIndex>.<subPageNum>` = `0.0` - `0.7`（假设 stepIndex=0）
- **pageDesc** 格式：`[<flowId>/<submoduleId>/<stepIndex>] <pageTitle>`
  - 示例：`[flow-questionnaire-only/g7-tracking-questionnaire/0] 科学探究态度问卷 (1/8)`
- **targetElement** 前缀：`P<pageNumber>_...` = `P0.0_...` - `P0.7_...`
- **flow_context.value**: 包含真实 `flowId`、`submoduleId`、`stepIndex`

**⚠️ 实际运行时**：
- Flow 配置可能不同，stepIndex 可能是 1、2、3 等任意值
- 所有动态字段（pageNumber、pageDesc、targetElement、flow_context）会相应变化
- **代码实现禁止硬编码这些示例值**

---

### 样例 1：subPageNum 0 - 问卷首页（likert4 类型，计时启动 + Flow 上下文）

**场景描述**：用户进入问卷第1页，回答9个问题（4选项李克特量表），点击"下一页"成功提交。

**假设 Flow 上下文**（运行时动态获取）：
- flowId = "flow-questionnaire-only"
- stepIndex = 0
- submoduleId = "g7-tracking-questionnaire"
- subPageNum = 0

**期望 MarkObject**：

```json
{
  "pageNumber": "0.0",
  "pageDesc": "[flow-questionnaire-only/g7-tracking-questionnaire/0] 科学探究态度问卷 (1/8)",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "Questionnaire_01",
      "time": "2025-11-24 10:05:30",
      "pageId": "Questionnaire_01"
    },
    {
      "code": 2,
      "targetElement": "flow_context",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-questionnaire-only\",\"submoduleId\":\"g7-tracking-questionnaire\",\"stepIndex\":0,\"moduleName\":\"7年级追踪测评-问卷部分\",\"pageId\":\"Questionnaire_01\"}",
      "time": "2025-11-24 10:05:30",
      "pageId": "Questionnaire_01"
    },
    {
      "code": 3,
      "targetElement": "问卷计时器",
      "eventType": "timer_start",
      "value": "600",
      "time": "2025-11-24 10:05:31",
      "pageId": "Questionnaire_01"
    },
    {
      "code": 4,
      "targetElement": "P0.0_问题1",
      "eventType": "input_focus",
      "value": "我对许多不同事物有好奇心。",
      "time": "2025-11-24 10:05:35",
      "pageId": "Questionnaire_01"
    },
    {
      "code": 5,
      "targetElement": "P0.0_问题1",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"C\",\"label\":\"比较同意\"}",
      "time": "2025-11-24 10:05:37",
      "pageId": "Questionnaire_01"
    },
    {
      "code": 6,
      "targetElement": "P0.0_问题1",
      "eventType": "input_blur",
      "value": "C",
      "time": "2025-11-24 10:05:38",
      "pageId": "Questionnaire_01"
    },
    {
      "comment": "... 省略问题2-9的选择事件（每题3-4个事件：focus → select_change → blur）..."
    },
    {
      "code": 29,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "下一页",
      "time": "2025-11-24 10:06:20",
      "pageId": "Questionnaire_01"
    },
    {
      "code": 30,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "Questionnaire_01",
      "time": "2025-11-24 10:06:20",
      "pageId": "Questionnaire_01"
    },
    {
      "code": 31,
      "targetElement": "提交管道",
      "eventType": "page_submit_success",
      "value": "{\"pageNumber\":\"0.0\",\"questionCount\":9,\"answerCount\":9}",
      "time": "2025-11-24 10:06:21",
      "pageId": "Questionnaire_01"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.0_问题1",
      "value": "比较同意"
    },
    {
      "code": 2,
      "targetElement": "P0.0_问题2",
      "value": "非常同意"
    },
    {
      "comment": "... 省略问题3-8 ..."
    },
    {
      "code": 9,
      "targetElement": "P0.0_问题9",
      "value": "比较同意"
    }
  ],
  "beginTime": "2025-11-24 10:05:30",
  "endTime": "2025-11-24 10:06:20",
  "imgList": []
}
```

**关键验证点**：
- ✅ `pageNumber` 使用复合格式 `<stepIndex>.<subPageNum>` = `"0.0"`（运行时动态生成）
- ✅ `pageDesc` 包含完整前缀 `[flowId/submoduleId/stepIndex] <title>`
- ✅ `targetElement` 使用前缀 `P<pageNumber>_问题N` = `P0.0_问题1`（运行时动态生成）
- ✅ **`flow_context` 事件自动注入**（子模块首页必需），包含：
  - `flowId`: 真实的 Flow ID（非 null）
  - `submoduleId`: g7-tracking-questionnaire
  - `stepIndex`: 运行时的值（示例中为 0）
  - `moduleName`: 子模块显示名称
  - `pageId`: 当前页面 ID
- ✅ `operationList` 包含最小事件集合
- ✅ `answerList` 仅包含非空答案，值为选项标签文本
- ✅ `code` 连续自增，由提交层生成

---

### 样例 2：subPageNum 5 - 校内科学活动参与频率（frequency5 类型，阻断恢复）

**场景描述**：用户进入问卷第6页，回答7个问题（5选项频率量表），有2题未作答，点击"下一页"被阻断，补充答案后成功提交。

**假设 Flow 上下文**（运行时动态获取）：
- flowId = "flow-questionnaire-only"
- stepIndex = 0
- submoduleId = "g7-tracking-questionnaire"
- subPageNum = 5

**期望 MarkObject**：

```json
{
  "pageNumber": "0.5",
  "pageDesc": "[flow-questionnaire-only/g7-tracking-questionnaire/0] 校内科学活动参与频率 (6/8)",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "Questionnaire_06",
      "time": "2025-11-24 10:12:00",
      "pageId": "Questionnaire_06"
    },
    {
      "code": 2,
      "targetElement": "P0.5_问题1",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"C\",\"label\":\"大约每月一次或两次\"}",
      "time": "2025-11-24 10:12:10"
    },
    {
      "comment": "... 问题2-3选择 ..."
    },
    {
      "comment": "... 问题4未作答，跳过 ..."
    },
    {
      "code": 5,
      "targetElement": "P0.5_问题5",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"D\",\"label\":\"大约每星期一次或两次\"}",
      "time": "2025-11-24 10:12:30"
    },
    {
      "comment": "... 问题6未作答，跳过 ..."
    },
    {
      "code": 6,
      "targetElement": "P0.5_问题7",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"C\",\"label\":\"大约每月一次或两次\"}",
      "time": "2025-11-24 10:12:35"
    },
    {
      "code": 7,
      "targetElement": "下一页按钮",
      "eventType": "click_blocked",
      "value": "{\"reason\":\"未完成所有必答题\",\"missing\":[\"P0.5_问题4\",\"P0.5_问题6\"]}",
      "time": "2025-11-24 10:12:40",
      "pageId": "Questionnaire_06"
    },
    {
      "code": 8,
      "targetElement": "P0.5_问题4",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"E\",\"label\":\"每天或几乎每天\"}",
      "time": "2025-11-24 10:12:50"
    },
    {
      "code": 9,
      "targetElement": "P0.5_问题6",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"B\",\"label\":\"大约每年一次或两次\"}",
      "time": "2025-11-24 10:12:55"
    },
    {
      "code": 10,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "下一页",
      "time": "2025-11-24 10:13:00",
      "pageId": "Questionnaire_06"
    },
    {
      "code": 11,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "Questionnaire_06",
      "time": "2025-11-24 10:13:00",
      "pageId": "Questionnaire_06"
    },
    {
      "code": 12,
      "targetElement": "提交管道",
      "eventType": "page_submit_success",
      "value": "{\"pageNumber\":\"0.5\",\"questionCount\":7,\"answerCount\":7}",
      "time": "2025-11-24 10:13:01",
      "pageId": "Questionnaire_06"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.5_问题1",
      "value": "大约每月一次或两次"
    },
    {
      "comment": "... 问题2-7的答案 ..."
    },
    {
      "code": 7,
      "targetElement": "P0.5_问题7",
      "value": "大约每月一次或两次"
    }
  ],
  "beginTime": "2025-11-24 10:12:00",
  "endTime": "2025-11-24 10:13:00",
  "imgList": []
}
```

**关键验证点**：
- ✅ `click_blocked` 事件包含 `missing` 数组，**使用运行时的 pageNumber 前缀**（`P0.5_问题4`）
- ✅ 阻断后补充答案，再次点击成功
- ✅ `answerList` 最终包含全部 7 个答案（补充后）
- ✅ 5选项类型（frequency5）的标签文本正确映射

---

### 样例 3：subPageNum 7 - 问卷尾页（scale10 类型，计时到期自动提交）

**场景描述**：用户进入问卷最后一页，回答3个问题（10分制评分），计时到期触发自动提交。

**假设 Flow 上下文**（运行时动态获取）：
- flowId = "flow-questionnaire-only"
- stepIndex = 0
- submoduleId = "g7-tracking-questionnaire"
- subPageNum = 7

**期望 MarkObject**：

```json
{
  "pageNumber": "0.7",
  "pageDesc": "[flow-questionnaire-only/g7-tracking-questionnaire/0] 学习努力程度评估 (8/8)",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "Questionnaire_08",
      "time": "2025-11-24 10:14:30",
      "pageId": "Questionnaire_08"
    },
    {
      "code": 2,
      "targetElement": "P0.7_问题1",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"H\",\"label\":\"8\"}",
      "time": "2025-11-24 10:14:40"
    },
    {
      "code": 3,
      "targetElement": "P0.7_问题2",
      "eventType": "select_change",
      "value": "{\"prev\":null,\"next\":\"I\",\"label\":\"9\"}",
      "time": "2025-11-24 10:14:50"
    },
    {
      "comment": "... 问题3未作答，计时到期 ..."
    },
    {
      "code": 4,
      "targetElement": "问卷计时器",
      "eventType": "timer_complete",
      "value": "600",
      "time": "2025-11-24 10:15:30",
      "pageId": "Questionnaire_08"
    },
    {
      "code": 5,
      "targetElement": "提交管道",
      "eventType": "auto_submit",
      "value": "{\"reason\":\"问卷计时到期\",\"remainingQuestions\":[\"P0.7_问题3\"]}",
      "time": "2025-11-24 10:15:30",
      "pageId": "Questionnaire_08"
    },
    {
      "code": 6,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "Questionnaire_08",
      "time": "2025-11-24 10:15:30",
      "pageId": "Questionnaire_08"
    },
    {
      "code": 7,
      "targetElement": "提交管道",
      "eventType": "page_submit_success",
      "value": "{\"pageNumber\":\"0.7\",\"questionCount\":3,\"answerCount\":3,\"timeoutSubmit\":true}",
      "time": "2025-11-24 10:15:31",
      "pageId": "Questionnaire_08"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "P0.7_问题1",
      "value": "8"
    },
    {
      "code": 2,
      "targetElement": "P0.7_问题2",
      "value": "9"
    },
    {
      "code": 3,
      "targetElement": "P0.7_问题3",
      "value": "超时未回答"
    }
  ],
  "beginTime": "2025-11-24 10:14:30",
  "endTime": "2025-11-24 10:15:30",
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
1. **subPageNum 0 - 问卷首页（完整流程）** ✅
   - 验证：计时器启动、focus/blur/change 序列、答案完整、**flow_context 注入**
2. **subPageNum 5 - 阻断与补充（错误恢复）** ✅
   - 验证：`click_blocked` 含 missing 列表、补充后成功提交
3. **subPageNum 7 - 超时自动提交** ✅
   - 验证：`timer_complete` + `auto_submit`、超时占位答案

**可选增补快照**（不同 stepIndex）：
4. **subPageNum 0（stepIndex=1）**：验证 Flow B 场景（实验 + 问卷）
5. **subPageNum 3 - confidence 类型**（不同选项标签）

#### 3.1.2 Fixture 文件结构

```
src/shared/services/submission/__tests__/fixtures/
├── g7-tracking-questionnaire/
│   ├── subpage-0-stepindex-0-complete.json      # 样例1：首页完整流程（stepIndex=0）
│   ├── subpage-5-stepindex-0-blocked.json       # 样例2：阻断恢复（stepIndex=0）
│   ├── subpage-7-stepindex-0-timeout.json       # 样例3：超时提交（stepIndex=0）
│   ├── subpage-0-stepindex-1-complete.json      # 额外：stepIndex=1 的首页快照（验证动态性）
│   └── README.md                                 # 快照说明文档
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

const G7TrackingQuestionnaireSchema = z.object({
  // 复合页码：支持任意 stepIndex，subPageNum 固定 0-7
  pageNumber: z.string().regex(/^\d+\.[0-7]$/),

  // pageDesc 前缀：[flowId/submoduleId/stepIndex] <title>
  pageDesc: z.string().regex(/^\[[\w-]+\/g7-tracking-questionnaire\/\d+\]/),

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
      targetElement: z.string().regex(/^P\d+\.[0-7]_问题\d+$/),
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
}
```

#### 3.2.2 事件集合完整性校验

**最小必需事件**（每页必须包含）：
- ✅ `page_enter`（进入页面）
- ✅ `page_exit`（离开页面）
- ✅ `next_click` 或 `auto_submit`（提交触发）
- ✅ 至少 1 次 `select_change`（用户选择）
- ✅ `page_submit_success` 或 `page_submit_failed`（提交结果）

**特殊页面额外要求**：
- **subPageNum 0（首页）**：必须包含 `timer_start` + **`flow_context`**
  - `flow_context.value` 必须包含：`{ flowId, submoduleId, stepIndex, moduleName }`
  - flowId **不能为 null**
  - stepIndex **必须与 pageNumber 第一段一致**
- **阻断场景**：必须包含 `click_blocked`（含 missing 列表，使用运行时的 pageNumber 前缀）
- **subPageNum 7（尾页超时）**：必须包含 `timer_complete` + `auto_submit`

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
// 2. 禁止硬编码 stepIndex（如 "P0.5_"）
// 3. 必须使用动态生成：`P${flowContext.stepIndex}.${subPageNum}_`
// 4. 正则：/^P\d+\.[0-7]_/
```

**检查脚本示例**：

```bash
# CI 检查：扫描代码中硬编码的 stepIndex
npm run lint:hardcoded-stepindex

# 检查逻辑：
# ❌ const pageNumber = "0.5"; // 硬编码 stepIndex
# ❌ const targetElement = "P0.5_问题1"; // 硬编码
# ✅ const pageNumber = `${flowContext.stepIndex}.${subPageNum}`;
# ✅ const targetElement = `P${pageNumber}_问题1`;
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

**问题**：旧数据使用 `pageNumber: "14"` 格式，新数据使用 `"<stepIndex>.<subPageNum>"`，后端需要识别。

**解决方案**：
1. **迁移期**（2周）：
   - 前端提交时在 `flow_context` 中添加 `legacyPageNum: "14"` 字段（可选）
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
src/shared/services/submission/__tests__/g7-tracking-questionnaire.test.js

# 测试用例：
- [x] Schema 校验：合法 MarkObject 通过（支持任意 stepIndex）
- [x] Schema 校验：非法页码被拒绝（0.8, 1.9, M2:0）
- [x] Schema 校验：缺失必需事件被拒绝
- [x] targetElement 前缀：P0.5_问题1 通过，P14_问题1 被拒绝
- [x] targetElement 前缀：P1.3_问题1 通过（stepIndex=1）
- [x] stepIndex 一致性：pageNumber "0.5" 但 targetElement 用 "P1.5_" → 失败
- [x] stepIndex 一致性：flow_context.stepIndex=0 但 pageNumber="1.5" → 失败
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
2. 进入 FlowModule → 加载 g7-tracking-questionnaire（stepIndex=0）
3. 进入问卷第1页（subPageNum 0）→ 验证：
   - 计时器启动
   - flow_context 注入（包含 flowId="flow-questionnaire-only", stepIndex=0）
   - pageNumber = "0.0"
4. 不完整答题 → 点击"下一页" → 验证阻断提示（missing 列表使用 P0.0_ 前缀）
5. 补充答案 → 成功进入下一页（subPageNum 1，pageNumber="0.1"）
6. 完成所有问卷 → 验证跳转到完成页
7. 检查提交数据（DevTools → Network → /stu/saveHcMark）：
   - pageNumber 格式："0.0" - "0.7"
   - pageDesc 包含：[flow-questionnaire-only/g7-tracking-questionnaire/0]
   - targetElement 使用 P0.0_, P0.1_, ..., P0.7_ 前缀
   - flow_context 包含 flowId + stepIndex=0
   - operationList 包含 flow_context + focus/blur/change/next_click
   - answerList 仅包含非空答案

# 手动测试步骤（Flow 模式 - stepIndex=1，验证动态性）：
1. 修改 Mock 数据：stepIndex = 1, flowId = "flow-full-assessment"
2. 进入问卷第1页 → 验证：
   - pageNumber = "1.0"（不是 "0.0"）
   - pageDesc = "[flow-full-assessment/g7-tracking-questionnaire/1] ..."
   - targetElement = P1.0_问题1（不是 P0.0_）
   - flow_context.stepIndex = 1（不是 0）
3. 完成问卷 → 验证所有页面的 pageNumber："1.0" - "1.7"
```

### 4.3 快照测试

```bash
# 快照测试文件
src/shared/services/submission/__tests__/submission-format.snapshot.test.js

# 测试逻辑：
describe('G7-Tracking-Questionnaire Submission Format', () => {
  it('should match snapshot for subPageNum 0 (stepIndex=0, complete)', () => {
    const fixture = require('./fixtures/g7-tracking-questionnaire/subpage-0-stepindex-0-complete.json');
    const flowContext = { flowId: 'flow-questionnaire-only', stepIndex: 0, submoduleId: 'g7-tracking-questionnaire' };
    const result = buildMarkObject(flowContext, fixture.subPageNum, fixture.inputs);

    expect(result.pageNumber).toBe('0.0');
    expect(result.pageDesc).toContain('[flow-questionnaire-only/g7-tracking-questionnaire/0]');
    expect(result.operationList.find(op => op.eventType === 'flow_context')).toBeDefined();
    expect(result).toMatchSnapshot();
  });

  it('should match snapshot for subPageNum 5 (stepIndex=0, blocked recovery)', () => {
    // ...
  });

  it('should match snapshot for subPageNum 7 (stepIndex=0, timeout submit)', () => {
    // ...
  });

  it('should work with different stepIndex (stepIndex=1)', () => {
    const fixture = require('./fixtures/g7-tracking-questionnaire/subpage-0-stepindex-1-complete.json');
    const flowContext = { flowId: 'flow-full-assessment', stepIndex: 1, submoduleId: 'g7-tracking-questionnaire' };
    const result = buildMarkObject(flowContext, fixture.subPageNum, fixture.inputs);

    expect(result.pageNumber).toBe('1.0'); // 不是 0.0
    expect(result.pageDesc).toContain('[flow-full-assessment/g7-tracking-questionnaire/1]'); // 不是 0
    expect(result.answerList[0].targetElement).toMatch(/^P1\.0_/); // 不是 P0.0_
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
- [ ] 计时页面记录：`timer_start`（subPageNum 0）、`timer_complete`（subPageNum 7超时）
- [ ] **首页必须包含 `flow_context` 事件**：
  - ✅ `flow_context.value.flowId` 不为 null
  - ✅ `flow_context.value.stepIndex` 与运行时一致
  - ✅ `flow_context.value.submoduleId = "g7-tracking-questionnaire"`

### 5.4 答案处理

- [ ] `answerList` 仅包含非空答案（选项标签文本）
- [ ] 超时未作答题目填充 `"超时未回答"`
- [ ] 答案数量与题目数量一致（包括占位答案）

### 5.5 测试覆盖

- [ ] 单元测试：Schema 校验、前缀验证、答案过滤、flow_context 注入、**stepIndex 一致性校验** - 覆盖率 ≥ 80%
- [ ] 快照测试：3个典型场景（完整/阻断/超时）+ **不同 stepIndex**（0和1） - 快照匹配 100%
- [ ] 集成测试：手动验证完整问卷流程（Flow 模式，**测试 stepIndex=0 和 stepIndex=1**） - 通过

### 5.6 Flow 适配与动态性

- [ ] CMI 包装器导出：`submoduleId = "g7-tracking-questionnaire"`
- [ ] CMI 接口实现：`getInitialPage(subPageNum)` 正确映射（0-7 → pageId）
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
  - ❌ 代码中不存在 `"0.5"`、`"P0.5_"` 等硬编码字符串
  - ✅ 所有 stepIndex 从 `flowContext.stepIndex` 或 props 获取
- [ ] **pageNumber 与 stepIndex 一致性**：
  - 提交前校验：`pageNumber.split('.')[0] === String(flowContext.stepIndex)`
  - CI 检查：`validateStepIndexConsistency(markObject, flowContext)`

---

## 六、附录

### 6.1 问卷题目清单（61题）

| subPageNum | 题目ID | 题目文本（示例） | 选项类型 | 选项数量 |
|------------|--------|-----------------|---------|---------|
| 0 | 1-9 | 我对许多不同事物有好奇心... | likert4 | 4 |
| 1 | 10-18 | 做有创造性的事情让我有满足感... | likert4 | 4 |
| 2 | 19-28 | 我很难运用自己的想像力... | likert4 | 4 |
| 3 | 29-33 | 为学校的科学探究项目，提出有创造性的想法... | confidence | 4 |
| 4 | 34-44 | 老师给我足够的时间去提出有关作业的有创造性的解决方案... | likert4 | 4 |
| 5 | 45-51 | 科学实验课/活动... | frequency5 | 5 |
| 6 | 52-58 | 科学实验课/活动（校外）... | frequency5 | 5 |
| 7 | 59-61 | 你为做好探究任务付出了多少努力? | scale10 | 10 |

**完整题目列表**：见 [src/modules/grade-7-tracking/assets/data/questionnaire.json](../../src/modules/grade-7-tracking/assets/data/questionnaire.json)

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
// src/modules/grade-7-tracking/submodules/g7-tracking-questionnaire.js

export const G7TrackingQuestionnaireSubmodule = {
  submoduleId: 'g7-tracking-questionnaire',
  displayName: '7年级追踪测评-问卷部分',
  version: '1.0.0',

  // 子模块内部页码 → 页面ID映射（固定不变）
  getInitialPage(subPageNum) {
    const mapping = {
      0: 'Questionnaire_01',
      1: 'Questionnaire_02',
      2: 'Questionnaire_03',
      3: 'Questionnaire_04',
      4: 'Questionnaire_05',
      5: 'Questionnaire_06',
      6: 'Questionnaire_07',
      7: 'Questionnaire_08'
    };
    return mapping[subPageNum] || 'Questionnaire_01';
  },

  getTotalSteps() {
    return 8; // 8 个问卷页面
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
const pageNumber = "0.5"; // 禁止！
const targetElement = "P0.5_问题1"; // 禁止！
const pageDesc = "[某流程/g7-tracking-questionnaire/0] 问卷"; // 禁止！

// ✅ 正确示例（运行时动态生成）
import { encodeCompositePageNum, buildTargetElementPrefix, buildPageDescPrefix } from '@shared/utils/pageMapping';

function buildMarkData(flowContext, subPageNum, pageTitle, answers, operations) {
  const { flowId, stepIndex, submoduleId } = flowContext;

  // 动态生成 pageNumber
  const pageNumber = encodeCompositePageNum(stepIndex, subPageNum); // "0.5" 或 "1.5" 等

  // 动态生成 pageDesc 前缀
  const pageDescPrefix = buildPageDescPrefix(flowId, submoduleId, stepIndex); // "[flowId/submoduleId/stepIndex] "
  const pageDesc = `${pageDescPrefix}${pageTitle}`;

  // 动态生成 targetElement 前缀
  const targetPrefix = buildTargetElementPrefix(pageNumber); // "P0.5_" 或 "P1.5_"

  return {
    pageNumber,
    pageDesc,
    answerList: answers.map((ans, idx) => ({
      code: idx + 1,
      targetElement: `${targetPrefix}问题${idx + 1}`, // "P0.5_问题1" 或 "P1.5_问题1"
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
- [问卷数据配置](../../src/modules/grade-7-tracking/assets/data/questionnaire.json)
- [BaseQuestionnairePage 组件](../../src/modules/grade-7-tracking/components/questionnaire/BaseQuestionnairePage.jsx)

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
  - flow_context 包含真实 flowId，不为 null
  - 新增 stepIndex 一致性校验
  - 新增风险检查项：禁止硬编码 stepIndex
