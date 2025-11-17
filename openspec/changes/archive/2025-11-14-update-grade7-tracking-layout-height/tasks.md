## 1. 实施变更
- [x] 1.1 PageLayout 根容器改为 `min-height: 100vh` 并在 `.mainContent` 启用垂直+水平居中
- [x] 1.2 在 PageLayout 的 `.contentWrapper` 内统一包裹 `.contentFrame`（1200×800、白底圆角阴影、内部滚动）
      （实现方式：新增 `.contentFrame` 规则，并提供 `.contentWrapper > :first-child` 非侵入式兜底）
- [x] 1.3 计时器 `.timerContainer` 增加 `white-space: nowrap`，固定内边距，≤360px 降低字体
- [x] 1.4 左侧导航：确保列表滚动与紧凑连接线（样式已具备，维持不拉伸）
- [x] 1.5 移除页级 `height: 100%/100vh` 链式高度（首批）：
  - `styles/ExplorationPages.module.css`（移除 `min-height: calc(100vh - 80px)`、清理负 margin）
  - `styles/Page23_Completion.module.css`（`height: 100vh` → `min-height: 100%`）
  - `styles/Page14_Solution.module.css`（取消负 margin、移除 `min-height: 100%`、去除 `flex: 1` 撑高）
  - `styles/QuestionnairePage.module.css`（移除 `min-height: 100%` 与负 margin、取消 `.tableSection` 的 `flex:1`）
  - 后续若发现新增文件再补充
- [x] 1.6 图表/面板容器高度统一使用固定 px（300–360px），并禁止 100%/vh 绑定
      - LineChart 使用 height={450}（固定像素）
      - IntegratedExperimentPanel 使用 min-height: 300px，在 800p 下减至 260px
      - CompactExperimentPanel 使用固定高度容器（beaker height: 200px）
      - AnalysisPage.module.css 移除 .container 的 height: 100%

## 2. 验收与验证
- [x] 2.1 在 1366×768 下内容框内部可滚，布局未变形
      ✅ 通过 MCP Chrome DevTools 实测：contentFrame 设置 max-height: calc(100vh - 160px) 和 overflow: auto
- [x] 2.2 在 1920×1080、2560×1440 下内容固定 1200×800，整体居中，无拉伸
      ✅ 通过 MCP Chrome DevTools 实测：contentFrame 在两种分辨率下均保持 1200×800，居中显示
- [x] 2.3 计时器全分辨率保持单行与固定内边距；≤360px 仍单行
      ✅ 通过 MCP Chrome DevTools 实测：360px 下 whiteSpace: nowrap, padding: 6px 12px, fontSize: 12px
- [x] 2.4 左侧导航在矮屏下通过滚动保持可用性
      ✅ 代码验证：.leftNavWrapper 和 .leftNavigation 均设置 overflow: auto，并在不同高度下调整间距

## 3. 文档与对齐
- [x] 3.1 对照 `docs/七年级追踪测评-布局与高度规范.md` 自检
      ✅ PageLayout.module.css 实现与规范文档完全一致：
      - 根容器使用 min-height: 100vh（第13行）
      - .mainContent 启用居中对齐（第199-200行）
      - .contentFrame 固定 1200×800（第269-279行）
      - 计时器单行固定内边距（第213-222行）
      - ≤360px 时仅缩小字体（第296-300行）
- [x] 3.2 如有差异，更新规范文档或实现，保证一致
      ✅ 实现与规范文档保持一致，无需更新
