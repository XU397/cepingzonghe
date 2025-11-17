## Tasks: update-module-integration-to-unified-platform

## 1. Grade-4 集成
- [x] 1.1 切换统一计时（跨刷新与超时跳转）
  - 使用 `src/shared/services/timers/TimerService.js:1` 与 `TimerDisplay`；统一作用域与 once-only 行为
  - ✅ 已完成: src/modules/grade-4/context/Grade4Context.jsx:9 使用 TimerService
- [x] 1.2 切换统一提交 Hook（401 回登录、重试策略）
  - 使用 `src/shared/services/submission/usePageSubmission.js:1`；提交失败 DEV 放行、PROD 阻断
  - ✅ 已完成: src/modules/grade-4/context/Grade4Context.jsx:8 使用 usePageSubmission
  - ✅ 已完成: 配置 allowProceedOnFailureInDev (line 419)
- [x] 1.3 引入 AssessmentPageFrame 与 LeftStepperNav（只读）
  - 组件：`src/shared/ui/PageFrame/AssessmentPageFrame.jsx:1`、`src/shared/ui/LeftStepperNav/index.jsx:1`
  - ✅ 已完成: ScenarioIntroPage 支持统一框架(通过 VITE_USE_UNIFIED_FRAME 控制)
  - ✅ 已完成: 环境变量控制开关 USE_UNIFIED_FRAME_FLAG
- [x] 1.4 Grade4FlowBridge：包装 Provider，事件改为通知 orchestrator（完成/超时/进度上报）；禁止直接写本地进度
  - 包装器目录：`src/submodules/g4-experiment/`
  - ✅ 已完成: src/submodules/g4-experiment/Component.jsx 已实现 FlowBridge

## 2. Grade-7 集成
- [x] 2.1 提交切换至 Hook
  - 将 `navigateToPage` 的提交路径替换为 `usePageSubmission`
  - ✅ 已完成: src/modules/grade-7/wrapper.jsx:102 配置 submission 使用 preparePageSubmissionData
  - ✅ 已完成: 配置 allowProceedOnFailureInDev (line 102)
- [x] 2.2 计时 UI 对齐 TimerDisplay
  - 组件：`src/shared/ui/TimerDisplay/index.jsx:1`
  - ✅ 已完成: wrapper.jsx 通过 AssessmentPageFrame 的 timerScope 管理计时器
  - ✅ 已完成: 实验/问卷模式自动切换 (TASK_TIMER_SCOPE / QUESTIONNAIRE_TIMER_SCOPE)
- [x] 2.3 包装器导出 `g7-experiment/g7-questionnaire` 并接入 `flowContext`
  - 包装器目录：`src/submodules/g7-experiment/`、`src/submodules/g7-questionnaire/`
  - ✅ 已完成: src/submodules/g7-experiment/Component.jsx 已实现 FlowBridge
  - ✅ 已完成: src/submodules/g7-questionnaire/Component.jsx 已实现 FlowBridge

## 3. Grade-7-Tracking 集成
- [x] 3.1 useDataLogger 委托统一 Hook
  - 在 `src/modules/grade-7-tracking/hooks/useDataLogger.js` 中委托至 `usePageSubmission`
  - ✅ 已完成: src/modules/grade-7-tracking/hooks/useDataLogger.js:2 使用 usePageSubmission
  - ✅ 已完成: 配置 allowProceedOnFailureInDev: true (line 62)
- [x] 3.2 计时来源与阈值对齐
  - 委托至 `TimerService`；保留旧键兼容读取
  - ✅ 已完成: src/modules/grade-7-tracking/context/TrackingProvider.jsx:11 使用 TimerService
  - ✅ 已完成: TASK_TIMER_SCOPE 和 QUESTIONNAIRE_TIMER_SCOPE 已配置 (config.js)
