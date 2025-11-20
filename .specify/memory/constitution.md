<!--
Sync Impact Report:
Version: 2.0.0 → 2.1.0
Modified Principles:
  - Added: XI. OpenSpec规范权威地位原则 (NON-NEGOTIABLE)
  - Enhanced: Runtime Development Guidance with explicit OpenSpec authority hierarchy
Added Sections: XI. OpenSpec规范权威地位 (NON-NEGOTIABLE)
Removed Sections: None
Templates Status:
  ✅ Constitution updated with OpenSpec authority principle
  ⚠ plan-template.md - Constitution Check section needs update
  ⚠ spec-template.md - Requirements alignment needs verification
Follow-up TODOs: Update templates to reference OpenSpec as single source of truth
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
- Flow系统中的子模块必须实现CMI接口并保持独立性

**Rationale:**
The platform serves multiple grade levels simultaneously. Module isolation ensures that new assessments can be developed and deployed without risking regressions in existing assessments, enabling parallel development and independent release cycles.

**Validation:**
- File structure review: No cross-module file imports
- ESLint enforcement: No relative imports escaping module boundaries
- CSS scope validation: All styles scoped to module namespace
- Zero-impact testing: Existing modules pass all tests after new module addition
- CMI接口合规检查：子模块必须正确实现标准CMI定义

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

**CMI Enhancement for Flow Support:**
- 子模块包装器必须暴露CMI接口：`Component({ userContext, initialPageId, options })`
- 必须提供：`getInitialPage(subPageNum)`、`getTotalSteps()`、`getNavigationMode(pageId)`、`getDefaultTimers()`
- 生命周期钩子：`onInitialize/onDestroy`在Flow编排器控制下调用

**Rationale:**
Standardized interfaces enable the ModuleRegistry to dynamically load, route, and manage modules without code changes to the core system. This contract ensures predictable module behavior and simplifies debugging.

**Validation:**
- ModuleRegistry validation on registration (automated check)
- URL uniqueness enforcement (prevents routing conflicts)
- Type signature validation for ModuleComponent props
- getInitialPage defensive programming (handles invalid/missing pageNum)
- CMI接口验证：所有必需方法存在且类型正确

### III. Data Logging & Submission Protocol (NON-NEGOTIABLE)

**Principle:**
All user interactions and assessment data MUST be logged and submitted according to the unified data contract:

**Operation Logging:**
- Every interaction MUST call `logOperation({ targetElement, eventType, value, time })`
- Page lifecycle MUST record `page_enter` and `page_exit` events
- Timing information MUST be captured in ISO 8601 format
- 标准事件类型必须包含：`page_enter`、`page_exit`、`click`、`input`、`input_blur`、`radio_select`、`checkbox_check`、`checkbox_uncheck`、`modal_open`、`modal_close`、`view_material`、`timer_start`、`timer_stop`、`simulation_timing_started`、`simulation_run_result`、`simulation_operation`、`questionnaire_answer`、`flow_context`、`page_submit_success`、`page_submit_failed`

**Data Submission:**
- Submissions MUST use `POST /stu/saveHcMark` endpoint
- Payload MUST be FormData with fields: `batchCode`, `examNo`, `mark`
- `mark` field MUST contain JSON.stringify of MarkObject structure
- MarkObject MUST include: `pageNumber` (string), `pageDesc`, `operationList`, `answerList`, `beginTime`, `endTime`, `imgList`
- Submissions MUST occur on every page transition (unless `skipSubmit: true`)
- Operation结构：`code: number`, `targetElement: string`, `eventType: string`, `value: string | object`, `time: string`, `pageId?: string`

**Rationale:**
Consistent data logging enables cross-module analytics, student progress tracking, and research data quality. The FormData + JSON format is required for backend compatibility and session management.

**Validation:**
- apiService.js enforces data contract
- dataLogger.js validates MarkObject structure before submission
- Console warnings for missing required fields
- 401 handling triggers re-authentication flow
- 事件类型枚举验证：只允许标准事件集合中的类型

### IV. Linear Navigation Flow

**Principle:**
- Assessment navigation MUST be unidirectional (forward-only)
- Back buttons MUST be disabled during active assessments
- Navigation prerequisites MUST be validated before page transitions
- Page restoration MUST use `getInitialPage(pageNum)` for progress recovery
- 每次"下一页"操作前必须提交当前页数据，提交失败时默认阻止导航

**Rationale:**
Linear navigation ensures data integrity, prevents answer manipulation, and maintains assessment validity. Progress restoration enables users to resume after disconnections without losing work.

**Validation:**
- No browser back button handling in module code
- Navigation guards check completion requirements
- localStorage persistence of pageNum for restoration
- getInitialPage handles edge cases (invalid pageNum, completion state)
- 使用usePageSubmission Hook执行统一提交流程

### V. Timer Management & Session Integrity

**Principle:**
- Global timers MUST use `AppContext.startTaskTimer()` for consistent timing
- Module-specific timers MAY be implemented in module context
- Timer state MUST persist across page refreshes
- Timer expiration MUST trigger auto-submission and navigation to completion
- Session data (batchCode, examNo) MUST NEVER be exposed in logs or console
- 统一计时器引擎必须支持主任务、问卷与注意事项三类计时，并保障跨刷新恢复

