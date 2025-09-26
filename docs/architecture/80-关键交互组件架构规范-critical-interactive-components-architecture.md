# **8.0 关键交互组件架构规范 (Critical Interactive Components Architecture)**

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
