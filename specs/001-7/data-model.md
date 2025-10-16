# Data Model: 7年级追踪测评-蜂蜜黏度探究

**Feature ID**: 001-7
**Created**: 2025-10-14
**Status**: Draft
**Phase**: Phase 1 - Design & Contracts

---

## Overview

本文档定义7年级追踪测评模块的数据模型,包括实验会话、试验记录、问卷答案等核心实体。所有数据实体遵循平台constitution.md中的Data Logging & Submission Protocol。

---

## Core Data Entities

### 1. ExperimentSession (实验会话状态)

**Purpose**: 管理整个测评会话的全局状态,包括学生信息、计时器状态、会话有效性。

```javascript
interface ExperimentSession {
  // 学生身份信息 (从登录API获取)
  studentCode: string;        // 学生代码 (必填)
  studentName: string;        // 学生姓名 (必填)
  examNo: string;             // 考试编号 (必填)
  batchCode: string;          // 批次代码 (必填)
  schoolCode: string;         // 学校代码 (必填)

  // 会话管理
  sessionId: string;          // 会话唯一标识 (UUID, 客户端生成)
  sessionStartTime: number;   // 会话开始时间戳 (ms)
  lastHeartbeatTime: number;  // 最后心跳检测时间戳 (ms)
  isSessionValid: boolean;    // 会话是否有效 (多设备登录检测)

  // 导航状态
  currentPage: number;        // 当前页码 (0.1 = 注意事项, 0.2 = 问卷说明, 1-21 = 正式页面)
  navigationMode: 'hidden' | 'experiment' | 'questionnaire'; // 导航显示模式

  // 计时器状态
  experimentTimerStarted: boolean;    // 实验计时器是否已启动
  questionnaireTimerStarted: boolean; // 问卷计时器是否已启动
  experimentStartTime: number | null; // 实验开始时间戳 (ms)
  questionnaireStartTime: number | null; // 问卷开始时间戳 (ms)
}
```

**Validation Rules**:
- `studentCode`, `studentName`, `examNo` MUST NOT be empty
- `sessionId` MUST be valid UUID v4 format
- `currentPage` MUST be in range [0.1, 0.2, 1-21]
- `navigationMode` MUST match page context:
  - Pages 0.1, 0.2 → `'hidden'`
  - Pages 1-13 → `'experiment'`
  - Pages 14-21 → `'questionnaire'`
- `lastHeartbeatTime` MUST be updated every 30 seconds (±5s tolerance)

**Lifecycle**:
1. **Initialization**: 登录成功后创建,填充学生信息
2. **Active**: 心跳检测维护 `isSessionValid` 状态
3. **Termination**: 提交数据后或被踢出时销毁

---

### 2. ExperimentTrial (实验试验记录)

**Purpose**: 记录学生在第9-11页进行的3次蜂蜜黏度实验试验数据。

```javascript
interface ExperimentTrial {
  trialNumber: number;        // 试验编号 (1, 2, 3)

  // 实验参数 (学生选择)
  waterContent: number;       // 含水量 (15%, 20%, 25%)
  temperature: number;        // 温度 (15°C, 20°C, 25°C, 30°C)

  // 实验结果
  fallTime: number;           // 小球下落时间 (秒, 保留1位小数)

  // 时间戳
  parameterSetTime: number;   // 参数设置完成时间戳 (ms)
  animationStartTime: number; // 动画开始时间戳 (ms)
  animationEndTime: number;   // 动画结束时间戳 (ms)

  // 元数据
  pageNumber: number;         // 记录所在页码 (9, 10, 11)
  operationList: Array<{      // 操作记录列表
    timestamp: number;        // 操作时间戳 (ms)
    action: string;           // 操作类型 ('select_water_content' | 'select_temperature' | 'start_animation')
    value: string | number;   // 操作值
  }>;
}
```

**Validation Rules**:
- `trialNumber` MUST be 1, 2, or 3
- `waterContent` MUST be 15, 20, or 25
- `temperature` MUST be 15, 20, 25, or 30
- `fallTime` MUST be positive number with 1 decimal place (e.g., 8.3, 12.7)
- `fallTime` MUST be calculated using physics model: `calculateFallTime(waterContent, temperature)`
- `animationEndTime - animationStartTime` MUST approximately equal `fallTime * 1000` (±200ms tolerance)
- `pageNumber` MUST match `trialNumber`: Trial 1 → Page 9, Trial 2 → Page 10, Trial 3 → Page 11

