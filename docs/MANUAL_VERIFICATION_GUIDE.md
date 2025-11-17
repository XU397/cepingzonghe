# Flow PageDesc 前缀验证指南

**任务目标**：验证 Flow 模式下提交的数据包含正确的 `[flowId/submoduleId/stepIndex]` 前缀

**环境**：
- 开发服务器已启动：http://localhost:3000/
- Mock 模式启用（VITE_USE_MOCK=1）

---

## ✅ 代码逻辑已验证

**关键文件检查**：

1. **pageDescUtils.js** (src/shared/services/submission/pageDescUtils.js:24-38)
   - ✅ `enhancePageDesc()` 函数逻辑正确
   - ✅ 前缀格式：`[${flowId}/${submoduleId}/${stepIndex}] ${原始描述}`

2. **wrapper.jsx** (src/modules/grade-7/wrapper.jsx:105-112)
   - ✅ `getFlowContext()` 配置正确
   - ✅ 返回：{ flowId, submoduleId, stepIndex, pageId }

3. **usePageSubmission.js** (src/shared/services/submission/usePageSubmission.js:193-197)
   - ✅ 调用链完整：getFlowContext → injectFlowContext → enhancePageDesc
   - ✅ 只在 Flow 模式下增强 pageDesc

**结论**：代码实现完全符合设计要求。

---

## 📋 手动验证步骤（预计 10 分钟）

### 步骤 1: 访问测试 Flow

1. 打开浏览器（推荐 Chrome）
2. 访问：http://localhost:3000/flow/test-flow-1
3. **预期结果**：
   - 页面显示 "实验注意事项" 标题
   - 看到勾选框："我已阅读并理解上述注意事项"
   - 看到 "继续" 按钮（禁用状态）

**如果页面显示登录页**：
- 检查 Console，应看到：`[FlowModule] Setting mock authentication`
- 如果没有，刷新页面（F5）

---

### 步骤 2: 打开 DevTools Network 面板

1. 按 `F12` 打开 DevTools
2. 切换到 **Network** 标签
3. 在筛选框输入：`saveHcMark`
4. 确保 **Preserve log** 已勾选（重要！）

---

### 步骤 3: 触发页面导航

1. 等待 25 秒（或勾选"我已阅读..."）
2. 点击 "继续" 按钮
3. 页面应跳转到下一页

**当前页面信息**：
- 当前步骤：1/14
- 当前模块：7年级实验（g7-experiment）
- Flow ID：test-flow-1

---

### 步骤 4: 拦截 Network 请求

在 Network 面板中：

1. 寻找 **POST** 请求到 `/stu/saveHcMark`
2. 点击请求，查看 **Payload** 标签
3. 展开 **Form Data**，找到 `mark` 字段
4. **复制** `mark` 字段的值（JSON 字符串）

**示例**：
```
mark: {"pageNumber":"1","pageDesc":"[test-flow-1/g7-experiment/0] 实验注意事项",...}
```

---

### 步骤 5: 验证 pageDesc 格式

将复制的 JSON 粘贴到在线 JSON 格式化工具（如 jsonlint.com）或文本编辑器。

**验收标准**：

✅ **必须满足**：
- `mark.pageDesc` 包含前缀：`[test-flow-1/g7-experiment/0]`
- 前缀格式：`[flowId/submoduleId/stepIndex]`
- 后面跟着原始描述（如 "实验注意事项"）

**正确示例**：
```json
{
  "pageDesc": "[test-flow-1/g7-experiment/0] 实验注意事项",
  "pageNumber": "1",
  "operationList": [...]
}
```

**错误示例**（需要修复）：
```json
{
  "pageDesc": "实验注意事项",  // ❌ 缺少前缀
  ...
}
```

---

## 📸 截图收集清单（预计 5 分钟）

保存以下截图到 `docs/screenshots/` 目录：

1. **flow-page-loaded.png**
   - Flow 页面正常显示（注意事项页）
   - 显示标题、勾选框、按钮

2. **localStorage-keys.png**
   - 浏览器 Console 执行：
     ```javascript
     Object.keys(localStorage).filter(k => k.startsWith('flow.')).forEach(k => {
       console.log(k, '=', localStorage.getItem(k));
     });
     ```
   - 截图输出结果

