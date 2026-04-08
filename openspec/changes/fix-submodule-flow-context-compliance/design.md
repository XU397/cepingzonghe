# Design: fix-submodule-flow-context-compliance

## 概述

本设计文档记录四个子模块 flow_context 合规清理的技术方案和决策依据。

## 问题分析

### 当前状态对比

| 模块 | value 格式 | moduleName | 位置 | code 连续性 |
|------|-----------|------------|------|-------------|
| g8-drone-imaging | ✅ JSON 字符串 | ✅ 有默认值 | ✅ page_enter 后 | ✅ 连续 |
| g8-mikania-experiment | ✅ JSON 字符串 | ❌ 缺失 | ✅ page_enter 后 | ✅ 连续 |
| g8-pv-sand-experiment | ✅ JSON 字符串 | ❌ 缺失 | ❌ 末尾追加 | ⚠️ 需调整 |
| g7-experiment (adapter) | ❌ 对象 | ❌ 缺失 | ❌ 末尾追加 | ⚠️ 需调整 |

### 规范要求（来源：docs/子模块数据规范1205.md）

```
第 252 行：flow_context - Flow 上下文事件（Flow 模式下必需，紧跟 page_enter）
第 374 行：moduleName?: string;   // 子模块显示名称（推荐填写，为兼容旧代码设为可选）
第 749 行：必须在 page_enter 事件之后注入；若无 page_enter，抛出 MissingPageEnterError
```

## 设计决策

### 决策 1：moduleName 取值策略

**优先级（从高到低）：**

1. `flowContext.moduleName`（若 Flow 层传递了值）
2. 模块内定义的 `DISPLAY_NAME` 常量
3. 空字符串 `''`（允许提交，兼容旧代码）

**实现示例：**

```typescript
const moduleName = flowContext?.moduleName || DISPLAY_NAME || '';
```

**各模块 DISPLAY_NAME 参考值：**

| 模块 | DISPLAY_NAME | 说明 |
|------|--------------|------|
| g8-drone-imaging | `'无人机遥感成像实验'` | 已有 |
| g8-mikania-experiment | `'薇甘菊防治实验'` | 需添加 |
| g8-pv-sand-experiment | `'光伏治沙实验'` | 需添加 |
| g7-experiment | `'蒸馒头实验'` | 需添加 |

**空值处理：** 按现行规范，moduleName 为可选字段，允许为空提交。本提案推荐补齐但不强制。

### 决策 2：注入位置修正策略

**方案**：手动 splice 插入（后续可选迁移到 injectFlowContext utility）

**边界情况处理：**

| 情况 | 处理方式 | 理由 |
|------|----------|------|
| 已有 flow_context | 跳过注入 | 避免重复 |
| 有 page_enter | 插入到 page_enter 之后 | 规范要求 |
| 无 page_enter | 按模块选择：<br>- 使用 utility：抛 MissingPageEnterError<br>- 手动实现：插入开头作为 fallback | 兼容现有行为 |

**实现逻辑：**

```typescript
// 1. 检查是否已有 flow_context
const hasFlowContext = operations.some(
  op => op.eventType === 'flow_context' || op.eventType === EventTypes.FLOW_CONTEXT
);
if (hasFlowContext) {
  return operations; // 跳过，不重复注入
}

// 2. 找到 page_enter 位置
const pageEnterIndex = operations.findIndex(
  op => op.eventType === 'page_enter' || op.eventType === EventTypes.PAGE_ENTER
);

// 3. 插入 flow_context
if (pageEnterIndex !== -1) {
  // 正常路径：插入到 page_enter 之后
  operations.splice(pageEnterIndex + 1, 0, flowContextOp);
} else {
  // Fallback：插入开头（或按规范抛错）
  // 注意：使用 injectFlowContext utility 时会抛 MissingPageEnterError
  operations.unshift(flowContextOp);
}
```

### 决策 3：code 编号策略

**问题**：插入 flow_context 后如何处理 code？

**方案**：**提交前完全重排，确保 code 从 1 连续递增**

**理由：**
- 规范明确要求 code 从 1 连续递增，不允许跳跃或重复
- 插入 flow_context 到 page_enter 之后会打乱原有编号
- 重排发生在 buildMark/normalize 阶段，不影响运行时逻辑
- 统一处理简化实现，避免边界条件

**实现逻辑：**

```typescript
// 提交前统一重排 code
// 时机：在 buildMark 或 normalizeOperationsForSubmission 阶段
operations.forEach((op, idx) => {
  op.code = idx + 1;
});
```

**注意**：
- 重排仅在提交阶段进行，不影响运行时操作记录
- 快照测试需要更新以反映新的 code 序列

