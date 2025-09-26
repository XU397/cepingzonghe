该文件为 Trae 项目规则在此代码库中进行代码操作时提供指导。

## **开发命令**

* **开发**: npm run dev \- 在 3000 端口启动 Vite 开发服务器  
* **构建**: npm run build \- 创建生产版本  
* **代码检查**: npm run lint \- 对 JS/JSX 文件运行 ESLint  
* **预览**: npm run preview \- 预览生产版本

## **架构概述**

这是一个基于 React 的教育评估应用，正在从一个单一模块的“馒头”科学探究任务，过渡到一个支持多种教育评估的多模块系统。该应用管理多页面的交互式学习体验，并包含数据记录、用户认证和问卷调查等组件。

### **多模块架构策略**

**混合架构**:

* **现有七年级模块** \- 按原样保留，使用包装器模式（wrapper pattern）来维持 379 个相对路径依赖  
* **新模块系统** \- 为四年级及未来的评估任务提供清晰的模块化结构  
* **共享组件层** \- 逐步将可复用组件提取到 src/shared/  
* **模块注册表** \- 基于 URL 的路由系统 (/seven-grade, /four-grade)

**目录结构**:

src/  
├── shared/                  \# 共享组件 (逐步迁移)  
│   ├── components/          \# 可复用的 UI 组件  
│   ├── services/            \# 共享的 API 服务  
│   ├── hooks/               \# 共享的钩子 (hooks)  
│   └── utils/               \# 共享的工具函数  
├── modules/                 \# 模块系统  
│   ├── ModuleRegistry.js    \# 模块注册中心  
│   ├── ModuleRouter.jsx     \# 模块路由组件  
│   ├── grade-7/             \# 七年级包装器 (现有代码)  
│   └── grade-4/             \# 四年级独立模块  
└── (existing structure)     \# 所有当前文件保持不变

### **核心架构模式**

**状态管理**:

* 通过 AppContext.jsx 和 React Context API 管理中央状态  
* 使用 localStorage 进行持久化状态管理，以实现会话恢复  
* 针对独立状态管理的模块特定上下文 (context)  
* 所有模块共享的认证上下文

**页面导航**:

* **七年级**: 现有的自定义路由通过 PageRouter.jsx 实现 (保持不变)  
* **新模块**: 在模块边界内使用独立的路由系统  
* 基于 URL 决定模块 (/seven-grade 路由到“馒头”模块)  
* 所有模块的受保护路由都需要认证  
* 通过登录响应的 url 字段实现服务器驱动的路由

**数据流**:

* 通过 logOperation() 函数记录用户交互  
* 在导航前通过 submitPageData() 提交页面数据  
* 通过 apiService.js 与后端 API 通信  
* 实时数据记录到 /stu/saveHcMark 端点  
* 模块特定的数据模式，共享日志记录基础设施

### **关键组件结构**

**全局状态** (src/context/AppContext.jsx):

* 认证状态和用户会话管理  
* 任务计时器 (40分钟) 和问卷计时器 (10分钟)  
* 带有自动数据提交功能的页面转换逻辑  
* 操作日志记录和答案收集系统

**API 层** (src/services/apiService.js):

* 登录端点: GET /stu/login，使用加密凭证  
* 数据提交: POST /stu/saveHcMark，使用 FormData  
* 通过 apiConfig.js 实现环境感知的 API 配置

**页面系统**:

* 页面遵循命名约定: Page\_XX\_Description  
* 每个页面自动记录进入/退出事件  
* 材料阅读页面 (P4-P9) 带有模态框组件  
* 模拟环境 (P14-P17) 带有交互式组件  
* 问卷页面 (P20-P28) 带有独立的计时系统

### **后端集成**

**认证**:

* 使用 jsencrypt.ts 进行 RSA 密码加密  
* 基于会话的认证，使用 localStorage 持久化  
* 页面刷新时自动恢复会话  
* 会话超时处理，带重新登录提示

**数据提交**:

* /saveHcMark 端点要求使用 FormData 格式  
* 导航前自动提交页面数据  
* 带有时间戳和事件类型的操作日志记录  
* 针对表单输入和选择的答案收集

### **配置**

**环境设置**:

* 开发环境: 使用 Vite 代理到 /stu 端点  
* 生产环境: 可配置的 API 模式 (direct/proxy/sameOrigin)  
* 通过 vite.config.js 代理配置处理 CORS  
* API 配置位于 src/config/apiConfig.js

### **开发说明**

**计时器系统**:

* 主任务计时器: 总时长 40 分钟  
* 问卷计时器: 独立的 10 分钟计时  
* 自动超时处理，强制进行页面转换  
* 跨浏览器会话的计时器持久化

**数据记录**:

* 所有用户交互都使用操作码进行记录  
* 防止重复操作的逻辑  
* 页面进入/退出事件自动记录  
* 实时提交到后端以实现数据持久化

**页面流逻辑**:

* 通过编号的页面进行线性进展  
* 基于完成状态的条件导航  
* 任务完成触发问卷阶段  
* 在 P28 中处理最终提交

## **多模块实施指南**

