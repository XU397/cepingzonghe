## 2026-04-08 代表性提交流程研究

- 研究范围：`g8-drone-imaging`、`g8-pv-sand-experiment`、`g8-mikania-experiment`。
- 使用原则：这些例子用于说明“推荐实现方式/现实偏差”，不直接等同于最终规范。

### 代表性示例 1：`g8-drone-imaging` 的自动 `flow_context` + 实验历史

- `flow_context` 来源：`src/submodules/g8-drone-imaging/context/DroneImagingContext.tsx:263-288` 通过共享 `useOperationLogger` 传入 `flowContext`；`src/submodules/g8-drone-imaging/Component.tsx:224-237` 在 `useLayoutEffect` 中自动记录 `page_enter`。
- 提交构建：`src/submodules/g8-drone-imaging/Component.tsx:290-322`。关键点：
  - `pageNumber = encodeCompositePageNum(stepIndex + 1, subPageNum)`
  - `operationList = normalizeOperationCodes(operations)`（提交前重新顺序化 code）
  - `experiment_free` 页面会把 `experimentState.captureHistory` 追加进 `answerList`，target 为 `P{pageNumber}_experiment_captures`（`Component.tsx:296-300`）
- 快照证据：
  - `src/submodules/g8-drone-imaging/__tests__/submission.snapshot.test.ts:140-171`：`flow_context` 紧跟 `page_enter`
  - `src/submodules/g8-drone-imaging/__tests__/submission.snapshot.test.ts:281-350`：`experiment_free` 输出 `page_enter -> flow_context -> simulation_operation`，并追加 `code=100` 的实验历史

### 代表性示例 2：`g8-pv-sand-experiment` 的 Context 注入式 `flow_context` + 单次实验历史

- `flow_context` 注入位置：`src/submodules/g8-pv-sand-experiment/context/PvSandContext.tsx:246-314`。
  - 在首个 `PAGE_ENTER` 后检查 `shouldInjectFlowContext(...)`
  - 用 `injectFlowContext(...)` 注入 `flow_context`
  - 使用 `flowContextInjectedRef` 避免同页重复注入
- 提交构建：`src/submodules/g8-pv-sand-experiment/Component.tsx:212-234,260-275`。关键点：
  - 先把内部答案键映射到规范键（`INTERNAL_TO_STANDARD_KEY`）
  - `experiment_task1/experiment_task2` 且存在 `experimentState.collectedData` 时，追加 `P{pageNumber}_实验历史`
  - `operationList` 使用 `operationsForSubmission`，即按 `currentPageId` 过滤后的当前页操作
- 快照证据：
  - `src/submodules/g8-pv-sand-experiment/__tests__/submission.snapshot.test.ts:123-197`：`experiment_design` 页面包含 `page_enter -> flow_context -> input_change`
  - `src/submodules/g8-pv-sand-experiment/__tests__/submission.snapshot.test.ts:201-317`：`experiment_task1` 页面输出 `code=2` 的题目答案 + `code=100` 的单次实验历史对象

### 代表性示例 3：`g8-mikania-experiment` 的 Reducer 注入式 `flow_context` + `runs[]` 历史包装

- `flow_context` 注入位置：`src/submodules/g8-mikania-experiment/Component.jsx:261-295`。
  - Reducer 在 `LOG_OPERATION` 分支内识别 `PAGE_ENTER`
  - 满足条件时调用 `injectFlowContext(...)`
  - `flowContextInjected` 标志随页面切换重置（`Component.jsx:227-234`）
- 提交构建：`src/submodules/g8-mikania-experiment/Component.jsx:410-437,453-476`。关键点：
  - `page_03_sim_exp` 会把 `state.experimentState.history` 包装成 `{ runs: [...] }`
  - 然后以 `P{pageNumber}_实验历史` 追加到 `answerList`
  - `buildMark` 只检查并告警 `flow_context` 是否缺失，不在提交阶段补救
- 快照证据：
  - `src/submodules/g8-mikania-experiment/__tests__/submission.snapshot.test.ts:152-204`：`page_03_sim_exp` 输出 `code=100` 的 `{"runs":[...]}` 历史结构，`pageDesc` 带 flow 前缀

### 可直接登记的偏差线索

- `imgList` 字段不一致：
  - `g8-drone-imaging` 的 `buildMark` 未返回 `imgList`（`Component.tsx:315-322`）
  - `g8-pv-sand-experiment`、`g8-mikania-experiment` 都显式返回 `imgList: []`（分别见 `Component.tsx:268-275`、`Component.jsx:468-476`）
- `operation.code` 生成时机不一致：
  - `g8-drone-imaging` 在提交时统一 `normalizeOperationCodes(...)` 重排（`Component.tsx:98-103,292`）
  - `g8-pv-sand-experiment`、`g8-mikania-experiment` 在记录操作时就分配 code（`PvSandContext.tsx:246-259`、`Component.jsx:720-730`）
- `flow_context` 注入层级不一致：
  - Drone：共享 `useOperationLogger`
  - PvSand：Context `logOperation`
  - Mikania：Reducer `LOG_OPERATION`
- 实验历史值结构不一致：
  - Drone：直接数组 `captureHistory`（快照 `[{height,...}]`）
  - PvSand：单个对象 `collectedData`
  - Mikania：对象包装 `{ runs: [...] }`
