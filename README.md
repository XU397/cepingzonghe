# HCI-Evaluation Platform

> 基于 React + Vite 的模块化人机交互评估平台

一个用于教育场景的交互式评估系统，支持多年级、多模块的独立测评体验。采用模块化架构设计，每个年级的评估内容作为独立模块开发和部署。

## 项目概览

**技术栈**:
- React 18.2.0 (函数式组件 + Hooks)
- Vite 4.x (构建工具与 HMR)
- React Router (路由管理)
- Recharts 2.10.0 (数据可视化)
- CSS Modules (样式隔离)

**特性**:
- 模块化架构，支持多年级独立模块
- 完整的操作日志记录
- 会话管理与进度恢复
- 响应式设计 (1280x720 - 1920x1080)
- 实时数据提交与重试机制
- ErrorBoundary 错误处理

---

## 快速开始

### 环境要求

- Node.js >= 16.x
- npm >= 8.x 或 pnpm >= 7.x

### 安装依赖

```bash
npm install
# 或使用 pnpm
pnpm install
```

### 开发模式

#### 🎭 Mock 模式（推荐，前端独立调试）

无需后端，支持完整流程测试：

```bash
# 1. 确认 .env 文件中 VITE_USE_MOCK=1
# 2. 启动开发服务器
npm run dev
```

访问: http://localhost:3000

**详细指引**：[📖 Mock 模式快速开始](./docs/QUICK_START_MOCK.md)

#### 🔗 联调模式（对接真实后端）

```bash
# 修改 .env: VITE_USE_MOCK=0
npm run dev
```

**配置说明**：[📘 Mock 模式使用指南](./docs/MOCK_MODE_GUIDE.md)

### 生产构建

```bash
# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

### 代码质量

```bash
# 运行 ESLint 检查
npm run lint
```

---

## 已实现模块

### Grade 7 Tracking Module (7年级追踪测评模块)

**模块描述**: 蜂蜜黏度探究实验与问卷调查系统

**URL**: `/grade-7-tracking`

**功能特性**:

#### 科学探究实验 (第0.1-13页)
- 注意事项页面（40秒倒计时）
- 情景引入、问题提出、资料阅读
- 假设陈述、方案设计与评估
- 交互式模拟实验
  - 4种含水量选择 (15%, 17%, 19%, 21%)
  - 5档温度控制 (25°C-45°C)
  - 小球下落动画（基于物理模型，60 FPS）
- 数据分析与折线图可视化
- 方案选择与理由说明

#### 问卷调查 (第0.2页 + 第15-22页)
- 问卷说明页
- 8页问卷题目（共27题）
- 科学态度、兴趣、合作、批判性思维等维度
- 完成页面

#### 数据记录与提交
- 完整的操作日志记录（logOperation）
- MarkObject 数据结构封装
- 自动数据提交（每页切换）
- 重试机制（3次，指数退避）
- 错误处理和用户提示

#### 计时器管理
- 40分钟探究任务计时器
- 10分钟问卷计时器
- 超时自动跳转/提交

#### 用户体验
- 响应式布局（支持 1280x720 到 1920x1080）
- CSS Modules 样式隔离
- 加载状态和骨架屏
- ErrorBoundary 错误捕获
- 浏览器后退按钮禁用
- 401错误自动登出

**目录结构**:
```
src/modules/grade-7-tracking/
├── components/           # 组件
│   ├── experiment/       # 实验相关组件
│   ├── questionnaire/    # 问卷相关组件
│   ├── layout/           # 布局组件
│   ├── ui/               # 通用 UI 组件
│   └── visualizations/   # 数据可视化组件
├── pages/                # 页面组件 (23个页面)
├── context/              # Context 状态管理
│   ├── TrackingContext.jsx
│   └── TrackingProvider.jsx
├── hooks/                # 自定义 Hooks
│   ├── useDataLogger.js
│   ├── useSessionHeartbeat.js
│   ├── useNavigation.js
│   └── useExperiment.js
├── utils/                # 工具函数
│   ├── physicsModel.js   # 物理模型计算
│   ├── pageMapping.js    # 页面映射
│   └── validation.js     # 表单验证
├── styles/               # CSS Modules 样式
├── assets/               # 静态资源
│   └── data/             # JSON 数据文件
├── config.js             # 模块配置
└── index.jsx             # 模块入口
```

**性能指标**:
- ⚡ 首屏加载: <2s
- 🎬 动画帧率: 60 FPS
- 📡 数据提交成功率: ≥99%
- 🖱️ 交互响应: <100ms
- 📦 Gzip 后体积: ~85 KB

**文档**:
- [技术规范](specs/001-7/spec.md)
- [实施计划](specs/001-7/plan.md)
- [任务跟踪](specs/001-7/tasks.md)
- [测试指南](PHASE6_TESTING_GUIDE.md)

---

### Grade 4 Module (4年级模块)

**模块描述**: 火车票订购系统互动测评

**URL**: `/four-grade`

**功能特性**:
- 11页线性评估流程
- 拖放时间线规划
- 交互式地图路线选择
- 自定义屏幕键盘输入
- 完整的操作日志记录

**技术亮点**:
- CSS Modules 样式隔离
- Context API 状态管理
- 自定义 Hooks 复用逻辑
- 响应式设计

---

### Grade 7 Module (7年级模块 - 传统)

**模块描述**: 包子评价系统（传统实现）

**URL**: `/seven-grade`

**功能特性**:
- 传统 PageRouter 系统
- 全局 CSS 样式
- 基础交互评估

**说明**: 这是早期实现的模块，使用传统架构包装。新模块请参考 Grade 7 Tracking 实现。

---

## 模块化架构

### 核心概念

本项目采用**模块注册表 + 动态加载**的架构，每个评估模块作为独立单元开发：

```
登录 → 后端返回 URL → ModuleRegistry 查找模块
  → getInitialPage(pageNum) → ModuleComponent 渲染
  → 用户完成评估 → 模块清理 (onDestroy)
