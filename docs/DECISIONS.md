# Architecture Decision Records (ADR)

**Project**: HCI Evaluation Platform  
**Last Updated**: 2026-02-07  
**Status**: Active Decisions

---

## ADR-001: Dual Routing System (Legacy + Flow)

**Status**: ✅ Accepted  
**Date**: 2025-07-25  
**Decision Makers**: Frontend Architecture Team

### Context

The platform needed to support two fundamentally different assessment paradigms:

1. **Legacy Modules** (Grade 7 Traditional, Grade 4): Monolithic, tightly-coupled assessment experiences with hardcoded page sequences
2. **Modern Flows**: Composable, step-based assessments built from reusable submodules that can be rearranged without code changes

**Constraints**:

- Grade 7 Traditional module was already in production with users
- Complete rewrite would be high-risk and take 3-4 months
- New Grade 4 module needed modern architecture
- Both needed to coexist during transition period

### Decision

Implement a **dual routing system** in `AppShell.jsx`:

- `/flow/:flowId` → Modern Flow Orchestration (bypass StrictMode)
- `/:moduleId` → Legacy Module Routing (with StrictMode)

### Consequences

**Positive**:

- ✅ Gradual migration possible without breaking existing users
- ✅ New modules use modern architecture immediately
- ✅ Existing modules continue working without changes
- ✅ Shared submission pipeline works for both

**Negative**:

- ❌ Increased routing complexity (two mental models)
- ❌ Potential for subtle behavioral differences (StrictMode)
- ❌ More complex testing matrix
- ❌ Documentation must cover both approaches

### Alternatives Considered

1. **Big Bang Migration** - Rewrite everything at once
   - Rejected: Too risky, would break existing users
2. **Maintain Legacy Only** - Don't build modern system
   - Rejected: Would limit platform flexibility long-term
3. **Adapter Pattern** - Wrap legacy modules as submodules
   - Rejected: Would require significant legacy refactoring anyway

### Implementation Notes

```jsx
// AppShell.jsx routing logic
if (location.pathname.startsWith('/flow/')) {
  return <FlowRoutes />; // No StrictMode
} else {
  return (
    <StrictMode>
      <LegacyRoutes />
    </StrictMode>
  );
}
```

---

## ADR-002: Composite Page Number Format

**Status**: ✅ Accepted  
**Date**: 2025-08-15  
**Decision Makers**: Backend + Frontend Teams

### Context

Progress tracking needed to support:

- Legacy modules: Simple linear progression (1, 2, 3...)
- Flow-based assessments: Hierarchical structure (step → submodule → page)
- Session restoration: Must restore exact position across sessions
- Analytics: Need to identify where users are in multi-step flows

**Requirements**:

- Encode hierarchical structure in single string
- Human-readable for debugging
- Sortable for progress comparison
- Backward compatible with legacy expectations

### Decision

Use **composite page number format**: `<stepIndex>.<subPageNum>`

**Examples**:

- `0.1` - Step 0 (intro), submodule page 1
- `1.3` - Step 1 (experiment), submodule page 3
- `999` - Completion sentinel

### Consequences

**Positive**:

- ✅ Natural encoding of hierarchical structure
- ✅ Easy to parse and generate
- ✅ Sortable for progress comparison
- ✅ Human-readable for debugging
- ✅ Single URL parameter for state restoration

**Negative**:

- ❌ Submodule limited to 999 pages (rarely an issue)
- ❌ Step index 0-based can confuse stakeholders
- ❌ Requires utility functions for conversion

### Implementation

```typescript
// pageMapping.ts
export function parseCompositePageNum(pageNumStr: string): {
  stepIndex: number;
  subPageNum: number;
} {
  const parts = pageNumStr.split('.');
  return {
    stepIndex: parseInt(parts[0], 10),
    subPageNum: parseInt(parts[1], 10),
  };
}

export function encodeCompositePageNum(stepIndex: number, subPageNum: number): string {
  return `${stepIndex}.${subPageNum}`;
}
```