**Physics Model Dependency**:
```javascript
// 参考 research.md - Research Topic 1
function calculateFallTime(waterContent, temperature) {
  const BASE_TIME = 10.0;
  const waterContentFactor = 1 - (waterContent - 15) * 0.08;
  const temperatureFactor = 1 - (temperature - 25) * 0.02;
  const fallTime = BASE_TIME * waterContentFactor * temperatureFactor;
  const randomVariation = 0.96 + Math.random() * 0.08;
  return parseFloat((fallTime * randomVariation).toFixed(1));
}
```

**Example**:
```javascript
{
  trialNumber: 1,
  waterContent: 20,
  temperature: 25,
  fallTime: 8.7,
  parameterSetTime: 1697012345678,
  animationStartTime: 1697012350000,
  animationEndTime: 1697012358700,
  pageNumber: 9,
  operationList: [
    { timestamp: 1697012340000, action: 'select_water_content', value: 20 },
    { timestamp: 1697012342000, action: 'select_temperature', value: 25 },
    { timestamp: 1697012350000, action: 'start_animation', value: 'begin' }
  ]
}
```

---

### 3. ChartDataPoint (图表数据点)

**Purpose**: 记录学生在第12页绘制的折线图数据点 (含水量-下落时间关系)。

```javascript
interface ChartDataPoint {
  waterContent: number;       // X轴: 含水量 (15%, 20%, 25%)
  fallTime: number;           // Y轴: 下落时间 (秒)
  source: 'trial' | 'manual'; // 数据来源 ('trial' = 从试验结果映射, 'manual' = 手动输入)
  trialNumber?: number;       // 如果source='trial', 关联的试验编号 (1, 2, 3)
}

interface ChartData {
  dataPoints: ChartDataPoint[]; // 数据点数组 (最多3个)
  isCompleted: boolean;          // 是否已完成绘制 (至少2个点)
  creationTime: number;          // 图表创建时间戳 (ms)

  // 操作记录
  operationList: Array<{
    timestamp: number;
    action: 'add_point' | 'remove_point' | 'edit_point';
    dataPoint: ChartDataPoint;
  }>;
}
```

**Validation Rules**:
- `dataPoints.length` MUST be ≤ 3
- Each `waterContent` value MUST be unique within `dataPoints`
- `fallTime` MUST be positive number with 1 decimal place
- If `source === 'trial'`, `trialNumber` MUST be valid (1, 2, 3)
- `isCompleted` MUST be `true` only if `dataPoints.length >= 2`

**Mapping Logic** (from ExperimentTrial to ChartDataPoint):
```javascript
function mapTrialToChartPoint(trial) {
  return {
    waterContent: trial.waterContent,
    fallTime: trial.fallTime,
    source: 'trial',
    trialNumber: trial.trialNumber
  };
}
```

---

### 4. TextResponse (文本输入回答)

**Purpose**: 记录学生在第13页回答的3个开放性问题。

```javascript
interface TextResponse {
  questionNumber: number;     // 问题编号 (1, 2, 3)
  questionText: string;       // 问题文本 (显示给学生的问题)
  answerText: string;         // 学生输入的答案文本

  // 元数据
  startEditTime: number;      // 开始编辑时间戳 (ms)
  lastEditTime: number;       // 最后编辑时间戳 (ms)
  editDuration: number;       // 编辑总时长 (ms)
  characterCount: number;     // 字符数量

  // 验证状态
  isEmpty: boolean;           // 是否为空 (警告用)
  isValid: boolean;           // 是否通过验证 (characterCount > 0)
}
```

**Validation Rules**:
- `questionNumber` MUST be 1, 2, or 3
- `answerText` MAY be empty (用户可选择不回答)
- `characterCount` MUST equal `answerText.trim().length`
- `isEmpty` MUST be `true` if `characterCount === 0`
- `isValid` MUST be `characterCount > 0`
- `editDuration` SHOULD be approximately `lastEditTime - startEditTime` (accumulated)

**Question Mapping** (FR-061):
```javascript
const QUESTIONS = [
  { number: 1, text: "1. 根据你的折线图，描述蜂蜜含水量与小球下落时间的关系。" },
  { number: 2, text: "2. 解释为什么含水量的变化会影响小球的下落时间。" },
  { number: 3, text: "3. 如果实验中改变温度参数，你预测会对结果产生什么影响？" }
];
```

