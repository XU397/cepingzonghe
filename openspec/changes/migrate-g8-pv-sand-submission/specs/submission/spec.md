## MODIFIED Requirements

### Requirement: 统一提交 Hook（usePageSubmission）
g8-pv-sand-experiment 模块 SHALL 完全对齐统一提交入口，使用 `usePageSubmission` Hook 替代所有手写提交逻辑，确保数据格式、事件枚举与重试机制的一致性。

#### Scenario: g8-pv-sand-experiment 模块集成
- GIVEN g8-pv-sand-experiment 模块的 7 个页面（instructions_cover, background_notice, experiment_design, tutorial_simulation, experiment_task1, experiment_task2, conclusion_analysis）
- WHEN 任一页面需要在导航前提交数据
- THEN 该模块 SHALL 使用 `usePageSubmission` Hook 作为唯一提交入口，移除所有手写的 `submitPageMarkData` 逻辑
- AND 所有页面 SHALL 通过 `submit()` 方法提交，不得直接调用 `/stu/saveHcMark` 端点
- AND 提交失败时 SHALL 依赖 Hook 的重试机制，而非模块内自定义重试逻辑

### Requirement: 标准事件集合与数据格式一致性
g8-pv-sand-experiment 模块 SHALL 严格遵循 Data Format Spec 定义的事件枚举与值格式，覆盖计时、输入、选择、实验操作、校验阻断等所有交互类型，并确保 Flow 上下文与提交结果事件的自动注入。

#### Scenario: g8-pv-sand-experiment 事件类型覆盖
- GIVEN g8-pv-sand-experiment 模块包含以下页面类型：
  - 计时页（instructions_cover, background_notice）
  - 输入页（experiment_design, conclusion_analysis）
  - 实验操作页（tutorial_simulation, experiment_task1, experiment_task2）
  - 问卷页（experiment_task1, experiment_task2, conclusion_analysis）
- THEN 该模块 SHALL 使用以下标准事件类型，且 SHALL NOT 引入非枚举事件：
  - **页面生命周期**：`page_enter`, `page_exit`
  - **导航**：`next_click`（手动提交页），`auto_submit`（自动提交页）
  - **输入链路**：`input_focus`, `input_change`, `input_delete`, `input_blur`
  - **选择**：`radio_select`（单选题），`checkbox_check`, `checkbox_uncheck`（多选题/确认框）
  - **计时**：`timer_start`, `timer_complete`
  - **实验操作**：`simulation_operation`（参数调整/重置），`simulation_timing_started`（开始实验），`simulation_run_result`（结果记录）
  - **校验阻断**：`click_blocked`
  - **系统事件（自动注入）**：`flow_context`, `page_submit_success`, `page_submit_failed`
- AND 所有事件类型 SHALL 在 Data Format Spec 的扩展事件枚举中定义
- AND `click_blocked` 事件的 `value` SHALL 包含 `{reason, missing[], timestamp}` 结构，`missing` 数组包含具体缺失项描述

#### Scenario: g8-pv-sand-experiment 的 Flow 上下文事件
- GIVEN g8-pv-sand-experiment 作为 Flow 中的子模块运行（flowId = `flow-g8-experiment-2024`, submoduleId = `g8-pv-sand-experiment`）
- WHEN 进入任一页面（subPageNum=1~7）
- THEN 提交时 SHALL 包含 `flow_context` 事件，其 `value` 结构为：
  ```json
  {
    "flowId": "flow-g8-experiment-2024",
    "submoduleId": "g8-pv-sand-experiment",
    "stepIndex": <运行时确定的 Flow 位置，0-based>,
    "pageId": "<当前页面 ID，如 'instructions_cover'>"
  }
  ```
- AND `stepIndex` SHALL 用于生成 `pageNumber` 格式：`<stepIndex>.<subPageNum>`（如 `0.1`, `0.2`, ..., `0.7`）
- AND `pageDesc` SHALL 使用三段式前缀：`[flow-g8-experiment-2024/g8-pv-sand-experiment/<stepIndex>] <页面标题>`

#### Scenario: g8-pv-sand-experiment 的提交结果事件
- WHEN 任一页面提交成功
- THEN SHALL 追加 `page_submit_success` 事件，`value` 包含：
  - `duration`：页面停留时长（秒）
  - `channel`：固定为 `"usePageSubmission"`
  - `trigger`（可选）：自动提交页（background_notice）SHALL 含 `"trigger": "auto"`
- WHEN 提交失败（如网络错误）
- THEN SHALL 追加 `page_submit_failed` 事件，`value` 包含错误摘要（如 `{"error": "NetworkError", "message": "..."}`）

### Requirement: pageNumber 与前缀格式统一
g8-pv-sand-experiment 模块 SHALL 采用 `<stepIndex>.<subPageNum>` 格式生成页码，并为所有 `pageDesc` 和 `targetElement` 添加规范前缀，确保在 Flow 多模块场景下的数据唯一性与可追溯性。

#### Scenario: g8-pv-sand-experiment 的页码与前缀规则
- GIVEN g8-pv-sand-experiment 模块在 Flow 中的 `stepIndex`（运行时确定）
- THEN 所有页面的 `pageNumber` SHALL 遵循 `<stepIndex>.<subPageNum>` 格式：
  - subPageNum=1 (instructions_cover) → pageNumber=`<stepIndex>.1`
  - subPageNum=2 (background_notice) → pageNumber=`<stepIndex>.2`
  - subPageNum=3 (experiment_design) → pageNumber=`<stepIndex>.3`
  - subPageNum=4 (tutorial_simulation) → pageNumber=`<stepIndex>.4`
  - subPageNum=5 (experiment_task1) → pageNumber=`<stepIndex>.5`
  - subPageNum=6 (experiment_task2) → pageNumber=`<stepIndex>.6`
  - subPageNum=7 (conclusion_analysis) → pageNumber=`<stepIndex>.7`
- AND 所有 `targetElement`（除 `"系统"`, `"页面"` 等特殊元素）SHALL 使用 `P<pageNumber>_<业务ID>` 前缀（如 `P0.3_问题1输入框`）
- AND 所有 `pageDesc` SHALL 使用三段式前缀：`[flowId/submoduleId/stepIndex]`（如 `[flow-g8-experiment-2024/g8-pv-sand-experiment/0]`）
