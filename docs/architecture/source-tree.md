# **6.0 源代码树集成 (Source Tree Integration)**

### **6.1 集成原则**

新模块的引入必须在不扰乱现有项目结构的前提下进行。我们将通过在src目录下创建新的、专门的文件夹来清晰地组织新代码。

### **6.2 最终目录结构**

以下是整合了新模块后，项目src目录的最终结构。AI开发代理必须严格遵守此结构创建和放置文件。

src/  
├── components/           \# (现有) 存放七年级模块的组件  
├── context/              \# (现有) 存放 AppContext.jsx  
├── modules/              \# 【新】所有测评模块的根目录  
│   ├── grade-4/          \# 【新】四年级“火车购票”模块  
│   │   ├── assets/       \#  \- 存放图片、SVG等静态资源  
│   │   ├── components/   \#  \- 存放该模块独有的React组件  
│   │   │   ├── containers/  
│   │   │   └── ui/  
│   │   ├── context/      \#  \- 存放 Grade4Context.jsx  
│   │   ├── hooks/        \#  \- 存放该模块独有的自定义Hooks  
│   │   ├── pages/        \#  \- 存放代表每个测评页面的顶层组件  
│   │   ├── types/        \#  \- 存放 TypeScript类型定义  
│   │   └── index.tsx     \#  \- 四年级模块的主入口文件  
│   ├── grade-7/          \# 【新】七年级“蒸馒头”模块的包装器  
│   │   └── wrapper.jsx  
│   ├── ModuleRegistry.js \# 【新】模块注册中心  
│   └── ModuleRouter.jsx  \# 【新】顶层模块路由器  
├── pages/                \# (现有) 存放七年级模块的页面  
├── services/             \# (现有) 存放七年级模块的服务 (将被别名指向shared)  
├── shared/               \# 【新】跨模块共享的代码  
│   ├── services/         \#  \- 存放 apiService.js, dataLogger.js  
│   ├── types/            \#  \- 存放 submissionPayload.ts  
│   └── ... (其他共享代码)  
├── styles/               \# (现有) 存放七年级模块的样式  
├── utils/                \# (现有) 存放七年级模块的工具函数  
└── ... (所有其他现有文件和目录保持原位)

**开发要求**: AI代理在执行开发任务时，必须根据此目录结构创建新文件。例如，为题目7创建的拖拽组件应位于 src/modules/grade-4/components/containers/TimePlanner.tsx。