---

### 5. QuestionnaireAnswer (问卷单选题答案)

**Purpose**: 记录学生在第14-21页问卷调查中的单选题答案。

```javascript
interface QuestionnaireAnswer {
  pageNumber: number;         // 页码 (14-21)
  questionNumber: number;     // 全局问题编号 (1-27)
  questionText: string;       // 问题文本
  selectedOption: string;     // 选中的选项 ('A' | 'B' | 'C' | 'D' | 'E')

  // 时间戳
  selectionTime: number;      // 选择时间戳 (ms)

  // 验证状态
  isAnswered: boolean;        // 是否已回答 (selectedOption !== null)
}
```

**Validation Rules**:
- `pageNumber` MUST be in range [14, 21]
- `questionNumber` MUST be in range [1, 27]
- `selectedOption` MUST be one of ['A', 'B', 'C', 'D', 'E']
- `isAnswered` MUST be `true` if `selectedOption` is not null

**Page-Question Mapping** (FR-064 to FR-071):
```javascript
const QUESTIONNAIRE_STRUCTURE = [
  { pageNumber: 14, questionNumbers: [1, 2, 3] },      // 第14页: 问题1-3
  { pageNumber: 15, questionNumbers: [4, 5, 6, 7] },   // 第15页: 问题4-7
  { pageNumber: 16, questionNumbers: [8, 9, 10] },     // 第16页: 问题8-10
  { pageNumber: 17, questionNumbers: [11, 12, 13] },   // 第17页: 问题11-13
  { pageNumber: 18, questionNumbers: [14, 15, 16] },   // 第18页: 问题14-16
  { pageNumber: 19, questionNumbers: [17, 18, 19] },   // 第19页: 问题17-19
  { pageNumber: 20, questionNumbers: [20, 21, 22, 23] }, // 第20页: 问题20-23
  { pageNumber: 21, questionNumbers: [24, 25, 26, 27] }  // 第21页: 问题24-27
];
```

---

### 6. MarkObject (数据提交结构)

**Purpose**: 定义提交到 `/stu/saveHcMark` API的数据结构,遵循平台统一协议。

```javascript
interface MarkObject {
  // 页面标识
  pageNumber: string;         // 页码字符串 (如 "9", "13", "14")
  pageDesc: string;           // 页面描述 (如 "第1次蜂蜜黏度实验", "开放性问题", "问卷调查第1页")

  // 操作记录
  operationList: Array<{      // 用户操作序列
    timestamp: number;        // 操作时间戳 (ms)
    action: string;           // 操作类型 (如 'select_water_content', 'click_next', 'input_text')
    target?: string;          // 操作目标 (如 'water_content_selector', 'question_1')
    value?: any;              // 操作值 (如 20, "我的答案")
  }>[];

  // 答案记录
  answerList: Array<{         // 答案列表
    questionId: string;       // 问题标识 (如 'trial_1_water_content', 'question_1', 'questionnaire_q1')
    answer: any;              // 答案内容 (类型根据questionId动态)
    answerTime: number;       // 回答时间戳 (ms)
  }>[];

  // 时间记录
  beginTime: number;          // 页面进入时间戳 (ms)
  endTime: number;            // 页面离开时间戳 (ms)

  // 附件 (可选)
  imgList?: Array<{           // 图片列表 (本模块不使用,保留接口兼容性)
    imageKey: string;
    imageUrl: string;
  }>[];
}
```

**Validation Rules**:
- `pageNumber` MUST be non-empty string
- `pageDesc` MUST be descriptive and match pageNumber context
- `operationList` MUST be chronologically ordered by timestamp
- `answerList` MAY be empty if page has no answerable questions
- `beginTime` MUST be less than `endTime`
- `endTime - beginTime` SHOULD represent actual time spent on page
- `imgList` SHOULD be empty array `[]` for this module (no image upload)

**Submission Protocol** (per constitution.md):
```javascript
// API Endpoint
POST /stu/saveHcMark

// Request Format
Content-Type: multipart/form-data

FormData Fields:
- jsonStr: JSON.stringify(markObject)  // MarkObject序列化
- file: (empty for this module)        // 本模块无文件上传

// Response Format
{
  code: 200,        // 200 = 成功, 其他 = 失败
  msg: "成功",
  obj: true         // Boolean indicating success
}
```

