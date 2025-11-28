## 1. 接入统一提交管道

### 1.1 更新所有页面使用 usePageSubmission
- [ ] Page01 (0.1 - cover): 接入 usePageSubmission，移除直接 fetch
- [ ] Page02 (0.2 - background): 接入 usePageSubmission
- [ ] Page03 (0.3 - hypothesis): 接入 usePageSubmission
- [ ] Page04 (0.4 - experiment_free): 接入 usePageSubmission
- [ ] Page05 (0.5 - focal_analysis): 接入 usePageSubmission
- [ ] Page06 (0.6 - height_analysis): 接入 usePageSubmission
- [ ] Page07 (0.7 - conclusion): 接入 usePageSubmission

### 1.2 更新 targetElement 前缀
- [ ] 全局搜索替换旧前缀 `P1_` → `P0.1_`，`P3_` → `P0.3_`，依此类推
- [ ] 验证所有 targetElement 符合 `P${pageNumber}_<业务ID>` 格式
- [ ] 更新 DroneImagingContext 中的答案键名

### 1.3 更新 pageNumber 编码
- [ ] 使用 `encodeCompositePageNum(stepIndex, subPageNum)` 生成 pageNumber
- [ ] 假设 g8-drone-imaging 为第1个子模块（stepIndex=0），pageNumber 为 `0.1` 至 `0.7`
- [ ] 更新 mapping.ts 中的页码映射逻辑

---

## 2. 补齐必需事件与埋点

### 2.1 Page01 (0.1 - cover) - 计时+确认页
**必需事件:** (参考 migration.md § 2.1 正常快照)
- [ ] `page_enter` (code=1, targetElement: "page", value: "Page01_Cover", pageId: "cover")
- [ ] `flow_context` (code=2, 自动注入, value: JSON 含 flowId/stepIndex/submoduleId/moduleName/pageId)
- [ ] `timer_start` (code=3, targetElement: `P0.1_countdown`, **value: `{"duration":40,"unit":"seconds"}`**)
- [ ] `timer_stop` (code=4, targetElement: `P0.1_countdown`, **value: `{"reason":"countdown_finished","elapsed":40}`**)
- [ ] `checkbox_check` (code=5, targetElement: `P0.1_确认阅读`, value: "checked") 或 `checkbox_uncheck` (value: "unchecked")
- [ ] `next_click` (code=6/7, targetElement: "next_button", value: "navigate_to_background" 或 click_blocked)
- [ ] `click_blocked` (若未勾选, **value: `{"reason":"checkbox_not_checked","missing":["P0.1_确认阅读"]}`**)
- [ ] `page_exit` (倒数第二, targetElement: "page", value: "Page01_Cover")
- [ ] `page_submit_success` (最后, targetElement: "page", **value: JSON 含 duration_ms/auto_submit/pageNumber/pageDesc**)

**answerList:**
- [ ] `P0.1_确认阅读`: "已确认" (仅勾选时，code=1)

**快照路径:** `modules/g8-drone-imaging-migration.md` § 2.1 (正常) 和 § 2.2 (阻断)

### 2.2 Page02 (0.2 - background) - 背景知识/阅读计时
**必需事件:** (参考 migration.md § 2.3)
- [ ] `page_enter` (code=1, targetElement: "page", value: "Page02_Background", pageId: "background")
- [ ] `flow_context` (code=2, 自动注入)
- [ ] `timer_start` (code=3, targetElement: `P0.2_reading_timer`, **value: `{"duration":5,"unit":"seconds"}`**)
- [ ] `timer_stop` (code=4, targetElement: `P0.2_reading_timer`, **value: `{"reason":"countdown_finished","elapsed":5}`**)
- [ ] `reading_complete` (code=5, targetElement: "page", value: "Page02_Background")
- [ ] `next_click` (code=6, targetElement: "next_button", value: "navigate_to_hypothesis")
- [ ] `page_exit` (code=7)
- [ ] `page_submit_success` (code=8)

