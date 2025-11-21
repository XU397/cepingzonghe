# Data Model: 无人机航拍交互课堂子模块

**Date**: 2025-11-19
**Status**: Complete

## Entity Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  DroneImaging   │────▶│   PageState  │────▶│  Operation  │
│    Context      │     │              │     │             │
└─────────────────┘     └──────────────┘     └─────────────┘
        │                      │                    │
        ▼                      ▼                    ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│  ExperimentState│     │    Answer    │     │  GSDLookup  │
│                 │     │              │     │             │
└─────────────────┘     └──────────────┘     └─────────────┘
```

## Core Entities

### 1. DroneImagingContext

子模块全局状态管理

```typescript
interface DroneImagingContextValue {
  // 当前页面
  currentPageId: PageId;

  // 答案数据
  answers: Record<QuestionId, string>;

  // 操作记录
  operations: Operation[];

  // 实验状态
  experimentState: ExperimentState;

  // 页面开始时间
  pageStartTime: string;

  // Actions
  setCurrentPageId: (pageId: PageId) => void;
  setAnswer: (questionId: QuestionId, value: string) => void;
  addOperation: (operation: Omit<Operation, 'code'>) => void;
  clearOperations: () => void;
  updateExperimentState: (state: Partial<ExperimentState>) => void;
  resetExperiment: () => void;
}
```

**Persistence**:
- `module.g8-drone-imaging.answers` - 答案草稿
- `module.g8-drone-imaging.experimentHistory` - 实验历史
- `module.g8-drone-imaging.lastPageId` - 最后页面

### 2. PageState

页面状态枚举与映射

```typescript
type PageId =
  | 'cover'
  | 'background'
  | 'hypothesis'
  | 'experiment_free'
  | 'focal_analysis'
  | 'height_analysis'
  | 'conclusion';

type NavigationMode = 'hidden' | 'experiment' | 'questionnaire';

interface PageConfig {
  subPageNum: number;
  pageId: PageId;
  type: 'notice' | 'experiment';
  navigationMode: NavigationMode;
  stepIndex: number;
}

const PAGE_CONFIGS: PageConfig[] = [
  { subPageNum: 1, pageId: 'cover', type: 'notice', navigationMode: 'hidden', stepIndex: 0 },
  { subPageNum: 2, pageId: 'background', type: 'experiment', navigationMode: 'experiment', stepIndex: 1 },
  { subPageNum: 3, pageId: 'hypothesis', type: 'experiment', navigationMode: 'experiment', stepIndex: 2 },
  { subPageNum: 4, pageId: 'experiment_free', type: 'experiment', navigationMode: 'experiment', stepIndex: 3 },
  { subPageNum: 5, pageId: 'focal_analysis', type: 'experiment', navigationMode: 'experiment', stepIndex: 4 },
  { subPageNum: 6, pageId: 'height_analysis', type: 'experiment', navigationMode: 'experiment', stepIndex: 5 },
  { subPageNum: 7, pageId: 'conclusion', type: 'experiment', navigationMode: 'experiment', stepIndex: 6 },
];
```

### 3. ExperimentState

无人机航拍模拟实验状态

```typescript
interface ExperimentState {
  // 当前参数
  currentHeight: Height;
  currentFocalLength: FocalLength;

  // 计算结果
  currentGSD: number;
  blurAmount: number;

  // 实验历史
  captureHistory: CaptureRecord[];

  // 操作计数
  operationCount: number;
}

type Height = 100 | 200 | 300;
type FocalLength = 8 | 24 | 50;

interface CaptureRecord {
  height: Height;
  focalLength: FocalLength;
  gsd: number;
  timestamp: string;
}
```

### 4. Operation

用户操作记录

```typescript
interface Operation {
  code: number;           // 连续递增编码
  targetElement: string;  // 目标元素标识
  eventType: EventType;   // 事件类型枚举
  value: string;          // 操作值
  time: string;           // YYYY-MM-DD HH:mm:ss
}

type EventType =
  | 'PAGE_ENTER'
  | 'PAGE_EXIT'
  | 'INPUT_CHANGE'
  | 'RADIO_SELECT'
  | 'CLICK'
  | 'SIMULATION_OPERATION'
  | 'TIMER_STOP'
  | 'CLICK_BLOCKED'      // 新增
  | 'AUTO_SUBMIT'        // 新增
  | 'READING_COMPLETE';  // 新增
