## Tasks: add-api-client-and-endpoints

## 1. 客户端与端点
- [x] 1.1 定义 `apiClient.ts`（fetch/axios 二选一，默认 `credentials: 'include'`）
- [x] 1.2 定义 `endpoints.ts`（集中管理 `/saveHcMark` 等）
- [x] 1.3 统一 401 → `handleSessionExpired`，其余错误抛出由调用方处理

## 2. 开发与代理
- [x] 2.1 DEV 代理透传 Cookie/Set-Cookie（文档）

## Implementation Summary
- ✅ 创建 `src/shared/services/api/apiClient.ts` - 完整 API 客户端
- ✅ 创建 `src/shared/services/api/errors.ts` - 错误类定义
- ✅ 创建 `src/shared/services/api/types.ts` - TypeScript 类型
- ✅ 创建 `src/shared/services/api/endpoints.ts` - 端点集中管理
- ✅ 创建 `src/shared/services/api/index.ts` - 统一入口
- ✅ 更新 `src/shared/services/api/README.md` - 完整文档
- ✅ 构建验证通过 (`npm run build`)

## 待集成
- [x] AppContext 集成 - 需在 `src/context/AppContext.jsx` 中调用 `apiClient.setSessionExpiredHandler(handleSessionExpired)`
