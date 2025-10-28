# Project Context

## Purpose
- 面向中小学科学探究类测评的前端单页应用（SPA）。
- 通过统一模块系统承载多个测评模块：七年级“蒸馒头”（传统评估流）、四年级“火车购票”（互动模块）、七年级追踪测评（蜂蜜黏度探究）。
- 提供登录、计时、进度恢复、统一数据上报（操作与答案）与问卷（P20–P28）提交流程。

## Tech Stack
- 运行环境：浏览器端，ESM（`package.json:type=module`），Vite 构建。
- 前端框架：React 18（`react`/`react-dom` 18.2）。
- 路由与模块：React Router DOM 7；内部自研模块路由与注册（`src/modules/ModuleRegistry.js` + `src/modules/ModuleRouter.jsx`）。
- 构建工具：Vite 4（`vite` 4.4.x）+ `@vitejs/plugin-react`；别名 `@shared` → `src/shared`（见 `vite.config.js`）。
- 代码规范：ESLint（React、Hooks、React Refresh）+ Prettier 3。
- 可视化：`chart.js` + `react-chartjs-2`，以及 `recharts`（部分模块使用）。
- UI 库：`@radix-ui/react-dialog`、`@radix-ui/react-icons`（按需使用）。
- 安全与工具：`jsencrypt`（RSA 公钥加密登录密码）。
- 测试：
  - 单元/组件：项目内测试文件使用 Vitest 接口与 React Testing Library（参考 `src/App.test.jsx`）。
  - 端到端：Playwright（已安装 `@playwright/test`，但仓库未包含 `playwright.config.*`）。

## Project Conventions

### Code Style
- Prettier（`.prettierrc`）：
  - `printWidth: 100`，`tabWidth: 2`，`semi: true`，`singleQuote: true`，`trailingComma: es5`，`arrowParens: avoid`，`endOfLine: lf`。
- ESLint（`.eslintrc.json`）：
  - 扩展：`eslint:recommended`、`plugin:react/recommended`、`plugin:react/jsx-runtime`、`plugin:react-hooks/recommended`。
  - 规则：
    - `react-refresh/only-export-components: warn`（允许常量导出）。
    - `react/prop-types: off`（不强制 PropTypes）。
    - `no-restricted-imports` 禁止跨模块相对引入（如 `../../modules/*`），跨模块复用请走 `src/shared/`。
  - 忽略：`dist/`、`.eslintrc.json`。
- 命名与组织：
  - 组件/页面：PascalCase（如 `SolutionDesignPage.jsx`）。
  - Hooks：`useXxx`（camelCase）。
  - 样式：CSS Modules 使用 `*.module.css`，类名 kebab-case；全局样式见 `src/styles/global.css`。
  - 模块目录：`src/modules/grade-<标识>/`（如 `grade-7`、`grade-4`、`grade-7-tracking`）。

### Architecture Patterns
- 模块化路由与注册
  - 注册中心：`src/modules/ModuleRegistry.js` 维护 `moduleId/displayName/url/version/ModuleComponent/getInitialPage`；提供回退模块；支持生命周期 `onInitialize/onDestroy`。
  - 路由器：`src/modules/ModuleRouter.jsx` 基于后端返回的 `url` 选择模块，结合 `getInitialPage(pageNum)` 完成进度恢复。
  - 模块 URL 唯一，当前注册：`/seven-grade`、`/four-grade`、`/grade-7-tracking`。
- 应用状态与持久化
  - 全局上下文：`src/context/AppContext.jsx` 管理登录态、任务计时（40 分钟）、页面数据、问卷计时（10 分钟）等。
  - 本地存储键：`moduleUrl`、`pageNum`（统一键名，兼容迁移旧 `modulePageNum`）、`batchCode`、`examNo`、`taskStartTime`、`remainingTime`、`currentPageId`、`isTaskFinished`、`isQuestionnaireCompleted`。
  - 页面切换统一经 `navigateToPage`，进入/离开记录 `page_enter/page_exit` 操作。
- 数据上报契约
  - 统一 `mark` 结构：`pageNumber`、`pageDesc`、`operationList`、`answerList`、`beginTime`、`endTime`、`imgList`（通常空数组）。
  - 提交：`POST /stu/saveHcMark` 使用 `FormData`；`mark` 为序列化 JSON；`Content-Type` 由浏览器自动设置（不要手动覆盖）。
  - 登录：`GET /stu/login`，参数 `accountName/accountPass(type=2)`；密码用 `jsencrypt` 加密（见 `src/shared/services/apiService.js`）。
  - 会话：`/stu/checkSession` 心跳与过期（401）处理，业务错误统一上抛。
