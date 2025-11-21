# Quick Start Guide: 光伏治沙交互实验子模块

**Created**: 2025-11-19
**Purpose**: 为开发者提供快速实现光伏治沙子模块的实用指南

## 开发环境准备

### 前置条件

```bash
# 确认Node.js版本
node --version  # 需要 >= 18.0.0

# 确认包管理器
pnpm --version  # 项目使用pnpm

# 确认分支状态
git branch      # 应该在 003-c-users-lh 分支
```

### 本地环境设置

```bash
# 安装依赖
pnpm install

# 启动开发服务器(Mock模式)
pnpm run dev

# 运行测试
pnpm test

# 代码质量检查
pnpm run lint
```

## 核心文件结构

### 创建基本目录结构

```bash
mkdir -p src/submodules/g8-pv-sand-experiment/{pages,components,hooks,styles,constants}
```

### 关键文件清单

```
src/submodules/g8-pv-sand-experiment/
├── index.tsx                    # ✅ 必须 - CMI接口导出
├── Component.tsx                # ✅ 必须 - 主组件
├── mapping.ts                   # ✅ 必须 - 页面映射逻辑
├── pages/
│   ├── Page01InstructionsCover.tsx  # ✅ 必须 - 8个页面组件
│   ├── Page02Cover.tsx
│   ├── Page03Background.tsx
│   ├── Page04ExperimentDesign.tsx
│   ├── Page05Tutorial.tsx
│   ├── Page06Experiment1.tsx
│   ├── Page07Experiment2.tsx
│   └── Page08Analysis.tsx
├── components/
│   ├── WindSpeedSimulator.tsx   # ⭐ 核心 - SVG风速仪组件
│   └── DataVisualization.tsx    # ⭐ 核心 - 数据图表组件
├── constants/
│   └── windSpeedData.ts         # ✅ 必须 - 实验数据常量
└── styles/
    └── *.module.css             # ✅ 必须 - CSS模块样式
```

## 30分钟实现路径

### Step 1: 创建CMI接口定义 (5分钟)

```typescript
// src/submodules/g8-pv-sand-experiment/index.tsx
import { PvSandExperimentComponent } from './Component';

export const g8PvSandExperimentSubmodule = {
  submoduleId: "g8-pv-sand-experiment",
  displayName: "8年级光伏治沙-交互实验",
  version: "1.0.0",
  
  Component: PvSandExperimentComponent,
  
  getInitialPage: (subPageNum) => {
    const pageNum = parseInt(subPageNum, 10);
    if (!pageNum || pageNum < 1 || pageNum > 8) return 'instructions_cover';
    
    const mapping = {
      1: 'instructions_cover', 2: 'cover_intro', 3: 'background_notice',
      4: 'experiment_design', 5: 'tutorial_simulation', 6: 'experiment_task1',
      7: 'experiment_task2', 8: 'conclusion_analysis'
    };
    
    return mapping[pageNum] || 'instructions_cover';
  },
  
  getTotalSteps: () => 5, // 仅计算Page 4-8
  
  getNavigationMode: (pageId) => {
    return ['instructions_cover', 'cover_intro', 'background_notice'].includes(pageId) 
      ? 'hidden' : 'experiment';
  },
  
  getDefaultTimers: () => ({
    task: 20 * 60,     // 20分钟
    questionnaire: 0
  })
};
```

### Step 2: 实现主组件骨架 (5分钟)

```typescript
// src/submodules/g8-pv-sand-experiment/Component.tsx
import React, { useState } from 'react';
import { usePageSubmission } from '@shared/services/submission/usePageSubmission.js';

export function PvSandExperimentComponent({ userContext, initialPageId, options }) {
  const [currentPageId, setCurrentPageId] = useState(initialPageId);
  const [answers, setAnswers] = useState({});
  const [operations, setOperations] = useState([]);
  
  const { submit, isSubmitting } = usePageSubmission({
    getUserContext: () => ({
      batchCode: userContext.user.batchCode,
      examNo: userContext.user.examNo
    }),
    buildMark: () => ({
      pageNumber: getPageNumber(currentPageId),
      pageDesc: `[${flowId}/g8-pv-sand-experiment/${getStepIndex(currentPageId)}] 光伏治沙实验`,
      operationList: operations,
      answerList: Object.entries(answers).map(([key, value], index) => ({
        code: index + 1,
        targetElement: key,
        value: String(value)
      })),
      beginTime: formatDateTime(new Date()),
      endTime: formatDateTime(new Date()),
      imgList: []
    })
  });
  
  const handleNext = async () => {
    const success = await submit();
    if (success) {
      // 导航到下一页
      setCurrentPageId(getNextPageId(currentPageId));
      setOperations([]); // 清理操作记录
    }
  };
  
  // 页面路由逻辑
  const renderCurrentPage = () => {
    switch (currentPageId) {
      case 'instructions_cover':
        return <Page01InstructionsCover onNext={handleNext} />;
      case 'experiment_design':
        return <Page04ExperimentDesign onNext={handleNext} />;
      // ... 其他页面
      default:
        return <div>页面未找到: {currentPageId}</div>;
    }
  };
  
  return (
    <div className="pv-sand-experiment">
      {renderCurrentPage()}
    </div>
  );
}
```

