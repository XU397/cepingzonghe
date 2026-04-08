# G8 香蕉变黑子模块提交合规修复方案

## TL;DR

> **Summary**: 在不改动共享提交入口架构的前提下，修复 `g8-banana-browning-experiment` 的答案格式、事件语义、阻断载荷、模拟实验证据与回归测试，使最终提交重新符合 OpenSpec + Schema + 共享运行时约束。
> **Deliverables**:
>
> - 香蕉子模块 `mapping/context/Component/pages/components` 的本地合规修复
> - 香蕉子模块专属 `mapping / submission-format / snapshot / SimulationPanel` 回归测试
> - 通过香蕉目录 LSP diagnostics（`.ts` / `.tsx`）与 `npm run build` 的最终验证
>   **Effort**: Medium
>   **Parallel**: YES - 2 waves
>   **Critical Path**: 1 → 2 → 3 → 5 → 6 → 8 → 9 → 10

## Context

### Original Request

- 基于前序审查结论，为 `8年级香蕉变黑科学探究` 子模块制定一份修复工作方案，方案完成后可直接进入实施。

### Interview Summary

- 当前问题被界定为“恢复既有提交规范”的修复，不是新增能力。
- 允许修改范围仅限 `src/submodules/g8-banana-browning-experiment/**` 及其香蕉专属测试文件；禁止扩展到其他子模块。
- 主规范基线采用：`openspec/specs/data-format/spec.md:6-47,87-100`、`openspec/specs/submission/spec.md:6-41,48-59,80-123`、`src/shared/services/submission/schema.ts:4-39,52-53,141-262,281-293`。
- 共享运行时已正确接线：`src/submodules/g8-banana-browning-experiment/Component.tsx:230-263,343-370` → `src/shared/ui/PageFrame/AssessmentPageFrame.jsx:336-360,777-816` → `src/shared/services/submission/usePageSubmission.js:496-557,690-779`。
- 参考实现锚点为 `src/submodules/g8-mikania-experiment/mapping.ts:245-285` 与 `src/submodules/g8-pv-sand-experiment/__tests__/submission-format.test.ts:350-435`、`src/submodules/g8-pv-sand-experiment/__tests__/submission.snapshot.test.ts:123-239`。

### Metis Review (gaps addressed)

- Guardrail 1：修复必须分成两个红绿切片执行——先答案格式 / 阻断载荷 / 类型一致性，再事件语义 / 模拟证据 / 回归快照，防止一次性大改导致回归面过宽。
- Guardrail 2：若修复被迫修改 `AssessmentPageFrame.jsx`、`usePageSubmission.js` 或 shared submission 架构，立即停下并回到重规划；本方案不授权 shared 架构改造。
- Guardrail 3：`click_blocked` 不能只靠 schema 兜底，必须由香蕉子模块专属测试显式断言 `value.missing: string[]`。
- Guardrail 4：Q5 必须覆盖 `E. 15天`，且答案格式化需要同时兼容“标签值”和“原始文案值”，避免只修一半。
- Guardrail 5：`Page01Notice.tsx` 当前 `disabled` 复选框会吞掉阻断交互，必须改为“可触发 handler、但逻辑阻断不切换状态”的实现。

## Work Objectives

### Core Objective

- 让 `g8-banana-browning-experiment` 的最终页面提交重新满足仓库现行数据提交规范：页码格式正确、答案格式正确、事件语义正确、阻断载荷完整、模拟实验页具备可审计操作证据、回归测试可锁定行为。

### Deliverables

- `src/submodules/g8-banana-browning-experiment/mapping.ts`：单选答案格式化兼容标签值与文案值，覆盖 Q5/Q6/Q7。
- `src/submodules/g8-banana-browning-experiment/types.ts`、`context/G8BananaBrowningContext.tsx`：本地事件与 operation 类型与共享 submission 合同对齐。
- `src/submodules/g8-banana-browning-experiment/Component.tsx`：`validatePage()` / `handleFrameNext()` 输出稳定的 `missing` 列表与合规 `click_blocked` 载荷。
- `src/submodules/g8-banana-browning-experiment/pages/Page01Notice.tsx`、`Page10SimulationQuestion1.tsx`、`Page11SimulationQuestion2.tsx`、`Page12SimulationQuestion3.tsx`：阻断交互、`radio_select` 语义与题目值对齐。
- `src/submodules/g8-banana-browning-experiment/components/SimulationPanel.tsx`：记录 `simulation_operation`、`simulation_timing_started`、`simulation_run_result`。
- 香蕉子模块专属测试文件：
  - `src/submodules/g8-banana-browning-experiment/__tests__/mapping.test.ts`
  - `src/submodules/g8-banana-browning-experiment/pages/__tests__/Page01Notice.test.tsx`
  - `src/submodules/g8-banana-browning-experiment/pages/__tests__/SimulationQuestionPages.test.tsx`
  - `src/submodules/g8-banana-browning-experiment/components/__tests__/SimulationPanel.test.tsx`
  - `src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts`
  - `src/submodules/g8-banana-browning-experiment/__tests__/submission.snapshot.test.ts`

### Definition of Done (verifiable conditions with commands)

- `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/mapping.test.ts`
- `npx vitest run src/submodules/g8-banana-browning-experiment/pages/__tests__/Page01Notice.test.tsx`
- `npx vitest run src/submodules/g8-banana-browning-experiment/pages/__tests__/SimulationQuestionPages.test.tsx`
- `npx vitest run src/submodules/g8-banana-browning-experiment/components/__tests__/SimulationPanel.test.tsx`
- `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts`
- `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/submission.snapshot.test.ts`
- LSP diagnostics: `src/submodules/g8-banana-browning-experiment` for `.ts` and `.tsx` → 0 errors
- `npm run build`

### Must Have

