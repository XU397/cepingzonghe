# g7-tracking-and-questionnaire-migration - Submodules Inventory

生成时间: 2026-02-08 13:35:23
任务: 盘点现状并冻结 g7-tracking/g7-questionnaire 的页面与提交契约

---

## g7-questionnaire Inventory

### Pages & Mapping

**映射配置文件**: `src/submodules/g7-questionnaire/mapping.ts`

| subPageNum | pageId                             | 页面描述       |
| ---------- | ---------------------------------- | -------------- |
| 1          | Page_20_Questionnaire_Intro        | 问卷说明页     |
| 2          | Page_21_Curiosity_Questions        | 好奇心问题     |
| 3          | Page_22_Creativity_Questions       | 创造力问题     |
| 4          | Page_23_Imagination_Questions      | 想象力问题     |
| 5          | Page_24_Science_Efficacy_Questions | 科学效能感问题 |
| 6          | Page_25_Environment_Questions      | 环境问题       |
| 7          | Page_26_School_Activities          | 校内活动       |
| 8          | Page_27_Outschool_Activities       | 校外活动       |
| 9          | Page_28_Effort_Submit              | 完成页（提交） |

**完成页**: Page_28_Effort_Submit（subPageNum = 9）

**代码证据路径**: `src/submodules/g7-questionnaire/mapping.ts:12-23`

---

### Submission Points

**提交机制**: Grade7Wrapper → AssessmentPageFrame

| 触发场景     | UI 动作              | 应使用的 eventType | 证据路径                                           |
| ------------ | -------------------- | ------------------ | -------------------------------------------------- |
| 正常导航     | 用户点击"下一页"按钮 | `next_click`       | `src/shared/ui/PageFrame/AssessmentPageFrame.jsx`  |
| 超时自动提交 | 问卷倒计时结束       | `auto_submit`      | `src/context/AppContext.jsx:isQuestionnaireTimeUp` |

**提交入口**: AssessmentPageFrame 的 submission config

- 证据路径: `src/modules/grade-7/wrapper.jsx:190-248`（Grade7Wrapper submissionConfig）
- 证据路径: `src/shared/services/submission/usePageSubmission.js`（提交 hook）

**提交数据格式**: 由 Grade7Wrapper 的 buildMark 方法构建

- 证据路径: `src/modules/grade-7/wrapper.jsx:199-233`

---

### Timer & Timeout

**计时器类型**: 问卷计时器

| 属性     | 值                                   | 证据路径                                        |
| -------- | ------------------------------------ | ----------------------------------------------- |
| 默认时长 | 10 分钟（600 秒）                    | `src/submodules/g7-questionnaire/mapping.ts:39` |
| 计时器键 | `module.grade-7.questionnaire`       | `src/modules/grade-7/wrapper.jsx:42`            |
| 管理方式 | AppContext + FlowModule/TimerService | `src/context/AppContext.jsx`                    |

**超时触发链**:

```
isQuestionnaireTimeUp (AppContext)
  → handleTimeout (g7-questionnaire Component)
  → flowContext.onTimeout()
  → FlowModule 超时处理
```

**代码证据路径**:

- 定义: `src/submodules/g7-questionnaire/mapping.ts:37-41`
- 触发: `src/submodules/g7-questionnaire/Component.jsx:47-59`
- 监听: `src/submodules/g7-questionnaire/Component.jsx:55-59`

**风险**: 目前依赖 AppContext 的 isQuestionnaireTimeUp，需确保 FlowModule 的 TimerService 正确同步状态。

---

### Persistence Keys

**存储键列表**（由 AppContext 管理）:

| localStorage 键          | 用途       | 是否需要 wrapper 清理 |
| ------------------------ | ---------- | --------------------- |
| batchCode                | 批次编码   | 否                    |
| examNo                   | 考号       | 否                    |
| moduleUrl                | 模块 URL   | 否                    |
| pageNum                  | 页面编号   | 否                    |
| ... (其他 AppContext 键) | 应用级状态 | 否                    |

**无 module-specific localStorage 键**（g7-questionnaire 子模块本身不使用专用存储）

**代码证据路径**: `src/context/AppContext.jsx:522-527`（tracking\_ 相关键，但 g7-questionnaire 不使用）

---

### Flow Bridge Responsibilities

**责任清单**:

