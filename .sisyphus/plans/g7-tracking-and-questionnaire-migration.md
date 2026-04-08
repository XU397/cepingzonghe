# G7 Tracking + G7 Questionnaire Migration Plan

## TL;DR

> **Quick Summary**: 将 `g7-tracking-experiment` / `g7-tracking-questionnaire` / `g7-questionnaire` 迁移到“统一提交 Schema + 统一页码/前缀 + Flow 上下文注入 + 可回归测试”的标准口径，避免当前 wrapper/legacy 写法导致的提交不合规与实现分裂。
>
> **Deliverables**:
>
> - 统一语言/结构政策（TS-first，契约层 TS-only）并写入迁移执行约束
> - `grade-7-tracking` 提交数据形态升级：pageNumber/targetElement 前缀/必需事件/answerList 非空规则等全部符合 `schema.ts`
> - `g7-tracking-*` wrapper 完整接入 Flow 上下文（含 questionnaire 分支补齐 getFlowContext 注入）
> - `g7-questionnaire` 保持基于 `Grade7Wrapper` 的统一提交，但把“桥接逻辑”收敛为一致模板并补足回归验证
> - 新增/更新 submission 快照/格式测试，确保 CI submission guard 可持续保护
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 3 waves
> **Critical Path**: Tracking MarkObject 合规化 → g7-tracking-\* Flow 注入与回归 → submission-format/test 绿

---

## Context

### Original Request

- 给出建议：未来新子模块是否 TS-only 还是允许 JS。
- 现状：要把未完成的 `g7-tracking-*` 与 `g7-questionnaire` 模块迁移完成。
- 产出：单独一个迁移方案文档，后续按方案执行。

### Current State (Evidence)

- `g7-questionnaire` 当前为 wrapper bridge：`src/submodules/g7-questionnaire/Component.jsx` 复用 `src/modules/grade-7/wrapper.jsx`（内部已使用 `AssessmentPageFrame`），但在 submodule 层仍通过 `useAppContext()` 自行桥接 progress/complete/timeout，注释明确“后续将替换为 AssessmentPageFrame 版本”。
- `g7-tracking-experiment` / `g7-tracking-questionnaire` 当前为 wrapper bridge：
  - `src/submodules/g7-tracking-experiment/Component.jsx`：桥接 Flow progress/complete/timeout，并尝试向 legacy tracking 模块注入 `getFlowContext`。
  - `src/submodules/g7-tracking-questionnaire/Component.jsx`：桥接 progress/complete/timeout，但 **未** 向 legacy tracking 模块注入 `getFlowContext`。
- `src/modules/grade-7-tracking/` 当前生成 MarkObject 仍是 legacy 形态（示例：`Page01_Notice.jsx` 调用 `buildMarkObject('0.1', ...)`；`TrackingProvider.jsx` 生成的 operation/answer targetElement 未满足新前缀规则）。
- 统一 Schema 的实际强约束：`src/shared/services/submission/schema.ts`
  - `pageNumber` 必须匹配 `^[1-9]\d*\.\d{2}$`（如 `1.03`）
  - operation/answer 的 `targetElement` 必须满足 `^P[1-9]\d*\.\d{2}_.+` 或系统保留值
  - `operationList` 必须包含 `page_enter`、`page_exit`、以及 `next_click` 或 `auto_submit`

> 备注：若 `docs/submodule-submission-guidelines.md` 与 `schema.ts` 存在口径差异，以 `schema.ts`（CI/运行时校验）为准，并在迁移收尾阶段同步更新文档避免误导。

### Scope Decision (Confirmed)

- **Migration depth**: 参考 `g7-experiment` 的方案（Wrapper Bridge + 合规化升级），不做 tracking 的“完全标准子模块重写”。
  - 目标：在保留 legacy 页面/路由/状态机的前提下，把提交产物升级到统一 Schema，并把 flow 注入/桥接写法模板化、可回归。

### Architectural Decision: TS vs JS

- **Decision (default)**: TS-first + 契约层 TS-only
  - `mapping.ts` / “提交与日志 plumbing” / 类型与适配器：必须 TypeScript
  - 页面 UI 可允许 `.jsx` 作为过渡，但禁止在 JS 内实现 schema/页码/前缀/flow_context 注入等关键规则
- **Reason**: 防止 AI/多人协作下重复发明规则、漏字段、写错枚举；用类型系统与测试约束保证一致性。

---

## Work Objectives

### Core Objective

让 `g7-tracking-*` 与 `g7-questionnaire` 在 Flow 模式下提交数据**稳定符合**统一 Schema，并把“桥接/注入/计时/进度恢复”的实现方式收敛为可复制的标准套路。

### Must Have

- Tracking 相关提交产物通过 `validateMarkObject` 以及 `npm run test:submission-format`
- Flow 模式能注入 `flow_context`，且 progress/complete/timeout 语义正确
- 新迁移不引入计时器双源导致的提前超时/不超时/重复回调

