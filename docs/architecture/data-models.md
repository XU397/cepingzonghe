# **数据模型规范 (Data Models Specification)**

## **数据架构概述 (Data Architecture Overview)**

本文档定义了新模块必须严格遵守的数据结构，包括内部UI状态管理和后端通信的数据契约。

## **1. 内部UI状态模型 (Internal UI State Model)**

### **1.1 核心状态接口**

用于驱动UI交互的内部状态树：

```typescript
// 用于存储拖拽任务方案的结构  
interface Task {  
  id: number;              // 任务ID (1-5)  
  name: string;            // 任务名称  
  duration: number;        // 任务耗时（分钟）  
}

interface PlacedTask extends Task {  
  startTime: number;       // 任务在时间轴上的开始时间
  endTime: number;         // 任务在时间轴上的结束时间
}

interface TimeScheme {  
  tasks: PlacedTask[];     // 用户放置的任务列表  
  totalTime: number | null; // 用户手动输入的总用时  
}

// 四年级模块的完整内部状态树  
export interface Grade4State {  
  currentPage: number;
    
  // 题目 2: 问题识别  
  problemStatement: string;
    
  // 题目 3: 因素分析  
  relevantFactors: string[];
    
  // 题目 4: 路线计算  
  routeCalculations: {  
    route1_km: number | null;  
    route5_km: number | null;  
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
  preliminarySelection: string[];
    
  // 题目 10: 最终推荐与计价  
  finalPurchaseDecision: {  
    selectedTrain: 'D175' | 'C751' | null;  
    justification: string;  
    calculationFormula: string;  
    calculatedTotal: number | null;  
  };
}
```

### **1.2 状态管理实现**

```typescript
// src/modules/grade-4/context/Grade4Context.jsx
const Grade4Context = createContext();

export const Grade4Provider = ({ children }) => {
  const [state, setState] = useState(initialGrade4State);
  
  const updateState = (updates) => {
    setState(prev => ({ ...prev, ...updates }));
  };
  
  return (
    <Grade4Context.Provider value={{ state, updateState }}>
      {children}
    </Grade4Context.Provider>
  );
};

export const useGrade4Context = () => {
  const context = useContext(Grade4Context);
  if (!context) {
    throw new Error('useGrade4Context必须在Grade4Provider内使用');
  }
  return context;
};
```

## **2. 后端提交数据模型 (Backend Submission Data Model)**

### **2.1 核心数据接口**

**与后端通信的强制性契约**，所有提交到 `/stu/saveHcMark` 的数据必须遵循：

```typescript
// 单次用户交互的操作记录  
export interface Operation {  
  code: number;            // 序号，从1开始递增  
  targetElement: string;   // 交互的UI元素描述  
  eventType: string;       // 事件类型: "click", "input", "page_enter", etc.
  value?: string;          // 事件相关的值 (可选)  
  time: string;            // 操作时间戳 (格式: "YYYY-MM-DD HH:mm:ss")  
}

// 单个问题的最终答案  
export interface Answer {  
  code: number;            // 序号，从1开始递增  
  targetElement: string;   // 问题描述  
  value: any;              // 用户的答案，可以是字符串、数字、数组或对象  
}

// 截图信息结构  
export interface ImageInfo {  
  code: number;            // 序号, 从1开始  
  targetElement: string;   // 截图的目标UI元素描述  
  imgUrl: string;          // 截图上传后返回的URL  
}

// 封装单页所有作答数据的核心对象  
export interface MarkObject {  
  pageNumber: string;      // 页码 (必须是字符串)  
  pageDesc: string;        // 页面/题目描述  
  operationList: Operation[]; // 本页的所有操作记录  
  answerList: Answer[];    // 本页的所有最终答案  
  beginTime: string;       // 进入本页的时间戳  
  endTime: string;         // 离开本页的时间戳  
  imgList: ImageInfo[];    // 图像列表，用于存放方案截图  
}

// 最终通过FormData发送的完整载荷  
export interface SubmissionPayload {  
  batchCode: string;       // 测评批次号, e.g., "250619"  
  examNo: string;          // 学生考号, e.g., "10015"  
  mark: string;            // MarkObject对象的JSON字符串  
}
```

### **2.2 数据提交标准格式**

```javascript
// 标准的FormData提交格式
const formData = new FormData();
formData.append('batchCode', userContext.batchCode);  // String
formData.append('examNo', userContext.examNo);        // String  
formData.append('mark', JSON.stringify(markObject)); // JSON string

// POST /stu/saveHcMark
await apiService.submitPageMarkData(formData);
```

