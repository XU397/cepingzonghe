# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

HCI-Evaluation is a **modular React assessment platform** for educational interactive evaluations. Built with React 18 + Vite 4, the system supports multiple grade-level modules, each with distinct assessment flows and state management.

**Tech Stack:**
- React 18.2 (functional components, Hooks, lazy loading)
- Vite 4 (build tool, HMR, path aliases)
- React Router 7
- Recharts 2.15 (data visualization)
- CSS Modules (style isolation)
- Vitest (testing with vmThreads for WSL2)

**Critical Constraint:** The platform runs in **WSL2 environment**. Use `pool: 'vmThreads'` for tests (see vite.config.js:121).

---

## Common Development Commands

```bash
# Development
npm run dev              # Start dev server on port 3000 (mock mode by default)

# Build & Preview
npm run build            # Production build with code splitting
npm run preview          # Preview production build

# Testing
npm test                 # Run Vitest once
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report

# Code Quality
npm run lint             # ESLint check (max 0 warnings)
```

**Environment Variables:**
```bash
# .env.local
VITE_USE_MOCK=1          # Use mock API (default: 1)
VITE_API_TARGET=http://... # Real backend URL when mock disabled
VITE_BASE=./             # Build base path (default: relative)
```

---

## Architecture: Module System

### Core Concept

The platform uses a **module registry + dynamic loading** pattern. Each assessment (grade-4, grade-7, grade-7-tracking) is an independent module with its own:
- Context (state management)
- Pages (assessment flow)
- Styles (CSS Modules)
- Timer management
- Data submission logic

**Flow:**
```
Login → Backend returns {url, pageNum} → ModuleRegistry.getByUrl(url)
  → module.getInitialPage(pageNum) → <ModuleComponent /> renders
  → User completes → module.onDestroy() cleans up
```

### Module Registration

**Location:** [src/modules/ModuleRegistry.js](src/modules/ModuleRegistry.js:193-226)

**Current Modules:**
1. **Grade 7 Traditional** (`/seven-grade`) - Legacy wrapper, uses traditional PageRouter
2. **Grade 4** (`/four-grade`) - Modern: CSS Modules, Grade4Context, 11 pages
3. **Grade 7 Tracking** (`/grade-7-tracking`) - Advanced: physics simulation, questionnaires, 23 pages

**Module Interface:**
```javascript
export const YourModule = {
  moduleId: 'unique-id',        // kebab-case
  displayName: 'Display Name',
  url: '/module-path',          // Must match backend login response
  version: '1.0.0',
  ModuleComponent: Component,   // React component
  getInitialPage: (pageNum) => 'page-id',  // Resume logic
  onInitialize: () => {},       // Optional
  onDestroy: () => {}            // Optional cleanup
};
```

**Add New Module:**
1. Create `src/modules/grade-N/index.jsx` with module definition
2. Register in `ModuleRegistry.initialize()`:
   ```javascript
   const { GradeNModule } = await import('./grade-N/index.jsx');
   this.register(GradeNModule);
   ```
3. Coordinate with backend to ensure login returns matching `url`

---

## Data Submission Contract

**Endpoint:** `POST /stu/saveHcMark`

**Format:** FormData with `mark` as stringified JSON:

```javascript
{
  batchCode: string,
  examNo: string,
  mark: JSON.stringify({
    pageNumber: string,        // "1", "2", "3"
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
- [src/shared/services/apiService.js](src/shared/services/apiService.js) - API calls, 401 handling
- [src/shared/services/dataLogger.js](src/shared/services/dataLogger.js) - Data submission wrapper

**Error Handling:**
- **401 Unauthorized** → Auto-redirect to login, clear localStorage
- Network failures → Retry with exponential backoff (3 attempts)
- Log all operations for debugging (`logOperation`, `collectAnswer`)

---

## Authentication & Session

**Login Flow:**
1. [LoginPage.jsx](src/pages/LoginPage.jsx) → `POST /stu/login`
2. Backend response:
   ```json
   {
     "code": 200,
     "obj": {
       "batchCode": "250619",
       "examNo": "1001",
       "url": "/four-grade",      // Determines module
       "pageNum": "1",             // Resume point
       "studentName": "张三"
     }
   }
   ```
3. AppContext stores to localStorage (`hci-*` keys)
4. ModuleRouter resolves module by URL
5. Module's `getInitialPage(pageNum)` restores progress

**Session Persistence:**
- Keys: `hci-isAuthenticated`, `hci-moduleUrl`, `hci-pageNum`, `hci-batchCode`, `hci-examNo`
- Heartbeat: `/stu/checkSession` every 30s (optional per module)
- Page refresh → Restores to exact same page with timer state

---

## Mock Mode vs Production

**Mock Mode (Default):**
- Enable: `VITE_USE_MOCK=1` (see [vite.config.js:11-58](vite.config.js:11-58))
- Intercepts `/stu/login`, `/stu/saveHcMark`, `/stu/checkSession`
- Returns predefined responses (no backend needed)
- Default login → Grade 4 module

**Production Mode:**
```bash
VITE_USE_MOCK=0
VITE_API_TARGET=http://117.72.14.166:9002
```
- Proxies `/stu` and `/api` requests to backend
- Preserves cookies via proxy configuration

---

## Key Implementation Patterns

### 1. Page Lifecycle Tracking

Every page must log entry/exit:

```javascript
useEffect(() => {
  logOperation({
    targetElement: '页面',
    eventType: 'page_enter',
    value: 'Page_01_Notice',
    time: new Date().toISOString()
  });

  return () => {
    logOperation({
      targetElement: '页面',
      eventType: 'page_exit',
      value: 'Page_01_Notice',
      time: new Date().toISOString()
    });
  };
}, []);
```

### 2. Navigation Pattern

**Forward-only navigation** (no back button during assessment):

```javascript
const handleNext = async () => {
  // 1. Collect answer
  collectAnswer({
    targetElement: 'question-1',
    value: userAnswer
  });

  // 2. Build mark object
  const mark = {
    pageNumber: String(currentPageNum),
    pageDesc: '问题1',
    operationList: [...operations],
    answerList: [...answers],
    beginTime: pageStartTime,
    endTime: formatDateTime(new Date())
  };

  // 3. Submit before navigation
  await submitPageMarkData({ batchCode, examNo, mark });

  // 4. Clear operations
  clearOperations();

  // 5. Navigate
  navigateToPage(nextPageId);
};
```

### 3. Module Context Pattern

Each module should have its own Context (see [Grade4Context.jsx](src/modules/grade-4/context/Grade4Context.jsx)):

```javascript
const Grade4Context = createContext();

