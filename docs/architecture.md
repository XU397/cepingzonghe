# **HCI-Evaluation 棕地增强架构文档**

## **1.0 引言 (Introduction)**

### **1.1 文档目的**

本文件旨在为“HCI-Evaluation”项目的“火车购票”模块增强，提供详细的前端技术架构方案。其核心目标是指导AI开发代理，在遵循现有项目技术栈和模式的前提下，高效、高质量地完成新模块的开发与集成。

### **1.2 现有项目分析 (Existing Project Analysis)**

在深入设计新模块之前，我们必须重申对现有系统架构的理解：

* **当前项目状态**:  
  * **核心技术栈**: 这是一个基于 **React** 和 **Vite** 的现代化前端项目。  
  * **项目结构**: 使用 **PNPM** 作为包管理器的标准React应用结构。  
  * **架构风格**: 现有的“蒸馒头”模块采用自定义的页面路由 (PageRouter.jsx) 和基于 **React Context API** (AppContext.jsx) 的全局状态管理。  
  * **视觉风格**: 遵循您提供的截图所示的视觉设计系统，包括顶部导航栏、左侧进度导航、中央内容卡片和计时器样式。  
* **核心约束与限制**:  
  * **代码隔离**: 绝对禁止修改现有七年级“蒸馒头”模块的任何代码。  
  * **模式复用**: 新模块的开发应尽可能复用和遵循现有项目的编码模式和视觉风格。  
  * **混合架构**: 新模块将通过一个新的顶层模块路由器 (ModuleRouter.jsx) 集成，实现新旧模块的共存。

### **1.3 变更日志 (Change Log)**

| 变更 | 日期 | 版本 | 描述 | 作者 |
| :---- | :---- | :---- | :---- | :---- |
| 创建文档 | 2025-07-25 | 1.0 | 初始架构草案，定义了新模块的技术集成策略。 | Winston |

## **2.0 增强范围与集成策略 (Enhancement Scope and Integration Strategy)**

### **2.1 增强概述 (Enhancement Overview)**

* **增强类型**: 新功能模块添加 (New Feature Module Addition)。  
* **范围**: 开发一个功能完整的四年级“火车购票”测评模块，并将其集成到一个新的多模块路由框架中。  
* **集成影响等级**: **中等 (Moderate)**。核心风险在于引入新的顶层路由机制，必须确保对现有模块的兼容性。

### **2.2 集成方法 (Integration Approach)**

**分阶段迁移策略 (Phased Migration Strategy)**:

本项目采用**分阶段迁移策略**，在保护现有7年级模块稳定性的前提下，逐步构建新的多模块架构：

**Phase 1: 新模块独立构建** (当前阶段)
- 7年级模块保持现有文件结构完全不变，继续使用传统的PageRouter.jsx
- 新建4年级模块采用全新的模块化架构，位于src/modules/grade-4/
- 通过ModuleRouter.jsx实现两套系统的并存和动态路由

**Phase 2: 后续迁移** (4年级完成后)
- 逐步将7年级模块迁移到新架构下（src/modules/grade-7/）
- 提取共享组件到src/shared/层
- 统一所有模块的架构模式

* **代码集成策略**:  
  * **严格隔离原则**: 4年级模块的所有代码严格限制在 src/modules/grade-4/ 目录内
  * **零影响策略**: 绝对不修改现有7年级模块的任何文件（保护379个路径依赖）
  * **包装器模式**: 7年级模块通过轻量级包装器(src/modules/grade-7/wrapper.jsx)接入新路由系统
  * **动态路由**: 通过ModuleRouter.jsx根据服务器返回的url字段决定加载哪个模块
  
* **UI集成策略**:  
  * **共享核心框架**: 两个模块共用UserInfoBar、Timer和主体布局框架
  * **独立导航系统**: 4年级模块有独立的11步导航，7年级保持现有导航逻辑
  * **样式统一**: 4年级严格遵循现有的CSS变量系统，确保视觉一致性
  
