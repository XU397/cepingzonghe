## Context

本设计为 cp 仓库级 OpenSpec 提案，承接跨库需求 `2026-06-14-science-inquiry-trace-contract-v2-1`。技术路线由 cp 在 `$opsx-propose` 阶段根据本地代码自行决定，本文为该决定的落地设计。

### Source links

- [需求简报 00-requirement-brief.md](D:/myproject/assessment-platform-kb/需求/2026-06-14-science-inquiry-trace-contract-v2-1/00-requirement-brief.md)
- [已确认决策 confirmed-decisions.md](D:/myproject/assessment-platform-kb/需求/2026-06-14-science-inquiry-trace-contract-v2-1/confirmed-decisions.md)
- [标准草案 draft-standard-supplement.md](D:/myproject/assessment-platform-kb/需求/2026-06-14-science-inquiry-trace-contract-v2-1/draft-standard-supplement.md)
- [cp 需求输入 repo-cp.md](D:/myproject/assessment-platform-kb/需求/2026-06-14-science-inquiry-trace-contract-v2-1/repo-cp.md)
- 提案：[proposal.md](proposal.md)
- Spec delta：[specs/science-inquiry-13page-trace-contract/spec.md](specs/science-inquiry-13page-trace-contract/spec.md)、[specs/standard-submodule-construction/spec.md](specs/standard-submodule-construction/spec.md)

跨库实施顺序见 `00-requirement-brief.md` §8：cp 可独立 propose，apply 部分可独立推进；不依赖 backend/admin/xspj-service 的契约变更；如发现必须变更存储接口或下游打标，按需求包规则记为新需求，不扩大本轮范围。

### cp 当前代码事实（决策依据）

- `src/submodules/g8-banana-browning-experiment/mapping.ts` 的 `TracePageType` 与 `TRACE_PAGE_CONFIGS` 已实现 13 页（pageIndex 1–13）映射到 8 种 page_type；`intro_notice` 不计入 13 页 trace 拓扑。
- `src/shared/services/submission/trace/types.ts` 冻结 28 个中性 `L2TraceEventType`，无主观判断词。
- `src/shared/services/submission/trace/contracts/*.v2.2.json` 已运行时生效，与文档镜像 `docs/子模块数据上报规范/engineering_contracts/*.v2.2.json` 字节级同步（contracts-sync 测试强制）。
- `validateTraceMark.ts` 通过 `LEGACY_EVENT_TYPES` 黑名单 + START_PAGE 7-literal registry hash bond 强制 L2 边界与 registry 一致性。
- **关键缺口**：`TRACE_PAGE_CONFIGS` 只声明 `requiredFields`，**无 page_type → 必采事件矩阵**；全仓不存在 page_type_contract / page_instance_confirmation 概念。这是本轮净新增工作。

## Goals / Non-Goals

**Goals:**

- 把 banana golden reference 的隐性经验抽象为两层可复用资产：page_type_contract（类型级）+ page_instance_confirmation（实例级）。
- 建立 V0/V1/V2/V3 确认门禁，杜绝 agent 拿 banana 模板静默套用蜂蜜/馒头导致字段/事件语义漂移。
- 填补 page_type → 必采事件矩阵的代码缺口（新增 page-type-event-matrix）。
- 以 contracts v2.2 为 cp runtime authority 建立可审计自检副本策略（KB canonical 同步为 closeout 回传项，详见 Decision 3）。
- 明确 cp L0/L1→L2 边界，守住"前端不上报 L3/L4/评分/能力判断"。

**Non-Goals:**

- 不实现蜂蜜黏度、蒸馒头或任何具体子模块代码。
- 不抽取通用 shared trace hooks/collectors（推迟到具体模块重构）。
- 不改动 banana runtime hooks。
- 不要求 assessment-platform-backend / assessment-platform-admin / xspj-service 任何变更。
- 不实施运行时强制门禁测试（推迟到首个同构模块重构时按需添加）。
- 不直接修改 KB canonical 标准（由 KB 主 session 在 closeout 时吸收）。

