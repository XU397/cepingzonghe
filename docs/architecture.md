# **HCI-Evaluation 棕地增强架构文档**

## **1.0 引言 (Introduction)**

### **1.1 文档目的**

本文件旨在为“HCI-Evaluation”项目的“火车购票”模块增强，提供详细的前端技术架构方案。其核心目标是指导AI开发代理，在遵循现有项目技术栈和模式的前提下，高效、高质量地完成新模块的开发与集成。

### **1.2 现有项目分析 (Existing Project Analysis)**

在深入设计新模块之前，我们必须重申对现有系统架构的理解：

* **当前项目状态**:  
  * **核心技术栈**: 这是一个基于 **Next.js** 和 **TypeScript** 的现代化前端项目。  
  * **项目结构**: 采用 **Turborepo** 管理的 **Monorepo** 结构，使用 **PNPM** 作为包管理器。  
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

* **代码集成策略**:  
  * **物理隔离**: 新模块的所有代码将严格限制在 src/modules/grade-4/ 目录内。  
  * **逻辑集成**: 通过新的顶层路由组件 src/modules/ModuleRouter.jsx 实现逻辑上的集成。该路由器将根据登录后从API获取的 url 字段，决定渲染七年级模块的包装器还是四年级模块的入口组件。  
* **UI集成**:  
  * 新模块将复用现有的全局应用布局（顶部导航栏、左侧进度条、中央内容卡片）。  
  * 新模块将拥有自己独立的左侧进度导航栏内容（11个步骤），该导航栏的状态将由模块内部的逻辑控制。  
* **API集成**:  
  * 新模块将复用 src/shared/services/apiService.js 中定义的API通信服务。  
  * 所有数据上报将通过一个新的共享服务 src/shared/services/dataLogger.js 进行，以确保数据格式的绝对一致性。

### **2.3 兼容性需求 (Compatibility Requirements)**

* **API兼容性**: 必须保持与现有后端API的完全兼容。所有发送到 /stu/saveHcMark 的请求都必须是 FormData 格式。  
* **UI/UX一致性**: 新模块的所有UI元素必须遵循已确定的视觉风格指南，与现有模块在观感上保持一致。  
* **性能影响**: 新模块的加载和运行不应对现有模块的性能产生可感知的负面影响。我们将利用Next.js的代码分割（Code Splitting）能力，确保用户只加载他们需要的模块代码。

## **3.0 技术栈校准 (Tech Stack Alignment)**

### **3.1 现有技术栈 (Existing Technology Stack)**

新模块的开发将完全基于并集成于现有项目的技术栈中。所有开发工作都必须使用下表中定义的、已批准的技术和版本。

| 类别 | 当前技术 | 版本 | 在增强中的用途 | 备注 |
| :---- | :---- | :---- | :---- | :---- |
| **核心框架** | Next.js | (项目当前版本) | 构建所有新页面的基础框架。 | 必须遵循现有的页面和路由结构。 |
| **UI库** | React | (项目当前版本) | 用于构建所有新的UI组件。 | 必须使用函数式组件和Hooks。 |
| **语言** | TypeScript | (项目当前版本) | 编写所有新模块的逻辑和组件。 | 必须遵循现有的类型定义和接口。 |
| **状态管理** | React Context API | (项目当前版本) | 用于管理新模块内部的局部状态。 | 新模块将创建自己的Context Provider。 |
| **包管理器** | PNPM | (项目当前版本) | 管理所有新引入的依赖。 |  |
| **项目结构** | Turborepo Monorepo | (项目当前版本) | 新模块将作为monorepo中的一个新应用或包存在。 |  |

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

## **6.0 源代码树集成 (Source Tree Integration)**

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