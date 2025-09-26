# **编码标准与开发规范 (Coding Standards & Development Guidelines)**

## **核心开发原则 (Core Development Principles)**

### **1.1 代码隔离原则**
- **绝对禁止**修改现有七年级"蒸馒头"模块的任何代码
- **混合架构**：新模块通过顶层模块路由器 (ModuleRouter.jsx) 集成，实现新旧模块共存
- **零影响迁移**：所有7年级文件保持原位置和原内容，通过Vite别名实现重定向

### **1.2 模式复用原则**
- 新模块开发必须复用和遵循现有项目的编码模式和视觉风格
- 所有新组件必须继承现有的基础样式类和组件架构
- 保持与现有项目的技术栈完全一致

## **组件开发标准 (Component Development Standards)**

### **2.1 标准页面组件模板**

所有新开发的页面组件必须遵循以下结构模板：

```jsx
// 标准页面组件模板
import React, { useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useGrade4Context } from '../context/Grade4Context';

const NewModulePage = () => {
  const { 
    // 从全局上下文获取必要的状态
    isAuthenticated,
    logOperation,
    collectAnswer
  } = useAppContext();
  
  const { currentPage, updateCurrentPage } = useGrade4Context();

  useEffect(() => {
    // 页面进入时的必要日志记录
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: `进入页面${currentPage}`
    });
  }, []);

  const handleNextPage = () => {
    // 收集页面答案
    collectAnswer({
      targetElement: '问题标识',
      value: '用户的答案'
    });
    
    // 导航到下一页
    updateCurrentPage(currentPage + 1);
  };

  // 页面内容
  return (
    <div className="page-content">
      <div className="page-title">页面标题</div>
      <div className="cartoon-box">
        {/* 页面具体内容在这里 */}
        <button 
          className="btn btn-primary"
          onClick={handleNextPage}
        >
          下一页
        </button>
      </div>
    </div>
  );
};

export default NewModulePage;
```

### **2.2 模块集成标准**

新模块的根组件必须正确集成到现有框架内：

```jsx
// src/modules/grade-4/index.jsx - 正确的集成方式
import React from 'react';
import { Grade4Provider } from './context/Grade4Context';
import Grade4Router from './components/Grade4Router';

const Grade4Module = () => {
  return (
    <Grade4Provider>
      {/* 注意：不要重新创建UserInfoBar、Timer等，它们已在App.jsx中渲染 */}
      {/* 只渲染模块特定的内容 */}
      <Grade4Router />
    </Grade4Provider>
  );
};

export default Grade4Module;
```

### **2.3 禁止的开发模式**

以下是明确禁止的开发模式：

```jsx
// ❌ 错误：不要重新创建顶部导航栏
const WrongPage = () => {
  return (
    <div>
      {/* ❌ 禁止：重复创建用户信息栏 */}
      <div className="my-custom-header">自定义头部</div>
      
      {/* ❌ 禁止：使用不一致的样式 */}
      <div style={{backgroundColor: '#ff0000'}}>
        内容
      </div>
    </div>
  );
};

// ❌ 错误：不要绕过全局布局系统
const AnotherWrongPage = () => {
  return (
    <div className="my-custom-layout"> {/* ❌ 禁止自定义布局 */}
      {/* 内容 */}
    </div>
  );
};
```

## **样式规范 (Style Guidelines)**

### **3.1 必须使用的CSS变量系统**

```css
:root {
  /* 主色系 */
  --cartoon-primary: #59c1ff;    /* 主要交互色，导航高亮 */
  --cartoon-secondary: #ffce6b;  /* 次要强调色，计时器背景 */
  --cartoon-accent: #ff7eb6;     /* 强调色，按钮激活状态 */
  
  /* 背景色系 */
  --cartoon-bg: #fff9f0;         /* 全局背景 */
  --cartoon-light: #e6f7ff;      /* 左侧导航背景 */
  
  /* 功能色系 */
  --cartoon-green: #67d5b5;      /* 成功/已完成状态 */
  --cartoon-red: #ff8a80;        /* 警告/错误状态 */
  --cartoon-dark: #2d5b8e;       /* 主要文本色 */
  
  /* 装饰色系 */
  --cartoon-border: #ffd99e;     /* 边框色 */
  --cartoon-shadow: rgba(255, 188, 97, 0.3); /* 阴影色 */
}
```

### **3.2 必须使用的基础样式类**

