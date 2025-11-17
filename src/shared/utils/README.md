# 统一页码映射工具

`pageMapping.ts` 提供统一的页码映射、复合页码解析、边界处理等功能，用于统一各模块的页码映射逻辑，减少重复实现和潜在缺陷。

## 核心功能

### 1. 页码映射

#### `getTargetPageIdFromPageNum(pageNum, mapping): string`

从页码获取页面ID，提供统一的边界处理和默认页策略。

**边界处理策略**：
1. 如果 `pageNum` 无效（`null`/`undefined`/`NaN`/负数），返回默认页
2. 如果 `pageNum` 在映射表中不存在，返回默认页
3. 如果映射表没有定义默认页，返回映射表中的第一个页面ID

**示例**：

```typescript
import { getTargetPageIdFromPageNum, PageMapping } from '@/shared/utils/pageMapping';

const mapping: PageMapping = {
  default: 'notices',  // 默认页（注意事项页）
  '1': 'notices',
  '2': 'intro',
  '3': 'question-1',
};

// 正常查找
getTargetPageIdFromPageNum('2', mapping);  // "intro"

// 越界 - 返回默认页
getTargetPageIdFromPageNum('999', mapping);  // "notices"

// 无效值 - 返回默认页
getTargetPageIdFromPageNum(null, mapping);  // "notices"
```

#### `getPageNumFromPageId(pageId, mapping): string | null`

反向查找，从页面ID获取页码。

```typescript
getPageNumFromPageId('intro', mapping);  // "2"
getPageNumFromPageId('unknown', mapping);  // null
```

#### `isValidPageNum(pageNum, mapping): boolean`

验证页码是否在映射表的有效范围内。

```typescript
isValidPageNum('2', mapping);  // true
isValidPageNum('999', mapping);  // false
```

### 2. 复合页码解析（Flow 支持）

#### `parseCompositePageNum(pageNumStr): CompositePageNum | null`

解析 Flow 中的复合页码，支持两种格式：
- `M<stepIndex>:<subPageNum>` - 如 "M1:5" 表示第1步的第5页
- `<stepIndex>.<subPageNum>` - 如 "1.5" 表示第1步的第5页

**示例**：

```typescript
import { parseCompositePageNum } from '@/shared/utils/pageMapping';

// 格式1：M前缀
parseCompositePageNum('M1:5');  // { stepIndex: 1, subPageNum: 5 }

// 格式2：点号分隔
parseCompositePageNum('2.10');  // { stepIndex: 2, subPageNum: 10 }

// 无效格式
parseCompositePageNum('invalid');  // null
```

#### `buildCompositePageNum(stepIndex, subPageNum, format?): string`

构造复合页码字符串。

```typescript
import { buildCompositePageNum } from '@/shared/utils/pageMapping';

buildCompositePageNum(1, 5);           // "M1:5" (默认格式)
buildCompositePageNum(2, 10, 'dot');   // "2.10"
```

### 3. 工具函数

#### `getTotalPages(mapping): number`

获取映射表中的总页数（排除 default 键）。

```typescript
getTotalPages(mapping);  // 3
```

#### `getAllPageIds(mapping): string[]`

获取映射表中的所有页面ID（按页码顺序，排除 default）。

```typescript
getAllPageIds(mapping);  // ["notices", "intro", "question-1"]
```

#### `getNextPageId(currentPageId, mapping): string | null`

获取下一页的页面ID。

```typescript
getNextPageId('intro', mapping);  // "question-1"
getNextPageId('question-1', mapping);  // null (已是最后一页)
```

#### `getPrevPageId(currentPageId, mapping): string | null`

获取上一页的页面ID。

```typescript
getPrevPageId('question-1', mapping);  // "intro"
getPrevPageId('notices', mapping);  // null (已是第一页)
```

#### `getCurrentStep(pageId, mapping): number`

根据页面ID反查页码，用于导航组件显示当前步骤。

```typescript
getCurrentStep('question-1', mapping);  // 3
getCurrentStep('unknown', mapping);     // 1 (默认回落)
```

## 在子模块中使用

### 1. 定义页码映射表

在子模块的 `mapping.ts` 中定义页码映射表：

```typescript
// src/submodules/g7-experiment/mapping.ts
import { PageMapping } from '@/shared/utils/pageMapping';

export const PAGE_MAPPING: PageMapping = {
  default: 'notices',  // 默认页（当页码无效时使用）
  '1': 'notices',
  '2': 'intro',
  '3': 'question-1',
  // ...
};
```

### 2. 实现 CMI 接口

使用工具函数实现 CMI 子模块接口：

