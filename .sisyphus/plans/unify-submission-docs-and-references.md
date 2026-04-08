# 计划：建立目标态提交规范体系与遗留偏差管理

## TL;DR

将 `docs/submodule-submission-guidelines.md`（841 行）和 `docs/子模块数据规范1205.md`（877 行）归档至 `docs/archive/`，新建两份文档：

1. **`docs/submission-spec.md`** — 目标态提交架构的规范化标准。使用 MUST / SHOULD / MUST NOT 措辞，标注适用范围（新模块 / 遗留模块 / 两者），不在正文混入遗留例外。
2. **`docs/submission-legacy-deviations.md`** — 遗留偏差登记表。逐条记录偏差模块、偏差内容、理由、风险、迁移触发条件、退出条件。

同时将 OpenSpec 约束源（`openspec/specs/`、`openspec/project.md`）和活跃变更提案与目标态规范对齐，确保工作流执行引擎不会依据陈旧语义产生错误指导。

核心策略转变：**规范定义目标态，代码只是现状证据**。当前代码用于差距分析、迁移规划和代表性示例提取，不用于定义理想标准。新模块 MUST 遵循目标标准；遗留模块可暂时偏离，但所有偏差 MUST 显式登记。

本次不修改任何运行时代码。

---

## 背景

### 现有文档问题

项目当前存在两份关于子模块数据提交规范的文档，各自包含有价值的内容，但任何一份都不足以作为权威标准：

| 维度 | `submodule-submission-guidelines.md` | `子模块数据规范1205.md` |
|------|--------------------------------------|------------------------|
| 页码与前缀规则 | 有，较精确 | 有，部分与 schema 不一致 |
| operationList/answerList 格式 | 有，含完整示例 | 有，含更多类型细节 |
| 事件白名单 | 有（较新） | 有（可能过时） |
| mapping.ts 常量规范 | 有 | 有，含 validateMappingConfig 用法 |
| 共享适配器架构说明 | 简略 | 详细（含 useStableOperationLogger 等） |
| 反模式与最佳实践 | 简略 | 详细（第 9 节） |

两份文档的共同缺陷：
- 均以描述性语气记录当前实现，而非规范性措辞定义目标标准。
- 均未区分"新模块必须遵循"和"遗留模块的现状偏差"。
- 均存在与当前代码的偏差（如引用了不存在的 `docs/submission-format-standard.md`，或版本停留在 1.1.1）。
- 仓库中至少 13 个 `.md` 文件直接引用这两份文档，引用分散且措辞不统一。

### OpenSpec 陈旧语义问题

OpenSpec 是项目的工作流约束源。`openspec/specs/` 中的当前规格和 `openspec/changes/` 中的活跃变更会直接影响实现工作流的执行。如果这些源保留了陈旧的提交语义，将误导后续开发。

**已确认的陈旧语义实例**：

| 文件 | 陈旧内容 |
|------|---------|
| `openspec/project.md` 第 15 行 | 仍提及 `M2:11` 或 `2.11` 作为页码格式示例 |
| `openspec/specs/flow/spec.md` 第 61 行 | `M<stepIndex>:<subPageNum>` 作为被禁止格式的描述，但描述方式可能被误解为目标态 |
| `openspec/changes/migrate-grade7-questionnaire-submission/migration-details.md` | 使用 `<stepIndex>.<subPageNum>` 格式和 `0.0`, `0.1`, `0.2` 等示例 |
| `openspec/changes/migrate-grade7-tracking-experiment-submission/migration-details.md` | 同上，使用 `0.1`, `1.6`, `2.14` 等不符合 `^[1-9]\d*\.\d{2}$` 正则的示例 |
| `openspec/changes/migrate-grade7-tracking-questionnaire-submission/migration-details.md` | 同上，使用 `0.0`, `0.1`, `1.0`, `2.0` 等示例 |
| `openspec/changes/fix-submodule-flow-context-compliance/*` | 引用 `docs/子模块数据规范1205.md` 作为"权威规范"（第 18、22、90 行等） |
| `openspec/changes/migrate-g8-pv-sand-to-shared-utilities/*` | 引用 `docs/子模块数据规范1205.md` 作为规范依据（proposal 第 5、123 行；tasks 第 9、94 行） |

这些问题的严重性：活跃变更中的 `<stepIndex>.<subPageNum>` 格式和 `0.*` 示例与目标态正则 `^[1-9]\d*\.\d{2}$` 直接矛盾。如果后续工作流依据这些文档执行，会产生不符合规范的实现。

### 策略转变

之前的"代码即真相"策略的问题：它将规范降格为代码的附庸，无法指导渐进式升级。当遗留模块存在已知缺陷时，"以代码为准"等同于认可缺陷为标准。

新策略将规范定位为**目标态**，代码为**现状**，两者之间的差距通过偏差登记表管理并渐进消除。

---

## 工作目标

1. **建立目标态规范** `docs/submission-spec.md`，定义子模块提交架构的 SHOULD/MUST/MUST NOT 标准，标注每条规则的适用范围（新模块 / 遗留模块 / 两者），不在正文混入遗留例外。

2. **建立遗留偏差登记** `docs/submission-legacy-deviations.md`，逐条记录每个遗留模块与目标标准的偏差，含迁移触发条件（touch-it-upgrade-it、Flow 集成升级、重大重构升级等）和退出条件。

3. **同步 OpenSpec 约束源**，确保以下文件与目标态规范对齐：
   - `openspec/project.md`
   - `openspec/specs/data-format/spec.md`
   - `openspec/specs/submission/spec.md`
   - `openspec/specs/flow/spec.md`
   - `openspec/specs/ui-frame/spec.md`

4. **同步活跃变更提案**，确保以下活跃变更中不再保留陈旧的提交语义和对旧文档的引用：
   - `openspec/changes/migrate-grade7-questionnaire-submission/*`
   - `openspec/changes/migrate-grade7-tracking-questionnaire-submission/*`
   - `openspec/changes/migrate-grade7-tracking-experiment-submission/*`
   - `openspec/changes/fix-submodule-flow-context-compliance/*`
   - `openspec/changes/migrate-g8-pv-sand-to-shared-utilities/*`

5. **归档旧文档**到 `docs/archive/`，不删除，便于回溯。

6. **更新作用域内所有引用**，使其指向新规范文档（并在适当位置提及偏差登记文档）。

7. **不改变任何运行时代码**，纯文档/引用操作。

### 新文档设计原则

**`docs/submission-spec.md` 设计原则：**

- 每条规范使用 MUST（必须）/ SHOULD（应该）/ MUST NOT（禁止）措辞。
- 每条规范标注适用范围：`[新模块]` / `[遗留模块]` / `[两者]`。
- 正文不包含遗留模块的特殊例外。例外全部集中在偏差登记文档。
- 每条规范有 rationale（理由）和 intended verification path（预期验证路径），防止写出纯愿景但不可验证的条文。
- 代表性示例从当前代码提取（标注来源），作为"如何实现"的参考而非"标准本身"。

**`docs/submission-legacy-deviations.md` 设计原则：**

- 每条偏差包含：模块名、偏差描述、理由、风险、迁移触发条件、退出条件、负责人（如有）、备注。
- 迁移触发条件至少包含：touch-it-upgrade-it、Flow 集成要求升级、重大重构要求升级。
- 偏差登记表是动态文档，随迁移进度更新。

---

## 验证策略

