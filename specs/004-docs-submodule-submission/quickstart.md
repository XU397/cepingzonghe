# Quickstart: 子模块数据提交标准化

**Feature**: 004-docs-submodule-submission
**Date**: 2025-12-04

## TL;DR

为子模块接入统一数据提交适配器，确保 pageNumber、targetElement、flow_context、answerList 格式符合规范。

## 1. 安装依赖

无额外依赖，使用现有 `@shared/services/submission/` 模块。

## 2. 创建子模块映射配置

在子模块目录下创建 `mapping.ts`：

```typescript
// src/submodules/g8-example/mapping.ts
import { createSubmoduleMappingConfig, PageConfig } from '@specs/004-docs-submodule-submission/contracts/submodule-mapping';

const PAGE_CONFIGS: PageConfig[] = [
  { pageId: 'intro', title: '介绍', subPageNum: 1 },
  { pageId: 'experiment_design', title: '实验设计', subPageNum: 2, questionKeys: ['q1', 'q2'] },
  { pageId: 'experiment_task', title: '实验任务', subPageNum: 3, isExperimentPage: true },
];

export const exampleMappingConfig = createSubmoduleMappingConfig({
  PAGE_CONFIGS,
  PAGE_DESC_MAP: {
    intro: '介绍',
    experiment_design: '实验设计',
    experiment_task: '实验任务',
  },
  PAGE_QUESTIONS: {
    experiment_design: ['q1', 'q2'],
  },
  QUESTION_CODE_MAP: {
    q1: 1,
    q2: 2,
  },
  QUESTION_TEXT_MAP: {
    q1: '第一题：请选择实验变量',
    q2: '第二题：请说明实验原理',
  },
  ANSWER_KEY_TO_QUESTION: {
    selectedVariable: 'q1',
    principleText: 'q2',
  },
  QUESTION_OPTIONS_MAP: {
    q1: { A: 'A. 温度', B: 'B. 湿度', C: 'C. 光照' },
  },
  HISTORY_CODE_BASE: 100,  // 实验历史使用的 code 基数
});
```

## 3. 使用 usePageMeta Hook

```typescript
import { usePageMeta } from '@shared/submission/submoduleAdapter';

function ExperimentDesignPage() {
  const { flowContext } = useFlowContext(); // 从 Flow 获取上下文
  const stepIndex = flowContext ? flowContext.stepIndex + 1 : 1;
  const subPageNum = exampleMappingConfig.getSubPageNumByPageId('experiment_design');

  const { pageNumber, targetPrefix } = usePageMeta(stepIndex, subPageNum);
  // pageNumber = "1.02"
  // targetPrefix = "P1.02_"

  return <div>...</div>;
}
```

## 4. 使用 useOperationLogger Hook

**注意**: `useOperationLogger` 接收一个 **options 对象参数**，包含 `pageNumber`、`targetPrefix` 和可选的 `flowContext`。

```typescript
import { useOperationLogger } from '@shared/submission/submoduleAdapter';
import { EventTypes } from '@shared/submission/eventTypes';

function ExperimentDesignPage() {
  const { pageNumber, targetPrefix } = usePageMeta(stepIndex, subPageNum);
  const { flowContext } = useFlowContext();

  // ✅ 正确：传入 options 对象
  const { operations, logOperation, clearOperations } = useOperationLogger({
    pageNumber,
    targetPrefix,
    flowContext,
  });

  // 页面进入时自动记录 page_enter
  // Flow 模式下会自动在 page_enter 后注入 flow_context
  useEffect(() => {
    logOperation({
      targetElement: 'page',  // 保留元素，不加前缀
      eventType: EventTypes.PAGE_ENTER,
      value: 'experiment_design',
    });

    return () => {
      logOperation({
        targetElement: 'page',
        eventType: EventTypes.PAGE_EXIT,
        value: 'experiment_design',
      });
    };
  }, []);

  // 记录用户操作（业务元素自动添加 targetPrefix）
  const handleSelect = (option: string) => {
    logOperation({
      targetElement: '选择题1',  // 自动变为 P1.02_选择题1
      eventType: EventTypes.RADIO_SELECT,
      value: option,
    });
  };

  // 导航时重置
  const handleNext = async () => {
    await submitMark();
    clearOperations();  // 重置 code 为 0，清空 operations，重置 flowContextInjected
    navigateToNext();
  };
}
```