```

### 模块接口

每个模块必须实现以下接口：

```javascript
export const YourModule_Definition = {
  // 必需字段
  moduleId: 'unique-module-id',
  displayName: '模块显示名称',
  url: '/module-url',
  version: '1.0.0',

  // 主模块组件
  ModuleComponent: YourModuleComponent,

  // 页面恢复函数
  getInitialPage: (pageNum) => {
    // 根据 pageNum 返回页面 ID
    return 'page-id';
  },

  // 可选的生命周期钩子
  onInitialize: () => { /* 初始化代码 */ },
  onDestroy: () => { /* 清理代码 */ }
};
```

### 关键文件

- **ModuleRegistry** ([src/modules/ModuleRegistry.js](src/modules/ModuleRegistry.js)) - 模块注册中心
- **ModuleRouter** ([src/modules/ModuleRouter.jsx](src/modules/ModuleRouter.jsx)) - 模块路由器
- **ErrorBoundary** ([src/modules/ErrorBoundary.jsx](src/modules/ErrorBoundary.jsx)) - 错误边界
- **AppContext** ([src/context/AppContext.jsx](src/context/AppContext.jsx)) - 全局状态

---

## 认证与会话

### 登录流程

1. 用户在 LoginPage 输入凭证
2. 后端返回会话数据:
   ```json
   {
     "code": 200,
     "msg": "成功",
     "obj": {
       "batchCode": "250619",
       "examNo": "1001",
       "url": "/grade-7-tracking",
       "pageNum": "1",
       "studentName": "张三"
     }
   }
   ```
3. AppContext 存储会话数据到 localStorage
4. ModuleRouter 根据 `url` 加载对应模块
5. 模块使用 `pageNum` 恢复用户进度

### 会话管理

- **会话心跳**: 每30秒检查会话有效性 (`/stu/checkSession`)
- **自动登出**: 401错误自动跳转登录页
- **进度恢复**: 页面刷新自动恢复到上次位置

---

## 数据提交

### API 契约

所有模块提交数据到 `POST /stu/saveHcMark`，格式为 FormData:

```javascript
{
  batchCode: string,
  examNo: string,
  mark: JSON.stringify({
    pageNumber: string,
    pageDesc: string,
    operationList: Array<Operation>,
    answerList: Array<Answer>,
    beginTime: "YYYY-MM-DD HH:mm:ss",
    endTime: "YYYY-MM-DD HH:mm:ss",
    imgList: Array<ImageInfo>
  })
}
```

### Operation 格式

```javascript
{
  targetElement: string,  // 目标元素标识
  eventType: string,      // 事件类型（点击/输入/选择）
  value: string,          // 操作值
  time: string           // 时间戳（ISO 8601）
}
```

### Answer 格式

```javascript
{
  targetElement: string,  // 问题标识
  value: string          // 答案内容
}
```

---

## API 配置

### 开发环境

使用 Mock 模式（默认）:

```bash
# .env 或 .env.local
VITE_USE_MOCK=1
```

Mock 服务器拦截 `/stu/login` 和 `/stu/saveHcMark`，返回模拟响应。

### 生产环境

连接真实后端:

```bash
# .env.production
VITE_USE_MOCK=0
VITE_API_TARGET=http://your-backend-url
```

Vite 会通过 `/api` 和 `/stu` 路径代理请求到后端。

---

## 性能优化

### Code Splitting (T103)

- 使用 `React.lazy()` 懒加载所有页面组件
- Vite `manualChunks` 配置优化打包策略
- 按模块分离 chunk (grade-7-tracking, grade-4, vendor)

```javascript
// 懒加载示例
const Page01_Notice = lazy(() => import('./pages/Page01_Notice'));

