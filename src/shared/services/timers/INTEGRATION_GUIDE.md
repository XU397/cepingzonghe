# 统一计时器服务集成指南

## 概述

本指南说明如何将现有模块的计时器迁移到统一计时器服务 (`TimerService`)。

## 核心特性

- ✅ 跨刷新恢复 (离线时间自动扣减)
- ✅ 一次性超时触发 (并发保护)
- ✅ 统一本地持久化 (基于 `storageKeys`)
- ✅ pause/resume/reset API
- ✅ 统一 UI 显示 (`TimerDisplay`)
- ✅ React Hook 封装 (`useTimer`)

## 快速开始

### 1. 基础用法 (使用 React Hook)

```jsx
import { useTimer } from '@shared/services/timers';
import TimerDisplay from '@shared/ui/TimerDisplay';

function MyPage() {
  const { remaining, start } = useTimer('task', {
    scope: 'demo::task',
    onTimeout: () => {
      console.log('时间到!');
      // 自动跳转逻辑
    },
    onTick: (remaining) => {
      if (remaining === 60) {
        alert('还剩1分钟!');
      }
    }
  });

  useEffect(() => {
    // 启动计时器 (45分钟)
    start(45 * 60);
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

### 2. 使用容器组件 (更简单)

```jsx
import TimerContainer from '@shared/ui/TimerDisplay/TimerContainer';
import { TimerService } from '@shared/services/timers';

function MyPage() {
  const scope = 'demo::task';

  useEffect(() => {
    // 启动计时器
    TimerService.startTask(45 * 60, {
      scope,
      onTimeout: () => {
        console.log('时间到!');
        navigate('/timeout');
      },
    });

    return () => {
      TimerService.clearTimeoutScope(scope);
    };
  }, [scope]);

  return (
    <div>
      <TimerContainer
        type="task"
        scope={scope}
        warningThreshold={300}
        criticalThreshold={60}
      />
      {/* 你的页面内容 */}
    </div>
  );
}
```

## Scope 去重策略

统一计时器通过 `core.timer/timeoutFired.<scope>` 去重，确保同一阶段的超时回调只触发一次。建议按 Flow → 子模块 → 步骤生成可读的 scope，并在切换步骤时主动清理。

### 1. 生成 Scope

```js
const scope = [
  'flow',
  flowContext.flowId,
  flowContext.submoduleId,
  flowContext.stepIndex,
  'notice',
].filter(Boolean).join('::');
```

### 2. 启动计时并绑定 Scope

```jsx
import {
  TimerService,
  NOTICE_DEFAULT_DURATION,
} from '@shared/services/timers';

useEffect(() => {
  TimerService.startNotice(NOTICE_DEFAULT_DURATION, {
    scope,
    onTimeout: handleTimeout,
  });

  return () => {
    TimerService.clearTimeoutScope(scope);
  };
}, [scope]);
```

### 3. Flow 切步时清理

```js
function onStepLeave(prevScope) {
  TimerService.clearTimeoutScope(prevScope);
}
```

### 4. DEV vs PROD 行为

- DEV：允许手动继续流程（例如仅提示或 console log）。
- PROD：阻断下一步，展示官方提示或跳转。

```js
const isProd = process.env.NODE_ENV === 'production';

const handleTimeout = () => {
  if (isProd) {
    openBlockingModal();
  } else {
    console.warn('[DEV] Notice timeout reached, flow 已放行');
    allowProceedForDebug();
  }
};
```

## 迁移步骤

### Grade-4 模块迁移

#### 现状分析

Grade-4 使用自定义的 `globalTimer` 状态管理:
- ✅ 有计时器基础设施
- ❌ 缺少跨刷新恢复
- ❌ 缺少超时自动跳转
- ❌ 使用 Context 管理,难以跨组件同步

#### 迁移步骤

**步骤 1: 在模块入口初始化计时器**

```jsx
// src/modules/grade-4/index.jsx
import { TimerService } from '@shared/services/timers';

