---
title: cp science inquiry experiment implementation handbook
type: documentation
status: verified
source: design
last_verified: 2026-06-14
standard_id: standard-submodule
standard_version: v1.0
profile_id: science-inquiry-experiment
profile_version: v1.0
source_refs:
  - 'D:\myproject\assessment-platform-kb\标准\子模块构建标准\science-inquiry-experiment-profile-v1.0.md'
  - 'D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\00-requirement-brief.md'
  - 'D:\myproject\assessment-platform-kb\需求\2026-06-07-standard-submodule-construction-v1\repo-cp.md'
  - 'D:\myproject\cp-banana-trace-standardization\docs\superpowers\specs\2026-06-07-standard-submodule-construction-design.md'
  - 'D:\myproject\assessment-platform-kb\需求\2026-06-14-science-inquiry-trace-contract-v2-1\00-requirement-brief.md'
  - 'D:\myproject\assessment-platform-kb\需求\2026-06-14-science-inquiry-trace-contract-v2-1\repo-cp.md'
---

# Science Inquiry Experiment Handbook

This handbook adapts the KB `science-inquiry-experiment` `v1.0` profile for cp frontend implementation. It is a cp implementation guide, not the canonical profile.

## Profile Identity

- `standard_id`: `standard-submodule`
- `standard_version`: `v1.0`
- `profile_id`: `science-inquiry-experiment`
- `profile_version`: `v1.0`
- Golden reference: `src/submodules/g8-banana-browning-experiment/`
- Golden reference commit: `327e164f62d1e1fda76b34ac585e78ecf03f65af`

## Science Inquiry Page Types

This section mirrors a versioned summary from the KB profile.

The profile covers these page families or equivalent steps:

- Introduction or instruction page.
- Question generation page.
- Material/content reading page.
- Variable or factor selection page.
- Hypothesis or prediction page.
- Design-plan page.
- Simulation or experiment operation page.
- Evidence chart/table inspection page.
- Solution evaluation or selection page.
- Finish/submit page.

## Frontend Implementation Rules

- Model page facts first: page ID, page type, page index, content IDs, field IDs, and main instruction.
- Separate L1 behavior semantics from L2 event implementation.
- Emit L2 events only for frontend-observed engineering facts.
- Keep answer/scoring values in `answerList`; keep trace evidence in `operationList`.
- Use the shared frame/submission path rather than direct API calls.
- Use trace contracts and registries as runtime authority for event/field/content shape.
- Treat L2-to-L3 tagging as backend responsibility.

## Representative Banana Coverage

Use the banana submodule as a map, not as text to copy:

- Page02 (`Page02BananaBrowning.tsx`): question generation, active material/chat evidence, and idle behavior.
- Page04 (`Page04BananaBrowningReading.tsx`): material reading, factor selection, and content/field registry alignment.
- Page06 and Page07 (`Page06BananaBrowningDesign.tsx`, `Page07BananaBrowningEvaluation.tsx`): long text collection and text focus/change/blur boundaries.
- Page09 to Page12: simulation operation, simulation questions, data/evidence inspection, and question-bound field bindings.
- Page13 (`Page13SolutionSelection.tsx`): solution selection evidence and reason text.
- Page14 (`Page14TaskCompletion.tsx`): finish/submit boundary and trace flush behavior.

Related local files:

- `src/submodules/g8-banana-browning-experiment/mapping.ts`
- `src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx`
- `src/submodules/g8-banana-browning-experiment/trace/fieldBindings.ts`
- `src/submodules/g8-banana-browning-experiment/trace/pageStartMetadata.ts`
- `src/submodules/g8-banana-browning-experiment/trace/useBananaTraceLogger.ts`
- `src/submodules/g8-banana-browning-experiment/__tests__/trace-acceptance.test.ts`

## Page Slice Build Order

For each page family:

1. Fill the page L0/L1 matrix.
2. Fill the L2 event matrix.
3. Register field/content IDs or map them to existing registries.
4. Implement the page UI and context updates.
5. Wire trace helpers through stable context operations.
6. Verify MarkObject `answerList`, `operationList`, and `flow_context`.
7. Add acceptance fixtures and tests.

