# 新增测评模块构建策略

## 问题分析

当前的"包装器模式"方案虽然安全，但存在新模块构建的问题：

1. **7年级模块混杂** - 现有代码全部在src根目录，新模块会造成文件混乱
2. **共享资源冲突** - 新模块的图片、样式会与现有文件冲突
3. **开发体验差** - 新模块开发者需要在现有复杂结构中工作
4. **维护困难** - 无法清晰区分不同年级的代码

## 混合策略：**"核心保护 + 新模块独立"**

### 核心理念
- **保护7年级现有代码** - 完全不动现有文件结构（379个路径依赖）
- **新模块完全独立** - 4年级及以后的模块采用规范化目录结构
- **共享组件抽取** - 逐步将可复用组件提取到共享层

## 实施后的目录结构

```
src/
├── shared/                    # 新增：共享层（逐步迁移）
│   ├── components/           # 共享UI组件
│   │   ├── common/          # Button, Modal, Timer等基础组件
│   │   ├── auth/            # 登录相关组件
│   │   └── navigation/      # 导航组件
│   ├── services/            # 共享API服务
│   │   ├── authService.js   # 认证服务
│   │   ├── apiService.js    # API通用服务
│   │   └── dataLogger.js    # 数据日志服务
│   ├── hooks/               # 共享Hooks
│   ├── utils/               # 共享工具函数
│   ├── context/             # 共享Context
│   └── config/              # 共享配置
│
├── modules/                   # 模块系统
│   ├── ModuleRegistry.js     # 模块注册中心
│   ├── ModuleRouter.jsx      # 模块路由器
│   │
│   ├── grade-7/              # 7年级模块（包装器模式）
│   │   ├── index.js         # 模块入口
│   │   ├── config.js        # 模块配置
│   │   └── wrapper.js       # 包装现有PageRouter
│   │
│   └── grade-4/              # 4年级模块（独立结构）
│       ├── index.js         # 模块入口
│       ├── config.js        # 模块配置
│       ├── components/      # 4年级专用组件
│       │   ├── pages/       # 页面组件
│       │   ├── forms/       # 表单组件
│       │   └── interactive/ # 交互组件
│       ├── context/         # 4年级专用Context
│       ├── utils/           # 4年级专用工具
│       ├── hooks/           # 4年级专用Hooks
│       ├── assets/          # 4年级专用资源
│       │   ├── images/      # 图片资源
│       │   └── styles/      # 样式文件
│       └── data/            # 4年级专用数据
│
├── (现有7年级文件完全不变)   # 保持现有379个依赖不变
├── components/              # 保持不变 - 7年级专用
├── pages/                   # 保持不变 - 7年级专用
├── context/                 # 保持不变 - 7年级专用
├── utils/                   # 保持不变 - 7年级专用
├── services/                # 保持不变 - 7年级专用
├── hooks/                   # 保持不变 - 7年级专用
├── styles/                  # 保持不变 - 7年级专用
├── assets/                  # 保持不变 - 7年级专用
└── config/                  # 保持不变 - 7年级专用
```

## 新模块构建流程

### Phase 1: 4年级模块快速启动

```javascript
// modules/grade-4/index.js - 新模块入口
import React from 'react';
import { Grade4Router } from './components/Grade4Router';
import { Grade4Provider } from './context/Grade4Context';

export const Grade4Module = {
  moduleId: 'grade-4',
  displayName: '4年级科学测评',
  url: '/four-grade',
  version: '1.0.0',
  
  ModuleComponent: ({ userContext, initialPageId }) => (
    <Grade4Provider userContext={userContext}>
      <Grade4Router initialPageId={initialPageId} />
    </Grade4Provider>
  ),
  
  getInitialPage: (pageNum) => {
    // 4年级自己的页面恢复逻辑
    return grade4PageMappings.getTargetPageId(pageNum);
  }
};
```

