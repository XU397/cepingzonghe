# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

HCI-Evaluation is a React-based educational assessment platform built with Vite. It delivers modular, grade-specific interactive assessment experiences for students, tracking user interactions and submissions via a backend API.

**Tech Stack:**
- React 18 with functional components and Hooks
- Vite 4 (build tool with HMR)
- React Router for navigation
- CSS Modules (in grade-4 module) / Global CSS (grade-7 module)
- PNPM package manager

## Common Development Commands

```bash
# Development
npm run dev        # Start dev server on port 3000

# Build
npm run build      # Production build

# Linting
npm run lint       # Run ESLint checks

# Preview production build
npm run preview
```

## Architecture Overview

### Module System

The application uses a **modular assessment architecture** where different grade levels are isolated modules:

- **ModuleRegistry** ([src/modules/ModuleRegistry.js](src/modules/ModuleRegistry.js)) - Central registry managing all assessment modules
- **ModuleRouter** ([src/modules/ModuleRouter.jsx](src/modules/ModuleRouter.jsx)) - Top-level router that loads modules dynamically based on backend URL
- **ErrorBoundary** ([src/modules/ErrorBoundary.jsx](src/modules/ErrorBoundary.jsx)) - Module-level error handling

### Current Modules

1. **Grade 7 Module** (`src/modules/grade-7/`) - "Steamed Bun" assessment
   - Legacy module wrapped via [wrapper.jsx](src/modules/grade-7/wrapper.jsx)
   - Uses traditional PageRouter system
   - URL: `/seven-grade`

2. **Grade 4 Module** (`src/modules/grade-4/`) - "Train Ticket Booking" assessment
   - Modern modular implementation with:
     - Own context ([Grade4Context.jsx](src/modules/grade-4/context/Grade4Context.jsx))
     - CSS Modules for styling
     - 11-page assessment flow
     - Advanced interactions (drag-drop, interactive maps, custom keyboard)
   - URL: `/four-grade`

### Authentication & Session Flow

1. User logs in via [LoginPage.jsx](src/pages/LoginPage.jsx)
2. Backend returns:
   - `url`: Module identifier (e.g., `/four-grade`)
   - `pageNum`: Page number for resume capability
   - `batchCode`, `examNo`: Session identifiers
3. App stores credentials in `AppContext` with localStorage persistence
4. `ModuleRouter` loads appropriate module and restores progress

### Global State Management

**AppContext** ([src/context/AppContext.jsx](src/context/AppContext.jsx)) provides:
- Authentication state (`isAuthenticated`, `currentUser`)
- Session data (`batchCode`, `examNo`, `moduleUrl`)
- Operation logging (`logOperation`, `collectAnswer`)
- Navigation helpers
- Timer management

### Data Submission Contract

All modules must submit data to `POST /stu/saveHcMark` as FormData:

```javascript
{
  batchCode: string,
  examNo: string,
  mark: JSON.stringify({
    pageNumber: string,
    pageDesc: string,
    operationList: Array<Operation>,
    answerList: Array<Answer>,
    beginTime: "YYYY-MM-DD HH:mm:ss",
    endTime: "YYYY-MM-DD HH:mm:ss",
    imgList: Array<ImageInfo>
  })
}
```

**Shared Services:**
- [apiService.js](src/shared/services/apiService.js) - API calls, handles 401 auth expiry
- [dataLogger.js](src/shared/services/dataLogger.js) - Data submission wrapper

### API Configuration

[apiConfig.js](src/config/apiConfig.js) manages:
- Development mock mode (`VITE_USE_MOCK=1`)
- Production API proxy (`VITE_API_TARGET`)
- Credentials handling (same-origin cookies)

Mock server in [vite.config.js](vite.config.js) intercepts `/stu/login` and `/stu/saveHcMark` in dev mode.

## Adding a New Assessment Module

Follow this step-by-step guide to integrate a new assessment module into the system.

### Step 1: Create Module Directory Structure

