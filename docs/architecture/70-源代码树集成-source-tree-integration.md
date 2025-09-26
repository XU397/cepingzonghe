# **7.0 源代码树集成 (Source Tree Integration)**

### **7.1 集成原则**

新模块的引入必须在不扰乱现有项目结构的前提下进行。我们将通过在src目录下创建新的、专门的文件夹来清晰地组织新代码。

### **7.2 分阶段目录结构 (Phased Directory Structure)**

**当前阶段（Phase 1）目录结构**：实现4年级模块构建，7年级保持原结构

```
src/
├── components/           # (现有) 七年级模块组件 - 完全不变
├── context/              # (现有) AppContext.jsx - 完全不变  
├── pages/                # (现有) 七年级模块页面 - 完全不变
├── services/             # (现有) 保持现有位置，通过别名重定向
├── styles/               # (现有) 七年级模块样式 - 完全不变
├── utils/                # (现有) 七年级工具函数 - 完全不变
├── modules/              # 【新】模块系统根目录
│   ├── ModuleRegistry.js # 【新】模块注册中心
│   ├── ModuleRouter.jsx  # 【新】顶层模块路由器  
│   ├── ErrorBoundary.jsx # 【新】错误边界保护
│   ├── grade-7/          # 【新】七年级包装器目录
│   │   ├── index.jsx     #  - 模块入口点
│   │   ├── wrapper.jsx   #  - PageRouter包装器
│   │   └── config.js     #  - 模块配置
│   └── grade-4/          # 【新】四年级独立模块
│       ├── assets/       #  - 图片、SVG等静态资源
│       ├── components/   #  - 模块专用React组件
│       │   ├── containers/ #  - 智能组件（含状态逻辑）
│       │   │   ├── InteractiveMap.jsx
│       │   │   ├── TimePlanner.jsx  # 拖拽+关键路径计算
│       │   │   └── FinalCalculator.jsx
│       │   └── ui/       #  - 纯展示组件
│       │       ├── DraggableTask.jsx
│       │       ├── OnScreenKeyboard.jsx
│       │       └── RouteMapModal.jsx
│       ├── context/      #  - Grade4Context.jsx状态管理
│       ├── hooks/        #  - 模块专用自定义Hooks
│       ├── pages/        #  - 11个测评页面组件
│       ├── utils/        #  - 关键路径计算等工具函数
│       └── index.jsx     #  - 四年级模块主入口
└── shared/               # 【新】跨模块共享代码
    ├── services/         #  - apiService.js, dataLogger.js
    ├── components/       #  - 可复用UI组件（逐步提取）
    ├── utils/            #  - 共享工具函数
    └── types/            #  - TypeScript类型定义
```

**关键实现策略**：

1. **路径别名配置** (vite.config.js)：
```javascript
export default defineConfig({
  resolve: {
    alias: {
      '@/services': '/src/shared/services',
      '@/shared': '/src/shared',
      // 7年级模块的现有导入路径透明重定向
      '../services/apiService': '/src/shared/services/apiService.js'
    }
  }
});
```

2. **零影响迁移原则**：
   - 所有7年级文件保持原位置和原内容
   - 通过Vite别名实现服务层重定向
   - 新模块完全独立开发，不依赖现有结构
