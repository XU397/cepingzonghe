# Data Model: 4年级火车购票-交互子模块 (g4-experiment)

**Date**: 2025-12-17
**Feature**: [spec.md](./spec.md) | [plan.md](./plan.md)

## Overview

本文档定义 g4-experiment 子模块的核心实体模型，用于指导组件开发和数据流设计。

---

## Core Entities

### 1. PageConfig

页面配置实体，定义子模块内所有页面的元数据。

```typescript
interface PageConfig {
  pageId: string;           // 唯一标识，如 'notices', 'problem-identification'
  subPageNum: number;       // 子模块内页码 1-12
  type: PageType;           // 页面类型
  navigationMode: 'hidden' | 'experiment';  // 导航模式
  description: string;      // 页面描述（用于 pageDesc）
  component: React.FC;      // 页面组件
  validation?: ValidationRule[];  // 可选：页面校验规则
}

type PageType =
  | 'Type-A'  // 纯展示/阅读页（notices, scenario-intro, task-completion）
  | 'Type-B'  // 单文本输入页（problem-identification）
  | 'Type-C'  // 多输入页（route-analysis）
  | 'Type-D'  // 复杂选择页（factor-analysis, station-recommendation, ticket-filter）
  | 'Type-E'  // 实验+选择页（plan-optimization, ticket-pricing）
  | 'Type-F'; // SVG/拖拽动画页（timeline-planning-tutorial, user-solution-design）
```

### 2. MarkObject

数据提交对象，符合后端 saveHcMark 接口契约。

```typescript
interface MarkObject {
  pageNumber: string;       // 复合页码 "X.YY"，如 "1.03"
  pageDesc: string;         // 页面描述，含 Flow 前缀 "[flowId/submoduleId/stepIndex] 描述"
  operationList: Operation[];  // 操作记录列表
  answerList: Answer[];     // 答案记录列表
  beginTime: string;        // 页面开始时间 "YYYY-MM-DD HH:mm:ss"
  endTime: string;          // 页面结束时间 "YYYY-MM-DD HH:mm:ss"
  imgList: ImageMeta[];     // 图片元数据（本模块为空数组）
}
```

### 3. Operation

操作记录实体，记录用户每一次交互。

```typescript
interface Operation {
  code: number;             // 操作序号，从1递增
  targetElement: string;    // 操作目标，带页码前缀 "P1.03_问题输入框"
  eventType: string;        // 事件类型，使用 EventTypes 常量值
  value: string | object;   // 操作值（对象需 JSON.stringify）
  time: string;             // ISO 8601 时间戳
}
```

### 4. Answer

答案记录实体，收集用户最终答案。

```typescript
interface Answer {
  code: number;             // 答案序号，从1递增
  targetElement: string;    // 答案来源元素
  value: string;            // 答案值
}
```

### 5. TaskBlock

任务条实体，用于拖拽交互。

```typescript
interface TaskBlock {
  id: string;               // 模板ID "task-1" ~ "task-5"
  cloneId?: string;         // 克隆实例ID "task-1-clone-{uuid}"
  label: string;            // 显示名称 "洗水壶"
  duration: number;         // 时长（分钟）
  width: number;            // 像素宽度（40px/分钟）
  color: string;            // CSS变量引用 "var(--g4-task-blue)"
  x?: number;               // 放置位置X
  y?: number;               // 放置位置Y（主轴0/副轴1）
}

// 任务条模板数据
const TASK_BLOCKS: TaskBlock[] = [
  { id: 'task-1', label: '洗水壶', duration: 1, width: 40, color: 'var(--g4-task-blue)' },
  { id: 'task-2', label: '烧热水', duration: 10, width: 400, color: 'var(--g4-task-orange)' },
  { id: 'task-3', label: '灌水', duration: 2, width: 80, color: 'var(--g4-task-gray)' },
  { id: 'task-4', label: '整理背包', duration: 2, width: 80, color: 'var(--g4-task-green)' },
  { id: 'task-5', label: '吃早饭', duration: 6, width: 240, color: 'var(--g4-task-pink)' },
];
```

### 6. Solution

方案实体，用于时间规划。

```typescript
interface Solution {
  id: 'solution-1' | 'solution-2' | 'solution-improved';
  tasks: PlacedTask[];      // 已放置的任务条
  userInputTime: number | null;  // 用户输入的总用时
}

interface PlacedTask extends TaskBlock {
  cloneId: string;          // 必须有克隆ID
  x: number;                // 放置X坐标
  y: 0 | 1;                 // 0=主轴, 1=副轴
}
```