## **3. 数据转换逻辑 (Data Transformation Logic)**

### **3.1 状态到提交对象的转换**

每次页面切换时必须执行的转换函数：

```javascript
// src/modules/grade-4/utils/dataTransformers.js
export const transformStateToMarkObject = (
  grade4State, 
  pageNumber, 
  pageDesc, 
  operations, 
  answers,
  beginTime,
  endTime,
  images = []
) => {
  return {
    pageNumber: pageNumber.toString(),
    pageDesc: pageDesc,
    operationList: operations.map((op, index) => ({
      code: index + 1,
      targetElement: op.targetElement,
      eventType: op.eventType,
      value: op.value || '',
      time: formatTimestamp(op.timestamp)
    })),
    answerList: answers.map((answer, index) => ({
      code: index + 1,
      targetElement: answer.targetElement,
      value: answer.value
    })),
    beginTime: formatTimestamp(beginTime),
    endTime: formatTimestamp(endTime),
    imgList: images.map((img, index) => ({
      code: index + 1,
      targetElement: img.targetElement,
      imgUrl: img.url
    }))
  };
};

// 时间戳格式化函数
export const formatTimestamp = (date) => {
  const d = new Date(date);
  return d.getFullYear() + '-' + 
         String(d.getMonth() + 1).padStart(2, '0') + '-' + 
         String(d.getDate()).padStart(2, '0') + ' ' + 
         String(d.getHours()).padStart(2, '0') + ':' + 
         String(d.getMinutes()).padStart(2, '0') + ':' + 
         String(d.getSeconds()).padStart(2, '0');
};
```

### **3.2 特定题目的答案转换示例**

```javascript
// 题目4: 路线计算答案转换
const transformRouteCalculations = (routeCalculations) => {
  return [
    {
      targetElement: "路线1总长度",
      value: routeCalculations.route1_km
    },
    {
      targetElement: "路线5总长度", 
      value: routeCalculations.route5_km
    }
  ];
};

// 题目7: 时间方案答案转换
const transformTimeScheme = (scheme, schemeName) => {
  return [
    {
      targetElement: `${schemeName}任务安排`,
      value: scheme.tasks.map(task => ({
        id: task.id,
        name: task.name,
        startTime: task.startTime,
        endTime: task.endTime,
        duration: task.duration
      }))
    },
    {
      targetElement: `${schemeName}总用时`,
      value: scheme.totalTime
    }
  ];
};

// 题目10: 最终决策答案转换
const transformFinalDecision = (finalPurchaseDecision) => {
  return [
    {
      targetElement: "选择的车次",
      value: finalPurchaseDecision.selectedTrain
    },
    {
      targetElement: "选择理由",
      value: finalPurchaseDecision.justification
    },
    {
      targetElement: "计价公式",
      value: finalPurchaseDecision.calculationFormula
    },
    {
      targetElement: "计算总价",
      value: finalPurchaseDecision.calculatedTotal
    }
  ];
};
```

## **4. 数据验证规则 (Data Validation Rules)**

### **4.1 必需字段验证**

```javascript
// src/modules/grade-4/utils/dataValidators.js
export const validateMarkObject = (markObject) => {
  const errors = [];
  
  // 必需字段检查
  if (!markObject.pageNumber) errors.push('pageNumber is required');
  if (!markObject.pageDesc) errors.push('pageDesc is required');
  if (!markObject.beginTime) errors.push('beginTime is required');
  if (!markObject.endTime) errors.push('endTime is required');
  
  // 数组字段检查
  if (!Array.isArray(markObject.operationList)) {
    errors.push('operationList must be an array');
  }
  if (!Array.isArray(markObject.answerList)) {
    errors.push('answerList must be an array');
  }
  if (!Array.isArray(markObject.imgList)) {
    errors.push('imgList must be an array');
  }
  
  // 时间戳格式验证
  const timeRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/;
  if (!timeRegex.test(markObject.beginTime)) {
    errors.push('beginTime format invalid');
  }
  if (!timeRegex.test(markObject.endTime)) {
    errors.push('endTime format invalid');
  }
  
  return errors;
};

// 操作序号验证
export const validateOperationCodes = (operations) => {
  for (let i = 0; i < operations.length; i++) {
    if (operations[i].code !== i + 1) {
      return false;
    }
  }
  return true;
};
```

### **4.2 数据类型检查**

