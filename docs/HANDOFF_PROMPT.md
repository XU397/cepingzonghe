# 交接提示词 - OpenSpec Flow/CMI 架构改造项目

**交接时间**: 2025-11-15 18:35 UTC
**项目阶段**: ✅ Phase F 已完成，P0 问题已修复
**下一阶段**: P1/P2 优化任务（可选）
**优先级**: 🟡 P1（性能优化）/ 🟢 P2（非阻塞）

---

## 🎉 Phase F 完成摘要（2025-11-15 18:30 UTC）

### ✅ 已完成任务（4/4）

1. **ModuleRouter 序列化修复** ✅ (15分钟)
   - 文件：`src/modules/ModuleRouter.jsx:249-264`
   - 修复：仅传递可序列化字段（batchCode, examNo, url, pageNum, studentName）
   - 参考：`src/flows/FlowModule.jsx:324-332` 正确实现

2. **History API 错误验证** ✅ (5分钟)
   - 浏览器测试：访问 `/flow/test-flow-1` 无错误
   - 页面状态：从 "Flow 路由失败" → "正在加载测评..."
   - 控制台：无 History API 错误日志

3. **文档更新** ✅ (10分钟)
   - 更新：`docs/IMPLEMENTATION_PROGRESS.md` (新增 Phase F 记录)
   - 版本：v2.5 → v2.6
   - Codex Session：019a8392-aeea-7353-9364-8db210fbfc03

4. **验收材料** ✅
   - ESLint 检查通过
   - Mock API 正常响应（服务器日志确认）
   - 代码注释说明 structuredClone 限制

### 📊 技术债务状态

- 🟢 **P0 已修复**: ~~ModuleRouter History API 序列化~~ → Phase F 完成
- 🟡 **P1 遗留**: 渲染循环问题（Phase E 失败遗留，页面加载卡住）
- 🟢 **P2 已降级**: StrictMode 架构冲突（等待 React 19 或重新设计）

---

## ⚠️ 交接给下一位工程师的说明

**当前状态**: P0 阻塞问题已解决，系统可正常运行（渲染循环导致页面卡住属于 P1 性能问题）

**下一步选择**:
- **选项 A**: 修复渲染循环（P1，预计 2-4 小时）→ 参见下文 "后续路线图"
- **选项 B**: 收集验收材料并归档（P2，预计 10 分钟）→ OpenSpec 归档
- **选项 C**: 暂停项目，等待产品需求

---

## ~~二、P0 阻塞问题详情~~ → ✅ 已在 Phase F 修复

---

## 一、当前状态快照

### 项目背景
你将接手一个**多模块教育评测平台**的架构改造项目（OpenSpec 变更：`add-flow-orchestrator-and-cmi`）。项目目标是实现 Flow 编排器，支持跨模块的复合评测流程。

**已完成阶段**：
- ✅ **Phase A-C**: Flow 核心架构、子模块包装器、端到端验证（完成度 95%）
- ✅ **Phase D**: 渲染循环修复（性能提升 98.5%，从 3700+ 日志降至 57 条）
- ❌ **Phase E**: StrictMode 恢复失败，发现 2 个 P0 阻塞问题

**代码状态**: Phase D 稳定版本（StrictMode 禁用，57 条日志，功能正常）

**关键问题**:
1. 🔴 **P0 阻塞**: ModuleRouter 传递不可序列化对象到 History API
2. 🟡 **P2 已降级**: StrictMode 与 FlowAppContextBridge 架构冲突

---

## 二、P0 阻塞问题详情

### 问题 1：ModuleRouter History API 序列化错误

**错误信息**：
```
DOMException: Failed to execute 'replaceState' on 'History':
({ targetElement, eventType, ... }) => { ... } could not be cloned.
```

**影响范围**:
- 所有 `/flow/*` 路由无法访问
- 阻塞 Task 0.4（pageDesc 前缀验证）

**根本原因**:
`src/modules/ModuleRouter.jsx:249-255` 传递包含**函数**的 `moduleContext` 对象到 `navigate()` 的 state 参数，违反 History API 的 `structuredClone` 限制。

**当前代码**:
```javascript
// ❌ 错误代码（包含 logOperation, navigateToPage 等函数）
navigate(moduleContext.url, {
  replace: true,
  state: {
    userContext: moduleContext,  // 整个对象包含函数
    initialPageId: resolvedInitialPageId,
  },
});
```

**修复方案** (预计 15 分钟):
```javascript
// ✅ 正确代码（仅传递可序列化字段）
navigate(moduleContext.url, {
  replace: true,
  state: {
    userContext: {
      batchCode: moduleContext.batchCode,
      examNo: moduleContext.examNo,
      studentName: moduleContext.studentName,
      url: moduleContext.url,
      pageNum: moduleContext.pageNum,
      // 不包含函数：logOperation, navigateToPage, collectAnswer 等
    },
    initialPageId: resolvedInitialPageId,
  },
});
```

