# Implementation Plan: 无人机航拍交互课堂子模块

**Branch**: `002-8` | **Date**: 2025-11-19 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-8/spec.md`
**Reference**: [无人机航拍交互课堂-子模块设计说明书](../../docs/子模块需求文档/无人机航拍交互课堂-子模块设计说明书.md)

## Summary

实现8年级物理科学探究实验子模块（g8-drone-imaging），评估学生通过无人机航拍模拟实验理解变量控制和数据分析能力。子模块包含7个页面的线性流程，核心功能为交互式无人机航拍模拟器，支持高度和焦距参数调整，实时显示GSD数值和图像模糊效果。

技术方案采用React 18 + TypeScript，遵循SubmoduleDefinition接口规范，使用CSS Modules样式隔离，通过AssessmentPageFrame容器运行。

**重要实现说明**：
- 实验模拟器使用纯 SVG 动画生成，不使用真实图片
- SVG 实现参考：[无人机交互动画.html](../../docs/SVG动画参考/无人机交互动画.html)
- 其他页面需要图片的部分使用占位符

## Technical Context

**Language/Version**: TypeScript 5.x (React 18.2)
**Primary Dependencies**: React 18, Vite 4, CSS Modules
**Storage**: localStorage (命名空间: `module.g8-drone-imaging.*`)
**Testing**: Vitest (vmThreads pool for WSL2)
**Target Platform**: Web (Chrome/Edge/Firefox, 1280x720+)
**Project Type**: Web application (frontend submodule)
**Performance Goals**: 页面渲染 < 500ms, 实验动画 60 FPS
**Constraints**: 图片资源 < 300KB, 首屏 < 3s
**Scale/Scope**: 7页面, 9种参数组合, 单用户评测场景

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Evidence |
|-----------|--------|----------|
| I. Module Isolation | ✅ Pass | 子模块位于 `src/submodules/g8-drone-imaging/`，使用CSS Modules，无跨模块导入 |
| II. Standardized Module Contract | ✅ Pass | 实现SubmoduleDefinition接口，包含submoduleId/displayName/version/Component/getInitialPage/getTotalSteps/getNavigationMode/getDefaultTimers |
| III. Data Logging & Submission | ✅ Pass | 使用EventTypes枚举、createMarkObject、formatTimestamp，通过AssessmentPageFrame的defaultSubmit提交 |
| IV. Linear Navigation Flow | ✅ Pass | 7页线性流程，无返回，通过getInitialPage恢复进度 |
| V. Timer Management | ✅ Pass | 使用容器统一计时器（20分钟），本地存储状态持久化 |
| VI. Error Handling | ✅ Pass | 使用usePageSubmission重试机制，handleSessionExpired处理401 |
| VII. Code Quality | ✅ Pass | TypeScript、ESLint、CSS Modules、函数组件+Hooks |
| VIII. OpenSpec Source of Truth | ✅ Pass | 基于spec.md实现，设计说明书作为实现指南 |

**Gate Result**: ✅ All principles satisfied. Proceed to Phase 0.

## Project Structure

### Documentation (this feature)

```
specs/002-8/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (internal interfaces)
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```
src/submodules/g8-drone-imaging/
├── index.tsx                    # SubmoduleDefinition导出
├── Component.tsx                # 子模块主组件
├── mapping.ts                   # pageNum <-> pageId映射
├── context/
│   └── DroneImagingContext.tsx  # 状态管理Context
├── pages/
│   ├── Page01_Cover.tsx         # 注意事项确认
│   ├── Page02_Background.tsx    # 背景知识介绍
│   ├── Page03_Hypothesis.tsx    # 实验假设思考
│   ├── Page04_Experiment.tsx    # 航拍模拟实验
│   ├── Page05_FocalAnalysis.tsx # 焦距影响分析
│   ├── Page06_HeightAnalysis.tsx# 高度影响分析
│   └── Page07_Conclusion.tsx    # 综合结论
├── components/
│   ├── DroneSimulator.tsx       # 无人机模拟器主组件 (SVG动画，从参考HTML转换)
│   ├── GSDDisplay.tsx           # GSD数值显示
│   ├── HeightSelector.tsx       # 高度选择器
│   └── FocalLengthSelector.tsx  # 焦距选择器
├── utils/
│   └── gsdLookup.ts             # GSD查找表
├── styles/
│   ├── Page01_Cover.module.css
│   ├── Page02_Background.module.css
│   ├── Page03_Hypothesis.module.css
│   ├── Page04_Experiment.module.css
│   ├── Page05_FocalAnalysis.module.css
│   ├── Page06_HeightAnalysis.module.css
│   ├── Page07_Conclusion.module.css
│   └── DroneSimulator.module.css
└── assets/
    └── images/                  # 占位图片 (背景页面等非实验页面使用)
```

**Structure Decision**: 遵循现有子模块模式（参考g7-experiment），作为独立子模块部署在`src/submodules/`目录下。

## Complexity Tracking

*No constitution violations requiring justification.*

## Pre-Implementation Tasks

以下任务需在子模块实现前完成：

1. **扩展EventTypes枚举** - 在`src/shared/services/submission/eventTypes.js`中添加：
   - `CLICK_BLOCKED` - 校验未通过时的点击拦截
   - `AUTO_SUBMIT` - 计时器到期自动提交
   - `READING_COMPLETE` - 强制阅读完成（或复用TIMER_STOP）

2. **更新Data Format Spec** - 在`openspec/specs/data-format/spec.md`中记录新增事件类型

3. **确认SubmoduleDefinition接口** - 验证`src/shared/types/flow.ts`中的接口定义与设计说明书一致
