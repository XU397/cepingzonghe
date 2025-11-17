## Proposal: add-nav-css-tokens

## Why
- 统一导航视觉为 7 年级像素基线，通过 CSS 变量（tokens）在不同子模块可覆写。

## What Changes
- 新增 `shared/styles/nav-tokens.css` 并在 `LeftStepperNav` 中消费；
- 规范颜色、间距、尺寸等 tokens。

## Impact
- 导航视觉一致且可配置，减少重复样式。
