# **5.0 组件架构 (Component Architecture)**

### **5.1 组件化理念 (Component Philosophy)**

我们将采用**组件驱动开发 (Component-Driven Development)** 的方法。这意味着我们会将复杂的UI拆分成一系列小型的、独立的、可复用的组件。每个组件都有单一的职责，这使得AI代理可以聚焦于一次构建一个“积木块”，从而提高代码质量和开发效率。

### **5.2 “火车购票”模块目录结构 (Module Directory Structure)**

新模块的所有代码都将严格存放在 src/modules/grade-4/ 目录下。为了保持代码的清晰和有序，我们将采用以下内部结构：

Plaintext

src/modules/grade-4/  
├── assets/               \# 存放图片、SVG等静态资源  
├── components/           \# 存放该模块独有的React组件  
│   ├── containers/       \# 容器组件 (负责复杂逻辑和状态)  
│   └── ui/               \# UI组件 (负责展示，无复杂逻辑)  
├── context/              \# 存放状态管理相关代码 (Grade4Context.jsx)  
├── hooks/                \# 存放该模块独有的自定义Hooks  
├── pages/                \# 存放代表每个测评页面的顶层组件  
├── types/                \# 存放TypeScript类型定义 (index.ts)  
└── index.tsx             \# 四年级模块的主入口文件

### **5.3 组件分解 (Component Breakdown)**

为了实现《UI/UX规格说明书》中定义的复杂交互，我们将创建以下关键组件：

#### **5.3.1 页面组件 (Page Components)**

* **OnboardingPage.tsx**: (PDF 第2页) \- 注意事项页面，包含40秒计时器逻辑。  
* **ScenarioPage.tsx**: (PDF 第3-5页) \- 一个复合页面，根据步骤渲染情景介绍、问题识别或因素分析。  
* **RouteAnalysisPage.tsx**: (PDF 第6-12页) \- 出发站分析页面。这将是一个容器，负责组合 InteractiveMap 和 RouteCalculator 等组件。  
* **TimePlanningPage.tsx**: (PDF 第13-16页) \- 时间规划页面。这也是一个容器，负责组合 TimePlannerTutorial 和 TimePlanner 等组件。  
* **TicketPurchasePage.tsx**: (PDF 第17-18页) \- 车票购买页面。负责组合 TicketSelector 和 FinalCalculator 组件。  
* **CompletionPage.tsx**: (PDF 第19页) \- 测评完成页面。

#### **5.3.2 容器/逻辑组件 (Container Components)**

这些是实现核心交互逻辑的“智能”组件。

* **InteractiveMap.tsx**: (用于题目4) \- 负责管理和显示动态更新的路线地图。它将接收用户点击事件，并显示相应的地图图片。  
* **TimePlanner.tsx**: (用于题目7和8) \- **核心复杂组件**。它将处理所有拖拽逻辑、任务块的**吸附对齐**，并管理用户排列的方案数据。**注意：此组件不计算总时间，只提供输入框**。  
* **FinalCalculator.tsx**: (用于题目10) \- 包含自定义小键盘、公式显示区和总价输入框。它将管理这四个部分之间的复杂完成状态逻辑。

#### **5.3.3 UI/展示组件 (UI Components)**

这些是可复用的"哑"组件，只负责展示。

* **AssessmentPageLayout.jsx**: **[核心布局组件]** 统一的页面布局组件，负责：
  - 完全适配现有应用框架的白色背景区域
  - 消除滚动条，确保内容在一屏内显示  
  - 提供垂直居中、水平自适应的响应式布局
  - 支持可配置的标题、按钮和内容区域
  - 集成操作日志记录功能
  
  **关键特性**:
  ```jsx
  <AssessmentPageLayout 
    title="页面标题"
    subtitle="可选副标题" 
    showNextButton={true}
    isNextButtonEnabled={isReady}
    onNextClick={handleNext}
  >
    <YourPageContent />
  </AssessmentPageLayout>
  ```

* **DraggableTask.tsx**: 在时间规划器中，代表一个可被拖拽的任务块。  
* **DropZone.tsx**: 在时间规划器中，代表可以放置任务块的区域。  
* **OnScreenKeyboard.tsx**: 专为题目10设计的自定义屏幕小键盘。  
* **RouteMapModal.tsx**: 在题目5中，用于在弹窗中显示路线图的组件。

#### **5.3.4 布局适配组件规范 (Layout Adaptation Component Standards)**

为确保所有新模块完美适配现有框架，每个模块必须实现以下布局适配组件：

**模块根容器**:
```jsx
// src/modules/grade-4/index.jsx
const Grade4Module = ({ globalContext, authInfo }) => {
  return (
    <Grade4Provider globalContext={globalContext} authInfo={authInfo}>
      <div className="grade-4-module">  {/* 关键：使用模块特定的CSS类 */}
        <Grade4PageRouter />
      </div>
    </Grade4Provider>
  );
};
```

**模块专用样式文件**:
```css
/* src/modules/grade-4/styles/Grade4Layout.css */
.grade-4-module {
  width: 100%;
  height: 100%;              /* 使用100%而非100vh */
  max-height: 100%;
  overflow: hidden;           /* 强制禁用滚动 */
  background: transparent;    /* 透明背景，显示外层白色背景 */
}

/* 覆盖全局样式以消除滚动冲突 */
.grade-4-module .page-content {
  max-height: 100%;
  height: 100%;
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
}
```

**页面组件适配**:
所有页面组件必须遵循以下结构确保完全填满容器：
```jsx
const ModulePage = () => (
  <div className="page-content" style={{ 
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center'
  }}>
    {/* 页面内容，最大宽度800px，居中显示 */}
  </div>
);
```

### **5.4 组件关系图 (Component Relationship Diagram)**

下图展示了这些组件如何组合在一起，构成一个完整的页面。

代码段

graph TD  
    subgraph "RouteAnalysisPage (题目4-5)"  
        A\[AssessmentPageLayout\] \--\> B{InteractiveMap}  
        A \--\> C\[RouteCalculator\]  
        A \--\> D\[RouteMapModal\]  
    end

    subgraph "TimePlanningPage (题目7-8)"  
        E\[AssessmentPageLayout\] \--\> F\[TimePlanner\]  
        F \--\> G\[DraggableTask\]  
        F \--\> H\[DropZone\]  
    end

    subgraph "TicketPurchasePage (题目10)"  
        I\[AssessmentPageLayout\] \--\> J\[FinalCalculator\]  
        J \--\> K\[OnScreenKeyboard\]  
    end
