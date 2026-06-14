# science-inquiry-13page-trace-contract Specification

## Purpose
TBD - created by archiving change science-inquiry-trace-contract-v2-1. Update Purpose after archive.
## Requirements
### Requirement: Page Type Contract (Layer 1)

科学探究 13 页同构任务的每一页 MUST 归属到 8 种 page_type 之一（`A1_FLOW`、`B1_TEXT_SINGLE`、`B2_TEXT_MULTI_PARALLEL`、`B3_TEXT_MATRIX_EVALUATION`、`C1_INFO_SELECTION`、`D1_SIMULATION_ONLY`、`D2_SIMULATION_QUESTION`、`E1_CHART_PLAN_DECISION`）。每种 page_type MUST 拥有一份 page_type_contract，定义页面族、字段角色（field_role）、必采 L2 事件、可选 L2 事件、registry 约束和验收模式。page_type_contract MUST 只表达结构槽位与字段角色，SHALL NOT 绑定主题内容词（如 banana/honey/steamed-bread）；主题内容 MUST 进入模块配置、display_name、content_key 或 Content Registry。

page_type 命名 MUST 以 cp 当前代码事实为 canonical。`src/submodules/g8-banana-browning-experiment/mapping.ts` 的 `TracePageType` 与 `src/shared/services/submission/trace/contracts/event_schema.v2.2.json` 的 `page_type` 枚举 MUST 保持一致；任何与 KB 草案 §4 简写（`B2_TEXT_MULTI` / `B3_METHOD_EVALUATION` / `E1_SOLUTION_SELECTION`）的差异 MUST 按代码事实优先处理，并将草案命名作为 KB 修订回传项。

#### Scenario: 新建同构模块时每页必须绑定一个 page_type

- **WHEN** agent 为蜂蜜黏度或蒸馒头等同构模块起草 13 页拓扑
- **THEN** 每页 MUST 声明一个属于 8 种 canonical page_type 的归属
- **AND** SHALL NOT 引入 8 种之外的私有 page_type（如需新增 page_type 必须先升级 KB 标准，视为 V3 差异）

#### Scenario: page_type_contract 不含主题词

- **WHEN** 审查任意一份 page_type_contract
- **THEN** 字段角色（field_role）MUST 是结构槽位语义（如 `input_question_1`、`method_1_advantage`、`reason_text`）
- **AND** SHALL NOT 出现 banana/honey/steamed-bread/香蕉/蜂蜜/馒头等主题词

### Requirement: Page Instance Confirmation (Layer 2)

科学探究 13 页同构任务的每一页 MUST 在代码实施前拥有一份 `approved` 状态的 page_instance_confirmation。确认包 MUST 至少记录：`page_id`、`page_number`/`pageDesc`、绑定的 `page_type`、content/field/option/param 映射、`variance_report.level`、`user_confirmation_status`。`user_confirmation_status` 不是 `approved` 的页面 SHALL NOT 进入代码实现。

确认包 MUST 绑定到某个 page_type_contract，作为该契约的实例绑定与审计证据，SHALL NOT 重复定义类型级标准。V0/V1 确认包 MAY 批量审核，但 MUST 显式列出每个 page_id 的 page_type 归属和差异级别，SHALL NOT 因同属一个 page_type 而完全跳过页面级记录。

#### Scenario: 未确认页面不得实施

- **WHEN** agent 准备实现某一页代码但该页 page_instance_confirmation 的 `user_confirmation_status` 为 `pending`、`rejected` 或 `needs_revision`
- **THEN** 该页代码实施 MUST 被阻断
- **AND** 实施前置检查清单 MUST 报告未确认页面清单

#### Scenario: V1 主题替换不展开字段差异

- **WHEN** 某页 variance_report.level 为 V1（主题配置差异）
- **THEN** 确认包 MUST 用 `theme_substitutions` 或 Content Registry 映射表达差异
- **AND** MAY 不展开完整字段差异清单（字段角色与标准契约一致）

### Requirement: V0/V1/V2/V3 Variance Gating

每个 page_instance_confirmation MUST 声明 `variance_report.level`（V0/V1/V2/V3），无差异也 MUST 写 `V0`。分级 MUST 采用：V0=无差异；V1=主题配置差异；V2=结构差异；V3=标准破坏性差异。

V0/V1 MAY 批量审核但仍需用户确认；V2 MUST 单页沟通并阻断实施，确认扩展 registry/profile 后才能实施；V3 MUST 暂停实施，先升级 KB 标准或另建需求，SHALL NOT 在模块实施中绕过。差异项 MUST 至少覆盖：页面数量、页面顺序、页面类型、字段数量、必填性、选项数量、实验参数、图表/表格结构、事件字典、registry ID、验收预期。

