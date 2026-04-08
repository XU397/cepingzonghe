# Implementation Plan: 4年级火车购票-交互子模块 (g4-experiment)

**Branch**: `005-g4-experiment-submodule` | **Date**: 2025-12-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-g4-experiment-submodule/spec.md`

## Summary

实现一个符合 Flow CMI 规范的四年级火车购票评测子模块，包含12个页面的完整评测流程。核心功能包括：对话消息自动播放、地图路线交互、任务条拖拽规划、车票筛选与计价。所有用户交互均需记录操作轨迹并通过统一提交流水线上报。

## Technical Context

**Language/Version**: JavaScript (ES6+) / React 18.2
**Primary Dependencies**: React, React Router 7, CSS Modules, Flow CMI 接口
**Storage**: localStorage（进度恢复）、后端 API（数据提交）
**Testing**: Vitest（单元测试）、Playwright（E2E测试）
**Target Platform**: 现代浏览器（Chrome 90+, Firefox 88+, Safari 14+）
**Project Type**: Web 应用子模块
**Performance Goals**: 拖拽响应 <100ms, 页面切换 <500ms, 60fps 动画
**Constraints**: 40分钟评测时限, 单向导航, 数据完整性优先
**Scale/Scope**: 12个页面, 79项功能需求, 支持1000+并发用户

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Module Isolation | ✅ PASS | 子模块独立于 `src/submodules/g4-experiment/`，无跨模块依赖 |
| II. Standardized Module Contract | ✅ PASS | 实现 CMI 接口：`getInitialPage`, `getTotalSteps`, `getNavigationMode`, `getDefaultTimers` |
| III. Data Logging Protocol | ✅ PASS | 使用 `src/shared/services/submission/eventTypes.js` 统一事件类型 |
| IV. Linear Navigation | ✅ PASS | 禁用返回按钮，单向导航，校验后才可前进 |
| V. Timer Management | ✅ PASS | notices 页40秒倒计时，全局40分钟计时器 |
| VI. Error Handling | ✅ PASS | 401自动登出，网络错误显示重试UI，ErrorBoundary包裹 |
| VII. Code Quality | ✅ PASS | ESLint零警告，函数式组件+Hooks，CSS Modules |
| VIII. OpenSpec Source of Truth | ✅ PASS | 规格文档遵循 openspec/specs/flow/spec.md CMI 契约 |

**Technology Constraints Check**:
- [x] React 18 函数式组件 + Hooks
- [x] CSS Modules（无全局CSS污染）
- [x] 无 Redux/MobX（使用 React Context）
- [x] 无内联样式
- [x] ES6+ 语法

## Project Structure

### Documentation (this feature)

```
specs/005-g4-experiment-submodule/
├── spec.md              # Feature specification (已完成)
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   └── submodule-interface.ts
└── checklists/
    └── requirements.md  # Validation checklist (已完成)