- `moduleName` 语义不一致：
  - Drone 默认回退为英文 slug `g8-drone-imaging`（`Component.tsx:87-96`）
  - PvSand 固定中文名 `光伏治沙实验`（`Component.tsx:249-257` / `PvSandContext.tsx:282-288`）
  - Mikania 默认展示名 `薇甘菊防治实验`（`Component.jsx:46,479-486`）
- 生命周期操作的 `targetElement` 口径存在差异：
  - Drone 快照中 `page_enter.targetElement = "page"`
  - PvSand 快照中 `page_enter.targetElement = "P1.03_页面"` / `P1.05_页面`
  - 这是可登记的现实偏差，后续规范需明确是否允许保留字目标元素

## 2026-04-08 payload research

- 最终提交分两层：先由 `createSubmissionPayload()` 组装 `{ batchCode, examNo, mark }`，再由 `submitPageMarkData()` 转成 `FormData(batchCode, examNo, mark=JSON.stringify(orderMarkFields(filterEmojiDeep(mark))))`；`mark` 在入网前会做 emoji 过滤和字段顺序固定。来源：`src/shared/services/dataLogger.js:17-22`，`src/shared/services/apiService.js:63-88`，`src/shared/services/submission/createMarkObject.js:63-75`。
- `pageNumber` 现状是优先用 `stepIndex + subPageNum` 编码成 `X.YY`，其次回退 `mark/pageMeta`，最后硬回退 `1.01`；schema 已强制只接受新格式，因此“新格式非空”可提升为 MUST，而“缺失时默认 1.01”只能记现状。来源：`src/shared/services/submission/usePageSubmission.js:126-147`，`690-695`，`src/shared/services/submission/schema.ts:112-123`，`234-242`，`src/shared/utils/pageMapping.ts:183-192`。
- `pageDesc` 现状是 `mark.pageDesc -> meta.pageDesc -> meta.pageTitle -> 未命名页面`，且有 flow 信息时会自动拼 `[flow/submodule/step] ` 前缀；schema 只要求非空字符串，因此“非空”可提升为 MUST，前缀策略和 `未命名页面` 兜底更适合作为现状/SHOULD。来源：`src/shared/services/submission/usePageSubmission.js:149-192`，`732-748`，`src/shared/services/submission/schema.ts:243-245`。
- `operationList` 现状会补 lifecycle 事件、必要时插入 `flow_context`、为 targetElement 打 `P<pageNumber>_` 前缀、重新顺序编号，并由 schema 强校验事件白名单、必需事件、targetElement 规则、输入类 value 结构与时间格式；这部分大多可直接沉淀为 MUST，但 `flow_context` 的插入位置/时间偏移、timeout 自动补事件属于实现细节。来源：`src/shared/services/submission/usePageSubmission.js:194-234`，`310-405`，`407-418`，`496-557`，`743-757`，`src/shared/services/submission/schema.ts:35-63`，`125-214`，`246-262`，`281-294`。
- `answerList` 现状会过滤空答案、补 target 前缀、顺序编号；schema 允许空数组，但若存在元素则要求 `code` 连续、`targetElement` 合法、`value` trim 后非空。可提升为 MUST 的是“元素级合法性”；timeout 自动补“超时未回答”仅能记现状。来源：`src/shared/services/submission/usePageSubmission.js:236-308`，`354-360`，`420-425`，`715-760`，`src/shared/services/submission/schema.ts:216-232`，`251-260`，`329-330`。
- `beginTime/endTime` 现状缺失时自动补当前时间，最终通常格式化为 `YYYY-MM-DD HH:mm:ss`；schema 同时接受该格式与 ISO 8601，因此“字段必填+时间合法”可提升为 MUST，“兼容 ISO 8601”更适合作为兼容现状记录。`imgList` 现状仅保证始终存在且为数组，默认空数组，没有元素级 schema，适合作为 MUST 的只有“必须是数组”。来源：`src/shared/services/submission/usePageSubmission.js:683-688`，`src/shared/services/submission/createMarkObject.js:24-29`，`53-60`，`125-140`，`src/shared/services/submission/schema.ts:48-50`，`135-139`，`254-256`。

## 2026-04-08 submoduleAdapter 现状矩阵

- 入口 `submoduleAdapter/index.ts` 当前是混合 barrel：既导出标准运行时能力，也导出兼容别名和测试/CI guard。目标文档必须分层，不然容易把 legacy alias 当成标准接入面。
- `useOperationLogger` 只是 `useStableOperationLogger` 的兼容别名，但运行时消费者仍常用旧名；目标态应以 `useStableOperationLogger` 为标准。
- `validateMarkBeforeSubmit` 当前只见测试调用，尚未进入统一提交必经路径；规则成熟，接入位置仍属现状偏差。

### adapter 模块矩阵

- `constants.ts`
  - 导出：`RESERVED_ELEMENTS` / `DEFAULTS` / `isReservedElement(element)`
  - 输入：元素名字符串
  - 输出：保留元素判断与默认校验规则
  - 调用时机：operation 记日志前判定是否跳过前缀；mark 校验时豁免保留元素
  - 评估：**MUST**，应作为 targetElement 规则单一真相源