## Profile Caveats

- This v1.0 profile is for science inquiry experiment submodules.
- Questionnaire-specific profile rules are intentionally out of scope.
- Backend quality diagnostics may report missing or low-quality L2 evidence, but cp must not fabricate frontend events to satisfy diagnostics.
- If a future submodule needs new standard semantics, create or use a KB requirement/change-id before changing cp docs alone.

## 13-Page Trace Contract（跨库需求 2026-06-14-science-inquiry-trace-contract-v2-1 增补）

> 注：change id 中的 "v2-1" 指需求包版本，cp runtime authority 版本为 v2.2（KB canonical 仍 v2.1）。两者是不同维度。

本节由跨库需求 `2026-06-14-science-inquiry-trace-contract-v2-1` 增补，建立科学探究 13 页同构任务的两层标准契约与逐页确认门禁。详见 cp OpenSpec change `science-inquiry-trace-contract-v2-1`。

### 两层标准契约

- **第一层 `page_type_contract`（类型级，8 份）**：位于 `docs/子模块数据上报规范/page_type_contracts/`。每份定义一种 page_type 的页面族、字段角色（field_role）、必采/可选 L2 事件、registry 约束和验收模式。这是本轮标准沉淀的核心，不是为 13 页重复写 13 份规则。
- **第二层 `page_instance_confirmation`（实例级，13 页）**：模板位于 `docs/standard-submodule/templates/page-instance-confirmation.md`；实例产物位于 `docs/standard-submodule/page-confirmations/<moduleId>/page_NN.md`。每页一条，绑定到 page_type_contract，记录实际 page_id/content+field+option+param 映射、variance_report.level（V0/V1/V2/V3）、用户确认状态。
- **事件矩阵**：`docs/子模块数据上报规范/page-type-event-matrix.md`（8×28 总表），是 8 份 page_type_contract 的可审计索引，填补 `TRACE_PAGE_CONFIGS` 只有 requiredFields 无事件矩阵的代码缺口。

### 实施前检查清单（Definition of Ready）

科学探究类模块（蜂蜜黏度、蒸馒头等同构主题）进入代码实施前，必须满足：

- [ ] 13 页 page_instance_confirmation 全部存在（`docs/standard-submodule/page-confirmations/<moduleId>/page_01.md` … `page_13.md`）。
- [ ] 每页 `user_confirmation_status: approved`。未 approved 的页面不得进入代码实现。
- [ ] 每页显式声明 page_type 归属与 variance_report.level（V0/V1 可批量审核，但仍需逐页列出 type + level）。
- [ ] 所有 V2/V3 差异已用户确认或拆分为标准升级需求（V2 单页沟通并阻断实施；V3 阻断并升级 KB 标准或另建需求）。
- [ ] Field Registry / Content Registry / rule_config / acceptance cases 的来源和版本已记录（模块 content_registry 已生成或同步）。
- [ ] cp 对事件 schema 和 registry hash 的自检方式已明确（contracts v2.2 自检副本 + START_PAGE 7-literal hash bond）。

banana golden reference 范例确认包位于 `docs/standard-submodule/page-confirmations/g8-banana-browning-experiment/`，13 页均为 V0，可作为后续模块的参照样本。

### 命名规范（代码事实优先）

> **KB canonical 现状声明**：KB canonical 标准当前仍是 trace_contract_version v2.1（`assessment-platform-kb/标准/子模块构建标准/standard-sync-manifest.md:18`），标准正文仍使用旧 page_type 名（如 `B2_TEXT_MULTI`）。cp 在本轮以 v2.2 为 runtime 权威、以代码命名为准，**在 KB 同步完成前自称 implementation-local draft，不自称标准 canonical**。KB 同步（版本升级 v2.2 + 命名修订 + page_type_contract 概念吸收）为 closeout 回传项，由 KB 主 session 处理。详见 engineering_contracts/README.md 的"版本权威源现状与 cp 立场"。