```
src/modules/grade-<N>/
├── index.jsx              # Module definition & registration
├── context/               # Module-specific state management (Context + Reducer)
├── pages/                 # Assessment pages (step-by-step components)
├── components/            # Reusable UI components
│   ├── containers/        # Smart components with logic
│   └── ui/                # Presentational components
├── styles/                # CSS Modules (*.module.css)
├── hooks/                 # Custom hooks (e.g., useCountdownTimer.js)
├── utils/                 # Helper functions (calculations, formatters)
├── assets/                # Module-specific images, icons
└── moduleConfig.js        # Module metadata (id, url, version, timing configs)
```

### Step 2: Define Module Contract

In `index.jsx`, export a module definition object that implements the required interface:

```javascript
// src/modules/grade-N/index.jsx
export const GradeNModule = {
  // Required fields
  moduleId: 'grade-N',           // Unique identifier (must be globally unique)
  displayName: 'Grade N Assessment Name',
  url: '/grade-n-url',           // Must match backend login response exactly
  version: '1.0.0',              // Semantic version for troubleshooting

  // Main module component
  ModuleComponent: YourModuleComponent,

  // Page restoration function
  getInitialPage: (pageNum) => {
    // Convert backend pageNum to internal page ID
    // Must handle:
    // - Missing/null pageNum → return default first page
    // - Invalid pageNum → return default first page
    // - Completed assessment → return completion page or first page

    if (!pageNum || pageNum < 1) {
      return 'default-first-page';
    }

    // Map pageNum to page identifier
    const pageMap = {
      1: 'notices',
      2: 'intro',
      3: 'question-1',
      // ... rest of mapping
    };

    return pageMap[pageNum] || 'default-first-page';
  },

  // Optional lifecycle hooks
  onInitialize: () => {
    console.log('[Module] Initializing grade-N module...');
    // Setup code (preload assets, initialize trackers, etc.)
  },

  onDestroy: () => {
    console.log('[Module] Cleaning up grade-N module...');
    // Cleanup code (clear timers, remove listeners, etc.)
  }
};
```

**Key Requirements:**
- `url` must start with `/` and match backend exactly (case-sensitive)
- `ModuleComponent` signature: `({ userContext, initialPageId }) => ReactNode`
- `getInitialPage` must be defensive - handle all edge cases
- Module IDs must be unique across the entire application

### Step 3: Register Module in Registry

Add your module to [ModuleRegistry.js](src/modules/ModuleRegistry.js) in the `initialize()` method:

```javascript
async initialize() {
  if (this.initialized) {
    console.log('[ModuleRegistry] Already initialized, skipping...');
    return;
  }

  console.log('[ModuleRegistry] 🚀 Initializing module system...');

  try {
    // Existing modules
    const { Grade7Module } = await import('./grade-7/index.jsx');
    this.registerModule(Grade7Module);

    const { Grade4Module_Definition } = await import('./grade-4/index.jsx');
    this.registerModule(Grade4Module_Definition);

    // Add your new module here
    const { GradeNModule } = await import('./grade-N/index.jsx');
    this.registerModule(GradeNModule);

    this.initialized = true;
    console.log('[ModuleRegistry] ✅ Module system initialized');
    console.log('[ModuleRegistry] 📋 Registered modules:', this.getAllUrlMappings());
  } catch (error) {
    console.error('[ModuleRegistry] ❌ Initialization failed:', error);
    throw error;
  }
}
```

**Note:** The `registerModule` method automatically:
- Validates module structure
- Warns about duplicate IDs or URLs
- Maps the URL to the module for routing

### Step 4: Implement Module Component

Your `ModuleComponent` receives these props:

```javascript
const YourModuleComponent = ({ userContext, initialPageId }) => {
  // userContext contains:
  // - user: { studentName, examNo, batchCode, ... }
  // - session: { pageNum, moduleUrl, isAuthenticated, ... }
  // - helpers: { logOperation, collectAnswer, navigateToPage, ... }

  // initialPageId: string returned from getInitialPage(pageNum)

  return (
    <YourModuleProvider initialPage={initialPageId}>
      <YourModuleRouter />
    </YourModuleProvider>
  );
};
```

**Module Component Must Implement:**

1. **Linear Navigation**
   - Forward-only page flow (no back button)
   - Validate prerequisites before allowing navigation
   - Use `skipSubmit` option carefully to avoid data loss

2. **Operation Logging**
   - Log all user interactions (clicks, inputs, selections)
   - Use descriptive `targetElement` and `eventType`
   - Track timing information automatically

