# **组件蓝图规范 (Component Blueprint Specification)**

## **组件设计理念 (Component Design Philosophy)**

### **核心原则**
- **组件驱动开发**: 将复杂UI拆分成小型、独立、可复用的组件
- **单一职责**: 每个组件有明确、独立的功能边界
- **状态分离**: 明确区分容器组件(智能)和展示组件(哑)
- **一致性优先**: 严格遵循现有项目的组件模式和视觉风格

### **组件分类体系**
```
src/modules/grade-4/components/
├── containers/     # 容器组件 - 负责逻辑和状态管理
├── ui/            # UI组件 - 纯展示，无业务逻辑
└── layout/        # 布局组件 - 页面结构和样式框架
```

## **1. 页面级组件 (Page Components)**

### **1.1 页面组件标准模板**

```jsx
// src/modules/grade-4/pages/[PageName].jsx
import React, { useEffect, useState } from 'react';
import { useGrade4Context } from '../context/Grade4Context';
import { useAppContext } from '../../../context/AppContext';
import AssessmentPageLayout from '../components/layout/AssessmentPageLayout';

const PageTemplate = () => {
  const { state, updateState } = useGrade4Context();
  const { logOperation, collectAnswer } = useAppContext();
  const [pageEnterTime] = useState(new Date());

  useEffect(() => {
    // 页面进入日志
    logOperation({
      targetElement: '页面',
      eventType: 'page_enter',
      value: `进入页面${state.currentPage}`
    });
  }, []);

  const handleNext = () => {
    // 收集答案和提交数据
    collectAnswer({
      targetElement: '问题标识',
      value: '用户答案'
    });
    
    // 页面切换
    updateState({ currentPage: state.currentPage + 1 });
  };

  return (
    <AssessmentPageLayout 
      title="页面标题"
      currentStep={state.currentPage}
      onNext={handleNext}
    >
      {/* 页面具体内容 */}
    </AssessmentPageLayout>
  );
};

export default PageTemplate;
```

### **1.2 具体页面组件定义**

```jsx
// 页面组件清单
const pageComponents = [
  {
    name: 'OnboardingPage',
    file: 'src/modules/grade-4/pages/OnboardingPage.jsx',
    purpose: '注意事项页面，包含40秒计时器逻辑',
    pdfRef: 'PDF第2页'
  },
  {
    name: 'ScenarioPage', 
    file: 'src/modules/grade-4/pages/ScenarioPage.jsx',
    purpose: '复合页面：情景介绍、问题识别、因素分析',
    pdfRef: 'PDF第3-5页'
  },
  {
    name: 'RouteAnalysisPage',
    file: 'src/modules/grade-4/pages/RouteAnalysisPage.jsx', 
    purpose: '出发站分析，组合InteractiveMap和RouteCalculator',
    pdfRef: 'PDF第6-12页'
  },
  {
    name: 'TimePlanningPage',
    file: 'src/modules/grade-4/pages/TimePlanningPage.jsx',
    purpose: '时间规划，组合TimePlannerTutorial和TimePlanner',
    pdfRef: 'PDF第13-16页'
  },
  {
    name: 'TicketPurchasePage',
    file: 'src/modules/grade-4/pages/TicketPurchasePage.jsx',
    purpose: '车票购买，组合TicketSelector和FinalCalculator',
    pdfRef: 'PDF第17-18页'
  },
  {
    name: 'CompletionPage',
    file: 'src/modules/grade-4/pages/CompletionPage.jsx',
    purpose: '测评完成页面',
    pdfRef: 'PDF第19页'
  }
];
```

## **2. 容器组件 (Container Components)**

### **2.1 交互式地图组件**

