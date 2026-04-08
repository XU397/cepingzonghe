# Proposal: fix-submodule-flow-context-compliance

## 摘要

对四个子模块进行 `flow_context` 合规性清理，确保：
1. `flow_context` 事件紧跟 `page_enter` 事件之后（规范要求）
2. `flow_context.value` 统一为 JSON 字符串格式（规范要求）
3. `flow_context.value` 补齐 `moduleName` 字段（推荐，非强制）
4. 操作序号 `code` 连续从 1 开始

## 与现行规范的关系

**本提案定位**：合规清理（实现层修复），**不变更现行规范**

| 规范要求 | 现行规范 | 本提案 |
|----------|----------|--------|
| moduleName | 可选（推荐填写，兼容旧代码） | 保持可选，推荐补齐 |
| value 格式 | JSON 字符串 | 修复为 JSON 字符串 |
| 位置 | 紧跟 page_enter | 修复位置 |
| 缺失 page_enter | utility 抛错 / 手动实现可 fallback | 按模块选择 |

> 参考：`docs/子模块数据规范1205.md` 第 5.5 节、第 10 章

## 背景

`extract-operation-management-utilities` 变更已定义操作管理 Utility 的规范要求。四个现有子模块需要适配：

| 子模块 | 主要问题 | 改动量 |
|--------|----------|--------|
| g8-drone-imaging | 已基本合规 | 验证后标注 |
| g8-mikania-experiment | 推荐补齐 moduleName | 小 |
| g8-pv-sand-experiment | 位置不正确，推荐补齐 moduleName | 中 |
| g7-experiment (adapter) | value 是对象非字符串，位置不正确 | 中 |

## 依赖

- **前置变更**：`extract-operation-management-utilities`（提供 utility 实现）
- **基线规范**：
  - `docs/子模块数据规范1205.md:252`：flow_context 紧跟 page_enter
  - `docs/子模块数据规范1205.md:374`：moduleName 可选（推荐填写）

## 范围

### 包含
- g8-drone-imaging：验证合规状态，运行测试确认
- g8-mikania-experiment：推荐补齐 moduleName
- g8-pv-sand-experiment：修正注入位置，推荐补齐 moduleName
- g7-experiment (adapter.ts)：修正 value 格式和注入位置

### 不包含
- 规范变更（moduleName 保持可选）
- 新 utility 的实现（由 extract-operation-management-utilities 负责）
- 全托管模式迁移（后续优化）

## 验收标准

1. **规范合规**
   - [x] 所有 flow_context.value 为 JSON 字符串（`JSON.stringify()`）
   - [x] flow_context 紧跟 page_enter 事件
   - [x] code 从 1 连续递增
   - [x] 推荐：flow_context.value 包含 moduleName

2. **测试通过**
   - [x] 各子模块的 submission snapshot 测试更新并通过
   - [x] g8-drone-imaging 现有测试通过（验证合规）

3. **无功能回归**
   - [x] 各子模块在 Flow 模式下正常运行
   - [x] 数据提交格式被后端正确解析

## 风险与缓解

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| 快照测试大量更新 | 审核负担 | 分模块提交，逐个审核 |
| 后端兼容性 | 数据解析失败 | value 格式变更符合已有规范 |

## 时间估计

- g8-drone-imaging：0.5h（验证）
- g8-mikania-experiment：1h
- g8-pv-sand-experiment：2h
- g7-experiment (adapter)：2h
- 测试更新：2h
- **总计**：约 7.5h

## 相关文档

- `openspec/changes/extract-operation-management-utilities/` - 前置变更
- `docs/子模块数据规范1205.md` - 子模块数据规范文档（权威规范）
