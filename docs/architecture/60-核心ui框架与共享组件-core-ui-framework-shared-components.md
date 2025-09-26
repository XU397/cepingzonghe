# **6.0 核心UI框架与共享组件 (Core UI Framework & Shared Components)**

### **6.1 框架识别分析结果 (Framework Analysis Results)**

经过对现有7年级蒸馒头模块的深入分析，我们已经识别出了构成应用整体框架的三个核心UI组件。**这些组件负责渲染应用的统一视觉风格，所有新开发的模块页面都必须使用这些组件进行包裹，以确保视觉风格的绝对统一。**

#### **6.1.1 绿色顶部导航栏组件**

**文件位置**: `src/components/common/UserInfoBar.jsx`
**样式文件**: `src/components/common/UserInfoBar.module.css`

**组件职责**:
- 渲染绿色渐变背景的顶部导航栏
- 显示平台名称："新都区义务教育质量综合监测平台"
- 显示当前登录用户的姓名
- 固定定位在页面顶部，z-index: 1000

**关键样式特征**:
```css
background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
position: fixed;
height: 50px;
color: white;
box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
```

#### **6.1.2 右上角橙色倒计时器组件**

**文件位置**: `src/components/common/Timer.jsx`
**样式定义**: `src/styles/global.css` (第210-225行)

**组件职责**:
- 显示任务剩余时间 (格式: MM:SS)
- 当剩余时间少于5分钟时显示警告样式
- 固定定位在右上角，带有橙色背景和圆角边框

**关键样式特征**:
```css
.timer-container {
  position: fixed;
  top: 55px;
  right: 20px;
  background-color: var(--cartoon-secondary); /* #ffce6b */
  border-radius: 30px;
  border: 2px solid #ffb347;
  z-index: 999;
}
```

#### **6.1.3 主体框架布局组件系统**

**核心布局容器**: `App.jsx` 第278-310行定义的布局结构
**左侧圆形进度导航**: `src/components/common/StepNavigation.jsx`
**中央内容区域**: 通过CSS类 `.task-wrapper` 和 `.main-content-wrapper` 实现

**布局层次结构**:
```
.app-container
├── UserInfoBar (固定顶部)
├── Timer (固定右上角)  
└── .main-content-wrapper
    ├── StepNavigation (左侧导航)
    └── .task-wrapper (中央内容卡片)
```

**关键样式特征**:
```css
.main-content-wrapper {
  display: flex;
  flex-direction: row;
  background-color: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 30px var(--cartoon-shadow);
  border: 3px solid var(--cartoon-border);
}

.task-wrapper {
  flex-grow: 1;
  border-left: 2px solid var(--cartoon-border);
  border-radius: 18px;
  box-shadow: 0 8px 24px var(--cartoon-shadow);
}
```

### **6.2 强制性使用规范 (Mandatory Usage Guidelines)**

**⚠️ 关键要求**: 所有为"火车购票"模块（4年级模块）新开发的页面，都必须被以下核心布局组件所包裹，以确保视觉风格的绝对统一。

#### **6.2.1 标准页面布局模板**

所有新开发的页面组件必须遵循以下结构模板：

```jsx
// 标准页面组件模板
import React from 'react';
import { useAppContext } from '../../../context/AppContext';

const NewModulePage = () => {
  const { 
    // 从全局上下文获取必要的状态
    isAuthenticated,
    logOperation,
    collectAnswer
  } = useAppContext();

  // 页面内容
  return (
    <div className="page-content">
      {/* 页面具体内容在这里 */}
      <div className="page-title">页面标题</div>
      {/* 其他页面内容 */}
    </div>
  );
};

export default NewModulePage;
```

#### **6.2.2 应用级别包裹要求**

**重要**: 新模块的根组件 (`src/modules/grade-4/index.jsx`) 必须确保渲染在现有的应用布局框架内，而不是替换它。正确的集成方式如下：

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

#### **6.2.3 左侧导航栏定制规范**

新模块可以定制左侧圆形进度导航的内容，但必须保持相同的视觉样式。实现方式：

```jsx
// 新模块的导航组件应复用StepNavigation的样式
import StepNavigation from '../../../components/common/StepNavigation';

const Grade4Navigation = () => {
  // 4年级模块有11个步骤
  const currentStep = 3; // 来自模块状态
  const totalSteps = 11;
  
  return (
    <StepNavigation 
      currentStepNumber={currentStep}
      totalSteps={totalSteps}
    />
  );
};
```

### **6.3 样式一致性要求 (Style Consistency Requirements)**

#### **6.3.1 色彩系统**

新模块必须使用现有的CSS变量，确保色彩一致性：

```css
/* 来自 src/styles/global.css 的官方色彩系统 */
:root {
  --cartoon-primary: #59c1ff;    /* 主要蓝色 */
  --cartoon-secondary: #ffce6b;  /* 橙色（计时器） */
  --cartoon-accent: #ff7eb6;     /* 强调色 */
  --cartoon-bg: #fff9f0;         /* 背景色 */
  --cartoon-light: #e6f7ff;      /* 浅色背景 */
  --cartoon-dark: #2d5b8e;       /* 深色文字 */
  --cartoon-border: #ffd99e;     /* 边框色 */
  --cartoon-green: #67d5b5;      /* 绿色（用于导航栏） */
}
```

#### **6.3.2 组件样式继承**

新组件必须继承现有的基础样式类：

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

### **6.4 组件导入与使用示例 (Import and Usage Examples)**

#### **6.4.1 在新模块中使用核心组件**

```jsx
// src/modules/grade-4/pages/ExamplePage.jsx
import React, { useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useGrade4Context } from '../context/Grade4Context';

const ExamplePage = () => {
  const { logOperation, collectAnswer } = useAppContext();
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
      targetElement: '示例问题',
      value: '用户的答案'
    });
    
    // 导航到下一页
    updateCurrentPage(currentPage + 1);
  };

  return (
    <div className="page-content">
      <div className="page-title">示例页面标题</div>
      <div className="cartoon-box">
        {/* 页面内容 */}
        <p>这里是页面内容...</p>
        
        <div className="navigation">
          <button 
            className="btn btn-primary"
            onClick={handleNextPage}
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExamplePage;
```

#### **6.4.2 错误示例（禁止做法）**

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

### **6.5 验证与测试要求 (Validation and Testing Requirements)**

#### **6.5.1 视觉一致性检查清单**

开发完成后，必须验证以下视觉要素：

- [ ] 绿色顶部导航栏正确显示平台名称和用户姓名
- [ ] 橙色计时器位于右上角，显示格式正确
- [ ] 左侧圆形进度导航显示当前步骤状态
- [ ] 中央内容卡片具有正确的圆角和阴影效果
- [ ] 所有按钮使用统一的样式和动画效果
- [ ] 色彩使用符合既定的CSS变量系统

#### **6.5.2 功能集成检查清单**

- [ ] 页面切换时正确记录操作日志
- [ ] 用户答案正确收集并格式化
- [ ] 计时器与模块状态正确同步
- [ ] 页面刷新后状态正确恢复
- [ ] 与现有7年级模块无冲突

**总结**: 通过严格遵循以上规范，新开发的"火车购票"模块将与现有系统保持完美的视觉和功能一致性，为用户提供统一的学习评估体验。
