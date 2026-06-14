# CLAUDE.md

本文件为 Claude Code（claude.ai/code）在本仓库工作时提供中文协作规则与已验证项目事实。后续历史英文段落保留作辅助参考。

---


<!-- cp-kb-init-start -->
## 本仓库事实（cp，2026-05-22 按代码验证）

本仓库是学生端测评前端 `cp`，运行时以 React 18 + Vite 4 为主，保留 legacy module routing，并新增 Flow/submodule 编排。此中文章节是当前主要规则；知识库和历史文档只能作为导航，当它们与代码冲突时，以当前代码、API 实现、测试和运行行为为准。

### 技术栈

- React `^18.2.0`、React DOM `^18.2.0`、React Router DOM `^7.7.1`，入口见 `src/main.jsx` 与 `src/app/AppShell.jsx`。
- Vite `^4.4.5` + `@vitejs/plugin-react`，配置见 `vite.config.js`；默认开发端口 `3000`。
- TypeScript `^5.9.3` 与 `allowJs: true` 混合 JS/TS；路径别名配置在 `vite.config.js` 和 `tsconfig.json`。
- UI/数据可视化依赖包括 Radix Dialog/Icons、lucide-react、Recharts、Chart.js、react-chartjs-2、D3、topojson-client。
- 认证密码加密使用 `jsencrypt`，登录调用前在 `src/utils/jsencrypt.ts` 使用内置公钥加密。
- 测试使用 Vitest `^4.0.10`、Testing Library、jsdom；E2E 使用 Playwright `^1.56.0`。

### 目录职责

- `src/app/`：AppShell、顶层路由、`/flow/*` StrictMode 分支控制和全局 UserInfoBar 可见性。
- `src/context/`：`AppContext`，负责登录状态、localStorage/sessionStorage、计时器、Flow bridge helper、页面提交入口。
- `src/flows/`：Flow 运行时、FlowOrchestrator、Flow context bridge、mock Flow definitions。
- `src/modules/`：legacy module registry/router，以及 `grade-7`、`grade-7-tracking` 等旧模块包装。
- `src/submodules/`：Flow 子模块注册表与子模块实现；当前注册 `g4-experiment`、四个 G7 wrapper、四个 G8 标准子模块。
- `src/shared/`：共享 API client、提交层、计时器、PageFrame、LeftStepperNav、类型和页面映射工具。
- `src/pages/`：旧 G7 蒸馒头页面与问卷页面；`src/modules/grade-7-tracking/pages/` 是追踪实验/问卷页面。
- `tests/` 与各模块 `__tests__/`：Vitest 单元/快照/格式测试与 Playwright E2E。

### 关键文件

- 启动与路由：`src/main.jsx`、`src/app/AppShell.jsx`、`src/App.jsx`。
- 登录与会话：`src/pages/LoginPage.jsx`、`src/context/AppContext.jsx`、`src/shared/services/storage/storageKeys.js`。
- API 配置：`src/config/apiConfig.js`、`src/shared/services/apiService.js`、`src/shared/services/api/endpoints.ts`、`src/shared/services/api/apiClient.ts`。
- Flow 编排：`src/flows/FlowModule.jsx`、`src/flows/orchestrator/FlowOrchestrator.ts`、`src/hooks/useHeartbeat.ts`。
- 模块/子模块注册：`src/modules/ModuleRegistry.js`、`src/modules/ModuleRouter.jsx`、`src/submodules/registry.ts`、`src/shared/types/flow.ts`。
- 提交流水线：`src/shared/services/submission/usePageSubmission.js`、`src/shared/services/apiService.js`、`src/shared/ui/PageFrame/AssessmentPageFrame.jsx`、`src/shared/utils/pageMapping.ts`。

### 常用命令

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

### API、认证、配置和数据访问

