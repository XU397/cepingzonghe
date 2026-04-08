# HCI科学探究监测平台 - 设计系统规范

> 版本: 1.0  
> 更新日期: 2026-02-11  
> 适用范围: 小学4年级 & 初中7年级科学探究测评模块

---

## 1. 设计概述

### 1.1 项目定位

HCI科学探究监测平台是一个面向小学生的交互式科学测评系统，通过游戏化的互动实验评估学生的科学探究能力。

### 1.2 用户画像

- **小学4年级学生**: 9-10岁，注意力集中时间约15-20分钟，偏好鲜艳色彩和动画效果
- **初中7年级学生**: 12-13岁，具备基础逻辑思维能力，偏好简洁现代的界面

### 1.3 设计理念

**"Playful Learning"** - 在玩中学，通过卡通友好的视觉设计降低测评焦虑，提升参与感。

---

## 2. 色彩系统

### 2.1 主色调 (Primary Colors)

基于现有 flow 架构的 cartoon 色彩体系，采用明亮活泼的卡通配色：

| Token                 | 色值      | 用途      | 使用场景                             |
| --------------------- | --------- | --------- | ------------------------------------ |
| `--cartoon-primary`   | `#59c1ff` | 主品牌色  | 主要按钮、选中状态、强调元素         |
| `--cartoon-secondary` | `#ffce6b` | 辅助色    | 次要按钮、高亮、标签                 |
| `--cartoon-green`     | `#67d5b5` | 成功/正面 | 正确答案、完成状态、确认按钮         |
| `--cartoon-red`       | `#ff8a80` | 错误/警告 | 错误提示、删除操作、警示信息         |
| `--cartoon-dark`      | `#2d5b8e` | 深色标题  | 页面标题、重要文本、深色背景上的文字 |

### 2.2 功能色扩展

| Token             | 色值      | 用途               |
| ----------------- | --------- | ------------------ |
| `--color-info`    | `#1976d2` | 信息提示、链接     |
| `--color-warning` | `#ff9800` | 警告信息、注意事项 |
| `--color-success` | `#4caf50` | 成功状态、进度完成 |
| `--color-error`   | `#d32f2f` | 错误状态、验证失败 |

### 2.3 中性色 (Neutral Colors)

| Token                | 色值      | 用途               |
| -------------------- | --------- | ------------------ |
| `--text-primary`     | `#333333` | 主要文本           |
| `--text-secondary`   | `#666666` | 次要文本、说明文字 |
| `--text-tertiary`    | `#999999` | 占位符、禁用文本   |
| `--border-light`     | `#e3eaf3` | 浅色边框、分割线   |
| `--border-medium`    | `#cfd8dc` | 中等边框           |
| `--background-main`  | `#f5f5f5` | 主背景色           |
| `--background-card`  | `#ffffff` | 卡片背景           |
| `--background-frame` | `#f5f7fb` | Frame 容器背景     |

### 2.4 背景渐变

```css
/* 页面主背景 - 柔和的蓝紫渐变 */
--bg-gradient-start: #667eea;
--bg-gradient-end: #764ba2;

/* 实际使用 */
background: linear-gradient(135deg, var(--bg-gradient-start) 0%, var(--bg-gradient-end) 100%);
```

### 2.5 色彩使用原则

#### 2.5.1 对比度要求

- **正文文字与背景**: 最小对比度 4.5:1
- **大号文字 (18px+)**: 最小对比度 3:1
- **交互元素**: 必须有明显的视觉区分

#### 2.5.2 色彩语义

- **蓝色系**: 主要操作、品牌识别、信息传达
- **黄色/橙色**: 注意、提示、高亮
- **绿色**: 成功、确认、正面反馈
- **红色**: 错误、警告、负面反馈

#### 2.5.3 避免的做法

- ❌ 仅用颜色传达信息（必须配合图标或文字）
- ❌ 过多鲜艳色彩堆砌（最多3种主色）
- ❌ 低对比度文字（如浅灰文字配白色背景）

---

## 3. 布局系统

### 3.1 Frame 容器架构

基于 flow 架构的整体布局规范：

