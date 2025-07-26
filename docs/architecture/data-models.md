# **4.0 数据模型与状态管理 (Data Models and State Management) (核心修订版)**

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

