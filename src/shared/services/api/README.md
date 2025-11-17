# API Client & Endpoints

统一的 API 客户端和端点管理。

## Quick Start

```typescript
import { apiClient, endpoints } from '@/shared/services/api';

// GET 请求
const data = await apiClient.get(endpoints.flow.getDefinition('g7a-mix-001'));

// POST JSON
const result = await apiClient.post(endpoints.auth.login, {
  username: 'test',
  password: '123'
});

// FormData 上传
const formData = new FormData();
formData.append('batchCode', '250619');
formData.append('mark', JSON.stringify(markObject));
await apiClient.upload(endpoints.submission.saveMark, formData);
```

## Features

- ✅ 自动携带 Cookie (`credentials: 'include'`)
- ✅ 401 自动调用 `handleSessionExpired`
- ✅ 统一错误处理
- ✅ TypeScript 类型安全
- ✅ 支持 JSON 和 FormData
- ✅ 支持请求取消 (AbortSignal)

## Error Handling

```typescript
import { isSessionExpiredError, isApiError } from '@/shared/services/api/errors';

try {
  await apiClient.get('/protected');
} catch (error) {
  if (isSessionExpiredError(error)) {
    // 已自动调用 handleSessionExpired
    console.log('Redirecting to login...');
  } else if (isApiError(error)) {
    console.error(`API Error: ${error.status} - ${error.message}`);
  } else {
    console.error('Unknown error:', error);
  }
}
```

## Migration from apiService.js

**Old**:
```javascript
import { submitPageMarkData } from '@/shared/services/dataLogger';
await submitPageMarkData({ batchCode, examNo, mark });
```

**New**:
```typescript
import { apiClient, endpoints } from '@/shared/services/api';
const formData = new FormData();
formData.append('batchCode', batchCode);
formData.append('examNo', examNo);
formData.append('mark', JSON.stringify(mark));
await apiClient.upload(endpoints.submission.saveMark, formData);
```

## API Reference

### apiClient

- `get<T>(path, options?)` - GET 请求
- `post<T>(path, data?, options?)` - POST JSON
- `put<T>(path, data?, options?)` - PUT JSON
- `delete<T>(path, options?)` - DELETE 请求
- `upload<T>(path, formData, options?)` - POST FormData

### endpoints

所有端点集中在 `endpoints` 对象中，按功能分组：
- `auth` - 认证相关（login, logout）
- `submission` - 数据提交（saveMark）
- `flow` - Flow 相关（待后端实现）
- `heartbeat` - 心跳（待后端实现）

## Configuration

通过环境变量配置 Base URL:

```env
VITE_API_BASE_URL=http://localhost:8080
```

如果未设置，默认为空字符串（使用相对路径）。

## Session Handling

在 AppContext 初始化时设置会话过期处理器:

```typescript
import { apiClient } from '@/shared/services/api';

// 在 AppContext 初始化时
apiClient.setSessionExpiredHandler(handleSessionExpired);
```

## Development

开发环境下，Vite 代理会自动转发请求并携带 Cookie。

确保 `vite.config.js` 配置正确：

```javascript
proxy: {
  '/stu': {
    target: process.env.VITE_API_TARGET,
    changeOrigin: true,
    credentials: 'include',
  }
}
```
