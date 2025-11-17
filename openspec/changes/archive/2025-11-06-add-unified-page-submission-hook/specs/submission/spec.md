## ADDED Requirements

### Requirement: 统一提交 Hook（usePageSubmission）
前端交互层 SHALL 提供统一的 `usePageSubmission` Hook，作为所有模块页面提交的单一入口，以保证提交策略与异常处理的一致性。

#### Scenario: API 与返回值
- WHEN 页面需要在导航前提交数据
- THEN 该 Hook SHALL 暴露 `submit({ markOverride? }): Promise<boolean>`；
- AND 内部 SHALL 按 Data Format Spec 构建 MarkObject（除非提供 `markOverride`）；
- AND 成功时返回 `true`，失败时返回 `false` 并提供错误信息用于 UI 呈现。

#### Scenario: 重试与会话过期（401）
- GIVEN 存在网络瞬时失败
- WHEN 提交出现非 401 错误
- THEN 该 Hook SHALL 按 1s、2s、4s 的退避策略最多重试 3 次；
- WHEN 接口返回 401/Unauthorized 或业务判定会话过期
- THEN 该 Hook MUST 调用 `handleSessionExpired` 执行统一登出/清理，并 SHALL 不再重试。

#### Scenario: 与页面框架集成
- GIVEN 使用统一页面框架 AssessmentPageFrame
- WHEN 用户点击“下一页”
- THEN 框架 SHALL 默认调用 `usePageSubmission.submit()`；成功后执行导航，失败时阻断（DEV 可配置放行），并通过错误托盘展示信息；
- AND 框架 SHALL 暴露 `onBefore/onAfter/onError` 钩子以便页面进行扩展处理。