## Decisions

### Decision 1: 两层模型（page_type_contract + page_instance_confirmation）

本轮标准沉淀的核心是 **page_type_contract（第一层，类型级）**，而不是为 13 页重复写 13 份完整规则。page_type_contract 定义可复用的页面拓扑、字段角色、必采/可选 L2 事件、registry 约束和验收模式。8 种 page_type 各一份。

逐页确认包 **page_instance_confirmation（第二层，实例级）** 仍然必须保留，但它不是重复定义标准，而是每个具体页面对 page_type_contract 的实例绑定和审计证据。每页至少记录 page_id、page_number/pageDesc、归属 page_type、content/field/option/param 映射、variance_report.level、用户确认状态。

**Rationale:** 用户明确认可两层方案——核心沉淀在类型层（满足"按类型划分、复用页面拓扑"的直觉），逐页确认包保留为门禁载体（满足需求包 D3/D9 的确认门禁要求，并为 V2/V3 差异、Content Registry、字段绑定提供稳定落点）。激进方案"只要类型契约 + 模块级差异清单、取消逐页确认包"会削弱 D3/D9 的确认门禁，被用户明确否决。

**Alternative considered:** 单层类型契约 + 模块级差异清单。被否决——会让 pageNumber/pageDesc、Content Registry、字段绑定和 V2/V3 差异没有稳定落点，且削弱门禁。

### Decision 2: page_type 命名以代码事实为 canonical

8 种 page_type 命名采用 cp 当前代码已实现的值：`A1_FLOW`、`B1_TEXT_SINGLE`、`B2_TEXT_MULTI_PARALLEL`、`B3_TEXT_MATRIX_EVALUATION`、`C1_INFO_SELECTION`、`D1_SIMULATION_ONLY`、`D2_SIMULATION_QUESTION`、`E1_CHART_PLAN_DECISION`。来源：`mapping.ts:33-41` 的 `TracePageType` 与 `event_schema.v2.2.json` 的 `page_type` 枚举。

KB 草案 §4 中的简写（`B2_TEXT_MULTI`、`B3_METHOD_EVALUATION`、`E1_SOLUTION_SELECTION`）视为草案笔误，按"代码是事实"原则以代码为准，作为回传项由 KB 主 session 在 closeout 时修订草案。

**Rationale:** 用户第 1 轮明确指示"以代码事实为准"；VAULT_RULES 与 AGENTS.md 均规定代码是事实来源。banana 已按代码命名稳定运行，反向改代码会引入回归风险且无收益。

**Alternative considered:** 以 KB 草案命名为准并改 banana 代码。被否决——破坏稳定运行时，且 banana 是 golden reference 应保持稳定。

### Decision 3: cp runtime 权威 = v2.2；KB canonical 同步为 closeout 回传项

本轮 cp 以 **v2.2 为 runtime 权威合同**。cp 自检副本位置：`src/shared/services/submission/trace/contracts/*.v2.2.json`（runtime 权威）；文档镜像：`docs/子模块数据上报规范/engineering_contracts/*.v2.2.json`（通过 contracts-sync 测试与 src 字节级同步）。

**KB canonical 现状**：KB 仓库（`assessment-platform-kb`，本轮无权修改）的 canonical manifest 仍是 `trace_contract_version: v2.1`（`标准/子模块构建标准/standard-sync-manifest.md:18`），标准正文文件名 `science-inquiry-13page-trace-contract-v2.1.md`，且标准正文仍使用旧 page_type 名（如 `B2_TEXT_MULTI`）。

**cp 立场（不擅自宣布标准 canonical）**：cp 文档在 KB 同步完成前自称 **"runtime contract / implementation-local draft"**，不自称标准 canonical。所有 cp 文档（engineering_contracts/README.md、handbook、page_type_contracts）MUST 显式声明此 KB canonical 现状与差异，避免后续 agent 按 KB 与按 cp 得到不一致结论。KB canonical 同步（版本升级 v2.2 + page_type/page_id 命名修订 + page_type_contract 概念吸收）作为 **closeout 回传项**，由 KB 主 session 在跨库需求 closeout 时处理。

