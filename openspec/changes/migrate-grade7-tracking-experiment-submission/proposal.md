## Why
- 7 年级追踪实验模块沿用自建日志与页码/前缀（如 `Page_*`、`M*`），未套用统一提交入口与事件枚举，输入/阻断/下一页等行为缺失。
- 行为分析需要完整实验操作、参数调整、计时与提交链路，现格式难以与新规范数据对齐。

## What Changes
- 接入新版 `usePageSubmission` + Schema，统一页码/前缀/flow_context 注入，移除旧 FormData/手写 code/时间。
- 补齐实验页事件：计时 start/stop/complete、参数调整、运行结果、阻断、next_click；输入/选择控件记录 focus/change/blur。
- 清理并重建 answerList，仅保留非空答案；超时写占位。
- 提供快照测试与 lint 守卫，防止回退到旧前缀/事件。

## Migration Scope

**⚠️ 重要说明**：pageNumber 格式为 `<stepIndex>.<subPageNum>`，其中 stepIndex 由 Flow 配置动态决定（非固定值），subPageNum 为子模块内部固定页码（1-14）。以下示例默认使用 stepIndex=0（实验作为 Flow 第一步的最常见场景）。

- **页面总数**：14页（仅 g7-tracking-experiment 子模块，子模块内 subPageNum 从 1 开始编号；问卷与完成页已拆分，独立 Flow 配置）
- **高优先级页面**（P0）：
  - Page_00_1_Precautions（注意事项，40秒计时自动提交，示例 pageNumber: `<stepIndex>.1` 如 0.1）
  - Page_08_Experiment（模拟实验，复杂实验操作，示例 pageNumber: `<stepIndex>.9` 如 0.9）
  - Page_05_Design（方案设计，典型输入页，示例 pageNumber: `<stepIndex>.6` 如 0.6）
- **详细清单**：见 [migration-details.md](./migration-details.md#一迁移页清单)

## Sample Snapshots

**本节所有样例默认使用 stepIndex=0**（实验作为 Flow 第一步的最常见场景）。

提供 **3个典型页面** 的完整 MarkObject 样例（见 migration-details.md）：
1. **Page_00_1_Precautions**（计时自动提交，pageNumber: 0.1）- timer_start/timer_complete/auto_submit/click_blocked
2. **Page_05_Design**（输入校验阻断，pageNumber: 0.6）- focus/change/blur/click_blocked 含 missing
3. **Page_08_Experiment**（实验操作，pageNumber: 0.9）- simulation_timing_started/simulation_run_result/实验历史记录

样例详见 [migration-details.md](./migration-details.md#二样例快照期望-markobject)

## Impact
- 规格引用：`openspec/specs/submission`、`openspec/specs/data-format`。
- 代码影响：追踪实验页面的埋点/提交逻辑、上下文/计时器集成、测试快照。
- 风险：**BREAKING**（前缀/页码/事件集变更；提交通道切换），需验证历史重放与 Schema 通过。
- 后端兼容性：后端 MUST 同时支持旧格式（`M*`、`Page_*`）和新格式（`<stepIndex>.<subPageNum>`、`P${pageNumber}_*`）
- **stepIndex 动态性要求**：禁止硬编码 stepIndex，必须从 Flow 上下文动态获取；Schema 校验必须支持任意 stepIndex；需 stepIndex 一致性校验。详见 [migration-details.md](./migration-details.md#零重要前提flow-体系下的两层编码)
- 时间线：预计 **2周**（10个工作日）完成迁移与验证