### Must NOT Have (Guardrails)

- 不借迁移重写 tracking 的业务交互/题目逻辑（仅做提交口径、桥接、计时一致性与必要的最小改动）
- 不新增“黑盒巨组件”吞噬页面语义（共享层只做 wiring）
- 不扩大到其它年级/子模块（除非为了修 shared schema 与文档一致性所必需的最小修订）

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> 验收必须可由 agent 直接执行：命令 / Playwright / 产物快照。禁止“让用户手动点点看”。

### Test Decision

- **Infrastructure exists**: YES
- **Automated tests**: Tests-after（迁移任务完成后补/更快照与回归）
- **Framework**: Vitest（仓库内已有）

### Required Commands

```bash
npm run lint:submission
npm run test:submission-format
npm run test:submission
npm run build
```

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Start Immediately):
├── Task 1: 冻结迁移口径与 TS 政策（文档/模板约束）
└── Task 2: 追踪模块 MarkObject 合规化设计与“模块盘点表”补齐

Wave 2 (After Wave 1):
├── Task 3: 改造 `grade-7-tracking` MarkObject 生成与提交适配（Schema 合规）
├── Task 4: 补齐 `g7-tracking-questionnaire` 的 getFlowContext 注入与桥接一致性
└── Task 5: 收敛 `g7-questionnaire` 的 bridge 模式并补回归验证

Wave 3 (After Wave 2):
└── Task 6: submission-format/test 快照更新与回归门禁（CI 绿）

Critical Path: Task 2 → Task 3 → Task 6

---

## TODOs

> Implementation + Test = ONE Task.

- [x] 1. 冻结“标准迁移口径”与 TS-first 政策

  **What to do**:
  - 在迁移方案中明确：契约层 TS-only（mapping/adapter/context/plumbing），UI JS 仅过渡
  - 明确 wrapper bridge 仅作为过渡形态，最终以 schema 合规与测试守卫为硬门槛
  - 明确“唯一计时源”策略（优先 Frame/TimerService 单源）与 once-only scope 清理原则

  **References**:
  - `src/shared/services/submission/schema.ts` - 实际强约束（页码/前缀/必需事件）
  - `docs/submodule-submission-guidelines.md` - 规范执行手册（迁移目标口径；如与 schema 冲突需更新）
  - `.sisyphus/drafts/submodule-page-build-process.md` - 标准子模块蓝图 + Legacy→Standard 迁移打法
  - `src/shared/services/timers/getDefaultTimers.js` - 子模块 timer 默认配置
  - `src/shared/services/timers/README.md` - scope 去重与清理规则

  **Acceptance Criteria**:
  - [x] 迁移方案文档中“冻结项/非目标/验收命令”清晰可执行

- [x] 2. 盘点现状并冻结 g7-tracking/g7-questionnaire 的页面与提交契约

  **What to do**:
  - 产出 3 份“模块盘点表”（按 `submodule-page-build-process.md` 模板）：
    - `g7-questionnaire`
    - `g7-tracking-experiment`
    - `g7-tracking-questionnaire`
  - 明确每个 submodule 的 pageId 列表、subPageNum 映射、计时器类型与超时行为
  - 明确提交时机：next_click / auto_submit 对应哪些按钮/超时触发点

  **References**:
  - `src/submodules/g7-questionnaire/mapping.ts` - pageId ↔ subPageNum
  - `src/submodules/g7-tracking-experiment/mapping.ts` - experiment 页面范围映射
  - `src/submodules/g7-tracking-questionnaire/mapping.ts` - questionnaire 页面范围映射
  - `src/modules/grade-7-tracking/config.js` - legacy PAGE_MAPPING 与 navigationMode

  **Acceptance Criteria**:
  - [x] 每个 submodule 的“页清单 + 提交点 + 超时点 + localStorage key 策略”在盘点表中明确