function Grade4Module({ userContext, initialPageId }) {
  const scope = 'module::grade-4::task';

  useEffect(() => {
    // 启动主任务计时器
    TimerService.startTask(45 * 60, {
      scope,
      onTimeout: () => {
        console.log('[Grade4] 主任务超时');
        // 跳转到完成页
        // 这里可以触发 Grade4Context 的完成逻辑
      },
    });

    return () => {
      // 清理 (可选, 通常不需要)
      // TimerService.getInstance('task').stop();
      TimerService.clearTimeoutScope(scope);
    };
  }, [scope]);

  return (
    <Grade4Provider initialPage={initialPageId}>
      <Grade4Router />
    </Grade4Provider>
  );
}
```

**步骤 2: 替换 UI 显示**

```jsx
// src/modules/grade-4/components/GlobalTimer.jsx (修改)
import TimerContainer from '@shared/ui/TimerDisplay/TimerContainer';

function GlobalTimer() {
  // 不再需要自定义的 useState/useEffect
  // 直接使用容器组件

  return (
    <TimerContainer
      type="task"
      scope="module::grade-4::task"
      warningThreshold={300}
      criticalThreshold={60}
    />
  );
}
```

**步骤 3: (可选) 保留 Context 兼容性**

如果其他组件依赖 `Grade4Context` 中的 `globalTimer` 状态,可以添加适配层:

```jsx
// src/modules/grade-4/context/Grade4Context.jsx
import { useTimer } from '@shared/services/timers';

export const Grade4Provider = ({ children, initialPage }) => {
  // 订阅统一计时器状态
  const { remaining, isRunning, isTimeout } = useTimer('task', {
    scope: 'module::grade-4::task',
  });

  // 适配旧的 globalTimer 格式 (保持向后兼容)
  const globalTimerCompat = {
    remainingTime: remaining,
    isActive: isRunning,
    isCompleted: isTimeout,
    startTime: null, // 如果需要可以从 TimerService 获取
  };

  // 传递给子组件
  const value = {
    ...state,
    globalTimer: globalTimerCompat, // 兼容层
    // ...其他状态
  };

  return (
    <Grade4Context.Provider value={value}>
      {children}
    </Grade4Context.Provider>
  );
};
```

### Grade-7 / Grade-7-Tracking 模块迁移

#### 现状分析

- ✅ 已有计时器显示 UI
- ✅ 有超时回调
- ❌ 计时器逻辑在 AppContext 中,不够独立
- ❌ 没有统一的 pause/resume

#### 迁移步骤

**步骤 1: 替换 AppContext 中的计时器逻辑**

```jsx
// src/context/AppContext.jsx (修改)
import { TimerService } from '@shared/services/timers';