- 登录：`src/shared/services/apiService.js` 发起 `GET /stu/login`（由 `buildApiUrl('/login')` 组成），query 为 `accountName`、RSA 加密后的 `accountPass`、`type=2`。
- 提交：`submitPageMarkData()` 发起 `POST /stu/saveHcMark`（由 `buildApiUrl('/saveHcMark')` 组成），使用 FormData：`batchCode`、`examNo`、`mark=JSON.stringify(mark)`。
- Flow：`src/shared/services/api/endpoints.ts` 定义 `GET /stu/api/flows/{flowId}`、`GET /stu/api/flows/{flowId}/progress/{examNo}?batchCode=...`、`POST /stu/api/flows/{flowId}/progress`。
- Login page config: `src/shared/services/loginPageConfig/api.ts` calls `GET /stu/api/login-page-config/active`; in non-mock dev mode, `vite.config.js` proxies it to `VITE_LOGIN_CONFIG_TARGET` / `VITE_ADMIN_API_TARGET`, defaulting to the public admin backend `http://117.72.14.166:8777`.
- 会话心跳：G7 tracking 旧模块还调用 `GET /stu/checkSession?sessionId=...&studentCode=...`；Flow 心跳实际写入 progress endpoint，不使用声明的 `/api/heartbeat`。
- 认证方式：浏览器 Session Cookie；`apiClient` 和 `apiConfig` 的 fetch 配置使用或透传 `credentials: include`，401 走 `AppContext.handleSessionExpired` 清理并重定向。
- 本仓库没有直接数据库访问、migration、model/entity；数据库事实必须到后端仓库和 schema 验证。
- 关键环境变量：`VITE_USE_MOCK`、`VITE_API_TARGET`、`VITE_API_BASE_URL`、`VITE_LOGIN_CONFIG_TARGET`、`VITE_ADMIN_API_TARGET`、`VITE_BASE`、`VITE_ROUTER_BASENAME`、`VITE_FLOW_HEARTBEAT_ENABLED`、`VITE_FLOW_DEV_MOCK_AUTH`、`VITE_FLOW_PROVIDER_ENABLED`、`VITE_FLOW_BRIDGE_ENABLED`、`VITE_FULLSCREEN_ENABLED`、`VITE_REQUIRE_FULLSCREEN_IN_DEV`、`VITE_RENDER_COUNTER_ENABLED`。

### 与其他仓库的交互点

- `xspj-service`：学生登录、提交作答痕迹、Flow 定义/进度/心跳、legacy session check；默认联调目标见 `VITE_API_TARGET`/`VITE_API_BASE_URL`。
- `admin-backend`: public login-page config endpoint `/stu/api/login-page-config/active`; dev proxy target is configured by `VITE_LOGIN_CONFIG_TARGET` / `VITE_ADMIN_API_TARGET`, default `http://117.72.14.166:8777`.
- `admin-frontend`：本仓库代码中没有直接运行时 HTTP 调用；Flow、批次、显示配置等通常由管理端配置后经后端返回，具体以 admin 仓库和后端代码为准。
- 共享数据库：cp 没有直接数据库连接；“四库共享数据库”只作为协作假设，不能从本仓库单独确认。

### 跨库知识库

共享 Obsidian Markdown vault：`D:\myproject\assessment-platform-kb`。

跨库任务开始前必须读取：

1. `D:\myproject\assessment-platform-kb\00-index.md`
2. `D:\myproject\assessment-platform-kb\VAULT_RULES.md`
3. 与任务相关的 `架构/`、`代码库/`、`API契约/`、`术语表/`、`排错手册/`、`需求/<change-id>/` 文件

跨库规则：

- 涉及 2 个及以上仓库的变更即为跨库变更。
- 所有跨库变更使用同一个 `change-id`，格式为 `YYYY-MM-DD-kebab-case-title`。
- 跨库变更流程：先创建或读取 `D:\myproject\assessment-platform-kb\需求\<change-id>\unified-plan.md`；人工确认 unified-plan；各仓库独立做本仓 OpenSpec proposal；各仓按同一个 `change-id` 实施和验证。
- 写入规则：agent 默认只写 `D:\myproject\assessment-platform-kb\inbox\` 和 `D:\myproject\assessment-platform-kb\需求\<change-id>\`；长期知识区只读，除非当前任务明确授权。
- code-is-truth：知识库是导航和协作上下文，不是最终事实来源；当前代码、schema、API 实现、测试和运行行为优先。
<!-- cp-kb-init-end -->

## Project Overview

HCI-Evaluation is a **modular React assessment platform** for educational interactive evaluations. Built with React 18 + Vite 4, the system supports multiple grade-level modules and a composable Flow system for mixed assessment flows.

**Tech Stack:**

- React 18.2 (functional components, Hooks, lazy loading)
- Vite 4 (build tool, HMR, path aliases)
- React Router DOM 7.7 (routing)
- Vitest 4 (testing with vmThreads for WSL2)
- TypeScript 5.9 (submodules, types, registry)
- Recharts 2.15 + Chart.js 4.5 + D3 7 (data visualization)
- Radix UI + Lucide React (UI primitives)
- Zod 3 (runtime validation)
- CSS Modules (style isolation)

**Critical Constraint:** The platform runs in **WSL2 environment**. Use `pool: 'vmThreads'` for tests (see vite.config.js).

---

## Common Development Commands

```bash
# Development
npm run dev              # Start dev server on port 3000 (mock mode by default)

