# Spec Delta: 子模块 flow_context 合规性说明

## 变更类型

本变更为**合规性清理**，重申现有规范要求，不引入新的规范变更。

> **定位**：本 spec delta 仅对现有规范进行补充说明，明确各子模块应满足的合规性要求。

---

## MODIFIED Requirements

### Requirement: 子模块 flow_context 合规性（补充说明）
各子模块 SHALL 确保 flow_context 事件符合 `docs/子模块数据规范1205.md` 中定义的规范要求。

> 关联规范：
> - `docs/子模块数据规范1205.md:252`：flow_context 紧跟 page_enter
> - `docs/子模块数据规范1205.md:374`：moduleName 可选（推荐填写）
> - `extract-operation-management-utilities` spec delta

#### Scenario: value 格式要求
- GIVEN 子模块构造 flow_context 事件
- WHEN 设置 value 字段
- THEN value SHALL 为 `JSON.stringify()` 生成的字符串
- AND value SHALL NOT 为原始对象
- AND value 解析后 SHALL 包含：flowId、stepIndex、submoduleId
- AND value 解析后 SHOULD 包含：moduleName（推荐填写，兼容旧代码设为可选）
- AND value 解析后 MAY 包含：pageId

#### Scenario: 注入位置要求
- GIVEN 子模块需要注入 flow_context 事件
- WHEN 构建 operationList 准备提交
- THEN flow_context 事件 SHALL 紧跟 page_enter 事件之后
- AND 若 operationList 无 page_enter，子模块 MAY 将 flow_context 插入开头作为 fallback
- AND 若使用共享 utility（injectFlowContext），缺失 page_enter 时 SHALL 抛出 MissingPageEnterError

#### Scenario: 重复注入防护
- GIVEN 子模块准备注入 flow_context
- WHEN operationList 中已存在 flow_context 事件
- THEN 子模块 SHALL 跳过注入，不重复添加

#### Scenario: code 连续性要求
- GIVEN flow_context 事件插入后
- WHEN 构建最终的 operationList
- THEN 所有 operation 的 code SHALL 从 1 开始连续递增
- AND code 不允许出现跳跃或重复

---

## Cross-References

- `docs/子模块数据规范1205.md`：子模块数据规范（权威规范）
- `openspec/changes/extract-operation-management-utilities/specs/submission/spec.md`：操作管理 Utility 规范
- `openspec/specs/data-format/spec.md`：数据格式规范
