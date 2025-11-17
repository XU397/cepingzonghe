# Flow StrictMode 与 g7-tracking 渲染问题需求文档

## 背景

Phase D/E 验收后仍有两项关键技术债务：

1. React StrictMode 仍被迫禁用，导致 Flow 架构无法在双重挂载场景下稳定运行。
2. `g7-tracking-experiment` 子模块内部存在重复 mount/unmount，日均日志量保持在 159 条，显著高于其他模块（57 条）。

本需求文档聚焦两个问题，提供问题描述、现状影响、根因分析以及可执行的解决方案，供后续变更提案与开发实施使用。

---

## 问题一：Flow 子树 StrictMode 兼容性

### 问题描述
- **症状**：一旦在 `src/main.jsx` 开启 `<React.StrictMode>`，Flow 入口 10 秒内会产生日志 2100+ 条，`g4-experiment`、`g7-tracking` 等子模块被不断 mount/unmount。
- **根源**：`FlowAppContextBridge` 每次渲染都会创建新的 `bridgedValue`，加上 StrictMode 双重挂载导致 `AppContext` 的 `contextValue` 引用在初始化阶段持续变化，触发子模块无限重建。

### 业务与技术影响
- **短期**：必须禁用 StrictMode 才能保证 Flow 功能正常，偏离 React 最佳实践；React 无法帮助开发阶段捕捉潜在的副作用/内存泄漏。
- **长远**：任何未来涉及 Flow 的大规模功能迭代或 React 版本升级都缺乏基本的安全网。

### 分析要点
- `FlowAppContextBridge` 需要监听 `AppContext` 中多个字段（currentPageId、计时器、提交方法等）；强行稳定 `contextValue` 引用会让页面无法响应导航。Phase E 已确认“动态性是功能需求”。
- StrictMode 双重渲染放大了 `contextValue` 每次都是新对象的特性，导致 Flow 子模块的 `useEffect`/`useMemo` 反复执行。
- 目前仅通过 `useCallback` 稳定 `navigateToPage` 引用，无法完全阻止 `contextValue` 触发的重算。

### 计量方式与阈值
- **渲染次数 (render count)**：React commit 阶段渲染次数，通过 DEV 计数器记录（即后续自动化脚本断言值）。
- **装载次数 (mount/unmount)**：生命周期挂载/卸载次数，作为渲染异常的辅助指标。
- **日志条数 (log count)**：计数器在控制台输出的统计条数，供人工观察。
- **阈值对齐**（与 OpenSpec 变更 `improve-flow-strictmode-and-tracking` 一致）：
  - Flow/Orchestrator 场景：任意 5 秒窗口内渲染次数 ≤ 100。
  - g7-tracking 子模块：任意 15 秒窗口内渲染次数 ≤ 80。

### 方案与风险评估
> Phase E 结论：`FlowAppContextBridge` 必须跟随 `AppContext.contextValue`，这是功能约束而非简单的性能 Bug。任何方案都要在“保持 AppContext 数据实时性”前提下进行（参考 `docs/PHASE_E_EXECUTION_REPORT.md`）。

1. **方案 D - 局部禁用 StrictMode（过渡，1 天）**
   - 在路由层检测 `/flow/*`，仅对 Flow 子树禁用 StrictMode，其余模块继续使用 StrictMode。
   - 优点：快速获得“传统模块仍受 StrictMode 保护”的收益，便于后续分阶段交付。
   - 缺点：Flow 代码仍旧缺少 StrictMode 覆盖，仅作为临时缓解；需在方案 A 验收完成后删除。

