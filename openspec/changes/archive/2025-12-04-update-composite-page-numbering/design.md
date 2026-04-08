# 复合页码格式变更 - 技术设计

## Context

### 问题背景
现有复合页码使用 `<stepIndex>.<subPageNum>` 格式（如 `0.3`、`1.10`），存在以下问题：

1. **后端解析歧义**：后端对 pageNumber 做 `*100` 转换时，`0.1` 和 `0.10` 都变成 `10`，无法区分
2. **零前缀问题**：`stepIndex` 从 0 开始，导致第一个子模块的页码为 `0.*`，不直观
3. **格式不统一**：历史遗留 `M*:*` 格式仍存在于部分代码和数据中

### 当前实现位置
- 编码函数：`src/shared/utils/pageMapping.ts:encodeCompositePageNum()`
- 提交层调用：`src/shared/services/submission/usePageSubmission.js:pickPageNumber()`
- 现有文档：`docs/submodule-submission-guidelines.md`

## Goals / Non-Goals

### Goals
- 消除 `0.*` 前缀，使 pageNumber 从 `1.01` 开始
- 使用两位零填充消除 `*100` 转换歧义（`1.01` vs `1.10` → `101` vs `110`）
- 统一校验规则，禁止旧格式
- 提供子模块迁移规范文档

### Non-Goals
- 不处理历史数据转换（后端负责）
- 不改变 `stepIndex` 在 Flow Progress 中的语义（仍从 0 开始）

## Decisions

### Decision 1: 新编码规则
```typescript
// 旧格式
encodeCompositePageNum(stepIndex, subPageNum) = `${stepIndex}.${subPageNum}`
// 示例：(0, 3) → "0.3", (1, 10) → "1.10"

// 新格式
encodeCompositePageNum(submoduleIndex, pageIndex) = `${submoduleIndex}.${String(pageIndex).padStart(2, '0')}`
// 其中 submoduleIndex = stepIndex + 1, pageIndex 从 1 开始
// 示例：(1, 3) → "1.03", (2, 10) → "2.10"
```

**理由**：
- `submoduleIndex` 从 1 开始，避免 `0.*` 前缀
- 两位零填充保证 `*100` 转换后唯一：`1.01` → `101`, `1.10` → `110`

### Decision 2: 校验正则
```regex
^[1-9]\d*\.\d{2}$
```

**匹配示例**：
- ✅ `1.01`, `1.10`, `2.03`, `12.99`
- ❌ `0.1`, `1.1`, `M2:10`, `1.001`

### Decision 3: 参数映射与计数基准

**现有计数基准**（通过代码分析确认）：
- `stepIndex`：从 **0** 开始（Flow 步骤索引）
- `modulePageNum`：字符串，从 **'1'** 开始（如 `'1'`, `'3'`, `'10'`）
- `subPageNum`：数字，从 **1** 开始（与 modulePageNum 一致）

**转换规则**：
| 输入参数 | 输出参数 | 转换规则 |
|----------|----------|----------|
| `stepIndex` | `submoduleIndex` | `submoduleIndex = stepIndex + 1` |
| `subPageNum` / `modulePageNum` | `pageIndex` | `pageIndex = subPageNum`（无需 +1，已从 1 开始） |

**示例**：
| 输入 | 转换 | 输出 |
|------|------|------|
| `{ stepIndex: 0, subPageNum: 1 }` | `encodeCompositePageNum(1, 1)` | `"1.01"` |
| `{ stepIndex: 0, subPageNum: 3 }` | `encodeCompositePageNum(1, 3)` | `"1.03"` |
| `{ stepIndex: 1, modulePageNum: '10' }` | `encodeCompositePageNum(2, 10)` | `"2.10"` |

**边界情况**：
- 若子模块内部使用 0-based 索引，需在调用前转换：`pageIndex = internalIndex + 1`
- `modulePageNum` 为字符串时需先 `parseInt(modulePageNum, 10)`

## Risks / Trade-offs

### Risk 1: 子模块适配工作量
- **风险**：现有子模块可能直接使用 `stepIndex` 或 `subPageNum` 构建 pageNumber
- **缓解**：统一由 `usePageSubmission` 处理编码，子模块仅需提供 `pageMeta.subPageNum`

### Risk 2: 测试快照失效
- **风险**：包含 pageNumber 的测试快照全部需要更新
- **缓解**：在任务中明确快照更新步骤，提供正则替换脚本