* **API集成策略**:  
  * **路径别名迁移**: 通过vite.config.js中的路径别名将现有服务重定向到新的共享层
  * **零代码修改**: 7年级模块继续使用原有导入路径（如'../services/apiService.js'），由Vite别名透明重定向
  * **共享服务层**: 新建src/shared/services/目录，提供统一的API和数据日志服务
  * **数据格式统一**: 所有模块遵循相同的MarkObject提交格式

### **2.3 兼容性需求 (Compatibility Requirements)**

* **API兼容性**: 必须保持与现有后端API的完全兼容。所有发送到 /stu/saveHcMark 的请求都必须是 FormData 格式。  
* **UI/UX一致性**: 新模块的所有UI元素必须遵循已确定的视觉风格指南，与现有模块在观感上保持一致。  
* **性能影响**: 新模块的加载和运行不应对现有模块的性能产生可感知的负面影响。我们将利用Next.js的代码分割（Code Splitting）能力，确保用户只加载他们需要的模块代码。

## **3.0 技术栈校准 (Tech Stack Alignment)**

### **3.1 现有技术栈 (Existing Technology Stack)**

新模块的开发将完全基于并集成于现有项目的技术栈中。所有开发工作都必须使用下表中定义的、已批准的技术和版本。

| 类别 | 当前技术 | 版本 | 在增强中的用途 | 备注 |
| :---- | :---- | :---- | :---- | :---- |
| **构建工具** | Vite | (项目当前版本) | 构建所有新页面和组件的基础工具。 | 支持快速开发和热更新。 |
| **UI库** | React | (项目当前版本) | 用于构建所有新的UI组件。 | 必须使用函数式组件和Hooks。 |
| **语言** | JavaScript/JSX | (项目当前版本) | 编写所有新模块的逻辑和组件。 | 可选择性使用TypeScript。 |
| **状态管理** | React Context API | (项目当前版本) | 用于管理新模块内部的局部状态。 | 新模块将创建自己的Context Provider。 |
| **包管理器** | PNPM | (项目当前版本) | 管理所有新引入的依赖。 |  |
| **路径管理** | Vite Aliases | (项目当前版本) | 通过路径别名实现安全的代码迁移。 | 核心策略：不移动文件，使用别名重定向。 |

### **3.2 新技术引入 (New Technology Additions)**

* **原则**: **无 (None)**。  
* **理由**: 为了最大限度地保证项目的稳定性和一致性，本次增强项目**禁止引入任何新的核心框架或库**。所有功能实现都必须在现有技术栈的范围内完成。唯一可能新增的是一些小型的、用于特定UI交互（如拖拽功能）的辅助库，但这些库的选择也必须与现有技术栈完全兼容，并且需要经过明确的批准。

## **4.0 数据模型与状态管理 (Data Models and State Management) (核心修订版)**

本章节定义了新模块的内部状态管理策略，以及与后端通信时必须严格遵守的数据提交模型。

### **4.1 状态管理策略 (State Management Strategy)**

为了保持新模块的独立性和可维护性，我们将为“火车购票”模块创建一个专属的状态管理容器。

* **技术选型**: 与现有项目保持一致，我们将使用 **React Context API** 来管理新模块的所有内部状态。  
* **实现方式**:  
  1. 我们将创建一个新的 Grade4Context.jsx 文件于 src/modules/grade-4/context/ 目录下。  
  2. 这个 Grade4Provider 组件将包裹整个四年级模块的组件树，使其内部的所有组件都能访问和修改测评的状态。  
  3. **核心职责**: Grade4Context 不仅负责管理UI的实时状态，还必须在每次页面切换或最终提交时，**负责将内部状态转换成后端所需的、精确的MarkObject提交格式**。

### **4.2 内部UI状态模型 (Internal UI State Model)**

这是 Grade4Context 内部用来驱动UI交互的状态树。它的结构是为了方便组件进行数据绑定和更新而设计的。

// file: src/modules/grade-4/types/internalState.ts

// 用于存储拖拽任务方案的结构  
interface Task {  
  id: number; // 任务ID (1-5)  
  name: string; // 任务名称  
  duration: number; // 任务耗时（分钟）  
}