- `types.ts`
  - 导出：`Operation`、`AnswerEntry`、`MarkObject`、`FlowContext`、`SubmoduleMappingConfig` 等全部 adapter 契约
  - 输入/输出：类型层，无运行时逻辑
  - 调用时机：子模块 mapping、logger、validator、测试统一约束
  - 评估：**MUST**，目标态 contract 层

- `usePageMeta.ts`
  - 导出：`usePageMeta(stepIndex, subPageNum)`
  - 输入：stepIndex、subPageNum
  - 输出：`{ pageNumber, targetPrefix, prefixTarget }`
  - 调用时机：页面装配阶段先求复合页码与前缀；当前主要见于 `src/modules/grade-7/adapter.ts`
  - 评估：**MUST（能力）**；但“必须以该 Hook 形式使用”不是 MUST，当前未成所有标准子模块统一入口，属现状偏弱

- `useStableOperationLogger.ts`
  - 导出：`useStableOperationLogger(options)` / `useOperationLoggerTemplate(options)`
  - 输入：`{ pageNumber, targetPrefix, flowContext? }`
  - 输出：`{ operations, logOperation, clearOperations, currentCode }`
  - 调用时机：子模块 context 初始化；所有 page_enter/点击/输入日志均经过它；首个 `page_enter` 后自动注入 `flow_context`
  - 评估：**MUST**，这是最接近目标态的标准 logger

- `useOperationLogger.ts`
  - 导出：`useOperationLogger(options)`
  - 输入/输出：同 stable logger
  - 调用时机：现有消费者通过旧名接入（如 `g8-drone-imaging`）
  - 评估：**遗留偏差**，应保留兼容说明，但不应继续作为目标态首选 API

- `operationSequence.ts`
  - 导出：`createOperationSequence()`
  - 输入：无
  - 输出：`{ next, reset, current }`
  - 调用时机：logger 初始化分配 code；页切换/reset 时归零
  - 评估：**MUST**，保证 operation code 从 1 开始且连续

- `pageStateReset.ts`
  - 导出：`createPageStateResetter(sequence, setFlowContextInjected?)`
  - 输入：序列器、可选 flow_context 标记 setter
  - 输出：`resetPageState(options?)`
  - 调用时机：页面切换或提交后清空 operation，并重置 flow_context 注入状态
  - 评估：**MUST**，页级 reset 必须统一处理 code 与 flow_context 状态

- `flowContextInjector.ts`
  - 导出：`injectFlowContext(...)` / `shouldInjectFlowContext(...)` / `MissingPageEnterError`
  - 输入：operations、flowContext、sequence、可选 timestamp/allowMissingPageEnter
  - 输出：插入 `flow_context` 后的新 operations / 是否需要注入
  - 调用时机：Flow 场景首次 `page_enter` 后立刻注入；也被个别子模块手动复用
  - 评估：**MUST**，Flow 子模块必须满足 `page_enter -> flow_context -> 业务操作`
  - 偏差点：`moduleName`、`pageId` 仍可选，属于兼容旧代码的宽口径

- `collectAnswers.ts`
  - 导出：`collectAnswers(pageId, answers, config)`
  - 输入：pageId、页级 answers record、`SubmoduleMappingConfig`
  - 输出：标准化 `AnswerEntry[]`
  - 调用时机：通常在 `buildMark` 提交前，按当前页问题清单生成 `answerList`
  - 评估：**MUST**，目标态必须坚持 mapping 驱动 answerList，而不是页面手写

- `buildPageDesc.ts`
  - 导出：`buildPageDesc(pageTitle, flowContext?)`
  - 输入：页面标题、可选 flowContext
  - 输出：原标题或 `[flowId/submoduleId/stepIndex] title`
  - 调用时机：构建 mark 时生成 `pageDesc`
  - 评估：**MUST（能力）**，统一 pageDesc 构造应上升为标准；当前实现本身较轻量

- `appendExperimentHistory.ts`
  - 导出：`appendExperimentHistory(answerList, data, { targetElement, historyCodeBase })`
  - 输入：已有 answerList、实验历史数据、附加配置
  - 输出：追加 1 条 history answer 后的新 answerList
  - 调用时机：实验页 `buildMark` 末尾、submit 前，将 capture/history 归档进 answerList
  - 评估：**实验子模块 SHOULD→推荐 MUST**；对实验轨迹页应统一使用，对纯问卷页不是通用 MUST

- `validateMark.ts`
  - 导出：`validateMarkBeforeSubmit(mark, flowContext?)`
  - 输入：`MarkObject`、可选 `FlowContext`
  - 输出：`{ valid, errors, warnings }`
  - 调用时机：当前主要在测试/研究阶段校验页码、前缀、code、必需事件、时间区间
  - 评估：**目标态 SHOULD / 当前遗留偏差**，规则已接近目标态 guard，但尚未接到统一提交必经链路

- `validateMappingConfig.ts`
  - 导出：`validateMappingConfig(config)`
  - 输入：`Partial<SubmoduleMappingConfig>`
  - 输出：`{ valid, errors }`
  - 调用时机：当前主要在 mapping 测试与合规校验中执行
  - 评估：**MUST（开发/CI 层）**，应明确属于开发期 guard，而非运行时用户路径

