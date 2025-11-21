# Implementation Plan: 薇甘菊防治实验子模块

**Branch**: `feature/g8-mikania-experiment` | **Date**: 2025-11-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/feature/g8-mikania-experiment/spec.md`
**Reference**: 详细设计说明书 `docs/子模块需求文档/薇甘菊防治实验子模块设计说明书.md`

## Summary

实现薇甘菊防治实验交互子模块，作为Flow框架下的CMI（Composable Module Interface）兼容组件。该模块包含7页线性评测流程（含注意事项页），核心功能为SVG动画实验面板，支持学生通过调整浓度和天数参数观察种子发芽率变化，回答相关问题并提交评测数据。

技术方案：基于React 18函数组件实现，使用CSS Modules隔离样式，通过Context+Reducer管理模块状态，集成项目统一的usePageSubmission Hook进行数据提交。

## Technical Context

**Language/Version**: JavaScript/JSX (ES2019+, React 18)
**Primary Dependencies**: React 18, CSS Modules, Project unified hooks (usePageSubmission, usePageTimer)
**Storage**: localStorage (module.g8-mikania-experiment.* namespace)
**Testing**: Manual testing per acceptance scenarios (no automated tests required)
**Target Platform**: Modern browsers (Chrome, Edge, Firefox), 1920x1080+ resolution
**Project Type**: Frontend React module (Flow submodule)
**Performance Goals**: 首屏≤3s, 单页≤500ms, SVG动画60FPS
**Constraints**: 内容区域1120x720px, 图片≤200KB, 统一CSS变量
**Scale/Scope**: 7页流程(含注意事项页), 5个问题, 1个交互实验面板, 20分钟计时, 38秒阅读倒计时

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Module Isolation ✅
- 子模块完全自包含于 `src/submodules/g8-mikania-experiment/`
- 不修改其他模块或遗留代码
- 使用CSS Modules防止样式冲突

### II. Standardized Module Contract ✅
- 实现SubmoduleDefinition接口
- 导出submoduleId, displayName, version, Component, getInitialPage等
- 使用flowContext进行Flow容器交互

### III. Data Logging & Submission Protocol ✅
- 使用usePageSubmission统一提交
- MarkObject包含pageNumber, pageDesc, operationList, answerList
- pageNumber使用encodeCompositePageNum生成复合编码

### IV. Linear Navigation Flow ✅
- 7页线性前进流程，无后退（含注意事项页和任务背景页两个hidden页）
- 必填项验证作为导航前置条件
- 注意事项页需38秒倒计时后勾选确认
- getInitialPage支持页面恢复

### V. Timer Management & Session Integrity ✅
- 20分钟任务计时
- 超时自动提交并调用flowContext.onTimeout()
- 不在控制台暴露敏感信息

### VI. Error Handling & Resilience ✅
- 网络错误显示统一错误托盘
- 401触发重新登录
- 组件错误由ErrorBoundary捕获

### VII. Code Quality & Testing Standards ✅
- 函数组件+Hooks
- ESLint零警告
- PascalCase组件，camelCase函数

### VIII. Specification Authority Hierarchy ✅
- 遵循openspec/specs/flow/spec.md中的CMI规范
- 参考openspec/specs/data-format/spec.md数据格式

## Project Structure

### Documentation (this feature)

```
specs/feature/g8-mikania-experiment/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A - no new API endpoints)
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```
src/submodules/g8-mikania-experiment/
├── index.jsx              # SubmoduleDefinition导出
├── Component.jsx          # 主组件（路由+状态管理）
├── mapping.js             # 页面映射和导航模式
├── pages/                 # 7个页面组件
│   ├── Page00_Notice.jsx  # 注意事项页（38秒倒计时+确认）
│   ├── Page01_Intro.jsx
│   ├── Page02_Step_Q1.jsx
│   ├── Page03_Sim_Exp.jsx
│   ├── Page04_Q2_Data.jsx
│   ├── Page05_Q3_Trend.jsx
│   └── Page06_Q4_Conc.jsx
├── components/            # 可复用组件
│   ├── ExperimentPanel/
│   │   ├── index.jsx
│   │   ├── PetriDish.jsx
│   │   ├── Dropper.jsx
│   │   └── SeedDisplay.jsx
│   └── ChartPanel/
│       └── index.jsx
├── styles/                # CSS Modules
│   ├── Page00_Notice.module.css
│   ├── Page01_Intro.module.css
│   ├── Page02_Step_Q1.module.css
│   ├── Page03_Sim_Exp.module.css
│   ├── Page04_Q2_Data.module.css
│   ├── Page05_Q3_Trend.module.css
│   ├── Page06_Q4_Conc.module.css
│   └── ExperimentPanel.module.css
├── utils/
│   └── experimentData.js  # 发芽率数据模型
└── assets/
    ├── data/
    │   └── germination-data.json
    └── images/
        ├── img_mik_weed.jpg
        ├── img_cuscuta.jpg
        └── img_exp_steps.jpg
```

**Structure Decision**: 采用Flow子模块标准结构，所有代码自包含于`src/submodules/g8-mikania-experiment/`目录，符合模块隔离原则。

## Complexity Tracking

*无需填写 - Constitution Check全部通过*
