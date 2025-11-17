# G7 Experiment Submodule

7年级蒸馒头实验子模块包装器示例。

## 文件结构

```
g7-experiment/
├── index.jsx          # 子模块定义（导出 SubmoduleDefinition）
├── Component.jsx      # 子模块主组件
├── mapping.ts         # 页码映射与配置
└── README.md          # 说明文档
```

## 实现要点

### 1. mapping.ts

定义页码映射、总步数、导航模式和默认计时器配置。

```typescript
export const PAGE_MAPPING: Record<string, string> = {
  '1': 'page-id-1',
  '2': 'page-id-2',
  // ...
};

export function getInitialPage(subPageNum: string): string;
export function getTotalSteps(): number;
export function getNavigationMode(pageId: string): 'experiment' | 'questionnaire';
export function getDefaultTimers(): { task?: number; questionnaire?: number };
```

### 2. Component.jsx

主组件需要：

- 接收 `userContext`, `initialPageId`, `options`, `flowContext`
- 包装现有模块实现
- 集成统一计时器（TimerService）
- 在完成时调用 `flowContext.onComplete()`
- 在超时时调用 `flowContext.onTimeout()`
- 使用 `enhancePageDesc` 增强提交的 pageDesc

### 3. index.jsx

导出符合 CMI 接口的 `SubmoduleDefinition` 对象。

## TODO（未完成功能）

当前为基础框架，实际使用前需要：

1. **计时器集成**：在 Component 中集成 `TimerService`
2. **完成回调**：在最后一页完成时调用 `flowContext.onComplete()`
3. **超时处理**：计时器到期时调用 `flowContext.onTimeout()`
4. **PageDesc 增强**：提交时使用 `enhancePageDesc` 追加 Flow 上下文
5. **页码转换**：将 `initialPageId` 转换为原模块的页码格式

## 其他子模块

按照此模式实现其他子模块：

- `g7-questionnaire` - 7年级问卷
- `g7-tracking-experiment` - 7年级追踪实验
- `g7-tracking-questionnaire` - 7年级追踪问卷
- `g4-experiment` - 4年级实验

每个子模块需要：
1. 创建目录 `submodules/<submoduleId>/`
2. 复制 `mapping.ts`, `Component.jsx`, `index.jsx` 模板
3. 调整页码映射和配置
4. 实现包装逻辑
5. 在 `submodules/registry.ts` 中注册
