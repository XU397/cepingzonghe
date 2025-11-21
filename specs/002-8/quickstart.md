# Quickstart: 无人机航拍交互课堂子模块

**Date**: 2025-11-19
**Branch**: `002-8`

## Prerequisites

1. 项目环境已配置（Node.js 18+, pnpm）
2. 依赖已安装 (`pnpm install`)
3. 熟悉React 18 + TypeScript开发
4. 了解SubmoduleDefinition接口规范

## Quick Setup

### 1. 创建子模块目录

```bash
mkdir -p src/submodules/g8-drone-imaging/{context,pages,components,utils,styles,assets/images}
```

### 2. 前置任务（必须先完成）

```bash
# 1. 扩展EventTypes枚举
# 编辑 src/shared/services/submission/eventTypes.js
# 添加: CLICK_BLOCKED, AUTO_SUBMIT, READING_COMPLETE

# 2. 准备占位图片（仅用于非实验页面）
# 将背景介绍等页面需要的图片放入 assets/images/
# 注意：实验模拟器使用纯SVG，不需要真实航拍图片
```

### 3. 实现SubmoduleDefinition

> **注意**: `specs/002-8/contracts/` 下的 TypeScript 接口仅为类型参考。
> 实际实现时，接口定义应直接写在 `src/submodules/g8-drone-imaging/` 中，
> 或者将 contracts 复制到该目录下。

```typescript
// src/submodules/g8-drone-imaging/index.tsx
// 接口定义可以内联或从本地 types.ts 导入
import { Component } from './Component';

export const G8DroneImagingSubmodule: G8DroneImagingSubmodule = {
  submoduleId: 'g8-drone-imaging',
  displayName: '8年级无人机航拍-交互实验',
  version: '1.0.0',
  Component,
  getInitialPage: (subPageNum) => PAGE_MAPPING[subPageNum] ?? 'cover',
  getTotalSteps: () => 6,
  getNavigationMode: (pageId) => PAGE_CONFIGS[pageId]?.navigationMode ?? 'experiment',
  getDefaultTimers: () => ({ task: 20 * 60 }),
};
```

### 4. 创建Context

```typescript
// src/submodules/g8-drone-imaging/context/DroneImagingContext.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { DroneImagingContextValue, PageId, ExperimentState } from '../contracts/context-interface';
import { lookupGSD, calculateBlurAmount } from '../utils/gsdLookup';

const initialExperimentState: ExperimentState = {
  currentHeight: 100,
  currentFocalLength: 8,
  currentGSD: 3.01,
  blurAmount: 2.41,
  captureHistory: [],
  operationCount: 0,
};

// Context implementation...
```

### 5. 实现核心组件

```typescript
// src/submodules/g8-drone-imaging/components/DroneSimulator.tsx
import React from 'react';
import styles from '../styles/DroneSimulator.module.css';
import { useDroneImagingContext } from '../context/DroneImagingContext';

export const DroneSimulator: React.FC = () => {
  const { experimentState, setHeight, setFocalLength, capture, resetExperiment } = useDroneImagingContext();

  // Render SVG experiment stage
  // 直接转换参考代码: docs/SVG动画参考/无人机交互动画.html
  // 包含: 无人机SVG、模糊滤镜、高度/焦距控制、GSD显示、拍摄闪光效果
};
```

## Development Workflow

### 启动开发服务器

```bash
pnpm dev
```

### 访问子模块

1. 登录系统
2. 通过开发模块选择器选择 `g8-drone-imaging`
3. 设置起始页码 1-7

### 调试步骤

1. **Page 1**: 确认30秒倒计时和确认框逻辑
2. **Page 2**: 确认5秒强制阅读
3. **Page 3**: 测试文本输入验证（>5字符）
4. **Page 4**: 测试9种参数组合的GSD和模糊效果
5. **Page 5-6**: 测试单选题验证
6. **Page 7**: 测试混合输入验证
7. **刷新恢复**: 在各页面刷新，确认进度恢复

### 验证数据提交

