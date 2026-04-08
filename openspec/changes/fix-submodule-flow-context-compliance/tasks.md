# Tasks: fix-submodule-flow-context-compliance

## 前置条件

- [x] 确认 `extract-operation-management-utilities` 变更的 utility 已实现并可用

---

## 阶段 1：g8-drone-imaging（验证合规状态）

### 1.1 运行现有测试
- [x] **执行** `npm run test -- g8-drone-imaging --run`
- [x] **确认**所有测试通过

### 1.2 检查 snapshot 合规性
- [x] **检查** `__tests__/__snapshots__/` 目录下的快照文件
- [x] **验证** flow_context 事件：
  - [x] `value` 为 JSON 字符串（非对象）
  - [x] 位置紧跟 `page_enter` 事件
  - [x] `moduleName` 有值（'g8-drone-imaging'）
- [x] **验证** code 从 1 连续递增

### 1.3 标注合规状态
- [x] 若测试通过且快照符合规范：标注"**已合规，无需改动**"

**验收标准**：测试通过，快照符合规范要求 ✅

---

## 阶段 2：g8-mikania-experiment

### 2.1 添加 DISPLAY_NAME 常量
- [x] **在** `Component.jsx` 顶部添加常量：`const DISPLAY_NAME = '薇甘菊防治实验';`

### 2.2 补齐 LOG_OPERATION 中的 moduleName
- [x] **修改** `Component.jsx` LOG_OPERATION 分支
- [x] **使用** moduleName 取值优先级：`flowCtx?.moduleName || DISPLAY_NAME`

### 2.3 补齐 buildMark 备用注入中的 moduleName
- [x] **同步修改** buildMark 中的备用注入逻辑
- [x] **添加** `moduleName` 字段

### 2.4 更新测试
- [x] **运行** `npm run test -- g8-mikania-experiment --run`
- [x] **更新** `__tests__/submission.snapshot.test.ts` 快照

**验收标准**：
- [x] flow_context.value 包含 moduleName
- [x] code 连续
- [x] 所有测试通过 ✅

---

## 阶段 3：g8-pv-sand-experiment

### 3.1 添加 DISPLAY_NAME 常量
- [x] **在** `Component.tsx` 添加：`const DISPLAY_NAME = '光伏治沙实验';`

### 3.2 修正 flow_context 注入位置
- [x] **修改** `Component.tsx` buildMark 函数
- [x] **实现**位置修正逻辑：在 page_enter 后插入 flow_context
- [x] **添加** moduleName 字段
- [x] **重排** code 保持连续

### 3.3 更新测试
- [x] **运行** `npm run test -- g8-pv-sand-experiment --run`
- [x] **更新** `__tests__/submission.snapshot.test.ts` 快照
- [x] **更新** `__tests__/submission-format.test.ts` fixture（pageNumber 格式、flow_context value 格式）

**验收标准**：
- [x] flow_context 紧跟 PAGE_ENTER
- [x] flow_context.value 包含 moduleName
- [x] code 连续
- [x] 所有测试通过 ✅

---

## 阶段 4：g7-experiment (grade-7 adapter)

### 4.1 添加 DISPLAY_NAME 常量
- [x] **在** `src/modules/grade-7/adapter.ts` 添加：`const DISPLAY_NAME = '蒸馒头实验';`

### 4.2 修正 value 格式
- [x] **修改** `adapter.ts` normalizeOperationsForSubmission 函数
- [x] **将** value 从对象改为 JSON 字符串
- [x] **添加** moduleName 字段

### 4.3 修正注入位置
- [x] **修改**注入逻辑，从 push 末尾改为插入到 page_enter 之后
- [x] **重排** code 保持连续

### 4.4 更新测试
- [x] **运行**相关测试
- [x] **更新**快照文件（submission.snapshot.test.ts）

**验收标准**：
- [x] flow_context.value 为 JSON 字符串
- [x] flow_context.value 包含 moduleName
- [x] flow_context 紧跟 PAGE_ENTER（或在无 page_enter 时插入开头）
- [x] code 从 1 连续
- [x] 所有测试通过 ✅

---

## 阶段 5：集成验证

### 5.1 全量测试
- [x] **运行** submission 相关测试：43 个测试全部通过
- [x] **额外修复**：更新 schema.ts 以允许 flow_context.value 为 JSON 字符串格式

### 5.2 提交格式测试
- [x] **运行** submission snapshot 和 format 测试全部通过

**验收标准**：
- [x] 所有自动化测试通过 ✅
- [x] 无功能回归 ✅

---

## 任务依赖关系

```
extract-operation-management-utilities (前置)
          │
          ▼
        阶段1
     (g8-drone 验证)
          │
    ┌─────┴─────┬─────────────┐
    │           │             │
    ▼           ▼             ▼
  阶段2       阶段3         阶段4
(mikania)   (pv-sand)    (g7-adapter)
    │           │             │
    └─────┬─────┴─────────────┘
          │
          ▼
        阶段5
    (集成验证)
```

- 阶段 1 优先执行（验证基线）
- 阶段 2-4 可并行执行
- 阶段 5 需等待所有模块改动完成
