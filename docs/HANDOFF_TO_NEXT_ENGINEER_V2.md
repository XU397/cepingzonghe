# 任务交接文档 v2.0

**项目**：HCI-Evaluation Flow Orchestrator & CMI 集成
**OpenSpec 变更**：`add-flow-orchestrator-and-cmi`
**交接时间**：2025-11-15
**当前状态**：Phase H 部分完成，存在 P0 阻塞问题
**预计剩余工作量**：1-2 小时（P0 修复 + 验收）

---

## 📋 执行摘要

### ✅ 已完成的工作（Phase A-H）

#### Phase A-D: 核心基础设施（已完成 ✅）
1. **FlowOrchestrator 实现**
   - 文件：`src/flows/FlowOrchestrator.ts`
   - 功能：Flow 定义加载、进度管理、步骤切换
   - 验证：Phase C 浏览器测试通过

2. **FlowModule 组件**
   - 文件：`src/flows/FlowModule.jsx`
   - 功能：`/flow/:flowId` 路由处理、子模块加载、进度持久化
   - 验证：remount 行为正常，localStorage 隔离完成

3. **5个子模块包装器**
   - g7-experiment, g7-questionnaire, g7-tracking-experiment, g7-tracking-questionnaire, g4-experiment
   - 功能：flowContext 桥接、回调注入
   - 验证：代码审查通过

4. **渲染循环优化**
   - Phase D: 从 3700+ 日志降至 57 条（98.5% 性能提升）
   - 修复：FlowModule + AppContext memoization
   - 验证：浏览器测试通过

#### Phase E: StrictMode 恢复（失败 ❌ → 已降级为 P2）
- **决策**：因架构冲突回滚，已禁用 StrictMode
- **技术债务**：已在 `docs/IMPLEMENTATION_PROGRESS.md:2299-2474` 制定缓解计划
- **影响**：不阻塞生产部署，已文档化

#### Phase F-G: 数据提交管道（已完成 ✅）
- 统一提交 Hook：`src/shared/services/submission/usePageSubmission.js`
- Flow 上下文注入：`getFlowContext` 回调
- 验证：DEV 模式可放行、PROD 阻断逻辑正常

#### Phase H: pageDesc 前缀功能（⚠️ 部分完成）

**已完成**：
1. ✅ **代码逻辑实现**
   - `FlowModule.jsx:797-807` - 条件构造 flowContext
   - `AppContext.jsx:55-65` - setFlowContext 深度比较
   - `FlowAppContextBridge.jsx` - 优化依赖，消除抖动
   - `usePageSubmission.js:235-249` - pageDesc 增强逻辑
   - `vite.config.js:116` - Mock API 返回 Flow URL

2. ✅ **控制台验证**
   - 日志显示：`[test-flow-1/g7-experiment/0] 注意事项`
   - flow_context 事件正确记录（对象格式）
   - 调用链路完整：FlowModule → AppContextBridge → AppContext → usePageSubmission

3. ✅ **性能优化**
   - 修复无限渲染循环（Codex Session: 019a884d-1371, 019a8856-1a2e）
   - FlowModule 渲染间隔从毫秒级降至 1秒（计时器驱动，正常）
   - 不再有频繁 unmount/mount 抖动

**未完成**：
- ❌ **真实网络请求验收**（P0 阻塞）
  - 未检查 Network 面板的 `saveHcMark` 请求 payload
  - 未验证真实提交数据中 pageDesc 格式
  - 原因：被 ModuleRouter 序列化问题阻塞（见下文）

---

## 🔴 当前阻塞问题（P0 - 必须修复）

### 问题 1: ModuleRouter 序列化错误

**文件**：`src/modules/ModuleRouter.jsx:249-255`

**错误现象**：
```
Failed to execute 'replaceState' on 'History':
... could not be cloned.
```

**根本原因**：
```javascript
// ModuleRouter.jsx:249-255
navigate(resolvedPath, {
  state: {
    userContext: effectiveUserContext,  // ← 包含函数，无法序列化
  },
});
```

**影响范围**：
- 访问 `/flow/*` 路由时报错
- 阻塞 pageDesc 网络验收测试