#### Scenario: V2 差异阻断实施

- **WHEN** 某页 variance_report.level 为 V2（如字段数量、选项数量或实验参数与标准契约不同）
- **THEN** 该页 MUST 单页沟通确认并扩展 registry/profile 后才能实施
- **AND** SHALL NOT 静默降级为 V0/V1 直接实施

#### Scenario: V3 差异必须升级标准

- **WHEN** 某页 variance_report.level 为 V3（页面数量/顺序改变、事件字典不足、L2/L3 边界改变、需要新 page_type）
- **THEN** 该页 MUST 暂停实施
- **AND** MUST 先升级 KB 标准或创建新需求，SHALL NOT 在本模块实施中绕过

### Requirement: 13-Page Topology Mapping

科学探究 13 页同构任务 MUST 按以下标准拓扑映射到 page_type：Page01→`A1_FLOW`，Page02→`B1_TEXT_SINGLE`，Page03→`C1_INFO_SELECTION`，Page04→`A1_FLOW`，Page05→`B2_TEXT_MULTI_PARALLEL`，Page06→`B3_TEXT_MATRIX_EVALUATION`，Page07→`A1_FLOW`，Page08→`D1_SIMULATION_ONLY`，Page09→`D2_SIMULATION_QUESTION`，Page10→`D2_SIMULATION_QUESTION`，Page11→`D2_SIMULATION_QUESTION`，Page12→`E1_CHART_PLAN_DECISION`，Page13→`A1_FLOW`。

注意事项页 / 说明页（如 banana 的 `intro_notice`）SHALL NOT 计入 13 页 trace 拓扑；该类页面 MUST 以 `hidden` 导航模式承载，不加载 Flow 全局倒计时组件。

#### Scenario: 13 页全覆盖

- **WHEN** 审查任意科学探究同构模块的确认包集合
- **THEN** 13 个 page_instance_confirmation MUST 全部存在
- **AND** 每个 page_id 的 page_type MUST 与标准拓扑一致或显式记录 V2/V3 差异

#### Scenario: 注意事项页不计入 trace 拓扑

- **WHEN** 模块包含独立的注意事项/说明页（如 banana `intro_notice`）
- **THEN** 该页 MUST NOT 计入 13 页 trace 拓扑
- **AND** MUST 采用 `hidden` 导航模式且不加载子模块计时器

### Requirement: L2 Event Neutrality

cp 前端 MUST 只上报 28 个中性 L2 事件（`L2TraceEventType` 冻结集合：`START_PAGE`、`PAGE_HIDDEN`、`PAGE_VISIBLE`、`PAGE_IDLE`、`SUBMIT_ATTEMPT`、`TASK_FINISH`、`CONTENT_EXPOSE`、`CONTENT_ACTIVATE`、`CONTENT_VIEW`、`CHAT_SCROLL`、`CHAT_VIEWPORT_ENTER`、`CHAT_VIEWPORT_LEAVE`、`OPEN_MODAL`、`CLOSE_MODAL`、`CHART_HOVER`、`TEXT_FOCUS`、`TEXT_CHANGE`、`TEXT_BLUR`、`CHECKBOX_TOGGLE`、`SELECT_ANSWER`、`SET_EXP_PARAM`、`EXECUTE_EXP`、`RESET_EXP`、`ADD_ROW`、`DELETE_ROW`、`SET_PLAN_PARAM`、`SELECT_BEST`、`TIMER_COMPLETE`）。cp SHALL NOT 上报 L3 行为标签、HMM/Viterbi 观测、L4 特征、评分或能力判断。

L1 可观察行为语义 MUST 使用中性动词（如 `content_area_enter` / `content_hover` / `content_exposed` / `scroll_segment` / `initial_idle_interval` / `field_focus` / `text_change` / `field_blur`），SHALL NOT 直接断言"阅读""理解""思考""犹豫"。`READ_*` / `REVIEW_*` / `GENERATE_THINK` / `DEEP_READ` / `ARGUMENTATION` 等推断性标签 MUST 只作为下游分析/打标管线的 L3 候选标签或解释结果存在，SHALL NOT 由 cp 生成。`PAGE_IDLE` MUST 只由页面可见、窗口聚焦、无有效交互超过阈值的区间聚合生成，SHALL NOT 通过轮询、逐秒上报或 mousemove 生成。

#### Scenario: 前端不上报 L3 标签

- **WHEN** 审查 cp 生成的 MarkObject `operationList[*]`
- **THEN** 所有 `eventType` MUST 属于 28 个中性 L2 事件
- **AND** SHALL NOT 出现 THINK / SMART / DEEP_READ / READ_* / ARGUMENTATION / GENERATE_* 等推断性标签

