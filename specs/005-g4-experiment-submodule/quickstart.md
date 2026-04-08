# Quickstart: 4年级火车购票-交互子模块 (g4-experiment)

**Date**: 2025-12-17
**Feature**: [spec.md](./spec.md) | [plan.md](./plan.md)

## Prerequisites

- Node.js 18+
- 项目依赖已安装 (`npm install`)
- 了解 Flow CMI 规范 (`openspec/specs/flow/spec.md`)

## 快速开始

### 1. 创建子模块目录结构

```bash
mkdir -p src/submodules/g4-experiment/{pages,components,hooks,constants,context,utils,assets/images,styles}
```

### 2. 创建入口文件

```javascript
// src/submodules/g4-experiment/index.jsx
import { G4ExperimentComponent } from './Component';
import {
  getInitialPage,
  getTotalSteps,
  getNavigationMode,
  getDefaultTimers,
  getPageNumByPageId,
} from './mapping';

export const G4ExperimentSubmodule = {
  submoduleId: 'g4-experiment',
  displayName: '4年级火车购票-交互',
  version: '1.0.0',
  Component: G4ExperimentComponent,
  getInitialPage,
  getTotalSteps,
  getNavigationMode,
  getDefaultTimers,
  resolvePageNum: getPageNumByPageId,
};

export default G4ExperimentSubmodule;
```

### 3. 创建页码映射

```typescript
// src/submodules/g4-experiment/mapping.ts
const PAGE_CONFIG = {
  1:  { pageId: 'notices', mode: 'hidden' },
  2:  { pageId: 'scenario-intro', mode: 'experiment' },
  3:  { pageId: 'problem-identification', mode: 'experiment' },
  4:  { pageId: 'factor-analysis', mode: 'experiment' },
  5:  { pageId: 'route-analysis', mode: 'experiment' },
  6:  { pageId: 'station-recommendation', mode: 'experiment' },
  7:  { pageId: 'timeline-planning-tutorial', mode: 'experiment' },
  8:  { pageId: 'user-solution-design', mode: 'experiment' },
  9:  { pageId: 'plan-optimization', mode: 'experiment' },
  10: { pageId: 'ticket-filter', mode: 'experiment' },
  11: { pageId: 'ticket-pricing', mode: 'experiment' },
  12: { pageId: 'task-completion', mode: 'experiment' },
};

const MIN_PAGE = 1;
const MAX_PAGE = 12;
const DEFAULT_PAGE_ID = 'notices';
const EXPERIMENT_DURATION = 2400; // 40分钟

export function getInitialPage(subPageNum: string): string {
  const parsed = parseInt(subPageNum, 10);
  if (Number.isNaN(parsed) || parsed < MIN_PAGE || parsed > MAX_PAGE) {
    return DEFAULT_PAGE_ID;
  }
  return PAGE_CONFIG[parsed]?.pageId || DEFAULT_PAGE_ID;
}

export function getTotalSteps(): number {
  // 不含 hidden 模式的 notices 页
  return 11;
}

export function getNavigationMode(pageId: string): 'hidden' | 'experiment' {
  const entry = Object.values(PAGE_CONFIG).find(c => c.pageId === pageId);
  return entry?.mode || 'experiment';
}

export function getDefaultTimers(): { task: number } {
  return { task: EXPERIMENT_DURATION };
}

export function getPageNumByPageId(pageId: string | null | undefined): string | null {
  if (!pageId) return String(MIN_PAGE);
  const entry = Object.entries(PAGE_CONFIG).find(([, c]) => c.pageId === pageId);
  return entry ? entry[0] : String(MIN_PAGE);
}
```

### 4. 添加 CSS 变量

在 `src/styles/global.css` 中添加：

```css
/* G4 Experiment Module */
:root {
  --g4-bubble-blue: #dbeafe;
  --g4-bubble-orange: #fdba74;
  --g4-task-blue: #2563EB;
  --g4-task-orange: #EA580C;
  --g4-task-gray: #6B7280;
  --g4-task-green: #15803D;
  --g4-task-pink: #DB2777;
  --g4-phone-border: #1f2937;
  --g4-chat-bg: #f8fafc;
}
```

### 5. 注册子模块

在 `src/submodules/registry.ts` 中添加：

```typescript
import { G4ExperimentSubmodule } from './g4-experiment';

export const SUBMODULE_REGISTRY = {
  // ... existing submodules
  'g4-experiment': G4ExperimentSubmodule,
};
```

### 6. 创建主组件

