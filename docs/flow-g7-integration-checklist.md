# Flow - 7 年级相关子模块联调排查清单

本清单用于配合 `docs/flow-g7-integration-and-submission-analysis.md` 文档，与 DEV / 后端团队一起逐项排查 7 年级相关子模块在 Flow 场景下的登录、页面提交与数据落库情况。

---

## 1. 环境与开关

- 确认 `.env` 中：
  - `VITE_USE_MOCK=0`（Mock 模式关闭，走真实后端）；
- 启动 dev 时终端日志应显示：
  - “Mock 模式：已禁用（真实后端联调）”；
- 浏览器 Network 中确认：
  - `/stu/login`、`/stu/saveHcMark` 请求指向真实后端域名，而非本地 Mock。

---

## 2. 子模块级总览表

先整体确认 5 个子模块在“统一提交 / 用户上下文 / Flow 特有字段”上的接入情况。

```markdown
| 子模块ID                  | 业务模块说明               | 页码范围（逻辑） | Flow 步骤示例（可选）      | 统一提交 Hook 是否接入 | 统一用户上下文是否接入 | Flow 特有字段是否完整 | 备注 / TODO                      |
|---------------------------|----------------------------|------------------|----------------------------|------------------------|------------------------|------------------------|-----------------------------------|
| g7-experiment             | 7年级蒸馒头-交互          | P02–P19          | stepIndex=0, modulePageNum | ☐ 是 ☐ 否 ☐ 部分      | ☐ 是 ☐ 否 ☐ 部分      | ☐ 是 ☐ 否 ☐ 部分      |                                   |
| g7-questionnaire          | 7年级蒸馒头-问卷          | P20–P28          | stepIndex=0/1 ...          | ☐ 是 ☐ 否 ☐ 部分      | ☐ 是 ☐ 否 ☐ 部分      | ☐ 是 ☐ 否 ☐ 部分      |                                   |
| g7-tracking-experiment    | 7年级追踪-交互            | 1–13             | stepIndex=1, modulePageNum | ☐ 是 ☐ 否 ☐ 部分      | ☐ 是 ☐ 否 ☐ 部分      | ☐ 是 ☐ 否 ☐ 部分      |                                   |
| g7-tracking-questionnaire | 7年级追踪-问卷            | 14–21            | stepIndex=1/2 ...          | ☐ 是 ☐ 否 ☐ 部分      | ☐ 是 ☐ 否 ☐ 部分      | ☐ 是 ☐ 否 ☐ 部分      |                                   |
| g4-experiment             | 4年级火车购票-交互        | 1–11（按实现填） | stepIndex=?                | ☐ 是 ☐ 否 ☐ 部分      | ☐ 是 ☐ 否 ☐ 部分      | ☐ 是 ☐ 否 ☐ 部分      |                                   |
```

说明：
- “统一提交 Hook 是否接入”：是否通过 `usePageSubmission` 或其包装（`submitPageData` / `useDataLogger`）作为唯一提交入口，不再直接调用 `submitPageMarkData`；
- “统一用户上下文是否接入”：是否从 AppContext / TrackingContext 的 `batchCode/examNo` 获取，而不是从 mock 或旧 localStorage 键优先读取；
- “Flow 特有字段是否完整”：是否稳定带上 `flow_context` 事件和增强后的 `pageDesc` 前缀（`[flowId/submoduleId/stepIndex]`）。

---

## 3. 逐页排查模板（示例）

联调时建议为每个子模块单独建一张“逐页排查表”，访问每一页时即时记录结果。以下为 `g7-experiment` 示例表头，其它子模块可复制使用：

