# 多模块架构部署指南

## 概述

本系统已完成从单模块到多模块架构的重构，支持通过服务器返回的URL字段动态路由到不同的测评模块。当前已实现对7年级蒸馒头测评的完整包装，为未来4年级等新模块奠定了基础。

## 系统架构

### 核心特性
- **零风险部署** - 生产环境默认使用传统模式，完全向后兼容
- **功能开关控制** - 通过环境变量控制模块系统启用状态
- **优雅降级** - 模块系统失败时自动回退到传统模式
- **错误边界** - 完整的错误捕获和用户友好的错误处理

### 目录结构
```
src/
├── modules/                    # 🆕 模块系统
│   ├── ModuleRegistry.js      # 模块注册中心
│   ├── ErrorBoundary.jsx      # 错误边界组件
│   ├── test-integration.js    # 集成测试
│   └── grade-7/               # 7年级模块包装器
│       ├── index.jsx          # 模块入口
│       ├── wrapper.jsx        # PageRouter包装器
│       └── config.js          # 模块配置
├── ModuleRouter.jsx           # 🆕 模块路由器
├── .env.development           # 🆕 开发环境配置
├── .env.production            # 🆕 生产环境配置
└── (所有现有文件保持不变)      # ✅ 379个路径依赖未动
```

## 部署配置

### 环境变量配置

**开发环境** (`.env.development`):
```bash
REACT_APP_ENABLE_MODULE_SYSTEM=true
REACT_APP_ENV=development
```

**生产环境** (`.env.production`):
```bash
REACT_APP_ENABLE_MODULE_SYSTEM=false  # 默认关闭，确保安全
REACT_APP_ENV=production
```

### 启用模块系统

如需在生产环境启用模块系统，修改 `.env.production`:
```bash
REACT_APP_ENABLE_MODULE_SYSTEM=true
```

## 服务器端配置

### 登录API响应格式

服务器需要在登录成功响应中包含以下字段：

```json
{
  "success": true,
  "obj": {
    "batchCode": "250619",
    "examNo": "10018", 
    "pageNum": "13",
    "pwd": "1234",
    "schoolCode": "24146",
    "schoolName": "成都市新都区龙安小学校（中心）",
    "studentCode": "",
    "studentName": "7 年级测试 71",
    "url": "/seven-grade"  // 🔑 关键字段：模块路由URL
  }
}
```

### URL到模块的映射

当前支持的URL映射：
- `/seven-grade` → 7年级蒸馒头测评模块
- 未来可扩展：`/four-grade`, `/five-grade` 等

## 部署步骤

### 1. 安全部署（推荐）

```bash
# 1. 确保生产环境配置正确
cat .env.production
# 应该显示: REACT_APP_ENABLE_MODULE_SYSTEM=false

# 2. 构建项目
npm run build

# 3. 部署到生产环境
# 此时系统使用传统模式，现有用户体验完全不变

# 4. 验证传统模式工作正常后，再考虑启用模块系统
```

### 2. 启用模块系统（可选）

```bash
# 1. 修改生产环境配置
echo "REACT_APP_ENABLE_MODULE_SYSTEM=true" > .env.production

# 2. 重新构建
npm run build

# 3. 重新部署
# 此时系统支持基于URL的模块路由
```

### 3. 验证部署

访问测试页面验证系统状态：
- 开发环境: `http://localhost:3000/module-test.html`
- 生产环境: `http://your-domain.com/module-test.html`

## 用户体验

### 传统模式（默认）
- 用户登录后，使用现有的页面路由逻辑
- 基于 `pageNum` 进行页面恢复
- 完全保持现有用户体验

### 模块模式（启用后）
- 用户登录后，系统解析服务器返回的 `url` 字段
- 自动路由到对应的测评模块
- 支持基于 `pageNum` 的页面恢复
- 提供错误处理和降级机制

## 故障排除

### 常见问题

1. **模块系统无法加载**
   - 检查环境变量是否正确设置
   - 查看浏览器控制台错误信息
   - 使用错误边界的"使用传统模式"选项

2. **页面恢复失败**
   - 验证服务器返回的 `pageNum` 格式正确
   - 检查模块配置中的页面映射
   - 查看控制台中的页面恢复日志

3. **构建失败**
   - 确保所有新增文件的扩展名正确（.jsx for JSX components）
   - 检查导入路径是否正确
   - 运行 `npm run lint` 检查代码质量

### 日志监控

系统在以下情况会输出关键日志：
- `[ModuleRegistry]` - 模块注册和加载
- `[ModuleRouter]` - 模块路由决策
- `[Grade7Module]` - 7年级模块操作
- `[App]` - 模块系统启用状态

## 未来扩展

### 添加新测评模块

1. **创建模块目录结构**
```bash
mkdir -p src/modules/grade-4/{components/pages,context,utils,assets}
```

2. **实现模块接口**
```javascript
// src/modules/grade-4/index.jsx
export const Grade4Module = {
  moduleId: 'grade-4',
  displayName: '4年级科学测评',
  url: '/four-grade',
  version: '1.0.0',
  ModuleComponent: ({ userContext, initialPageId }) => {
    return <Grade4Router initialPageId={initialPageId} />;
  },
  getInitialPage: (pageNum) => {
    return grade4PageMappings.getTargetPageId(pageNum);
  }
};
```

3. **注册新模块**
```javascript
// src/modules/ModuleRegistry.js
const { Grade4Module } = await import('./grade-4/index.jsx');
this.registerModule(Grade4Module);
```

### 共享组件抽取

随着模块增多，可以逐步将通用组件抽取到 `src/shared/` 目录：
- `shared/components/common/` - 通用UI组件
- `shared/services/` - 共享API服务
- `shared/utils/` - 共享工具函数

## 安全注意事项

1. **生产环境默认关闭** - 确保模块系统在生产环境默认禁用
2. **错误处理完整** - 任何错误都不会影响用户正常使用
3. **数据兼容性** - 所有数据提交格式保持现有标准
4. **API兼容性** - 不修改任何现有API接口

## 性能优化

1. **代码分割** - 模块采用动态导入，按需加载
2. **错误边界** - 隔离模块错误，不影响全局
3. **缓存策略** - 模块注册表使用单例模式
4. **降级机制** - 快速回退到传统模式

## 联系与支持

如遇到部署问题，请检查：
1. 浏览器控制台日志
2. 网络请求状态
3. 环境变量配置
4. 服务器返回数据格式

系统设计为高度容错，任何问题都可以通过降级到传统模式解决。