# 项目规范（OpenSpec 项目说明）

本文件描述评测平台的通用约定与开发规范，作为 OpenSpec 提案与规格的基础上下文。规范分为：术语与对象、命名与键名、模块约定、计时与导航、数据提交与错误处理、状态持久化、开发与调试。

## 术语与对象
- 模块（Module）：一个可登录进入的评测单元（例如：四年级火车购票、七年级蒸馒头、七年级追踪-蜂蜜黏度）。
- 子模块（Submodule）：在同一模块内部的“交互部分”或“问卷部分”。
- 页面（Page）：模块内最小展示与互动单元，具有唯一 `pageId` 与逻辑页码 `pageNumber`。
- 评测流（Flow）：若干子模块按顺序拼接形成的完整流程（未来能力，由提案引入）。

## 命名约定
- 模块标识：`moduleId` 使用短横线小写（示例：`grade-4`、`grade-7`、`grade-7-tracking`）。
- 模块 URL：形如 `/<moduleId-或别名>`（示例：`/four-grade`、`/seven-grade`、`/grade-7-tracking`）。
- 页面 ID：平台统一命名（示例：`Page_01_Precautions`、`Page_19_Task_Completion`、`Page_20_Questionnaire_Intro`）。
- 复合页码：为拼装流预留格式（示例：`M2:11` 或 `2.11` 表示“第2个子模块的第11页”）。

## 本地存储键名（命名空间）
- 核心键（平台级）：
  - `core.auth/isAuthenticated`
  - `core.auth/currentUser`
  - `core.page/currentPageId`
  - `core.page/pageNum`（向后兼容 `modulePageNum`/`hci-pageNum`）
  - `core.timer/taskStartTime`、`core.timer/remainingTime`
  - `core.timer/questionnaireStartTime`、`core.timer/questionnaireRemainingTime`
  - `core.session/lastSessionEndTime`
  - `core.module/url`
- 模块命名空间：`module.<moduleId>.*`（示例：`module.grade-7-tracking/tracking_session` 等）。
- 评测流命名空间（预留）：`flow.<flowId>.*`。

## 模块约定
- 模块注册：通过 `ModuleRegistry` 注册，要求字段：`moduleId`、`displayName`、`url`、`version`、`ModuleComponent`、`getInitialPage(pageNum)`，可选 `onInitialize/onDestroy/getFeatures`。
- 登录与路由：后端登录返回 `{ url, pageNum }` 或兼容结构，前端通过 `ModuleRouter` 定位模块，并依 `getInitialPage(pageNum)` 计算落地页面。
- 页面映射：使用统一的 `pageInfoMapping/pageNumToPageIdMapping`（或模块自有同等功能）来保证编号与页面 ID 的稳定映射。

## 计时与导航
- 计时维度：
  - 主任务计时（默认 40 分钟）
  - 问卷计时（默认 10 分钟）
  - 注意事项阅读倒计时（常用 40 秒，可选）
- 导航模式：`hidden`、`experiment`、`questionnaire` 三种模式对应不同导航展示与计时来源。
- 超时策略：
  - 主任务阶段超时 → 自动跳转至该子模块的总结/完成页。
  - 问卷阶段超时 → 自动跳转至问卷完成页。
  - 触发只执行一次（需并发保护）。

## 数据提交与错误处理
- 提交协议：使用 `submitPageMarkData(payload)`，其中 `payload = { batchCode, examNo, mark }`，`mark` 为标准化的 MarkObject（见 specs/assessment-core）。
- 失败处理：
  - 401/会话过期：统一执行集中式 `handleSessionExpired`，清空状态并返回登录页。
  - 其他错误：可指数回退重试；用户可见提示，生产环境默认阻止继续导航（可配置）。

## 状态持久化与恢复
- 刷新：必须保持在当前页面，计时器不重置（按离线时间扣减后继续）。
- 账号切换：跨账号恢复需校验考号/账号一致，不一致时清理旧数据后重建状态。
- 恢复维度：当前模块 URL、页面编号（或 ID）、计时器、问卷状态（开始/剩余/完成）、必要的模块内部状态。

## 开发与调试
- 开发模式（DEV）：
  - 可用“开发模块选择器”快速设置 `{ url, pageNum }` 体验模块。
  - 可选择“跳过提交继续导航”（仅 DEV）。
  - 调试浮标显示当前模块、页面与步骤信息。
- 记录：关键流程（提交、导航、计时器开关、超时跳转）须打印结构化日志（前缀含模块与类名），便于问题定位。

## 兼容性与迁移
- 键名兼容：读取旧键，写入新键；在两到三个版本后逐步移除旧键。
- 行为兼容：在模块内部先以包装器适配统一计时与提交，再渐进式替换旧实现。