- 所有 Q5/Q6/Q7 最终答案值统一为 `"<标签>. <选项文本>"`。
- `click_blocked.value` 至少包含 `reason`、`missing: string[]`、`timestamp`；Notice 页允许额外带 `remainingSeconds`。
- Q10/Q11/Q12 选择事件必须记录为 `radio_select`，不得继续使用普通 `click`。
- `SimulationPanel` 至少输出一条 `simulation_operation`、一条 `simulation_timing_started`、一条 `simulation_run_result`，且结果 payload 含 6 组香蕉条件数据。
- `validatePage()` 必须能返回机器可消费的 `missing` 列表，而不仅是 message 字符串。
- 香蕉专属测试必须显式锁定 Q5 选项 `E`、`click_blocked.missing`、单页单次 `flow_context`、模拟实验事件。

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- 不修改 `src/shared/ui/PageFrame/AssessmentPageFrame.jsx`、`src/shared/services/submission/usePageSubmission.js`、`src/shared/services/submission/schema.ts` 的行为实现。
- 不扩展到其他子模块，也不做 repo-wide 事件命名清洗。
- 不引入页面手写 `pageNumber`、手写 target prefix、直连 `/stu/saveHcMark`。
- 不保留当前过期的 phase-1 空映射断言。
- 不使用“人工点一点看结果”作为验收手段；全部验收必须可由 agent 通过命令完成。

## Verification Strategy

> ZERO HUMAN INTERVENTION — all verification is agent-executed.

- Test decision: tests-after + Vitest（现有基础设施已存在，且本任务目标是修复既有行为，不强行改为 TDD 目录外工作流）
- QA policy: 每个任务必须自带可执行 QA 场景；所有场景以 `vitest`、`tsc`、`build` 命令为主，不依赖人工点击。
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.txt`
- Type-health note: 仓库存在香蕉范围外的既有 TS 基线错误，因此类型验收收敛为香蕉子模块目录的 LSP diagnostics 零错误，而不是全仓 `tsc` 绿灯。

## Execution Strategy

### Parallel Execution Waves

> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: 测试基线、答案格式、类型契约、统一阻断、Notice 交互（Tasks 1-5）

Wave 2: 模拟实验前置条件、单选语义、模拟事件、submission 回归测试（Tasks 6-10）

### Dependency Matrix (full, all tasks)

- 1 → 2, 9, 10
- 2 → 6, 7, 9, 10
- 3 → 4, 7, 8, 9, 10
- 4 → 5, 6, 9, 10
- 5 → 9, 10
- 6 → 7, 9, 10
- 7 → 8, 9, 10
- 8 → 9, 10
- 9 → 10
- 10 → F1-F4

### Agent Dispatch Summary (wave → task count → categories)

- Wave 1 → 5 tasks → `quick` ×2, `unspecified-low` ×3
- Wave 2 → 5 tasks → `unspecified-low` ×3, `unspecified-high` ×2

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [ ] 1. 重写香蕉 mapping 回归基线并移除 phase-1 过期断言

  **What to do**: 重写 `src/submodules/g8-banana-browning-experiment/__tests__/mapping.test.ts`，保留页码/页面顺序与 `validateMappingConfig()` 断言，但删除 `phase-1 question config maps should remain empty` 相关假设；新增 Q5/Q6/Q7 的答案格式化断言，至少覆盖 `A`、`E`、原始文案值三类输入，并验证 `QUESTION_OPTIONS_MAP` 与 `ANSWER_KEY_TO_QUESTION` 的映射完整性。
  **Must NOT do**: 不保留任何“question maps 为空”“options 为空”的断言；不触碰其他子模块测试文件。

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: 单文件测试重写，规则明确。
  - Skills: `[]` — 无额外 skill 需求，直接对照本地规范即可。
  - Omitted: [`codebase-documenter`] — 非文档任务。

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2, 9, 10 | Blocked By: none

  **References** (executor has NO interview context — be exhaustive):
  - Current stale test: `src/submodules/g8-banana-browning-experiment/__tests__/mapping.test.ts:19-65` — 这里存在已失效的 phase-1 空映射断言。
  - Banana mapping source: `src/submodules/g8-banana-browning-experiment/mapping.ts:50-151,296-343` — 当前题目映射、选项映射与 `formatAnswerValue()` 实现。
  - Reference tolerant formatter: `src/submodules/g8-mikania-experiment/mapping.ts:245-285` — 支持“标签值 / 文案值”双输入的标准模式。
  - Mapping config validation pattern: `src/submodules/g8-pv-sand-experiment/__tests__/submission-format.test.ts:411-435` — 题干与答案值的规范快照示例。

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/mapping.test.ts` 退出码为 0。
  - [ ] 测试中显式断言：`formatAnswerValue('Q5', 'A') === 'A. 3天'`、`formatAnswerValue('Q5', 'E') === 'E. 15天'`、`formatAnswerValue('Q5', '15天') === 'E. 15天'`、`formatAnswerValue('Q6', '海南香蕉') === 'A. 海南香蕉'`、`formatAnswerValue('Q7', '18℃') === 'C. 18℃'`。

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Mapping baseline passes
    Tool: Bash
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/mapping.test.ts`
    Expected: all mapping assertions pass; output contains no phase-1 empty-map failures
    Evidence: .sisyphus/evidence/task-1-banana-mapping-baseline.txt

  Scenario: Option text fallback includes Q5 option E
    Tool: Bash
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/mapping.test.ts -t "Q5"`
    Expected: formatter resolves both label input `E` and literal text input `15天` to `E. 15天`
    Evidence: .sisyphus/evidence/task-1-banana-mapping-q5e.txt
  ```

  **Commit**: NO | Message: ``| Files:`src/submodules/g8-banana-browning-experiment/**tests**/mapping.test.ts`

- [ ] 2. 收敛 `mapping.ts` 的单选答案格式化为唯一真相源

  **What to do**: 修改 `src/submodules/g8-banana-browning-experiment/mapping.ts` 的 `formatAnswerValue()`，采用 `g8-mikania-experiment` 的容错模式：先识别直接传入的选项标签，再反向匹配选项文本，最后输出 `"<label>. <text>"`；支持 Q5 的 `A-E`、Q6 的 `A-B`、Q7 的 `A-C`，未知值保持原样返回。保持 `SUBMODULE_MAPPING_CONFIG.formatAnswer` 继续指向该函数，不新增第二套答案格式化逻辑。
  **Must NOT do**: 不修改 `QUESTION_CODE_MAP`、`QUESTION_TEXT_MAP`、`ANSWER_KEY_TO_QUESTION` 的业务编号；不在页面组件里重复格式化答案。

  **Recommended Agent Profile**:
  - Category: `quick` — Reason: 单文件逻辑修复，对照实现清晰。
  - Skills: `[]` — 本地参考实现已足够。
  - Omitted: [`frontend-design`] — 非界面设计任务。

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 6, 7, 9, 10 | Blocked By: 1

  **References** (executor has NO interview context — be exhaustive):
  - Banana options and formatter: `src/submodules/g8-banana-browning-experiment/mapping.ts:134-151,296-315` — 当前只支持 `A-D` 且不做文案反查。
  - Required answer contract: `openspec/specs/data-format/spec.md:42-47` — `answerList` 只收非空字符串，单选答案需稳定输出字符串值。
  - Submission spec on consistent formatting: `openspec/specs/submission/spec.md:29-35` — 提交层只负责前缀/上下文，业务答案语义应在子模块侧准备好。
  - Reference formatter: `src/submodules/g8-mikania-experiment/mapping.ts:245-270` — 推荐直接复用相同判定顺序。

  **Acceptance Criteria** (agent-executable only):
  - [ ] `formatAnswerValue()` 对标签输入和值输入均输出带标签的规范字符串。
  - [ ] `SUBMODULE_MAPPING_CONFIG.formatAnswer` 仍然指向同一个 formatter，后续 `collectAnswers()` 不需要额外改造即可获得规范值。

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Labeled answer formatting works for all single-choice questions
    Tool: Bash
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/mapping.test.ts`
    Expected: Q5/Q6/Q7 formatting assertions all pass, including raw text fallback
    Evidence: .sisyphus/evidence/task-2-banana-formatting.txt

  Scenario: Unknown answer text remains unchanged
    Tool: Bash
    Steps: extend mapping test with an unsupported value case and run `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/mapping.test.ts -t "unknown"`
    Expected: unsupported value is returned unchanged rather than mis-labeled
    Evidence: .sisyphus/evidence/task-2-banana-formatting-edge.txt
  ```

  **Commit**: NO | Message: ``| Files:`src/submodules/g8-banana-browning-experiment/mapping.ts`, `src/submodules/g8-banana-browning-experiment/**tests**/mapping.test.ts`

- [ ] 3. 对齐本地 operation 类型与 flow_context 注入兼容层

  **What to do**: 修复 `src/submodules/g8-banana-browning-experiment/types.ts` 与 `context/G8BananaBrowningContext.tsx` 的本地类型漂移。决策如下：
  1. 将 `OperationLog.eventType` 放宽为与共享提交合同兼容的 `string`；
  2. 将 `OperationLog.value` 定义为 `string | Record<string, unknown>`；
  3. 在 context 内新增仅供 `shouldInjectFlowContext()` / `injectFlowContext()` 使用的本地归一化 helper，把 object 值转成可注入的字符串表示后再调用 adapter，避免直接改 shared adapter 类型；
  4. 注入回来的 `flow_context` operation 再映射回本地 `OperationLog`；
  5. 不改变 `getPagePrefix()`、`createOperationSequence()`、`clearOperations()` 的现有行为。
     **Must NOT do**: 不修改 `src/shared/services/submission/submoduleAdapter/types.ts`；不把这次修复升级为 shared 类型重构。

  **Recommended Agent Profile**:
  - Category: `unspecified-low` — Reason: 涉及本地类型、context 与 adapter 调用边界，需要谨慎处理。
  - Skills: `[]` — 本地代码与 LSP 诊断足够。
  - Omitted: [`vercel-react-best-practices`] — 非性能优化任务。

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4, 7, 8, 9, 10 | Blocked By: 1

  **References** (executor has NO interview context — be exhaustive):
  - Current local type drift: `src/submodules/g8-banana-browning-experiment/types.ts:29-52` — 事件枚举过窄，`value` 用 `object` 与 adapter 类型不兼容。
  - Current context injection path: `src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx:204-261` — 直接把本地 `OperationLog[]` 传给 `injectFlowContext()`。
  - Adapter type contract: `src/shared/services/submission/submoduleAdapter/types.ts:6-18,91-100,143-159` — `Operation.value` 为 string，FlowContext 结构在此定义。
  - Submission spec on flexible composition mode: `openspec/specs/submission/spec.md:11-16,80-123,144-149` — 本地组合模式必须使用 `createOperationSequence` 与 `injectFlowContext`，但不要求修改 shared 类型。

  **Acceptance Criteria** (agent-executable only):
  - [ ] `src/submodules/g8-banana-browning-experiment` 目录在 LSP diagnostics（`.ts` 与 `.tsx`）下不再出现 `OperationLog[]` / `StandardEventType` 相关错误。
  - [ ] `flow_context` 仍然只在 `page_enter` 后注入一次，未引入重复注入。

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Banana submodule type diagnostics are clean
    Tool: LSP diagnostics
    Steps: run diagnostics on `src/submodules/g8-banana-browning-experiment` for extensions `.ts` and `.tsx`
    Expected: no TypeScript errors from `types.ts`, `G8BananaBrowningContext.tsx`, `Page01Notice.tsx`, or other banana files
    Evidence: .sisyphus/evidence/task-3-banana-types.txt

  Scenario: Flow-context injection remains single-shot
    Tool: Bash
    Steps: after task 10 lands, run `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/submission.snapshot.test.ts -t "flow_context"`
    Expected: each inspected mark contains exactly one `flow_context` operation inserted after `page_enter`
    Evidence: .sisyphus/evidence/task-3-banana-flow-context.txt
  ```

  **Commit**: NO | Message: ``| Files:`src/submodules/g8-banana-browning-experiment/types.ts`, `src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx`

