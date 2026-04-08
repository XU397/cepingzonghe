## MODIFIED Requirements

### Requirement: 子模块接入模式选择
提交工具链 SHALL 支持两种接入模式，子模块可根据场景选择。

#### Scenario: 全托管模式（推荐新模块）
- WHEN 子模块选择全托管模式
- THEN 子模块 SHALL 使用 `useOperationLogger` Hook
- AND Hook SHALL 内部使用 createOperationSequence、injectFlowContext 和 createPageStateResetter
- AND 子模块 MUST NOT 手动管理序号或注入 flow_context

#### Scenario: 灵活组合模式（兼容老模块）
- WHEN 子模块选择灵活组合模式
- THEN 子模块 MAY 直接使用 createOperationSequence、injectFlowContext 和 createPageStateResetter
- AND 子模块 MUST 在页面切换时调用 createPageStateResetter 同时重置序号与 flowContextInjected 标记
- AND 子模块 MUST 在 page_enter 后调用 injectFlowContext（若有 flowContext）
- AND 子模块 MUST 使用 shouldInjectFlowContext 避免重复注入
- AND 子模块 MUST NOT 在 buildMark 中实现备选注入路径，确保唯一注入点在 logOperation

#### Scenario: g8-pv-sand-experiment 迁移至灵活组合模式
- GIVEN g8-pv-sand-experiment 子模块当前使用自实现的答案收集和操作序号管理
- WHEN 迁移完成后
- THEN 子模块 SHALL 导出 SUBMODULE_MAPPING_CONFIG 聚合对象，包含完整 PageConfig 字段（pageId、subPageNum、title、type、navigationMode、stepIndex、pageDesc）
- AND 子模块 SHALL 使用 collectAnswers 共享函数替代自实现逻辑
- AND 子模块 SHALL 使用 createOperationSequence 管理操作序号
- AND 子模块 SHALL 使用 injectFlowContext 在 logOperation 中注入 flow_context
- AND 子模块 SHALL 使用 createPageStateResetter 在页面切换时同时重置序号与 flowContextInjected 标记
- AND 子模块 SHALL 删除 buildMark 中的备选注入逻辑和 forEach code 重设逻辑
- AND 子模块 SHALL 符合 `docs/子模块数据规范1205.md` 规范要求