| 职责         | 实现位置                    | 状态      |
| ------------ | --------------------------- | --------- |
| 页面进度同步 | `updateModuleProgress` 调用 | ✅ 已实现 |
| 完成信号触发 | `flowContext.onComplete()`  | ✅ 已实现 |
| 超时信号触发 | `flowContext.onTimeout()`   | ✅ 已实现 |

**代码证据路径**:

- 进度同步: `src/submodules/g7-questionnaire/Component.jsx:17-27, 29-31`
- 完成信号: `src/submodules/g7-questionnaire/Component.jsx:33-45`
- 超时信号: `src/submodules/g7-questionnaire/Component.jsx:47-59`

**完成条件**:

- 到达完成页：`currentPageId === 'Page_28_Effort_Submit'`
- 或者 `isQuestionnaireCompleted === true`

---

### Gaps vs schema.ts

| 字段                   | schema 要求                                              | 当前实现                    | 差距                                 |
| ---------------------- | -------------------------------------------------------- | --------------------------- | ------------------------------------ |
| **pageNumber 格式**    | `<submoduleIndex>.<pageIndexTwoDigits>`（如 "1.03"）     | 简单页码 "1"-"9"            | ❌ 需要转换为点分格式                |
| **targetElement 前缀** | `P{X.YY}_...`（如 "P1.03_button"）                       | 当前未明确                  | ⚠️ 需要确认 Grade7Wrapper 的映射逻辑 |
| **required events**    | `page_enter`, `page_exit`, `next_click` 或 `auto_submit` | 由 AssessmentPageFrame 处理 | ✅ 应已满足（需验证）                |

**schema 规则源**: `src/shared/services/submission/schema.ts`

**关键验证点**:

- `isValidPageNumber()` 要求: `/^[1-9]\d*\.\d{2}$/`（第 52 行）
- `isValidTargetElement()` 要求: `/^P[1-9]\d*\.\d{2}_.+/`（第 53 行）
- `ensureRequiredEvents()` 要求: 必须包含 page_enter、page_exit、next_click 或 auto_submit（第 281-294 行）

---

### Migration Notes (Wrapper Bridge mode)

**集成模式**: Wrapper Bridge（复用现有 Grade7Wrapper）

**迁移路径**:

```
g7-questionnaire Component
  → Grade7Wrapper (src/modules/grade-7/wrapper.jsx)
  → AssessmentPageFrame (src/shared/ui/PageFrame/AssessmentPageFrame.jsx)
  → usePageSubmission (src/shared/services/submission/usePageSubmission.js)
```

**关键集成点**:

1. **Flow 集成**: 通过 `flowContext` prop 传递，用于进度和完成/超时信号
2. **提交集成**: Grade7Wrapper 的 `submissionConfig` 接入 AssessmentPageFrame
3. **计时器集成**: FlowModule/TimerService 统一管理，AppContext 同步状态
4. **页码转换**: wrapper 的 `useGrade7PageMeta` 负责转换为 schema 格式

**代码证据路径**:

- Wrapper 调用: `src/submodules/g7-questionnaire/Component.jsx:79-84`
- Flow 接收: `src/modules/grade-7/wrapper.jsx:167-171`（flowContext.stepIndex 使用）
- 页码转换: `src/modules/grade-7/adapter.ts`（useGrade7PageMeta）
- 提交配置: `src/modules/grade-7/wrapper.jsx:190-248`

**风险评估**:

- ✅ 低风险：Grade7Wrapper 已通过 g7-experiment 验证
- ⚠️ 需确认：g7-questionnaire 的 9 页是否完全映射到 Grade7Wrapper 的页面集
- ⚠️ 需验证：Page_20-28 是否在 Grade7Wrapper 的 pageInfoMapping 中

---

## g7-tracking-experiment Inventory

### Pages & Mapping

**映射配置文件**: `src/submodules/g7-tracking-experiment/mapping.ts`

| subPageNum | 旧 pageNum | pageId             | 页面描述           |
| ---------- | ---------- | ------------------ | ------------------ |
| 1          | 1          | Page_01_Intro      | 蜂蜜的奥秘         |
| 2          | 2          | Page_02_Question   | 提出问题           |
| 3          | 3          | Page_03_Resource   | 资料阅读           |
| 4          | 4          | Page_04_Hypothesis | 假设陈述           |
| 5          | 5          | Page_05_Design     | 方案设计           |
| 6          | 6          | Page_06_Evaluation | 方案评估           |
| 7          | 7          | Page_07_Transition | 过渡页             |
| 8          | 8          | Page_08_Experiment | 模拟实验           |
| 9          | 9          | Page_09_Analysis1  | 实验分析1          |
| 10         | 10         | Page_10_Analysis2  | 实验分析2          |
| 11         | 11         | Page_11_Analysis3  | 实验分析3          |
| 12         | 12         | Page_12_Solution   | 方案选择           |
| 13         | 13         | Page_13_Summary    | 任务总结（完成页） |