## 5. 使用 buildPageDesc 构建页面描述

```typescript
import { buildPageDesc } from '@shared/submission/submoduleAdapter';

// Flow 模式
const pageDesc = buildPageDesc('实验设计', flowContext);
// 输出: "[flow1/g8-example/0] 实验设计"

// 独立模式（无 flowContext）
const pageDesc = buildPageDesc('实验设计', null);
// 输出: "实验设计"
```

## 6. 收集答案

**注意**: `collectAnswers` **不处理实验历史**，实验历史由 `appendExperimentHistory` 独立处理。

```typescript
import { collectAnswers } from '@shared/submission/submoduleAdapter';

const handleSubmit = () => {
  const rawAnswers = {
    selectedVariable: 'A',
    principleText: '通过控制变量法...',
  };

  const answerList = collectAnswers(
    'experiment_design',
    rawAnswers,
    exampleMappingConfig
  );

  // 结果:
  // [
  //   { code: 1, targetElement: "第一题：请选择实验变量", value: "A. 温度" },
  //   { code: 2, targetElement: "第二题：请说明实验原理", value: "通过控制变量法..." }
  // ]
};
```

## 7. 追加实验历史

**注意**: `appendExperimentHistory` 是**单条追加**，code **固定为** `historyCodeBase`，targetElement **由调用方传入**。

```typescript
import { appendExperimentHistory } from '@shared/submission/submoduleAdapter';

const handleSubmitWithHistory = () => {
  // 先收集普通答案
  let answerList = collectAnswers('experiment_task', rawAnswers, exampleMappingConfig);

  // 追加实验历史（单条）
  answerList = appendExperimentHistory(
    answerList,
    experimentHistoryData,  // 实验历史数据
    {
      targetElement: `P${pageNumber}_实验历史`,  // 由调用方指定
      historyCodeBase: exampleMappingConfig.HISTORY_CODE_BASE || 100,  // 固定 code
    }
  );

  // 结果示例:
  // [
  //   { code: 1, targetElement: "第一题...", value: "..." },
  //   { code: 100, targetElement: "P1.03_实验历史", value: "{...}" }  // code 固定为 100
  // ]
};
```

## 8. 提交前校验

**重要**: 当 `flowContext` 存在时，`validateMarkBeforeSubmit` 会**强制校验** `operationList` 中必须包含 `flow_context` 事件。

```typescript
import { validateMarkBeforeSubmit } from '@shared/submission/submoduleAdapter';

const handleNavigate = async () => {
  const mark: MarkObject = {
    pageNumber,
    pageDesc: buildPageDesc('实验设计', flowContext),
    beginTime: pageStartTime,
    endTime: formatTimestamp(new Date()),
    operationList: operations,
    answerList,
  };

  const result = validateMarkBeforeSubmit(mark, flowContext);

  if (!result.valid) {
    // 常见错误:
    // - INVALID_PAGE_NUMBER: pageNumber 格式不符合 /^[1-9]\d*\.\d{2}$/
    // - MISSING_PREFIX: 业务元素 targetElement 缺少 P 前缀
    // - CODE_NOT_FROM_ONE: operationList.code 不从 1 开始
    // - CODE_DISCONTINUITY: operationList.code 不连续
    // - MISSING_FLOW_CONTEXT: Flow 模式下缺少 flow_context 事件 ⚠️
    console.error('Validation errors:', result.errors);
  }

  await submitPageMarkData({ batchCode, examNo, mark });
};
```

## 9. 完整页面示例