### 7. DialogueMessage

对话消息实体，用于问题识别页。

```typescript
interface DialogueMessage {
  role: 'uncle' | 'mom' | 'dad' | 'ming';  // 角色
  text: string;             // 消息内容
  avatarUrl?: string;       // 头像URL
}

// 角色配置
const ROLE_CONFIG = {
  uncle: { name: '舅舅', align: 'left', bubbleColor: 'var(--g4-bubble-blue)', avatar: 'jiujiuT.png' },
  mom: { name: '妈妈', align: 'left', bubbleColor: 'var(--g4-bubble-blue)', avatar: 'mamaT.png' },
  dad: { name: '爸爸', align: 'left', bubbleColor: 'var(--g4-bubble-blue)', avatar: 'babaT.png' },
  ming: { name: '小明', align: 'right', bubbleColor: 'var(--g4-bubble-orange)', avatar: 'xiaomingT.png' },
};
```

### 8. TrainSchedule

车次信息实体，用于车票筛选与计价。

```typescript
interface TrainSchedule {
  trainNo: string;          // 车次号 "C769", "D175"
  departure: string;        // 发车时间 "11:15"
  arrival: string;          // 到达时间 "12:58"
  duration: string;         // 用时 "1小时43分"
  adultPrice: number;       // 二等座价格（元）
  adultSeats: number;       // 二等座余票
  studentPrice: number;     // 学生票价格（元）
  studentSeats: number;     // 学生票余票（0表示"无"）
}

// 车次数据
const TRAIN_SCHEDULES: TrainSchedule[] = [
  { trainNo: 'C769', departure: '11:15', arrival: '12:58', duration: '1小时43分', adultPrice: 96, adultSeats: 2, studentPrice: 60, studentSeats: 0 },
  { trainNo: 'D175', departure: '12:36', arrival: '14:06', duration: '1小时30分', adultPrice: 148, adultSeats: 5, studentPrice: 112, studentSeats: 1 },
  { trainNo: 'C751', departure: '14:38', arrival: '16:25', duration: '1小时47分', adultPrice: 96, adultSeats: 3, studentPrice: 60, studentSeats: 6 },
  { trainNo: 'C757', departure: '16:36', arrival: '18:13', duration: '1小时37分', adultPrice: 96, adultSeats: 1, studentPrice: 60, studentSeats: 1 },
  { trainNo: 'D163', departure: '18:16', arrival: '19:50', duration: '1小时34分', adultPrice: 148, adultSeats: 12, studentPrice: 112, studentSeats: 8 },
];
```

### 9. RouteInfo

路线信息实体，用于地图交互。

```typescript
interface RouteInfo {
  id: number;               // 路线编号 1-5
  station: string;          // 出发站 "南充北站" | "南充站"
  segments: string[];       // 分段距离 ["3.64km", "4.26km"] 或空（显示总距离）
  totalDistance: number;    // 总距离（km）
  isEditable: boolean;      // 是否为输入框（路线1、5为true）
}

const ROUTES: RouteInfo[] = [
  { id: 1, station: '南充北站', segments: ['3.64km', '4.26km'], totalDistance: 7.9, isEditable: true },
  { id: 2, station: '南充北站', segments: [], totalDistance: 8.65, isEditable: false },
  { id: 3, station: '南充站', segments: [], totalDistance: 10.2, isEditable: false },
  { id: 4, station: '南充站', segments: [], totalDistance: 9.63, isEditable: false },
  { id: 5, station: '南充站', segments: ['2km', '2.4km', '2km', '1.48km'], totalDistance: 7.88, isEditable: true },
];
```

---

## State Management

### G4Context State

```typescript
interface G4State {
  // 导航状态
  currentPageId: string;
  currentPageNum: number;

  // 操作记录
  operations: Operation[];
  answers: Answer[];
  pageBeginTime: string;

  // 页面特定状态
  noticeConfirmed: boolean;
  selectedFactors: string[];
  routeInputs: { route1: string; route5: string };
  selectedStation: string | null;
  stationReason: string;
  solutions: { solution1: Solution; solution2: Solution };
  improvedSolution: Solution | null;
  isOptimal: boolean | null;
  selectedTrains: string[];
  recommendedTrain: string | null;
  recommendReason: string;
  calculationProcess: string;
  totalPrice: string;
  problemAnswer: string;

  // 对话状态
  dialogueIndex: number;
  isDialoguePlaying: boolean;
}
```

### Context Actions

