# Tasks: 迁移 g8-pv-sand-experiment 至共享操作管理 Utility

## Task 1: 导出 SUBMODULE_MAPPING_CONFIG 聚合对象

**目标**：在 mapping.ts 中导出规范化的配置对象，包含完整 PageConfig 字段，供 collectAnswers 使用

**文件**：`src/submodules/g8-pv-sand-experiment/mapping.ts`

**规范依据**：`docs/子模块数据规范1205.md` §3.1、附录 A

**变更**：
1. 导入 SubmoduleMappingConfig 类型：
   ```typescript
   import type { SubmoduleMappingConfig, PageConfig as SharedPageConfig } from '@shared/services/submission/submoduleAdapter';
   ```

2. 添加 formatAnswerValue 函数（使用 QUESTION_OPTIONS_MAP 处理选项格式化）：
   ```typescript
   /**
    * 格式化答案值
    * - 使用 QUESTION_OPTIONS_MAP 将原始值转换为 "A. 选项文本" 格式
    */
   export function formatAnswerValue(questionId: string, rawValue: unknown): string {
     if (rawValue === null || rawValue === undefined || rawValue === '') {
       return '';
     }
     const value = String(rawValue);
     const options = QUESTION_OPTIONS_MAP[questionId];

     if (!options) {
       return value;
     }

     // 处理原始值映射（如 withPanel -> A. 有板区）
     if (value === 'withPanel') return 'A. 有板区';
     if (value === 'noPanel') return 'B. 无板区';
     if (value === '是') return 'A. 是';
     if (value === '否') return 'B. 否';

     // 处理选项标签（如 A -> A. 有板区）
     if (options[value] && ['A', 'B', 'C', 'D'].includes(value)) {
       return `${value}. ${options[value]}`;
     }

     return value;
   }
   ```

3. 导出 SUBMODULE_MAPPING_CONFIG（包含完整 PageConfig 字段）：
   ```typescript
   export const SUBMODULE_MAPPING_CONFIG: SubmoduleMappingConfig = {
     // 完整 PageConfig 字段，符合规范 §3.1
     PAGE_CONFIGS: PAGE_CONFIGS.map((config) => ({
       pageId: config.pageId,
       subPageNum: config.subPageNum,
       title: PAGE_DESC_MAP[config.pageId] || config.pageId,
       questionKeys: PAGE_QUESTIONS[config.pageId] || [],
       // 以下为规范 §3.1 要求的完整字段
       type: config.type,
       navigationMode: config.navigationMode,
       stepIndex: config.stepIndex,
       pageDesc: config.pageDesc,
     })),
     PAGE_DESC_MAP,
     PAGE_QUESTIONS,
     QUESTION_CODE_MAP,
     QUESTION_TEXT_MAP,
     ANSWER_KEY_TO_QUESTION,
     getSubPageNumByPageId,
     // 可选配置
     QUESTION_OPTIONS_MAP,
     INTERNAL_TO_STANDARD_KEY,
     HISTORY_CODE_BASE,
     getPageConfig,
     formatAnswer: formatAnswerValue,
   };
   ```

**验证**：
- [ ] TypeScript 编译通过
- [ ] SUBMODULE_MAPPING_CONFIG 包含完整 PageConfig 字段（type、navigationMode、stepIndex、pageDesc）
- [ ] formatAnswerValue 正确使用 QUESTION_OPTIONS_MAP

**依赖**：无

---

## Task 2: 重构 Context 引入共享 Utility

**目标**：在 PvSandContext 中引入 createOperationSequence、injectFlowContext、createPageStateResetter

**文件**：`src/submodules/g8-pv-sand-experiment/context/PvSandContext.tsx`

**规范依据**：`docs/子模块数据规范1205.md` §10.5 模式 B（灵活组合）

**变更**：

### 2.1 导入共享 Utility

```typescript
import {
  createOperationSequence,
  injectFlowContext,
  shouldInjectFlowContext,
  createPageStateResetter,
} from '@shared/services/submission/submoduleAdapter';
import { EventTypes } from '@shared/services/submission/eventTypes';
```

### 2.2 创建 sequence 和 resetter

```typescript
// 在 PvSandProvider 中
const sequenceRef = useRef(createOperationSequence());
const [flowContextInjected, setFlowContextInjected] = useState(false);

// 创建页面状态重置器
const pageResetter = useMemo(
  () => createPageStateResetter(sequenceRef.current, setFlowContextInjected),
  []
);
```

### 2.3 修改 logOperation（page_enter 后自动注入 flow_context）