```markdown
### 子模块：g7-experiment（7年级蒸馒头-交互）

| 页码（逻辑） | 页面ID（如有）                | 导航模式（exp/qn） | “下一步”按钮触发函数        | 是否调用统一提交函数       | Network 是否有 /stu/saveHcMark | 使用的 batchCode/examNo 是否正确 | 是否有 flow_context 事件 | pageDesc 是否含 Flow 前缀 | 结论（已接入 / 待修复） | 备注 / TODO                         |
|--------------|-------------------------------|--------------------|-----------------------------|----------------------------|-------------------------------|-----------------------------------|---------------------------|----------------------------|--------------------------|--------------------------------------|
| P02          | Page_02_...（按实际填写）     | experiment         | submitPageData() / …        | ☐ 是 ☐ 否                  | ☐ 有 ☐ 无                      | ☐ 正确 ☐ mock/错误               | ☐ 有 ☐ 无                | ☐ 是 ☐ 否                 | ☐ 已接入 ☐ 待修复       |                                      |
| P03          |                               |                    |                             |                            |                               |                                   |                           |                            |                          |                                      |
| …            |                               |                    |                             |                            |                               |                                   |                           |                            |                          |                                      |
```

其它子模块（`g7-questionnaire`、`g7-tracking-experiment`、`g7-tracking-questionnaire`、`g4-experiment`）可使用同一模板，替换表头名称与页码范围。

**逐页检查建议步骤：**

1. 打开浏览器 DevTools → Network，过滤 `/stu/saveHcMark`；
2. 使用真实账号登录到目标 Flow（确保该批次绑定的是你要测试的 Flow）；
3. 依次访问每一页，点击“下一步”，对每一页记录：
   - 是否产生 `/stu/saveHcMark` 请求（如果没有，该页未接入或逻辑被绕过）；
   - 请求体中 `batchCode/examNo` 是否等于当前登录账号，非 mock 值；
   - `mark` 中：
     - `pageNumber` 是否为预期页码或复合页码；
     - `pageDesc` 是否含 `[flowId/submoduleId/stepIndex]` 前缀（在 Flow 场景下）；
     - `operationList` 中是否有 `eventType: "flow_context"`，且 `value` 为对象；
     - `operationList` / `answerList` 的 `code` 是否从 1 连续递增。
4. 若某页未产生请求或字段异常，在表中将“结论”标记为“待修复”，并记录页面组件路径，便于 DEV 快速定位。

---

## 4. 与后端一起核对的检查点

在前端逐页记录的基础上，建议与后端同事一起核对以下内容：

- 在 `marks` 或等价表中，按 `examNo/batchCode/flowId` 查询：
  - 是否能看到刚刚走过的所有页面；
  - `pageNumber` 与前端逐页表一致；
  - `pageDesc` 是否带有 Flow 前缀（新数据），旧数据仍然可解析。
- 在 `user_progress` 或相应进度表中：
  - 最新一条记录的 `stepIndex/modulePageNum/pageId` 是否与最后一次成功提交的 `flow_context + pageNumber` 对齐；
  - 登录接口返回的 `progress.stepIndex/modulePageNum` 是否与该进度表一致。
- 后端对旧数据的兼容策略：
  - 对无 `flow_context` / 无 Flow 前缀 `pageDesc` 的历史记录，是否已有明确解析逻辑；
  - 新数据中 Flow 字段是否必填、是否有告警或监控。

---

## 5. 对“只落部分页面”和“仍用 mock 账号”的专项排查提示

结合当前问题，联调时可以重点关注：

- “只看到 1/2/3/4/10 页”：
  - 逐页表中哪些页确实没有触发 `/stu/saveHcMark`；
  - 若触发了，请求中的 `pageNumber/pageDesc/flow_context` 是否被后端过滤或解析错误；
  - 对这些页的“下一步”按钮是否统一调用了 `submitPageData` / `useDataLogger.submitPageData`。
- “7 年级追踪仍用 mock 批次/账号”：
  - 检查 `TrackingContext.session` 中的 `batchCode/examNo` 是否来自真实登录；
  - 确认 `useDataLogger` 的 `getUserContext` 优先读取的是 `TrackingContext`，localStorage 仅作为兜底；
  - 在 Flow 登录后，是否有清理旧 mock localStorage 的逻辑（AppContext.handleLoginSuccess 里的 tracking 缓存清理应正常执行）。