```typescript
interface G4Actions {
  // 导航
  navigateToPage: (pageId: string) => void;

  // 操作记录
  logOperation: (op: Omit<Operation, 'code'>) => void;
  collectAnswer: (ans: Omit<Answer, 'code'>) => void;
  clearOperations: () => void;

  // 页面状态更新
  setNoticeConfirmed: (confirmed: boolean) => void;
  toggleFactor: (factor: string) => void;
  updateRouteInput: (routeId: 'route1' | 'route5', value: string) => void;
  setSelectedStation: (station: string) => void;
  setStationReason: (reason: string) => void;
  updateSolution: (solutionId: string, tasks: PlacedTask[]) => void;
  setSolutionTime: (solutionId: string, time: number) => void;
  setIsOptimal: (isOptimal: boolean) => void;
  toggleTrainSelection: (trainNo: string) => void;
  setRecommendedTrain: (trainNo: string) => void;
  setRecommendReason: (reason: string) => void;
  setCalculationProcess: (process: string) => void;
  setTotalPrice: (price: string) => void;
  setProblemAnswer: (answer: string) => void;

  // 对话控制
  playDialogue: () => void;
  resetDialogue: () => void;
}
```

---

## Validation Rules

### 页面校验规则

```typescript
const VALIDATION_RULES: Record<string, ValidationRule[]> = {
  'notices': [
    { field: 'noticeConfirmed', rule: 'equals', value: true, message: '请先阅读并勾选确认' },
  ],
  'problem-identification': [
    { field: 'problemAnswer', rule: 'notEmpty', message: '请输入你的回答' },
  ],
  'factor-analysis': [
    { field: 'selectedFactors', rule: 'minLength', value: 1, message: '请至少选择一个因素' },
  ],
  'route-analysis': [
    { field: 'routeInputs.route1', rule: 'positiveNumber', message: '请输入路线1的路程' },
    { field: 'routeInputs.route5', rule: 'positiveNumber', message: '请输入路线5的路程' },
  ],
  'station-recommendation': [
    { field: 'selectedStation', rule: 'notNull', message: '请选择推荐的出发站' },
    { field: 'stationReason', rule: 'notEmpty', message: '请填写推荐理由' },
  ],
  'user-solution-design': [
    { field: 'solutions.solution1.tasks', rule: 'minLength', value: 1, message: '方案一需要至少一个任务条' },
    { field: 'solutions.solution2.tasks', rule: 'minLength', value: 1, message: '方案二需要至少一个任务条' },
    { field: 'solutions.solution1.userInputTime', rule: 'integerRange', min: 1, max: 999, message: '请输入方案一的总用时' },
    { field: 'solutions.solution2.userInputTime', rule: 'integerRange', min: 1, max: 999, message: '请输入方案二的总用时' },
    { field: 'solutions', rule: 'solutionsDifferent', message: '请设计两种不同的方案' },
  ],
  'plan-optimization': [
    { field: 'isOptimal', rule: 'notNull', message: '请选择方案是否最短' },
    { field: 'improvedSolution', rule: 'conditionalRequired', condition: 'isOptimal === false', message: '请提供改进方案' },
  ],
  'ticket-filter': [
    { field: 'selectedTrains', rule: 'minLength', value: 1, message: '请至少选择一个车次' },
  ],
  'ticket-pricing': [
    { field: 'recommendedTrain', rule: 'notNull', message: '请选择推荐的车次' },
    { field: 'recommendReason', rule: 'notEmpty', message: '请填写推荐理由' },
    { field: 'calculationProcess', rule: 'notEmpty', message: '请输入计算过程' },
    { field: 'totalPrice', rule: 'positiveInteger', message: '请输入总票价' },
  ],
};
```

---

## Data Flow

```
用户交互
    ↓
logOperation() → operations[]
    ↓
collectAnswer() → answers[]
    ↓
页面切换触发
    ↓
buildMarkObject() → MarkObject
    ↓
usePageSubmission() → POST /stu/saveHcMark
    ↓
clearOperations() → 重置
    ↓
navigateToPage()
```

---

## Relationships

```
G4Context
├── PageConfig[] ─────────────── 页面配置（静态）
├── MarkObject ──────────────── 每次提交生成
│   ├── Operation[] ─────────── 操作记录
│   └── Answer[] ────────────── 答案记录
├── TaskBlock[] ─────────────── 任务条模板（静态）
├── Solution[] ──────────────── 方案状态
│   └── PlacedTask[] ────────── 已放置任务条
├── DialogueMessage[] ───────── 对话数据（静态）
├── TrainSchedule[] ─────────── 车次数据（静态）
└── RouteInfo[] ─────────────── 路线数据（静态）
```