- **page_type 命名以 cp 代码为准**：`A1_FLOW` / `B1_TEXT_SINGLE` / `B2_TEXT_MULTI_PARALLEL` / `B3_TEXT_MATRIX_EVALUATION` / `C1_INFO_SELECTION` / `D1_SIMULATION_ONLY` / `D2_SIMULATION_QUESTION` / `E1_CHART_PLAN_DECISION`（见 `src/submodules/g8-banana-browning-experiment/mapping.ts` 的 `TracePageType` 与 `event_schema.v2.2.json` 的 `page_type` 枚举）。
- **standardPageId 命名同样以代码为准**：如 `page_01_intro` / `page_04_transition` / `page_06_method_evaluation` / `page_07_experiment_intro` / `page_08_simulation_explore` / `page_09_experiment_question_1` / `page_13_task_finish`（见 `field_registry.v2.2.json` 的 `pages` 键）。
- KB 草案 §4 中的简写（page_type `B2_TEXT_MULTI` / `B3_METHOD_EVALUATION` / `E1_SOLUTION_SELECTION`；page_id `page_01_background` 等）视为待修订笔误，作为跨库需求回传项（见 design.md Conflicts 表 C1/C5）。
- 字段角色（field_role）只表达结构槽位，**不含主题词**（banana/honey/steamed-bread）。主题内容只能进入模块配置、`display_name`、Content Registry。

### 术语映射表

落地 `confirmed-decisions.md` D6（L0 Raw Event 改名）与 D8（香蕉 v2.1 标准核查）。

| v2.1 文档旧术语 | 本轮 cp runtime 术语 | 处理 |
|----------------|------------------|------|
| L0 原始日志 | 原始前端信号 / Raw Frontend Signal | 不再作为 L0；避免与 L0 页面事实冲突 |
| L1 控件字典 / UI 约束 | 控件/字段映射与 registry 约束 | 归入 page_instance_confirmation 与 registry planning |
| L1.5 字段注册表 `field_manifest` | Field Registry | 前端与下游共享的结构语义；存储后端不解释 |
| L2 标准事件 | L2 标准事件 | 保持 |
| L3 行为标签 | 下游 L3 行为标签 | 非前端、非存储后端责任边界 |

### L2 中性事件边界

- cp 前端**只上报 28 个中性 L2 事件**（`L2TraceEventType` 冻结集合），不上报 L3 行为标签、HMM/Viterbi 观测、L4 特征、评分或能力判断。
- L1 可观察行为语义用中性动词（`content_area_enter` / `content_hover` / `content_exposed` / `scroll_segment` / `initial_idle_interval` / `field_focus` / `text_change` / `field_blur`），**不断言"阅读/理解/思考/犹豫"**。
- `READ_*` / `REVIEW_*` / `GENERATE_THINK` / `DEEP_READ` / `ARGUMENTATION` 等推断性标签只能作为下游分析/打标管线的 L3 候选标签，**不得由 cp 生成**。
- `PAGE_IDLE` 只由可见+聚焦+无有效交互超过阈值（`pageIdleThresholdMs`=5000）聚合生成，禁止轮询/逐秒/mousemove。
- 校验由 `validateTraceMark.ts` 承担（`LEGACY_EVENT_TYPES` 黑名单拒绝 13 个旧动词 + START_PAGE 7-literal registry hash bond）。

### Contracts v2.2 自检

- 本轮 cp runtime authority 合同版本为 v2.2（KB canonical 当前仍是 v2.1，cp 在 KB 同步完成前自称 implementation-local draft；KB 同步为 closeout 回传项，详见 engineering_contracts/README.md "版本权威源现状与 cp 立场"）。cp 自检副本 `src/shared/services/submission/trace/contracts/*.v2.2.json`，文档镜像 `docs/子模块数据上报规范/engineering_contracts/*.v2.2.json`，由 contracts-sync 测试保持字节级同步。
- 每个 `START_PAGE.value.metadata` 必须声明 7 个 registry literal：`schema_version`、`field_registry_version`、`field_registry_hash`、`content_registry_version`、`content_registry_hash`、`rule_config_version`、`rule_config_hash`。
- v2.1 contracts 保留为历史迁移证据（deprecated），不作为 cp runtime 入口。
- cp 不直接依赖桌面研究目录 `D:/chenx/Desktop/轨迹上报标准及打标规范研究/engineering_contracts/`。