```
┌─────────────────────────────────────────────────────────┐
│                    Page Frame (1280×750)                │
│  ┌──────────┬─────────────────────────────────────────┐ │
│  │          │                                         │ │
│  │  Sidebar │          内容区域 (Content Area)         │ │
│  │ (100px)  │          - 子模块内容呈现区              │ │
│  │          │          - 最大宽度: 1180px              │ │
│  │          │                                         │ │
│  └──────────┴─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

### 3.2 尺寸规范

| 元素           | 尺寸              | 说明               |
| -------------- | ----------------- | ------------------ |
| Frame 容器     | 1280×750px        | 主内容区域固定尺寸 |
| 侧边栏宽度     | 100px             | 步骤导航/模块导航  |
| 内容区域内边距 | 20-40px           | 根据内容密度调整   |
| 内容区最大宽度 | 1180px            | 内容容器最大宽度   |
| Frame 圆角     | 18-20px           | 容器圆角           |
| Frame 边框     | 3px solid #ffd93d | 金黄色边框         |

### 3.3 间距系统 (Spacing)

基于 4px 网格系统：

| Token         | 值   | 用途               |
| ------------- | ---- | ------------------ |
| `--space-xs`  | 4px  | 图标间距、紧凑元素 |
| `--space-sm`  | 8px  | 组件内部间距       |
| `--space-md`  | 16px | 组件间间距         |
| `--space-lg`  | 24px | 区块间距           |
| `--space-xl`  | 32px | 大区块分隔         |
| `--space-2xl` | 48px | 页面级间距         |

### 3.4 阴影系统

```css
/* Frame 容器阴影 */
--frame-shadow: 0 20px 50px rgba(255, 193, 7, 0.2);

/* 卡片阴影 - 轻 */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);

/* 卡片阴影 - 中 */
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.1);

/* 卡片阴影 - 重 */
--shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);

/* 按钮阴影 */
--button-shadow: 0 8px 20px rgba(89, 193, 255, 0.35);
```

### 3.5 响应式断点

虽然主要面向桌面端 (1280×720+)，但需保证基础响应式：

| 断点    | 宽度        | 适配说明               |
| ------- | ----------- | ---------------------- |
| Desktop | ≥1280px     | 标准布局               |
| Laptop  | 1024-1279px | 紧凑布局，侧边栏可折叠 |
| Tablet  | 768-1023px  | 堆叠布局，触摸优化     |

---

## 4. 字体系统

### 4.1 字体选择

**中文优先**: 系统默认中文字体栈

```css
/* 标题字体 */
--font-heading:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
  'Microsoft YaHei', sans-serif;

/* 正文字体 */
--font-body:
  -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
  'Microsoft YaHei', sans-serif;

/* 英文装饰字体 (可选) */
--font-display: 'Baloo 2', 'Comic Neue', cursive;
```

### 4.2 字号规范

| 层级     | 大小    | 行高 | 字重 | 用途               |
| -------- | ------- | ---- | ---- | ------------------ |
| 页面标题 | 28-32px | 1.3  | 700  | 页面主标题         |
| 区块标题 | 22-24px | 1.4  | 600  | 区块标题、卡片标题 |
| 小标题   | 18-20px | 1.4  | 600  | 子标题、步骤标题   |
| 正文大   | 16px    | 1.6  | 400  | 重要正文           |
| 正文     | 14px    | 1.6  | 400  | 默认正文           |
| 辅助文字 | 12px    | 1.5  | 400  | 说明、标签         |
| 最小文字 | 11px    | 1.4  | 400  | 注释、时间戳       |

### 4.3 字体颜色

| 用途     | 颜色      | 场景             |
| -------- | --------- | ---------------- |
| 主要文本 | `#333333` | 正文、标题       |
| 次要文本 | `#666666` | 说明、描述       |
| 辅助文本 | `#999999` | 占位符、禁用     |
| 链接文本 | `#1976d2` | 可点击链接       |
| 反白文本 | `#ffffff` | 深色背景上的文字 |

---

## 5. 组件规范

### 5.1 按钮 (Button)

#### 主要按钮 (Primary Button)

```css
.button-primary {
  background: var(--cartoon-primary, #59c1ff);
  color: white;
  border: none;
  border-radius: 14px;
  padding: 14px 32px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(89, 193, 255, 0.35);
  transition: all 0.2s ease;
  cursor: pointer;
}

.button-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 24px rgba(89, 193, 255, 0.45);
}

.button-primary:active {
  transform: translateY(0);
}

.button-primary:disabled {
  background: #cfd8dc;
  box-shadow: none;
  cursor: not-allowed;
}
```

#### 次要按钮 (Secondary Button)

```css
.button-secondary {
  background: white;
  color: var(--cartoon-primary, #59c1ff);
  border: 2px solid var(--cartoon-primary, #59c1ff);
  border-radius: 14px;
  padding: 12px 30px;
  font-size: 16px;
  font-weight: 600;
  transition: all 0.2s ease;
  cursor: pointer;
}

.button-secondary:hover {
  background: rgba(89, 193, 255, 0.1);
}
```

#### 成功/确认按钮

```css
.button-success {
  background: var(--cartoon-green, #67d5b5);
  color: white;
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(103, 213, 181, 0.35);
}
```

#### 警告/删除按钮