interface PlacedTask extends Task {  
  // 任务在时间轴上的位置信息，用于渲染和识别并行关系  
  startTime: number;  
  endTime: number;  
}

interface TimeScheme {  
  tasks: PlacedTask\[\]; // 用户放置的任务列表  
  totalTime: number | null; // 用户手动输入的总用时  
}

// 四年级模块的内部UI状态树  
export interface Grade4State {  
  currentPage: number;  
    
  // 题目 2: 问题识别  
  problemStatement: string;  
    
  // 题目 3: 因素分析  
  relevantFactors: string\[\];  
    
  // 题目 4: 路线计算  
  routeCalculations: {  
    route1\_km: number | null;  
    route5\_km: number | null;  
  };  
    
  // 题目 5: 站点推荐  
  stationChoice: {  
    station: '南充北站' | '南充站' | null;  
    justification: string;  
  };  
    
  // 题目 7: 用户方案设计  
  userSchedules: {  
    scheme1: TimeScheme;  
    scheme2: TimeScheme;  
  };

  // 题目 8: 方案评估与优化  
  optimizationResponse: {  
    isOptimal: boolean | null;  
    improvedPlan?: TimeScheme;  
  };  
    
  // 题目 9: 车票筛选  
  preliminarySelection: string\[\];  
    
  // 题目 10: 最终推荐与计价  
  finalPurchaseDecision: {  
    selectedTrain: 'D175' | 'C751' | null;  
    justification: string;  
    calculationFormula: string;  
    calculatedTotal: number | null;  
  };  
}

### **4.3 后端提交数据模型 (Backend Submission Data Model) (核心)**

**这是与后端通信的强制性契约**。所有提交到 /stu/saveHcMark 的数据都必须遵循以下TypeScript接口定义的结构。

// file: src/shared/types/submissionPayload.ts

// 单次用户交互的操作记录  
export interface Operation {  
  code: number; // 序号，从1开始递增  
  targetElement: string; // 交互的UI元素描述  
  eventType: string; // 事件类型, e.g., "点击", "下拉框选择", "文本域失焦"  
  value?: string; // 事件相关的值 (可选)  
  time: string; // 操作时间戳 (格式: "YYYY-MM-DD HH:mm:ss")  
}

// 单个问题的最终答案  
export interface Answer {  
  code: number; // 序号，从1开始递增  
  targetElement: string; // 问题描述  
  value: any; // 用户的答案，可以是字符串、数字、数组或对象  
}

// (新增) 截图信息的结构  
export interface ImageInfo {  
  code: number; // 序号, 从1开始  
  targetElement: string; // 截图的目标UI元素描述, e.g., "方案一拖拽框"  
  imgUrl: string; // 截图上传后返回的URL  
}

// 封装单页所有作答数据的核心对象  
export interface MarkObject {  
  pageNumber: string; // 页码 (必须是字符串)  
  pageDesc: string; // 页面/题目描述  
  operationList: Operation\[\]; // 本页的所有操作记录  
  answerList: Answer\[\]; // 本页的所有最终答案  
  beginTime: string; // 进入本页的时间戳  
  endTime: string; // 离开本页的时间戳  
  imgList: ImageInfo\[\]; // (修订) 图像列表，用于存放方案截图  
}

// 最终通过FormData发送的完整载荷  
export interface SubmissionPayload {  
  batchCode: string; // 测评批次号, e.g., "250619"  
  examNo: string; // 学生考号, e.g., "10015"  
  mark: string; // MarkObject对象的JSON字符串  
}

### **4.4 状态到提交的转换逻辑 (State-to-Payload Transformation)**

在每次用户点击“下一页”或最终“完成”时，前端必须执行一个转换逻辑，将分散在内部UI状态模型 (Grade4State) 中的数据，整合成一个符合后端提交数据模型 (MarkObject) 规范的对象。  
开发要求: AI开发代理在构建每个页面时，不仅要实现UI交互，还必须在页面切换的逻辑中，编写这个从Grade4State到MarkObject的数据转换和组装代码，并通过共享的dataLogger服务进行上报。对于题目7和8，这个逻辑必须包含调用截图、上传并组装imgList的步骤。


