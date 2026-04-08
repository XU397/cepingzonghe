# Research: 4年级火车购票-交互子模块 (g4-experiment)

**Date**: 2025-12-17
**Feature**: [spec.md](./spec.md) | [plan.md](./plan.md)

## 1. CMI 接口规范

### Decision
采用现有 Flow CMI 标准接口，与 g7-experiment 保持一致。

### Rationale
- openspec/specs/flow/spec.md 已定义明确的 CMI 契约
- 现有子模块（g7-experiment, g8-mikania-experiment）已验证该模式
- 统一接口降低 FlowOrchestrator 复杂度

### Interface Definition
```typescript
interface SubmoduleDefinition {
  submoduleId: string;           // 'g4-experiment'
  displayName: string;           // '4年级火车购票-交互'
  version: string;               // '1.0.0'
  Component: React.FC<Props>;    // 子模块主组件
  getInitialPage(subPageNum: string): string;      // 页码 → pageId
  getTotalSteps(): number;                          // 可见步骤数
  getNavigationMode(pageId: string): 'hidden' | 'experiment';
  getDefaultTimers(): { task: number };            // 秒数
  resolvePageNum?(pageId: string): string | null;  // pageId → 页码
}
```

### Alternatives Considered
1. **自定义接口**: 增加维护成本，与现有系统不兼容
2. **扩展 ModuleRegistry**: 过度耦合，违反模块隔离原则

---

## 2. 拖拽实现方案

### Decision
使用原生 HTML5 Drag and Drop API，不引入 react-dnd。

### Rationale
- 本模块拖拽需求相对简单（单类型元素、固定区域）
- 避免增加额外依赖（react-dnd + backend）
- 磁吸对齐需要自定义计算，react-dnd 无明显优势
- 现有项目未使用 react-dnd，保持技术栈一致性

### Implementation Pattern
```javascript
// TaskBlock.jsx
const handleDragStart = (e) => {
  e.dataTransfer.setData('taskId', task.id);
  e.dataTransfer.effectAllowed = 'move';
  logOperation({ eventType: EventTypes.SIMULATION_OPERATION, ... });
};

// DropZone.jsx
const handleDrop = (e) => {
  const taskId = e.dataTransfer.getData('taskId');
  const dropPos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  const snappedPos = calculateMagneticSnap(dropPos, existingTasks);
  // ...
};
```

### Alternatives Considered
1. **react-dnd**: 过重，学习曲线高，项目未使用
2. **react-beautiful-dnd**: 面向列表拖拽，不适合自由定位场景
3. **@dnd-kit**: 较新但同样增加依赖

---

## 3. 磁吸对齐算法

### Decision
采用预计算吸附点 + 阈值检测的 O(n) 算法。

### Rationale
- 任务条数量有限（最多10个），无需复杂优化
- 30px 阈值符合交互习惯
- 4种对齐模式覆盖常见场景

### Algorithm
```javascript
function calculateMagneticSnap(dropPos, existingTasks, threshold = 30) {
  const snapPoints = [];

  existingTasks.forEach(task => {
    // 左-左对齐
    snapPoints.push({ x: task.x, alignType: 'left-left', refTask: task });
    // 左-右对齐
    snapPoints.push({ x: task.x + task.width, alignType: 'left-right', refTask: task });
    // 右-右对齐（需要新任务宽度）
    // 右-左对齐
  });

  // 找最近吸附点
  const nearest = snapPoints.reduce((best, point) => {
    const dist = Math.abs(point.x - dropPos.x);
    return dist < best.dist && dist < threshold ? { ...point, dist } : best;
  }, { dist: Infinity });

  return nearest.dist < threshold ? nearest.x : dropPos.x;
}
```

### Alternatives Considered
1. **网格对齐**: 过于刚性，不够灵活
2. **无对齐**: 用户体验差，难以精确定位

---

## 4. 对话动画实现

### Decision
使用 Promise chain + CSS transitions 实现逐条消息播放。

### Rationale
- 可控的时序管理（打字延迟、消息间隔）
- CSS transitions 性能优于 JavaScript 动画
- "正在输入"指示器使用 CSS animation

### Implementation Pattern
```javascript
async function playDialogue(messages) {
  for (const msg of messages) {
    await showTypingIndicator();
    const delay = calculateTypingDelay(msg.text);
    await sleep(delay);
    await hideTypingIndicator();
    await appendMessage(msg);
    await sleep(500); // 消息间隔
  }
}

function calculateTypingDelay(text) {
  const baseDelay = text.length * 100;
  return Math.min(Math.max(baseDelay, 1200), 2500);
}
```

