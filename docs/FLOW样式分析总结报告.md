Flow 架构总结报告
一、Flow 调用链全景图
从登录到子模块渲染的完整流程:
┌─────────────────────────────────────────────────────────────────────┐
│ 1. 登录阶段 (LoginPage → AppContext)                                  │
│    POST /stu/login → 后端返回:                                        │
│    { url: "/flow/g7-mixed", pageNum: "M0:1", examNo: "...", ... }   │
│    ↓                                                                 │
│    AppContext.handleLoginSuccess() 存储到 localStorage                │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. 路由匹配 (App.jsx)                                                │
│    React Router 匹配 `/flow/:flowId`                                 │
│    → 挂载 <FlowModule> 组件                                          │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. FlowModule 初始化 (FlowModule.jsx)                                │
│    - 从 URL params / userContext 提取 flowId                         │
│    - 创建 FlowOrchestrator(flowId, examNo, batchCode)                │
│    - 调用 orchestrator.load()                                        │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. FlowOrchestrator 加载 (FlowOrchestrator.ts)                       │
│    - GET /stu/api/flows/{flowId}/definition  → FlowDefinition       │
│    - GET /stu/api/flows/{flowId}/progress/{examNo} → FlowProgress   │
│    - 返回 { definition: {...}, progress: {...} }                     │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. FlowOrchestrator 解析步骤 (resolve 方法)                           │
│    - 从 definition.steps[stepIndex] 获取当前步骤                      │
│    - 步骤包含: submoduleId: 'g7-experiment'                          │
│    - 调用 submoduleRegistry.get(submoduleId)                         │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 6. 子模块注册表查询 (registry.ts)                                      │
│    - 返回 SubmoduleDefinition:                                        │
│      {                                                                │
│        Component: G7ExperimentWrapper,                                │
│        getInitialPage: (pageNum) => 'page-id',                       │
│        getTotalSteps: () => 12,                                      │
│        getNavigationMode: (pageId) => 'experiment',                  │
│        ...                                                            │
│      }                                                                │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 7. 子模块渲染 (FlowModule.jsx)                                        │
│    - 调用 getInitialPage(modulePageNum) → 'Page_01_Notice'          │
│    - 渲染:                                                            │
│      <SubmoduleComponent                                              │
│        userContext={{examNo, batchCode, logOperation, ...}}          │
│        initialPageId='Page_01_Notice'                                │
│        flowContext={{flowId, stepIndex, onComplete, ...}}            │
│      />                                                               │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 8. 子模块内部 (例如 G7ExperimentWrapper.jsx)                          │
│    - 使用 Grade7Context Provider 管理状态                             │
│    - 根据 initialPageId 查找并渲染对应页面组件                         │
│    - 页面组件包裹在 <AssessmentPageFrame> 中                          │
└─────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 9. 统一页面框架渲染 (AssessmentPageFrame.jsx)                         │
│    ┌───────────────────────────────────────────────────────┐        │
│    │  [导航栏]  │  [顶部: headerSlot + 计时器]               │        │
│    │  Left      │  ────────────────────────────             │        │
│    │  Stepper   │  [内容: children]                          │        │
│    │  Nav       │                                            │        │
│    │            │  ────────────────────────────             │        │
│    │  • 1       │  [底部: 错误托盘 + 下一页按钮]              │        │
│    │  • 2       │                                            │        │
│    │  ● 3       │                                            │        │
│    └───────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
二、Flow UI 外壳组件责任分配
1. 计时器 (右上角固定定位)
负责组件: TimerContainer + TimerDisplay
文件位置:
src/shared/ui/TimerDisplay/TimerContainer.jsx - 容器组件,连接 TimerService
src/shared/ui/TimerDisplay/index.jsx - 展示组件
挂载位置: AssessmentPageFrame.jsx:396-407
<div className={styles.timerSlot}>
  {headerSlot}
  {showTimer && (
    <TimerContainer
      type={resolvedTimerType}      // 'task' | 'questionnaire' | 'notice'
      warningThreshold={resolvedWarning}
      criticalThreshold={timerCriticalThreshold}
      label={timerLabel}
      onTimeout={timerOnTimeout}
      onTick={timerOnTick}
      showEmoji={timerShowEmoji}
      scope={timerScope}
    />
  )}