- `index.ts`
  - 导出：聚合以上模块
  - 输入/输出：adapter 公共 API surface
  - 调用时机：子模块与 legacy adapter 从 barrel import
  - 评估：**MUST**，但文档需显式区分“标准接口 / 兼容别名 / guard 工具”

### 适合提升为目标态 MUST 的行为

- mapping 驱动 `answerList` 生成（`collectAnswers`）
- 统一派生复合页码与 `P{pageNumber}_` 前缀（`usePageMeta`/page mapping helper）
- operation code 从 1 开始且连续（`operationSequence`）
- 页切换后 reset code 与 flow_context 注入状态（`pageStateReset`）
- Flow 场景首个 `page_enter` 后立即注入 `flow_context`（`flowContextInjector`/stable logger）
- `pageDesc` 经共享 helper 构造（`buildPageDesc`）
- 实验历史通过共享 helper 追加到 `answerList`（`appendExperimentHistory`，限实验页）
- mapping 配置经共享校验器过检（`validateMappingConfig`，开发/CI 层）

### 应登记为遗留偏差

- 旧名 `useOperationLogger` 仍被主流程消费
- `validateMarkBeforeSubmit` 未进入统一 submit 必经路径
- `usePageMeta` 未成为所有标准子模块统一接入面
- `FlowContext.moduleName/pageId` 仍为可选兼容字段
- 前缀不匹配目前仅 warning，不阻断
- barrel export 混合标准 API、兼容别名、guard 工具，需文档分层
## 2026-04-08 代表性提交流程研究

- 研究范围：、、。
- 使用原则：这些例子用于说明“推荐实现方式/现实偏差”，不直接等同于最终规范。

### 代表性示例 1： 的自动  + 实验历史

-  来源： 通过共享  传入 ； 在  中自动记录 。
- 提交构建：。关键点：
  - 
  - （提交前重新顺序化 code）
  -  页面会把  追加进 ，target 为 （）
- 快照证据：
  - ： 紧跟 
  - ： 输出 ，并追加  的实验历史

### 代表性示例 2： 的 Context 注入式  + 单次实验历史

-  注入位置：。
  - 在首个  后检查 
  - 用  注入 
  - 使用  避免同页重复注入
- 提交构建：。关键点：
  - 先把内部答案键映射到规范键（）
  -  且存在  时，追加 
  -  使用 ，即按  过滤后的当前页操作
- 快照证据：
  - ： 页面包含 
  - ： 页面输出  的题目答案 +  的单次实验历史对象

### 代表性示例 3： 的 Reducer 注入式  +  历史包装

-  注入位置：。
  - Reducer 在  分支内识别 
  - 满足条件时调用 
  -  标志随页面切换重置（）
- 提交构建：。关键点：
  -  会把  包装成 
  - 然后以  追加到 
  -  只检查并告警  是否缺失，不在提交阶段补救
- 快照证据：
  - ： 输出  的  历史结构， 带 flow 前缀

### 可直接登记的偏差线索

-  字段不一致：
  -  的  未返回 （）
  - 、 都显式返回 （分别见 、）
-  生成时机不一致：
  -  在提交时统一  重排（）
  - 、 在记录操作时就分配 code（、）
-  注入层级不一致：
  - Drone：共享 
  - PvSand：Context 
  - Mikania：Reducer 
- 实验历史值结构不一致：
  - Drone：直接数组 （快照 ）
  - PvSand：单个对象 
  - Mikania：对象包装 
-  语义不一致：
  - Drone 默认回退为英文 slug （）
  - PvSand 固定中文名 （ / ）
  - Mikania 默认展示名 （）
- 生命周期操作的  口径存在差异：
  - Drone 快照中 
  - PvSand 快照中  / 
  - 这是可登记的现实偏差，后续规范需明确是否允许保留字目标元素

## 2026-04-08 T5: OpenSpec Current Specs 陈旧语义与旧引用盘点

### 盘点范围
- openspec/project.md
- openspec/specs/data-format/spec.md
- openspec/specs/submission/spec.md
- openspec/specs/flow/spec.md
- openspec/specs/ui-frame/spec.md

### stale-format（旧格式示例，易误导新开发者）

| # | 文件 | 行 | 原文 | 问题 | 推荐替换 |
|---|------|-----|------|------|----------|
| F1 | project.md | 15 | `M2:11` 或 `2.11` 表示"第2个子模块的第11页" | `M2:11` 已被 data-format 禁止新生成；`2.11` 缺零填充语义提示（11 不需填充，但页码 <10 时格式为 `2.01` 而非 `2.1`，示例未体现） | `1.01`、`1.10`、`2.03`（使用 encodeCompositePageNum 生成的标准格式），并注明"禁止新生成 M* 或 0.* 格式" |

注：data-format/spec.md:20-21 和 flow/spec.md:61 中对旧格式的引用属于"禁止条款"语境，本身合理，不列为 stale。

### stale-ref（失效或冗余引用）

| # | 文件 | 行 | 原文 | 问题 | 推荐替换 |
|---|------|-----|------|------|----------|
| R1 | project.md | 69 | `（源：docs/data-format-specifications.md）` | `docs/data-format-specifications.md` 不存在 | 删除"源：docs/..."注释。data-format spec 本身已是权威来源，无需回指已删除的旧文档 |
| R2 | project.md | 70 | `（源：docs/session-and-cookie-policy.md）` | `docs/session-and-cookie-policy.md` 不存在 | 删除"源：docs/..."注释 |
| R3 | data-format/spec.md | 103 | `参考文档：docs/data-format-specifications.md` | 文件不存在。data-format spec 自身已是权威来源 | 删除此行，或改为引用 submission/spec.md 等当前共存 spec |

