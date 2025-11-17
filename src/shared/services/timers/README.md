# 统一计时器服务

## 概述

统一计时器服务 (`TimerService`) 提供跨模块的一致计时能力，解决现有系统中计时器实现分散、行为不一致的问题。

## 核心特性

- ✅ **跨刷新恢复**: 页面刷新后自动恢复计时，离线时间自动扣减
- ✅ **一次性超时触发**: 并发保护，确保超时回调只触发一次
- ✅ **Scope 去重**: 使用 `core.timer/timeoutFired.<scope>` 标记并支持清理
- ✅ **统一持久化**: 基于 `storageKeys` 的统一本地存储
- ✅ **三种计时器类型**: task(主任务)、questionnaire(问卷)、notice(注意事项)
- ✅ **完整 API**: start/pause/resume/reset/stop
- ✅ **回调机制**: onTimeout (超时) 和 onTick (每秒)
- ✅ **React Hook**: 简化 React 组件中的使用
- ✅ **统一 UI**: 基于 Grade-7 视觉规范的 TimerDisplay 组件

## 目录结构

```
src/shared/
├── services/
│   ├── storage/
│   │   └── storageKeys.js          # 统一存储键名管理
│   └── timers/
│       ├── TimerService.js         # 计时器服务核心
│       ├── useTimer.js             # React Hook
│       ├── getDefaultTimers.js     # 默认配置工具
│       ├── index.js                # 导出入口
│       ├── README.md               # 本文档
│       └── INTEGRATION_GUIDE.md    # 集成指南
├── ui/
│   └── TimerDisplay/
│       ├── index.jsx               # 显示组件
│       ├── TimerContainer.jsx      # 容器组件
│       └── styles.module.css       # 模块化样式
└── styles/
    └── timer-tokens.css            # CSS 变量定义
```

## 快速开始

### 安装 (已包含在项目中)

无需安装，已集成到项目中。

### 基础用法

#### 1. 使用容器组件 (最简单)

```jsx
import TimerContainer from '@shared/ui/TimerDisplay/TimerContainer';
import { TimerService } from '@shared/services/timers';
import { useEffect } from 'react';

function MyPage() {
  useEffect(() => {
    // 启动 40 分钟主任务计时器
    TimerService.startTask(40 * 60, () => {
      console.log('主任务超时!');
      // 跳转逻辑
    });
  }, []);

  return (
    <div>
      <TimerContainer
        type="task"
        warningThreshold={300}
        criticalThreshold={60}
      />
      {/* 你的页面内容 */}
    </div>
  );
}
```

#### 2. 使用 Hook (更灵活)

```jsx
import { useTimer } from '@shared/services/timers';
import TimerDisplay from '@shared/ui/TimerDisplay';

function MyPage() {
  const { remaining, start } = useTimer('task', {
    onTimeout: () => {
      console.log('超时!');
    },
    onTick: (remaining) => {
      if (remaining === 60) {
        alert('还剩1分钟!');
      }
    }
  });

  useEffect(() => {
    start(40 * 60); // 40 分钟
  }, [start]);

  return (
    <div>
      <TimerDisplay
        variant="task"
        remainingSeconds={remaining}
        warningThreshold={300}
        criticalThreshold={60}
      />
      {/* 你的页面内容 */}
    </div>
  );
}
```

#### 3. 直接使用 TimerService (最灵活)

```jsx
import TimerService from '@shared/services/timers';

function MyComponent() {
  useEffect(() => {
    const timer = TimerService.getInstance('task');

    // 启动计时器
    timer.start(40 * 60, () => {
      console.log('超时!');
    });

    // 暂停/恢复
    // timer.pause();
    // timer.resume();

    // 清理
    return () => {
      timer.stop();
    };
  }, []);

  return <div>...</div>;
}
```

## API 文档

### TimerService

#### 静态方法

```js
// 启动主任务计时器 (默认 2400 秒 = 40 分钟)
TimerService.startTask(duration?, options?)

// 启动问卷计时器 (默认 600 秒 = 10 分钟)
TimerService.startQuestionnaire(duration?, options?)

// 启动注意事项计时器 (默认 40 秒)
TimerService.startNotice(duration?, options?)

// 清理 once-only 标记 (Flow 切步时调用)
TimerService.clearTimeoutScope(scope)

// 获取计时器实例
TimerService.getInstance(type) // 'task' | 'questionnaire' | 'notice'

// 重置所有计时器
TimerService.resetAll()

// 停止所有计时器
TimerService.stopAll()

// 获取调试信息
TimerService.getDebugInfo()
```

