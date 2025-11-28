## 1. Schema 与工具
- [x] 1.1 在 `@shared/services/submission/schema.ts` 固化 TS 类型 + Zod/JSON Schema（MarkObject/Operation/Answer），校验事件枚举（含 input_focus/input_change/input_delete/select_change/timer_complete/next_click/click_blocked 缺失项）、仅非空答案、时间格式与 code 连续性；导出校验函数，并定义输入类 value 格式（快照或 `{ prev, next }`、删除 `{ action: 'delete', prevLength, nextLength }`）。
- [x] 1.2 调整 `encodeCompositePageNum` 生成 `<stepIndex>.<subPageNum>`（示例 `0.3`），移除 `M` 前缀与冒号；暴露生成 `pageDesc`、`targetElement` 前缀（`P${pageNumber}_*`）的辅助。
- [x] 1.3 提供埋点包装组件（输入/选择/按钮）输出标准事件与 targetElement，附示例与快照。

## 2. usePageSubmission 升级
- [x] 2.1 扩充 Hook 接口：子模块仅提供 `getUserContext`、`getFlowContext`、`pageMeta(pageId/pageTitle/subPageNum)`、`answers`（已过滤空值）、`operations`（业务埋点）。
- [x] 2.2 在提交层完成封装：组合页码编码、pageDesc/targetElement 前缀注入、flow_context 自动追加、code 自增、时间兜底（begin/end）、统一 API 提交。
- [x] 2.3 计时超时场景走同一入口：补齐"超时未回答" Answer 后提交；自动生成 `auto_submit`/`page_exit`/`page_submit_failed|success` 相关操作。
- [x] 2.4 在 Hook 内执行 Schema 校验（Zod/JSON Schema），不合规阻断并返回可读错误。

## 3. 框架默认配置
- [x] 3.1 在 `AssessmentPageFrame` 增加默认提交配置/助手，统一注入 getUserContext/getFlowContext/pageMeta/operations，子模块零格式化接入。

## 4. 守卫与工具链
- [x] 4.1 CI/Lint 规则：禁止直接 `fetch /stu/saveHcMark`、禁止手写 pageNumber/targetElement 前缀、禁止绕过统一 Hook。
- [x] 4.2 增加"提交格式快照测试"，验证各子模块 buildMark 输出符合 Schema（含 pageNumber 格式、flow_context、非空答案、最小事件集合：page_enter/page_exit/next_click + 输入 focus/change/delete/blur 或 select_change + 阻断 click_blocked）。
- [x] 4.3 Lint/测试守卫：检查 targetElement 前缀、事件枚举合法性，以及缺少最小事件集合时直接失败。

## 5. 分批迁移（留给模块提案）
- [x] 5.1 生成模块迁移基线样例（含最小事件集合、前缀示例），供后续子模块提案引用。
