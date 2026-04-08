## 0. 快速参考：逐页必需事件清单

| 页面 | pageNumber | 必需事件类型 | 必需 Answer | 阻断 missing 值 |
|------|------------|-------------|------------|----------------|
| page_00_notice | `{stepIndex}.1` | page_enter, checkbox_check/uncheck, next_click, page_exit, flow_context, page_submit_success | 无 | `['倒计时未结束']` 或 `['注意事项确认']` |
| page_01_intro | `{stepIndex}.2` | page_enter, next_click, page_exit, flow_context, page_submit_success | 无 | 无阻断 |
| page_02_step_q1 | `{stepIndex}.3` | page_enter, input_focus, input_change, input_blur, (可选)input_delete, next_click, page_exit, flow_context, page_submit_success | P{stepIndex}.3_Q1 | `['Q1_控制变量原因']` |
| page_03_sim_exp | `{stepIndex}.4` | page_enter, simulation_operation, simulation_timing_started, simulation_run_result, next_click, page_exit, flow_context, page_submit_success | P{stepIndex}.4_实验历史 (JSON) | `['未完成实验操作']` |
| page_04_q2_data | `{stepIndex}.5` | page_enter, radio_select, next_click, page_exit, flow_context, page_submit_success | P{stepIndex}.5_Q2 | `['Q2_抑制作用浓度']` |
| page_05_q3_trend | `{stepIndex}.6` | page_enter, radio_select, next_click, page_exit, flow_context, page_submit_success | P{stepIndex}.6_Q3 | `['Q3_发芽率趋势']` |
| page_06_q4_conc | `{stepIndex}.7` | page_enter, radio_select (Q4a), input_focus/change/blur (Q4b), next_click, page_exit, flow_context, page_submit_success | P{stepIndex}.7_Q4a, P{stepIndex}.7_Q4b | `['Q4a_菟丝子有效性']` 和/或 `['Q4b_结论理由']` |

**说明**:
- **flow_context** 和 **page_submit_success** 由提交层自动注入，无需手写
- **timer_complete** + **auto_submit** 仅在超时场景由统一 timer 触发
- **page_00_notice 倒计时为本地逻辑**，不产生 timer_start/complete 事件

---

## 0.1 快照文件清单与校验标准

### 必需快照文件

| 快照文件路径 | 对应页面 | 基准来源 | 关键校验项 |
|-------------|---------|---------|-----------|
| `tests/modules/g8-mikania-experiment/snapshots/page_00_notice.json` | page_00_notice | design.md 样例1 | ✓ pageNumber格式 `{stepIndex}.1`<br>✓ checkbox_check事件<br>✓ NO timer_start/complete<br>✓ answerList为空<br>✓ flow_context自动注入<br>✓ page_submit_success自动注入 |
| `tests/modules/g8-mikania-experiment/snapshots/page_00_notice_blocked.json` | page_00_notice阻断 | design.md 阻断场景 | ✓ click_blocked含missing列表<br>✓ missing值: `['倒计时未结束','注意事项确认']` |
| `tests/modules/g8-mikania-experiment/snapshots/page_02_step_q1.json` | page_02_step_q1 | design.md 样例2 | ✓ input_focus/change/delete/blur完整链<br>✓ input_change含 `{prev,next}`<br>✓ targetElement前缀 `P{stepIndex}.3_`<br>✓ answerList仅含最终答案 |
| `tests/modules/g8-mikania-experiment/snapshots/page_02_step_q1_blocked.json` | page_02_step_q1阻断 | design.md 阻断场景 | ✓ click_blocked含missing: `['Q1_控制变量原因']`<br>✓ 输入<5字符被阻断 |
| `tests/modules/g8-mikania-experiment/snapshots/page_03_sim_exp.json` | page_03_sim_exp | design.md 样例3 | ✓ simulation_operation完整<br>✓ simulation_timing_started含duration_ms<br>✓ simulation_run_result含完整数据<br>✓ 实验历史存为Answer(JSON字符串) |
| `tests/modules/g8-mikania-experiment/snapshots/page_03_sim_exp_blocked.json` | page_03_sim_exp阻断 | design.md 阻断场景 | ✓ click_blocked含missing: `['未完成实验操作']` |
| `tests/modules/g8-mikania-experiment/snapshots/page_04_q2_data.json` | page_04_q2_data | design.md 样例4 | ✓ radio_select事件<br>✓ targetElement前缀 `P{stepIndex}.5_`<br>✓ answerList仅含最终选中项 |

