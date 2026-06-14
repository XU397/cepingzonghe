## Why

`g8-banana-browning-experiment` 已作为标准子模块样板完成了 L0/L1/L2 轨迹上报、MarkObject 提交和验收沉淀。但这份经验目前锁在单一子模块里——`TRACE_PAGE_CONFIGS` 只声明了 `requiredFields`，**没有 page_type → 必采事件的矩阵**，也没有可复用的"页面类型契约"和"页面实例确认"概念。后续要重构或构建蜂蜜黏度、蒸馒头等页面结构高度同构的科学探究 13 页模块时，agent 缺少稳定的复用单位，只能各自照搬香蕉样板自由发挥，导致字段 ID、事件语义、registry 绑定在跨模块间漂移。

本提案把香蕉 golden reference 的隐性经验显性化为两层可复用资产：第一层 **page_type_contract**（8 种 page_type 各一份标准契约），第二层 **page_instance_confirmation**（每页一条实例绑定与差异审计），并以 v2.2 工程合同为 cp runtime authority（KB canonical 当前仍是 v2.1，cp 在 KB 同步完成前自称 implementation-local draft，详见 design.md Decision 3）建立可审计的确认门禁。

### Source links

- [需求简报 00-requirement-brief.md](D:/myproject/assessment-platform-kb/需求/2026-06-14-science-inquiry-trace-contract-v2-1/00-requirement-brief.md)
- [已确认决策 confirmed-decisions.md](D:/myproject/assessment-platform-kb/需求/2026-06-14-science-inquiry-trace-contract-v2-1/confirmed-decisions.md)
- [标准草案 draft-standard-supplement.md](D:/myproject/assessment-platform-kb/需求/2026-06-14-science-inquiry-trace-contract-v2-1/draft-standard-supplement.md)
- [cp 需求输入 repo-cp.md](D:/myproject/assessment-platform-kb/需求/2026-06-14-science-inquiry-trace-contract-v2-1/repo-cp.md)

跨库实施顺序见 `00-requirement-brief.md` §8：cp 可独立 propose，不依赖 assessment-platform-backend / assessment-platform-admin / xspj-service 的契约变更。

## What Changes

- 新增能力 `science-inquiry-13page-trace-contract`，把香蕉的页面类型/事件/registry 经验抽象成两层可复用标准：
  - **page_type_contract（第一层，8 种）**：定义页面族、字段角色、必采/可选 L2 事件、registry 约束、验收模式；字段角色不绑定主题词。
  - **page_instance_confirmation（第二层，13 页）**：每页一条实例，绑定到 page_type，记录实际 page_id/content+field+option+param 映射、variance_report.level（V0/V1/V2/V3）、用户确认状态。
- 新增 **page-type-event-matrix**（8 种 page_type × 28 列 L2 事件的总表），填补当前 `TRACE_PAGE_CONFIGS` 只声明 `requiredFields` 而无事件矩阵的代码缺口。
- 建立 V0/V1/V2/V3 门禁：每页代码实施前必须有 `approved` 的 page_instance_confirmation；V2 单页沟通并阻断实施，V3 阻断实施并升级 KB 标准或另建需求。
- 以 **contracts v2.2 为 cp runtime 权威合同**（KB canonical 当前仍是 v2.1，cp 在 KB 同步完成前自称 implementation-local draft，KB 同步为 closeout 回传项，详见 design.md Decision 3）；v2.1 保留为历史迁移证据（不删，标注 deprecated）。
- **banana runtime 保持稳定**：`useBananaPageIdle` / `useBananaTraceLogger` / `useTracePageStart` / `useContentActivationTrace` 不动；通用 shared trace hooks 的提取推迟到蜂蜜/蒸馒头具体模块重构时，作为该模块重构任务的一部分，含 banana 回归测试要求。
- page_type 命名以 cp 代码事实为准（`B2_TEXT_MULTI_PARALLEL` / `B3_TEXT_MATRIX_EVALUATION` / `E1_CHART_PLAN_DECISION` 等），KB 草案 §4 中的简写（`B2_TEXT_MULTI` / `B3_METHOD_EVALUATION` / `E1_SOLUTION_SELECTION`）视为笔误，作为回传项由 KB 主 session 在 closeout 时修订。

## Capabilities

### New Capabilities

- `science-inquiry-13page-trace-contract`: 科学探究 13 页同构任务的两层标准契约——page_type_contract（8 种类型级可复用契约）+ page_instance_confirmation（13 页实例级确认与差异审计）+ V0/V1/V2/V3 门禁 + L2 中性事件边界 + contracts v2.2 自检同步。

### Modified Capabilities

- `standard-submodule-construction`: 新增 Definition of Ready 交叉引用——科学探究类模块实施前必须以 `science-inquiry-13page-trace-contract` 规约为门禁输入，所有 page_instance_confirmation 必须 `approved` 后才能进入代码实施。

## Impact

- **Affected repository**: cp（学生端前端）。本轮 handoff-prompts 仅含 cp，不涉及其他仓库实施。
- **Affected files during apply**:
  - `docs/子模块数据上报规范/page_type_contracts/<TYPE>.md`（8 个新增）
  - `docs/子模块数据上报规范/page-type-event-matrix.md`（新增）
  - `docs/子模块数据上报规范/engineering_contracts/README.md`（v2.2 runtime contract 文档化 + KB canonical 现状声明）
  - `docs/standard-submodule/templates/page-instance-confirmation.md`（新增模板）
  - `docs/standard-submodule/page-confirmations/g8-banana-browning-experiment/page_NN.md`（banana 13 页范例确认包）
  - `docs/standard-submodule/science-inquiry-experiment-handbook.md`（实施前检查清单 + 术语映射表）
  - `docs/standard-submodule/standard-sync-manifest.md`（v2.2 contracts 行登记）
  - `openspec/specs/science-inquiry-13page-trace-contract/spec.md`、`openspec/specs/standard-submodule-construction/spec.md`（archive 后生成）
- **Current code facts**:
  - 香蕉 `src/submodules/g8-banana-browning-experiment/mapping.ts` 的 `TRACE_PAGE_CONFIGS` 已实现 13 页（pageIndex 1–13）映射到 8 种 page_type；`intro_notice`（注意事项）不计入 13 页 trace 拓扑。
  - `src/shared/services/submission/trace/types.ts` 冻结了 28 个中性 L2 事件类型 `L2TraceEventType`；无主观判断词。
  - contracts v2.2 已在运行时生效（`src/shared/services/submission/trace/contracts/*.v2.2.json`），与文档镜像 `docs/子模块数据上报规范/engineering_contracts/*.v2.2.json` 通过 contracts-sync 测试保持字节级同步。
  - `validateTraceMark.ts` 已通过 `LEGACY_EVENT_TYPES` 黑名单（拒绝 13 个旧动词）+ START_PAGE 7-literal registry hash bond 强制 L2 边界与 registry 一致性。
- **Cross-repo dependency**: 无。assessment-platform-backend 本轮仅作为存储后端保存原始 MarkObject / `operationList`，不要求 schema/registry 语义校验或 L2→L3 打标（见 confirmed-decisions D5/D12）；如后续需要 L3/L4/HMM/报告特征，必须另建下游分析/打标需求并明确 owner，不扩大本轮范围。
