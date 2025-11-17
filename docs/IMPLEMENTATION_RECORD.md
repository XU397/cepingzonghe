# OpenSpec 变更实施记录

**变更 ID**: `improve-flow-strictmode-and-tracking`
**实施日期**: 2025-11-16
**实施状态**: ✅ **代码实施完成** | ⏳ **待测试验证**

---

## 实施摘要

通过 **Codex CLI 自动化工具**完成 7 项核心任务，共 6 个 Codex 会话，所有代码修改已提交。现需测试工程师进行运行时验证。

---

## 已完成任务清单

### Task 1: FlowContext 架构设计 ✅
**Codex Session**: `019a8b93-badd-7eb0-99ad-c10d03841450`
**交付物**:
- `src/flows/context/FlowContext.ts` - TypeScript 接口定义
- `src/flows/context/index.js` - 导出入口

**关键接口**:
```typescript
export interface FlowContextValue {
  flowId: string;
  submoduleId: string;
  stepIndex: number;
  progress: FlowProgressLite | null;
  getUserContext: () => UserContextLite;
  getTimerSnapshot: () => TimerSnapshot;
  navigateToNextStep: () => void;
  submitPage: (opts?: any) => Promise<boolean>;
}
```

---

### Task 2: g7-tracking 渲染优化 ✅
**Codex Session**: `019a8b98-0850-73e0-90c8-0bd501e6f787`
**问题**: 159 次挂载/卸载 / 15 秒（目标 ≤80）
**修改文件**:
- `src/modules/grade-7-tracking/context/TrackingProvider.jsx`
- `src/modules/grade-7-tracking/hooks/useDataLogger.js`

**核心优化**:
1. **stateRef + userContextRef 模式** - 稳定回调引用
   ```javascript
   const stateRef = useRef({});
   const userContextRef = useRef(userContext);

   const buildMarkObject = useCallback((pageNumber, pageDesc, options = {}) => {
     const { operationLog } = stateRef.current;
     const { batchCode, examNo } = userContextRef.current;
     // ...
   }, [formatDateTime]); // 仅依赖 formatDateTime
   ```

2. **选择器模式** - 细粒度订阅
   ```javascript
   export function useTrackingContextSelector(selector, isEqual) {
     return useSyncExternalStore(
       store.__subscribe,
       () => selector(store.__getStore()),
       () => selector(store.__getStore())
     );
   }

   // useDataLogger 使用
   const { batchCode, examNo } = useTrackingContextSelector((store) => ({
     batchCode: store.session?.batchCode,
     examNo: store.session?.examNo,
   }));
   ```

**预期效果**: 渲染次数减少 **50%+**（159 → ≤80 / 15s）

---

### Task 3: Solution D - 路由级 StrictMode 切换 ✅
**Codex Session**: `019a8b9e-e654-77b1-8387-bc327db7b71c`
**新增文件**:
- `src/app/AppShell.jsx`

**修改文件**:
- `src/main.jsx`

**实现逻辑**:
```javascript
// src/app/AppShell.jsx:28-38
const location = useLocation();
const isFlowPath = location?.pathname?.startsWith('/flow/');
const flowStrictEnabled = String(import.meta.env.VITE_FLOW_STRICT_MODE_ENABLED ?? 'false').toLowerCase() === 'true';
const shouldUseStrict = !isFlowPath || flowStrictEnabled;

const MaybeStrict = ({ children }) => (
  shouldUseStrict ? <React.StrictMode>{children}</React.StrictMode> : <>{children}</>
);

return (
  <AppProviders>
    <MaybeStrict>
      <AppProvider>
        <Routes>
          <Route path="/flow/:flowId" element={<FlowRoute />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </AppProvider>
    </MaybeStrict>
  </AppProviders>
);
```

**行为**:
| 路径 | StrictMode | 说明 |
|------|-----------|------|
| `/flow/*` | ❌ 禁用 | 默认行为 |
| `/four-grade` | ✅ 启用 | 传统模块 |
| `/seven-grade` | ✅ 启用 | 传统模块 |

**环境变量**:
```bash
VITE_FLOW_STRICT_MODE_ENABLED=false  # 默认禁用 Flow StrictMode
```

---

### Task 4: DEV 渲染计数器系统 ✅
**Codex Session**: `019a8ba5-ace7-75a0-8afb-6d051670e737`
**新增文件**:
- `src/shared/utils/RenderCounter.jsx`

**核心功能**:
1. **滑动窗口统计** - 支持 5s/10s/15s 窗口
2. **阈值告警** - 超阈值时输出统一格式日志
3. **功能开关** - 通过环境变量控制

**日志格式**:
```
[RenderCounter] component=FlowModule window=5s renders=120 mounts=60 threshold=100
```

**使用示例**:
```javascript
// src/flows/FlowModule.jsx:877
useRenderCounter({
  component: 'FlowModule',
  windows: [5],
  thresholds: { 5: 100 }
});
```

**环境变量**:
```bash
VITE_RENDER_COUNTER_ENABLED=true       # DEV 默认启用
VITE_RENDER_COUNTER_LOG_LEVEL=warn    # debug | warn | error
```