**Example (第9页 - 第1次实验)**:
```javascript
{
  pageNumber: "9",
  pageDesc: "第1次蜂蜜黏度实验",
  operationList: [
    { timestamp: 1697012340000, action: 'select_water_content', target: 'water_content_selector', value: 20 },
    { timestamp: 1697012342000, action: 'select_temperature', target: 'temperature_selector', value: 25 },
    { timestamp: 1697012350000, action: 'click_start_animation', target: 'start_button', value: null },
    { timestamp: 1697012358700, action: 'animation_complete', target: 'ball_drop_animation', value: 8.7 },
    { timestamp: 1697012360000, action: 'click_next', target: 'next_button', value: null }
  ],
  answerList: [
    { questionId: 'trial_1_water_content', answer: 20, answerTime: 1697012340000 },
    { questionId: 'trial_1_temperature', answer: 25, answerTime: 1697012342000 },
    { questionId: 'trial_1_fall_time', answer: 8.7, answerTime: 1697012358700 }
  ],
  beginTime: 1697012330000,
  endTime: 1697012360000,
  imgList: []
}
```

**Example (第13页 - 开放性问题)**:
```javascript
{
  pageNumber: "13",
  pageDesc: "开放性问题回答",
  operationList: [
    { timestamp: 1697012400000, action: 'focus_textarea', target: 'question_1_input', value: null },
    { timestamp: 1697012405000, action: 'input_text', target: 'question_1_input', value: "含水量越高，小球下落越快" },
    { timestamp: 1697012420000, action: 'focus_textarea', target: 'question_2_input', value: null },
    { timestamp: 1697012430000, action: 'input_text', target: 'question_2_input', value: "含水量影响蜂蜜的黏度..." },
    { timestamp: 1697012450000, action: 'click_next', target: 'next_button', value: null }
  ],
  answerList: [
    { questionId: 'text_question_1', answer: "含水量越高，小球下落越快", answerTime: 1697012405000 },
    { questionId: 'text_question_2', answer: "含水量影响蜂蜜的黏度...", answerTime: 1697012430000 },
    { questionId: 'text_question_3', answer: "", answerTime: null } // 未回答
  ],
  beginTime: 1697012390000,
  endTime: 1697012450000,
  imgList: []
}
```

**Example (第14页 - 问卷调查)**:
```javascript
{
  pageNumber: "14",
  pageDesc: "问卷调查第1页",
  operationList: [
    { timestamp: 1697012500000, action: 'select_option', target: 'question_1', value: 'B' },
    { timestamp: 1697012510000, action: 'select_option', target: 'question_2', value: 'A' },
    { timestamp: 1697012520000, action: 'select_option', target: 'question_3', value: 'C' },
    { timestamp: 1697012530000, action: 'click_next', target: 'next_button', value: null }
  ],
  answerList: [
    { questionId: 'questionnaire_q1', answer: 'B', answerTime: 1697012500000 },
    { questionId: 'questionnaire_q2', answer: 'A', answerTime: 1697012510000 },
    { questionId: 'questionnaire_q3', answer: 'C', answerTime: 1697012520000 }
  ],
  beginTime: 1697012490000,
  endTime: 1697012530000,
  imgList: []
}
```

---

## Data Flow Architecture

### Context State Structure

```javascript
// TrackingContext.jsx
const TrackingContext = createContext({
  // 会话管理
  session: ExperimentSession,
  updateSession: (updates) => void,

  // 实验数据
  experimentTrials: ExperimentTrial[],      // 3次试验记录
  addExperimentTrial: (trial) => void,

  // 图表数据
  chartData: ChartData,
  addChartDataPoint: (point) => void,
  removeChartDataPoint: (waterContent) => void,

  // 文本回答
  textResponses: TextResponse[],            // 3个开放性问题
  updateTextResponse: (questionNumber, answerText) => void,

  // 问卷答案
  questionnaireAnswers: QuestionnaireAnswer[], // 27个问卷问题
  updateQuestionnaireAnswer: (questionNumber, selectedOption) => void,

  // 数据提交
  submitPageData: (markObject) => Promise<boolean>,

  // 导航辅助
  canNavigateNext: () => boolean,
  getCurrentNavigationMode: () => 'hidden' | 'experiment' | 'questionnaire'
});
```