```css
.button-danger {
  background: var(--cartoon-red, #ff8a80);
  color: white;
  border-radius: 14px;
  box-shadow: 0 8px 20px rgba(255, 138, 128, 0.35);
}
```

### 5.2 卡片 (Card)

```css
.card {
  background: var(--card-background, #ffffff);
  border-radius: 18px;
  padding: 24px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-light, #e3eaf3);
}

.card-interactive {
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-interactive:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}
```

### 5.3 输入框 (Input)

```css
.input {
  border: 2px solid var(--border-light, #e3eaf3);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 16px;
  background: white;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.input:focus {
  border-color: var(--cartoon-primary, #59c1ff);
  outline: none;
  box-shadow: 0 0 0 3px rgba(89, 193, 255, 0.2);
}

.input-error {
  border-color: var(--color-error, #d32f2f);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(211, 47, 47, 0.2);
}
```

### 5.4 标签/徽章 (Badge)

```css
.badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.badge-primary {
  background: rgba(89, 193, 255, 0.15);
  color: var(--cartoon-dark, #2d5b8e);
}

.badge-success {
  background: rgba(103, 213, 181, 0.15);
  color: #2e7d32;
}

.badge-warning {
  background: rgba(255, 206, 107, 0.2);
  color: #e65100;
}
```

---

## 6. 交互规范

### 6.1 动画与过渡

| 类型     | 时长      | 缓动函数                     | 用途               |
| -------- | --------- | ---------------------------- | ------------------ |
| 微交互   | 150ms     | ease-out                     | 按钮悬停、颜色变化 |
| 标准过渡 | 200ms     | ease                         | 卡片悬停、展开收起 |
| 页面切换 | 300ms     | ease-in-out                  | 页面转场、模态框   |
| 复杂动画 | 400-500ms | cubic-bezier(0.4, 0, 0.2, 1) | 引导动画、庆祝效果 |

### 6.2 悬停状态

- **按钮**: 上移 2px，阴影加深
- **卡片**: 上移 4px，阴影扩散
- **链接**: 颜色加深，可选下划线
- **输入框**: 边框颜色变为主色

### 6.3 聚焦状态 (Focus)

```css
/* 聚焦环 - 符合可访问性标准 */
:focus-visible {
  outline: 3px solid var(--cartoon-primary, #59c1ff);
  outline-offset: 2px;
}

/* 输入框聚焦 */
input:focus,
textarea:focus,
select:focus {
  border-color: var(--cartoon-primary, #59c1ff);
  box-shadow: 0 0 0 3px rgba(89, 193, 255, 0.2);
}
```

### 6.4 触摸目标

- **最小触摸区域**: 44×44px
- **推荐触摸区域**: 48×48px
- **按钮间距**: 最小 8px

---

## 7. 可访问性 (Accessibility)

### 7.1 色彩可访问性

- 所有文字与背景对比度 ≥ 4.5:1
- 不只使用颜色传达信息（配合图标、文字）
- 提供高对比度模式支持

### 7.2 键盘导航

- 所有交互元素可通过 Tab 键访问
- 焦点顺序符合视觉顺序
- 提供可见的焦点指示器

### 7.3 屏幕阅读器

- 图片必须提供 alt 文本
- 按钮使用 aria-label（特别是图标按钮）
- 错误信息使用 role="alert"
- 表单控件关联 label

### 7.4 动画偏好

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. 内容呈现规范

### 8.1 文本内容

- **小学4年级**: 使用简单句子，避免复杂术语
- **初中7年级**: 可适当使用专业词汇，但需解释
- **行长度**: 每行 45-75 个字符（中文约 20-35 字）
- **段落长度**: 控制在 3-4 行以内

### 8.2 图片与图标

- **图标库**: 使用 Lucide 或 Heroicons（SVG）
- **图标尺寸**: 默认 24×24px（按钮），20×20px（内联）
- **图片比例**: 常用 16:9, 4:3, 1:1
- **图片格式**: 优先使用 SVG，照片使用 WebP

### 8.3 表单设计

- **标签位置**: 上方或左侧对齐
- **输入框高度**: 44-48px（触摸友好）
- **错误提示**: 实时验证，即时反馈
- **必填标记**: 使用红色星号 \* 标注

---

## 9. 模块特定规范

### 9.1 4年级模块 (g4-experiment)

**特点**: 更活泼、更卡通化

- 使用更大的圆角 (20-24px)
- 更多动画效果
- 图标尺寸更大 (28-32px)
- 按钮更醒目

### 9.2 7年级模块 (grade-7-tracking / g8-mikania / g8-pv-sand)

**特点**: 稍微收敛，更现代

- 标准圆角 (16-18px)
- 动画更克制
- 标准图标尺寸 (20-24px)
- 更专业的数据可视化

### 9.3 通用子模块规范

