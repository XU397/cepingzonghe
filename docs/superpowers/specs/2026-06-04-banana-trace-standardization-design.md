# 香蕉变黑 L2 轨迹标准化重构设计

日期：2026-06-04

## 背景

本次重构先落地 `g8-banana-browning-experiment` 的轨迹数据标准化，同时沉淀一套可复用工程标准，供后续蜂蜜黏度、蒸馒头等同构子模块按同一模式迁移。

依据文档：

- `docs/子模块数据上报规范/现有香蕉变黑轨迹数据标准规范.md`
- `docs/子模块数据上报规范/01轨迹上报规范.md`
- `docs/子模块数据上报规范/02打标规范.md`
- `docs/子模块数据上报规范/engineering_contracts/README.md`
- `docs/子模块数据上报规范/engineering_contracts/event_schema.v2.1.json`
- `docs/子模块数据上报规范/engineering_contracts/field_registry.v2.1.json`
- `docs/子模块数据上报规范/engineering_contracts/content_registry.banana.v2.1.json`
- `docs/子模块数据上报规范/engineering_contracts/acceptance_cases/*.json`

## 已确认决策

- 只重构前端香蕉变黑子模块，保留现有 `/stu/saveHcMark` 接口和 Mark JSON 页面级 envelope。
- `intro_notice` 不进入 13 页 L2 标准，只保留现有进入 / 下一页行为或最小生命周期记录。
- 本次要做成可复用工程能力：共享 `TraceEvent` 构造、标准事件 logger、registry 校验、测试夹具、香蕉接入和迁移文档。
- 标准任务页的 `operationList` 只输出新 L2 事件名，不双写旧事件。
- `operationList[*].value` 在 Mark JSON 中保持结构化对象，不再提交 JSON 字符串。
- 验收包含共享轨迹契约测试、香蕉全页 / 关键页快照测试，以及 `npm run lint:submission`、`npm run test:submission-format`、`npm run test:submission`。

## 目标

1. 香蕉变黑 13 个任务页输出符合 `01轨迹上报规范.md` 的 L2 标准轨迹事件。
2. 保持现有提交 envelope 不变：`pageNumber`、`pageDesc`、`operationList`、`answerList`、`beginTime`、`endTime`、`imgList`。
3. 将事件名、时间格式、`value` 结构、registry 引用和页面类型配置标准化。
4. 抽象共享标准事件层，避免后续蜂蜜黏度、蒸馒头重复手写局部日志语义。
5. 用工程合同文件和测试夹具锁住可复用标准。

## 非目标

- 不改后端 API。
- 不改变 `answerList` 的评分 / 答案语义。
- 不在前端生成 L3 行为标签或 L4 过程特征。
- 不在每条事件里重复上报字段 / 内容语义；语义由静态 Field Registry / Content Registry 解释。
- 不为了短期兼容双写旧 `input_change`、`radio_select` 等事件。

## 总体架构

采用三层结构：

1. 共享标准事件层
   - 建议放在 `src/shared/services/submission/trace/`。
   - 负责生成 L2 `operationList` 事件、毫秒级 ISO 时间、`trace_id`、页面内递增 `code`、标准 `START_PAGE` metadata、文本 / 实验 / 选择 / 动态表格等通用事件。

2. 香蕉实例配置层
   - 在 `src/submodules/g8-banana-browning-experiment/` 扩展 mapping。
   - 建立现有页面 ID 到标准 13 页 `page_id`、`page_index`、`page_type` 的映射。
   - `intro_notice` 保持路由和恢复用途，但不参与 L2 标准页校验。

3. 页面接入层
   - 页面不再手写旧事件名。
   - 页面调用标准 logger 的语义化方法，例如 `textFocus()`、`textChange()`、`textBlur()`、`submitAttempt()`、`setExpParam()`、`executeExp()`、`selectAnswer()`、`addRow()`。

该结构将“标准事件构造 + registry 校验 + 页面类型模板”作为复用核心。蜂蜜黏度、蒸馒头后续只替换实例 mapping、content registry 和页面接入，不重新定义事件结构。

## 页面映射与标准配置

香蕉现有 `PAGE_CONFIGS` 可继续用于路由、恢复和提交页号。新增标准轨迹页面配置，只覆盖 13 个任务页。

标准配置字段：

