# Data Model: 光伏治沙交互实验子模块

**Created**: 2025-11-19
**Feature**: 光伏治沙交互实验子模块
**Purpose**: 定义核心数据实体、状态模型和验证规则

## 核心数据实体

### 1. WindSpeedData (风速数据常量)

**描述**: 预定义的实验风速数据，确保实验结果的一致性和准确性。

**数据结构**:
```typescript
interface WindSpeedDataEntry {
  withPanel: number;    // 有光伏板区域风速 (m/s)
  noPanel: number;      // 无光伏板区域风速 (m/s)
}

interface WindSpeedData {
  [heightCm: number]: WindSpeedDataEntry;
}

// 具体数据常量
const WIND_SPEED_DATA: WindSpeedData = {
  20: { withPanel: 2.09, noPanel: 2.37 },
  50: { withPanel: 2.25, noPanel: 2.62 },
  100: { withPanel: 1.66, noPanel: 2.77 }
};
```

**验证规则**:
- 所有风速值必须为正数
- 高度参数限制为 [20, 50, 100] cm
- 数据必须为只读常量，运行时不可修改

### 2. ExperimentState (实验状态数据)

**描述**: 记录当前实验操作的状态，包括高度设置、动画状态、收集的风速数值等。

**数据结构**:
```typescript
interface ExperimentState {
  // 当前实验配置
  currentHeight: 20 | 50 | 100;        // 当前设置的高度(cm)
  isRunning: boolean;                   // 是否正在运行实验
  isCompleted: boolean;                 // 是否已完成实验
  
  // 动画状态
  animationState: 'idle' | 'starting' | 'running' | 'completed';
  animationStartTime: number | null;    // 动画开始时间戳
  animationDuration: 2000;              // 动画持续时间(ms)
  
  // 收集的数据
  collectedData: {
    heightLevel: number;                 // 高度参数
    withPanelSpeed: number;             // 有板区风速
    noPanelSpeed: number;               // 无板区风速
    timestamp: string;                  // 数据收集时间
  } | null;
  
  // 操作历史
  operationHistory: {
    action: 'height_change' | 'start_experiment' | 'reset_experiment';
    fromValue?: any;
    toValue?: any;
    timestamp: string;
  }[];
}
```

**状态转换规则**:
```
idle → starting (用户点击开始)
starting → running (动画开始播放)
running → completed (动画播放完毕且数据收集完成)
completed → idle (用户重置实验)
```

**验证规则**:
- currentHeight 必须在 [20, 50, 100] 范围内
- animationDuration 固定为 2000ms
- collectedData 只能在 animationState 为 'completed' 时存在
- operationHistory 必须按时间顺序记录所有操作

### 3. AnswerDraft (答案草稿数据)

**描述**: 保存用户在各页面的输入内容，支持页面刷新后的状态恢复。

**数据结构**:
```typescript
interface AnswerDraft {
  // 页面级答案映射
  pageAnswers: {
    [pageId: string]: {
      [questionId: string]: {
        value: string | number | boolean;  // 答案值
        lastModified: string;              // 最后修改时间
        isValid: boolean;                  // 是否通过验证
        validationMessage?: string;        // 验证错误信息
      };
    };
  };
  
  // 实验相关答案
  experimentAnswers: {
    designReason: string;                  // Page 4: 实验设计原因
    tutorialCompleted: boolean;            // Page 5: 是否完成操作指引
    experiment1Choice: 'withPanel' | 'noPanel' | null;  // Page 6: 50cm高度对比选择
    experiment2Analysis: string;           // Page 7: 趋势分析文字
    conclusionAnswers: {                   // Page 8: 结论分析问答
      question1: string;
      question2: string;
      question3: string;
    };
  };
  
  // 元数据
  metadata: {
    submoduleId: 'g8-pv-sand-experiment';
    version: string;                       // 数据版本号
    createdAt: string;                     // 创建时间
    lastSavedAt: string;                   // 最后保存时间
    totalPages: 8;                         // 总页面数
    completedPages: string[];              // 已完成的页面ID列表
  };
}
```

**验证规则**:
- Page 4: designReason 最少5个字符
- Page 6: experiment1Choice 必须有明确选择
- Page 7: experiment2Analysis 必须有内容
- Page 8: 所有conclusionAnswers必须填写
- lastModified 必须为有效的ISO 8601时间格式

### 4. OperationLog (用户操作记录)

**描述**: 记录用户的所有交互操作，符合项目统一的数据记录协议。

**数据结构**:
```typescript
interface OperationLog {
  code: number;                          // 操作序号(自增)
  targetElement: string;                 // 目标元素标识
  eventType: StandardEventType;          // 标准事件类型
  value: string | object;                // 操作值或状态
  time: string;                          // ISO 8601时间格式
  pageId?: string;                       // 页面ID(可选)
}

// 标准事件类型(来自项目规范)
type StandardEventType = 
  | 'page_enter' | 'page_exit'
  | 'click' | 'change'
  | 'click_blocked'
  | 'flow_context';

// 光伏治沙模块特定的操作示例
interface PvSandOperationExamples {
  pageLifecycle: {
    targetElement: '页面';
    eventType: 'page_enter' | 'page_exit';
    value: string; // pageId
  };
  
  experimentOperation: {
    targetElement: '开始按钮' | '重置按钮' | '高度调节器';
    eventType: 'click';
    value: string; // '开始实验_高度50cm' | '重置实验' | '调节高度_从50到100cm'
  };
  
  answerInput: {
    targetElement: string; // 'P4_实验设计问题1' | 'P6_风速对比问题'
    eventType: 'change';
    value: string; // 用户输入内容或选择值
  };
  
  validationBlock: {
    targetElement: '下一步';
    eventType: 'click_blocked';
    value: string; // '文本长度不足5字符' | '未完成实验操作'
  };
  
  flowContext: {
    targetElement: 'flow_context';
    eventType: 'flow_context';
    value: string; // JSON字符串，包含flowId/submoduleId/stepIndex
  };
}
```