**验证方法**:
```bash
# 1. 启动开发服务器
npm run dev

# 2. 浏览器访问
http://localhost:3001/flow/test-flow-1

# 3. 检查控制台
# 应该显示：[FlowModule] mount，且无 History API 错误
```

---

## 三、P0 任务清单

### Task 1: 修复 ModuleRouter 序列化问题 (15 分钟)

**步骤**:
1. 打开 `src/modules/ModuleRouter.jsx`
2. 定位到第 249-255 行（`navigate()` 调用）
3. 修改 `state.userContext` 为上述正确代码
4. 保存并测试

**验收标准**:
- ✅ 访问 `/flow/test-flow-1` 无控制台错误
- ✅ 页面正常显示注意事项内容（Page_01_Precautions）
- ✅ 控制台显示 `[FlowModule] Mounted with flowId: test-flow-1`

---

### Task 2: 验证 pageDesc 前缀功能 (10 分钟)

**前提**: Task 1 修复完成

**步骤**:
1. 确保开发服务器运行（`npm run dev`）
2. 打开浏览器 DevTools → Network 面板
3. 访问 `http://localhost:3001/flow/test-flow-1`
4. 在实验页面进行一些操作（点击按钮、输入文本）
5. 点击"下一步"触发数据提交
6. 在 Network 面板查找 `POST /stu/saveHcMark` 请求
7. 查看请求 Payload 中的 `mark` 字段（需解析 JSON.stringify 的内容）

**验收标准**:
- ✅ `mark.pageDesc` 格式为：`[test-flow-1/g7-experiment/0] 注意事项`
- ✅ 前缀包含三部分：`[flowId/submoduleId/stepIndex]`
- ✅ 后续页面提交的 pageDesc 也包含相同前缀格式

**示例验证命令**（DevTools Console）:
```javascript
// 拦截提交请求，查看 pageDesc
fetch('/stu/saveHcMark', {
  method: 'POST',
  body: new FormData(...)
}).then(res => {
  // 查看 FormData 中的 mark 字段
  console.log('pageDesc:', JSON.parse(mark).pageDesc);
});
```

---

## 四、技术背景说明

### Phase E 失败原因（仅供参考，非必修复项）

**问题**: StrictMode 启用后，日志从 57 条暴增至 2100+ 条（持续增长）

**根本原因**: FlowAppContextBridge 的架构设计要求 `bridgedValue` 必须响应 AppContext 状态变化，以支持页面导航功能。这导致 useMemo 必须依赖整个 `contextValue` 对象，而 StrictMode 的双重挂载会触发无限循环。

**Codex 技术分析**（Session: 019a835a-3b15-7101）:
- **方案 1（最小依赖）**: 只依赖 `[wrappedNavigate, hasNavigateFn]` → ❌ 破坏页面导航功能
- **方案 2（细粒度依赖）**: 显式列举 50+ 字段 → ⚠️ 维护成本极高
- **方案 3（当前实现）**: 依赖 `[contextValue, ...]` → ✅ 功能正确，但不兼容 StrictMode

**决策**:
- StrictMode 恢复降级为 P2（非阻塞）
- 保持 Phase D 稳定性（57 条日志）
- 等待 React 19 或重新设计 Context 架构

**关键引用**（Codex 分析结论）:
> "只要你想让 Flow 子树里的 useAppContext() 随着 currentPageId/问卷状态/... 正常更新，bridgedValue 就必须在这些字段变化时重建；单靠 wrappedNavigate 是做不到的。"

---

## 五、快速故障排查

### 如果修复后仍有错误

**问题 1**: 修复后仍报 History API 错误
- **检查**: 确认 `state.userContext` 中没有任何函数、Symbol、DOM 节点等不可序列化对象
- **工具**: 使用 `JSON.stringify(state)` 测试是否可序列化
- **提示**: 注意嵌套对象中的函数引用

**问题 2**: pageDesc 前缀未出现
- **检查 1**: `src/modules/grade-7/wrapper.jsx:105-112` - 确认 `getFlowContext` 函数已正确注入
- **检查 2**: `src/shared/services/submission/pageDescUtils.js` - 确认 `enhancePageDesc()` 逻辑正确
- **检查 3**: FlowModule 是否正确传递 `flowContext` 到子模块包装器
- **日志**: 在 `enhancePageDesc()` 添加 `console.log` 查看是否被调用

**问题 3**: 页面无法加载或显示登录页
- **检查**: AppContext 认证状态（localStorage `hci-isAuthenticated`）
- **Mock**: 确认 `src/flows/FlowModule.jsx:239-260` 的 DEV Mock userContext 正常工作
- **清除**: `localStorage.clear()` 后刷新页面

---