v2.1 contracts 保留为历史迁移证据，不删除，标注为 deprecated，不作为 cp runtime 入口；仅供兼容回放 v2.1 系列样本与 KB 迁移对照。

**Rationale:** 用户明确指示"以最新的 v2.2 为准"，但 cp 是 KB 的下游实现仓库，不能反向宣布标准 canonical——否则会造成 KB（v2.1）与 cp（v2.2）两个 canonical 并存的权威冲突。正确做法是 cp 以 v2.2 为 runtime 事实 + 显式声明 KB 现状 + 把同步作为回传项。保留 v2.1 满足可审计性（可追溯从 v2.1→v2.2 的 PAGE_IDLE/START_PAGE initial-visible 演进）。

**Alternative considered:** (a) cp 直接宣布 v2.2 为标准 canonical。被否决——与 KB canonical 冲突，违反"KB 是 canonical 权威源"的跨库规则。(b) 删除 v2.1。被否决——丢失历史迁移证据，削弱可审计性。

### Decision 4: page_type_contract 落点

8 份 page_type_contract 落在 `docs/子模块数据上报规范/page_type_contracts/<TYPE>.md`（A1_FLOW.md / B1_TEXT_SINGLE.md / B2_TEXT_MULTI_PARALLEL.md / B3_TEXT_MATRIX_EVALUATION.md / C1_INFO_SELECTION.md / D1_SIMULATION_ONLY.md / D2_SIMULATION_QUESTION.md / E1_CHART_PLAN_DECISION.md），每份含 YAML frontmatter（contract_id / page_type / canonical_source=cp-code / version=v2.2）。

本轮 cp 侧起草，sync-manifest 标记为 `implementation_local`；KB canonical 同步由 KB 主 session 在 closeout 时吸收。

**Rationale:** 全仓不存在 page_type_contract 概念（agent 探查证实），需新建；落在已运行 contracts 所在的 `docs/子模块数据上报规范/` 目录与现有惯例一致；标记 `implementation_local` 明确 cp 侧起草权属，避免与 KB canonical 混淆。

### Decision 5: page_instance_confirmation 落点

模板落在 `docs/standard-submodule/templates/page-instance-confirmation.md`（与现有 5 个模板同目录同风格）；实例化产物落在 `docs/standard-submodule/page-confirmations/<moduleId>/page_NN.md`。banana 作为 golden reference 生成一份完整 13 页确认包作为范例。

**Rationale:** templates 目录已有 page-l0-l1-matrix / l2-event-matrix / field-content-registry / acceptance-case / review-checklist 五个模板，风格一致；banana 范例确认包让后续模块有可直接对照的样本。

### Decision 6: V0/V1/V2/V3 门禁三层机制

门禁通过三层协同实现（满足 confirmed-decisions D3/D9）：

1. **Spec 级硬约束**：`science-inquiry-13page-trace-contract` 能力明确"每页代码实施前必须有 approved 的 page_instance_confirmation"，且 V2/V3 阻断规则。
2. **Handbook 级 checklist**：`science-inquiry-experiment-handbook.md` 增加"实施前检查清单"，作为 agent 实施前的 self-check。
3. **运行时强制测试**：不在本轮做（避免新建 shared runtime 资产），记为 Deferred。

V0/V1 可批量审核，但必须显式列出每个 page_id 的 type 归属和 level；V1 用 `theme_substitutions` 或 Content Registry 映射表达，不展开完整字段差异；V2 单页沟通并阻断实施；V3 阻断并升级 KB 标准或另建需求。

**Rationale:** 用户第 3 轮明确指示门禁要求；运行时强制测试推迟避免本轮扩大范围（与 D7 banana runtime 稳定一致）。

### Decision 7: banana runtime 保持稳定

`useBananaPageIdle` / `useBananaTraceLogger` / `useTracePageStart` / `useContentActivationTrace` / `fieldBindings` / `pageStartMetadata` 本轮不动，作为 golden reference。shared hooks/collectors 提取推迟到蜂蜜/蒸馒头具体模块重构时，作为该模块重构任务的一部分，含 banana 回归测试要求。