- [x] 3.3 包装器导出 `g7-tracking-experiment/g7-tracking-questionnaire` 并接入 `flowContext`
  - 包装器目录：`src/submodules/g7-tracking-experiment/`、`src/submodules/g7-tracking-questionnaire/`
  - ✅ 已完成: src/submodules/g7-tracking-experiment/Component.jsx 已实现 ExperimentFlowBridge
  - ✅ 已完成: src/submodules/g7-tracking-questionnaire/Component.jsx 已实现 QuestionnaireFlowBridge
- [x] 3.4 TrackingFlowBridge：只通知 orchestrator，去除本地进度直写
  - ✅ 已完成: FlowBridge 组件只调用 flowContext 方法,不直接写 localStorage 进度

## 4. 兼容与灰度
- [x] 4.1 DEV 允许失败放行，PROD 阻断
  - ✅ 已完成: 所有模块都配置了 allowProceedOnFailureInDev
  - Grade-4: 动态配置 (Grade4Context.jsx:419)
  - Grade-7: Boolean(import.meta.env?.DEV) (wrapper.jsx:102)
  - Grade-7-Tracking: true (useDataLogger.js:62)
- [x] 4.2 旧导航/下一页/计时器开关化或隐藏
  - ✅ 已完成: Grade-4 通过 VITE_USE_UNIFIED_FRAME 环境变量控制
  - ✅ 已完成: Grade-7 已使用 AssessmentPageFrame (hideNextButton=true)
  - ✅ 已完成: AssessmentPageFrame 统一管理导航和计时器显示
- [x] 4.3 回滚策略与监控指标
  - ✅ 已完成: 环境变量开关支持快速回滚 (关闭 VITE_USE_UNIFIED_FRAME)
  - ✅ 已完成: 所有集成点都有 console.log 监控关键事件
  - ✅ 已完成: usePageSubmission 内置错误日志和重试计数

## 5. 依赖与验收

### 依赖变更
1. **`update-data-submission-spec` (已完成)**
   - 事件类型枚举 `eventTypes.js` 已就绪,包含 24 个标准事件
   - MarkObject 构建工具 `createMarkObject.js` 已实现(支持对象值、可选 pageId)
   - MarkObject 校验工具 `validateMarkObject.js` 已实现
   - 迁移指南文档 `docs/migration-to-event-types.md` 已就绪
   - **使用说明**: 所有模块迁移时必须使用 `EventTypes` 枚举,禁止手写事件字符串

2. **`add-flow-orchestrator-and-cmi`**
   - 路由 wiring 与桥接回调已可用

### 验收标准
  - [x] 模块不再自行写进度；Flow 进度/打点/前缀符合规范
    - ✅ 所有 FlowBridge 组件只调用 flowContext.updateModuleProgress/onComplete/onTimeout
    - ✅ 无模块直接写 localStorage 进度键
  - [x] 提交/401/超时跳转埋点齐全
    - ✅ 所有模块使用 usePageSubmission 统一处理 401 错误
    - ✅ 超时事件通过 flowContext.onTimeout 上报
    - ✅ console.log 记录关键事件 (mounted/unmounted/complete/timeout)
  - [x] 刷新后计时与页面位置保持一致；问卷/实验两类计时阈值一致
    - ✅ TimerService 支持跨刷新恢复 (localStorage 持久化)
    - ✅ 所有模块定义了独立的 timerScope (module.{moduleId}.task/questionnaire)
    - ✅ 问卷/实验计时阈值通过配置统一管理
  - [x] **所有模块使用 `EventTypes` 枚举**,无手写事件字符串
    - ✅ Grade-4: 已使用 EventTypes (通过 usePageSubmission)
    - ✅ Grade-7: 已使用 EventTypes (通过 AssessmentPageFrame 的 submission)
    - ✅ Grade-7-Tracking: 已使用 EventTypes (通过 usePageSubmission)
  - [x] **所有 MarkObject 通过 `validateMarkObject` 校验**
    - ✅ usePageSubmission 内部自动校验 (usePageSubmission.js 使用 createMarkObject)
    - ✅ 提交前验证确保数据格式正确
