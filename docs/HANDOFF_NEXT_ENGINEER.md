# 工程师交接文档

**项目**: 交互前端多模块评测平台
**变更**: OpenSpec `add-flow-orchestrator-and-cmi`
**当前阶段**: Phase E 失败，需修复 P0 阻塞问题
**交接时间**: 2025-11-15
**上一位工程师**: Claude Code (AI Agent)

---

## ⚠️ 重要提示

**Phase E StrictMode 恢复任务失败**，请优先处理以下 P0 问题：

1. 🔴 **ModuleRouter 序列化错误** - 阻塞所有 Flow 路由
   - 文件: `src/modules/ModuleRouter.jsx:249-255`
   - 错误: `Failed to execute 'replaceState' on 'History': ... could not be cloned.`
   - 修复: 见下方 Task 1

2. 🟡 **StrictMode 渲染循环** - 已回滚，暂不启用
   - 原因: FlowAppContextBridge vs StrictMode 架构冲突
   - 状态: 降级为 P2，等待更好的技术方案

**当前代码状态**: Phase D 稳定版本（StrictMode 禁用，57 条日志）

详细报告: `docs/PHASE_E_EXECUTION_REPORT.md`

---

## 快速开始

### 环境检查

**开发服务器**：
```bash
# 确认服务器运行在 3001 端口
npm run dev
# 访问测试页面
http://localhost:3001/flow/test-flow-1  # ⚠️ 当前会报错，需修复 Task 1
```

**项目状态**：
- ✅ Phase A-D 全部完成
- ✅ P1 渲染循环修复已通过验收（性能提升 98.5%）
- ❌ Phase E StrictMode 恢复失败
- 🔴 P0 阻塞：ModuleRouter 序列化问题
- ⏳ 待完成：修复 Task 1 → pageDesc 验证 → 模块优化

---

## 已完成工作摘要

### Phase A - P0 阻塞项修复（2025-11-14 12:00-13:30）

**核心交付**：
- FlowOrchestrator 最小实现（`src/flows/FlowOrchestrator.js`）
- FlowModule 容器组件（`src/flows/FlowModule.jsx`，600+ 行）
- Mock Flow Definition 端点（`vite.config.js`）
- 修复循环依赖 bug（logFlowContext/moveToNextStep）

**Codex Sessions**:
- A.1: `019a824f-1970-7830`
- A.2: `019a8259-ac44-7831`
- A.3: `019a825f-6114-7803`
- A.4: `019a8269-f939-7030`
- A.6: `019a829d-59ff-7310`

---

### Phase B - Mock userContext 与认证（2025-11-14 13:40-14:45）

**核心修复**：
- 问题：DEV 环境显示登录页而非实验内容
- 根本原因：创建 userContext ≠ 设置认证状态
- 解决方案：
  - Mock userContext fallback（`FlowModule.jsx:239-261`）
  - 调用 `handleLoginSuccess` 设置认证（`FlowModule.jsx:263-285`）

**Codex Session**: `019a82ba-9f1e-7231`

---

### Phase C - P2 端到端验证（2025-11-14 14:50-15:10）

**验证结果**（部分完成 3/4）：
- ✅ Remount 行为：功能正常
- ✅ 进度持久化：`flow.<id>.*` 正确隔离
- ✅ 刷新恢复：页面状态、计时器、认证均正确恢复
- ❌ pageDesc 前缀：被渲染循环阻塞，待修复后验证

**发现问题**：严重渲染循环（3700+ unmount/mount 日志）

---

### Phase D - P1 渲染循环修复（2025-11-14 15:50-16:30）✅

**根本原因**：
```
AppContext.contextValue 未 memoize
→ 每次渲染创建新对象
→ appContext 引用变化
→ effectiveUserContext 重算
→ contextFlowId 变化
→ initialResolvedFlowId 变化
→ useEffect 触发 setFlowId
→ 重渲染 → 回到起点（无限循环）
```

**修复方案（双层防御）**：

**Layer 1 - FlowModule 稳定化**（`src/flows/FlowModule.jsx:293-312`）：
```javascript
// 修复前：每次渲染都重新计算
const initialResolvedFlowId = flowIdProp || routeFlowId || contextFlowId || null;
useEffect(() => {
  setFlowId(initialResolvedFlowId || null); // ❌ 无条件更新
}, [initialResolvedFlowId]);

// 修复后：useMemo + 双重检查
const initialResolvedFlowId = useMemo(
  () => flowIdProp || routeFlowId || contextFlowId || null,
  [flowIdProp, routeFlowId, contextFlowId]
);

const lastResolvedFlowIdRef = useRef(initialResolvedFlowId);
useEffect(() => {
  const nextFlowId = initialResolvedFlowId || null;
  if (lastResolvedFlowIdRef.current === nextFlowId && flowId === nextFlowId) {
    return; // ✅ 双重检查，早退
  }
  lastResolvedFlowIdRef.current = nextFlowId;
  if (nextFlowId !== flowId) {
    setFlowId(nextFlowId); // ✅ 仅真正变化时更新
  }
}, [flowId, initialResolvedFlowId]);
```

