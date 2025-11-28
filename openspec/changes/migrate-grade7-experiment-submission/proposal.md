## Why
- 7 年级实验模块仍使用自建 `buildMarkObject` + 手写 eventType/targetElement，未套用统一页码/前缀与完整事件枚举，行为轨迹与新规范不一致。
- 需要迁移到统一提交入口与 Schema，补齐输入/点击/实验操作等全量轨迹，避免后端数据异构。

## What Changes
- 接入新版 `usePageSubmission` 与统一 API，移除直连/手写 FormData。
- 替换页面埋点：使用标准 `targetElement` 前缀、`<stepIndex>.<subPageNum>` 页码、补齐 page_enter/page_exit/next_click、focus/change/blocked、实验操作事件。
- 采用提交层 Schema 校验与快照，确保 answerList 仅包含非空答案，超时写入占位答案。
- 增加/改写组件级埋点包装（输入/选择/按钮）以减少漏记。

## Impact
- 规格引用：`openspec/specs/submission`、`openspec/specs/data-format`。
- 代码影响：7 年级实验模块页面提交与埋点、上下文获取、页面框架调用、测试快照。
- 风险/兼容：**BREAKING**（事件/前缀/页码变更；禁止旧提交路径）；需要回放/快照验证。 