- [ ] 4. 统一 `validatePage()` 返回契约与 `click_blocked` 载荷格式

  **What to do**: 重构 `src/submodules/g8-banana-browning-experiment/Component.tsx` 的 `validatePage()` 与 `handleFrameNext()`，把当前 `{ ok, message }` 返回值升级为统一结构：`{ ok: true } | { ok: false, reason: string, message: string, missing: string[] }`。`handleFrameNext()` 必须使用该结构生成唯一的 next-button 阻断事件：
  - `targetElement`: `P${pageNumber}_下一页按钮`
  - `eventType`: `click_blocked`
  - `value`: `{ reason, missing, timestamp, message }`
    其中 `missing` 必须使用稳定键名而不是 UI 文案，例如：
  - intro_notice: `['timer_completed', 'instructions_read']`（按缺失项裁剪）
  - Q5: `['Q5_海南香蕉变黑时间']`
  - Q8: `['Q8_方案表格', 'Q8_最优方案', 'Q8_理由']`
    同时把 `validatePage()` 的签名扩展为接收当前页 `operations`，为后续 simulation 前置条件校验留好接口。
    **Must NOT do**: 不在各页面里重复组装 next-button 的 `click_blocked`；不把 missing 写成中文提示文案。

  **Recommended Agent Profile**:
  - Category: `unspecified-low` — Reason: 需要改动统一验证入口，但仍限于子模块局部文件。
  - Skills: `[]` — 本地组件与 spec 足够。
  - Omitted: [`ui-ux-pro-max`] — 非视觉优化任务。

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5, 6, 9 | Blocked By: 3

  **References** (executor has NO interview context — be exhaustive):
  - Current validation path: `src/submodules/g8-banana-browning-experiment/Component.tsx:83-143,290-317` — 只有 message，没有 missing。
  - Data-format rule for `click_blocked`: `openspec/specs/data-format/spec.md:31-37,87-91` — `click_blocked.value` 必须带 `missing: string[]`。
  - Submission spec on blocked events: `openspec/specs/submission/spec.md:33-35,56-59` — 阻断事件必须可被守卫测试消费。
  - Shared schema limitation: `src/shared/services/submission/schema.ts:141-214,281-293` — schema 不会自动检查 `missing`，所以香蕉专属测试必须补足。

  **Acceptance Criteria** (agent-executable only):
  - [ ] `validatePage()` 能返回稳定的 `missing` 键集合，不再只返回通用 message。
  - [ ] 下一步被阻断时，`click_blocked.value` 至少包含 `reason`、`missing`、`timestamp`、`message`。

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Next-button blocked payload includes missing keys
    Tool: Bash
    Steps: after task 9 lands, run `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts -t "click_blocked"`
    Expected: blocked payloads for intro/Q5/Q8 all include stable `missing` arrays
    Evidence: .sisyphus/evidence/task-4-banana-click-blocked.txt

  Scenario: Empty solution-selection page returns all missing keys
    Tool: Bash
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts -t "solution_selection"`
    Expected: missing array exactly equals `['Q8_方案表格', 'Q8_最优方案', 'Q8_理由']`
    Evidence: .sisyphus/evidence/task-4-banana-q8-missing.txt
  ```

  **Commit**: NO | Message: ``| Files:`src/submodules/g8-banana-browning-experiment/Component.tsx`, `src/submodules/g8-banana-browning-experiment/**tests**/submission-format.test.ts`