**answerList:** 空（无输入，仅阅读页）

**快照路径:** `modules/g8-drone-imaging-migration.md` § 2.3

### 2.3 Page03 (0.3 - hypothesis) - 输入页
**必需事件:** (参考 migration.md § 2.4 正常和 § 2.5 阻断)
- [ ] `page_enter` (code=1, targetElement: "page", value: "Page03_Hypothesis", pageId: "hypothesis")
- [ ] `flow_context` (code=2, 自动注入)
- [ ] `input_focus` (code=3, targetElement: `P0.3_控制变量理由`, value: 初始内容快照 `""` 或已保存内容)
- [ ] `input_change` (code=4+, **value: `{"prev":"","next":"为了保证"}` JSON 格式**，记录每次输入变化)
- [ ] `input_delete` (可选, **value: `{"action":"delete","prevLength":10,"nextLength":8}`**)
- [ ] `input_blur` (code=N-3, targetElement: `P0.3_控制变量理由`, value: 最终内容)
- [ ] `next_click` (code=N-2, 成功) **或** `click_blocked` (若 <5字符)
- [ ] `click_blocked` (若验证失败, **value: `{"reason":"input_too_short","missing":["P0.3_控制变量理由"],"currentLength":2,"requiredLength":5}`**)
- [ ] `page_exit` (code=N-1)
- [ ] `page_submit_success` (code=N)

**answerList:**
- [ ] `P0.3_控制变量理由`: 用户输入内容（≥5字符，code=1）

**快照路径:** `modules/g8-drone-imaging-migration.md` § 2.4 (正常) 和 § 2.5 (阻断)

### 2.4 Page04 (0.4 - experiment_free) - 实验页
**必需事件:** (参考 migration.md § 2.6 正常和 § 2.7 阻断)
- [ ] `page_enter` (code=1, targetElement: "page", value: "Page04_ExperimentFree", pageId: "experiment_free")
- [ ] `flow_context` (code=2, 自动注入)
- [ ] `simulation_operation` (code=3+, 每次高度选择, **value: `{"action":"set_height","value":100/200/300}`**)
- [ ] `simulation_operation` (每次焦距调整, **value: `{"action":"set_focal","value":8/24/50}`**)
- [ ] `simulation_operation` (每次拍照, targetElement: "capture_button", value: `capture_h100_f24_gsd2.50`)
- [ ] `simulation_operation` (重置, targetElement: "reset_button", value: "reset_experiment")
- [ ] `next_click` (code=N-2) **或** `click_blocked` (若无拍照记录)
- [ ] `click_blocked` (若未完成实验, **value: `{"reason":"no_experiment_capture","missing":["experiment_captures"]}`**)
- [ ] `page_exit` (code=N-1)
- [ ] `page_submit_success` (code=N)

**answerList:**
- [ ] `P0.4_experiment_captures`: JSON 字符串数组（实验历史，code=1），示例: `"[{\"height\":100,\"focal\":24,\"gsd\":2.50}]"`

**快照路径:** `modules/g8-drone-imaging-migration.md` § 2.6 (正常) 和 § 2.7 (阻断)

### 2.5 Page05 (0.5 - focal_analysis) - 问卷+实验页
**必需事件:** (参考 migration.md § 2.8 正常和 § 2.9 阻断)
- [ ] `page_enter` (code=1, targetElement: "page", value: "Page05_FocalAnalysis", pageId: "focal_analysis")
- [ ] `flow_context` (code=2, 自动注入)
- [ ] `simulation_operation` (code=3+, 可选实验操作，同 Page04 格式)
- [ ] `radio_select` (code=N-3, targetElement: `P0.5_最小GSD焦距`, value: "C" 等选项值)
- [ ] `next_click` (code=N-2) **或** `click_blocked` (若未选择)
- [ ] `click_blocked` (若未选择, **value: `{"reason":"no_selection","missing":["P0.5_最小GSD焦距"]}`**)
- [ ] `page_exit` (code=N-1)
- [ ] `page_submit_success` (code=N)