export const Grade4Provider = ({ children, initialPage }) => {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [operations, setOperations] = useState([]);
  const [answers, setAnswers] = useState([]);

  const logOperation = (op) => setOperations(prev => [...prev, op]);
  const collectAnswer = (ans) => setAnswers(prev => [...prev, ans]);
  const clearOperations = () => setOperations([]);

  return (
    <Grade4Context.Provider value={{
      currentPage,
      operations,
      answers,
      logOperation,
      collectAnswer,
      clearOperations,
      navigateToPage: setCurrentPage
    }}>
      {children}
    </Grade4Context.Provider>
  );
};
```

### 4. Timer Management

**Global Timer (AppContext):**
```javascript
const { startTaskTimer, taskTimeRemaining } = useAppContext();

useEffect(() => {
  startTaskTimer(45 * 60); // 45 minutes
}, []);

// Auto-submit on timer expiration
useEffect(() => {
  if (taskTimeRemaining === 0) {
    handleTimeExpired();
  }
}, [taskTimeRemaining]);
```

**Module-Specific Timer:**
```javascript
// See Grade4Context for countdown implementation
const { startCountdown } = useGrade4Context();

startCountdown(40, () => {
  navigateToNextPage();
});
```

---

## Performance Optimization

**Code Splitting:** ([vite.config.js:79-82](vite.config.js:79-82))
- All pages use `React.lazy()` + `<Suspense>`
- Automatic chunk splitting by Vite/Rollup
- Chunk size warning limit: 1000 KB

**Grade 7 Tracking Best Practices:**
- Uses SVG inline instead of image files → Zero network requests
- Physics animation: `will-change: transform`, `translateZ(0)` for GPU
- Target: 60 FPS for ball drop animation

**Path Aliases:** ([vite.config.js:65-77](vite.config.js:65-77))
```javascript
import { Component } from '@modules/grade-4/Component';
import { apiClient } from '@shared/services/api/apiClient';
import { useTimer } from '@hooks/useTimer';
```

---

## Directory Structure

```
src/
├── modules/                    # Module system
│   ├── ModuleRegistry.js       # Central registry (singleton)
│   ├── ModuleRouter.jsx        # Module loader & router
│   ├── ErrorBoundary.jsx       # Error boundary wrapper
│   ├── grade-7-tracking/       # Modern module example
│   │   ├── index.jsx           # Module definition
│   │   ├── context/            # TrackingContext + Provider
│   │   ├── pages/              # 23 pages (Page01-Page23)
│   │   ├── components/         # UI components
│   │   ├── hooks/              # useDataLogger, useNavigation
│   │   ├── utils/              # physicsModel, validation
│   │   ├── styles/             # CSS Modules
│   │   └── assets/             # JSON data files
│   ├── grade-4/                # CSS Modules, Grade4Context
│   └── grade-7/                # Legacy wrapper
├── context/
│   └── AppContext.jsx          # Global state, timer, auth
├── shared/
│   ├── components/             # Shared UI components
│   └── services/               # apiService, dataLogger
├── config/
│   └── apiConfig.js            # API configuration
├── pages/
│   └── LoginPage.jsx           # Entry point
├── App.jsx                     # Root component
└── main.jsx                    # React DOM render
```

---

## OpenSpec Workflow

**This project uses OpenSpec for spec-driven development.**

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
openspec archive <change-id>    # Archive after deployment
```

**Project Conventions:** [openspec/project.md](openspec/project.md)
- Naming: `core.*` (platform), `module.<id>.*` (module state), `flow.<id>.*` (future)
- Timer modes: task (40 min), questionnaire (10 min), notice (40 sec)
- Navigation: forward-only, no back button

