# Data Model: 子模块数据提交标准化

**Feature**: 004-docs-submodule-submission
**Date**: 2025-12-04
**Status**: Complete

## Entity Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         MarkObject                              │
│  (提交到 /stu/saveHcMark 的数据结构)                            │
├─────────────────────────────────────────────────────────────────┤
│  pageNumber: string        # "1.03" 格式                        │
│  pageDesc: string          # "[flowId/submoduleId/stepIndex] 标题" │
│  beginTime: string         # "YYYY-MM-DD HH:mm:ss"              │
│  endTime: string           # "YYYY-MM-DD HH:mm:ss"              │
│  operationList: Operation[]                                      │
│  answerList: AnswerEntry[]                                       │
│  imgList: string[]         # 可选，图片 URL 列表                 │
└─────────────────────────────────────────────────────────────────┘
           │                              │
           ▼                              ▼
┌─────────────────────────┐  ┌─────────────────────────┐
│       Operation         │  │      AnswerEntry        │
├─────────────────────────┤  ├─────────────────────────┤
│  code: number           │  │  code: number           │
│  targetElement: string  │  │  targetElement: string  │
│  eventType: string      │  │  value: string          │
│  value: string          │  └─────────────────────────┘
│  time: string           │
└─────────────────────────┘
```

## Entity Definitions

### MarkObject

提交到后端的完整数据包，每次页面导航时提交。

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| pageNumber | string | ✅ | 页面编号，格式 `<stepIndex>.<subPageNum>` | `"1.03"` |
| pageDesc | string | ✅ | 页面描述，Flow 模式含前缀 | `"[flow1/g8-pv-sand/0] 实验设计"` |
| beginTime | string | ✅ | 进入页面时间 | `"2025-12-04 10:30:00"` |
| endTime | string | ✅ | 离开页面时间 | `"2025-12-04 10:32:15"` |
| operationList | Operation[] | ✅ | 操作日志列表（可为空数组） | `[...]` |
| answerList | AnswerEntry[] | ✅ | 答案列表（可为空数组） | `[...]` |
| imgList | string[] | ❌ | 图片元数据列表 | `[]` |

**Validation Rules**:
- `pageNumber` 必须匹配 `/^[1-9]\d*\.\d{2}$/`
- `beginTime` < `endTime`
- `operationList` 的 code 必须从 1 开始连续递增
- Flow 模式下 `operationList` 必须包含 `flow_context` 事件

### Operation

单条操作日志记录。

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| code | number | ✅ | 序号，每页从 1 开始递增 | `1`, `2`, `3` |
| targetElement | string | ✅ | 目标元素标识符 | `"P1.03_选择题1"` 或 `"page"` |
| eventType | string | ✅ | 事件类型，来自 EventTypes 枚举 | `"page_enter"`, `"click"` |
| value | string | ✅ | 事件值（可为空字符串） | `"选项A"`, `"{...}"` |
| time | string | ✅ | 事件时间戳 | `"2025-12-04 10:30:05"` |

**targetElement 规则**:
- 业务元素：必须使用 `P${pageNumber}_<业务ID>` 前缀，如 `"P1.03_选择题1"`
- 保留元素：RESERVED_ELEMENTS 中的值不加前缀，如 `"page"`, `"next_button"`, `"flow_context"`

**eventType 枚举** (来自 `eventTypes.js`):
```
page_enter, page_exit, click, input_change, input_focus, input_blur,
radio_select, checkbox_check, checkbox_uncheck, next_click,
timer_start, timer_stop, flow_context, simulation_operation, ...
```

### AnswerEntry

单条答案记录。

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| code | number | ✅ | 答案序号，来自 QUESTION_CODE_MAP | `1`, `2`, `100` |
| targetElement | string | ✅ | 问题标识符（完整题干） | `"P1.03_第一题：请选择正确答案"` |
| value | string | ✅ | 答案值（格式化后） | `"A. 选项一"` 或 `"{...}"` |

**code 规则**:
- 常规题目：1-99，来自 `QUESTION_CODE_MAP` 映射
- 实验历史：100+，使用 `HISTORY_CODE_BASE`

### SubmoduleMappingConfig

子模块配置接口，每个子模块必须提供。

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| PAGE_CONFIGS | PageConfig[] | ✅ | 页面配置列表 |
| PAGE_DESC_MAP | Record<string, string> | ✅ | 页面描述映射 |
| PAGE_QUESTIONS | Record<string, string[]> | ✅ | 每页的问题键列表 |
| QUESTION_CODE_MAP | Record<string, number> | ✅ | 问题 ID → code 映射 |
| QUESTION_TEXT_MAP | Record<string, string> | ✅ | 问题 ID → 完整题干映射 |
| ANSWER_KEY_TO_QUESTION | Record<string, string> | ✅ | 答案键 → 问题 ID 映射 |
| QUESTION_OPTIONS_MAP | Record<string, Record<string, string>> | ❌ | 单选题选项映射 |
| INTERNAL_TO_STANDARD_KEY | Record<string, string> | ❌ | 内部键 → 标准键转换 |
| HISTORY_CODE_BASE | number | ❌ | 实验历史 code 基数（默认 100） |
| getSubPageNumByPageId | (pageId: string) => number | ✅ | 页面 ID → subPageNum |
| getPageConfig | (pageId: string) => PageConfig | ❌ | 获取页面配置 |

### RESERVED_ELEMENTS

保留元素集合，豁免前缀校验。

```typescript
export const RESERVED_ELEMENTS = new Set([
  'page',
  'next_button',
  'prev_button',
  'module',
  'flow_context',
  'task_timer',
  'countdown',
]);
```

## State Transitions

### Operation Code 生命周期

```
[页面进入]
    │
    ▼
