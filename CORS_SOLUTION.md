# CORS问题解决方案

## 问题现状
生产环境(`http://47.109.54.16:8080`)访问API(`http://117.72.14.166:9002`)时遇到CORS跨域问题。

## 已实现的解决方案

### 1. 环境感知API配置
- **开发环境**: 使用Vite代理 `/stu` → `http://117.72.14.166:9002/stu`
- **生产环境**: 直接请求 `http://117.72.14.166:9002/stu`

### 2. 多种API模式支持
在生产环境中可以通过URL参数切换不同的API模式：

#### 默认模式（直接请求）
- URL: `http://47.109.54.16:8080/`
- 配置: 直接请求 `http://117.72.14.166:9002/stu`
- 问题: 可能遇到CORS阻止

#### 代理模式
- URL: `http://47.109.54.16:8080/?apiMode=proxy`
- 配置: 请求 `/api/stu`（需要服务器配置代理）
- 适用: 如果Web服务器配置了API代理

#### 同源模式
- URL: `http://47.109.54.16:8080/?apiMode=sameOrigin`
- 配置: 请求 `/stu`（需要API部署在同一服务器）
- 适用: 如果API已部署在Web服务器上

### 3. 调试功能
- 开发环境自动显示API配置调试信息
- 生产环境通过 `?debug=true` 显示调试信息
- 显示当前使用的API端点和配置

## 部署后测试步骤

### 1. 基本测试
访问: `http://47.109.54.16:8080/`
- 检查右上角的API配置调试信息
- 尝试登录，查看控制台错误信息

### 2. 如果CORS错误持续，尝试备用方案

#### 方案A: 使用代理模式
访问: `http://47.109.54.16:8080/?apiMode=proxy`
**需要Web服务器配置代理规则**

#### 方案B: 使用同源模式  
访问: `http://47.109.54.16:8080/?apiMode=sameOrigin`
**需要API部署在同一服务器**

### 3. 查看详细错误信息
访问: `http://47.109.54.16:8080/?debug=true`
- 右上角显示详细的API配置
- 控制台显示完整的请求和响应日志

## 推荐的根本解决方案

### 后端CORS配置
在API服务器(`http://117.72.14.166:9002`)配置CORS头：

```javascript
// Express.js示例
app.use(cors({
  origin: ['http://47.109.54.16:8080', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept']
}));
```

### Nginx代理配置
在Web服务器(`47.109.54.16:8080`)配置API代理：

```nginx
server {
    listen 8080;
    server_name 47.109.54.16;
    root /path/to/dist;

    # SPA路由
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api/ {
        proxy_pass http://117.72.14.166:9002/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 错误排查清单

1. **检查网络连接**: 确保`47.109.54.16:8080`能访问`117.72.14.166:9002`
2. **查看浏览器控制台**: Network标签查看具体的请求和响应
3. **检查API配置**: 使用`?debug=true`查看当前配置
4. **测试不同模式**: 尝试`?apiMode=proxy`或`?apiMode=sameOrigin`
5. **联系后端**: 请求配置CORS头

## 临时绕过方案

如果其他方案都无法使用，可以考虑：
1. 浏览器禁用安全策略（仅开发测试）
2. 使用浏览器扩展临时禁用CORS
3. 通过移动端App或其他方式访问 