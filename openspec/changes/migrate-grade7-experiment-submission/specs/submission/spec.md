## MODIFIED Requirements

### Requirement: grade7-experiment 子模块提交格式迁移
grade7-experiment 子模块 MUST 迁移到统一提交格式，遵循 `update-unified-submission-pipeline` 变更中定义的所有规格要求。

#### Scenario: 统一提交入口
**引用规格**: `openspec/changes/update-unified-submission-pipeline/specs/submission/spec.md`

- WHEN grade7-experiment 模块的任一页面需要提交数据
- THEN 该模块 MUST 使用 `usePageSubmission` Hook 作为唯一提交入口
- AND 该模块 MUST 提供：`getUserContext`, `getFlowContext`, `pageMeta`, `answers` (已过滤空值), `operations` (业务埋点)
- AND 该模块 MUST NOT 直接调用 `fetch /stu/saveHcMark` 或手写 `pageNumber/targetElement/code/time`
- AND 提交层 SHALL 自动注入 `flow_context`, `page_submit_success/failed` 事件

#### Scenario: 页码与前缀格式
**引用规格**: `openspec/changes/update-unified-submission-pipeline/specs/data-format/spec.md`

- WHEN grade7-experiment 模块构建 MarkObject
- THEN `pageNumber` SHALL 使用 `<stepIndex>.<subPageNum>` 格式（如 `1.3`），不再使用纯数字或 `M*` 前缀
- AND `pageDesc` SHALL 包含 `[flowId/submoduleId/stepIndex]` 前缀（有 Flow 时）
- AND `targetElement` SHALL 使用 `P${pageNumber}_<业务ID>` 格式（如 `P1.3_question_input`）
- AND 该模块 MUST 移除所有旧格式页码/前缀的遗留代码

#### Scenario: 输入控件事件序列
**引用规格**: `openspec/changes/update-unified-submission-pipeline/specs/data-format/spec.md` (Operation 结构与事件类别)

- WHEN grade7-experiment 模块的页面包含输入控件（文本框/文本域）
- THEN 该页面 MUST 记录完整事件序列：`input_focus` → `input_change` (多次) → `input_delete` (如有) → `input_blur`
- AND `input_change` 的 value MUST 使用 `{prev, next}` 结构或 `{prevLength, nextLength, delta}` 结构
- AND `input_delete` 的 value SHOULD 使用 `{action: 'delete', prev, next}` 或 `{action: 'delete', prevLength, nextLength}` 结构

#### Scenario: 选择控件事件
**引用规格**: `openspec/changes/update-unified-submission-pipeline/specs/data-format/spec.md` (Operation 结构与事件类别)

- WHEN grade7-experiment 模块的页面包含选择控件（单选/下拉选择器）
- THEN 该页面 **MUST 统一使用 `select_change` 事件**记录每次选择变更
- AND 该模块 **MUST NOT 使用 `radio_select` 事件**（已弃用，统一改用 `select_change`）
- AND value MUST 包含当前选中项（如 `"100"`（温度）, `"容器A"`（容器选择））
- OR WHEN 使用复选框（确认类）
- THEN 使用 `checkbox_check` / `checkbox_uncheck` 事件

**实现约束**:
- 实验页（Page_03_Experiment）的温度选择、容器选择 → **MUST 使用 `select_change`**
- 注意事项页（Page_00_1_Notice）的确认复选框 → 使用 `checkbox_check/uncheck`
- 禁止在任何页面使用 `radio_select`，与统一规范的事件枚举保持一致

#### Scenario: 实验操作事件
**引用规格**: `openspec/changes/update-unified-submission-pipeline/specs/data-format/spec.md` (Operation 结构与事件类别)