- [ ] 5. 恢复 Notice 页阻断交互的可观测性并对齐载荷

  **What to do**: 修改 `src/submodules/g8-banana-browning-experiment/pages/Page01Notice.tsx`，确保“倒计时未结束前尝试勾选”的行为真实进入 handler 并记录 `click_blocked`，同时不改变未到时不得勾选的业务效果。决策如下：
  - 移除原生 `disabled={!canCheck}` 的阻断方式，改为 `aria-disabled` + 视觉样式 + 受控 handler 阻断；
  - `handleCheckboxChange()` 在 `!canCheck` 时必须记录 `click_blocked`，`value` 为 `{ reason: 'countdown_not_finished', missing: ['timer_completed'], timestamp, remainingSeconds }`；
  - 只有 `canCheck === true` 时才允许切换 `instructions_read` 与对应 `checkbox_check/checkbox_uncheck` 日志；
  - 为该页新增 `src/submodules/g8-banana-browning-experiment/pages/__tests__/Page01Notice.test.tsx`，覆盖“阻断点击”和“倒计时结束后可勾选”两条路径。
    **Must NOT do**: 不要在倒计时未结束时偷偷写入 `instructions_read=true`；不要继续依赖原生 `disabled` 导致阻断事件无法落日志。

  **Recommended Agent Profile**:
  - Category: `unspecified-low` — Reason: 页面逻辑与测试双改动，但影响面仅限 Notice 页。
  - Skills: `[]` — 现有 Testing Library 基础设施足够。
  - Omitted: [`frontend-design`] — 不是视觉重构。

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 9 | Blocked By: 4

  **References** (executor has NO interview context — be exhaustive):
  - Current blocked path: `src/submodules/g8-banana-browning-experiment/pages/Page01Notice.tsx:42-90,121-137` — 现在 `disabled={!canCheck}` 会吞掉交互。
  - Current intro validation requirements: `src/submodules/g8-banana-browning-experiment/Component.tsx:88-96` — 下一步仍要求 `timer_completed` 与 `instructions_read`。
  - Spec on blocked events: `openspec/specs/data-format/spec.md:31-37,89-91` — 阻断事件必须可追溯并带 missing。

  **Acceptance Criteria** (agent-executable only):
  - [ ] 倒计时未结束时，测试可真实触发一次 `click_blocked`，且不会写入 `instructions_read=true`。
  - [ ] 倒计时结束后，测试可成功切换复选框并记录 `checkbox_check`。

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Blocked checkbox interaction is logged before countdown completes
    Tool: Bash
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/pages/__tests__/Page01Notice.test.tsx -t "countdown_not_finished"`
    Expected: one `click_blocked` with `missing: ['timer_completed']`, no answer state flip
    Evidence: .sisyphus/evidence/task-5-banana-notice-blocked.txt

  Scenario: Checkbox becomes actionable after countdown
    Tool: Bash
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/pages/__tests__/Page01Notice.test.tsx -t "allows checking after countdown"`
    Expected: `instructions_read` becomes true and a `checkbox_check` event is recorded
    Evidence: .sisyphus/evidence/task-5-banana-notice-unlocked.txt
  ```

  **Commit**: YES | Message: `fix(g8-banana-submission): align answer formatting and blocked validation` | Files: `src/submodules/g8-banana-browning-experiment/mapping.ts`, `src/submodules/g8-banana-browning-experiment/types.ts`, `src/submodules/g8-banana-browning-experiment/context/G8BananaBrowningContext.tsx`, `src/submodules/g8-banana-browning-experiment/Component.tsx`, `src/submodules/g8-banana-browning-experiment/pages/Page01Notice.tsx`, `src/submodules/g8-banana-browning-experiment/__tests__/mapping.test.ts`, `src/submodules/g8-banana-browning-experiment/pages/__tests__/Page01Notice.test.tsx`

- [ ] 6. 为 Q10/Q11/Q12 引入“完成一次模拟结果”前置条件

  **What to do**: 在 `src/submodules/g8-banana-browning-experiment/Component.tsx` 的 `validatePage()` 中，为 `simulation_question_1`、`simulation_question_2`、`simulation_question_3` 增加当前页 simulation 前置条件：若当前页 `operations` 中不存在 `simulation_run_result`，则禁止进入下一步，并把 `missing` 中加入 `'simulation_run_result'`。缺失列表的顺序固定为：先 `simulation_run_result`，后题目 answer key（例如 `['simulation_run_result', 'Q5_海南香蕉变黑时间']`）。实现时直接检查当前页 operation 缓冲区，不新增全局 `simulationHistory` 状态。
  **Must NOT do**: 不把 page09 的实验结果跨页复用到 Q10-Q12；不在 context 中新增长期缓存状态来“补证据”。

  **Recommended Agent Profile**:
  - Category: `unspecified-low` — Reason: 改的是子模块局部校验策略，但会影响问题页提交门槛。
  - Skills: `[]` — 无需额外 skill。
  - Omitted: [`project-memory`] — 非知识库维护任务。

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 7, 9, 10 | Blocked By: 2, 4

  **References** (executor has NO interview context — be exhaustive):
  - Current question validation: `src/submodules/g8-banana-browning-experiment/Component.tsx:122-139` — 目前只检查答案是否存在，不检查模拟结果。
  - Simulation panel reuse: `src/submodules/g8-banana-browning-experiment/pages/Page09BananaBrowningSimulationMain.tsx:30-65`, `src/submodules/g8-banana-browning-experiment/pages/Page10SimulationQuestion1.tsx:54-83`, `Page11SimulationQuestion2.tsx:54-83`, `Page12SimulationQuestion3.tsx:54-83` — Q10-Q12 均内嵌同一 `SimulationPanel`。
  - Spec on experiment-page minimum behavior: `openspec/specs/data-format/spec.md:87-91` — 实验页必须记录参数调整、计时开始/结束、运行结果。

  **Acceptance Criteria** (agent-executable only):
  - [ ] Q10/Q11/Q12 在无 `simulation_run_result` 时点击下一步会被阻断，并返回稳定 missing 列表。
  - [ ] 同页一旦存在至少一条 `simulation_run_result`，只要题目答案已填，验证即可通过。

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Question page blocks when no simulation result exists
    Tool: Bash
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/pages/__tests__/SimulationQuestionPages.test.tsx -t "requires simulation_run_result before submit"`
    Expected: blocked payload contains `simulation_run_result` before the question key in `missing`
    Evidence: .sisyphus/evidence/task-6-banana-sim-prereq-blocked.txt

  Scenario: Question page proceeds after one completed run and one answer
    Tool: Bash
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/pages/__tests__/SimulationQuestionPages.test.tsx -t "passes after result and answer"`
    Expected: validation returns ok and no `click_blocked` is emitted
    Evidence: .sisyphus/evidence/task-6-banana-sim-prereq-passed.txt
  ```

  **Commit**: NO | Message: ``| Files:`src/submodules/g8-banana-browning-experiment/Component.tsx`, `src/submodules/g8-banana-browning-experiment/pages/**tests**/SimulationQuestionPages.test.tsx`

