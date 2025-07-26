# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development**: `npm run dev` - Starts Vite dev server on port 3000
- **Build**: `npm run build` - Creates production build
- **Lint**: `npm run lint` - Runs ESLint on JS/JSX files
- **Preview**: `npm run preview` - Previews production build

## Architecture Overview

This is a React-based educational assessment application transitioning from a single-module "steamed bun" science inquiry task to a multi-module system supporting multiple educational assessments. The application manages multi-page interactive learning experiences with data logging, user authentication, and questionnaire components.

### Multi-Module Architecture Strategy

**Hybrid Architecture**:
- **Existing 7th Grade Module** - Preserved as-is using wrapper pattern to maintain 379 relative path dependencies
- **New Module System** - Clean modular structure for 4th grade and future assessments
- **Shared Component Layer** - Gradual extraction of reusable components to `src/shared/`
- **Module Registry** - URL-based routing system (`/seven-grade`, `/four-grade`)

**Directory Structure**:
```
src/
├── shared/                    # Shared components (gradual migration)
│   ├── components/           # Reusable UI components
│   ├── services/            # Shared API services
│   ├── hooks/               # Shared hooks
│   └── utils/               # Shared utilities
├── modules/                  # Module system
│   ├── ModuleRegistry.js     # Module registration center
│   ├── ModuleRouter.jsx      # Module routing component
│   ├── grade-7/              # 7th grade wrapper (existing code)
│   └── grade-4/              # 4th grade independent module
└── (existing structure)      # All current files preserved unchanged
```

### Core Architecture Patterns

**State Management**: 
- Central state managed via `AppContext.jsx` with React Context API
- Persistent state using localStorage for session recovery
- Module-specific contexts for independent state management
- Shared authentication context across all modules

**Page Navigation**:
- **7th Grade**: Existing custom routing via `PageRouter.jsx` (preserved unchanged)
- **New Modules**: Independent routing systems within module boundaries
- URL-based module determination (`/seven-grade` routes to steamed-bun module)
- Protected routes require authentication across all modules
- Server-driven routing via login response `url` field

**Data Flow**:
- User interactions logged via `logOperation()` function
- Page data submitted via `submitPageData()` before navigation
- Backend API communication through `apiService.js`
- Real-time data logging to `/stu/saveHcMark` endpoint
- Module-specific data schemas with shared logging infrastructure

### Key Components Structure

**Global State** (`src/context/AppContext.jsx`):
- Authentication state and user session management
- Task timer (40 minutes) and questionnaire timer (10 minutes)
- Page transition logic with automatic data submission
- Operation logging and answer collection systems

**API Layer** (`src/services/apiService.js`):
- Login endpoint: GET `/stu/login` with encrypted credentials
- Data submission: POST `/stu/saveHcMark` using FormData
- Environment-aware API configuration via `apiConfig.js`

**Page System**:
- Pages follow naming convention: `Page_XX_Description`
- Each page logs entry/exit events automatically
- Material reading pages (P4-P9) with modal components
- Simulation environment (P14-P17) with interactive components
- Questionnaire pages (P20-P28) with separate timing system

### Backend Integration

**Authentication**:
- Uses jsencrypt.ts for RSA password encryption
- Session-based authentication with localStorage persistence
- Automatic session recovery on page refresh
- Session timeout handling with re-login prompts

**Data Submission**:
- FormData format required for `/saveHcMark` endpoint
- Automatic page data submission before navigation
- Operation logging with timestamps and event types
- Answer collection for form inputs and selections

### Configuration

**Environment Setup**:
- Development: Uses Vite proxy to `/stu` endpoint
- Production: Configurable API modes (direct/proxy/sameOrigin)
- CORS handling via `vite.config.js` proxy configuration
- API configuration in `src/config/apiConfig.js`

### Development Notes

**Timer System**:
- Main task timer: 40 minutes total duration
- Questionnaire timer: 10 minutes separate timing
- Automatic timeout handling with forced page transitions
- Timer persistence across browser sessions

**Data Logging**:
- All user interactions logged with operation codes
- Duplicate operation prevention logic
- Page enter/exit events automatically recorded
- Real-time submission to backend for data persistence

**Page Flow Logic**:
- Linear progression through numbered pages
- Conditional navigation based on completion status
- Task completion triggers questionnaire phase
- Final submission handling in P28

## Multi-Module Implementation Guidelines

### Module Development Standards

