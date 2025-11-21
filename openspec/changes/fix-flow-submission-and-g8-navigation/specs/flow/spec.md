## ADDED Requirements

### Requirement: Flow 子模块导航与提交契约
Flow Orchestrator 与子模块包装层 MUST 遵循统一的导航与数据提交契约，避免在 Flow 模式下绕过页面框架和提交流水线。

#### Scenario: 统一导航入口
- WHEN 学生在 Flow 模式下点击「下一页」或等效前进按钮
- THEN 前端 SHALL 通过 Flow 容器提供的 `AssessmentPageFrame` 触发提交与导航（即由框架底部的统一按钮承载前进行为）；
- AND 子模块页面内 SHALL NOT 在 Flow 模式下通过自有按钮直接改变页码而绕过框架（除非该按钮明确委托给框架的前进逻辑）。

#### Scenario: 下一页按钮可用性与页面校验
- WHEN 学生在 Flow 模式下点击「下一页」，但当前页面仍存在未完成的必答题或页面级校验未通过
- THEN 容器层的 `AssessmentPageFrame` 底部“下一页”按钮 SHALL 在非提交中状态保持可点击（即除 `waiting/isSubmitting` 状态外，不因必答题未完成而长期置灰禁用）；
- AND 子模块页面 SHOULD 在自身 UI 中展示明确的错误提示（例如红色文案、高亮字段等），而不是仅依赖按钮禁用态；
- AND 子模块页面 MUST 通过 `Operation` 记录本次“被阻断”的前进尝试及原因（例如使用可扩展的交互事件类型并在 `value` 中写入错误码/提示文案）；
- AND Flow 容器 SHALL 不发起统一提交流水线（不构建 `MarkObject` / 不调用提交流程），也不得推进 Flow Progress，直到页面校验通过。

#### Scenario: Flow 提交流水线的一致性
- WHEN Flow 容器通过 `AssessmentPageFrame + usePageSubmission` 提交当前页面数据
- THEN 提交构建的 `MarkObject` SHALL：
  - 含有与 Data Format Spec 一致的字段集合（`pageNumber/pageDesc/operationList/answerList/beginTime/endTime/imgList`）；
  - 在 `operationList` 中包含至少一个 `flow_context` 事件，且其 `value` 为对象，携带 `flowId/submoduleId/stepIndex/pageId?`；
  - 使用统一工具（如 `enhancePageDesc`）确保 `pageDesc` 带有 `[flowId/submoduleId/stepIndex]` 前缀，并与 `flow_context.value` 一致；
  - 确保 `operationList[].code` 与 `answerList[].code` 从 1 连续递增，时间字段满足 Data Format Spec 要求。

#### Scenario: 与复合页码的协同
- WHEN Flow 使用 Progress `{ stepIndex, modulePageNum }` 或等价信息恢复当前页
- THEN 子模块构建的 `MarkObject.pageNumber` SHALL 与该 Progress 一致（例如使用 `M<stepIndex>:<subPageNum>` 或 `step.sub` 形式编码）；
- AND Flow 容器与子模块 SHOULD 通过统一的页码映射工具（如 `getSubPageNumByPageId` 等）保证 `pageNumber/pageDesc/flow_context` 对同一页面的标识一致。

