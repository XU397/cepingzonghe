# Tasks: add-unified-page-submission-hook

## 1. 规范与接口
- [x] 1.1 定义 Hook API（usePageSubmission）与事件枚举（eventTypes）接口（仅文档与类型）
- [x] 1.2 定义提交前校验（validateMarkObject）的最小规则（引用 Data Format Spec）
- [x] 1.3 在 `shared/services/submission/` 输出 Hook、事件枚举与 `shared/types/mark` 类型

## 2. 行为约束
- [x] 2.1 重试策略：3 次（1s/2s/4s），401 不重试
- [x] 2.2 401 统一处理：调用 handleSessionExpired（清空→回登录）
- [x] 2.3 失败阻断：PROD 阻断导航；DEV 可配置放行
- [x] 2.4 首次进入子模块时支持注入 `flow_context` Operation（与 Flow 规范对齐）

## 3. 集成计划
- [x] 3.1 Grade-7-Tracking：useDataLogger 内部委托统一 Hook
- [x] 3.2 Grade-7：navigateToPage 提交改用 Hook
- [x] 3.3 Grade-4：submitPageDataInternal 改用 Hook
- [x] 3.4 Flow/CMI 包装器接入统一 Hook（含 onBefore/onAfter 钩子）

## 4. 测试修复
- [x] 4.1 修复 useCountdownTimer 测试中的假定时器回调问题
- [x] 4.2 修复 ErrorBoundary 测试中的依赖和 mock 问题
- [x] 4.3 验证所有测试通过 (22/22 tests passing)
