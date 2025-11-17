## Context
- 大屏下使用 `height: 100vh/100%` 造成等比拉伸与视觉不稳定；需通过 `min-height` 与固定内容框控制。

## Goals / Non-Goals
- Goals:
  - 根容器 `min-height: 100vh`，内容框 `1200×800` 居中、内部滚动。
  - 计时器单行、固定内边距，小屏仅缩小字体。
  - 左侧导航固定宽度、开启滚动，禁止等比拉伸。
- Non-Goals:
  - 不改变题目内容布局结构，仅约束外层与关键容器高度。

## Decisions
- 统一 `.contentFrame` 容器与 tokens；图表/面板使用固定像素高（300–360px）。
- 去除链式 `height: 100%/100vh`，改为内容内滚模式。

## Risks / Trade-offs
- 小屏适配：通过滚动而非压缩内容防止失真。

## Migration Plan
1) 修改 PageLayout 与相关样式；
2) 按规范文件自检；
3) 回归测试典型分辨率（1366×768、1920×1080、2560×1440）。