**修复方案**（预计 15 分钟）：
```javascript
// 只传递可序列化的字段
navigate(resolvedPath, {
  state: {
    userContext: {
      batchCode: effectiveUserContext?.batchCode,
      examNo: effectiveUserContext?.examNo,
      url: effectiveUserContext?.url || effectiveUserContext?.moduleUrl,
      pageNum: effectiveUserContext?.pageNum,
      studentName: effectiveUserContext?.studentName,
    },
  },
});
```

**验证方法**：
1. 访问 `http://localhost:3000/flow/test-flow-1`
2. 控制台不应出现 `replaceState` 错误
3. FlowModule 正常渲染

---

### 问题 2: pageDesc 网络验收未执行

**状态**：代码已就绪，等待 P0 问题修复后执行

**验收步骤**（预计 10 分钟）：
1. 修复问题 1 后访问 `http://localhost:3000/flow/test-flow-1`
2. 打开浏览器 DevTools → Network 面板 → 筛选 `saveHcMark`
3. 登录（批次号 `250619`，考号 `1001`）
4. 完成流程：开始流程 → 阅读材料 → 注意事项（勾选复选框，等待倒计时 40秒）→ 点击"继续"
5. 在下一页触发提交，查看 Network 请求
6. **验证 payload 中 `mark.pageDesc` 格式**：
   ```json
   {
     "mark": "{\"pageDesc\":\"[test-flow-1/g7-experiment/0] 注意事项\", ...}"
   }
   ```

**预期结果**：
- ✅ pageDesc 包含前缀：`[flowId/submoduleId/stepIndex] 原始描述`
- ✅ operationList 包含 flow_context 事件（对象格式）

**如果失败**：
- 检查控制台是否有 `[usePageSubmission] pageDesc after enhancement` 日志
- 检查 `[AppContext] getFlowContext called` 是否返回有效对象
- 参考 `docs/MANUAL_VERIFICATION_GUIDE.md` 详细步骤

---

## 📝 待完成任务清单

### P0 阻塞任务（必须完成）

- [ ] **修复 ModuleRouter 序列化问题**（预计 15 分钟）
  - 文件：`src/modules/ModuleRouter.jsx:249-255`
  - 方案：见上文"修复方案"
  - 验证：浏览器访问 `/flow/test-flow-1` 无错误

- [ ] **完成 pageDesc 网络验收**（预计 10 分钟）
  - 前置条件：修复 ModuleRouter 序列化
  - 步骤：见上文"验收步骤"
  - 交付物：Network 请求截图 + payload 验证

- [ ] **收集验收材料**（预计 5 分钟）
  - Network 请求截图（显示 pageDesc 格式）
  - 控制台日志截图（显示增强过程）
  - localStorage 状态（flow.* 键值）

- [ ] **更新 tasks.md**（预计 5 分钟）
  - 标记 0.4 完整完成（含网络验收）
  - 移除"待完成任务"区块或明确标注为"已知技术债务"
  - 更新验收时间戳

### P2 技术债务（不阻塞归档）

- [ ] **重新评估 StrictMode 恢复方案**（预计 30 分钟决策）
  - 参考：`docs/IMPLEMENTATION_PROGRESS.md:2299-2474`
  - 推荐方案 A：引入独立 FlowContext（工作量 2-3 天）
  - 决策触发条件：生产问题 / React 19 发布 / 重构窗口

- [ ] **g7-tracking-experiment 模块渲染优化**（预计 1 小时）
  - 现象：159 条日志（比其他模块高）
  - 优先级：P2，不影响功能

---

## 🛠️ 技术上下文

### 关键文件清单

**Flow 核心**：
- `src/flows/FlowOrchestrator.ts` - Flow 状态管理
- `src/flows/FlowModule.jsx` - Flow 路由组件
- `src/flows/FlowAppContextBridge.jsx` - Context 桥接
- `src/flows/definitions/test-flow-1.ts` - 测试 Flow 定义

**子模块包装器**：
- `src/submodules/g7-experiment/Component.jsx`
- `src/submodules/g7-questionnaire/Component.jsx`
- `src/submodules/g7-tracking-experiment/Component.jsx`
- `src/submodules/g7-tracking-questionnaire/Component.jsx`
- `src/submodules/g4-experiment/Component.jsx`