- **规范文档存在且完整**：`docs/submission-spec.md` 存在，包含目标态声明、MUST/SHOULD 措辞、适用范围标注。
- **偏差登记文档存在且完整**：`docs/submission-legacy-deviations.md` 存在，包含至少一条遗留偏差记录和迁移触发条件。
- **旧文档已归档**：旧文档已移至 `docs/archive/`，且不在 `docs/` 根目录保留重定向 stub。
- **仓库文档引用完整性**：作用域内的仓库文档文件不再包含指向旧文档路径的引用。
- **引用包含偏差文档**：作用域内适当位置同时引用 `submission-spec.md` 和 `submission-legacy-deviations.md`。
- **OpenSpec specs 对齐**：目标 OpenSpec specs 文件不再包含陈旧页码语义（`M2:11`、`0.*` 作为规范性示例、`<stepIndex>.<subPageNum>` 作为目标态格式）。
- **OpenSpec specs 引用更新**：目标 OpenSpec specs 文件中对旧提交文档的引用指向新的 `docs/submission-spec.md`。
- **活跃变更对齐**：活跃变更文件不再将 `0.1`、`0.3`、`1.5` 等不符合 `^[1-9]\d*\.\d{2}$` 的格式作为规范性示例。
- **活跃变更引用更新**：活跃变更文件中对 `docs/子模块数据规范1205.md` 的引用更新为 `docs/submission-spec.md`。
- **OpenSpec 与仓库文档一致**：OpenSpec 约束源和仓库文档对目标态标准的描述无冲突。
- **运行时代码无变化**：`git diff --stat src/` 显示零修改。
- **构建与测试不受影响**：`npm run build` 和 `npm run test:submission` 通过。

---

## 执行策略

### 并行分波设计

```
Wave 0（研究，全部并行）
  ├── T1: 构建当前 payload 实现现状矩阵
  ├── T2: 构建当前 adapter 层实现现状矩阵
  ├── T3: 从真实子模块提取代表性示例与偏差线索
  ├── T4: 盘点仓库文档引用并拟定替换措辞
  ├── T5: 盘点 OpenSpec specs 陈旧语义
  └── T6: 盘点活跃变更陈旧语义与旧文档引用

Wave 1（草稿，部分并行）
  ├── T7: 起草目标态规范大纲与目标态声明
  ├── T8: 起草 Part A（目标态 payload 规范）            ← 依赖 T1
  ├── T9: 起草 Part B（目标态子模块接入标准）            ← 依赖 T2, T3
  └── T10: 起草 Part C（mapping.ts 配置标准）+ Part D    ← 依赖 T3

Wave 2（偏差登记，依赖 Wave 0+1）
  └── T11: 基于代码差距分析起草遗留偏差登记文档          ← 依赖 T1, T2, T3, T7

Wave 3（组装与归档，顺序执行）
  ├── T12: 组装完整规范文档并归档旧文档
  └── T13: 更新 AGENTS.md 与仓库文档引用

Wave 4（OpenSpec 同步，部分并行）
  ├── T14: 更新 OpenSpec project/specs/specs 语义与引用   ← 依赖 T5, T12
  └── T15: 更新活跃变更的陈旧语义与引用                  ← 依赖 T6, T12

Wave 5（清扫与验证，部分并行）
  ├── T16: 作用域内陈旧引用全面扫除
  └── T17: 一致性审查（规范 vs 偏差登记 vs 代码示例 vs OpenSpec）

Wave 6（最终验证，顺序执行）
  └── T18: 最终验证波
```

### 完整依赖矩阵

| 任务 | 前置依赖 | 波次 | 可并行 |
|------|----------|------|--------|
| T1: 当前 payload 实现现状矩阵 | 无 | Wave 0 | 是 |
| T2: 当前 adapter 层实现现状矩阵 | 无 | Wave 0 | 是 |
| T3: 子模块代表性示例与偏差线索 | 无 | Wave 0 | 是 |
| T4: 仓库文档引用盘点 | 无 | Wave 0 | 是 |
| T5: OpenSpec specs 陈旧语义盘点 | 无 | Wave 0 | 是 |
| T6: 活跃变更陈旧语义盘点 | 无 | Wave 0 | 是 |
| T7: 目标态规范大纲与声明 | 无 | Wave 1 | 是 |
| T8: Part A 草稿 | T1 | Wave 1 | 是（与 T9/T10 并行） |
| T9: Part B 草稿 | T2, T3 | Wave 1 | 是（与 T8/T10 并行） |
| T10: Part C+D 草稿 | T3 | Wave 1 | 是（与 T8/T9 并行） |
| T11: 遗留偏差登记文档 | T1, T2, T3, T7 | Wave 2 | 否 |
| T12: 组装规范 + 归档旧文档 | T7, T8, T9, T10 | Wave 3 | 否 |
| T13: 更新仓库文档引用 | T4, T12 | Wave 3 | 否（依赖 T12） |
| T14: 更新 OpenSpec specs | T5, T12 | Wave 4 | 是（与 T15 并行） |
| T15: 更新活跃变更 | T6, T12 | Wave 4 | 是（与 T14 并行） |
| T16: 陈旧引用全面扫除 | T13, T14, T15 | Wave 5 | 是（与 T17 并行） |
| T17: 一致性审查 | T11, T12, T14, T15 | Wave 5 | 是（与 T16 并行） |
| T18: 最终验证 | T12-T17 | Wave 6 | 否 |

### Agent 调度概要

| Agent 类型 | 调度次数 | 负责任务 |
|-----------|---------|---------|
| build（主 agent） | 1 | T7-T18 |
| explore | 2 | T1+T2（并行研究现状）, T3（子模块采样与偏差线索） |
| librarian | 2 | T4（仓库文档引用盘点）, T5+T6（OpenSpec 陈旧语义盘点） |

---

## TODO 清单

### T1: 构建当前 payload 实现现状矩阵

**做什么**：逐一阅读以下源文件，为 `POST /stu/saveHcMark` 的最终 FormData 结构中每个字段建立"字段名 / 类型 / 必填 / 默认值 / 来源函数 / 校验规则"的完整矩阵。此矩阵用于：(a) 作为目标态规范的事实依据，(b) 作为偏差分析的对照基线，(c) 作为代表性示例的素材来源。

**参考文件**：
- `src/shared/services/submission/usePageSubmission.js`
- `src/shared/services/submission/schema.ts`
- `src/shared/services/submission/createMarkObject.js`
- `src/shared/utils/pageMapping.ts`

**禁止**：修改任何代码文件；凭记忆填写字段信息。

**推荐 agent**：`explore`

**并行化**：与 T2-T6 完全并行。

**验收标准**：
- 产出一份 markdown 表格，覆盖 mark 对象的所有字段：`pageNumber`、`pageDesc`、`operationList`、`answerList`、`beginTime`、`endTime`、`imgList`。
- 每个字段标注"来源函数"和"校验规则"。
- 明确 `operationList` 单条记录的字段结构和当前事件枚举值范围。
- 额外标注：每个字段的当前行为是否可合理提升为 MUST 规则，还是存在已知不一致需降级为 SHOULD 或记录为遗留偏差。

**QA 场景**：
- grep `schema.ts` 中所有 Zod 字段定义，确认矩阵无遗漏。
- grep `createMarkObject.js` 中所有赋值语句，确认字段来源正确。
- 对比 `eventTypes.js` 的导出列表确认事件枚举完整。

**需采集的证据**：
- 矩阵 markdown 文本（含"可规范性"评估列）。

**是否提交**：否（研究产出，不直接入仓）。

---

### T2: 构建当前 adapter 层实现现状矩阵

