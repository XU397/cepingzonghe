## ADDED Requirements

### Requirement: AssessmentPageFrame（统一页面框架）
交互前端 MUST 提供统一的 AssessmentPageFrame 组件，以标准化页面导航、计时、主体与错误托管的组合行为。

#### Scenario: 结构
- WHEN 渲染页面容器
- THEN 框架 SHALL 包含：左侧导航（LeftStepperNav）、右上计时（TimerDisplay）、主体内容区、底部“下一页”按钮与错误托盘。

#### Scenario: 行为
- WHEN 用户点击“下一页”
- THEN `onNext` SHALL 默认执行统一提交 Hook；成功后导航，失败时统一展示错误并阻断（DEV 可配置放行）；
- AND 页面 mount/unmount 或切换时 SHALL 自动上报 `page_enter/page_exit` 操作。

#### Scenario: 导航交互与样式 tokens
- WHEN 渲染 LeftStepperNav
- THEN 导航圆点 SHALL 为只读不可点击（默认）；
- AND 组件 SHALL 消费 `nav-tokens.css` 中的尺寸与配色 tokens；
- AND 可通过开关开启 onDotClick（默认关闭）。

### Requirement: TransitionPage（过渡页）
评测流程 SHALL 通过标准化的 TransitionPage 组件衔接子模块与过渡页，以呈现信息并在需要时触发下一步。

#### Scenario: 自动跳转
- WHEN 进入过渡页
- THEN 组件 SHALL 支持 `autoNextSeconds` 倒计时后自动进入下一步；
- AND 可配置显示上一模块结果/提示文案。
