# ui-frame Specification

## Purpose
TBD - created by archiving change add-unified-assessment-frame. Update Purpose after archive.
## Requirements
### Requirement: AssessmentPageFrame（统一页面框架）

交互前端 MUST 提供统一的 AssessmentPageFrame 组件，以标准化页面导航、计时、主体与错误托管的组合行为，并与全局 UI 元素（如 UserInfoBar）协同工作。

#### Scenario: 结构
- WHEN 渲染页面容器
- THEN 框架 SHALL 包含：左侧导航（LeftStepperNav）、右上计时（TimerDisplay）、主体内容区、底部"下一页"按钮与错误托盘。

#### Scenario: 行为
- WHEN 用户点击"下一页"
- THEN `onNext` SHALL 默认执行统一提交 Hook；成功后导航，失败时统一展示错误并阻断（DEV 可配置放行）；
- AND 页面 mount/unmount 或切换时 SHALL 自动上报 `page_enter/page_exit` 操作。

#### Scenario: 导航交互与样式 tokens
- WHEN 渲染 LeftStepperNav
- THEN 导航圆点 SHALL 为只读不可点击（默认）；
- AND 组件 SHALL 消费 `nav-tokens.css` 中的尺寸与配色 tokens；
- AND 可通过开关开启 onDotClick（默认关闭）。

#### Scenario: 与全局 UserInfoBar 协同（新增）
- GIVEN UserInfoBar 采用 `position: fixed` 全局固定定位在页面顶部（高度 50px，z-index 1000）
- WHEN AssessmentPageFrame 渲染时
- THEN 框架 SHALL 确保其内容不会被 UserInfoBar 遮挡
- AND 实现方式 MAY 采用以下任一方案：
  - 在框架根元素添加 `margin-top: 50px` 或 `padding-top: 50px`
  - 在全局样式中为包含框架的容器添加顶部偏移
  - 使用 CSS 变量 `--userinfo-bar-height` 统一管理高度值
- AND 框架 SHALL 保持布局灵活性，不强制要求 UserInfoBar 存在

### Requirement: TransitionPage（过渡页）
评测流程 SHALL 通过标准化的 TransitionPage 组件衔接子模块与过渡页，以呈现信息并在需要时触发下一步。

#### Scenario: 自动跳转
- WHEN 进入过渡页
- THEN 组件 SHALL 支持 `autoNextSeconds` 倒计时后自动进入下一步；
- AND 可配置显示上一模块结果/提示文案。

