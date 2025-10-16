<!--
Sync Impact Report:
Version: 0.0.0 → 1.0.0
Modified Principles: N/A (Initial Constitution)
Added Sections: All core principles and governance sections
Removed Sections: None
Templates Status:
  ✅ Constitution created from scratch
  ⚠ plan-template.md - May need alignment check
  ⚠ spec-template.md - May need alignment check
  ⚠ tasks-template.md - May need alignment check
Follow-up TODOs: None
-->

# HCI-Evaluation Assessment Platform Constitution

This document defines the core principles and governance rules for the HCI-Evaluation project, a modular React-based educational assessment platform for tracking student learning outcomes.

## Core Principles

### I. Module Isolation (NON-NEGOTIABLE)

**Principle:**
- Each assessment module MUST be completely self-contained within `src/modules/grade-<N>/`
- Modules MUST NOT modify files in other modules or legacy code paths
- All module communication occurs through standardized interfaces (ModuleRegistry, userContext)
- CSS MUST use CSS Modules (`*.module.css`) to prevent style conflicts

**Rationale:**
The platform serves multiple grade levels simultaneously. Module isolation ensures that new assessments can be developed and deployed without risking regressions in existing assessments, enabling parallel development and independent release cycles.

**Validation:**
- File structure review: No cross-module file imports
- ESLint enforcement: No relative imports escaping module boundaries
- CSS scope validation: All styles scoped to module namespace
- Zero-impact testing: Existing modules pass all tests after new module addition

### II. Standardized Module Contract

**Principle:**
All assessment modules MUST implement the Module Definition Interface:
- `moduleId`: Unique string identifier
- `displayName`: Human-readable module name
- `url`: Backend-aligned route path (must start with `/`)
- `version`: Semantic version string
- `ModuleComponent`: React component with signature `({ userContext, initialPageId }) => ReactNode`
- `getInitialPage(pageNum)`: Function mapping backend pageNum to internal page ID
- Optional: `onInitialize()`, `onDestroy()` lifecycle hooks

**Rationale:**
Standardized interfaces enable the ModuleRegistry to dynamically load, route, and manage modules without code changes to the core system. This contract ensures predictable module behavior and simplifies debugging.

**Validation:**
- ModuleRegistry validation on registration (automated check)
- URL uniqueness enforcement (prevents routing conflicts)
- Type signature validation for ModuleComponent props
- getInitialPage defensive programming (handles invalid/missing pageNum)

### III. Data Logging & Submission Protocol (NON-NEGOTIABLE)

**Principle:**
All user interactions and assessment data MUST be logged and submitted according to the unified data contract:

**Operation Logging:**
- Every interaction MUST call `logOperation({ targetElement, eventType, value, time })`
- Page lifecycle MUST record `page_enter` and `page_exit` events
- Timing information MUST be captured in ISO 8601 format

**Data Submission:**
- Submissions MUST use `POST /stu/saveHcMark` endpoint
- Payload MUST be FormData with fields: `batchCode`, `examNo`, `mark`
- `mark` field MUST contain JSON.stringify of MarkObject structure
- MarkObject MUST include: `pageNumber` (string), `pageDesc`, `operationList`, `answerList`, `beginTime`, `endTime`, `imgList`
- Submissions MUST occur on every page transition (unless `skipSubmit: true`)

**Rationale:**
Consistent data logging enables cross-module analytics, student progress tracking, and research data quality. The FormData + JSON format is required for backend compatibility and session management.

**Validation:**
- apiService.js enforces data contract
- dataLogger.js validates MarkObject structure before submission
- Console warnings for missing required fields
- 401 handling triggers re-authentication flow

### IV. Linear Navigation Flow

**Principle:**
- Assessment navigation MUST be unidirectional (forward-only)
- Back buttons MUST be disabled during active assessments
- Navigation prerequisites MUST be validated before page transitions
- Page restoration MUST use `getInitialPage(pageNum)` for progress recovery

**Rationale:**
Linear navigation ensures data integrity, prevents answer manipulation, and maintains assessment validity. Progress restoration enables users to resume after disconnections without losing work.

**Validation:**
- No browser back button handling in module code
- Navigation guards check completion requirements
- localStorage persistence of pageNum for restoration
- getInitialPage handles edge cases (invalid pageNum, completion state)

### V. Timer Management & Session Integrity

**Principle:**
- Global timers MUST use `AppContext.startTaskTimer()` for consistent timing
- Module-specific timers MAY be implemented in module context
- Timer state MUST persist across page refreshes
- Timer expiration MUST trigger auto-submission and navigation to completion
- Session data (batchCode, examNo) MUST NEVER be exposed in logs or console

**Rationale:**
Timed assessments require accurate, tamper-resistant timing mechanisms. Session integrity protects student privacy and prevents unauthorized data access.