</div>
样式文件: src/shared/ui/TimerDisplay/styles.module.css
.timer - 固定定位 top: 55px; right: 20px
.warning / .critical / .complete - 状态样式
2. 导航 (左侧步骤指示器)
负责组件: LeftStepperNav
文件位置: src/shared/ui/LeftStepperNav/index.jsx
挂载位置: AssessmentPageFrame.jsx:378-388
<aside className={`${styles.navRail} ${showNav ? '' : styles.navHidden}`}>
  {showNav && (
    <LeftStepperNav
      mode={navigationMode === 'questionnaire' ? 'questionnaire' : 'experiment'}
      currentStep={currentStep}
      totalSteps={totalSteps}
      compact={navCompact}
      onStepClick={disableNavigationClick ? undefined : onStepClick}
      title={navTitle}
    />
  )}
</aside>
样式文件: src/shared/ui/LeftStepperNav/styles.module.css
.navContainer - 导航容器,宽度 100px
.navTitle - "进度" 标题
.stepIndicator - "5/12" 指示器
.stepItem - 步骤圆点 (.active / .completed 状态)
3. 下一页按钮 (底部右对齐)
负责组件: AssessmentPageFrame 内联按钮 (非独立组件)
文件位置: AssessmentPageFrame.jsx:416-428
{!hideNextButton && (
  <div className={styles.actionRow} style={{ justifyContent: footerJustify }}>
    <button
      type="button"
      className={`${styles.nextButton} ${waiting ? styles.nextButtonLoading : ''}`}
      onClick={handleNext}
      disabled={!nextEnabled || waiting}
    >
      {waiting ? '提交中...' : nextLabel}
    </button>
  </div>
)}
行为逻辑:
点击 → handleNext() → 调用 submit() 提交数据
成功后 → 调用 onProceed() 触发页面切换
样式: frame.module.css:88-138
.nextButton - 按钮基础样式
.nextButtonLoading::after - 加载中旋转动画
4. 顶部信息栏 (可选插槽)
负责组件: 通过 headerSlot prop 传入自定义内容 (目前无默认实现)
挂载位置: AssessmentPageFrame.jsx:394-395
<div className={styles.timerSlot}>
  {headerSlot}  {/* 👈 子模块可在此插入顶部信息条 */}
  {showTimer && <TimerContainer ... />}
</div>
使用示例:
<AssessmentPageFrame 
  headerSlot={<UserInfoBar name={user.name} examNo={user.examNo} />}
  {...otherProps}
>
  {/* 页面内容 */}
</AssessmentPageFrame>
三、Flow UI 外壳样式入口
核心样式文件层级:
src/shared/
├── ui/
│   ├── PageFrame/
│   │   ├── frame.module.css          ← 主框架布局 (最核心)
│   │   └── AssessmentPageFrame.jsx
│   ├── LeftStepperNav/
│   │   ├── styles.module.css         ← 左侧导航样式
│   │   └── index.jsx
│   └── TimerDisplay/
│       ├── styles.module.css         ← 计时器样式
│       ├── TimerContainer.jsx
│       └── index.jsx
└── styles/
    ├── page-frame.css                ← CSS 变量 (框架 tokens)
    ├── nav-tokens.css                ← CSS 变量 (导航 tokens)
    └── timer-tokens.css              ← CSS 变量 (计时器 tokens)
详细样式文件说明:
1. 主框架布局 - frame.module.css
.frame {
  display: flex;
  min-height: 100vh;
  margin-top: var(--userinfo-bar-height, 50px);  /* 顶部留白 */
  background: var(--page-frame-bg);
}

.navRail {
  width: var(--page-frame-nav-width);              /* 导航栏宽度 */
  padding: var(--page-frame-padding-y) 20px;
  background: var(--page-frame-content-bg);
  border-right: 1px solid var(--page-frame-border);
}

.content {
  flex: 1;
  padding: var(--page-frame-padding-y) var(--page-frame-padding-x);
}

.contentCard {
  background: var(--page-frame-content-bg);
  border-radius: var(--page-frame-radius);
  box-shadow: var(--page-frame-shadow);
  padding: 32px 36px 28px;
  max-width: var(--page-frame-content-max-width);
}

