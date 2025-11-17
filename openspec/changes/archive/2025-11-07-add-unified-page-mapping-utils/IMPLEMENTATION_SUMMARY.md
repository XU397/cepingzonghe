# 实施摘要：统一页码映射工具

## 变更概述

实施了统一的页码映射工具 (`shared/utils/pageMapping.ts`)，为各模块提供一致的页码到页面ID的映射、复合页码解析、边界处理等功能。

## 已完成的工作

### 1. 核心工具实现

**文件**：[src/shared/utils/pageMapping.ts](../../../src/shared/utils/pageMapping.ts)

**实现内容**：

#### 类型定义
- `PageInfo`: 页面信息接口
- `PageMapping`: 页码映射表类型（支持 `default` 键指定默认页）
- `CompositePageNum`: 复合页码解析结果

#### 核心函数
1. **`parseCompositePageNum(pageNumStr)`**
   - 支持两种复合页码格式：
     - `M<stepIndex>:<subPageNum>` (如 "M1:5")
     - `<stepIndex>.<subPageNum>` (如 "1.5")
   - 返回 `{ stepIndex, subPageNum }` 或 `null`

2. **`getTargetPageIdFromPageNum(pageNum, mapping)`**
   - 从页码获取页面ID
   - 统一的边界处理策略：
     - 无效页码（null/undefined/NaN/负数）→ 返回默认页
     - 越界页码 → 返回默认页
     - 未定义默认页 → 返回第一个页面ID
   - 防御性编程，极端情况下返回 `'default-page'`

3. **辅助工具函数**
   - `buildCompositePageNum`: 构造复合页码字符串
   - `getPageNumFromPageId`: 反向查找页码
   - `isValidPageNum`: 验证页码有效性
   - `getTotalPages`: 获取总页数
   - `getAllPageIds`: 获取所有页面ID（排序）
   - `getNextPageId` / `getPrevPageId`: 获取相邻页面

### 2. 示例文件

**文件**：[src/submodules/_example/mapping.ts](../../../src/submodules/_example/mapping.ts)

**内容**：
- 完整的页码映射表定义示例
- CMI 接口实现示例（`getInitialPage`, `getTotalSteps`, `getNavigationMode`）
- Flow 集成使用示例
- 注释详细，可作为模板直接复制使用

### 3. 文档

**文件**：[src/shared/utils/README.md](../../../src/shared/utils/README.md)

**内容**：
- 所有 API 的详细说明和示例
- 边界处理策略说明
- 在子模块中使用的完整流程
- Flow 集成方法
- 类型定义说明
- 设计理念阐述

## 技术亮点

### 1. 统一边界处理
所有模块的边界处理策略一致，减少各模块各自实现的差异与潜在缺陷。

### 2. 防御性编程
所有函数都进行输入验证，确保在极端情况下也能返回合理的结果。

```typescript
// 即使映射表为空，也能返回后备页面
getTargetPageIdFromPageNum(null, {});  // "default-page"
```

### 3. Flow 兼容
支持 Flow 编排运行时的复合页码格式（两种），便于在拼装式测评流程中定位进度。

### 4. 最小侵入
子模块只需：
1. 定义页码映射表
2. 使用工具函数实现 CMI 接口

无需修改业务逻辑页面。

### 5. 类型安全
提供完整的 TypeScript 类型定义，支持编译时类型检查。

## 使用示例

### 定义映射表

```typescript
import { PageMapping } from '@/shared/utils/pageMapping';

export const PAGE_MAPPING: PageMapping = {
  default: 'notices',
  '1': 'notices',
  '2': 'intro',
  '3': 'question-1',
  // ...
};
```

### 实现 CMI 接口

```typescript
import { getTargetPageIdFromPageNum, getTotalPages } from '@/shared/utils/pageMapping';

export function getInitialPage(subPageNum: string | null | undefined): string {
  return getTargetPageIdFromPageNum(subPageNum, PAGE_MAPPING);
}

export function getTotalSteps(): number {
  return getTotalPages(PAGE_MAPPING);
}
```

### Flow 集成

```typescript
import { parseCompositePageNum } from '@/shared/utils/pageMapping';

const parsed = parseCompositePageNum('M1:5');
// { stepIndex: 1, subPageNum: 5 }
```

## 验收标准达成情况

- ✅ **统一映射逻辑**：所有模块可通过 `getTargetPageIdFromPageNum` 实现一致的页码到页面ID的转换
- ✅ **复合页码支持**：支持 Flow 编排运行时的两种复合页码格式
- ✅ **边界处理一致**：无效/越界页码统一返回默认页
- ✅ **类型安全**：提供完整的 TypeScript 类型定义
- ✅ **易于使用**：子模块只需定义映射表，复用工具函数即可
- ✅ **文档完善**：包含详细的使用说明和示例

## 影响范围

### 新增文件
- `src/shared/utils/pageMapping.ts` - 核心工具
- `src/shared/utils/README.md` - 工具文档
- `src/submodules/_example/mapping.ts` - 使用示例

### 无破坏性变更
- 现有模块无需立即迁移
- 可渐进式采用新工具

## 后续建议

### 立即可做
1. **在新的子模块包装器中使用**
   - `g7-experiment`
   - `g7-questionnaire`
   - `g7-tracking-experiment`
   - `g7-tracking-questionnaire`
   - `g4-experiment`

### 可选优化
1. **单元测试**
   - 测试边界处理（null, undefined, NaN, 负数）
   - 测试复合页码解析（各种格式）
   - 测试映射查找（正常、越界、空映射）

2. **工具增强**（如有需要）
   - 添加映射表验证函数（检查页码连续性、重复等）
   - 添加映射表生成器（从配置生成映射表）

3. **文档扩展**
   - 在 CLAUDE.md 中添加使用指引
   - 在架构文档中引用

## 相关文档

- [设计文档](./design.md)
- [提案](./proposal.md)
- [任务清单](./tasks.md)
- [工具文档](../../../src/shared/utils/README.md)
- [使用示例](../../../src/submodules/_example/mapping.ts)

## 注意事项

1. **路径别名**：项目已配置 `@` 别名指向 `src` 目录，可直接使用 `@/shared/utils/pageMapping` 导入
2. **TypeScript**：工具使用 `.ts` 扩展名，确保项目支持 TypeScript
3. **默认页**：建议在所有映射表中显式定义 `default` 键，指定默认页（通常是注意事项页）

## 实施日期

2025-11-07

## 实施人员

Claude Code (via OpenSpec workflow)