**Rationale:** 用户第 4 轮明确指示——"等蜂蜜黏度或蒸馒头进入具体重构时，再基于 banana + 新模块的共同需求提取 shared hooks/collectors。届时提取必须作为该模块重构任务的一部分，有回归 banana 的测试要求。"

**Alternative considered:** 本轮抽象 banana trace hooks 为通用 shared 资产。被否决——扩大范围、破坏 golden reference 稳定、且无第二个模块验证抽象正确性。

### Decision 8: L2 边界守卫沿用现有 validator

cp 只发 28 个中性 L2 事件（已在 `L2TraceEventType` 冻结），不上报 L3/L4/评分/能力；L1 不直接断言"阅读/理解"。validation 已通过 `LEGACY_EVENT_TYPES` 黑名单（拒绝 13 个旧动词）+ `validateTraceMark` 的 START_PAGE 7-literal registry hash bond 强制。本轮不新增运行时校验代码，只在 spec 与 handbook 中明确边界。

**Rationale:** agent 探查证实 L2 层已完全中性，主观词仅出现在 rule_config 阈值描述（用于下游 L3 tagger 配置），无新增校验需求；D5/D7 的边界已由现有代码强制。

### Decision 9: trace matrix 填补代码缺口

新增 `docs/子模块数据上报规范/page-type-event-matrix.md`（8 行 page_type × 28 列 L2 事件，单元格 = required/optional/n/a），作为 page_type_contract 的可审计总表与 8 份契约的索引。该 matrix 是本轮对代码缺口（`TRACE_PAGE_CONFIGS` 只有 requiredFields 无事件矩阵）的文档级补全，不在运行时强制（Deferred）。

**Rationale:** agent 探查证实代码缺口；matrix 作为索引让 8 份契约可一处总览，且为后续运行时校验提供契约源。

## Conflicts with confirmed-decisions and draft supplement

本表逐项对照 `confirmed-decisions.md` D1–D12 与 `draft-standard-supplement.md`。发现冲突时不静默调整，记录如下。