**统一提交管道**：
- `src/shared/services/submission/usePageSubmission.js` - 提交 Hook
- `src/shared/services/submission/pageDescUtils.js` - pageDesc 增强逻辑
- `src/shared/services/submission/eventTypes.js` - flow_context 事件定义

**全局状态**：
- `src/context/AppContext.jsx` - 全局 Context（包含 setFlowContext/getFlowContext）
- `src/modules/ModuleRouter.jsx` - ⚠️ 包含序列化问题

**Mock 配置**：
- `vite.config.js:11-140` - Mock API（登录、提交、心跳）

### 环境信息

**开发服务器**：
```bash
npm run dev
# → http://localhost:3000
```

**测试 URL**：
```
http://localhost:3000/flow/test-flow-1
```

**Mock 登录凭证**：
- 批次号：`250619`
- 考号：`1001`
- 响应：自动返回 `/flow/test-flow-1` URL

**关键 localStorage 键**：
```
flow.test-flow-1.stepIndex      # 当前步骤索引
flow.test-flow-1.modulePageNum  # 子模块页码
flow.test-flow-1.completedAt    # 完成时间戳
hci-batchCode                   # 用户批次
hci-examNo                      # 用户考号
```

### 已知技术约束

1. **WSL2 环境**
   - Vitest 配置：`pool: 'vmThreads'`（不使用 forks/threads）

2. **40秒倒计时限制**
   - 注意事项页面强制阅读 40 秒
   - MCP 自动化无法绕过（需手动等待或修改代码）

3. **StrictMode 禁用**
   - 原因：FlowAppContextBridge 架构冲突
   - 位置：`src/main.jsx:12-17`
   - 缓解计划：`docs/IMPLEMENTATION_PROGRESS.md:2299-2474`

4. **计时器驱动渲染**
   - FlowModule 每秒渲染一次（正常行为）
   - 原因：AppContext 包含 `remainingTime`/`questionnaireRemainingTime`
   - 不影响性能（已优化，无抖动）

---

## 📚 参考文档

### 已交付文档

1. **Phase 实施报告**：
   - `docs/PHASE_D_VERIFICATION_REPORT.md` - 渲染循环优化
   - `docs/PHASE_E_EXECUTION_REPORT.md` - StrictMode 失败分析
   - `docs/IMPLEMENTATION_PROGRESS.md` - 完整进度记录（v2.8，2474 行）

2. **技术指南**：
   - `docs/MANUAL_VERIFICATION_GUIDE.md` - pageDesc 手动验收步骤
   - `docs/需求-交互前端改造方案.md` - 架构设计文档
   - `openspec/AGENTS.md` - OpenSpec 工作流

3. **OpenSpec 规格**：
   - `openspec/changes/add-flow-orchestrator-and-cmi/proposal.md` - 变更提案
   - `openspec/changes/add-flow-orchestrator-and-cmi/tasks.md` - 任务清单
   - `openspec/project.md` - 项目约定

### 外部参考