所有子模块必须遵循：

- Frame 容器内的布局约束
- 共享的提交按钮样式
- 统一的错误提示样式
- 一致的加载状态

---

## 10. CSS 变量参考

### 10.1 完整变量表

```css
:root {
  /* 主色调 */
  --cartoon-primary: #59c1ff;
  --cartoon-secondary: #ffce6b;
  --cartoon-green: #67d5b5;
  --cartoon-red: #ff8a80;
  --cartoon-dark: #2d5b8e;
  --cartoon-light: #e6f7ff;

  /* 功能色 */
  --color-info: #1976d2;
  --color-success: #4caf50;
  --color-warning: #ff9800;
  --color-error: #d32f2f;

  /* 中性色 */
  --text-primary: #333333;
  --text-secondary: #666666;
  --text-tertiary: #999999;
  --border-light: #e3eaf3;
  --border-medium: #cfd8dc;
  --background-main: #f5f5f5;
  --background-card: #ffffff;
  --background-frame: #f5f7fb;

  /* 布局 */
  --frame-max-width: 1280px;
  --frame-height: 750px;
  --frame-border-color: #ffd93d;
  --frame-border-width: 3px;
  --frame-border-radius: 20px;
  --frame-shadow: 0 20px 50px rgba(255, 193, 7, 0.2);
  --nav-width: 100px;

  /* 间距 */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 32px;
  --space-2xl: 48px;

  /* 阴影 */
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.12);
  --button-shadow: 0 8px 20px rgba(89, 193, 255, 0.35);

  /* 字体 */
  --font-heading:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', sans-serif;
  --font-body:
    -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB',
    'Microsoft YaHei', sans-serif;

  /* 圆角 */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 18px;
  --radius-xl: 24px;
  --radius-full: 999px;

  /* 过渡 */
  --transition-fast: 150ms ease;
  --transition-normal: 200ms ease;
  --transition-slow: 300ms ease;
}
```

---

## 11. 设计检查清单

### 11.1 交付前检查

#### 视觉质量

- [ ] 未使用 emoji 作为图标
- [ ] 所有图标来自一致的图标集
- [ ] 悬停状态不引起布局偏移
- [ ] 使用主题色直接，而非 var() 包装

#### 交互

- [ ] 所有可点击元素有 cursor-pointer
- [ ] 悬停状态有明显视觉反馈
- [ ] 过渡动画平滑 (150-300ms)
- [ ] 聚焦状态可见（键盘导航）

#### 色彩与对比度

- [ ] 正文文字对比度 ≥ 4.5:1
- [ ] 玻璃/透明元素在亮色模式下可见
- [ ] 边框在两种模式下可见
- [ ] 测试亮色和暗色模式

#### 布局

- [ ] 浮动元素与边缘有适当间距
- [ ] 无内容被固定导航栏遮挡
- [ ] 响应式适配 1280px、1440px
- [ ] 移动端无横向滚动

#### 可访问性

- [ ] 所有图片有 alt 文本
- [ ] 表单输入有关联 label
- [ ] 颜色不是唯一的指示器
- [ ] 尊重 prefers-reduced-motion

---

## 12. 参考资源

### 12.1 现有实现参考

- `src/shared/styles/page-frame.css` - Frame 容器样式
- `src/submodules/g8-mikania-experiment/styles/variables.css` - CSS 变量定义
- `src/modules/grade-7-tracking/styles/` - 模块样式参考

### 12.2 相关文档

- [ui-ux-pro-max Skill](https://skills.sh/nextlevelbuilder/ui-ux-pro-max-skill) - 设计指南来源
- [WCAG 2.1](https://www.w3.org/WAI/WCAG21/quickref/) - 可访问性标准

---

## 13. 更新日志

| 版本 | 日期       | 更新内容                                                  |
| ---- | ---------- | --------------------------------------------------------- |
| 1.0  | 2026-02-11 | 初始版本，整合现有 flow 架构色彩与 ui-ux-pro-max 设计指南 |

---

## 附录: 快速参考卡

### 颜色速查

```
主色:    #59c1ff (蓝)
辅助:    #ffce6b (黄)
成功:    #67d5b5 (绿)
错误:    #ff8a80 (红)
标题:    #2d5b8e (深蓝)
文本:    #333333 (黑)
边框:    #e3eaf3 (浅灰)
背景:    #f5f5f5 (灰白)
```

### 间距速查

```
4px  - 图标间距
8px  - 组件内部
16px - 组件之间
24px - 区块间距
32px - 大区块
48px - 页面级
```

### 圆角速查

```
8px  - 小元素 (标签、输入框)
12px - 中等 (按钮)
18px - 大元素 (卡片)
24px - 超大 (模态框)
999px - 胶囊形
```