```

### Source Code (repository root)

```
src/submodules/g4-experiment/
├── index.jsx                    # CMI 导出入口
├── mapping.ts                   # 页码映射与 CMI 方法实现
├── Component.jsx                # 子模块主组件
├── context/
│   └── G4Context.jsx            # 子模块状态管理
├── pages/
│   ├── Page01_Notices.jsx       # 注意事项页
│   ├── Page02_ScenarioIntro.jsx # 情景介绍页
│   ├── Page03_ProblemId.jsx     # 问题识别页（对话）
│   ├── Page04_FactorAnalysis.jsx# 因素分析页
│   ├── Page05_RouteAnalysis.jsx # 出发站交互页（地图）
│   ├── Page06_StationRec.jsx    # 出发站结论页
│   ├── Page07_TimelineTutorial.jsx # 拖拽演示页
│   ├── Page08_SolutionDesign.jsx   # 方案设计页（拖拽）
│   ├── Page09_PlanOptimize.jsx  # 方案评估页
│   ├── Page10_TicketFilter.jsx  # 车票筛选页
│   ├── Page11_TicketPricing.jsx # 车票计价页
│   └── Page12_Completion.jsx    # 结束页
├── components/
│   ├── PhoneSimulator/          # 手机模拟器组件
│   │   ├── index.jsx
│   │   └── PhoneSimulator.module.css
│   ├── DialoguePlayer/          # 对话播放组件
│   │   ├── index.jsx
│   │   └── DialoguePlayer.module.css
│   ├── MapInteractive/          # 地图交互组件
│   │   ├── index.jsx
│   │   └── MapInteractive.module.css
│   ├── TaskBlockDnd/            # 任务条拖拽组件
│   │   ├── index.jsx
│   │   ├── TaskBlock.jsx
│   │   ├── DropZone.jsx
│   │   ├── MagneticSnap.js      # 磁吸算法
│   │   └── TaskBlockDnd.module.css
│   ├── VirtualKeyboard/         # 虚拟键盘组件
│   │   ├── index.jsx
│   │   └── VirtualKeyboard.module.css
│   └── TrainScheduleTable/      # 车次表格组件
│       ├── index.jsx
│       └── TrainScheduleTable.module.css
├── hooks/
│   ├── useDialoguePlayer.js     # 对话播放逻辑
│   ├── useDragDrop.js           # 拖拽逻辑
│   ├── useMagneticSnap.js       # 磁吸对齐逻辑
│   └── useG4Navigation.js       # 导航与提交逻辑
├── constants/
│   ├── pageConfig.js            # 页面配置
│   ├── dialogueMessages.js      # 对话消息数据
│   ├── taskBlocks.js            # 任务条数据
│   └── trainSchedules.js        # 车次数据
├── utils/
│   └── validation.js            # 表单校验工具
├── assets/
│   └── images/                  # 头像、地图等图片资源
└── styles/
    └── variables.module.css     # 子模块内变量引用（不新增声明）

src/styles/global.css            # CSS变量声明（新增 --g4-* 变量）
```

**Structure Decision**: 采用 submodules 目录结构，与现有 g7-tracking-experiment、g8-mikania-experiment 保持一致。组件按功能模块化，hooks 封装复杂逻辑，constants 存放静态数据。

## Complexity Tracking

*No constitution violations requiring justification.*

## Implementation Phases

### Phase 0: Research & Technical Decisions
- [x] 确认 CMI 接口规范（参考 flow/spec.md）
- [x] 确认 EventTypes 位置（src/shared/services/submission/eventTypes.js）
- [x] 确认拖拽实现方案（原生 HTML5 DnD vs react-dnd）
- [x] 确认动画实现方案（CSS animations vs requestAnimationFrame）

### Phase 1: Design & Contracts
- [ ] 定义数据模型（data-model.md）
- [ ] 定义 CMI 接口契约（contracts/submodule-interface.ts）
- [ ] 创建快速开始指南（quickstart.md）

### Phase 2: Task Generation
- [ ] 通过 /speckit.tasks 生成任务清单

## Dependencies

| 依赖 | 来源 | 用途 |
|------|------|------|
| FlowContext | src/flows/orchestrator/ | Flow 模式下的上下文传递 |
| EventTypes | src/shared/services/submission/eventTypes.js | 统一事件类型常量 |
| usePageSubmission | src/shared/hooks/ | 统一数据提交流水线 |
| AssessmentPageFrame | src/shared/components/ | Flow 模式页面框架 |
| encodeCompositePageNum | src/shared/utils/pageNumber.js | 复合页码生成 |

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| 拖拽性能问题 | 高 | 使用 requestAnimationFrame，限制重绘频率 |
| 磁吸算法复杂度 | 中 | 预先计算吸附点，O(n)复杂度 |
| 对话动画时序 | 低 | 使用 Promise chain 确保顺序执行 |
| CSS变量冲突 | 低 | 使用 --g4- 前缀命名空间 |
