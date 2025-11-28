## Why
- 7 年级问卷模块仍使用旧提交逻辑与前缀，未采用统一事件/页码/前缀；输入/阻断/下一页的轨迹不全，难以行为分析。
- 需要统一到新版提交管道，保证问卷选项与操作轨迹格式一致，避免后端数据异构。

## What Changes
- 接入新版 `usePageSubmission` + Schema，统一页码 `<stepIndex>.<subPageNum>`、`P${pageNumber}_...` 目标前缀、flow_context 注入。
- 问卷交互使用包装组件：记录 focus/change/blur/select_change，下一页记录 `next_click`，阻断必写 `click_blocked` 含 missing 列表。
- answerList 仅保留非空答案（选项文本或映射值），超时写占位；提交前快照验证。

## Migration Scope

**⚠️ 重要说明**：pageNumber 格式为 `<stepIndex>.<subPageNum>`，其中 stepIndex 由 Flow 配置动态决定（非固定值），subPageNum 为子模块内部固定页码（0-8）。以下示例默认使用 stepIndex=0（问卷作为 Flow 第一步的最常见场景）。

- **页面总数**：9页（仅 g7-questionnaire 子模块，子模块内 subPageNum 从 0 开始编号；实验部分已拆分，独立 Flow 配置）
- **高优先级页面**（P0）：
  - Page_20_Questionnaire_Intro（问卷说明，启动10分钟计时器，示例 pageNumber: `<stepIndex>.0` 如 0.0）
  - Page_21_Curiosity_Questions（好奇心问卷，9题 likert4，示例 pageNumber: `<stepIndex>.1` 如 0.1）
  - Page_26_School_Activities（校内活动，7题 frequency5，阻断校验，示例 pageNumber: `<stepIndex>.6` 如 0.6）
  - Page_28_Effort_Submit（努力评估，3题 scale10，超时自动提交，示例 pageNumber: `<stepIndex>.8` 如 0.8）
- **详细清单**：见 [migration-details.md](./migration-details.md#一迁移页清单)

## Sample Snapshots

**本节所有样例默认使用 stepIndex=0**（问卷作为 Flow 第一步的最常见场景）。

提供 **4个典型页面** 的完整 MarkObject 样例（见 migration-details.md）：
1. **Page_20_Questionnaire_Intro**（问卷说明，pageNumber: 0.0）- timer_start/flow_context/next_click
2. **Page_21_Curiosity_Questions**（好奇心问卷，pageNumber: 0.1）- focus/blur/select_change 完整流程
3. **Page_26_School_Activities**（校内活动，pageNumber: 0.6）- click_blocked 含 missing 阻断恢复
4. **Page_28_Effort_Submit**（努力评估，pageNumber: 0.8）- timer_complete/auto_submit 超时提交

样例详见 [migration-details.md](./migration-details.md#二样例快照期望-markobject)

## Impact
- 规格引用：`openspec/specs/submission`、`openspec/specs/data-format`。
- 代码影响：问卷页面/组件埋点、提交入口、上下文获取、测试。
- 风险：**BREAKING**（事件集/前缀/页码切换；旧接口禁用），需快照与 Schema 验证。
- 后端兼容性：后端 MUST 同时支持旧格式（`20-28`）和新格式（`<stepIndex>.<subPageNum>`、`P${pageNumber}_*`）
- **stepIndex 动态性要求**：禁止硬编码 stepIndex，必须从 Flow 上下文动态获取；Schema 校验必须支持任意 stepIndex；需 stepIndex 一致性校验。详见 [migration-details.md](./migration-details.md#零重要前提flow-体系下的两层编码)
- 时间线：预计 **2周**（10个工作日）完成迁移与验证
