# Proposal: 集成 UserInfoBar 与 AssessmentPageFrame

## 背景

当前系统中已存在两个关键 UI 组件：

1. **UserInfoBar**（`src/components/common/UserInfoBar.jsx`）
   - 显示平台名称"新都区义务教育质量综合监测平台"和用户账号信息
   - 采用 `position: fixed` 全局固定定位在页面顶部
   - 高度：50px，z-index: 1000
   - 已在 `App.jsx` 中全局渲染

2. **AssessmentPageFrame**（`src/shared/ui/PageFrame/AssessmentPageFrame.jsx`）
   - 统一页面框架，包含左侧导航、计时器、主体内容、下一页按钮
   - 用于标准化各子模块的页面布局
   - 使用 flex 布局，min-height: 100vh

**问题**：两个组件目前独立存在，缺乏明确的协同规范，可能导致：
- AssessmentPageFrame 的顶部内容被 UserInfoBar 遮挡
- 不同模块集成时的布局不一致
- 规范文档中未明确它们的关系

## 目标

1. **明确协同规范**：在 OpenSpec 规范中明确 UserInfoBar 与 AssessmentPageFrame 的布局关系
2. **避免布局冲突**：确保 AssessmentPageFrame 的内容不会被 fixed 定位的 UserInfoBar 遮挡
3. **保持向后兼容**：不破坏现有模块的布局和行为

## 方案

### 设计决策

采用**全局固定定位方案**：
- UserInfoBar 保持 `position: fixed` 全局定位
- 所有使用 AssessmentPageFrame 的页面通过全局样式调整避免被遮挡
- UserInfoBar 在 `App.jsx` 全局渲染，AssessmentPageFrame 无需感知其存在

### 实现要点

1. **布局偏移处理**
   - 在全局样式中为使用 AssessmentPageFrame 的容器添加 `padding-top: 50px`
   - 或者在 AssessmentPageFrame 的 `.frame` 样式中添加 `margin-top: 50px`

2. **规范文档更新**
   - 在 `openspec/specs/ui-frame/spec.md` 中新增场景，说明框架与全局 UserInfoBar 的协同
   - 明确布局偏移的实现方式

3. **验证范围**
   - Grade 4 模块（已使用 AssessmentPageFrame）
   - Grade 7 wrapper（已使用 AssessmentPageFrame）
   - Grade 7 Tracking 模块（已使用 AssessmentPageFrame）
   - G8 无人机模块（开发中，使用 AssessmentPageFrame）

## 非目标

- ❌ 修改 UserInfoBar 的文字内容（保持现状"新都区义务教育质量综合监测平台"）
- ❌ 将 UserInfoBar 集成到 AssessmentPageFrame 内部
- ❌ 重构 UserInfoBar 或 AssessmentPageFrame 的核心结构

## 风险与兼容性

### 风险
- **低风险**：仅添加样式偏移，不改变组件逻辑
- 可能影响的场景：如果某些模块已经手动添加了 padding-top，可能导致双重偏移

### 缓解措施
- 先检查各模块的当前布局状态
- 使用 CSS 变量（`--userinfo-bar-height: 50px`）统一管理高度值
- 在验收时检查所有使用 AssessmentPageFrame 的模块

## 验收标准

- [ ] AssessmentPageFrame 的顶部内容（计时器、导航）不会被 UserInfoBar 遮挡
- [ ] 所有使用 AssessmentPageFrame 的模块显示正常
- [ ] UserInfoBar 在所有页面（包括登录页、非框架页）正常显示
- [ ] `openspec validate integrate-userinfo-bar-with-frame --strict` 通过
- [ ] 规范文档准确描述了协同关系