┌─────────────────┐
│  codeRef = 0    │
│  operations = []│
│  flowContextInjected = false │
└─────────────────┘
    │
    ▼ logOperation(page_enter)
┌─────────────────┐
│  codeRef = 1    │  ← page_enter (code=1)
│  operations = [op1] │
└─────────────────┘
    │
    ▼ 自动注入 flow_context (if flowContext exists)
┌─────────────────┐
│  codeRef = 2    │  ← flow_context (code=2)
│  operations = [op1, op2] │
│  flowContextInjected = true │
└─────────────────┘
    │
    ▼ 用户操作...
┌─────────────────┐
│  codeRef = N    │  ← 各种用户事件
│  operations = [...] │
└─────────────────┘
    │
    ▼ logOperation(page_exit)
┌─────────────────┐
│  codeRef = N+1  │  ← page_exit
│  operations = [..., opN+1] │
└─────────────────┘
    │
    ▼ submitMark() + clearOperations()
┌─────────────────┐
│  codeRef = 0    │  ← 重置
│  operations = []│
│  flowContextInjected = false │
└─────────────────┘
    │
    ▼ navigateToPage(nextId)
[下一页进入，循环]
```

## Relationships

```
SubmoduleMappingConfig
        │
        │ provides configuration to
        ▼
┌─────────────────────────────────────┐
│         Submodule Adapter           │
├─────────────────────────────────────┤
│  usePageMeta()      ──────────────► pageNumber, targetPrefix │
│  useOperationLogger() ────────────► operations[], logOperation() │
│  collectAnswers()   ──────────────► answerList[] │
│  validateMarkBeforeSubmit() ──────► ValidationResult │
└─────────────────────────────────────┘
        │
        │ produces
        ▼
    MarkObject
        │
        │ submitted to
        ▼
  /stu/saveHcMark (Backend API)
```

## Data Volume Estimates

| Metric | Estimate | Notes |
|--------|----------|-------|
| 子模块数量 | 4 | g8-pv-sand, g8-mikania, g8-drone, g7 |
| 每子模块页面数 | 5-10 | 平均 7 页 |
| 每页操作事件数 | 10-50 | 平均 20 条 |
| 每页答案数 | 0-5 | 平均 2 条 |
| 单次 MarkObject 大小 | 2-10 KB | JSON 字符串化后 |