#### Scenario: PAGE_IDLE 不轮询

- **WHEN** 审查 PAGE_IDLE 采集逻辑
- **THEN** PAGE_IDLE MUST 由可见+聚焦+无有效交互区间聚合生成
- **AND** SHALL NOT 使用 setInterval/setTimeout 轮询或记录高频 mousemove

### Requirement: Contract Self-Check Sync (v2.2 cp runtime authority)

cp MUST 以 contracts v2.2 作为 cp runtime authority 自检副本（**KB canonical 当前仍是 v2.1，cp 在 KB 同步完成前自称 implementation-local draft，不自称标准 canonical；KB 同步为 closeout 回传项**）。cp runtime 副本位置为 `src/shared/services/submission/trace/contracts/*.v2.2.json`；文档镜像位置为 `docs/子模块数据上报规范/engineering_contracts/*.v2.2.json`，二者 MUST 通过 contracts-sync 测试保持字节级同步。每个 `START_PAGE` 事件的 `value.metadata` MUST 声明 7 个 registry literal：`schema_version`、`field_registry_version`、`field_registry_hash`、`content_registry_version`、`content_registry_hash`、`rule_config_version`、`rule_config_hash`。

v2.1 contracts MUST 作为历史迁移证据保留，SHALL NOT 删除，MUST 标注为 deprecated，SHALL NOT 作为 cp runtime 入口。cp SHALL NOT 直接依赖桌面研究目录（`D:/chenx/Desktop/轨迹上报标准及打标规范研究/engineering_contracts/`）作为运行合同，该目录仅作为来源证据。

#### Scenario: START_PAGE 携带完整 registry 版本与 hash

- **WHEN** 审查任意 `START_PAGE` 事件的 `value.metadata`
- **THEN** 7 个 registry literal MUST 全部存在且与运行时常量（`contracts.ts`）精确相等
- **AND** validator MUST 在不等时拒绝该 MarkObject

#### Scenario: v2.1 保留为历史证据

- **WHEN** 检查 contracts 目录
- **THEN** v2.1 文件 MUST 保留存在
- **AND** MUST 标注为 deprecated 历史迁移证据
- **AND** SHALL NOT 被引用为 cp runtime 入口

### Requirement: Banana Golden Reference Stability

`g8-banana-browning-experiment` 的运行时 trace 资产（`trace/useBananaPageIdle.ts`、`trace/useBananaTraceLogger.ts`、`trace/useTracePageStart.ts`、`trace/useContentActivationTrace.ts`、`trace/fieldBindings.ts`、`trace/pageStartMetadata.ts`）MUST 在本轮保持稳定，作为 golden reference 不动。

通用 shared trace hooks / collectors 的提取（如 `usePageIdle` / `useTraceLogger` 通用化）SHALL NOT 在本轮实施，MUST 推迟到蜂蜜黏度或蒸馒头具体模块重构时作为该模块重构任务的一部分进行，且提取时 MUST 包含 banana 回归测试要求。

#### Scenario: 本轮不改动 banana runtime hooks

- **WHEN** 审查本轮 git diff
- **THEN** `src/submodules/g8-banana-browning-experiment/trace/*` 的运行时 hook 文件 MUST NOT 出现内容变更
- **AND** banana 现有测试 MUST 保持通过

### Requirement: cp Responsibility Boundary

cp MUST 只负责 L0 页面事实 / L1 可观察行为语义到 L2 标准事件的采集、registry ID 绑定、MarkObject 上报与前端验收自检。cp SHALL NOT 承担运行时 L2→L3 tagging、下游 schema/registry 语义校验、质量诊断、HMM/Viterbi sequence、L4 特征、评分或能力推断。

assessment-platform-backend 在本轮 MUST 仅作为存储后端保存 MarkObject / `operationList` 原始上报，SHALL NOT 被要求做 schema/registry 语义校验或 L2→L3 打标改造。若后续需要从 L2 生成 L3/L4/HMM/报告特征，MUST 另建下游分析/打标需求并明确 owner，SHALL NOT 在本提案中扩大范围。

#### Scenario: 需要后端 schema 变更时另建需求

- **WHEN** 实施过程中发现必须变更存储后端接口或要求后端做语义校验
- **THEN** 该变更 MUST 记录为新需求，SHALL NOT 在本提案范围内实施
- **AND** 本提案 MUST 保持 cp 独立可推进

#### Scenario: cp 不生成能力判断

- **WHEN** 审查 cp 输出的 MarkObject
- **THEN** MUST 只包含 L2 standard events 和结构化 metadata
- **AND** SHALL NOT 包含 L3 行为标签、L4 特征、评分结果或能力判断字段