2. **方案 A - 引入独立 FlowContext（主方案，1-2 周）**
   - **目标**：拆分 AppContext 责任域：用户/认证/计时器留在 AppContext，Flow 运行时状态（flowId、当前步骤、编排器实例、心跳、Flow 专用提交 Hook）迁移到 FlowContext。
   - **设计草图**：
     ```
     AppContext (全局) ──> FlowProvider (消费 AppContext 的用户/计时器信息)
                                   │
                                   ├─ FlowContext value:
                                   │    - flowId / definition / progress
                                   │    - orchestratorRef / navigateToNextStep
                                   │    - submitPage / flowContextRef
                                   │    - memoized context value（仅在 flowId/step/progress 等关键字段变化时创建新引用）
                                   │
                                   └─ useFlowContext() 供 FlowModule/submodule/wrapper 使用
     ```
     - FlowProvider 负责创建 orchestrator、维护 progress、调用 `usePageSubmission`。内部通过 `useAppContext()` 获取 batchCode/examNo、计时器状态并向 FlowContext 暴露需要的读权限，同时需通过 `useMemo/useRef` 保证值引用稳定，确保在 StrictMode 双重渲染下不会额外触发子模块 mount/unmount。
     - 计时器：继续在 AppContext 维护，FlowProvider 仅订阅必要字段（remainingTime、questionnaireRemainingTime），避免数据复制；传统模块无需改动。
     - 兼容性：`Grade7Wrapper/Grade4Wrapper` 仍可读取 AppContext 作为后备（FlowContext 不存在时走旧逻辑），从而支持 `/seven-grade` 等传统路由。
     - 向后兼容与回滚：保留 FlowAppContextBridge 与 FlowContext 类型定义，通过 feature flag 切换；如 FlowContext 跑不通，可回滚至旧架构，并保留 FlowContext API 以避免多次重建。
     - 工作量重新估算：设计 0.5 天 + FlowProvider 实现 1 天 + 子模块适配 2 天 + usePageSubmission/Timer 跨 Context 调整 1.5 天 + 测试与文档 2 天 ≈ 7-10 天（含调试），属于 1-2 周工程。
   - **跨 Context 数据提交**：`usePageSubmission` 移入 FlowProvider，`getUserContext` 从 AppContext 读取，`getFlowContext` 从 FlowContext 输出统一结构，保证数据链路仍集中管理。

3. **方案 B - React 19 升级（观察期，2025 Q2 以后）**
   - React 19 的 `use`/自动 memo 化可能降低 Context 重渲染成本，但尚不确定能解决 StrictMode 双重挂载问题；需在 FlowContext 方案落地后或大版本升级窗口再评估。

4. **方案 C - 全局状态管理库（不推荐，≥3 周）**
   - 引入 Zustand/Redux 并不能消除“子模块必须响应状态变化”的本质矛盾，StrictMode 仍会触发双重订阅。
   - 若改写 AppContext 的 1500+ 行逻辑及 50+ 使用方，成本高、收益有限，仅在整体架构重构时评估。

- 可以重新开启 `<React.StrictMode>`，Flow 系统满足 5 秒 ≤ 100 渲染次数（Playwright/MCP 自动断言，日志仅用于调试）。
- Flow 子模块在 StrictMode 下不出现额外 mount/unmount，页面导航与心跳行为与当前稳定版本一致。
- 回归测试覆盖 `/flow/test-flow-1`、`/flow/test-flow-2`、传统模块路由路径，确保 FlowContext 引入后与遗留模块互不影响。

---

## 问题二：`g7-tracking-experiment` 渲染循环（对应 OpenSpec Requirement: Flow 渲染稳定性监控）

### 问题描述
- **症状**：访问包含 g7-tracking 的 Flow（如 `test-flow-2`）时，控制台持续出现 `Submodule mounted/unmounted` 日志，计数稳定在 159 条/15 秒。
- **根源**：TrackingProvider 与页面组件之间的依赖未正确 memo，`useEffect` 监听了大面积 `userContext`/`flowContext` 对象，导致子树频繁重建。

### 业务与技术影响
- 页面体验：子模块不断重渲染会拖慢 UI 响应、动画与计时器，难以保证真实测评时的稳定性。
- 数据风险：高频 mount/unmount 增加了重复提交、心跳噪音和日志噪声的概率，影响问题定位。
- 虽不阻塞当前上线（仅影响使用该子模块的 Flow），但随着 Flow 扩展将放大性能问题。

### 分析要点
- `TrackingProvider` 暴露的 Context 包含大量实时状态（session、operations、计时器），但缺少引用稳定策略。
- 包装器与页面（例如 `Grade7TrackingModule`、`TrackingProvider` 内的 hooks）普遍直接依赖整个 `userContext`、`flowContext` 对象。
- 无独立的渲染计数/性能监控，难以及时发现 regressions。

### 解决方案
1. **依赖梳理与 memo 优化（1 天）**
   - 对 `TrackingProvider`、`Grade7TrackingModule`、关键页面的 `useEffect/useMemo` 逐一列依赖，只监听标量字段，禁止将整个 `userContext`、`flowContext` 放入依赖数组。
   - 使用 `useRef` 缓存上下文或提供 selector 模式，例如：
     ```javascript
     const { examNo, remainingTime } = useFlowContextSelector((ctx) => ({
       examNo: ctx?.user?.examNo,
       remainingTime: ctx?.progress?.remainingTime,
     }));
     ```
2. **渲染计数与报警**
   - 在 DEV 环境引入渲染计数器，仅在 `process.env.NODE_ENV !== 'production'` 时启用，输出格式如：
     ```
     [g7-tracking] window=15s renders=XX mounts=YY threshold=80
     ```
     超过阈值时 `console.warn`，为 Playwright/MCP 解析提供统一格式。
