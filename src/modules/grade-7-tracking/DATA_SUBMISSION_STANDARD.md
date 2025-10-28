# 7年级追踪测评 — 页面数据提交标准（对齐7年级测评）

本文档定义了“7年级追踪测评（grade-7-tracking）”的数据提交规范，完全对齐既有的“7年级测评（grade-7）”实现与文档（见 docs/上一个版本文档/DATA_LOGGING_SPECIFICATION.md），并结合本模块的页面结构做了映射与落地说明。

## 1. 提交载荷（Payload）

顶层采用 FormData 方式提交，字段如下：

- `batchCode`：测评批次号（来自登录）
- `examNo`：学生考号（来自登录）
- `mark`：JSON 字符串，结构见下

> 端点与方法：POST 到 `buildApiUrl('/saveHcMark')`（同源时即 `/stu/saveHcMark`）。浏览器负责 boundary；不显式设置 Content-Type。

## 2. `mark` 对象结构

```json
{
  "pageNumber": "页面编号(字符串)",
  "pageDesc": "页面描述(字符串)",
  "operationList": [
    {
      "code": 1,
      "targetElement": "交互元素描述",
      "eventType": "交互类型",
      "value": "操作值/结果",
      "time": "YYYY-MM-DD HH:mm:ss"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "问题/答案元素标识",
      "value": "答案值(字符串)"
    }
  ],
  "beginTime": "YYYY-MM-DD HH:mm:ss",
  "endTime": "YYYY-MM-DD HH:mm:ss",
  "imgList": []
}
```

实现要点（已在代码中落实）：

- `code` 从 1 开始自增；未传入时由提交层自动补齐。
- 所有时间统一格式为 `YYYY-MM-DD HH:mm:ss`。
- `value` 统一字符串化；布尔/数字等先转字符串。
- `operationList`/`answerList` 均为数组；提交前进行结构与类型规范化。

相关实现位置：

- 规范化（标准化）提交：复用 `@shared/services/dataLogger.js` 的 `createMarkObject()`（与7年级测评同源实现）
- 后端调用：`@shared/services/apiService.js` 的 `submitPageMarkData()`（构建 `FormData` 并 POST `/saveHcMark`）

## 3. 页面编号与描述映射

使用 `src/modules/grade-7-tracking/config.js` 的 `PAGE_MAPPING`：

- 过渡页：`0.1`（注意事项），`0.2`（问卷说明）
- 人机交互：`1`~`13`（蜂蜜的奥秘 → 任务总结）
- 问卷：`14`~`21`（问卷1~8）
- 完成页：`22`

提交时 `pageNumber` 取映射键名（字符串化），`pageDesc` 取 `PAGE_MAPPING[page].desc`。

## 4. 交互类型（eventType）约定

对齐 7年级测评通用字典（参考 docs/上一个版本文档/DATA_LOGGING_SPECIFICATION.md 3.节），常见取值：

- 基础：`page_enter`、`page_exit`、`click`、`input`、`input_blur`、`checkbox_check`、`checkbox_uncheck`、`radio_select`、`modal_open`、`modal_close`
- 实验：`timer_start`、`timer_stop`、`simulation_operation`
- 问卷：`questionnaire_answer`

说明：模块内部会把页面内记录的 `action` 映射到 `eventType` 原样提交；建议选择上述集合中的命名。

## 5. 答案（answerList）记录规范

- 文本输入：在“下一页”或失焦时，调用 `collectAnswer({ targetElement, value })` 收集最终值。
- 单选/多选：同上；问卷页会由基础页组件统一生成 `answerList`。
- 问卷页（14-21）：`BaseQuestionnairePage` 已将选项字母（A/B/…）映射为可读 `label` 文本并写入 `value`，便于后端直存可读内容。

注意：`answerList` 只写“最终答案”。过程操作（如输入过程、选择过程）只进入 `operationList`。

## 6. 提交时机

- 页面内“下一页”时提交当前页数据。
- 40分钟探究/10分钟问卷到时：自动提交并导航到下一阶段（代码内已处理）。
- 完成页：无须再提交题面数据，仅提供返回登录的动作（已调用全局登出，清理缓存）。

## 7. 校验与错误处理

- 必填：`batchCode`、`examNo`、`pageNumber`、`pageDesc`、`beginTime`、`endTime`。
- `operationList` 至少包含 `page_enter` 与一次有效操作（如按钮 `click`）。
- 401 会话失效：自动清缓存并跳转登录（见 `useDataLogger.handleSessionExpired`）。
- 网络错误：内置 3 次指数退避重试（1s/2s/4s）。

## 8. 示例（情景引入页，pageNumber="1"）

```json
{
  "batchCode": "250619",
  "examNo": "Z12001",
  "mark": {
    "pageNumber": "1",
    "pageDesc": "蜂蜜的奥秘",
    "operationList": [
      {"code":1,"targetElement":"Page_01_Intro","eventType":"page_enter","value":"蜂蜜的奥秘","time":"2025-10-20 09:00:01"},
      {"code":2,"targetElement":"next_page_button","eventType":"click","value":"下一页","time":"2025-10-20 09:00:35"}
    ],
    "answerList": [],
    "beginTime": "2025-10-20 09:00:01",
    "endTime": "2025-10-20 09:00:35",
    "imgList": []
  }
}
```

## 9. 代码对齐点（与 7年级测评一致）

- 统一的 API 入口：`@shared/services/apiService.submitPageMarkData`。
- 统一的规范化：复用 `@shared/services/dataLogger.createMarkObject()`（与7年级测评同源实现）。
- 统一的时间/字符串化处理与 `code` 序号自动补齐。

至此，追踪测评的提交结构、时机、字段与 7年级测评保持一致，可直接用于数据对接与验收。
