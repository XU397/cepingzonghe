# data-format.MODIFIED

## Summary
扩展统一数据格式规范以支持 g8-drone-imaging 子模块的事件类型、值格式和验证规则。

## MODIFIED Requirements

### Requirement: Event Type Extensions
MUST 新增以下事件类型以支持模拟实验和阅读计时场景：`simulation_operation`（记录实验模拟器交互操作）和 `reading_complete`（记录强制阅读计时完成）。

#### Scenario: Simulation Operation Event
- **WHEN** 用户在实验模拟器中进行交互操作（高度选择、焦距调整、拍照、重置等）
- **THEN** 使用 eventType `simulation_operation`
- **AND** value 格式为 JSON 字符串 `{"action": "<操作类型>", "value": <参数值>}` 或描述性字符串 `"capture_h<height>_f<focal>_gsd<value>"` 或 `"reset_experiment"`
- **AND** 适用于 Page04（实验页）、Page05/06（可选实验操作）

#### Scenario: Reading Complete Event
- **WHEN** 用户完成强制阅读计时（用于背景知识页等）
- **THEN** 使用 eventType `reading_complete`
- **AND** value 为页面标识符字符串（如 `"Page02_Background"`）
- **AND** 适用于 Page02（背景知识页）

---

### Requirement: Structured Value Formats
以下事件类型的 value MUST 使用标准化 JSON 格式，替代简单字符串或非标准格式：`timer_start`、`timer_stop`/`timer_complete`、`input_change`、`input_delete`、`click_blocked`、`auto_submit`。

#### Scenario: Timer Start Value Format
- **WHEN** 记录 timer_start 事件
- **THEN** value 必须为 JSON 字符串 `{"duration": <秒数>, "unit": "seconds"}`
- **AND** 示例：`{"targetElement": "P0.1_countdown", "eventType": "timer_start", "value": "{\"duration\":40,\"unit\":\"seconds\"}"}`

#### Scenario: Timer Stop/Complete Value Format
- **WHEN** 记录 timer_stop 或 timer_complete 事件
- **THEN** value 必须为 JSON 字符串 `{"reason": "<完成原因>", "elapsed": <实际耗时（秒或毫秒）>}`
- **AND** 示例：`{"targetElement": "P0.1_countdown", "eventType": "timer_stop", "value": "{\"reason\":\"countdown_finished\",\"elapsed\":40}"}`

#### Scenario: Input Change Value Format
- **WHEN** 记录 input_change 事件
- **THEN** value 必须为 JSON 字符串 `{"prev": "<修改前内容>", "next": "<修改后内容>"}`
- **AND** 示例：`{"targetElement": "P0.3_控制变量理由", "eventType": "input_change", "value": "{\"prev\":\"\",\"next\":\"为了保证实验\"}"}`

#### Scenario: Input Delete Value Format
- **WHEN** 记录 input_delete 事件
- **THEN** value 必须为 JSON 字符串 `{"action": "delete", "prevLength": <删除前长度>, "nextLength": <删除后长度>}`
- **AND** 示例：`{"targetElement": "P0.3_控制变量理由", "eventType": "input_delete", "value": "{\"action\":\"delete\",\"prevLength\":10,\"nextLength\":8}"}`

#### Scenario: Click Blocked Value Format
- **WHEN** 记录 click_blocked 事件
- **THEN** value 必须为 JSON 字符串包含 `{"reason": "<阻断原因>", "missing": ["<缺失项1>", "<缺失项2>"]}`
- **AND** 可选字段：`currentLength`, `requiredLength`
- **AND** 示例：`{"targetElement": "next_button", "eventType": "click_blocked", "value": "{\"reason\":\"input_too_short\",\"missing\":[\"P0.3_控制变量理由\"],\"currentLength\":2,\"requiredLength\":5}"}`

#### Scenario: Auto Submit Value Format
- **WHEN** 记录 auto_submit 事件
- **THEN** value 必须为 JSON 字符串 `{"reason": "<提交原因>", "currentPage": "<当前页码>"}`
- **AND** 示例：`{"targetElement": "module", "eventType": "auto_submit", "value": "{\"reason\":\"timer_expired\",\"currentPage\":\"0.3\"}"}`

---

### Requirement: Page Entry Event Extensions
page_enter 事件 MUST 包含 pageId 字段（与 value 字段并列），用于 Flow 上下文关联，便于跨页面查询和分析。

#### Scenario: Page Entry with pageId
- **WHEN** 用户进入任意页面并记录 page_enter 事件
- **THEN** 事件结构必须包含 pageId 字段
- **AND** 示例：
```json
{
  "code": 1,
  "targetElement": "page",
  "eventType": "page_enter",
  "value": "Page01_Cover",
  "time": "2025-01-15 10:00:00",
  "pageId": "cover"
}
```

---

### Requirement: Flow Context Event Structure
新增 flow_context 事件类型，用于记录子模块在 Flow 中的上下文信息。该事件 MUST 为每页第 2 个事件（紧跟 page_enter 之后），targetElement 为 `"module"`，value 为包含 flowId、stepIndex、submoduleId、moduleName、pageId 的 JSON 字符串。

