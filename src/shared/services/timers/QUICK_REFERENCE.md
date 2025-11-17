# 统一计时器服务 - 快速参考

## 30 秒上手

```jsx
import TimerContainer from '@shared/ui/TimerDisplay/TimerContainer';
import { TimerService } from '@shared/services/timers';

function MyPage() {
  useEffect(() => {
    TimerService.startTask(40 * 60, () => {
      console.log('超时!');
      navigate('/complete');
    });
  }, []);

  return <TimerContainer type="task" />;
}
```

## 核心 API

### 启动计时器
```js
import {
  TimerService,
  NOTICE_DEFAULT_DURATION,
} from '@shared/services/timers';

// 主任务 (40分钟) - 绑定 Flow scope
TimerService.startTask(2400, {
  scope: 'flow::g7::task',
  onTimeout: () => console.log('任务超时!'),
});

// 问卷 (10分钟)
TimerService.startQuestionnaire(600, {
  scope: 'flow::g7::survey',
  onTimeout: () => console.log('问卷超时!'),
});

// 注意事项 (默认 40 秒) - DEV 放行 / PROD 阻断
TimerService.startNotice(NOTICE_DEFAULT_DURATION, {
  scope: 'flow::g7::notice',
  onTimeout: () => {
    if (process.env.NODE_ENV === 'production') {
      console.log('阻断: 请等待跳转');
    } else {
      console.log('DEV: 仅提示即可继续');
    }
  },
});

// Flow 切步时清理 once-only 标记
TimerService.clearTimeoutScope('flow::g7::notice');
```

### 控制计时器
```js
const timer = TimerService.getInstance('task');

timer.pause();              // 暂停
timer.resume();             // 恢复
timer.reset();              // 重置
timer.stop();               // 停止

// 查询状态
timer.getRemaining();       // 剩余秒数
timer.isPaused();           // 是否暂停
timer.isTimeout();          // 是否超时
```

### React Hook
```jsx
import { useTimer } from '@shared/services/timers';

const { remaining, start, pause, resume } = useTimer('task', {
  scope: 'flow::g7::task',
  onTimeout: () => console.log('超时!'),
  onTick: (remaining) => console.log(remaining)
});

// 使用
useEffect(() => { start(2400); }, [start]);
// 可在需要时覆盖 scope: start(2400, { scope: 'flow::g7::task::retry', force: true });
```

### UI 组件

#### 容器组件 (推荐)
```jsx
<TimerContainer
  type="task"                 // 'task' | 'questionnaire' | 'notice'
  onTimeout={() => {}}        // 超时回调
  scope="flow::g7::task"      // once-only 去重作用域
  warningThreshold={300}      // 5分钟警告
  criticalThreshold={60}      // 1分钟严重
/>
```

#### 显示组件
```jsx
<TimerDisplay
  variant="task"
  remainingSeconds={1200}
  warningThreshold={300}
  criticalThreshold={60}
/>
```

## 默认配置

| 类型 | 时长 | 警告 | 严重 |
|------|------|------|------|
| task | 40分钟 | 5分钟 | 1分钟 |
| questionnaire | 10分钟 | 3分钟 | 1分钟 |
| notice | 40秒 | 20秒 | 10秒 |

## 样式自定义

```css
:root {
  --timer-bg: #ffeaa7;
  --timer-warning-bg: #ffb347;
  --timer-critical-bg: #ff6b6b;
  --timer-top: 55px;
  --timer-right: 20px;
}
```

## 常见场景

### 场景 1: 主任务计时
```jsx
useEffect(() => {
  TimerService.startTask(45 * 60, () => {
    alert('时间到!');
    navigate('/complete');
  });
}, []);

return <TimerContainer type="task" />;
```

### 场景 2: 问卷计时
```jsx
useEffect(() => {
  TimerService.startQuestionnaire(10 * 60, () => {
    submitQuestionnaire();
    navigate('/next');
  });
}, []);

return <TimerContainer type="questionnaire" />;
```

### 场景 3: 注意事项倒计时
```jsx
import { TimerService, NOTICE_DEFAULT_DURATION } from '@shared/services/timers';

const scope = 'flow::g7::intro::notice';

useEffect(() => {
  TimerService.startNotice(NOTICE_DEFAULT_DURATION, {
    scope,
    onTimeout: () => {
      if (process.env.NODE_ENV === 'production') {
        setCanProceed(false);
        openBlockingModal();
      } else {
        console.log('[DEV] Notice timeout reached, 放行下一步');
        setCanProceed(true);
      }
    },
  });

  return () => TimerService.clearTimeoutScope(scope);
}, [scope]);

return <TimerContainer type="notice" scope={scope} />;
```

### 场景 4: 自定义 UI
```jsx
const { remaining, formatTime } = useTimer('task');

return (
  <div className="my-timer">
    剩余: {formatTime()}
    {remaining < 300 && <span>⚠️ 还剩5分钟!</span>}
  </div>
);
```

### 场景 5: 暂停/恢复
```jsx
const timer = TimerService.getInstance('task');

<button onClick={() => timer.pause()}>暂停</button>
<button onClick={() => timer.resume()}>恢复</button>
```

## 调试

```js
// 查看所有计时器状态
console.log(TimerService.getDebugInfo());

// 查看单个计时器
const timer = TimerService.getInstance('task');
console.log(timer.getDebugInfo());

// 查看 localStorage
Object.keys(localStorage)
  .filter(key => key.startsWith('timer.'))
  .forEach(key => console.log(key, localStorage.getItem(key)));
```

## 故障排查

| 问题 | 解决方案 |
|------|---------|
| 计时器不启动 | 检查是否调用 `start()` |
| 刷新后时间不对 | 检查 localStorage |
| 超时回调未触发 | 检查 `onTimeout` 是否设置 |
| UI 不显示 | 导入 `timer-tokens.css` |
| 多次触发超时 | 确认 `scope` 是否唯一，必要时调用 `clearTimeoutScope` |

## 文件位置

```
src/shared/
├── services/
│   ├── storage/storageKeys.js
│   └── timers/
│       ├── TimerService.js
│       ├── useTimer.js
│       ├── getDefaultTimers.js
│       └── index.js
├── ui/TimerDisplay/
│   ├── index.jsx
│   ├── TimerContainer.jsx
│   └── styles.module.css
└── styles/timer-tokens.css
```

## 更多文档

- [完整文档](./README.md)
- [集成指南](./INTEGRATION_GUIDE.md)
- [实施总结](../../../../openspec/changes/add-unified-timer-service/IMPLEMENTATION_SUMMARY.md)

## 支持

有问题? 查看:
1. [常见问题](./README.md#常见问题)
2. [故障排查](./INTEGRATION_GUIDE.md#故障排查)
3. [GitHub Issues](链接待定)

---

**最后更新**: 2025-11-06