**做什么**：逐一阅读 `submoduleAdapter/` 下所有模块，建立"模块名 / 导出接口 / 输入参数 / 输出 / 调用时机"矩阵。重点关注实际行为的精确记录，为后续目标态规范和偏差分析提供对照基线。

**参考文件**：
- `src/shared/services/submission/submoduleAdapter/collectAnswers.ts`
- `src/shared/services/submission/submoduleAdapter/appendExperimentHistory.ts`
- `src/shared/services/submission/submoduleAdapter/validateMark.ts`
- `src/shared/services/submission/submoduleAdapter/usePageMeta.ts`
- `src/shared/services/submission/submoduleAdapter/useStableOperationLogger.ts`
- `src/shared/services/submission/submoduleAdapter/operationSequence.ts`
- `src/shared/services/submission/submoduleAdapter/flowContextInjector.ts`
- `src/shared/services/submission/submoduleAdapter/pageStateReset.ts`
- `src/shared/services/submission/submoduleAdapter/index.ts`
- `src/shared/services/submission/submoduleAdapter/types.ts`
- `src/shared/services/submission/submoduleAdapter/constants.ts`

**禁止**：修改任何代码文件。

**推荐 agent**：`explore`

**并行化**：与 T1/T3-T6 完全并行。

**验收标准**：
- 每个 adapter 模块的导出函数签名和参数类型记录完整。
- `useStableOperationLogger` 的稳定引用机制和 `flowContextInjector` 的注入时机精确记录。
- `validateMark` 的校验规则列表与 `schema.ts` 的覆盖范围对比清楚。
- 额外标注：哪些 adapter 行为可提升为 MUST 规范，哪些存在模块间不一致需记录偏差。

**QA 场景**：
- 交叉比对 `index.ts` 的 re-export 列表，确认无遗漏模块。
- 对比 `types.ts` 中的类型定义，确认矩阵中的参数类型一致。

**需采集的证据**：
- adapter 模块矩阵 markdown 文本（含"规范性评估"列）。

**是否提交**：否。

---

### T3: 从真实子模块提取代表性示例与偏差线索

**做什么**：从三个标准子模块中各提取 2-3 个典型页面的完整提交流程示例。同时，对比各子模块的实现差异，记录潜在的遗留偏差线索（如不同的 logOperation 签名、不同的 answer 格式化策略等）。

**参考文件**：
- `src/submodules/g8-drone-imaging/Component.tsx`
- `src/submodules/g8-pv-sand-experiment/Component.tsx`
- `src/submodules/g8-mikania-experiment/Component.jsx`
- 以上子模块的 `mapping.ts` 和 `context/` 文件

**禁止**：修改任何代码文件。

**推荐 agent**：`explore`

**并行化**：与 T1/T2/T4-T6 完全并行。

**验收标准**：
- 每个示例包含：页面类型、mapping 中的 pageId/subPageNum、logOperation 调用方式、answer 收集方式、最终 buildMark 调用链。
- 至少包含一个带实验历史的示例。
- 至少包含一个带 flow_context 注入的示例。
- **偏差线索列表**：记录三个子模块之间的实现差异（如 event 命名差异、answer 格式差异、logOperation 调用模式差异等），为 T11 的偏差登记提供素材。

**QA 场景**：
- 对照 `mapping.ts` 中的 PAGE_CONFIGS 确认 subPageNum 正确。
- 对照 Component 中的 onNext 回调确认提交调用链完整。
- 对比三个子模块的 context 目录，确认偏差线索无遗漏。

**需采集的证据**：
- 提取的示例 markdown 文本（含代码片段引用）。
- 偏差线索清单（markdown 列表格式）。

**是否提交**：否。

---

### T4: 盘点仓库文档引用与替换措辞

**做什么**：在以下文件中查找所有对 `docs/submodule-submission-guidelines.md` 和 `docs/子模块数据规范1205.md` 的引用，记录每个引用的出现位置、当前措辞和推荐替换措辞。

**盘点范围**（仓库文档）：
- `AGENTS.md`
- `docs/submodule-page-build-process.md`
- `docs/submodule-build-workflow.md`
- `docs/project_notes/key_facts.md`
- `docs/project_notes/decisions.md`

**排除范围**（不在本次更新范围）：
- `openspec/changes/archive/` 下的所有文件
- `docs/子模块需求文档/*` 下的所有文件
- `.sisyphus/drafts/`
- `temp/plans/`

**禁止**：修改任何文件。仅产出盘点表。

**推荐 agent**：`librarian`

**并行化**：与 T1-T3/T5/T6 完全并行。

**验收标准**：
- 每个作用域内文件的引用出现行号、当前文字、推荐替换文字均有记录。
- 推荐替换措辞统一使用 `docs/submission-spec.md`。
- 在适当位置的替换中同时提及 `docs/submission-legacy-deviations.md`。
- 明确标注哪些引用需要改措辞（如从"唯一口径"改为"目标态规范"），哪些只需改路径。

**QA 场景**：
- 对每个作用域文件执行 `grep -n "submodule-submission-guidelines\|子模块数据规范1205"` 确认无遗漏。
- 确认排除范围内的文件未被计入。

**需采集的证据**：
- 引用盘点表（markdown 格式，含文件名、行号、当前文本、替换文本、是否需提及偏差文档）。

**是否提交**：否。

---

### T5: 盘点 OpenSpec specs 陈旧语义

**做什么**：逐一阅读以下 OpenSpec 文件，查找所有与目标态提交标准不一致的陈旧语义。重点关注页码格式、targetElement 前缀规则、事件枚举、对旧文档的引用。

**盘点范围**：
- `openspec/project.md`
- `openspec/specs/data-format/spec.md`
- `openspec/specs/submission/spec.md`
- `openspec/specs/flow/spec.md`
- `openspec/specs/ui-frame/spec.md`

**已知陈旧语义线索**：
- `openspec/project.md` 第 15 行：`M2:11` 或 `2.11` 作为页码格式示例
- `openspec/specs/flow/spec.md` 第 61 行：`M<stepIndex>:<subPageNum>` 描述

**陈旧语义判定标准**：
- `M2:11`、冒号分隔格式作为规范性示例（非"被禁止"上下文）
- `0.*` 格式（如 `0.1`、`0.3`）作为目标态示例
- `<stepIndex>.<subPageNum>` 描述为目标态格式（应为 `<submoduleIndex>.<pageIndexTwoDigits>`，其中 `submoduleIndex = stepIndex + 1`）
- 对 `docs/子模块数据规范1205.md` 或 `docs/submodule-submission-guidelines.md` 的引用作为规范依据

**禁止**：修改任何文件。仅产出盘点表。

**推荐 agent**：`librarian`

**并行化**：与 T1-T4/T6 完全并行。

**验收标准**：
- 每个文件的陈旧行号、当前文字、陈旧类型、推荐替换文字均有记录。
- 陈旧类型至少区分：`stale-format`（页码格式）、`stale-ref`（旧文档引用）、`stale-semantics`（其他语义偏差）。
- `data-format/spec.md` 和 `submission/spec.md` 内容基本正确但需确认引用一致性。

**QA 场景**：
- `grep -n "M2:11\|子模块数据规范1205\|submodule-submission-guidelines\|<stepIndex>\.<subPageNum>" openspec/project.md openspec/specs/data-format/spec.md openspec/specs/submission/spec.md openspec/specs/flow/spec.md openspec/specs/ui-frame/spec.md`
- 确认 `data-format/spec.md` 第 17-20 行的页码描述与目标态正则 `^[1-9]\d*\.\d{2}$` 一致（这些行看起来已正确，但需确认上下文）。

