# operationList 字段规范说明

本文档为评测平台数据提交中 `operationList` 字段的完整规范说明，用于数据分析时理解每个操作轨迹的含义。

## 概述

`operationList` 是数据提交格式 (`MarkObject`) 中的核心字段，记录用户在评测过程中的所有操作轨迹。每个操作（Operation）代表一个用户交互事件或系统事件。

## Operation 数据结构

每个 Operation 对象包含以下字段：

| 字段 | 类型 | 必填 | 说明 |
|-----|------|-----|------|
| `code` | number | 是 | 操作序号，从 1 开始自增，由提交层自动生成 |
| `targetElement` | string | 是 | 操作目标元素标识，格式为 `P${pageNumber}_<业务ID>` |
| `eventType` | string | 是 | 事件类型，必须使用标准事件类型（见下表） |
| `value` | string \| object | 是 | 事件值，可以是字符串或可序列化对象 |
| `time` | string | 是 | 事件发生时间，格式为 `YYYY-MM-DD HH:mm:ss`（客户端本地时间） |
| `pageId` | string | 否 | 页面标识，可选字段 |

## 标准事件类型 (eventType)

### 1. 页面生命周期事件

| 事件类型 | 值 | 说明 | value 示例 |
|---------|-----|------|-----------|
| `PAGE_ENTER` | `page_enter` | 用户进入页面 | 页面名称，如 `"Page_01_Notice"` |
| `PAGE_EXIT` | `page_exit` | 用户离开页面 | 页面名称，如 `"Page_01_Notice"` |
| `PAGE_SUBMIT_SUCCESS` | `page_submit_success` | 页面数据提交成功 | 提交的数据标识 |
| `PAGE_SUBMIT_FAILED` | `page_submit_failed` | 页面数据提交失败 | 错误信息 |

**使用示例：**
```javascript
{
  code: 1,
  targetElement: "页面",
  eventType: "page_enter",
  value: "Page_01_Notice",
  time: "2024-11-28 10:30:00"
}
```

### 2. 用户交互事件

#### 2.1 点击事件

| 事件类型 | 值 | 说明 | value 示例 |
|---------|-----|------|-----------|
| `CLICK` | `click` | 普通点击事件 | 按钮文本或标识 |
| `NEXT_CLICK` | `next_click` | 点击"下一页"按钮 | 目标页面标识 |
| `CLICK_BLOCKED` | `click_blocked` | 点击被阻止（验证未通过） | `{ missing: ["field1", "field2"] }` 或 `"incomplete"` |

**使用示例：**
```javascript
{
  code: 15,
  targetElement: "P3_NextButton",
  eventType: "next_click",
  value: "Page_04_Material_Reading",
  time: "2024-11-28 10:32:15"
}
```

#### 2.2 输入事件

| 事件类型 | 值 | 说明 | value 示例 |
|---------|-----|------|-----------|
| `INPUT` | `input` | 通用输入事件 | 输入的内容 |
| `INPUT_FOCUS` | `input_focus` | 输入框获得焦点 | 输入框标识 |
| `INPUT_CHANGE` | `input_change` | 输入内容变更 | `{ prev: "旧值", next: "新值" }` |
| `INPUT_BLUR` | `input_blur` | 输入框失去焦点 | 最终输入值 |
| `INPUT_DELETE` | `input_delete` | 删除输入内容 | `{ action: "delete", prev: "原内容", next: "删除后内容" }` |

**使用示例：**
```javascript
{
  code: 25,
  targetElement: "P3_answer_input",
  eventType: "input_change",
  value: { prev: "我的答", next: "我的答案" },
  time: "2024-11-28 10:33:20"
}
```

#### 2.3 选择事件

| 事件类型 | 值 | 说明 | value 示例 |
|---------|-----|------|-----------|
| `CHANGE` | `change` | 通用值变更事件 | 新值 |
| `SELECT_CHANGE` | `select_change` | 下拉选择变更 | 选中的选项值 |
| `RADIO_SELECT` | `radio_select` | 单选按钮选择 | 选中的选项值 |
| `CHECKBOX_CHECK` | `checkbox_check` | 复选框勾选 | 勾选的选项值 |
| `CHECKBOX_UNCHECK` | `checkbox_uncheck` | 复选框取消勾选 | 取消勾选的选项值 |