**answerList:**
- [ ] `P0.5_最小GSD焦距`: 选中值（A/B/C，code=1）

**快照路径:** `modules/g8-drone-imaging-migration.md` § 2.8 (正常) 和 § 2.9 (阻断)

### 2.6 Page06 (0.6 - height_analysis) - 问卷+实验页
**必需事件:** (参考 migration.md § 2.10 正常和 § 2.11 阻断)
- [ ] `page_enter` (code=1, targetElement: "page", value: "Page06_HeightAnalysis", pageId: "height_analysis")
- [ ] `flow_context` (code=2, 自动注入)
- [ ] `simulation_operation` (code=3+, 可选实验操作)
- [ ] `radio_select` (code=N-3, targetElement: `P0.6_GSD变化趋势`, value: "A" 等选项值)
- [ ] `next_click` (code=N-2) **或** `click_blocked` (若未选择)
- [ ] `click_blocked` (若未选择, **value: `{"reason":"no_selection","missing":["P0.6_GSD变化趋势"]}`**)
- [ ] `page_exit` (code=N-1)
- [ ] `page_submit_success` (code=N)

**answerList:**
- [ ] `P0.6_GSD变化趋势`: 选中值（A/B/C，code=1）

**快照路径:** `modules/g8-drone-imaging-migration.md` § 2.10 (正常) 和 § 2.11 (阻断)

### 2.7 Page07 (0.7 - conclusion) - 复合问卷+完成页
**必需事件:** (参考 migration.md § 2.12 正常, § 2.13 阻断A, § 2.14 阻断B)
- [ ] `page_enter` (code=1, targetElement: "page", value: "Page07_Conclusion", pageId: "conclusion")
- [ ] `flow_context` (code=2, 自动注入)
- [ ] `radio_select` (code=3, targetElement: `P0.7_优先调整因素`, value: "A" 或 "B")
- [ ] `input_focus` (code=4, targetElement: `P0.7_理由说明`, value: 初始内容 `""`)
- [ ] `input_change` (code=5+, **value: `{"prev":"","next":"因为高度"}` JSON 格式**)
- [ ] `input_blur` (code=N-3, targetElement: `P0.7_理由说明`, value: 最终内容)
- [ ] `next_click` (code=N-2) **或** `click_blocked` (若任一未满足)
- [ ] `click_blocked` (阻断A: **value: `{"reason":"validation_failed","missing":["P0.7_优先调整因素"]}`**)
- [ ] `click_blocked` (阻断B: **value: `{"reason":"validation_failed","missing":["P0.7_理由说明"],"currentLength":2,"requiredLength":5}`**)
- [ ] `page_exit` (code=N-1)
- [ ] `page_submit_success` (code=N)

**answerList:**
- [ ] `P0.7_优先调整因素`: 选中值（A/B，code=1）
- [ ] `P0.7_理由说明`: 用户输入（≥5字符，code=2）

**快照路径:** `modules/g8-drone-imaging-migration.md` § 2.12 (正常), § 2.13 (阻断A), § 2.14 (阻断B)

### 2.8 超时自动提交（所有页面）
**必需事件 (模块级):** (参考 migration.md § 2.15)
- [ ] `timer_complete` (code=N-3, targetElement: "module", **value: `{"reason":"task_timer_expired","elapsed":1200000}`**)
- [ ] `auto_submit` (code=N-2, targetElement: "module", **value: `{"reason":"timer_expired","currentPage":"0.4"}`**)
- [ ] `page_exit` (code=N-1, targetElement: "page", value: 当前页面标识)
- [ ] `page_submit_success` (code=N, **value: JSON 含 `"auto_submit":true`**)

**answerList:**
- [ ] 汇总所有已完成页答案（保留原 code）
- [ ] 未回答的必填题填充 `"超时未回答"` (新增 code，如 code=3)

**快照路径:** `modules/g8-drone-imaging-migration.md` § 2.15