**需采集的证据**：
- OpenSpec specs 陈旧语义盘点表（含文件名、行号、当前文本、陈旧类型、推荐替换）。

**是否提交**：否。

---

### T6: 盘点活跃变更陈旧语义与旧文档引用

**做什么**：逐一阅读以下活跃变更目录中的所有 `.md` 文件，查找陈旧的提交语义和对旧文档的引用。

**盘点范围**：
- `openspec/changes/migrate-grade7-questionnaire-submission/*`
- `openspec/changes/migrate-grade7-tracking-questionnaire-submission/*`
- `openspec/changes/migrate-grade7-tracking-experiment-submission/*`
- `openspec/changes/fix-submodule-flow-context-compliance/*`
- `openspec/changes/migrate-g8-pv-sand-to-shared-utilities/*`

**已知陈旧语义线索**：
- 三个 G7 迁移变更的 `migration-details.md` 使用 `<stepIndex>.<subPageNum>` 格式和 `0.0`, `0.1`, `0.3`, `1.5` 等示例
- `fix-submodule-flow-context-compliance` 引用 `docs/子模块数据规范1205.md` 作为"权威规范"
- `migrate-g8-pv-sand-to-shared-utilities` 引用 `docs/子模块数据规范1205.md` 作为规范依据

**禁止**：修改任何文件。仅产出盘点表。

**推荐 agent**：`librarian`

**并行化**：与 T1-T5 完全并行。

**验收标准**：
- 每个活跃变更的每处陈旧行号、当前文字、陈旧类型、推荐替换文字均有记录。
- 陈旧类型区分：`stale-format`、`stale-ref`、`stale-example`。
- 明确标注哪些是迁移上下文中的"遗留格式记录"（可保留为历史描述）vs 哪些是"规范性指导"（MUST 更新）。
- 对 `docs/子模块数据规范1205.md` 的引用全部标记为 `stale-ref`。

**QA 场景**：
- `grep -rn "子模块数据规范1205" openspec/changes/fix-submodule-flow-context-compliance/ openspec/changes/migrate-g8-pv-sand-to-shared-utilities/` 确认引用行全部记录。
- `grep -rn "0\.1\|0\.3\|<stepIndex>" openspec/changes/migrate-grade7-*/migration-details.md` 确认陈旧示例全部记录。

**需采集的证据**：
- 活跃变更陈旧语义盘点表（含目录名、文件名、行号、当前文本、陈旧类型、推荐替换）。

**是否提交**：否。

---

### T7: 起草目标态规范大纲与目标态声明

**做什么**：起草 `docs/submission-spec.md` 的完整目录结构和开头的"目标态声明"段落。

**禁止**：包含纯愿景但无验证路径的条文。每条规范必须有 rationale 和 intended verification path。

**推荐 agent**：`build`（主 agent 直接执行）

**并行化**：可与 T8/T9/T10 并行起草。

**大纲结构要求**：

```
docs/submission-spec.md
├── 标题与版本信息
├── 目标态声明与适用范围
│   ├── 本文档定位：目标态规范（非当前代码镜像）
│   ├── 适用范围：新模块 / 遗留模块 / 两者
│   ├── 遗留偏差管理：docs/submission-legacy-deviations.md
│   ├── OpenSpec 一致性：openspec/specs/ 须与本规范对齐
│   └── 规范可验证性保证
├── Part A: 目标态提交 Payload 规范
│   ├── API 契约（POST /stu/saveHcMark）
│   ├── FormData 结构
│   ├── mark 对象字段语义
│   │   ├── pageNumber（目标态编码规则与正则）
│   │   ├── pageDesc（目标态前缀格式）
│   │   ├── operationList（字段结构与目标态事件枚举）
│   │   ├── answerList（字段结构与目标态格式规则）
│   │   ├── beginTime / endTime
│   │   └── imgList
│   ├── Schema 校验规则
│   └── 最小事件集合要求
├── Part B: 目标态子模块接入标准
│   ├── 架构分层概览
│   ├── 共享适配器 API 参考
│   │   ├── usePageMeta
│   │   ├── useStableOperationLogger
│   │   ├── collectAnswers
│   │   ├── appendExperimentHistory
│   │   ├── buildPageDesc
│   │   ├── validateMark
│   │   ├── flowContextInjector
│   │   └── pageStateReset
│   ├── 目标态提交流水线
│   ├── 禁止事项
│   └── 参考子模块索引
├── Part C: mapping.ts 配置标准
│   ├── 必需常量
│   ├── 可选常量
│   ├── 配置验证（validateMappingConfig）
│   └── 实战示例（来自当前代码，标注来源）
├── Part D: 测试与守卫
│   ├── CI 命令
│   ├── submission-format 快照测试
│   └── 常见校验失败排查
└── 附录：归档文档历史与变更说明
```

**目标态声明必须包含**：

> 本文档定义子模块数据提交的**目标态架构与实现标准**。新模块 MUST 遵循本文档的全部 MUST 规则。遗留模块可能存在与本文档的偏差，所有偏差 MUST 在 `docs/submission-legacy-deviations.md` 中显式登记。
>
> **本文档不是当前代码的镜像**。本文档描述的是目标态——即子模块提交系统应当达到的标准。当前代码用于差距分析、迁移规划和代表性示例提取。
>
> **OpenSpec 一致性**：`openspec/specs/` 中的约束规格和 `openspec/changes/` 中的活跃变更 MUST 与本文档的目标态标准保持一致。如发现 OpenSpec 源与本规范冲突，应同步修正。
>
> **可验证性保证**：本文档的每条 MUST/SHOULD 规则均标注 rationale（理由）和 intended verification path（预期验证路径），确保规范可落地、可检验。

**验收标准**：
- 大纲覆盖 Part A-D 和附录。
- 目标态声明段落完整，明确区分目标态与现状，包含 OpenSpec 一致性声明。
- 每个大纲章节标注规范措辞要求（MUST/SHOULD）和适用范围标注要求（`[新模块]`/`[遗留模块]`/`[两者]`）。

**QA 场景**：
- 确认大纲中不含"以代码为准"的旧措辞。
- 确认大纲中每个 Part 都有对应的"预期验证路径"列。
- 确认目标态声明中包含"OpenSpec 一致性"段落。

**需采集的证据**：
- 大纲 markdown 文本（含目标态声明全文）。

**是否提交**：否。

---

### T8: 起草 Part A（目标态 payload 规范）

**做什么**：基于 T1 的现状矩阵，撰写目标态的 Part A。不是描述当前代码做了什么，而是定义**应当**做到什么。每条规则使用 MUST/SHOULD 措辞，标注适用范围，并提供 rationale 和 verification path。

**依赖**：T1

**禁止**：
- 凭空编造无法验证的规范条文。
- 将已知有问题的当前行为直接提升为 MUST 而不加 rationale。
- 在正文中混入遗留模块的特殊例外。

**推荐 agent**：`build`（主 agent 直接执行）

**并行化**：与 T7/T9/T10 并行。

**验收标准**：
- `pageNumber` 的目标态规则包含：MUST 编码格式、正则 `^[1-9]\d*\.\d{2}$`、rationale（为什么用这种格式）、verification path（schema.ts 校验 + lint:submission）。
- 明确禁止 `0.*`、`M*`、冒号分隔、无零填充格式作为新产生的页码（与 `openspec/specs/data-format/spec.md` 第 20 行对齐）。
- `operationList` 包含目标态事件枚举、MUST 最小事件集合、SHOULD 扩展事件。
- `answerList` 包含各题型的目标态 value 格式规则，附带从当前代码提取的代表性示例（标注来源子模块）。
- 每条 MUST 规则有 `[新模块]`/`[遗留模块]`/`[两者]` 适用范围标注。
- 每条 MUST 规则有 rationale 和 intended verification path。