#### Scenario: Flow Context for Submodule Page
- **GIVEN** g8-drone-imaging 在 Flow 中为第 1 个子模块（stepIndex=0）
- **WHEN** 用户进入 Page03（pageId="hypothesis"）
- **THEN** 自动注入 flow_context 事件（code=2）：
```json
{
  "code": 2,
  "targetElement": "module",
  "eventType": "flow_context",
  "value": "{\"flowId\":\"g8-assessment-flow\",\"stepIndex\":0,\"submoduleId\":\"g8-drone-imaging\",\"moduleName\":\"无人机航拍交互课堂\",\"pageId\":\"hypothesis\"}",
  "time": "2025-01-15 10:02:00"
}
```

---

### Requirement: Page Submit Success Event Structure
page_submit_success 事件的 value MUST 为 JSON 字符串，包含 `duration_ms`（页面停留时长）、可选的 `auto_submit`（是否自动提交）、`pageNumber`、`pageDesc`、`channel`（提交渠道）等字段。

#### Scenario: Normal Page Submit
- **GIVEN** 用户在 Page01 停留 45 秒
- **WHEN** 用户点击"下一页"成功提交
- **THEN** 记录 page_submit_success 事件：
```json
{
  "code": 8,
  "targetElement": "module",
  "eventType": "page_submit_success",
  "value": "{\"duration_ms\":45000,\"channel\":\"flow\"}",
  "time": "2025-01-15 10:00:45"
}
```

#### Scenario: Auto Submit on Timeout
- **GIVEN** 模块计时器到期触发自动提交
- **WHEN** 系统提交当前页面
- **THEN** 记录 page_submit_success 事件：
```json
{
  "code": 7,
  "targetElement": "module",
  "eventType": "page_submit_success",
  "value": "{\"duration_ms\":1200000,\"auto_submit\":true}",
  "time": "2025-01-15 10:20:10"
}
```

---

### Requirement: Answer Value Formats
answerList 中的 value 字段 MUST 遵循以下格式约束：文本输入为字符串直接值，单选/复选为选项值字符串，实验历史为 JSON 数组的字符串表示（双重转义），超时占位为固定字符串 `"超时未回答"`。

#### Scenario: Text Input Answer
- **WHEN** 用户完成文本输入并提交
- **THEN** value 为字符串直接值
- **AND** 示例：`{"targetElement": "P0.3_控制变量理由", "value": "为了保证实验的单一变量原则，需要控制其他条件一致"}`

#### Scenario: Radio/Checkbox Answer
- **WHEN** 用户选择单选或复选选项并提交
- **THEN** value 为选项值字符串
- **AND** 示例：`{"targetElement": "P0.5_最小GSD焦距", "value": "C"}` 或 `{"targetElement": "P0.1_确认阅读", "value": "已确认"}`

#### Scenario: Experiment History Answer
- **WHEN** 用户完成实验操作并提交实验历史
- **THEN** value 为 JSON 数组的字符串表示（双重转义）
- **AND** 示例：`{"targetElement": "P0.4_experiment_captures", "value": "[{\"height\":100,\"focal\":24,\"gsd\":2.50},{\"height\":200,\"focal\":50,\"gsd\":4.00}]"}`
- **AND** 注意 value 本身是字符串类型，内容为 JSON 数组的字符串表示

#### Scenario: Timeout Placeholder Answer
- **WHEN** 用户超时未完成必填题
- **THEN** value 为固定字符串 `"超时未回答"`
- **AND** 示例：`{"targetElement": "P0.5_最小GSD焦距", "value": "超时未回答"}`

---

### Requirement: UTF-8 Encoding Requirement
所有 MarkObject 的字符串字段 MUST 使用 UTF-8 编码，确保中文字符正确显示，不允许出现乱码（如 `"已确�?"`, `"变�?"` 等）。

#### Scenario: Chinese Characters in Values
- **GIVEN** 用户输入中文文本或选择中文选项
- **WHEN** 生成 MarkObject
- **THEN** 所有中文字符必须正确编码，无乱码
- **AND** 使用 UTF-8 解码器验证所有字符串字段可正确解析

---

### Requirement: Code Sequence Integrity
每个 MarkObject 的 operationList 和 answerList 中的 code MUST 满足：(1) 起始值从 1 开始；(2) 递增性：严格递增（每个 code 比前一个 +1）；(3) 唯一性：无重复值；(4) 连续性：无跳号。

#### Scenario: Valid Code Sequence in operationList
- **GIVEN** operationList 包含 8 个事件
- **WHEN** 验证 code 序列
- **THEN** code 依次为：1, 2, 3, 4, 5, 6, 7, 8（无重复、无跳号）

#### Scenario: Invalid Code Sequence - Duplicate
- **GIVEN** operationList 中存在两个 code=3 的事件
- **WHEN** Schema 校验
- **THEN** 验证失败，错误信息："Duplicate code value: 3"

#### Scenario: Invalid Code Sequence - Gap
- **GIVEN** operationList 的 code 序列为：1, 2, 3, 5, 6（缺少 4）
- **WHEN** Schema 校验
- **THEN** 验证失败，错误信息："Code gap detected: missing 4"

