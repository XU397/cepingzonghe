# 香蕉变黑 L2 轨迹标准化重构设计

日期：2026-06-04

版本状态（2026-06-06）：本文是 v2.1 基线重构设计，保留用于追溯第一阶段标准化决策；当前香蕉变黑前端运行时已由 `2026-06-06-banana-trace-v2-2-frontend-implementation-design.md` 升级到 v2.2，并以 `engineering_contracts/*.v2.2.json` 为实施合同。

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
- 权威源、同步副本、运行时依赖和事件边界按“权威源与同步约束”执行。

## 权威源与同步约束

1. 后端仓库 `D:\myproject\assessment-platform-backend\docs\轨迹分析管线构建\` 是轨迹上报规范、Field Registry、Content Registry、event_schema、rule_config 的权威源。
2. 前端仓库 `D:\myproject\cp\docs\子模块数据上报规范\` 保存同步副本，用于前端本地实现、测试和 CI 校验。
3. 前端运行时和 CI 不允许依赖 `D:\myproject\assessment-platform-backend\...` 这种本机绝对路径。
4. 如果前端发现同步副本与权威源不一致，应视为合同同步问题，不允许前端自行修改语义；需要回到权威源修订后再同步。
5. 当前确认：`eventSeq` 仍由 `operationList[*].code` 表达，不额外塞进 `value`；`value` 保持结构化对象；Page02 自动聊天动画只进入 `START_PAGE.value.metadata.chat_auto_reveal_summary`，不作为主动阅读事件。

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

## GLM 审查问题合理性判断

GLM 审查指出的问题整体成立：原设计已经明确“不改后端、只输出 L2 标准事件、value 保持结构化对象”，但没有把浏览器 L0 事件、registry 绑定后的 L1 语义、最终 `operationList` 中的 L2 事件串成可实施路径。以下补充作为本设计的实施级约束：

- `L0→L1→L2` 变换管道缺失：属实。必须明确 Collector、TraceLogger、现有 `logOperation()` 队列各自的输入 / 输出 / 责任边界。
- 文本、内容查看、实验、动态表格事件的 Collector 生命周期缺失：属实。香蕉当前页面多为直接 handler 调 `logOperation()`，并不存在统一 `TrackedInput` 组件；本次采用共享 hook / collector 组合现有 DOM handler，而不是强制替换为新 UI 组件。
- `value` 格式决策不够显式：部分属实。设计已确认 `value` 保持结构化对象；需要补充传输边界：`operationList[*].value` 在 Mark 对象内是对象，只有整个 `mark` 字段在 `submitPageMarkData()` 中 `JSON.stringify` 后进入 FormData。
- L2 事件注入现有管道不明确：属实。新事件进入同一个 `operations[]` 队列，不新建平行队列；但标准页必须启用 L2 生命周期模式，避免共享提交层自动补回 `page_enter`、`next_click`、`page_exit`、独立 `flow_context` 等 legacy 事件。
- `TRACE_PAGE_CONFIGS` 与 `PAGE_CONFIGS` 关系不清：属实。二者必须分离，前者只服务 13 个 L2 标准任务页，后者继续服务 14 页路由 / 恢复 / 提交页号。
- 共享层 API 签名缺失：属实。补充的 TypeScript 签名是实施计划的约束；实现可拆文件，但入参、返回和职责不得偏离。

额外发现：如果不补充 L2 生命周期模式，现有 `usePageSubmission()` 的 legacy 生命周期兜底会自动注入旧事件名，直接违反“标准任务页只输出新 L2 事件名”的已确认决策。因此实施计划必须先改共享提交层开关，再迁移香蕉页面。

## L0→L2 数据流与 API 接口设计

### 分层职责与数据流

标准任务页的数据流固定为：

```text
浏览器 L0 事件 / 页面生命周期
  -> EventCollector 或页面接入 hook
     - 绑定 TRACE_PAGE_CONFIGS 中的 field_id / content_id / question_id / row_id
     - 管理 debounce / throttle / dwell / scroll segment / double-click guard
  -> TraceLogger
     - 按 event_schema.v2.1.json 构造 TraceEventValue
     - 注入 page_id、page_type、trace_id、metadata、registry 版本和 flow_context
  -> 现有 logOperation()
     - 写入同一个 operations[] 队列
     - 分配页面内递增 code；code 仍是后端 eventSeq 来源
  -> buildMark()
     - operationList 使用 operationsForSubmission
     - answerList 继续只承载答案 / 评分数据
  -> usePageSubmission({ lifecycleMode: 'l2-trace' })
     - 不注入 legacy 生命周期事件
     - createMarkObject() 保留对象 value
     - validateTraceMark() 严格校验 L2 事件
  -> submitPageMarkData()
     - 仅在 FormData.mark 边界 JSON.stringify 整个 Mark 对象