```javascript
export const validateDataTypes = (grade4State) => {
  const errors = [];
  
  // 检查当前页面是否为数字
  if (typeof grade4State.currentPage !== 'number') {
    errors.push('currentPage must be a number');
  }
  
  // 检查因素分析是否为数组
  if (!Array.isArray(grade4State.relevantFactors)) {
    errors.push('relevantFactors must be an array');
  }
  
  // 检查路线计算数据
  const route = grade4State.routeCalculations;
  if (route.route1_km !== null && typeof route.route1_km !== 'number') {
    errors.push('route1_km must be a number or null');
  }
  if (route.route5_km !== null && typeof route.route5_km !== 'number') {
    errors.push('route5_km must be a number or null');
  }
  
  return errors;
};
```

## **5. 实际使用示例 (Usage Examples)**

### **5.1 页面数据提交完整流程**

```javascript
// src/modules/grade-4/hooks/usePageSubmission.js
export const usePageSubmission = () => {
  const { state } = useGrade4Context();
  const { logOperation, submitPageMarkData } = useAppContext();
  
  const submitCurrentPage = async (pageNumber, pageDesc) => {
    try {
      // 1. 收集当前页面的操作记录
      const operations = getCollectedOperations();
      
      // 2. 根据页面类型转换答案
      const answers = extractAnswersForPage(state, pageNumber);
      
      // 3. 获取截图信息（如果需要）
      const images = await getPageScreenshots(pageNumber);
      
      // 4. 构造MarkObject
      const markObject = transformStateToMarkObject(
        state,
        pageNumber,
        pageDesc,
        operations,
        answers,
        pageEnterTime,
        new Date(),
        images
      );
      
      // 5. 验证数据
      const validationErrors = validateMarkObject(markObject);
      if (validationErrors.length > 0) {
        throw new Error(`Data validation failed: ${validationErrors.join(', ')}`);
      }
      
      // 6. 提交到后端
      await submitPageMarkData({
        batchCode: userContext.batchCode,
        examNo: userContext.examNo,
        mark: markObject
      });
      
    } catch (error) {
      console.error('页面提交失败:', error);
      throw error;
    }
  };
  
  return { submitCurrentPage };
};
```

### **5.2 Context Provider实现示例**

```javascript
// src/modules/grade-4/context/Grade4Context.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';

const initialState = {
  currentPage: 1,
  problemStatement: '',
  relevantFactors: [],
  routeCalculations: {
    route1_km: null,
    route5_km: null
  },
  stationChoice: {
    station: null,
    justification: ''
  },
  userSchedules: {
    scheme1: { tasks: [], totalTime: null },
    scheme2: { tasks: [], totalTime: null }
  },
  optimizationResponse: {
    isOptimal: null,
    improvedPlan: undefined
  },
  preliminarySelection: [],
  finalPurchaseDecision: {
    selectedTrain: null,
    justification: '',
    calculationFormula: '',
    calculatedTotal: null
  }
};

const Grade4Context = createContext();

export const Grade4Provider = ({ children }) => {
  const [state, setState] = useState(initialState);
  
  // 持久化状态到localStorage
  useEffect(() => {
    const savedState = localStorage.getItem('grade4State');
    if (savedState) {
      setState(JSON.parse(savedState));
    }
  }, []);
  
  useEffect(() => {
    localStorage.setItem('grade4State', JSON.stringify(state));
  }, [state]);
  
  const updateState = (updates) => {
    setState(prev => ({ ...prev, ...updates }));
  };
  
  const resetState = () => {
    setState(initialState);
    localStorage.removeItem('grade4State');
  };
  
  return (
    <Grade4Context.Provider value={{ 
      state, 
      updateState, 
      resetState 
    }}>
      {children}
    </Grade4Context.Provider>
  );
};

export const useGrade4Context = () => {
  const context = useContext(Grade4Context);
  if (!context) {
    throw new Error('useGrade4Context must be used within Grade4Provider');
  }
  return context;
};
```

## **6. 关键注意事项 (Critical Notes)**

### **6.1 数据类型要求**
- **pageNumber**: 必须是字符串类型
- **时间戳**: 必须使用 "YYYY-MM-DD HH:mm:ss" 格式
- **code字段**: 所有序号必须从1开始递增
- **FormData**: 后端只接受FormData格式，不接受JSON

### **6.2 特殊处理要求**
- **题目7-8**: 需要包含截图上传逻辑
- **操作记录**: 每个用户交互都必须记录
- **答案分离**: 区分操作记录(operationList)和最终答案(answerList)
- **状态恢复**: 支持页面刷新后的状态恢复

### **6.3 错误处理**
- 网络错误时的重试机制
- 会话过期时的重新认证
- 数据验证失败时的用户提示
- 本地状态的容错处理