**Module Interface Contract**:
```javascript
export const ModuleDefinition = {
  moduleId: string,              // Unique identifier (e.g., 'grade-4')
  displayName: string,           // Human-readable name
  url: string,                   // URL path (e.g., '/four-grade')
  version: string,               // Module version
  
  ModuleComponent: React.Component,  // Main module component
  getInitialPage: (pageNum) => string,  // Page resume logic
  moduleConfig: {
    timers: { mainTask: number, questionnaire?: number },
    pages: { [pageId]: { number, desc, component } }
  }
}
```

**7th Grade Module (Wrapper Pattern)**:
- All existing code preserved unchanged (379 path dependencies maintained)
- Wrapped in `src/modules/grade-7/wrapper.js` using existing `PageRouter`
- No file moves, imports, or structural changes to existing codebase
- URL routing: `/seven-grade` maps to existing steamed-bun assessment

**New Module Structure (4th Grade+)**:
- Independent module directories: `src/modules/grade-4/`
- Clean directory structure with `components/`, `context/`, `utils/`, `assets/`
- Can use shared components from `src/shared/` layer
- Module-specific configurations and page mappings

### Safe Implementation Strategy

**Phase-Based Approach**:
1. **Phase 1**: Add module infrastructure (no existing file changes)
2. **Phase 2**: Enhance authentication for URL routing (minimal changes)
3. **Phase 3**: Implement module router and loading system
4. **Phase 4**: Comprehensive testing and validation
5. **Phase 5**: Production deployment with feature flags

**Risk Mitigation**:
- Feature flags allow instant disable of module system
- Fallback mechanisms to existing `PageRouter` if module fails
- Zero breaking changes to current functionality
- Easy rollback capability at any implementation phase

### Shared Component Migration

**Gradual Extraction Strategy**:
- Extract common components to `src/shared/components/` over time
- Components like Timer, Button, Modal can be shared across modules
- New modules use shared components; existing 7th grade can optionally adopt
- No requirement to modify existing 7th grade imports

**Shared Services**:
- Authentication service in `src/shared/services/authService.js`
- Data logging service for consistent logging across modules
- API service layer for common backend communication patterns

### Module Registry System

**URL-Based Routing**:
```javascript
// ModuleRegistry.js maps URLs to modules
const urlToModuleMap = {
  '/seven-grade': 'steamed-bun',    // Existing 7th grade
  '/four-grade': 'grade-4',         // New 4th grade
  // Future modules...
}
```

**Authentication Integration**:
- Server login response includes `url` field (e.g., `"/seven-grade"`)
- `ModuleRouter` uses URL to determine which module to load
- Existing authentication flow preserved, enhanced for module routing

### Development Workflow

**7th Grade Maintenance**:
- Continue developing in existing file structure
- All current development practices remain unchanged
- No need to understand or interact with module system

**New Module Development**:
- Create in clean `src/modules/grade-X/` structure
- Use shared components and services where beneficial
- Independent development without affecting existing code
- Module-specific testing and configuration

### Production Deployment

**Feature Flag Control**:
- Environment variable to enable/disable module system
- Production can run with or without module routing
- Existing users continue assessments without interruption
- New users can be routed to appropriate modules

**Backward Compatibility**:
- All existing API endpoints maintain same interface
- Build process and deployment procedures unchanged
- Environment configurations preserved

## Data Transmission Specification

### Backend API Communication Standard

All modules must follow the established data transmission pattern for consistency and backend compatibility.

**Primary Endpoint**: `POST /stu/saveHcMark`

**Data Format**: FormData (NOT JSON)
```javascript
const formData = new FormData();
formData.append('batchCode', userContext.batchCode);  // String: From login response
formData.append('examNo', userContext.examNo);        // String: Student identifier
formData.append('mark', JSON.stringify(markObject)); // JSON string: Page data
```

### Mark Object Structure (Critical Specification)

Every page submission must include this exact structure:

```javascript
const markObject = {
  pageNumber: "15",                    // String: Page sequence number for backend
  pageDesc: "第九题",                  // String: Human-readable page description
  operationList: [                     // Array: Complete user interaction log
    {
      code: 1,                         // Number: Sequential operation counter
      targetElement: "页面",           // String: UI element description
      eventType: "page_enter",         // String: Interaction type
      value: "进入页面Page_15",         // String: Event details/context
      time: "2024-07-24 15:30:45"     // String: Timestamp (YYYY-MM-DD HH:mm:ss)
    },
    {
      code: 2,
      targetElement: "P15_Q1_选项组",
      eventType: "radio_select",
      value: "35°C",
      time: "2024-07-24 15:31:22"
    }
  ],
  answerList: [                        // Array: Final answers for data analysis
    {
      code: 1,                         // Number: Sequential answer counter
      targetElement: "发酵3小时后体积最大的温度", // String: Question identifier
      value: "35°C"                    // String/Any: Student's answer
    }
  ],
  beginTime: "2024-07-24 15:30:45",   // String: Page entry timestamp
  endTime: "2024-07-24 15:32:10",     // String: Page exit timestamp
  imgList: []                          // Array: Image attachments (usually empty)
}
```

