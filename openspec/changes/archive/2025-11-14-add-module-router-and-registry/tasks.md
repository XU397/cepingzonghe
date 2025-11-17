## Tasks: add-module-router-and-registry

## 1. 路由接线（受管路由）
- [x] 1.1 在顶层定义：`<Route path="/flow/:flowId" element={<FlowModule key={flowId} flowId={flowId} />} />`
- [x] 1.2 `ModuleRouter` 识别 flow URL（`/^\/flow\/.+/`），将控制权交给路由；非 flow 则沿用按模块 URL 渲染
- [x] 1.3 文档化“为何使用 key=flowId 重挂载”与防御性重建（Orchestrator 内仍做 `useEffect([flowId])`）

## 2. 注册与接口
- [x] 2.1 `ModuleRegistry.register({ moduleId, url, version, ModuleComponent, getInitialPage, ... })`
- [x] 2.2 注册 FlowModule：`moduleId='flow'`, `url='/flow/:flowId'`
- [x] 2.3 `ModuleRouter.resolve({ url, pageNum })`：定位模块并计算 `initialPageId`

## 3. 恢复与持久化
- [x] 3.1 登录直达：从 `{ url, pageNum }` 还原模块与页面
- [x] 3.2 刷新恢复：读取 `core.module/url`, `core.page/pageNum`；越界回落至“注意事项页”
- [x] 3.3 统一写入：成功定位后写回上述键名

## 4. 验收
- [x] 4.1 访问 `/flow/<id>` 能 remount；切换 A→B 不串进度
- [x] 4.2 登录返回 `{ url, pageNum }` 能直达；刷新后停留当前页
- [x] 4.3 未匹配 URL 呈现“模块未找到”，并在 DEV 显示诊断信息