**QA 场景**：
- grep 草稿确认不含"以代码为准"措辞。
- 确认每条 MUST 规则都有 rationale 和 verification path 两个字段。
- grep `schema.ts` 确认 verification path 中引用的校验器确实存在。

**需采集的证据**：
- Part A 完整草稿 markdown 文本。

**是否提交**：否。

---

### T9: 起草 Part B（目标态子模块接入标准）

**做什么**：基于 T2 的 adapter 矩阵和 T3 的子模块示例，撰写目标态的 Part B。定义子模块接入提交流水线的标准方式，每条规则使用 MUST/SHOULD，标注适用范围。

**依赖**：T2, T3

**禁止**：
- 在正文中描述遗留模块的替代路径。
- 从旧文档直接复制可能过时的内容。

**推荐 agent**：`build`（主 agent 直接执行）

**并行化**：与 T7/T8/T10 并行。

**验收标准**：
- 每个 adapter 模块的目标态 API 参考完整，标注 MUST 使用 / SHOULD 使用。
- 目标态提交流水线从"用户操作"到"POST"完整串联。
- 包含至少 3 个从 T3 提取的代表性示例（经简化，标注来源子模块），作为"如何实现"的参考。
- 禁止事项列表完整（MUST NOT 直连 API、MUST NOT 手写 code/时间/前缀/flow_context）。
- 每条 MUST 规则有 rationale 和 verification path。

**QA 场景**：
- 确认 Part B 不含"legacy 模块可以..."之类例外描述。
- 确认每个 adapter 的 verification path 指向具体测试文件或 CI 命令。
- 确认流程图与 `usePageSubmission.js` 的调用顺序一致（示例准确）。

**需采集的证据**：
- Part B 完整草稿 markdown 文本。

**是否提交**：否。

---

### T10: 起草 Part C（mapping.ts 配置标准）+ Part D（测试与守卫）

**做什么**：基于 T3 的子模块示例和代码研究，撰写目标态的 Part C 和 Part D。

**依赖**：T3

**禁止**：从旧文档直接复制可能过时的配置示例。示例从当前代码提取并标注来源。

**推荐 agent**：`build`（主 agent 直接执行）

**并行化**：与 T7/T8/T9 并行。

**验收标准**：
- Part C 覆盖所有目标态必需常量（PAGE_CONFIGS、PAGE_DESC_MAP、PAGE_QUESTIONS、QUESTION_CODE_MAP、QUESTION_TEXT_MAP、ANSWER_KEY_TO_QUESTION）和可选常量（QUESTION_OPTIONS_MAP、INTERNAL_TO_STANDARD_KEY、HISTORY_CODE_BASE）。
- Part C 包含 `validateMappingConfig` 的调用示例。
- Part D 列出所有 CI 命令及其通过标准，作为 verification path 的实际落地方式。
- Part D 包含常见校验失败的排查指引。
- 每条 MUST 规则有 rationale 和 verification path。

**QA 场景**：
- grep 某个真实子模块的 `mapping.ts` 确认示例中的常量列表与实际一致。
- grep `validateMappingConfig` 的源码确认参数列表与 Part C 描述一致。

**需采集的证据**：
- Part C + Part D 完整草稿 markdown 文本。

**是否提交**：否。

---

### T11: 基于代码差距分析起草遗留偏差登记文档

**做什么**：基于 T1（payload 现状）、T2（adapter 现状）、T3（子模块偏差线索）和 T7（目标态大纲），对照目标态规范的每条 MUST 规则，逐一检查当前各子模块的实现，将所有偏差登记到 `docs/submission-legacy-deviations.md`。

**依赖**：T1, T2, T3, T7

**禁止**：
- 不修改任何代码。
- 不遗漏已知偏差（宁可多记录一条低风险偏差，也不要漏掉高风险偏差）。

**推荐 agent**：`build`（主 agent 直接执行）

**并行化**：不可并行（依赖 Wave 0 和 T7 完成）。

**偏差登记表 schema**：

```markdown
| 模块 | 偏差描述 | 违反的目标态规则 | 理由 | 风险 | 迁移触发条件 | 退出条件 | 负责人 | 备注 |
|------|---------|----------------|------|------|------------|---------|-------|------|
```

**迁移触发条件类型**：
- **touch-it-upgrade-it**：任何对该模块的修改都应顺便消除偏差。
- **flow-integration**：Flow 集成需要时必须消除偏差。
- **major-refactor**：重大重构时必须消除偏差。

**验收标准**：
- 偏差登记文档存在且包含至少 3 条偏差记录（基于实际代码差距）。
- 每条偏差包含完整的 8 列信息。
- 迁移触发条件至少包含上述三种类型之一。
- 退出条件可验证（如"通过 `npm run test:submission-format`"）。
- 不存在高风险偏差缺失迁移触发条件的情况。

**QA 场景**：
- 对偏差中提到的每个模块，grep 对应源文件确认偏差描述准确。
- 确认每条偏差的退出条件是可执行的 bash 命令或测试名称。
- 确认至少有一个遗留子模块（如 g7-experiment）出现在偏差登记表中。

**需采集的证据**：
- 偏差登记文档草稿（完整 markdown）。

**是否提交**：否。

---

### T12: 组装完整规范文档并归档旧文档

**做什么**：
1. 将 T7 的大纲、T8 的 Part A、T9 的 Part B、T10 的 Part C/D 组装为完整的 `docs/submission-spec.md`。
2. 将 T11 的偏差登记文档写入 `docs/submission-legacy-deviations.md`。
3. 在规范文档末尾添加"附录：归档文档历史与变更说明"章节。
4. 创建 `docs/archive/` 目录（如不存在）。
5. 将 `docs/submodule-submission-guidelines.md` 移动到 `docs/archive/submodule-submission-guidelines.md`。
6. 将 `docs/子模块数据规范1205.md` 移动到 `docs/archive/子模块数据规范1205.md`。

**依赖**：T7, T8, T9, T10, T11

**禁止**：
- 不删除旧文档，只归档。
- 不修改旧文档内容。
- 不创建旧路径的重定向 stub（避免混淆，让 404 帮助发现未更新的引用）。

**推荐 agent**：`build`（主 agent 直接执行）

**并行化**：不可并行（顺序执行）。

**验收标准**：
- `docs/submission-spec.md` 存在且内容完整（包含目标态声明、Part A-D、附录）。
- `docs/submission-legacy-deviations.md` 存在且包含至少 3 条偏差记录。
- `docs/archive/submodule-submission-guidelines.md` 存在且内容与原文件一致。
- `docs/archive/子模块数据规范1205.md` 存在且内容与原文件一致。
- `docs/submodule-submission-guidelines.md` 和 `docs/子模块数据规范1205.md` 不再存在于 `docs/` 根目录。

**QA 场景**：
- `ls docs/submission-spec.md docs/submission-legacy-deviations.md` 均存在。
- `ls docs/archive/submodule-submission-guidelines.md docs/archive/子模块数据规范1205.md` 均存在。
- `! ls docs/submodule-submission-guidelines.md docs/子模块数据规范1205.md 2>/dev/null` 确认根目录无旧文件。
- `grep "目标态" docs/submission-spec.md | head -3` 确认包含目标态声明。
- `grep "迁移触发" docs/submission-legacy-deviations.md | head -3` 确认偏差文档含触发条件。