`options` 参数支持两种写法:

- 直接传入 `onTimeout` 回调函数（保持向后兼容）。
- 传入配置对象 `{ onTimeout, scope, force }`:
  - `scope`: 用于生成 once-only 标记 `core.timer/timeoutFired.<scope>`，推荐使用 `flow::<flowId>::<submoduleId>::<step>` 等可读格式；
  - `force`: 显式允许在计时器仍在运行时强制重启（默认 `false`）。

每种类型都会自动提供默认 scope（`timer.task` / `timer.questionnaire` / `timer.notice`）。当 Flow/CMI 切换子模块或步骤时，可调用 `TimerService.clearTimeoutScope(previousScope)` 清理旧标记，避免跨步骤误判。

#### Scope 去重与清理

```js
import { TimerService } from '@shared/services/timers';

const scope = `flow::${flowId}::${submoduleId}::notice`;

// 启动注意事项计时，scope 将映射到 core.timer/timeoutFired.<scope>
TimerService.startNotice(undefined, {
  scope,
  onTimeout: () => navigate('/next'),
});

// Flow 切步时清理旧 scope，允许下一步重新计时
TimerService.clearTimeoutScope(scope);
```

#### 注意事项默认 40 秒 (DEV/PROD)

- `TimerService.startNotice()` 未显式传参时默认 40 秒，也可使用 `NOTICE_DEFAULT_DURATION` 常量。
- 推荐在 DEV 环境仅提示即可继续，在 PROD 环境阻断跳转，保持体验一致。

```js
import {
  TimerService,
  NOTICE_DEFAULT_DURATION,
} from '@shared/services/timers';

const scope = `flow::${flowId}::notice`;
const isProd = process.env.NODE_ENV === 'production';

TimerService.startNotice(NOTICE_DEFAULT_DURATION, {
  scope,
  onTimeout: () => {
    if (isProd) {
      blockProceedWithModal(); // PROD: 阻断后续操作
    } else {
      showDevBanner('DEV 模式已放行'); // DEV: 仅提示，便于调试
    }
  },
});
```

#### 实例方法

```js
const timer = TimerService.getInstance('task');

// 启动
timer.start(durationSeconds, onTimeout?, force?)

// 控制
timer.pause()
timer.resume()
timer.stop()
timer.reset()

// 状态查询
timer.getRemaining()     // 剩余秒数
timer.getDuration()      // 总时长
timer.isPaused()         // 是否暂停
timer.isTimeout()        // 是否已超时

// 回调管理
timer.onTimeout(callback)
timer.onTick(callback)
timer.offTimeout(callback)
timer.offTick(callback)

// 调试
timer.getDebugInfo()
```

### useTimer Hook

```jsx
const {
  remaining,        // 剩余时间 (秒)
  isRunning,        // 是否运行中
  isPaused,         // 是否暂停
  isTimeout,        // 是否超时
  duration,         // 总时长
  start,            // 启动方法
  pause,            // 暂停方法
  resume,           // 恢复方法
  reset,            // 重置方法
  stop,             // 停止方法
  formatTime,       // 格式化时间 (返回 MM:SS 字符串)
  progress,         // 进度百分比 (0-100)
  getDebugInfo,     // 调试信息
} = useTimer(type, options)

// 参数:
// - type: 'task' | 'questionnaire' | 'notice'
// - options: {
//     onTimeout?: Function,
//     onTick?: (remaining: number) => void,
//     autoStart?: boolean,
//     duration?: number
//   }
```

### TimerDisplay 组件

```jsx
<TimerDisplay
  variant="task"              // 'task' | 'questionnaire' | 'notice'
  remainingSeconds={1200}     // 剩余秒数 (必填)
  warningThreshold={300}      // 警告阈值 (默认 300s / 5分钟)
  criticalThreshold={60}      // 严重阈值 (默认 60s / 1分钟)
  label="剩余时间"            // 自定义标签
  showEmoji={true}            // 是否显示 emoji
  className=""                // 额外 CSS 类名
/>
```

### TimerContainer 组件

```jsx
<TimerContainer
  type="task"                 // 计时器类型 (必填)
  onTimeout={() => {}}        // 超时回调
  onTick={(remaining) => {}}  // 每秒回调
  warningThreshold={300}      // 警告阈值
  criticalThreshold={60}      // 严重阈值
  label="剩余时间"            // 自定义标签
  showEmoji={true}            // 是否显示 emoji
  className=""                // 额外 CSS 类名
/>
```

