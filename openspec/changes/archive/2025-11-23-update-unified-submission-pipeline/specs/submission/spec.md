## MODIFIED Requirements
### Requirement: 统一提交 Hook（usePageSubmission）
前端交互层 SHALL 使用统一的 `usePageSubmission` 作为唯一提交入口,负责新格式落地、自动注入与守卫。
#### Scenario: 提交入口与返回值
- WHEN 页面在导航前需要提交数据
- THEN `usePageSubmission` SHALL 暴露 `submit({ markOverride? }): Promise<boolean>`;
- AND 默认路径 SHALL 依 Data Format Spec 构建 `MarkObject`:使用 `encodeCompositePageNum(stepIndex, subPageNum)` 生成 `<stepIndex>.<subPageNum>` 页码,`pageDesc` 添加 `[flowId/submoduleId/stepIndex]` 前缀(无 Flow 时省略),`targetElement` 前缀为 `P${pageNumber}_...`;
- AND 提交层 SHALL 过滤空答案、自动追加 `flow_context`、`auto_submit`(若超时触发)、连续自增 `code`、统一时间格式、Schema 校验后调用统一提交 API,成功返回 `true`,失败返回 `false` 并含错误摘要。
#### Scenario: 输入约束与自动注入
- GIVEN 页面接入 usePageSubmission
- THEN 子模块仅需提供 `getUserContext`、`getFlowContext`、`pageMeta`(pageId/pageTitle/subPageNum)、`answers`(非空)与业务 `operations`;
- AND 子模块 MUST NOT 手写 `pageNumber/targetElement/flow_context/code/time` 或直接 `fetch /stu/saveHcMark`,由提交层统一编码与提交。
#### Scenario: 计时超时自动提交
- WHEN 计时器超时需要自动提交
- THEN `usePageSubmission` SHALL 通过同一入口补齐"超时未回答"答案,记录 `auto_submit`/`page_exit` 等操作后提交;任何失败按提交失败流程返回。
#### Scenario: 重试与会话过期(401)
- GIVEN 存在网络瞬时失败
- WHEN 提交失败
- THEN Hook SHALL 以 1s/3s/5s 退避最多重试 3 次;
- WHEN 返回 401/Unauthorized 或判定会话过期
- THEN Hook MUST 调用 `handleSessionExpired` 清理并停止重试。
#### Scenario: 与页面框架集成
- GIVEN 使用 `AssessmentPageFrame`
- WHEN 用户点击"下一页"
- THEN 框架 SHALL 通过默认提交配置助手调用 `usePageSubmission.submit()`;成功后导航,失败时阻断(DEV 可配置放行)并通过错误托盘展示;框架 STILL SHALL 暴露 `onBefore/onAfter/onError` 供扩展。

### Requirement: 标准事件集合与数据格式一致性
`usePageSubmission` SHALL 暴露与 Data Format Spec 一致的事件枚举,并负责前缀与上下文注入,不允许绕过枚举或手写前缀。
#### Scenario: 事件枚举与前缀
- THEN 事件枚举 SHALL 覆盖:`page_enter`、`page_exit`、`click`、`change`、`input`、`input_blur`、`input_focus`、`input_change`、`input_delete`、`select_change`、`radio_select`、`checkbox_check`、`checkbox_uncheck`、`modal_open`、`modal_close`、`view_material`、`timer_start`、`timer_stop`、`timer_complete`、`simulation_timing_started`、`simulation_run_result`、`simulation_operation`、`questionnaire_answer`、`flow_context`、`auto_submit`、`next_click`、`page_submit_success`、`page_submit_failed`、`click_blocked`;新增事件 MUST 同步规格与枚举;
- AND Hook SHALL 为所有 `operationList/answerList` 的 `targetElement` 添加 `P${pageNumber}_...` 前缀,并使用 `<stepIndex>.<subPageNum>` 页码编码。
#### Scenario: Flow 上下文与缺失项记录
- THEN Hook SHALL 自动注入一次 `flow_context`(含 `flowId/stepIndex/submoduleId/moduleName/pageId?`),缺失 Flow 信息时记录日志但不阻断其他操作;
- AND 在校验阻断或禁用点击时 MUST 记录 `click_blocked` 事件,`value.missing` 列表标识未满足的字段或前置条件。
#### Scenario: 提交结果事件
- WHEN `submit()` 完成且准备导航
- THEN MUST 追加 `page_submit_success`(含耗时/通道信息若可用);
- WHEN 重试后仍失败或遇到不可恢复错误
- THEN MUST 追加 `page_submit_failed`,`value` 携带最后错误摘要,保持与 Assessment Core 错误处理对齐。

## ADDED Requirements

### Requirement: 行为埋点包装组件
提交工具链 SHALL 提供输入/选择/按钮等包装组件,自动生成标准事件与前缀,减少手写遗漏。
#### Scenario: 组件输出一致性
- THEN 输入类包装组件 SHALL 自动输出 focus/change/delete/blur 事件,value 采用快照或 `{ prev, next }`,删除可使用 `{ action: 'delete', prevLength, nextLength }`;选择类包装组件 SHALL 输出 select_change/checkbox_* 等事件并附当前选中值;按钮包装组件 SHALL 输出 click/next_click 并在阻断时生成 click_blocked。

### Requirement: 提交守卫与唯一入口约束
工具链 MUST 阻断绕过统一 Hook 或使用旧格式的提交路径,确保 DEV 仅按新规范实现。
#### Scenario: CI/Lint 阻断绕行
- WHEN 执行 CI/Lint
- THEN 工具链 SHALL 禁止直接 `fetch /stu/saveHcMark`、禁止手写 `pageNumber` 为 `M*`/冒号格式或自造 `targetElement` 前缀、禁止跳过 `usePageSubmission`;违反时 CI MUST 失败。

### Requirement: 最小事件集合守卫
构建/测试/Lint MUST 检查页面是否具备最小必要事件与前缀,防止漏埋点。
#### Scenario: 守卫规则
- THEN 校验 SHALL 确认每页存在 `page_enter`、`page_exit`、`next_click`(或等效 next 操作)、阻断时的 `click_blocked`(含 missing 列表),以及输入/选择类的 focus/change/delete/blur 或 select_change 事件;目标元素前缀 `P${pageNumber}_...` 必须符合规范;缺失时构建/CI MUST 失败。