**使用示例：**
```javascript
{
  code: 35,
  targetElement: "P15_answer_select",
  eventType: "select_change",
  value: "选项B",
  time: "2024-11-28 10:35:30"
}
```

### 3. 界面交互事件

| 事件类型 | 值 | 说明 | value 示例 |
|---------|-----|------|-----------|
| `FOCUS` | `focus` | 元素获得焦点 | 元素标识 |
| `BLUR` | `blur` | 元素失去焦点 | 元素标识 |
| `MODAL_OPEN` | `modal_open` | 打开模态框 | 模态框标识或内容 |
| `MODAL_CLOSE` | `modal_close` | 关闭模态框 | 模态框标识 |
| `VIEW_MATERIAL` | `view_material` | 查看材料 | 材料标识 |
| `READING_COMPLETE` | `reading_complete` | 阅读完成 | 阅读内容标识 |

**使用示例：**
```javascript
{
  code: 45,
  targetElement: "P4_material_button",
  eventType: "modal_open",
  value: "材料A：蒸汽机原理",
  time: "2024-11-28 10:36:45"
}
```

### 4. 计时器事件

| 事件类型 | 值 | 说明 | value 示例 |
|---------|-----|------|-----------|
| `TIMER_START` | `timer_start` | 计时器开始 | 计时器类型或时长 |
| `TIMER_STOP` | `timer_stop` | 计时器停止 | 剩余时间 |
| `TIMER_COMPLETE` | `timer_complete` | 计时器完成（倒计时结束） | 完成标识 |

**使用示例：**
```javascript
{
  code: 50,
  targetElement: "系统计时器",
  eventType: "timer_start",
  value: "40秒倒计时",
  time: "2024-11-28 10:37:00"
}
```

### 5. 实验/仿真事件

| 事件类型 | 值 | 说明 | value 示例 |
|---------|-----|------|-----------|
| `SIMULATION_TIMING_STARTED` | `simulation_timing_started` | 仿真计时开始 | 仿真参数 |
| `SIMULATION_RUN_RESULT` | `simulation_run_result` | 仿真运行结果 | 结果数据对象 |
| `SIMULATION_OPERATION` | `simulation_operation` | 仿真操作（调整参数等） | 操作详情 |

**使用示例：**
```javascript
{
  code: 60,
  targetElement: "P14_simulation",
  eventType: "simulation_run_result",
  value: {
    parameters: { height: 10, speed: 5 },
    result: { time: 2.5, distance: 12.5 },
    success: true
  },
  time: "2024-11-28 10:40:30"
}
```

### 6. 问卷事件

| 事件类型 | 值 | 说明 | value 示例 |
|---------|-----|------|-----------|
| `QUESTIONNAIRE_ANSWER` | `questionnaire_answer` | 问卷答案提交 | 答案内容 |

**使用示例：**
```javascript
{
  code: 70,
  targetElement: "P21_Q3",
  eventType: "questionnaire_answer",
  value: "非常同意",
  time: "2024-11-28 10:45:00"
}
```

### 7. 系统事件

| 事件类型 | 值 | 说明 | value 示例 |
|---------|-----|------|-----------|
| `FLOW_CONTEXT` | `flow_context` | 流程上下文信息 | `{ flowId, stepIndex, submoduleId, moduleName }` |
| `SESSION_EXPIRED` | `session_expired` | 会话过期 | 过期信息 |
| `NETWORK_ERROR` | `network_error` | 网络错误 | 错误详情 |
| `AUTO_SUBMIT` | `auto_submit` | 自动提交（超时等触发） | 触发原因，如 `"questionnaire_time_up"` |

**使用示例：**
```javascript
{
  code: 80,
  targetElement: "System",
  eventType: "auto_submit",
  value: "questionnaire_time_up",
  time: "2024-11-28 11:00:00"
}
```

## targetElement 命名规范

### 格式规则

`targetElement` 应遵循以下命名规范：

1. **页面级元素**：`P${pageNumber}_${elementId}`
   - 示例：`P3_answer_input`、`P15_submit_button`