```

职责边界：

- 页面组件只负责把真实 UI 事件传给 Collector 或 TraceLogger，不再手写 L2 `value` 结构，也不再拼 registry ID 之外的语义字段。
- EventCollector 负责 L0 到 L1 的聚合和节流，例如文本防抖、聊天滚动段合并、内容曝光阈值、实验防双击、动态行稳定 ID。
- TraceLogger 负责 L1 到 L2 的标准事件构造和 registry 引用校验前置，不保存独立队列。
- `logOperation()` 仍是唯一写入 `operations[]` 的入口；L2 事件和 `SUBMIT_ATTEMPT` 按真实发生时间混排。

### L0→L2 事件变换表

| L2 事件 | L0 来源 | L1 绑定 / 聚合 | L2 输出要求 |
|---|---|---|---|
| `START_PAGE` | 页面可交互后的 effect | `TRACE_PAGE_CONFIGS[legacyPageId]` + flow context | `target_type=page`，`metadata` 含 registry 版本、hash、module、page_index、legacy_page_id、flow_context、初始状态 |
| `TEXT_FOCUS` | `focus` / `compositionend` 后稳定 focus | `field_id` + 聚焦时文本快照 | `value_before` 为聚焦时文本，`metadata.char_count_before` |
| `TEXT_CHANGE` | `input` / `change` | 2000ms 防抖或累计字符变化 `abs(delta)>=10`；composition 期间不落盘 | 默认不写过程明文，`value_after` 留空或 `null`，字符统计进 `metadata` |
| `TEXT_BLUR` | `blur` / 提交前强制 flush | `field_id` + 聚焦快照 + 当前文本 | `value_before` / `value_after` 写最终文本边界，`metadata.char_delta` |
| `CONTENT_EXPOSE` | IntersectionObserver | 可见比例 `>=0.5` 且持续 `>=500ms` | `content_id`、`content_type`、`visible_ratio`、`visible_ms`、`phase` |
| `CONTENT_ACTIVATE` | hover / touch / click | 鼠标停留 `>=600ms` 或触摸 `>=300ms`，短划过丢弃 | `content_id`、`activation_type`、`dwell_ms`、`visible_ratio`、`phase` |
| `CHAT_SCROLL` | scroll | 连续滚动段停止 `>=300ms` 后聚合 | `scroll_delta`、方向、滚动前后可见 `content_id` 集合 |
| `OPEN_MODAL` / `CLOSE_MODAL` | modal open / close | `card_id` + dwell 计时 | 打开记录 card 信息，关闭记录 `dwell_ms` |
| `SELECT_ANSWER` | radio / option click | 当前页当前题 `question_id` + `option_id` | 第 9-11 页只记录本页题目；第 8 页禁止出现 |
| `SET_EXP_PARAM` | 实验参数控件变化 | `param_id` / `param_name` + 当前参数快照 | `value_before`、`value_after`、`metadata.param_snapshot` |
| `EXECUTE_EXP` | 点击开始实验 | Collector 生成 `exp_run_id`，1500ms 防双击 | `exp_run_id`、`param_snapshot`、`result_snapshot`、`click_debounce_applied` |
| `RESET_EXP` | 点击重置 | 重置前状态快照 | `metadata.param_snapshot_before_reset`、`reset_count` |
| `ADD_ROW` | 新增方案行 | DynamicTable collector 生成稳定 `row_id` | `row_id`、`metadata.row_index`、`row_snapshot` |
| `DELETE_ROW` | 删除方案行 | 删除前按 `row_id` 查快照 | `row_id`、`row_snapshot_before_delete`、`was_best_plan` |
| `SET_PLAN_PARAM` | 动态表格 select / input | `row_id` + `param_id=plan_param_1/plan_param_2` | `value_before`、`value_after`、`row_snapshot` |
| `SELECT_BEST` | 星标 / 最佳方案选择 | 记录前后最佳 `row_id` | `previous_best_row_id`、`current_best_row_id` |
| `SUBMIT_ATTEMPT` | 下一页 / 完成 / 自动提交 | 页面校验结果 + submit trigger | `submit_attempt_id`、`validation_status`、`missing_fields`、`error_msg`、`submit_trigger` |
| `TASK_FINISH` | 第 13 页完成任务 | 完成按钮或 Flow completion | `finish_trigger`，不替代 `SUBMIT_ATTEMPT` |

### TraceLogger API 契约

共享层建议位于 `src/shared/services/submission/trace/`。实现可以拆成 `types.ts`、`logger.ts`、`collectors/*`、`validators/*`，但对外契约固定如下：

```typescript
type L2TraceEventType =
  | 'START_PAGE'
  | 'PAGE_HIDDEN'
  | 'PAGE_VISIBLE'
  | 'SUBMIT_ATTEMPT'
  | 'TASK_FINISH'
  | 'CONTENT_EXPOSE'
  | 'CONTENT_ACTIVATE'
  | 'CONTENT_VIEW'
  | 'CHAT_SCROLL'
  | 'CHAT_VIEWPORT_ENTER'
  | 'CHAT_VIEWPORT_LEAVE'
  | 'OPEN_MODAL'
  | 'CLOSE_MODAL'
  | 'CHART_HOVER'
  | 'TEXT_FOCUS'
  | 'TEXT_CHANGE'
  | 'TEXT_BLUR'
  | 'CHECKBOX_TOGGLE'
  | 'SELECT_ANSWER'
  | 'SET_EXP_PARAM'
  | 'EXECUTE_EXP'
  | 'RESET_EXP'
  | 'ADD_ROW'
  | 'DELETE_ROW'
  | 'SET_PLAN_PARAM'
  | 'SELECT_BEST'
  | 'TIMER_COMPLETE';

interface TraceOperationDraft {
  targetElement: string;
  eventType: L2TraceEventType;
  value: TraceEventValue;
  time: string;
  pageId: string;
}

interface CreatePageTraceLoggerOptions {
  pageConfig: TracePageConfig;
  moduleId: string;
  taskFamily: string;
  flowContext?: FlowContextData | null;
  registryInfo: {
    schemaVersion: string;
    fieldRegistryVersion: string;
    fieldRegistryHash: string;
    contentRegistryVersion?: string;
    contentRegistryHash?: string;
  };
  logOperation: (operation: TraceOperationDraft) => void;
  now?: () => Date;
  idFactory?: {
    traceId(): string;
    submitAttemptId(): string;
    expRunId(pageId: string, runSeq: number): string;
    rowId(pageId: string, rowSeq: number): string;
  };
}

interface TraceLogger {
  emit(type: L2TraceEventType, patch: Partial<TraceEventValue>, options?: TraceEmitOptions): TraceOperationDraft | null;
  startPage(metadata?: Record<string, unknown>): TraceOperationDraft | null;
  submitAttempt(options: SubmitAttemptOptions): TraceOperationDraft | null;
  taskFinish(options: TaskFinishOptions): TraceOperationDraft | null;
  textFocus(fieldId: string, options?: TextFocusOptions): TraceOperationDraft | null;
  textChange(fieldId: string, options: TextChangeOptions): TraceOperationDraft | null;
  textBlur(fieldId: string, options: TextBlurOptions): TraceOperationDraft | null;
  contentExpose(contentId: string, options: ContentExposeOptions): TraceOperationDraft | null;
  contentActivate(contentId: string, options: ContentActivateOptions): TraceOperationDraft | null;
  chatScroll(options: ChatScrollOptions): TraceOperationDraft | null;
  selectAnswer(questionId: string, optionId: string, options?: SelectAnswerOptions): TraceOperationDraft | null;
  setExpParam(paramId: string, options: SetExpParamOptions): TraceOperationDraft | null;
  executeExp(options: ExecuteExpOptions): TraceOperationDraft | null;
  resetExp(options: ResetExpOptions): TraceOperationDraft | null;
  addRow(rowId: string, options: RowMutationOptions): TraceOperationDraft | null;
  deleteRow(rowId: string, options: DeleteRowOptions): TraceOperationDraft | null;
  setPlanParam(rowId: string, paramId: string, options: SetPlanParamOptions): TraceOperationDraft | null;
  selectBest(options: SelectBestOptions): TraceOperationDraft | null;
}
```

`createTraceEvent()` / `TraceLogger.emit()` 只返回 `TraceOperationDraft`，不分配 `code`。`code` 继续由现有 `G8BananaBrowningContext.logOperation()` 的页面内序列器分配；这样可以复用 `clearOperations()` 后重置序号、`operationsForSubmission` 当前页过滤和 `buildMark()` 管道。

### EventCollector API 与生命周期

Collector 是共享层对浏览器事件的聚合适配，不保存提交队列。页面卸载、跳页、提交前必须调用对应 `flush()` / `dispose()`，避免丢失防抖中的事件。

```typescript
interface TextEventCollector {
  onFocus(valueBefore: string): void;
  onChange(valueAfter: string, options?: { isComposing?: boolean }): void;
  onBlur(valueAfter: string): void;
  flush(reason: 'blur' | 'submit' | 'unmount'): void;
  dispose(): void;
}

interface ContentEventCollector {
  registerContent(contentId: string, element: Element, options?: ContentBindingOptions): void;
  unregisterContent(contentId: string): void;
  onScroll(snapshot: ChatScrollSnapshot): void;
  flush(reason: 'scroll_idle' | 'submit' | 'unmount'): void;
  dispose(): void;
}

interface ExperimentEventCollector {
  setParam(paramId: string, valueAfter: unknown): void;
  execute(trigger: 'button' | 'keyboard'): boolean;
  reset(): void;
}

interface DynamicTableEventCollector {
  createInitialRow(seed?: Partial<RowSnapshot>): RowSnapshot & { row_id: string };
  addRow(row: RowSnapshot): string;
  deleteRow(rowId: string): void;
  setPlanParam(rowId: string, paramId: 'plan_param_1' | 'plan_param_2', valueAfter: unknown): void;
  selectBest(currentBestRowId: string | null): void;
}
```

具体规则：

- 文本 collector 管理 2000ms debounce、10 字符 throttle、composition 忽略、聚焦时 `value_before` 快照；提交前强制 `flush('submit')`，确保最终 `TEXT_BLUR` 已落盘。
- 内容 collector 在 hook 内创建 / 清理 `IntersectionObserver`，并管理 hover / touch dwell timer；Page02 自动聊天动画只进入 `START_PAGE.metadata.chat_auto_reveal_summary`，不触发主动阅读事件。
- 实验 collector 生成 `exp_run_id`，保存 `runSeq`，使用注入的 `idFactory` 保证测试可预测；1500ms 内重复执行返回 `false` 且不生成新的有效 `EXECUTE_EXP`。
- 动态表格 collector 生成并维护稳定字符串 `row_id`，格式建议为 `${standardPageId}_row_${seq}`；`row_id` 存入页面行状态，新增、删除、重排时跟随行对象，不得由数组下标临时推导。

### 与现有提交管道的衔接

标准页沿用当前 Mark envelope，但共享提交层增加 L2 生命周期模式：

```typescript
type SubmissionLifecycleMode = 'legacy' | 'l2-trace';
```

当 `lifecycleMode='l2-trace'` 时：

- `usePageSubmission()` 不再通过 `ensureLifecycleOperations()` 自动补 `page_enter`、`next_click`、`page_exit`。
- `usePageSubmission()` 不再注入独立 `flow_context` operation；flow context 只出现在 `START_PAGE.value.metadata.flow_context`。
- `G8BananaBrowningContext` 当前的 `normalizeOperationValueForAdapter()` 会把 object `value` 转成 JSON 字符串，虽然它主要服务 legacy `flow_context` 注入适配器而不是 `logOperation()` 的原始 dispatch，但 L2 实施必须显式处理这个冲突：要么给 context 增加 trace/lifecycle 模式开关，使 13 个标准页完全绕过 `normalizeOperationsForAdapter()` 和 legacy flow-context 注入；要么将 adapter 改为 mode-aware，只在 legacy 路径 stringify，L2 路径保留对象 `value`。
- `validateMarkObject()` 的 legacy 必填事件规则不适用于 L2 标准页；改用 `validateTraceMark()` 校验 `event_schema.v2.1.json`、Field Registry、Content Registry 和 acceptance cases。
- `normalizeOperations()` / `createMarkObject()` 必须保留对象 `value`，不得对 L2 `value` 做二次 `JSON.stringify`。
- `operationList` 内只允许 `event_schema.v2.1.json` 枚举中的 L2 事件名；旧 `INPUT_CHANGE`、`SIMULATION_OPERATION`、`CHANGE`、`CLICK`、`PAGE_ENTER` 等事件在 13 个标准页中均为失败。

这不改变 `/stu/saveHcMark`：最终仍由 `submitPageMarkData()` 将整个 `mark` 对象序列化为 FormData 的 `mark` 字段。

### 页面类型接入范式

- B1 单文本页：页面创建 `TextEventCollector(field_id=input_question_1)`；`onFocus/onChange/onBlur` 全部走 collector；聊天区通过 `ContentEventCollector` 记录主动滚动 / 停留。
- B2 多文本并列页：每个输入框一个 `field_id` 和一个文本 collector；提交前统一 flush 所有 collector。
- B3 评价矩阵页：每个评价输入框绑定稳定 `field_id`；选择 / 勾选事件走 `SELECT_ANSWER` 或 `CHECKBOX_TOGGLE`，文本理由仍走文本 collector。
- C1 材料勾选页：资料卡打开 / 关闭走 `OPEN_MODAL` / `CLOSE_MODAL`，勾选走 `CHECKBOX_TOGGLE`，内容曝光和激活由 content collector 聚合。
- D1 纯实验页：`SimulationPanel` 不再直接发 `SIMULATION_OPERATION`；参数按钮调用 `ExperimentEventCollector.setParam()`，开始按钮调用 `execute()`，重置按钮调用 `reset()`；第 8 页禁止 `SELECT_ANSWER`。
- D2 实验 + 题目页：实验区同 D1；题目选项只记录当前页当前题 `SELECT_ANSWER`，实验事件与答案事件按真实时间混排。
- E1 方案选择页：动态表格行状态必须包含 `row_id`；新增 / 删除 / 参数修改 / 最佳方案分别调用 dynamic table collector；全局理由文本绑定 `field_id=reason_text` 并复用文本 collector。

## 页面映射与标准配置

香蕉现有 `PAGE_CONFIGS` 可继续用于路由、恢复和提交页号。新增标准轨迹页面配置，只覆盖 13 个任务页。

标准配置字段：

- `legacyPageId`：当前代码页面 ID，例如 `page_02_banana_browning`。
- `standardPageId`：新规范稳定 ID，例如 `page_02_question_generation`。
- `pageIndex`：1-13。
- `pageType`：操作大类 + 拓扑子类，必须使用 `event_schema.v2.1.json` 的枚举值，例如 `B1_TEXT_SINGLE`、`D1_SIMULATION_ONLY`、`D2_SIMULATION_QUESTION`、`E1_CHART_PLAN_DECISION`。
- `requiredFields`：来自 Field Registry 的稳定字段 ID。
- `questions` / `options` / `contentIds` / `experimentParams`：按页面需要绑定标准 ID。

`PAGE_CONFIGS` 与 `TRACE_PAGE_CONFIGS` 的关系：

- `PAGE_CONFIGS` 保持现状，继续覆盖 14 个页面，负责 `subPageNum`、路由恢复、导航模式、`pageNumber` 组合和 `pageDesc`。
- `TRACE_PAGE_CONFIGS` 是独立新增配置，不扩展 / 合并进 `PAGE_CONFIGS`，只覆盖 `subPageNum=2..14` 对应的 13 个标准任务页。
- `TRACE_PAGE_CONFIGS` 以 `legacyPageId` 为主键，并提供 `standardPageId`、`pageIndex=1..13`、`pageType`、registry 引用、`lifecycleMode='l2-trace'`。
- 页面获取标准配置只能通过 helper，例如 `getTracePageConfigByLegacyPageId(pageId)`、`isTraceStandardPage(pageId)`；不得在页面里手写 `standardPageId` 或 page type。
- 测试必须断言 `PAGE_CONFIGS.length === 14`、`TRACE_PAGE_CONFIGS.length === 13`、每个 `TRACE_PAGE_CONFIGS[*].legacyPageId` 均能回查到 `PAGE_CONFIGS`，且 `intro_notice` 不存在于 `TRACE_PAGE_CONFIGS`。

`intro_notice` 处理：

- 不进入标准 13 页。
- 不参与 `field_registry_version`、`page_index=1..13` 合规校验。
- 继续只走 legacy / minimal 提交流程，可保留 `page_enter`、`checkbox_check`、`timer_complete`、`next_click` 等现有事件名；这些事件不进入 `validateTraceMark()`。
- 作为信息展示页保持隐藏导航 / 不加载子模块任务倒计时的策略；如果未来要求 `intro_notice` 也 L2 标准化，必须另开标准变更，不在本次 13 页标准中顺手扩展。
- 测试需要明确断言它不会被当成 L2 标准页。

Registry 边界：

- Field Registry 解释字段语义，页面事件只引用 `field_id`。
- Content Registry 解释 Page02 聊天气泡和材料内容，页面事件只引用 `content_id`。
- 香蕉专属内容放香蕉 registry；通用字段角色、页面类型和事件语义留共享层。
- contract 来源与同步规则遵循“权威源与同步约束”。

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

- `createTraceEvent()` / `TraceLogger.emit()`：生成单条 `TraceOperationDraft`，补齐 `trace_id`、ISO 毫秒时间、`page_id`、`page_type`、`metadata`；不分配 `code`，由现有 `logOperation()` 分配。
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
- 实施计划中加入 contract 同步校验，按“权威源与同步约束”处理差异。
- 完成前运行提交相关验证命令。

## 测试方案

共享层测试：

- L2 事件构造：`trace_id`、`code`、ISO 毫秒时间、`page_id`、`page_type`、`metadata` 注入。
- JSON Schema / registry 引用：事件结构、`field_id`、`content_id`、`question_id`、`option_id`、`row_id`。
- L2 生命周期模式：`usePageSubmission({ lifecycleMode: 'l2-trace' })` 不注入 `page_enter`、`next_click`、`page_exit`、独立 `flow_context`。
- value 传输边界：`operationList[*].value` 在 Mark 对象中保持对象，`submitPageMarkData()` 只 stringify 整个 `mark` 字段。
- Context 冲突回归：通过 `G8BananaBrowningContext.logOperation()` 写入 L2 事件后，`operations[]`、`buildMark()` 和 `createMarkObject()` 里的 `value` 仍为对象；legacy `normalizeOperationValueForAdapter()` 不得触达 L2 标准页事件。
- Collector 单测：文本 2000ms debounce / 10 字符 throttle、内容 500ms 曝光 / 300ms 滚动段、实验 1500ms 防双击、动态表格稳定 `row_id`。
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
- 后端权威 contract 与前端同步副本的维护流程。
- 蜂蜜黏度、蒸馒头迁移步骤。

完成工作后按项目规则更新：

- `docs/project_notes/issues.md`

## 后续实施入口

用户确认本设计文档后，进入 `superpowers:writing-plans`，生成可执行的分步实施计划。实施计划必须先处理共享事件层和测试夹具，再迁移香蕉页面，最后补齐工程标准文档与验证。