export const AppProvider = ({ children }) => {
  // 删除旧的计时器状态
  // const [remainingTime, setRemainingTime] = useState(TOTAL_TASK_DURATION);
  // const [taskStartTime, setTaskStartTime] = useState(null);

  // 使用统一计时器 (通过 Hook)
  const taskScope = 'app-context::task';
  const questionnaireScope = 'app-context::questionnaire';
  const { remaining: taskTimeRemaining } = useTimer('task', { scope: taskScope });
  const { remaining: questionnaireTimeRemaining } = useTimer('questionnaire', { scope: questionnaireScope });

  // 启动主任务计时器的方法
  const startTaskTimer = useCallback((duration = 2400) => {
    TimerService.startTask(duration, {
      scope: taskScope,
      onTimeout: () => {
        console.log('[AppContext] 主任务超时');
        setIsTimeUp(true);
        // 触发超时逻辑
      },
    });
  }, [taskScope]);

  // 启动问卷计时器的方法
  const startQuestionnaireTimer = useCallback((duration = 600) => {
    TimerService.startQuestionnaire(duration, {
      scope: questionnaireScope,
      onTimeout: () => {
        console.log('[AppContext] 问卷超时');
        setIsQuestionnaireTimeUp(true);
      },
    });
  }, [questionnaireScope]);

  const value = {
    // ...其他状态
    taskTimeRemaining,
    questionnaireTimeRemaining,
    startTaskTimer,
    startQuestionnaireTimer,
    // ...
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
```

**步骤 2: 替换 UI 组件**

```jsx
// src/modules/grade-7-tracking/components/layout/PageLayout.jsx (修改)
import TimerContainer from '@shared/ui/TimerDisplay/TimerContainer';

function PageLayout({ children, showTimer, timerType }) {
  return (
    <div className={styles.pageLayout}>
      {showTimer && (
        <TimerContainer
          type={timerType || 'task'}
          warningThreshold={300}
          criticalThreshold={60}
        />
      )}
      {children}
    </div>
  );
}
```

## API 参考

### TimerService

```js
import {
  TimerService,
  NOTICE_DEFAULT_DURATION,
} from '@shared/services/timers';

// 启动主任务计时器
TimerService.startTask(2400, {
  scope: 'flow::demo::task',
  onTimeout: () => {
    console.log('任务超时!');
  },
});

// 启动问卷计时器
TimerService.startQuestionnaire(600, {
  scope: 'flow::demo::questionnaire',
  onTimeout: () => {
    console.log('问卷超时!');
  },
});

// 启动注意事项计时器
TimerService.startNotice(NOTICE_DEFAULT_DURATION, {
  scope: 'flow::demo::notice',
  onTimeout: () => {
    console.log('注意事项超时!');
  },
});

// Flow 切步时清理 once-only 标记
TimerService.clearTimeoutScope('flow::demo::notice');

// 获取实例
const taskTimer = TimerService.getInstance('task');

// 控制方法
taskTimer.pause();
taskTimer.resume();
taskTimer.reset();
taskTimer.stop();

// 获取状态
const remaining = taskTimer.getRemaining();
const duration = taskTimer.getDuration();
const isPaused = taskTimer.isPaused();
const isTimeout = taskTimer.isTimeout();

// 注册回调
taskTimer.onTimeout(() => console.log('超时!'));
taskTimer.onTick((remaining) => console.log(`剩余: ${remaining}秒`));

// 调试信息
const debug = taskTimer.getDebugInfo();
console.log(debug);
```

### useTimer Hook

```jsx
import { useTimer } from '@shared/services/timers';

function MyComponent() {
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
    formatTime,       // 格式化时间 (返回 MM:SS)
    progress,         // 进度百分比 (0-100)
    getDebugInfo,     // 调试信息
  } = useTimer('task', {
    onTimeout: () => console.log('超时!'),
    onTick: (remaining) => console.log(remaining),
    autoStart: false,
    duration: 2400,
  });

  return <div>剩余: {formatTime()}</div>;
}
```

### TimerDisplay 组件

```jsx
import TimerDisplay from '@shared/ui/TimerDisplay';

<TimerDisplay
  variant="task"              // 'task' | 'questionnaire' | 'notice'
  remainingSeconds={1200}     // 剩余秒数
  warningThreshold={300}      // 警告阈值 (默认 300s / 5分钟)
  criticalThreshold={60}      // 严重阈值 (默认 60s / 1分钟)
  label="剩余时间"            // 自定义标签
  showEmoji={true}            // 是否显示 emoji
  className=""                // 额外 CSS 类名
/>
```

### TimerContainer 组件 (推荐)

```jsx
import TimerContainer from '@shared/ui/TimerDisplay/TimerContainer';

<TimerContainer
  type="task"                 // 计时器类型
  onTimeout={() => {}}        // 超时回调
  onTick={(remaining) => {}}  // 每秒回调
  warningThreshold={300}
  criticalThreshold={60}
  label="剩余时间"
  showEmoji={true}
  className=""
/>
```

## 默认配置

### 默认时长

```js
import { getDefaultTimers } from '@shared/services/timers';

// 获取实验类型的默认配置
const config = getDefaultTimers('experiment');
// { duration: 2400, warningThreshold: 300, criticalThreshold: 60 }

// 获取问卷类型的默认配置
const questionnaireConfig = getDefaultTimers('questionnaire');
// { duration: 600, warningThreshold: 180, criticalThreshold: 60 }

// 获取注意事项类型的默认配置
const noticeConfig = getDefaultTimers('notice');
// { duration: 40, warningThreshold: 20, criticalThreshold: 10 }

// 覆写默认配置
const customConfig = getDefaultTimers('experiment', {
  duration: 45 * 60,  // 45 分钟
});
```

### 模块级配置

```js
import { getTimerConfigForModule } from '@shared/services/timers';

// 获取 Grade-4 模块的配置
const config = getTimerConfigForModule('grade-4');
// {
//   task: { duration: 2700, warningThreshold: 300, criticalThreshold: 60 }
// }
```

## 样式自定义

### 使用 CSS 变量

```css
/* 在模块的 CSS 文件中覆写 */
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
/* 在模块的主 CSS 文件中 */
@import '@shared/styles/timer-tokens.css';
```

## 故障排查

### 计时器不启动

- 检查是否调用了 `start()` 方法
- 检查控制台是否有错误信息
- 查看 `TimerService.getDebugInfo()` 输出

### 跨刷新后时间不准确

- 确认 `storageKeys` 正确配置
- 检查 localStorage 中是否有对应键名
- 查看浏览器是否清除了 localStorage

### 超时回调未触发

- 检查是否设置了 `onTimeout` 回调
- 查看 `isTimeout` 状态是否为 `true`
- 检查是否多次调用 `start()` (会清除之前的回调)

### UI 显示不正确

- 确认导入了 `timer-tokens.css`
- 检查 CSS 变量是否被其他样式覆盖
- 查看浏览器开发工具的样式面板

## 注意事项

1. **避免重复启动**: 同一类型的计时器在应用中只应启动一次
2. **清理回调**: 组件卸载时自动清理,无需手动清理
3. **并发保护**: 超时回调只会触发一次,即使多个组件订阅
4. **localStorage 依赖**: 确保浏览器支持 localStorage
5. **时区问题**: 计时器使用客户端本地时间,无需考虑时区

## 完整示例

### Grade-4 完整迁移示例

```jsx
// src/modules/grade-4/index.jsx
import { useEffect } from 'react';
import { TimerService } from '@shared/services/timers';
import TimerContainer from '@shared/ui/TimerDisplay/TimerContainer';
import { Grade4Provider } from './context/Grade4Context';
import Grade4Router from './Grade4Router';

export const Grade4Module_Definition = {
  moduleId: 'grade-4',
  displayName: 'Grade 4 Assessment',
  url: '/four-grade',
  version: '2.0.0',

  ModuleComponent: ({ userContext, initialPageId }) => {
    const scope = 'module::grade-4::task';

    useEffect(() => {
      // 启动主任务计时器 (45分钟)
      TimerService.startTask(45 * 60, {
        scope,
        onTimeout: () => {
          console.log('[Grade4] 主任务超时, 自动跳转');
          // 触发自动跳转到完成页
          // 可以通过 Grade4Context 触发
        },
      });

      console.log('[Grade4] 模块已初始化, 计时器已启动');

      return () => {
        TimerService.clearTimeoutScope(scope);
      };
    }, [scope]);

    return (
      <Grade4Provider initialPage={initialPageId}>
        <TimerContainer
          type="task"
          scope={scope}
          warningThreshold={300}
          criticalThreshold={60}
          onTick={(remaining) => {
            if (remaining === 300) {
              alert('还剩5分钟!');
            }
          }}
        />
        <Grade4Router />
      </Grade4Provider>
    );
  },

  getInitialPage: (pageNum) => {
    // 页面映射逻辑
    return pageNum > 0 ? `page-${pageNum}` : 'notices';
  },

  onInitialize: () => {
    console.log('[Grade4] 模块初始化');
  },

  onDestroy: () => {
    console.log('[Grade4] 模块销毁');
    TimerService.getInstance('task').stop();
    TimerService.clearTimeoutScope('module::grade-4::task');
  },
};
```

## 总结

统一计时器服务提供:
- ✅ **跨刷新恢复**: 自动扣减离线时间
- ✅ **一致的行为**: 所有模块使用相同的计时逻辑
- ✅ **简化集成**: 通过 Hook 和容器组件快速接入
- ✅ **可维护性**: 集中管理,易于调试和扩展
- ✅ **视觉一致**: 基于 Grade-7 规范的统一 UI

建议按优先级迁移:
1. Grade-4 (缺少跨刷新恢复,优先级最高)
2. Grade-7-Tracking (已有基础,迁移成本低)
3. Grade-7 (稳定运行,可最后迁移)
