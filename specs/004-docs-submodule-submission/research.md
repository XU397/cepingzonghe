# Research: 子模块数据提交标准化

**Feature**: 004-docs-submodule-submission
**Date**: 2025-12-04
**Status**: Complete

## Overview

本 research 基于 PO 终审通过的分析文档 `docs/submodule-submission-analysis-report.md` v2.1.1，无需额外研究。文档已详细分析了 4 个子模块的现状差异和解决方案。

## Research Findings

### 1. 现有共享工具分析

**Decision**: 扩展现有 `@shared/services/submission/` 模块，新增 `submoduleAdapter` 子目录

**Rationale**:
- 现有 `usePageSubmission.js` 提供了基础提交流程
- 现有 `pageDescUtils.js` 提供了部分页面元数据工具
- 现有 `eventTypes.js` 定义了事件类型枚举
- 新适配器需要在此基础上扩展，保持代码组织一致性

**Alternatives considered**:
- 创建全新 `@shared/submoduleAdapter/` 目录：拒绝，因为功能与 submission 紧密相关
- 直接修改 `usePageSubmission.js`：拒绝，避免破坏现有模块的集成

### 2. encodeCompositePageNum 实现

**Decision**: 使用现有 `@shared/utils/pageMapping.js` 中的 `encodeCompositePageNum` 函数

**Rationale**:
- 函数已存在并被部分模块使用
- 格式 `<submoduleIndex>.<pageIndexTwoDigits>` 已定义
- 无需重新实现

**Code Reference**: `src/shared/utils/pageMapping.js`
```javascript
export function encodeCompositePageNum(stepIndex, subPageNum) {
  return `${stepIndex}.${String(subPageNum).padStart(2, '0')}`;
}
```

### 3. RESERVED_ELEMENTS 列表

**Decision**: 基于分析文档定义的保留项列表

**Final List**:
```typescript
export const RESERVED_ELEMENTS = new Set([
  'page',           // page_enter, page_exit 的目标
  'next_button',    // 导航按钮
  'prev_button',    // 返回按钮（如有）
  'module',         // 模块级事件
  'flow_context',   // Flow 上下文信息（自动注入）
  'task_timer',     // 任务计时器
  'countdown',      // 倒计时
]);
```

**Rationale**:
- 这些是系统级事件的标准 targetElement，不属于业务数据元素
- 在校验时豁免 `P${pageNumber}_` 前缀检查

**Alternatives considered**:
- 动态从代码中提取：拒绝，需要静态可预测的列表
- 空列表（强制所有元素前缀）：拒绝，会破坏现有系统级事件追踪

### 4. HISTORY_CODE_BASE 策略

**Decision**: 使用 100 作为实验历史的 code 基数（默认值），code **固定为** `historyCodeBase`，不使用 index 递增

**Rationale**:
- 常规题目 code 范围 1-99 足够覆盖单页问题
- 实验历史使用固定 code（如 100），由调用方通过 `historyCodeBase` 传入
- `appendExperimentHistory` 是**单条追加**，targetElement 由调用方传入（如 `P1.05_实验历史`）
- 简单易记，便于调试

**Alternatives considered**:
- 使用 base + index 递增：拒绝，需求要求单条追加、code 固定
- 使用 1000：过大，增加调试复杂度
- 负数 code：可能影响后端排序逻辑

### 5. 时间格式统一

**Decision**: 统一使用 `formatTimestamp` 函数，输出 `YYYY-MM-DD HH:mm:ss` 格式

**Rationale**:
- 现有 `@shared/services/dataLogger.js` 已提供 `formatTimestamp` 函数
- 后端期望此格式
- 避免 ISO 8601 与自定义格式混用

**Code Reference**: `src/shared/services/dataLogger.js`
```javascript
export function formatTimestamp(date) {
  const pad = (n) => n.toString().padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}
```

### 6. flow_context 注入时机

**Decision**: 在首次 `page_enter` 事件后强制注入

**Rationale**:
- 确保每页都有 flow_context
- code = 2（紧随 page_enter 的 code = 1）
- 不依赖任何条件检查

**Implementation**:
```typescript
// useOperationLogger.ts
if (op.eventType === EventTypes.PAGE_ENTER && flowContext && !flowContextInjected.current) {
  codeRef.current += 1;
  setOperations(prev => [...prev, {
    code: codeRef.current,  // = 2
    targetElement: 'flow_context',
    eventType: EventTypes.FLOW_CONTEXT,
    value: JSON.stringify(flowContext),
    time: formatTimestamp(new Date()),
  }]);
  flowContextInjected.current = true;
}
```

### 7. 切页重置策略

**Decision**: `navigateToPage` 时必须调用 `clearOperations()`

**Rationale**:
- 确保每页 code 从 1 开始
- 避免跨页累积导致 code 跳号
- 重置 `flowContextInjected` 以便新页面重新注入

**Implementation Guidance**:
```typescript
const handleNext = async () => {
  await submitMark();       // 先提交当前页
  clearOperations();        // 重置 code 和 operations
  navigateToPage(nextId);   // 再导航
};
```

### 8. 快照测试策略

**Decision**: 每个子模块选取 2-3 个典型页面进行快照测试

**Test Pages**:
| 子模块 | 测试页面 | 覆盖场景 |
|--------|---------|---------|
| g8-pv-sand | experiment_design, experiment_task1 | 设计题、实验页 |
| g8-mikania | page_02_step_q1, page_03_sim_exp | 问答页、实验页 |
| g8-drone | hypothesis, experiment_free, conclusion | 文本题、实验、多题 |
| g7 | Page_03_Dialogue_Question, Page_14_Simulation | 对话、模拟 |

**Validation Rules**:
```typescript
const SNAPSHOT_VALIDATION_RULES = {
  pageNumber: /^[1-9]\d*\.\d{2}$/,
  targetElementPrefix: /^P\d+\.\d{2}_/,
  timeFormat: /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/,
  requiredEvents: ['page_enter', 'page_exit'],
  flowContextRequired: true,
  codeStartsFromOne: true,
};
```

## Conclusion

所有技术决策已明确，无需额外 NEEDS CLARIFICATION 项。可进入 Phase 1 设计阶段。

## References

- `docs/submodule-submission-analysis-report.md` v2.1.1 - PO 终审通过的分析文档
- `docs/submodule-submission-guidelines.md` - 子模块数据提交流程与规范
- `src/shared/services/submission/` - 现有提交服务模块
- `src/shared/utils/pageMapping.js` - 页面编号工具函数