**需采集的证据**：
- `ls -la docs/submission-spec.md docs/submission-legacy-deviations.md docs/archive/` 的输出。
- `head -30 docs/submission-spec.md` 确认包含目标态声明。
- 旧文件与新位置的 diff 确认内容一致。

**是否提交**：是（单次提交，含两份新文档创建和归档操作）。

---

### T13: 更新 AGENTS.md 与仓库文档引用

**做什么**：根据 T4 的引用盘点表，逐一更新以下文件中对旧文档的引用。在适当位置同时提及 `docs/submission-legacy-deviations.md`。

**更新范围**：
1. `AGENTS.md`
   - WHERE TO LOOK 表格中的"数据提交规范"行：替换为 `docs/submission-spec.md`，并添加"遗留偏差"行指向 `docs/submission-legacy-deviations.md`。
   - 子模块构建关键决策速查表中的"数据提交规范"行：同上。
2. `docs/submodule-page-build-process.md`
   - 所有 `docs/submodule-submission-guidelines.md` 引用替换为 `docs/submission-spec.md`。
3. `docs/submodule-build-workflow.md`
   - 所有 `docs/submodule-submission-guidelines.md` 引用替换为 `docs/submission-spec.md`。
4. `docs/project_notes/key_facts.md`
   - "数据提交规范"行替换为 `docs/submission-spec.md` + `docs/submission-legacy-deviations.md`。
5. `docs/project_notes/decisions.md`
   - 所有 `docs/submodule-submission-guidelines.md` 引用替换为 `docs/submission-spec.md`。

**替换规则**：
- 所有 `docs/submodule-submission-guidelines.md` 替换为 `docs/submission-spec.md`。
- 所有 `docs/子模块数据规范1205.md` 替换为 `docs/submission-spec.md`。
- 涉及"唯一口径"措辞的，改为"目标态规范"。
- 涉及具体文档描述的，确保与新文档的内容分区对应。
- 在 `AGENTS.md` 和 `key_facts.md` 的文档索引位置，同时列出偏差登记文档。

**依赖**：T4, T12

**禁止**：
- 不更新排除范围内的文件（openspec archive、子模块需求文档）。
- 不改变文件中除引用以外的任何内容。
- 不修改任何运行时代码。

**推荐 agent**：`build`（主 agent 直接执行）

**并行化**：不可并行（顺序执行，依赖 T12 完成后才能验证引用有效性）。

**验收标准**：
- 上述 5 个文件中不再包含 `submodule-submission-guidelines` 和 `子模块数据规范1205` 字符串。
- 所有替换后的路径指向 `docs/submission-spec.md` 或其内部章节。
- `AGENTS.md` 和 `key_facts.md` 中包含 `submission-legacy-deviations.md` 的引用。

**QA 场景**：
- `grep -rn "submodule-submission-guidelines" AGENTS.md docs/submodule-page-build-process.md docs/submodule-build-workflow.md docs/project_notes/key_facts.md docs/project_notes/decisions.md` 返回空结果。
- `grep -rn "子模块数据规范1205" AGENTS.md docs/submodule-page-build-process.md docs/submodule-build-workflow.md docs/project_notes/key_facts.md docs/project_notes/decisions.md` 返回空结果。
- `grep -rn "submission-spec.md" AGENTS.md docs/submodule-page-build-process.md docs/submodule-build-workflow.md docs/project_notes/key_facts.md docs/project_notes/decisions.md` 返回至少 5 条匹配。
- `grep -rn "submission-legacy-deviations" AGENTS.md docs/project_notes/key_facts.md` 返回至少 2 条匹配。

**需采集的证据**：
- grep 结果截图（旧引用为空、新引用存在）。
- 修改前后的 diff。

**是否提交**：是（可与 T12 合并为一次提交，或作为独立提交）。

---

### T14: 更新 OpenSpec project/specs 语义与引用

**做什么**：根据 T5 的盘点表，逐一修正以下 OpenSpec 文件中的陈旧语义和旧文档引用。

**更新范围**：
- `openspec/project.md`：修正页码格式示例（`M2:11` / `2.11` → 目标态 `1.01` / `2.03` 等）。
- `openspec/specs/data-format/spec.md`：确认页码描述与目标态一致，更新旧文档引用（如有）。
- `openspec/specs/submission/spec.md`：确认页码描述与目标态一致，更新旧文档引用（如有）。
- `openspec/specs/flow/spec.md`：确认第 61 行等处的描述准确（`M<stepIndex>:<subPageNum>` 应明确标注为"被禁止的旧格式"而非"规范格式"），更新旧文档引用（如有）。
- `openspec/specs/ui-frame/spec.md`：确认无陈旧语义，更新旧文档引用（如有）。

**修正原则**：
- 页码格式描述 MUST 与目标态正则 `^[1-9]\d*\.\d{2}$` 一致。
- 被禁止的旧格式（`M*`、冒号、`0.*`）描述时 MUST 明确标注为"禁止新生成"而非中性描述。
- 对旧文档的引用替换为 `docs/submission-spec.md`。
- 不改变规格的整体结构或意图，仅对齐提交语义。

**依赖**：T5, T12

**禁止**：
- 不改变规格的核心设计意图（如 SHALL/MUST 的逻辑关系）。
- 不引入与 `docs/submission-spec.md` 矛盾的描述。
- 不修改 `openspec/changes/archive/` 下的任何文件。

**推荐 agent**：`build`（主 agent 直接执行）

**并行化**：可与 T15 并行。

**验收标准**：
- 5 个 OpenSpec 文件不再包含 `M2:11` 或 `2.11` 作为规范性示例。
- 5 个 OpenSpec 文件不再包含 `0.*` 格式作为目标态示例。
- 5 个 OpenSpec 文件中对旧提交文档的引用指向 `docs/submission-spec.md`。
- `openspec/specs/flow/spec.md` 中对 `M<stepIndex>:<subPageNum>` 的描述明确标注为"被禁止的旧格式"。

**QA 场景**：
- `grep -n "M2:11" openspec/project.md openspec/specs/data-format/spec.md openspec/specs/submission/spec.md openspec/specs/flow/spec.md openspec/specs/ui-frame/spec.md` 仅在"禁止"上下文中出现或返回空。
- `grep -n "子模块数据规范1205\|submodule-submission-guidelines" openspec/project.md openspec/specs/data-format/spec.md openspec/specs/submission/spec.md openspec/specs/flow/spec.md openspec/specs/ui-frame/spec.md` 返回空结果或已替换为 `submission-spec.md`。
- `grep -n "submission-spec.md" openspec/specs/data-format/spec.md openspec/specs/submission/spec.md openspec/specs/flow/spec.md` 返回引用（如果这些文件需要引用仓库文档的话）。

**需采集的证据**：
- 修改前后的 diff。
- grep 结果（陈旧语义已消除、引用已更新）。

**是否提交**：是（独立提交或与 T15 合并）。

---

### T15: 更新活跃变更的陈旧语义与引用

**做什么**：根据 T6 的盘点表，逐一修正活跃变更中的陈旧语义和旧文档引用。重点是区分"规范性指导"（MUST 更新）和"历史遗留格式记录"（可保留但需加注）。

**更新范围**：
- `openspec/changes/migrate-grade7-questionnaire-submission/*`
- `openspec/changes/migrate-grade7-tracking-questionnaire-submission/*`
- `openspec/changes/migrate-grade7-tracking-experiment-submission/*`
- `openspec/changes/fix-submodule-flow-context-compliance/*`
- `openspec/changes/migrate-g8-pv-sand-to-shared-utilities/*`