| 项 | cp 立场 | 冲突类型 | 处理 |
|----|---------|---------|------|
| D1 KB 标准升级方向 | 一致 | 无 | 回传项：KB 吸收 page_type 命名 + v2.2 canonical |
| D2 统一覆盖范围 | 一致 | 无 | page_type_contract 字段角色无主题词（spec Requirement 1） |
| D3 逐页确认后实施 | 一致 | 无 | page_instance_confirmation 落地（spec Requirement 2） |
| D4 差异必须沟通 | 一致 | 无 | V2/V3 门禁（spec Requirement 3） |
| D5 前端/存储/下游边界 | 一致 | 无 | spec Requirement 8 明确 |
| D6 L0 Raw Event 改名 | 一致 | 无 | spec/handbook 用"原始前端信号 / Raw Frontend Signal" |
| D7 L1 不直接断言阅读 | 一致 | 无 | spec Requirement 5 |
| D8 香蕉 v2.1 标准核查 | 一致 | 无 | 术语映射表见下方 Decision 8 落地 |
| D9 V0/V1/V2/V3 | 一致 | 无 | spec Requirement 3 + Decision 6 |
| D10 工程合同归属 | 一致 | **现状偏差** | cp sync-manifest 目前只覆盖 KB↔cp handbook 章节，未登记 JSON contracts；本轮扩展 `engineering_contracts/README.md` 文档化 v2.2 docs↔src 同步（已由 contracts-sync 测试强制），manifest 暂加 `implementation_local` v2.2 行 + TODO；KB canonical 同步留待 closeout |
| D11 不纳入 admin | 一致 | 无 | 范围严格限定 cp |
| D12 backend 仅存储 | 一致 | 无 | spec Requirement 8 明确 |
| **C1 草案 §4 page_type 命名**（`B2_TEXT_MULTI` / `B3_METHOD_EVALUATION` / `E1_SOLUTION_SELECTION`） | **冲突：代码用 `B2_TEXT_MULTI_PARALLEL` / `B3_TEXT_MATRIX_EVALUATION` / `E1_CHART_PLAN_DECISION`** | 草案 vs 代码 | **代码胜**（用户第 1 轮确认）；cp 设计/spec 全用代码命名；KB 草案命名作为回传项由 KB 主 session 修订 |
| **C2 contracts v2.1 vs v2.2 并存（含 KB vs cp 权威差异）** | 现状：cp runtime 是 v2.2，KB canonical 仍是 v2.1（`assessment-platform-kb/标准/子模块构建标准/standard-sync-manifest.md:18`）；双版本在 cp 内部也共存 | 双版本共存 + KB/cp 权威源差异 | **cp 以 v2.2 为 runtime 权威、KB 同步为 closeout 回传项**（Decision 3）；cp 文档自称 implementation-local draft 不自称标准 canonical；KB 主 session 在 closeout 时升级 KB canonical 到 v2.2 + 修订命名 + 吸收 page_type_contract |
| **C3 acceptance_cases `expected.labels` 含 L3 标签**（如 `READ_CHAT` / `GENERATE_THINK` / `DEEP_READ`） | **边界澄清：cp 用 acceptance_cases 作 `operationList` 格式/结构自检参照，不生成 labels** | 验收资产含后端 L3 tagger fixture | labels 侧属下游打标，本轮不实施，符合 D5；spec Requirement 5/8 明确 cp 不生成 L3 |
| **C4 banana 14 个 PAGE_CONFIGS vs 标准 13 页** | 一致（表面数量差） | 表面数量差 | `intro_notice`（注意事项）不计入 13 页 trace 拓扑；spec Requirement 4 显式声明 |
| **C5 草案 §4 standardPageId 命名与代码系统性差异** | **冲突：草案用 `page_01_background` / `page_04_transition_to_design` / `page_06_plan_evaluation` / `page_07_transition_to_experiment` / `page_08_simulation_only` / `page_09_sim_question_1` / `page_13_finish` 等；代码用 `page_01_intro` / `page_04_transition` / `page_06_method_evaluation` / `page_07_experiment_intro` / `page_08_simulation_explore` / `page_09_experiment_question_1` / `page_13_task_finish` 等** | 草案 vs 代码 | **代码胜**（与 C1 同口径，"代码是事实"）；page_type_contract 与 page_instance_confirmation 全部使用代码 `standardPageId`；KB 草案 page_id 命名作为回传项由 KB 主 session 一并修订 |

## Terminology Mapping

落地 `confirmed-decisions.md` D6（L0 Raw Event 改名）与 D8（香蕉 v2.1 标准核查）。本表是 cp 侧术语规范的单一来源，handbook 与 spec 引用本表。

| v2.1 文档旧术语 | 本轮 cp runtime 术语 | 处理 |
|----------------|------------------|------|
| L0 原始日志 | 原始前端信号 / Raw Frontend Signal | 不再作为 L0；避免与 L0 页面事实冲突 |
| L1 控件字典 / UI 约束 | 控件/字段映射与 registry 约束 | 归入 page_instance_confirmation 与 registry planning |
| L1.5 字段注册表 `field_manifest` | Field Registry | 保留为前端与下游共享的结构语义；存储后端不解释 |
| L2 标准事件 | L2 标准事件 | 保持 |
| L3 行为标签 | 下游 L3 行为标签 | 保持非前端、非存储后端责任边界 |

## Risks / Trade-offs