---

## 3. 快照测试与校验

### 3.1 生成快照文件
**命名规范:** `<PageName>_<scenario>.snap.json` (参考 migration.md § 3)

- [ ] `Page01_Cover_normal.snap.json` - 正常提交（40秒倒计时+勾选+点击）
- [ ] `Page01_Cover_blocked.snap.json` - 阻断场景（未勾选复选框）
- [ ] `Page02_Background_normal.snap.json` - 正常提交（5秒阅读计时）
- [ ] `Page03_Hypothesis_normal.snap.json` - 正常提交（完整输入序列 ≥5字符）
- [ ] `Page03_Hypothesis_blocked.snap.json` - 阻断场景（输入不足5字符）
- [ ] `Page04_ExperimentFree_normal.snap.json` - 正常提交（实验操作序列）
- [ ] `Page04_ExperimentFree_blocked.snap.json` - 阻断场景（未完成实验拍照）
- [ ] `Page05_FocalAnalysis_normal.snap.json` - 正常提交（选择单选项）
- [ ] `Page05_FocalAnalysis_blocked.snap.json` - 阻断场景（未选择答案）
- [ ] `Page06_HeightAnalysis_normal.snap.json` - 正常提交（选择单选项）
- [ ] `Page06_HeightAnalysis_blocked.snap.json` - 阻断场景（未选择答案）
- [ ] `Page07_Conclusion_normal.snap.json` - 正常提交（单选+输入 ≥5字符）
- [ ] `Page07_Conclusion_blockedA.snap.json` - 阻断A（未选择单选）
- [ ] `Page07_Conclusion_blockedB.snap.json` - 阻断B（理由不足5字符）
- [ ] `Module_Timeout.snap.json` - 超时自动提交（timer_complete + auto_submit + 占位答案）

**文件位置:** `src/submodules/g8-drone-imaging/pages/__tests__/__snapshots__/`
**生成标准:** 每个快照必须包含完整 MarkObject 结构（pageNumber/pageDesc/operationList/answerList/beginTime/endTime），符合 migration.md § 2 中对应场景样例

### 3.2 Schema 校验 (参考 migration.md § 4.1)
- [ ] 所有快照通过 `@shared/services/submission/schema.ts` 校验
- [ ] **pageNumber 格式:** `^\d+\.\d+$`（如 `"0.1"`, `"0.7"`）
- [ ] **pageDesc 格式:** `^\[[\w-]+\/[\w-]+\/\d+\] .+$`（如 `"[g8-assessment-flow/g8-drone-imaging/0] 封面与注意事项确认"`，注：stepIndex 为数字，不带 "step" 前缀）
- [ ] **targetElement 前缀:**
  - 业务元素: `^P\d+\.\d+_.+$`（如 `"P0.1_确认阅读"`, `"P0.3_控制变量理由"`）
  - 系统元素: `"page"`, `"module"`, `"next_button"`, `"capture_button"`, `"reset_button"` 等
- [ ] **eventType 枚举:** 必须在 `EventTypes` 中（禁止字符串字面量）
- [ ] **code 连续性:** 从1递增，无重复，无跳号
- [ ] **时间格式:** `YYYY-MM-DD HH:mm:ss`（严格24小时制）
- [ ] **UTF-8 编码:** 所有中文字符正确显示（无乱码如 `"已确�?"`）
- [ ] **value 结构化:** timer/input_change/delete/click_blocked 使用 JSON 格式（非简单字符串）

### 3.3 最小事件集合检查 (参考 migration.md § 4.2)
**基础事件（所有页面）:**
- [ ] `page_enter` (code=1, targetElement: "page", value: 页面标识, **含 pageId 字段**)
- [ ] `flow_context` (code=2, targetElement: "module", **value 为 JSON 含 flowId/stepIndex/submoduleId/moduleName/pageId**)
- [ ] `page_exit` (倒数第二, targetElement: "page", value: 页面标识)
- [ ] `next_click` 或等效导航事件 (targetElement: "next_button")
- [ ] `page_submit_success` (最后, targetElement: "page", **value 含 duration_ms/auto_submit/pageNumber/pageDesc**)