**完成页**: Page_13_Summary（subPageNum = 13，旧 pageNum = 13）

**代码证据路径**:

- 子模块映射: `src/submodules/g7-tracking-experiment/mapping.ts:1-49`
- 完整模块映射: `src/modules/grade-7-tracking/config.js:7-26`

---

### Submission Points

**提交机制**: TrackingProvider → submitPageData → userContext.submitPageDataWithInfo

| 触发场景     | UI 动作              | 应使用的 eventType | 证据路径                        |
| ------------ | -------------------- | ------------------ | ------------------------------- |
| 正常导航     | 用户点击"下一页"按钮 | `next_click`       | TrackingProvider.navigatePage() |
| 超时自动提交 | 40分钟倒计时结束     | `auto_submit`      | TrackingProvider 超时监听器     |

**提交入口**: TrackingProvider.submitPageData

- 证据路径: `src/modules/grade-7-tracking/context/TrackingProvider.jsx:756-789`

**数据格式**: TrackingProvider.buildMarkObject 构建 MarkObject

- 证据路径: `src/modules/grade-7-tracking/context/TrackingProvider.jsx:576-699`

**提交 API**: `/stu/saveHcMark`（通过 userContext.submitPageDataWithInfo）

- 证据路径: `src/modules/grade-7-tracking/context/TrackingProvider.jsx:770-774`

---

### Timer & Timeout

**计时器类型**: 探究任务计时器

| 属性     | 值                                     | 证据路径                                                    |
| -------- | -------------------------------------- | ----------------------------------------------------------- |
| 默认时长 | 40 分钟（2400 秒）                     | `src/modules/grade-7-tracking/config.js:46`                 |
| 计时器键 | `module.g7-tracking.task`              | `src/modules/grade-7-tracking/config.js:49`                 |
| 管理方式 | TimerService + session.taskTimerActive | `src/modules/grade-7-tracking/context/TrackingProvider.jsx` |

**超时触发链**:

```
TimerService 倒计时结束
  → session.taskTimeRemaining === 0 && session.taskTimerActive
  → useEffect 监听器触发
  → navigateToPage(13)（跳转到任务总结页）
  → 流程桥接: flowContext.onTimeout()
```

**代码证据路径**:

- 计时器配置: `src/modules/grade-7-tracking/config.js:46,49`
- 超时监听器: `src/modules/grade-7-tracking/context/TrackingProvider.jsx:950-983`
- 流程桥接触发: `src/submodules/g7-tracking-experiment/Component.jsx:56-64`

**风险**: TimerService 和 session.taskTimeRemaining 可能不同步，需确保单一数据源。

---

### Persistence Keys

**存储键列表**（由 TrackingProvider 管理）:

| localStorage 键               | 用途                   | 是否需要 wrapper 清理 |
| ----------------------------- | ---------------------- | --------------------- |
| tracking_sessionId            | 会话 ID                | ✅ 是，用户切换时清理 |
| tracking_session              | 会话状态（包括计时器） | ✅ 是                 |
| tracking_experimentTrials     | 实验试验数据           | ✅ 是                 |
| tracking_chartData            | 图表数据               | ✅ 是                 |
| tracking_textResponses        | 文本回答               | ✅ 是                 |
| tracking_questionnaireAnswers | 问卷答案               | ✅ 是                 |
| batchCode, examNo             | 用户身份（共享）       | 否                    |

**代码证据路径**:

- 写入: `src/modules/grade-7-tracking/context/TrackingProvider.jsx:925-929`
- 读取: `src/modules/grade-7-tracking/context/TrackingProvider.jsx:217-269`
- 清理: `src/modules/grade-7-tracking/context/TrackingProvider.jsx:94-106`

**Wrapper 清理策略**:

- 在 flowContext.flowId 或 flowContext.stepIndex 变化时，应清理上述 tracking\_ 键
- 避免跨用户/session 污染

---

### Flow Bridge Responsibilities

**责任清单**:

| 职责             | 实现位置                                   | 状态      |
| ---------------- | ------------------------------------------ | --------- |
| 页面进度同步     | `updateModuleProgress(subPageNum)`         | ✅ 已实现 |
| 完成信号触发     | `flowContext.onComplete()`                 | ✅ 已实现 |
| 超时信号触发     | `flowContext.onTimeout()`                  | ✅ 已实现 |
| 计时器上下文注入 | `getFlowContext()` 提供给 TrackingProvider | ✅ 已实现 |

**代码证据路径**:

- 页面进度: `src/submodules/g7-tracking-experiment/Component.jsx:18-28, 30-32`
- 完成信号: `src/submodules/g7-tracking-experiment/Component.jsx:34-46`
- 超时信号: `src/submodules/g7-tracking-experiment/Component.jsx:48-64`
- flowContext 注入: `src/submodules/g7-tracking-experiment/Component.jsx:77-81`

**完成条件**:

- 到达实验完成页：`currentPageId === PAGE_MAPPING[13]?.pageId`（即 Page_13_Summary）

**计时器注入**:

- 通过 `userContext.getFlowContext()` 提供，供 useDataLogger 注入 flow_context 事件
- 证据路径: `src/submodules/g7-tracking-experiment/Component.jsx:77-81`

---

### Gaps vs schema.ts

| 字段                   | schema 要求                                              | 当前实现                                                   | 差距                                         |
| ---------------------- | -------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------- |
| **pageNumber 格式**    | `<submoduleIndex>.<pageIndexTwoDigits>`（如 "1.13"）     | 简单数字 "1"-"13"                                          | ❌ 需要转换为点分格式                        |
| **targetElement 前缀** | `P{X.YY}_...`（如 "P1.13_button"）                       | 当前未明确                                                 | ⚠️ 需要确认 TrackingProvider 的映射逻辑      |
| **required events**    | `page_enter`, `page_exit`, `next_click` 或 `auto_submit` | TrackingProvider.buildMarkObject 包含 page_enter/page_exit | ✅ 应已满足（需验证 next_click/auto_submit） |

**schema 规则源**: `src/shared/services/submission/schema.ts`

**关键验证点**:

- `isValidPageNumber()` 要求: `/^[1-9]\d*\.\d{2}$/`（第 52 行）
- `isValidTargetElement()` 要求: `/^P[1-9]\d*\.\d{2}_.+/`（第 53 行）
- `ensureRequiredEvents()` 要求: 必须包含 page_enter、page_exit、next_click 或 auto_submit（第 281-294 行）

**当前实现分析**:

- TrackingProvider.buildMarkObject（第 636-646 行）构建 operationList
- eventType 通过 mapEventType 映射（第 583-634 行），支持 click、page_enter、page_exit 等
- 需确认：页面导航时是否记录了 `next_click` 事件

---

### Migration Notes (Wrapper Bridge mode)

**集成模式**: Wrapper Bridge（直接复用 Grade7TrackingModule + FlowBridge）

**迁移路径**:

```
g7-tracking-experiment Component
  → TrackingProvider (src/modules/grade-7-tracking/context/TrackingProvider.jsx)
  → TrackingProvider.submitPageData → useDataLogger
  → userContext.submitPageDataWithInfo (/stu/saveHcMark)
```

**关键集成点**:

1. **Flow 集成**: ExperimentFlowBridge 子组件监听 TrackingProvider 的 session 状态
2. **进度同步**: 使用 `getPageNumByPageId(pageId)` 将 TrackingProvider 的页面 ID 转换为 subPageNum
3. **完成/超时**: 监听 `session.currentPage` 和 `session.taskTimeRemaining`
4. **计时器**: FlowModule 的 TimerService 应与 TrackingProvider 的 TimerService 协同

**代码证据路径**:

- 子组件桥接: `src/submodules/g7-tracking-experiment/Component.jsx:7-73`（ExperimentFlowBridge）
- 页面转换: `src/submodules/g7-tracking-experiment/mapping.ts:32-49`（getPageNumByPageId）
- 完成监听: `src/submodules/g7-tracking-experiment/Component.jsx:42-46`
- 超时监听: `src/submodules/g7-tracking-experiment/Component.jsx:56-64`

**风险评估**:

- ✅ 低风险：直接复用已验证的 TrackingProvider
- ⚠️ 需确认：TimerService 是否存在双重来源（FlowModule + TrackingProvider 内部）
- ⚠️ 需验证：session.currentPage 与 TrackingProvider.navigatePage() 的同步性

---

## g7-tracking-questionnaire Inventory

### Pages & Mapping

