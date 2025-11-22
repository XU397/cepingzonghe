## 1. Implementation
- [ ] 1.1 Read proposal and existing `openspec/specs/flow/spec.md`
- [ ] 1.2 Add Flow Completion Page requirement delta under `specs/flow`
- [ ] 1.3 Extend FlowDefinition/resolve结果支持 completion 配置（title/content/ctaLink/ctaLabel）
- [ ] 1.4 在 FlowModule 中添加 completion 状态渲染，不再默认跳转登录；进入时停止计时器与心跳
- [ ] 1.5 新增 CompletionPage 组件（复用 TransitionPage 样式/布局），填充给定文案与按钮
- [ ] 1.6 默认按钮跳转登录；保留可配置链接入口
- [ ] 1.7 测试：单步 Flow、含过渡页 Flow、计时器/心跳停用验证、按钮跳转验证
- [ ] 1.8 更新文档/备注（如有）