3. **Page Lifecycle Tracking**
   - Record `page_enter` on mount
   - Record `page_exit` before unmount/navigation
   - Track page duration accurately

4. **Data Submission**
   - Submit on every page transition (unless `skipSubmit: true`)
   - Bundle operations and answers into MarkObject format
   - Handle submission failures gracefully with retry

5. **Timer Integration** (if required)
   - Use `AppContext.startTaskTimer()` for main timer
   - Or implement module-specific timer
   - Handle timer expiration

### Step 5: Backend Coordination

**Before deploying, coordinate with backend team:**

1. **Login Response Update**
   ```json
   {
     "code": 200,
     "msg": "success",
     "obj": {
       "batchCode": "250619",
       "examNo": "1001",
       "url": "/grade-n-url",  // Must match your module's url field
       "pageNum": "1",
       "studentName": "Student Name",
       "schoolName": "School Name"
     }
   }
   ```

2. **Verify URL Mapping**
   - Backend `url` must exactly match module definition
   - Test in development environment first
   - Use mock mode (`VITE_USE_MOCK=1`) for local testing

3. **PageNum Range**
   - Define valid pageNum range for your module
   - Backend should track progress and return correct pageNum
   - Module's `getInitialPage` must handle all returned values

### Step 6: Self-Check Validation

Before marking your module complete, verify:

- [ ] **Login & Loading**
  - [ ] Login successful redirects to module
  - [ ] Module loads without console errors
  - [ ] Initial page displays correctly

- [ ] **Page Restoration**
  - [ ] Refresh page maintains current progress
  - [ ] `getInitialPage` handles invalid pageNum
  - [ ] Completed assessment shows appropriate page

- [ ] **Navigation**
  - [ ] Pages flow forward correctly
  - [ ] No back button functionality
  - [ ] Navigation prerequisites enforced
  - [ ] Cannot skip required pages

- [ ] **Data Logging**
  - [ ] Every interaction logged to operations
  - [ ] `page_enter` and `page_exit` recorded
  - [ ] Answers collected correctly
  - [ ] Data submits on page transitions

- [ ] **Error Handling**
  - [ ] 401 errors redirect to login
  - [ ] Network failures show retry options
  - [ ] Validation errors display clearly
  - [ ] Component errors caught by ErrorBoundary

- [ ] **Style Isolation**
  - [ ] CSS Modules used (no global styles)
  - [ ] No style conflicts with other modules
  - [ ] Responsive design works at 1920x1080+
  - [ ] Visual consistency with existing modules

### Step 7: Data Logging Implementation Pattern

Implement comprehensive logging throughout your module:

```javascript
// 1. Page Entry/Exit Tracking
const PageComponent = () => {
  const { logOperation } = useAppContext();
  const pageId = 'question-1';

  useEffect(() => {
    // Record page entry
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: pageId,
      time: new Date().toISOString()
    });

    // Record page exit on unmount
    return () => {
      logOperation({
        targetElement: '页面',
        eventType: 'page_exit',
        value: pageId,
        time: new Date().toISOString()
      });
    };
  }, [pageId, logOperation]);

  return <div>{/* page content */}</div>;
};

// 2. User Interaction Logging
const handleClick = (buttonId, value) => {
  logOperation({
    targetElement: buttonId,
    eventType: '点击',
    value: value,
    time: new Date().toISOString()
  });
};

const handleInputChange = (fieldId, value) => {
  logOperation({
    targetElement: fieldId,
    eventType: '文本域输入',
    value: value,
    time: new Date().toISOString()
  });
};

const handleSelectChange = (selectId, selectedValue) => {
  logOperation({
    targetElement: selectId,
    eventType: '下拉框选择',
    value: selectedValue,
    time: new Date().toISOString()
  });
};

// 3. Answer Collection & Navigation
const handleNextPage = async () => {
  try {
    // Collect answers for current page
    collectAnswer({
      targetElement: 'question-1-answer',
      value: userAnswer
    });

    // Build mark object
    const markObject = {
      pageNumber: String(currentPageNum),
      pageDesc: '问题1',
      operationList: [...currentOperations],  // from module context
      answerList: [...currentAnswers],        // from module context
      beginTime: pageStartTime,               // 'YYYY-MM-DD HH:mm:ss'
      endTime: formatDateTime(new Date()),
      imgList: []
    };

    // Submit to backend
    await submitPageMarkData({
      batchCode,
      examNo,
      mark: JSON.stringify(markObject)
    });

    // Clear operations for next page
    clearOperations();

    // Navigate to next page
    navigateToPage(nextPageId);

  } catch (error) {
    console.error('Navigation failed:', error);
    // Handle error (show message, retry, etc.)
  }
};

// 4. Helper: Format DateTime
const formatDateTime = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  const second = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
};
```