```typescript
import React, { useEffect, useState } from 'react';
import {
  usePageMeta,
  useOperationLogger,
  collectAnswers,
  buildPageDesc,
  appendExperimentHistory,
  validateMarkBeforeSubmit
} from '@shared/submission/submoduleAdapter';
import { EventTypes } from '@shared/submission/eventTypes';
import { formatTimestamp } from '@shared/services/dataLogger';
import { exampleMappingConfig } from './mapping';

export function ExperimentTaskPage({ flowContext, onNavigate }) {
  const stepIndex = flowContext ? flowContext.stepIndex + 1 : 1;
  const subPageNum = exampleMappingConfig.getSubPageNumByPageId('experiment_task');

  // 获取 pageNumber 和 targetPrefix
  const { pageNumber, targetPrefix } = usePageMeta(stepIndex, subPageNum);

  // 使用 options 对象参数
  const { operations, logOperation, clearOperations } = useOperationLogger({
    pageNumber,
    targetPrefix,
    flowContext,
  });

  const [pageStartTime] = useState(() => formatTimestamp(new Date()));
  const [experimentHistory, setExperimentHistory] = useState([]);

  // 页面生命周期
  useEffect(() => {
    logOperation({ targetElement: 'page', eventType: EventTypes.PAGE_ENTER, value: 'experiment_task' });
    return () => {
      logOperation({ targetElement: 'page', eventType: EventTypes.PAGE_EXIT, value: 'experiment_task' });
    };
  }, []);

  // 提交并导航
  const handleNext = async () => {
    // 1. 收集普通答案
    let answerList = collectAnswers('experiment_task', {}, exampleMappingConfig);

    // 2. 追加实验历史（单条，code 固定）
    if (experimentHistory.length > 0) {
      answerList = appendExperimentHistory(
        answerList,
        experimentHistory,
        {
          targetElement: `P${pageNumber}_实验历史`,
          historyCodeBase: exampleMappingConfig.HISTORY_CODE_BASE || 100,
        }
      );
    }

    // 3. 构建 pageDesc（使用 buildPageDesc）
    const mark = {
      pageNumber,
      pageDesc: buildPageDesc('实验任务', flowContext),
      beginTime: pageStartTime,
      endTime: formatTimestamp(new Date()),
      operationList: operations,
      answerList,
    };

    // 4. 校验（Flow 模式下会检查 flow_context 事件）
    const validation = validateMarkBeforeSubmit(mark, flowContext);
    if (!validation.valid) {
      console.warn('Submission validation warnings:', validation.errors);
    }

    // 5. 提交并导航
    await submitPageMarkData({ mark });
    clearOperations();
    onNavigate('next');
  };

  return (
    <div>
      <h1>实验任务</h1>
      {/* 实验界面 */}
      <button onClick={handleNext}>下一步</button>
    </div>
  );
}
```

## 关键规则

| 规则 | 说明 |
|------|------|
| pageNumber 格式 | `<stepIndex>.<subPageNum>` 如 `1.02` |
| useOperationLogger 参数 | **options 对象**: `{ pageNumber, targetPrefix, flowContext }` |
| targetElement 前缀 | 业务元素用 `targetPrefix`（如 `P1.02_`），保留元素豁免 |
| code 递增 | 每页从 1 开始，`clearOperations()` 重置 |
| flow_context | Flow 模式下 page_enter 后**自动注入** |
| flow_context 校验 | Flow 模式下 `validateMarkBeforeSubmit` **强制检查** |
| pageDesc | 使用 `buildPageDesc` 生成，Flow 模式含前缀 |
| 实验历史 | 使用 `appendExperimentHistory` **单条追加**，code **固定** |
| 时间格式 | `YYYY-MM-DD HH:mm:ss` |

## 迁移检查清单

- [ ] 创建 `mapping.ts` 配置文件（含 HISTORY_CODE_BASE）
- [ ] 使用 `usePageMeta` 生成 pageNumber 和 targetPrefix
- [ ] 使用 `useOperationLogger({ pageNumber, targetPrefix, flowContext })` 记录操作
- [ ] 使用 `buildPageDesc` 生成 pageDesc
- [ ] 使用 `collectAnswers` 收集答案（不含实验历史）
- [ ] 使用 `appendExperimentHistory` 追加实验历史（如需要）
- [ ] 导航时调用 `clearOperations()`
- [ ] 添加 `validateMarkBeforeSubmit(mark, flowContext)` 校验
- [ ] 运行快照测试验证格式