通过上述清单，能够把分析文档中的架构结论落到每一个具体页面和具体请求上，帮助前后端团队快速缩小“哪些页面尚未接入统一提交 / 仍在使用 mock 用户上下文”的范围。 

---

## 6. 本次联调修复后的核对记录（2025-11-18）

以下为本次 Flow(g7-experiment-003) 联调修复后的快照记录，便于复核与回归：

### 子模块：g7-experiment（7年级蒸馒头-交互）

- 统一提交入口：已接入。所有页面通过 `AppContext.submitPageData()` → `usePageSubmission()` 提交。
- 双重提交：已修复。页面自身 `submitPageData()` 成功后，调用 `navigateToPage(..., { skipSubmit: true })`，避免二次提交。
- Flow 特有字段：已接入。`FlowAppContextBridge` 注入 `flow_context`，`pageDesc` 自动增强。

逐页核对（节选）：

| 页码 | 页面ID/文件 | 触发提交 | 是否 skipSubmit | 结果 |
|------|-------------|----------|----------------|------|
| P02  | `src/pages/IntroductionPage.jsx` | `submitPageData()` | 是 | OK |
| P03  | `src/pages/Page_03_Dialogue_Question.jsx` | `submitPageData()` | 是 | OK |
| P04  | `src/pages/Page_04_Material_Reading_Factor_Selection.jsx` | `submitPageData()` | 是 | OK |
| P10  | `src/pages/HypothesisFocusPage.jsx` | `submitPageData()` | 是 | OK |
| P11  | `src/pages/Page_11_Solution_Design_Measurement_Ideas.jsx` | `submitPageData()` | 是 | OK |
| P12  | `src/pages/Page_12_Solution_Evaluation_Measurement_Critique.jsx` | `submitPageData()` | 是 | OK |
| P13  | `src/pages/TransitionToSimulationPage.jsx` | `submitPageData()` | 是 | OK |
| P14  | `src/pages/Page_14_Simulation_Intro_Exploration.jsx` | `submitPageData()` | 是 | OK |
| P15  | `src/pages/Page_15_Simulation_Question_1.jsx` | `submitPageData()` | 是 | OK |
| P16  | `src/pages/Page_16_Simulation_Question_2.jsx` | `submitPageData()` | 是 | OK |
| P17  | `src/pages/Page_17_Simulation_Question_3.jsx` | `submitPageData()` | 是 | OK |
| P18  | `src/pages/Page_18_Solution_Selection.jsx` | `submitPageData()` | 是 | OK |
| P19  | `src/pages/Page_19_Task_Completion.jsx` | `submitPageData({ isFromButton: true })` | 是 | OK（去除直调 API） |

备注：`src/pages/Page_19_Task_Completion.jsx` 移除直接 `submitPageMarkData`，遵循统一入口。

### 子模块：g7-tracking-experiment（7年级追踪-交互）

- 统一提交入口：已接入。Tracking 模块内部通过 `TrackingProvider.submitPageData()` 使用外层 `AppContext.submitPageDataWithInfo()`，由 `usePageSubmission()` 落库。
- Flow 特有字段：已接入。新增 `getFlowContext` 透传：
  - `src/submodules/g7-tracking-experiment/Component.jsx` 注入 `getFlowContext` 至 `userContext`；
  - `src/modules/grade-7-tracking/hooks/useDataLogger.js` 调用 `usePageSubmission({ getFlowContext })`。
- 用户上下文：取自 TrackingContext（batchCode/examNo），localStorage 仅兜底。

逐页核对：

| 范围 | 代表页 | 提交流程 | Flow 字段 |
|------|--------|----------|-----------|
| 1–13 | `pages/Page03_Question.jsx` 等 | `buildMarkObject` → `submitPageData(mark)` → 外层 `usePageSubmission` | 有 flow_context + 前缀 |
| 14–21 | `components/questionnaire/BaseQuestionnairePage.jsx` | `useDataLogger.submitPageData(mark)` → `usePageSubmission` | 有 flow_context + 前缀 |