```jsx
// src/submodules/g4-experiment/Component.jsx
import React, { useMemo } from 'react';
import { G4Provider } from './context/G4Context';
import { PageRouter } from './PageRouter';

export function G4ExperimentComponent({ userContext, initialPageId, options }) {
  const flowContext = options?.flowContext;

  return (
    <G4Provider
      initialPageId={initialPageId}
      userContext={userContext}
      flowContext={flowContext}
    >
      <PageRouter />
    </G4Provider>
  );
}
```

### 7. 创建 Context

```jsx
// src/submodules/g4-experiment/context/G4Context.jsx
import React, { createContext, useContext, useReducer, useCallback } from 'react';

const G4Context = createContext(null);

const initialState = {
  currentPageId: 'notices',
  operations: [],
  answers: [],
  pageBeginTime: null,
  // ... 其他状态
};

function g4Reducer(state, action) {
  switch (action.type) {
    case 'NAVIGATE':
      return { ...state, currentPageId: action.pageId };
    case 'LOG_OPERATION':
      return { ...state, operations: [...state.operations, action.operation] };
    case 'COLLECT_ANSWER':
      return { ...state, answers: [...state.answers, action.answer] };
    case 'CLEAR_OPERATIONS':
      return { ...state, operations: [], answers: [] };
    // ... 其他 actions
    default:
      return state;
  }
}

export function G4Provider({ children, initialPageId, userContext, flowContext }) {
  const [state, dispatch] = useReducer(g4Reducer, {
    ...initialState,
    currentPageId: initialPageId,
  });

  const logOperation = useCallback((op) => {
    dispatch({
      type: 'LOG_OPERATION',
      operation: { ...op, code: state.operations.length + 1 },
    });
  }, [state.operations.length]);

  // ... 其他 actions

  return (
    <G4Context.Provider value={{ state, dispatch, logOperation, userContext, flowContext }}>
      {children}
    </G4Context.Provider>
  );
}

export function useG4Context() {
  const context = useContext(G4Context);
  if (!context) {
    throw new Error('useG4Context must be used within G4Provider');
  }
  return context;
}
```

## 开发工作流

### 1. 开发单个页面

```bash
# 创建页面文件
touch src/submodules/g4-experiment/pages/Page03_ProblemId.jsx

# 创建页面样式
touch src/submodules/g4-experiment/pages/Page03_ProblemId.module.css
```

### 2. 页面模板

```jsx
// src/submodules/g4-experiment/pages/Page03_ProblemId.jsx
import React, { useEffect } from 'react';
import { useG4Context } from '../context/G4Context';
import { EventTypes } from '@/shared/services/submission/eventTypes';
import styles from './Page03_ProblemId.module.css';

export function Page03_ProblemId() {
  const { logOperation, state } = useG4Context();

  // 页面进入事件
  useEffect(() => {
    logOperation({
      targetElement: '页面',
      eventType: EventTypes.PAGE_ENTER,
      value: 'Page_03_问题识别',
      time: new Date().toISOString(),
    });

    return () => {
      logOperation({
        targetElement: '页面',
        eventType: EventTypes.PAGE_EXIT,
        value: 'Page_03_问题识别',
        time: new Date().toISOString(),
      });
    };
  }, []);

  return (
    <div className={styles.container}>
      {/* 页面内容 */}
    </div>
  );
}
```

### 3. 运行开发服务器

```bash
npm run dev
```

### 4. 测试子模块

```bash
# 单元测试
npm test -- --filter g4-experiment

# E2E 测试
npm run test:e2e -- --grep g4
```

## 关键代码参考

| 功能 | 参考文件 |
|------|----------|
| CMI 接口实现 | `src/submodules/g7-tracking-experiment/index.jsx` |
| 页码映射 | `src/submodules/g7-tracking-experiment/mapping.ts` |
| Context 模式 | `src/modules/grade-7-tracking/context/TrackingContext.jsx` |
| 事件类型 | `src/shared/services/submission/eventTypes.js` |
| 数据提交 | `src/shared/hooks/usePageSubmission.js` |

## Checklist

- [ ] 创建子模块目录结构
- [ ] 实现 CMI 接口（index.jsx, mapping.ts）
- [ ] 添加 CSS 变量到 global.css
- [ ] 注册到 submodules/registry.ts
- [ ] 创建 G4Context 和 Provider
- [ ] 实现 12 个页面组件
- [ ] 实现核心组件（PhoneSimulator, MapInteractive, TaskBlockDnd, VirtualKeyboard）
- [ ] 添加单元测试
- [ ] 添加 E2E 测试
- [ ] 验证 Flow 模式集成