**Best Practices:**
- Always use `targetElement` that clearly identifies the UI element
- Use consistent `eventType` values (Chinese convention: '点击', '输入', '选择')
- Include timestamp for all operations
- Submit data before navigation (not after)
- Handle submission failures with user-friendly messages

## Key Development Patterns

### Component Structure
- Use **functional components** with Hooks
- Prefer **single responsibility** - split complex logic into custom hooks
- Use **CSS Modules** for new modules to avoid style conflicts
- Follow **PascalCase** for components, **camelCase** for functions/variables

### State Management
- Module-level state: Create own Context (see [Grade4Context.jsx](src/modules/grade-4/context/Grade4Context.jsx))
- Global concerns: Use `AppContext`
- Complex local state: Extract to custom hooks

### Styling
- New modules: Use CSS Modules (`*.module.css`)
- Maintain visual consistency with existing modules
- Avoid hardcoded colors - use CSS variables or theme system
- Design for 1920x1080 minimum resolution (no scrolling within pages)

### Navigation
- **Unidirectional flow** (no back button during assessment)
- Track page transitions in operations log
- Handle resume via `initialPageId`
- Validate navigation prerequisites (e.g., required fields completed)
- Use `skipSubmit: true` only when navigating without data submission (e.g., intro pages)

### Timer Management

**Global Timer (via AppContext):**
```javascript
const { startTaskTimer, taskTimeRemaining, stopTaskTimer } = useAppContext();

// Start timer when assessment begins
useEffect(() => {
  startTaskTimer(45 * 60); // 45 minutes in seconds
}, []);

// Display remaining time
<div>剩余时间: {formatTime(taskTimeRemaining)}</div>

// Handle timer expiration
useEffect(() => {
  if (taskTimeRemaining === 0) {
    // Auto-submit and navigate to completion
    handleTimeExpired();
  }
}, [taskTimeRemaining]);
```

**Module-Specific Timer:**
```javascript
// See Grade4Context for implementation example
// Allows countdown timers for specific pages/interactions
const { countdownActive, startCountdown } = useGrade4Context();

// Example: 40-second notice page countdown
startCountdown(40, () => {
  // Callback when countdown completes
  navigateToNextPage();
});
```

**Timer Best Practices:**
- Always stop timers on component unmount
- Persist timer state in module context
- Handle page refresh gracefully (restore timer)
- Warn users before time expires (e.g., 5 minutes remaining)

### Error Handling
- API errors: Caught by shared services, 401 triggers re-login
- Component errors: Wrapped by ErrorBoundary
- Log errors to operations for debugging
- Network failures: Show retry UI with clear messaging
- Validation errors: Display inline with form fields

## Code Quality Standards

### Linting
- Follow [.eslintrc.json](.eslintrc.json) rules
- React Hooks rules enforced
- No unused variables
- Run `npm run lint` before committing

### Code Organization
```
components/
├── containers/    # Smart components with state/logic
└── ui/            # Pure presentational components

hooks/             # Reusable stateful logic
utils/             # Pure functions, calculations
services/          # API calls, external integrations
```

### File Naming
- Components: `PascalCase.jsx`
- Hooks: `useCamelCase.js`
- Utils: `camelCase.js`
- Styles: `ComponentName.module.css`

## Important Constraints

1. **Zero Impact Rule**: New modules must NOT modify existing grade-7 module files
2. **API Compatibility**: All submissions must match FormData + JSON.stringify format
3. **Session Integrity**: Never expose or log sensitive credentials
4. **Linear Navigation**: Assessments flow forward-only (no back button)
5. **Offline Resistance**: Handle network failures gracefully with retry logic
6. **Browser Support**: Target modern browsers (ES6+, no IE11)

## Testing & Debugging

