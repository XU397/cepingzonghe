## Proposal: add-api-client-and-endpoints

## Why
- 统一 API 客户端与端点配置，确保 Cookie/会话策略一致，减少散落的 fetch 实现。

## What Changes
- 新增 `shared/services/api/apiClient.ts` 与 `endpoints.ts` 约定；
- 默认 `credentials: 'include'` 与错误路径（401 → handleSessionExpired）。

## Impact
- 降低实现重复与安全风险，配合统一提交 Hook 复用。