- WHEN grade7-experiment 模块的实验页（蒸馒头模拟）需要记录实验过程
- THEN 该页面 MUST 记录以下事件：
  - `simulation_operation`: 参数调整（温度/容器选择）、开始实验、重置实验
  - `simulation_timing_started`: 计时开始（含设定参数）
  - `simulation_run_result`: 实验结果（含 Run_ID、Set_Temp、Results 数组）
- AND 实验历史（多次实验记录）MUST 作为单条 Answer 存储，value 为 JSON 字符串
- AND `simulation_run_result` 的 value 结构 MUST 包含：
  - `Run_ID`: 唯一标识符（如 `run_Page_3_Experiment_1`）
  - `Set_Temp`: 设定温度值
  - `Results`: 数组，包含各容器的结果 `[{Temp, Volume}, ...]`

#### Scenario: 页面导航事件
**引用规格**: `openspec/changes/update-unified-submission-pipeline/specs/data-format/spec.md` (Operation 结构与事件类别)

- WHEN 用户在任意页面点击"下一页"按钮
- THEN 该页面 MUST 记录 `next_click` 事件
- AND 每页 MUST 包含 `page_enter` 和 `page_exit` 事件各一次

#### Scenario: 阻断校验事件
**引用规格**: `openspec/changes/update-unified-submission-pipeline/specs/data-format/spec.md` (Operation 结构与事件类别)

- WHEN 用户未完成必填项尝试点击"下一页"
- THEN 该页面 MUST 记录 `click_blocked` 事件
- AND value MUST 包含 `reason` (阻断原因) 和 `missing` 数组 (缺失项列表)
- AND 示例：`{reason: "未完成必填题", missing: ["question_1", "question_3"]}`

#### Scenario: 计时页面事件与超时提交
**引用规格**: `openspec/changes/update-unified-submission-pipeline/specs/data-format/spec.md` (Operation 结构与事件类别)

- WHEN grade7-experiment 模块包含计时/倒计时页面（如注意事项 40秒倒计时）
- THEN 该页面 MUST 记录 `timer_start` 和 `timer_complete` 事件
- AND 如包含复选框确认，MUST 记录 `checkbox_check` / `checkbox_uncheck` 事件

**超时提交链路**:
- WHEN 倒计时结束（`timer_complete`）后，用户未勾选复选框或未点击"下一页"
- THEN 页面组件 **MUST 调用 `usePageSubmission` 的超时提交方法**（如 `submitOnTimeout()`），而非直接调用普通 `submit()`
- AND Hook 层 SHALL 自动补齐占位答案（如 `"超时未确认"`）到 answerList
- AND Hook 层 SHALL 自动追加以下事件：
  - `auto_submit`（含 reason/triggerTime/timeout 元数据）
  - `page_exit`
  - `page_submit_success` 或 `page_submit_failed`
- AND answerList MUST NOT 为空（即使用户未操作，也需补齐占位答案）
- AND **禁止页面组件自行构建 auto_submit 事件或直连 API**，必须通过 Hook 的超时分支

#### Scenario: 快照测试与校验
**引用规格**: `openspec/changes/update-unified-submission-pipeline/specs/submission/spec.md` (提交守卫与唯一入口约束)

- WHEN grade7-experiment 模块完成迁移
- THEN 该模块 MUST 提供快照测试基线（覆盖至少 5 个典型页面：输入页、实验页、问卷页、计时页、阻断场景）
- AND 所有快照 MUST 通过 Schema 校验（验证 pageNumber 格式、事件枚举、code 连续性、targetElement 前缀）
- AND CI/Lint MUST 禁止直连 `/stu/saveHcMark`、手写前缀、绕过 `usePageSubmission`
- AND 最小事件集合守卫 MUST 验证每页包含：
  - 必需事件：`page_enter`, `page_exit`, `next_click`
  - 输入页：`input_focus`, `input_change`, `input_blur`
  - 选择页：`select_change` (每题至少1次)
  - 阻断场景：`click_blocked` (含 missing 列表)
  - 计时页：`timer_start`, `timer_complete`