**Timer Service Requirements:**
- 提供API：`startTask(duration?)`、`startQuestionnaire(duration?)`、`startNotice(duration?)`、`pause/resume/reset`
- 默认时长：主任务40分钟、问卷10分钟、注意事项40秒
- UI阈值：<300s警告态、<60s严重态
- 超时事件只触发一次且可跨模块去重

**Rationale:**
Timed assessments require accurate, tamper-resistant timing mechanisms. Session integrity protects student privacy and prevents unauthorized data access.

**Validation:**
- Timer state stored in module context with localStorage backup
- Countdown warnings displayed at 5-minute threshold
- Auto-submit on timer expiration tested in each module
- Code review for credential exposure (no console.log of sensitive data)
- 统一TimerService API合规检查

### VI. Error Handling & Resilience

**Principle:**
- API errors MUST be caught by shared services (apiService.js)
- 401 errors MUST trigger automatic logout and redirect to login
- Network failures MUST display retry UI with clear user messaging
- Component errors MUST be wrapped by ErrorBoundary
- Validation errors MUST display inline with affected form fields
- usePageSubmission Hook必须实现指数退避重试策略（1s、2s、4s，最多3次）

**Rationale:**
Graceful error handling maintains assessment continuity and user trust. Clear error messages reduce support burden and enable self-service recovery.

**Validation:**
- ErrorBoundary wraps all ModuleComponents
- apiService.js handles all HTTP error codes
- Offline detection with user-friendly messaging
- Form validation provides immediate feedback
- 重试策略验证：非401错误执行退避重试

### VII. Code Quality & Testing Standards

**Principle:**
- All code MUST pass ESLint with zero warnings
- React Hooks rules MUST be enforced (no violations)
- Functional components with Hooks MUST be used (no class components)
- Component naming MUST follow PascalCase, functions/variables camelCase
- Complex logic MUST be extracted to custom hooks for reusability
- `npm run lint` MUST pass before commits
- 所有文件必须使用UTF-8编码，中文字符必须正确显示

**Rationale:**
Consistent code quality reduces bugs, improves maintainability, and accelerates onboarding for new developers.

**Validation:**
- Pre-commit hooks run ESLint
- CI/CD pipeline fails on lint errors
- Code review checklist includes style compliance
- Prettier auto-formatting enforced
- UTF-8编码检查：所有源文件必须正确编码

### VIII. Flow Orchestration & CMI Compliance (NEW)

**Principle:**
- Flow系统必须支持FlowDefinition与Progress协议驱动前端编排
- FlowOrchestrator必须保持React.StrictMode兼容性
- 子模块必须通过CMI接口暴露标准化能力
- Flow上下文必须在进入子模块首页时记录flow_context操作
- 复合页码支持：`M<stepIndex>:<subPageNum>`格式

**CMI Interface Requirements:**
- 必需字段：`submoduleId/displayName/version`
- 组件入口：`Component({ userContext, initialPageId, options })`
- 工具方法：`getInitialPage(subPageNum)`、`getTotalSteps()`、`getNavigationMode(pageId)`、`getDefaultTimers()`
- 生命周期：`onInitialize/onDestroy`钩子

**Flow Context Logging:**
- 首次进入子模块时记录`flow_context`操作，包含`flowId/submoduleId/stepIndex`
- 相同子模块不重复记录
- 必须满足Data Format Spec字段约束

**StrictMode Compatibility:**
- FlowModule/子模块通过独立FlowContext传递稳定Context
- 5秒内渲染次数不得超过100次
- 自动化验收必须记录渲染计数作为兼容性证据

**Rationale:**
Flow系统enables 拼装式评测流程，CMI interface ensures 子模块可复用性，StrictMode compatibility guarantees 生产环境稳定性。

**Validation:**
- CMI接口合规检查
- StrictMode下渲染计数监控
- Flow上下文操作日志验证
- 复合页码解析正确性测试

### IX. Unified Service Architecture (NEW)

**Principle:**
- 统一提交Hook (usePageSubmission) 作为所有页面提交的单一入口
- 统一计时器引擎 (TimerService) 覆盖所有计时场景
- 统一页面框架 (AssessmentPageFrame) 标准化导航、计时、主体与错误托管
- 统一事件集合管理，新增事件必须通过Data Format Spec评审

**usePageSubmission API:**
- `submit({ markOverride? }): Promise<boolean>`
- 内部按Data Format Spec构建MarkObject
- 成功返回true，失败返回false并提供错误信息
- 与AssessmentPageFrame集成，支持onBefore/onAfter/onError钩子

**AssessmentPageFrame Structure:**
- 左侧导航 (LeftStepperNav)：只读圆点，消费nav-tokens.css
- 右上计时 (TimerDisplay)：像素级一致的七年级样式
- 主体内容区与底部"下一页"按钮
- 错误托盘：统一展示提交失败信息

**Rationale:**
Unified services reduce code duplication, ensure consistent behavior across modules, and simplify maintenance.