### Development Environment Setup

**Enable Mock Mode:**
```bash
# In .env or .env.local
VITE_USE_MOCK=1              # Use mock API (default)
VITE_API_TARGET=http://...   # Production API endpoint (when mock disabled)
```

**Mock Mode Features:**
- Intercepts `/stu/login` and `/stu/saveHcMark`
- Returns predefined responses (see [vite.config.js:18-45](vite.config.js))
- Allows local development without backend
- Default login: any credentials work, returns grade-4 module

**Disable Mock for Backend Testing:**
```bash
VITE_USE_MOCK=0
# Requests proxy to VITE_API_TARGET via /api and /stu paths
```

### Debugging Tools & Techniques

**1. Module System Debugging:**
```javascript
// ModuleRouter shows debug overlay in development
// Displays:
// - Current module ID and display name
// - Initial page ID
// - User context summary
// - Performance metrics
```

**2. Console Logging:**
- `[ModuleRegistry]` - Module registration and lookup
- `[ModuleRouter]` - Module loading and lifecycle
- `[Grade4Context]` (or your context) - State changes
- `[API]` - Request/response logging from apiService

**3. React DevTools:**
- Install React Developer Tools browser extension
- Inspect component props and state
- Track context values (AppContext, Grade4Context)
- Profile component renders for performance

**4. Network Tab:**
- Monitor API calls to `/stu/saveHcMark`
- Verify FormData structure
- Check response codes (200, 401, etc.)
- Inspect request/response headers

**5. LocalStorage Inspection:**
```javascript
// In browser console:
localStorage.getItem('hci-moduleUrl')    // Current module
localStorage.getItem('hci-pageNum')      // Current page
localStorage.getItem('hci-batchCode')    // Batch code
localStorage.getItem('hci-examNo')       // Exam number
localStorage.getItem('hci-isAuthenticated') // Auth status
```

**6. Performance Monitoring:**
- Check console for performance timers
- Module initialization time
- User context construction time
- Page load times

### Common Issues

**Module not loading:**
- Check `url` matches backend response exactly
- Verify module registered in `ModuleRegistry.initialize()`
- Check console for initialization errors

**Page not restoring:**
- Verify `getInitialPage(pageNum)` handles all valid pageNum values
- Check localStorage for persisted session data
- Ensure `initialPageId` passed to module component

**Data submission fails:**
- Verify FormData structure (not JSON body)
- Check `mark` field is stringified JSON
- Confirm `batchCode` and `examNo` present

**401 Unauthorized:**
- Session expired - app should auto-redirect to login
- Check `apiService.js` handles 401 correctly
- Verify cookie/session persistence

## File References

**Core Architecture:**
- [src/App.jsx](src/App.jsx) - Main app entry, renders ModuleRouter when authenticated
- [src/modules/ModuleRouter.jsx](src/modules/ModuleRouter.jsx) - Module loading and routing
- [src/modules/ModuleRegistry.js](src/modules/ModuleRegistry.js) - Module registration
- [src/context/AppContext.jsx](src/context/AppContext.jsx) - Global state
- [vite.config.js](vite.config.js) - Build config and dev mock server

**Services:**
- [src/shared/services/apiService.js](src/shared/services/apiService.js) - API client
- [src/shared/services/dataLogger.js](src/shared/services/dataLogger.js) - Data submission
- [src/config/apiConfig.js](src/config/apiConfig.js) - API configuration

**Module Examples:**
- [src/modules/grade-4/index.jsx](src/modules/grade-4/index.jsx) - Modern module example
- [src/modules/grade-7/index.jsx](src/modules/grade-7/index.jsx) - Legacy wrapper example

**Documentation:**
- [docs/模块化开发规范与扩展指引.md](docs/模块化开发规范与扩展指引.md) - Detailed module development guide (Chinese)
- [src/modules/README.md](src/modules/README.md) - Module system implementation notes

## Module Implementation Examples

### Grade 4 Module (Modern Pattern)

The Grade 4 module demonstrates best practices for new modules:

**Key Features:**
- Complete module isolation with own Context ([Grade4Context.jsx](src/modules/grade-4/context/Grade4Context.jsx))
- CSS Modules for all styling (no global CSS pollution)
- 11-page linear assessment flow
- Advanced interactions:
  - Drag-and-drop timeline planning
  - Interactive map with route selection
  - Custom on-screen keyboard
  - Countdown timers per page