```javascript
// modules/grade-4/config.js - 4年级配置
export const grade4Config = {
  moduleId: 'grade-4',
  url: '/four-grade',
  
  // 4年级页面映射
  pages: {
    'Grade4_Page_01_Introduction': { number: '1', desc: '4年级介绍页' },
    'Grade4_Page_02_Experiment': { number: '2', desc: '4年级实验页' },
    // ... 4年级专用页面
  },
  
  timers: {
    mainTask: 35 * 60, // 4年级35分钟
    questionnaire: 8 * 60 // 4年级8分钟问卷
  },
  
  // 4年级专用API端点（如果需要）
  apiEndpoints: {
    grade4Specific: '/grade4/special'
  }
};
```

### Phase 2: 共享组件逐步抽取

```javascript
// shared/components/common/Timer.jsx - 抽取的共享组件
import React from 'react';

export const SharedTimer = ({ remainingTime, moduleConfig }) => {
  // 通用计时器逻辑，支持不同模块的配置
  return (
    <div className={`timer timer--${moduleConfig.moduleId}`}>
      {formatTime(remainingTime)}
    </div>
  );
};

// modules/grade-4/components/Grade4Timer.jsx - 4年级使用共享组件
import { SharedTimer } from '../../../shared/components/common/Timer';

export const Grade4Timer = () => {
  return <SharedTimer moduleConfig={grade4Config} />;
};
```

### Phase 3: 模块注册系统

```javascript
// modules/ModuleRegistry.js - 支持新模块注册
import { SteamedBunModule } from './grade-7/index.js';
import { Grade4Module } from './grade-4/index.js';

export class ModuleRegistry {
  static modules = new Map();
  
  static {
    // 注册7年级模块（包装器）
    this.registerModule(SteamedBunModule);
    
    // 注册4年级模块（独立）
    this.registerModule(Grade4Module);
  }
  
  static registerModule(module) {
    this.modules.set(module.url, module);
    console.log(`[ModuleRegistry] 注册模块: ${module.displayName} -> ${module.url}`);
  }
  
  static getModuleByUrl(url) {
    return this.modules.get(url);
  }
  
  static getAllModules() {
    return Array.from(this.modules.values());
  }
}
```

## 开发工作流

### 4年级模块开发流程

1. **快速创建模块结构**
```bash
# 创建4年级模块目录
mkdir -p src/modules/grade-4/{components/pages,context,utils,hooks,assets/images,data}

# 复制模块模板文件
cp templates/module-template/* src/modules/grade-4/
```

2. **独立开发环境**
```javascript
// 4年级模块可以独立开发和测试
// 所有依赖都在模块内部，不会影响7年级代码
```

3. **共享组件使用**
```javascript
// 从共享层导入通用组件
import { SharedButton } from '../../../shared/components/common/Button';
import { useSharedAuth } from '../../../shared/hooks/useAuth';
```

### 7年级模块维护

```javascript
// modules/grade-7/wrapper.js - 7年级包装器
import PageRouter from '../../components/PageRouter'; // 现有路径不变！
import { AppProvider } from '../../context/AppContext'; // 现有路径不变！

export const Grade7Wrapper = ({ userContext, initialPageId }) => {
  // 完全使用现有代码，零修改
  return (
    <AppProvider>
      <PageRouter />
    </AppProvider>
  );
};
```

## 未来扩展路径

### 短期（4年级开发期间）
- [ ] 4年级模块完全独立开发
- [ ] 逐步将通用组件抽取到shared层
- [ ] 建立模块开发规范和模板

### 中期（更多年级）
- [ ] 5年级、6年级采用相同的独立模块结构
- [ ] shared层逐渐丰富，新模块开发效率提升
- [ ] 建立模块间通信机制（如果需要）

### 长期（系统成熟后）
- [ ] 考虑7年级代码逐步迁移到规范结构（可选）
- [ ] 建立完整的模块生态系统
- [ ] 实现模块热插拔和动态加载

## 关键优势

1. **零风险启动** - 7年级代码完全不受影响
2. **快速新模块开发** - 4年级有清晰的目录结构
3. **逐步优化** - 共享组件逐渐抽取，提升开发效率
4. **清晰边界** - 每个年级的代码边界清晰
5. **向后兼容** - 支持现有用户无缝使用

这个策略既保护了现有投资，又为未来发展铺平了道路。