# 子模块数据提交流程与规范（执行手册）

本手册汇总子模块接入统一提交流程的关键要求，便于实现与验收。参考基准：`docs/submission-format-standard.md`、`openspec/changes/update-unified-submission-pipeline/specs/data-format/spec.md`、`.../specs/submission/spec.md`。

## 1. 页码与前缀

- 页码：`pageNumber = encodeCompositePageNum(stepIndex + 1, subPageNum)` → `<submoduleIndex>.<pageIndexTwoDigits>`（如 `1.03`），禁止 `M*`/冒号格式，必须满足 `^[1-9]\\d*\\.\\d{2}$`。
- 页面描述：`pageDesc` 前缀 `[flowId/submoduleId/stepIndex]`，无 Flow 时省略前缀。
- 目标前缀：所有 `targetElement` 以 `P${pageNumber}_...` 开头，示例 `P1.03_xxx`（替代旧的 `P0.3_xxx`）。
- 迁移参考：`docs/composite-page-numbering-migration-guide.md`。

## 2. 事件与操作（operationList）

- 标准事件集合：`page_enter`、`page_exit`、`click`、`change`、`input`、`input_focus`、`input_change`、`input_delete`、`input_blur`、`select_change`、`radio_select`、`checkbox_check`、`checkbox_uncheck`、`modal_open`、`modal_close`、`view_material`、`timer_start`、`timer_stop`、`timer_complete`、`simulation_timing_started`、`simulation_run_result`、`simulation_operation`、`questionnaire_answer`、`flow_context`、`auto_submit`、`next_click`、`page_submit_success`、`page_submit_failed`、`click_blocked`。
- 最小事件集合（每页必须）：`page_enter`、`page_exit`、`next_click`（或等效下一步）、阻断时 `click_blocked`（含 `missing` 列表）；输入/选择类记录 focus/change/delete/blur 或 select_change；实验/计时页记录参数调整、计时开始/结束、运行结果。
- 输入 value 示例：`input_change` 用 `{ prev, next }` 或 `{ prevLength, nextLength, delta? }`；`input_delete` 用 `{ action: 'delete', prevLength, nextLength }` 或前后快照。
- flow 上下文：提交层自动注入单条 `flow_context`（含 flowId/stepIndex/submoduleId/moduleName/pageId?）。

## 3. 答案（answerList）

### 3.1 基本规则

- **仅记录非空答案**：空字符串/null/undefined 不入列。
- **超时占位**：由提交层自动补齐"超时未回答"占位符。
- **字段结构**：每条答案包含 `code`（序号）、`targetElement`（问题文本）、`value`（答案内容）。

### 3.2 targetElement 格式要求

- **必须使用完整问题文本**，便于后续评分时了解问题上下文。
- **禁止使用简短题目ID**（如 `P1.05_最小GSD焦距`），应使用完整问题（如 `"问题2：根据模拟实验，当飞行高度为100米时，使用何种焦距可以使地面采样距离（GSD）达到最小？"`）。
- **特殊类型答案**（如实验历史、元数据）可使用描述性标识（如 `experiment_captures`）。

### 3.3 value 格式要求

#### 单选题

- **必须包含选项标签和内容**，格式：`"<选项ID>. <选项文本>"`
- ✅ 正确示例：`"A. 8毫米"`、`"B. 镜头焦距"`
- ❌ 错误示例：`"A"`、`"B"`（仅选项ID，缺少内容）

#### 多选题

- 格式：`"<选项1>, <选项2>"`（逗号分隔完整选项）
- 示例：`"A. 温度, C. 湿度, D. 光照"`

#### 文本输入题

- 直接记录用户输入的完整文本
- 示例：`"为了保证实验的准确性和可重复性"`

#### 复杂数据（实验历史、截图元数据等）

- value 为 **JSON 字符串**
- 示例：`"{\"height\":100,\"focal\":24,\"gsd\":1.00}"`

### 3.4 数据示例

