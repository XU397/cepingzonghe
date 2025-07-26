# **2.0 增强范围与集成策略 (Enhancement Scope and Integration Strategy)**

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