注：`openspec/specs/assessment-core/spec.md` 文件存在，submission/spec.md:216 和 data-format/spec.md:104 的引用有效。

### stale-semantics（陈旧语义，易误导工作流执行）

| # | 文件 | 行 | 原文 | 问题 | 推荐替换 |
|---|------|-----|------|------|----------|
| S1 | project.md | 9 | `评测流（Flow）：若干子模块按顺序拼接形成的完整流程（未来能力，由提案引入）。` | Flow 已全面实现（FlowOrchestrator、CMI、FlowModule 等），不再是"未来能力" | `评测流（Flow）：由 FlowOrchestrator 驱动的子模块顺序编排能力，通过 CMI 接口动态加载子模块。` |
| S2 | flow/spec.md | 4 | `TBD - created by archiving change add-flow-orchestrator-and-cmi. Update Purpose after archive.` | Purpose 仍是 TBD 占位符，未更新 | 填充为：`本规格定义 Flow 编排系统的行为约束，包括 FlowDefinition/Progress 协议、子模块 CMI 接口、复合页码编码、提交流水线一致性及完成页渲染。` |
| S3 | ui-frame/spec.md | 4 | `TBD - created by archiving change add-unified-assessment-frame. Update Purpose after archive.` | Purpose 仍是 TBD 占位符 | 填充为：`本规格定义统一页面框架 AssessmentPageFrame 的行为，包括导航、计时、提交流水线、UserInfoBar 协同及过渡页。` |
| S4 | project.md | 33 | `使用统一的 pageInfoMapping/pageNumToPageIdMapping（或模块自有同等功能）` | 新子模块已不使用这些旧映射名，改用 mapping.ts 中的 SUBMODULE_MAPPING_CONFIG | 补充：`新子模块应使用 mapping.ts 中的 SUBMODULE_MAPPING_CONFIG 作为页面清单与题号映射的单一真相源。` |
| S5 | project.md | 47 | `提交协议：使用 submitPageMarkData(payload)，其中 payload = { batchCode, examNo, mark }` | 这是旧层 API。当前标准提交管道为 `usePageSubmission` → `createMarkObject` → `submitPageMarkData`；子模块不直接调用 submitPageMarkData | 更新为：`提交协议：子模块通过 usePageSubmission Hook 提交，由共享提交层统一编码 pageNumber/targetElement/time/code 并调用 POST /stu/saveHcMark。` |
| S6 | flow/spec.md:55 vs data-format/spec.md:14 | 55 / 14 | flow 用 `modulePageNum`，data-format 用 `subPageNum` | 术语不一致，虽值相同（都从 1 开始），但跨 spec 术语混用可能误导 | flow/spec.md:55 改为 `pageIndex = subPageNum` 以与 data-format/spec.md 统一；或在 flow spec 中注明 `modulePageNum 即 subPageNum` |

### 总计
- stale-format: 1 处（project.md:15）
- stale-ref: 3 处（project.md:69, project.md:70, data-format/spec.md:103）
- stale-semantics: 6 处（S1-S6）
- 合计: 10 处需更新

## 2026-04-08 T4: 文档引用盘点结果

### 盘点范围

5 个文件，排除 archive 和 `docs/子模块需求文档/**`。

新主文档：`docs/submission-spec.md`（尚未创建）
新偏差文档：`docs/submission-legacy-deviations.md`（尚未创建）
旧文档：`docs/submodule-submission-guidelines.md`（仍存在）

---

### 文件 1: AGENTS.md

#### 引用 1 — Documentation References 表格（L75）

- **当前文字**: `| **数据提交规范** | \`docs/submodule-submission-guidelines.md\` | operationList/answerList 格式、前缀规则、事件白名单、flow_context 注入 |`
- **类型**: 改路径 + 改措辞
- **推荐替换**: `| **数据提交规范（主文档）** | \`docs/submission-spec.md\` | 提交 payload 全字段规范、MUST/SHOULD 分级、lifecycle 事件 |`
- **需引入 deviations**: 是。紧接其后新增一行：`| **Legacy 偏差记录** | \`docs/submission-legacy-deviations.md\` | 现有子模块实现偏差、兼容策略、迁移注意事项 |`

#### 引用 2 — 子模块构建关键决策速查表（L175）

- **当前文字**: `| **数据提交规范** | \`docs/submodule-submission-guidelines.md\` | operationList/answerList 格式、前缀规则 |`
- **类型**: 改路径 + 改措辞
- **推荐替换**: `| **数据提交规范** | \`docs/submission-spec.md\` | 提交 payload 全字段 MUST/SHOULD 分级规范 |`
- **需引入 deviations**: 是。表格末尾新增一行：`| **Legacy 偏差** | \`docs/submission-legacy-deviations.md\` | 现有子模块实现与规范的已知偏差 |`

---

### 文件 2: docs/submodule-page-build-process.md

#### 引用 1 — 文件头部声明（L9）