#### 示例1：单选题答案

```json
{
  "code": 1,
  "targetElement": "问题2：根据模拟实验，当飞行高度为100米时，使用何种焦距可以使地面采样距离（GSD）达到最小？",
  "value": "B. 24毫米"
}
```

#### 示例2：文本输入题答案

```json
{
  "code": 1,
  "targetElement": "问题1：为什么在每次航拍时，都需要确保相机分辨率和天气条件等一致？请写出原因。",
  "value": "为了保证实验的准确性和可重复性"
}
```

#### 示例3：实验历史数据

```json
{
  "code": 2,
  "targetElement": "experiment_captures",
  "value": "[{\"height\":100,\"focalLength\":8,\"gsd\":3.01,\"timestamp\":\"2025-02-01 09:05:12\"},{\"height\":100,\"focalLength\":24,\"gsd\":1.00,\"timestamp\":\"2025-02-01 09:05:45\"}]"
}
```

#### 示例4：完整 answerList（多题）

```json
{
  "answerList": [
    {
      "code": 1,
      "targetElement": "问题4：右图展示了飞行高度、镜头焦距与地面采样距离（GSD）的关系曲线。请问在航拍中，为获取更高精度的影像，应优先考虑降低飞行高度还是调整镜头焦距？",
      "value": "B. 镜头焦距"
    },
    {
      "code": 2,
      "targetElement": "请说明你的理由：",
      "value": "根据图表数据，调整焦距对降低GSD效果更佳。"
    }
  ]
}
```

### 3.5 与 operationList 的区别

- **operationList.targetElement**：使用题目ID前缀（如 `P1.05_最小GSD焦距`），用于追踪用户操作。
- **answerList.targetElement**：使用完整问题文本，便于评分和理解。
- **operationList 记录过程，answerList 记录结果**。

## 4. 提交流程

- 唯一入口：使用新版 `usePageSubmission`（或框架默认助手）；子模块仅提供 `getUserContext`、`getFlowContext`、`pageMeta(pageId/pageTitle/subPageNum)`、已过滤的 `answers` 与业务 `operations`。
- 提交层职责：编码页码/前缀、flow_context 注入、自增 code、时间兜底（`YYYY-MM-DD HH:mm:ss`）、Schema 校验、统一 API 提交，自动追加 `page_submit_success/failed` 与超时 `auto_submit`。
- 禁止：直连 `/stu/saveHcMark`、手写 code/时间/前缀/flow_context。

## 5. 守卫与验证

- Schema：TS+Zod/JSON Schema 校验必填字段、事件枚举、code 连续性、前缀、时间格式。
- Lint/测试：检查 targetElement 前缀、事件合法性与最小事件集合缺失即失败；提交格式快照测试覆盖代表性页面。

## 6. 子模块 mapping.ts 规范化常量

每个子模块应在 `mapping.ts` 中定义以下规范化常量，用于统一数据提交格式：

### 6.1 必需常量

```typescript
// 页面描述映射
export const PAGE_DESC_MAP: Record<PageId, string> = {
  page_01: '任务封面',
  page_02: '背景介绍',
  // ...
};

// 每个页面的问题列表（答案键名）
export const PAGE_QUESTIONS: Record<PageId, string[]> = {
  page_01: [], // 无问题的页面
  page_03: ['Q1_实验设计原因'],
  page_05: ['Q2_50cm风速区域'],
  // ...
};

// 问题编码映射（用于 answerList 的 code 字段）
export const QUESTION_CODE_MAP: Record<string, number> = {
  Q1: 1,
  Q2: 2,
  Q3: 3,
  // ...
};

// 问题完整文本映射（用于 answerList 的 targetElement 字段）
export const QUESTION_TEXT_MAP: Record<string, string> = {
  Q1: '问题1：为什么要设置对照组？请写出原因。',
  Q2: '问题2：根据模拟实验，哪个区域的风速更低？',
  // ...
};

// 选项文本映射（用于格式化单选题答案）
export const QUESTION_OPTIONS_MAP: Record<string, Record<string, string>> = {
  Q2: {
    A: '有板区',
    B: '无板区',
    withPanel: '有板区', // 兼容内部值
    noPanel: '无板区',
  },
  // ...
};

// 内部答案键到规范化答案键的映射
export const INTERNAL_TO_STANDARD_KEY: Record<string, string> = {
  designReason: 'Q1_实验设计原因',
  experiment1Choice: 'Q2_50cm风速区域',
  // ...
};

// 答案键到问题ID的映射
export const ANSWER_KEY_TO_QUESTION: Record<string, string> = {
  Q1_实验设计原因: 'Q1',
  Q2_50cm风速区域: 'Q2',
  // ...
};
```

