# 提案：迁移 g8-drone-imaging 到共享操作管理 Utility

## 变更标识
- **change-id**: `migrate-drone-imaging-to-shared-utilities`
- **提案日期**: 2025-12-10
- **状态**: 待审批

## 摘要

将 g8-drone-imaging 子模块的操作采集逻辑迁移到共享 Utility（createOperationSequence / injectFlowContext / createPageStateResetter / useOperationLogger），统一时间戳、flow_context 注入与序号管理，消除自实现带来的不规范风险。

## 背景

- 当前模块自管序号、时间戳与 flow_context 注入，存在以下问题：
  - 时间兜底分散：调用方未传 time 时，会在提交阶段回落到提交时间，导致时间乱序。
  - flow_context 注入位置与值形态易偏离规范（紧跟 page_enter、value 必须 JSON 字符串、moduleName 应为字符串）。
  - 未使用共享的序列重置器，行为与其他子模块不一致。
- 其他子模块已对齐共享 Utility（或已规划对齐），需要统一标准，降低维护成本。

## 范围

### 包含
- g8-drone-imaging 子模块：
  - 操作采集：时间戳兜底、序号管理、flow_context 注入位置与值格式
  - 翻页重置：序列与 flow_context 注入标记重置
  - 相关测试与快照更新

### 不包含
- 业务文案/UI 改动
- 其他子模块的改造

## 验收标准

1. **规范合规**
   - flow_context 紧跟 page_enter，且 value 为 JSON 字符串，包含 flowId、submoduleId、stepIndex，moduleName 为字符串（可兜底）。
   - code 从 1 连续递增，翻页时序列重置。
   - 所有 operation.time 在操作发生时记录（不依赖提交时兜底）。
2. **实现一致性**
   - 使用共享 Utility（useOperationLogger 或 createOperationSequence + injectFlowContext + createPageStateResetter）。
   - 翻页调用 resetter，重置 flow_context 注入标记。
3. **测试通过**
   - g8-drone-imaging submission/快照测试更新并通过。
   - 新增单测覆盖：flow_context 位置、时间兜底、moduleName 兜底、翻页重置。
4. **无功能回归**
   - Flow 模式运行正常，数据提交通过 schema/validateMark 校验。

## 依赖

- 前置：`extract-operation-management-utilities`（已实施，提供共享 Utility）
- 规范：`docs/子模块数据规范1205.md` 第 5.5、7.4、10.5 节

## 风险与缓解

| 风险 | 影响 | 缓解 |
|------|------|------|
| 快照变更较多 | 审核负担 | 分步骤提交，逐模块确认差异 |
| 生命周期打点冲突（page_exit 时机） | 时间戳异常 | 仅在真实离开时记录 exit，回归测试校验顺序 |
| 与 AppContext/Frame 交互 | 行为偏差 | 保留接口契约，渐进迁移，增加单测 |

## 时间估算

- 实现与测试：~1.5 天
- 回归与快照审核：~0.5 天