### Alternatives Considered
1. **requestAnimationFrame**: 过于底层，增加复杂度
2. **GSAP/Framer Motion**: 增加依赖，本场景不需要

---

## 5. 事件类型与操作记录

### Decision
使用 `src/shared/services/submission/eventTypes.js` 中的 EventTypes 常量。

### Rationale
- 统一事件命名，便于后端解析
- 现有常量已覆盖大部分场景
- 可按需扩展（如需要可 PR 添加）

### Event Mapping
| 交互场景 | EventType | targetElement 示例 |
|----------|-----------|-------------------|
| 页面进入 | PAGE_ENTER | 页面 |
| 页面离开 | PAGE_EXIT | 页面 |
| 输入框聚焦 | INPUT_FOCUS | 问题输入框 |
| 输入框失焦 | INPUT_BLUR | 问题输入框 |
| 复选框勾选 | CHECKBOX_CHECK | 因素_{选项文本} |
| 复选框取消 | CHECKBOX_UNCHECK | 因素_{选项文本} |
| 拖拽操作 | SIMULATION_OPERATION | 方案1_任务条① |
| 点击被阻断 | CLICK_BLOCKED | next_button |
| 单选选择 | RADIO_SELECT | 出发站_{站名} |

### Missing Events (May Need Extension)
- `INPUT_CHANGE`: 已存在
- `INPUT_DELETE`: 已存在
- 无需新增

---

## 6. CSS 变量管理

### Decision
在 `src/styles/global.css` 中声明所有 `--g4-*` 变量。

### Rationale
- 符合 FR-078 要求（不允许子模块新增变量声明）
- 使用 `--g4-` 前缀避免冲突
- 便于全局主题管理

### Variables to Add
```css
/* src/styles/global.css - G4 Experiment Module */
:root {
  /* 气泡颜色 */
  --g4-bubble-blue: #dbeafe;
  --g4-bubble-orange: #fdba74;

  /* 任务条颜色 */
  --g4-task-blue: #2563EB;
  --g4-task-orange: #EA580C;
  --g4-task-gray: #6B7280;
  --g4-task-green: #15803D;
  --g4-task-pink: #DB2777;

  /* 手机模拟器 */
  --g4-phone-border: #1f2937;
  --g4-chat-bg: #f8fafc;
}
```

---

## 7. 页码映射策略

### Decision
采用与 g7-tracking-experiment 一致的 mapping.ts 模式。

### Rationale
- 已验证的模式，FlowOrchestrator 兼容
- 支持双向映射（pageNum ↔ pageId）
- 便于进度恢复

### Mapping Definition
```typescript
const PAGE_CONFIG = {
  1:  { pageId: 'notices', mode: 'hidden' },
  2:  { pageId: 'scenario-intro', mode: 'experiment' },
  3:  { pageId: 'problem-identification', mode: 'experiment' },
  4:  { pageId: 'factor-analysis', mode: 'experiment' },
  5:  { pageId: 'route-analysis', mode: 'experiment' },
  6:  { pageId: 'station-recommendation', mode: 'experiment' },
  7:  { pageId: 'timeline-planning-tutorial', mode: 'experiment' },
  8:  { pageId: 'user-solution-design', mode: 'experiment' },
  9:  { pageId: 'plan-optimization', mode: 'experiment' },
  10: { pageId: 'ticket-filter', mode: 'experiment' },
  11: { pageId: 'ticket-pricing', mode: 'experiment' },
  12: { pageId: 'task-completion', mode: 'experiment' },
};
```

---

## 8. 表单校验策略

### Decision
前端仅校验格式，不校验业务正确性。

### Rationale
- 符合 spec.md Overrides 声明（票价不校验正确性）
- 记录原始答案供后端评分
- 降低前端复杂度

### Validation Rules
| 字段 | 校验规则 | 阻断导航 |
|------|----------|----------|
| 路程输入 | 非空 + 正数 | 是 |
| 总用时输入 | 非空 + 正整数 1-999 | 是 |
| 票价输入 | 非空 + 正整数 | 是 |
| 文本输入 | 非空 | 是 |
| 正确性校验 | 无 | - |

---

## Summary

所有技术决策均基于现有项目规范和最佳实践，无需引入新依赖。关键决策：
1. **CMI 接口**: 与现有子模块保持一致
2. **拖拽**: 原生 HTML5 DnD，自实现磁吸
3. **动画**: Promise chain + CSS transitions
4. **事件**: 使用共享 EventTypes 常量
5. **样式**: global.css 声明 --g4-* 变量
6. **校验**: 格式校验，不校验业务正确性
