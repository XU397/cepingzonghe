# 统一提交数据格式规范（提交给 PO 进行 OpenSpec 变更）

## 1. 标准数据结构（MarkObject）
```ts
interface MarkObject {
  pageNumber: string;         // 组合页码（见 2. 页码规则）
  pageDesc: string;           // 示例：[flowId/submoduleId/stepIndex] 页面描述；无 Flow 时省略前缀
  operationList: Operation[]; // 交互/系统事件
  answerList: Answer[];       // 仅包含用户已填写/选择的数据
  beginTime: string;          // 统一格式时间戳（ISO 或 formatTimestamp）
  endTime: string;            // 统一格式时间戳
  imgList: ImageMeta[];       // 需要上传的图片/截图（可为空）
}
```

## 2. 页码与命名规则（修订）
- 组合页码编码：`pageNumber = encodeCompositePageNum(stepIndex, subPageNum)`，格式为 `<stepIndex>.<subPageNum>`，示例：`0.3`（不再使用前缀 `M`，分隔符改为 `.`）。
- `pageDesc = [${flowId}/${submoduleId}/${stepIndex}] ${页面描述}`；无 Flow 时仅保留页面描述。
- `targetElement` 前缀统一：`P${pageNumber}_<业务ID>`，示例：`P0.3_Q1_控制变量原因`。

## 3. operationList 规范
```ts
interface Operation {
  code: number;               // 提交层自增
  targetElement: string;      // 目标元素/区域
  eventType: string;          // 枚举/字符串：page_enter/page_exit/click/change/click_blocked/flow_context/auto_submit/...
  value: string | object;     // 字符串或可序列化对象（由提交层 stringify）
  time: string;               // 时间戳
  pageId?: string;            // 可选，便于回溯
}
```
必需/常见事件：
- `page_enter` / `page_exit`：每页进入/离开各一次。
- `flow_context`：由统一提交 Hook 自动注入，包含 flowId/stepIndex/submoduleId/moduleName。
- `click_blocked`：校验未通过时记录，`value` 内含缺失项列表。
- 业务事件：`change`（输入/选项变化）、`click`、`exp_start/exp_reset/exp_param_change` 等按业务定义。

## 4. answerList 规范
```ts
interface Answer {
  code: number;             // 提交层自增
  targetElement: string;    // 前缀规则见上
  value: string;            // 用户选择/填写的值
}
```
约束：
- 仅包含“用户已填写/选择/生成”的答案；空值不入列。
- 超时等场景需填充“超时未回答”时，由统一提交层补齐后再写入。
- 复杂数据（如实验截图/操作历史）可追加一条 Answer，`targetElement` 自定义，`value` 为 JSON 字符串。

## 5. 时间与格式
- `beginTime` / `endTime` 使用统一格式（ISO 或既有 `formatTimestamp`），提交层兜底填充缺失。

## 6. Flow 上下文
- `flow_context` 事件由提交 Hook 自动注入，子模块不手填。
- 提交时传入 `flowContext`（flowId/stepIndex/submoduleId/pageId），提交层负责合并/注入。

## 7. 提交管道（唯一入口）
- 升级/固化 `usePageSubmission` 为唯一提交入口。页面/子模块仅提供：
  - `getUserContext`（batchCode/examNo）
  - `getFlowContext`（flowId/stepIndex/submoduleId/pageId）
  - `pageMeta`（pageId/pageTitle/subPageNum）
  - `answers`（仅非空答案）
  - `operations`（业务埋点）
- 提交层完成：组合页码编码、pageDesc 前缀、targetElement 前缀、flow_context 注入、code 自增、时间兜底、Schema 校验、统一 API 提交。
- 计时超时也走该入口，由提交层补齐“超时未回答”后提交。

## 8. 校验与守护
- 在提交层使用 Schema 校验（Zod/JSON Schema）；不合规阻断提交并返回可读错误。
- CI/Lint 守卫：禁止子模块直接 `fetch /stu/saveHcMark`，禁止手写 pageNumber/targetElement 前缀，禁止绕过统一 Hook。

## 9. 页面需收集的最小数据
- 必填题目答案（非空）
- 必要的复杂附加数据（如实验历史）封装为一条 Answer，值为 JSON 字符串
- 操作埋点：page_enter/page_exit、change、click、click_blocked、关键业务事件
- 时间：beginTime/endTime 由提交层填充
- Flow 上下文：自动注入 flow_context

## 10. 落地步骤
1) 将本规范固化为 TS 类型 + Schema（`@shared/services/submission/schema.ts`），并更新 `encodeCompositePageNum` 规则为 `<stepIndex>.<subPageNum>`。
2) 升级 `usePageSubmission`：输入仅需业务 answers/ops/pageMeta，内部完成格式化/注入/校验。
3) 在 `AssessmentPageFrame` 提供默认提交配置助手，子模块零格式化接入。
4) 分批迁移子模块，移除自写 formData/fetch/手写编码。
5) 加入 CI/Lint 守卫和“提交格式快照测试”以防回退。
