## 2026-04-05

- 标准 Flow 子模块页面实现的最低输入，不只是标题/正文/视觉元素；还必须能落到 `mapping.ts` 的 `PAGE_CONFIGS / PAGE_QUESTIONS / QUESTION_CODE_MAP / QUESTION_TEXT_MAP / ANSWER_KEY_TO_QUESTION / QUESTION_OPTIONS_MAP`。
- `Component.tsx` 的 `validatePage`、`buildAnswerList`、`AssessmentPageFrame.onNext` 决定页面 MD 还必须提供：校验规则、阻断条件、答案键名、完整题干、选项标签、完成/提交流程。
- `docs/g8-banana-browning-experiment/` 已覆盖页面叙事、部分控件、实验数据和复用关系，但对代码实现关键契约（埋点、答案映射、校验、状态流转）仍不完整。
- `page-08` 可直接参考 `src/pages/Page_14_Simulation_Intro_Exploration.jsx` + `src/components/simulation/InteractiveSimulationEnvironment.jsx` 的“说明区 + 本页局部实验状态 + 至少一次启动后允许下一页 + 提交最后一次选择与操作日志”模式；香蕉版无需跨页保留状态。
- `page-12` 可直接参考 `src/pages/Page_18_Solution_Selection.jsx` 的“折线图 + 动态表格 + 单一最优标记 + 理由输入 + 仅做完整性校验”的模式；香蕉版只需把字段从“温度/时间”替换为“品种/温度”。
