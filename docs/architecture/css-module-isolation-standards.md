# CSS模块隔离标准规范

## 概述

为了防止多模块系统中的样式冲突，建立统一的CSS隔离标准，确保各模块样式独立，互不影响。

## 核心原则

### 1. 样式命名空间隔离
- **新模块必须使用CSS Modules模式**（`.module.css`文件）
- **现有7年级模块保持CSS Modules不变**
- **4年级模块使用独立容器命名空间**

### 2. 全局样式管理
- **共享样式**：仅在`src/styles/global.css`中定义
- **模块特定样式**：必须使用模块前缀或CSS Modules
- **禁止动态修改全局CSS类**

### 3. 样式优先级控制
- **特异性原则**：模块样式使用更高特异性选择器
- **!important限制**：仅用于覆盖第三方库样式
- **层叠顺序**：全局 < 模块 < 组件 < 内联样式

## 实施标准

### A. 新模块开发标准

#### CSS Modules模式（推荐）
```css
/* src/modules/grade-X/components/Component.module.css */
.container {
  /* 自动生成唯一类名：Component_container__hash */
}

.title {
  /* 自动生成唯一类名：Component_title__hash */
}
```

```jsx
import styles from './Component.module.css';

const Component = () => (
  <div className={styles.container}>
    <h1 className={styles.title}>标题</h1>
  </div>
);
```

#### 命名空间模式（备选）
```css
/* src/modules/grade-X/styles/Layout.css */
.grade-x-container {
  /* 使用模块前缀避免冲突 */
}

.grade-x-title {
  /* 所有类名带模块标识 */
}
```

### B. 现有模块维护标准

#### 7年级模块（保持现状）
- **继续使用CSS Modules**
- **不修改现有样式结构**
- **新组件遵循CSS Modules模式**

#### 4年级模块（渐进式改造）
- **短期**：使用独立容器`.grade-4-module-container`
- **中期**：逐步改为CSS Modules
- **长期**：完全使用CSS Modules模式

### C. 全局样式使用规范

#### 允许的全局样式
```css
/* src/styles/global.css */
:root {
  /* CSS自定义属性 */
  --primary-color: #4a90e2;
}

body {
  /* 基础样式重置 */
}

.app-container {
  /* 应用级容器样式 */
}
```

#### 禁止的全局样式
```css
/* ❌ 不要在全局定义具体组件样式 */
.button {
  /* 应该在组件级定义 */
}

.form-input {
  /* 应该使用CSS Modules */
}
```

## 冲突解决策略

### 1. 样式优先级冲突
```css
/* 使用更具体的选择器 */
.module-container .component-class {
  /* 模块内样式 */
}

/* 或使用CSS自定义属性隔离 */
.module-container {
  --module-primary: #custom-color;
}
```

### 2. 第三方库样式冲突
```css
/* 使用命名空间隔离第三方样式 */
.module-container .ant-button {
  /* 仅在模块内覆盖antd样式 */
}
```

### 3. 响应式样式冲突
```css
/* 使用容器查询代替媒体查询 */
@container module-container (max-width: 768px) {
  .component {
    /* 模块内响应式样式 */
  }
}
```

## 工具和验证

### 1. 开发时检查
```javascript
// eslint-plugin-css-modules
// 检查CSS Modules使用规范

// stylelint
// 检查CSS命名规范
```

### 2. 构建时验证
```javascript
// webpack插件检查全局样式污染
// 确保模块样式隔离
```

### 3. 运行时监控
```javascript
// 开发环境下检测样式冲突
// 警告全局样式被意外修改
```

## 迁移计划

### 阶段1：立即修复（已完成）
- [x] 移除4年级模块对全局`.task-wrapper`的修改
- [x] 使用独立容器`.grade-4-module-container`
- [x] 建立CSS隔离规范文档

### 阶段2：规范化改造（2周内）
- [ ] 将4年级模块改为CSS Modules模式
- [ ] 建立自动化样式检查工具
- [ ] 更新开发文档和培训材料

### 阶段3：标准化推广（1个月内）
- [ ] 所有新模块强制使用CSS Modules
- [ ] 建立样式review checklist
- [ ] 完善构建时样式验证

## 最佳实践示例

### 模块容器设计
```jsx
// 每个模块都有独立的根容器
const ModuleComponent = () => (
  <div className="grade-x-module-container">
    {/* 模块内容 */}
  </div>
);
```

### 样式文件组织
```
src/modules/grade-X/
├── styles/
│   ├── Layout.module.css      # 布局样式
│   ├── Theme.module.css       # 主题样式
│   └── Components.module.css  # 组件样式
├── components/
│   └── Component/
│       ├── Component.jsx
│       └── Component.module.css
```

### 共享样式抽取
```css
/* src/shared/styles/mixins.css */
@mixin button-base {
  /* 按钮基础样式，可被各模块import */
}
```

## 维护和更新

### 1. 定期Review
- **每月检查**：样式冲突和性能影响
- **版本更新**：确保规范与工具链同步
- **团队培训**：新成员CSS隔离标准培训

### 2. 问题跟踪
- **冲突记录**：建立样式冲突issue模板
- **解决方案库**：常见冲突问题和解决方案
- **性能监控**：CSS加载和渲染性能指标

### 3. 规范演进
- **技术调研**：关注CSS新技术和最佳实践
- **规范更新**：根据项目发展调整隔离策略
- **工具升级**：持续改进自动化检查工具