- **[门禁可绕过] 本轮不实施运行时强制门禁测试** → Mitigation: spec 级硬约束 + handbook checklist 双层软门禁；首个同构模块重构时按需添加运行时测试（Deferred 明确记录）。
- **[contracts 双版本并存可能误用] v2.1 与 v2.2 同时存在** → Mitigation: v2.1 标注 deprecated；handbook 明确"cp runtime authority = v2.2"（KB canonical 仍 v2.1，KB 同步为回传项）；contracts-sync 测试只 pin v2.2 字节同步。
- **[page_type_contract 本轮 cp 起草 vs KB canonical 滞后] KB 标准尚未吸收 page_type_contract 概念** → Mitigation: sync-manifest 标记 `implementation_local`；回传项明确建议 KB 主 session 在 closeout 时 canonical 化；cp handbook 显式声明"本包不是 canonical 标准"。
- **[香蕉范例确认包工作量大] 13 页范例确认包起草成本** → Mitigation: V0/V1 页用批量简化格式（type 归属 + level 一行）；只有真正有差异的页展开。

## Migration Plan

1. 本轮（propose）：创建 proposal/design/tasks/specs，不改运行时代码。
2. apply 阶段：
   1. 起草 8 份 page_type_contract（`docs/子模块数据上报规范/page_type_contracts/`）。
   2. 起草 page-type-event-matrix.md（8×28 总表）。
   3. 新增 page-instance-confirmation.md 模板 + banana 13 页范例确认包。
   4. 文档化 engineering_contracts v2.2 runtime contract + KB canonical 现状声明 + sync-manifest 加 v2.2 行。
   5. handbook 加实施前检查清单 + 术语映射表。
   6. 运行 `openspec validate` + submission 测试套件，确认无回归。
3. archive 阶段：归档 change，写回 `repo-results/cp.md`。
4. closeout 阶段（KB 主 session）：吸收 page_type_contract 概念、修订草案 §4 命名、决定 sync-manifest 是否扩展到 JSON contracts 登记。

## Deferred / 提取候选

以下事项本轮不做，明确推迟：

- **shared trace hooks/collectors 提取**（`usePageIdle` / `useTraceLogger` 通用化）→ 推迟到蜂蜜黏度或蒸馒头具体模块重构时作为该模块重构任务的一部分，含 banana 回归测试要求。
- **运行时强制门禁测试**（检查模块目录下 page_instance_confirmation 齐全且 approved）→ 推迟到首个同构模块重构时按需添加。
- **KB canonical 同步 page_type_contract** → 由 KB 主 session 在 closeout 时吸收。
- **KB 草案 §4 page_type 命名修订** → 回传项，由 KB 主 session 处理。
- **sync-manifest 扩展到 JSON contracts 登记** → 回传项，由 KB 主 session 决定 manifest 范围。

## Open Questions / Pending Confirmations

- D10 现状偏差：sync-manifest 是否应正式扩展登记 JSON contracts（event_schema/field_registry/content_registry/rule_config），还是保持只覆盖 KB↔cp handbook 章节？本轮 cp 倾向于保持现状（JSON contracts 由 contracts-sync 测试强制即可），并作为回传项留给 KB 主 session 决定。
- 蜂蜜黏度、蒸馒头是否完全 13 页同构，仍需逐页确认（这是 page_instance_confirmation 的目的，不是本轮可解决的问题）。

## 回传建议（供 closeout 时 repo-results/cp.md 引用）

- **KB 草案 §4 page_type 命名需修订**为代码命名（`B2_TEXT_MULTI_PARALLEL` / `B3_TEXT_MATRIX_EVALUATION` / `E1_CHART_PLAN_DECISION`）。
- **KB 草案 §4 standardPageId 命名需修订**为代码命名（`page_01_intro` / `page_04_transition` / `page_06_method_evaluation` / `page_07_experiment_intro` / `page_08_simulation_explore` / `page_09_experiment_question_1` / `page_13_task_finish` 等；详见 Conflicts 表 C5）。
- **KB 标准应吸收 page_type_contract 概念**（canonical 化）；cp 本轮已起草 8 份契约作为实现手册级资产，等待 KB canonical 化。
- **sync-manifest 机制应明确是否扩展到 JSON contracts 登记**；cp 倾向保持 contracts-sync 测试强制 + handbook 文档化双轨，不扩展 manifest。
- **术语映射表**（L0 原始日志 → 原始前端信号等）建议 KB 主 session 在合并长期标准时采纳。
