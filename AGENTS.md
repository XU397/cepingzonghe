
# PROJECT KNOWLEDGE BASE

Generated: 2026-02-06 11:14 (Asia/Shanghai)
Commit: 2e46d77
Branch: 005-g4-experiment-submodule

## OVERVIEW

React 18 + Vite assessment platform with two coexistence modes: legacy module routing and modern flow/submodule orchestration.
Core risk areas: flow state synchronization, submission format compliance, and timer/session behavior across route transitions.


<!-- cp-kb-init-start -->
## VERIFIED REPOSITORY FACTS (cp, 2026-05-22)

This repository is the student assessment frontend. It runs React 18 + Vite 4 and supports two runtime modes: legacy module routing and modern Flow/submodule orchestration. Treat repository code, API behavior, tests, and runtime observations as the source of truth; documentation and the vault are navigation context only.

### Tech Stack

- React `^18.2.0`, React DOM `^18.2.0`, React Router DOM `^7.7.1`.
- Vite `^4.4.5` with `@vitejs/plugin-react`; dev server port `3000`.
- TypeScript `^5.9.3` with mixed JS/TS (`allowJs: true`) and path aliases in `vite.config.js` / `tsconfig.json`.
- UI/data dependencies: Radix Dialog/Icons, lucide-react, Recharts, Chart.js, react-chartjs-2, D3, topojson-client.
- Auth password encryption uses `jsencrypt` in `src/utils/jsencrypt.ts`.
- Tests use Vitest `^4.0.10`, Testing Library, jsdom; E2E uses Playwright `^1.56.0`.

### Repository Structure

```
src/app/          # AppShell, top-level routes, StrictMode split, UserInfoBar visibility
src/context/      # AppContext auth/session/timers/storage/Flow bridge helpers
src/flows/        # Flow runtime, orchestrator, context bridge, mock Flow definitions
src/modules/      # legacy module registry/router and grade modules
src/submodules/   # Flow submodule registry and submodule implementations
src/shared/       # shared API, submission, timers, UI frames, types, page mapping
src/pages/        # legacy G7 steamed-bun pages and questionnaire pages
tests/            # Playwright E2E and extra test assets
```

### Key Files

- Boot/routing: `src/main.jsx`, `src/app/AppShell.jsx`, `src/App.jsx`.
- Auth/session: `src/pages/LoginPage.jsx`, `src/context/AppContext.jsx`, `src/shared/services/storage/storageKeys.js`.
- API clients/config: `src/config/apiConfig.js`, `src/shared/services/apiService.js`, `src/shared/services/api/endpoints.ts`, `src/shared/services/api/apiClient.ts`.
- Flow runtime: `src/flows/FlowModule.jsx`, `src/flows/orchestrator/FlowOrchestrator.ts`, `src/hooks/useHeartbeat.ts`.
- Registry/types: `src/modules/ModuleRegistry.js`, `src/modules/ModuleRouter.jsx`, `src/submodules/registry.ts`, `src/shared/types/flow.ts`.
- Submission: `src/shared/services/submission/usePageSubmission.js`, `src/shared/ui/PageFrame/AssessmentPageFrame.jsx`, `src/shared/utils/pageMapping.ts`.

### Commands

```bash
npm run dev
npm run build
npm run build:bc
npm run preview
npm run lint
npm run lint:submission
npm test
npm run test:watch
npm run test:ui
npm run test:coverage
npm run test:submission-format
npm run test:submission
npx playwright test
```

### API, Auth, Config, Data