## **5.0 组件架构 (Component Architecture)**

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

这些是可复用的“哑”组件，只负责展示。

* **AssessmentPageLayout.tsx**: 一个布局组件，用于创建统一的中央内容卡片样式，所有页面组件都将被它包裹。  
* **DraggableTask.tsx**: 在时间规划器中，代表一个可被拖拽的任务块。  
* **DropZone.tsx**: 在时间规划器中，代表可以放置任务块的区域。  
* **OnScreenKeyboard.tsx**: 专为题目10设计的自定义屏幕小键盘。  
* **RouteMapModal.tsx**: 在题目5中，用于在弹窗中显示路线图的组件。

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

## **6.0 核心UI框架与共享组件 (Core UI Framework & Shared Components)**

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

## **7.0 源代码树集成 (Source Tree Integration)**

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

## **8.0 关键交互组件架构规范 (Critical Interactive Components Architecture)**

基于PRD中史诗2的具体要求，以下组件需要特殊的架构考虑和实现策略：

### **8.1 模块包装器与动态路由 (Module Wrapper & Dynamic Routing)**

**7年级模块包装器策略**：
```javascript
// src/modules/grade-7/wrapper.jsx - 轻量级包装器
import React from 'react';
import PageRouter from '../../components/PageRouter'; // 保持现有路径

const Grade7Wrapper = ({ userContext, initialPageId }) => {
  // 无额外逻辑，纯粹包装现有PageRouter
  return <PageRouter />;
};

export default Grade7Wrapper;
```

**动态模块注册**：
```javascript
// src/modules/ModuleRegistry.js
const moduleUrlMap = {
  '/seven-grade': 'grade-7',  // 7年级包装器
  '/four-grade': 'grade-4'    // 4年级新模块
};
```

### **8.2 关键路径计算组件 (Critical Path Calculation)**

**核心需求**：PRD明确要求基于**关键路径**而非简单时长累加计算总用时。

**架构设计**：
```javascript
// src/modules/grade-4/utils/criticalPathCalculator.js
export class CriticalPathCalculator {
  /**
   * 计算任务安排的关键路径总时长
   * @param {Array} tasks - 任务排列数组
   * @returns {number} 关键路径总时长（分钟）
   */
  calculateCriticalPath(tasks) {
    // 实现关键路径算法（CPM - Critical Path Method）
    // 考虑任务的串行、并行关系
    // 返回最长路径的总时长
  }
  
  /**
   * 识别任务间的依赖关系
   * @param {Array} taskLayout - 拖拽后的任务布局
   * @returns {Object} 依赖关系图
   */
  buildDependencyGraph(taskLayout) {
    // 分析任务在时间轴上的位置
    // 确定串行（顺序）和并行关系
  }
}
```

**时间规划器组件**：
```javascript
// src/modules/grade-4/components/containers/TimePlanner.jsx
const TimePlanner = () => {
  const [taskArrangement, setTaskArrangement] = useState([]);
  const [calculatedTime, setCalculatedTime] = useState(null);
  
  const handleTaskDrop = (task, position) => {
    // 处理拖拽放置
    const newArrangement = updateTaskArrangement(task, position);
    setTaskArrangement(newArrangement);
    
    // 关键：使用关键路径算法计算总时长
    const criticalPath = new CriticalPathCalculator();
    const totalTime = criticalPath.calculateCriticalPath(newArrangement);
    setCalculatedTime(totalTime);
  };
};
```

### **8.3 自定义屏幕键盘组件 (Custom On-Screen Keyboard)**

**设计要求**：PRD要求严格按照PDF第18页实现自定义小键盘。

**组件架构**：
```javascript
// src/modules/grade-4/components/ui/OnScreenKeyboard.jsx
const OnScreenKeyboard = ({ onInput, targetField }) => {
  const keyboardLayout = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],  
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+'],
    ['清空', '换行']  // 特殊功能键
  ];
  
  const handleKeyPress = (key) => {
    switch(key) {
      case '=':
        // 处理等于号逻辑
        break;
      case '换行':
        // 处理公式换行
        break;
      case '清空':
        // 清空当前输入
        break;
      default:
        // 常规字符输入
        onInput(key, targetField);
    }
  };
};
```