### 6.2 常量用途说明

| 常量                       | 用途                          | 使用场景   |
| -------------------------- | ----------------------------- | ---------- |
| `PAGE_DESC_MAP`            | 提供 pageDesc 字段值          | 提交时     |
| `PAGE_QUESTIONS`           | 定义每页需收集的答案          | 验证、提交 |
| `QUESTION_CODE_MAP`        | 生成 answerList.code          | 提交时     |
| `QUESTION_TEXT_MAP`        | 生成 answerList.targetElement | 提交时     |
| `QUESTION_OPTIONS_MAP`     | 格式化单选题 value            | 提交时     |
| `INTERNAL_TO_STANDARD_KEY` | 转换内部键到规范键            | 答案收集   |
| `ANSWER_KEY_TO_QUESTION`   | 查找问题ID                    | 格式化答案 |

## 7. Context 中的 getPagePrefix 实现

子模块 Context 应提供 `getPagePrefix()` 函数，用于生成符合规范的 targetElement 前缀：

```typescript
// 在 Context 中
interface FlowContextData {
  flowId?: string;
  submoduleId?: string;
  stepIndex?: number;
}

const getPagePrefix = useCallback(() => {
  const subPageNum = getSubPageNumByPageId(state.currentPageId as PageId);
  const flowStepIndex = state.flowContext?.stepIndex;

  // 有 flowContext 时：P{stepIndex+1}.{subPageNum(两位零填充)}_
  // 无 flowContext 时：默认 submoduleIndex=1，仍使用两位零填充格式
  const compositeStepIndex = (flowStepIndex ?? 0) + 1;
  const pageNumber = encodeCompositePageNum(compositeStepIndex, subPageNum); // => 1.03，满足 ^[1-9]\\d*\\.\\d{2}$

  return `P${pageNumber}_`;
}, [state.currentPageId, state.flowContext?.stepIndex]);
```

### 7.1 页面组件中的使用

```typescript
const Page06Experiment: React.FC = () => {
  const { getPagePrefix, logOperation } = useMyContext();

  const targetPrefix = getPagePrefix();
  const questionTarget = `${targetPrefix}Q2_风速区域`;

  // 页面进入/退出
  useEffect(() => {
    logOperation({
      targetElement: `${targetPrefix}页面`,
      eventType: EventTypes.PAGE_ENTER,
      value: currentPageId,
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        targetElement: `${targetPrefix}页面`,
        eventType: EventTypes.PAGE_EXIT,
        value: currentPageId,
        time: new Date().toISOString(),
      });
    };
  }, [targetPrefix]);

  // 选择题操作记录
  const handleSelect = (choice: string) => {
    logOperation({
      targetElement: questionTarget,
      eventType: EventTypes.RADIO_SELECT,
      value: choice === 'withPanel' ? 'A. 有板区' : 'B. 无板区',
      time: new Date().toISOString(),
    });
  };
};
```

## 8. flowContext 同步机制

子模块需要从外部（FlowModule）接收并同步 flowContext：

### 8.1 Context 状态扩展