**记录规则**:
- 每个页面必须记录 page_enter 和 page_exit 事件
- 所有用户交互必须实时记录
- 验证失败时必须记录 click_blocked 事件
- Flow上下文在首次进入子模块时自动记录

### 5. MarkObject (提交数据格式)

**描述**: 符合项目统一数据提交协议的MarkObject结构。

**数据结构**:
```typescript
interface MarkObject {
  pageNumber: string;                    // 点分隔格式: "H.1"/"1.4"/"2.5" 等
  pageDesc: string;                      // "[flowId/submoduleId/stepIndex] 页面描述"
  operationList: OperationLog[];         // 用户操作记录列表
  answerList: AnswerEntry[];            // 收集的答案列表
  beginTime: string;                     // 页面开始时间 "YYYY-MM-DD HH:mm:ss"
  endTime: string;                       // 页面结束时间 "YYYY-MM-DD HH:mm:ss"
  imgList: any[];                        // 图片列表(本模块为空)
}

interface AnswerEntry {
  code: number;                          // 答案编号(从1开始自增)
  targetElement: string;                 // 问题标识 "P{pageNumber}_{业务语义}"
  value: string;                         // 答案值(使用可读标签，非内部编码)
}

// 光伏治沙模块的pageNumber编码规则
interface PageNumberMapping {
  "H.1": "详细封面页(注意事项)";          // Page 1 - hidden
  "H.2": "任务封面页";                   // Page 2 - hidden  
  "H.3": "背景引入页";                   // Page 3 - hidden
  "1.4": "实验方案设计";                 // Page 4 - Step 1
  "2.5": "操作指引试玩";                 // Page 5 - Step 2
  "3.6": "实验探究-1(50cm高度对比)";      // Page 6 - Step 3
  "4.7": "实验探究-2(趋势分析)";          // Page 7 - Step 4
  "5.8": "结论分析综合问答";             // Page 8 - Step 5
}
```

**提交规则**:
- 必须使用统一的 usePageSubmission Hook
- pageDesc 必须包含 flowId/submoduleId/stepIndex 前缀
- 每次页面切换都必须提交当前页数据
- 提交失败时默认阻止导航，提供重试机制

## 数据流转架构

### 状态管理层级

```
Flow Context (流程级)
├── flowId: string
├── submoduleId: string  
├── stepIndex: number
├── moduleProgress: number
└── moduleCompletion: boolean

Module Context (模块级)
├── currentPageId: string
├── experimentState: ExperimentState
├── answerDrafts: AnswerDraft
├── operationLogs: OperationLog[]
└── pageSubmissionState: SubmissionState

Local Storage (持久化)
├── 'module.g8-pv-sand-experiment.answers' → AnswerDraft
├── 'module.g8-pv-sand-experiment.experimentData' → ExperimentState
└── 'flow.[flowId].modulePageNum' → number (by Flow)
```

### 数据同步策略

1. **Flow → Module**: 
   - initialPageId 通过 props 传入
   - flowContext 通过 options 传入
   - timer配置通过 options.timers 传入

2. **Module → Flow**:
   - 通过 FlowBridge 组件同步进度
   - 通过 flow_context 事件记录状态变化
   - 通过完成/超时回调触发Flow层处理

3. **Local ↔ Module**:
   - 答案草稿实时保存到 localStorage
   - 实验状态保存到 sessionStorage
   - 页面刷新时自动恢复状态

## 数据验证规则

### 运行时验证

```typescript
// 实验状态验证
const validateExperimentState = (state: ExperimentState): ValidationResult => {
  const errors: string[] = [];
  
  if (![20, 50, 100].includes(state.currentHeight)) {
    errors.push('高度参数必须为20、50或100cm');
  }
  
  if (state.animationDuration !== 2000) {
    errors.push('动画时长必须为2000ms');
  }
  
  if (state.isCompleted && !state.collectedData) {
    errors.push('实验完成时必须有收集的数据');
  }
  
  return { isValid: errors.length === 0, errors };
};

// 答案验证
const validateAnswers = (draft: AnswerDraft): ValidationResult => {
  const errors: string[] = [];
  
  // Page 4: 实验设计验证
  const designReason = draft.experimentAnswers.designReason;
  if (!designReason || designReason.length < 5) {
    errors.push('实验设计原因至少需要5个字符');
  }
  
  // Page 6: 选择题验证
  if (!draft.experimentAnswers.experiment1Choice) {
    errors.push('必须选择风速对比结果');
  }
  
  return { isValid: errors.length === 0, errors };
};
```

### 数据完整性检查

- 所有必填字段必须存在且非空
- 时间格式必须符合ISO 8601规范
- 操作记录必须按时间顺序排列
- 页面答案必须通过相应的业务验证

这个数据模型确保了光伏治沙子模块的数据结构清晰、类型安全，并与项目整体架构保持一致。