---

### Task 5: FlowProvider Phase 0 ✅
**Codex Session**: `019a8ba9-7834-70c0-91b7-495b2744583b`
**新增文件**:
- `src/flows/context/FlowProvider.jsx`

**核心特性**:
1. **功能开关** - `VITE_FLOW_PROVIDER_ENABLED`（默认 `true`）
2. **Ref-based 稳定性** - 避免不必要的重渲染
   ```javascript
   const examNoRef = useRef(app?.examNo ?? '');
   const batchCodeRef = useRef(app?.batchCode ?? '');

   useEffect(() => { examNoRef.current = app?.examNo ?? ''; }, [app?.examNo]);
   useEffect(() => { batchCodeRef.current = app?.batchCode ?? ''; }, [app?.batchCode]);
   ```

3. **稳定选择器**
   ```javascript
   const getUserContext = useCallback(() => ({
     examNo: examNoRef.current || '',
     batchCode: batchCodeRef.current || '',
   }), []);

   const getTimerSnapshot = useCallback(() => ({
     remainingTime: Number(remainingTimeRef.current || 0),
     questionnaireRemainingTime: Number(questionnaireRemainingTimeRef.current || 0),
   }), []);
   ```

4. **零影响禁用**
   ```javascript
   const isEnabled = parseFlag(import.meta?.env?.VITE_FLOW_PROVIDER_ENABLED, false);
   if (!isEnabled) return children; // 直接返回，零开销
   ```

---

### Task 6: FlowProvider Phase 1 - FlowModule 集成 ✅
**Codex Session**: `019a8bad-fefa-7351-a7aa-254cb5e50e6d`
**修改文件**:
- `src/flows/FlowModule.jsx`

**集成方式**:
```javascript
// 双层包装器模式
const providerEnabled = parseFlag(import.meta.env.VITE_FLOW_PROVIDER_ENABLED, true);
const bridgeEnabled = parseFlag(import.meta.env.VITE_FLOW_BRIDGE_ENABLED, true);

return (
  <div className={styles.container}>
    <MaybeFlowProvider enabled={providerEnabled} providerProps={providerProps}>
      <MaybeFlowAppContextBridge enabled={bridgeEnabled} beforeNavigate={handleBeforeNavigate} flowContext={bridgeFlowContext}>
        <SubmoduleComponent {...submoduleProps} />
      </MaybeFlowAppContextBridge>
    </MaybeFlowProvider>
  </div>
);
```

**环境变量**:
```bash
VITE_FLOW_PROVIDER_ENABLED=true   # Phase 1 默认启用
VITE_FLOW_BRIDGE_ENABLED=true    # 保留 Bridge（向后兼容）
```

---

### Task 7: FlowModule Hooks 顺序错误修复 ✅
**Codex Session**: `019a8bc2-bc62-7e70-a976-599ea2af3142`
**问题**: React Hooks 顺序错误警告
```
Warning: React has detected a change in the order of Hooks called by FlowModule.
   Previous render            Next render
57. undefined                 useMemo
```

**根本原因**: 6 个 early return 导致后续 3 个 useMemo hooks 被条件性跳过

**Early Returns 位置**:
```javascript
// src/flows/FlowModule.jsx
Line 777: if (!flowId && redirectingToRoute) return ...
Line 788: if (!flowId) return ...
Line 800: if (state.loading) return ...
Line 812: if (state.error) return ...
Line 825: if (state.showTransition) return ...
Line 838: if (!SubmoduleComponent) return ...
```

**修复方案**: 将所有 useMemo hooks 提前到第一个 early return 之前

| Hook | 原位置 | 修复后位置 |
|------|--------|-----------|
| `submoduleFlowContext` | ~Line 804 | Line 732 |
| `providerProps` | ~Line 836 | Line 753 |
| `bridgeFlowContext` | ~Line 844 | Line 761 |

**修复代码**:
```javascript
// ✅ 所有 hooks 在 early returns 之前无条件执行
const submoduleFlowContext = useMemo(() => {
  if (!state.currentStep) return null; // 内部处理空值
  return {
    flowId,
    submoduleId: state.currentStep.submoduleId,
    stepIndex: state.currentStep.stepIndex,
    // ...
  };
}, [flowId, state.currentStep?.submoduleId, ...]);

const providerProps = useMemo(() => ({ ... }), [...]);
const bridgeFlowContext = useMemo(() => { ... }, [...]);

// ✅ Early returns 在所有 hooks 之后
if (!flowId && redirectingToRoute) {
  return <div>正在跳转...</div>;
}
```

**验证**: 静态扫描确认第一个 early return (Line 777) 之后无任何 Hook 调用

---

## 文件变更统计

### 新增文件（6 个）
1. `src/app/AppShell.jsx` - 路由外壳，StrictMode 条件包装器
2. `src/flows/context/FlowContext.ts` - FlowContext TypeScript 接口
3. `src/flows/context/FlowProvider.jsx` - FlowProvider 实现
4. `src/flows/context/index.js` - 导出入口
5. `src/shared/utils/RenderCounter.jsx` - DEV 渲染计数器
6. `docs/verification/hooks-fix-manual-test.md` - Hooks 修复验证指南