### Data Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│  Phase 1: Session Initialization                                │
│  ├─ Login API Response → ExperimentSession creation             │
│  ├─ Generate sessionId (UUID v4)                                │
│  └─ Start heartbeat detection (30s interval)                    │
└─────────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────────┐
│  Phase 2: Experiment Data Collection (Pages 1-13)               │
│  ├─ Pages 9-11: Collect 3 ExperimentTrial records               │
│  ├─ Page 12: Build ChartData from trials                        │
│  ├─ Page 13: Collect 3 TextResponse records                     │
│  └─ Each page: Generate MarkObject → POST /stu/saveHcMark       │
└─────────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────────┐
│  Phase 3: Questionnaire Data Collection (Pages 14-21)           │
│  ├─ Pages 14-21: Collect 27 QuestionnaireAnswer records         │
│  └─ Each page: Generate MarkObject → POST /stu/saveHcMark       │
└─────────────────────────────────────────────────────────────────┘
          ↓
┌─────────────────────────────────────────────────────────────────┐
│  Phase 4: Session Termination                                   │
│  ├─ Final page submission                                       │
│  ├─ Clear Context state                                         │
│  ├─ Stop heartbeat detection                                    │
│  └─ Navigate to completion page                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Relationships

```
ExperimentSession (1)
  ├──→ experimentTrials (1:3) → ExperimentTrial[]
  │     └──→ Mapped to ChartDataPoint (1:1)
  ├──→ chartData (1:1) → ChartData
  │     └──→ dataPoints (1:N) → ChartDataPoint[]
  ├──→ textResponses (1:3) → TextResponse[]
  └──→ questionnaireAnswers (1:27) → QuestionnaireAnswer[]

MarkObject (Per Page)
  ├──→ Aggregates: operationList (from user interactions)
  ├──→ Aggregates: answerList (from domain entities)
  └──→ Submitted: POST /stu/saveHcMark (per page navigation)
```

---

## Storage & Persistence

### Context State (In-Memory)

**Primary Storage**: React Context (`TrackingContext`) - volatile, cleared on page refresh or logout.

**Rationale**:
- Per constitution.md V. Timer Management: "会话状态MUST NOT暴露给用户(如localStorage),以防作弊"
- No localStorage or sessionStorage usage
- Data exists only during active session

### Server-Side Persistence

**Submission Frequency**: Per-page submission via `POST /stu/saveHcMark`

**Critical Pages**:
- Page 9, 10, 11: Submit after each trial (ExperimentTrial → MarkObject)
- Page 12: Submit after chart completion (ChartData → MarkObject)
- Page 13: Submit after text response (TextResponse[] → MarkObject)
- Pages 14-21: Submit after each questionnaire page (QuestionnaireAnswer[] → MarkObject)

**Error Handling**: Per constitution.md VI. Error Handling:
- 3 retry attempts with exponential backoff (1s, 2s, 4s)
- Display error modal if all retries fail
- User MUST successfully submit before navigating to next page

---

## Validation Summary

### Critical Validations (MUST)

| Entity | Validation Rule | Error Type | User Impact |
|--------|----------------|------------|-------------|
| ExperimentSession | `sessionId` is valid UUID v4 | TypeError | Session creation fails |
| ExperimentSession | `isSessionValid === true` | SessionError | Force logout with "账号已在其他设备登录" |
| ExperimentTrial | `waterContent` ∈ {15, 20, 25} | ValueError | Trial cannot be saved |
| ExperimentTrial | `temperature` ∈ {15, 20, 25, 30} | ValueError | Trial cannot be saved |
| ExperimentTrial | `fallTime` > 0 && 1 decimal place | ValueError | Trial cannot be saved |
| ChartData | `dataPoints.length >= 2` | ValidationError | Cannot proceed to next page |
| QuestionnaireAnswer | `selectedOption` ∈ {A,B,C,D,E} | ValueError | Answer cannot be saved |
| MarkObject | `beginTime < endTime` | RangeError | Submission rejected |

### Recommended Validations (SHOULD)

| Entity | Validation Rule | Handling | User Feedback |
|--------|----------------|----------|---------------|
| TextResponse | `characterCount > 0` | Warning | "建议填写回答以获得更好的测评结果" |
| TextResponse | `editDuration > 10000` | Informational | Track engagement level |
| ChartDataPoint | Duplicate `waterContent` | Prevent | "该含水量数据点已存在" |
| MarkObject | `operationList.length > 0` | Warning | Log but allow submission |

