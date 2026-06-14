# Tasks — science-inquiry-trace-contract-v2-1

> 本任务清单对应跨库需求 `2026-06-14-science-inquiry-trace-contract-v2-1`。
> 需求文档回链：
> - [00-requirement-brief.md](D:/myproject/assessment-platform-kb/需求/2026-06-14-science-inquiry-trace-contract-v2-1/00-requirement-brief.md)
> - [confirmed-decisions.md](D:/myproject/assessment-platform-kb/需求/2026-06-14-science-inquiry-trace-contract-v2-1/confirmed-decisions.md)
> - [draft-standard-supplement.md](D:/myproject/assessment-platform-kb/需求/2026-06-14-science-inquiry-trace-contract-v2-1/draft-standard-supplement.md)
> - [repo-cp.md](D:/myproject/assessment-platform-kb/需求/2026-06-14-science-inquiry-trace-contract-v2-1/repo-cp.md)
>
> 本轮严格只创建 OpenSpec artifacts + apply 阶段的文档型产物；不改运行时代码、不新建通用 shared runtime 资产、不动 banana trace hooks（见 design.md D7 与 Deferred）。

## 1. Spec delta 编写与自检

- [x] 1.1 编写 `specs/science-inquiry-13page-trace-contract/spec.md`（## ADDED Requirements，8 条 Requirement，每条配 1–3 个 Scenario，RFC 2119 关键字）
- [x] 1.2 编写 `specs/standard-submodule-construction/spec.md`（## ADDED Requirements，1 条 Science Inquiry Module Definition of Ready；该 capability 已存在，本 change 为纯新增一条 Requirement，故用 ADDED 而非 MODIFIED）
- [x] 1.3 逐条核对 8 条 Requirement 与 `confirmed-decisions.md` D1–D12 的覆盖关系，确保无遗漏（参见 design.md Conflicts 表）
- [x] 1.4 确认 spec 中 page_type 命名全部使用代码 canonical 值（`B2_TEXT_MULTI_PARALLEL` / `B3_TEXT_MATRIX_EVALUATION` / `E1_CHART_PLAN_DECISION` 等），不出现草案简写

## 2. page_type_contract 起草（第一层，8 份）

- [x] 2.1 在 `docs/子模块数据上报规范/page_type_contracts/` 新建 8 个 markdown 文件：`A1_FLOW.md` / `B1_TEXT_SINGLE.md` / `B2_TEXT_MULTI_PARALLEL.md` / `B3_TEXT_MATRIX_EVALUATION.md` / `C1_INFO_SELECTION.md` / `D1_SIMULATION_ONLY.md` / `D2_SIMULATION_QUESTION.md` / `E1_CHART_PLAN_DECISION.md` + README 索引
- [x] 2.2 每份契约含 YAML frontmatter（`contract_id` / `page_type` / `canonical_source: cp-code` / `version: v2.2`）+ 章节：页面族、字段角色（field_role）、必采 L2 事件、可选 L2 事件、registry 约束、验收模式
- [x] 2.3 核对字段角色无主题词（banana/honey/steamed-bread 等）；主题内容只在 display/content 配置
- [x] 2.4 以 banana `TRACE_PAGE_CONFIGS`（`src/submodules/g8-banana-browning-experiment/mapping.ts:299-476`）为事实源，对照每种 page_type 的实际 requiredFields/contentIds/questions/experimentParams 填写契约

## 3. page_instance_confirmation 模板 + banana 范例（第二层）

- [x] 3.1 新建模板 `docs/standard-submodule/templates/page-instance-confirmation.md`，字段至少含：page_id / page_number / pageDesc / 绑定 page_type / content+field+option+param 映射 / variance_report.level（V0/V1/V2/V3）/ theme_substitutions / user_confirmation_status
- [x] 3.2 在 `docs/standard-submodule/page-confirmations/g8-banana-browning-experiment/` 生成 banana 13 页范例确认包（page_01.md … page_13.md）+ page_00_notice.md 注意事项页
- [x] 3.3 banana 范例确认包以 V0 简化格式为主（type 归属 + level 一行 + registry_mapping），全部 approved
- [x] 3.4 在范例确认包 README 中显式记录 banana 14 个 PAGE_CONFIGS 与 13 页 trace 拓扑的关系（`intro_notice` 不计入，navigationMode: hidden，不加载计时器）

## 4. page-type-event-matrix（填补代码缺口）

- [x] 4.1 新建 `docs/子模块数据上报规范/page-type-event-matrix.md`：8 行 page_type × 28 列 L2 事件矩阵，单元格取值 `required` / `optional` / `n/a`
- [x] 4.2 以 banana `TRACE_PAGE_CONFIGS` 与 28 个 `L2TraceEventType` 为事实源，逐格标注
- [x] 4.3 矩阵作为 8 份 page_type_contract 的可审计索引总表
- [x] 4.4 明确该 matrix 是文档级补全，运行时强制校验不在本轮做（Deferred）