- [x] 3. 迁移 `grade-7-tracking` 的 MarkObject 生成到新 Schema

  **What to do**:
  - 让 tracking 模块提交的 MarkObject 满足 `schema.ts`：
    - `pageNumber` 统一改为 `encodeCompositePageNum(stepIndex+1, subPageNum)` → `X.YY`
    - operations/answers 的 `targetElement` 统一补齐 `P{pageNumber}_` 前缀（保留元素除外）
    - 确保每页有 `page_enter/page_exit` 与 `next_click`（或 `auto_submit`）
    - `answerList` 仅记录非空答案；问卷页不再默认填充“未回答”占位（除超时场景由提交层处理）
  - Flow 上下文：从 submodule wrapper 注入 `getFlowContext`/flowContext，使提交层能注入 `flow_context`
  - 计时器：确认 tracking 内部 timer 与 Flow/TimerService 不双源；必要时收敛裁决权到单源

  **Recommended Agent Profile**:
  - Category: `unspecified-high`
  - Skills: （无强制；如要跑 UI 回归建议配合 `playwright`）

  **References**:
  - `src/modules/grade-7-tracking/context/TrackingProvider.jsx` - buildMarkObject/operation/answer 生成位置
  - `src/modules/grade-7-tracking/pages/Page01_Notice.jsx` - 典型 legacy pageNumber 与 next 提交
  - `src/context/AppContext.jsx` - 实际提交入口（`submitPageDataWithInfo` 走 `usePageSubmission` + `markOverride`）
  - `src/shared/services/submission/schema.ts` - validateMarkObject 失败即阻断
  - `src/shared/utils/pageMapping.ts` - `encodeCompositePageNum`

  **Acceptance Criteria**:
  - [x] `npm run test:submission-format` → PASS
  - [x] 任取 2 个 tracking 页面提交 payload（通过测试 fixture/快照）均满足：pageNumber `X.YY`、targetElement `P{X.YY}_...`、包含必需事件

  **Agent-Executed QA Scenarios**:

  ```
  Scenario: g7-tracking-experiment 页面提交通过 schema
    Tool: Bash
    Preconditions: 代码已改造并有对应 submission-format 测试
    Steps:
      1. Run: npm run test:submission-format
      2. Assert: exit code 0
    Expected Result: submission-format tests pass
  ```

- [x] 4. 修复并收敛 `g7-tracking-*` wrapper 的 Flow 注入与桥接一致性

  **What to do**:
  - `g7-tracking-questionnaire` 补齐与 experiment 一致的 `getFlowContext` 注入（当前缺失）
  - 把 progress/onComplete/onTimeout 桥接逻辑收敛为统一模板（避免每个 wrapper 自己写一套）
  - 确认 `resolvePageNum` / `getPageNumByPageId` 与 progress update 的范围边界一致

  **References**:
  - `src/submodules/g7-tracking-experiment/Component.jsx` - 已有注入与桥接参考
  - `src/submodules/g7-tracking-questionnaire/Component.jsx` - 需要补齐注入
  - `src/submodules/g7-tracking-questionnaire/mapping.ts` - pageId → subPageNum 的定义

  **Acceptance Criteria**:
  - [x] Flow 模式下 questionnaire 也能注入 flow_context（通过 submission-format fixture/快照验证）
  - [x] progress update 只在有效页面范围内更新（不因 completion page 误更新）

- [x] 5. 完成 `g7-questionnaire` 迁移收敛（标准化 bridge + 回归验证）

  **What to do**:
  - 统一 bridge 模式：progress/onComplete/onTimeout 的实现方式与其它 g7 wrapper 一致（模板化）
  - 确认 `Grade7Wrapper` 的 Frame 提交模式在 questionnaire 流程中满足 schema（pageNumber/targetElement/必需事件）

  **References**:
  - `src/submodules/g7-questionnaire/Component.jsx` - 当前 bridge
  - `src/modules/grade-7/wrapper.jsx` - 已基于 `AssessmentPageFrame` 的参考实现
  - `src/submodules/g7-questionnaire/mapping.ts` - pageId/subPageNum

  **Acceptance Criteria**:
  - [x] `npm run test:submission` 覆盖到 g7-questionnaire 的核心提交路径（若缺失则补最小快照/fixture）

- [x] 6. submission guard 回归与快照落地（CI 绿）

  **What to do**:
  - 为 g7-tracking 与 g7-questionnaire 补齐/更新 submission-format 快照用例（normal + blocked/timeout 至少覆盖一种）
  - 运行并修复所有 guard：lint:submission / test:submission-format / test:submission / build

  **References**:
  - `src/shared/services/submission/__tests__/submission-format.snapshot.test.js` - 格式快照测试入口
  - `src/shared/services/submission/__tests__/validate-prefixes.test.js` - 前缀规则
  - `src/shared/services/submission/__tests__/validate-events.test.js` - 事件白名单
  - `src/shared/services/submission/__tests__/usePageSubmission.pageDesc.test.jsx` - flow pageDesc/flow_context

  **Acceptance Criteria**:
  - [x] `npm run lint:submission` → PASS
  - [x] `npm run test:submission-format` → PASS
  - [x] `npm run test:submission` → PASS
  - [x] `npm run build` → PASS

---

## Success Criteria

### Verification Commands

```bash
npm run lint:submission
npm run test:submission-format
npm run test:submission
npm run build
```

### Final Checklist

- [x] g7-tracking-\* 在 Flow 下提交的 MarkObject 满足 `schema.ts`（页码/前缀/必需事件）
- [x] g7-questionnaire 的 bridge 逻辑模板化，避免继续分裂
- [x] submission guard 全绿，且新增/更新快照能阻止回归