<Suspense fallback={<Spinner size="large" message="页面加载中..." />}>
  <Page01_Notice />
</Suspense>
```

### 图片优化 (T104)

- **Grade 7 Tracking**: 使用 SVG 内联和 CSS 渐变，零外部图片
- **优点**: 无网络请求、完美响应式、动态样式
- **规格**: 如需添加图片，单个不超过 200KB

### 动画性能 (T105)

- 使用 `will-change: transform` 提示浏览器优化
- `transform: translateZ(0)` 启用 GPU 加速
- `backface-visibility: hidden` 避免闪烁
- 目标: 60 FPS 流畅动画

---

## 开发指南

### 添加新模块

1. **创建模块目录**:
   ```
   src/modules/grade-N/
   ├── index.jsx              # 模块定义
   ├── context/               # 状态管理
   ├── pages/                 # 页面组件
   ├── components/            # UI组件
   ├── styles/                # CSS Modules
   ├── hooks/                 # 自定义Hooks
   ├── utils/                 # 工具函数
   └── config.js              # 配置文件
   ```

2. **定义模块接口** (参见上文模块接口)

3. **注册模块**:
   在 `src/modules/ModuleRegistry.js` 的 `initialize()` 方法中添加:
   ```javascript
   const { GradeNModule } = await import('./grade-N/index.jsx');
   this.registerModule(GradeNModule);
   ```

4. **实现页面组件**:
   - 使用 CSS Modules 隔离样式
   - 通过 Context 管理状态
   - 记录所有用户操作
   - 提交数据到后端

5. **协调后端**:
   - 确保登录返回的 `url` 匹配模块定义
   - 测试页面恢复功能
   - 验证数据提交格式

详细步骤请参考: [CLAUDE.md](CLAUDE.md) 的 "Adding a New Assessment Module" 章节

### 代码规范

- **组件**: PascalCase, 函数式组件 + Hooks
- **Hooks**: useCamelCase
- **Utils**: camelCase
- **样式**: ComponentName.module.css

### 命名约定

```
components/
├── containers/    # 智能组件（有状态/逻辑）
└── ui/            # 展示组件（纯UI）