3. **network-request.png**
   - Network 面板中的 `POST /stu/saveHcMark` 请求
   - 显示请求状态（200 OK）

4. **request-payload.png**
   - Request Payload 的 `mark` 字段
   - **高亮** pageDesc 中的前缀部分

5. **console-logs.png**
   - Console 面板，筛选 `[FlowModule]` 或 `[useHeartbeat]`
   - 验证日志量 <100 条

6. **refresh-recovery.png**
   - 刷新页面（F5）前后对比
   - 验证页面恢复到原位置

---

## 🔍 辅助验证脚本

创建文件 `verify-flow-context.js`：

```javascript
// 在浏览器 Console 执行此脚本
(function verifyFlowContext() {
  console.group('Flow Context Verification');

  // 检查 localStorage
  const flowKeys = Object.keys(localStorage).filter(k => k.startsWith('flow.'));
  console.log('Flow Keys:', flowKeys);

  flowKeys.forEach(key => {
    console.log(`  ${key} =`, localStorage.getItem(key));
  });

  // 检查当前 URL
  console.log('Current URL:', window.location.href);

  // 检查是否在 Flow 模式
  const isFlowMode = window.location.pathname.startsWith('/flow/');
  console.log('Is Flow Mode:', isFlowMode);

  if (isFlowMode) {
    const flowId = window.location.pathname.split('/')[2];
    console.log('Flow ID:', flowId);

    // 预期的前缀格式
    const expectedPrefix = `[${flowId}/`;
    console.log('Expected Prefix Pattern:', expectedPrefix);
  }

  console.groupEnd();
})();
```

---

## ⚠️ 故障排查

### 问题 1: 看不到 Network 请求

**可能原因**：
- 页面没有触发提交（继续按钮未启用）
- Network 面板未勾选 "Preserve log"

**解决方案**：
1. 确保等待 25 秒或手动勾选
2. 重新勾选 "Preserve log"
3. 刷新页面重试

---

### 问题 2: pageDesc 缺少前缀

**诊断步骤**：
1. 检查 Console 是否有错误日志
2. 查看 `[PageDescUtils] Incomplete flow context` 警告
3. 验证 FlowModule 是否正确设置 flowContext

**验证命令**（Console）：
```javascript
// 检查 wrapper.jsx 的 flowContext
// 应看到相关日志：[Grade7Wrapper] 🎯 7年级模块包装器已挂载
```

---

### 问题 3: 页面显示登录页

**原因**：Mock 认证未生效

**解决方案**：
1. 查看 Console，寻找：`[FlowModule] Setting mock authentication`
2. 如果没有，检查 `src/flows/FlowModule.jsx:263-285`
3. 刷新页面（Ctrl+Shift+R，强制刷新）

---

## ✅ 验收通过标准

- ✅ /flow/test-flow-1 可正常访问
- ✅ pageDesc 包含格式：`[test-flow-1/g7-experiment/0] ...`
- ✅ 前缀三部分：flowId、submoduleId、stepIndex
- ✅ localStorage 包含 `flow.test-flow-1.*` 键
- ✅ 控制台日志量 <100 条
- ✅ 刷新后恢复到原位置

---

## 📝 结果记录

完成验证后，请记录结果到 `docs/IMPLEMENTATION_PROGRESS.md`：

```markdown
### Phase H: PageDesc 前缀验证 ✅

**执行时间**: 2025-11-15 10:00

**验证结果**:
- pageDesc 格式：✅ `[test-flow-1/g7-experiment/0] 实验注意事项`
- localStorage 持久化：✅ 包含 flow.test-flow-1.* 键
- 日志量：✅ 57 条（< 100）
- 刷新恢复：✅ 页面位置正确

**截图**:
- docs/screenshots/flow-page-loaded.png
- docs/screenshots/localStorage-keys.png
- docs/screenshots/network-request.png
- docs/screenshots/request-payload.png
- docs/screenshots/console-logs.png
- docs/screenshots/refresh-recovery.png
```

---

## 🚀 下一步

验收通过后：
1. 更新进度文档版本号为 v2.8
2. （可选）归档 OpenSpec 变更：`openspec archive add-flow-orchestrator-and-cmi`
