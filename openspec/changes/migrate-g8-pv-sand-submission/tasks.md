## 1. 接入统一提交管道

### 1.1 切换至 usePageSubmission Hook
- [x] 1.1.1 移除 PvSandContext 中的 `submitPageMarkData` 手写提交逻辑
- [x] 1.1.2 引入 `usePageSubmission({ getUserContext, getFlowContext, pageMeta, answers, operations })`
- [x] 1.1.3 确保提交层自动注入 `flow_context`、`page_submit_success/failed` 事件

### 1.2 统一页码与前缀格式
- [x] 1.2.1 更新所有页面 `pageNumber` 为 `<stepIndex>.<subPageNum>` 格式（如 `0.1`, `0.2` ... `0.7`）
- [x] 1.2.2 更新 `pageDesc` 为 `[flow-g8-experiment-2024/g8-pv-sand-experiment/<stepIndex>] <页面标题>` 格式（三段式：flowId/submoduleId/stepIndex）
- [x] 1.2.3 更新所有 `targetElement` 使用 `P${pageNumber}_<业务ID>` 前缀（如 `P0.3_问题1输入框`）
- [x] 1.2.4 移除旧前缀格式（如果存在 `M*_` 等遗留格式）

---

## 2. 分页埋点迁移（按 subPageNum 顺序）

### 2.1 Page 1 (subPageNum=1): instructions_cover - 任务封面
- [x] 2.1.1 **最小事件集合**：
  - [x] `page_enter` × 1（进入页面）
  - [x] `timer_start` × 1（30秒倒计时开始）
  - [x] `timer_complete` × 1（倒计时结束）
  - [x] `checkbox_check` × 1（确认复选框勾选）
  - [x] `next_click` × 1（点击下一页）
  - [x] `page_exit` × 1（离开页面）
- [x] 2.1.2 **阻断校验**：未勾选复选框或计时未完成时记录 `click_blocked`，`value` 含 `{reason, missing[], timestamp}`
- [x] 2.1.3 **Answer**：写入 `instructions_read=true`

### 2.2 Page 2 (subPageNum=2): background_notice - 背景引入
- [x] 2.2.1 **最小事件集合**：
  - [x] `page_enter` × 1
  - [x] `timer_start` × 1（5秒倒计时）
  - [x] `timer_complete` × 1（自动通过）
  - [x] `auto_submit` × 1（计时到0自动提交）
  - [x] `page_exit` × 1
- [x] 2.2.2 **Answer**：写入 `background_read=true`

### 2.3 Page 3 (subPageNum=3): experiment_design - 实验方案设计
- [x] 2.3.1 **最小事件集合**：
  - [x] `page_enter` × 1
  - [x] `input_focus` × 1（输入框获得焦点）
  - [x] `input_change` × N（每次输入变更，value 使用 `{prev, next, prevLength, nextLength}` 结构）
  - [x] `input_delete` × N（显式删除，value 使用 `{action:'delete', prev, next, ...}` 结构）
  - [x] `input_blur` × 1（输入框失去焦点）
  - [x] `next_click` × 1
  - [x] `page_exit` × 1
- [x] 2.3.2 **阻断校验**：输入字符数 <10 时记录 `click_blocked`，`missing` 包含 `["designReason: 至少需要10个字符(当前X字符)"]`
- [x] 2.3.3 **Answer**：`designReason`（最终输入值）

### 2.4 Page 4 (subPageNum=4): tutorial_simulation - 模拟实验教程
- [x] 2.4.1 **最小事件集合**：
  - [x] `page_enter` × 1
  - [x] `simulation_operation` × N（高度调节、重置等操作）
  - [x] `simulation_timing_started` × 1+（开始实验）
  - [x] `simulation_run_result` × 1+（实验结果，value 为 JSON 字符串含实验数据）
  - [x] `next_click` × 1
  - [x] `page_exit` × 1
- [x] 2.4.2 **阻断校验**：未完成至少1次实验时记录 `click_blocked`
- [x] 2.4.3 **Answer**：`tutorialCompleted=true`

### 2.5 Page 5 (subPageNum=5): experiment_task1 - 实验探究-1
- [x] 2.5.1 **最小事件集合**：
  - [x] `page_enter` × 1
  - [x] `simulation_operation` × N（高度调节）
  - [x] `simulation_timing_started` × N（开始测量）
  - [x] `simulation_run_result` × N（实验结果）
  - [x] `radio_select` × 1（单选题答案）
  - [x] `next_click` × 1
  - [x] `page_exit` × 1