### **8.4 拖拽交互系统 (Drag & Drop System)**

**交互要求**：支持任务块在时间轴上的精确拖拽和对齐。

**拖拽组件设计**：
```javascript
// src/modules/grade-4/components/ui/DraggableTask.jsx
const DraggableTask = ({ task, onDragStart, onDragEnd }) => {
  return (
    <div 
      draggable
      className="draggable-task"
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      data-task-id={task.id}
    >
      <div className="task-label">{task.name}</div>
      <div className="task-duration">{task.duration}分钟</div>
    </div>
  );
};

// src/modules/grade-4/components/ui/DropZone.jsx  
const DropZone = ({ onDrop, children }) => {
  const handleDrop = (e) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('task-id');
    const position = calculateDropPosition(e);
    onDrop(taskId, position);
  };
  
  return (
    <div 
      className="drop-zone"
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
};
```

### **8.5 交互式地图组件 (Interactive Map Component)**

**功能要求**：支持按钮切换不同路线图，实现PDF第6-11页的交互效果。

```javascript
// src/modules/grade-4/components/containers/InteractiveMap.jsx
const InteractiveMap = () => {
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [routeData, setRouteData] = useState({});
  
  const routeImages = {
    'route1': '/assets/route1-detail.png',
    'route2': '/assets/route2-detail.png',
    // ... 更多路线图
  };
  
  const handleRouteSelect = (routeId) => {
    setSelectedRoute(routeId);
    // 切换地图显示
    // 更新路程数据输入区域
  };
};
```

### **8.6 条件渲染逻辑 (Conditional Rendering Logic)**

**需求**：根据用户选择显示/隐藏额外的拖拽界面（PDF第15-16页）。

```javascript
// 在方案评估页面中
const [needsImprovement, setNeedsImprovement] = useState(null);
const [showImprovedPlanner, setShowImprovedPlanner] = useState(false);

const handleOptimalChoice = (choice) => {
  setNeedsImprovement(choice === 'no');
  setShowImprovedPlanner(choice === 'no');
};

return (
  <div className="page-content">
    {/* 初始问题 */}
    <RadioGroup onSelect={handleOptimalChoice} />
    
    {/* 条件性显示改进界面 */}
    {showImprovedPlanner && (
      <TimePlanner 
        mode="improvement"
        onComplete={() => setCanProceed(true)}
      />
    )}
  </div>
);
```

## **9.0 UI/UX规格集成与视觉一致性 (UI/UX Specification Integration)**

基于完善的《HCI-Evaluation UI/UX规格说明书》，本章节定义了4年级模块必须严格遵循的视觉设计规格和交互实现标准。

### **9.1 视觉一致性强制要求 (Visual Consistency Mandatory Requirements)**

**核心原则**：所有新页面的布局、颜色、字体和组件样式，必须严格复现现有项目的视觉风格，确保新旧模块在观感上无缝衔接。

#### **9.1.1 页面布局标准 (Page Layout Standards)**

**基于实际代码架构的布局要求**：
```css
/* 顶部用户信息条 - 严格复现现有样式 */
.user-info-bar {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  position: fixed;
  top: 0;
  height: 50px;
  width: 100%;
  z-index: 1000;
}

/* 主应用区域 */
.main-app-area {
  background-color: var(--cartoon-bg); /* #fff9f0 */
  padding-top: 70px; /* 为用户信息条预留空间 */
}

/* 左侧进度导航 */
.left-progress-navigation {
  width: 100px;
  height: 100%;
  background-color: var(--cartoon-light); /* #e6f7ff */
  /* 11个导航项的垂直布局 */
}

/* 中央内容区域 */
.central-content-area {
  background: white;
  border-radius: 20px;
  border: 3px solid var(--cartoon-border); /* #ffd99e */
  box-shadow: 0 10px 30px var(--cartoon-shadow);
  padding: 20px;
  /* 关键要求：所有内容必须在一屏内完成，不出现滚动条 */
  max-height: calc(100vh - 150px);
  overflow: hidden;
}

/* 计时器 */
.timer-fixed {
  position: fixed;
  top: 55px;
  right: 20px;
  background-color: var(--cartoon-secondary); /* #ffce6b */
  border-radius: 30px;
  border: 2px solid #ffb347;
  z-index: 999;
}
```

