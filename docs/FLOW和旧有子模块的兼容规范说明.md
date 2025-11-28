分两层看：Flow 编排层 和 旧 G7 模块层（AppContext + PageRouter），现在是用“外壳 + 适配”的方式把它们接在一起的。

1. 加载 G7 子模块时的整体规则

Flow 侧使用 FlowModule + FlowOrchestrator，根据 FlowDefinition 的 steps[] 选出 submoduleId: 'g7-experiment'，再通过 src/submodules/g7-experiment/index.jsx 暴露的 CMI 接口加载：
Component: G7ExperimentComponent
getInitialPage(subPageNum) / getTotalSteps() / getNavigationMode(pageId) / getDefaultTimers()
resolvePageNum(pageId)（Flow 用它把页面 ID 映射成“步内页码”，写进 progress）
G7ExperimentComponent 本身只是一个薄包装器，真正渲染的是 src/modules/grade-7/wrapper.jsx（Grade7Wrapper），里面继续用旧的 AppContext + PageRouter。
FlowModule 通过 FlowAppContextBridge 把 Flow 的 beforeNavigate hook 注入到 AppContext.navigateToPage，这样“旧模块的导航”会先经过 Flow 的拦截，用于写入进度、判断是否完成当前 step。
2. 导航（左侧步骤 & 页内“下一页”）

左侧步骤导航来自 AssessmentPageFrame：
Grade7Wrapper 里传的是：
navigationMode: 根据 isQuestionnairePage(currentPageId) 决定 'experiment' 或 'questionnaire'
currentStep / totalSteps: 来自 currentStepNumber / TOTAL_USER_STEPS 等
allowNavigationClick={false}：禁用点击左侧步条，防止用户跳页。
页内“下一页”仍由旧模块控制：
旧 G7 页面通过 useAppContext().navigateToPage(nextPageId) / setCurrentPageId 驱动跳转。
因为 FlowAppContextBridge 把 navigateToPage 包了一层，Flow 能在每次页内跳转前得到 nextPageId，用 g7-experiment.resolvePageNum(nextPageId) 算出子页码，并写入 FlowOrchestrator 的 progress。
当子页码到达 getTotalSteps() 的末页，handleBeforeNavigate 会触发 handleSubmoduleComplete()，从而让 Flow 进入下一步。
所以：Flow 不负责控制 G7 页面的“下一页按钮”，只是监听它的导航并把进度写入 Flow，避免和旧模块 gating 规则冲突。
3. 倒计时（Timer）

统一计时逻辑在 @shared/services/timers（TimerService + useTimer）里，规范在 openspec/specs/timer/spec.md。
旧 G7 模块：
在 AppContext.jsx 中通过 useTimer('task', { onTimeout, onTick, scope: 'module.grade-7.task' }) 管理 40 分钟主任务计时；
startTaskTimer() 在 P1 注意事项页面（PrecautionsPage.jsx）中，在 40 秒阅读倒计时完成且点击“继续”时被调用。
问卷用 useTimer('questionnaire', scope: 'module.grade-7.questionnaire')。
头部的剩余时间显示，通过 Grade7Wrapper 里的 AssessmentPageFrame + TimerContainer 实现。
Flow 侧：
对于 G7 这种 legacy 子模块，FlowDefinition 的 getDefaultTimers() 返回的任务时长（40 分钟）主要用于：
在 Flow 层调用 TimerService.startTask(duration, { scope: 'flow::<flowId>::g7-experiment::<stepIndex>::task', force: true })，保证每个 flow step 有独立 scope、一次性 timeout 标记。
为了不和旧模块逻辑打架，我们当前的策略是：Flow 控制 TimerService 的启动和 scope，G7 头部 UI 只负责显示 TimerService 的当前剩余时间。
最近你遇到的“Flow 下 G7 右上角不显示倒计时”，就是因为原来 Grade7Wrapper 只看 taskStartTime，而 Flow 场景下 timer 是由 Flow 启动、taskStartTime 还没同步。现在 Grade7Wrapper 已调整为：
showTimer 条件：
任务：Boolean(taskStartTime) || remainingTime > 0
问卷：isQuestionnaireStarted || questionnaireRemainingTime > 0
这样无论是旧模块自己启动，还是 Flow 启动 TimerService，都能正常显示倒计时，且符合统一 Timer 规范。
4. “下一页”按钮与 Flow 框架的冲突处理

Flow 新模块（比如 G8 无人机）会用 AssessmentPageFrame 自带的右下角“下一页”按钮，并在 onNext 回调里调用 usePageSubmission.submit() + 本模块的 goToNextPage()。
对于 G7 这类旧模块，我们采取的是“壳 + 禁用”的策略：
Grade7Wrapper 传 hideNextButton 给 AssessmentPageFrame：Flow 的右下角“下一页”不渲染。
只保留旧模块内部的下一步按钮（NavigationButton 等），它们的点击路径仍然通过 AppContext 的 navigateToPage，而 FlowAppContextBridge 只是拦截、记录进度，不改变业务逻辑。
这样保证：
不破坏 G7 原有的作答限制（没完成当前页不能进下一页等）。
Flow 又能感知到“已经走到最后一页，可以推进下一个子模块”。
5. 数据提交流程是否已经统一？

是的，页面提交已经统一到新的 usePageSubmission 规范，包括 G7 在内：

在旧 G7 模块里，真正发请求的是 AppContext.submitPageData()，它内部已经改造为使用统一提交 Hook：
上面片段可见：
const { submit: submitWithUnifiedHook, … } = usePageSubmission({
  getUserContext: getUserContextForSubmission, // 从 batchCode/examNo
  buildMark: () => buildMarkFromContext(),     // 使用 pageInfoMapping + 当前操作/答案构建 MarkObject
  getFlowContext: () => flowContextRef.current,
  handleSessionExpired,
  allowProceedOnFailureInDev: allowDevBypass,
  logger: console,
});
submitPageData() 会在导航前被调用，构建符合 openspec/specs/data-format 的 MarkObject，并通过统一的 submitPageMarkData 接口发往后端；失败重试、401 处理、错误事件都走同一套逻辑。
在 Flow 场景下，getFlowContext() 会返回 flowId/submoduleId/stepIndex/pageId，满足 Submission Spec 里对 flow_context 操作的要求。
换句话说：
只要页内跳转依然通过 navigateToPage / submitPageData 路径，G7 的数据提交已经和 G8、新模块完全跑在同一条“统一提交链路”上。
旧模块中如果还有零星的 apiClient.post 直调，那才是例外；但 G7 实验主路径已经通过 AppContext 统一了。
6. 回到你具体的问题

导航/倒计时/下一页冲突如何处理？
Flow 只负责“监控 +推进 Flow 步骤”，不接管 G7 页内按钮或 gating 逻辑；
定时器统一使用 TimerService，但 G7 仍靠自己的状态来决定什么时候启动；我们已经在 Grade7Wrapper 做了兼容，以避免 Flow 启动计时后 UI 不显示的问题；
Flow 的通用“下一页按钮”在 G7 上是隐藏的，只保留老模块按钮。
数据提交是否和现在规范冲突？
主路径已统一到 usePageSubmission，包括 Flow 场景的 flow_context 打点；
你在 G7 里继续复用原来的“下一页”按钮不会违反“每次下一页前提交”的规范，只要它最终还是走 submitPageData/navigateToPage 这条链路。