```jsx
// src/modules/grade-4/components/containers/InteractiveMap.jsx
import React, { useState, useEffect } from 'react';
import { useGrade4Context } from '../../context/Grade4Context';
import { useAppContext } from '../../../../context/AppContext';

const InteractiveMap = () => {
  const { state, updateState } = useGrade4Context();
  const { logOperation } = useAppContext();
  const [selectedRoute, setSelectedRoute] = useState(null);
  
  const routeImages = {
    'route1': '/assets/grade-4/route1-detail.png',
    'route2': '/assets/grade-4/route2-detail.png',
    'route5': '/assets/grade-4/route5-detail.png'
  };

  const handleRouteSelect = (routeId) => {
    setSelectedRoute(routeId);
    
    // 记录操作
    logOperation({
      targetElement: '路线选择按钮',
      eventType: 'click',
      value: `选择路线${routeId}`
    });
    
    // 更新地图显示状态
    updateState({
      selectedRoute: routeId,
      showRouteDetails: true
    });
  };

  const handleDistanceInput = (routeId, distance) => {
    logOperation({
      targetElement: `${routeId}距离输入`,
      eventType: 'input',
      value: distance.toString()
    });
    
    updateState({
      routeCalculations: {
        ...state.routeCalculations,
        [`${routeId}_km`]: distance
      }
    });
  };

  return (
    <div className="interactive-map">
      <div className="map-controls">
        {Object.keys(routeImages).map(routeId => (
          <button
            key={routeId}
            className={`btn route-btn ${selectedRoute === routeId ? 'active' : ''}`}
            onClick={() => handleRouteSelect(routeId)}
          >
            查看{routeId}
          </button>
        ))}
      </div>
      
      {selectedRoute && (
        <div className="map-display">
          <img 
            src={routeImages[selectedRoute]} 
            alt={`${selectedRoute}路线图`}
            className="route-image"
          />
          <div className="distance-input">
            <label>请输入{selectedRoute}的总距离(km)：</label>
            <input
              type="number"
              className="form-control"
              onChange={(e) => handleDistanceInput(selectedRoute, e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default InteractiveMap;
```

### **2.2 时间规划器组件**

```jsx
// src/modules/grade-4/components/containers/TimePlanner.jsx
import React, { useState, useCallback } from 'react';
import { useGrade4Context } from '../../context/Grade4Context';
import { useAppContext } from '../../../../context/AppContext';
import DraggableTask from '../ui/DraggableTask';
import DropZone from '../ui/DropZone';
import { CriticalPathCalculator } from '../../utils/criticalPathCalculator';

const TimePlanner = ({ mode = 'design', onComplete }) => {
  const { state, updateState } = useGrade4Context();
  const { logOperation } = useAppContext();
  const [taskArrangement, setTaskArrangement] = useState([]);
  const [userInputTime, setUserInputTime] = useState(null);

  const tasks = [
    { id: 1, name: '购买车票', duration: 15 },
    { id: 2, name: '安检进站', duration: 20 },
    { id: 3, name: '等车', duration: 30 },
    { id: 4, name: '上车找座位', duration: 10 },
    { id: 5, name: '整理行李', duration: 5 }
  ];

  const handleTaskDrop = useCallback((taskId, position) => {
    const task = tasks.find(t => t.id === parseInt(taskId));
    const newPlacedTask = {
      ...task,
      startTime: position.startTime,
      endTime: position.startTime + task.duration
    };

    const newArrangement = [...taskArrangement, newPlacedTask];
    setTaskArrangement(newArrangement);

    // 记录拖拽操作
    logOperation({
      targetElement: '任务块',
      eventType: 'drag_drop',
      value: `将${task.name}放置在${position.startTime}分钟位置`
    });

    // 更新状态
    const schemeKey = mode === 'improvement' ? 'improvedPlan' : 'scheme1';
    updateState({
      userSchedules: {
        ...state.userSchedules,
        [schemeKey]: {
          tasks: newArrangement,
          totalTime: userInputTime
        }
      }
    });
  }, [taskArrangement, userInputTime, mode, state.userSchedules, updateState, logOperation]);

  const handleTimeInput = (time) => {
    setUserInputTime(time);
    
    logOperation({
      targetElement: '总用时输入框',
      eventType: 'input',
      value: time.toString()
    });
  };

  const calculateCriticalPath = () => {
    const calculator = new CriticalPathCalculator();
    return calculator.calculateCriticalPath(taskArrangement);
  };

  return (
    <div className="time-planner">
      <div className="task-library">
        <h4>可用任务</h4>
        {tasks.map(task => (
          <DraggableTask 
            key={task.id}
            task={task}
            onDragStart={() => logOperation({
              targetElement: '任务块',
              eventType: 'drag_start', 
              value: task.name
            })}
          />
        ))}
      </div>
      
      <div className="timeline-area">
        <h4>时间轴规划</h4>
        <DropZone onDrop={handleTaskDrop}>
          <div className="timeline">
            {/* 时间轴刻度 */}
            {Array.from({length: 12}, (_, i) => (
              <div key={i} className="time-mark">
                {i * 10}分
              </div>
            ))}
            
            {/* 已放置的任务 */}
            {taskArrangement.map((task, index) => (
              <div 
                key={index}
                className="placed-task"
                style={{
                  left: `${(task.startTime / 120) * 100}%`,
                  width: `${(task.duration / 120) * 100}%`
                }}
              >
                {task.name}
              </div>
            ))}
          </div>
        </DropZone>
      </div>
      
      <div className="time-input-section">
        <label>请输入您认为的总用时（分钟）：</label>
        <input
          type="number"
          className="form-control"
          onChange={(e) => handleTimeInput(parseInt(e.target.value))}
        />
        <small className="form-text">
          注意：请根据关键路径分析，而非简单累加
        </small>
      </div>
    </div>
  );
};

export default TimePlanner;
```

