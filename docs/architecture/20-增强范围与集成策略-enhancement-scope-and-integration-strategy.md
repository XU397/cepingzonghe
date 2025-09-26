# **2.0 增强范围与集成策略 (Enhancement Scope and Integration Strategy)**

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