**修正原则**：
- 规范性指导中使用的页码示例 MUST 符合 `^[1-9]\d*\.\d{2}$`（如 `0.1` → `1.01`，`1.5` → `2.05`）。
- 对 `docs/子模块数据规范1205.md` 的引用替换为 `docs/submission-spec.md`，并将"权威规范"措辞改为"目标态规范"。
- `migration-details.md` 中记录的"遗留格式"（如 G7 模块使用 `0.*` 格式的历史事实）可保留，但 MUST 加注说明这些是"遗留格式，不符合目标态规范，见 `docs/submission-legacy-deviations.md`"。
- 不改变变更的核心迁移意图和任务结构。

**依赖**：T6, T12

**禁止**：
- 不改变活跃变更的迁移意图（如"从 X 迁移到 Y"的逻辑不变）。
- 不删除任务行或修改已完成的 checkbox 状态。
- 不静默改变语义使其看起来已迁移完成（如果迁移尚未完成）。
- 不修改 `openspec/changes/archive/` 下的任何文件。

**推荐 agent**：`build`（主 agent 直接执行）

**并行化**：可与 T14 并行。

**验收标准**：
- 5 个活跃变更目录中不再包含将 `0.*`、`M*`、冒号格式作为"规范性指导"的用法。
- 5 个活跃变更目录中对 `docs/子模块数据规范1205.md` 的引用已替换为 `docs/submission-spec.md`。
- `migration-details.md` 中的遗留格式记录已加注说明。
- 变更的整体结构和迁移逻辑未被破坏。

**QA 场景**：
- `grep -rn "子模块数据规范1205" openspec/changes/fix-submodule-flow-context-compliance/ openspec/changes/migrate-g8-pv-sand-to-shared-utilities/` 返回空结果。
- `grep -rn "submodule-submission-guidelines" openspec/changes/fix-submodule-flow-context-compliance/ openspec/changes/migrate-g8-pv-sand-to-shared-utilities/` 返回空结果。
- `grep -rn "submission-spec.md\|submission-legacy-deviations" openspec/changes/fix-submodule-flow-context-compliance/ openspec/changes/migrate-g8-pv-sand-to-shared-utilities/` 返回新引用。
- `grep -rn "0\.1\|0\.3" openspec/changes/migrate-grade7-*/migration-details.md` 的结果中，确认每个匹配要么已更新为目标态格式，要么有"遗留格式"加注。

**需采集的证据**：
- 修改前后的 diff。
- grep 结果（陈旧引用已消除、新引用存在）。

**是否提交**：是（独立提交或与 T14 合并）。

---

### T16: 作用域内陈旧引用全面扫除

**做什么**：对整个仓库（排除 `openspec/changes/archive/`、`docs/子模块需求文档/`、`.sisyphus/`、`temp/`、`node_modules/`）执行全面搜索，确认没有遗漏的旧文档引用和陈旧语义。

**依赖**：T13, T14, T15

**禁止**：修改排除范围内的文件。

**推荐 agent**：`build`（主 agent 直接执行）

**并行化**：可与 T17 并行。

**验收标准**：
- 作用域内无遗漏的 `submodule-submission-guidelines.md` 或 `子模块数据规范1205.md` 引用。
- 作用域内无遗漏的 `M2:11` 作为规范性示例。
- 如发现遗漏，更新对应文件。

**QA 场景**：
- `grep -rn "submodule-submission-guidelines" --include="*.md" --exclude-dir=node_modules --exclude-dir=.sisyphus --exclude-dir=temp .` 仅在 `docs/archive/` 和 `openspec/changes/archive/` 和 `docs/子模块需求文档/` 下有结果。
- `grep -rn "子模块数据规范1205" --include="*.md" --exclude-dir=node_modules --exclude-dir=.sisyphus --exclude-dir=temp .` 仅在 `docs/archive/` 和 `openspec/changes/archive/` 和 `docs/子模块需求文档/` 下有结果。
- `grep -rn "M2:11" --include="*.md" --exclude-dir=node_modules --exclude-dir=.sisyphus --exclude-dir=temp .` 仅在"禁止"上下文或 `docs/archive/` 或 `openspec/changes/archive/` 中出现。

**需采集的证据**：
- grep 输出结果。
- 如有遗漏修复，提供修改前后的 diff。

**是否提交**：是（如有修复则提交）。

---

### T17: 一致性审查（规范 vs 偏差登记 vs 代码示例 vs OpenSpec）

**做什么**：四方交叉核查，确保规范文档、偏差登记文档、代码示例和 OpenSpec 约束源之间的一致性：

1. **规范 vs 代码示例**：规范中的代表性示例与当前代码的实际行为一致（示例准确反映代码做了什么）。
2. **规范 vs 偏差登记**：偏差登记中引用的目标态规则编号/描述与规范正文一致。
3. **偏差登记 vs 代码**：偏差登记中描述的偏差行为与当前代码实际一致（偏差描述准确）。
4. **规范 vs OpenSpec**：`openspec/specs/data-format/spec.md` 和 `openspec/specs/submission/spec.md` 中的页码、事件、前缀规则与 `docs/submission-spec.md` 无冲突。
5. **遗漏检查**：目标态规范中的每条 MUST 规则，如当前有子模块未遵循，都在偏差登记中有对应记录。

**依赖**：T11, T12, T14, T15

**禁止**：不一致时修改代码。不一致时修改文档（规范、偏差登记或 OpenSpec）使其准确。不修改 `openspec/changes/archive/`。

**推荐 agent**：`build`（主 agent 直接执行）

**并行化**：可与 T16 并行。

**验收标准**：
- 规范中的代表性示例都有代码证据支撑。
- 偏差登记中的每条偏差都对应规范中的某条 MUST 规则。
- 没有已知偏差未被登记的情况。
- OpenSpec specs 与仓库规范无冲突。
- 如发现不一致，已修正文档并记录。

**QA 场景**：
- 对规范中的每个示例，grep 源文件确认示例准确。
- 对偏差登记中的每个模块，grep 对应源文件确认偏差描述准确。
- `diff <(grep "pageNumber" docs/submission-spec.md | head -10) <(grep "pageNumber" openspec/specs/data-format/spec.md | head -10)` 确认关键规则一致。
- 确认规范 MUST 规则总数与偏差登记中引用的规则数逻辑一致。

**需采集的证据**：
- 审查报告（markdown 格式，列出每个核查点和结果）。
- 如有修正，提供 diff。

**是否提交**：是（如有修正则提交）。

---

## 最终验证波（T18）

**做什么**：执行以下验证清单，确认所有目标达成。

**验证清单**：

