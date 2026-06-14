# 轨迹标准工程化附件

本目录用于把 `01轨迹上报规范.md` 和 `02打标规范.md` 中的人读标准固化为工程合同。

## 本轮 canonical 声明（2026-06-14，跨库需求 `2026-06-14-science-inquiry-trace-contract-v2-1`）

### 版本权威源现状与 cp 立场

> **重要**：KB canonical 标准与 cp runtime 在本轮存在版本/命名差异。cp 文档必须显式说明此差异，避免后续 agent 按 KB 和按 cp 得到不一致结论。

| 维度 | KB canonical（另一个仓库，本轮无权修改） | cp runtime / implementation-local |
|------|------------------------------------------|-----------------------------------|
| trace contract 版本 | **v2.1**（`assessment-platform-kb/标准/子模块构建标准/standard-sync-manifest.md:18` `trace_contract_version: v2.1`；标准正文 `science-inquiry-13page-trace-contract-v2.1.md`） | **v2.2**（`src/shared/services/submission/trace/contracts.ts` 只加载 `*.v2.2.json`；本目录与 src 通过 contracts-sync 测试字节级同步） |
| page_type 命名 | 旧名（如 `B2_TEXT_MULTI`、`B3_METHOD_EVALUATION`、`E1_SOLUTION_SELECTION`，见 KB 标准正文） | 代码 canonical 名（`B2_TEXT_MULTI_PARALLEL`、`B3_TEXT_MATRIX_EVALUATION`、`E1_CHART_PLAN_DECISION`） |

**cp 立场（按跨库需求 `2026-06-14-science-inquiry-trace-contract-v2-1` 用户确认口径）**：

1. **cp 以 v2.2 为 runtime 权威合同**。`contracts.ts` 只加载 v2.2；本目录 v2.2 副本与 src 字节同步（contracts-sync 测试强制）。
2. **cp page_type/page_id 命名以代码事实为准**。KB 草案 §4 的简写视为待修订笔误。
3. **KB canonical 同步为 closeout 回传项**，不在 cp 侧强行宣布为标准 canonical。KB 主 session 在 closeout 时负责：将 `trace_contract_version` 升级为 v2.2、修订 page_type/page_id 命名、吸收 page_type_contract 概念。在 KB 同步完成前，cp 文档自称 **"runtime contract / implementation-local draft"**，不自称标准 canonical。
4. **v2.1 保留为历史兼容补丁镜像**，已包含 `PAGE_IDLE` 回补，但不再作为 cp runtime 入口；不删除，仅供兼容回放 v2.1 系列样本与 KB 迁移对照。

### 其他

- **命名规范**：page_type 与 standardPageId 以 cp 代码事实为准（见 `mapping.ts` 与 `field_registry.v2.2.json`）。KB 草案 §4 简写作为跨库需求回传项（见 OpenSpec change `science-inquiry-trace-contract-v2-1` design.md Conflicts 表 C1/C5）。
- **page_type_contract 与 page_instance_confirmation**：本轮新增的两层标准契约位于 `docs/子模块数据上报规范/page_type_contracts/` 与 `docs/standard-submodule/page-confirmations/`，以本目录 v2.2 合同为事实源。在 KB canonical 化前为 implementation-local draft。
- **cp 不直接依赖桌面研究目录** `D:/chenx/Desktop/轨迹上报标准及打标规范研究/engineering_contracts/`；该目录仅作为来源证据。

版本状态（2026-06-06）：

- 当前香蕉变黑前端运行时实施版本为 **v2.2**；`src/shared/services/submission/trace/contracts.ts` 只加载 `*.v2.2.json` 合同。
- `*.v2.1.json` 保留为历史兼容补丁镜像，前端 `docs/` 与 `src/shared/services/submission/trace/contracts/` 中的 v2.1 副本必须保持同步；该镜像已包含 `PAGE_IDLE` 回补，但不再作为当前香蕉运行时合同。
- v2.2 是当前运行时合同：在 v2.1 兼容补丁镜像基础上明确 Page02 `START_PAGE` 初始可见内容元数据、`CHAT_SCROLL` 视口滚动口径，并采用后端发布的 v2.2 registry / hash。