# Build & Preview
npm run build            # Production build with code splitting
npm run build:bc         # Build with bc mode
npm run preview          # Preview production build

# Testing
npm test                 # Run Vitest once
npm run test:watch       # Watch mode
npm run test:ui          # Vitest UI
npm run test:coverage    # Coverage report
npm run test:submission  # Run submission service tests only
npm run test:submission-format  # Run submission format snapshot tests

# Run a single test file
npx vitest run src/submodules/g8-pv-sand-experiment/__tests__/submission-format.test.ts
# Run tests matching a pattern
npx vitest run -t "submission format"

# Code Quality
npm run lint             # ESLint check (max 0 warnings)
npm run lint:submission  # Lint submission services with strict rules
```

**Environment Variables:**

```bash
# .env.local
VITE_USE_MOCK=1              # Use mock API (default: 1)
VITE_API_TARGET=http://...   # Real backend URL when mock disabled
VITE_LOGIN_CONFIG_TARGET=http://... # Optional admin backend for login-page config; default http://117.72.14.166:8777
VITE_BASE=./                 # Build base path (default: relative)
VITE_PASSWORD_FREE=1         # Enable password-free login (dev only)
VITE_FLOW_HEARTBEAT_ENABLED=1  # Enable Flow progress heartbeat
```

---

## Architecture: Dual System

The platform has two coexisting systems — legacy module routing and modern flow/submodule orchestration. Core risk areas: flow state synchronization, submission format compliance, and timer/session behavior across route transitions.

### 1. Module System (Legacy)

Traditional modules registered via `ModuleRegistry`:

**Location:** [src/modules/ModuleRegistry.js](src/modules/ModuleRegistry.js)

**Current Modules:**

- **Grade 4** (`/four-grade`) - Train ticket ordering system (11 pages)
- **Grade 7 Traditional** (`/seven-grade`) - Legacy wrapper, uses traditional PageRouter
- **Grade 7 Tracking** (`/grade-7-tracking`) - Honey viscosity experiment + questionnaires, 23 pages

**Module Interface:**

```javascript
export const YourModule = {
  moduleId: 'unique-id', // kebab-case
  displayName: 'Display Name',
  url: '/module-path', // Must match backend login response
  version: '1.0.0',
  ModuleComponent: Component,
  getInitialPage: pageNum => 'page-id',
  onInitialize: () => {},
  onDestroy: () => {},
};
```

### 2. Flow System (Modern)

Composable assessment flows using submodules:

**Location:** [src/flows/FlowModule.jsx](src/flows/FlowModule.jsx)

**URL Pattern:** `/flow/:flowId`

**Flow Architecture:**

```
Login → Backend returns {url: "/flow/g8-physics-assessment", pageNum}
  → FlowOrchestrator loads flow definition
  → Resolves current step → Loads submodule from registry
  → SubmoduleComponent renders with flowContext
  → onComplete → next step or completion page