```typescript
import {
  getTargetPageIdFromPageNum,
  getTotalPages,
} from '@/shared/utils/pageMapping';
import { PAGE_MAPPING } from './mapping';

/**
 * CMI: getInitialPage(subPageNum: string): string
 */
export function getInitialPage(subPageNum: string | null | undefined): string {
  return getTargetPageIdFromPageNum(subPageNum, PAGE_MAPPING);
}

/**
 * CMI: getTotalSteps(): number
 */
export function getTotalSteps(): number {
  return getTotalPages(PAGE_MAPPING);
}

/**
 * CMI: getNavigationMode(pageId: string): 'experiment' | 'questionnaire'
 */
export function getNavigationMode(pageId: string): 'experiment' | 'questionnaire' {
  const questionnairePages = ['question-1', 'question-2', 'question-3'];
  return questionnairePages.includes(pageId) ? 'questionnaire' : 'experiment';
}
```

### 3. 在组件中使用

```typescript
import { getInitialPage, getTotalSteps, getNavigationMode } from './mapping';
import { getNextPageId, getCurrentStep } from '@/shared/utils/pageMapping';
import { PAGE_MAPPING } from './mapping';

// 获取初始页面（恢复进度）
const initialPageId = getInitialPage(userContext.pageNum);

// 获取总步数（用于导航组件）
const totalSteps = getTotalSteps();

// 获取导航模式（用于 AssessmentPageFrame）
const navMode = getNavigationMode(currentPageId);

// 获取当前步数（用于 LeftStepperNav）
const currentStep = getCurrentStep(currentPageId, PAGE_MAPPING);

// 获取下一页
const nextPageId = getNextPageId(currentPageId, PAGE_MAPPING);
```

## Flow 集成

在 Flow 编排运行时中使用复合页码：

```typescript
import { parseCompositePageNum, buildCompositePageNum } from '@/shared/utils/pageMapping';

// 1. 解析后端返回的复合页码
const progress = {
  pageNumber: 'M1:5',  // 第1步的第5页
  // ...
};

const parsed = parseCompositePageNum(progress.pageNumber);
// { stepIndex: 1, subPageNum: 5 }

// 2. 根据解析结果定位子模块和页面
const currentStep = flowDefinition.steps[parsed.stepIndex];
const submodule = loadSubmodule(currentStep.moduleId);
const pageId = submodule.getInitialPage(String(parsed.subPageNum));

// 3. 构造复合页码用于提交
const compositePageNum = buildCompositePageNum(stepIndex, subPageNum);
// "M1:5"
```

## 类型定义

### `PageMapping`

页码到页面ID的映射表。

```typescript
type PageMapping = Record<string | number, string> & {
  default?: string;  // 默认页面ID（可选）
};
```

**约定**：
- 页码从 1 开始（与后端协议一致）
- 使用字符串键（如 `'1'`, `'2'`）或数字键（如 `1`, `2`）都可以
- `default` 键用于指定默认页（注意事项页或首页）

### `PageInfo`

页面信息（扩展用途）。

```typescript
interface PageInfo {
  pageId: string;         // 页面ID（内部标识）
  pageNum: number;        // 页码（后端返回的序号）
  pageDesc?: string;      // 页面描述（用于日志和数据提交）
  isDefault?: boolean;    // 是否为默认页（注意事项页）
}
```

### `CompositePageNum`

复合页码解析结果。

```typescript
interface CompositePageNum {
  stepIndex: number;     // Flow步骤索引
  subPageNum: number;    // 子模块内的页码
}
```

## 设计理念

### 1. 统一边界处理

所有模块的边界处理策略一致：
- 无效页码 → 默认页
- 越界页码 → 默认页
- 缺失映射 → 默认页

### 2. 防御性编程

所有函数都进行输入验证，确保在极端情况下也能返回合理的结果。

```typescript
// 即使映射表为空，也能返回后备页面
getTargetPageIdFromPageNum(null, {});  // "default-page"
```

### 3. 最小侵入

子模块只需：
1. 定义页码映射表
2. 使用工具函数实现 CMI 接口

无需修改业务逻辑页面。

### 4. Flow 兼容

支持 Flow 编排运行时的复合页码格式，便于在拼装式测评流程中定位进度。

## 示例参考

完整示例请参考：
- [src/submodules/_example/mapping.ts](../../submodules/_example/mapping.ts)

## 相关文档

- [架构重构文档](../../../docs/需求-交互前端改造方案.md)
- [目录结构建议](../../../docs/交互前端目录结构-新架构.md)
- [CMI 子模块接口规范](../../../openspec/specs/assessment-core/spec.md)
