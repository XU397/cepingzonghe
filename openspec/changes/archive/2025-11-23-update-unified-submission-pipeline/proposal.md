## Why
- `docs/submission-format-standard.md` 要求统一提交格式/管道，现有实现仍混用 `M2:11` 冒号页码、手写前缀/自增 code、直连 `/stu/saveHcMark`，导致 DEV 产生偏差与验收不一致。
- 行为分析新增“全量轨迹”需求：需要捕获点击/聚焦/输入变更/删除/阻断/下一页动作及实验操作的完整链路，现规范缺少事件粒度、前缀和包装组件要求。
- 需要在规格中明确组合页码、MarkObject 固定字段、flow_context 自动注入、仅非空答案入列、行为事件全集及阻断规则，并给出落地步骤与守卫，确保子模块迁移无歧义。

## What Changes
- 页码/前缀规范：`encodeCompositePageNum(stepIndex, subPageNum)` 产出 `<stepIndex>.<subPageNum>`；pageDesc 添加 `[flowId/submoduleId/stepIndex]` 前缀（无 Flow 省略）；`targetElement` 前缀 `P${pageNumber}_...`，淘汰 `M*` 前缀与冒号分隔。
- 行为事件与完整性：事件枚举补充 `input_focus`、`input_change`（含 value 快照或 delta）、`select_change`、`timer_complete`、`next_click`、`click_blocked`（含 missing 列表）；要求每页至少包含 page_enter/page_exit/next_click，输入类记录 focus/blur/change，阻断必记 click_blocked。
- 提交入口升级：`usePageSubmission` 作为唯一入口，子模块仅提供上下文/页面元数据/非空答案/业务埋点；提交层负责编码、前缀、flow_context 注入、Schema 校验、统一 API 提交与计时超时提交，自动追加 page_submit_success/failed。
- Schema + 组件包装：提供 TS+Zod/JSON Schema；新增输入/选择/按钮埋点包装组件，自动生成标准 targetElement/事件；提交层统一自增 code、时间格式，answerList 仅收集非空答案，超时补齐“超时未回答”，复杂数据以 JSON 字符串单条 Answer 存储。
- 守卫与样例：CI/Lint 禁止直连接口、禁止手写前缀/绕过 Hook；提供“提交格式快照测试”与“模块迁移快照基线”；落地步骤包含 schema.ts/encodeCompositePageNum、usePageSubmission 扩充、AssessmentPageFrame 默认配置助手、分批迁移 g8/grade7 模块等。

## Impact
- 规格影响：`openspec/specs/data-format/spec.md`、`openspec/specs/submission/spec.md`。
- 代码影响：`@shared/services/submission/schema.ts`、`shared/services/submission/encodeCompositePageNum`、`usePageSubmission` 及其调用路径、埋点包装组件、AssessmentPageFrame 默认配置、g8/grade7 子模块的提交逻辑、CI/Lint 规则与快照测试。
- 兼容性：**BREAKING**（页码与前缀格式变更、事件缺失/直连被禁）；需通过统一 Hook + Schema 才能提交。
