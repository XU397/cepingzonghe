# migrate-g8-mikania-submission 问题修复证据

## 问题1: 选择事件策略矛盾 ❌ → ✅ 已修复

### 证据

**design.md 行854-856** (Step 2 埋点任务):
```markdown
- [ ] `Page04_Q2_Data.jsx`: 补全 targetElement 前缀（保留 radio_select）
- [ ] `Page05_Q3_Trend.jsx`: 补全 targetElement 前缀（保留 radio_select）
- [ ] `Page06_Q4_Conc.jsx`: Q4a 补全前缀（保留 radio_select），Q4b 补全 input_focus/blur
```

**design.md 行408** (样例4):
```json
"eventType": "radio_select"
```

**design.md 行647** (样例6 Q4a):
```json
"eventType": "radio_select"
```

**proposal.md 行393**:
```markdown
- ✅ **保留 radio_select**（现有实现已使用，Schema 允许）
```

**tasks.md 行49**:
```markdown
- [ ] 6.1 保持现有 `radio_select` 事件（Schema 允许，无需改为 select_change）
```

**tasks.md 行57**:
```markdown
- [ ] 7.1 保持现有 `radio_select` 事件（同 Page 04）
```

**tasks.md 行65**:
```markdown
- [ ] 8.1 Q4a 判断题：保持现有 `radio_select` 事件
```

✅ **结论**: 所有文档统一使用 `radio_select`，无 `select_change` 要求

---

## 问题2: 计时页矛盾 ❌ → ✅ 已修复

### 证据

**design.md 行66-124** (样例1完整内容):
```json
{
  "pageNumber": "1.1",
  "pageDesc": "[flow-g8-experiment-2024/g8-mikania-experiment/1] 注意事项",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "page_00_notice",
      "time": "2025-11-22 10:00:00",
      "pageId": "page_00_notice"
    },
    {
      "code": 2,
      "targetElement": "P1.1_注意事项确认",
      "eventType": "checkbox_check",
      "value": "checked",
      "time": "2025-11-22 10:00:40"
    },
    {
      "code": 3,
      "targetElement": "下一页按钮",
      "eventType": "next_click",
      "value": "navigate_to_intro",
      "time": "2025-11-22 10:00:42"
    },
    {
      "code": 4,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "page_00_notice",
      "time": "2025-11-22 10:00:42"
    },
    {
      "code": 5,
      "targetElement": "系统",
      "eventType": "flow_context",
      "value": "{\"flowId\":\"flow-g8-experiment-2024\",\"submoduleId\":\"g8-mikania-experiment\",\"stepIndex\":1,\"pageId\":\"page_00_notice\"}",
      "time": "2025-11-22 10:00:42"
    },
    {
      "code": 6,
      "targetElement": "系统",
      "eventType": "page_submit_success",
      "value": "{\"duration_ms\":120}",
      "time": "2025-11-22 10:00:42"
    }
  ],
  "answerList": [],
  "beginTime": "2025-11-22 10:00:00",
  "endTime": "2025-11-22 10:00:42",
  "imgList": []
}
```

**事件列表**:
1. ✅ page_enter
2. ✅ checkbox_check
3. ✅ next_click
4. ✅ page_exit
5. ✅ flow_context (系统注入)
6. ✅ page_submit_success (系统注入)

**❌ 不包含**: timer_start, timer_complete

**design.md 行851** (Step 2):
```markdown
- [ ] `Page00_Notice.jsx`: 本地倒计时无需 timer_*（与统一 timer 无关）
```

**tasks.md 行16**:
```markdown
- **page_00_notice 倒计时为本地逻辑**，不产生 timer_start/complete 事件
```

**proposal.md 行384**:
```markdown
- 38秒倒计时为**本地页面逻辑**，不产生 `timer_start/complete` 事件
```

✅ **结论**: 样例1不包含timer事件，文档说明一致

---

## 问题3: 样例不完整 ❌ → ✅ 已修复

### 所有样例的 flow_context 和 page_submit_success 验证

#### design.md 样例1 (page_00_notice)
- ✅ flow_context: 行104-110, code 5
- ✅ page_submit_success: 行111-117, code 6

#### design.md 样例2 (page_02_step_q1)
- ✅ flow_context: 行217-222, code 9
- ✅ page_submit_success: 行223-229, code 10

#### design.md 样例3 (page_03_sim_exp)
- ✅ flow_context: 行335-341, code 8
- ✅ page_submit_success: 行342-348, code 9

#### design.md 样例4 (page_04_q2_data)
- ✅ flow_context: 行447-453, code 7
- ✅ page_submit_success: 行454-460, code 8