- **React 最佳实践**：[react.dev/learn](https://react.dev/learn)
- **Vite 文档**：[vitejs.dev](https://vitejs.dev)
- **OpenSpec 规范**：项目内 `openspec/AGENTS.md`

---

## 🎯 成功标准（归档前检查清单）

### P0 必须项

- [ ] ModuleRouter 序列化问题已修复
- [ ] `/flow/test-flow-1` 浏览器访问无报错
- [ ] pageDesc 网络请求验收通过（截图证据）
- [ ] Network payload 显示正确格式：`[test-flow-1/g7-experiment/0] ...`
- [ ] flow_context 事件以对象格式记录
- [ ] tasks.md 标记 0.4 完整完成
- [ ] 验收材料已收集（截图 + 日志）

### P1 推荐项

- [ ] 清理调试日志（可选）
  - FlowModule.jsx: `[FlowModule DEBUG]`
  - FlowAppContextBridge.jsx: `[FlowAppContextBridge]`
  - AppContext.jsx: `[AppContext] setFlowContext`
  - usePageSubmission.js: `[usePageSubmission]`

- [ ] 提交 git commit（可选）
  - 标题：`feat: 完成 Flow pageDesc 前缀功能与性能优化`
  - 包含文件：FlowModule.jsx, AppContext.jsx, FlowAppContextBridge.jsx, usePageSubmission.js, vite.config.js

### P2 技术债务（不阻塞）

- StrictMode 恢复方案决策（参考缓解计划）
- g7-tracking-experiment 渲染优化
- 归档 OpenSpec 变更：`openspec archive add-flow-orchestrator-and-cmi`

---

## 🚨 常见问题排查

### Q1: 访问 /flow/test-flow-1 报错 "replaceState cloned"

**原因**：ModuleRouter 序列化问题（P0 待修复）
**解决**：按照"问题 1"的修复方案修改 `ModuleRouter.jsx:249-255`

### Q2: pageDesc 没有前缀

**检查步骤**：
1. 控制台搜索 `[usePageSubmission] pageDesc after enhancement`
   - 如果有日志且显示增强后的值 → 网络请求可能未正确发送
   - 如果无日志 → flowContext 未正确注入

2. 控制台搜索 `[AppContext] getFlowContext called`
   - 应返回 `{flowId: 'test-flow-1', submoduleId: 'g7-experiment', stepIndex: 0}`
   - 如果返回 `null` → FlowAppContextBridge 未正确设置

3. 控制台搜索 `[FlowAppContextBridge] Setting flowContext`
   - 应在页面加载时出现一次
   - 如果未出现 → state.currentStep 可能为 null

**参考**：`docs/MANUAL_VERIFICATION_GUIDE.md` 完整排查步骤

### Q3: 渲染循环又出现了

**检查**：
1. 查看渲染间隔：
   - 正常：~1 秒间隔（计时器驱动）
   - 异常：毫秒级连续渲染

2. 检查是否有 unmount/mount 抖动：
   - 正常：无频繁 `Submodule unmounted/mounted`
   - 异常：每次渲染都伴随 unmount/mount

**解决**：
- 确认 Phase H 修复已应用（FlowModule.jsx, AppContext.jsx, FlowAppContextBridge.jsx）
- 参考 Codex Session: 019a884d, 019a8856

### Q4: Mock API 不返回 Flow URL

**检查**：`vite.config.js:116`
**期望值**：`url: '/flow/test-flow-1'`
**如果错误**：修改为正确值并重启开发服务器

---

## 💡 实施建议

### 推荐工作流程

1. **修复 ModuleRouter**（15 分钟）
   - 使用 Codex CLI 或手动修改
   - 浏览器验证无报错

2. **完成网络验收**（10 分钟）
   - 按照验收步骤操作
   - 截图保存证据

3. **收集材料并更新文档**（10 分钟）
   - tasks.md 标记完成
   - 截图上传到 docs/screenshots/

4. **可选清理**（20 分钟）
   - 清理调试日志
   - 提交 git commit

### 使用 Codex CLI（推荐）

```bash
# 修复 ModuleRouter
uv run ~/.claude/skills/codex/scripts/codex.py \
  "修复 @src/modules/ModuleRouter.jsx:249-255 的序列化问题。
  只传递可序列化字段：batchCode, examNo, url, pageNum, studentName" \
  "gpt-5" \
  "/mnt/d/myproject/cp"
```

### 手动修改（备选）

参考上文"修复方案"部分的代码示例。

---

## 📧 联系与支持

**OpenSpec 变更 ID**：`add-flow-orchestrator-and-cmi`
**主要交付物**：Flow Orchestrator + CMI 接口 + pageDesc 前缀
**技术栈**：React 18 + Vite 4 + TypeScript
**代码仓库**：当前项目根目录

**技术债务跟踪**：
- StrictMode 缓解计划：`docs/IMPLEMENTATION_PROGRESS.md:2299-2474`
- OpenSpec 任务清单：`openspec/changes/add-flow-orchestrator-and-cmi/tasks.md`

---

**最后更新**：2025-11-15
**文档版本**：v2.0
**状态**：待 P0 修复后归档
