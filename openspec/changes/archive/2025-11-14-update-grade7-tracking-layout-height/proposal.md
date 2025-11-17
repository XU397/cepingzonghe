# 调整七年级追踪测评布局与高度（grade-7-tracking）

## Why
在大屏幕/高分辨率显示器上，七年级追踪测评模块（grade-7-tracking）存在内容随视口高度拉伸的问题（大量使用 `height: 100vh/100%` 与链式百分比高度），导致页面组件与图表被非等比放大，视觉比例与密度不稳定，影响美观与一致性。

## What Changes
- 调整根布局高度约束：将根容器由 `height: 100vh` 改为 `min-height: 100vh`，避免对子元素产生强制拉伸。
- 引入统一“内容外框”（contentFrame）：固定内容高度 800px、最大宽度 1200px（小屏 `max-width: 100%`），在主内容区垂直与水平居中，内部滚动。
- 计时器（Timer）规则：不允许换行，固定内边距，保持风格一致；在极小屏（≤360px）仅允许轻微减小字体以维持单行显示。
- 左侧导航：保持固定宽度，通过减小连接线间距与开启滚动适配矮屏，禁止等比外拉导致变形。
- 页级样式整改：移除页面根节点与主要容器上的 `height: 100%/100vh` 链式高度；对图表/面板等采用固定像素高度容器（如 300–360px），禁止与视口高度耦合。

## Impact
- Affected specs: grade-7-tracking-layout
- Affected code:
  - `src/modules/grade-7-tracking/styles/PageLayout.module.css`
  - `src/modules/grade-7-tracking/components/layout/PageLayout.jsx`
  - `src/modules/grade-7-tracking/styles/ExplorationPages.module.css`
  - `src/modules/grade-7-tracking/styles/Page0x_*.module.css`
  - 涉及图表/面板容器：`components/visualizations/*`, `components/experiment/*`

参考调研与规范：`docs/七年级追踪测评-布局与高度规范.md`
