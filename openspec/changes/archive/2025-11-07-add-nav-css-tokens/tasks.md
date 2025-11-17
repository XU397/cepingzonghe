## Tasks: add-nav-css-tokens

## 1. 样式 Tokens
- [x] 1.1 定义 `nav-tokens.css`（圆点直径、间距、连接线宽度、颜色等）
- [x] 1.2 LeftStepperNav 消费 tokens 并提供覆写示例

## 2. 文档
- [x] 2.1 在架构文档中引用 tokens 文件位置与用法

## 实施总结

### 完成的工作

1. **创建 nav-tokens.css** ([src/shared/styles/nav-tokens.css](../../../src/shared/styles/nav-tokens.css))
   - 定义了完整的导航样式 CSS 变量系统
   - 包含尺寸、间距、颜色、阴影、动画等所有可配置项
   - 提供深色主题和高对比度主题适配
   - 支持模块级和模式级覆写示例

2. **创建 LeftStepperNav 组件** ([src/shared/ui/LeftStepperNav/](../../../src/shared/ui/LeftStepperNav/))
   - 实现了统一的左侧步骤导航组件
   - 基于 Grade-7 视觉规范（24px 圆点、16px 间距、2px 连接线）
   - 使用 CSS Modules 消费 nav-tokens.css 变量
   - 支持实验/问卷两种模式
   - 默认只读，可选开启点击跳转
   - 完整的无障碍支持（ARIA、键盘导航）
   - 提供紧凑模式和多种配置选项

3. **组件文档** ([src/shared/ui/LeftStepperNav/README.md](../../../src/shared/ui/LeftStepperNav/README.md))
   - 详细的使用说明和 Props 文档
   - CSS tokens 定制指南
   - 多种使用场景示例
   - 从旧组件的迁移指南

4. **更新架构文档** ([CLAUDE.md](../../../CLAUDE.md))
   - 在"统一 UI 组件使用规范"章节增强了 LeftStepperNav 文档
   - 添加了 CSS Tokens 定制的详细说明
   - 提供了三种覆写方式的代码示例
   - 列出了主要可配置变量及其默认值

### 技术实现亮点

- **完全可配置**：通过 CSS 变量实现视觉一致性与灵活定制的平衡
- **零侵入性**：使用 CSS Modules 避免样式污染，组件间完全隔离
- **渐进增强**：支持深色主题、高对比度等无障碍特性
- **性能优化**：CSS 变量在运行时动态切换，无需重新渲染
- **文档完善**：组件级 README + 架构级文档 + 代码注释三层文档体系

### 验收标准

✅ nav-tokens.css 定义了所有必需的 CSS 变量
✅ LeftStepperNav 组件正确消费 tokens
✅ 提供了全局/模块级/模式级三种覆写方式
✅ 文档完整，包含使用示例和迁移指南
✅ 符合 Grade-7 视觉基线（24px 圆点、16px 间距、2px 连接线）
