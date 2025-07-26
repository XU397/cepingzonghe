# **4.0 技术约束与集成需求 (Technical Constraints and Integration Requirements)**

本部分定义了在实现上述功能时必须遵守的技术边界和集成方法，这些内容直接来源于已确定的架构方案。

### **4.1 现有技术栈 (Existing Technology Stack)**

* **核心框架**: React, Vite  
* **语言**: TypeScript  
* **包管理器**: PNPM  
* **项目结构**: Turborepo Monorepo  
* **关键依赖**: jsencrypt (用于密码加密)

**约束**: 所有新开发的代码都必须与此技术栈兼容。**禁止**为新模块引入与此技术栈冲突或功能重复的核心库。

### **4.2 集成方法 (Integration Approach)**

* **数据库集成**: 无直接的数据库集成。所有数据通过既有的后端API进行交互。  
* **API集成**: 必须复用 src/services/apiService.js 中定义的现有API通信模式。所有数据提交严格遵循 POST /stu/saveHcMark 的 FormData 格式。  
* **前端集成**: 采用**混合架构**。新的顶层路由 ModuleRouter.jsx 将根据登录后API返回的 url 字段，动态加载相应的模块（七年级“蒸馒头”或四年级“火车购票”）。  
* **测试集成**: 新模块的单元测试和端到端测试，必须在现有的测试框架和流程下进行，确保新增测试不会破坏原有的测试套件。

### **4.3 代码组织与标准 (Code Organization and Standards)**

* **文件结构**: 所有新模块的代码**必须**存放在 src/modules/grade-4/ 目录下。所有可能被复用的代码（如服务、Hooks）**必须**存放在 src/shared/ 目录下。  
* **编码标准**: **严禁**修改 src/modules 和 src/shared 目录之外的任何现有文件。  
* **命名约定**: 新文件和组件的命名需遵循架构文档中定义的 PascalCase 和 camelCase 规范。

### **4.4 风险评估与缓解 (Risk Assessment and Mitigation)**

* **技术风险**: 最大的技术风险是新模块的引入可能会意外地影响到现有“蒸馒头”模块的稳定性。  
* **缓解策略**:  
  1. **代码隔离**: 通过严格遵守文件组织规范，确保新旧代码在物理上分离。  
  2. **包装器模式**: 将现有模块完整封装，作为一个“黑盒”来对待，不触及任何内部实现。  
  3. **功能开关 (Feature Flag)**: 建议在部署初期，通过一个环境变量来控制新模块路由系统的启用/禁用，以便在出现问题时可以快速回滚到原有单模块状态。
