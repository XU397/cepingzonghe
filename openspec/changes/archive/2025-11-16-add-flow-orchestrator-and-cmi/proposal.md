# Proposal: add-flow-orchestrator-and-cmi

## Why
- 需要支持“拼装式测评（Flow）”，按子模块序列组合交互/问卷；
- 现有模块结构需通过包装器输出“子模块接口（CMI）”，以便编排器动态加载与切换；
- 与批次绑定、登录返回 flow url + 进度对接。

## What Changes
- 新增 FlowDefinition/Progress 协议与 FlowOrchestrator 运行时；
- 新增 CMI（Composable Module Interface）子模块契约；
- 新增 TransitionPage 触发与进度持久化规则；
- 约定子模块包装器目录结构（`submodules/<submoduleId>/` + `registry.ts`）与 shared 类型导出；
- 统一记录 `flow_context` 操作日志，串联 flowId/submoduleId/stepIndex；
- 与后端登录返回结构化 progress 协议对齐（或兼容复合 pageNum）。

## Impact
- FE 交互端可在不改业务题页面的前提下快速组合新的评测流；
- 管理后台 Flow Composer 可通过 submoduleId 列表生成 definition；
- 后端只需返回 `/flow/<id>` 与 progress 即可对接。