---

### Requirement: Time Format Standardization
所有事件的 time 字段 MUST 使用格式：`YYYY-MM-DD HH:mm:ss`（24小时制），不允许使用 ISO 8601 或其他格式。

#### Scenario: Valid Time Format
- **WHEN** 记录任意事件的 time 字段
- **THEN** 必须使用格式 `YYYY-MM-DD HH:mm:ss`
- **AND** 正确示例：`"2025-01-15 10:00:00"`, `"2025-01-15 23:59:59"`
- **AND** 错误示例：`"2025-01-15T10:00:00Z"`, `"01/15/2025 10:00 AM"`

---

## Validation Rules

### Schema Validation

所有 g8-drone-imaging MarkObject 必须通过以下校验：

#### pageNumber
- **Regex:** `^\d+\.\d+$`
- **Valid Examples:** `"0.1"`, `"0.7"`, `"2.3"`
- **Invalid Examples:** `"1"`, `"M1"`, `"1:1"`, `"0.1.0"`

#### pageDesc
- **Regex:** `^\[[\w-]+\/[\w-]+\/\d+\] .+$`
- **Valid Examples:**
  - `"[g8-assessment-flow/g8-drone-imaging/0] 封面与注意事项确认"`
  - `"[g8-assessment-flow/g8-drone-imaging/2] 问题1-控制变量理由"`
- **Invalid Examples:**
  - `"[g8-drone-imaging/step0] 封面确认"` (缺少 flowId)
  - `"[g8-assessment-flow/g8-drone-imaging/step0] 封面确认"` ("step" 前缀不允许)
  - `"封面确认"` (缺少前缀)

#### targetElement (业务元素)
- **Regex:** `^P\d+\.\d+_.+$`
- **Valid Examples:** `"P0.1_确认阅读"`, `"P0.3_控制变量理由"`, `"P2.5_最小GSD焦距"`
- **Invalid Examples:**
  - `"P1_确认阅读"` (旧格式，缺少小数点)
  - `"P0.1确认阅读"` (缺少下划线)
  - `"0.1_确认阅读"` (缺少 P 前缀)

#### targetElement (系统元素)
- **Allowed Values:** `"page"`, `"module"`, `"next_button"`, `"capture_button"`, `"reset_button"`, `"height_selector"`, `"focal_selector"` 等
- **Note:** 系统元素不使用 P 前缀

#### eventType
- **Constraint:** 必须在 `EventTypes` 枚举中定义
- **Forbidden:** 字符串字面量（如 `"click"`, `"input_change"`）
- **Enforcement:** TypeScript 编译器 + ESLint 规则

---

## Sample Data

所有 g8-drone-imaging 样例快照位于：
- **文档路径**：`openspec/changes/migrate-g8-drone-imaging-submission/modules/g8-drone-imaging-migration.md` § 2
- **快照数量**：15 个完整 MarkObject（7 正常 + 7 阻断 + 1 超时）
- **覆盖场景**：
  - 计时页（Page01/Page02）
  - 输入页（Page03/Page07）
  - 实验页（Page04）
  - 问卷页（Page05/Page06）
  - 复合问卷页（Page07）
  - 超时自动提交

---

## Breaking Changes

### Incompatible with Legacy Format

1. **targetElement 前缀**：`P1_` → `P0.1_`（需更新所有业务元素标识符）
2. **value 格式**：简单字符串 → 结构化 JSON（timer/input/click_blocked 等事件）
3. **必需事件**：flow_context, page_submit_success（旧实现可能缺失）
4. **pageDesc 格式**：新增 `[flowId/submoduleId/stepIndex]` 前缀要求

### Migration Strategy

- **一次性迁移**：不保留旧格式兼容层
- **Schema 强制**：所有提交必须通过 Schema 校验，否则拒绝
- **快照测试**：15 个样例快照覆盖所有场景，确保格式正确
- **CI 守卫**：ESLint + 自定义规则防止旧格式代码提交

---

## Implementation Guidance

### Event Logging Best Practices

1. **结构化 value**：所有复杂事件使用 JSON 格式（timer, input_change, click_blocked 等）
2. **code 连续性**：按事件发生顺序递增分配 code，确保无重复、无跳号
3. **time 精度**：使用秒级精度（`YYYY-MM-DD HH:mm:ss`），避免毫秒级混淆
4. **UTF-8 编码**：确保所有中文字符正确编码，避免乱码

### Answer Collection Best Practices

1. **仅非空答案**：空值不上报（超时占位除外）
2. **实验历史**：作为 JSON 字符串存储（注意双重转义）
3. **超时占位**：未完成必填题填充 `"超时未回答"`
4. **code 递增**：answerList 的 code 独立递增，从 1 开始

---

## References

- 统一规范：`docs/submission-format-standard.md`
- 提交流程：`openspec/specs/submission/spec.md`
- 迁移详情：`openspec/changes/migrate-g8-drone-imaging-submission/modules/g8-drone-imaging-migration.md`
- 事件类型定义：`src/shared/services/submission/eventTypes.ts`