```typescript
// State 中添加
interface ContextState {
  // ...existing fields
  flowContext: FlowContextData | null;
}

// Action 中添加
type Action = { type: 'SET_FLOW_CONTEXT'; payload: FlowContextData | null };
// ...other actions
```

### 8.2 Component.tsx 中的同步

```typescript
const MySubmoduleComponent: React.FC<SubmoduleProps> = ({ flowContext }) => {
  const { setFlowContext } = useMyContext();

  // 同步外部 flowContext 到内部 state
  useEffect(() => {
    if (flowContext) {
      setFlowContext({
        flowId: flowContext.flowId,
        submoduleId: flowContext.submoduleId,
        stepIndex: flowContext.stepIndex,
      });
    }
  }, [flowContext, setFlowContext]);

  // ...
};
```

## 9. collectAnswers 规范化函数

提交时需要将内部答案格式转换为规范化的 answerList：

```typescript
const collectAnswers = useCallback(() => {
  const currentPageQuestions = PAGE_QUESTIONS[currentPageId] || [];
  const answerList: AnswerEntry[] = [];

  currentPageQuestions.forEach(standardKey => {
    // 查找内部键
    const internalKey = Object.entries(INTERNAL_TO_STANDARD_KEY).find(
      ([_, v]) => v === standardKey
    )?.[0];

    // 获取原始值
    const rawValue = internalKey ? answers[internalKey] : answers[standardKey];
    if (rawValue === undefined || rawValue === null || rawValue === '') return;

    // 获取问题ID
    const questionId = ANSWER_KEY_TO_QUESTION[standardKey];
    if (!questionId) return;

    // 格式化 value（单选题需要格式化为 "A. 选项文本"）
    let formattedValue = String(rawValue);
    const optionsMap = QUESTION_OPTIONS_MAP[questionId];
    if (optionsMap && optionsMap[rawValue]) {
      const optionText = optionsMap[rawValue];
      // 查找选项标签（A/B/C/D）
      const optionLabel = Object.entries(optionsMap).find(
        ([k, v]) => k.length === 1 && v === optionText
      )?.[0];
      if (optionLabel) {
        formattedValue = `${optionLabel}. ${optionText}`;
      }
    }

    answerList.push({
      code: QUESTION_CODE_MAP[questionId] || 0,
      targetElement: QUESTION_TEXT_MAP[questionId] || standardKey,
      value: formattedValue,
    });
  });

  return answerList;
}, [currentPageId, answers]);
```

## 10. buildMark 提交模式（推荐）

推荐使用 `buildMark` 模式进行数据提交，而非直接传递 operations/answers：

```typescript
// Component.tsx 中的 submissionConfig
const submissionConfig = useMemo(
  () => ({
    buildMark: () => ({
      pageNumber,
      pageDesc: currentPageDesc,
      operationList: operationsForSubmission,
      answerList: collectAnswers(), // 使用规范化函数
      beginTime: formatTimestamp(pageStartTime),
      endTime: formatTimestamp(new Date()),
      imgList: [],
    }),
  }),
  [pageNumber, currentPageDesc, operationsForSubmission, collectAnswers, pageStartTime]
);
```

### 10.1 buildMark vs operations/answers 对比

| 特性     | buildMark 模式         | operations/answers 模式 |
| -------- | ---------------------- | ----------------------- |
| 灵活性   | 高，完全控制输出格式   | 低，依赖框架转换        |
| 规范化   | 可在函数内完成转换     | 需要额外处理层          |
| 推荐场景 | 需要复杂格式化的子模块 | 简单场景                |
| 参考实现 | g8-mikania-experiment  | -                       |

## 11. 提案交付要求（给各子模块）

- 迁移页清单：列出 pageNumber/pageId/标题，标注类型（实验/问卷/过渡/计时等）及特殊页（计时、阻断、复杂实验）。
- 样例快照：为 2–3 个典型页给出期望 `MarkObject` 示例（操作覆盖最小事件集合，答案仅非空/超时占位，前缀/时间格式正确）。
- 验证计划：说明快照/fixture 覆盖的页面，是否有历史数据清洗/兼容需求。
- **mapping.ts 常量定义**：提供完整的规范化常量定义（参考第 6 节）。
- **Context 扩展**：确保 Context 支持 flowContext 同步和 getPagePrefix 函数。