```typescript
const logOperation = useCallback((operation: Operation) => {
  const code = sequenceRef.current.next();
  const operationWithCode = { ...operation, code };

  setOperations((prev) => {
    const newOperations = [...prev, operationWithCode];

    // page_enter 后自动注入 flow_context（唯一注入路径）
    const isPageEnter = operation.eventType === EventTypes.PAGE_ENTER;
    if (isPageEnter && flowContext && shouldInjectFlowContext(newOperations, flowContext)) {
      const injected = injectFlowContext(
        newOperations,
        {
          ...flowContext,
          moduleName: flowContext.moduleName || DISPLAY_NAME,
          pageId: currentPageId,
        },
        sequenceRef.current
      );
      setFlowContextInjected(true);
      return injected;
    }

    return newOperations;
  });
}, [flowContext, currentPageId]);
```

### 2.4 修改 navigateToPage（使用 pageResetter）

```typescript
const navigateToPage = useCallback((pageId: PageId) => {
  // 使用 createPageStateResetter 同时重置序号和注入标记
  pageResetter();
  setOperations([]);
  setCurrentPageId(pageId);
  setPageStartTime(new Date());
}, [pageResetter]);
```

**验证**：
- [ ] logOperation 使用 sequenceRef.current.next() 生成 code
- [ ] page_enter 后自动调用 injectFlowContext
- [ ] navigateToPage 调用 pageResetter 同时重置序号和 flowContextInjected
- [ ] 不存在双路径注入（buildMark 中无注入逻辑）

**依赖**：Task 1

---

## Task 3: 重构 Component.tsx 使用共享 collectAnswers

**目标**：替换自实现的 collectAnswers 逻辑（~100 行）为共享函数调用，移除 buildMark 中的备选注入逻辑

**文件**：`src/submodules/g8-pv-sand-experiment/Component.tsx`

**变更**：

### 3.1 导入共享函数和配置

```typescript
import {
  collectAnswers as collectAnswersFromConfig,
  appendExperimentHistory,
  buildPageDesc as buildSharedPageDesc,
} from '@shared/services/submission/submoduleAdapter';
import { SUBMODULE_MAPPING_CONFIG, INTERNAL_TO_STANDARD_KEY } from './mapping';
```

### 3.2 删除自实现的 collectAnswers 函数（第 255-354 行）

### 3.3 新增简化的 buildAnswerList 函数

```typescript
const buildAnswerList = useCallback(() => {
  // 将内部答案键转换为规范键
  const normalizedAnswers = Object.entries(answers).reduce((acc, [key, value]) => {
    const standardKey = INTERNAL_TO_STANDARD_KEY[key] || key;
    acc[standardKey] = value;
    return acc;
  }, {} as Record<string, any>);

  const collected = collectAnswersFromConfig(
    currentPageId,
    normalizedAnswers,
    SUBMODULE_MAPPING_CONFIG
  ).filter((entry) => entry.value !== '');

  // 实验页面：添加实验历史数据
  if ((currentPageId === 'experiment_task1' || currentPageId === 'experiment_task2')
      && experimentState?.collectedData) {
    return appendExperimentHistory(collected, experimentState.collectedData, {
      targetElement: `P${pageNumber}_实验历史`,
      historyCodeBase: HISTORY_CODE_BASE,
    });
  }

  return collected;
}, [currentPageId, answers, experimentState, pageNumber]);
```

### 3.4 简化 buildMark（移除备选注入逻辑）

```typescript
const buildMark = () => {
  const currentPageDesc = buildPageDesc(currentPageId as PageId);
  const answerList = buildAnswerList();

  // 直接使用 operationsForSubmission，不再手动注入 flow_context
  // flow_context 已在 Context 的 logOperation 中注入
  return {
    pageNumber,
    pageDesc: currentPageDesc,
    operationList: operationsForSubmission,
    answerList,
    beginTime: pageStartTime ? formatTimestamp(pageStartTime) : formatTimestamp(new Date()),
    endTime: formatTimestamp(new Date()),
    imgList: [],
  };
};
```

**验证**：
- [ ] 删除 ~100 行自实现代码（第 255-354 行）
- [ ] 删除 buildMark 中的 flow_context 注入逻辑（第 384-418 行）
- [ ] 删除 forEach code 重设逻辑
- [ ] buildAnswerList 调用共享 collectAnswersFromConfig
- [ ] 快照测试 answerList 格式正确

**依赖**：Task 1, Task 2

---

## Task 4: 同步 mapping.test.ts 使用正确的 pageId 格式

**目标**：修复测试文件中的 pageId 格式不一致问题

**文件**：`src/submodules/g8-pv-sand-experiment/__tests__/mapping.test.ts`