**Validation:**
- usePageSubmission Hook API compliance
- TimerService跨模块一致性测试
- AssessmentPageFrame样式tokens验证
- 事件集合同步性检查

### X. Frontend Structure Standardization

**Principle:**
- 交互前端必须按约定目录分层组织：`app/`, `flows/`, `submodules/`, `shared/{ui,services,types,styles}`, `hooks/`, `utils/`
- 共享层只暴露无状态组件、服务、类型与样式
- 业务模块逻辑保持在各自modules/submodules目录中
- 路径别名必须包含：`@`, `@app`, `@flows`, `@submodules`, `@shared`, `@hooks`, `@utils`, `@components`, `@modules`, `@pages`, `@services`

**AppShell Requirements:**
- `src/main.jsx`必须导入`@app/AppShell`作为根组件
- AppShell必须暴露AppProviders等占位用于全局Provider挂载
- Flow编排逻辑集中在AppShell中管理

**Directory Responsibilities:**
- `shared/`: 跨模块复用的无状态能力
- `flows/`: Flow定义与编排逻辑
- `submodules/`: CMI包装器与注册
- `app/`: 应用入口与全局装配

**Rationale:**
Standardized directory structure facilitates code navigation, dependency management, and progressive migration to unified architecture.

**Validation:**
- 目录结构合规检查
- 路径别名配置验证
- 共享层无状态性验证
- AppShell装配完整性测试

### XI. OpenSpec规范权威地位 (NON-NEGOTIABLE)

**Principle:**
- `openspec/` 目录内的所有规范文件为项目的"权威规范"和"技术真相来源"
- 所有代码实现、文档说明、开发决策必须符合并跟随 OpenSpec 规范
- 其他文档（包括 `docs/Task C/` 下的设计说明书、页面规范等）仅作为 OpenSpec 规范的"解读"和"落地指南"
- 当 OpenSpec 与其他文档出现冲突时，必须以 OpenSpec 为准
- 任何架构变更、API 修改、数据格式调整都必须先更新相应的 OpenSpec 规范

**OpenSpec 规范层级:**
- **Core Specifications**: `openspec/specs/` 下的技术规范是最高优先级
- **Project Conventions**: `openspec/project.md` 定义通用约定与开发规范
- **Change Proposals**: `openspec/changes/` 下的提案管理架构演进
- **Implementation Guidance**: 其他文档作为实施指南，不得与 OpenSpec 冲突

**规范遵循要求:**
- 开发人员必须在开始任何功能开发前查阅相关的 OpenSpec 规范
- 代码审查必须验证实现与 OpenSpec 规范的一致性
- 文档更新必须确保与 OpenSpec 规范同步
- 跨团队协作以 OpenSpec 规范为沟通基础

**Rationale:**
建立权威性技术规范体系确保项目架构一致性、决策可追溯性，并为团队协作提供统一的技术依据。OpenSpec 作为单一真相来源避免规范冲突和实施混乱。

**Validation:**
- OpenSpec 规范完整性检查
- 代码与规范一致性验证
- 文档同步性审查
- 跨规范引用完整性测试

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

### Flow/CMI Development Lifecycle
1. **CMI Wrapper**: Create submodule wrapper in `submodules/<submoduleId>/`
2. **CMI Interface**: Implement all required CMI methods
3. **Registry Integration**: Add to `submodules/registry.ts`
4. **Flow Definition**: Create FlowDefinition with steps configuration
5. **StrictMode Testing**: Verify rendering stability in React.StrictMode
6. **Flow Context**: Test flow_context logging and progress tracking
7. **Integration Testing**: End-to-end Flow运行验证

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
  - CMI接口合规性（针对Flow子模块）
  - 统一服务使用正确性

### Deployment Approval
- All modules MUST pass local testing in mock mode
- Backend integration MUST be verified in staging environment
- pageNum restoration MUST be tested with multiple scenarios
- Performance metrics MUST show no degradation in module load times
- Accessibility audit MUST pass (minimum: keyboard navigation, ARIA labels)
- Flow系统必须通过StrictMode兼容性测试
- CMI接口必须通过集成验收测试

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
- Flow/CMI modules必须通过专项合规检查

### Runtime Development Guidance

开发指导文档的权威级别和使用优先级：

**权威规范（最高优先级）:**
- **openspec/specs/**: 所有平台能力的权威技术规范
- **openspec/project.md**: 项目通用约定与开发规范
- **openspec/changes/**: 架构变更提案与演进记录

**实施指南（次优先级）:**
- **CLAUDE.md**: 综合开发模式与故障排除
- **docs/模块化开发规范与扩展指引.md**: 中文模块开发详细指南
- **docs/Task C/**: OpenSpec 规范的解读与落地指南
- **src/modules/README.md**: 模块系统实现说明

**使用原则:**
- 架构设计和技术决策必须以 OpenSpec 为准
- 日常开发可参考实施指南，但不得与 OpenSpec 冲突
- 当指南与规范不一致时，以 OpenSpec 规范为准并更新指南

**Version**: 2.1.0 | **Ratified**: 2025-01-14 | **Last Amended**: 2025-11-19