## 12. 常见问题与解决方案

### Q1: targetElement 前缀格式不正确

**问题**：`targetElement` 使用了 `page`、`next_button` 等简短名称。
**解决**：使用 `getPagePrefix()` 生成前缀，如 `${targetPrefix}页面`、`${targetPrefix}下一页按钮`。

### Q2: 单选题 value 格式不正确

**问题**：value 仅包含选项 ID（如 `"A"`）或内部值（如 `"withPanel"`）。
**解决**：使用 `QUESTION_OPTIONS_MAP` 格式化为 `"A. 选项文本"` 格式。

### Q3: answerList.targetElement 使用了简短键名

**问题**：targetElement 为 `"Q1_实验原因"` 而非完整问题文本。
**解决**：使用 `QUESTION_TEXT_MAP` 获取完整问题文本。

### Q4: flowContext 未正确传递

**问题**：页面前缀缺少 stepIndex 或未使用两位零填充（如 `P3_` 而非 `P2.03_`）。
**解决**：在 Component.tsx 中同步外部 flowContext 到内部 Context。

### Q5: code 字段缺失或不连续

**问题**：answerList 中的 code 为 0 或重复。
**解决**：使用 `QUESTION_CODE_MAP` 为每个问题分配唯一编码。

### Q6: pageNumber 格式不符合新规范

**问题**：使用了旧格式 `0.*` 或未做两位零填充的页码。
**解决**：使用 `encodeCompositePageNum(stepIndex + 1, subPageNum)` 生成 `<submoduleIndex>.<pageIndexTwoDigits>`（如 `1.03`），并确保前缀形如 `P1.03_xxx`。

## 13. 共享适配器层（submoduleAdapter）

从 `@shared/services/submission/submoduleAdapter` 导入共享工具函数，简化子模块的提交适配实现。

### 13.1 导入与使用

```typescript
import {
  // 页面元数据 Hook
  usePageMeta,

  // 答案收集工具
  collectAnswers,

  // 页面描述构建
  buildPageDesc,

  // 实验历史追加
  appendExperimentHistory,

  // 验证工具
  validateMarkBeforeSubmit,
  validateMappingConfig,

  // 常量与类型
  RESERVED_ELEMENTS,
  DEFAULTS,
  isReservedElement,
  type SubmoduleMappingConfig,
  type MarkObject,
  type ValidationResult,
} from '@shared/services/submission/submoduleAdapter';
```

### 13.2 usePageMeta Hook

获取规范化的页面元数据，包括 pageNumber 和 targetElement 前缀：

```typescript
const MyPage: React.FC<{ stepIndex: number; subPageNum: number }> = ({ stepIndex, subPageNum }) => {
  const { pageNumber, targetPrefix, prefixTarget } = usePageMeta(stepIndex, subPageNum);

  // pageNumber: "1.03" (已格式化)
  // targetPrefix: "P1.03_"
  // prefixTarget: (element: string) => "P1.03_xxx" (自动跳过保留元素)

  const handleClick = () => {
    logOperation({
      targetElement: prefixTarget('按钮'), // => "P1.03_按钮"
      eventType: 'click',
      value: 'clicked',
    });
  };
};
```

### 13.3 collectAnswers 函数

根据 mapping 配置收集并格式化答案：

```typescript
const mapping: SubmoduleMappingConfig = {
  PAGE_QUESTIONS: { page_01: ['Q1_原因'] },
  QUESTION_CODE_MAP: { Q1: 1 },
  QUESTION_TEXT_MAP: { Q1: '问题1：请说明原因' },
  QUESTION_OPTIONS_MAP: { Q1: { A: '选项A', B: '选项B' } },
  ANSWER_KEY_TO_QUESTION: { Q1_原因: 'Q1' },
  // ...
};

const answers = { Q1_原因: 'A' };
const answerList = collectAnswers('page_01', answers, mapping);
// => [{ code: 1, targetElement: '问题1：请说明原因', value: 'A. 选项A' }]
```