**Layer 2 - AppContext 优化**（`src/context/AppContext.jsx:976,1436`）：
```javascript
// 修复前：每次渲染新对象
const login = (bCode, eNo) => { ... };
const contextValue = { currentPageId, login, /* ... */ };

// 修复后：useCallback + useMemo
const login = useCallback((bCode, eNo) => { ... }, []);
const contextValue = useMemo(() => ({
  currentPageId,
  login,
  // ... 50+ 个属性
}), [
  // 完整依赖数组（54个依赖）
  authToken, batchCode, /* ... */
]);
```

**验收结果**（自动化 - Chrome DevTools MCP）：
| 验证项 | 预期 | 实际 | 状态 |
|--------|------|------|------|
| V1 - 渲染循环 | <100 条 | **57 条** | ✅ |
| V2 - 页面显示 | 完整 | 完整 | ✅ |
| V3 - Remount | 正常 | 正常 | ✅ |
| V4 - 进度隔离 | 隔离 | 隔离 | ✅ |
| V5 - 代码质量 | 最佳实践 | 符合 | ✅ |

**性能提升**: 从 3700+ 降至 57 条日志（**98.5% 提升**）

**Codex Sessions**:
- D.1: `019a830e-853a-7413`
- D.2: `019a8314-6831-75b3`

**详细验收报告**: `docs/PHASE_D_VERIFICATION_REPORT.md`

---

## 待完成任务

### 🔴 P1 - 立即执行（优先级最高）

#### Task 1: 恢复 StrictMode ⏱️ 预计 10 分钟

**目的**: 确保代码在 React 18 StrictMode 下正常工作，避免隐藏的副作用问题

**步骤**:
1. 编辑 `src/main.jsx`
2. 取消注释 `<React.StrictMode>` 包装：
   ```javascript
   // 修改前
   root.render(
     // <React.StrictMode>
       <AppShell />
     // </React.StrictMode>
   );

   // 修改后
   root.render(
     <React.StrictMode>
       <AppShell />
     </React.StrictMode>
   );
   ```
3. 重启开发服务器：`npm run dev`
4. 访问 `http://localhost:3001/flow/test-flow-1`
5. 验证无回归：
   - 日志量应保持 <150 条（双重挂载会略增）
   - 无新的 unmount/mount 循环
   - 页面功能正常

**验收标准**:
- ✅ StrictMode 启用后日志 <150 条
- ✅ 无新的渲染循环
- ✅ 所有功能正常

**如遇问题**:
- 检查是否有新的依赖数组遗漏
- 使用 React DevTools Profiler 定位重渲染源
- 参考 Phase D 修复方案，添加必要的 useMemo/useCallback

---

#### Task 2: pageDesc 前缀验证 ⏱️ 预计 10 分钟

**目的**: 确认提交数据包含 `[flowId/submoduleId/stepIndex]` 前缀

**步骤**:
1. 访问 `http://localhost:3001/flow/test-flow-1`
2. 打开 DevTools → Network 面板
3. 勾选"我已阅读并理解上述注意事项"复选框
4. 点击"继续"按钮
5. 在下一页点击"下一步"触发数据提交
6. 在 Network 面板中找到 `POST /stu/saveHcMark` 请求
7. 查看 Request Payload → `mark` → `pageDesc`

**预期格式**:
```json
{
  "pageDesc": "[test-flow-1/g7-experiment/0] 注意事项"
}
```
或类似的前缀格式（包含 flowId、submoduleId、stepIndex）

**验收标准**:
- ✅ pageDesc 包含前缀
- ✅ 前缀格式正确
- ✅ flowId、submoduleId、stepIndex 值正确

**代码位置**:
- 前缀逻辑：`src/shared/services/submission/pageDescUtils.js`
- 桥接配置：`src/modules/grade-7/wrapper.jsx:105-112`（getFlowContext 函数）

**如遇问题**:
- 确认 `getFlowContext` 函数存在且返回正确值
- 检查提交服务是否调用 `enhancePageDesc`
- 查看 Console 日志中的提交数据

---

### 🟡 P2 - 后续优化（非阻塞）

#### Task 3: 修复 g7-tracking-experiment 渲染循环 ⏱️ 预计 2 小时

**现象**: 该模块在 test-flow-2 中产生 159 条日志（vs test-flow-1 的 57 条）

**根本原因**: 模块内部的依赖管理问题（与 FlowModule 无关）

**修复方案**: 参考 Phase D 修复，检查以下文件：
- `src/modules/grade-7-tracking/context/TrackingProvider.jsx`
- `src/modules/grade-7-tracking/pages/*.jsx`
- `src/modules/grade-7-tracking/hooks/*.js`

**关键点**:
1. 查找未 memoize 的对象/数组/函数
2. 添加 `useMemo` 稳定对象引用
3. 添加 `useCallback` 稳定函数引用
4. 确保依赖数组完整（ESLint 检查）

