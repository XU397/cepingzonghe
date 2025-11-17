# FlowModule Hooks 修复手动验证指南

## 修复摘要

**问题**：React Hooks 顺序错误
**原因**：`FlowModuleInner` 中的 `useMemo` hooks 位于多个 early return 之后，导致不同渲染时 Hook #57 从 `undefined` 变为 `useMemo`
**修复**：将所有 useMemo hooks 提前到第一个 early return (Line 777) 之前

**修改文件**：`src/flows/FlowModule.jsx`
**Codex Session**：`019a8bc2-bc62-7e70-a976-599ea2af3142`

---

## 修复前后对比

### 修复前（错误）
```javascript
// ... 其他 hooks ...

// ❌ early return 在 hooks 之前
if (!flowId && redirectingToRoute) {
  return <div>正在跳转...</div>;
}

// ❌ 条件性执行的 hooks（Hook #57 在这里）
const submoduleFlowContext = useMemo(() => { ... }, [...]);
const providerProps = useMemo(() => ({ ... }), [...]);
const bridgeFlowContext = useMemo(() => { ... }, [...]);
```

### 修复后（正确）
```javascript
// ✅ 所有 hooks 在 early returns 之前无条件执行
const submoduleFlowContext = useMemo(() => {
  if (!state.currentStep) return null; // 内部处理空值
  return { ... };
}, [...]);

const providerProps = useMemo(() => ({ ... }), [...]);

const bridgeFlowContext = useMemo(() => {
  if (!flowId || !state.currentStep) return null; // 内部处理空值
  return { ... };
}, [...]);

// ✅ early returns 在所有 hooks 之后
if (!flowId && redirectingToRoute) {
  return <div>正在跳转...</div>;
}
```

---

## 手动验证步骤

### 1. 访问测试页面
```bash
# 确保开发服务器正在运行
npm run dev

# 在浏览器打开
http://localhost:3000/flow/test-flow-1
```

### 2. 检查控制台（Chrome DevTools）

**按 F12 打开 DevTools → Console**

#### 预期结果：✅ 无 Hooks 警告
- **不应出现**："React has detected a change in the order of Hooks called by FlowModule"
- **不应出现**："57. undefined → useMemo"

#### 如果仍有警告：
1. **硬刷新**：`Ctrl+Shift+R` (Windows/Linux) 或 `Cmd+Shift+R` (Mac) 清除缓存
2. **重启服务器**：停止 `npm run dev`，重新启动
3. **检查文件保存**：确认 `FlowModule.jsx` 已保存修改

### 3. 验证渲染计数器日志格式

**预期日志格式**（如果渲染超过阈值）：
```
[RenderCounter] component=FlowModule window=5s renders=XX mounts=YY threshold=100
```

**不应出现**：
- 额外的警告或错误前缀
- 格式不一致的日志

### 4. 触发多次渲染（压力测试）

**操作步骤**：
1. 刷新页面 3 次（硬刷新：`Ctrl+Shift+R`）
2. 在控制台执行：
   ```javascript
   // 模拟快速切换状态
   for (let i = 0; i < 20; i++) {
     setTimeout(() => window.location.reload(), i * 100);
   }
   ```
3. 观察控制台：**应无 Hooks 错误**，可能有渲染计数器警告（正常）

### 5. 检查不同路由
- `/` - 主页/登录页（传统模块）
- `/flow/grade-7-tracking` - Grade 7 Tracking 流程（如果已配置）
- `/four-grade` - Grade 4 模块（传统模块）

**每个路由都应无 Hooks 错误**

---

## 验证检查清单

- [ ] **控制台无 Hooks 顺序警告**（必须）
- [ ] **页面正常渲染，无白屏**（必须）
- [ ] **RenderCounter 日志格式正确**（可选，取决于是否超阈值）
- [ ] **硬刷新后仍无警告**（必须）
- [ ] **服务器重启后仍无警告**（必须）

---

## 技术细节

### Hook 顺序规则
React Hooks 必须：
1. 在组件顶层无条件调用
2. 不能在循环/条件/嵌套函数中调用
3. 每次渲染的调用顺序必须一致

### 修复策略
- **useMemo/useCallback 内部处理空值**：返回 `null` 而非跳过 Hook
- **Early returns 移到所有 Hooks 之后**
- **条件逻辑放在 Hook 内部**（useMemo 的返回值判断）

### 关键代码位置
- **包装器**：`src/flows/FlowModule.jsx:875` - `export function FlowModule(props)`
  - 无条件调用 `useRenderCounter`
- **主组件**：`src/flows/FlowModule.jsx:239` - `function FlowModuleInner`
  - Line 732: `submoduleFlowContext` useMemo
  - Line 753: `providerProps` useMemo
  - Line 761: `bridgeFlowContext` useMemo
  - Line 777: 第一个 early return

---

## 回退方案（如果需要）

如果修复导致其他问题，可以通过 Git 回退：
```bash
# 查看修改
git diff src/flows/FlowModule.jsx

# 回退到修复前
git checkout HEAD -- src/flows/FlowModule.jsx
```

---

## 报告问题

如果手动验证发现问题，记录以下信息：
1. **控制台完整错误日志**（截图或文本）
2. **浏览器版本**（Chrome/Firefox/Edge + 版本号）
3. **操作步骤**（如何复现）
4. **URL 路径**（哪个路由出现问题）

---

**生成时间**：2025-11-16
**修复版本**：Codex Session `019a8bc2-bc62-7e70-a976-599ea2af3142`
**验证状态**：⏳ 待手动验证
