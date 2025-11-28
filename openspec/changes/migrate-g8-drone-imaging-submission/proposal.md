## Why
- g8-drone-imaging 当前有自写提交/前缀，未完全遵循新页码/事件/前缀规范，行为轨迹与统一 Schema 不一致。
- 需要接入统一提交入口与包装组件，补齐输入/点击/阻断/下一页/实验操作的全量轨迹，防止数据异构。

## What Changes
- 切换到新版 `usePageSubmission` + Schema，统一 `<stepIndex>.<subPageNum>` 页码、`P${pageNumber}_...` 目标前缀、flow_context 自动注入。
- 使用包装组件补齐 focus/change/blur/select_change、next_click、实验操作/结果、阻断 `click_blocked`（含 missing）。
- answerList 仅保留非空答案；超时写占位；增加快照/校验覆盖。

## Migration Scope

### 页面总览 (7页)
假设 g8-drone-imaging 是 Flow 中第1个子模块 (stepIndex=0):
1. **Page01 (0.1)** - 封面确认: 40秒计时 + 复选框确认
2. **Page02 (0.2)** - 背景知识: 5秒阅读计时,自动完成
3. **Page03 (0.3)** - 问题1: textarea输入(≥5字符)
4. **Page04 (0.4)** - 自由实验: 模拟器交互,≥1次拍照
5. **Page05 (0.5)** - 问题2: 焦距分析单选 + 可选实验
6. **Page06 (0.6)** - 问题3: 高度分析单选 + 可选实验
7. **Page07 (0.7)** - 问题4: 单选 + textarea(≥5字符) + 图表展示

**注:**
- **pageNumber** = `<stepIndex>.<subPageNum>`，其中 stepIndex 为子模块在 Flow 中的顺序(0-based)，subPageNum 为模块内页面编号(1-based)。实际部署时，pageNumber 根据子模块在 Flow 中的位置动态计算（本文档假设 stepIndex=0 用于示例）。
- **pageDesc** 格式为 `[{flowId}/{submoduleId}/{stepIndex}] {页面标题}`，如 `[g8-assessment-flow/g8-drone-imaging/0] 封面与注意事项确认`（注：stepIndex 直接使用数字，不带 "step" 前缀）。
- **targetElement** 前缀格式为 `P${pageNumber}_<业务ID>`，如 `P0.1_确认阅读`（对应 pageNumber=0.1 的业务元素）。

### 目标元素清单
- `P0.1_确认阅读` (checkbox)
- `P0.3_控制变量理由` (textarea)
- `P0.4_experiment_captures` (实验历史JSON)
- `P0.5_最小GSD焦距` (radio)
- `P0.6_GSD变化趋势` (radio)
- `P0.7_优先调整因素` (radio)
- `P0.7_理由说明` (textarea)

### 典型场景样例快照
详见 [modules/g8-drone-imaging-migration.md](./modules/g8-drone-imaging-migration.md) § 2（包含 15 个完整 MarkObject 样例）:

**计时链路（Page01/Page02）:**
- **Page01 倒计时:** `timer_start` (duration:40秒) → 等待 → `timer_stop` (reason: countdown_finished) → 复选框启用 → `checkbox_check` → `next_click` → 正常提交
- **Page01 阻断:** 未勾选复选框 → `click_blocked` (missing: ["P0.1_确认阅读"]) → 阻止导航
- **Page02 阅读计时:** `timer_start` (duration:5秒) → `timer_stop` → `reading_complete` → `next_click` → 自动完成
- **模块超时:** `timer_complete` (task_timer_expired) → `auto_submit` (timer_expired) → 汇总已完成答案 + 未答题占位 ("超时未回答")

**输入页 (Page03/Page07):**
- `input_focus` (初始内容) → `input_change` (JSON 格式: {"prev":"","next":"为了"}) → `input_blur` (最终内容) → 校验 ≥5字符 → `next_click` 或 `click_blocked` (input_too_short)

**实验页 (Page04):**
- `simulation_operation` 序列: 高度选择 (set_height) / 焦距调整 (set_focal) / 拍照 (capture_h100_f24_gsd2.50) / 重置 (reset_experiment)
- 阻断: 无拍照记录 → `click_blocked` (no_experiment_capture, missing: ["experiment_captures"])

**问卷页 (Page05/Page06/Page07):**
- **选择事件策略:** 使用 `radio_select` (单选框) 和 `checkbox_check`/`uncheck` (复选框)，NOT `select_change` (下拉框)
- `radio_select` (targetElement: "P0.5_最小GSD焦距", value: "C") → `next_click` 或 `click_blocked` (no_selection)

**自动注入事件:**
- **flow_context:** 每页自动注入 (code=2)，value 为 JSON 含 `{flowId, stepIndex, submoduleId, moduleName, pageId}`
- **page_submit_success:** 提交成功后自动追加 (最后一个 code)，value 含 `{duration_ms, auto_submit, pageNumber, pageDesc}`

## Impact
- 规格引用：`openspec/specs/submission`、`openspec/specs/data-format`。
- 代码影响：模块页面提交/埋点、上下文集成、测试。
- 风险：**BREAKING**（页码/前缀/事件集变更；旧接口禁用），需 Schema + 快照验证。

## Validation Requirements
- **Schema 校验:**
  - pageNumber 格式: `^\d+\.\d+$`（如 "0.1", "0.7"）
  - pageDesc 格式: `^\[[\w-]+\/[\w-]+\/\d+\] .+$`（如 "[g8-assessment-flow/g8-drone-imaging/0] 封面与注意事项确认"，注：stepIndex 为数字，不带 "step" 前缀）
  - targetElement 前缀: `^P\d+\.\d+_.+$`（业务元素）或系统元素 (page/module/next_button 等)
  - eventType 枚举: 必须在 EventTypes 中，禁止字符串字面量
  - UTF-8 编码: 所有中文字符正确显示（无乱码）
  - value 结构化: timer/input_change/delete/click_blocked 使用 JSON 格式
- **最小事件集合（每页必需）:**
  - 基础: `page_enter` (code=1) → `flow_context` (code=2) → ... → `page_exit` → `page_submit_success` (最后)
  - 导航: `next_click` 或等效事件
  - 阻断: `click_blocked` (含 reason 和 missing 数组)
  - 条件: 输入序列 (focus/change/blur) / 选择 (radio_select/checkbox_check) / 计时 (timer_start/stop) / 实验 (simulation_operation)
- **CI/Lint 守卫:**
  - 禁止直连 `/stu/saveHcMark` (仅通过 `usePageSubmission`)
  - 禁止旧前缀 `P1_`, `P3_` 等（应为 `P0.1_`, `P0.3_`）
  - 禁止未枚举事件类型（字符串字面量）
- **快照测试:**
  - 每页至少 1 正常场景 + 1 阻断场景（若有校验）
  - 15 个快照文件：7 正常 + 7 阻断 + 1 超时
  - 所有快照通过 Schema 和最小事件集合检查
  - 参考 migration.md § 2-4 样例和校验规则

## References
- 统一规范: [docs/submission-format-standard.md](../../docs/submission-format-standard.md)
- 迁移详情: [modules/g8-drone-imaging-migration.md](./modules/g8-drone-imaging-migration.md)
- 事件规范: [specs/data-format/spec.md](../update-unified-submission-pipeline/specs/data-format/spec.md)
- 提交流程: [specs/submission/spec.md](../update-unified-submission-pipeline/specs/submission/spec.md)