- `legacyPageId`：当前代码页面 ID，例如 `page_02_banana_browning`。
- `standardPageId`：新规范稳定 ID，例如 `page_02_question_generation`。
- `pageIndex`：1-13。
- `pageType`：操作大类 + 拓扑子类，例如 `B1_TEXT_SINGLE`、`D1_SIMULATION_ONLY`、`D2_SIMULATION_WITH_QUESTION`、`E1_SOLUTION_SELECTION`。
- `requiredFields`：来自 Field Registry 的稳定字段 ID。
- `questions` / `options` / `contentIds` / `experimentParams`：按页面需要绑定标准 ID。

`intro_notice` 处理：

- 不进入标准 13 页。
- 不参与 `field_registry_version`、`page_index=1..13` 合规校验。
- 测试需要明确断言它不会被当成 L2 标准页。

Registry 边界：

- Field Registry 解释字段语义，页面事件只引用 `field_id`。
- Content Registry 解释 Page02 聊天气泡和材料内容，页面事件只引用 `content_id`。
- 香蕉专属内容放香蕉 registry；通用字段角色、页面类型和事件语义留共享层。

复用要求：

- 后续蜂蜜黏度、蒸馒头必须提供同结构的 `TRACE_PAGE_CONFIGS`。
- 页面类型模板不随题材变化。例如第 12 页仍使用 `plan_param_1`、`plan_param_2`，只替换展示名和选项列表。

## 数据流与事件语义

### 页面进入

标准任务页渲染可交互后记录 `START_PAGE`。

`value` 至少包含：

- `trace_id`
- `page_id`
- `page_type`
- `target_id=page`
- `target_type=page`
- `metadata`

`metadata` 至少包含：

- `schema_version`
- `field_registry_version`
- `field_registry_hash`
- `task_family`
- `module_id`
- `page_index`
- `legacy_page_id`
- `flow_context`
- 页面初始状态

Page02 聊天气泡自动呈现摘要放入 `START_PAGE.value.metadata.chat_auto_reveal_summary`。自动动画本身不是学生主动阅读事件。

### 页面交互

文本页：

- 使用 `TEXT_FOCUS`、节流 / 防抖后的 `TEXT_CHANGE`、`TEXT_BLUR`。
- 不逐字上报。
- `TEXT_CHANGE.value_after` 默认留空。
- 最终完整文本只在 `TEXT_BLUR.value_after`。

资料和内容查看：

- 使用 `CONTENT_EXPOSE`、`CONTENT_ACTIVATE`、`CHAT_SCROLL`、`OPEN_MODAL`、`CLOSE_MODAL`。
- 只引用 `content_id` / `card_id`，不重复上报长文案。

实验区：

- 使用 `SET_EXP_PARAM`、`EXECUTE_EXP`、`RESET_EXP`。
- 实验结果只放在 `EXECUTE_EXP.metadata.result_snapshot`。
- 第 8 页禁止 `SELECT_ANSWER`。

选择题：

- 第 9-11 页只为当前页当前题记录 `SELECT_ANSWER`。
- 事件携带 `question_id`、`option_id`、必要时携带 `option_text`。
- 实验事件和答案事件按真实时间序列保留。

第 12 页方案选择：

- 使用 `ADD_ROW`、`DELETE_ROW`、`SET_PLAN_PARAM`、`SELECT_BEST`、理由文本事件。
- 动态行必须使用稳定 `row_id`，不能依赖行号。
- 全局理由输入框使用稳定 `field_id=reason_text`。

### 页面提交

点击下一页 / 完成时先记录 `SUBMIT_ATTEMPT`。

`SUBMIT_ATTEMPT` 至少携带：

- `submit_attempt_id`
- `validation_status`
- `missing_fields`
- `error_msg`
- `submit_trigger`

`SUBMIT_ATTEMPT.validation_status` 不写入 `value_after`。

`answerList` 继续作为答案 / 评分数据源，不和 `operationList` 混用。

## 共享工程能力边界

### 共享类型与常量

新增或扩展：

- L2 事件类型常量。
- `TraceEventValue`
- `TracePageConfig`
- `TraceLogger`
- `TraceRegistryValidationResult`
- `SCHEMA_VERSION`
- 标准 page type、target type、validation status 枚举。

### 共享构造器

建议提供：

- `createTraceEvent()`：生成单条标准事件，补齐 `code`、`trace_id`、ISO 毫秒时间、`page_id`、`page_type`、`metadata`。
- `createPageTraceLogger()` 或 hook：绑定当前页标准配置，暴露语义化事件方法。
- `createTracePageStartMetadata()`：统一注入 registry 版本、hash、module、flow context、legacy page id。