### 13.4 buildPageDesc 函数

构建带 Flow 上下文前缀的页面描述：

```typescript
const flowContext = { flowId: 'flow-1', submoduleId: 'my-module', stepIndex: 0 };

buildPageDesc('实验页面', flowContext);
// => "[flow-1/my-module/0] 实验页面"

buildPageDesc('实验页面', null);
// => "实验页面"
```

### 13.5 appendExperimentHistory 函数

向 answerList 追加实验历史记录：

```typescript
const history = [{ height: 100, gsd: 1.5 }];
const answerList: AnswerEntry[] = [];

appendExperimentHistory(answerList, history, {
  targetPrefix: 'P1.04_',
  historyCodeBase: 100, // 默认值
  targetElementName: 'experiment_captures', // 默认值
});
// answerList => [{ code: 100, targetElement: 'P1.04_experiment_captures', value: '[{"height":100,"gsd":1.5}]' }]
```

### 13.6 验证工具

提交前验证 MarkObject 结构：

```typescript
const mark: MarkObject = buildMark();
const result = validateMarkBeforeSubmit(mark, { flowContext });

if (!result.valid) {
  console.error('验证失败:', result.errors);
}
```

验证 mapping 配置完整性：

```typescript
const result = validateMappingConfig(mapping);
if (!result.valid) {
  console.warn('Mapping 配置警告:', result.errors);
}
```

### 13.7 保留元素

以下 `targetElement` 值不添加页面前缀：

```typescript
RESERVED_ELEMENTS = new Set([
  'page',
  'next_button',
  'prev_button',
  'module',
  'flow_context',
  'task_timer',
  'countdown',
]);

// 检查是否为保留元素
isReservedElement('page'); // true
isReservedElement('按钮'); // false
```

### 13.8 完整示例

参考实现：

- `src/submodules/g8-pv-sand-experiment/` - 光伏治沙实验
- `src/submodules/g8-mikania-experiment/` - 薇甘菊实验
- `src/submodules/g8-drone-imaging/` - 无人机航拍实验
- `src/modules/grade-7/` - 7年级酵母发酵实验（适配层模式）

## 14. 稳定的 logOperation 模式（最佳实践）

基于 g8-pv-sand-experiment 和 g8-mikania-experiment 的实战经验，强烈推荐使用以下模式避免 useEffect 循环触发问题。

### 14.1 问题背景

在 React 中，如果 `logOperation` 函数依赖于 state，每次 state 变化都会导致 `logOperation` 引用变化，进而触发依赖它的 useEffect 重复执行（如 PAGE_ENTER/PAGE_EXIT 循环）。

### 14.2 推荐实现