**映射配置文件**: `src/submodules/g7-tracking-questionnaire/mapping.ts`

| subPageNum | 旧 pageNum | pageId             | 页面描述                   |
| ---------- | ---------- | ------------------ | -------------------------- |
| 1          | 14         | Questionnaire_01   | 问卷调查第1页              |
| 2          | 15         | Questionnaire_02   | 问卷调查第2页              |
| 3          | 16         | Questionnaire_03   | 问卷调查第3页              |
| 4          | 17         | Questionnaire_04   | 问卷调查第4页              |
| 5          | 18         | Questionnaire_05   | 问卷调查第5页              |
| 6          | 19         | Questionnaire_06   | 问卷调查第6页              |
| 7          | 20         | Questionnaire_07   | 问卷调查第7页              |
| 8          | 21         | Questionnaire_08   | 问卷调查第8页              |
| -          | 22         | Page_22_Completion | 完成页（不计入子模块步骤） |

**完成页**: Page_22_Completion（旧 pageNum = 22，非子模块内页面）

**代码证据路径**:

- 子模块映射: `src/submodules/g7-tracking-questionnaire/mapping.ts:1-54`
- 完整模块映射: `src/modules/grade-7-tracking/config.js:27-38`

---

### Submission Points

**提交机制**: TrackingProvider → submitPageData → userContext.submitPageDataWithInfo

| 触发场景     | UI 动作              | 应使用的 eventType | 证据路径                        |
| ------------ | -------------------- | ------------------ | ------------------------------- |
| 正常导航     | 用户点击"下一页"按钮 | `next_click`       | TrackingProvider.navigatePage() |
| 超时自动提交 | 10分钟倒计时结束     | `auto_submit`      | TrackingProvider 超时监听器     |

**提交入口**: TrackingProvider.submitPageData

- 证据路径: `src/modules/grade-7-tracking/context/TrackingProvider.jsx:756-789`

**数据格式**: TrackingProvider.buildMarkObject 构建 MarkObject（问卷页使用 questionnaireAnswers）

- 证据路径: `src/modules/grade-7-tracking/context/TrackingProvider.jsx:648-664`（问卷页答案构建）

**提交 API**: `/stu/saveHcMark`（通过 userContext.submitPageDataWithInfo）

- 证据路径: `src/modules/grade-7-tracking/context/TrackingProvider.jsx:770-774`

---

### Timer & Timeout

**计时器类型**: 问卷计时器

| 属性     | 值                                              | 证据路径                                                    |
| -------- | ----------------------------------------------- | ----------------------------------------------------------- |
| 默认时长 | 10 分钟（600 秒）                               | `src/modules/grade-7-tracking/config.js:47`                 |
| 计时器键 | `module.g7-tracking.questionnaire`              | `src/modules/grade-7-tracking/config.js:50`                 |
| 管理方式 | TimerService + session.questionnaireTimerActive | `src/modules/grade-7-tracking/context/TrackingProvider.jsx` |

**超时触发链**:

```
TimerService 倒计时结束
  → session.questionnaireTimeRemaining === 0 && session.questionnaireTimerActive
  → useEffect 监听器触发
  → navigateToPage(22)（跳转到完成页）
  → 流程桥接: flowContext.onTimeout()
```

**代码证据路径**:

- 计时器配置: `src/modules/grade-7-tracking/config.js:47,50`
- 超时监听器: `src/modules/grade-7-tracking/context/TrackingProvider.jsx:989-1022`
- 流程桥接触发: `src/submodules/g7-tracking-questionnaire/Component.jsx:60-64`

**风险**: TimerService 和 session.questionnaireTimeRemaining 可能不同步，需确保单一数据源。

---

### Persistence Keys

**存储键列表**（与 g7-tracking-experiment 共享，由 TrackingProvider 管理）:

| localStorage 键               | 用途                   | 是否需要 wrapper 清理 |
| ----------------------------- | ---------------------- | --------------------- |
| tracking_sessionId            | 会话 ID                | ✅ 是，用户切换时清理 |
| tracking_session              | 会话状态（包括计时器） | ✅ 是                 |
| tracking_experimentTrials     | 实验试验数据           | ✅ 是                 |
| tracking_chartData            | 图表数据               | ✅ 是                 |
| tracking_textResponses        | 文本回答               | ✅ 是                 |
| tracking_questionnaireAnswers | 问卷答案               | ✅ 是                 |
| batchCode, examNo             | 用户身份（共享）       | 否                    |