```bash
# === 仓库文档验证 ===

# 1. 规范文档存在且包含目标态声明
test -f docs/submission-spec.md && echo "PASS: submission-spec.md exists"
grep -q "目标态" docs/submission-spec.md && echo "PASS: target-state framing found"
grep -q "MUST" docs/submission-spec.md && echo "PASS: normative MUST wording found"
grep -q "submission-legacy-deviations" docs/submission-spec.md && echo "PASS: deviations doc referenced"

# 2. 偏差登记文档存在且包含迁移触发条件
test -f docs/submission-legacy-deviations.md && echo "PASS: deviations doc exists"
grep -q "迁移触发" docs/submission-legacy-deviations.md && echo "PASS: migration triggers found"

# 3. 旧文档已归档
test -f docs/archive/submodule-submission-guidelines.md && echo "PASS: old doc 1 archived"
test -f "docs/archive/子模块数据规范1205.md" && echo "PASS: old doc 2 archived"

# 4. 旧文档不在 docs/ 根目录
! test -f docs/submodule-submission-guidelines.md && echo "PASS: old doc 1 removed from root"
! test -f "docs/子模块数据规范1205.md" && echo "PASS: old doc 2 removed from root"

# 5. 仓库文档无旧引用
! grep -q "submodule-submission-guidelines" AGENTS.md && echo "PASS: AGENTS.md clean"
! grep -q "submodule-submission-guidelines" docs/submodule-page-build-process.md && echo "PASS: build-process clean"
! grep -q "submodule-submission-guidelines" docs/submodule-build-workflow.md && echo "PASS: build-workflow clean"
! grep -q "submodule-submission-guidelines" docs/project_notes/key_facts.md && echo "PASS: key_facts clean"
! grep -q "submodule-submission-guidelines" docs/project_notes/decisions.md && echo "PASS: decisions clean"

# 6. 新引用存在（规范 + 偏差）
grep -q "submission-spec.md" AGENTS.md && echo "PASS: AGENTS.md has spec ref"
grep -q "submission-legacy-deviations" AGENTS.md && echo "PASS: AGENTS.md has deviations ref"

# === OpenSpec 验证 ===

# 7. OpenSpec specs 无陈旧页码语义
! grep -q "M2:11" openspec/project.md && echo "PASS: project.md no M2:11"
! grep -q "M2:11" openspec/specs/data-format/spec.md && echo "PASS: data-format no M2:11"
! grep -q "M2:11" openspec/specs/flow/spec.md && echo "PASS: flow no M2:11"

# 8. OpenSpec specs 无旧文档引用
! grep -q "子模块数据规范1205" openspec/specs/data-format/spec.md openspec/specs/submission/spec.md openspec/specs/flow/spec.md openspec/specs/ui-frame/spec.md && echo "PASS: OpenSpec specs no old doc refs"
! grep -q "submodule-submission-guidelines" openspec/specs/data-format/spec.md openspec/specs/submission/spec.md openspec/specs/flow/spec.md openspec/specs/ui-frame/spec.md && echo "PASS: OpenSpec specs no old guidelines refs"

# 9. 活跃变更无旧文档引用
! grep -rq "子模块数据规范1205" openspec/changes/fix-submodule-flow-context-compliance/ openspec/changes/migrate-g8-pv-sand-to-shared-utilities/ && echo "PASS: active changes no old doc refs"

# 10. 活跃变更中 0.* 格式已加注或修正
# (检查 migration-details 中是否残留未加注的 0.* 规范性示例)
grep -rn "pageNumber.*0\.[0-9]" openspec/changes/migrate-grade7-*/migration-details.md | grep -v "遗留" | grep -v "旧格式" | grep -v "偏差" && echo "WARN: unstale 0.* examples in migration-details" || echo "PASS: migration-details 0.* properly annotated"

# === 通用验证 ===

# 11. 不含旧式"以代码为准"措辞
! grep -q "以代码/测试/校验器的实际行为为准" docs/submission-spec.md && echo "PASS: no stale code-first framing in spec"

# 12. 运行时代码无变化
git diff --stat src/ | grep -q "" && echo "WARN: runtime files changed!" || echo "PASS: no runtime changes"

# 13. 构建不受影响
npm run build && echo "PASS: build succeeds"

# 14. 提交测试不受影响
npm run test:submission && echo "PASS: submission tests pass"
```

**验收标准**：所有检查项输出 `PASS`，无 `WARN` 或 `FAIL`。

**需采集的证据**：完整验证输出。

**是否提交**：否（纯验证）。

---

## 提交策略

| 提交 | 包含内容 | 消息模板 |
|------|---------|---------|
| 提交 1（T12+T13） | 创建 `docs/submission-spec.md` 和 `docs/submission-legacy-deviations.md`；移动旧文档到 `docs/archive/`；更新仓库文档引用 | `docs: 建立目标态提交规范与遗留偏差登记，归档旧文档并更新引用` |
| 提交 2（T14+T15） | 更新 OpenSpec specs 语义与引用；更新活跃变更的陈旧语义与引用 | `docs(openspec): 同步 OpenSpec specs 和活跃变更与目标态提交规范对齐` |
| 提交 3（T16 修复，如有） | 修复遗漏的陈旧引用或陈旧语义 | `docs: 修复遗漏的陈旧提交规范引用` |
| 提交 4（T17 修正，如有） | 修正规范/偏差登记/OpenSpec 中的不一致 | `docs: 修正规范/偏差登记/OpenSpec 文档不一致处` |

提交 1 和 2 是必需的。提交 3 和 4 仅在发现问题时产生。

**分支策略**：在当前分支直接提交，或创建 `docs/unify-submission-spec` 分支后 PR 合并（视团队偏好）。

---

## 成功标准

- [ ] `docs/submission-spec.md` 存在，包含目标态声明、MUST/SHOULD 措辞、适用范围标注、Part A-D。
- [ ] `docs/submission-legacy-deviations.md` 存在，包含至少 3 条偏差记录，每条含完整 8 列信息。
- [ ] `docs/archive/submodule-submission-guidelines.md` 存在，内容与原文件一致。
- [ ] `docs/archive/子模块数据规范1205.md` 存在，内容与原文件一致。
- [ ] 规范文档不含"以代码为准"的旧措辞。
- [ ] 规范文档中每条 MUST 规则有 rationale 和 verification path。
- [ ] 仓库文档作用域内不再引用旧文档路径。
- [ ] 仓库文档包含对 `submission-legacy-deviations.md` 的适当引用。
- [ ] `openspec/project.md` 不再包含 `M2:11` 或 `2.11` 作为规范性示例。
- [ ] `openspec/specs/data-format/spec.md`、`submission/spec.md`、`flow/spec.md`、`ui-frame/spec.md` 与目标态规范无冲突。
- [ ] 活跃变更目录不再引用 `docs/子模块数据规范1205.md`。
- [ ] 活跃变更中的 `0.*` 格式示例已修正或加注"遗留格式"。
- [ ] 排除范围（openspec archive、子模块需求文档）未被修改。
- [ ] `src/` 目录下无任何文件被修改。
- [ ] `npm run build` 通过。
- [ ] `npm run test:submission` 通过。
- [ ] `npm run test:submission-format` 通过。

---

## 护栏

| 护栏 | 说明 |
|------|------|
| 不编辑运行时提交代码 | `src/shared/services/submission/*` 中的 `.js`/`.ts` 文件只读 |
| 规范是目标态而非代码镜像 | 规范定义"应当做到什么"，代码是"当前做到了什么"，差距通过偏差登记管理 |
| 每条 MUST 规则可验证 | 必须有 rationale 和 intended verification path，禁止纯愿景条文 |
| 不在正文混入遗留例外 | 遗留模块的所有偏差集中在 `submission-legacy-deviations.md`，规范正文保持纯净 |
| OpenSpec 与仓库文档必须一致 | OpenSpec specs 和活跃变更 MUST 与 `docs/submission-spec.md` 对齐，不能出现两边说法矛盾 |
| 不重写历史归档 | `openspec/changes/archive/` 和 `docs/子模块需求文档/` 不在本次范围，不触碰 |
| 不静默改变活跃变更意图 | 对活跃变更的修改仅限于提交规范语义对齐，不改变迁移意图或任务完成状态 |
| 不留冲突引用 | 作用域内不能同时存在旧文档路径和新文档路径的引用 |
| 不创建重定向 stub | 旧文档归档但不留空文件占位，避免"看起来还在"的误导 |