## 默认配置

### 计时器类型配置

| 类型 | 默认时长 | 警告阈值 | 严重阈值 | 用途 |
|------|---------|---------|---------|------|
| task | 2400s (40分钟) | 300s (5分钟) | 60s (1分钟) | 主任务计时 |
| questionnaire | 600s (10分钟) | 180s (3分钟) | 60s (1分钟) | 问卷计时 |
| notice | 40s | 20s | 10s | 注意事项计时 |

### 获取默认配置

```js
import { getDefaultTimers, getTimerConfigForModule } from '@shared/services/timers';

// 获取默认配置
const config = getDefaultTimers('experiment');
// { duration: 2400, warningThreshold: 300, criticalThreshold: 60 }

// 覆写默认配置
const customConfig = getDefaultTimers('experiment', {
  duration: 45 * 60,  // 45 分钟
});

// 获取模块级配置
const moduleConfig = getTimerConfigForModule('grade-4');
```

## 样式自定义

### 使用 CSS 变量

```css
/* 在模块的 CSS 文件中 */
:root {
  --timer-bg: #your-color;
  --timer-warning-bg: #your-warning-color;
  --timer-critical-bg: #your-critical-color;
  --timer-top: 60px;
  --timer-right: 30px;
}
```

### 模块级覆写

```css
[data-module='grade-4'] {
  --timer-bg: #74b9ff;
  --timer-border-color: #0984e3;
}
```

### 导入 CSS Tokens

```css
@import '@shared/styles/timer-tokens.css';
```

## 存储结构

计时器状态存储在 localStorage 中，键名结构:

```
timer.task.startTime          // 任务开始时间戳
timer.task.remaining          // 剩余秒数
timer.task.duration           // 总时长
timer.task.paused             // 是否暂停
timer.task.timeoutHandled     // 超时是否已处理

timer.questionnaire.*         // 问卷计时器
timer.notice.*                // 注意事项计时器
```

## 集成指南

详细的集成指南请参考: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)

包含:
- Grade-4 模块迁移步骤
- Grade-7/Grade-7-Tracking 模块迁移步骤
- 完整代码示例
- 故障排查

## 测试

### 手动测试清单

- [ ] 启动计时器后刷新页面，计时器继续运行且时间正确
- [ ] 离线一段时间后打开页面，剩余时间正确扣减
- [ ] 超时回调只触发一次 (多个组件订阅时)
- [ ] 暂停/恢复功能正常
- [ ] 警告/严重状态正确显示
- [ ] 多个计时器类型互不干扰

### 调试

```js
// 获取所有计时器的调试信息
const debug = TimerService.getDebugInfo();
console.log(debug);

// 获取单个计时器的调试信息
const timer = TimerService.getInstance('task');
console.log(timer.getDebugInfo());

// 查看 localStorage
Object.keys(localStorage)
  .filter(key => key.startsWith('timer.'))
  .forEach(key => {
    console.log(key, localStorage.getItem(key));
  });
```

## 注意事项

1. **避免重复启动**: 同一类型的计时器在应用中只应启动一次
2. **自动清理**: 组件卸载时自动清理回调,无需手动清理
3. **并发保护**: 超时回调只会触发一次,即使多个组件订阅
4. **localStorage 依赖**: 确保浏览器支持 localStorage 且未被禁用
5. **时区无关**: 计时器使用客户端本地时间,无需考虑时区

## 常见问题

### Q: 计时器不启动怎么办?

A: 检查是否调用了 `start()` 方法，查看控制台是否有错误信息。

### Q: 刷新后时间不准确?

A: 确认 localStorage 中有对应的键名，检查浏览器是否清除了 localStorage。

### Q: 超时回调未触发?

A: 检查是否设置了 `onTimeout` 回调，查看 `isTimeout` 状态。

### Q: 如何同时使用多个计时器?

A: 可以同时使用不同类型的计时器 (task, questionnaire, notice)，它们互不干扰。

## 贡献

如需修改或扩展功能，请:
1. 确保向后兼容
2. 更新相关文档
3. 添加测试用例
4. 更新 CHANGELOG

## License

MIT

## 联系方式

如有问题，请参考:
- [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) - 集成指南
- [架构文档](../../../../docs/交互前端目录结构-新架构.md)
- [改造方案](../../../../docs/需求-交互前端改造方案.md)