**Validation:**
- Timer state stored in module context with localStorage backup
- Countdown warnings displayed at 5-minute threshold
- Auto-submit on timer expiration tested in each module
- Code review for credential exposure (no console.log of sensitive data)

### VI. Error Handling & Resilience

**Principle:**
- API errors MUST be caught by shared services (apiService.js)
- 401 errors MUST trigger automatic logout and redirect to login
- Network failures MUST display retry UI with clear user messaging
- Component errors MUST be wrapped by ErrorBoundary
- Validation errors MUST display inline with affected form fields

**Rationale:**
Graceful error handling maintains assessment continuity and user trust. Clear error messages reduce support burden and enable self-service recovery.

**Validation:**
- ErrorBoundary wraps all ModuleComponents
- apiService.js handles all HTTP error codes
- Offline detection with user-friendly messaging
- Form validation provides immediate feedback

### VII. Code Quality & Testing Standards

**Principle:**
- All code MUST pass ESLint with zero warnings
- React Hooks rules MUST be enforced (no violations)
- Functional components with Hooks MUST be used (no class components)
- Component naming MUST follow PascalCase, functions/variables camelCase
- Complex logic MUST be extracted to custom hooks for reusability
- `npm run lint` MUST pass before commits

**Rationale:**
Consistent code quality reduces bugs, improves maintainability, and accelerates onboarding for new developers.

**Validation:**
- Pre-commit hooks run ESLint
- CI/CD pipeline fails on lint errors
- Code review checklist includes style compliance
- Prettier auto-formatting enforced

## Technology Stack Constraints

### Required Technologies
- **React 18+**: Functional components with Hooks only
- **Vite 4**: Build tool (no Webpack migration)
- **PNPM**: Package manager (not npm or yarn)
- **CSS Modules**: For new module styling (no global CSS)
- **JavaScript/JSX**: Primary language (TypeScript optional for utils)

### Prohibited Technologies
- Class components (use functional components + Hooks)
- Redux/MobX (use React Context API)
- Inline styles (use CSS Modules)
- Global CSS for new modules (legacy modules exempted)
- ES5 syntax (must use ES6+)

**Rationale:**
Technology standardization reduces complexity, improves build performance, and ensures team proficiency across all modules.

## Development Workflow

### Module Development Lifecycle
1. **Specification**: Define module requirements, page flow, data model
2. **Module Registration**: Create module definition in `src/modules/grade-<N>/index.jsx`
3. **Context Setup**: Implement module Context for state management
4. **Page Implementation**: Build pages following linear navigation pattern
5. **Data Integration**: Implement operation logging and data submission
6. **Backend Coordination**: Verify URL mapping and pageNum handling with backend team
7. **Self-Check Validation**: Complete validation checklist (login, navigation, logging, errors, styles)
8. **Registry Update**: Add module to `ModuleRegistry.js` initialize() method
9. **Testing**: Verify mock mode, backend integration, page restoration
10. **Documentation**: Update module-specific README with page descriptions

### Code Review Requirements
- All module code MUST be reviewed by at least one peer
- Reviewers MUST verify constitution compliance
- Review checklist MUST include:
  - Module isolation (no cross-module imports)
  - Data contract adherence (MarkObject structure)
  - Linear navigation implementation
  - Error handling completeness
  - CSS Modules usage
  - Console warnings/errors resolved

### Deployment Approval
- All modules MUST pass local testing in mock mode
- Backend integration MUST be verified in staging environment
- pageNum restoration MUST be tested with multiple scenarios
- Performance metrics MUST show no degradation in module load times
- Accessibility audit MUST pass (minimum: keyboard navigation, ARIA labels)

## Governance

### Amendment Process
1. Proposed amendments MUST be documented in a constitution update PR
2. Amendments MUST include rationale and impact analysis
3. Breaking changes (MAJOR version bump) require team consensus
4. Template updates MUST be synchronized with constitution changes
5. Dependent documentation (CLAUDE.md, 模块化开发规范与扩展指引.md) MUST be updated

### Versioning Policy
- **MAJOR**: Backward-incompatible changes (e.g., removing a principle, changing module contract)
- **MINOR**: New principles, expanded guidance, non-breaking additions
- **PATCH**: Clarifications, typo fixes, example updates

### Compliance Review
- Quarterly review of all modules for constitution adherence
- New modules MUST complete self-check validation before production deployment
- Violations MUST be tracked and remediated within one sprint
- Constitution violations in production MUST be hotfixed within 48 hours

### Runtime Development Guidance
For day-to-day development guidance, refer to:
- **CLAUDE.md**: Comprehensive development patterns and troubleshooting
- **docs/模块化开发规范与扩展指引.md**: Detailed Chinese module development guide
- **src/modules/README.md**: Module system implementation notes

**Version**: 1.0.0 | **Ratified**: 2025-01-14 | **Last Amended**: 2025-01-14