- [x] 2.5.2 **阻断校验**：单选题未选择时记录 `click_blocked`
- [x] 2.5.3 **Answer**：
  - [x] `experiment1Choice`（用户选择）
  - [x] `实验历史数据`（JSON 字符串，包含实验操作记录）

### 2.6 Page 6 (subPageNum=6): experiment_task2 - 实验探究-2
- [x] 2.6.1 **最小事件集合**：
  - [x] `page_enter` × 1
  - [x] `simulation_operation` × N
  - [x] `simulation_timing_started` × N
  - [x] `simulation_run_result` × N
  - [x] `checkbox_check` × N（多选勾选）
  - [x] `checkbox_uncheck` × N（多选取消）
  - [x] `next_click` × 1
  - [x] `page_exit` × 1
- [x] 2.6.2 **阻断校验**：至少选择1项，否则记录 `click_blocked`
- [x] 2.6.3 **Answer**：
  - [x] `experiment2Analysis`（JSON 数组字符串，包含所有选中项）

### 2.7 Page 7 (subPageNum=7): conclusion_analysis - 结论分析
- [x] 2.7.1 **最小事件集合**：
  - [x] `page_enter` × 1
  - [x] `radio_select` × 1（单选题）
  - [x] `input_focus/change/delete/blur` × 序列（输入框）
  - [x] `next_click` × 1
  - [x] `page_exit` × 1
- [x] 2.7.2 **阻断校验**：单选题未选择 OR 输入字符数 <10 时记录 `click_blocked`
- [x] 2.7.3 **Answer**：
  - [x] `conclusionChoice`（单选答案）
  - [x] `conclusionReason`（输入框最终值）

---

## 3. 答案过滤与超时处理

- [x] 3.1 确保 `answerList` 仅包含非空答案（空字符串/null/undefined 不入列）
- [x] 3.2 超时场景：倒计时到0时，提交层自动补齐"超时未回答"占位符（如适用）
- [x] 3.3 复杂数据（实验历史、截图元数据）作为单条 Answer，`value` 为 JSON 字符串

---

## 4. Schema 校验与 Lint 守卫

### 4.1 Schema 校验（Zod/JSON Schema）
- [x] 4.1.1 验证 `pageNumber` 格式：`^\d+\.\d+$`（如 `0.1`, `0.2`, `0.7`）
- [x] 4.1.2 验证 `pageDesc` 前缀：`^\[[\w-]+\/[\w-]+\/\d+\]`（三段式格式，如 `[flow-g8-experiment-2024/g8-pv-sand-experiment/0]`）
- [x] 4.1.3 验证 `targetElement` 前缀：`^P\d+\.\d+_`（如 `P0.3_问题1输入框`）
- [x] 4.1.4 验证 `eventType` 在 Data Format Spec 枚举范围内
- [x] 4.1.5 验证 `code` 连续自增，从 1 开始
- [x] 4.1.6 验证 `time` 格式：`YYYY-MM-DD HH:mm:ss`
- [x] 4.1.7 验证 `answerList` 所有 `value` 非空

### 4.2 Lint 守卫规则
- [x] 4.2.1 禁止直连 `/stu/saveHcMark`（必须通过 `usePageSubmission`）
- [x] 4.2.2 禁止使用旧前缀（如 `M*_`）
- [x] 4.2.3 禁止手写 `code`（由提交层自动生成）
- [x] 4.2.4 禁止手写 `time`（由提交层统一格式化）
- [x] 4.2.5 禁止使用非枚举 `eventType`

### 4.3 中文编码验证与修复
- [x] 4.3.1 **检查所有页面组件文件**（Page01-Page07）的中文字符编码
  - [x] 使用 `file -i <文件名>` 确认编码为 `utf-8`（非 ANSI/GB2312）
  - [x] 检查页面标题、按钮文字、提示信息等中文内容无乱码（� 字符）
- [x] 4.3.2 **检查样例快照文件**（migration-pages-and-snapshots.md）
  - [x] 验证所有 JSON 样例中的中文 value 字段正确显示
  - [x] 特别检查：`pageDesc`、`targetElement`、`click_blocked.missing` 中的中文描述
  - [x] 确保 `value` 字段中的中文（如"请勾选确认框"、"至少需要10个字符"）无乱码
