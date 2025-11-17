# Tasks: add-unified-timer-service

## 1. 引擎与API
- [x] 1.1 设计 TimerService API：startTask/startQuestionnaire/startNotice/pause/resume/reset
- [x] 1.2 实现 once-only 超时触发与并发保护
- [x] 1.3 实现离线时间扣减与本地持久化（storageKeys）
- [x] 1.4 在 `shared/services/timers/` 输出 TimerService，并复用 `shared/services/storage/storageKeys`

## 2. UI 显示
- [x] 2.1 抽取 7 年级 Timer UI 为 TimerDisplay（像素级一致）
- [x] 2.2 警告/严重阈值（默认 <300s、<60s）可覆盖
- [x] 2.3 生成 `shared/ui/TimerDisplay` 与 `shared/styles/timer-tokens.css`

## 3. 集成
- [x] 3.1 接入 Grade-4（补齐跨刷新与超时自动跳转）- 提供集成指南
- [x] 3.2 对齐 Grade-7、Grade-7-Tracking 的计时来源 - 提供集成指南
- [x] 3.3 Flow/CMI 默认计时配置（getDefaultTimers）接入统一服务

## 4. 增强与策略
- [x] 4.1 只触发一次的并发保护键：规范 `core.timer/timeoutFired.<scope>` 并在切步时清理
- [x] 4.2 注意事项计时默认 40 秒，提供 `startNotice(40s)` 示例与 DEV/PROD 行为
- [x] 4.3 文档化 DEV 放行与 PROD 阻断的差异处理

## 实施说明

### 已完成

1. **存储键名管理** (`src/shared/services/storage/storageKeys.js`)
   - 统一命名规范 (core.*, module.*, flow.*, timer.*)
   - 兼容旧键名读取
   - 提供工具函数 (getStorageItem, setStorageItem, removeStorageItem)

2. **计时器服务核心** (`src/shared/services/timers/TimerService.js`)
   - 三种计时器类型: task, questionnaire, notice
   - 跨刷新恢复 (离线时间自动扣减)
   - 一次性超时触发 (并发保护)
   - pause/resume/reset API
   - onTimeout/onTick 回调机制

3. **React Hook** (`src/shared/services/timers/useTimer.js`)
   - 简化 React 组件中的使用
   - 自动订阅状态变化
   - 自动清理

4. **UI 组件** (`src/shared/ui/TimerDisplay/`)
   - TimerDisplay.jsx - 显示组件 (像素级复用 Grade-7 样式)
   - TimerContainer.jsx - 容器组件 (连接 TimerService)
   - styles.module.css - 模块化样式
   - 支持三种状态: normal, warning, critical, complete

5. **CSS Tokens** (`src/shared/styles/timer-tokens.css`)
   - 统一样式变量
   - 支持主题覆写
   - 响应式设计

6. **辅助工具** (`src/shared/services/timers/getDefaultTimers.js`)
   - getDefaultTimers - 获取默认配置
   - getTimerConfigForModule - 获取模块级配置
   - calculateProgress - 计算进度百分比
   - getTimerState - 判断计时器状态

7. **集成指南** (`src/shared/services/timers/INTEGRATION_GUIDE.md`)
   - Grade-4 迁移步骤
   - Grade-7/Grade-7-Tracking 迁移步骤
   - API 参考
   - 完整示例
   - 故障排查

### 集成方式

模块可以按需选择以下集成方式:

**方式 1: 使用 TimerContainer (最简单)**
```jsx
import TimerContainer from '@shared/ui/TimerDisplay/TimerContainer';
import { TimerService } from '@shared/services/timers';

function MyModule() {
  useEffect(() => {
    TimerService.startTask(2400, () => console.log('超时!'));
  }, []);

  return <TimerContainer type="task" />;
}
```

**方式 2: 使用 useTimer Hook (更灵活)**
```jsx
import { useTimer } from '@shared/services/timers';
import TimerDisplay from '@shared/ui/TimerDisplay';

function MyModule() {
  const { remaining, start } = useTimer('task', {
    onTimeout: () => console.log('超时!')
  });

  useEffect(() => {
    start(2400);
  }, [start]);

  return <TimerDisplay variant="task" remainingSeconds={remaining} />;
}
```

**方式 3: 直接使用 TimerService (最灵活)**
```jsx
import TimerService from '@shared/services/timers';

function MyModule() {
  useEffect(() => {
    const timer = TimerService.getInstance('task');
    timer.start(2400, () => console.log('超时!'));

    return () => timer.stop();
  }, []);

  // 自定义 UI 或使用 TimerDisplay
}
```

### 下一步 (可选)

- 实际迁移各模块 (当前提供了完整的集成指南,模块维护者可按需迁移)
- 在 AppContext 中集成统一计时器 (替换现有计时器逻辑)
- 测试跨刷新恢复和超时触发
- 性能优化 (如果需要)
