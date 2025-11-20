# Data Model: 薇甘菊防治实验子模块

**Date**: 2025-11-19
**Source**: 详细设计说明书 第6节、附录A

## Core Entities

### 1. GerminationData (发芽率数据)

静态数据表，存储实验结果。

```typescript
// 按天数索引
type GerminationByDays = {
  [day: number]: {
    [concentration: number]: number; // 发芽率百分比
  };
};

// 按浓度索引（用于图表）
type GerminationByConcentration = {
  [concentration: string]: number[]; // 7天的发芽率数组
};
```

**数据值**:

| 天数 | 0mg/ml | 5mg/ml | 10mg/ml |
|------|--------|--------|---------|
| 1    | 0      | 0      | 0       |
| 2    | 45     | 15     | 10      |
| 3    | 68     | 30     | 22      |
| 4    | 72     | 40     | 35      |
| 5    | 75     | 50     | 45      |
| 6    | 78     | 55     | 50      |
| 7    | 78     | 60     | 55      |

**Validation Rules**:
- 浓度必须为 0, 5, 10 之一
- 天数必须为 1-7 整数
- 返回值为 0-78 整数

### 2. ModuleState (模块状态)

Context管理的模块级状态。

```typescript
interface ModuleState {
  // 当前页面
  currentPageId: string;

  // 答案存储
  answers: {
    [questionId: string]: string | null;
  };

  // 实验面板状态
  experimentState: {
    concentration: '0mg/ml' | '5mg/ml' | '10mg/ml';
    days: number; // 1-7
    hasStarted: boolean;
    currentResult: number | null; // 发芽率结果
  };

  // 注意事项页状态
  noticeConfirmed: boolean;  // 复选框是否已勾选
  noticeCountdown: number;   // 剩余倒计时秒数（初始38）

  // 操作记录（当前页）
  operations: Operation[];

  // 页面进入时间
  pageEnterTime: Date;
}
```

**State Transitions**:
1. Initial → Page00 (page_enter)
2. Page00 → Page01 (notice confirmed + submit + navigate)
3. PageN → PageN+1 (submit + navigate)
4. Any → Complete (last page submit + onComplete)
5. Any → Timeout (timer expires + onTimeout)

### 3. Operation (操作记录)

用户交互日志条目。

```typescript
interface Operation {
  targetElement: string;  // 目标元素标识
  eventType: string;      // 事件类型
  value: string;          // 事件值
  time: string;           // ISO 8601时间戳
}
```

**Event Types**:

| eventType | targetElement示例 | value格式 |
|-----------|------------------|-----------|
| page_enter | '页面' | pageId |
| page_exit | '页面' | pageId |
| change | 'Q1_控制变量原因' | 用户输入值 |
| click_blocked | '下一页按钮' | JSON: {reason, missing} |
| exp_start | '实验面板-开始按钮' | JSON: {concentration, days} |
| exp_reset | '实验面板-重置按钮' | JSON: {previousConcentration, previousDays} |
| exp_param_change | '实验面板-浓度选择' | JSON: {param, oldValue, newValue} |

### 4. Answer (答案记录)

提交的答案条目。

```typescript
interface Answer {
  code: number;           // 序号（从1开始）
  targetElement: string;  // 格式: P{pageNumber}_{questionId}
  value: string;          // 用户答案
}
```

**Question Mapping**:

| 页面 | code | questionId | 值类型 | 验证规则 |
|------|------|------------|--------|----------|
| P02 | 1 | Q1_控制变量原因 | 文本 | ≥5字符 |
| P04 | 2 | Q2_抑制作用浓度 | A/B/C | 必选 |
| P05 | 3 | Q3_发芽率趋势 | A/B/C | 必选 |
| P06 | 4 | Q4a_菟丝子有效性 | 是/否 | 必选 |
| P06 | 5 | Q4b_结论理由 | 文本 | ≥10字符 |

### 5. MarkObject (提交数据包)

每次页面提交的完整数据结构。

```typescript
interface MarkObject {
  pageNumber: string;      // 复合编码: M{stepIndex}:{subPageNum}
  pageDesc: string;        // 页面描述
  operationList: Operation[];
  answerList: Answer[];
  beginTime: string;       // YYYY-MM-DD HH:mm:ss
  endTime: string;         // YYYY-MM-DD HH:mm:ss
  imgList: any[];          // 本模块不使用
}
```

**pageNumber Examples**:
- Flow模式: `"M0:2"`, `"M1:3"` (stepIndex来自flowContext)
- 独立模式: `"M0:1"`, `"M0:2"` (stepIndex固定为0)

### 6. PageMapping (页面映射)

页码与页面ID的双向映射。

```typescript
// subPageNum → pageId
const PAGE_MAP = {
  '1': 'page_00_notice',
  '2': 'page_01_intro',
  '3': 'page_02_step_q1',
  '4': 'page_03_sim_exp',
  '5': 'page_04_q2_data',
  '6': 'page_05_q3_trend',
  '7': 'page_06_q4_conc',
};

// pageId → stepIndex (导航显示)
const PAGE_TO_STEP = {
  'page_00_notice': 0,     // hidden (注意事项页)
  'page_01_intro': 0,      // hidden (任务背景页)
  'page_02_step_q1': 1,
  'page_03_sim_exp': 2,
  'page_04_q2_data': 3,
  'page_05_q3_trend': 4,
  'page_06_q4_conc': 5,
};

// pageId → navigationMode
const PAGE_MODES = {
  'page_00_notice': 'hidden',
  'page_01_intro': 'hidden',
  'page_02_step_q1': 'experiment',
  'page_03_sim_exp': 'experiment',
  'page_04_q2_data': 'experiment',
  'page_05_q3_trend': 'experiment',
  'page_06_q4_conc': 'experiment',
};
```

## Persistence

### localStorage Keys

| Key | 内容 | 生命周期 |
|-----|------|----------|
| module.g8-mikania-experiment.answers | 已作答草稿 | 会话内 |
| module.g8-mikania-experiment.experimentState | 实验面板状态 | 会话内 |
| module.g8-mikania-experiment.noticeConfirmed | 注意事项确认状态 | 会话内 |
| module.g8-mikania-experiment.lastPageId | 最后访问页面（备用） | 会话内 |

## Relationships

```
ModuleState
├── currentPageId → PageMapping
├── answers → Answer[]
├── experimentState → GerminationData (查询)
└── operations → Operation[]

MarkObject (提交时构造)
├── operationList ← ModuleState.operations
├── answerList ← ModuleState.answers (转换)
└── pageNumber ← PageMapping + flowContext.stepIndex
```

## Validation Functions

```javascript
// 浓度验证
function isValidConcentration(value) {
  return [0, 5, 10].includes(value);
}

// 天数验证
function isValidDays(value) {
  return Number.isInteger(value) && value >= 1 && value <= 7;
}

// 答案验证
function validateAnswers(pageId, answers, state) {
  switch (pageId) {
    case 'page_00_notice':
      return state.noticeCountdown <= 0 && state.noticeConfirmed;
    case 'page_02_step_q1':
      return answers.Q1?.length >= 5;
    case 'page_04_q2_data':
      return ['A', 'B', 'C'].includes(answers.Q2);
    case 'page_05_q3_trend':
      return ['A', 'B', 'C'].includes(answers.Q3);
    case 'page_06_q4_conc':
      return ['是', '否'].includes(answers.Q4a) &&
             answers.Q4b?.length >= 10;
    default:
      return true;
  }
}
```