- **当前文字**: `> **数据提交与格式规范以** \`docs/submodule-submission-guidelines.md\` **为唯一口径**；本文只补充"构建流程/拆分策略/验收方式"。`
- **类型**: 改路径 + 改措辞
- **推荐替换**: `> **数据提交与格式规范以** \`docs/submission-spec.md\` **为主文档**；Legacy 子模块的已知偏差见 \`docs/submission-legacy-deviations.md\`。本文只补充"构建流程/拆分策略/验收方式"。`
- **需引入 deviations**: 是，直接在替换中引入。

#### 引用 2 — Phase 0 最小事件集合（L102）

- **当前文字**: `- 明确每页的"最小事件集合"与特殊事件（以 \`docs/submodule-submission-guidelines.md\` 为准）。`
- **类型**: 改路径
- **推荐替换**: `- 明确每页的"最小事件集合"与特殊事件（以 \`docs/submission-spec.md\` 为准）。`
- **需引入 deviations**: 否（此处只是引用主文档的事件定义，不涉及偏差）。

#### 引用 3 — 版本一致性提醒（L239）

- **当前文字**: `- 本仓库存在"历史迁移文档/规范"的版本差异：遇到冲突时，以 \`docs/submodule-submission-guidelines.md\` 的规则为准。`
- **类型**: 改路径 + 改措辞（需要重新表述这段警示）
- **推荐替换**: `- 新旧文档关系：\`docs/submission-spec.md\` 是当前唯一主文档；已知实现偏差汇总在 \`docs/submission-legacy-deviations.md\`。旧文档 \`submodule-submission-guidelines.md\` 仅作历史参考，不再作为口径依据。`
- **需引入 deviations**: 是，直接在替换中引入。

#### 引用 4 — 第 4 节事件与答案落地约定（L266）

- **当前文字**: `> 详规见：\`docs/submodule-submission-guidelines.md\``
- **类型**: 改路径
- **推荐替换**: `> 详规见：\`docs/submission-spec.md\`；已知偏差见 \`docs/submission-legacy-deviations.md\`。`
- **需引入 deviations**: 是，补充偏差文档引用。

---

### 文件 3: docs/submodule-build-workflow.md

#### 引用 1 — 规范基准声明（L7）

- **当前文字**: `- 规范基准：\`docs/submodule-submission-guidelines.md\`（页码/前缀、operationList/answerList、usePageSubmission/buildMark、mapping.ts 常量、Context 稳定 logOperation、flow_context 注入等）。`
- **类型**: 改路径
- **推荐替换**: `- 规范基准：\`docs/submission-spec.md\`（页码/前缀、operationList/answerList、usePageSubmission/buildMark、mapping.ts 常量、Context 稳定 logOperation、flow_context 注入等）；现有实现偏差见 \`docs/submission-legacy-deviations.md\`。`
- **需引入 deviations**: 是。

#### 引用 2 — AI 可指导性评估（L64）

- **当前文字**: `- \`docs/submodule-submission-guidelines.md\` 对"**合规要求与接口契约**"描述很完整`
- **类型**: 改路径
- **推荐替换**: `- \`docs/submission-spec.md\` 对"**合规要求与接口契约**"描述很完整`
- **需引入 deviations**: 否（此处是评价主文档质量，不涉及偏差）。

#### 引用 3 — Legacy 迁移文档列表（L81）

- **当前文字**: `- \`docs/submodule-submission-guidelines.md\`（合规口径）`
- **类型**: 改路径 + 改措辞
- **推荐替换**: `- \`docs/submission-spec.md\`（合规口径），\`docs/submission-legacy-deviations.md\`（已知偏差）`
- **需引入 deviations**: 是，此处是迁移文档清单，需要同时引入两个新文档。

---

### 文件 4: docs/project_notes/key_facts.md

#### 引用 1 — 核心文档表格（L222）

- **当前文字**: `| **数据提交规范** | operationList/answerList 格式、前缀规则、事件白名单 | \`docs/submodule-submission-guidelines.md\` |`
- **类型**: 改路径 + 改措辞
- **推荐替换**: `| **数据提交规范（主文档）** | payload 全字段 MUST/SHOULD 分级、lifecycle 事件 | \`docs/submission-spec.md\` |`
- **需引入 deviations**: 是。表格末尾新增一行：`| **Legacy 偏差记录** | 现有子模块实现偏差与兼容策略 | \`docs/submission-legacy-deviations.md\` |`

---

### 文件 5: docs/project_notes/decisions.md

#### 引用 1 — ADR-002 Decision 正文（L92）

- **当前文字**: `- \`docs/submodule-submission-guidelines.md\` - 数据提交格式规范`
- **类型**: 改路径
- **推荐替换**: `- \`docs/submission-spec.md\` - 数据提交格式规范（主文档）`
- **需引入 deviations**: 否（ADR 正文记录历史决策，路径替换即可，不引入偏差。但可在列表末尾补充一行为佳：`- \`docs/submission-legacy-deviations.md\` - 现有实现与规范的已知偏差`）。

#### 引用 2 — References 节（L134）

- **当前文字**: `- **数据提交规范**: \`docs/submodule-submission-guidelines.md\``
- **类型**: 改路径
- **推荐替换**: `- **数据提交规范（主文档）**: \`docs/submission-spec.md\``
- **需引入 deviations**: 是。紧接其后新增一行：`- **Legacy 偏差记录**: \`docs/submission-legacy-deviations.md\``