```typescript
// Context.tsx

// 1. 使用 ref 存储 flowContext，避免 logOperation 依赖变化
const flowContextRef = useRef<FlowContextData | null>(initialFlowContext);

// 2. 使用 ref 跟踪当前页面
const currentPageRef = useRef(initialPageId);
currentPageRef.current = state.currentPageId;

// 3. 使用 ref 存储序号生成器
const sequenceRef = useRef(createOperationSequence());

// 4. 使用 ref 追踪 flow_context 是否已注入当前页
const flowContextInjectedRef = useRef(false);

// 5. 创建稳定的 logOperation（空依赖数组）
const logOperation = useCallback((operation: Omit<OperationLog, 'code'>) => {
  const code = sequenceRef.current.next();
  const pageId = operation.pageId || currentPageRef.current;
  const normalizedTime = formatTimestamp(operation.time ? new Date(operation.time) : new Date());

  const operationWithCode: OperationLog = {
    ...operation,
    code,
    pageId,
    time: normalizedTime,
  };

  dispatch({
    type: 'ADD_OPERATION',
    payload: operationWithCode,
  });

  // 在 page_enter 后自动注入 flow_context
  const isPageEnter = operation.eventType === EventTypes.PAGE_ENTER;
  const currentFlowContext = flowContextRef.current;

  if (
    isPageEnter &&
    currentFlowContext &&
    !flowContextInjectedRef.current &&
    shouldInjectFlowContext(operationsRef.current, currentFlowContext)
  ) {
    // 注入 flow_context（详见 14.4）
    flowContextInjectedRef.current = true;
  }
}, []); // 空依赖数组 - logOperation 永远稳定

// 6. 页面切换时重置标记
const navigateToPage = useCallback((pageId: string) => {
  sequenceRef.current.reset();
  flowContextInjectedRef.current = false;
  dispatch({ type: 'SET_CURRENT_PAGE', payload: pageId });
}, []);
```

### 14.3 使用共享工具

```typescript
import {
  createOperationSequence,
  createPageStateResetter,
  injectFlowContext,
  shouldInjectFlowContext,
} from '@shared/services/submission/submoduleAdapter';

// 创建序号生成器
const sequenceRef = useRef(createOperationSequence());

// 创建页面重置器（一次性重置序号和标记）
const pageResetter = useMemo(
  () =>
    createPageStateResetter(sequenceRef.current, (value: boolean) => {
      flowContextInjectedRef.current = value;
      setFlowContextInjected(value);
    }),
  []
);

// 页面切换时调用
const navigateToPage = useCallback(
  (pageId: string) => {
    pageResetter();
    dispatch({ type: 'SET_CURRENT_PAGE', payload: pageId });
  },
  [pageResetter]
);
```

### 14.4 flow_context 自动注入

推荐在 Context 层自动处理 flow_context 注入，而非在每个页面组件中手动注入：

```typescript
// 在 logOperation 中，PAGE_ENTER 后自动注入
if (isPageEnter && currentFlowContext && !flowContextInjectedRef.current) {
  const flowContextPayload = {
    flowId: currentFlowContext.flowId,
    submoduleId: currentFlowContext.submoduleId,
    stepIndex: currentFlowContext.stepIndex,
    moduleName: '实验名称',
    pageId,
  };

  const tempOperations = [...operationsRef.current, operationWithCode];
  const injectedOperations = injectFlowContext(
    tempOperations,
    flowContextPayload,
    sequenceRef.current,
    { allowMissingPageEnter: true }
  );

  const flowContextOp = injectedOperations.find(op => op.eventType === EventTypes.FLOW_CONTEXT);

  if (flowContextOp) {
    dispatch({ type: 'ADD_OPERATION', payload: flowContextOp });
  }

  flowContextInjectedRef.current = true;
}
```

### 14.5 Reducer 模式（g8-mikania-experiment）

另一种可行方案是在 Reducer 中处理 flow_context 注入：

```typescript
function createMikaniaReducer(sequenceRef, flowContext) {
  return function mikaniaReducer(state, action) {
    switch (action.type) {
      case ACTION_TYPES.LOG_OPERATION: {
        const operations = [...state.operations, action.payload];

        const isPageEnter = action.payload.eventType === EventTypes.PAGE_ENTER;
        const needFlowContextInjection =
          isPageEnter &&
          shouldInjectFlowContext(operations, flowContext) &&
          !state.flowContextInjected;

        const operationsWithFlowContext = needFlowContextInjection
          ? injectFlowContext(operations, flowContext, sequenceRef.current)
          : operations;

        return {
          ...state,
          operations: operationsWithFlowContext,
          flowContextInjected: state.flowContextInjected || needFlowContextInjection,
        };
      }
      // ...
    }
  };
}
```

## 15. SUBMODULE_MAPPING_CONFIG 导出规范