.header {
  display: flex;
  justify-content: flex-end;
  min-height: 64px;
}

.timerSlot {
  position: relative;
  min-height: 64px;
}

.body {
  flex: 1;
  margin-top: 8px;
}

.footer {
  margin-top: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.nextButton {
  height: var(--page-frame-button-height);
  min-width: 180px;
  background: var(--page-frame-button-bg);
  color: var(--page-frame-button-text);
  font-size: 1rem;
  font-weight: 600;
  border-radius: var(--page-frame-button-radius);
}

.errorTray {
  border-radius: 12px;
  padding: 16px 20px;
  background: var(--page-frame-error-bg);
  border: 1px solid var(--page-frame-error-border);
}
关键 CSS 变量来源: src/shared/styles/page-frame.css
2. 左侧导航样式 - LeftStepperNav/styles.module.css
.navContainer {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: var(--nav-container-padding, 15px 10px);
  background-color: var(--nav-container-bg, #f5f6fa);
  width: var(--nav-container-width, 100px);       /* 导航栏宽度 */
  border-right: var(--nav-container-border, 3px solid #dfe6e9);
}

.navTitle {
  position: absolute;
  top: 15px;
  font-weight: bold;
  color: var(--nav-text, #2d3436);
  font-size: var(--nav-title-font-size, 14px);
}

.stepIndicator {
  font-size: var(--nav-indicator-font-size, 1em);
  font-weight: bold;
  background-color: var(--nav-indicator-bg, #ffeaa7);  /* "5/12" 指示器背景 */
  padding: var(--nav-indicator-padding, 10px 5px);
  border-radius: var(--nav-indicator-radius, 15px);
  margin-top: 35px;
  margin-bottom: 20px;
}

.stepList {
  list-style: none;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stepList::before {  /* 连接线背景 */
  content: '';
  position: absolute;
  width: var(--nav-line-width, 2px);
  background-color: var(--nav-line-color, #dfe6e9);
}

.stepItem {
  width: var(--nav-dot-size, 24px);
  height: var(--nav-dot-size, 24px);
  border-radius: 50%;
  background-color: var(--nav-dot, #ffffff);
  color: var(--nav-dot-text, #2d3436);
  border: 3px solid var(--nav-dot-border, #dfe6e9);
  margin-bottom: var(--nav-gap, 16px);
}

.stepItem.active {
  background-color: var(--nav-dot-active, #59c1ff);
  color: var(--nav-dot-active-text, #ffffff);
  transform: scale(var(--nav-dot-active-scale, 1.1));
}

.stepItem.completed {
  background-color: var(--nav-dot-completed, #55efc4);
  color: var(--nav-dot-completed-text, #ffffff);
}
关键 CSS 变量来源: src/shared/styles/nav-tokens.css
3. 计时器样式 - TimerDisplay/styles.module.css
.timer {
  position: fixed;
  top: var(--timer-top, 55px);              /* 右上角定位 */
  right: var(--timer-right, 20px);
  background-color: var(--timer-bg, #ffeaa7);
  color: var(--timer-fg, #2d3436);
  padding: var(--timer-padding, 12px 20px);
  border-radius: var(--timer-border-radius, 30px);
  font-weight: bold;
  font-size: var(--timer-font-size, 18px);
  z-index: var(--timer-z-index, 999);
  display: flex;
  align-items: center;
  border: 2px solid var(--timer-border-color, #ffb347);
}

.emoji {
  margin-right: 8px;
  font-size: 20px;
}

.timeText {
  font-size: 18px;
  font-weight: bold;
  letter-spacing: 1px;
}

.timer.warning {
  background-color: var(--timer-warning-bg, #ffb347);
  border-color: var(--timer-warning-border, #ff9800);
  animation: pulse 2s infinite;
}

.timer.critical {
  background-color: var(--timer-critical-bg, #ff6b6b);
  color: var(--timer-critical-fg, white);
  animation: pulse 1.5s infinite;
}

.timer.complete {
  background-color: var(--timer-complete-bg, #ff6b6b);
  color: var(--timer-complete-fg, white);
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}
关键 CSS 变量来源: src/shared/styles/timer-tokens.css
CSS 变量 (Token 系统) 总览
项目使用 CSS 变量 (tokens) 实现主题定制,子模块可覆写:
/* page-frame.css */
:root {
  --page-frame-bg: #f7f9fc;
  --page-frame-content-bg: #ffffff;
  --page-frame-nav-width: 120px;
  --page-frame-padding-x: 40px;
  --page-frame-padding-y: 20px;
  --page-frame-button-bg: linear-gradient(135deg, #59c1ff, #3ba3e0);
  --page-frame-button-text: #ffffff;
  --userinfo-bar-height: 50px;
}

/* nav-tokens.css */
:root {
  --nav-container-width: 100px;
  --nav-container-bg: #f5f6fa;
  --nav-dot-size: 24px;
  --nav-dot-active: #59c1ff;
  --nav-dot-completed: #55efc4;
  --nav-gap: 16px;
}

/* timer-tokens.css */
:root {
  --timer-top: 55px;
  --timer-right: 20px;
  --timer-bg: #ffeaa7;
  --timer-warning-bg: #ffb347;
  --timer-critical-bg: #ff6b6b;
}
四、关键文件清单
文件路径	责任描述
src/flows/FlowModule.jsx	Flow 入口,识别 /flow/<flowId>,管理子模块切换
src/flows/orchestrator/FlowOrchestrator.ts	Flow 编排器,加载定义和进度,解析步骤
src/submodules/registry.ts	子模块注册表,提供 submoduleId → SubmoduleDefinition 映射
src/shared/types/flow.ts	Flow 类型定义 (FlowDefinition / FlowStep / SubmoduleDefinition)
src/shared/ui/PageFrame/AssessmentPageFrame.jsx	统一页面框架,挂载导航/计时器/下一页按钮
src/shared/ui/PageFrame/frame.module.css	主框架布局样式
src/shared/ui/LeftStepperNav/index.jsx	左侧步骤导航组件
src/shared/ui/LeftStepperNav/styles.module.css	导航样式
src/shared/ui/TimerDisplay/TimerContainer.jsx	计时器容器,连接 TimerService
src/shared/ui/TimerDisplay/styles.module.css	计时器样式
src/context/AppContext.jsx	全局状态 (计时器/登录/模块 URL)
src/flows/context/FlowProvider.jsx	Flow 运行时上下文
src/shared/styles/page-frame.css	框架 CSS 变量
src/shared/styles/nav-tokens.css	导航 CSS 变量
src/shared/styles/timer-tokens.css	计时器 CSS 变量
五、现状架构草图 (文字分层)
┌─────────────────────────────────────────────────────────────────┐
│                       Flow 架构分层                               │
└─────────────────────────────────────────────────────────────────┘

Layer 1: 路由层
  - React Router (`/flow/:flowId`)
  - 匹配后挂载 <FlowModule>

Layer 2: Flow 编排层
  - FlowModule.jsx: Flow 入口,管理子模块切换
  - FlowOrchestrator: 加载 definition + progress,解析步骤
  - SubmoduleRegistry: 子模块注册表

Layer 3: 子模块包装层
  - G7ExperimentWrapper / G7QuestionnaireWrapper / ...
  - 实现 SubmoduleDefinition 接口 (Component, getInitialPage, ...)
  - 内部使用子模块专属 Context (Grade7Context)

Layer 4: 页面组件层
  - 子模块内的具体页面组件 (Page_01_Notice / Page_02_Experiment / ...)
  - 使用 <AssessmentPageFrame> 作为外壳

Layer 5: UI 外壳层
  - AssessmentPageFrame: 统一框架
    ├── LeftStepperNav: 左侧导航
    ├── TimerContainer: 右上角计时器
    ├── 下一页按钮
    └── 错误托盘

Layer 6: 服务层
  - TimerService: 统一计时器服务
  - apiClient: 网络请求
  - dataLogger: 数据提交
总结: Flow 架构通过 编排器 + 子模块注册表 + 统一页面框架 实现了模块化的拼装式测评。UI 外壳 (导航、计时器、下一页按钮) 由 AssessmentPageFrame 统一管理,样式通过 CSS 变量 (tokens) 实现主题定制。