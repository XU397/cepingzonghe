# Proposal: add-unified-assessment-frame

## Why
- 页面容器、导航、计时、下一页与错误处理在各模块分散实现，易产生行为不一致与重复劳动。

## What Changes
- 新增 AssessmentPageFrame（导航+计时+主体+下一页+错误托盘）与 TransitionPage 规范；
- 统一对接 usePageSubmission 与 TimerService；
- 将导航组件 LeftStepperNav 作为标准导航。
- 按新目录结构将框架组件落地到 `shared/ui/PageFrame` 与 `shared/styles/*`。

## Impact
- 新模块仅需提供主体内容与页面映射，快速装配；
- 行为一致、降低维护成本。
