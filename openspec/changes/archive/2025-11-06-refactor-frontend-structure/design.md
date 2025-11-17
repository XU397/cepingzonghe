## Context
- 为统一提交/计时/框架/Flow 奠定目录与工程基础，保证渐进迁移与清晰边界。

## Goals / Non-Goals
- Goals:
  - 建立 `app/`, `flows/`, `submodules/`, `shared/{ui,services,types,styles}`, `hooks/`, `utils/`。
  - 占位组件/文件，保证最小可运行与路径别名。
- Non-Goals:
  - 不移动或重构业务页面内容。

## Decisions
- 别名：使用 Vite `resolve.alias`（如 `@shared` → `src/shared`）。
- 语言：维持 JS 为主，`types` 目录可用 TS，仅类型定义。
- 规范：按 OpenSpec 文档引用路径规范（文件与行号）。

## Risks / Trade-offs
- 目录波动影响现有导入：提供别名与兼容导出缓冲期。

## Migration Plan
1) 创建目录与 README 占位；
2) 配置路径别名；
3) 渐进迁移通用能力到 `shared/`；
4) 在 CI 增加简单路径检查（可选）。