```

**Key Components:**

- `FlowOrchestrator` ([src/flows/FlowOrchestrator.js](src/flows/FlowOrchestrator.js)) - Manages flow state, progress, step transitions
- `FlowProvider` ([src/flows/context/](src/flows/context/)) - Context provider for flow state
- `FlowAppContextBridge` - Bridges Flow context with legacy AppContext
- `submoduleRegistry` ([src/submodules/registry.ts](src/submodules/registry.ts)) - Central registry for all submodules

### 3. Submodule System

Submodules are composable units used within Flows. Two build modes:

| Mode | Use case | Reference | Description |
|---|---|---|---|
| **Standard** | New submodules | `src/submodules/g8-pv-sand-experiment/` | mapping+context+pages self-contained, uses AssessmentPageFrame |
| **Legacy Wrapper** | Bridge old modules to Flow | `src/submodules/g7-experiment/` | Thin adapter wrapping old components, bridges flowContext |

> New submodules **must** use Standard mode. A template exists at `src/submodules/_example/`.

**Current Submodules:**

- `g4-experiment` - Grade 4 train ticket interaction (12 pages)
- `g7-experiment` - Grade 7 steamed bun experiment (Legacy Wrapper)
- `g7-questionnaire` - Grade 7 steamed bun questionnaire (Legacy Wrapper)
- `g7-tracking-experiment` - Grade 7 tracking experiment (Legacy Wrapper)
- `g7-tracking-questionnaire` - Grade 7 tracking questionnaire (Legacy Wrapper)
- `g8-drone-imaging` - Drone imaging assessment (TypeScript)
- `g8-mikania-experiment` - Mikania experiment
- `g8-pv-sand-experiment` - PV sand experiment (TypeScript, best reference for Standard mode)
- `g8-banana-browning-experiment` - Banana browning experiment (TypeScript)

**Submodule Interface (CMI - Composable Module Interface):**

Type definition: [src/shared/types/flow.ts](src/shared/types/flow.ts) → `SubmoduleDefinition`

```typescript
export const submodule: SubmoduleDefinition = {
  submoduleId: 'g8-drone-imaging',   // kebab-case, required
  displayName: '无人机航拍',
  version: '1.0.0',
  Component: SubmoduleComponent,      // required
  getInitialPage: subPageNum => 'Page01_Cover',  // required
  getTotalSteps: () => 8,             // required
  getNavigationMode: pageId => 'experiment' | 'questionnaire' | 'hidden',  // required
  getDefaultTimers: () => ({ task: 2400, questionnaire: 600 }),
  resolvePageNum: pageId => '1',
  onInitialize: () => {},
  onDestroy: () => {},
};
```

Registration validation in `src/submodules/registry.ts` enforces: `submoduleId`, `Component`, `getInitialPage`, `getTotalSteps`, `getNavigationMode`.

**Standard Submodule Directory Structure:**

```
src/submodules/<submoduleId>/
  index.tsx|jsx        # Export SubmoduleDefinition
  Component.tsx|jsx    # Provider + AssessmentPageFrame (submit wiring + nav pipeline)
  mapping.ts           # Single source of truth: page configs, question codes, SUBMODULE_MAPPING_CONFIG
  context/             # State: currentPageId, answers, operations, stable logOperation
  pages/               # Page UI (no direct submit API calls, no hand-written pageNumber/prefix)
  types.ts             # Submodule-specific types (optional)
  __tests__/           # mapping compliance + submission snapshot/format tests
```

**Key Rule:** Pages interact through context; `Component` owns the unified onNext pipeline: validate → submit → clearOperations → navigate/complete.

---

## Submission Pipeline

All submissions flow through the shared pipeline, **never** directly to `/stu/saveHcMark`.

```
Page interaction → context.logOperation() → operations[]
Page answers     → context.answerDraft   → buildAnswerList()
                                              ↓
AssessmentPageFrame.onNext → validatePage()
  → defaultSubmit() → usePageSubmission → buildMark()
    → POST /stu/saveHcMark (FormData)