#### design.md 样例5 (page_05_q3_trend 超时)
- ✅ flow_context: 行548-554, code 6
- ✅ page_submit_success: 行555-561, code 7 (含 auto:true)

#### design.md 样例6 (page_06_q4_conc)
- ✅ flow_context: 行686-692, code 8
- ✅ page_submit_success: 行693-699, code 9

#### proposal.md 样例1 (page_02_step_q1)
- ✅ flow_context: 行100-105, code 9
- ✅ page_submit_success: 行106-112, code 10

#### proposal.md 样例2 (page_03_sim_exp)
- ✅ flow_context: 行207-213, code 9
- ✅ page_submit_success: 行214-220, code 10

#### proposal.md 样例3 (page_04_q2_data)
- ✅ flow_context: 行288-294, code 6
- ✅ page_submit_success: 行295-301, code 7

#### proposal.md 样例4 (page_00_notice)
- ✅ flow_context: 行361-367, code 5
- ✅ page_submit_success: 行368-374, code 6

✅ **结论**: 所有10个样例均包含 flow_context 和 page_submit_success

---

## 问题4: 任务不够细 ❌ → ✅ 已修复

### tasks.md 第0节 - 逐页必需事件清单

**tasks.md 行1-11** (表格):
```markdown
| 页面 | pageNumber | 必需事件类型 | 必需 Answer | 阻断 missing 值 |
|------|------------|-------------|------------|----------------|
| page_00_notice | `{stepIndex}.1` | page_enter, checkbox_check/uncheck, next_click, page_exit, flow_context, page_submit_success | 无 | `['倒计时未结束']` 或 `['注意事项确认']` |
| page_01_intro | `{stepIndex}.2` | page_enter, next_click, page_exit, flow_context, page_submit_success | 无 | 无阻断 |
| page_02_step_q1 | `{stepIndex}.3` | page_enter, input_focus, input_change, input_blur, (可选)input_delete, next_click, page_exit, flow_context, page_submit_success | P{stepIndex}.3_Q1 | `['Q1_控制变量原因']` |
| page_03_sim_exp | `{stepIndex}.4` | page_enter, simulation_operation, simulation_timing_started, simulation_run_result, next_click, page_exit, flow_context, page_submit_success | P{stepIndex}.4_实验历史 (JSON) | `['未完成实验操作']` |
| page_04_q2_data | `{stepIndex}.5` | page_enter, radio_select, next_click, page_exit, flow_context, page_submit_success | P{stepIndex}.5_Q2 | `['Q2_抑制作用浓度']` |
| page_05_q3_trend | `{stepIndex}.6` | page_enter, radio_select, next_click, page_exit, flow_context, page_submit_success | P{stepIndex}.6_Q3 | `['Q3_发芽率趋势']` |
| page_06_q4_conc | `{stepIndex}.7` | page_enter, radio_select (Q4a), input_focus/change/blur (Q4b), next_click, page_exit, flow_context, page_submit_success | P{stepIndex}.7_Q4a, P{stepIndex}.7_Q4b | `['Q4a_菟丝子有效性']` 和/或 `['Q4b_结论理由']` |
```

**tasks.md 行13-16** (说明):
```markdown
**说明**:
- **flow_context** 和 **page_submit_success** 由提交层自动注入，无需手写
- **timer_complete** + **auto_submit** 仅在超时场景由统一 timer 触发
- **page_00_notice 倒计时为本地逻辑**，不产生 timer_start/complete 事件
```

### tasks.md 第0.1节 - 快照文件清单

**tasks.md 行20-32** (快照清单):
```markdown
| 快照文件路径 | 对应页面 | 基准来源 | 关键校验项 |
|-------------|---------|---------|-----------|
| `tests/modules/g8-mikania-experiment/snapshots/page_00_notice.json` | page_00_notice | design.md 样例1 | ✓ pageNumber格式 `{stepIndex}.1`<br>✓ checkbox_check事件<br>✓ NO timer_start/complete<br>✓ answerList为空<br>✓ flow_context自动注入<br>✓ page_submit_success自动注入 |
| `tests/modules/g8-mikania-experiment/snapshots/page_00_notice_blocked.json` | page_00_notice阻断 | design.md 阻断场景 | ✓ click_blocked含missing列表<br>✓ missing值: `['倒计时未结束','注意事项确认']` |
| `tests/modules/g8-mikania-experiment/snapshots/page_02_step_q1.json` | page_02_step_q1 | design.md 样例2 | ✓ input_focus/change/delete/blur完整链<br>✓ input_change含 `{prev,next}`<br>✓ targetElement前缀 `P{stepIndex}.3_`<br>✓ answerList仅含最终答案 |
| `tests/modules/g8-mikania-experiment/snapshots/page_02_step_q1_blocked.json` | page_02_step_q1阻断 | design.md 阻断场景 | ✓ click_blocked含missing: `['Q1_控制变量原因']`<br>✓ 输入<5字符被阻断 |
| `tests/modules/g8-mikania-experiment/snapshots/page_03_sim_exp.json` | page_03_sim_exp | design.md 样例3 | ✓ simulation_operation完整<br>✓ simulation_timing_started含duration_ms<br>✓ simulation_run_result含完整数据<br>✓ 实验历史存为Answer(JSON字符串) |
| `tests/modules/g8-mikania-experiment/snapshots/page_03_sim_exp_blocked.json` | page_03_sim_exp阻断 | design.md 阻断场景 | ✓ click_blocked含missing: `['未完成实验操作']` |
| `tests/modules/g8-mikania-experiment/snapshots/page_04_q2_data.json` | page_04_q2_data | design.md 样例4 | ✓ radio_select事件<br>✓ targetElement前缀 `P{stepIndex}.5_`<br>✓ answerList仅含最终选中项 |
```

