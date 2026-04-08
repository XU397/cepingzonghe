## Why
- g8 pv-sand 实验模块提交/埋点未完全对齐统一 Schema，事件粒度（focus/change/next_click/阻断）与前缀/页码不一致，影响行为分析与后端入库。
- 需要迁移到统一提交入口和包装组件，确保数据格式与事件枚举一致。

## What Changes
- 接入新版 `usePageSubmission` + Schema，统一 `<stepIndex>.<subPageNum>` 页码、`P${pageNumber}_...` 目标前缀、flow_context 注入，移除直连/手写 code/时间。
- 补齐埋点：输入/选择 focus/change/blur/select_change，next_click，实验操作/结果，阻断 `click_blocked`。
- answerList 仅非空；超时写占位；快照/校验验证。

## Detailed Migration Plan
详见 [migration-pages-and-snapshots.md](./migration-pages-and-snapshots.md)，包含：

### 1. 迁移页清单（7个页面，subPageNum=1-7）
- `S.1 instructions_cover` - 任务封面，30秒倒计时 + 复选框确认（阻断校验）
- `S.2 background_notice` - 背景引入，5秒计时自动通过
- `S.3 experiment_design` - 实验方案设计，输入≥10字符（阻断校验）
- `S.4 tutorial_simulation` - 模拟操作指引，需完成至少1次实验（阻断校验）
- `S.5 experiment_task1` - 实验探究-1，单选题 + 实验操作（阻断校验）
- `S.6 experiment_task2` - 实验探究-2，多选题 + 实验操作（阻断校验）
- `S.7 conclusion_analysis` - 结论分析，单选 + 输入≥10字符（阻断校验）

**说明**：`S` 代表 stepIndex（子模块在 Flow 中的位置，0-based）；样例快照假设 stepIndex=0，即 pageNumber 为 0.1-0.7。

### 2. 样例快照（6个典型场景，假设 stepIndex=0）
- **计时手动提交页**: 0.1 (subPageNum=1) instructions_cover - timer_start/complete、checkbox_check、next_click（用户手动点击）
- **计时自动提交页**: 0.2 (subPageNum=2) background_notice - timer_start/complete、auto_submit（无 next_click）
- **输入完整链路页**: 0.3 (subPageNum=3) experiment_design - focus/change/delete/blur，含 `{prev,next,prevLength,nextLength}` 快照
- **实验操作页**: 0.5 (subPageNum=5) experiment_task1 - simulation_operation/timing_started/run_result、radio_select，实验历史存为 Answer JSON
- **阻断校验页**: 0.3 (subPageNum=3) experiment_design - click_blocked 含 `{reason,missing[],timestamp}`
- **多选题页**: 0.6 (subPageNum=6) experiment_task2 - checkbox_check/uncheck，答案为 JSON 数组字符串

### 3. 验证计划
- **Schema 校验**: pageNumber `^\d+\.\d+$`、pageDesc/targetElement 前缀、事件枚举、code 连续性、时间格式、answerList 无空值
- **最小事件集合**: page_enter/exit/next_click + 输入 focus/change/blur + 选择 radio_select/checkbox_* + 实验 simulation_* + 阻断 click_blocked
- **Lint 守卫**: 禁止直连 `/stu/saveHcMark`、禁止旧前缀 `M*_`、禁止手写 code/time、禁止绕过 usePageSubmission
- **测试覆盖**: 单元测试（Schema 合规）、E2E（完整流程/阻断场景）、快照测试（5个基线）
- **兼容性**: 无历史数据，无需迁移脚本

## Impact
- 规格引用：`openspec/specs/submission`、`openspec/specs/data-format`。
- 代码影响：模块页面提交/埋点、上下文集成、测试。
- 风险：**BREAKING**（前缀/页码/事件变更；旧接口禁用），需 Schema + 快照验证。