**条件事件:**
- [ ] **阻断场景:** `click_blocked` (value 含 `reason` 和 `missing` 数组)
- [ ] **输入页:** `input_focus` → `input_change` (≥1次, JSON 格式) → `input_blur` 序列
- [ ] **选择页:** `radio_select` (value: 选项值) 或 `checkbox_check`/`uncheck`
- [ ] **计时页:** `timer_start` (JSON 含 duration/unit) → `timer_stop` (JSON 含 reason/elapsed)
- [ ] **实验页:** `simulation_operation` 序列（每次操作, JSON 含 action/value）
- [ ] **超时场景:** `timer_complete` (JSON 含 reason/elapsed) → `auto_submit` (JSON 含 reason/currentPage)

**缺失判定:**
- [ ] 任何页面缺少 `flow_context` → 错误（必需）
- [ ] 任何页面缺少 `page_submit_success`/`failed` → 错误（必需）
- [ ] 阻断场景缺少 `click_blocked` → 警告（应有）

### 3.4 answerList 验证 (参考 migration.md § 4.3)
- [ ] **仅非空答案:** 仅包含用户实际完成的答案（空值不上报，超时占位 `"超时未回答"` 除外）
- [ ] **targetElement 前缀:** 格式 `P${pageNumber}_<业务ID>`（如 `"P0.1_确认阅读"`, `"P0.3_控制变量理由"`）
- [ ] **code 递增:** 从1开始递增（通常先完成的答案 code 小）
- [ ] **value 格式:**
  - 文本输入: 字符串（如 `"为了保证实验的单一变量原则"`）
  - 单选/复选: 选项值（如 `"A"`, `"B"`, `"已确认"`）
  - 实验历史: **JSON 字符串**（如 `"[{\"height\":100,\"focal\":24,\"gsd\":2.50}]"`，注意双重转义）
- [ ] **超时占位:** 未完成答案填充 `"超时未回答"` (targetElement 对应必填题，新增 code)
- [ ] **无重复:** 同一 targetElement 不重复出现（除非业务逻辑允许多次作答）

---

## 4. CI/Lint 守卫 (参考 migration.md § 5)

### 4.1 禁止直连接口 (API Guard)
- [ ] **搜索模式:** `fetch\(.*\/stu\/saveHcMark.*\)` 或 `apiClient\.post\(.*saveHcMark.*\)`
- [ ] **移除直连:** 所有提交必须通过 `usePageSubmission` Hook
- [ ] **ESLint 规则:** 添加 `no-restricted-syntax` 禁止直接调用
- [ ] **CI 检查:** `npm run lint` 失败若检测到直连调用
- [ ] **白名单:** `@shared/hooks/usePageSubmission.ts` 本身除外

### 4.2 禁止旧格式前缀 (Format Guard)
- [ ] **pageNumber 检测:** 正则 `"pageNumber"\s*:\s*"[^0-9.]|"pageNumber"\s*:\s*"\d+:"` (检测冒号格式或 M 前缀)
- [ ] **targetElement 检测:** 正则 `P[1-9]_` (旧前缀，应为 `P0.1_` 等)
- [ ] **ESLint 规则:** 自定义规则检测字符串字面量
- [ ] **CI 失败:** 若发现旧格式，返回错误码并提示修正

### 4.3 禁止未枚举事件 (Event Type Guard)
- [ ] **检查范围:** 所有 `logOperation` 调用的 `eventType` 参数
- [ ] **合规方式:** 必须使用 `EventTypes.CLICK`, `EventTypes.INPUT_CHANGE` 等枚举
- [ ] **禁止方式:** 字符串字面量如 `"click"`, `"input_change"`
- [ ] **ESLint 规则:** `@typescript-eslint/no-magic-string` 针对 `eventType` 字段
- [ ] **CI 验证:** TypeScript 编译器 + ESLint 双重检查