```css
/* 必须使用的基础样式类 */
.btn                    /* 按钮基础样式 */
.btn-primary           /* 主要按钮样式 */
.page-content          /* 页面内容容器 */
.page-title            /* 页面标题 */
.cartoon-box           /* 卡片容器样式 */
.form-control          /* 表单控件样式 */
.text-input            /* 文本输入框样式 */
```

### **3.3 布局标准**

```css
/* 中央内容区域标准 */
.central-content-area {
  background: white;
  border-radius: 20px;
  border: 3px solid var(--cartoon-border);
  box-shadow: 0 10px 30px var(--cartoon-shadow);
  padding: 20px;
  /* 关键要求：所有内容必须在一屏内完成，不出现滚动条 */
  max-height: calc(100vh - 150px);
  overflow: hidden;
}
```

## **数据处理规范 (Data Handling Standards)**

### **4.1 数据提交标准格式**

所有页面数据必须遵循以下提交格式：

```javascript
const markObject = {
  pageNumber: "15",                    // String: 页面序号
  pageDesc: "第九题",                  // String: 页面描述
  operationList: [                     // Array: 用户操作记录
    {
      code: 1,                         // Number: 操作序号
      targetElement: "页面",           // String: 操作目标
      eventType: "page_enter",         // String: 事件类型
      value: "进入页面Page_15",         // String: 操作值
      time: "2024-07-24 15:30:45"     // String: 时间戳
    }
  ],
  answerList: [                        // Array: 答案记录
    {
      code: 1,                         // Number: 答案序号
      targetElement: "问题标识",        // String: 问题标识
      value: "用户答案"                 // Any: 答案值
    }
  ],
  beginTime: "2024-07-24 15:30:45",   // String: 页面进入时间
  endTime: "2024-07-24 15:32:10",     // String: 页面退出时间
  imgList: []                          // Array: 图片附件
};
```

### **4.2 必需的数据记录函数**

```javascript
// 操作日志记录
logOperation({
  targetElement: string,    // UI元素或组件名称
  eventType: string,        // 交互类型
  value?: string,          // 可选：交互值或上下文
  elementId?: string       // 可选：DOM元素ID
});

// 答案收集
collectAnswer({
  targetElement: string,    // 问题或输入标识符
  value: any,              // 学生答案
  code?: number           // 可选：序号（自动生成）
});
```

## **技术栈限制 (Technology Stack Constraints)**

### **5.1 允许的技术**

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 构建工具 | Vite | 项目当前版本 | 构建和开发 |
| UI库 | React | 项目当前版本 | 组件开发 |
| 语言 | JavaScript/JSX | 项目当前版本 | 代码编写 |
| 状态管理 | React Context API | 项目当前版本 | 状态管理 |
| 包管理器 | PNPM | 项目当前版本 | 依赖管理 |

### **5.2 禁止引入的技术**

- **原则**：**禁止引入任何新的核心框架或库**
- **例外**：仅允许小型的UI交互辅助库（如拖拽功能），但需要经过明确批准
- **理由**：确保项目稳定性和一致性

## **开发验证清单 (Development Validation Checklist)**

### **6.1 视觉一致性检查**

- [ ] 绿色顶部导航栏正确显示平台名称和用户姓名
- [ ] 橙色计时器位于右上角，显示格式正确
- [ ] 左侧圆形进度导航显示当前步骤状态
- [ ] 中央内容卡片具有正确的圆角和阴影效果
- [ ] 所有按钮使用统一的样式和动画效果
- [ ] 色彩使用符合既定的CSS变量系统

### **6.2 功能集成检查**

- [ ] 页面切换时正确记录操作日志
- [ ] 用户答案正确收集并格式化
- [ ] 计时器与模块状态正确同步
- [ ] 页面刷新后状态正确恢复
- [ ] 与现有7年级模块无冲突

### **6.3 代码质量检查**

- [ ] 遵循标准组件模板结构
- [ ] 正确使用Context API进行状态管理
- [ ] 所有交互都有相应的日志记录
- [ ] 错误边界处理完整
- [ ] 无硬编码样式，全部使用CSS变量

## **路径别名配置 (Path Alias Configuration)**