### **模块开发标准**

**模块接口契约**:

export const ModuleDefinition \= {  
  moduleId: string,             // 唯一标识符 (例如, 'grade-4')  
  displayName: string,          // 人类可读的名称  
  url: string,                  // URL 路径 (例如, '/four-grade')  
  version: string,              // 模块版本  
    
  ModuleComponent: React.Component, // 主模块组件  
  getInitialPage: (pageNum) \=\> string, // 页面恢复逻辑  
  moduleConfig: {  
    timers: { mainTask: number, questionnaire?: number },  
    pages: { \[pageId\]: { number, desc, component } }  
  }  
}

**七年级模块 (包装器模式)**:

* 所有现有代码保持不变 (维持 379 个路径依赖)  
* 使用现有的 PageRouter 包装在 src/modules/grade-7/wrapper.js 中  
* 对现有代码库不进行文件移动、导入或结构更改  
* URL 路由: /seven-grade 映射到现有的“馒头”评估

**新模块结构 (四年级及以上)**:

* 独立的模块目录: src/modules/grade-4/  
* 清晰的目录结构，包含 components/, context/, utils/, assets/  
* 可以使用 src/shared/ 层的共享组件  
* 模块特定的配置和页面映射

### **安全实施策略**

**分阶段方法**:

1. **阶段一**: 添加模块基础设施 (不更改现有文件)  
2. **阶段二**: 增强认证以支持 URL 路由 (最小化更改)  
3. **阶段三**: 实现模块路由器和加载系统  
4. **阶段四**: 全面测试和验证  
5. **阶段五**: 使用功能标志进行生产部署

**风险缓解**:

* 功能标志允许即时禁用模块系统  
* 如果模块失败，有回退机制到现有的 PageRouter  
* 对当前功能零破坏性更改  
* 在任何实施阶段都具备轻松回滚的能力

### **共享组件迁移**

**逐步提取策略**:

* 随着时间的推移，将通用组件提取到 src/shared/components/  
* 像 Timer、Button、Modal 这样的组件可以在模块间共享  
* 新模块使用共享组件；现有的七年级模块可以有选择地采用  
* 不要求修改现有的七年级导入

**共享服务**:

* src/shared/services/authService.js 中的认证服务  
* 用于跨模块一致日志记录的数据记录服务  
* 用于通用后端通信模式的 API 服务层

### **模块注册表系统**

**基于 URL 的路由**:

// ModuleRegistry.js 将 URL 映射到模块  
const urlToModuleMap \= {  
  '/seven-grade': 'steamed-bun',     // 现有七年级  
  '/four-grade': 'grade-4',          // 新的四年级  
  // 未来的模块...  
}

**认证集成**:

* 服务器登录响应包含 url 字段 (例如, "/seven-grade")  
* ModuleRouter 使用 URL 来确定加载哪个模块  
* 保留现有的认证流程，并为模块路由进行增强

### **开发工作流**

**七年级维护**:

* 继续在现有的文件结构中开发  
* 所有当前的开发实践保持不变  
* 无需理解或与模块系统交互

**新模块开发**:

* 在清晰的 src/modules/grade-X/ 结构中创建  
* 在有益的情况下使用共享组件和服务  
* 独立开发，不影响现有代码  
* 模块特定的测试和配置

### **生产部署**

**功能标志控制**:

* 使用环境变量来启用/禁用模块系统  
* 生产环境可以在有或没有模块路由的情况下运行  
* 现有用户继续评估，不受干扰  
* 新用户可以被路由到相应的模块

**向后兼容性**:

* 所有现有的 API 端点保持相同的接口  
* 构建过程和部署程序不变  
* 保留环境配置

## **数据传输规范**

### **后端 API 通信标准**

所有模块必须遵循既定的数据传输模式，以确保一致性和后端兼容性。

**主要端点**: POST /stu/saveHcMark

**数据格式**: FormData (不是 JSON)

const formData \= new FormData();  
formData.append('batchCode', userContext.batchCode); // 字符串: 来自登录响应  
formData.append('examNo', userContext.examNo);       // 字符串: 学生标识符  
formData.append('mark', JSON.stringify(markObject)); // JSON 字符串: 页面数据

### **Mark 对象结构 (关键规范)**

每个页面提交都必须包含这个确切的结构：

const markObject \= {  
  pageNumber: "15",                     // 字符串: 用于后端的页面序列号  
  pageDesc: "第九题",                   // 字符串: 人类可读的页面描述  
  operationList: \[                      // 数组: 完整的用户交互日志  
    {  
      code: 1,                          // 数字: 顺序操作计数器  
      targetElement: "页面",            // 字符串: UI 元素描述  
      eventType: "page\_enter",          // 字符串: 交互类型  
      value: "进入页面Page\_15",         // 字符串: 事件详情/上下文  
      time: "2024-07-24 15:30:45"       // 字符串: 时间戳 (YYYY-MM-DD HH:mm:ss)  
    },  
    {  
      code: 2,  
      targetElement: "P15\_Q1\_选项组",  
      eventType: "radio\_select",  
      value: "35°C",  
      time: "2024-07-24 15:31:22"  
    }  
  \],  
  answerList: \[                         // 数组: 用于数据分析的最终答案  
    {  
      code: 1,                          // 数字: 顺序答案计数器  
      targetElement: "发酵3小时后体积最大的温度", // 字符串: 问题标识符  
      value: "35°C"                     // 字符串/任意类型: 学生的答案  
    }  
  \],  
  beginTime: "2024-07-24 15:30:45",   // 字符串: 页面进入时间戳  
  endTime: "2024-07-24 15:32:10",     // 字符串: 页面退出时间戳  
  imgList: \[\]                           // 数组: 图片附件 (通常为空)  
}