---

## ADR-003: StrictMode Route Split

**Status**: ✅ Accepted  
**Date**: 2025-09-01  
**Decision Makers**: Frontend Team

### Context

React StrictMode intentionally double-invokes certain functions in development to detect side effects. This caused critical issues in flow-based assessments:

- **Timer initialization**: Double-start caused incorrect remaining time
- **Session state**: Double-setup created duplicate session records
- **Flow progress**: Double-increment caused page skips
- **Physics simulations**: Double-initialization broke animation timing

**Options**:

1. Fix all side effects to be StrictMode-safe
2. Disable StrictMode entirely
3. Selectively apply StrictMode based on route

### Decision

Apply **Selective StrictMode**:

- Flow routes (`/flow/*`) → No StrictMode (side-effect-sensitive)
- Legacy routes → With StrictMode (existing behavior)

### Consequences

**Positive**:

- ✅ Flow routes work correctly without refactoring for StrictMode
- ✅ Legacy routes keep StrictMode benefits (future-proofing)
- ✅ No need to audit entire codebase for side effects

**Negative**:

- ❌ Flow code doesn't get StrictMode's early warning
- ❌ Potential for subtle behavioral differences between routes
- ❌ Requires careful testing in production mode

### Rationale

Flow system has complex state management (timers, sessions, progress) that would require significant refactoring to be StrictMode-safe. Legacy modules already worked with StrictMode. Selective application was the pragmatic choice.

---

## ADR-004: Centralized Submission Pipeline

**Status**: ✅ Accepted  
**Date**: 2025-08-01  
**Decision Makers**: Frontend Team

### Context

Data submission had inconsistencies:

- Some pages called API directly
- Different MarkObject formats across modules
- Missing flow context in legacy modules
- No retry logic in some paths
- Silent failures in edge cases

**Requirements**:

- Consistent submission format across all modules
- Automatic retry with exponential backoff
- Session expiration handling
- Flow context injection for flow-based modules
- Lifecycle event tracking (page_enter, next_click, page_exit)

### Decision

Implement **usePageSubmission** hook as the **sole submission entry point**:

```javascript
const { submitPage } = usePageSubmission({
  pageId,
  flowInfo,
  onSessionExpired,
});

// All submissions go through this hook
await submitPage({
  operationList,
  answerList,
  markObjectOverrides,
});
```

### Consequences

**Positive**:

- ✅ Consistent MarkObject format enforced
- ✅ Automatic retry logic (1s, 2s, 4s delays)
- ✅ Flow context automatically injected
- ✅ Centralized session expiration handling
- ✅ Schema validation before submission

**Negative**:

- ❌ Slight learning curve for new developers
- ❌ Must ensure all pages use the hook
- ❌ Hook configuration can be complex

### Anti-patterns Prevented

- Direct `fetch('/stu/saveHcMark')` calls
- Inconsistent operation format
- Missing flow context
- Silent failures without retry

---

## ADR-005: Submodule Registration Pattern

**Status**: ✅ Accepted  
**Date**: 2025-09-15  
**Decision Makers**: Frontend Architecture Team

### Context

Flow orchestrator needed to dynamically load submodules without hardcoding imports. Required:

- Type-safe contracts
- Runtime registration
- Lazy loading support
- Version tracking

### Decision

Implement **SubmoduleRegistry** with interface-based registration:

```typescript
interface SubmoduleDefinition {
  submoduleId: string;
  displayName: string;
  version: string;

  // Navigation
  getInitialPage(subPageNum: string): string;
  getTotalSteps(): number;
  getNavigationMode(pageId: string): string;

  // Timing
  getDefaultTimers(): TimerConfig;

  // Component
  Component: React.ComponentType<SubmoduleProps>;
}

// Registration
submoduleRegistry.register(G7ExperimentSubmodule);
```

### Consequences

**Positive**:

- ✅ FlowOrchestrator can load any registered submodule dynamically
- ✅ Type-safe contracts enforced at registration time
- ✅ Easy to add new submodules without orchestrator changes
- ✅ Version tracking for compatibility

**Negative**:

- ❌ Must implement full interface even for simple submodules
- ❌ Registration order matters (circular dependency risk)
- ❌ Runtime errors if interface not properly implemented

---

## ADR-006: Flow Definition API vs. Static Config

**Status**: ✅ Accepted  
**Date**: 2025-10-01  
**Decision Makers**: Frontend + Backend Teams

### Context

Flow configuration needed to be:

- Editable without frontend deployment
- Different per user/experiment group
- Version controlled
- Cacheable for offline resilience

**Options**:

1. Static JSON files in frontend
2. Backend API returning FlowDefinition
3. Hybrid: API with local cache

### Decision

**Hybrid approach**:

- Primary: Load from `/api/flow/:flowId/definition` API
- Fallback: Use local cache if API fails
- Cache: LocalStorage for resilience

```typescript
async load(): Promise<FlowDefinition> {
  try {
    const bundle = await fetchDefinitionBundle();
    this.saveToCache(bundle);
    return bundle.definition;
  } catch (error) {
    return this.loadFromCache();  // Fallback
  }
}
```

### Consequences

**Positive**:

- ✅ Flows can be modified without frontend deployment
- ✅ A/B testing possible by serving different definitions
- ✅ Offline resilience with cache fallback
- ✅ Faster subsequent loads from cache

**Negative**:

- ❌ First load requires network
- ❌ Cache invalidation complexity
- ❌ Backend must maintain FlowDefinition schema compatibility

---

## ADR-007: Timer Scope Management

**Status**: ✅ Accepted  
**Date**: 2025-09-20  
**Decision Makers**: Frontend Team

### Context

Timers had issues:

- Global timers continued running when navigating away
- Multiple timers could run simultaneously
- No cleanup on unmount caused memory leaks
- Hidden pages started timers unexpectedly

### Decision

Implement **Scoped Timers** per submodule:

```javascript
// Each submodule manages its own timers
const { timeRemaining, startTimer, pauseTimer } = useTimer('task', {
  duration: EXPERIMENT_DURATION,
  onTimeout: handleTimeout,
});

// Timer pauses when page hidden
// Timer cleans up on unmount
// Multiple timer types: 'task', 'questionnaire', 'notice'
```

### Consequences

**Positive**:

- ✅ No global timer state conflicts
- ✅ Automatic cleanup on unmount
- ✅ Page visibility awareness
- ✅ Per-submodule time tracking

**Negative**:

- ❌ More complex than global timer
- ❌ Must ensure proper cleanup in all paths
- ❌ Debugging timer issues requires understanding scope

---

## ADR-008: CSS Modules Over Global CSS

**Status**: ✅ Accepted  
**Date**: 2025-08-10  
**Decision Makers**: Frontend Team

### Context

Styling approach needed to:

- Prevent style conflicts between modules
- Support component-level styling
- Maintain consistent design system
- Allow module-specific theming

**Legacy approach**: Global CSS files with BEM naming

### Decision

**CSS Modules** for new modules:

```css
/* ComponentName.module.css */
.container {
  /* styles */
}
.button {
  /* styles */
}
.buttonActive {
  /* styles */
}
```

```jsx
import styles from './ComponentName.module.css';

function Component() {
  return <div className={styles.container}>...;
}
```

**Global CSS** maintained for legacy modules (backward compatibility)

### Consequences

**Positive**:

- ✅ Automatic style isolation (no naming conflicts)
- ✅ Component-level styling ownership
- ✅ Only used styles included in bundle
- ✅ TypeScript support with type definitions

**Negative**:

- ❌ Two styling approaches in codebase
- ❌ Cannot easily share styles between components
- ❌ More verbose than global CSS
- ❌ Learning curve for developers new to CSS Modules

---

## ADR-009: Page Frame Component Pattern

**Status**: ✅ Accepted  
**Date**: 2025-09-05  
**Decision Makers**: Frontend Team