### **2.3 最终计算器组件**

```jsx
// src/modules/grade-4/components/containers/FinalCalculator.jsx
import React, { useState, useEffect } from 'react';
import { useGrade4Context } from '../../context/Grade4Context';
import { useAppContext } from '../../../../context/AppContext';
import OnScreenKeyboard from '../ui/OnScreenKeyboard';

const FinalCalculator = () => {
  const { state, updateState } = useGrade4Context();
  const { logOperation, collectAnswer } = useAppContext();
  const [selectedTrain, setSelectedTrain] = useState(null);
  const [formula, setFormula] = useState('');
  const [calculatedTotal, setCalculatedTotal] = useState(null);
  const [currentField, setCurrentField] = useState('formula');

  const trainOptions = [
    { id: 'D175', price: 89, type: '动车' },
    { id: 'C751', price: 76, type: '城际' }
  ];

  const handleTrainSelect = (trainId) => {
    setSelectedTrain(trainId);
    
    logOperation({
      targetElement: '车次选择',
      eventType: 'radio_select',
      value: trainId
    });
    
    updateState({
      finalPurchaseDecision: {
        ...state.finalPurchaseDecision,
        selectedTrain: trainId
      }
    });
  };

  const handleKeyboardInput = (value, targetField) => {
    if (targetField === 'formula') {
      setFormula(prev => prev + value);
      
      logOperation({
        targetElement: '计算公式输入',
        eventType: 'keyboard_input',
        value: value
      });
    }
  };

  const handleFormulaCalculate = () => {
    try {
      // 安全的公式计算 (实际项目中需要更安全的实现)
      const result = eval(formula.replace(/×/g, '*').replace(/÷/g, '/'));
      setCalculatedTotal(result);
      
      logOperation({
        targetElement: '计算按钮',
        eventType: 'click',
        value: `计算公式: ${formula} = ${result}`
      });
      
      // 收集最终答案
      collectAnswer({
        targetElement: '计价公式',
        value: formula
      });
      
      collectAnswer({
        targetElement: '计算总价',
        value: result
      });
      
    } catch (error) {
      console.error('公式计算错误:', error);
    }
  };

  return (
    <div className="final-calculator">
      <div className="train-selection">
        <h4>选择车次</h4>
        {trainOptions.map(train => (
          <label key={train.id} className="radio-option">
            <input
              type="radio"
              name="trainChoice"
              value={train.id}
              onChange={() => handleTrainSelect(train.id)}
            />
            {train.id} ({train.type}) - ¥{train.price}
          </label>
        ))}
      </div>
      
      <div className="calculation-area">
        <div className="formula-display">
          <h4>计算公式</h4>
          <div 
            className="formula-input"
            onClick={() => setCurrentField('formula')}
          >
            {formula || '点击输入计算公式...'}
          </div>
        </div>
        
        <div className="total-display">
          <h4>计算结果</h4>
          <div className="total-value">
            {calculatedTotal !== null ? `¥${calculatedTotal}` : '等待计算...'}
          </div>
        </div>
      </div>
      
      <div className="keyboard-section">
        <OnScreenKeyboard 
          onInput={handleKeyboardInput}
          targetField={currentField}
          onCalculate={handleFormulaCalculate}
        />
      </div>
      
      <div className="justification-input">
        <label>请说明您的选择理由：</label>
        <textarea
          className="form-control"
          placeholder="在这里输入您的选择理由..."
          onChange={(e) => {
            logOperation({
              targetElement: '选择理由输入',
              eventType: 'textarea_input',
              value: e.target.value
            });
            
            updateState({
              finalPurchaseDecision: {
                ...state.finalPurchaseDecision,
                justification: e.target.value
              }
            });
          }}
        />
      </div>
    </div>
  );
};

export default FinalCalculator;
```