hooks/             # 可复用的有状态逻辑
utils/             # 纯函数、计算
services/          # API调用、外部集成
```

---

## 测试

### 单元测试

```bash
# 运行测试（如已配置）
npm test
```

### 手动测试

1. 启动开发服务器: `npm run dev`
2. 访问登录页: http://localhost:3000
3. 使用 Mock 模式登录（任意凭证）
4. 测试完整评估流程
5. 检查浏览器控制台日志
6. 验证数据提交成功

### 性能测试

1. **Chrome DevTools - Performance**:
   - 录制页面加载和交互
   - 检查 FPS 曲线（目标 60 FPS）
   - 分析 JavaScript 执行时间

2. **Lighthouse 审计**:
   ```bash
   npm run build
   npm run preview
   # 打开 Chrome DevTools → Lighthouse
   # 运行 Performance 审计
   ```

3. **Bundle 分析**:
   ```bash
   npm run build
   # 检查 dist/assets 目录的 chunk 大小
   ```

---

## 项目结构

```
d:\myproject\cp\
├── src/
│   ├── modules/                    # 模块系统
│   │   ├── ModuleRegistry.js       # 模块注册表
│   │   ├── ModuleRouter.jsx        # 模块路由器
│   │   ├── ErrorBoundary.jsx       # 错误边界
│   │   ├── grade-7-tracking/       # 7年级追踪模块
│   │   ├── grade-4/                # 4年级模块
│   │   └── grade-7/                # 7年级传统模块
│   ├── context/
│   │   └── AppContext.jsx          # 全局状态
│   ├── shared/
│   │   ├── components/             # 共享组件
│   │   └── services/               # 共享服务
│   │       ├── apiService.js       # API客户端
│   │       └── dataLogger.js       # 数据提交
│   ├── config/
│   │   └── apiConfig.js            # API配置
│   ├── pages/
│   │   └── LoginPage.jsx           # 登录页
│   ├── App.jsx                     # 应用入口
│   └── main.jsx                    # React渲染
├── public/                         # 静态资源
├── docs/                           # 文档
│   ├── 7年级追踪测评需求描述.md
│   └── 模块化开发规范与扩展指引.md
├── specs/                          # 规格说明
│   └── 001-7/                      # Grade 7 Tracking规格
│       ├── spec.md
│       ├── plan.md
│       └── tasks.md
├── vite.config.js                  # Vite配置
├── package.json                    # 依赖清单
├── CLAUDE.md                       # Claude Code指南
└── README.md                       # 本文件
```

---

## 贡献指南

### 提交代码

1. **功能分支**: 从 `main` 创建功能分支
2. **提交信息**: 使用清晰的 commit message
   ```
   feat: 添加新功能
   fix: 修复bug
   docs: 更新文档
   style: 代码格式调整
   refactor: 重构代码
   perf: 性能优化
   test: 添加测试
   ```
3. **代码审查**: 提交 Pull Request 等待审查
4. **测试通过**: 确保所有测试通过

### 代码质量

- 运行 `npm run lint` 检查代码风格
- 遵循项目的 ESLint 规则
- 编写清晰的注释和文档
- 保持代码简洁和可维护

---

## 常见问题

### Q1: 如何切换到真实后端？

在 `.env.local` 文件中设置:
```bash
VITE_USE_MOCK=0
VITE_API_TARGET=http://your-backend-url
```

### Q2: 页面刷新后丢失进度怎么办？

检查 localStorage 中是否保存了会话数据:
```javascript
localStorage.getItem('hci-moduleUrl')
localStorage.getItem('hci-pageNum')
```

### Q3: 数据提交失败怎么办？

1. 检查网络连接
2. 查看控制台错误日志
3. 验证 FormData 格式是否正确
4. 确认后端 API 可用

### Q4: 动画卡顿怎么办？

1. 打开 Chrome DevTools → Performance
2. 录制动画执行过程
3. 检查是否有大量重绘或回流
4. 确认使用了 GPU 加速 (`transform: translateZ(0)`)

### Q5: 如何调试模块加载问题？

查看控制台日志:
```
[ModuleRegistry] - 模块注册信息
[ModuleRouter] - 模块加载和生命周期
[Grade7TrackingModule] - 模块内部状态
[API] - 请求和响应日志
```

---

## 许可证

本项目为教育评估平台，版权归项目团队所有。

---

## 联系方式

**项目负责人**: Frontend Development Team

**技术支持**: 参考 [CLAUDE.md](CLAUDE.md) 文档

**Bug 反馈**: 通过项目 Issue 跟踪系统提交

---

## 更新日志

### v1.3.0 - 2025-10-15 (Phase 7)
- ✅ T103: 实现 Code Splitting (React.lazy + Suspense)
- ✅ T104: 优化图片资源策略（SVG内联）
- ✅ T105: 优化小球动画性能（60 FPS）
- ✅ T106: 更新项目 README 文档

### v1.2.0 - 2025-10-14 (Phase 6)
- ✅ 实现 Grade 7 Tracking 完整功能
- ✅ 添加会话心跳机制
- ✅ 实现浏览器后退禁用
- ✅ 完善错误处理

### v1.1.0 - 2025-10-13 (Phase 1-5)
- ✅ 建立模块化架构
- ✅ 实现 Grade 7 Tracking 核心组件
- ✅ 完成实验交互和问卷系统

### v1.0.0 - 初始版本
- ✅ Grade 4 和 Grade 7 传统模块
- ✅ 基础模块系统
- ✅ 登录和会话管理

---

**祝您使用愉快！**