### 共享校验器

建议提供：

- `validateTraceEventSchema()`：校验事件结构。
- `validateTraceRegistryRefs()`：校验 `field_id`、`content_id`、`question_id`、`option_id`、`row_id`。
- `validateTraceMark()`：校验页面 Mark 的 `operationList`，输出可读错误。

### 共享测试夹具

建议提供：

- 从 `buildMark()` 中抽取事件并校验 L2 合规的测试工具。
- acceptance case 校验入口，复用 `engineering_contracts/acceptance_cases/*.json`。
- 面向后续模块的统一测试模板，只需传入模块 `TRACE_PAGE_CONFIGS` 和 registry。

共享层禁止包含香蕉页面文案、CSS、DOM 层级或题材知识。

## 错误处理与兼容策略

运行时采用“温和降级”，测试采用“严格失败”。

运行时：

- 标准 logger 构造事件失败时，不抛出到页面 UI。
- 轨迹校验失败不阻断 `/stu/saveHcMark`。
- 页面业务校验继续决定是否能提交。
- blocked 提交也必须记录 `SUBMIT_ATTEMPT`，用于后端分析。

测试 / CI：

- `validateTraceMark()` 必须严格失败。
- 提交格式测试必须覆盖对象 `value`、毫秒 ISO 时间、L2 标准事件名。
- 快照测试锁住关键页事件结构。
- `intro_notice` 测试明确排除在 13 页标准校验之外。

兼容边界：

- 不双写旧事件。
- 不改变 `/stu/saveHcMark` FormData envelope。
- 如旧共享提交 schema 要求 `value` 为字符串，需要同步升级为支持对象。
- 旧测试依赖旧事件名时，应重写为 L2 标准断言。

## 风险与控制

主要风险：

- 共享提交类型、校验、测试工具影响面较大。
- 香蕉页面当前手写日志较多，逐页迁移容易遗漏事件。
- JSON Schema 校验可能需要额外依赖；如项目未已有 AJV 等依赖，优先使用轻量本地校验器或测试期校验，不主动引入重依赖。

控制措施：

- 修改符号前按项目要求运行 GitNexus impact analysis。
- 逐页按页面类型模板迁移，并用快照测试兜底。
- 用 `event_schema.v2.1.json`、Field Registry、Content Registry 和 acceptance cases 做合同校验。
- 完成前运行提交相关验证命令。

## 测试方案

共享层测试：

- L2 事件构造：`trace_id`、`code`、ISO 毫秒时间、`page_id`、`page_type`、`metadata` 注入。
- JSON Schema / registry 引用：事件结构、`field_id`、`content_id`、`question_id`、`option_id`、`row_id`。
- 反例：旧事件名、字符串 `value`、秒级时间、第 8 页 `SELECT_ANSWER`、缺少 registry ID。

香蕉子模块测试：

- 扩展 `mapping.test.ts`：验证 13 个标准页配置、`intro_notice` 排除、legacy page ID 与 standard page ID 可查。
- 改造 `submission.snapshot.test.ts`：断言 L2 事件，不再断言旧事件。
- 覆盖 Page02、Page05、Page08、Page09-11、Page12、Page13。
- 使用 `engineering_contracts/acceptance_cases/*.json` 做关键页面事件合同测试。

验证命令：

```bash
npm run lint:submission
npm run test:submission-format
npm run test:submission
```

视影响补充针对新增 / 改造测试文件的 `npm test -- --run ...`。

## 文档交付

本设计文档：

- `docs/superpowers/specs/2026-06-04-banana-trace-standardization-design.md`

实施完成后还需沉淀：

- `docs/子模块数据上报规范/前端L2轨迹重构工程标准.md`

该工程标准应包含：

- 标准目录结构。
- 必需配置。
- 页面类型模板。
- 事件接入范式。
- 测试清单。
- 蜂蜜黏度、蒸馒头迁移步骤。

完成工作后按项目规则更新：

- `docs/project_notes/issues.md`

## 后续实施入口

用户确认本设计文档后，进入 `superpowers:writing-plans`，生成可执行的分步实施计划。实施计划必须先处理共享事件层和测试夹具，再迁移香蕉页面，最后补齐工程标准文档与验证。
