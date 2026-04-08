## 0. 准备工作（1天）
- [ ] 0.1 创建 Schema 定义文件（`src/shared/services/submission/schema.ts`）
- [ ] 0.2 创建 Lint 规则文件（`.eslintrc.submission-rules.json`）
- [ ] 0.3 创建快照测试模板目录（`src/modules/grade-7-tracking/__tests__/fixtures/`）
- [ ] 0.4 配置 CI 集成（快照测试、Schema 校验、Lint 守卫）

## 1. 接入统一提交
- [ ] 1.1 用新版 `usePageSubmission` 取代现有 `useDataLogger/buildMarkObject`，提供上下文/页面元数据/answers/operations，移除直连接口。
- [ ] 1.2 统一页码 `<stepIndex>.<subPageNum>`、`pageDesc` 前缀 `[grade-7-tracking/<stepIndex>/<pageNumber>] 标题`、`targetElement` 前缀 `P${pageNumber}_...`。

## 2. 高优先级页面迁移（P0，2天）
- [ ] 2.1 **Page_00_1_Precautions**（注意事项）
  - [ ] 接入 `usePageSubmission`
  - [ ] 补全事件：timer_start/timer_complete/auto_submit/click_blocked（含 missing）
  - [ ] 创建快照测试：`page-0.1-notice.snapshot.json`
- [ ] 2.2 **Page_08_Experiment**（模拟实验）
  - [ ] 接入 `usePageSubmission`
  - [ ] 补全事件：simulation_timing_started/simulation_run_result/simulation_operation
  - [ ] 实验历史记录迁移（value 为 JSON 字符串）
  - [ ] 创建快照测试：`page-0.9-experiment.snapshot.json`
- [ ] 2.3 **Page_05_Design**（方案设计）
  - [ ] 接入 `usePageSubmission`
  - [ ] 补全事件：input_focus/input_change/input_blur/radio_select/checkbox_check/click_blocked（含 missing）
  - [ ] 创建快照测试：`page-0.6-design.snapshot.json`、`page-0.6-design-blocked.snapshot.json`
## 3. 中优先级页面迁移（P1，3天）
- [ ] 3.1 **输入/选择页**（Page_06_Evaluation、Page_09-12_Analysis/Solution）
  - [ ] 接入 `usePageSubmission`
  - [ ] 补全输入事件链路：focus/change/delete/blur
  - [ ] 补全选择事件：radio_select/checkbox_*
  - [ ] 补全阻断事件：click_blocked（含 missing）