**tasks.md 行34-51** (Schema 校验清单):
```markdown
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
```

✅ **结论**: tasks.md 已细化到页级，包含：
- 7个页面的必需事件清单
- 13个快照文件清单
- 12项 Schema 校验规则

---

## 问题5: 阻断覆盖不全 ❌ → ✅ 已修复

### design.md 阻断快照清单

| 序号 | 页面 | 阻断场景 | 文件位置 | missing 值 |
|------|------|---------|---------|-----------|
| 1 | page_00_notice | 倒计时未结束 | design.md:133-151 | `['倒计时未结束','注意事项确认']` |
| 2 | page_02_step_q1 | 输入<5字符 | design.md:244-271 | `['Q1_控制变量原因']` |
| 3 | page_03_sim_exp | 未完成实验 | design.md:356-383 | `['未完成实验操作']` |
| 4 | page_04_q2_data | 未选择答案 | design.md:475-497 | `['Q2_抑制作用浓度']` |
| 5 | page_05_q3_trend | 超时有答案 | design.md:507-578 | timer_complete + auto_submit |
| 6 | page_05_q3_trend | 超时无答案 | design.md:580-622 | 补齐"超时未回答" |
| 7 | page_06_q4_conc | 仅填Q4a缺Q4b | design.md:724-759 | `['Q4b_结论理由']` |
| 8 | page_06_q4_conc | 两者都未填 | design.md:762-783 | `['Q4a_菟丝子有效性','Q4b_结论理由']` |

✅ **结论**: 8个阻断/异常场景完整覆盖

---

## 中文编码验证

### 十六进制字节验证

**控制变量** (行169):
```
Hex: e6 8e a7 e5 88 b6 e5 8f 98 e9 87 8f
UTF-8 Decoded: 控 制 变 量
```

**下一页按钮** (行92):
```
Hex: e4 b8 8b e4 b8 80 e9 a1 b5 e6 8c 89 e9 92 ae
UTF-8 Decoded: 下 一 页 按 钮
```

**为了控制变量** (行75 proposal.md):
```
Hex: e4 b8 ba e4 ba 86 e6 8e a7 e5 88 b6 e5 8f 98 e9 87 8f
UTF-8 Decoded: 为 了 控 制 变 量
```

**菟丝子** (行646):
```
Hex: e8 8f 9f e4 b8 9d e5 ad 90
UTF-8 Decoded: 菟 丝 子
```

**薇甘菊** (行669):
```
Hex: e8 96 87 e7 94 98 e8 8f 8a
UTF-8 Decoded: 薇 甘 菊
```

✅ **结论**: 所有中文字符均为正确的 UTF-8 编码，无乱码

---

## OpenSpec 验证

```bash
$ openspec validate migrate-g8-mikania-submission --strict
Change 'migrate-g8-mikania-submission' is valid
```

✅ **通过 OpenSpec 严格验证**

---

## 最终总结

| 问题 | 状态 | 证据位置 |
|------|------|---------|
| 1. 事件策略矛盾 | ✅ 已修复 | design.md:854-856, proposal.md:393, tasks.md:49/57/65 |
| 2. 计时页矛盾 | ✅ 已修复 | design.md:83-117 (样例1无timer), design.md:851, tasks.md:16, proposal.md:384 |
| 3. 样例不完整 | ✅ 已修复 | 所有10个样例均含 flow_context + page_submit_success |
| 4. 任务不够细 | ✅ 已修复 | tasks.md:1-51 (第0节+第0.1节) |
| 5. 阻断覆盖不全 | ✅ 已修复 | design.md 包含8个阻断场景 |
| 6. 中文编码 | ✅ 正确 | UTF-8编码无乱码 |

**所有问题已修复，文档已达标。**