- [x] 4.3.3 **修复发现的乱码**
  - [x] 如发现乱码，使用 UTF-8 编码重新保存文件
  - [x] 更新 migration-pages-and-snapshots.md 中受影响的样例
  - [x] 运行快照测试验证修复后的内容可正确解析
- [x] 4.3.4 **建立编码规范守卫**
  - [x] 在 `.editorconfig` 或 `.vscode/settings.json` 强制 UTF-8 编码
  - [x] Git 提交前自动检查中文字符编码（pre-commit hook）

---

## 5. 快照测试与基线

### 5.1 创建快照文件（假设 stepIndex=0）

#### 5.1.1 正常流程快照
- [x] `snapshots/page-0.1-instructions-cover.snapshot.json`（对照样例 2.1）
  - 包含：timer_start/complete, checkbox_check, next_click, page_exit, flow_context, page_submit_success
- [x] `snapshots/page-0.2-background-notice.snapshot.json`（对照样例 2.1b）
  - 包含：timer_start/complete, auto_submit, page_exit, flow_context, page_submit_success（无 next_click）
- [x] `snapshots/page-0.3-experiment-design.snapshot.json`（对照样例 2.2）
  - 包含：input_focus/change/delete/blur, next_click, page_exit, flow_context, page_submit_success
- [x] `snapshots/page-0.5-experiment-task1.snapshot.json`（对照样例 2.3）
  - 包含：simulation_operation/timing_started/run_result, radio_select, next_click, page_exit, flow_context, page_submit_success
- [x] `snapshots/page-0.6-experiment-task2.snapshot.json`（对照样例 2.5）
  - 包含：simulation_*, checkbox_check/uncheck, next_click, page_exit, flow_context, page_submit_success

#### 5.1.2 阻断场景快照
- [x] `snapshots/page-0.1-blocked-checkbox.snapshot.json`（对照样例 2.6a）
  - click_blocked: missing=["instructions_confirmation: 请勾选确认框"]
- [x] `snapshots/page-0.3-blocked-input-length.snapshot.json`（对照样例 2.4）
  - click_blocked: missing=["designReason: 至少需要10个字符(当前X字符)"]
- [x] `snapshots/page-0.4-blocked-experiment.snapshot.json`（对照样例 2.6b）
  - click_blocked: missing=["tutorialCompleted: 请至少完成1次实验操作"]
- [x] `snapshots/page-0.5-blocked-radio.snapshot.json`（对照样例 2.6c）
  - click_blocked: missing=["experiment1Choice: 请选择一个选项"]
- [x] `snapshots/page-0.6-blocked-checkbox.snapshot.json`（对照样例 2.6d）
  - click_blocked: missing=["experiment2Analysis: 请至少选择1个选项"]
- [x] `snapshots/page-0.7-blocked-combined.snapshot.json`（对照样例 2.6e）
  - click_blocked: missing=["conclusionReason: 至少需要10个字符(当前X字符)"]

### 5.2 快照验证清单
- [x] 5.2.1 运行 `npm run test:snapshot -- --update` 生成基线
- [x] 5.2.2 运行 `npm run test:snapshot` 验证对照
- [x] 5.2.3 **必需自动注入事件**（每个快照必含）：
  - [x] `flow_context`（targetElement="系统"，value 含 flowId/submoduleId/stepIndex/pageId）
  - [x] `page_submit_success`（value 含 duration/channel） 或 `page_submit_failed`
- [x] 5.2.4 **pageDesc 前缀验证**：所有快照的 pageDesc 必须为 `[flow-g8-experiment-2024/g8-pv-sand-experiment/<stepIndex>] ...`
- [x] 5.2.5 **targetElement 前缀验证**：所有 targetElement（除"系统"/"页面"）必须以 `P<pageNumber>_` 开头
- [x] 5.2.6 **timer 事件 value 格式验证**：timer_start/complete 的 value 必须为结构化 JSON（如 `{"duration":30,"unit":"seconds"}`）

---

## 6. E2E 测试

