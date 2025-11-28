# g8-mikania-experiment Flow 集成修复方案

## 背景
- 登录进入 Flow 时，`g8-mikania-experiment` 占满全屏且未呈现导航/计时/错误托盘，随后自动跳到完结页，提交数据格式错误。
- 基准对照：`src/submodules/g8-drone-imaging` 已按统一框架和数据规范接入，行为正确。

## 现象复盘
- Flow 外壳不渲染：页面内自带“下一页”按钮，未使用 `AssessmentPageFrame`/`LeftStepperNav`/`TimerDisplay`。
- 刚进入或短暂停留后直接跳到过渡/结束：子模块监听 `AppContext.isTimeUp` 并自行触发 `onTimeout()`。
- 提交被后端判定错误：`pageNumber`/`targetElement` 未使用复合页码，`pageDesc` 无 `[flowId/submoduleId/stepIndex]` 前缀，超时分支绕过 `usePageSubmission`，缺少 `flow_context` 事件。

## 根因与基准差异
- **框架集成缺失**：未用页面框架承载导航与计时；`g8-drone-imaging` 则由 `AssessmentPageFrame` 托管导航/下一步/计时、统一错误托盘。
- **计时/超时错误链路**：使用 `AppContext.isTimeUp` + 手写 `fetch('/stu/saveHcMark')`，未接入 `TimerService` 与框架的 `timerOnTimeout`；`g8-drone-imaging` 通过 Frame 统一处理。
- **数据格式不合规**：`pageNumber` 直接用子页码/字符串，`targetElement` 用 `P<subPageNum>_` 前缀，`pageDesc` 无 Flow 前缀；超时提交绕过 `usePageSubmission`，导致无 `flow_context` 注入。
- **导航定义不符规范**：`page_01_intro` 被标记为 `experiment`，`getTotalSteps` 返回 6，stepIndex 从 1 开始；规范要求 Page00/01 hidden，总步数 5，stepIndex 从 Page02 起。
- **进度与恢复缺位**：缺少 `resolvePageNum`；最后一页仍调用 `updateModuleProgress`，违背“完成后只 `onComplete` 不写进度”的要求。
- **埋点重复**：组件挂载时一次 `page_enter`，页面组件再次记录同事件，重复打点。

## 修复方案（以 g8-drone-imaging 为准）
1) **框架接入**
   - 在 `Component.jsx` 外层使用 `AssessmentPageFrame`，由框架托管导航/计时/统一提交与错误托盘。
   - 页内移除自带“下一页”按钮，仅保留业务内容。`onNext` 里调用 `validatePage`/阻断打点，再委托 `defaultSubmit`。
2) **导航与映射纠正**
   - `mapping.js`：`page_00_notice`、`page_01_intro` 设为 `hidden`；`getTotalSteps` 返回 5；`PAGE_TO_STEP` 从 `page_02_step_q1` 起算 1–5。
   - 增加 `resolvePageNum(pageId)` 供 Flow 持久化/恢复；入口 `initialPageId` 对应的 subPage 在挂载时写入 `updateModuleProgress`（仅非最后页）。
3) **计时/超时统一**
   - 只通过 Frame 的 `timerOnTimeout` 触发统一提交流程；移除 `AppContext.isTimeUp`/手写 fetch。
   - `timerScope` 使用 `module.g8-mikania-experiment.task`，时长来源 `getDefaultTimers`（20 分钟）或 Flow overrides。
4) **提交格式合规**
   - 统一用 `encodeCompositePageNum(flowContext.stepIndex, subPageNum)` 生成 `pageNumber`，`targetElement` 前缀 `P${pageNumber}_...`。
   - `pageDesc` 前缀 `[flowId/g8-mikania-experiment/stepIndex] 页面描述`；独立模式无 Flow 前缀。
   - 超时提交仍走 `usePageSubmission`，确保注入 `flow_context` 事件；`operationList`/`answerList` 按 Hook 递增 code。
   - 最后一页提交后仅调用 `flowContext.onComplete()`，不再 `updateModuleProgress`。
5) **校验与埋点**
   - 将必填校验放入 Frame `onNext`，失败时记录一次 `click_blocked`（含 missing 列表），避免每页重复 `page_enter` 事件。
6) **清理与兼容**
   - 移除手写 `fetch`、`clearModuleStorage` 的超时分支；保留必要的 localStorage 草稿键名 `module.g8-mikania-experiment.*`。

## 变更落点
- `src/submodules/g8-mikania-experiment/Component.jsx`：接入 Frame、统一提交/超时/校验、去除页内按钮、调整 pageDesc/pageNumber/targetElement 构造。
- `src/submodules/g8-mikania-experiment/mapping.js`：导航模式/步数/stepIndex 修正，新增 `resolvePageNum`。
- `src/submodules/g8-mikania-experiment/pages/*`：移除自带“下一页”按钮（保留业务交互），避免重复 `page_enter`。

## 验证清单
- Flow 模式进入：左侧导航显示 5 步，Page00/01 隐藏导航；计时条正常。
- Page00 倒计时 38s 后勾选才能前进；必填页点击下一步被阻断时有 `click_blocked` 打点且不导航。
- 抓提交 payload：`pageNumber` 形如 `M0:3`，`targetElement` 形如 `PM0:3_Q1_控制变量原因`，`pageDesc` 含 Flow 前缀，`operationList` 含 `flow_context`。
- 超时：自动提交后调用 `onTimeout`，未答填“超时未回答”，无手写 fetch。
- 最后一页：提交成功后停留当前页并触发 `onComplete`，刷新仍定位至最后页（进度未回退）。