- [ ] 7. 统一 Q10/Q11/Q12 的单选语义事件与答案采集策略

  **What to do**: 修改 `Page10SimulationQuestion1.tsx`、`Page11SimulationQuestion2.tsx`、`Page12SimulationQuestion3.tsx`，统一采用以下策略：
  - `collectAnswer()` 继续保存原始选项文案（例如 `6天`、`海南香蕉`、`18℃`），以保持页面回显最小改动；
  - 操作日志改为 `eventType: radio_select`；
  - `targetElement` 固定为 `${targetPrefix}${answerKey}`（分别为 `Q5_海南香蕉变黑时间`、`Q6_常温储存品种`、`Q7_平缓温度`）；
  - `value` 记录为带标签的规范字符串（例如 `B. 6天`）；
  - 页面初始 `selectedOption` 必须从 context 已保存答案恢复，避免用户回到页面后 UI 与 answerDraft 不一致。
    同时为这三页新增/扩展 `src/submodules/g8-banana-browning-experiment/pages/__tests__/SimulationQuestionPages.test.tsx`，覆盖 `radio_select`、答案回显、禁止继续使用普通 `click` 三类断言。
    **Must NOT do**: 不把 label 值写入 `answerDraft`；不保留同一交互的重复 `click` 和 `radio_select` 双日志。

  **Recommended Agent Profile**:
  - Category: `unspecified-low` — Reason: 三个页面并行同构修改，规则统一。
  - Skills: `[]` — 本地模式明确。
  - Omitted: [`ui-ux-pro-max`] — 非样式任务。

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 9, 10 | Blocked By: 2, 6

  **References** (executor has NO interview context — be exhaustive):
  - Current Q5 page: `src/submodules/g8-banana-browning-experiment/pages/Page10SimulationQuestion1.tsx:7-42` — 现在记录 `click` 且 value 为裸文案。
  - Current Q6 page: `src/submodules/g8-banana-browning-experiment/pages/Page11SimulationQuestion2.tsx:7-42` — 同上。
  - Current Q7 page: `src/submodules/g8-banana-browning-experiment/pages/Page12SimulationQuestion3.tsx:7-42` — 同上。
  - Required event semantics: `openspec/specs/data-format/spec.md:34-37`、`openspec/specs/submission/spec.md:29-35,56-59` — 单选必须用 `radio_select`，并可被最小事件守卫识别。
  - Final answer formatting source: `src/submodules/g8-banana-browning-experiment/mapping.ts:134-151,296-315` — 页面保留原始值，最终格式化交给 mapping。

  **Acceptance Criteria** (agent-executable only):
  - [ ] Q10/Q11/Q12 的选择日志全部改为 `radio_select`，且 `value` 为带标签的规范字符串。
  - [ ] 页面重新挂载时，`selectedOption` 能从已保存的原始值恢复。
  - [ ] 相关测试显式断言没有遗留普通 `click` 事件。

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Q5/Q6/Q7 emit radio_select with labeled values
    Tool: Bash
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/pages/__tests__/SimulationQuestionPages.test.tsx -t "radio_select"`
    Expected: emitted operations use `radio_select`; values are `B. 6天`, `A. 海南香蕉`, `C. 18℃`
    Evidence: .sisyphus/evidence/task-7-banana-radio-select.txt

  Scenario: Revisit keeps saved answer selected
    Tool: Bash
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/pages/__tests__/SimulationQuestionPages.test.tsx -t "rehydrates selected option"`
    Expected: component re-renders with the previously saved raw answer selected and no duplicate click logs
    Evidence: .sisyphus/evidence/task-7-banana-radio-rehydrate.txt
  ```

  **Commit**: NO | Message: ``| Files:`src/submodules/g8-banana-browning-experiment/pages/Page10SimulationQuestion1.tsx`, `src/submodules/g8-banana-browning-experiment/pages/Page11SimulationQuestion2.tsx`, `src/submodules/g8-banana-browning-experiment/pages/Page12SimulationQuestion3.tsx`, `src/submodules/g8-banana-browning-experiment/pages/**tests**/SimulationQuestionPages.test.tsx`

- [ ] 8. 用语义化 simulation 事件替换 SimulationPanel 的通用 click 日志

  **What to do**: 修改 `src/submodules/g8-banana-browning-experiment/components/SimulationPanel.tsx`，把当前 `+/-/开始/重置` 的泛化 `click` 事件替换为语义化 simulation 事件：
  - 天数增加/减少：`simulation_operation`，`value` 为 `{ action: 'increment_day' | 'decrement_day', fromDay, toDay }`
  - 重置：`simulation_operation`，`value` 为 `{ action: 'reset', fromDay, toDay: 0 }`
  - 开始实验：`simulation_timing_started`，`value` 为 `{ selectedDay, totalConditions: 6 }`
  - 动画结束：`simulation_run_result`，`value` 为 `{ selectedDay, results: [{ origin, temperature, browning }, ...6] }`
    并新增 `src/submodules/g8-banana-browning-experiment/components/__tests__/SimulationPanel.test.tsx`，验证完整操作序列与结果 payload。页面 09-12 继续通过传入 `logOperation` / `targetPrefix` 复用该面板，不新增第二条提交路径。
    **Must NOT do**: 不再为同一控件同时保留 `click` 和 simulation 事件；不在页面组件里复制 SimulationPanel 的埋点逻辑。

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: 动画完成时机、payload 结构与组件测试都需要精细处理。
  - Skills: `[]` — 本地组件与现有 test stack 足够。
  - Omitted: [`frontend-design`] — 不做视觉重绘。

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 9, 10 | Blocked By: 3, 6

  **References** (executor has NO interview context — be exhaustive):
  - Current panel logging: `src/submodules/g8-banana-browning-experiment/components/SimulationPanel.tsx:226-303` — 当前只有 `click`。
  - Shared event set: `src/shared/services/submission/eventTypes.js:25-37` — 已提供 `simulation_operation`、`simulation_timing_started`、`simulation_run_result`。
  - Contract requirement: `openspec/specs/data-format/spec.md:31-37,87-91` — 实验页需要参数调整、开始/结束、运行结果。
  - Reference fixture semantics: `src/submodules/g8-pv-sand-experiment/__tests__/submission-format.test.ts:350-435` — 语义化 simulation 事件的理想结构。

  **Acceptance Criteria** (agent-executable only):
  - [ ] 组件测试能证明 `increment_day` / `decrement_day` / `reset` 使用 `simulation_operation`。
  - [ ] 点击“开始实验”后记录一条 `simulation_timing_started`，动画完成后记录一条 `simulation_run_result`，且结果包含 6 条条件数据。

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Simulation panel emits semantic operation sequence
    Tool: Bash
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/components/__tests__/SimulationPanel.test.tsx -t "semantic operation sequence"`
    Expected: logs `simulation_operation` for day change, `simulation_timing_started` for start, and `simulation_run_result` after completion
    Evidence: .sisyphus/evidence/task-8-banana-simulation-events.txt

  Scenario: Reset action restores day zero state
    Tool: Bash
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/components/__tests__/SimulationPanel.test.tsx -t "reset"`
    Expected: reset logs `{ action: 'reset', fromDay: <previous>, toDay: 0 }` and displayed state returns to day 0
    Evidence: .sisyphus/evidence/task-8-banana-simulation-reset.txt
  ```

  **Commit**: YES | Message: `fix(g8-banana-submission): normalize radio and simulation telemetry` | Files: `src/submodules/g8-banana-browning-experiment/Component.tsx`, `src/submodules/g8-banana-browning-experiment/pages/Page10SimulationQuestion1.tsx`, `src/submodules/g8-banana-browning-experiment/pages/Page11SimulationQuestion2.tsx`, `src/submodules/g8-banana-browning-experiment/pages/Page12SimulationQuestion3.tsx`, `src/submodules/g8-banana-browning-experiment/pages/__tests__/SimulationQuestionPages.test.tsx`, `src/submodules/g8-banana-browning-experiment/components/SimulationPanel.tsx`, `src/submodules/g8-banana-browning-experiment/components/__tests__/SimulationPanel.test.tsx`