---

## Troubleshooting

**Module not loading:**
- Check `url` matches backend response exactly (case-sensitive)
- Verify registration in `ModuleRegistry.initialize()`
- Console logs: `[ModuleRegistry]`, `[ModuleRouter]`

**Page not restoring after refresh:**
- Check localStorage: `hci-moduleUrl`, `hci-pageNum`
- Verify `getInitialPage(pageNum)` handles all valid values
- Module must handle `null` or invalid pageNum → return default

**Data submission fails:**
- Verify FormData structure (not JSON body)
- Ensure `mark` field is JSON.stringify()
- Check `batchCode` and `examNo` present
- 401 → Should auto-redirect to login

**Timer issues:**
- Check timer persistence in module context
- Verify timer stops on component unmount
- Handle page refresh: restore timer from localStorage

**WSL2 Test Failures:**
- Vitest configured with `pool: 'vmThreads'` (avoid forks/threads)
- Increase timeouts if needed (testTimeout: 10000ms)

---

## Style Guidelines

**CSS Modules:**
- New modules: Use CSS Modules (`*.module.css`)
- Import: `import styles from './Component.module.css'`
- Apply: `<div className={styles.container}>`

**Component Naming:**
- Components: `PascalCase.jsx`
- Hooks: `useCamelCase.js`
- Utils: `camelCase.js`
- Styles: `ComponentName.module.css`

**Avoid:**
- Global CSS pollution (use CSS Modules)
- Hardcoded colors (use CSS variables or tokens)
- Components deeper than 3 levels of nesting

---

## Testing

**Unit Tests:**
```bash
npm test                    # Run once
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report
```

**Manual Testing Checklist:**
- [ ] Login successful (mock or real backend)
- [ ] Module loads without console errors
- [ ] Page refresh maintains progress
- [ ] Timer persists across refresh
- [ ] Navigation submits data before advancing
- [ ] 401 error redirects to login
- [ ] Operations logged correctly
- [ ] Data submission format matches contract

**Performance Testing:**
- Chrome DevTools → Performance → Record page load
- Target: <2s first paint, 60 FPS animations
- Check bundle size: `npm run build` → inspect `dist/assets/`

---

## Migration to Unified Architecture (In Progress)

**Status:** Architecture refactoring via OpenSpec proposals

**Goals:**
1. Unified services: timers, submission, API client → `shared/services/`
2. Unified UI: navigation, timer display, page frame → `shared/ui/`
3. Submodule interface (CMI): wrap existing modules as composable units
4. Flow orchestrator: support mixed assessment flows (`/flow/<flowId>`)

**Key Documents:**
- [docs/需求-交互前端改造方案.md](docs/需求-交互前端改造方案.md) - Detailed migration plan
- [docs/交互前端目录结构-新架构.md](docs/交互前端目录结构-新架构.md) - Target directory structure
- `openspec/changes/` - Active proposals

**Development Principle:**
- Maintain backward compatibility (wrapper pattern)
- Incremental migration (not big-bang rewrite)
- Module isolation (changes don't affect other modules)

---

## Important Constraints

1. **Zero Impact Rule:** New modules must NOT modify existing module files
2. **API Compatibility:** All submissions must use FormData + JSON.stringify format
3. **Linear Navigation:** Forward-only assessment flow (no back button)
4. **Session Integrity:** Never expose credentials in logs or console
5. **WSL2 Environment:** Use vmThreads for tests, handle path differences
6. **UTF-8 Encoding (MANDATORY):**
   - ALL source files MUST use UTF-8 encoding (without BOM)
   - This includes: `.js`, `.jsx`, `.ts`, `.tsx`, `.css`, `.md`, `.json`, `.html`
   - Chinese characters must be properly encoded (验证中文显示正常)
   - When creating or editing files, explicitly ensure UTF-8 encoding
   - Use `Write` tool default UTF-8 encoding for all file operations
   - **Critical:** Never use ANSI, GB2312, or other legacy encodings

---

## File References

**Core System:**
- [src/modules/ModuleRegistry.js](src/modules/ModuleRegistry.js) - Module registration
- [src/modules/ModuleRouter.jsx](src/modules/ModuleRouter.jsx) - Module loading
- [src/context/AppContext.jsx](src/context/AppContext.jsx) - Global state
- [vite.config.js](vite.config.js) - Build config, mock server, aliases

**Module Examples:**
- [src/modules/grade-7-tracking/](src/modules/grade-7-tracking/) - Modern pattern
- [src/modules/grade-4/](src/modules/grade-4/) - CSS Modules + Context
- [src/modules/grade-7/](src/modules/grade-7/) - Legacy wrapper

**Services:**
- [src/shared/services/apiService.js](src/shared/services/apiService.js) - API client
- [src/shared/services/dataLogger.js](src/shared/services/dataLogger.js) - Submission

**Documentation:**
- [README.md](README.md) - Project overview, features, setup
- [openspec/project.md](openspec/project.md) - Conventions, naming, policies
- [openspec/AGENTS.md](openspec/AGENTS.md) - OpenSpec workflow