- Login: `GET /stu/login` via `buildApiUrl('/login')`, query `accountName`, encrypted `accountPass`, `type=2`.
- Submission: `POST /stu/saveHcMark` via `buildApiUrl('/saveHcMark')`, FormData fields `batchCode`, `examNo`, `mark` JSON string.
- Flow APIs: `GET /stu/api/flows/{flowId}`, `GET /stu/api/flows/{flowId}/progress/{examNo}?batchCode=...`, `POST /stu/api/flows/{flowId}/progress`.
- Login page config: `GET /stu/api/login-page-config/active`; when mock mode is off, Vite proxies it to `VITE_LOGIN_CONFIG_TARGET` / `VITE_ADMIN_API_TARGET` if set, otherwise the public admin backend `http://117.72.14.166:8777`.
- Legacy session check: G7 tracking calls `GET /stu/checkSession?sessionId=...&studentCode=...`.
- Auth is session-cookie based; `apiClient` and `apiConfig` use or preserve `credentials: include`; 401 is handled through `AppContext.handleSessionExpired`.
- No direct database, migration, model, or entity layer exists in this frontend repo.
- Important env vars: `VITE_USE_MOCK`, `VITE_API_TARGET`, `VITE_API_BASE_URL`, `VITE_LOGIN_CONFIG_TARGET`, `VITE_ADMIN_API_TARGET`, `VITE_BASE`, `VITE_ROUTER_BASENAME`, `VITE_FLOW_HEARTBEAT_ENABLED`, `VITE_FLOW_DEV_MOCK_AUTH`, `VITE_FLOW_PROVIDER_ENABLED`, `VITE_FLOW_BRIDGE_ENABLED`, `VITE_FULLSCREEN_ENABLED`, `VITE_REQUIRE_FULLSCREEN_IN_DEV`, `VITE_RENDER_COUNTER_ENABLED`.

## CROSS-REPO KNOWLEDGE BASE

Shared Obsidian Markdown vault:

`D:\myproject\assessment-platform-kb`

Before any cross-repo task, read:

1. `D:\myproject\assessment-platform-kb\00-index.md`
2. `D:\myproject\assessment-platform-kb\VAULT_RULES.md`
3. Relevant files under `架构/`, `代码库/`, `API契约/`, `术语表/`, `排错手册/`, and `需求/<change-id>/`.

Rules:

- Any change touching 2+ repositories is a cross-repo change.
- Use one shared `change-id` across all repositories: `YYYY-MM-DD-kebab-case-title`.
- Cross-repo workflow: create/read `D:\myproject\assessment-platform-kb\需求\<change-id>\unified-plan.md`; get human confirmation for the unified plan; each repository creates its own OpenSpec proposal; each repository implements and verifies under the same `change-id`.
- Write defaults: agents may write only `D:\myproject\assessment-platform-kb\inbox\` and `D:\myproject\assessment-platform-kb\需求\<change-id>\`; long-term knowledge areas are read-only unless the current task explicitly authorizes edits.
- Code-is-truth: the vault is navigation and collaboration context, not the final fact source. Current code, schema, API implementation, tests, and runtime behavior win.
<!-- cp-kb-init-end -->

## STRUCTURE

.
|- src/ # runtime app code
| |- app/ # app shell and top-level route composition
| |- flows/ # flow orchestration and context bridge
| |- modules/ # legacy module registry/router + grade modules
| |- submodules/ # reusable flow submodules
| |- shared/ # shared services/ui/types
| |- context/ # AppContext auth/session bridge
| `- pages/                 # legacy page implementations
|- openspec/                 # spec workflow + active/archived changes
|- .github/workflows/        # CI + submission guard
`- docs/, specs/ # project docs and feature specs

## WHERE TO LOOK

### Code Locations

| Task                        | Location                                                                   | Notes                                                |
| --------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------- |
| App boot and route dispatch | src/main.jsx, src/app/AppShell.jsx                                         | `/flow/*` skips StrictMode branch                    |
| Flow runtime behavior       | src/flows/FlowModule.jsx, src/flows/orchestrator/FlowOrchestrator.ts       | progress restore, completion, timer reset            |
| Legacy module routing       | src/modules/ModuleRegistry.js, src/modules/ModuleRouter.jsx                | `/seven-grade`, `/grade-7-tracking`, `/flow/:flowId` |
| Submodule registration      | src/submodules/registry.ts                                                 | required fields validated at register time           |
| Submission pipeline         | src/shared/services/submission/usePageSubmission.js                        | retries, flow_context injection, lifecycle events    |
| API endpoints and client    | src/shared/services/api/endpoints.ts, src/shared/services/api/apiClient.ts | `/stu/*` proxy conventions                           |
| App auth/session state      | src/context/AppContext.jsx                                                 | login persistence + flow bridge helpers              |
| CI policy                   | .github/workflows/ci.yml, .github/workflows/submission-guard.yml           | submission checks are merge blockers                 |
| Spec governance             | openspec/project.md                                                        | proposal-before-implementation rules                 |

### Documentation References

| Document                   | Location                                  | When to Read                                                             |
| -------------------------- | ----------------------------------------- | ------------------------------------------------------------------------ |
| **Architecture Overview**  | `docs/ARCHITECTURE.md`                    | Before major feature development, system design decisions                |
| **Architecture Decisions** | `docs/DECISIONS.md`                       | When proposing architectural changes, understanding "why" behind designs |
| **Project Memory**         | `docs/project_notes/`                     | Check before debugging, after fixing bugs, for project configuration     |
| **OpenSpec Guide**         | `.claude/skills/openspec-*` / `/opsx:*`   | For planning, proposals, spec changes, ambiguous requirements            |
| **子模块构建流程手册**     | `docs/submodule-page-build-process.md`    | 构建新子模块、理解 Phase 0-5 流程与验收标准                              |
| **子模块架构决策分析**     | `docs/submodule-build-workflow.md`        | 任务拆分策略、两种构建模式对比、Legacy→标准迁移打法                      |
| **数据提交规范**           | `docs/submission-spec.md`                 | 目标态提交规范：MarkObject 结构、事件类型、前缀规则、flow_context 注入   |
| **遗留偏差登记**           | `docs/submission-legacy-deviations.md`    | 已知子模块与目标态规范的偏差记录与迁移优先级                             |
| **CMI 接口类型定义**       | `src/shared/types/flow.ts`                | SubmoduleDefinition/FlowDefinition/FlowProgress 等核心类型               |

## CODE MAP

| Symbol              | Type      | Location                                            | Role                                          |
| ------------------- | --------- | --------------------------------------------------- | --------------------------------------------- |
| `AppShell`          | component | src/app/AppShell.jsx                                | top route switch + strict mode split          |
| `ModuleRegistry`    | class     | src/modules/ModuleRegistry.js                       | legacy module registration and URL mapping    |
| `FlowModule`        | component | src/flows/FlowModule.jsx                            | flow runtime, progression, completion, guards |
| `FlowOrchestrator`  | class     | src/flows/orchestrator/FlowOrchestrator.ts          | flow definition/progress load + normalization |
| `submoduleRegistry` | singleton | src/submodules/registry.ts                          | dynamic submodule import/lookup               |
| `usePageSubmission` | hook      | src/shared/services/submission/usePageSubmission.js | normalized mark payload + submission retries  |

## CONVENTIONS

- Prefer aliases (`@shared`, `@flows`, `@submodules`, `@modules`) over deep relative imports.
- New reusable behavior goes into `src/shared/*`; avoid cross-module private imports.
- Flow page tracking uses composite page number format (`<stepIndex>.<subPageNum>`), not legacy ad-hoc formats.
- Submission path should route through shared submission hook/frame integration, not direct endpoint calls.

## ANTI-PATTERNS (THIS PROJECT)

- Directly calling `/stu/saveHcMark` from feature pages/submodules.
- Bypassing `usePageSubmission` / `AssessmentPageFrame` for page submit lifecycle.
- Hand-writing page prefixes that bypass `pageMapping` helpers.
- Introducing module-to-module direct imports (`../../../modules/*`, `../../modules/*`).
- Reworking OpenSpec-defined behavior without proposal approval when change is capability-level.

## UNIQUE STYLES

- Route-level StrictMode split: flow routes avoid StrictMode double-initialization side effects.
- Flow completion uses sentinel progress page number (`999`) and explicit timer reset.
- Submission system enforces lifecycle operations (`page_enter`, `next_click` or `auto_submit`, `page_exit`) and flow context injection.
- CI treats submission guard suite as blocking even when lint job can warn-only.
- **Flow 子模块计时器策略**：所有子模块的信息展示页面（通常是第一页，如注意事项页、问卷说明页）不加载 Flow 架构的全局倒计时组件；以 `g7-questionnaire` 为例，`Page_20_Questionnaire_Intro` 必须保持 `hidden` 导航模式并隐藏子模块计时器，进入 `Page_21_Curiosity_Questions` 后才开始显示问卷计时器。

## COMMANDS

```bash
npm run dev
npm run build
npm run lint
npm test
npm run test:submission
npm run test:submission-format
```

## Project Memory System

This project maintains institutional knowledge in `docs/project_notes/` for consistency across sessions.

### Memory Files

- **bugs.md** - Bug log with dates, solutions, and prevention notes
- **decisions.md** - Project-level decisions and ADRs
- **key_facts.md** - Project configuration, credentials, ports, important URLs
- **issues.md** - Work log with completed tasks and ongoing work

### Memory-Aware Protocols

**Before proposing architectural changes:**

- Check `docs/project_notes/decisions.md` for existing decisions
- Check `docs/DECISIONS.md` for system-level ADRs
- Verify the proposed approach doesn't conflict with past choices
- If it does conflict, acknowledge the existing decision and explain why a change is warranted

**When encountering errors or bugs:**

- Search `docs/project_notes/bugs.md` for similar issues
- Search `docs/project_notes/key_facts.md` for configuration details
- Apply known solutions if found
- Document new bugs and solutions when resolved

**When looking up project configuration:**

- Check `docs/project_notes/key_facts.md` for API endpoints, ports, URLs
- Check `docs/ARCHITECTURE.md` for system design details
- Prefer documented facts over assumptions

**When completing work:**

- Log completed work in `docs/project_notes/issues.md`
- Include date, brief description, and any important context

**When user requests memory updates:**

- Update the appropriate memory file (bugs, decisions, key_facts, or issues)
- Follow the established format and style (bullet lists, dates, concise entries)

### 子模块构建关键决策速查

**构建新子模块前必读：**

| 文档             | 位置                                      | 内容                                                 |
| ---------------- | ----------------------------------------- | ---------------------------------------------------- |
| **ADR-002**      | `docs/project_notes/decisions.md`         | 子模块构建标准决策（垂直切片、架构蓝图、guard 全绿） |
| **构建流程手册** | `docs/submodule-page-build-process.md`    | Phase 0-5 完整流程、验收标准、PR 审查清单            |
| **架构决策分析** | `docs/submodule-build-workflow.md`        | 任务拆分策略、现有实现对比、决策依据                 |
| **数据提交规范** | `docs/submission-spec.md`                 | operationList/answerList 格式、前缀规则              |

#### 两种构建模式

| 模式                           | 适用场景            | 参考                                    | 说明                                                     |
| ------------------------------ | ------------------- | --------------------------------------- | -------------------------------------------------------- |
| **Standard（标准子模块）**     | 新建子模块          | `src/submodules/g8-pv-sand-experiment/` | mapping+context+pages 自成体系，接入 AssessmentPageFrame |
| **Legacy Wrapper（薄适配器）** | 将旧模块桥接入 Flow | `src/submodules/g7-experiment/`         | 包装旧模块组件，桥接 flowContext，不改旧模块内部         |

> 新子模块必须使用 Standard 模式；Legacy Wrapper 仅用于已有旧模块的迁移过渡。

#### CMI 接口（SubmoduleDefinition）

- 类型定义：`src/shared/types/flow.ts`
- 必需字段：`submoduleId`, `Component`, `getInitialPage`, `getTotalSteps`, `getNavigationMode`
- 注册验证：`src/submodules/registry.ts` 的 `register()` 方法

#### 标准子模块目录结构与职责

```
src/submodules/<submoduleId>/
  index.tsx|jsx        # 导出 SubmoduleDefinition
  Component.tsx|jsx    # Provider + AssessmentPageFrame（提交接线 + 导航流水线）
  mapping.ts           # 单一真相源：页面清单、题目常量、SUBMODULE_MAPPING_CONFIG
  context/             # 状态：currentPageId、answers、operations、稳定 logOperation
  pages/               # 页面 UI（不直连提交 API、不手写 pageNumber/前缀）
  __tests__/           # mapping 合规 + submission 快照/格式测试
```

- `mapping.ts`：契约与静态配置（PAGE_CONFIGS、QUESTION_CODE_MAP 等）
- `context/`：状态管理与日志 plumbing（logOperation、flow_context 注入、页面切换重置）
- `Component`：统一 onNext 流水线 — validate → submit → clearOperations → navigate/complete
- `pages/`：页面语义与交互，通过 context 更新状态

#### 提交流水线概览

```
页面交互 → context.logOperation() → operations[]
页面答案 → context.answerDraft   → buildAnswerList()
                                        ↓
AssessmentPageFrame.onNext → validatePage()
  → defaultSubmit() → usePageSubmission → buildMark()
    → POST /stu/saveHcMark
```

#### 参考实现索引

| 参考类型                   | 子模块                                  | 说明                                                              |
| -------------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| **标准子模块（推荐参考）** | `src/submodules/g8-pv-sand-experiment/` | 最规范化：完整 SUBMODULE_MAPPING_CONFIG、buildMark 模式、测试覆盖 |
| **标准子模块（备选）**     | `src/submodules/g8-drone-imaging/`      | 组织分层清晰                                                      |
| **Legacy Wrapper**         | `src/submodules/g7-experiment/`         | 薄适配器，桥接旧模块到 Flow                                       |

#### 共享提交层

- 提交 Hook：`src/shared/services/submission/usePageSubmission.js`
- 页面 Frame：`src/shared/ui/PageFrame/AssessmentPageFrame.jsx`
- 适配器工具：`src/shared/services/submission/submoduleAdapter/`（collectAnswers、buildPageDesc、appendExperimentHistory 等）
- 页码工具：`src/shared/utils/pageMapping.ts`

#### 验证命令（必须全部通过）

```bash
npm run lint:submission        # 代码规范检查
npm run test:submission-format # 提交格式验证
npm run test:submission        # 完整提交测试套件
```

### Style Guidelines for Memory Files

- **Prefer bullet lists over tables** for simplicity and ease of editing
- **Keep entries concise** (1-3 lines for descriptions)
- **Always include dates** for temporal context
- **Include URLs** for tickets, documentation, monitoring dashboards
- **Manual cleanup** of old entries is expected (not automated)

---

## G7 Flow 子模块速查表

四个 G7 Flow 子模块的构建方式和页面文件位置速查，用于快速定位需要修改的页面文件。

### 子模块概览

| 子模块 ID                   | 显示名称           | 类型 | 页面来源                              |
| --------------------------- | ------------------ | ---- | ------------------------------------- |
| `g7-experiment`             | 7年级蒸馒头-交互   | 实验 | `src/pages/` (PageRouter)             |
| `g7-questionnaire`          | 7年级蒸馒头-问卷   | 问卷 | `src/pages/questionnaire/`            |
| `g7-tracking-experiment`    | 7年级追踪-交互实验 | 实验 | `src/modules/grade-7-tracking/pages/` |
| `g7-tracking-questionnaire` | 7年级追踪-问卷     | 问卷 | `src/modules/grade-7-tracking/pages/` |

---

### 1. g7-experiment (7年级蒸馒头-交互)

**子模块定义文件：**

- `src/submodules/g7-experiment/index.jsx`
- `src/submodules/g7-experiment/Component.jsx`
- `src/submodules/g7-experiment/mapping.ts`

**页面文件位置：** `src/pages/Page_*.jsx`

| Flow 页码 | 页面 ID                                            | 实际文件                                                          |
| --------- | -------------------------------------------------- | ----------------------------------------------------------------- |
| 1         | `Page_01_Precautions`                              | `src/pages/Page_01_Precautions.jsx` (不存在，由 PageRouter 内置)  |
| 2         | `Page_02_Introduction`                             | `src/pages/Page_02_Introduction.jsx` (不存在，由 PageRouter 内置) |
| 3         | `Page_03_Dialogue_Question`                        | `src/pages/Page_03_Dialogue_Question.jsx`                         |
| 4         | `Page_04_Material_Reading_Factor_Selection`        | `src/pages/Page_04_Material_Reading_Factor_Selection.jsx`         |
| 5         | `Page_10_Hypothesis_Focus`                         | `src/pages/Page_10_Hypothesis_Focus.jsx` (不存在)                 |
| 6         | `Page_11_Solution_Design_Measurement_Ideas`        | `src/pages/Page_11_Solution_Design_Measurement_Ideas.jsx`         |
| 7         | `Page_12_Solution_Evaluation_Measurement_Critique` | `src/pages/Page_12_Solution_Evaluation_Measurement_Critique.jsx`  |
| 8         | `Page_13_Transition_To_Simulation`                 | `src/pages/Page_13_Transition_To_Simulation.jsx` (不存在)         |
| 9         | `Page_14_Simulation_Intro_Exploration`             | `src/pages/Page_14_Simulation_Intro_Exploration.jsx`              |
| 10        | `Page_15_Simulation_Question_1`                    | `src/pages/Page_15_Simulation_Question_1.jsx`                     |
| 11        | `Page_16_Simulation_Question_2`                    | `src/pages/Page_16_Simulation_Question_2.jsx`                     |
| 12        | `Page_17_Simulation_Question_3`                    | `src/pages/Page_17_Simulation_Question_3.jsx`                     |
| 13        | `Page_18_Solution_Selection`                       | `src/pages/Page_18_Solution_Selection.jsx`                        |

**包装器：** `src/modules/grade-7/wrapper.jsx` → 使用 `PageRouter` 组件

**计时器：** 任务 40 分钟

---

### 2. g7-questionnaire (7年级蒸馒头-问卷)

**子模块定义文件：**

- `src/submodules/g7-questionnaire/index.jsx`
- `src/submodules/g7-questionnaire/Component.jsx`
- `src/submodules/g7-questionnaire/mapping.ts`

**页面文件位置：** `src/pages/questionnaire/Page_*.jsx`

| Flow 页码 | 页面 ID                              | 实际文件                                                         |
| --------- | ------------------------------------ | ---------------------------------------------------------------- |
| 1         | `Page_20_Questionnaire_Intro`        | `src/pages/questionnaire/Page_20_Questionnaire_Intro.jsx`        |
| 2         | `Page_21_Curiosity_Questions`        | `src/pages/questionnaire/Page_21_Curiosity_Questions.jsx`        |
| 3         | `Page_22_Creativity_Questions`       | `src/pages/questionnaire/Page_22_Creativity_Questions.jsx`       |
| 4         | `Page_23_Imagination_Questions`      | `src/pages/questionnaire/Page_23_Imagination_Questions.jsx`      |
| 5         | `Page_24_Science_Efficacy_Questions` | `src/pages/questionnaire/Page_24_Science_Efficacy_Questions.jsx` |
| 6         | `Page_25_Environment_Questions`      | `src/pages/questionnaire/Page_25_Environment_Questions.jsx`      |
| 7         | `Page_26_School_Activities`          | `src/pages/questionnaire/Page_26_School_Activities.jsx`          |
| 8         | `Page_27_Outschool_Activities`       | `src/pages/questionnaire/Page_27_Outschool_Activities.jsx`       |
| 9         | `Page_28_Effort_Submit`              | `src/pages/questionnaire/Page_28_Effort_Submit.jsx`              |

**包装器：** `src/modules/grade-7/wrapper.jsx` → 使用 `PageRouter` 组件

**计时器：** 问卷 10 分钟

---

### 3. g7-tracking-experiment (7年级追踪-交互实验)

**子模块定义文件：**

- `src/submodules/g7-tracking-experiment/index.jsx`
- `src/submodules/g7-tracking-experiment/Component.jsx`
- `src/submodules/g7-tracking-experiment/mapping.ts`

**页面文件位置：** `src/modules/grade-7-tracking/pages/`

**配置文件：** `src/modules/grade-7-tracking/config.js` (PAGE_MAPPING)

| Flow 页码 | 模块页码 | 页面 ID              | 实际文件                                                   |
| --------- | -------- | -------------------- | ---------------------------------------------------------- |
| 1         | 1        | `Page_01_Intro`      | `src/modules/grade-7-tracking/pages/Page02_Intro.jsx`      |
| 2         | 2        | `Page_02_Question`   | `src/modules/grade-7-tracking/pages/Page03_Question.jsx`   |
| 3         | 3        | `Page_03_Resource`   | `src/modules/grade-7-tracking/pages/Page04_Resource.jsx`   |
| 4         | 4        | `Page_04_Hypothesis` | `src/modules/grade-7-tracking/pages/Page06_Hypothesis.jsx` |
| 5         | 5        | `Page_05_Design`     | `src/modules/grade-7-tracking/pages/Page07_Design.jsx`     |
| 6         | 6        | `Page_06_Evaluation` | `src/modules/grade-7-tracking/pages/Page08_Evaluation.jsx` |
| 7         | 7        | `Page_07_Transition` | `src/modules/grade-7-tracking/pages/Page09_Transition.jsx` |
| 8         | 8        | `Page_08_Experiment` | `src/modules/grade-7-tracking/pages/Page10_Experiment.jsx` |
| 9         | 9        | `Page_09_Analysis1`  | `src/modules/grade-7-tracking/pages/Page11_Analysis1.jsx`  |
| 10        | 10       | `Page_10_Analysis2`  | `src/modules/grade-7-tracking/pages/Page12_Analysis2.jsx`  |
| 11        | 11       | `Page_11_Analysis3`  | `src/modules/grade-7-tracking/pages/Page13_Analysis3.jsx`  |
| 12        | 12       | `Page_12_Solution`   | `src/modules/grade-7-tracking/pages/Page14_Solution.jsx`   |

**注意事项页 (0.1)：** `Page01_Notice.jsx` - 不在 Flow 实验范围内
**完成页 (13)：** `Page13_Summary.jsx` - 任务总结，触发 Flow 完成

**Context：** `src/modules/grade-7-tracking/context/TrackingProvider.jsx`

**计时器：** 任务 30 分钟 (mapping.ts 配置)，配置文件为 40 分钟

---

### 4. g7-tracking-questionnaire (7年级追踪-问卷)

**子模块定义文件：**

- `src/submodules/g7-tracking-questionnaire/index.jsx`
- `src/submodules/g7-tracking-questionnaire/Component.jsx`
- `src/submodules/g7-tracking-questionnaire/mapping.ts`

**页面文件位置：** `src/modules/grade-7-tracking/pages/`

**配置文件：** `src/modules/grade-7-tracking/config.js` (PAGE_MAPPING)

| Flow 页码 | 模块页码 | 页面 ID                        | 实际文件                                                            |
| --------- | -------- | ------------------------------ | ------------------------------------------------------------------- |
| 1         | 0.2      | `Page_00_2_QuestionnaireIntro` | `src/modules/grade-7-tracking/pages/Page02_QuestionnaireNotice.jsx` |
| 2         | 14       | `Questionnaire_01`             | `src/modules/grade-7-tracking/pages/Page15_Questionnaire1.jsx`      |
| 3         | 15       | `Questionnaire_02`             | `src/modules/grade-7-tracking/pages/Page16_Questionnaire2.jsx`      |
| 4         | 16       | `Questionnaire_03`             | `src/modules/grade-7-tracking/pages/Page17_Questionnaire3.jsx`      |
| 5         | 17       | `Questionnaire_04`             | `src/modules/grade-7-tracking/pages/Page18_Questionnaire4.jsx`      |
| 6         | 18       | `Questionnaire_05`             | `src/modules/grade-7-tracking/pages/Page19_Questionnaire5.jsx`      |
| 7         | 19       | `Questionnaire_06`             | `src/modules/grade-7-tracking/pages/Page20_Questionnaire6.jsx`      |
| 8         | 20       | `Questionnaire_07`             | `src/modules/grade-7-tracking/pages/Page21_Questionnaire7.jsx`      |
| 9         | 21       | `Questionnaire_08`             | `src/modules/grade-7-tracking/pages/Page22_Questionnaire8.jsx`      |

**完成页 (22)：** `Page23_Completion.jsx` - 问卷完成，触发 Flow 完成

**计时器：** 问卷 10 分钟

---

### 快速定位指南

**需要修改 G7 蒸馒头实验页面？**
→ 查看 `src/pages/Page_*.jsx`

**需要修改 G7 蒸馒头问卷页面？**
→ 查看 `src/pages/questionnaire/Page_*.jsx`

**需要修改 G7 追踪实验页面？**
→ 查看 `src/modules/grade-7-tracking/pages/Page02_*.jsx` 到 `Page14_*.jsx`

**需要修改 G7 追踪问卷页面？**
→ 查看 `src/modules/grade-7-tracking/pages/Page15_*.jsx` 到 `Page23_*.jsx`

**需要调整页码映射？**

- 蒸馒头：编辑 `src/submodules/g7-experiment/mapping.ts` 或 `src/submodules/g7-questionnaire/mapping.ts`
- 追踪：编辑 `src/modules/grade-7-tracking/config.js` (PAGE_MAPPING)

---

## STANDARD SUBMODULE SYNC PROTOCOL

Use this protocol before changing Flow submodule construction standards, L0/L1 page modeling, L2 trace reporting, MarkObject submission behavior, trace contracts, registries, acceptance fixtures, or submodule pages with L2 trace effects.

### Canonical Sources

- Canonical KB package: `D:\myproject\assessment-platform-kb\标准\子模块构建标准`
- cp implementation handbook: `docs/standard-submodule/`
- cp sync manifest: `docs/standard-submodule/standard-sync-manifest.md`
- Current cross-repo change-id: `2026-06-07-standard-submodule-construction-v1`

The KB package is the canonical standard source. cp docs are frontend implementation handbooks and must not become an independent standard definition.

### Trigger Conditions

Read the KB standard and cp manifest first when a task touches any of these areas:

- Flow submodule construction patterns or `src/submodules/*` architecture.
- L0/L1 page modeling, field IDs, content IDs, page IDs, or mapping semantics.
- L2 trace event reporting, trace contracts, trace registries, validators, or logger behavior.
- MarkObject submission shape, `operationList`, `answerList`, `flow_context`, page lifecycle operations, or submission fixtures.
- `docs/standard-submodule/**`, `docs/子模块数据上报规范/**`, trace acceptance fixtures, or submodule tests with trace effects.

### Change Rules

- If a change affects standard semantics, do not update cp docs alone; create or use a KB requirement/change-id and keep KB canonical.
- If a change only affects cp implementation details, update cp handbook/templates without changing the standard version unless the KB standard itself changes.
- When editing mirrored summaries in cp docs, update `standard-sync-manifest.md` with canonical/local paths, anchors, content hashes, mirror policy, verification time, and verified change-id.
- If KB standard text and cp handbook text conflict, use KB as canonical and record a follow-up to repair cp docs.
- Keep golden reference, branch completion, and mainline merge commits separate; this worktree is `D:\myproject\cp-banana-trace-standardization` and must later merge to `D:\myproject\cp`.

## NOTES

- Existing codebase includes both modernized and legacy segments; prefer incremental changes over broad refactors.
- Many docs/spec artifacts are historical; verify active behavior against runtime files in `src/` first.
- For architecture or capability changes, use `/opsx:explore` or `/opsx:propose` before implementation.
- Check `docs/project_notes/` before debugging to see if issue has been encountered before.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- After modifying code files in this session, run `python3 -c "from graphify.watch import _rebuild_code; from pathlib import Path; _rebuild_code(Path('.'))"` to keep the graph current