---

### 汇总统计

- 5 个文件中共 **12 处** 引用旧文档 `submodule-submission-guidelines.md`
- 类型分布：改路径 = 12 处，改措辞 = 6 处（部分同时改路径+措辞）
- 需引入 `submission-legacy-deviations.md` 的位置：**10 处**
- 不需引入 deviations 的位置：2 处（build-workflow L64 纯评价、page-build-process L102 仅引用事件定义）

### 排除范围

- `openspec/changes/archive/**` — 4 处引用，归档不再维护
- `docs/子模块需求文档/**` — 1 处引用，排除
- `temp/plans/**` — 2 处引用，临时计划文件，排除

## 2026-04-08 T6: OpenSpec Active Changes 陈旧语义与旧引用盘点

### 盘点范围

5 个 active change 目录（不含 archive）：
- migrate-grade7-questionnaire-submission
- migrate-grade7-tracking-questionnaire-submission
- migrate-grade7-tracking-experiment-submission
- fix-submodule-flow-context-compliance
- migrate-g8-pv-sand-to-shared-utilities

---

### stale-ref（失效引用）

| # | 文件 | 行 | 原文/引用 | 问题 | 推荐 |
|---|------|-----|-----------|------|------|
| R1 | g7-q / migration-details.md:1153 | 附录 6.5 | `[数据格式规格](../../specs/data-format/spec.md)` | 路径正确 | ✅ 保留 |
| R2 | g7-q / migration-details.md:1154 | 附录 6.5 | `[提交流程规格](../../specs/submission/spec.md)` | 路径正确 | ✅ 保留 |
| R3 | g7-q / migration-details.md:1155 | 附录 6.5 | `[统一提交数据格式规范](../../../docs/submission-format-standard.md)` | 文件存在 | ✅ 保留 |
| R4 | g7-q / migration-details.md:1157 | 附录 6.5 | `[FLOW流程下pageNumber的提交规范](../../../docs/FLOW流程下pageNumber的提交规范.md)` | **文件不存在** | 删除此链接或改为引用 submission-spec.md |
| R5 | g7-q / migration-details.md:1158 | 附录 6.5 | `[问卷数据配置](../../src/utils/questionnaireData.js)` | 文件存在，但路径应使用别名 | 可保留，改为 `@/` 别名格式说明 |
| R6 | g7-q / migration-details.md:1159 | 附录 6.5 | `[页面映射配置](../../src/utils/pageMappings.js)` | 文件存在，但路径应使用别名 | 可保留，改为 `@/` 别名格式说明 |
| R7 | g7-q / migration-details.md:1051-1104 | 附录 6.3 | CMI 包装器路径 `src/modules/grade-7/submodules/g7-questionnaire.js` | **文件不存在**。实际子模块位于 `src/submodules/g7-questionnaire/` | 改为 `src/submodules/g7-questionnaire/` |
| R8 | g7-tq / migration-details.md:1064 | 附录 6.5 | `[FLOW流程下pageNumber的提交规范](...)` | **文件不存在**（同 R4） | 同 R4 |
| R9 | g7-tq / migration-details.md:962-1013 | 附录 6.3 | CMI 包装器路径 `src/modules/grade-7-tracking/submodules/g7-tracking-questionnaire.js` | **文件不存在**。实际位于 `src/submodules/g7-tracking-questionnaire/` | 改为 `src/submodules/g7-tracking-questionnaire/` |
| R10 | g7-te / migration-details.md:1074-1132 | 附录 7.4 | CMI 包装器路径 `src/modules/grade-7-tracking/submodules/g7-tracking-experiment.js` | **文件不存在**。实际位于 `src/submodules/g7-tracking-experiment/` | 改为 `src/submodules/g7-tracking-experiment/` |
| R11 | g7-te / migration-details.md:1181-1185 | 附录 7.6 | `[FLOW流程下pageNumber的提交规范](...)` | **文件不存在**（同 R4） | 同 R4 |
| R12 | fix-context / proposal.md:89 | 相关文档 | `openspec/changes/extract-operation-management-utilities/` | 该 change 已归档到 `archive/2025-12-10-extract-operation-management-utilities/` | 改为归档路径或删除 |
| R13 | migrate-g8-pv-sand / proposal.md:124 | Related | `openspec/changes/migrate-g8-mikania-to-shared-utilities/` | 该 change 已归档到 `archive/2025-12-11-migrate-g8-mikania-to-shared-utilities/` | 改为归档路径或删除 |
| R14 | g7-te / tasks.md:3 | 0.3 | `src/modules/grade-7-tracking/__tests__/fixtures/` | fixture 目录实际不存在（只有 `src/shared/services/submission/__tests__/fixtures/`） | 改为实际 fixture 路径 |

---

### stale-format（旧格式示例/不存在的测试 fixture 路径）