---

## Performance Considerations

### Memory Footprint

**Estimated Context State Size**:
- `ExperimentSession`: ~500 bytes
- `experimentTrials[3]`: ~1.5 KB (3 trials × ~500 bytes)
- `chartData`: ~800 bytes
- `textResponses[3]`: ~2 KB (assuming 200 chars/answer)
- `questionnaireAnswers[27]`: ~5 KB (27 questions × ~200 bytes)
- **Total**: ~10 KB (negligible for modern browsers)

### Network Optimization

**Submission Strategy**:
- Compress `operationList` by removing redundant timestamps (keep first/last only)
- Minify JSON payload (remove whitespace)
- Use gzip encoding if server supports (90% size reduction)

**Example Optimization**:
```javascript
// Before: 500 operations, 50 KB
operationList: [
  { timestamp: 1697012340000, action: 'hover', target: 'button_1', value: null },
  { timestamp: 1697012340100, action: 'hover', target: 'button_1', value: null },
  // ... 498 more hover events ...
]

// After: 2 operations, 1 KB
operationList: [
  { timestamp: 1697012340000, action: 'hover_start', target: 'button_1', value: null },
  { timestamp: 1697012350000, action: 'hover_end', target: 'button_1', value: null }
]
```

---

## Security & Privacy

### Sensitive Data Handling

**No Personal Data in Context**: Per GDPR/CCPA considerations:
- `studentCode`, `studentName` are identifiers, not PII
- No email, phone, address stored in frontend
- All PII managed server-side

### Session Security

**Multi-Device Detection**:
- `sessionId` transmitted in every heartbeat request
- Server maintains active session registry: `Map<studentCode, sessionId>`
- If new `sessionId` detected for same `studentCode`, old session invalidated
- Frontend receives `{ code: 401, msg: "会话已失效" }` → Force logout

**Session Hijacking Prevention**:
- `sessionId` generated client-side (UUID v4) - not predictable
- No session tokens in localStorage (volatile Context only)
- Heartbeat every 30s ensures stale sessions detected quickly

---

## Testing Data

### Mock Data Sets

**Development/Testing ExperimentSession**:
```javascript
export const MOCK_SESSION = {
  studentCode: 'TEST001',
  studentName: '测试学生',
  examNo: 'EXAM2025',
  batchCode: 'BATCH001',
  schoolCode: 'SCHOOL123',
  sessionId: '550e8400-e29b-41d4-a716-446655440000',
  sessionStartTime: Date.now(),
  lastHeartbeatTime: Date.now(),
  isSessionValid: true,
  currentPage: 1,
  navigationMode: 'experiment',
  experimentTimerStarted: false,
  questionnaireTimerStarted: false,
  experimentStartTime: null,
  questionnaireStartTime: null
};
```

**Mock ExperimentTrial** (for pages 9-11):
```javascript
export const MOCK_TRIALS = [
  {
    trialNumber: 1,
    waterContent: 20,
    temperature: 25,
    fallTime: 8.7,
    parameterSetTime: Date.now() - 10000,
    animationStartTime: Date.now() - 8000,
    animationEndTime: Date.now(),
    pageNumber: 9,
    operationList: [
      { timestamp: Date.now() - 10000, action: 'select_water_content', value: 20 },
      { timestamp: Date.now() - 8000, action: 'select_temperature', value: 25 },
      { timestamp: Date.now() - 5000, action: 'start_animation', value: 'begin' }
    ]
  },
  // Trial 2 and 3 similar structure
];
```

---

## Next Steps

**Phase 1 Remaining Deliverables**:
1. ✅ **data-model.md** (This document)
2. ⏳ **contracts/api.yaml**: API契约规范 (POST /stu/saveHcMark, optional GET /stu/checkSession)
3. ⏳ **quickstart.md**: 开发者上手指南 (本地环境搭建, Mock模式配置, 模块注册步骤)

**Integration Points**:
- `contracts/api.yaml` will formalize the MarkObject submission protocol defined here
- `quickstart.md` will reference this data model for Context setup examples
- Phase 2 `tasks.md` will use these entities for implementation task breakdown

---

**Document Status**: Draft
**Review Required**: Yes (validate against constitution.md Protocol III)
**Last Updated**: 2025-10-14
