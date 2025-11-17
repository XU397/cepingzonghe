# 会话与 Cookie 策略规格（Session & Cookie Policy Spec）

本规格将 `docs/session-and-cookie-policy.md` 中的策略固化为可执行的约束，作为平台基线，适用于所有前端模块与后端接口。

## Requirements

### Requirement: 凭证与跨域
- THEN 前端 API 客户端在需要时 MUST 使用 `credentials: 'include'` 以携带 Cookie；
- AND 开发期代理需正确透传 `Cookie` 与 `Set-Cookie` 头。

### Requirement: 会话有效期判定
- THEN 平台以后端 401/Unauthorized 为过期的权威信号；
- AND 可选客户端窗口（默认 90 分钟）作为辅助过期判断，用于刷新时快速清理；
- AND 过期时 MUST 触发 `handleSessionExpired`：清空状态与缓存 → 重定向登录页。

#### Scenario: 刷新检查
- GIVEN 本地持久化 `lastSessionEndTime`
- WHEN 页面刷新或重新打开
- THEN 若距离上次时间 > 90 分钟，执行登出与清理。

### Requirement: Cookie 安全属性（后端）
- THEN 后端设置 `HttpOnly`、`Secure`（生产）与适当的 `SameSite`；
- AND 使用 `Max-Age/Expires` 控制存活时间，与前端 90 分钟窗口对齐或更严格。

### Requirement: 多标签页同步
- THEN 建议监听 `storage` 事件同步登录/登出状态，避免多标签页不一致。

### Requirement: 成功提交后的会话续期
- THEN 成功的数据提交后 MUST 更新 `lastSessionEndTime`（本地），用于客户端窗口续期；
- AND 后端可选择刷新 Cookie 有效期（若使用滑动窗口策略）。

### Requirement: 清理范围
- THEN 统一清理 localStorage/sessionStorage 键（参照 `storageKeys` 与 Tracking 缓存键）；
- AND 不得遗留任何可导致跨账号串数据的键。

## Cross‑References
- 参考：`docs/session-and-cookie-policy.md`
- 相关：`openspec/specs/assessment-core/spec.md`（401 处理）、`openspec/specs/data-format/spec.md`（提交成功回写）

