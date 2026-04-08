<!-- OPENSPEC:START -->

# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:

- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:

- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

HCI-Evaluation is a **modular React assessment platform** for educational interactive evaluations. Built with React 18 + Vite 4, the system supports multiple grade-level modules and a composable Flow system for mixed assessment flows.

**Tech Stack:**

- React 18.2 (functional components, Hooks, lazy loading)
- Vite 4 (build tool, HMR, path aliases)
- React Router 7
- Recharts 2.15 (data visualization)
- CSS Modules (style isolation)
- Vitest (testing with vmThreads for WSL2)

**Critical Constraint:** The platform runs in **WSL2 environment**. Use `pool: 'vmThreads'` for tests (see vite.config.js:250).

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
npm run test:coverage    # Coverage report
npm run test:submission  # Run submission service tests only
npm run test:submission-format  # Run submission format snapshot tests

# Code Quality
npm run lint             # ESLint check (max 0 warnings)
npm run lint:submission  # Lint submission services with strict rules
```

**Environment Variables:**

```bash
# .env.local
VITE_USE_MOCK=1              # Use mock API (default: 1)
VITE_API_TARGET=http://...   # Real backend URL when mock disabled
VITE_BASE=./                 # Build base path (default: relative)
VITE_PASSWORD_FREE=1         # Enable password-free login (dev only)
VITE_FLOW_HEARTBEAT_ENABLED=1  # Enable Flow progress heartbeat
```

---

## Architecture: Dual System

The platform has two parallel systems:

### 1. Module System (Legacy)

Traditional modules registered via `ModuleRegistry`:

**Location:** [src/modules/ModuleRegistry.js](src/modules/ModuleRegistry.js)

**Current Modules:**

- **Grade 7 Traditional** (`/seven-grade`) - Legacy wrapper, uses traditional PageRouter
- **Grade 7 Tracking** (`/grade-7-tracking`) - Advanced: physics simulation, questionnaires, 23 pages

**Module Interface:**

```javascript
export const YourModule = {
  moduleId: 'unique-id', // kebab-case
  displayName: 'Display Name',
  url: '/module-path', // Must match backend login response
  version: '1.0.0',
  ModuleComponent: Component, // React component
  getInitialPage: pageNum => 'page-id', // Resume logic
  onInitialize: () => {}, // Optional
  onDestroy: () => {}, // Optional cleanup
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

- `FlowOrchestrator` - Manages flow state, progress, step transitions
- `FlowProvider` - Context provider for flow state
- `FlowAppContextBridge` - Bridges Flow context with legacy AppContext
- `submoduleRegistry` - Central registry for all submodules

### 3. Submodule System

Submodules are composable units used within Flows:

**Location:** `src/submodules/`

**Current Submodules:**

- `g7-experiment`, `g7-questionnaire` - Grade 7 experiment and questionnaire
- `g7-tracking-experiment`, `g7-tracking-questionnaire` - Grade 7 tracking variants
- `g8-drone-imaging` - Drone imaging assessment (TypeScript)
- `g8-mikania-experiment` - Mikania experiment
- `g8-pv-sand-experiment` - PV sand experiment (TypeScript)

**Submodule Interface:**

```javascript
export const submodule = {
  id: 'g8-drone-imaging',
  displayName: '无人机航拍',
  Component: SubmoduleComponent,
  getInitialPage: pageNum => 'Page01_Cover',
  getNavigationMode: pageId => 'experiment' | 'questionnaire' | 'hidden',
  resolvePageNum: pageId => '1', // Maps pageId to pageNum
  getTotalSteps: () => 8,
  getDefaultTimers: () => ({ task: 2400, questionnaire: 600 }),
  onInitialize: () => {},
  onDestroy: () => {},
};
```

---

## Data Submission Contract

**Endpoint:** `POST /stu/saveHcMark`

**Format:** FormData with `mark` as stringified JSON:

```javascript
{
  batchCode: string,
  examNo: string,
  mark: JSON.stringify({
    pageNumber: string,        // "1", "2", "3" or composite "1.5"
    pageDesc: string,          // "问题1"
    operationList: [           // All user interactions
      {
        targetElement: string, // "按钮A", "输入框1"
        eventType: string,     // "点击", "输入", "选择"
        value: string,
        time: string           // ISO 8601 or "YYYY-MM-DD HH:mm:ss"
      }
    ],
    answerList: [              // Collected answers
      {
        targetElement: string,
        value: string
      }
    ],
    beginTime: "YYYY-MM-DD HH:mm:ss",
    endTime: "YYYY-MM-DD HH:mm:ss",
    imgList: []                // Optional image metadata
  })
}
```

**Shared Services:**

- [src/shared/services/api/](src/shared/services/api/) - API client, endpoints
- [src/shared/services/submission/](src/shared/services/submission/) - Unified submission pipeline
- [src/shared/services/timers/](src/shared/services/timers/) - Timer service

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
       "url": "/flow/g8-physics-assessment", // Flow pattern
       "pageNum": "1.5", // Composite: step 1, page 5
       "studentName": "张三"
     }
   }
   ```
3. AppContext stores to localStorage (`hci-*` keys)
4. Router dispatches to `/flow/:flowId` or legacy module

**Session Persistence:**

- Keys: `hci-isAuthenticated`, `hci-moduleUrl`, `hci-pageNum`, `hci-batchCode`, `hci-examNo`
- Flow progress: `flow.<flowId>.progressQueue` for offline queue
- Heartbeat: Flow progress sync via `/api/flows/:flowId/progress`

---

## Mock Mode vs Production

**Mock Mode (Default):**

- Enable: `VITE_USE_MOCK=1`
- Intercepts: `/stu/login`, `/stu/saveHcMark`, `/stu/checkSession`, `/api/flows/*`
- Mock users: `g4test` → Grade 4 flow, default → Grade 8 physics flow
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

  // Signal completion when done
  const handleFinish = () => {
    onComplete(); // Triggers FlowModule to advance
  };
}
```

### 2. Timer Management

**Unified TimerService:**

```javascript
import { TimerService } from '@shared/services/timers';

// Start task timer (40 min default)
TimerService.startTask(2400, { scope: 'flow::g8::experiment::0::task' });

// Start questionnaire timer (10 min default)
TimerService.startQuestionnaire(600, { scope: 'flow::g8::questionnaire::1::questionnaire' });

// Get remaining time
const remaining = TimerService.getInstance('task').getRemainingSeconds();
```

### 3. Navigation Mode

Submodules declare navigation mode per page:

```javascript
getNavigationMode: pageId => {
  if (pageId.includes('Notice') || pageId.includes('Cover')) return 'hidden';
  if (pageId.includes('Questionnaire')) return 'questionnaire';
  return 'experiment';
};
```

---

## Path Aliases

```javascript
import { Component } from '@modules/grade-7-tracking/Component';
import { apiClient } from '@shared/services/api';
import { TimerService } from '@shared/services/timers';
import { FlowProvider } from '@flows/context';
import { submodule } from '@submodules/g8-drone-imaging';
import { useTimer } from '@hooks/useTimer';
```

**Aliases** (vite.config.js:194-206):

- `@` → `src/`
- `@app` → `src/app/`
- `@flows` → `src/flows/`
- `@submodules` → `src/submodules/`
- `@shared` → `src/shared/`
- `@hooks` → `src/hooks/`
- `@modules` → `src/modules/`
- `@pages` → `src/pages/`
- `@services` → `src/services/`

---

## Directory Structure

```
src/
├── flows/                      # Flow orchestration system
│   ├── FlowModule.jsx          # Flow entry component
│   ├── FlowAppContextBridge.jsx
│   ├── context/                # FlowProvider
│   └── orchestrator/           # FlowOrchestrator, mock definitions
├── submodules/                 # Composable assessment units
│   ├── registry.js             # Central submodule registry
│   ├── g7-experiment/
│   ├── g7-tracking-experiment/
│   ├── g8-drone-imaging/       # TypeScript submodule
│   ├── g8-mikania-experiment/
│   └── g8-pv-sand-experiment/  # TypeScript submodule
├── modules/                    # Legacy module system
│   ├── ModuleRegistry.js
│   ├── ModuleRouter.jsx
│   ├── grade-7-tracking/
│   └── grade-7/
├── shared/
│   ├── services/
│   │   ├── api/                # API client, endpoints
│   │   ├── submission/         # Unified submission pipeline
│   │   └── timers/             # TimerService
│   ├── ui/                     # PageFrame, TransitionPage, CompletionPage
│   └── types/                  # TypeScript types, flow types
├── context/
│   └── AppContext.jsx          # Global state, auth, legacy timers
├── pages/
│   └── LoginPage.jsx
├── App.jsx
└── main.jsx
```

---

## OpenSpec Workflow

**Before making architecture changes:**

1. Read [openspec/AGENTS.md](openspec/AGENTS.md)
2. Check existing specs: `openspec list --specs`
3. Check active changes: `openspec list`

**Creating Proposals:**

- Required for: new features, breaking changes, architecture modifications
- Skip for: bug fixes, typos, dependency updates
- Structure: `openspec/changes/<change-id>/` with `proposal.md`, `tasks.md`, optional `design.md`, and `specs/` deltas

**Key Commands:**

```bash
openspec list                   # List active changes
openspec list --specs           # List specifications
openspec show [item]            # Display change or spec
openspec validate [item] --strict  # Validate before implementation
openspec archive <change-id> --yes  # Archive after deployment
```

---

## Troubleshooting

**Flow not loading:**

- Check `/flow/<flowId>` matches mock definition in `mockFlowDefinitions.js`
- Verify submodule registered in `submoduleRegistry`
- Console logs: `[FlowModule]`, `[FlowOrchestrator]`

**Submodule not found:**

- Check `submoduleRegistry.initialize()` was called
- Verify submodule exported correctly from index file
- Check `id` in submodule definition matches flow step's `submoduleId`

**Timer issues:**

- Check scope format: `flow::<flowId>::<submoduleId>::<stepIndex>::<type>`
- Use `TimerService.getInstance('task').getDebugInfo()` for debugging
- Timer only starts on non-hidden pages

**Data submission fails:**

- Verify FormData structure (not JSON body)
- Ensure `mark` field is JSON.stringify()
- Check for 401 → Should auto-redirect to login

**WSL2 Test Failures:**

- Vitest configured with `pool: 'vmThreads'` (avoid forks/threads)
- Increase timeouts if needed (testTimeout: 10000ms)

---

## Style Guidelines

**CSS Modules:**

- All new components: Use CSS Modules (`*.module.css`)
- Import: `import styles from './Component.module.css'`

**Component Naming:**

- Components: `PascalCase.jsx` or `PascalCase.tsx`
- Hooks: `useCamelCase.js`
- Utils: `camelCase.js`
- Styles: `ComponentName.module.css`

---

## Testing

**Unit Tests:**

```bash
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
npm run test:submission     # Submission service tests
```

**Test File Location:**

- Component tests: `__tests__/` folder adjacent to component
- Integration tests: `src/submodules/<name>/__tests__/`

---

## Important Constraints

1. **Zero Impact Rule:** New submodules must NOT modify existing module files
2. **API Compatibility:** All submissions must use FormData + JSON.stringify format
3. **Linear Navigation:** Forward-only assessment flow (no back button in production)
4. **Session Integrity:** Never expose credentials in logs or console
5. **WSL2 Environment:** Use vmThreads for tests, handle path differences
6. **UTF-8 Encoding (MANDATORY):**
   - ALL source files MUST use UTF-8 encoding (without BOM)
   - Chinese characters must be properly encoded
   - **Critical:** Never use ANSI, GB2312, or other legacy encodings

---

## Key File References

**Flow System:**

- [src/flows/FlowModule.jsx](src/flows/FlowModule.jsx) - Flow entry point
- [src/flows/orchestrator/FlowOrchestrator.js](src/flows/orchestrator/FlowOrchestrator.js) - Flow state management
- [src/submodules/registry.js](src/submodules/registry.js) - Submodule registry

**Shared Services:**

- [src/shared/services/timers/](src/shared/services/timers/) - TimerService
- [src/shared/services/submission/](src/shared/services/submission/) - Submission pipeline
- [src/shared/services/api/](src/shared/services/api/) - API client

**Legacy System:**

- [src/modules/ModuleRegistry.js](src/modules/ModuleRegistry.js) - Module registration
- [src/context/AppContext.jsx](src/context/AppContext.jsx) - Global state

**Documentation:**

- [openspec/project.md](openspec/project.md) - Conventions, naming, policies
- [openspec/AGENTS.md](openspec/AGENTS.md) - OpenSpec workflow