### 决策 4：g8-drone-imaging 处理方式

**验证步骤：**

1. 运行现有 snapshot 测试：`npm run test -- g8-drone-imaging`
2. 检查 snapshot 中的 flow_context：
   - [ ] value 为 JSON 字符串
   - [ ] 位置紧跟 page_enter
   - [ ] moduleName 有值（'无人机遥感成像实验' 或 'g8-drone-imaging'）
3. 若测试通过且 snapshot 符合规范，标注为"已合规，无需改动"

**如果发现问题**：纳入本提案修复范围

## 实现参考

### flow_context value 标准格式

```typescript
const flowContextValue = {
  flowId: string,           // Flow 唯一标识
  stepIndex: number,        // 当前步骤索引（从 0 开始）
  submoduleId: string,      // 子模块标识
  moduleName: string,       // 子模块显示名称（推荐填写，可选）
  pageId: string,           // 当前页面 ID（可选）
};

// 提交时
value: JSON.stringify(flowContextValue)
```

### 位置插入逻辑模板

```typescript
function insertFlowContextAfterPageEnter(
  operations: Operation[],
  flowContextOp: Operation,
  options: { allowMissingPageEnter?: boolean } = {}
): Operation[] {
  // 1. 检查是否已有 flow_context
  const hasFlowContext = operations.some(
    op => op.eventType === 'flow_context' || op.eventType === EventTypes.FLOW_CONTEXT
  );
  if (hasFlowContext) {
    return operations; // 跳过
  }

  const result = [...operations];

  // 2. 找到 page_enter 位置
  const pageEnterIndex = result.findIndex(
    op => op.eventType === 'page_enter' || op.eventType === EventTypes.PAGE_ENTER
  );

  // 3. 处理边界情况
  if (pageEnterIndex !== -1) {
    result.splice(pageEnterIndex + 1, 0, flowContextOp);
  } else if (options.allowMissingPageEnter) {
    result.unshift(flowContextOp);
  } else {
    // 严格模式：抛错
    throw new MissingPageEnterError();
  }

  // 4. 重排 code
  result.forEach((op, idx) => {
    op.code = idx + 1;
  });

  return result;
}
```

## 测试策略

### 单元测试覆盖

1. **value 格式验证**
   ```typescript
   expect(typeof flowContextOp.value).toBe('string');
   expect(() => JSON.parse(flowContextOp.value)).not.toThrow();
   ```

2. **位置正确性验证**
   ```typescript
   const pageEnterIndex = operations.findIndex(op => op.eventType === 'page_enter');
   const flowContextIndex = operations.findIndex(op => op.eventType === 'flow_context');
   expect(flowContextIndex).toBe(pageEnterIndex + 1);
   ```

3. **code 连续性验证**
   ```typescript
   operations.forEach((op, idx) => {
     expect(op.code).toBe(idx + 1);
   });
   ```

4. **重复注入防护验证**
   ```typescript
   // 调用两次 insertFlowContext，应只有一个 flow_context
   const withFirst = insertFlowContext(ops, fc);
   const withSecond = insertFlowContext(withFirst, fc);
   const fcCount = withSecond.filter(op => op.eventType === 'flow_context').length;
   expect(fcCount).toBe(1);
   ```

5. **缺失 page_enter 验证**
   ```typescript
   // 严格模式应抛错
   expect(() => insertFlowContext([], fc)).toThrow(MissingPageEnterError);
   // 宽松模式应插入开头
   const result = insertFlowContext([], fc, { allowMissingPageEnter: true });
   expect(result[0].eventType).toBe('flow_context');
   ```

### 快照测试更新

各模块需要更新的快照文件：
- `g8-mikania-experiment/__tests__/submission.snapshot.test.ts`
- `g8-pv-sand-experiment/__tests__/submission.snapshot.test.ts`
- `g8-pv-sand-experiment/__tests__/submission-format.test.ts`
- `modules/grade-7/` 相关测试（如有）

## 风险评估

| 风险 | 概率 | 影响 | 缓解 |
|------|------|------|------|
| 快照大量更新导致审核遗漏 | 中 | 中 | 逐模块审核，diff 检查 |
| 后端解析兼容性 | 低 | 高 | value 格式符合已有规范 |
| code 重排影响现有数据对齐 | 低 | 中 | 仅影响提交时，不影响存储 |

## 后续优化

1. **迁移到共享 Utility**：待 utility 实现稳定后，逐步迁移各模块使用 `injectFlowContext`
2. **Flow 层统一传递 moduleName**：减少模块内硬编码
3. **Schema 校验**：在提交层增加 Zod/JSON Schema 校验
