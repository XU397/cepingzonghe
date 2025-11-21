# Research Report: 光伏治沙交互实验子模块

**Created**: 2025-11-19
**Feature**: 光伏治沙交互实验子模块
**Purpose**: 解决技术实现过程中的关键技术选择和最佳实践

## 研究摘要

本研究报告针对光伏治沙子模块的CMI接口集成和SVG动画性能优化进行了深入调研，为技术实现提供了具体的代码模式和架构建议。研究基于项目现有架构和现代Web标准，确保新子模块能够无缝集成到Flow系统中。

## 1. CMI接口集成最佳实践

### Decision: 采用双层Context架构模式
**Rationale**: 基于项目现有的成熟实现，Flow Context负责流程级状态管理，Module Context负责模块内部状态管理，通过FlowBridge组件实现状态同步。

**Alternatives considered**: 
- 单一Context模式：被拒绝，因为混合关注点会导致状态管理复杂
- Props传递模式：被拒绝，因为跨层级传递状态会导致组件耦合

### Decision: 使用项目内置的usePageSubmission Hook
**Rationale**: Hook内置flow_context自动注入、指数退避重试、统一错误处理等机制，完全符合项目数据协议要求。

**Alternatives considered**:
- 自定义提交逻辑：被拒绝，因为会违反统一服务架构原则
- 直接API调用：被拒绝，因为缺乏错误处理和重试机制

### Decision: 严格遵循点分隔页码格式("H.1"/"1.4")
**Rationale**: 符合项目规范，支持hidden页面和可见页面的区分统计，便于Flow容器进行进度跟踪。

**Key Implementation Pattern**:
```typescript
// CMI核心方法实现模式
export const g8PvSandExperimentSubmodule = {
  submoduleId: "g8-pv-sand-experiment",
  displayName: "8年级光伏治沙-交互实验",
  version: "1.0.0",
  
  Component: PvSandExperimentComponent,
  
  getInitialPage: (subPageNum) => {
    const parsed = parseInt(subPageNum, 10);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 8) {
      return 'instructions_cover';
    }
    return PAGE_MAPPING[parsed]?.pageId || 'instructions_cover';
  },
  
  getTotalSteps: () => 5, // 仅计算Page 4-8的可见步数
  
  getNavigationMode: (pageId) => {
    if (['instructions_cover', 'cover_intro', 'background_notice'].includes(pageId)) {
      return 'hidden';
    }
    return 'experiment';
  },
  
  getDefaultTimers: () => ({
    task: 20 * 60, // 20分钟
    questionnaire: 0
  })
};
```

## 2. SVG动画性能优化策略

### Decision: CSS动画 + JavaScript控制的混合模式
**Rationale**: 充分利用浏览器硬件加速能力，同时保持对动画时序的精确控制。CSS负责transform动画，JavaScript负责数值计算和状态管理。

**Alternatives considered**:
- 纯CSS动画：被拒绝，因为无法支持动态高度参数调节
- 纯JavaScript动画：被拒绝，因为性能不如硬件加速的CSS动画

### Decision: requestAnimationFrame + easeOutCubic缓动
**Rationale**: 确保60FPS流畅度，缓动函数提供自然的物理感觉，符合教育应用的用户体验要求。

**Key Performance Optimizations**:
```css
/* 硬件加速优化 */
.windSpeedometer {
  contain: layout style paint;
  isolation: isolate;
  will-change: transform;
  transform: translateZ(0);
}

/* 动画性能优化 */
@keyframes rotateNeedle {
  from { transform: rotate(var(--start-angle)); }
  to { transform: rotate(var(--target-angle)); }
}
```

### Decision: 设备性能检测 + 自动降级机制
**Rationale**: 确保在低性能设备上仍能正常运行，通过简化SVG复杂度和禁用动画来保证基本功能可用。

**Fallback Strategy**:
- 检测硬件指标：CPU核心数、内存容量、设备像素比
- 自动切换到静态数值显示模式
- 保持数据准确性，仅简化视觉表现

## 3. 数据常量管理

### Decision: 使用TypeScript常量确保数据一致性
**Rationale**: 防止随机数据影响实验结果的一致性，满足教育测评的严格要求。

**Implementation**:
```typescript
export const WIND_SPEED_DATA = {
  20: { withPanel: 2.09, noPanel: 2.37 },
  50: { withPanel: 2.25, noPanel: 2.62 },
  100: { withPanel: 1.66, noPanel: 2.77 }
} as const;

export const HEIGHT_LEVELS = [20, 50, 100] as const;
export type HeightLevel = typeof HEIGHT_LEVELS[number];
```

**Alternatives considered**:
- 动态计算：被拒绝，因为会引入误差和不一致性
- 后端接口获取：被拒绝，因为增加网络依赖和失败风险

## 4. React.StrictMode兼容性

### Decision: 利用项目现有的路由级StrictMode管理
**Rationale**: 项目已实现Flow路由不包裹StrictMode的智能策略，避免开发期双渲染问题。

**Key Compatibility Measures**:
- 使用useRef存储稳定引用
- 确保所有Effect都有适当的清理逻辑
- 集成项目内置的渲染计数器监控

## 5. 状态持久化策略

### Decision: LocalStorage + sessionStorage混合存储
**Rationale**: 答案草稿使用localStorage确保刷新后恢复，实验状态使用sessionStorage避免跨会话污染。

**Storage Architecture**:
```typescript
// 答案草稿持久化
const ANSWER_DRAFT_KEY = 'module.g8-pv-sand-experiment.answers';
const EXPERIMENT_STATE_KEY = 'module.g8-pv-sand-experiment.experimentData';

// 恢复策略
const restoreState = () => {
  const answers = JSON.parse(localStorage.getItem(ANSWER_DRAFT_KEY) || '{}');
  const experimentData = JSON.parse(sessionStorage.getItem(EXPERIMENT_STATE_KEY) || '{}');
  return { answers, experimentData };
};
```

## 6. 事件记录规范

### Decision: 严格遵循项目统一事件类型集合
**Rationale**: 确保与数据分析系统的兼容性，避免自定义事件导致的数据孤岛问题。

**Event Mapping**:
- 实验操作：使用`click`事件 + 详细value描述
- 答题行为：使用`change`事件
- 页面生命周期：使用`page_enter`/`page_exit`事件
- 验证阻断：使用`click_blocked`事件

## 研究结论

基于以上研究，光伏治沙子模块的技术实现路径明确：

1. **架构选择**: 采用CMI + FlowBridge双层架构
2. **动画方案**: CSS硬件加速 + JavaScript精确控制
3. **性能策略**: 自适应降级 + 60FPS目标
4. **数据管理**: TypeScript常量 + 混合存储
5. **集成模式**: 深度利用项目现有服务和规范

这些技术选择确保了子模块能够在保持高性能的同时，完全符合项目架构规范和教育测评要求。