### Step 3: 实现数据常量 (2分钟)

```typescript
// src/submodules/g8-pv-sand-experiment/constants/windSpeedData.ts
export const WIND_SPEED_DATA = {
  20: { withPanel: 2.09, noPanel: 2.37 },
  50: { withPanel: 2.25, noPanel: 2.62 },
  100: { withPanel: 1.66, noPanel: 2.77 }
} as const;

export const HEIGHT_LEVELS = [20, 50, 100] as const;
export type HeightLevel = typeof HEIGHT_LEVELS[number];

// 页面映射常量
export const PAGE_MAPPING = {
  1: { pageId: 'instructions_cover', navigationMode: 'hidden' },
  2: { pageId: 'cover_intro', navigationMode: 'hidden' },
  3: { pageId: 'background_notice', navigationMode: 'hidden' },
  4: { pageId: 'experiment_design', navigationMode: 'experiment' },
  5: { pageId: 'tutorial_simulation', navigationMode: 'experiment' },
  6: { pageId: 'experiment_task1', navigationMode: 'experiment' },
  7: { pageId: 'experiment_task2', navigationMode: 'experiment' },
  8: { pageId: 'conclusion_analysis', navigationMode: 'experiment' }
} as const;
```

### Step 4: 实现核心SVG组件 (10分钟)

```typescript
// src/submodules/g8-pv-sand-experiment/components/WindSpeedSimulator.tsx
import React, { useState, useEffect, useRef } from 'react';
import { WIND_SPEED_DATA } from '../constants/windSpeedData';
import styles from '../styles/WindSpeedSimulator.module.css';

export function WindSpeedSimulator({ height = 50, onDataCollected }) {
  const [needleAngle, setNeedleAngle] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [displayValues, setDisplayValues] = useState({ left: 0, right: 0 });
  const animationRef = useRef();
  
  const startExperiment = () => {
    setIsAnimating(true);
    
    // 2秒动画
    setTimeout(() => {
      const data = WIND_SPEED_DATA[height];
      setDisplayValues({
        left: data.withPanel,
        right: data.noPanel
      });
      setNeedleAngle(90); // 模拟指针转动
      setIsAnimating(false);
      
      // 通知父组件数据已收集
      onDataCollected?.(data);
    }, 2000);
  };
  
  const reset = () => {
    setNeedleAngle(0);
    setDisplayValues({ left: 0, right: 0 });
    setIsAnimating(false);
  };
  
  return (
    <div className={styles.simulator}>
      {/* SVG动画区域 */}
      <svg width="400" height="200" className={styles.svgContainer}>
        {/* 背景天空渐变 */}
        <defs>
          <linearGradient id="skyGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--sky-gradient-top)" />
            <stop offset="100%" stopColor="var(--sky-gradient-bottom)" />
          </linearGradient>
        </defs>
        
        <rect width="400" height="200" fill="url(#skyGradient)" />
        
        {/* 光伏板 (左侧) */}
        <rect x="50" y="120" width="80" height="40" 
              fill="#2c5282" rx="4" />
        <text x="90" y="140" textAnchor="middle" 
              fontSize="12" fill="white">光伏板</text>
        
        {/* 空地 (右侧) */}
        <rect x="270" y="120" width="80" height="40" 
              fill="#8B4513" rx="4" />
        <text x="310" y="140" textAnchor="middle" 
              fontSize="12" fill="white">空地</text>
        
        {/* 风速仪 (左侧) */}
        <g transform={`translate(90, 80)`}>
          <circle r="15" fill="#333" />
          <g transform={`rotate(${isAnimating ? needleAngle : 0})`}
             className={isAnimating ? styles.spinning : ''}>
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#fff" strokeWidth="2" />
            <line x1="-8" y1="-8" x2="8" y2="8" stroke="#fff" strokeWidth="1" />
          </g>
          <text y="30" textAnchor="middle" fontSize="14">
            {displayValues.left.toFixed(2)} m/s
          </text>
        </g>
        
        {/* 风速仪 (右侧) */}
        <g transform={`translate(310, 80)`}>
          <circle r="15" fill="#333" />
          <g transform={`rotate(${isAnimating ? needleAngle + 45 : 0})`}
             className={isAnimating ? styles.spinning : ''}>
            <line x1="0" y1="-12" x2="0" y2="12" stroke="#fff" strokeWidth="2" />
            <line x1="-8" y1="-8" x2="8" y2="8" stroke="#fff" strokeWidth="1" />
          </g>
          <text y="30" textAnchor="middle" fontSize="14">
            {displayValues.right.toFixed(2)} m/s
          </text>
        </g>
        
        {/* 高度标注 */}
        <text x="200" y="20" textAnchor="middle" fontSize="16" fontWeight="bold">
          测量高度: {height}cm
        </text>
      </svg>
      
      {/* 控制按钮 */}
      <div className={styles.controls}>
        <button 
          onClick={startExperiment} 
          disabled={isAnimating}
          className={styles.startButton}
        >
          {isAnimating ? '测量中...' : '开始实验'}
        </button>
        <button 
          onClick={reset} 
          disabled={isAnimating}
          className={styles.resetButton}
        >
          重置
        </button>
      </div>
    </div>
  );
}
```