### Data Collection Functions (Required Implementation)

**Operation Logging** - Track all user interactions:
```javascript
logOperation({
  targetElement: string,    // UI element or component name
  eventType: string,        // Interaction type (click, input, page_enter, etc.)
  value?: string,          // Optional: Interaction value or context
  elementId?: string       // Optional: DOM element ID
});

// Common event types:
// - "page_enter", "page_exit" (automatic)
// - "click", "input", "change" (user interactions)
// - "radio_select", "checkbox_select" (form inputs)
// - "modal_open", "modal_close" (UI state changes)
// - Custom module-specific event types
```

**Answer Collection** - Record final answers:
```javascript
collectAnswer({
  targetElement: string,    // Question or input identifier
  value: any,              // Student's answer (string, number, array, etc.)
  code?: number           // Optional: Sequential counter (auto-generated)
});
```

### Data Submission Timing Requirements

**Mandatory Submission Points**:
1. **Page Navigation** - Before switching to any new page
2. **Module Completion** - When student finishes assessment
3. **Session Timeout** - Automatic submission on timer expiration
4. **Critical Interactions** - Major task completions or submissions

**Implementation Pattern**:
```javascript
// 1. Page Entry (automatic)
setPageEnterTime(new Date());
logOperation({
  targetElement: '页面',
  eventType: 'page_enter',
  value: `进入页面${pageId}`
});

// 2. User Interactions (as they occur)
onUserAction = (action) => {
  logOperation({
    targetElement: action.element,
    eventType: action.type,
    value: action.value
  });
  
  // If this is an answer, also collect it
  if (action.isAnswer) {
    collectAnswer({
      targetElement: action.questionId,
      value: action.value
    });
  }
};

// 3. Page Exit (before navigation)
const submitCurrentPageData = async () => {
  const markData = {
    pageNumber: getCurrentPageNumber(),
    pageDesc: getCurrentPageDescription(),
    operationList: getCollectedOperations(),
    answerList: getCollectedAnswers(),
    beginTime: formatTimestamp(pageEnterTime),
    endTime: formatTimestamp(new Date()),
    imgList: []
  };
  
  await submitPageMarkData({
    batchCode: userContext.batchCode,
    examNo: userContext.examNo,
    mark: markData
  });
};
```

### Error Handling Requirements

**Session Management**:
- Handle 401 responses (session expiration)
- Automatic re-authentication with data preservation
- Graceful degradation for network failures

**Data Validation**:
- Ensure all required fields are present before submission
- Validate timestamp formats (YYYY-MM-DD HH:mm:ss)
- Handle missing or malformed data gracefully

**Network Error Recovery**:
```javascript
try {
  await submitPageMarkData(payload);
} catch (error) {
  if (error.status === 401) {
    // Session expired - redirect to re-authentication
    handleSessionExpiration();
  } else {
    // Other errors - retry with exponential backoff
    scheduleRetrySubmission(payload);
  }
}
```

### Module-Specific Adaptations

**7th Grade (Existing)**:
- Uses current implementation unchanged
- All existing operation types and answer formats preserved

**New Modules**:
- Must implement same data structure
- Can define module-specific `eventType` values
- Should adapt `targetElement` naming to match module content
- Timer configurations may vary (e.g., 35 minutes for 4th grade vs 40 for 7th)

**Shared Implementation**:
- Common logging functions should be moved to `src/shared/services/dataLogger.js`
- Timestamp formatting utilities in `src/shared/utils/timeUtils.js`
- API service functions in `src/shared/services/apiService.js`

### Critical Compliance Notes

1. **FormData Format** - Backend expects FormData, not JSON requests
2. **String Types** - `pageNumber`, timestamps, and most fields must be strings
3. **Sequential Codes** - Operation and answer codes must increment sequentially
4. **Timestamp Format** - Must use "YYYY-MM-DD HH:mm:ss" format consistently
5. **Required Fields** - `batchCode`, `examNo`, and complete `mark` object are mandatory
6. **Operation Logging** - Every user interaction should be logged for research purposes
7. **Answer Separation** - Distinguish between interactions (operationList) and final answers (answerList)