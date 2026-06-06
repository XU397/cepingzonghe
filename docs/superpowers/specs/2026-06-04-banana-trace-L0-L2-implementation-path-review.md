# 香蕉变黑 L2 轨迹标准化：L0→L2 实现路径评估

日期：2026-06-04
关联设计：`docs/superpowers/specs/2026-06-04-banana-trace-standardization-design.md`
关联规范：`docs/子模块数据上报规范/01轨迹上报规范.md`

## 评估结论

设计文档在决策层面（不改后端、不双写旧事件、registry 校验、页面类型模板）做得很好，但 L0→L1→L2 的实现路径没有串通。作为决策和约束文档是合格的，作为实施指导缺少关键内容。

---

## 1. 核心问题：L0→L2 变换管道未定义

轨迹规范定义了四个层次：

| 层级 | 职责 | 举例 |
|---|---|---|
| L0 | 浏览器原始事件 | `pointer_enter`, `wheel`, `focus`, `input` |
| L1 | Registry ID 绑定 | 把 `focus` 绑定到 `field_id=input_question_1` |
| L2 | 标准事件写入 operationList | `TEXT_FOCUS { field_id: "input_question_1", ... }` |
| L3/L4 | 后端行为标签/过程特征 | 不由前端生成 |

当前代码（`TrackedInput`/`TrackedTextarea`）直接把浏览器事件映射为扁平的 `INPUT_FOCUS`/`INPUT_CHANGE`/`INPUT_BLUR`，没有分层。

设计文档提出的方案是：

> 页面调用标准 logger 的语义化方法，例如 `textFocus()`、`textChange()`、`textBlur()`

这意味着 L0→L1→L2 的变换被封装在"共享标准事件层"内部，页面不感知 L0。这本身是合理的架构，但设计文档没有回答以下关键问题。

---

## 2. 变换发生在哪里？谁来做？

### 设计文档的三层架构

```
页面接入层 → 调用 textFocus() / textChange() / ...
    ↓
香蕉实例配置层 → 提供 TRACE_PAGE_CONFIGS (page_id, field_id 映射)
    ↓
共享标准事件层 → createTraceEvent(), createPageTraceLogger()
```

### 缺失问题

- `textFocus()` 接收什么参数？`field_id` 是页面传入还是从配置自动绑定？
- debounce/throttle 在哪一层执行？`TextEventCollector` 是什么？它和 `createPageTraceLogger()` 是什么关系？
- 变换后的 L2 事件最终怎么进入现有的 `logOperation` → `operations[]` → `buildMark` 管道？

### 建议补充

补充一张 L0→L1→L2 数据流图，明确每一层的输入、输出和职责边界。例如：

```
浏览器 L0 事件 (focus/input/blur/click/scroll/intersection)
    ↓ [TrackedInput / IntersectionObserver / ScrollListener]
EventCollector (L0→L1 绑定 + debounce/throttle)
    ↓ [field_id / content_id / question_id 绑定]
TraceLogger (L1→L2 标准事件构造)
    ↓ [createTraceEvent() 产出标准 L2 事件]
logOperation() → operations[] → buildMark() → submit
```

---

## 3. 各类事件的具体实现路径未展开

### 3.1 文本事件（TEXT_FOCUS / TEXT_CHANGE / TEXT_BLUR）

**当前实现：**
- `TrackedInput` 组件直接调用 `logOperation` 发出 `INPUT_FOCUS`/`INPUT_CHANGE`
- `INPUT_CHANGE.value` 为 `{ prev, next }` 过程明文，每次按键触发

**设计要求：**
- 防抖 2000ms、节流 10 字符
- `TEXT_CHANGE.value_after` 默认留空
- 最终完整文本只在 `TEXT_BLUR.value_after`

**缺失：**
- `TextEventCollector` 在哪创建？是 hook 还是 class？
- 谁管理防抖定时器和字符累计？
- 怎么和 `TrackedInput` 的 `onChange` 衔接？
- `TextEventCollector` 和现有 `TrackedInput` 组件是什么关系？替换还是组合？

**建议补充：** 给出 `TextEventCollector` 的接口签名和生命周期说明，以及与 `TrackedInput` 的关系（替换 / 包装 / 新建）。

