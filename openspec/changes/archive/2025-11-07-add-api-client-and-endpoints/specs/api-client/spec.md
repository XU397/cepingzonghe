## ADDED Requirements

### Requirement: 统一 API 客户端
前端 MUST 提供统一的 API 客户端，默认携带 Cookie 并与会话策略联动。

#### Scenario: 凭证与 401 处理
- WHEN 发起需要会话的请求
- THEN 客户端 SHALL 使用 `credentials: 'include'`；
- AND 遇到 401/Unauthorized MUST 调用 `handleSessionExpired` 执行统一清理并返回登录页。

### Requirement: 端点集中管理
端点定义 MUST 在 `shared/services/api/endpoints.ts` 统一维护，不得在业务页硬编码。

#### Scenario: 端点引用
- WHEN 页面或 Hook 需要调用接口
- THEN SHALL 从 `endpoints.ts` 引用端点路径与参数。

