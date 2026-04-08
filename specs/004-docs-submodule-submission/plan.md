# Implementation Plan: 子模块数据提交标准化

**Branch**: `004-docs-submodule-submission` | **Date**: 2025-12-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/004-docs-submodule-submission/spec.md`

## Summary

创建共享的子模块数据提交适配层，统一 4 个子模块（g8-pv-sand、g8-mikania、g8-drone、g7-experiment）的数据提交格式，解决 pageNumber 编码、targetElement 前缀、flow_context 注入、答案 code 映射等不一致问题。

技术方案：在 `@/shared/submission/` 目录下创建 `submoduleAdapter` 模块，提供 `usePageMeta`、`useOperationLogger`、`collectAnswers`、`validateMarkBeforeSubmit` 等工具函数，各子模块通过接入适配器实现统一规范。

## Technical Context

**Language/Version**: JavaScript ES6+ (React 18.2), TypeScript 5.x (部分工具函数)
**Primary Dependencies**: React 18.2, Vite 4, existing `@shared/services/submission/` 模块
**Storage**: N/A (内存状态 + localStorage 持久化)
**Testing**: Vitest (vmThreads for WSL2), 快照测试
**Target Platform**: Web (Chrome/Edge/Firefox, 支持 ES6+)
**Project Type**: Web application (React SPA)
**Performance Goals**: 校验函数 < 5ms 执行时间，无用户感知延迟
**Constraints**: 向后兼容，渐进式迁移，不破坏现有子模块功能
**Scale/Scope**: 4 个子模块，约 30 个页面，每页 10-50 个操作事件

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Module Isolation | ✅ Pass | 共享适配器位于 `@shared/submission/`，不跨模块导入 |
| II. Standardized Module Contract | ✅ Pass | 适配器通过 `SubmoduleMappingConfig` 接口标准化 |
| III. Data Logging & Submission Protocol | ✅ Pass | 核心目标：统一 MarkObject 格式，符合 `/stu/saveHcMark` 合约 |
| IV. Linear Navigation Flow | ✅ Pass | `clearOperations` 在导航时重置，不影响导航逻辑 |
| V. Timer Management & Session Integrity | ✅ Pass | 不修改计时器逻辑，仅规范化数据格式 |
| VI. Error Handling & Resilience | ✅ Pass | `validateMarkBeforeSubmit` 提供校验错误反馈 |
| VII. Code Quality & Testing Standards | ✅ Pass | 快照测试覆盖，ESLint 合规 |
| VIII. OpenSpec as Source of Truth | ✅ Pass | 基于 PO 终审通过的分析文档 |

**Gate Result**: ✅ PASS - 无违规项，可进入 Phase 0

## Project Structure

### Documentation (this feature)

```
specs/004-docs-submodule-submission/
├── spec.md              # Feature specification (已完成)
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (TypeScript interfaces)
│   ├── submodule-adapter.ts
│   └── submodule-mapping.ts
└── tasks.md             # Phase 2 output (by /speckit.tasks)
```

### Source Code (repository root)

```
src/shared/submission/
├── submoduleAdapter.ts          # 主适配器模块
│   ├── usePageMeta.ts           # Hook: pageNumber + targetPrefix
│   ├── useOperationLogger.ts    # Hook: 操作日志管理
│   ├── collectAnswers.ts        # 答案收集工具
│   ├── validateMark.ts          # 提交前校验
│   ├── constants.ts             # RESERVED_ELEMENTS 等常量
│   └── index.ts                 # 导出入口
└── __tests__/
    ├── submoduleAdapter.test.ts
    └── __snapshots__/

src/submodules/
├── g8-pv-sand-experiment/       # P1: 优先修复
│   ├── context/PvSandContext.tsx  # 修改: getPagePrefix
│   └── Component.tsx              # 修改: buildMark
├── g8-mikania-experiment/       # P2
│   ├── Component.jsx              # 修改: pageNumber + flow_context
│   └── pages/                     # 修改: targetElement 前缀
├── g8-drone-imaging/            # P3
│   ├── context/DroneImagingContext.tsx  # 修改: logOperation
│   └── Component.tsx                    # 修改: answerList code
└── g7-experiment/               # P4
    ├── Component.jsx              # 修改: 接入适配器
    └── mapping.ts                 # 新增: 问题映射常量
```

**Structure Decision**: 扩展现有 `src/shared/submission/` 目录，新增 `submoduleAdapter` 子模块。各子模块在原有目录结构内修改，不新增目录层级。

## Complexity Tracking

*No violations - table not needed*
