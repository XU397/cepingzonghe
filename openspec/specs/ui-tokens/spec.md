# ui-tokens Specification

## Purpose
Provide shared CSS variables for the unified navigation system so every module can inherit the Grade‑7 visual baseline while overriding tokens for local themes without touching component code.
## Requirements
### Requirement: 导航样式 Tokens
统一导航 MUST 通过 CSS 变量提供尺寸与配色 tokens，保持视觉一致并支持模块覆写。

#### Scenario: 消费与覆写
- WHEN 渲染 `LeftStepperNav`
- THEN 组件 SHALL 从 `nav-tokens.css` 读取圆点尺寸/间距/颜色；
- AND 子模块可通过覆盖变量调整主题而不改变结构。