**变更**：
1. 将所有旧格式 pageId 替换为新格式：
   - `page01b-task-cover` → `instructions_cover`
   - `page03-background` → `background_notice`
   - `page04-experiment-design` → `experiment_design`
   - `page05-tutorial` → `tutorial_simulation`
   - `page06-experiment1` → `experiment_task1`
   - `page07-experiment2` → `experiment_task2`
   - `page08-conclusion` → `conclusion_analysis`

2. 更新 PAGE_MAPPING 相关断言

3. 修复 pageNumber 格式断言（统一使用 `X.YY` 格式）

**验证**：
- [ ] 所有测试用例使用正确的 pageId 格式
- [ ] 测试与 mapping.ts 定义一致
- [ ] 测试通过

**依赖**：无（可并行）

---

## Task 5: 添加 validateMappingConfig 测试

**目标**：使用共享验证函数验证 mapping 配置完整性

**文件**：`src/submodules/g8-pv-sand-experiment/__tests__/mapping.test.ts`

**变更**：
1. 导入 validateMappingConfig 和 SUBMODULE_MAPPING_CONFIG：
   ```typescript
   import { validateMappingConfig } from '@shared/services/submission/submoduleAdapter';
   import { SUBMODULE_MAPPING_CONFIG } from '../mapping';
   ```

2. 添加测试用例：
   ```typescript
   describe('SUBMODULE_MAPPING_CONFIG 验证', () => {
     it('应通过 validateMappingConfig 验证', () => {
       const result = validateMappingConfig(SUBMODULE_MAPPING_CONFIG);
       expect(result.valid).toBe(true);
       expect(result.errors).toHaveLength(0);
     });

     it('应包含完整的 PageConfig 字段', () => {
       SUBMODULE_MAPPING_CONFIG.PAGE_CONFIGS.forEach((config) => {
         expect(config).toHaveProperty('pageId');
         expect(config).toHaveProperty('subPageNum');
         expect(config).toHaveProperty('title');
         expect(config).toHaveProperty('type');
         expect(config).toHaveProperty('navigationMode');
         expect(config).toHaveProperty('stepIndex');
         expect(config).toHaveProperty('pageDesc');
       });
     });
   });
   ```

**验证**：
- [ ] 测试通过
- [ ] CI 中 mapping 验证覆盖

**依赖**：Task 1

---

## Task 6: 更新快照测试

**目标**：更新快照以反映新的实现

**文件**：`src/submodules/g8-pv-sand-experiment/__tests__/submission.snapshot.test.ts`

**变更**：
1. 运行测试，检查快照差异
2. 验证差异符合预期：
   - answerList 格式正确（code、targetElement、value）
   - operationList.code 连续递增
   - flow_context 位置正确（紧跟 page_enter）
3. 更新快照

**验证**：
- [ ] 快照测试通过
- [ ] 快照内容符合规范

**依赖**：Task 2, Task 3

---

## Task 7: 端到端验证

**目标**：在开发环境验证完整流程

**验证清单**：
- [ ] 启动开发服务器，进入 g8-pv-sand-experiment 模块
- [ ] 完成全部页面流程，观察控制台日志
- [ ] 检查提交数据：
  - pageNumber 格式正确（如 `1.03`）
  - operationList.code 从 1 开始连续
  - flow_context 仅出现一次且紧跟 page_enter
  - answerList 格式正确
- [ ] 刷新页面，验证状态恢复正常
- [ ] 验证页面切换时 flowContextInjected 正确重置

**依赖**：Task 1-6 全部完成

---

## 任务依赖图

```
Task 1 (导出 SUBMODULE_MAPPING_CONFIG，完整字段)
    │
    ├── Task 2 (Context 引入共享 Utility)
    │       │
    │       └── Task 3 (Component 使用共享 collectAnswers)
    │               │
    │               └── Task 6 (更新快照)
    │
    └── Task 5 (validateMappingConfig 测试)

Task 4 (同步 mapping.test.ts) ──────────────────┐
                                                │
                                                ▼
                                          Task 7 (E2E 验证)
```

## 验收标准

1. `npm run test` 全部通过
2. `npm run lint` 无错误
3. 快照内容符合 `docs/子模块数据规范1205.md` 要求
4. Component.tsx 删除 ~100 行自实现代码
5. buildMark 中无 flow_context 注入逻辑（唯一路径在 logOperation）
6. 页面切换时使用 createPageStateResetter 同时重置序号和 flowContextInjected
7. SUBMODULE_MAPPING_CONFIG.PAGE_CONFIGS 包含完整字段
8. 代码审查确认与 g8-mikania-experiment 实现一致