### 3.2 材料查看事件（CONTENT_EXPOSE / CHAT_SCROLL）

**当前实现：**
- Page03 完全没有滚动/曝光采集
- Page02 聊天区无滚动聚合

**设计要求：**
- IntersectionObserver + 500ms 曝光阈值
- 300ms 滚动段聚合
- `visible_content_ids_before` / `visible_content_ids_after`
- `CONTENT_ACTIVATE` 需要 600ms 鼠标停留

**缺失：**
- 谁创建 Observer？谁管理 dwell 计时？谁合并滚动段？
- 这些是共享层提供 hook 还是页面自己实现？
- `ContentEventCollector` 的接口和生命周期？
- Observer 在页面卸载时的清理策略？

**建议补充：** 给出 `ContentEventCollector`（或 `useContentTracking` hook）的接口签名，说明 Observer 创建、阈值判断、事件产出的完整流程。

### 3.3 实验事件（SET_EXP_PARAM / EXECUTE_EXP）

**当前实现：**
- `SimulationPanel` 直接 `logOperation({ eventType: 'SIMULATION_OPERATION' })`
- 无参数快照、无实验运行 ID、无防双击

**设计要求：**
- `SET_EXP_PARAM` 带 `param_snapshot`
- `EXECUTE_EXP` 带 `exp_run_id` + `result_snapshot` + 1500ms 防双击

**缺失：**
- `SimulationPanel` 怎么从当前模式迁移到新的 trace logger？
- `exp_run_id` 谁生成？`param_snapshot` 的结构是什么？
- 防双击窗口在哪一层实现？`ExperimentEventCollector` 还是 `SimulationPanel` 自己？

**建议补充：** 给出 `ExperimentEventCollector` 的接口和 `SimulationPanel` 改造方案。

### 3.4 第 12 页方案表事件（ADD_ROW / DELETE_ROW / SET_PLAN_PARAM / SELECT_BEST）

**当前实现：**
- Page13SolutionSelection 直接 `logOperation` 记录操作，无稳定 `row_id`

**设计要求：**
- 动态行必须使用稳定 `row_id`，不能依赖行号
- `SET_PLAN_PARAM` 带 `param_id=plan_param_1/plan_param_2`
- `SELECT_BEST` 带 `previous_best_row_id` / `current_best_row_id`

**缺失：**
- `row_id` 谁生成？什么格式？存在哪？
- `DynamicTableEventCollector` 的接口？
- 怎么追踪行的新增、删除、重排？

**建议补充：** 给出 `row_id` 生成策略和 `DynamicTableEventCollector` 接口。

---

## 4. value 格式变更的兼容路径不明确

### 当前 value 处理链

```
页面 → logOperation({ value: { prev, next } })
  → normalizeOperationValueForAdapter: JSON.stringify(value)
    → createMarkObject: value 以 object 传入，最终 stringify
```

### 设计要求的 value 结构

```json
{
  "trace_id": "uuid",
  "page_id": "page_02_question_generation",
  "field_id": "input_question_1",
  "value_before": "...",
  "value_after": "...",
  "metadata": { ... }
}
```

### 缺失问题

- `createMarkObject.js` 的 `normalizeOperationValue` 当前对 object 直接 pass-through——但如果后端或传输层需要字符串，谁来 stringify？
- 设计文档提到"如旧共享提交 schema 要求 value 为字符串，需要同步升级为支持对象"，但没有给出决策：到底 stringify 还是传对象？
- `validateMark.ts` 当前校验 value 类型，新方案需要更新校验逻辑
- 后端 `saveHcMark` 解析 `mark` 字段时，`operationList[*].value` 当前期望什么类型？

### 建议补充

- 明确 `value` 在 Mark JSON 中是对象还是 JSON 字符串
- 如果是对象，列出需要改动的共享层文件（`createMarkObject.js`、`validateMark.ts`、`schema.ts`）
- 如果是字符串，说明 stringify 的时机和责任方

---

## 5. L2 事件怎么注入现有的 operationList

### 当前管道

