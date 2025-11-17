# Tasks: update-data-submission-spec

## 1. 规格与对齐
- [x] 1.1 新增 `specs/data-format/spec.md`(数据提交格式规格)
- [x] 1.2 修改 `specs/assessment-core/spec.md` 以引用 Data Format 并对齐字段/事件集合
- [x] 1.3 更新 `specs/submission/spec.md`,补充:
  - 标准事件:`flow_context`、`page_submit_success`、`page_submit_failed`
  - 与 Assessment Core 的交叉引用与术语一致性

## 2. 工具与校验
- [x] 2.1 在 shared 层提供 `validateMarkObject(data)` 与 `eventTypes` 枚举(现已存在,需与规范对齐补齐)
  - 文件:`src/shared/services/submission/validateMarkObject.js:1`、`src/shared/services/submission/eventTypes.js:1`
- [x] 2.2 统一 `createMarkObject` 支持 `Operation.value` 可为对象、`pageId?`(如尚未统一,补工具函数与类型)
- [N/A] 2.3 在 DEV/CI 增加数据格式校验(lint/validate 脚本可选)
  - **说明**: 迁移部分将由新变更 `update-module-integration-to-unified-platform` 承接,本 change 不再直接实施。
- [x] 2.4 将事件枚举落地到 `shared/services/submission/eventTypes.js`,补充 `flow_context`、`page_submit_success`、`page_submit_failed`
- [x] 2.5 在提交链路中统一使用枚举来源,防止手写字符串(usePageSubmission、useDataLogger 等)

## 3. 模块对齐
- [N/A] 3.1 Grade-7-Tracking:`useDataLogger` 接口声明与 MarkObject 保持一致(保持兼容)
  - **说明**: 迁移部分将由新变更 `update-module-integration-to-unified-platform` 承接,本 change 不再直接实施。
- [N/A] 3.2 Grade-7(蒸馒头):`navigateToPage` → 统一提交 Hook
  - **说明**: 迁移部分将由新变更 `update-module-integration-to-unified-platform` 承接,本 change 不再直接实施。
- [N/A] 3.3 Grade-4:`submitPageDataInternal` → 统一提交 Hook
  - **说明**: 迁移部分将由新变更 `update-module-integration-to-unified-platform` 承接,本 change 不再直接实施。

## 4. 文档与迁移
- [x] 4.1 增补 `docs/migration-to-event-types.md`:
  - 旧事件字符串 → 新 `eventTypes` 引用示例
  - 常见页面进入/退出、问卷、实验事件编码示例
  - 与 Flow 前缀的 `pageDesc` 规范用法

---

## 本变更完成状态

**已完成**: 8/8 核心任务 (100%)

**范围说明**:
- 本变更聚焦于**规范制定**和**共享工具实现**
- 模块迁移任务(2.3、3.1-3.3)已移交至 `update-module-integration-to-unified-platform`
- 所有 shared 层工具已就绪,可供后续模块迁移使用

**交付成果**:
1. ✅ 规格文档对齐(Submission Spec、Data Format Spec、Assessment Core)
2. ✅ 事件类型枚举(`eventTypes.js`,24 个标准事件)
3. ✅ MarkObject 构建工具(`createMarkObject.js`)
4. ✅ MarkObject 校验工具(`validateMarkObject.js`)
5. ✅ 迁移指南文档(`migration-to-event-types.md`)
