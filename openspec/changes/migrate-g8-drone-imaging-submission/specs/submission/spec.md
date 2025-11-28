# submission.MODIFIED

## Summary
扩展统一提交规范以支持 g8-drone-imaging 子模块的数据提交需求，包括模拟实验操作、计时器事件、问卷选择和阻断场景。

## MODIFIED Requirements

### Requirement: Page Number Encoding for Submodules
子模块页码 MUST 使用复合编码格式 `<stepIndex>.<subPageNum>`，其中 `stepIndex` 为子模块在 Flow 中的 0-based 位置索引，`subPageNum` 为子模块内页面的 1-based 页码。此规范适用于 g8-drone-imaging 以及所有未来在 Flow 中使用的子模块。

#### Scenario: g8-drone-imaging as First Submodule (stepIndex=0)
- **GIVEN** g8-drone-imaging 是 Flow 中第 1 个子模块（stepIndex=0）
- **WHEN** 用户浏览模块的 7 个页面
- **THEN** pageNumber 依次为：`0.1`, `0.2`, `0.3`, `0.4`, `0.5`, `0.6`, `0.7`

#### Scenario: g8-drone-imaging as Third Submodule (stepIndex=2)
- **GIVEN** g8-drone-imaging 是 Flow 中第 3 个子模块（stepIndex=2）
- **WHEN** 用户浏览模块的 7 个页面
- **THEN** pageNumber 依次为：`2.1`, `2.2`, `2.3`, `2.4`, `2.5`, `2.6`, `2.7`

---

### Requirement: Page Description Format
所有子模块的 pageDesc MUST 遵循格式：`[{flowId}/{submoduleId}/{stepIndex}] {页面标题}`。注意 stepIndex 直接使用数字，不带 "step" 前缀。

#### Scenario: Page Description with Composite Context
- **GIVEN** g8-drone-imaging 在 Flow (flowId="g8-assessment-flow") 中的 stepIndex=0
- **WHEN** 用户进入封面页（pageId="cover"）
- **THEN** pageDesc 为 `"[g8-assessment-flow/g8-drone-imaging/0] 封面与注意事项确认"`

#### Scenario: Page Description for Hypothesis Page
- **GIVEN** g8-drone-imaging 在 Flow 中的 stepIndex=0
- **WHEN** 用户进入问题1页面（pageId="hypothesis"）
- **THEN** pageDesc 为 `"[g8-assessment-flow/g8-drone-imaging/0] 问题1-控制变量理由"`

---

### Requirement: Target Element Prefix for Submodule Pages
业务元素的 targetElement MUST 使用格式：`P${pageNumber}_<业务ID>`，其中 pageNumber 采用复合格式 `<stepIndex>.<subPageNum>`，与页码编码保持一致。

#### Scenario: Target Elements with Composite Page Numbers
- **GIVEN** g8-drone-imaging 的 stepIndex=0
- **WHEN** 在 Page01 (pageNumber=0.1) 中记录确认复选框事件
- **THEN** targetElement 为 `"P0.1_确认阅读"`
- **AND** 在 Page03 (pageNumber=0.3) 中记录输入框事件
- **AND** targetElement 为 `"P0.3_控制变量理由"`
- **AND** 在 Page05 (pageNumber=0.5) 中记录单选框事件
- **AND** targetElement 为 `"P0.5_最小GSD焦距"`

---

### Requirement: Simulation Operation Events
新增 `simulation_operation` 事件类型，MUST 用于记录实验模拟器交互操作（高度选择、焦距调整、拍照、重置等）。

#### Scenario: Recording Height Selection in Simulator
- **GIVEN** 用户在 Page04 实验页面
- **WHEN** 用户选择飞行高度为 100 米
- **THEN** 记录事件：
```json
{
  "targetElement": "height_selector",
  "eventType": "simulation_operation",
  "value": "{\"action\":\"set_height\",\"value\":100}"
}
```

#### Scenario: Recording Photo Capture in Simulator
- **GIVEN** 用户已设置高度=100米，焦距=24毫米
- **WHEN** 用户点击拍照按钮
- **THEN** 记录事件：
```json
{
  "targetElement": "capture_button",
  "eventType": "simulation_operation",
  "value": "capture_h100_f24_gsd2.50"
}
```

#### Scenario: Recording Experiment Reset
- **GIVEN** 用户在实验页面有操作历史
- **WHEN** 用户点击重置按钮
- **THEN** 记录事件：
```json
{
  "targetElement": "reset_button",
  "eventType": "simulation_operation",
  "value": "reset_experiment"
}
```

---

### Requirement: Timer Events with Structured Values
所有计时器事件的 value MUST 使用结构化 JSON 格式：`timer_start` 使用 `{"duration": <秒数>, "unit": "seconds"}`，`timer_stop` 和 `timer_complete` 使用 `{"reason": "<原因>", "elapsed": <实际秒数或毫秒数>}`。