### Schema 校验检查清单

每个快照必须通过以下校验:

- [ ] **pageNumber格式**: 匹配正则 `^\d+\.\d+$`（如 `1.3`, `0.5`）
- [ ] **pageDesc格式**: 含Flow前缀 `^\[.*\] ` 或纯标题（无Flow时）
- [ ] **targetElement前缀**: 所有业务元素以 `P{pageNumber}_` 开头
- [ ] **eventType枚举**: 所有事件类型在允许列表内
  - 页面: `page_enter`, `page_exit`
  - 导航: `next_click`, `click_blocked`
  - 输入: `input_focus`, `input_change`, `input_blur`, `input_delete`
  - 选择: `radio_select`, `checkbox_check`, `checkbox_uncheck`
  - 实验: `simulation_operation`, `simulation_timing_started`, `simulation_run_result`
  - 系统: `flow_context`, `page_submit_success`, `page_submit_failed`, `timer_complete`, `auto_submit`
- [ ] **code连续性**: operationList和answerList的code从1递增无跳号
- [ ] **时间格式**: 统一为 `YYYY-MM-DD HH:mm:ss`
- [ ] **必需系统事件**: 每个成功提交的样例必须含 `flow_context` + `page_submit_success`
- [ ] **click_blocked结构**: value字段必须含 `{reason, missing}` 其中missing为数组

---

## 1. 前置准备

- [ ] 1.1 Review `update-unified-submission-pipeline` 变更中的规范和模块迁移文档
- [ ] 1.2 确认 `usePageSubmission` Hook 已升级完成，支持新格式输入
- [ ] 1.3 确认 Schema 校验（`@shared/services/submission/schema.ts`）已就绪
- [ ] 1.4 确认埋点包装组件（输入/选择/按钮）可用

## 2. Page 00 Notice - 倒计时确认页

- [x] 2.1 保持现有 `checkbox_check/uncheck` 事件
- [x] 2.2 确保 `click_blocked` 包含 missing 列表：`['倒计时未结束']` 或 `['注意事项确认']`
- [x] 2.3 更新 targetElement 前缀为 `P<pageNumber>_`（如 `P{stepIndex}.1_注意事项确认`）
- [x] 2.4 添加 `next_click` 事件（目前仅有 click）
- [x] 2.5 验证 answerList 为空（无问题答案）

## 3. Page 01 Intro - 任务背景页

- [x] 3.1 更新 page_enter/page_exit 的 targetElement 前缀
- [x] 3.2 添加 `next_click` 事件
- [x] 3.3 验证无校验逻辑（可直接通过）

## 4. Page 02 Step Q1 - 输入页

- [x] 4.1 补全输入事件序列：
  - [x] 4.1.1 添加 `input_focus` 事件（聚焦输入框时）
  - [x] 4.1.2 保持 `input_change` 事件，建议使用 `{prev, next, prevLength, nextLength}` 结构
  - [x] 4.1.3 添加 `input_delete` 事件（删除操作时），格式：`{action:'delete', prev, next, prevLength, nextLength}`
  - [x] 4.1.4 添加 `input_blur` 事件（失焦时）
- [x] 4.2 更新 targetElement：`Q1_控制变量原因` → `P{stepIndex}.3_Q1_控制变量原因`
- [x] 4.3 添加 `next_click` 事件
- [x] 4.4 验证 answerList 仅包含最终答案（不含中间过程）
- [x] 4.5 确保 click_blocked 包含 missing: `['Q1_控制变量原因']`
- [x] 4.6 answerList.targetElement 使用完整问题文本
- [x] 4.7 answerList.value 保持用户输入文本