- API 配置与代理
  - `src/config/apiConfig.js` 基于宿主域名与查询参数切换模式：`direct`、`proxy`、`sameOrigin`；生产环境包含 `47.109.54.16:8080` 特判。
  - 开发服务 `vite.config.js`：
    - 支持开关式 Mock（`VITE_USE_MOCK`）拦截 `'/stu/login' | '/stu/saveHcMark' | '/stu/checkSession'`。
    - 代理：`/api`、`/stu` 转发至 `VITE_API_TARGET`，透传/写回 Cookie。
- 问卷与计时
  - 任务页面：40 分钟倒计时，时间到自动提交并跳转完成页（P19）。
  - 问卷页面：P20–P28（Intro + 7 页问题 + 提交）；10 分钟计时器 `QuestionnaireTimer` 独立控制。

### Testing Strategy
- 组件/单元测试：
  - 现有用例：`src/App.test.jsx`（使用 React Testing Library + Vitest API）。
  - 建议安装并配置：`vitest`、`@testing-library/react`、`@testing-library/jest-dom`，新增 `scripts.test` 以便 CI 运行。
- 端到端（E2E）：
  - 依赖：`@playwright/test` 已在 `devDependencies`；仓库未包含 `playwright.config.*`，按需新增。
  - 产出：仓库包含多份阶段性 E2E 报告（`PHASE7_*`），可作为用例编写参考。
- 开发调试：
  - Vite Mock 与若干 `debug-*.html` 用于本地手动验证。

### Git Workflow
- 分支策略（建议）：
  - `main`：稳定分支；`feature/*`、`fix/*`、`chore/*`、`docs/*` 从 `main` 派生。
  - 变更较大/架构性工作按 OpenSpec 建议先提交变更提案（`openspec/changes/<id>/`）。
- 提交规范（建议）：Conventional Commits
  - 示例：`feat(grade-4): 新增问卷计时器入口`、`fix(api): 表单提交改用 FormData`。
- 代码评审：优先覆盖测试与文档更新；涉及行为/契约变更需附 OpenSpec delta。

## Domain Context
- 业务领域：课堂外科学探究测评，以“页面流 + 交互操作 + 最终答案”形成结构化数据回传。
- 页面命名：`Page_XX_...`（P02–P19 为任务，P20–P28 为问卷）。
- 模块语义：
  - 七年级（`/seven-grade`）：沿用历史页面流，通过 `wrapper.jsx` 适配模块接口，页面映射见 `src/utils/pageMappings.js`。
  - 四年级（`/four-grade`）：独立上下文与页面系统（`context/`、`pages/`、`styles/`）。
  - 七年级追踪（`/grade-7-tracking`）：追踪实验/问卷/图表数据，需统一上报契约与刷新恢复。

## Important Constraints
- CORS 与代理：
  - 提交 `FormData` 时不要手动设置 `Content-Type`；避免触发预检且由浏览器补充 boundary。
  - 生产环境优先同源或服务端代理；开发环境通过 Vite 代理 `'/api' | '/stu'`。
- 导入约束：禁止跨模块相对路径导入（ESLint 规则）；复用逻辑沉入 `src/shared/`。
- 可靠性：
  - 401 会话过期需统一识别与引导重新登录，尽量保留当前页数据。
  - 本地持久化键名统一（`pageNum` 等），刷新/重登需正确恢复计时与页面。
- 计时规则：任务 40 分钟、问卷 10 分钟；到时自动提交并流转到完成/下一步。
- 性能与构建：默认 chunk 切分由 Vite/Rollup 决策（`chunkSizeWarningLimit: 1000`）。

## External Dependencies
- 后端服务：
  - 基础地址：`http://117.72.14.166:9002`（示例），实际以部署环境与代理为准。
  - 关键端点：`/stu/login`、`/stu/saveHcMark`、`/stu/checkSession`。
  - 生产域名特例：`47.109.54.16:8080`（见 `src/config/apiConfig.js`）。
- 前端依赖（选摘）：
  - React 18、React Router DOM 7、Vite 4、ESLint 8、Prettier 3。
  - Chart.js、React Chart.js 2、Recharts、Radix UI（Dialog/Icons）。
  - `@playwright/test`（E2E）、`jsencrypt`（RSA）。
- 环境变量（Vite）：
  - `VITE_USE_MOCK`：`1|true` 时启用本地 Mock（开发）。
  - `VITE_API_TARGET`：代理目标地址（生产调试/联调）。
  - `VITE_BASE`：构建基路径（默认 `./`）。