- [ ] 9. 建立香蕉 submission-format 合规回归套件

  **What to do**: 新增 `src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts`，参照 PV 模块的 contract fixture 风格，直接构造香蕉模块的 mark fixtures 并通过 `validateMarkObject()` 验证。至少覆盖三类页面：
  - `intro_notice`：验证 `click_blocked.value.missing`、`timer_start` / `timer_complete`、`checkbox_*`
  - `simulation_question_1`：验证 `simulation_operation`、`simulation_timing_started`、`simulation_run_result`、`radio_select`、Q5 标准答案值、`flow_context`
  - `solution_selection`：验证三项 missing 列表与 `next_click/page_exit`
    该测试文件必须断言：
  - `pageNumber` 符合 `^[1-9]\d*\.\d{2}$`
  - 非保留 operation/answer targetElement 都带 `P${pageNumber}_` 前缀
  - `click_blocked` 的 `value.missing` 精确匹配预期数组
  - `validateMarkObject()` 对合规 fixture 不抛错
  - Q5/Q6/Q7 的最终答案值为带标签格式
    **Must NOT do**: 不通过人工页面操作录快照；不把 buildMark 原始结果当作最终 schema fixture。

  **Recommended Agent Profile**:
  - Category: `unspecified-low` — Reason: 测试文件较长，但规则清楚、参考实现成熟。
  - Skills: `[]` — 无需外部技能。
  - Omitted: [`codebase-documenter`] — 非文档任务。

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 10 | Blocked By: 1, 2, 3, 4, 5, 6, 7, 8

  **References** (executor has NO interview context — be exhaustive):
  - Banana module contract gaps: `src/submodules/g8-banana-browning-experiment/Component.tsx:83-143,230-263`, `src/submodules/g8-banana-browning-experiment/mapping.ts:114-151,296-315`, `src/submodules/g8-banana-browning-experiment/components/SimulationPanel.tsx:226-303`.
  - Shared schema validator: `src/shared/services/submission/schema.ts:141-262,281-313`.
  - Event/prefix rules: `openspec/specs/data-format/spec.md:9-24,30-37,87-91`.
  - Reference fixture style: `src/submodules/g8-pv-sand-experiment/__tests__/submission-format.test.ts:350-435`.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts` 退出码为 0。
  - [ ] 测试显式断言 intro/Q5/Q8 的 `click_blocked.value.missing`、simulation 语义事件、答案标签化值、`flow_context` 唯一性与 `validateMarkObject()` 成功。

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Contract fixtures satisfy shared schema
    Tool: Bash
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts`
    Expected: all banana fixtures pass `validateMarkObject()` and target-element prefix assertions
    Evidence: .sisyphus/evidence/task-9-banana-submission-format.txt

  Scenario: Blocked payload and simulation semantics are locked
    Tool: Bash
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts -t "simulation_question_1"`
    Expected: fixture includes `simulation_operation`, `simulation_timing_started`, `simulation_run_result`, `radio_select`, and exact missing arrays where applicable
    Evidence: .sisyphus/evidence/task-9-banana-submission-format-q5.txt
  ```

  **Commit**: NO | Message: ``| Files:`src/submodules/g8-banana-browning-experiment/**tests**/submission-format.test.ts`