## 5. Page 03 Sim Exp - 实验操作页

- [x] 5.1 保持现有 `simulation_operation` 事件（已实现参数调整/开始/重置）
- [x] 5.2 补全新事件：
  - [x] 5.2.1 添加 `simulation_timing_started`（动画开始，含 duration_ms: 3500）
  - [x] 5.2.2 添加 `simulation_run_result`（动画结束，含 concentration/days/germinationRate/sproutedCount）
- [x] 5.3 将实验历史记录为 Answer（JSON字符串）：
  - targetElement: `P{stepIndex}.4_实验历史`
  - value: `{"runs":[{concentration,days,germinationRate,timestamp}]}`
- [x] 5.4 更新所有 targetElement 前缀为 `P{stepIndex}.4_...`
- [x] 5.5 添加 `next_click` 事件
- [x] 5.6 确保 click_blocked 包含 missing: `['未完成实验操作']`

## 6. Page 04 Q2 Data - 单选题页

- [x] 6.1 保持现有 `radio_select` 事件（Schema 允许，无需改为 select_change）
- [x] 6.2 更新 targetElement：`Q2_抑制作用浓度` → `P{stepIndex}.5_Q2_抑制作用浓度`
- [x] 6.3 添加 `next_click` 事件
- [x] 6.4 验证 answerList 仅包含最终选中答案
- [x] 6.5 确保 click_blocked 包含 missing: `['Q2_抑制作用浓度']`
- [x] 6.6 answerList.targetElement 使用完整问题文本
- [x] 6.7 answerList.value 使用 "选项标签. 选项文本" 格式

## 7. Page 05 Q3 Trend - 单选题页

- [x] 7.1 保持现有 `radio_select` 事件（同 Page 04）
- [x] 7.2 更新 targetElement：`Q3_发芽率趋势` → `P{stepIndex}.6_Q3_发芽率趋势`
- [x] 7.3 添加 `next_click` 事件
- [x] 7.4 验证 answerList 仅包含最终选中答案
- [x] 7.5 确保 click_blocked 包含 missing: `['Q3_发芽率趋势']`
- [x] 7.6 answerList.targetElement 使用完整问题文本
- [x] 7.7 answerList.value 使用 "选项标签. 选项文本" 格式

## 8. Page 06 Q4 Conc - 混合题页（最后一页）

- [x] 8.1 Q4a 判断题：保持现有 `radio_select` 事件
  - targetElement: `P{stepIndex}.7_Q4a_菟丝子有效性`
- [x] 8.2 Q4b 输入题：补全输入事件序列（focus/change/delete/blur）
  - targetElement: `P{stepIndex}.7_Q4b_结论理由`
- [x] 8.3 添加 `next_click` 事件（或提交等效事件）
- [x] 8.4 验证 answerList 包含 Q4a 和 Q4b 两个答案
- [x] 8.5 确保 click_blocked 分别标识缺失项：
  - `['Q4a_菟丝子有效性']`
  - `['Q4b_结论理由']`
  - 或两者都缺失
- [x] 8.6 answerList.targetElement 使用完整问题文本
- [x] 8.7 Q4a answerList.value 使用 "选项标签. 选项文本" 格式
- [x] 8.8 Q4b answerList.value 保持用户输入文本

## 9. 统一提交管道接入

- [x] 9.1 已通过 AssessmentPageFrame 接入 usePageSubmission（Frame 内部调用）
- [x] 9.2 已提供给 Frame：
  - getUserContext (batchCode/examNo)
  - getFlowContext (flowId/stepIndex/submoduleId/pageId)
  - pageMeta (pageId/pageNumber/pageDesc)
  - buildMark 返回 answerList/operationList