## **3. UI组件 (UI Components)**

### **3.1 拖拽任务块组件**

```jsx
// src/modules/grade-4/components/ui/DraggableTask.jsx
import React from 'react';

const DraggableTask = ({ task, onDragStart }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('task-id', task.id.toString());
    e.dataTransfer.setData('task-data', JSON.stringify(task));
    onDragStart(task);
  };

  return (
    <div 
      className="draggable-task"
      draggable
      onDragStart={handleDragStart}
    >
      <div className="task-content">
        <div className="task-label">{task.name}</div>
        <div className="task-duration">{task.duration}分钟</div>
      </div>
    </div>
  );
};

export default DraggableTask;
```

### **3.2 拖拽放置区组件**

```jsx
// src/modules/grade-4/components/ui/DropZone.jsx
import React, { useState } from 'react';

const DropZone = ({ onDrop, children }) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const taskId = e.dataTransfer.getData('task-id');
    const taskData = JSON.parse(e.dataTransfer.getData('task-data'));
    
    // 计算放置位置
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const timelineWidth = rect.width;
    const startTime = Math.round((x / timelineWidth) * 120); // 120分钟总时长
    
    onDrop(taskId, { 
      startTime: Math.max(0, startTime),
      taskData: taskData
    });
  };

  return (
    <div 
      className={`drop-zone ${isDragOver ? 'drag-over' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {children}
    </div>
  );
};

export default DropZone;
```

### **3.3 屏幕键盘组件**

```jsx
// src/modules/grade-4/components/ui/OnScreenKeyboard.jsx
import React from 'react';

