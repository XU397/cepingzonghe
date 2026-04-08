# Spec Delta: g8-drone-imaging 对齐共享操作管理 Utility

## MODIFIED Requirements

### Requirement: Flow 模式下的操作采集合规
g8-drone-imaging SHALL 使用共享操作管理 Utility 或等效逻辑，保证以下行为符合 `docs/子模块数据规范1205.md`：

#### Scenario: flow_context 注入
- GIVEN 需要注入 flow_context
- WHEN 构建 operationList
- THEN flow_context SHALL 紧跟 page_enter
- AND flow_context.value SHALL 为 JSON.stringify 生成的字符串，包含 flowId、submoduleId、stepIndex
- AND flow_context.value SHALL ensure moduleName 为字符串（可兜底默认值）
- AND flow_context MAY 包含 pageId
- AND 若已存在 flow_context，模块 SHALL 跳过重复注入

#### Scenario: 序号与重置
- GIVEN 构建提交时的 operationList
- WHEN 生成最终 code
- THEN code SHALL 从 1 开始连续递增
- AND 翻页时序列与 flow_context 注入标记 SHALL 被重置

#### Scenario: 时间戳记录
- GIVEN 记录任意 operation
- WHEN 设置 time
- THEN time SHALL 记录在操作发生时刻（格式：YYYY-MM-DD HH:mm:ss）
- AND 模块 SHALL NOT 依赖提交阶段回填时间

## 交叉引用
- `docs/子模块数据规范1205.md` 第 5.5、7.4、10.5 节
- `openspec/changes/extract-operation-management-utilities/`（共享 Utility 规范）