- Comprehensive operation logging
- Page restoration support

**Study These Files:**
- [src/modules/grade-4/index.jsx](src/modules/grade-4/index.jsx) - Module definition
- [src/modules/grade-4/context/Grade4Context.jsx](src/modules/grade-4/context/Grade4Context.jsx) - State management pattern
- [src/modules/grade-4/pages/00-NoticesPage.jsx](src/modules/grade-4/pages/00-NoticesPage.jsx) - Simple page with timer
- [src/modules/grade-4/pages/06-TimelinePlanningPage.jsx](src/modules/grade-4/pages/06-TimelinePlanningPage.jsx) - Complex interaction
- [src/modules/grade-4/hooks/useCountdownTimer.js](src/modules/grade-4/hooks/useCountdownTimer.js) - Custom hook example

### Grade 7 Module (Legacy Wrapper Pattern)

The Grade 7 module shows how to wrap existing code:

**Key Features:**
- Minimal wrapper around existing PageRouter
- Preserves all existing files unchanged
- Simple adapter pattern ([wrapper.jsx](src/modules/grade-7/wrapper.jsx))
- Uses traditional page numbering

**Study These Files:**
- [src/modules/grade-7/index.jsx](src/modules/grade-7/index.jsx) - Wrapper module definition
- [src/modules/grade-7/wrapper.jsx](src/modules/grade-7/wrapper.jsx) - Thin adapter layer
- [src/utils/pageMappings.js](src/utils/pageMappings.js) - Page number mapping

### Choosing a Pattern

**Use Modern Pattern (Grade 4 style) when:**
- Building a completely new assessment
- Want strong isolation from other modules
- Need advanced custom interactions
- Prefer CSS Modules for styling
- Can define clear page flow from scratch

**Use Wrapper Pattern (Grade 7 style) when:**
- Integrating existing assessment code
- Cannot refactor existing pages
- Need quick module system integration
- Existing code is stable and tested

## Quick Reference: Key Concepts

### Module Lifecycle
```
Login → Backend returns URL → ModuleRegistry looks up module
  → getInitialPage(pageNum) → ModuleComponent renders
  → User completes assessment → Module cleanup (onDestroy)
```

### Data Flow
```
User interaction → logOperation() → Module Context
  → collectAnswer() → Build MarkObject
  → submitPageMarkData() → Backend (/stu/saveHcMark)
  → Navigate to next page
```

### Page Restoration
```
Page refresh → LocalStorage has session data
  → ModuleRouter reconstructs userContext
  → getInitialPage(saved pageNum) → Resume at correct page
```

### Module Registration Flow
```
App starts → ModuleRouter.initialize()
  → ModuleRegistry.initialize()
  → Dynamic import modules → registerModule()
  → Build URL mapping → Ready for routing
```

## Additional Notes

- Project uses PNPM workspaces (ensure `pnpm install`, not `npm install`)
- Port 3000 reserved for dev server (configurable in vite.config.js)
- Production build optimizes chunks per module (see vite.config.js `manualChunks`)
- Assets in `public/` directory served at root path
- Environment variables prefixed with `VITE_` exposed to client code
- Git repository includes .specify/ folder with SpecKit configuration (ignore for development)

## Getting Help

**Documentation:**
- [docs/模块化开发规范与扩展指引.md](docs/模块化开发规范与扩展指引.md) - Comprehensive Chinese guide
- [src/modules/README.md](src/modules/README.md) - Module system notes
- [docs/architecture.md](docs/architecture.md) - Architecture documentation

**Code References:**
- All module interfaces defined in [src/modules/ModuleRegistry.js](src/modules/ModuleRegistry.js)
- API contracts in [src/shared/services/apiService.js](src/shared/services/apiService.js)
- Data formats in [src/shared/services/dataLogger.js](src/shared/services/dataLogger.js)

**Troubleshooting:**
- Check console for `[ModuleRegistry]`, `[ModuleRouter]`, `[API]` logs
- Use React DevTools to inspect context values
- Verify localStorage contains session data
- Test with mock mode first (`VITE_USE_MOCK=1`)
- Review existing modules for implementation patterns