- [ ] 6.1 完整流程（7个页面）：验证每页提交数据格式符合 Schema
- [ ] 6.2 阻断场景：输入不足10字符 → `click_blocked` → 补全后成功
- [ ] 6.3 实验操作：记录高度调节 → 开始 → 结果 → 重置 → 数据完整
- [ ] 6.4 超时提交：模拟倒计时到0 → 自动提交 → `auto_submit` 事件存在

---

## 7. 验证自动注入事件

### 7.1 flow_context 自动注入验证
- [x] 7.1.1 确认 `flow_context` 事件在 `page_exit` 和 `page_submit_*` 之间自动插入
- [x] 7.1.2 验证 targetElement 固定为 `"系统"`
- [x] 7.1.3 验证 value 结构：`{"flowId":"flow-g8-experiment-2024","submoduleId":"g8-pv-sand-experiment","stepIndex":<number>,"pageId":"<pageId>"}`
- [x] 7.1.4 确认 pageId 与当前页面的 pageId 匹配
- [x] 7.1.5 确认 stepIndex 与 pageNumber 的第一部分匹配（如 pageNumber=0.3，stepIndex=0）

### 7.2 page_submit_success 自动追加验证
- [x] 7.2.1 确认 `page_submit_success` 事件在 operationList 末尾
- [x] 7.2.2 验证 value 结构：`{"duration":<number>,"channel":"usePageSubmission"}`（手动提交）或 `{"duration":<number>,"channel":"usePageSubmission","trigger":"auto"}`（自动提交）
- [x] 7.2.3 计算 duration = endTime - beginTime，验证一致性
- [x] 7.2.4 auto_submit 页面的 page_submit_success 必须含 `trigger:"auto"`

### 7.3 page_submit_failed 场景验证
- [x] 7.3.1 模拟网络失败场景，验证 `page_submit_failed` 事件记录
- [x] 7.3.2 验证 value 含错误摘要（如 `{"error":"NetworkError","message":"..."}`)
- [x] 7.3.3 确认失败场景不影响 flow_context 注入

---

## 8. 清理遗留代码

- [x] 8.1 移除手写 `buildMark` 逻辑
- [x] 8.2 移除直连 `/stu/saveHcMark` 的 fetch 调用
- [x] 8.3 移除手写 `code`、`time` 的逻辑（由提交层统一处理）
- [x] 8.4 清理旧前缀、旧页码格式

---

## 9. 文档更新与样例索引

### 9.1 migration-pages-and-snapshots.md 样例索引
- [ ] 9.1.1 样例 2.1：手动提交页（timer + checkbox，有 next_click）- pageNumber 0.1
- [ ] 9.1.2 样例 2.1b：自动提交页（timer + auto_submit，无 next_click）- pageNumber 0.2
- [ ] 9.1.3 样例 2.2：输入页（input_focus/change/delete/blur 完整链路）- pageNumber 0.3
- [ ] 9.1.4 样例 2.3：实验操作页（simulation_* + radio_select）- pageNumber 0.5
- [ ] 9.1.5 样例 2.4：阻断校验页（click_blocked 含 missing 数组）- pageNumber 0.3
- [ ] 9.1.6 样例 2.5：多选题页（checkbox_check/uncheck）- pageNumber 0.6
- [ ] 9.1.7 样例 2.6a-e：补充 click_blocked 示例（Page 1/4/5/6/7 的校验失败场景）

### 9.2 关键概念确认
- [ ] 9.2.1 pageDesc 前缀：`[flowId/submoduleId/stepIndex]` 三段式结构，flowId = `flow-g8-experiment-2024`
- [ ] 9.2.2 targetElement 前缀：`P<pageNumber>_<业务ID>`，如 `P0.3_问题1输入框`
- [ ] 9.2.3 事件策略：radio_select（单选）、checkbox_check/uncheck（多选）、不使用 select_change
- [ ] 9.2.4 timer 事件 value：结构化 JSON，如 `{"duration":30,"unit":"seconds"}`
- [ ] 9.2.5 click_blocked value：必含 `{reason, missing[], timestamp}`，missing 为字符串数组

### 9.3 历史数据兼容性
- [ ] 9.3.1 标注：g8-pv-sand-experiment 为新模块，无历史数据
- [ ] 9.3.2 确认：无需数据迁移脚本
- [ ] 9.3.3 文档：更新模块 README（如有），说明新提交流程与Schema规范
