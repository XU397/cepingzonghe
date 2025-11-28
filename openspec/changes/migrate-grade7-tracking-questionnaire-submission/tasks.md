## 1. 接入统一提交
- [ ] 1.1 用新版 `usePageSubmission` 替换自建提交，提供上下文/页面元数据/answers/operations，移除旧 FormData。
- [ ] 1.2 统一 `<stepIndex>.<subPageNum>` 页码、`pageDesc` 前缀、`P${pageNumber}_...` targetElement。

## 2. 埋点与答案
- [ ] 2.1 问卷控件包装：focus/change/blur/input_change/select_change；下一页按钮记录 `next_click`；阻断写 `click_blocked`（missing 列表）。
- [ ] 2.2 answerList 仅非空答案；超时写占位答案。

## 3. 校验与验证
- [ ] 3.1 开启 Schema 校验；添加代表性问卷页快照验证事件集/前缀/答案过滤。
- [ ] 3.2 清理遗留前缀/页码/手写 code/时间，lint 通过。