---

## 5. 测试验证 (参考 migration.md § 7)

### 5.1 单元测试（每页组件）
- [ ] **快照断言:** 对比实际生成的 MarkObject 与 `__snapshots__/*.snap.json` 快照文件
- [ ] **阻断逻辑:** 测试未满足条件时触发 `click_blocked`（如未勾选、输入不足、未选择等）
- [ ] **targetElement 前缀:** 验证所有业务元素使用 `P${pageNumber}_` 格式
- [ ] **事件序列:** 验证 `page_enter` → `flow_context` → ... → `page_exit` → `page_submit_success` 顺序
- [ ] **覆盖率:** 每页至少覆盖正常场景 + 阻断场景（若有校验）

### 5.2 集成测试（模块级）
- [ ] **完整流程:** 从 Page01 到 Page07 连续提交，验证 pageNumber 递增（0.1 → 0.7）
- [ ] **超时自动提交:** 模拟 20 分钟计时器到期，验证 `timer_complete` → `auto_submit` → 占位答案
- [ ] **Flow 上下文注入:** 验证每页 `flow_context` 事件正确包含 `flowId/stepIndex/submoduleId/moduleName/pageId`
- [ ] **答案汇总:** 验证多页答案累积到最终 answerList（code 不重复）
- [ ] **编码测试:** 验证中文字符（如 `"已确认"`, `"为了保证"`）无乱码

### 5.3 手动验证（DEV/STG 环境）
- [ ] **完整走查:** 按正常用户路径完成所有 7 页，检查无报错
- [ ] **阻断场景:** 故意触发每页校验（如不勾选、不输入），验证错误提示和 `click_blocked` 记录
- [ ] **Network 面板:** 确认无直接 `POST /stu/saveHcMark` 请求（仅通过 `usePageSubmission` 中转）
- [ ] **Console 面板:** 无 targetElement 前缀错误、eventType 枚举错误、时间格式错误
- [ ] **快照对比:** 导出实际提交的 MarkObject，对比 migration.md § 2 样例，确认格式一致
- [ ] **UTF-8 验证:** 查看后端接收到的数据，确认中文字符正确（无 `"已确�?"` 等乱码）

---

## 6. 文档更新

### 6.1 代码注释（源文件内）
- [ ] **前缀对照表:** 在 `Component.tsx` 或 `README.md` 中添加表格说明新旧前缀映射
  ```
  旧前缀 → 新前缀
  P1_     → P0.1_
  P3_     → P0.3_
  P4_     → P0.4_
  ...
  ```
- [ ] **stepIndex 说明:** 在 `DroneImagingContext.tsx` 注释中明确 `stepIndex=0` 是假设值，实际由 Flow 动态计算
- [ ] **pageNumber 计算:** 引用 `encodeCompositePageNum(stepIndex, subPageNum)` 公式

### 6.2 README 更新（模块级）
- [ ] **更新路径:** `src/submodules/g8-drone-imaging/README.md`
- [ ] **新增章节:** "数据提交格式"，说明 MarkObject 结构、pageNumber 编码、targetElement 前缀规则
- [ ] **迁移示例:** 引用 `openspec/changes/migrate-g8-drone-imaging-submission/modules/g8-drone-imaging-migration.md` § 2 样例
- [ ] **breaking changes:** 标注不兼容旧格式（若有回退需求，保留转换层说明）

### 6.3 OpenSpec 归档
- [ ] **完成标记:** 所有 tasks.md 条目标记 `[x]`
- [ ] **验证清单:** 确认 Schema/最小事件/快照/CI 全部通过
- [ ] **归档命令:** `openspec archive migrate-g8-drone-imaging-submission`（生成归档摘要）
- [ ] **归档位置:** `openspec/changes/archive/migrate-g8-drone-imaging-submission/`
- [ ] **更新索引:** 在 `openspec/changes/archive/INDEX.md` 中添加条目（若有）
