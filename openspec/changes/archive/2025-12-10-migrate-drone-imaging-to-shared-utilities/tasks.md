# 任务清单：迁移 g8-drone-imaging 到共享操作管理 Utility

## 前置
- [x] 确认 `extract-operation-management-utilities` 已可用。

## 阶段 1：接入共享 Utility
- [x] 将 logOperation 替换为 useOperationLogger 全托管，或注入 createOperationSequence + injectFlowContext + createPageStateResetter。
- [x] logOperation 内时间兜底：`time ?? formatTimestamp(new Date())`。
- [x] flow_context 注入使用共享逻辑，moduleName 兜底为字符串。

## 阶段 2：翻页与生命周期
- [x] 切页/clearOperations 调用 resetter，重置序列与 flow_context 标记。
- [x] 确认 page_exit 仅在真实离开时记录（必要时调整 Frame 配置）。

## 阶段 3：提交构建与校验
- [x] 提交前重排 operationList.code（1…n），确保连续。
- [x] 确认 flow_context 紧跟 page_enter；无 page_enter 时行为符合规范/设计。

## 阶段 4：测试与快照
- [x] 新增/更新单测：flow_context 位置、value JSON 字符串、moduleName 兜底、时间兜底、翻页重置、code 连续。
- [x] 更新 submission/快照测试并通过。

## 阶段 5：验收
- [x] 运行 submission 相关测试与 schema/validateMark。
- [x] 手动抽样提交数据：code 连续、time 递增、flow_context 紧跟 page_enter。
