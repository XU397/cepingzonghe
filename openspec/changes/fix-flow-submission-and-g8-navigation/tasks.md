## 1. Spec & Design
- [x] 1.1 在 `changes/fix-flow-submission-and-g8-navigation/specs/flow/spec.md` 中补充“Flow 子模块导航与提交契约” Requirement（含至少一个 Scenario）
- [x] 1.2 复查 `openspec/specs/data-format/spec.md` 和 `docs/需求-后端接口与数据模型.md`，确认不需要额外字段层面的修改，仅做行为对齐

## 2. Implementation – g8 无人机子模块与 Flow 提交流水线
- [x] 2.1 在 `src/submodules/g8-drone-imaging/Component.tsx` 中，将现有 `submissionConfig` 注入 `<AssessmentPageFrame submission={...} />`，确保框架按钮通过 `usePageSubmission` 提交
- [x] 2.2 确认 `getFlowContext` 为 g8 子模块提供完整的 Flow 上下文（`flowId/submoduleId/stepIndex/pageId`），并通过 `enhancePageDesc` 让 `pageDesc` 持续携带 `[flowId/submoduleId/stepIndex]` 前缀
- [x] 2.3 调整 `DroneImagingContext` 与各页面/组件的时间字段来源，确保 `operation.time/pageStartTime` 进入 MarkObject 前统一由 `createMarkObject/formatTimestamp` 规范化为本地时间字符串
- [x] 2.4 清理 g8 子模块内部的“下一步/继续”按钮导航逻辑（如 `Page01_Cover`–`Page06_HeightAnalysis` 里直接调用 `navigateToPage` 的 Next 按钮）：
  - [x] 2.4.1 Flow 模式下，内部 Next 按钮改为触发框架的统一「下一页」逻辑（通过点击带 `data-testid="frame-next-button"` 的按钮），避免绕过 `AssessmentPageFrame`
  - [x] 2.4.2 保证子模块在非 Flow 场景下的导航仍然可用（沿用统一框架 + 映射配置）
- [x] 2.5 调整 `Page07_Conclusion` 的“完成实验”按钮，使其在记录 `PAGE_SUBMIT_SUCCESS` 的同时，通过触发统一提交流水线提交 MarkObject，并在 Flow 容器一侧调用完成回调（`flowContext.onComplete`）

## 3. Validation & Regression
- [ ] 3.1 为 g8 子模块新增或更新单元测试/集成测试，验证：
  - [ ] 3.1.1 每次点击统一框架的「下一页」按钮时都会调用 `/stu/saveHcMark`，并附带 `flow_context` 和带前缀的 `pageDesc`
  - [ ] 3.1.2 `operationList/answerList` 的 `code` 自 1 连续递增，时间字段格式符合 Data Format Spec
- [ ] 3.2 在 Flow 场景下（含超时自动跳转和正常完成），通过日志或 Playwright/MCP 脚本验证：
  - [ ] 3.2.1 Flow 中每个页面的行为轨迹在后端可按 `flowId/submoduleId/stepIndex/pageNumber` 维度稳定查询
  - [ ] 3.2.2 DEV 模式下仍可通过配置选择“允许提交失败后继续”，但默认行为遵循规范要求的失败阻断策略

## 4. Documentation & Cleanup
- [ ] 4.1 在 `docs/交互系统架构与数据交互说明.md` 中补充一小节，说明 g8 子模块已接入 Flow 统一提交流水线，并以其为示例说明“内部不再保留独立 Next 按钮”的模式
- [ ] 4.2 更新相关迁移/回归报告（如 `docs/FLOW样式分析总结报告` 或统一平台验收报告），记录本次修复的范围和结果

