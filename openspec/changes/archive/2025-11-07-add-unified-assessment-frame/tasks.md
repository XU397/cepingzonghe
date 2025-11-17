# Tasks: add-unified-assessment-frame

## 1. 组件与交互
- [x] 1.1 实现 AssessmentPageFrame（导航+计时+主体+下一页+错误托盘）
- [x] 1.2 实现 TransitionPage（过渡页，支持 autoNextSeconds）
- [x] 1.3 集成 LeftStepperNav 与 TimerDisplay（像素级一致）
- [x] 1.4 按新目录放置组件：`shared/ui/PageFrame/*`，样式拆分至 `shared/styles`

## 2. 行为集成
- [x] 2.1 onNext：默认执行 usePageSubmission.submit → 成功后导航
- [x] 2.2 页面进入/退出：自动打点（page_enter/page_exit）
- [x] 2.3 错误托盘：统一展示提交失败/网络错误等
- [x] 2.4 替换模块容器时保留原主体，旧导航/计时开关化或隐藏
 - [x] 2.5 左侧导航默认只读（不可点击跳转），暴露开关 onDotClick（默认关闭）
 - [x] 2.6 错误托盘分类与文案：提交失败（可重试）、重试超限、401 已跳转提示
 - [x] 2.7 引入 `shared/styles/nav-tokens.css`，LeftStepperNav 消费 tokens