#### **9.1.2 色彩方案强制规范 (Color Palette Enforcement)**

**必须使用的CSS变量系统**：
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

/* 用户信息条专用渐变 */
.user-info-gradient {
  background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%);
  color: white;
}
```

### **9.2 4年级模块导航结构 (Grade-4 Navigation Structure)**

#### **9.2.1 11步导航映射 (11-Step Navigation Mapping)**

```javascript
// src/modules/grade-4/config/navigationMapping.js
export const grade4NavigationSteps = [
  { id: 1, label: "出行方案", pages: ["scenario-intro", "problem-identification"] },
  { id: 2, label: "出行方案", pages: ["factor-analysis"] },
  { id: 3, label: "火车购票", pages: ["route-calculation"] },
  { id: 4, label: "火车购票: 出发站", pages: ["interactive-map"] },
  { id: 5, label: "火车购票: 出发站", pages: ["station-decision"] },
  { id: 6, label: "火车购票: 出发时间", pages: ["tutorial-animation"] },
  { id: 7, label: "火车购票: 出发时间", pages: ["time-planning"] },
  { id: 8, label: "火车购票: 出发时间", pages: ["plan-optimization"] },
  { id: 9, label: "火车购票: 车票选择", pages: ["ticket-filtering"] },
  { id: 10, label: "火车购票: 车票选择", pages: ["final-calculation"] },
  { id: 11, label: "火车购票", pages: ["completion"] }
];

// 多对一映射：多个页面对应一个导航项
export const pageToNavigationMap = {
  "notices": null,  // 无导航高亮
  "scenario-intro": 1,
  "problem-identification": 2,
  "factor-analysis": 3,
  "interactive-map": 4,
  "station-decision": 5,
  "tutorial-animation": 6,
  "time-planning": 7,
  "plan-optimization": 8,
  "ticket-filtering": 9,
  "final-calculation": 10,
  "completion": 11
};
```

### **9.3 关键交互系统技术规范 (Critical Interactive Systems)**

#### **9.3.1 动画系统架构 (Animation System Architecture)**

**路线地图动画脚本实现**：
```javascript
// src/modules/grade-4/utils/mapAnimations.js
export class MapAnimationController {
  constructor(mapContainer) {
    this.container = mapContainer;
    this.routeImages = {
      overview: '/assets/images/route-overview.png',
      route1: '/assets/images/route1-detail.png',
      route2: '/assets/images/route2-detail.png',
      route3: '/assets/images/route3-detail.png',
      route4: '/assets/images/route4-detail.png',
      route5: '/assets/images/route5-detail.png'
    };
    this.preloadImages();
  }
  
  /**
   * 动画切换到指定路线
   * @param {string} routeId - 路线ID (route1-route5)
   */
  animateToRoute(routeId) {
    // 使用GSAP或CSS动画实现淡入淡出效果
    gsap.to(this.container, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        this.container.src = this.routeImages[routeId];
        gsap.to(this.container, { opacity: 1, duration: 0.3 });
      }
    });
  }
  
  preloadImages() {
    // 预加载所有地图图片，确保切换流畅
    Object.values(this.routeImages).forEach(src => {
      const img = new Image();
      img.src = src;
    });
  }
}
```

**教程演示动画脚本**：
```javascript
// src/modules/grade-4/components/TutorialAnimation.jsx
export const TutorialAnimation = () => {
  const playTutorial = () => {
    // 构建脚本动画展示并行任务排列
    const timeline = gsap.timeline();
    
    timeline
      .to('.task-block-1', { x: 50, y: 100, duration: 1 })
      .to('.task-block-2', { x: 150, y: 100, duration: 1 }, '<0.5')
      .to('.total-time-display', { 
        innerHTML: '总用时: 15分钟',
        duration: 0.5,
        ease: "none"
      });
  };
  
  return (
    <div className="tutorial-container">
      <button onClick={playTutorial} className="play-button">
        ▶️ 播放演示
      </button>
      {/* 演示区域 */}
    </div>
  );
};
```

#### **9.3.2 磁吸拖拽系统 (Magnetic Drag System)**

**核心技术要求**：为了便于识别学生的摆放意图，任务块之间必须有磁吸效果。

```javascript
// src/modules/grade-4/utils/magneticDragSystem.js
export class MagneticDragSystem {
  constructor(dropZone, gridSize = 20) {
    this.dropZone = dropZone;
    this.gridSize = gridSize;
    this.snapTolerance = 15; // 15px内自动吸附
  }
  