2. **系统级元素**：直接使用描述性名称
   - 示例：`系统事件`、`System`、`系统计时器`

3. **通用元素**：使用功能描述
   - 示例：`页面`、`NextButton`、`NavigationButton`

### 常见 targetElement 示例

| 元素类型 | targetElement 示例 | 说明 |
|---------|-------------------|------|
| 输入框 | `P3_answer_input` | 第3页的答案输入框 |
| 按钮 | `P3_NextButton` | 第3页的下一步按钮 |
| 选择框 | `P15_answer_select` | 第15页的答案选择框 |
| 问卷题目 | `P21_Q3` | 第21页的第3题 |
| 系统 | `System` | 系统级操作 |
| 页面 | `页面` | 页面级操作 |

## value 字段规范

### 数据类型

`value` 字段支持两种类型：

1. **字符串**：简单值，如按钮文本、页面名称
2. **对象**：复杂数据，必须是可 JSON 序列化的对象

### 常见 value 结构

#### 输入变更
```javascript
{
  prev: "原始内容",
  next: "修改后内容"
}
// 或
{
  prevLength: 5,
  nextLength: 8,
  delta: "新增内容"
}
```

#### 删除操作
```javascript
{
  action: "delete",
  prev: "原始内容",
  next: "删除后内容"
}
// 或
{
  action: "delete",
  prevLength: 10,
  nextLength: 5
}
```

#### 验证失败
```javascript
{
  missing: ["field1", "field2", "field3"]  // 缺失的必填项
}
```

#### 仿真结果
```javascript
{
  parameters: {
    height: 10,
    speed: 5,
    angle: 45
  },
  result: {
    time: 2.5,
    distance: 12.5,
    maxHeight: 3.2
  },
  success: true
}
```

#### 流程上下文
```javascript
{
  flowId: "grade-7-tracking",
  stepIndex: 2,
  submoduleId: "experiment",
  moduleName: "七年级追踪实验",
  pageId: "Page_14_Simulation"  // 可选
}
```

## 最小必要事件集合

每个页面的 operationList 必须至少包含以下事件以确保可还原用户行为轨迹：

### 基础事件（所有页面必需）

1. `page_enter` - 进入页面
2. `page_exit` - 离开页面
3. `next_click` 或等效的点击事件 - 标记用户如何进入下一步

### 特定场景必需事件

#### 输入类页面
- `input_focus` - 输入框获得焦点
- `input_change` 或 `input_delete` - 内容变更轨迹
- `input_blur` - 输入框失去焦点

#### 选择类页面
- `select_change`、`radio_select` 或 `checkbox_*` - 每次选择变更

#### 实验/仿真页面
- `simulation_operation` - 参数调整
- `simulation_timing_started` - 计时开始
- `simulation_run_result` - 运行结果

#### 验证阻断场景
- `click_blocked` - 当用户操作被阻止时，必须记录并包含缺失项列表

## 时间格式规范

所有时间字段统一使用客户端本地时间，格式为：`YYYY-MM-DD HH:mm:ss`

示例：`2024-11-28 14:30:45`

## 兼容性说明

1. **新增字段**：保持向后兼容，旧版本可以忽略新字段
2. **code 字段**：过渡期后端需兼容有/无 code 的两种格式
3. **pageId 字段**：为可选字段，后端需兼容
4. **扩展事件类型**：新增事件类型必须经过评审并同步更新到 `eventTypes.js`

## 数据质量要求

1. **完整性**：必须记录所有用户交互和关键系统事件
2. **准确性**：时间戳必须准确，事件类型必须正确
3. **连续性**：code 必须从 1 开始连续递增
4. **可追溯性**：通过 operationList 应能完整还原用户操作路径

## 参考文档

- [数据提交格式规格](/openspec/specs/data-format/spec.md)
- [事件类型定义](/src/shared/services/submission/eventTypes.js)
- [OpenSpec 项目规范](/openspec/project.md)

## 更新记录

- 2024-11-28：初始版本，基于当前项目实际使用情况整理
- 事件类型与 `src/shared/services/submission/eventTypes.js` 保持同步