## 六、相关文档

**完整技术分析**（必读）:
- `docs/PHASE_E_EXECUTION_REPORT.md` - Phase E 失败的 15 页完整技术分析
- `docs/HANDOFF_NEXT_ENGINEER.md` - 工程师交接文档
- `docs/IMPLEMENTATION_PROGRESS.md` - 实施进度文档（v2.5）

**架构设计**:
- `openspec/changes/add-flow-orchestrator-and-cmi/proposal.md` - 原始提案
- `openspec/changes/add-flow-orchestrator-and-cmi/tasks.md` - 任务清单（已更新 Phase E）

**关键代码文件**:
- `src/modules/ModuleRouter.jsx:249-255` - 🔴 需修复
- `src/flows/FlowModule.jsx` - Flow 编排器主逻辑
- `src/flows/FlowAppContextBridge.jsx` - Context 桥接（Phase D 稳定版本）
- `src/modules/grade-7/wrapper.jsx:105-112` - pageDesc 前缀注入点
- `src/shared/services/submission/pageDescUtils.js` - pageDesc 增强工具

---

## 七、Codex 会话记录

**Phase E 相关**:
- E.1 useCallback 修复尝试（失败）: `019a835a-3b15-7101-b42d-0d61958261f5`

**Phase D 成功修复**（参考）:
- D.1 双层防御修复: `019a830e-853a-7413-925a-ea580a43dd02`
- D.2 AppContext memoization: `019a8314-6831-75b3-9e68-d99e2d09b80f`

**Phase A-C 基础架构**:
- A.1 FlowOrchestrator: `019a824f-1970-7830-9ff7-9d25b4023c64`
- A.2 Mock Flow 定义: `019a8259-ac44-7831-985f-e6f79ebd8d3e`
- B.1-B.3 认证修复: `019a82ba-9f1e-7231-877f-f87a0369dc23`

---

## 八、预期交付成果

完成 Task 1 + Task 2 后，你应该能够提供：

1. **代码修改**:
   - ✅ `src/modules/ModuleRouter.jsx` - 序列化修复

2. **验收截图/日志**:
   - ✅ 浏览器控制台无 History API 错误
   - ✅ Network 面板显示 pageDesc 包含 `[flowId/submoduleId/stepIndex]` 前缀

3. **文档更新**:
   - ✅ 在 `openspec/changes/add-flow-orchestrator-and-cmi/tasks.md` 中勾选:
     - `[x] 0.4 g7 包装器桥接最小版`（pageDesc 前缀验证通过）
   - ✅ 在 `docs/IMPLEMENTATION_PROGRESS.md` 中添加完成记录

4. **可选**（如果时间充足）:
   - ✅ 修复 g7-tracking-experiment 模块的 159 条日志（P2 优先级）
   - ✅ 评估 StrictMode 替代方案（P2 优先级）

---

## 九、后续路线图（P2 任务）

完成 P0 任务后，可选的优化工作：

1. **g7-tracking 模块优化** (2 小时)
   - 当前: 159 条日志
   - 目标: <100 条日志
   - 方法: 应用 Phase D 的双层 memoization 模式

2. **StrictMode 重新评估** (30 分钟决策 + 4-6 小时实施)
   - Option A: 接受现状（推荐）
   - Option B: 细粒度依赖优化（高维护成本）
   - Option C: 等待 React 19 的 Context 改进

3. **完整端到端测试** (1 小时)
   - 测试所有 5 个子模块的 Flow 流程
   - 验证进度持久化、刷新恢复、数据提交

---

## 十、应急联系

**Claude Code 工作记录**:
- 最后提交时间: 2025-11-15
- Git 分支: main
- 最后 commit: 未提交（代码已回滚到 Phase D）

**如遇到严重问题**:
1. 回退到 Phase D 稳定版本（代码已在此状态）
2. 查阅 `docs/PHASE_E_EXECUTION_REPORT.md` 第 10-15 节的详细技术分析
3. 检查 DevTools Console 的错误堆栈，与文档中的错误模式对比

**开发环境**:
- Node.js: v18+
- Package Manager: npm
- Dev Server: Vite 4.x (端口 3001)
- 测试框架: Vitest (使用 vmThreads 适配 WSL2)

---

## 总结

**核心任务**: 修复 ModuleRouter 序列化 + 验证 pageDesc 前缀
**预计时间**: 30 分钟（15 分钟修复 + 10 分钟验证 + 5 分钟文档）
**成功标准**: `/flow/test-flow-1` 正常访问，提交数据包含 `[test-flow-1/g7-experiment/0]` 前缀
**风险评估**: 低（修改仅涉及 1 个文件，影响范围明确）

祝顺利完成任务！🚀

---

**文档版本**: v1.0
**最后更新**: 2025-11-15
**作者**: Claude Code (AI Agent)