- [ ] 10. 建立香蕉 submission snapshot 套件并完成最终命令回归

  **What to do**: 新增 `src/submodules/g8-banana-browning-experiment/__tests__/submission.snapshot.test.ts`，参照 PV 模块的 mocked-frame harness，渲染香蕉子模块并从 `submission.buildMark()` 观察 buildMark 原始输出。必须至少覆盖：
  - `simulation_question_1` 生成 `B. 6天`
  - `simulation_question_2` 生成 `A. 海南香蕉`
  - `simulation_question_3` 生成 `C. 18℃`
  - 每个被测 mark 恰好包含一次 `flow_context`
  - `pageNumber` 与 `encodeCompositePageNum()` 一致
  - `answerList.targetElement` 使用 `mapping.ts` 中完整题干文本，而不是内部短 key
    该任务完成后，执行一次最终回归：按 DoD 顺序跑完所有香蕉专属 vitest 文件、香蕉目录 LSP diagnostics 与 `npm run build`，并把输出留档。
    **Must NOT do**: 不把 snapshot 测试写成最终 normalized payload 快照；最终 normalized 合同已经由 task 9 负责。

  **Recommended Agent Profile**:
  - Category: `unspecified-high` — Reason: 需要 mocked-frame harness、跨页 buildMark 采样与最终命令回归。
  - Skills: `[]` — 参考实现完备。
  - Omitted: [`frontend-design`] — 非 UI 美化工作。

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: F1-F4 | Blocked By: 1, 2, 3, 4, 5, 6, 7, 8, 9

  **References** (executor has NO interview context — be exhaustive):
  - Banana submission wiring: `src/submodules/g8-banana-browning-experiment/Component.tsx:224-263,343-370` — buildMark / submission / pageMeta 入口。
  - Banana mapping question texts: `src/submodules/g8-banana-browning-experiment/mapping.ts:114-151` — answerList 应引用这些完整题干。
  - Reference snapshot harness: `src/submodules/g8-pv-sand-experiment/__tests__/submission.snapshot.test.ts:123-239` — mocked `AssessmentPageFrame` + `latestSubmission.buildMark()` 模式。
  - Build/prefix contract: `openspec/specs/data-format/spec.md:9-24,42-47`; `src/shared/utils/pageMapping.ts:87-103,148-152`。

  **Acceptance Criteria** (agent-executable only):
  - [ ] `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/submission.snapshot.test.ts` 退出码为 0。
  - [ ] snapshot 断言显式锁定 Q5/Q6/Q7 三页的带标签答案值、题干 targetElement、单次 `flow_context`、正确 `pageNumber`。
  - [ ] 全量回归（所有香蕉专属 vitest + 香蕉目录 LSP diagnostics + `build`）全部通过。

  **QA Scenarios** (MANDATORY — task incomplete without these):

  ```
  Scenario: Banana buildMark snapshots stay stable
    Tool: Bash
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/submission.snapshot.test.ts`
    Expected: snapshots pass for Q5/Q6/Q7 and each mark contains exactly one flow_context op
    Evidence: .sisyphus/evidence/task-10-banana-snapshots.txt

  Scenario: Final regression sweep passes
    Tool: Bash + LSP diagnostics
    Steps: run `npx vitest run src/submodules/g8-banana-browning-experiment/__tests__/mapping.test.ts src/submodules/g8-banana-browning-experiment/pages/__tests__/Page01Notice.test.tsx src/submodules/g8-banana-browning-experiment/pages/__tests__/SimulationQuestionPages.test.tsx src/submodules/g8-banana-browning-experiment/components/__tests__/SimulationPanel.test.tsx src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts src/submodules/g8-banana-browning-experiment/__tests__/submission.snapshot.test.ts && npm run build`; then run LSP diagnostics on `src/submodules/g8-banana-browning-experiment` for `.ts` and `.tsx`
    Expected: all banana tests pass, banana-directory diagnostics show 0 errors, and the production build succeeds
    Evidence: .sisyphus/evidence/task-10-banana-regression-sweep.txt
  ```

  **Commit**: YES | Message: `test(g8-banana-submission): add submission regression coverage` | Files: `src/submodules/g8-banana-browning-experiment/__tests__/submission-format.test.ts`, `src/submodules/g8-banana-browning-experiment/__tests__/submission.snapshot.test.ts`, `src/submodules/g8-banana-browning-experiment/pages/__tests__/SimulationQuestionPages.test.tsx`, `src/submodules/g8-banana-browning-experiment/components/__tests__/SimulationPanel.test.tsx`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)

> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.

- [ ] F1. Plan Compliance Audit — oracle

  **What to do**: 让 oracle 逐条对照本计划 1-10 号任务，检查实际改动是否满足每个任务的 acceptance criteria，确认没有跳步、漏测、漏文件，且最终回归命令与计划一致。
  **Must NOT do**: 不接受“看起来差不多”；必须给出 task-by-task 的通过/失败清单。

  **Acceptance Criteria**:
  - [ ] Oracle 输出明确覆盖 Tasks 1-10，且没有未完成 acceptance criteria。
  - [ ] Oracle 输出确认最终命令回归与计划中的 DoD 命令一致。

  **QA Scenarios**:

  ```
  Scenario: Task-by-task compliance audit
    Tool: oracle
    Steps: read `.sisyphus/plans/g8-banana-submission-compliance-repair.md`; inspect the final changed files and test outputs; map each change to Tasks 1-10; report pass/fail per task
    Expected: oracle report says every task is satisfied or names exact failing task numbers and missing criteria
    Evidence: .sisyphus/evidence/f1-plan-compliance-audit.txt

  Scenario: Final command audit
    Tool: oracle
    Steps: compare the executed regression commands and evidence files against the plan's Definition of Done and Task 10 sweep
    Expected: oracle confirms the executed commands exactly match the planned command set
    Evidence: .sisyphus/evidence/f1-command-audit.txt
  ```

- [ ] F2. Code Quality Review — unspecified-high

  **What to do**: 对最终改动执行高强度代码审查，重点检查：是否仍有普通 `click` 混入 Q10-Q12 / SimulationPanel、是否仍有不完整 `click_blocked` 载荷、是否引入重复日志、是否新增 shared scope 漂移、测试是否脆弱依赖实现细节。
  **Must NOT do**: 不只看测试是否通过；必须审查事件语义、类型一致性与可维护性。

  **Acceptance Criteria**:
  - [ ] Review 结论为 approve，或给出精确文件/行级问题清单并完成修复后复审通过。
  - [ ] Review 明确确认：香蕉子模块外未发生不必要变更，且没有重复 `click`/`radio_select` 或 `click`/`simulation_*` 双埋点。

  **QA Scenarios**:

  ```
  Scenario: Event semantics quality review
    Tool: unspecified-high
    Steps: inspect all changed banana files; verify radio pages emit only `radio_select`, SimulationPanel emits only semantic simulation events, and blocked payloads always contain `missing`
    Expected: reviewer approves or returns a file-by-file defect list
    Evidence: .sisyphus/evidence/f2-code-quality-review.txt

  Scenario: Test robustness review
    Tool: unspecified-high
    Steps: inspect banana test files for brittle snapshots, missing negative cases, or assertions that only mirror implementation details without contract value
    Expected: reviewer confirms tests lock contract-level behavior rather than incidental implementation trivia
    Evidence: .sisyphus/evidence/f2-test-robustness-review.txt
  ```

- [ ] F3. Automated Workflow QA — unspecified-high (+ playwright if UI)

  **What to do**: 执行全自动工作流 QA，而不是人工点击。最少要复跑 Task 10 的全量命令回归；如果执行环境支持浏览器自动化，则额外针对 Notice 页和 Q10 页面跑一条 UI 冒烟链路，验证阻断与放行行为和页面状态一致。
  **Must NOT do**: 不使用人工手点或肉眼验收；所有步骤必须可脚本化。

  **Acceptance Criteria**:
  - [ ] 自动化回归完整通过，且与 Task 10 输出一致。
  - [ ] 若 Playwright 可用，则自动化链路覆盖 Notice 阻断 → 倒计时后放行，以及 Q10 无结果阻断 → 有结果 + 有答案放行。

  **QA Scenarios**:

  ```
  Scenario: Command-level workflow QA
    Tool: Bash + LSP diagnostics
    Steps: rerun the full regression sweep from Task 10 exactly as written in the plan, including banana-directory diagnostics for `.ts` and `.tsx`
    Expected: all banana vitest files pass, banana-directory diagnostics return 0 errors, and `npm run build` exits 0
    Evidence: .sisyphus/evidence/f3-command-workflow-qa.txt

  Scenario: Browser automation smoke path (if Playwright available)
    Tool: Playwright
    Steps: launch the banana flow; on Notice page click the checkbox before countdown ends and assert blocked feedback; advance after countdown; on Q10 click next without simulation result and assert blocked; perform one simulation run, choose one answer, click next and assert navigation succeeds
    Expected: UI behavior matches the plan's blocked/allowed rules with no manual intervention
    Evidence: .sisyphus/evidence/f3-browser-smoke-qa.txt
  ```

- [ ] F4. Scope Fidelity Check — deep

  **What to do**: 让 deep agent 审核最终 diff 是否严格留在授权范围内：香蕉子模块本地文件与香蕉专属测试；特别检查 shared submission 层、其他子模块、OpenSpec 规格是否被意外改动。若发现任何越界修改，必须退回修复并重跑 F1-F4。
  **Must NOT do**: 不因为变更“看起来有帮助”就接受超范围修改。

  **Acceptance Criteria**:
  - [ ] deep 审核确认没有越界修改，或明确指出越界文件并在修复后复审通过。
  - [ ] deep 审核确认默认决策仅限本计划已声明的 `simulation_run_result` 前置条件，不存在未记录的额外行为变化。

  **QA Scenarios**:

  ```
  Scenario: Scope-boundary audit
    Tool: deep
    Steps: inspect the final file diff against the plan's INCLUDE/EXCLUDE boundaries; flag any touched file outside `src/submodules/g8-banana-browning-experiment/**` and its banana-specific tests
    Expected: reviewer confirms zero out-of-scope files or returns the exact offending paths
    Evidence: .sisyphus/evidence/f4-scope-boundary-audit.txt

  Scenario: Hidden-behavior-change audit
    Tool: deep
    Steps: inspect validation, event, and test changes for any new business rules not explicitly documented in the plan summary/defaults
    Expected: reviewer confirms only the declared defaults/guardrails were introduced
    Evidence: .sisyphus/evidence/f4-hidden-change-audit.txt
  ```

## Commit Strategy

- Commit 1: `fix(g8-banana-submission): align answer formatting and blocked validation`
  - Scope: Tasks 1-5
- Commit 2: `fix(g8-banana-submission): normalize radio and simulation telemetry`
  - Scope: Tasks 6-8
- Commit 3: `test(g8-banana-submission): add submission regression coverage`
  - Scope: Tasks 9-10

## Success Criteria

- 香蕉子模块所有新增/更新测试通过，且不再依赖 phase-1 空映射假设。
- `src/submodules/g8-banana-browning-experiment` 在 LSP diagnostics（`.ts` / `.tsx`）下零报错。
- `npm run build` 成功。
- 最终提交语义满足：答案标签化、事件语义化、阻断含 missing、simulation 结果可追溯、`flow_context` 单次注入。
