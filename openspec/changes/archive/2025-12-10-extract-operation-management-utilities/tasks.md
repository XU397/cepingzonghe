# 任务清单：提取操作管理 Utility

## 概述
- **变更标识**: extract-operation-management-utilities
- **预估工作量**: 2-3 天
- **依赖**: 无（004-docs-submodule-submission 已完成）

---

## 阶段 1：Utility 实现

### 1.1 创建 operationSequence.ts
- [x] **创建文件** `src/shared/services/submission/submoduleAdapter/operationSequence.ts`
- [x] **实现** `OperationSequence` 接口定义
- [x] **实现** `createOperationSequence()` 函数（无参数，固定从 0 开始）
- [x] **编写单元测试** `operationSequence.test.ts`
  - 测试 `next()` 首次调用返回 1，后续递增
  - 测试 `reset()` 重置后 `next()` 再次返回 1
  - 测试 `current()` 返回当前值不自增

**验收标准**: 单元测试 100% 通过 ✅

### 1.2 创建 flowContextInjector.ts
- [x] **创建文件** `src/shared/services/submission/submoduleAdapter/flowContextInjector.ts`
- [x] **实现** `InjectFlowContextOptions` 接口（含 `allowMissingPageEnter` 测试选项）
- [x] **实现** `MissingPageEnterError` 错误类
- [x] **实现** `injectFlowContext()` 函数
- [x] **实现** `shouldInjectFlowContext()` 检查函数
- [x] **编写单元测试** `flowContextInjector.test.ts`
  - 测试正常路径：插入到 `page_enter` 之后
  - 测试缺失 `page_enter` 时抛出 `MissingPageEnterError`
  - 测试 `allowMissingPageEnter: true` 时插入开头（测试逃生舱）
  - 测试 `shouldInjectFlowContext` 避免重复注入
  - 测试 `flowContext` 为 null/undefined 时 `shouldInjectFlowContext` 返回 false

**验收标准**: 单元测试 100% 通过 ✅

### 1.3 创建 pageStateReset.ts
- [x] **创建文件** `src/shared/services/submission/submoduleAdapter/pageStateReset.ts`
- [x] **实现** `PageStateResetOptions` 接口
- [x] **实现** `createPageStateResetter()` 工厂函数
- [x] **编写单元测试** `pageStateReset.test.ts`
  - 测试序号重置
  - 测试 flowContextInjected 标记重置
  - 测试可选参数控制

**验收标准**: 单元测试 100% 通过 ✅

---

## 阶段 2：重构 useOperationLogger

### 2.1 重构 useOperationLogger.ts
- [x] **引入** 新 utility 到 useOperationLogger
- [x] **重构** 序号管理使用 `createOperationSequence`
- [x] **重构** flow_context 注入使用 `injectFlowContext`
- [x] **重构** `clearOperations` 使用 `createPageStateResetter`
- [x] **确保** 对外 API 不变

**验收标准**: 现有 useOperationLogger 测试全部通过 ✅

### 2.2 更新导出
- [x] **更新** `src/shared/services/submission/submoduleAdapter/index.ts`
  - 导出 `createOperationSequence`
  - 导出 `injectFlowContext`
  - 导出 `shouldInjectFlowContext`
  - 导出 `createPageStateResetter`
  - 导出相关类型

**验收标准**: 导出可用，无编译错误 ✅

---

## 阶段 3：验证与文档

### 3.1 运行现有测试
- [x] **运行** 所有子模块快照测试
  - `npm run test:submission`
- [x] **验证** 8 个子模块快照测试全部通过
- [x] **修复** 任何因重构导致的测试失败（无需修复）

**验收标准**: 所有现有测试通过 ✅

### 3.2 更新规范文档
- [x] **新增** 第10章到 `docs/子模块数据规范1205.md`
  - 10.1 操作管理 Utility 概述
  - 10.2 createOperationSequence 使用指南
  - 10.3 injectFlowContext 使用指南
  - 10.4 子模块接入模式选择
- [x] **更新** 8.3.3 操作管理合规
  - 移除"待架构层修复"标注
  - 添加 utility 使用说明

**验收标准**: 文档审核通过 ✅

### 3.3 示例代码
- [x] **添加** 全托管模式示例到文档
- [x] **添加** 灵活组合模式示例到文档
- [x] **可选** 选择一个子模块演示灵活组合模式集成（useOperationLogger 已作为全托管模式示例）

**验收标准**: 示例代码可运行 ✅

---

## 阶段 4：验收与归档

### 4.1 最终验收
- [x] 所有单元测试通过（13 个新 utility 测试 + 24 个 submission 测试）
- [x] 所有快照测试通过（8 个子模块快照测试）
- [x] 文档完整（第 10 章已添加）
- [ ] 代码审查通过（待审核）

### 4.2 归档变更
- [ ] 运行 `openspec archive extract-operation-management-utilities`
- [ ] 更新变更日志

---

## 依赖关系

```
1.1 operationSequence.ts
        ↓
1.2 flowContextInjector.ts ─────┐
        ↓                       │
1.3 pageStateReset.ts           │
        ↓                       │
2.1 重构 useOperationLogger ←───┘
        ↓
2.2 更新导出
        ↓
3.1 运行测试 ──→ 3.2 更新文档 ──→ 3.3 示例代码
                                        ↓
                                4.1 最终验收
                                        ↓
                                4.2 归档变更
```

## 可并行任务

- 1.1、1.2、1.3 可并行开发
- 3.2 文档更新可与 3.1 测试并行

## 风险项

| 风险 | 影响 | 缓解 |
|------|------|------|
| useOperationLogger 重构影响现有行为 | 高 | 保持 API 不变，增量重构内部实现 |
| 测试覆盖不足 | 中 | 先写测试再实现 |
