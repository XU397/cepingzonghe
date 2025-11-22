## Why

当前 Flow + 子模块的数据提交与导航行为相对于规范存在偏差，主要表现为：
- g8 无人机子模块在 Flow 场景下并未完全接入 `AssessmentPageFrame + usePageSubmission` 的统一提交流水线，正常「下一页」操作绕过了统一提交；
- 子页面内部仍保留自己的“下一步/继续”按钮并直接切页，导致 `MarkObject.pageNumber/pageDesc`、`flow_context` 事件和提交成功/失败的观测在 Flow 维度上不稳定；
- 部分操作时间字段使用 ISO 字符串，未严格遵守 Data Format Spec 要求的本地时间格式。

这些差异使得 Flow 观测与后端分析难以依赖统一的行为轨迹数据，也与 `flow` 与 `data-format` 规格中关于 `flow_context`、复合页码和页面生命周期打点的约定不完全一致。

## What Changes

- 将 g8 无人机子模块完全接入统一提交流程：
  - 在 `Component`/`DroneImagingFrame` 中，将当前构造的 `submissionConfig` 传入 `AssessmentPageFrame.submission`，让底部框架的「下一页」按钮通过 `usePageSubmission` 构建并提交 MarkObject；
  - 确保每次点击「下一页」时都在成功提交 `/stu/saveHcMark` 后再推进子模块内部页码和 Flow 进度。
- 清理 g8 子模块内部的“下一步/继续”跳转路径：
  - 移除或改造 `Page01_Cover`–`Page06_HeightAnalysis` 中直接调用 `navigateToPage` 的内部 Next 按钮，使 Flow 模式下只通过统一框架按钮完成导航；
  - 终页 `Page07_Conclusion` 的“完成实验”按钮改为触发统一提交（含 `PAGE_SUBMIT_SUCCESS`）、并通过 Flow 提供的回调推进到 Flow 的下一步。
- 统一 g8 子模块产生的 MarkObject 行为轨迹：
  - 复用现有 `getSubPageNumByPageId` 与 Flow 上下文信息，确保 `pageNumber` 按约定使用复合页码（或其等价编码），并通过 `getFlowContext + enhancePageDesc` 确保 `pageDesc` 始终附带 `[flowId/submoduleId/stepIndex]` 前缀；
  - 通过 `createMarkObject`/`formatTimestamp` 或等价方式，保证 `operationList[].time/beginTime/endTime` 满足 Data Format Spec 要求的本地时间格式；
  - 确保每个提交至少包含一条 `flow_context` 事件，且其 `value` 为对象，与 `pageDesc` 前缀中的 `flowId/submoduleId/stepIndex` 一致。
- 在 `flow` 规格中补充「子模块导航与提交契约」：
  - ADDED Requirement：在 Flow 模式下，子模块不得绕过统一页面框架自行前进，导航与提交必须通过 Flow 容器提供的 `AssessmentPageFrame + usePageSubmission` 能力完成；
  - 明确 Flow 模式下的 `page_exit` / `flow_context` 事件和复合 `pageNumber/pageDesc` 的一致性要求，以便后端以 Flow 维度观测用户行为轨迹。

## Impact

- Affected specs:
  - `openspec/specs/flow/spec.md`：补充“Flow 子模块导航与提交契约”需求，强调统一框架按钮是 Flow 模式下的唯一前进入口；
  - `openspec/specs/data-format/spec.md`：行为保持不变，本次通过实现对齐已有规范（无需变更字段结构，只在 Flow spec 中交叉引用）。
- Affected code:
  - `src/submodules/g8-drone-imaging/Component.tsx`：接入 `AssessmentPageFrame.submission`，串联 Flow 上下文与 MarkObject 构建；
  - `src/submodules/g8-drone-imaging/pages/*.tsx`：清理内部导航按钮的直接切页逻辑，改为依赖统一框架导航并补齐终页完成逻辑；
  - （如有需要）`src/shared/services/submission/usePageSubmission.js` / `pageDescUtils.js`：在不破坏兼容性的前提下增强 Flow 上下文注入与日志输出。
- Compatibility:
  - 对已有存量数据结构完全兼容，仅修复实现偏差，使行为与已存在的规范保持一致；
  - 对非 Flow 模式（直接进入模块）不引入破坏性变化；G8 子模块在非 Flow 场景下仍可通过统一框架工作。