```

### 5. Answer

答案数据

```typescript
interface Answer {
  code: number;           // 连续递增编码
  targetElement: string;  // 目标元素标识
  value: string;          // 答案值
}

type QuestionId =
  | 'Q3_1'   // P3_控制变量理由
  | 'Q5_1'   // P5_最小GSD焦距
  | 'Q6_1'   // P6_GSD变化趋势
  | 'Q7_1'   // P7_优先调整因素
  | 'Q7_2';  // P7_理由说明

const QUESTION_CONFIG: Record<QuestionId, { targetElement: string; type: 'text' | 'radio' }> = {
  'Q3_1': { targetElement: 'P3_控制变量理由', type: 'text' },
  'Q5_1': { targetElement: 'P5_最小GSD焦距', type: 'radio' },
  'Q6_1': { targetElement: 'P6_GSD变化趋势', type: 'radio' },
  'Q7_1': { targetElement: 'P7_优先调整因素', type: 'radio' },
  'Q7_2': { targetElement: 'P7_理由说明', type: 'text' },
};
```

### 6. GSDLookup

GSD查找表

```typescript
const GSD_LOOKUP_TABLE: Record<string, number> = {
  '100-8': 3.01,
  '100-24': 1.00,
  '100-50': 0.48,
  '200-8': 6.03,
  '200-24': 2.01,
  '200-50': 0.96,
  '300-8': 9.04,
  '300-24': 3.01,
  '300-50': 1.45,
};

function lookupGSD(height: Height, focalLength: FocalLength): number {
  const key = `${height}-${focalLength}`;
  return GSD_LOOKUP_TABLE[key] ?? 0;
}

function calculateBlurAmount(gsd: number, coefficient: number = 0.8): number {
  return gsd * coefficient;
}
```

## Validation Rules

### Page Navigation Prerequisites

| Page | Validation Rule | Error Message |
|------|----------------|---------------|
| Page 1 (cover) | 倒计时30秒结束 AND 勾选确认框 | "请先阅读注意事项并勾选确认后再继续" |
| Page 2 (background) | 阅读时间 >= 5秒 | "请先阅读完页面内容" |
| Page 3 (hypothesis) | answers['Q3_1'].length > 5 | "请输入至少5个字符的思考内容" |
| Page 4 (experiment) | 无强制要求 | - |
| Page 5 (focal_analysis) | answers['Q5_1'] !== undefined | "请选择一个答案后再继续" |
| Page 6 (height_analysis) | answers['Q6_1'] !== undefined | "请选择一个答案后再继续" |
| Page 7 (conclusion) | answers['Q7_1'] !== undefined AND answers['Q7_2'].length > 5 | "请选择优先调整的因素" / "请输入至少5个字符的理由说明" |

### Answer Format

```typescript
// 选择题答案格式
{ value: 'C. 50毫米' }  // 包含选项字母和文本

// 文本题答案格式
{ value: '学生输入的文本内容' }

// 超时未答
{ value: '超时未回答' }

// 未选择
{ value: '未回答' }
```

## State Transitions

### Page Flow

```
cover → background → hypothesis → experiment_free → focal_analysis → height_analysis → conclusion → [Flow Next Step]
```

### Experiment State Machine

```
Initial State:
  height: 100, focalLength: 8, gsd: 3.01, captureHistory: []

Actions:
  SET_HEIGHT → Update height, recalculate GSD
  SET_FOCAL_LENGTH → Update focalLength, recalculate GSD
  CAPTURE → Add record to captureHistory
  RESET → Return to Initial State
```

## MarkObject Structure

提交数据格式

```typescript
interface MarkObject {
  pageNumber: string;        // "M1:3" - stepIndex:subPageNum
  pageDesc: string;          // "[flowId/g8-drone-imaging/3] 实验步骤与假设思考"
  operationList: Operation[];
  answerList: Answer[];
  beginTime: string;         // "YYYY-MM-DD HH:mm:ss"
  endTime: string;           // "YYYY-MM-DD HH:mm:ss"
  imgList: [];               // 本模块不使用
}
```
