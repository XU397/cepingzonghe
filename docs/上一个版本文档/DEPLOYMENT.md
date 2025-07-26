# 部署说明

## 问题解决

### 问题描述
在部署到生产环境时，出现登录错误：
```
登录API错误: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

### 问题原因
1. **开发环境 vs 生产环境差异**：
   - 开发环境使用Vite代理，请求`/stu/login`会被代理到`http://117.72.14.166:9002/stu/login`
   - 生产环境没有代理，请求`/stu/login`返回HTML页面（404错误页面）

2. **API配置问题**：
   - 生产环境需要直接请求完整的API URL
   - 需要处理CORS跨域问题

### 解决方案

#### 1. 创建环境感知的API配置
创建了`src/config/apiConfig.js`文件，根据运行环境动态配置API基础URL：

- **开发环境**：使用相对路径`/stu`（通过Vite代理）
- **生产环境**：使用完整URL `http://117.72.14.166:9002/stu`

#### 2. 更新API服务
更新了`src/services/apiService.js`：
- 使用动态API配置
- 增强错误处理，提供更详细的错误信息
- 添加CORS支持

#### 3. 改进错误诊断
- 检测HTML响应（通常表示404错误）
- 提供详细的错误信息和请求URL
- 记录响应头和内容用于调试

## 部署步骤

### 1. 构建项目
```bash
npm run build
```

### 2. 部署dist文件夹
将`dist`文件夹的内容上传到Web服务器：
- 对于`http://47.109.54.16:8080/`：上传到对应的Web根目录

### 3. 服务器配置
确保Web服务器配置：
- 支持Single Page Application (SPA)路由
- 所有路由都返回`index.html`

#### Nginx配置示例
```nginx
server {
    listen 8080;
    server_name 47.109.54.16;
    root /path/to/dist;
    index index.html;

    # SPA路由支持
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## 环境配置

### API端点
- **开发环境**：`http://localhost:3000` → 代理到 → `http://117.72.14.166:9002`
- **生产环境**：`http://47.109.54.16:8080` → 直接请求 → `http://117.72.14.166:9002`

### CORS配置
确保后端API服务器(`http://117.72.14.166:9002`)配置了正确的CORS头：
```
Access-Control-Allow-Origin: http://47.109.54.16:8080
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Accept
```

## 测试验证

### 1. 本地测试
```bash
npm run dev
# 访问 http://localhost:3000
```

### 2. 生产环境测试
部署后访问：`http://47.109.54.16:8080`

### 3. 错误排查
如果仍有问题，检查浏览器开发者工具：
1. **Network标签**：查看API请求的完整URL和响应
2. **Console标签**：查看详细的错误日志
3. **API配置日志**：会显示当前环境和使用的API URL

## 常见问题

### Q: 仍然出现CORS错误
**A**: 检查后端API服务器的CORS配置，确保允许来自生产域名的请求。

### Q: API请求超时
**A**: 检查网络连接和防火墙设置，确保生产服务器能访问`117.72.14.166:9002`。

### Q: 页面刷新后出现404
**A**: 配置Web服务器支持SPA路由，所有路由都返回`index.html`。 