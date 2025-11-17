## Context
- 抽取 7 年级导航视觉为 tokens，供 LeftStepperNav 消费与模块覆写。

## Goals / Non-Goals
- Goals:
  - 提供 `nav-tokens.css`，包括尺寸、间距、配色变量。
  - LeftStepperNav 默认只读圆点（不可点击），支持可选开关。
- Non-Goals:
  - 不引入完整主题系统。

## Decisions
- 变量命名：`--nav-dot-size`, `--nav-gap`, `--nav-line-width`, `--nav-dot`, `--nav-dot-active`, `--nav-dot-completed`, `--nav-text`。
- 作用域：默认 `:root` 提供基线，子模块可在容器节点覆写。
- 样式隔离：组件使用 CSS Modules，但变量在全局可见。

## APIs / Structure
- 文件：`shared/styles/nav-tokens.css`，`shared/ui/LeftStepperNav/*`。
- Props：`mode`, `currentStep`, `totalSteps`, `onDotClick?`（默认未设置）。

## Risks / Trade-offs
- 变量冲突：通过明确前缀与文档示例降低风险。

## Migration Plan
1) 添加 tokens 与组件消费；
2) 在统一框架中接入 LeftStepperNav；
3) 子模块按需覆写变量。

