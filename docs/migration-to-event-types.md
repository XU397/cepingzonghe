# 事件枚举迁移指南

本指南帮助现有交互模块将手写事件字符串迁移到 `src/shared/services/submission/eventTypes.js` 所提供的枚举，并统一 `MarkObject` 生成与 Flow `pageDesc` 前缀的写法。

## 旧字符串到枚举的映射

| 旧事件字符串 | 新枚举常量 | 说明 |
| --- | --- | --- |
| `page_enter` | `EventTypes.PAGE_ENTER` | 页面加载/挂载 |
| `page_exit` | `EventTypes.PAGE_EXIT` | 页面卸载/离开 |
| `click` | `EventTypes.CLICK` | 常规点击操作 |
| `input` / `input_blur` | `EventTypes.INPUT` / `EventTypes.INPUT_BLUR` | 输入框填答/离焦 |
| `radio_select` | `EventTypes.RADIO_SELECT` | 单选题选项点击 |
| `checkbox_check` / `checkbox_uncheck` | `EventTypes.CHECKBOX_CHECK` / `EventTypes.CHECKBOX_UNCHECK` | 多选题勾选/取消 |
| `modal_open` / `modal_close` | `EventTypes.MODAL_OPEN` / `EventTypes.MODAL_CLOSE` | 资料弹窗开/关 |
| `view_material` | `EventTypes.VIEW_MATERIAL` | 查看素材、提示等 |
| `timer_start` / `timer_stop` | `EventTypes.TIMER_START` / `EventTypes.TIMER_STOP` | 计时器开始/结束 |
| `simulation_timing_started` | `EventTypes.SIMULATION_TIMING_STARTED` | 实验倒计时开始 |
| `simulation_run_result` | `EventTypes.SIMULATION_RUN_RESULT` | 实验运行结果 |
| `simulation_operation` | `EventTypes.SIMULATION_OPERATION` | 实验交互细节 |
| `questionnaire_answer` | `EventTypes.QUESTIONNAIRE_ANSWER` | 问卷题目作答 |
| `flow_context` | `EventTypes.FLOW_CONTEXT` | Flow 首页上下文对象（flowId/submoduleId/stepIndex/pageId?） |
| `page_submit_success` / `page_submit_failed` | `EventTypes.PAGE_SUBMIT_SUCCESS` / `EventTypes.PAGE_SUBMIT_FAILED` | 提交成功/失败打点 |
| `session_expired` / `network_error` | `EventTypes.SESSION_EXPIRED` / `EventTypes.NETWORK_ERROR` | 提交链路的补充错误事件（遵循 Data Format Spec 可扩展条款） |

> 使用方式：`import EventTypes from '@shared/services/submission/eventTypes.js';` 后，通过 `EventTypes.PAGE_ENTER` 等常量替代字符串，避免拼写错误。

## 常见事件编码示例

### 页面进入/退出

```js
import EventTypes from '@shared/services/submission/eventTypes.js';
import createMarkObject from '@shared/services/submission/createMarkObject.js';

const mark = createMarkObject({
  pageNumber: 'M1:01',
  pageDesc: '[flow-001/g7-experiment/0] 注意事项',
  beginTime: new Date(),
  endTime: new Date(),
  operationList: [
    {
      targetElement: '页面',
      eventType: EventTypes.FLOW_CONTEXT,
      value: { flowId: 'flow-001', submoduleId: 'g7-experiment', stepIndex: 0 },
      time: '2025-01-20 09:00:01',
      pageId: 'Page_Notice',
    },
    {
      targetElement: '页面',
      eventType: EventTypes.PAGE_ENTER,
      value: '进入注意事项',
      time: '2025-01-20 09:00:01',
    },
    {
      targetElement: '页面',
      eventType: EventTypes.PAGE_EXIT,
      value: '离开注意事项',
      time: '2025-01-20 09:01:03',
    },
  ],
  answerList: [],
});
```

### 问卷题目

```js
const mark = createMarkObject({
  pageNumber: 'P21',
  pageDesc: '问卷-学习态度',
  beginTime: '2025-01-20 09:02:00',
  endTime: '2025-01-20 09:04:12',
  operationList: [
    {
      targetElement: '问卷-问题1',
      eventType: EventTypes.RADIO_SELECT,
      value: 'A',
      time: '2025-01-20 09:03:00',
    },
    {
      targetElement: '问卷答案提交',
      eventType: EventTypes.QUESTIONNAIRE_ANSWER,
      value: '已提交',
      time: '2025-01-20 09:04:10',
    },
    {
      targetElement: '提交状态',
      eventType: EventTypes.PAGE_SUBMIT_SUCCESS,
      value: 'submitPageMarkData success',
      time: '2025-01-20 09:04:11',
    },
  ],
  answerList: [
    { targetElement: 'Q1', value: 'A' },
    { targetElement: 'Q2', value: 'B' },
  ],
});
```

### 实验操作

```js
const mark = createMarkObject({
  pageNumber: 'P05',
  pageDesc: '实验-P05-控制变量',
  beginTime: '2025-01-20 09:05:00',
  endTime: '2025-01-20 09:08:30',
  operationList: [
    {
      targetElement: '实验倒计时',
      eventType: EventTypes.SIMULATION_TIMING_STARTED,
      value: { duration: 180 },
      time: '2025-01-20 09:05:01',
      pageId: 'Page_Experiment_05',
    },
    {
      targetElement: '实验运行',
      eventType: EventTypes.SIMULATION_OPERATION,
      value: { step: '调整变量', value: '电压+1' },
      time: '2025-01-20 09:06:12',
    },
    {
      targetElement: '实验结果',
      eventType: EventTypes.SIMULATION_RUN_RESULT,
      value: { output: 32.1 },
      time: '2025-01-20 09:07:55',
    },
  ],
  answerList: [],
});
```

## Flow `pageDesc` 规范

- **前缀格式**：`[flowId/submoduleId/stepIndex] 原始页面描述`。示例：`[flow-001/g7-experiment/0] 注意事项`。
- **记录时机**：在 `usePageSubmission.submit()` 内通过 `pageDescUtils.enhancePageDesc` 自动补充（Flow 信息来自 `getFlowContext`），不建议手写字符串。
- **与 flow_context 对齐**：`pageDesc` 前缀与首条 `flow_context` 操作的 `value` 字段必须一致，便于后端检索、排查。
- **兼容旧模块**：历史页面可在迁移阶段双写（旧 `pageDesc` + 新前缀），验证无误后再移除旧描述，确保线下排障信息可读。

完成上述迁移后，可结合 `validateMarkObject(mark)` 在提交前做最少化校验，确保事件类型、`code` 连续性与 `value` 类型满足 Data Format Spec。