- [x] 9.3 无直连 `/stu/saveHcMark`（由 Frame 统一提交）
- [x] 9.4 code/时间由提交层统一处理
- [x] 9.5 flow_context 由 Frame 自动注入
- [x] 9.6 page_submit_success/failed 由 Frame 自动追加

## 10. 快照测试

- [x] 10.1 创建快照测试基线文件（**已创建13个快照文件**）：
  - [x] `tests/modules/g8-mikania-experiment/snapshots/page_00_notice.json`
  - [x] `tests/modules/g8-mikania-experiment/snapshots/page_00_notice_blocked.json`
  - [x] `tests/modules/g8-mikania-experiment/snapshots/page_02_step_q1.json`
  - [x] `tests/modules/g8-mikania-experiment/snapshots/page_02_step_q1_blocked.json`
  - [x] `tests/modules/g8-mikania-experiment/snapshots/page_03_sim_exp.json`
  - [x] `tests/modules/g8-mikania-experiment/snapshots/page_03_sim_exp_blocked.json`
  - [x] `tests/modules/g8-mikania-experiment/snapshots/page_04_q2_data.json`
  - [x] `tests/modules/g8-mikania-experiment/snapshots/page_04_q2_data_blocked.json`
  - [x] `tests/modules/g8-mikania-experiment/snapshots/page_05_q3_trend_timeout.json`
  - [x] `tests/modules/g8-mikania-experiment/snapshots/page_05_q3_trend_timeout_no_answer.json`
  - [x] `tests/modules/g8-mikania-experiment/snapshots/page_06_q4_conc.json`
  - [x] `tests/modules/g8-mikania-experiment/snapshots/page_06_q4_conc_blocked_q4b.json`
  - [x] `tests/modules/g8-mikania-experiment/snapshots/page_06_q4_conc_blocked_all.json`
- [x] 10.2 编写 Vitest 测试用例验证 Schema（tests/modules/g8-mikania-experiment/submission-format.test.js）
- [x] 10.3 运行快照测试，全部通过（**26 tests passed**）

## 11. Schema 校验与 Lint

- [x] 11.1 Schema 校验已在 usePageSubmission 中启用（validateMarkObject）
- [x] 11.2 配置 ESLint 规则（.eslintrc.json overrides for submodules）：
  - [x] 禁止 `fetch` 和 `apiService.submitMark` 直接提交
  - [x] 禁止 logOperation 使用字符串字面量 eventType
  - [x] 仅应用于 src/submodules/ 目录
- [x] 11.3 最小事件集合检查已集成在 Vitest 测试中
- [x] 11.4 运行 Lint 通过（**0 errors, 8 warnings**，warnings 为无害的 react-refresh）

## 12. 端到端测试 ✅ **已完成**

- [x] 12.1 正常流程测试（完整7页流程）
  - ✅ pageNumber 为组合格式（如 `1.3`）
  - ✅ answerList.targetElement 为完整问题文本
  - ✅ 单选题 value 格式为 `"A. 选项内容"`
- [x] 12.2 阻断场景测试（每页校验失败）
  - ✅ click_blocked 包含 `{reason, missing}` 数组
- [x] 12.3 超时场景测试：
  - [x] 有答案超时（自动提交）
  - [x] 无答案超时（补齐"超时未回答"）
- [x] 12.4 页面刷新恢复测试
- [x] 12.5 多次实验操作测试（Page 03）
  - ✅ 实验历史记录为 Answer (JSON字符串)

## 13. 验收与发布

- [ ] 13.1 Code Review（至少1个 reviewer）
- [x] 13.2 自动化测试通过（单元测试: 26 passed, ESLint: 0 errors）
- [x] 13.3 Lint 检查通过（0 errors, 8 warnings）
- [ ] 13.4 文档更新（README, CHANGELOG）
- [ ] 13.5 合并到主分支
- [ ] 13.6 部署到测试环境验证
- [ ] 13.7 协调后端数据兼容/清洗（如需要）