每个子模块应在 `mapping.ts` 中导出 `SUBMODULE_MAPPING_CONFIG`，供 `collectAnswers` 等共享工具使用：

```typescript
// mapping.ts
import type { SubmoduleMappingConfig } from '@shared/services/submission/submoduleAdapter';

export const SUBMODULE_MAPPING_CONFIG: SubmoduleMappingConfig = {
  PAGE_CONFIGS: PAGE_CONFIGS.map(config => ({
    pageId: config.pageId,
    subPageNum: config.subPageNum,
    title: PAGE_DESC_MAP[config.pageId],
    questionKeys: PAGE_QUESTIONS[config.pageId] || [],
  })),
  PAGE_DESC_MAP,
  PAGE_QUESTIONS,
  QUESTION_CODE_MAP,
  QUESTION_TEXT_MAP,
  ANSWER_KEY_TO_QUESTION,
  getSubPageNumByPageId,
  // 可选但推荐
  QUESTION_OPTIONS_MAP,
  INTERNAL_TO_STANDARD_KEY,
  HISTORY_CODE_BASE,
  getPageConfig,
  formatAnswer: formatAnswerValue,
};
```

### 15.1 formatAnswer 函数要求

有单选/多选题的子模块必须实现 `formatAnswer` 函数：

```typescript
const formatAnswerValue = (questionId: string, rawValue: unknown): string => {
  if (rawValue == null) return '';

  const options = QUESTION_OPTIONS_MAP[questionId];
  if (!options) {
    return typeof rawValue === 'string' ? rawValue : String(rawValue);
  }

  const stringValue = String(rawValue);

  // 处理原始值映射（如 withPanel -> A. 有板区）
  if (stringValue === 'withPanel') return 'A. 有板区';
  if (stringValue === 'noPanel') return 'B. 无板区';

  // 处理选项标签（如 A -> A. 有板区）
  if (options[stringValue] && ['A', 'B', 'C', 'D'].includes(stringValue)) {
    return `${stringValue}. ${options[stringValue]}`;
  }

  return stringValue;
};
```

## 16. 子模块一致性检查清单

实施前请确认以下事项：

### 16.1 mapping.ts 检查

- [ ] 定义 `PAGE_DESC_MAP`
- [ ] 定义 `PAGE_QUESTIONS`
- [ ] 定义 `QUESTION_CODE_MAP`（code 唯一且连续）
- [ ] 定义 `QUESTION_TEXT_MAP`（完整问题文本）
- [ ] 定义 `ANSWER_KEY_TO_QUESTION`
- [ ] **有单选题时**：定义 `QUESTION_OPTIONS_MAP`
- [ ] **有内部键名时**：定义 `INTERNAL_TO_STANDARD_KEY`
- [ ] 导出 `SUBMODULE_MAPPING_CONFIG`
- [ ] 实现 `formatAnswer` 函数（如有选项题）

### 16.2 Context 检查

- [ ] 使用 `createOperationSequence` 管理序号
- [ ] `logOperation` 使用空依赖数组（稳定引用）
- [ ] 使用 ref 存储 flowContext
- [ ] 实现 `getPagePrefix()` 函数
- [ ] 页面切换时重置序号和 `flowContextInjected` 标记
- [ ] 在 `PAGE_ENTER` 后自动注入 `flow_context`

### 16.3 Component.tsx 检查

- [ ] 同步外部 flowContext 到内部 Context
- [ ] 使用 `buildMark` 模式提交
- [ ] 使用 `collectAnswers` 收集答案
- [ ] 使用 `appendExperimentHistory` 追加实验历史（如有）
- [ ] 使用 `buildPageDesc` 构建页面描述
- [ ] 调用 `clearOperations()` 在页面切换前

### 16.4 测试检查

- [ ] mapping 配置验证测试 (`validateMappingConfig`)
- [ ] 提交格式快照测试
- [ ] 答案格式化测试（单选题 value 格式）
- [ ] flow_context 注入测试