## 5. engineering_contracts v2.2 文档化 + sync-manifest

- [x] 5.1 扩展 `docs/子模块数据上报规范/engineering_contracts/README.md`，明确 v2.2 为 cp runtime 权威、v2.1 为 deprecated 历史迁移证据（不删除），并显式声明 KB canonical 现状（仍 v2.1）+ cp 立场（自称 implementation-local draft）+ KB 同步为 closeout 回传项
- [x] 5.2 文档化 v2.2 docs↔src 字节级同步（由 contracts-sync 测试强制），列出 runtime 路径 `src/shared/services/submission/trace/contracts/*.v2.2.json` 与镜像路径 `docs/子模块数据上报规范/engineering_contracts/*.v2.2.json`
- [x] 5.3 在 `docs/standard-submodule/standard-sync-manifest.md` 增加 v2.2 contracts 行（`implementation_local` 策略 + TODO 备注 KB canonical 同步留待 closeout）+ 声明 notes 为可选字段
- [x] 5.4 明确 cp SHALL NOT 直接依赖桌面研究目录 `D:/chenx/Desktop/轨迹上报标准及打标规范研究/engineering_contracts/` 作为运行合同

## 6. science-inquiry-experiment-handbook 更新

- [x] 6.1 在 `docs/standard-submodule/science-inquiry-experiment-handbook.md` 增加"实施前检查清单"：13 页确认包齐全、每页 approved、V2/V3 差异已决、registry 版本/hash 自检方式明确
- [x] 6.2 增加术语映射表（L0 原始日志→原始前端信号、L1 控件字典→registry 约束、L1.5 field_manifest→Field Registry、L3 行为标签→下游责任边界）
- [x] 6.3 增加 page_type 命名说明：以代码 canonical 为准，KB 草案简写视为待修订笔误；并声明 KB canonical 现状（仍 v2.1）+ cp 自称 implementation-local draft
- [x] 6.4 增加 L2 中性事件边界说明：cp 不生成 L3/L4/评分/能力判断；L1 不断言"阅读/理解"

## 7. Validation

- [x] 7.1 运行 `openspec validate science-inquiry-trace-contract-v2-1 --type change --strict`，确认通过
  - 结果：`Change 'science-inquiry-trace-contract-v2-1' is valid`（2026-06-14，修复审查发现后复测仍 valid）
- [x] 7.2 运行 `npm run lint:submission`，确认无新增违规
  - 结果：通过，无违规输出
- [x] 7.3 运行 `npm run test:submission-format`，确认通过
  - 结果：1 test passed
- [x] 7.4 运行 `npm run test:submission`，确认无回归
  - 结果：9 files / 50 tests passed
- [x] 7.5 运行 banana 现有测试（`npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/`），确认 banana runtime 未被本轮改动破坏
  - 结果：7 files / 68 tests passed；banana trace hooks 零改动（git status src/ 为空）
- [x] 7.6 `git status` 自检：本轮 diff 仅含 `openspec/changes/science-inquiry-trace-contract-v2-1/**` 新增文件与 apply 阶段的 `docs/**` 文档变更；`src/submodules/g8-banana-browning-experiment/trace/*` 运行时 hook 文件无内容变更
  - 注：`AGENTS.md` / `CLAUDE.md` 在 git status 显示 `M`，但 diff 仅为 GitNexus 自动索引数字更新（`15770 symbols, 22296 relationships` → `17009 symbols, 24069 relationships`），是会话开始前就存在的状态（见会话环境 gitStatus 快照），与本 change 无关。archive/commit 时这两个文件**不纳入本 change 提交**，保持未暂存状态或由 GitNexus 工具单独维护。

## 8. 回传准备（archive 后）

- [x] 8.1 按 `return-prompts.md` 中 cp 的提示词，起草 `repo-results/cp.md`，记录：archive path、commit hash、实际完成内容、验证结果、对其他仓库影响、建议 KB 主 session 更新的长期知识（page_type 命名修订、page_type_contract canonical 化、sync-manifest 扩展决策、术语映射表采纳）
  - 产物：`D:\myproject\assessment-platform-kb\需求\2026-06-14-science-inquiry-trace-contract-v2-1\repo-results\cp.md`
- [x] 8.2 在 `repo-results/cp.md` 中明确记录 design.md Conflicts 表的 C1–C5 处置结果，供 KB 主 session closeout 时核对
  - 产物：repo-results/cp.md 含"对 KB 的回传项"段（C1 page_type 命名、C2 KB/cp 版本权威差异、C5 page_id 命名、page_type_contract canonical 化、sync-manifest 扩展、术语映射表）
