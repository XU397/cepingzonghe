# LeftStepperNav 组件

统一的左侧步骤导航组件，基于 Grade-7 视觉规范，通过 CSS 变量（tokens）支持模块级样式覆写。

## 特性

- ✅ 像素级复用 7 年级导航视觉规范
- ✅ 通过 CSS 变量完全可配置
- ✅ 支持实验/问卷两种模式
- ✅ 默认只读（不可点击），可选开启点击跳转
- ✅ 无障碍支持（ARIA 标签、键盘导航）
- ✅ 响应式设计
- ✅ 紧凑模式（隐藏标题和指示器）

## 基本用法

```jsx
import LeftStepperNav from '@/shared/ui/LeftStepperNav';

function MyPage() {
  return (
    <LeftStepperNav
      mode="experiment"
      currentStep={5}
      totalSteps={12}
    />
  );
}
```

## Props

| Prop | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `mode` | `'experiment' \| 'questionnaire'` | `'experiment'` | 导航模式（影响样式） |
| `currentStep` | `number` | **必填** | 当前步骤序号 (1-based) |
| `totalSteps` | `number` | **必填** | 总步骤数 |
| `compact` | `boolean` | `false` | 紧凑模式（隐藏标题和指示器） |
| `onStepClick` | `(step: number) => void` | `undefined` | 步骤点击回调（未设置时不可点击） |
| `title` | `string` | `'进度'` | 导航标题 |
| `showTitle` | `boolean` | `true` | 是否显示标题 |
| `showIndicator` | `boolean` | `true` | 是否显示步骤指示器（如 "5/12"） |

## 使用场景

### 1. 只读导航（默认）

```jsx
<LeftStepperNav
  mode="experiment"
  currentStep={5}
  totalSteps={12}
/>
```

### 2. 可点击跳转（慎用）

```jsx
<LeftStepperNav
  mode="experiment"
  currentStep={5}
  totalSteps={12}
  onStepClick={(step) => {
    if (canJumpTo(step)) {
      navigateToStep(step);
    }
  }}
/>
```

### 3. 紧凑模式

```jsx
<LeftStepperNav
  mode="experiment"
  currentStep={5}
  totalSteps={12}
  compact={true}
/>
```

### 4. 问卷模式

```jsx
<LeftStepperNav
  mode="questionnaire"
  currentStep={3}
  totalSteps={8}
/>
```

## 样式定制

### 方式 1: 全局覆写 CSS 变量

在你的样式文件中：

```css
:root {
  --nav-dot-size: 32px;              /* 圆点直径 */
  --nav-gap: 20px;                   /* 圆点间距 */
  --nav-dot-active: #ff6b6b;         /* 激活色 */
}
```

### 方式 2: 模块级覆写

通过 `data-module` 属性：

```css
[data-module='my-custom-module'] {
  --nav-dot-active: #a29bfe;
  --nav-indicator-bg: #a29bfe;
}
```

在组件中设置：

```jsx
<div data-module="my-custom-module">
  <LeftStepperNav ... />
</div>
```

### 方式 3: 模式级覆写

组件已自动添加 `data-nav-mode` 属性：

```css
[data-nav-mode='questionnaire'] {
  --nav-dot-active: #a29bfe;
  --nav-indicator-bg: #a29bfe;
}
```

## 可配置的 CSS 变量

完整列表请参考 [src/shared/styles/nav-tokens.css](../../styles/nav-tokens.css)

主要变量：

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `--nav-dot-size` | `24px` | 圆点直径 |
| `--nav-gap` | `16px` | 圆点间距 |
| `--nav-line-width` | `2px` | 连接线宽度 |
| `--nav-dot` | `#ffffff` | 默认圆点背景色 |
| `--nav-dot-active` | `#59c1ff` | 激活圆点背景色 |
| `--nav-dot-completed` | `#55efc4` | 完成圆点背景色 |
| `--nav-container-width` | `100px` | 导航容器宽度 |

## 无障碍特性

- 使用语义化 `<nav>` 标签
- ARIA 标签：`aria-label`, `aria-current`
- 键盘导航支持（当 `onStepClick` 设置时）
- 焦点可视化（`:focus-visible`）

## 视觉规范

基于 Grade-7 设计：

- 圆点直径：24px
- 圆点间距：16px
- 连接线宽度：2px
- 字号：14px
- 过渡动画：0.3s ease

## 依赖

- `nav-tokens.css` - 自动引入
- `PropTypes` - 属性验证

## 注意事项

1. **默认只读**：为避免破坏评测流程，默认不可点击。只有显式设置 `onStepClick` 时才启用点击。
2. **步骤序号从 1 开始**：`currentStep` 和 `totalSteps` 都是 1-based。
3. **模式选择**：`mode` 主要影响 `data-nav-mode` 属性，可用于样式定制。
4. **外部框架控制宽度**：统一的 240px 导航栏宽度由 `AssessmentPageFrame` 等外部布局容器提供，组件默认 tokens 维持 100px 以便在独立场景下灵活使用；当需要遵循统一布局时，请在外层容器上设置宽度。
5. **性能优化**：使用 CSS Modules 避免样式污染，使用 CSS 变量提升性能。

## 迁移指南

### 从 Grade-7 StepNavigation 迁移

```diff
- import StepNavigation from '@/components/common/StepNavigation';
+ import LeftStepperNav from '@/shared/ui/LeftStepperNav';

- <StepNavigation
-   currentStepNumber={5}
-   totalSteps={12}
- />
+ <LeftStepperNav
+   mode="experiment"
+   currentStep={5}
+   totalSteps={12}
+ />
```

### 从 Grade-4 LeftNavigation 迁移

```diff
- import LeftNavigation from '../components/LeftNavigation';
+ import LeftStepperNav from '@/shared/ui/LeftStepperNav';

- <LeftNavigation />  {/* 从上下文读取状态 */}
+ <LeftStepperNav
+   mode="experiment"
+   currentStep={currentStep}
+   totalSteps={totalSteps}
+ />
```

## 示例效果

- 默认圆点：白色背景，灰色边框
- 激活圆点：蓝色背景 (#59c1ff)，黑色边框，带缩放效果
- 完成圆点：绿色背景 (#55efc4)，深绿边框
- 连接线：灰色竖线连接所有圆点
- 悬浮效果：轻微缩放 + 阴影增强（仅当可点击时）

## 相关文档

- [nav-tokens.css](../../styles/nav-tokens.css) - CSS 变量定义
- [timer-tokens.css](../../styles/timer-tokens.css) - 计时器 tokens（参考）
- [架构文档](../../../../docs/交互前端目录结构-新架构.md) - 新架构说明