3. **回归脚本**
   - 扩展现有 Playwright/MCP 自动化，在 `test-flow-2` 上统计 15 秒窗口渲染/装载次数并断言 ≤ 80，同时保留原有功能验证。

### 验收标准（以渲染次数断言，日志仅供调试）
- `test-flow-2` 在 DEV+StrictMode（问题一修复后）场景中，15 秒内 g7-tracking 模块渲染次数 ≤ 80（与其他模块同一数量级；日志仅用于调试）。
- 所有 Tracking 页面交互（计时器、问卷、操作记录）功能保持不变，数据提交链路通过 `usePageSubmission` 验证。
- Playwright/MCP 报告新增“g7-tracking 渲染统计”段落，可作为后续回归基准。

---

## 下一步行动（按优先级）
1. ✅ **g7-tracking 渲染优化（已完成）**（独立任务，1-2 天）  
   在当前（非 StrictMode）环境中将渲染次数降至 ≤80（15 秒窗口），不变更 FlowContext 结构，仅聚焦依赖/memo。
2. ✅ **方案 D（局部禁用 StrictMode，已完成）**  
   保障传统模块继续受 StrictMode 保护，为后续 FlowContext 重构腾出时间。
3. 🟡 **方案 A（FlowContext/FlowProvider 重构）**  
   - 进度：Phase 0、Phase 1 已完成；推进 Phase 2/3。
   - 待办拆解：
     - Phase 2：增量迁移调用点（NavigationButton/Wrapper 适配）
     - Phase 3：将 `usePageSubmission` 移入 FlowProvider，并完成跨 Context 依赖对齐
     - Phase 4：StrictMode 恢复验证（5 秒 ≤ 100 渲染）
     - Phase 5：移除 FlowAppContextBridge 依赖
4. 🟡 **StrictMode 全量恢复与自动化扩展**  
   FlowContext 稳定后重新开启 StrictMode（满足 5 秒 ≤ 100 渲染），更新 Playwright/MCP 脚本记录 Flow/g7-tracking 渲染数据。
5. 🟡 **文档与 OpenSpec 同步**  
   每个阶段结束后更新本需求文档与 OpenSpec 变更 `openspec/changes/improve-flow-strictmode-and-tracking`，确保 DEV/QA/PO 共识一致。

---

## 实施进展（Codex Sessions）

1. ✅ g7-tracking 渲染优化（Session: 019a8b98-0850-73e0-90c8-0bd501e6f787）
   - 引入 `stateRef`/`userContextRef` 稳定回调依赖
   - 新增 `useTrackingContextSelector`，支持精细订阅
   - `useDataLogger` 改为标量订阅
   - 结果：渲染次数预期 159 → ≤ 80 次/15 秒

2. ✅ 方案 D：路由级 StrictMode 切换（Session: 019a8b9e-e654-77b1-8387-bc327db7b71c）
   - `src/app/AppShell.jsx`：按路由动态包裹 StrictMode（Flow 子树禁用）
   - `src/main.jsx`：移除全局 StrictMode
   - 配置：`VITE_FLOW_STRICT_MODE_ENABLED=false`（默认禁用 Flow 路径）

3. ✅ DEV 渲染计数告警（Session: 019a8ba5-ace7-75a0-8afb-6d051670e737）
   - `src/shared/utils/RenderCounter.jsx`：通用渲染/装载计数器
   - 阈值：FlowModule 5s ≤ 100；g7-tracking 15s ≤ 80
   - 统一日志格式，便于 Playwright/MCP 解析

4. ✅ FlowProvider Phase 0（Session: 019a8ba9-7834-70c0-91b7-495b2744583b）
   - `src/flows/context/FlowContext.ts`：类型接口
   - `src/flows/context/FlowProvider.jsx`：Provider 初始实现
   - Hooks：`useFlowContext`、`useOptionalFlowContext`

5. ✅ FlowProvider Phase 1（Session: 019a8bad-fefa-7351-a7aa-254cb5e50e6d）
   - FlowModule 集成 FlowProvider
   - 组合包裹：`<FlowProvider>` + `FlowAppContextBridge`
   - 配置：`VITE_FLOW_PROVIDER_ENABLED=true`，`VITE_FLOW_BRIDGE_ENABLED=true`

6. 🟡 后续计划（未完成）
   - Phase 2：增量迁移调用点（NavigationButton/Wrapper 适配）
   - Phase 3：`usePageSubmission` 移入 FlowProvider
   - Phase 4：StrictMode 恢复验证（5 秒 ≤ 100 渲染）
   - Phase 5：移除 Bridge 依赖
