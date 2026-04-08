# Flow 架构长驻页面后“提交无请求”问题修复方案

## 问题与结论
- 现象：在 Flow 页面停留较久后，点击“下一页/继续”提示“数据提交错误”，浏览器无任何网络请求。
- 结论：提交前置校验拿不到身份（`batchCode/examNo` 或 `isAuthenticated`），`usePageSubmission` 直接返回 `false`，不会发请求。身份缺失的来源主要有：
  - Flow 完成回调调用了 `handleLogout/clearAllCache`，把登录态和 `batchCode/examNo` 统统清空（`FlowModule.jsx` -> `advanceFlowStep` -> `appContext.handleLogout || clearAllCache`）。
  - 会话过期（90 分钟）或后端返回 401 时，`handleSessionExpired` 清空本地存储并跳转登录。
  - 子模块若未正确提供 `batchCode/examNo`，心跳与进度不上报，服务端 Session 也会过期。

（提交前的“轻量会话校验+引导重登”不在本次范围，已排除。）

## 目标
- 保持会话不过期，防止长时间停留后丢身份。
- 避免非必要的全量登出，保证登录态在 Flow 内部流转。
- 心跳间隔统一为 90 秒，确保 Session 保活且不压后台。

## 实施要点
1) **统一开启并保活心跳（90s）**
   - 入口：`src/flows/FlowModule.jsx` 的 `sendProgressUpdate` 和 `src/hooks/useHeartbeat.ts`。
   - 具体调整：
     - 默认开启：`.env`/构建配置中保证 `VITE_FLOW_HEARTBEAT_ENABLED=1`。
     - 心跳间隔：在 `useHeartbeat` 调用处改为 `intervalMs: 90000`。如需环境可调，可读取 `VITE_FLOW_HEARTBEAT_INTERVAL_MS`，默认 30000。
     - 触发条件：仅在 `flowContext.flowId` 存在且 `batchCode/examNo` 非空时启动心跳；保持 `credentials: 'include'`。
     - 错误处理：失败时入队，后续 flush；同时在控制台打印，但不要调用 `handleSessionExpired`，避免误清身份。

2) **减少误登出，保留身份上下文**
   - 入口：`FlowModule.jsx` 中 `advanceFlowStep`/`handleSubmoduleComplete` -> `onFlowCompleted`。
   - 调整建议：
     - Flow 完成时不要直接调用 `handleLogout/clearAllCache`。改为只清理当前 Flow 缓存：`clearFlowStorage(flowId)`，并保留 `batchCode/examNo/isAuthenticated`。
     - 完成页的 CTA（`handleCompletionCTA`）仍可触发真正登出或跳转，这是用户显式动作。
     - 若有 transition page，确保在跳转前不触发登出。

3) **身份来源兜底**
   - 子模块/页面提交时必须携带 `batchCode/examNo`。`FlowModule` 已从 `effectiveUserContext` + `AppContext` 合并；若新增子模块，务必遵守：
     - 入口 URL 或登录态中注入 `batchCode/examNo`；
     - 不要在子模块内部调用 `handleLogout`，仅在明确“退出”场景使用。

4) **验证与回归**
   - 设置 `.env`：`VITE_FLOW_HEARTBEAT_ENABLED=1`，如增加可选配置则设定 `VITE_FLOW_HEARTBEAT_INTERVAL_MS=30000`。
   - 场景回归：
     - 在 Flow 页面停留 >30 分钟，确认心跳持续发送且 Session 未过期；再次点击“下一页”能正常提交。
     - 完成页前后的导航不再清空 `batchCode/examNo`，提交可继续发请求。
     - 后端返回 401 时仍会触发 `handleSessionExpired`（保留原有安全策略），确认不会误触发于心跳失败重试。

## 参考文件（代码定位）
- `src/flows/FlowModule.jsx`：心跳开关、完成回调使用的登出逻辑。
- `src/hooks/useHeartbeat.ts`：心跳实现，需改默认 interval。
- `src/shared/services/storage/storageKeys.js`：`clearFlowStorage` 可用于仅清除 Flow 缓存。

## 交付物
- 以上修改完成后，提交 MR，并附上长时间停留场景的验证录像/截图与请求日志（包含心跳间隔 30s 的网络面板记录）。 
