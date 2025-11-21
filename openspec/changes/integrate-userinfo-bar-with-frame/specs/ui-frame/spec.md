# UI Frame Specification Delta

本文件定义 `integrate-userinfo-bar-with-frame` 变更对 `ui-frame` 规范的修改。

## MODIFIED Requirements

### Requirement: AssessmentPageFrame（统一页面框架）

交互前端 MUST 提供统一的 AssessmentPageFrame 组件，以标准化页面导航、计时、主体与错误托管的组合行为，并与全局 UI 元素（如 UserInfoBar）协同工作。

#### Scenario: 结构
- WHEN 渲染页面容器
- THEN 框架 SHALL 包含：左侧导航（LeftStepperNav）、右上计时（TimerDisplay）、主体内容区、底部"下一页"按钮与错误托盘。

#### Scenario: 行为
- WHEN 用户点击"下一页"
- THEN `onNext` SHALL 默认执行统一提交 Hook；成功后导航，失败时统一展示错误并阻断（DEV 可配置放行）；
- AND 页面 mount/unmount 或切换时 SHALL 自动上报 `page_enter/page_exit` 操作。

#### Scenario: 导航交互与样式 tokens
- WHEN 渲染 LeftStepperNav
- THEN 导航圆点 SHALL 为只读不可点击（默认）；
- AND 组件 SHALL 消费 `nav-tokens.css` 中的尺寸与配色 tokens；
- AND 可通过开关开启 onDotClick（默认关闭）。

#### Scenario: 与全局 UserInfoBar 协同（新增）
- GIVEN UserInfoBar 采用 `position: fixed` 全局固定定位在页面顶部（高度 50px，z-index 1000）
- WHEN AssessmentPageFrame 渲染时
- THEN 框架 SHALL 确保其内容不会被 UserInfoBar 遮挡
- AND 实现方式 MAY 采用以下任一方案：
  - 在框架根元素添加 `margin-top: 50px` 或 `padding-top: 50px`
  - 在全局样式中为包含框架的容器添加顶部偏移
  - 使用 CSS 变量 `--userinfo-bar-height` 统一管理高度值
- AND 框架 SHALL 保持布局灵活性，不强制要求 UserInfoBar 存在

## 设计说明

### 为什么采用全局固定定位方案？

1. **简单可靠**：UserInfoBar 已经采用 fixed 定位并在 `App.jsx` 全局渲染，保持这种模式最小化变更风险
2. **覆盖范围广**：全局 fixed 定位确保所有页面（包括登录页、非框架页）都能看到用户信息
3. **解耦合**：AssessmentPageFrame 无需感知 UserInfoBar 的存在，只需要处理布局偏移
4. **向后兼容**：不破坏现有模块的行为

### 布局偏移的实现选择

推荐在 `frame.module.css` 中添加：

```css
.frame {
  margin-top: var(--userinfo-bar-height, 50px);
  /* 其他样式保持不变 */
}
```

这种方式的优点：
- 使用 CSS 变量便于未来调整
- 提供默认值（50px）确保兼容性
- 所有使用 AssessmentPageFrame 的地方自动生效

### 与现有模块的兼容性

- **Grade 4 模块**：使用 AssessmentPageLayout 包装了 AssessmentPageFrame，需要验证
- **Grade 7 wrapper**：直接使用 AssessmentPageFrame，需要验证
- **Grade 7 Tracking**：使用 PageLayout 包装了 AssessmentPageFrame，需要验证
- **G8 无人机模块**：开发中，直接使用 AssessmentPageFrame

如果某些模块已经手动添加了 padding-top，可能导致双重偏移，需要在验收时逐一检查。

## 相关文件

- `src/components/common/UserInfoBar.jsx` - 全局用户信息栏
- `src/components/common/UserInfoBar.module.css` - UserInfoBar 样式
- `src/shared/ui/PageFrame/AssessmentPageFrame.jsx` - 统一页面框架
- `src/shared/ui/PageFrame/frame.module.css` - 框架样式
- `src/App.jsx` - UserInfoBar 全局渲染位置
