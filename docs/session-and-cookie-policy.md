# Session 和 Cookie 有效期策略分析

## 📊 概述

本文档详细分析了项目中用户登录后的账号有效期策略、cookies 管理机制以及 session 过期处理流程。

---

## 🔐 账号有效期策略

### 前端 Session 有效期

**有效期：90 分钟**

在 `src/context/AppContext.jsx` 第 619 行明确定义：

```javascript
const SESSION_EXPIRY_MINUTES = 90; // Session有效期：90分钟
```

### 有效期检查机制

**检查时机：** 每次页面加载/刷新时

**检查逻辑：**
```javascript
const lastSessionEndTime = localStorage.getItem('lastSessionEndTime');
const sessionEndTimeMillis = parseInt(lastSessionEndTime, 10);
const minutesSinceLastSession = (Date.now() - sessionEndTimeMillis) / (1000 * 60);

if (minutesSinceLastSession > SESSION_EXPIRY_MINUTES) {
  console.log('[AppContext] ⏰ Session已过期（超过90分钟），清除所有认证数据');
  handleLogout();
  return;
}
```

**位置：** `src/context/AppContext.jsx:617-637`

---

## 🍪 Cookies 策略

### 1. Cookies 凭证模式

**配置位置：** `src/config/apiConfig.js`

**模式设置：**
```javascript
credentials: 'include'  // 跨域请求时发送 cookies
```

### 2. Cookies 使用场景

#### 开发环境
- **CORS 模式：** `cors`
- **凭证模式：** `include`
- **代理路径：** `/stu` (通过 Vite 代理到后端)

#### 生产环境
根据部署方式有三种选项：

**选项 1：直接请求模式**
```javascript
{
  baseURL: 'http://117.72.14.166:9002/stu',
  corsMode: 'cors',
  credentials: 'omit'  // 不发送 cookies
}
```

**选项 2：代理服务器模式**
```javascript
{
  baseURL: '/api/stu',
  corsMode: 'cors',
  credentials: 'include'  // 发送 cookies
}
```

**选项 3：同源模式（默认推荐）**
```javascript
{
  baseURL: '/stu',
  corsMode: 'same-origin',
  credentials: 'include'  // 发送 cookies
}
```

### 3. Cookies 代理转发

**配置位置：** `vite.config.js`

开发环境的代理服务器会自动转发 cookies：

```javascript
proxy: {
  '/stu': {
    target: apiTarget,
    configure: (proxy) => {
      // 转发请求中的 cookies
      proxy.on('proxyReq', (proxyReq, req) => {
        if (req.headers.cookie) {
          proxyReq.setHeader('Cookie', req.headers.cookie);
        }
      });

      // 转发响应中的 Set-Cookie
      proxy.on('proxyRes', (proxyRes, req, res) => {
        if (proxyRes.headers['set-cookie']) {
          res.setHeader('Set-Cookie', proxyRes.headers['set-cookie']);
        }
      });
    }
  }
}
```

### 4. 后端 Cookies 管理

**注意：** 前端代码中没有直接设置 cookies 的有效期，这由后端服务器通过 `Set-Cookie` 响应头控制。

**预期后端行为：**
- 登录成功后，后端通过 `Set-Cookie` 响应头设置 session cookie
- Cookie 应设置为 `HttpOnly`（前端无法通过 JavaScript 访问）
- Cookie 可能包含以下属性：
  - `Max-Age` 或 `Expires`：Cookie 有效期
  - `Secure`：仅在 HTTPS 下传输（生产环境推荐）
  - `SameSite`：防止 CSRF 攻击
  - `Path=/stu`：限制 cookie 作用域

---

## ⏱️ Session 活动时间戳管理

### lastSessionEndTime 机制

**存储位置：** `localStorage.getItem('lastSessionEndTime')`

**更新时机：**

1. **登录成功时：**
   ```javascript
   // src/context/AppContext.jsx:1343
   localStorage.setItem('lastSessionEndTime', Date.now().toString());
   ```

2. **数据提交成功后：**
   ```javascript
   // src/context/AppContext.jsx:499
   localStorage.setItem('lastSessionEndTime', Date.now().toString());
   ```

### 作用

- 记录用户最后一次活动时间
- 用于计算 session 是否已过期（90 分钟）
- 用于计算离线期间倒计时流逝的时间

---

## 🚨 Session 过期处理流程

### 1. 检测 Session 过期

**触发场景：**

#### 场景 A：页面加载时检查
```javascript
// src/context/AppContext.jsx:617-637
const hoursSinceLastSession = (Date.now() - sessionEndTimeMillis) / (1000 * 60 * 60);

if (hoursSinceLastSession > 24) {
  handleLogout();  // 清除所有数据
}
```

#### 场景 B：数据提交时收到 401 错误
```javascript
// src/context/AppContext.jsx:506-514
if (error.isSessionExpired || error.code === 401 ||
    error.message.includes('session已过期')) {
  handleSessionExpired();
}
```

#### 场景 C：API 响应业务层面 401
```javascript
// src/shared/services/apiService.js:78-83
if (responseData.code === 401) {
  const sessionError = new Error('session已过期: 请重新登录');
  sessionError.isSessionExpired = true;
  sessionError.code = 401;
  throw sessionError;
}
```

### 2. 集中式过期处理函数

**位置：** `src/context/AppContext.jsx:387-410`