**验收标准**:
- test-flow-2 日志量降至 <100 条
- 无重复 unmount/mount 模式

---

#### Task 4: 补充 tasks.md 遗留任务 ⏱️ 预计 2 小时

**待完成项**:
- Task 0.2 - Orchestrator 生命周期（防跨 Flow 复用）
- Task 0.5 - Registry 完整性验证
- Task 1.3 - 进度持久化验证

**参考文件**:
- `openspec/changes/add-flow-orchestrator-and-cmi/tasks.md`

---

## 关键文件索引

### 核心代码

| 文件 | 描述 | 最后修改 |
|------|------|---------|
| `src/flows/FlowModule.jsx` | Flow 容器组件（Phase D 修复） | 2025-11-14 |
| `src/flows/FlowOrchestrator.js` | 编排器占位实现 | 2025-11-14 |
| `src/context/AppContext.jsx` | 全局上下文（Phase D 优化） | 2025-11-14 |
| `src/modules/grade-7/wrapper.jsx` | 7年级包装器（flowContext 桥接） | 2025-11-14 |
| `vite.config.js` | Mock API 端点 | 2025-11-14 |

### 文档

| 文件 | 描述 |
|------|------|
| `docs/IMPLEMENTATION_PROGRESS.md` | 完整实施进度（Phase A-D） |
| `docs/PHASE_D_VERIFICATION_REPORT.md` | Phase D 自动化验收报告 |
| `openspec/changes/.../tasks.md` | 任务清单与验收记录 |
| `docs/HANDOFF_NEXT_ENGINEER.md` | 本交接文档 |

---

## Codex AI 使用指南

本项目使用 **Codex CLI** 执行复杂代码修改。

**调用方式**:
```bash
uv run ~/.claude/skills/codex/scripts/codex.py "<task>" [model] [working_dir]
```

**示例**:
```bash
# FlowModule 修复（Phase D）
uv run ~/.claude/skills/codex/scripts/codex.py \
  "修复 FlowModule.jsx 中的无限渲染循环..." \
  "gpt-5.1-codex" \
  "/mnt/d/myproject/cp"
```

**恢复会话**:
```bash
uv run ~/.claude/skills/codex/scripts/codex.py \
  resume 019a830e-853a-7413 \
  "继续修复..." \
  "gpt-5.1-codex"
```

**Session 记录**（参考）:
- FlowModule 修复: `019a830e-853a-7413`
- AppContext 优化: `019a8314-6831-75b3`

---

## 环境信息

**开发环境**:
- Node.js + npm
- Vite 4.5
- React 18.2
- WSL2 环境

**关键端口**:
- 开发服务器: `http://localhost:3001`（如果 3000 被占用）
- Mock API: 已集成在 Vite 中间件

**测试 URL**:
- test-flow-1: `http://localhost:3001/flow/test-flow-1` (g7-experiment + g4-experiment)
- test-flow-2: `http://localhost:3001/flow/test-flow-2` (g7-tracking-experiment + g7-tracking-questionnaire)

---

## 故障排查

### 问题: 页面显示登录页

**可能原因**: Mock 认证未生效

**解决方案**:
1. 检查 Console 是否有 "[FlowModule] Setting mock authentication" 日志
2. 确认 `src/flows/FlowModule.jsx:263-285` 的 useEffect 存在
3. 重启开发服务器

---

### 问题: 渲染循环回归

**可能原因**: 新增代码未遵循 memoization 原则

**解决方案**:
1. 检查是否有新的对象/数组/函数每次渲染都重新创建
2. 使用 React DevTools Profiler 定位重渲染源
3. 添加必要的 useMemo/useCallback
4. 参考 `docs/PHASE_D_VERIFICATION_REPORT.md` 的修复方案

---

### 问题: Codex 超时

**解决方案**:
1. 确认 `uv` 已安装：`uv --version`
2. 增加超时时间：设置环境变量 `CODEX_TIMEOUT=3600000`（1小时）
3. 分解任务为更小的步骤

---

## 技术债务清单

### ✅ 已解决

1. Mock userContext 未设置认证（Phase B）
2. 渲染循环（Phase D）

### ⚠️ 待解决

1. **StrictMode 已禁用** [P1] - Task 1
2. **g7-tracking-experiment 渲染循环** [P2] - Task 3
3. **仅 DEV 环境验证** [P3] - 需后端支持

---

## 联系信息

**上一位工程师**: Claude Code (AI Agent)
**交接时间**: 2025-11-14 16:35 UTC
**项目文档**: `docs/`、`openspec/changes/add-flow-orchestrator-and-cmi/`

**遇到问题时**:
1. 查看 `docs/IMPLEMENTATION_PROGRESS.md` 了解历史背景
2. 查看 `docs/PHASE_D_VERIFICATION_REPORT.md` 了解修复细节
3. 查看 Console 日志诊断问题
4. 使用 React DevTools Profiler 定位性能问题

---

**祝工作顺利！** 🚀

如有疑问，请参考上述文档或查看代码注释。
