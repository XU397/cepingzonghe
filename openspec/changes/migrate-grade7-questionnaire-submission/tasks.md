## 1. 接入统一提交
- [ ] 1.1 接入新版 `usePageSubmission`，移除旧 FormData/直连接口；提供上下文/页面元数据/answers/operations。
- [ ] 1.2 统一 `<stepIndex>.<subPageNum>` 页码、`pageDesc` 前缀、`P${pageNumber}_...` targetElement。

## 2. 埋点与答案
- [ ] 2.1 包装输入/选择控件，记录 focus/change/blur/input_change/select_change；“下一页”记录 `next_click`，阻断写 `click_blocked`。
- [ ] 2.2 answerList 仅非空答案（可读文本）；超时写占位答案。

## 3. 校验与验证
- [ ] 3.1 启用 Schema 校验；添加快照（代表性问卷页）验证事件集/前缀/答案过滤。
- [ ] 3.2 清理遗留前缀/页码/手写 code/时间，lint 通过。