当前阶段只覆盖 L0 / L1 / L2 / L3：

- 前端：把页面内原始可观察动作和 Registry ID 绑定，整理为 `operationList[*]` 中的 L2 标准事件。
- 后端：解析 L2 标准事件，结合 Field Registry / Content Registry 生成 L3 行为标签。
- 暂不实现：L4 特征聚合、评价生成、能力推断。

文件说明：

| 文件 | 说明 |
|---|---|
| `event_schema.v2.2.json` | 当前香蕉前端运行时使用的单条 `operationList[*]` 标准事件 JSON Schema |
| `field_registry.v2.2.json` | 当前香蕉前端运行时使用的字段、页面拓扑和字段语义注册表 |
| `content_registry.banana.v2.2.json` | 当前香蕉前端运行时使用的 banana 内容语义注册表 |
| `rule_config.v2.2.json` | 当前香蕉前端运行时使用的工程阈值和 hash |
| `event_schema.v2.1.json` | v2.1 兼容补丁镜像的事件 JSON Schema，含 `PAGE_IDLE` 回补 |
| `field_registry.v2.1.json` | v2.1 兼容补丁镜像的同构结构字段、页面拓扑和字段语义注册表 |
| `content_registry.banana.v2.1.json` | v2.1 兼容补丁镜像的 banana 可阅读内容语义 |
| `rule_config.v2.1.json` | v2.1 兼容补丁镜像的初始工程阈值、`ruleConfigVersion`、`timeUnit=ms` 和阈值边界 |
| `acceptance_cases/*.json` | 前后端联调验收用例；属于测试资产，不是运行时依赖 |

使用建议：

- 前端重构时，当前香蕉实现先让每个页面生成的 `operationList[*]` 通过 `event_schema.v2.2.json` 校验；只在兼容回放 v2.1 系列样本时使用 v2.1 补丁镜像合同。
- 后端打标时，必须用 registry 查询 `field_id` / `content_id` 语义，不得信任事件流中的动态字段语义。
- `START_PAGE.value.metadata` 必须声明 `field_registry_version/hash` 和 `content_registry_version/hash`，后端从该处读取并校验。
- 验收用例中的 `expected.labels` 默认按 `sequence_json` 有序精确匹配；如只做包含检查，必须显式声明 `containsLabels`。
- 验收用例支持 `forbidden_labels`，当前阶段全局禁止 `ARGUMENTATION`、`FIELD_COMPLETENESS`、`START_PAGE`、`SUBMIT_PAGE`、`TASK_FINISH` 进入 L3 labels / sequence；生命周期只能进入 `pageMetadata.lifecycle`。
- `l4Required=false` 表示本阶段不要求输出 L4。
- `event_schema`、`field_registry`、`content_registry`、`rule_config` 属于运行合同；当前香蕉 v2.2 合同对应后端 `ruoyi-system/src/main/resources/trace-contracts/v2.2/`，v2.1 目录仅用于兼容补丁镜像；`acceptance_cases` 属于测试资产，优先同步到同版本 `src/test/resources/trace-contracts/<version>/acceptance_cases/`。
- hash 计算采用 canonical JSON，并排除所有自引用 hash 字段，包括 `*_hash`、`*Hash`、`registry_hash`、`content_hash`、`contract_hash`。

当前结构状态：

- `*.v2.2.json` 为当前香蕉前端实现的运行时合同，并通过 contracts-sync 测试与 `src/shared/services/submission/trace/contracts/` 保持字节级同步。
- `event_schema.v2.1.json` 作为兼容补丁镜像保留 `PAGE_IDLE` 回补；v2.1/v2.2 的 docs/runtime 副本均由 contracts-sync 测试锁定，避免同版本漂移。
- `rule_config.v2.1.json` 已补齐合同结构和初始工程阈值声明。
- `field_registry.v2.1.json` 已体现同构结构槽位设计，并覆盖 Page01-Page13 的页面拓扑和当前会被打标消费的字段 / 选项槽位。
- `content_registry.banana.v2.1.json` 只补充被算法解释的内容语义；不机械收集装饰文案和按钮文案。
- `acceptance_cases` 当前保留已存在样例；完整 Page01-Page13 cases 在实现计划第一批任务补齐。