#### Scenario: Countdown Timer Start
- **GIVEN** 用户进入 Page01 封面页
- **WHEN** 40秒倒计时开始
- **THEN** 记录事件：
```json
{
  "targetElement": "P0.1_countdown",
  "eventType": "timer_start",
  "value": "{\"duration\":40,\"unit\":\"seconds\"}"
}
```

#### Scenario: Countdown Timer Completion
- **GIVEN** 40秒倒计时已开始
- **WHEN** 倒计时自然结束（未被中断）
- **THEN** 记录事件：
```json
{
  "targetElement": "P0.1_countdown",
  "eventType": "timer_stop",
  "value": "{\"reason\":\"countdown_finished\",\"elapsed\":40}"
}
```

#### Scenario: Module Task Timer Expiration
- **GIVEN** 模块20分钟计时器已启动
- **WHEN** 计时器到期（1200000毫秒）
- **THEN** 记录事件：
```json
{
  "targetElement": "module",
  "eventType": "timer_complete",
  "value": "{\"reason\":\"task_timer_expired\",\"elapsed\":1200000}"
}
```

---

### Requirement: Click Blocked Events with Missing Fields
click_blocked 事件的 value MUST 使用结构化 JSON 格式，包含 `reason`（阻断原因）和 `missing`（缺失的必填项列表），以及可选的 `currentLength`、`requiredLength` 等字段。

#### Scenario: Checkbox Not Checked Blocking
- **GIVEN** 用户在 Page01 未勾选确认复选框
- **WHEN** 用户尝试点击"下一页"
- **THEN** 记录阻断事件：
```json
{
  "targetElement": "next_button",
  "eventType": "click_blocked",
  "value": "{\"reason\":\"checkbox_not_checked\",\"missing\":[\"P0.1_确认阅读\"]}"
}
```

#### Scenario: Input Too Short Blocking
- **GIVEN** 用户在 Page03 输入框中仅输入2个字符（要求≥5）
- **WHEN** 用户尝试点击"下一页"
- **THEN** 记录阻断事件：
```json
{
  "targetElement": "next_button",
  "eventType": "click_blocked",
  "value": "{\"reason\":\"input_too_short\",\"missing\":[\"P0.3_控制变量理由\"],\"currentLength\":2,\"requiredLength\":5}"
}
```

#### Scenario: No Selection Blocking
- **GIVEN** 用户在 Page05 未选择任何单选选项
- **WHEN** 用户尝试点击"下一页"
- **THEN** 记录阻断事件：
```json
{
  "targetElement": "next_button",
  "eventType": "click_blocked",
  "value": "{\"reason\":\"no_selection\",\"missing\":[\"P0.5_最小GSD焦距\"]}"
}
```

---

### Requirement: Auto Submit on Timeout
模块超时时 MUST 触发自动提交流程，记录完整的事件序列（timer_complete → auto_submit → page_exit → page_submit_success），并在 answerList 中为未回答的必填题填充占位符 `"超时未回答"`。

#### Scenario: Module Timeout Auto Submit
- **GIVEN** 用户在 Page03，模块计时器到期
- **WHEN** 系统触发自动提交
- **THEN** 记录事件序列：
  1. `timer_complete` (module, reason: task_timer_expired)
  2. `auto_submit` (module, reason: timer_expired, currentPage: "0.3")
  3. `page_exit` (page, 当前页面标识)
  4. `page_submit_success` (module, auto_submit: true)
- **AND** answerList 包含所有已完成页的答案（保留原 code）
- **AND** 未回答必填题填充 `"超时未回答"`（新增 code）

---

### Requirement: Flow Context Injection
每页 MUST 自动注入 flow_context 事件（code=2，紧跟 page_enter 之后），value 为 JSON 字符串包含：`flowId`（Flow 标识符）、`stepIndex`（子模块在 Flow 中的 0-based 位置）、`submoduleId`（子模块标识符）、`moduleName`（子模块显示名称）、`pageId`（当前页面标识符）。

#### Scenario: Flow Context for First Page
- **GIVEN** g8-drone-imaging 在 Flow 中的 stepIndex=0
- **WHEN** 用户进入 Page01（pageId="cover"）
- **THEN** 自动注入事件：
```json
{
  "code": 2,
  "targetElement": "module",
  "eventType": "flow_context",
  "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"cover\"}"
}
```

#### Scenario: Flow Context for Experiment Page
- **GIVEN** g8-drone-imaging 在 Flow 中的 stepIndex=0
- **WHEN** 用户进入 Page04（pageId="experiment_free"）
- **THEN** 自动注入事件：
```json
{
  "code": 2,
  "targetElement": "module",
  "eventType": "flow_context",
  "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"experiment_free\"}"
}
```

---

### Requirement: Answer List Constraints
answerList MUST 遵循以下约束：(1) 仅包含用户实际完成的答案（超时占位 `"超时未回答"` 除外）；(2) targetElement 使用格式 `P${pageNumber}_<业务ID>`；(3) code 从 1 开始递增，无重复；(4) 实验操作历史作为 JSON 字符串存储（双重转义）。