```
logOperation() → reducer 追加到 operationLogs[]
  → buildMark() → operationLogs 直接作为 operationList
    → createMarkObject() 标准化 → submitPageMarkData()
```

### 缺失问题

- `createTraceEvent()` 的产出类型是什么？和现有 `OperationLog` 兼容吗？
- 新事件是追加到现有 `operations[]`（和 `PAGE_ENTER`/`flow_context` 混在一起），还是独立队列？
- `buildMark()` 需要怎么改？如果 value 变成对象，`normalizeOperationsForAdapter` 还要 stringify 吗？
- 现有的 `PAGE_ENTER` 事件和新的 `START_PAGE` 事件是什么关系？替代？共存？改名？

### 建议补充

- 定义 `TraceEvent` 类型与现有 `OperationLog` 的映射关系
- 说明 `START_PAGE` 是替代 `PAGE_ENTER` 还是独立事件
- 明确 `createTraceEvent()` 的产出如何进入 `logOperation` 管道

---

## 6. 页面映射从旧到新的迁移路径模糊

### 当前状态

`mapping.ts` 有 14 个页面配置（含 `intro_notice`），页面 ID 如 `banana_mystery`、`banana_browning_design`。

### 设计要求

新增 `TRACE_PAGE_CONFIGS` 覆盖 13 个标准页，映射 `legacyPageId → standardPageId`。

### 缺失问题

- `TRACE_PAGE_CONFIGS` 是独立于 `PAGE_CONFIGS` 的新数据结构，还是扩展后者？
- 页面组件内部获取配置的方式：当前用 `getPagePrefix()` + `logOperation()`，新方案用什么 API？
- `intro_notice` 的 `PAGE_ENTER`、`TIMER_START`、`CHECKBOX_CHECK` 等事件走旧管道还是新管道？设计说"不进入 13 页 L2 标准"，但它的事件也需要上报。

### 建议补充

- 说明 `TRACE_PAGE_CONFIGS` 和 `PAGE_CONFIGS` 的关系（独立 / 扩展 / 合并）
- 给出 `intro_notice` 事件的明确处理策略
- 说明页面组件从旧 API 迁移到新 API 的步骤

---

## 7. 共享层 API 契约未定义

设计文档列出了建议提供的构造器和校验器：

- `createTraceEvent()`
- `createPageTraceLogger()` 或 hook
- `createTracePageStartMetadata()`
- `validateTraceEventSchema()`
- `validateTraceRegistryRefs()`
- `validateTraceMark()`

但没有给出任何一个的 **接口签名**（参数类型、返回类型）。

### 建议补充

为每个共享层 API 给出 TypeScript 接口签名，例如：

```typescript
// 需要补充的接口示例（仅作格式参考，具体内容由实施确定）
interface TraceLogger {
  textFocus(fieldId: string, metadata?: Record<string, unknown>): void;
  textChange(fieldId: string, opts: TextChangeOptions): void;
  textBlur(fieldId: string, opts: TextBlurOptions): void;
  submitAttempt(opts: SubmitAttemptOptions): void;
  // ...
}
```

---

## 8. 建议补充的实现路径文档

建议在进入 `writing-plans` 之前，先补充一份 **"L0→L2 数据流与 API 接口设计"** 文档，至少包含：

| 补充项 | 需要回答的问题 |
|---|---|
| L0→L2 变换管道 | 每个 L2 事件类型对应的浏览器事件 → 变换逻辑 → 输出结构 |
| EventCollector 接口设计 | `TextEventCollector`、`ContentEventCollector`、`ExperimentEventCollector` 的 API、生命周期、和 `logOperation` 的衔接 |
| value 格式决策 | 结构化对象 vs JSON 字符串，以及 `createMarkObject` 的适配方案 |
| 共享层 API 契约 | `createPageTraceLogger()` 返回什么？页面怎么获取它？hook 签名？ |
| 与现有管道的衔接点 | 新事件如何进入 `operations[]`？`buildMark()` 需要哪些改动？ |
| 每类页面的接入范式 | B1/B2/B3/D1/D2/E1 各给出一个伪代码级接入示例 |

不补充这份文档就进入实施，前端 agent 需要在编码时自行做出大量架构决策，容易偏离规范意图。