**代码证据路径**:

- 写入: `src/modules/grade-7-tracking/context/TrackingProvider.jsx:925-929`
- 读取: `src/modules/grade-7-tracking/context/TrackingProvider.jsx:217-269`
- 清理: `src/modules/grade-7-tracking/context/TrackingProvider.jsx:94-106`

**Wrapper 清理策略**:

- 在 flowContext.flowId 或 flowContext.stepIndex 变化时，应清理上述 tracking\_ 键
- 避免 experiment 和 questionnaire 子模块之间的数据污染

---

### Flow Bridge Responsibilities

**责任清单**:

| 职责         | 实现位置                           | 状态      |
| ------------ | ---------------------------------- | --------- |
| 页面进度同步 | `updateModuleProgress(subPageNum)` | ✅ 已实现 |
| 完成信号触发 | `flowContext.onComplete()`         | ✅ 已实现 |
| 超时信号触发 | `flowContext.onTimeout()`          | ✅ 已实现 |

**代码证据路径**:

- 页面进度: `src/submodules/g7-tracking-questionnaire/Component.jsx:18-28, 30-32`
- 完成信号: `src/submodules/g7-tracking-questionnaire/Component.jsx:34-50`
- 超时信号: `src/submodules/g7-tracking-questionnaire/Component.jsx:52-64`

**完成条件**:

- 到达问卷完成页：`session.currentPage === 22` 且 `PAGE_MAPPING[22]?.pageId === questionnaireCompletionPageId`

**关键逻辑**:

- 问卷完成页（pageNum = 22）不计入子模块的 8 步内
- 子模块的 `getTotalSteps()` 返回 8（QUESTIONNAIRE_PAGE_NUMBERS.length）
- 完成信号仅在到达 Page_22_Completion 时触发

---

### Gaps vs schema.ts

| 字段                   | schema 要求                                              | 当前实现                                                   | 差距                                         |
| ---------------------- | -------------------------------------------------------- | ---------------------------------------------------------- | -------------------------------------------- |
| **pageNumber 格式**    | `<submoduleIndex>.<pageIndexTwoDigits>`（如 "1.08"）     | 简单数字 "1"-"8"                                           | ❌ 需要转换为点分格式                        |
| **targetElement 前缀** | `P{X.YY}_...`（如 "P1.08\_问题1"）                       | 当前格式 `P{pageNum}_问题{idx}`                            | ❌ 需要转换为点分格式                        |
| **required events**    | `page_enter`, `page_exit`, `next_click` 或 `auto_submit` | TrackingProvider.buildMarkObject 包含 page_enter/page_exit | ✅ 应已满足（需验证 next_click/auto_submit） |

**schema 规则源**: `src/shared/services/submission/schema.ts`

**关键验证点**:

- `isValidPageNumber()` 要求: `/^[1-9]\d*\.\d{2}$/`（第 52 行）
- `isValidTargetElement()` 要求: `/^P[1-9]\d*\.\d{2}_.+/`（第 53 行）
- `ensureRequiredEvents()` 要求: 必须包含 page_enter、page_exit、next_click 或 auto_submit（第 281-294 行）

**当前实现分析**:

- TrackingProvider.buildMarkObject（第 656-664 行）构建问卷页 answerList
- targetElement 格式：`P${pn}_问题${idx + 1}`（如 "P14\_问题1"）
- 需转换为：`P{stepIndex}.{subPageNum}_问题{idx}`（如 "P1.08\_问题1"）

---

### Migration Notes (Wrapper Bridge mode)

**集成模式**: Wrapper Bridge（直接复用 Grade7TrackingModule + FlowBridge）

**迁移路径**:

```
g7-tracking-questionnaire Component
  → TrackingProvider (src/modules/grade-7-tracking/context/TrackingProvider.jsx)
  → TrackingProvider.submitPageData → useDataLogger
  → userContext.submitPageDataWithInfo (/stu/saveHcMark)
```

**关键集成点**:

1. **Flow 集成**: QuestionnaireFlowBridge 子组件监听 TrackingProvider 的 session 状态
2. **进度同步**: 使用 `getPageNumByPageId(pageId)` 将 TrackingProvider 的页面 ID 转换为 subPageNum
3. **完成/超时**: 监听 `session.currentPage` 和 `session.questionnaireTimeRemaining`
4. **页码映射**: 问卷页的 pageNum（14-21）需要转换为 subPageNum（1-8）

**代码证据路径**:

- 子组件桥接: `src/submodules/g7-tracking-questionnaire/Component.jsx:7-73`（QuestionnaireFlowBridge）
- 页面转换: `src/submodules/g7-tracking-questionnaire/mapping.ts:31-48`（getPageNumByPageId）
- 页码索引转换: `src/submodules/g7-tracking-questionnaire/mapping.ts:50-53`（QuestionPageIndex）
- 完成监听: `src/submodules/g7-tracking-questionnaire/Component.jsx:42-50`
- 超时监听: `src/submodules/g7-tracking-questionnaire/Component.jsx:60-64`

**风险评估**:

- ✅ 低风险：直接复用已验证的 TrackingProvider
- ⚠️ 需确认：TimerService 是否存在双重来源（FlowModule + TrackingProvider 内部）
- ⚠️ 需验证：experiment 和 questionnaire 子模块是否会共享 localStorage 数据污染

**特殊处理**:

- 完成页（Page_22_Completion）不在子模块的 8 步内
- 子模块的 `getTotalSteps()` 返回 8，而不是 9（不包括完成页）
- 完成信号仅在 session.currentPage === 22 时触发

---

## 附录：代码证据路径汇总

### 关键文件清单

| 功能区域       | 文件路径                                                    | 用途                                   |
| -------------- | ----------------------------------------------------------- | -------------------------------------- |
| **子模块定义** | `src/submodules/g7-questionnaire/Component.jsx`             | g7-questionnaire 入口                  |
| **子模块定义** | `src/submodules/g7-tracking-experiment/Component.jsx`       | g7-tracking-experiment 入口            |
| **子模块定义** | `src/submodules/g7-tracking-questionnaire/Component.jsx`    | g7-tracking-questionnaire 入口         |
| **子模块映射** | `src/submodules/g7-questionnaire/mapping.ts`                | g7-questionnaire 页面映射              |
| **子模块映射** | `src/submodules/g7-tracking-experiment/mapping.ts`          | g7-tracking-experiment 页面映射        |
| **子模块映射** | `src/submodules/g7-tracking-questionnaire/mapping.ts`       | g7-tracking-questionnaire 页面映射     |
| **模块配置**   | `src/modules/grade-7-tracking/config.js`                    | 完整页面映射和计时器配置               |
| **状态管理**   | `src/modules/grade-7-tracking/context/TrackingProvider.jsx` | TrackingProvider 核心逻辑              |
| **Wrapper**    | `src/modules/grade-7/wrapper.jsx`                           | Grade7Wrapper（用于 g7-questionnaire） |
| **Adapter**    | `src/modules/grade-7/adapter.ts`                            | Grade7 页码/目标元素转换逻辑           |
| **Schema**     | `src/shared/services/submission/schema.ts`                  | 提交数据格式验证规则                   |
| **提交 Hook**  | `src/shared/services/submission/usePageSubmission.js`       | 统一提交 hook                          |

### localStorage 键清单

| 键名                          | 使用模块         | 清理位置                             |
| ----------------------------- | ---------------- | ------------------------------------ |
| tracking_sessionId            | grade-7-tracking | AppContext.jsx, TrackingProvider.jsx |
| tracking_session              | grade-7-tracking | AppContext.jsx, TrackingProvider.jsx |
| tracking_experimentTrials     | grade-7-tracking | TrackingProvider.jsx                 |
| tracking_chartData            | grade-7-tracking | TrackingProvider.jsx                 |
| tracking_textResponses        | grade-7-tracking | TrackingProvider.jsx                 |
| tracking_questionnaireAnswers | grade-7-tracking | TrackingProvider.jsx                 |
| batchCode                     | 全局             | AppContext                           |
| examNo                        | 全局             | AppContext                           |

### 计时器键清单

| 计时器键                         | 用途                            | 时长    | 管理模块                        |
| -------------------------------- | ------------------------------- | ------- | ------------------------------- |
| module.g7-tracking.task          | 探究任务计时器                  | 40 分钟 | TimerService + TrackingProvider |
| module.g7-tracking.questionnaire | 问卷计时器                      | 10 分钟 | TimerService + TrackingProvider |
| module.grade-7.task              | 探究任务计时器（g7-experiment） | 40 分钟 | TimerService + AppContext       |
| module.grade-7.questionnaire     | 问卷计时器（g7-questionnaire）  | 10 分钟 | TimerService + AppContext       |

---

**盘点完成时间**: 2026-02-08 13:35:23
**下次更新**: 根据迁移进展补充验证结果

