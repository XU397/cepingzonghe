# 提案：提取操作管理 Utility

## 变更标识
- **change-id**: `extract-operation-management-utilities`
- **提案日期**: 2025-12-09
- **状态**: 已实施

## 背景与动机

### 问题陈述

在 004-docs-submodule-submission 变更实施过程中，QA 和 DEV 团队识别出以下问题：

1. **序号管理分散实现**：各子模块自行管理 `operationSequence`，导致 SET_PAGE 未重置序号等 bug
2. **flow_context 注入时机不一致**：各子模块自己决定何时注入，导致格式和时机不统一
3. **规范要求被分散实现**：这些不是"业务差异"问题，而是规范要求没有统一入口

### 核心洞察

DEV 提出关键区分：

```
"操作采集"
    ├── 采集什么（targetElement、eventType、value）→ 业务差异，子模块决定
    └── 怎么管理（序号递增、flow_context注入、重置时机）→ 规范要求，必须统一
```

### 已修复的 Bug（证明需求真实存在）

| Bug | 根因 | 性质 |
|-----|------|------|
| SET_PAGE 未重置 operationSequence | 每个子模块自己管序号 | 规范问题 |
| flow_context 注入时机不一致 | 每个子模块自己决定何时注入 | 规范问题 |

## 目标

1. 提取**序号管理**和**flow_context 注入**为共享 utility
2. 提供两种接入模式：全托管 Hook 和灵活组合 utility
3. 确保规范要求的一致实现，同时保持业务灵活性
4. 不强制迁移，支持增量接入

## 非目标

- 不重写现有子模块的操作采集逻辑
- 不改变"采集什么"的业务决策权
- 不强制所有子模块使用完整的 useOperationLogger

## 解决方案概述

### 新增 Utility 函数

```typescript
// 1. 序号管理器
export function createOperationSequence(): OperationSequence

// 2. flow_context 注入器
export function injectFlowContext(
  operations: Operation[],
  flowContext: FlowContext,
  sequence: OperationSequence
): Operation[]

// 3. 页面切换重置器
export function resetPageState(sequence: OperationSequence): void
```

### 子模块接入模式

| 模式 | 适用场景 | 特点 |
|------|----------|------|
| **A. 全托管** | 新模块 | 使用 `useOperationLogger`，零配置 |
| **B. 灵活组合** | 老模块迁移 | 使用 utility 函数，保持现有结构 |

## 影响范围

### 新增文件
- `src/shared/services/submission/submoduleAdapter/operationSequence.ts`
- `src/shared/services/submission/submoduleAdapter/flowContextInjector.ts`

### 修改文件
- `src/shared/services/submission/submoduleAdapter/index.ts`（导出新 utility）
- `src/shared/services/submission/submoduleAdapter/useOperationLogger.ts`（使用新 utility）

### 文档更新
- `docs/子模块数据规范1205.md`（新增第10章）

## 风险与缓解

| 风险 | 缓解措施 |
|------|----------|
| 老模块迁移成本 | 提供灵活组合模式，支持渐进迁移 |
| 破坏现有行为 | utility 设计为纯函数，不影响现有实现 |
| 学习成本 | 完善文档和示例代码 |

## 验收标准

1. [x] `createOperationSequence` 通过单元测试（3 个测试）
2. [x] `injectFlowContext` 通过单元测试（6 个测试）
3. [x] `useOperationLogger` 内部使用新 utility
4. [x] 现有快照测试全部通过（8 个子模块快照测试）
5. [x] 文档更新完成（第10章）
6. [x] 至少一个子模块演示灵活组合模式（文档中提供示例）

## 关联变更

- **前置**：004-docs-submodule-submission（短期债务清理，已完成）
- **后续**：可选的子模块迁移工作