### Step 5: 创建基础样式 (3分钟)

```css
/* src/submodules/g8-pv-sand-experiment/styles/WindSpeedSimulator.module.css */
.simulator {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: var(--card-background);
  border-radius: 12px;
  box-shadow: var(--cartoon-shadow);
}

.svgContainer {
  border: 2px solid var(--cartoon-border);
  border-radius: 8px;
  overflow: hidden;
}

.spinning {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.controls {
  display: flex;
  gap: 16px;
  margin-top: 16px;
}

.startButton, .resetButton {
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  border: 2px solid var(--cartoon-border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.startButton {
  background: var(--cartoon-primary);
  color: white;
  border-color: var(--cartoon-primary);
}

.startButton:hover:not(:disabled) {
  background: #4aa3d6;
}

.resetButton {
  background: var(--card-background);
  color: var(--text-color);
}

.startButton:disabled, .resetButton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### Step 6: 注册到子模块系统 (5分钟)

```typescript
// 更新 src/submodules/registry.ts
import { g8PvSandExperimentSubmodule } from './g8-pv-sand-experiment';

export const submoduleRegistry = new Map([
  // ... 现有子模块
  ['g8-pv-sand-experiment', g8PvSandExperimentSubmodule],
]);

export function getSubmoduleById(submoduleId) {
  return submoduleRegistry.get(submoduleId);
}
```

```css
/* 更新 src/styles/global.css - 添加实验环境颜色 */
:root {
  /* 现有颜色... */
  
  /* 实验仿真环境背景 */
  --sky-gradient-top: #87ceeb;    /* 天空蓝上部 */
  --sky-gradient-bottom: #e0f6ff; /* 淞蓝下部 */
}
```

## 快速测试

### 本地测试流程

```bash
# 1. 启动开发服务器
pnpm run dev

# 2. 访问测试URL
# http://localhost:3000/flow/test-flow-id
# (需要后端配置返回对应的子模块URL)

# 3. 验证功能清单
```

### 功能验证清单

- [ ] **CMI接口**: 子模块正确加载和初始化
- [ ] **页面导航**: 8个页面正确切换，hidden模式生效
- [ ] **SVG动画**: 风速仪2秒动画流畅运行
- [ ] **数据常量**: 显示正确的预定义风速数据
- [ ] **答案收集**: 输入内容正确保存和提交
- [ ] **事件记录**: page_enter/page_exit/click/change事件正确记录
- [ ] **计时器**: 20分钟计时正常运行
- [ ] **状态恢复**: 页面刷新后正确恢复进度

## 调试技巧

### 常见问题排查

1. **子模块未加载**: 检查 `registry.ts` 注册和 CMI 接口实现
2. **页面导航异常**: 验证 `getInitialPage` 和 `getTotalSteps` 方法
3. **数据提交失败**: 检查 `usePageSubmission` 配置和 MarkObject 结构
4. **SVG动画卡顿**: 确认CSS `will-change` 和硬件加速配置
5. **样式冲突**: 验证CSS Modules命名和全局变量声明

### 开发工具

```bash
# ESLint检查
pnpm run lint

# 类型检查
npx tsc --noEmit

# 测试运行
pnpm test src/submodules/g8-pv-sand-experiment

# 构建检查
pnpm run build
```

## 下一步

完成基础实现后，继续开发：

1. **完善8个页面组件**: 实现具体的UI和交互逻辑
2. **数据可视化组件**: 为Page 8创建折线图展示
3. **答案草稿功能**: 实现本地存储和状态恢复
4. **错误边界处理**: 添加SVG降级和网络重试逻辑
5. **性能优化**: 确保60FPS和低性能设备兼容

遵循这个快速开始指南，可以在30分钟内建立光伏治沙子模块的基础框架，并在后续迭代中逐步完善功能细节。