---

## 2026-02-08 Task 3 Learnings

- 在 `TrackingProvider.buildMarkObject` 边界做 schema 兼容改造可最小化对 legacy 页面的影响：页面层不改，提交结构统一达标。
- legacy 页码到新页码可稳定映射为 `X.YY`：`X=stepIndex+1`（无 flow 时回退 `1`）；`YY` 对 1..13/14..21/22 分段映射，`0.1/0.2` 使用高位保留段避免冲突。
- targetElement 规范化要先移除旧前缀（如 `P14_`）再重建 `P{X.YY}_...`，否则会被 schema 正则拒绝。
- 为了防止页面日志缺项，`page_enter`/`page_exit`/`next_click|auto_submit` 需要在构建时兜底补齐，并在最后重排 code 为 1..N 连续序号。
- flow 场景可在 MarkObject 内直接补充 `flow_context` 事件（优先读取 `userContext.getFlowContext`），与提交层注入逻辑兼容。

## 2026-02-08 Task 4 Learnings

- g7-tracking-experiment 和 g7-tracking-questionnaire wrapper 的 Flow 注入模式需要保持一致。
- 通过创建 `enhancedUserContext` 注入 `getFlowContext()` 方法，使 legacy tracking module 的 `useDataLogger` 能获取 flow_context。
- 这种 injection 模式与提交层注入逻辑兼容，确保 Flow 模式下所有 submission 都包含正确的 flow_context 字段。

## 2026-02-08 Task 6 Learnings - Submission Guard Fix

- Fixed 23 eslint no-unused-vars errors in submoduleAdapter files by adding eslint-disable comments for function type signature parameters that are intentionally unused but required by TypeScript.
- Updated inline snapshot in validate-events.test.js to include new event types added to EventTypeValues (demo_complete, demo_play, dialogue_play, dialogue_replay, drag_end, drag_start, key_press, task_drop, task_remove, timeout).
- The eslint-disable comments are necessary because TypeScript function type signatures require parameter names for documentation, but eslint's no-unused-vars rule doesn't recognize underscore-prefixed names in type signatures.
- All submission tests now pass: npm run lint:submission, npm run test:submission, npm run test:submission-format all green.

## 2026-02-08 Task 5 Learnings - g7-questionnaire integration

- Added `g7-questionnaire.integration.test.jsx` under submission tests to verify the wrapper-bridge path `Grade7Wrapper -> AssessmentPageFrame submission config -> usePageSubmission` end-to-end.
- The test renders `Grade7Wrapper` on `Page_21_Curiosity_Questions`, captures `submission` config from mocked `AssessmentPageFrame`, then calls `submit()` through `usePageSubmission` with a mocked `submitImpl`.
- Assertions cover final submitted `mark` contract: `pageNumber` regex, prefixed non-reserved `targetElement`, required lifecycle events (`page_enter`, `page_exit`, `next_click|auto_submit`), and non-empty `answerList` values.

## 2026-02-08 Task Learnings - g7-tracking submission schema integration

- Added `g7-tracking.integration.test.jsx` to build marks through real `TrackingProvider` + `buildMarkObject`, not mocked payload builders.
- The harness clears localStorage each test, records minimal operations (`page_enter`, `next_click`, `page_exit`) and answer data, then validates both experiment (`1 -> 1.01`) and questionnaire (`14 + stepIndex=1 -> 2.01`) cases.
- Assertions now explicitly cover pageNumber regex, targetElement prefix normalization for non-reserved fields, required lifecycle events, and `validateMarkObject(mark)` pass conditions.

## 2026-02-08 Task Learnings - g7-tracking-questionnaire bridge test coverage

- Added `g7-tracking-questionnaire.bridge.test.jsx` to verify `G7TrackingQuestionnaireComponent` bridge behavior using mocked `Grade7TrackingModule` and `useTrackingContext`.
- Tests confirm `getFlowContext` injection into userContext returns the provided flowContext object with all required properties.
- Progress update tests verify `updateModuleProgress` is called only for questionnaire pages (14-21) with correct subPageNum values, and not called for experiment pages (1-13).
- Completion tests validate `onComplete` triggers only on page 22 and fires once even with multiple renders.
- Timeout tests ensure `onTimeout` fires only when questionnaire timer expires (timerActive=true, timeRemaining=0).
- Test suite enforces critical bridge invariants: flow context injection, progress boundaries, completion guards, and timeout behavior.