```javascript
// vite.config.js
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

## **7.0 模块布局规范 (Module Layout Standards)**

### **7.1 容器适配原则**

新模块必须完美适配现有的应用框架布局，不能出现滚动条或溢出问题。

**核心要求**：
- 模块内容必须完全填满白色背景区域
- 禁止出现灰色背景的滚动区域
- 支持多分辨率自适应显示
- 内容垂直居中，水平限制最大宽度

### **7.2 模块根容器规范**

```css
/* 模块根容器标准样式 */
.module-name-module {
  width: 100%;
  height: 100%;              /* 使用100%而非100vh */
  max-height: 100%;
  overflow: hidden;           /* 强制禁用滚动 */
  display: flex;
  flex-direction: column;
  background: transparent;    /* 透明背景，使用外层白色背景 */
  font-family: 'Microsoft YaHei', Arial, sans-serif;
  position: relative;
}
```

### **7.3 页面内容容器规范**

```css
/* 重写全局page-content样式以适配模块容器 */
.module-name-module .page-content {
  padding: 0;
  max-height: 100%;
  height: 100%;
  overflow: hidden;           /* 禁用滚动 */
  max-width: none;
  width: 100%;
  margin: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
```

### **7.4 页面组件布局标准**

```jsx
// 标准页面组件布局结构
const ModulePage = () => {
  return (
    <div className="page-content page-fade-in" style={{ 
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100%',           // 完全填满容器
      width: '100%',
      boxSizing: 'border-box',
      padding: '20px',          // 适中的内边距
      overflow: 'hidden'        // 强制禁用滚动
    }}>
      {/* 页面标题 */}
      <h1 className="page-title">页面标题</h1>
      
      {/* 主要内容区域 */}
      <div className="content-section" style={{
        width: '100%',
        maxWidth: '800px',        // 限制最大宽度
        flex: '0 0 auto'          // 不拉伸
      }}>
        {/* 内容 */}
      </div>
      
      {/* 按钮区域 */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        width: '100%',
        maxWidth: '800px',
        marginTop: '20px'
      }}>
        <button className="btn btn-primary">下一页</button>
      </div>
    </div>
  );
};
```

### **7.5 自适应设计要求**

**宽度自适应**：
```css
/* 内容区域自适应宽度 */
.content-container {
  width: 100%;              /* 小屏幕完全填满 */
  max-width: 800px;         /* 大屏幕限制最大宽度 */
  margin: 0 auto;           /* 居中显示 */
}
```

**高度适配**：
```css
/* 高度完全适配容器 */
.page-container {
  height: 100%;             /* 而非min-height或vh单位 */
  overflow: hidden;         /* 强制禁用滚动 */
  display: flex;
  flex-direction: column;
  justify-content: center;  /* 垂直居中 */
}
```

### **7.6 全局样式覆盖规范**

当全局样式与模块需求冲突时，使用模块特定的CSS选择器进行覆盖：

```css
/* 覆盖全局page-content的滚动设置 */
.grade-4-module .page-content {
  max-height: 100% !important;
  overflow: hidden !important;
  padding: 0 !important;
}

/* 覆盖全局容器的视口高度设置 */
.grade-4-module .container {
  height: 100% !important;
  max-height: 100% !important;
}
```

### **7.7 布局验证检查清单**

开发完成后必须验证以下布局要求：

- [ ] **完全填满**: 内容完全适配白色背景区域，无空白
- [ ] **无滚动条**: 页面内任何区域都不出现滚动条
- [ ] **垂直居中**: 主要内容在可视区域内垂直居中
- [ ] **宽度适配**: 在1280px和更大分辨率下限制最大宽度
- [ ] **小屏适配**: 在较小分辨率下内容完全填满可用宽度
- [ ] **高度适配**: 内容高度完全适配容器，不溢出
- [ ] **背景透明**: 模块背景透明，显示外层框架的白色背景
- [ ] **字体一致**: 使用统一的字体系统

### **7.8 常见布局问题解决方案**

**问题1**: 出现灰色滚动区域
```css
/* 解决方案: 强制禁用overflow */
.module-container {
  overflow: hidden !important;
  height: 100% !important;
}
```

**问题2**: 内容不能垂直居中
```css
/* 解决方案: 使用flexbox居中 */
.page-content {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}
```

**问题3**: 在大屏幕上内容过宽
```css
/* 解决方案: 设置最大宽度 */
.content-area {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
}
```

## **总结 (Summary)**

通过严格遵循以上编码标准和开发规范，新开发的模块将：

1. 与现有系统保持完美的视觉和功能一致性
2. 确保代码的可维护性和可扩展性
3. 避免对现有7年级模块造成任何影响
4. 为用户提供统一、流畅的学习评估体验