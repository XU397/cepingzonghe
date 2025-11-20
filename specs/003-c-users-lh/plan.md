# Implementation Plan: 光伏治沙交互实验子模块

**Branch**: `003-c-users-lh` | **Date**: 2025-11-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-c-users-lh/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

创建一个8年级物理学科的光伏治沙交互实验子模块，支持学生通过SVG仿真界面进行风速实验操作，包含3个引导页面和5个实验页面，采用CMI接口标准与现有Flow系统集成。技术实现基于React 18 + CSS Modules架构，使用预定义数据常量确保实验结果一致性，支持20分钟计时和统一数据提交协议。

## Technical Context

**Language/Version**: JavaScript ES6+ / React 18.2  
**Primary Dependencies**: React 18.2, CSS Modules, Recharts 2.15 (数据可视化)  
**Storage**: LocalStorage (答案草稿), 统一MarkObject API提交  
**Testing**: Vitest (vmThreads pool for WSL2)  
**Target Platform**: Web Browser (Chrome/Firefox/Safari/Edge), 1280×800+分辨率
**Project Type**: Web Application - React子模块  
**Performance Goals**: SVG动画60FPS, 页面切换<300ms, 首屏渲染<2秒  
**Constraints**: 20分钟计时限制, 线性导航(禁止后退), UTF-8编码必须  
**Scale/Scope**: 单个子模块, 8个页面组件, ~15个核心组件文件

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Module Isolation (NON-NEGOTIABLE)
- **Status**: PASS - 子模块将完全独立在 `src/submodules/g8-pv-sand-experiment/`
- **CSS**: 使用CSS Modules (`*.module.css`) 确保样式隔离
- **Communication**: 通过CMI接口与Flow容器通信，无跨模块文件依赖

### ✅ Standardized Module Contract
- **Status**: PASS - 实现CMI接口标准
- **Interface**: `Component({ userContext, initialPageId, options })` 
- **Methods**: `getInitialPage()`, `getTotalSteps()`, `getNavigationMode()`, `getDefaultTimers()`
- **Registration**: 注册到 `submodules/registry.ts`

### ✅ Data Logging & Submission Protocol (NON-NEGOTIABLE)
- **Status**: PASS - 完全遵循统一数据协议
- **Events**: 使用标准事件集合(page_enter, page_exit, click, change等)
- **Submission**: 使用 `usePageSubmission` Hook和 `POST /stu/saveHcMark`
- **Format**: MarkObject with pageNumber/pageDesc/operationList/answerList

### ✅ Linear Navigation Flow
- **Status**: PASS - 严格线性导航，无后退功能
- **Validation**: 页面前进需完成验证(如最少5字符输入)
- **Progress**: 支持通过 `getInitialPage(pageNum)` 恢复进度

### ✅ Timer Management & Session Integrity
- **Status**: PASS - 使用统一Timer服务
- **Default**: 20分钟任务计时，支持Flow配置覆盖
- **Security**: 无敏感信息暴露，计时状态由Flow容器管理

### ✅ Error Handling & Resilience
- **Status**: PASS - 使用共享错误处理
- **SVG Fallback**: 动画失败时降级到静态显示
- **Retry**: 使用 `usePageSubmission` 的指数退避重试
- **Offline**: 本地存储答案草稿防丢失

### ✅ Code Quality & Testing Standards
- **Status**: PASS - 符合项目标准
- **ESLint**: 零警告通过
- **Encoding**: UTF-8编码，中文正确显示
- **Testing**: Vitest with vmThreads兼容WSL2

### ✅ Flow Orchestration & CMI Compliance (NEW)
- **Status**: PASS - 完整CMI接口实现
- **Context**: 首次进入记录flow_context操作
- **StrictMode**: React.StrictMode兼容
- **PageNumber**: 使用点分隔格式 "H.1"/"1.4" 

### ✅ Unified Service Architecture (NEW)
- **Status**: PASS - 使用统一服务
- **Submission**: `usePageSubmission` Hook
- **Framework**: `AssessmentPageFrame` 页面框架
- **Events**: 标准事件集合，无自定义事件

### ✅ Frontend Structure Standardization
- **Status**: PASS - 符合目录结构标准
- **Location**: `src/submodules/g8-pv-sand-experiment/`
- **Shared**: 仅使用shared层的无状态组件和服务

### ✅ OpenSpec规范权威地位 (NON-NEGOTIABLE)
- **Status**: PASS - 严格遵循OpenSpec规范
- **Compliance**: 实现符合 `openspec/specs/` 定义的所有接口
- **Documentation**: 以OpenSpec为技术真相来源

## Project Structure

### Documentation (this feature)

```
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```
src/submodules/g8-pv-sand-experiment/
├── index.tsx                        # CMI子模块定义导出
├── Component.tsx                    # 主组件入口
├── mapping.ts                       # pageId映射逻辑
├── pages/                          # 8个页面组件
│   ├── Page01InstructionsCover.tsx  # 详细封面页(注意事项)
│   ├── Page02Cover.tsx             # 任务封面
│   ├── Page03Background.tsx        # 背景引入
│   ├── Page04ExperimentDesign.tsx  # 实验方案设计
│   ├── Page05Tutorial.tsx          # 操作指引
│   ├── Page06Experiment1.tsx       # 实验探究-1(50cm)
│   ├── Page07Experiment2.tsx       # 实验探究-2(趋势分析)
│   └── Page08Analysis.tsx          # 结论分析
├── components/                     # 子模块内组件
│   ├── WindSpeedSimulator.tsx      # SVG风速仪动画
│   ├── DataVisualization.tsx       # 折线图组件
│   ├── HeightController.tsx        # 高度调节控制器
│   └── ExperimentPanel.tsx         # 实验控制面板
├── hooks/                         # 子模块专用hooks
│   ├── useExperimentState.tsx     # 实验状态管理
│   └── useAnswerDrafts.tsx        # 答案草稿管理
├── styles/                        # CSS模块样式
│   ├── Page01InstructionsCover.module.css
│   ├── Page02Cover.module.css
│   ├── Page03Background.module.css
│   ├── Page04ExperimentDesign.module.css
│   ├── Page05Tutorial.module.css
│   ├── Page06Experiment1.module.css
│   ├── Page07Experiment2.module.css
│   ├── Page08Analysis.module.css
│   ├── WindSpeedSimulator.module.css
│   └── shared.module.css           # 公共样式
└── constants/
    └── windSpeedData.ts            # 实验数据常量

# 集成点 (已存在的文件需要更新)
src/submodules/registry.ts          # 添加新子模块注册
src/styles/global.css               # 添加实验环境颜色变量
```

**Structure Decision**: 选择React子模块结构，完全符合项目现有的submodules架构。所有代码自包含在独立目录中，通过CMI接口与Flow系统集成，确保模块隔离性和可维护性。

## Complexity Tracking

*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |
