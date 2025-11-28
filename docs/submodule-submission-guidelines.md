# 子模块数据提交流程与规范（执行手册）

本手册汇总子模块接入统一提交流程的关键要求，便于实现与验收。参考基准：`docs/submission-format-standard.md`、`openspec/changes/update-unified-submission-pipeline/specs/data-format/spec.md`、`.../specs/submission/spec.md`。

## 1. 页码与前缀
- 页码：`pageNumber = encodeCompositePageNum(stepIndex, subPageNum)` → `<stepIndex>.<subPageNum>`（如 `0.3`），禁止 `M*`/冒号格式。
- 页面描述：`pageDesc` 前缀 `[flowId/submoduleId/stepIndex]`，无 Flow 时省略前缀。
- 目标前缀：所有 `targetElement` 以 `P${pageNumber}_...` 开头。

## 2. 事件与操作（operationList）
- 标准事件集合：`page_enter`、`page_exit`、`click`、`change`、`input`、`input_focus`、`input_change`、`input_delete`、`input_blur`、`select_change`、`radio_select`、`checkbox_check`、`checkbox_uncheck`、`modal_open`、`modal_close`、`view_material`、`timer_start`、`timer_stop`、`timer_complete`、`simulation_timing_started`、`simulation_run_result`、`simulation_operation`、`questionnaire_answer`、`flow_context`、`auto_submit`、`next_click`、`page_submit_success`、`page_submit_failed`、`click_blocked`。
- 最小事件集合（每页必须）：`page_enter`、`page_exit`、`next_click`（或等效下一步）、阻断时 `click_blocked`（含 `missing` 列表）；输入/选择类记录 focus/change/delete/blur 或 select_change；实验/计时页记录参数调整、计时开始/结束、运行结果。
- 输入 value 示例：`input_change` 用 `{ prev, next }` 或 `{ prevLength, nextLength, delta? }`；`input_delete` 用 `{ action: 'delete', prevLength, nextLength }` 或前后快照。
- flow 上下文：提交层自动注入单条 `flow_context`（含 flowId/stepIndex/submoduleId/moduleName/pageId?）。

## 3. 答案（answerList）

### 3.1 基本规则
- **仅记录非空答案**：空字符串/null/undefined 不入列。
- **超时占位**：由提交层自动补齐"超时未回答"占位符。
- **字段结构**：每条答案包含 `code`（序号）、`targetElement`（问题文本）、`value`（答案内容）。

### 3.2 targetElement 格式要求
- **必须使用完整问题文本**，便于后续评分时了解问题上下文。
- **禁止使用简短题目ID**（如 `P0.5_最小GSD焦距`），应使用完整问题（如 `"问题2：根据模拟实验，当飞行高度为100米时，使用何种焦距可以使地面采样距离（GSD）达到最小？"`）。
- **特殊类型答案**（如实验历史、元数据）可使用描述性标识（如 `experiment_captures`）。

### 3.3 value 格式要求

#### 单选题
- **必须包含选项标签和内容**，格式：`"<选项ID>. <选项文本>"`
- ✅ 正确示例：`"A. 8毫米"`、`"B. 镜头焦距"`
- ❌ 错误示例：`"A"`、`"B"`（仅选项ID，缺少内容）

#### 多选题
- 格式：`"<选项1>, <选项2>"`（逗号分隔完整选项）
- 示例：`"A. 温度, C. 湿度, D. 光照"`

#### 文本输入题
- 直接记录用户输入的完整文本
- 示例：`"为了保证实验的准确性和可重复性"`

#### 复杂数据（实验历史、截图元数据等）
- value 为 **JSON 字符串**
- 示例：`"{\"height\":100,\"focal\":24,\"gsd\":1.00}"`

### 3.4 数据示例

#### 示例1：单选题答案
```json
{
  "code": 1,
  "targetElement": "问题2：根据模拟实验，当飞行高度为100米时，使用何种焦距可以使地面采样距离（GSD）达到最小？",
  "value": "B. 24毫米"
}
```

#### 示例2：文本输入题答案
```json
{
  "code": 1,
  "targetElement": "问题1：为什么在每次航拍时，都需要确保相机分辨率和天气条件等一致？请写出原因。",
  "value": "为了保证实验的准确性和可重复性"
}
```

#### 示例3：实验历史数据
```json
{
  "code": 2,
  "targetElement": "experiment_captures",
  "value": "[{\"height\":100,\"focalLength\":8,\"gsd\":3.01,\"timestamp\":\"2025-02-01 09:05:12\"},{\"height\":100,\"focalLength\":24,\"gsd\":1.00,\"timestamp\":\"2025-02-01 09:05:45\"}]"
}
```

#### 示例4：完整 answerList（多题）
```json
{
  "answerList": [
    {
      "code": 1,
      "targetElement": "问题4：右图展示了飞行高度、镜头焦距与地面采样距离（GSD）的关系曲线。请问在航拍中，为获取更高精度的影像，应优先考虑降低飞行高度还是调整镜头焦距？",
      "value": "B. 镜头焦距"
    },
    {
      "code": 2,
      "targetElement": "请说明你的理由：",
      "value": "根据图表数据，调整焦距对降低GSD效果更佳。"
    }
  ]
}
```

### 3.5 与 operationList 的区别
- **operationList.targetElement**：使用题目ID前缀（如 `P0.5_最小GSD焦距`），用于追踪用户操作。
- **answerList.targetElement**：使用完整问题文本，便于评分和理解。
- **operationList 记录过程，answerList 记录结果**。

## 4. 提交流程
- 唯一入口：使用新版 `usePageSubmission`（或框架默认助手）；子模块仅提供 `getUserContext`、`getFlowContext`、`pageMeta(pageId/pageTitle/subPageNum)`、已过滤的 `answers` 与业务 `operations`。
- 提交层职责：编码页码/前缀、flow_context 注入、自增 code、时间兜底（`YYYY-MM-DD HH:mm:ss`）、Schema 校验、统一 API 提交，自动追加 `page_submit_success/failed` 与超时 `auto_submit`。
- 禁止：直连 `/stu/saveHcMark`、手写 code/时间/前缀/flow_context。

## 5. 守卫与验证
- Schema：TS+Zod/JSON Schema 校验必填字段、事件枚举、code 连续性、前缀、时间格式。
- Lint/测试：检查 targetElement 前缀、事件合法性与最小事件集合缺失即失败；提交格式快照测试覆盖代表性页面。

## 6. 提案交付要求（给各子模块）
- 迁移页清单：列出 pageNumber/pageId/标题，标注类型（实验/问卷/过渡/计时等）及特殊页（计时、阻断、复杂实验）。
- 样例快照：为 2–3 个典型页给出期望 `MarkObject` 示例（操作覆盖最小事件集合，答案仅非空/超时占位，前缀/时间格式正确）。
- 验证计划：说明快照/fixture 覆盖的页面，是否有历史数据清洗/兼容需求。
