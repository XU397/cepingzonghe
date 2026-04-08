# Key Facts

**Project**: HCI Evaluation Platform  
**Purpose**: Critical project configuration, credentials, and constants  
**Last Updated**: 2026-02-07

---

## ⚠️ Security Notice

**DO NOT COMMIT SECRETS TO GIT**

This file should contain:

- ✅ Configuration structure and keys (not values)
- ✅ URLs and endpoints (non-sensitive)
- ✅ Default values and constants
- ✅ File paths and naming conventions

This file should NOT contain:

- ❌ Passwords or API keys
- ❌ Production credentials
- ❌ Private tokens or certificates

---

## Project Configuration

### Environment Variables

```bash
# Development
VITE_USE_MOCK=1              # Use mock API (0 for real backend)
VITE_API_BASE_URL=           # API base URL (when not using mock)

# Production (set in CI/CD or deployment platform)
VITE_USE_MOCK=0
VITE_API_TARGET=             # Backend URL for proxy
```

### File Locations

```
Config files:
- vite.config.js             # Vite build configuration
- .env / .env.local          # Environment variables
- .env.production            # Production environment

docs/:
- ARCHITECTURE.md            # System architecture
- DECISIONS.md               # Architecture decision records
- project_notes/             # This directory
  - bugs.md                  # Bug log
  - decisions.md             # Project decisions
  - key_facts.md             # This file
  - issues.md                # Work log
```

---

## API Configuration

### Endpoints

```javascript
// From src/shared/services/api/endpoints.ts
const endpoints = {
  // Authentication
  login: '/stu/login',
  checkSession: '/stu/checkSession',

  // Data submission
  saveHcMark: '/stu/saveHcMark',

  // Flow system
  flowDefinition: flowId => `/api/flow/${flowId}/definition`,
  flowProgress: flowId => `/api/flow/${flowId}/progress`,
};
```

### Request Format

All submissions use FormData:

```javascript
{
  batchCode: string,      // Exam batch code
  examNo: string,         // Student exam number
  mark: JSON.stringify({
    pageNumber: string,   // Composite page num (e.g., "1.3")
    pageDesc: string,
    operationList: [],
    answerList: [],
    beginTime: "YYYY-MM-DD HH:mm:ss",
    endTime: "YYYY-MM-DD HH:mm:ss",
    imgList: []
  })
}
```

---

## Module Configuration

### Legacy Module URLs

| Module           | URL                 | Module ID          |
| ---------------- | ------------------- | ------------------ |
| Grade 4          | `/four-grade`       | `grade-4`          |
| Grade 7          | `/seven-grade`      | `grade-7`          |
| Grade 7 Tracking | `/grade-7-tracking` | `grade-7-tracking` |

### Flow Routes

```
/flow/:flowId            # Flow runtime
/flow/:flowId?resume=1   # Resume from saved progress
```

---

## Timer Constants

```javascript
// Grade 7 Tracking
EXPERIMENT_DURATION = 40 * 60; // 40 minutes (seconds)
QUESTIONNAIRE_DURATION = 10 * 60; // 10 minutes (seconds)
NOTICE_COUNTDOWN = 40; // 40 seconds

// Grade 4
EXPERIMENT_DURATION_SECONDS = 40 * 60; // 2400 seconds
```

---

## Page Number Format

### Composite Page Numbers (Flow System)

```
Format: <stepIndex>.<subPageNum>

Examples:
- 0.1    # Step 0, page 1 (intro)
- 1.3    # Step 1, page 3 (experiment)
- 999    # Completion sentinel
```

### Legacy Page Numbers

```
Simple incrementing: 1, 2, 3, ...
```

---

## Development Commands

```bash
# Development
npm run dev                 # Start dev server (port 3000)
npm run build               # Production build
npm run preview             # Preview production build

# Testing
npm test                    # Run unit tests
npm run test:submission     # Test submission pipeline
npm run test:submission-format  # Validate submission format

# Code Quality
npm run lint                # ESLint check
```

---

## Important File Paths

```
Entry points:
- src/main.jsx              # React app entry
- src/App.jsx               # Root component
- src/app/AppShell.jsx      # Route composition

Core systems:
- src/modules/ModuleRegistry.js      # Module registration
- src/flows/orchestrator/FlowOrchestrator.ts  # Flow system
- src/submodules/registry.ts         # Submodule registry
- src/shared/services/submission/usePageSubmission.js  # Submission

Configuration:
- src/config/apiConfig.js   # API configuration
- src/context/AppContext.jsx # Global state
```

---

## CI/CD

### GitHub Actions

```
.github/workflows/
├── ci.yml                  # Lint, test, build
└── submission-guard.yml    # Submission format validation (blocking)
```

**Important**: submission-guard is a blocking check for merge.

---

## 子模块构建标准 (Submodule Construction Standards)

构建新子模块或重构现有模块时，必须遵循以下标准：

### 核心文档

| 文档             | 用途                                                | 路径                                      |
| ---------------- | --------------------------------------------------- | ----------------------------------------- |
| **构建流程手册** | 详细构建步骤、Phase 0-5 流程、验收标准              | `docs/submodule-page-build-process.md`    |
| **架构决策分析** | 任务拆分策略、现有实现对比、决策依据                | `docs/submodule-build-workflow.md`        |
| **数据提交规范** | operationList/answerList 格式、前缀规则、事件白名单 | `docs/submission-spec.md` |

### 快速检查清单

**提交前必须验证：**

```bash
npm run lint:submission        # 代码规范检查
npm run test:submission-format # 提交格式验证
npm run test:submission        # 完整提交测试套件
```

**关键约束（不可违反）：**

- `pageNumber` 格式: `^[1-9]\d*\.\d{2}$` (如 `1.03`)
- `targetElement` 前缀: `P{pageNumber}_` (非保留元素)
- 必需事件: `page_enter`, `page_exit`, (`next_click` 或 `auto_submit`)
- 答案仅记录非空值
- 禁止直接调用 `/stu/saveHcMark`

### 标准架构蓝图

```
src/submodules/<submoduleId>/
  index.tsx|jsx           # SubmoduleDefinition
  Component.tsx|jsx       # Provider + Frame (AssessmentPageFrame)
  mapping.ts              # SUBMODULE_MAPPING_CONFIG
  context/<Name>Context.* # 状态与日志 plumbing
  pages/                  # 页面组件（只做语义与 UI）
  __tests__/              # mapping 合规 + submission 测试
```

### 参考实现

- **最佳实践**: `src/submodules/g8-pv-sand-experiment/`
- **分层结构**: `src/submodules/g8-drone-imaging/`
- **Wrapper Bridge**: `src/submodules/g7-experiment/`

### Legacy 模块迁移

- 优先使用 **Wrapper Bridge** 模式快速上 Flow
- 参考迁移方案: `.sisyphus/plans/g7-tracking-and-questionnaire-migration.md`
- 必须产出模块盘点表（页面清单、提交点、计时器、localStorage 键）

---

## Quick Reference

```bash
# Find module by URL
grep -r "url.*grade-4" src/modules/

# Check recent commits
git log --oneline -10

# Search for API endpoint usage
grep -r "saveHcMark" src/

# Validate submission format
npm run test:submission-format
```

---

**Note**: Update this file when project configuration changes. Keep secrets in environment variables, never in this file.