```javascript
// 在浏览器控制台查看提交数据
// Network tab -> /stu/saveHcMark
// 检查 mark 字段的 JSON 结构
```

## Key Implementation Notes

### GSD查找表

```typescript
// src/submodules/g8-drone-imaging/utils/gsdLookup.ts
export const GSD_LOOKUP_TABLE = {
  '100-8': 3.01, '100-24': 1.00, '100-50': 0.48,
  '200-8': 6.03, '200-24': 2.01, '200-50': 0.96,
  '300-8': 9.04, '300-24': 3.01, '300-50': 1.45,
};
```

### 模糊度计算

```typescript
// blur = GSD * 0.8
// GSD 9.04 → blur 7.23px (很模糊)
// GSD 0.48 → blur 0.38px (清晰)
```

### localStorage命名空间

```typescript
const STORAGE_KEYS = {
  answers: 'module.g8-drone-imaging.answers',
  experimentHistory: 'module.g8-drone-imaging.experimentHistory',
  lastPageId: 'module.g8-drone-imaging.lastPageId',
};
```

### 事件记录示例

```typescript
logOperation({
  targetElement: 'experiment_panel',
  eventType: EventTypes.SIMULATION_OPERATION,
  value: JSON.stringify({
    action: 'capture',
    height: 200,
    focalLength: 24,
    gsd: 2.01
  }),
  time: formatTimestamp(new Date())
});
```

## Testing Checklist

- [ ] 所有7页面可正常访问
- [ ] Page 1倒计时和确认框逻辑正确
- [ ] Page 2强制阅读5秒
- [ ] Page 3文本验证 > 5字符
- [ ] Page 4所有9种参数组合GSD正确
- [ ] Page 4图像模糊效果与GSD对应
- [ ] Page 5/6单选验证
- [ ] Page 7混合输入验证
- [ ] 刷新后进度恢复正确
- [ ] 数据提交格式符合MarkObject规范
- [ ] 所有事件使用EventTypes枚举
- [ ] 时间格式为YYYY-MM-DD HH:mm:ss

## Page Layout Guidelines

基于设计说明书 10.3 节的 UI 布局约束：

### Page 1 (Cover) - 注意事项
- 单列居中布局 `.coverContent`
- 倒计时显示在顶部
- 确认框 + 下一页按钮在底部

### Page 2 (Background) - 背景知识
- 左右分栏布局 `.splitLayout`
- 左侧：文字说明
- 右侧：配图（占位图片）

### Page 3 (Hypothesis) - 假设思考
- 左右分栏布局 `.splitLayout`
- 左侧：问题文本
- 右侧：文本输入框

### Page 4-6 (Experiment/Analysis) - 实验与分析
- 实验模拟器占主体区域
- 控制面板在侧边或底部
- GSD 数值和答题区域清晰分离

### Page 7 (Conclusion) - 综合结论
- 垂直堆叠布局
- 选择题在上，文本输入在下

## Reference Documents

- [设计说明书](../../docs/子模块需求文档/无人机航拍交互课堂-子模块设计说明书.md) - 完整设计规范（1200+行）
- [SVG动画参考代码](../../docs/SVG动画参考/无人机交互动画.html) - **DroneSimulator组件的实现参考**
- [规格说明书](spec.md)
- [数据模型](data-model.md)
- [接口契约](contracts/) - TypeScript 类型定义参考

## Troubleshooting

### 问题：GSD显示为0

检查GSD_LOOKUP_TABLE的key格式：`${height}-${focalLength}`

### 问题：样式未隔离

确保使用CSS Modules: `import styles from './xxx.module.css'`

### 问题：事件未记录

确保使用EventTypes枚举而非字符串

### 问题：刷新后状态丢失

检查localStorage.setItem调用和命名空间

## Next Steps

完成开发后：

1. 运行 `pnpm lint` 确保代码质量
2. 完成设计说明书14节的验收用例测试
3. 更新CLAUDE.md中的模块列表（如需要）
4. 提交PR进行代码审查