```

**Endpoint:** `POST /stu/saveHcMark`

**Format:** FormData with `mark` as stringified JSON:

```javascript
{
  batchCode: string,
  examNo: string,
  mark: JSON.stringify({
    pageNumber: string,        // Composite: "<stepIndex+1>.<subPageNum>" e.g. "1.03"
    pageDesc: string,
    operationList: [{ targetElement, eventType, value, time }],
    answerList: [{ targetElement, value }],
    beginTime: "YYYY-MM-DD HH:mm:ss",
    endTime: "YYYY-MM-DD HH:mm:ss",
    imgList: []
  })
}
```

**Composite page number format:** `<stepIndex+1>.<subPageNum padded to 2 digits>` (e.g., step 0, page 3 → `"1.03"`). Encoded via `encodeCompositePageNum` from `@shared/utils/pageMapping.ts`.

**Shared Services:**

- [src/shared/services/submission/usePageSubmission.js](src/shared/services/submission/usePageSubmission.js) - Standard submit hook (retries, flow_context injection, lifecycle events)
- [src/shared/services/submission/submoduleAdapter/](src/shared/services/submission/submoduleAdapter/) - Adapters: collectAnswers, buildPageDesc, appendExperimentHistory
- [src/shared/ui/PageFrame/AssessmentPageFrame.jsx](src/shared/ui/PageFrame/AssessmentPageFrame.jsx) - Unified page frame with submit lifecycle
- [src/shared/utils/pageMapping.ts](src/shared/utils/pageMapping.ts) - Page number encoding/decoding utilities

**Submission lifecycle events:** `page_enter`, `next_click` or `auto_submit`, `page_exit`.

**Validation commands (must all pass):**

```bash
npm run lint:submission
npm run test:submission-format
npm run test:submission
```

---

## Authentication & Session

**Login Flow:**

1. [LoginPage.jsx](src/pages/LoginPage.jsx) → `POST /stu/login`
2. Backend response determines module or flow:
   ```json
   {
     "code": 200,
     "obj": {
       "batchCode": "250619",
       "examNo": "1001",
       "url": "/flow/g8-physics-assessment",
       "pageNum": "1.5",
       "studentName": "张三"
     }
   }
   ```
3. AppContext stores to localStorage (`hci-*` keys)
4. Router dispatches to `/flow/:flowId` or legacy module

**Session Persistence:**

- Keys: `hci-isAuthenticated`, `hci-moduleUrl`, `hci-pageNum`, `hci-batchCode`, `hci-examNo`
- Flow keys: `flow.<flowId>.stepIndex`, `flow.<flowId>.modulePageNum`, `flow.<flowId>.definition`, `flow.<flowId>.completed`
- Heartbeat: Flow progress sync via `/api/flows/:flowId/progress`

---

## Mock Mode vs Production

**Mock Mode (Default):**

- Enable: `VITE_USE_MOCK=1`
- Intercepts: `/stu/login`, `/stu/saveHcMark`, `/stu/checkSession`, `/api/flows/*`
- Mock users: `g4test` → Grade 4 flow, `g7track` → Grade 7 tracking, default → Grade 8 physics flow
- Returns predefined responses (no backend needed)

**Production Mode:**

```bash
VITE_USE_MOCK=0
VITE_API_TARGET=http://117.72.14.166:9002
```

---

## Key Implementation Patterns

### 1. Flow Context Pattern

Submodules receive flow context for integration:

```javascript
function SubmoduleComponent({ userContext, flowContext, initialPageId }) {
  const { flowId, submoduleId, stepIndex, onComplete, onTimeout } = flowContext;

  const handleFinish = () => {
    onComplete(); // Triggers FlowModule to advance
  };
}
```

### 2. Timer Management

```javascript
import { TimerService } from '@shared/services/timers';

TimerService.startTask(2400, { scope: 'flow::g8::experiment::0::task' });
TimerService.startQuestionnaire(600, { scope: 'flow::g8::questionnaire::1::questionnaire' });
```

**Timer scope format:** `flow::<flowId>::<submoduleId>::<stepIndex>::<type>`

**Info pages (notices, questionnaire intros) must use `hidden` navigation mode and not display the timer.**

### 3. Navigation Mode

```javascript
getNavigationMode: pageId => {
  if (pageId.includes('Notice') || pageId.includes('Cover')) return 'hidden';
  if (pageId.includes('Questionnaire')) return 'questionnaire';
  return 'experiment';
};
```

### 4. Route-Level StrictMode Split

Flow routes avoid StrictMode to prevent double-initialization side effects. Configured in [src/app/AppShell.jsx](src/app/AppShell.jsx).

### 5. Flow Completion

Uses sentinel progress page number (`999`) and explicit timer reset.

---

## Anti-Patterns (Do NOT Do These)

- **Directly calling `/stu/saveHcMark`** from feature pages/submodules — always go through `usePageSubmission` / `AssessmentPageFrame`
- **Bypassing `usePageSubmission` / `AssessmentPageFrame`** for page submit lifecycle
- **Hand-writing page prefixes** that bypass `pageMapping` helpers
- **Cross-module direct imports** (`../../../modules/*`, `../../modules/*`) — use aliases
- **Reworking OpenSpec-defined behavior** without proposal approval for capability-level changes

---

## Path Aliases

```javascript
import { apiClient } from '@shared/services/api';
import { TimerService } from '@shared/services/timers';
import { FlowProvider } from '@flows/context';
import { submodule } from '@submodules/g8-drone-imaging';
import { useTimer } from '@hooks/useTimer';
```

**Aliases** (vite.config.js):

- `@` → `src/`
- `@app` → `src/app/`
- `@flows` → `src/flows/`
- `@submodules` → `src/submodules/`
- `@shared` → `src/shared/`
- `@hooks` → `src/hooks/`
- `@utils` → `src/utils/`
- `@assets` → `src/assets/`
- `@components` → `src/components/`
- `@modules` → `src/modules/`
- `@pages` → `src/pages/`
- `@services` → `src/services/`

---

## Style Guidelines

- **CSS Modules:** All new components use `*.module.css`. Import: `import styles from './Component.module.css'`
- **Components:** `PascalCase.jsx` or `PascalCase.tsx`
- **Hooks:** `useCamelCase.js`
- **Utils:** `camelCase.js`
- **Styles:** `ComponentName.module.css`

---

## Important Constraints

1. **Zero Impact Rule:** New submodules must NOT modify existing module files
2. **API Compatibility:** All submissions must use FormData + JSON.stringify format
3. **Linear Navigation:** Forward-only assessment flow (no back button in production)
4. **Session Integrity:** Never expose credentials in logs or console
5. **WSL2 Environment:** Use vmThreads for tests, handle path differences
6. **UTF-8 Encoding (MANDATORY):** All source files UTF-8 without BOM; never use ANSI, GB2312, etc.

---

## OpenSpec Workflow

**Before making architecture changes:**

1. Use `/opsx:explore` to think through the change
2. Check existing specs: `openspec list --specs`
3. Check active changes: `openspec list`

**Creating Proposals:**

- Required for: new features, breaking changes, architecture modifications
- Skip for: bug fixes, typos, dependency updates
- Structure: `openspec/changes/<change-id>/` with `proposal.md`, `tasks.md`, optional `design.md`

---

## Key File References

**Flow System:**

- [src/flows/FlowModule.jsx](src/flows/FlowModule.jsx) - Flow entry point
- [src/flows/FlowOrchestrator.js](src/flows/FlowOrchestrator.js) - Flow state management
- [src/submodules/registry.ts](src/submodules/registry.ts) - Submodule registry (dynamic imports, validation)
- [src/shared/types/flow.ts](src/shared/types/flow.ts) - FlowDefinition, SubmoduleDefinition, FlowProgress types

**Shared Services:**

- [src/shared/services/timers/](src/shared/services/timers/) - TimerService
- [src/shared/services/submission/usePageSubmission.js](src/shared/services/submission/usePageSubmission.js) - Unified submit hook
- [src/shared/services/submission/submoduleAdapter/](src/shared/services/submission/submoduleAdapter/) - Submission adapters
- [src/shared/services/api/](src/shared/services/api/) - API client, endpoints
- [src/shared/utils/pageMapping.ts](src/shared/utils/pageMapping.ts) - Composite page number utilities

**Shared UI:**

- [src/shared/ui/PageFrame/AssessmentPageFrame.jsx](src/shared/ui/PageFrame/AssessmentPageFrame.jsx) - Standard page frame with submit lifecycle
- [src/shared/ui/LeftStepperNav/](src/shared/ui/LeftStepperNav/) - Step navigation sidebar
- [src/shared/ui/TimerDisplay/](src/shared/ui/TimerDisplay/) - Timer container component

**Legacy System:**

- [src/modules/ModuleRegistry.js](src/modules/ModuleRegistry.js) - Module registration
- [src/context/AppContext.jsx](src/context/AppContext.jsx) - Global state

**Reference Implementations:**

- `src/submodules/g8-pv-sand-experiment/` - Best Standard mode reference: full SUBMODULE_MAPPING_CONFIG, buildMark, tests
- `src/submodules/g8-banana-browning-experiment/` - TypeScript Standard mode
- `src/submodules/_example/` - Template for new submodules

**Documentation:**

- [openspec/project.md](openspec/project.md) - Conventions, naming, policies
- OpenSpec workflow: use `/opsx:explore`, `/opsx:propose`, `/opsx:apply`, `/opsx:archive` commands
- [docs/submodule-page-build-process.md](docs/submodule-page-build-process.md) - Phase 0-5 submodule build process
- [docs/submission-spec.md](docs/submission-spec.md) - Target submission format specification

**When to read what:**

| When | Read |
|---|---|
| Before major feature work or design decisions | `docs/ARCHITECTURE.md` |
| Proposing architectural changes, understanding "why" | `docs/DECISIONS.md` |
| Debugging, after fixing bugs, checking config | `docs/project_notes/` (bugs.md, key_facts.md, decisions.md) |
| Building new submodules | `docs/submodule-page-build-process.md`, `docs/submission-spec.md` |
| Planning or ambiguous requirements | Use `/opsx:explore` or `/opsx:propose` |

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **cepingzonghe** (17009 symbols, 24069 relationships, 300 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/cepingzonghe/context` | Codebase overview, check index freshness |
| `gitnexus://repo/cepingzonghe/clusters` | All functional areas |
| `gitnexus://repo/cepingzonghe/processes` | All execution flows |
| `gitnexus://repo/cepingzonghe/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