### Context

Assessment pages had common structure:

- Navigation buttons (prev/next)
- Timer display
- Page title/desc
- Submission handling
- Loading states

**Problem**: Each page reimplemented this, causing inconsistencies

### Decision

Create **AssessmentPageFrame** wrapper component:

```jsx
<AssessmentPageFrame
  pageId="experiment-01"
  pageTitle="蜂蜜黏度实验"
  pageNumber="1.3"
  onNext={handleNext}
  onPrev={handlePrev}
>
  {pageContent}
</AssessmentPageFrame>
```

Frame handles:

- Navigation button states
- Timer display
- Submission on page exit
- Loading skeletons
- Error boundaries

### Consequences

**Positive**:

- ✅ Consistent page structure across assessments
- ✅ Reduced boilerplate in page components
- ✅ Centralized submission handling
- ✅ Consistent error handling

**Negative**:

- ❌ Less flexibility for unique page layouts
- ❌ Props interface can become large
- ❌ Must understand frame lifecycle

---

## ADR-010: Schema-First Submission Validation

**Status**: ✅ Accepted  
**Date**: 2025-10-10  
**Decision Makers**: Full Team (Frontend + Backend + QA)

### Context

Submission format inconsistencies caused:

- Backend parsing errors
- Lost data in production
- Difficult to trace format issues
- Inconsistent field naming

### Decision

Implement **Schema-First Validation**:

```typescript
// schema.ts - Single source of truth
export const MarkObjectSchema = z.object({
  pageNumber: z.string(),
  pageDesc: z.string(),
  operationList: z.array(OperationSchema),
  answerList: z.array(AnswerSchema),
  beginTime: z.string().datetime(),
  endTime: z.string().datetime(),
  imgList: z.array(ImageInfoSchema),
});

// CI validates all submissions against schema
// Frontend validates before sending
// Backend validates on receive
```

### Consequences

**Positive**:

- ✅ Consistent format enforced at multiple layers
- ✅ Early error detection in development
- ✅ Type safety with Zod + TypeScript
- ✅ CI blocks invalid format changes

**Negative**:

- ❌ Additional validation overhead
- ❌ Schema changes require coordination
- ❌ Learning curve for Zod schema syntax

---

## Deprecated Decisions

### ADR-000: Global State Management (Redux)

**Status**: ❌ Deprecated (replaced by Context + Local State)  
**Date**: 2025-07-01 → 2025-08-01

**Original Decision**: Use Redux for global state management

**Reason for Deprecation**:

- Overkill for assessment flow (mostly linear progression)
- Added bundle size (~15KB)
- More boilerplate than Context API for our use case

**Replacement**: React Context API + local component state

---

## Pending Decisions

### ADR-011: WebSocket for Real-Time Collaboration

**Status**: ⏳ Under Discussion  
**Date**: 2026-01-15

**Proposal**: Use WebSockets for real-time collaboration features

**Considerations**:

- Server infrastructure costs
- Fallback to polling for reliability
- Conflict resolution for simultaneous edits

**Timeline**: Q2 2026 decision target

---

## How to Add New ADRs

When making significant architectural decisions:

1. **Create ADR-XXX** following this template
2. **Include**:
   - Status (Proposed / Accepted / Deprecated)
   - Context (problem statement)
   - Decision (what was decided)
   - Consequences (positive + negative)
   - Alternatives considered
3. **Review** with architecture team
4. **Update** this index

---

## References

- **Architecture Overview**: See `docs/ARCHITECTURE.md`
- **Module System**: See `src/modules/ModuleRegistry.js`
- **Submodule System**: See `src/submodules/registry.ts`
- **Submission Schema**: See `src/shared/services/submission/schema.ts`
- **AGENTS.md**: See root `AGENTS.md` for coding conventions

---

**Note**: This document uses the Architecture Decision Records (ADR) format. Each record captures a significant decision that affects the system's architecture, including the context in which the decision was made and its consequences.