### Risk 3: 后端兼容期
- **风险**：前后端不同步可能导致数据提交失败
- **缓解**：
  1. 后端先部署兼容层，同时接受新旧格式
  2. 前端完成迁移后，后端移除旧格式支持

## Migration Plan

### Phase 1: 核心工具更新（本提案）
1. 更新 `encodeCompositePageNum` 函数签名和实现
2. 更新 `parseCompositePageNum` 以支持双向转换
3. 添加格式校验正则
4. 更新 `usePageSubmission` 调用逻辑

### Phase 2: 子模块迁移（后续任务）
为每个子模块创建独立迁移任务：
- g8-drone-imaging
- g8-mikania-experiment
- g8-pv-sand-experiment
- g7-tracking-experiment
- g7-tracking-questionnaire
- grade-7-experiment
- grade-7-questionnaire

每个子模块迁移包括：
1. 检查 `pageMeta` 传递是否正确
2. 更新测试快照
3. 验证提交数据格式

### Phase 3: 清理（迁移完成后）
1. 移除旧格式解析兼容代码
2. 更新文档
3. 后端移除旧格式支持

## Rollback Plan

如需回滚：
1. 还原 `encodeCompositePageNum` 实现
2. 还原 `usePageSubmission` 调用
3. 后端保持兼容新旧格式

## Implementation Details

### 核心函数变更

```typescript
// src/shared/utils/pageMapping.ts

/**
 * 编码复合页码（新格式）
 *
 * @param submoduleIndex - 子模块索引（从 1 开始，= stepIndex + 1）
 * @param pageIndex - 页面索引（从 1 开始，两位零填充）
 * @returns 格式化的页码字符串，如 "1.03", "2.10"
 */
export function encodeCompositePageNum(submoduleIndex: number, pageIndex: number): string {
  if (submoduleIndex < 1) {
    console.warn(`[encodeCompositePageNum] submoduleIndex 应从 1 开始，收到: ${submoduleIndex}`);
  }
  if (pageIndex < 1) {
    console.warn(`[encodeCompositePageNum] pageIndex 应从 1 开始，收到: ${pageIndex}`);
  }
  return `${submoduleIndex}.${String(pageIndex).padStart(2, '0')}`;
}

/**
 * 解析复合页码（新格式）
 */
export function parseCompositePageNum(pageNumStr: string): { submoduleIndex: number; pageIndex: number } | null {
  const match = pageNumStr.match(/^([1-9]\d*)\.(\d{2})$/);
  if (!match) {
    return null;
  }
  return {
    submoduleIndex: parseInt(match[1], 10),
    pageIndex: parseInt(match[2], 10),
  };
}

/**
 * 校验页码格式
 */
export function isValidCompositePageNum(pageNumStr: string): boolean {
  return /^[1-9]\d*\.\d{2}$/.test(pageNumStr);
}
```

### 提交层适配

```javascript
// src/shared/services/submission/usePageSubmission.js

const pickPageNumber = (meta, markCandidate) => {
  if (shouldEncodeCompositePageNumber(meta)) {
    try {
      // 新格式：submoduleIndex = stepIndex + 1
      const submoduleIndex = Number(meta.stepIndex) + 1;
      const pageIndex = Number(meta.subPageNum);
      return encodeCompositePageNum(submoduleIndex, pageIndex);
    } catch (error) {
      console.warn('[usePageSubmission] 复合页码编码失败', error);
    }
  }
  // fallback 逻辑保持不变
  // ...
};
```

## Affected Files

### 必须修改
| 文件 | 变更类型 | 说明 |
|------|----------|------|
| `src/shared/utils/pageMapping.ts` | 修改 | 编码/解析/校验函数 |
| `src/shared/services/submission/usePageSubmission.js` | 修改 | 调用逻辑适配 |
| `src/shared/services/submission/schema.ts` | 修改 | 添加格式校验 |
| `docs/submodule-submission-guidelines.md` | 修改 | 更新规范说明 |

### 子模块影响（后续任务）
| 子模块 | 影响范围 |
|--------|----------|
| g8-drone-imaging | 页码快照、Context |
| g8-mikania-experiment | 页码快照、mapping |
| g8-pv-sand-experiment | 页码快照、Context |
| g7-tracking-* | 页码快照、TrackingContext |
| grade-7-* | 页码快照、wrapper |

## Open Questions

1. **后端兼容时间窗口**：后端需要多长时间部署兼容层？
   - 建议：前端迁移前，后端先完成兼容部署

2. **历史数据处理**：已提交的 `0.*` 格式数据是否需要转换？
   - 建议：由后端负责，本提案不涉及
