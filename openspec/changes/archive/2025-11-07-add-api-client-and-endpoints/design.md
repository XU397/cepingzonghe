## Context
- 现有接口调用分散，`fetch` 选项不统一（如 `credentials`），401 处理不一致。
- 目标是在 shared 层提供统一 API 客户端与端点清单，减少重复并与会话策略对齐。

## Goals / Non-Goals
- Goals:
  - 统一 `credentials: 'include'`，与 Session/Cookie 策略一致。
  - 统一 401 → `handleSessionExpired` 行为与错误归一化。
  - 集中管理端点（`endpoints.ts`）。
- Non-Goals:
  - 不强制改动所有存量调用，允许渐进迁移。
  - 不更改后端接口协议（仍为 `/saveHcMark` + FormData 等）。

## Decisions
- 客户端：使用轻量 `fetch` 封装（避免额外依赖），暴露 `get/post/upload` 等便捷方法。
- 错误处理：
  - 401/Unauthorized → 调用 `handleSessionExpired` 并抛出特殊错误类型（`SessionExpiredError`）。
  - 其他错误 → 归一化为 `{ status, code, message }`。
- 配置：基于 env 提供 `BASE_URL`，DEV 通过 Vite 代理透传 Cookie/Set-Cookie。
- 类型：在 `shared/types/api.ts` 提供最小通用类型。

## APIs
- `apiClient.request<T>(path, options): Promise<T>`
  - 默认 `credentials: 'include'`；支持 `json`, `formData`, `signal`。
- `apiClient.get/post/put/delete` 简化方法。
- `endpoints.ts`：导出 `{ SAVE_MARK, LOGIN, FLOW_DEFINITION, PROGRESS_WRITE, ... }`。

## Risks / Trade-offs
- CORS 与 Cookie：需确保代理与后端 CORS 设置正确。
- 错误归一：可能与局部调用方期望不一致 → 提供错误类型判断工具。

## Migration Plan
1) 落地 `apiClient.ts` 与 `endpoints.ts`；
2) 在新能力（提交 Hook、Flow 回写）优先使用；
3) 渐进替换旧的 fetch/axios 调用；
4) DEV 配置与文档补充代理注意事项。

## Open Questions
- 是否需要全局重试策略（除提交 Hook 外）？
- BASE_URL 由环境统一还是端点各自可覆盖？