  /**
   * 磁吸对齐算法
   * @param {number} x - 拖拽位置X坐标
   * @param {number} y - 拖拽位置Y坐标
   * @returns {Object} 修正后的位置坐标
   */
  snapToGrid(x, y) {
    const snappedX = Math.round(x / this.gridSize) * this.gridSize;
    const snappedY = Math.round(y / this.gridSize) * this.gridSize;
    
    return { x: snappedX, y: snappedY };
  }
  
  /**
   * 边缘吸附算法
   * @param {Object} taskBlock - 任务块对象
   * @param {Array} existingBlocks - 已存在的任务块数组
   */
  snapToEdges(taskBlock, existingBlocks) {
    existingBlocks.forEach(block => {
      const distance = this.calculateDistance(taskBlock, block);
      if (distance < this.snapTolerance) {
        // 自动对齐到其他任务块的开始或结束时间点
        this.alignToBlock(taskBlock, block);
      }
    });
  }
  
  /**
   * 视觉反馈：显示吸附引导线
   */
  showSnapGuides(position) {
    const guides = document.querySelectorAll('.snap-guide');
    guides.forEach(guide => {
      guide.style.display = 'block';
      guide.style.left = `${position.x}px`;
    });
  }
}
```

#### **9.3.3 自定义键盘组件强化 (Enhanced Custom Keyboard)**

基于UI/UX规范的详细要求：

```javascript
// src/modules/grade-4/components/ui/OnScreenKeyboard.jsx
export const OnScreenKeyboard = ({ onInput, targetField }) => {
  const keyboardLayout = [
    [
      { key: '7', type: 'number' },
      { key: '8', type: 'number' },
      { key: '9', type: 'number' },
      { key: '÷', type: 'operator' }
    ],
    [
      { key: '4', type: 'number' },
      { key: '5', type: 'number' },
      { key: '6', type: 'number' },
      { key: '×', type: 'operator' }
    ],
    [
      { key: '1', type: 'number' },
      { key: '2', type: 'number' },
      { key: '3', type: 'number' },
      { key: '-', type: 'operator' }
    ],
    [
      { key: '0', type: 'number' },
      { key: '.', type: 'decimal' },
      { key: '=', type: 'equals' },
      { key: '+', type: 'operator' }
    ],
    [
      { key: '清空', type: 'clear', span: 2 },
      { key: '换行', type: 'newline', span: 2 }
    ]
  ];
  
  const handleKeyPress = (keyObj) => {
    switch(keyObj.type) {
      case 'equals':
        // 处理等于号逻辑，可能触发计算
        onInput('=', targetField);
        break;
      case 'newline':
        // 处理公式换行
        onInput('\n', targetField);
        break;
      case 'clear':
        // 清空当前输入区域
        onInput('', targetField, true); // true表示清空操作
        break;
      default:
        // 常规字符输入
        onInput(keyObj.key, targetField);
    }
  };
  
  return (
    <div className="custom-keyboard">
      {keyboardLayout.map((row, rowIndex) => (
        <div key={rowIndex} className="keyboard-row">
          {row.map((keyObj, keyIndex) => (
            <button
              key={keyIndex}
              className={`keyboard-key ${keyObj.type}`}
              style={{ gridColumn: keyObj.span ? `span ${keyObj.span}` : 'auto' }}
              onClick={() => handleKeyPress(keyObj)}
            >
              {keyObj.key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
};
```

### **9.4 响应式交互实现规范 (Responsive Interaction Standards)**

#### **9.4.1 实时验证系统 (Real-time Validation System)**

```javascript
// src/modules/grade-4/hooks/useFormValidation.js
export const useFormValidation = (validationRules) => {
  const [formState, setFormState] = useState({});
  const [isValid, setIsValid] = useState(false);
  
  const validateField = (fieldName, value) => {
    const rule = validationRules[fieldName];
    if (!rule) return true;
    
    return rule.validator(value);
  };
  
  const updateField = (fieldName, value) => {
    const isFieldValid = validateField(fieldName, value);
    
    setFormState(prev => ({
      ...prev,
      [fieldName]: {
        value,
        isValid: isFieldValid
      }
    }));
    
    // 检查所有必填字段是否完成
    const allValid = Object.keys(validationRules).every(field => {
      if (field === fieldName) return isFieldValid;
      return formState[field]?.isValid || false;
    });
    
    setIsValid(allValid);
  };
  
  return { formState, isValid, updateField };
};
```

#### **9.4.2 多条件按钮状态管理 (Multi-condition Button State Management)**

基于UI/UX规范中复杂的按钮启用逻辑：

```javascript
// src/modules/grade-4/hooks/useButtonState.js
export const useButtonState = (conditions) => {
  const [buttonEnabled, setButtonEnabled] = useState(false);
  
  useEffect(() => {
    // 检查所有条件是否满足
    const allConditionsMet = conditions.every(condition => {
      switch(condition.type) {
        case 'non-empty':
          return condition.value && condition.value.trim() !== '';
        case 'selection':
          return condition.value !== null && condition.value !== undefined;
        case 'multiple-selection':
          return Array.isArray(condition.value) && condition.value.length > 0;
        case 'four-tasks-complete':
          // 特殊逻辑：四项任务都完成
          return condition.tasks.every(task => task.completed);
        default:
          return false;
      }
    });
    
    setButtonEnabled(allConditionsMet);
  }, [conditions]);
  
  return buttonEnabled;
};

// 使用示例：最终推荐与计价页面的四项任务验证
const FinalCalculationPage = () => {
  const [trainSelection, setTrainSelection] = useState(null);
  const [reason, setReason] = useState('');
  const [formula, setFormula] = useState('');
  const [totalPrice, setTotalPrice] = useState('');
  
  const buttonEnabled = useButtonState([
    { type: 'selection', value: trainSelection },
    { type: 'non-empty', value: reason },
    { type: 'non-empty', value: formula },
    { type: 'non-empty', value: totalPrice }
  ]);
  
  return (
    <div className="page-content">
      {/* 页面内容 */}
      <button 
        className={`btn btn-primary ${!buttonEnabled ? 'btn-disabled' : ''}`}
        disabled={!buttonEnabled}
      >
        下一页
      </button>
    </div>
  );
};
```

### **9.5 一屏显示技术实现 (Single-Screen Display Implementation)**

#### **9.5.1 响应式布局约束 (Responsive Layout Constraints)**

```css
/* 确保所有内容在一屏内显示的关键CSS */
.grade4-page-container {
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.grade4-content-area {
  flex: 1;
  overflow: hidden; /* 强制不出现滚动条 */
  padding: 20px;
  box-sizing: border-box;
}

/* 内容自适应缩放 */
.adaptive-content {
  transform-origin: top left;
  /* 根据屏幕高度动态缩放 */
  transform: scale(var(--content-scale, 1));
}

/* JavaScript计算缩放比例 */
@media (max-height: 800px) {
  :root {
    --content-scale: 0.9;
  }
}

@media (max-height: 700px) {
  :root {
    --content-scale: 0.8;
  }
}
```

**开发要求**: AI代理必须严格按照这些UI/UX架构规范实现相应组件，确保视觉一致性和交互流畅性，符合PRD中史诗2的详细要求。