### **数据收集函数 (必须实现)**

**操作日志记录** \- 跟踪所有用户交互:

logOperation({  
  targetElement: string,    // UI 元素或组件名称  
  eventType: string,        // 交互类型 (click, input, page\_enter 等)  
  value?: string,           // 可选: 交互值或上下文  
  elementId?: string        // 可选: DOM 元素 ID  
});

// 常见的事件类型:  
// \- "page\_enter", "page\_exit" (自动)  
// \- "click", "input", "change" (用户交互)  
// \- "radio\_select", "checkbox\_select" (表单输入)  
// \- "modal\_open", "modal\_close" (UI 状态变化)  
// \- 自定义的模块特定事件类型

**答案收集** \- 记录最终答案:

collectAnswer({  
  targetElement: string,    // 问题或输入的标识符  
  value: any,               // 学生的答案 (字符串, 数字, 数组等)  
  code?: number             // 可选: 顺序计数器 (自动生成)  
});

### **数据提交时机要求**

**强制提交点**:

1. **页面导航** \- 切换到任何新页面之前  
2. **模块完成** \- 当学生完成评估时  
3. **会话超时** \- 计时器到期时自动提交  
4. **关键交互** \- 主要任务完成或提交时

**实现模式**:

// 1\. 页面进入 (自动)  
setPageEnterTime(new Date());  
logOperation({  
  targetElement: '页面',  
  eventType: 'page\_enter',  
  value: \`进入页面${pageId}\`  
});

// 2\. 用户交互 (发生时)  
onUserAction \= (action) \=\> {  
  logOperation({  
    targetElement: action.element,  
    eventType: action.type,  
    value: action.value  
  });  
    
  // 如果这是一个答案，也收集它  
  if (action.isAnswer) {  
    collectAnswer({  
      targetElement: action.questionId,  
      value: action.value  
    });  
  }  
};

// 3\. 页面退出 (导航前)  
const submitCurrentPageData \= async () \=\> {  
  const markData \= {  
    pageNumber: getCurrentPageNumber(),  
    pageDesc: getCurrentPageDescription(),  
    operationList: getCollectedOperations(),  
    answerList: getCollectedAnswers(),  
    beginTime: formatTimestamp(pageEnterTime),  
    endTime: formatTimestamp(new Date()),  
    imgList: \[\]  
  };  
    
  await submitPageMarkData({  
    batchCode: userContext.batchCode,  
    examNo: userContext.examNo,  
    mark: markData  
  });  
};

### **错误处理要求**

**会话管理**:

* 处理 401 响应 (会话过期)  
* 自动重新认证并保留数据  
* 对网络故障进行优雅降级

**数据验证**:

* 提交前确保所有必填字段都存在  
* 验证时间戳格式 (YYYY-MM-DD HH:mm:ss)  
* 优雅地处理缺失或格式错误的数据

**网络错误恢复**:

try {  
  await submitPageMarkData(payload);  
} catch (error) {  
  if (error.status \=== 401\) {  
    // 会话过期 \- 重定向到重新认证  
    handleSessionExpiration();  
  } else {  
    // 其他错误 \- 使用指数退避策略重试  
    scheduleRetrySubmission(payload);  
  }  
}

### **模块特定适配**

**七年级 (现有)**:

* 使用当前实现，不做更改  
* 保留所有现有的操作类型和答案格式

**新模块**:

* 必须实现相同的数据结构  
* 可以定义模块特定的 eventType 值  
* 应调整 targetElement 命名以匹配模块内容  
* 计时器配置可能不同 (例如, 四年级 35 分钟 vs 七年级 40 分钟)

**共享实现**:

* 通用的日志记录函数应移至 src/shared/services/dataLogger.js  
* 时间戳格式化工具函数在 src/shared/utils/timeUtils.js  
* API 服务函数在 src/shared/services/apiService.js

### **关键合规说明**

1. **FormData 格式** \- 后端期望 FormData，而不是 JSON 请求  
2. **字符串类型** \- pageNumber、时间戳和大多数字段必须是字符串  
3. **顺序代码** \- 操作和答案代码必须顺序递增  
4. **时间戳格式** \- 必须始终使用 "YYYY-MM-DD HH:mm:ss" 格式  
5. **必填字段** \- batchCode, examNo, 和完整的 mark 对象是强制性的  
6. **操作日志记录** \- 应为研究目的记录每一次用户交互  
7. **答案分离** \- 区分交互 (operationList) 和最终答案 (answerList)