#### Scenario: Answer List with Text Input
- **GIVEN** 用户在 Page03 完成输入
- **WHEN** 提交 MarkObject
- **THEN** answerList 包含：
```json
{
  "code": 1,
  "targetElement": "P0.3_控制变量理由",
  "value": "为了保证实验的单一变量原则，需要控制其他条件一致"
}
```

#### Scenario: Answer List with Radio Selection
- **GIVEN** 用户在 Page05 选择选项 C
- **WHEN** 提交 MarkObject
- **THEN** answerList 包含：
```json
{
  "code": 1,
  "targetElement": "P0.5_最小GSD焦距",
  "value": "C"
}
```

#### Scenario: Answer List with Experiment History
- **GIVEN** 用户在 Page04 进行了多次实验拍照
- **WHEN** 提交 MarkObject
- **THEN** answerList 包含：
```json
{
  "code": 1,
  "targetElement": "P0.4_experiment_captures",
  "value": "[{\"height\":100,\"focal\":24,\"gsd\":2.50},{\"height\":200,\"focal\":50,\"gsd\":4.00}]"
}
```
- **AND** value 是 JSON 字符串（双重转义），而非 JSON 对象

#### Scenario: Answer List with Timeout Placeholder
- **GIVEN** 模块超时，用户未完成 Page05、Page06
- **WHEN** 系统自动提交
- **THEN** answerList 包含占位答案：
```json
[
  {
    "code": 1,
    "targetElement": "P0.1_确认阅读",
    "value": "已确认"
  },
  {
    "code": 2,
    "targetElement": "P0.3_控制变量理由",
    "value": "为了保证实验条件一致"
  },
  {
    "code": 3,
    "targetElement": "P0.5_最小GSD焦距",
    "value": "超时未回答"
  },
  {
    "code": 4,
    "targetElement": "P0.6_GSD变化趋势",
    "value": "超时未回答"
  }
]
```

---

## Validation

### Schema Compliance

所有 g8-drone-imaging MarkObject 必须通过 `@shared/services/submission/schema.ts` 校验：
- pageNumber: `^\d+\.\d+$`
- pageDesc: `^\[[\w-]+\/[\w-]+\/\d+\] .+$`
- targetElement (业务): `^P\d+\.\d+_.+$`
- eventType: 必须在 EventTypes 枚举中
- code: 从1递增，无重复，无跳号
- time: `YYYY-MM-DD HH:mm:ss` 格式
- value (结构化事件): 必须为 JSON 字符串

### Minimum Event Set

每页 MarkObject 必须包含：
- **基础事件**：page_enter (code=1) → flow_context (code=2) → ... → page_exit → page_submit_success (最后)
- **导航事件**：next_click 或等效导航事件
- **条件事件**：
  - 阻断场景：click_blocked（含 reason 和 missing）
  - 输入页：input_focus → input_change (≥1次) → input_blur
  - 选择页：radio_select 或 checkbox_check/uncheck
  - 计时页：timer_start → timer_stop/timer_complete
  - 实验页：simulation_operation 序列

### Sample Snapshots

所有样例快照位于：`openspec/changes/migrate-g8-drone-imaging-submission/modules/g8-drone-imaging-migration.md` § 2

**快照覆盖率**：
- 7 个正常场景（Page01-Page07 各1个）
- 7 个阻断场景（Page01, 03, 04, 05, 06, 07A, 07B）
- 1 个超时自动提交场景

---

## Implementation Notes

### Migration Checklist

详见 `openspec/changes/migrate-g8-drone-imaging-submission/tasks.md`

**关键任务**：
1. 接入统一提交管道 (`usePageSubmission` Hook)
2. 更新所有 targetElement 前缀（`P1_` → `P0.1_` 等）
3. 更新 pageNumber 编码（使用 `encodeCompositePageNum(stepIndex, subPageNum)`）
4. 补齐必需事件（flow_context, page_submit_success, click_blocked 等）
5. 生成 15 个快照文件用于测试验证
6. 配置 CI/Lint 守卫（禁止直连接口、禁止旧格式前缀、禁止未枚举事件）

### Breaking Changes

**不兼容旧格式**：
- 旧前缀 `P1_`, `P3_` 等 → 新前缀 `P0.1_`, `P0.3_` 等
- 简单 value 字符串 → 结构化 JSON 格式
- 缺失 flow_context/page_submit_success → 必需自动注入

**迁移策略**：
- 一次性迁移，不保留旧格式兼容层
- Schema 校验确保新格式合规
- 快照测试覆盖所有场景

---

## References

- 统一规范：`docs/submission-format-standard.md`
- 数据格式：`openspec/specs/data-format/spec.md`
- 提交流程：`openspec/specs/submission/spec.md`
- 迁移详情：`openspec/changes/migrate-g8-drone-imaging-submission/modules/g8-drone-imaging-migration.md`