const OnScreenKeyboard = ({ onInput, targetField, onCalculate }) => {
  const keyboardLayout = [
    ['7', '8', '9', '÷'],
    ['4', '5', '6', '×'],  
    ['1', '2', '3', '-'],
    ['0', '.', '=', '+']
  ];
  
  const specialKeys = [
    { label: '清空', action: 'clear' },
    { label: '换行', action: 'newline' },
    { label: '删除', action: 'backspace' }
  ];

  const handleKeyPress = (key) => {
    switch(key) {
      case '=':
        onCalculate();
        break;
      case 'clear':
        onInput('', targetField, 'clear');
        break;
      case 'newline':
        onInput('\n', targetField);
        break;
      case 'backspace':
        onInput('', targetField, 'backspace');
        break;
      default:
        onInput(key, targetField);
    }
  };

  return (
    <div className="on-screen-keyboard">
      <div className="number-pad">
        {keyboardLayout.map((row, rowIndex) => (
          <div key={rowIndex} className="keyboard-row">
            {row.map(key => (
              <button
                key={key}
                className={`keyboard-key ${key === '=' ? 'equals-key' : ''}`}
                onClick={() => handleKeyPress(key)}
              >
                {key}
              </button>
            ))}
          </div>
        ))}
      </div>
      
      <div className="special-keys">
        {specialKeys.map(special => (
          <button
            key={special.action}
            className="keyboard-key special-key"
            onClick={() => handleKeyPress(special.action)}
          >
            {special.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default OnScreenKeyboard;
```

## **4. 布局组件 (Layout Components)**

### **4.1 评估页面布局组件**

```jsx
// src/modules/grade-4/components/layout/AssessmentPageLayout.jsx
import React from 'react';
import { useGrade4Context } from '../../context/Grade4Context';

const AssessmentPageLayout = ({ 
  title, 
  currentStep, 
  onNext, 
  onPrevious,
  canProceed = true,
  children 
}) => {
  const { state } = useGrade4Context();
  
  return (
    <div className="page-content">
      <div className="page-header">
        <div className="page-title">{title}</div>
        <div className="page-progress">
          第 {currentStep} 题 / 共 11 题
        </div>
      </div>
      
      <div className="page-body cartoon-box">
        {children}
      </div>
      
      <div className="page-navigation">
        {onPrevious && currentStep > 1 && (
          <button 
            className="btn btn-secondary"
            onClick={onPrevious}
          >
            上一题
          </button>
        )}
        
        {onNext && (
          <button 
            className={`btn btn-primary ${!canProceed ? 'disabled' : ''}`}
            onClick={onNext}
            disabled={!canProceed}
          >
            {currentStep === 11 ? '完成测评' : '下一题'}
          </button>
        )}
      </div>
    </div>
  );
};

export default AssessmentPageLayout;
```

## **5. 工具函数组件 (Utility Components)**

### **5.1 关键路径计算器**

```javascript
// src/modules/grade-4/utils/criticalPathCalculator.js
export class CriticalPathCalculator {
  /**
   * 计算任务安排的关键路径总时长
   * @param {Array} tasks - 已放置的任务数组
   * @returns {number} 关键路径总时长（分钟）
   */
  calculateCriticalPath(tasks) {
    if (!tasks || tasks.length === 0) return 0;
    
    // 按开始时间排序
    const sortedTasks = [...tasks].sort((a, b) => a.startTime - b.startTime);
    
    // 构建依赖图
    const dependencyGraph = this.buildDependencyGraph(sortedTasks);
    
    // 计算关键路径
    return this.findLongestPath(dependencyGraph);
  }
  
  /**
   * 构建任务依赖关系图
   * @param {Array} tasks - 排序后的任务数组
   * @returns {Object} 依赖关系图
   */
  buildDependencyGraph(tasks) {
    const graph = {};
    
    tasks.forEach(task => {
      graph[task.id] = {
        ...task,
        dependencies: [],
        dependents: []
      };
    });
    
    // 分析时间重叠关系
    for (let i = 0; i < tasks.length; i++) {
      for (let j = i + 1; j < tasks.length; j++) {
        const task1 = tasks[i];
        const task2 = tasks[j];
        
        // 如果task2的开始时间在task1结束后，则task2依赖task1
        if (task2.startTime >= task1.endTime) {
          graph[task2.id].dependencies.push(task1.id);
          graph[task1.id].dependents.push(task2.id);
        }
      }
    }
    
    return graph;
  }
  
  /**
   * 找到最长路径（关键路径）
   * @param {Object} graph - 依赖关系图
   * @returns {number} 最长路径时长
   */
  findLongestPath(graph) {
    const memo = {};
    
    const calculatePath = (taskId, visited = new Set()) => {
      if (visited.has(taskId)) return 0; // 避免循环依赖
      if (memo[taskId] !== undefined) return memo[taskId];
      
      visited.add(taskId);
      const task = graph[taskId];
      
      let maxDependentPath = 0;
      task.dependents.forEach(dependentId => {
        const dependentPath = calculatePath(dependentId, new Set(visited));
        maxDependentPath = Math.max(maxDependentPath, dependentPath);
      });
      
      memo[taskId] = task.duration + maxDependentPath;
      return memo[taskId];
    };
    
    // 找到所有起始节点（无依赖的节点）
    const startNodes = Object.values(graph).filter(task => 
      task.dependencies.length === 0
    );
    
    let maxPath = 0;
    startNodes.forEach(startTask => {
      const pathLength = calculatePath(startTask.id);
      maxPath = Math.max(maxPath, pathLength);
    });
    
    return maxPath;
  }
}
```

## **6. 组件测试规范 (Component Testing Guidelines)**

### **6.1 单元测试模板**

```javascript
// src/modules/grade-4/components/__tests__/TimePlanner.test.jsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Grade4Provider } from '../../context/Grade4Context';
import TimePlanner from '../containers/TimePlanner';

const renderWithProvider = (component) => {
  return render(
    <Grade4Provider>
      {component}
    </Grade4Provider>
  );
};

describe('TimePlanner Component', () => {
  test('renders task library correctly', () => {
    renderWithProvider(<TimePlanner />);
    
    expect(screen.getByText('购买车票')).toBeInTheDocument();
    expect(screen.getByText('安检进站')).toBeInTheDocument();
  });
  
  test('handles task drag and drop', () => {
    renderWithProvider(<TimePlanner />);
    
    const taskElement = screen.getByText('购买车票');
    const dropZone = screen.getByTestId('timeline-drop-zone');
    
    fireEvent.dragStart(taskElement);
    fireEvent.drop(dropZone);
    
    // 验证任务被正确放置
    expect(screen.getByTestId('placed-task-1')).toBeInTheDocument();
  });
});
```

### **6.2 集成测试要求**

```javascript
// src/modules/grade-4/__tests__/integration/PageFlow.test.jsx
describe('Page Flow Integration', () => {
  test('complete assessment flow', async () => {
    // 测试完整的评估流程
    // 1. 页面导航
    // 2. 数据收集
    // 3. 状态持久化
    // 4. 最终提交
  });
});
```

## **7. 样式约定 (Styling Conventions)**

### **7.1 组件样式结构**

```scss
// src/modules/grade-4/styles/components/TimePlanner.module.scss
.time-planner {
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  .task-library {
    background: var(--cartoon-light);
    border-radius: 12px;
    padding: 16px;
    
    .draggable-task {
      background: var(--cartoon-primary);
      color: white;
      border-radius: 8px;
      padding: 8px 12px;
      margin: 4px 0;
      cursor: grab;
      
      &:active {
        cursor: grabbing;
      }
    }
  }
  
  .timeline-area {
    background: white;
    border: 2px solid var(--cartoon-border);
    border-radius: 12px;
    padding: 20px;
    
    .timeline {
      position: relative;
      height: 100px;
      background: linear-gradient(
        to right,
        transparent 0%,
        transparent 10%,
        var(--cartoon-border) 10%,
        var(--cartoon-border) 10.5%,
        transparent 10.5%
      );
    }
  }
}
```

## **8. 性能优化指南 (Performance Guidelines)**

### **8.1 关键优化策略**

```jsx
// 使用React.memo避免不必要的重渲染
const DraggableTask = React.memo(({ task, onDragStart }) => {
  // 组件实现
});

// 使用useMemo缓存计算结果
const TimePlanner = () => {
  const criticalPathTime = useMemo(() => {
    return calculateCriticalPath(taskArrangement);
  }, [taskArrangement]);
  
  // 使用useCallback缓存事件处理函数
  const handleTaskDrop = useCallback((taskId, position) => {
    // 处理逻辑
  }, [dependency1, dependency2]);
};
```

### **8.2 懒加载策略**

```jsx
// 页面级组件懒加载
const TimePlanningPage = React.lazy(() => 
  import('../pages/TimePlanningPage')
);

// 条件渲染优化
const ConditionalComponent = ({ shouldRender, children }) => {
  return shouldRender ? children : null;
};
```

这个组件蓝图为开发者提供了完整的组件架构指南，确保所有组件都遵循统一的设计模式和最佳实践。