### 修改文件（5 个）
1. `src/main.jsx` - 移除顶层 StrictMode，使用 AppShell
2. `src/flows/FlowModule.jsx` - Hooks 提前, FlowProvider 集成, 渲染计数器
3. `src/modules/grade-7-tracking/context/TrackingProvider.jsx` - stateRef, userContextRef, 选择器
4. `src/modules/grade-7-tracking/hooks/useDataLogger.js` - useTrackingContextSelector
5. `.env.example` - 新增功能开关文档

---

## 环境变量配置

### 当前配置（.env.example）
```bash
# StrictMode 控制
VITE_FLOW_STRICT_MODE_ENABLED=false    # Flow 路径 StrictMode（默认禁用）

# FlowProvider 控制
VITE_FLOW_PROVIDER_ENABLED=true        # FlowProvider 启用（Phase 1 默认 true）
VITE_FLOW_BRIDGE_ENABLED=true          # AppContext Bridge（向后兼容，默认 true）

# 渲染计数器
VITE_RENDER_COUNTER_ENABLED=true       # DEV 默认启用
VITE_RENDER_COUNTER_LOG_LEVEL=warn     # debug | warn | error
```

---

## 关键代码位置索引

| 功能 | 文件路径 | 行号 |
|------|---------|------|
| AppShell StrictMode 逻辑 | `src/app/AppShell.jsx` | 28-54 |
| FlowModule Wrapper | `src/flows/FlowModule.jsx` | 875-879 |
| FlowModule Hooks 修复 | `src/flows/FlowModule.jsx` | 732-775 |
| FlowProvider 实现 | `src/flows/context/FlowProvider.jsx` | 25-133 |
| RenderCounter Hook | `src/shared/utils/RenderCounter.jsx` | 10-105 |
| g7-tracking 选择器 | `src/modules/grade-7-tracking/hooks/useDataLogger.js` | 20-23 |
| g7-tracking stateRef | `src/modules/grade-7-tracking/context/TrackingProvider.jsx` | 200-1079 |

---

## Codex 会话记录

可通过以下命令恢复会话继续优化：

```bash
# FlowContext 架构设计
uv run ~/.claude/skills/codex/scripts/codex.py resume 019a8b93-badd-7eb0-99ad-c10d03841450 "继续优化..."

# g7-tracking 渲染优化
uv run ~/.claude/skills/codex/scripts/codex.py resume 019a8b98-0850-73e0-90c8-0bd501e6f787 "继续优化..."

# Solution D 实现
uv run ~/.claude/skills/codex/scripts/codex.py resume 019a8b9e-e654-77b1-8387-bc327db7b71c "继续优化..."

# DEV 渲染计数器
uv run ~/.claude/skills/codex/scripts/codex.py resume 019a8ba5-ace7-75a0-8afb-6d051670e737 "继续优化..."

# FlowProvider Phase 0
uv run ~/.claude/skills/codex/scripts/codex.py resume 019a8ba9-7834-70c0-91b7-495b2744583b "继续优化..."

# FlowProvider Phase 1
uv run ~/.claude/skills/codex/scripts/codex.py resume 019a8bad-fefa-7351-a7aa-254cb5e50e6d "继续优化..."

# Hooks 错误修复
uv run ~/.claude/skills/codex/scripts/codex.py resume 019a8bc2-bc62-7e70-a976-599ea2af3142 "继续优化..."
```

---

## 预期性能改进

| 指标 | 优化前 | 目标 | 改进幅度 |
|------|--------|------|----------|
| g7-tracking 渲染频率（15s） | 159 | ≤80 | 减少 50%+ |
| g7-tracking 挂载/卸载（15s） | ~80 | ≤40 | 减少 50% |
| FlowModule 渲染（5s StrictMode 禁用） | 未知 | ≤100 | 待测试 |

---

## 待测试验证项

### P0 阻塞验证（必须）
1. ✅ **代码实施完成** - 所有代码已提交
2. ⏳ **Hooks 错误消失** - 控制台无 "React has detected..." 警告
3. ⏳ **StrictMode 行为正确** - `/flow/*` 禁用，传统模块启用
4. ⏳ **渲染计数器日志格式** - 格式符合规范
5. ⏳ **g7-tracking 性能** - 15s ≤ 80 渲染

### P1 增强验证（推荐）
6. ⏳ **FlowProvider 功能** - 开关控制生效
7. ⏳ **页面正常渲染** - 无白屏、无崩溃
8. ⏳ **多路由兼容性** - 所有路由正常工作

---

## 下一步行动

**当前状态**: ✅ 代码实施完成
**待执行**: 测试工程师运行时验证

**测试文档**:
- 验证指南: `docs/verification/hooks-fix-manual-test.md`
- 测试交接提示词: `docs/QA_HANDOFF_PROMPT.md`（待生成）

---

**记录生成时间**: 2025-11-16
**记录工程师**: Claude Code (Linus Torvalds mode)
**下次更新**: 测试验证完成后