| # | 文件 | 行 | 原文 | 问题 | 推荐 |
|---|------|-----|------|------|------|
| F1 | g7-q / migration-details.md:635-643 | 3.1.2 | Fixture 路径 `src/shared/services/submission/__tests__/fixtures/g7-questionnaire/` | 该目录**不存在**，只有 `fixtures/submissionFixture.js` | 标注为"预期目录，待创建"；或改为引用实际 fixture 位置 |
| F2 | g7-tq / migration-details.md:564-571 | 3.1.2 | Fixture 路径 `...fixtures/g7-tracking-questionnaire/` | 同上，不存在 | 同 F1 |
| F3 | g7-te / migration-details.md:590-598 | 3.1.2 | Fixture 路径 `...fixtures/g7-tracking-experiment/` | 同上，不存在 | 同 F1 |
| F4 | g7-te / tasks.md:3 | 0.3 | `src/modules/grade-7-tracking/__tests__/fixtures/` | 该目录不存在 | 删除此行或改为实际路径 |
| F5 | g7-te / tasks.md:9 | 1.2 | pageDesc 前缀示例 `[grade-7-tracking/<stepIndex>/<pageNumber>] 标题` | 与 migration-details.md 统一的 `[flowId/submoduleId/stepIndex] 标题` 格式不一致 | 统一为 `[<flowId>/<submoduleId>/<stepIndex>] <title>` |

---

### stale-example（陈旧示例/与现有实现不符的示例代码）

| # | 文件 | 行 | 原文 | 问题 | 推荐 |
|---|------|-----|------|------|------|
| E1 | g7-q / migration-details.md:1051-1104 | 6.3 | CMI 包装器示例 `G7QuestionnaireSubmodule` 放在 `src/modules/grade-7/submodules/` | 示例路径错误。实际子模块在 `src/submodules/g7-questionnaire/`，且已存在 `index.jsx` / `Component.jsx` / `mapping.ts` | 替换示例路径为 `src/submodules/g7-questionnaire/`，并标注"仅供参考，以实际实现为准" |
| E2 | g7-tq / migration-details.md:962-1013 | 6.3 | CMI 包装器示例 `G7TrackingQuestionnaireSubmodule` 放在 `src/modules/grade-7-tracking/submodules/` | 同 E1，路径错误 | 同 E1 |
| E3 | g7-te / migration-details.md:1074-1132 | 7.4 | CMI 包装器示例 `G7TrackingExperimentSubmodule` 放在 `src/modules/grade-7-tracking/submodules/` | 同 E1，路径错误 | 同 E1 |
| E4 | g7-q / migration-details.md:1109-1148 | 6.4 | `import { encodeCompositePageNum, buildTargetElementPrefix, buildPageDescPrefix } from '@shared/utils/pageMapping'` | 这些函数名可能不完全匹配当前 `src/shared/utils/pageMapping.ts` 的实际导出 | 验证实际导出名，更新为匹配的函数签名 |
| E5 | fix-context / design.md:49 | 决策 1 | g7-experiment DISPLAY_NAME = `'蒸馒头实验'` | tasks.md:81 中已标注完成并使用 `'蒸馒头实验'`，需确认实际代码一致 | 如已实施则标注为已完成的历史记录 |

---

### 历史记录 vs 目标态指导区分

#### 历史记录（可加注保留，不需要更新）

1. **旧页码对照表（"旧页码"列）**：三个 migration-details 中的"旧页码"列（如 `20`-`28`、`14`-`21`、`M2:11`）是历史映射参考，描述"迁移前"状态。保留，可加注释：`> 注：旧页码为迁移前格式，仅供对照参考。`

2. **g7-te 的旧前缀格式**（`Page_*`、`M*`）：proposal.md:2 和 migration-details.md:774 中提到 `M2:11`、`Page_*` 等旧格式，作为"要迁移走"的标注，属于历史事实。保留。

3. **fix-context 的 tasks.md 全部 checkbox `[x]`**：表示所有任务已完成。这是已完成工作流的状态记录。保留。

4. **修订日志（v3.0）**：各 migration-details.md 底部的修订日志记录了文档演进历史。保留。

5. **fix-context design.md 的"当前状态对比"表**：准确描述了发现时的状态。保留。

#### 目标态指导（必须更新，会影响后续工作流消费）

1. **CMI 包装器示例代码路径**（R7/R9/R10/E1/E2/E3）：指向不存在的路径，后续实施者会按错误路径创建文件。**必须更新**为 `src/submodules/<submoduleId>/`。

2. **FLOW流程下pageNumber的提交规范链接**（R4/R8/R11）：指向不存在的文件。**必须删除或替换**。

3. **已归档 change 引用**（R12/R13）：`extract-operation-management-utilities` 和 `migrate-g8-mikania-to-shared-utilities` 已归档。**必须更新**为归档路径。

4. **tasks.md 中的 fixture 路径**（F4/R14）：指向不存在的测试目录。**必须更新或删除**。

5. **g7-te tasks.md 中的 pageDesc 前缀**（F5）：与 migration-details 的统一格式矛盾。**必须统一**为 `[<flowId>/<submoduleId>/<stepIndex>] <title>`。

6. **@shared/utils/pageMapping 函数名**（E4）：示例代码中引用的函数名需与实际导出一致。**必须验证并修正**。

---

### 总计

- stale-ref（失效引用）：14 处（R1-R14，其中 R1-R3/R5/R6 有效保留）
  - 需更新：**10 处**（R4, R7-R14）
- stale-format（旧格式/不存在路径）：5 处（F1-F5）
- stale-example（陈旧示例）：5 处（E1-E5）
- 历史记录（可加注保留）：5 类
- 目标态指导（必须更新）：6 类
