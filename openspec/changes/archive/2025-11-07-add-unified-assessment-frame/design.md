## Context
- 需要统一页面容器，整合导航、计时、提交与错误托盘，并提供 TransitionPage 衔接。

## Goals / Non-Goals
- Goals:
  - AssessmentPageFrame：布局（左导航+顶计时+主体+底部按钮）与默认行为（提交→导航）。
  - TransitionPage：支持 `autoNextSeconds` 与信息展示。
  - 导航只读、错误托盘分类、消费 nav tokens。
- Non-Goals:
  - 不改题目业务内容，仅替换容器。

## Decisions
- 默认 `onNext`：调用 `usePageSubmission.submit()` 成功后导航；失败阻断（DEV 可放行）。
- 错误托盘：分类文案（重试型、超限、401 已跳转提示），提供清理机制。
- 打点：容器 mount/unmount 或切换页面时记录 `page_enter/page_exit`。

## APIs / Props
- `AssessmentPageFrame`：
  - `navigationMode`, `currentStep`, `totalSteps`, `showTimer`, `nextEnabled`
  - `onBefore?`, `onAfter?`, `onError?`, `onNext?`（可覆盖默认）
- `TransitionPage`：`message`, `autoNextSeconds?`, `onNext?`

## Risks / Trade-offs
- 与旧容器重复驱动：采用“开关化/隐藏”策略过渡，避免双计时/双导航。

## Migration Plan
1) 落地组件与样式；
2) 在 G7-Tracking 试点替换容器；
3) 逐步推广至 G7/G4。