```javascript
const handleSessionExpired = useCallback(() => {
  console.log('[AppContext] 🚫 Session已过期，执行完整清理和重定向...');

  // 1. 记录过期事件
  logOperation({
    targetElement: '系统操作',
    eventType: '会话过期',
    value: `当前页面: ${currentPageId}, Session过期自动登出`
  });

  // 2. 提示用户
  alert('登录会话已过期，请重新登录');

  // 3. 清除所有状态
  handleLogout();

  // 4. 重定向到登录页
  window.location.href = '/';
}, [handleLogout, logOperation, currentPageId]);
```

### 3. 清除数据范围

**执行函数：** `handleLogout()` - `src/context/AppContext.jsx:283-348`

**清除内容：**

#### State 状态
- `isLoggedIn` → `false`
- `isAuthenticated` → `false`
- `authToken` → `null`
- `currentUser` → `null`
- `batchCode` → `''`
- `examNo` → `''`
- `moduleUrl` → `''`
- 所有任务和问卷相关状态重置

#### localStorage 键
```javascript
const keysToRemove = [
  'isAuthenticated',
  'currentPageId',
  'currentUser',
  'batchCode',
  'examNo',
  'pageNum',
  'taskStartTime',
  'remainingTime',
  'isTaskFinished',
  'isTimeUp',
  'questionnaireStartTime',
  'questionnaireRemainingTime',
  'moduleUrl',
  'lastUserId',
  'lastSessionEndTime',
  'tracking_sessionId',
  'tracking_session',
  // ... 等等
];
```

#### sessionStorage
完全清除 `sessionStorage.clear()`

---

## 📝 Session 生命周期总结

### 阶段 1：登录
1. 用户提交账号密码
2. 后端验证成功，返回用户信息和 session cookie
3. 前端存储：
   - `lastSessionEndTime = Date.now()`
   - `isAuthenticated = true`
   - 用户信息到 localStorage

### 阶段 2：活动期间
- 每次数据提交成功后，更新 `lastSessionEndTime`
- Session cookie 随每个 API 请求自动发送（credentials: 'include'）
- 前端不主动管理 cookie 生命周期

### 阶段 3：过期检测
**时间判断：** 距离 `lastSessionEndTime` 超过 90 分钟

**触发时机：**
- 页面刷新/重新打开
- 数据提交收到 401 错误

### 阶段 4：过期处理
1. 提示用户："登录会话已过期，请重新登录"
2. 清除所有前端存储的认证数据
3. 重定向到登录页 (`/`)

---

## 🔍 关键配置文件索引

| 文件 | 行号 | 关键配置 |
|-----|-----|---------|
| `src/context/AppContext.jsx` | 619 | `SESSION_EXPIRY_MINUTES = 90` |
| `src/context/AppContext.jsx` | 387-410 | `handleSessionExpired()` 集中处理函数 |
| `src/context/AppContext.jsx` | 283-348 | `handleLogout()` 清除数据 |
| `src/context/AppContext.jsx` | 617-637 | Session 有效期检查逻辑 |
| `src/config/apiConfig.js` | 38, 78, 95 | `credentials: 'include'` |
| `src/shared/services/apiService.js` | 78-83 | 业务层面 401 检测 |
| `vite.config.js` | 82-86, 95-100 | Cookie 代理转发配置 |

---

## ⚠️ 重要注意事项

### 1. 前后端 Session 不一致风险

**问题：** 前端 90 分钟有效期是基于 `lastSessionEndTime` 计算的，而后端的 session cookie 有效期由后端服务器控制。

**建议：**
- 确保后端 session cookie 的有效期 ≥ 90 分钟
- 或者前端改为依赖后端的 401 响应来判断过期（更准确）

### 2. 离线时间计算

当用户离线（关闭浏览器）后再次打开：
- 前端会计算离线期间的时间
- 从 `remainingTime` 和 `questionnaireRemainingTime` 中扣除离线时间
- 如果离线超过 90 分钟，自动清除 session

### 3. 多标签页同步

**当前实现：** 不同标签页的 session 状态通过 localStorage 共享

**潜在问题：**
- 如果一个标签页登出，其他标签页不会立即感知
- 建议添加 `storage` 事件监听器来同步登出状态

---

## 🎯 总结

### 用户登录后账号有效期

**答案：90 分钟**

- **计时起点：** 登录成功或最后一次数据提交成功的时间
- **检查机制：** 页面加载时检查 + API 401 响应检测
- **过期后：** 自动清除所有数据，提示用户重新登录

### Cookies 策略

- **管理方式：** 后端通过 `Set-Cookie` 响应头管理
- **前端配置：** `credentials: 'include'` 确保 cookies 随请求发送
- **安全属性：** 应由后端设置 `HttpOnly`, `Secure`, `SameSite` 等属性

---

**生成日期：** 2025-06-11
**更新日期：** 2025-06-11
**文档版本：** 1.1
**维护者：** 开发团队

## 📝 变更历史

### v1.1 (2025-06-11)
- 将 Session 有效期从 24 小时调整为 90 分钟
- 更新所有相关代码示例和说明
- 修改 `SESSION_EXPIRY_HOURS` 为 `SESSION_EXPIRY_MINUTES`

### v1.0 (2025-06-11)
- 初始文档创建
- 完整的 Session 和 Cookie 策略分析
