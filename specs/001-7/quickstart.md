# 开发者快速上手指南

**Feature ID**: 001-7
**模块名称**: 7年级追踪测评-蜂蜜黏度探究
**最后更新**: 2025-10-14
**预计开发时间**: 5-7个工作日

---

## 目录

1. [前置要求](#前置要求)
2. [环境搭建](#环境搭建)
3. [项目结构](#项目结构)
4. [Mock模式配置](#mock模式配置)
5. [模块注册](#模块注册)
6. [核心文件说明](#核心文件说明)
7. [开发工作流](#开发工作流)
8. [调试技巧](#调试技巧)
9. [常见问题](#常见问题)
10. [验收检查清单](#验收检查清单)

---

## 前置要求

### 必备技能

- ✅ 熟悉 React 18.2+ (Hooks, Context API, 函数组件)
- ✅ 熟悉 CSS Modules（模块化样式）
- ✅ 理解 Vite 4 构建工具
- ✅ 基础的物理知识（黏度、阻力概念）

### 必备工具

| 工具 | 版本要求 | 用途 |
|------|---------|------|
| Node.js | ≥18.0.0 | JavaScript运行环境 |
| PNPM | ≥8.0.0 | 包管理工具（推荐） |
| Git | ≥2.30.0 | 版本控制 |
| VS Code | 最新版 | IDE（推荐） |

### 可选工具

- **ESLint插件**: 代码质量检查
- **Prettier插件**: 代码格式化
- **React DevTools**: React组件调试
- **Postman**: API测试

---

## 环境搭建

### 1. 克隆项目并安装依赖

```bash
# 克隆仓库（如果尚未克隆）
git clone <repository-url>
cd cp

# 使用PNPM安装依赖（推荐）
pnpm install

# 或使用NPM
npm install
```

### 2. 安装新增依赖

本模块需要安装 **Recharts** 图表库（如果项目中尚未安装）：

```bash
# 使用PNPM
pnpm add recharts

# 或使用NPM
npm install recharts
```

**版本要求**: `recharts@^2.10.0`

### 3. 验证环境

```bash
# 启动开发服务器
pnpm dev

# 或
npm run dev
```

浏览器访问 `http://localhost:5173`，确认项目正常启动。

---

## 项目结构

### 完整模块目录树

```
src/modules/grade-7-tracking/
├── index.jsx                    # 模块入口文件（导出moduleConfig）
├── config.js                    # 模块配置（页面映射、导航模式等）
│
├── context/                     # Context状态管理
│   ├── TrackingContext.jsx      # Context定义
│   └── TrackingProvider.jsx     # Provider组件
│
├── pages/                       # 23个页面组件
│   ├── Page01_Notice.jsx        # 第0.1页：注意事项
│   ├── Page02_QuestionnaireNotice.jsx  # 第0.2页：问卷说明
│   ├── Page03_Introduction.jsx  # 第1页：实验介绍
│   ├── Page04_Background.jsx    # 第2页：实验背景
│   ├── ...                      # 第3-8页（实验理论页面）
│   ├── Page09_Trial1.jsx        # 第9页：第1次实验试验
│   ├── Page10_Trial2.jsx        # 第10页：第2次实验试验
│   ├── Page11_Trial3.jsx        # 第11页：第3次实验试验
│   ├── Page12_Chart.jsx         # 第12页：绘制折线图
│   ├── Page13_TextQuestions.jsx # 第13页：开放性问题
│   ├── Page14_Questionnaire1.jsx # 第14页：问卷第1页
│   └── ...                      # 第15-21页（问卷页面）
│
├── components/                  # 可复用组件
│   ├── layout/                  # 布局组件
│   │   ├── PageLayout.jsx       # 通用页面布局
│   │   └── DualNavigationBar.jsx # 双导航栏（可选，或使用增强LeftNavigation）
│   │
│   ├── experiment/              # 实验相关组件
│   │   ├── BeakerSelector.jsx   # 烧杯选择器（含水量）
│   │   ├── TemperatureControl.jsx # 温度控制器
│   │   ├── BallDropAnimation.jsx  # 小球下落动画
│   │   └── Timer.jsx            # 实验计时器显示
│   │
│   ├── questionnaire/           # 问卷相关组件
│   │   ├── RadioButtonGroup.jsx # 单选题组
│   │   └── QuestionBlock.jsx    # 问题块容器
│   │
│   ├── ui/                      # 通用UI组件
│   │   ├── Button.jsx           # 通用按钮
│   │   ├── Checkbox.jsx         # 复选框
│   │   ├── TextArea.jsx         # 文本输入框
│   │   ├── Modal.jsx            # 模态框
│   │   └── CountdownTimer.jsx   # 倒计时器
│   │
│   └── visualizations/          # 数据可视化组件
│       └── LineChart.jsx        # 折线图（基于Recharts）
│
├── hooks/                       # 自定义Hooks
│   ├── useExperiment.js         # 实验数据管理Hook
│   ├── useNavigation.js         # 导航逻辑Hook
│   ├── useDataLogger.js         # 数据记录Hook
│   ├── useQuestionnaire.js      # 问卷数据管理Hook
│   └── useSessionHeartbeat.js   # 会话心跳检测Hook
│
├── utils/                       # 工具函数
│   ├── physicsModel.js          # 物理模型计算（黏度-下落时间）
│   ├── pageMapping.js           # 页面编号映射
│   ├── validation.js            # 数据验证函数
│   └── apiClient.js             # API请求封装
│
├── styles/                      # CSS Modules样式
│   ├── PageLayout.module.css
│   ├── BeakerSelector.module.css
│   ├── BallDropAnimation.module.css
│   ├── LineChart.module.css
│   └── ...
│
└── assets/                      # 静态资源
    ├── images/
    │   ├── beaker-15.png        # 15%含水量烧杯图片
    │   ├── beaker-20.png
    │   ├── beaker-25.png
    │   ├── thermometer.png      # 温度计图片
    │   └── ball.png             # 小球图片
    └── data/
        └── questionnaireData.json # 问卷题目数据（27题）
```

### 核心文件关系图

```
index.jsx (模块入口)
    ↓
TrackingProvider (Context Provider)
    ↓
PageLayout (通用布局)
    ↓
┌─────────────┬─────────────┬─────────────┐
│ Page09      │ Page12      │ Page14      │
│ (实验试验)  │ (绘制图表)  │ (问卷调查)  │
└─────────────┴─────────────┴─────────────┘
    ↓             ↓             ↓
┌──────────┬───────────┬─────────────┐
│ useExperiment │ LineChart  │ useQuestionnaire │
└──────────┴───────────┴─────────────┘
    ↓
useDataLogger (统一数据提交)
    ↓
POST /stu/saveHcMark (API)
```

---

## Mock模式配置

为了方便本地开发和测试，我们使用 **MSW (Mock Service Worker)** 来模拟后端API。

### 安装MSW

```bash
pnpm add -D msw

# 初始化MSW（生成public/mockServiceWorker.js）
npx msw init public/ --save
```

### 创建Mock Handlers

创建文件：`src/mocks/handlers.js`

```javascript
import { rest } from 'msw';

export const handlers = [
  // 模拟 POST /stu/saveHcMark 接口
  rest.post('/stu/saveHcMark', async (req, res, ctx) => {
    const formData = await req.formData();
    const jsonStr = formData.get('jsonStr');

    try {
      const markObject = JSON.parse(jsonStr);
      console.log('📝 [Mock API] 接收到MarkObject:', markObject);

      // 模拟10%的失败率（测试重试逻辑）
      if (Math.random() < 0.1) {
        return res(
          ctx.delay(500),
          ctx.status(500),
          ctx.json({ code: 500, msg: '服务器错误（模拟）', obj: false })
        );
      }

      // 成功响应
      return res(
        ctx.delay(300), // 模拟300ms网络延迟
        ctx.status(200),
        ctx.json({ code: 200, msg: '成功', obj: true })
      );
    } catch (error) {
      return res(
        ctx.status(400),
        ctx.json({ code: 400, msg: 'JSON格式错误', obj: false })
      );
    }
  }),

  // 模拟 GET /stu/checkSession 接口
  rest.get('/stu/checkSession', (req, res, ctx) => {
    const sessionId = req.url.searchParams.get('sessionId');
    const studentCode = req.url.searchParams.get('studentCode');

    console.log(`🔍 [Mock API] 心跳检测 - SessionID: ${sessionId}, StudentCode: ${studentCode}`);

    // 模拟5%的会话失效率（测试多设备登录检测）
    if (Math.random() < 0.05) {
      return res(
        ctx.delay(200),
        ctx.status(401),
        ctx.json({
          code: 401,
          msg: '您的账号已在其他设备登录，当前会话已失效（模拟）',
          obj: false
        })
      );
    }

    // 正常会话
    return res(
      ctx.delay(200),
      ctx.status(200),
      ctx.json({ code: 200, msg: '会话有效', obj: true })
    );
  })
];
```

### 启动Mock Service Worker

创建文件：`src/mocks/browser.js`

```javascript
import { setupWorker } from 'msw';
import { handlers } from './handlers';

// 创建Service Worker实例
export const worker = setupWorker(...handlers);
```

### 在开发模式中启用Mock

修改 `src/main.jsx`：

```javascript
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// 开发模式下启用Mock Service Worker
if (import.meta.env.DEV) {
  const { worker } = await import('./mocks/browser.js');
  worker.start({
    onUnhandledRequest: 'bypass', // 未匹配的请求直接放行
  });
  console.log('🚀 Mock Service Worker 已启动');
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### 验证Mock服务

1. 启动开发服务器：`pnpm dev`
2. 打开浏览器控制台，应看到：`🚀 Mock Service Worker 已启动`
3. 提交数据时，控制台会显示：`📝 [Mock API] 接收到MarkObject: { ... }`

---

## 模块注册

### 1. 导出模块配置

在 `src/modules/grade-7-tracking/index.jsx` 中：

```javascript
import React from 'react';
import { TrackingProvider } from './context/TrackingProvider';
import PageLayout from './components/layout/PageLayout';
import { PAGE_MAPPING } from './config';

// 动态导入所有页面组件
const pages = {
  '0.1': React.lazy(() => import('./pages/Page01_Notice')),
  '0.2': React.lazy(() => import('./pages/Page02_QuestionnaireNotice')),
  1: React.lazy(() => import('./pages/Page03_Introduction')),
  2: React.lazy(() => import('./pages/Page04_Background')),
  // ... 导入其他页面
  21: React.lazy(() => import('./pages/Page24_Questionnaire8')),
};

// 模块主组件
const Grade7TrackingModule = () => {
  return (
    <TrackingProvider>
      <PageLayout pages={pages} />
    </TrackingProvider>
  );
};

// 导出模块配置对象
export const moduleConfig = {
  moduleId: 'grade-7-tracking',
  displayName: '7年级追踪测评-蜂蜜黏度探究',
  url: '/grade-7-tracking',
  version: '1.0.0',
  ModuleComponent: Grade7TrackingModule,

  // 获取初始页码（用于进度恢复）
  getInitialPage: (userProgress) => {
    // userProgress 可能包含: { lastPage: 5, completedPages: [1,2,3,4,5] }
    return userProgress?.lastPage || 0.1; // 默认从第0.1页开始
  },
};

export default moduleConfig;
```

### 2. 注册到ModuleRegistry

在 `src/moduleRegistry.js` 中添加：

```javascript
import { moduleConfig as grade7Tracking } from './modules/grade-7-tracking';

const MODULE_REGISTRY = [
  // ... 其他模块
  grade7Tracking, // 添加新模块
];

export default MODULE_REGISTRY;
```

### 3. 配置路由

在 `src/App.jsx` 中（如果使用React Router）：

```javascript
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import MODULE_REGISTRY from './moduleRegistry';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {MODULE_REGISTRY.map((module) => (
          <Route
            key={module.moduleId}
            path={module.url}
            element={<module.ModuleComponent />}
          />
        ))}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
```

### 4. 验证注册

启动开发服务器后，访问：
- `http://localhost:5173/grade-7-tracking`

应能看到模块的第一个页面（注意事项页）。

---

## 核心文件说明

### 1. `config.js` - 模块配置

```javascript
// src/modules/grade-7-tracking/config.js

// 页面编号到描述的映射
export const PAGE_MAPPING = {
  0.1: { desc: '注意事项', navigationMode: 'hidden' },
  0.2: { desc: '问卷说明', navigationMode: 'hidden' },
  1: { desc: '实验介绍', navigationMode: 'experiment', totalPages: 13 },
  2: { desc: '实验背景', navigationMode: 'experiment', totalPages: 13 },
  // ... 第3-8页
  9: { desc: '第1次蜂蜜黏度实验', navigationMode: 'experiment', totalPages: 13 },
  10: { desc: '第2次蜂蜜黏度实验', navigationMode: 'experiment', totalPages: 13 },
  11: { desc: '第3次蜂蜜黏度实验', navigationMode: 'experiment', totalPages: 13 },
  12: { desc: '绘制含水量与下落时间关系图', navigationMode: 'experiment', totalPages: 13 },
  13: { desc: '开放性问题回答', navigationMode: 'experiment', totalPages: 13 },
  14: { desc: '问卷调查第1页', navigationMode: 'questionnaire', totalPages: 8 },
  // ... 第15-21页（问卷）
};

// 实验参数选项
export const WATER_CONTENT_OPTIONS = [15, 20, 25]; // 含水量百分比
export const TEMPERATURE_OPTIONS = [15, 20, 25, 30]; // 温度（摄氏度）

// 计时器配置
export const EXPERIMENT_DURATION = 40 * 60 * 1000; // 40分钟（毫秒）
export const QUESTIONNAIRE_DURATION = 10 * 60 * 1000; // 10分钟（毫秒）

// 心跳检测配置
export const HEARTBEAT_INTERVAL = 30 * 1000; // 30秒（毫秒）
```

### 2. `utils/physicsModel.js` - 物理模型

```javascript
// src/modules/grade-7-tracking/utils/physicsModel.js

/**
 * 计算小球在蜂蜜中的下落时间
 *
 * 物理模型：
 * - 基础时间：10.0秒（15%含水量，25°C温度）
 * - 含水量因子：每增加1%含水量，下落时间减少8%
 * - 温度因子：每升高1°C，下落时间减少2%
 *
 * @param {number} waterContent - 含水量百分比 (15, 20, 25)
 * @param {number} temperature - 温度（摄氏度）(15, 20, 25, 30)
 * @returns {number} 下落时间（秒，保留1位小数）
 */
export function calculateFallTime(waterContent, temperature) {
  const BASE_TIME = 10.0; // 基础时间（秒）

  // 含水量影响：含水量越高，黏度越低，下落越快
  const waterContentFactor = 1 - (waterContent - 15) * 0.08;

  // 温度影响：温度越高，黏度越低，下落越快
  const temperatureFactor = 1 - (temperature - 25) * 0.02;

  // 计算理论下落时间
  const theoreticalTime = BASE_TIME * waterContentFactor * temperatureFactor;

  // 添加±4%的随机波动（模拟真实实验误差）
  const randomVariation = 0.96 + Math.random() * 0.08;

  // 返回最终时间（保留1位小数）
  return parseFloat((theoreticalTime * randomVariation).toFixed(1));
}

/**
 * 验证实验参数是否有效
 *
 * @param {number} waterContent - 含水量百分比
 * @param {number} temperature - 温度（摄氏度）
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateExperimentParameters(waterContent, temperature) {
  const validWaterContents = [15, 20, 25];
  const validTemperatures = [15, 20, 25, 30];

  if (!validWaterContents.includes(waterContent)) {
    return { isValid: false, error: `含水量必须是 ${validWaterContents.join(', ')} 之一` };
  }

  if (!validTemperatures.includes(temperature)) {
    return { isValid: false, error: `温度必须是 ${validTemperatures.join(', ')} 之一` };
  }

  return { isValid: true };
}
```

### 3. `hooks/useDataLogger.js` - 数据提交Hook

```javascript
// src/modules/grade-7-tracking/hooks/useDataLogger.js

import { useState, useCallback } from 'react';

/**
 * 数据记录和提交Hook
 */
export function useDataLogger() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 提交页面数据到后端
   *
   * @param {object} markObject - 页面标记对象
   * @returns {Promise<boolean>} 是否提交成功
   */
  const submitPageData = useCallback(async (markObject) => {
    setIsSubmitting(true);

    // 重试配置
    const MAX_RETRIES = 3;
    const RETRY_DELAYS = [1000, 2000, 4000]; // 1s, 2s, 4s（指数退避）

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const formData = new FormData();
        formData.append('jsonStr', JSON.stringify(markObject));

        const response = await fetch('/stu/saveHcMark', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        // 成功
        if (result.code === 200) {
          console.log('✅ 数据提交成功:', markObject);
          setIsSubmitting(false);
          return true;
        }

        // 会话失效（401）- 不重试，直接返回
        if (result.code === 401) {
          console.error('❌ 会话已失效:', result.msg);
          setIsSubmitting(false);
          throw new Error('SESSION_EXPIRED');
        }

        // 其他错误 - 继续重试
        console.warn(`⚠️ 提交失败（尝试 ${attempt + 1}/${MAX_RETRIES}）:`, result.msg);

      } catch (error) {
        if (error.message === 'SESSION_EXPIRED') {
          throw error; // 会话失效错误向上抛出
        }

        console.warn(`⚠️ 网络错误（尝试 ${attempt + 1}/${MAX_RETRIES}）:`, error);
      }

      // 如果不是最后一次重试，等待后重试
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt]));
      }
    }

    // 所有重试失败
    setIsSubmitting(false);
    console.error('❌ 所有重试失败，数据提交失败');
    return false;
  }, []);

  return {
    submitPageData,
    isSubmitting,
  };
}
```

### 4. `hooks/useSessionHeartbeat.js` - 会话心跳Hook

```javascript
// src/modules/grade-7-tracking/hooks/useSessionHeartbeat.js

import { useEffect, useRef } from 'react';

/**
 * 会话心跳检测Hook
 *
 * @param {string} sessionId - 会话ID（UUID）
 * @param {string} studentCode - 学生代码
 * @param {Function} onSessionExpired - 会话失效回调
 */
export function useSessionHeartbeat(sessionId, studentCode, onSessionExpired) {
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!sessionId || !studentCode) {
      return; // 缺少必要参数，不启动心跳
    }

    /**
     * 检查会话有效性
     */
    const checkSession = async () => {
      try {
        const response = await fetch(
          `/stu/checkSession?sessionId=${sessionId}&studentCode=${studentCode}`
        );
        const result = await response.json();

        // 会话失效
        if (result.code === 401) {
          console.warn('💔 会话已失效:', result.msg);
          clearInterval(intervalRef.current);
          onSessionExpired();
        }
      } catch (error) {
        console.error('❌ 心跳检测失败:', error);
        // 网络错误不触发会话失效，继续心跳
      }
    };

    /**
     * 页面可见性改变处理
     */
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时，停止心跳（节省资源）
        clearInterval(intervalRef.current);
        console.log('⏸️ 页面隐藏，暂停心跳检测');
      } else {
        // 页面恢复可见时，立即检查一次并重启心跳
        console.log('▶️ 页面恢复，重启心跳检测');
        checkSession();
        intervalRef.current = setInterval(checkSession, 30000); // 30秒
      }
    };

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 启动心跳定时器
    intervalRef.current = setInterval(checkSession, 30000); // 30秒
    console.log('💓 心跳检测已启动（30秒间隔）');

    // 清理函数
    return () => {
      clearInterval(intervalRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      console.log('💔 心跳检测已停止');
    };
  }, [sessionId, studentCode, onSessionExpired]);
}
```

---

## 开发工作流

### Phase 1: 搭建基础结构（第1-2天）

1. **创建目录结构**
   ```bash
   mkdir -p src/modules/grade-7-tracking/{context,pages,components/{layout,experiment,questionnaire,ui,visualizations},hooks,utils,styles,assets/{images,data}}
   ```

2. **实现Context和Provider**
   - `context/TrackingContext.jsx`
   - `context/TrackingProvider.jsx`
   - 定义状态结构（参考 `data-model.md`）

3. **创建通用布局组件**
   - `components/layout/PageLayout.jsx`
   - 集成导航栏、计时器、进度指示

4. **实现核心Hooks**
   - `hooks/useDataLogger.js`
   - `hooks/useSessionHeartbeat.js`
   - `hooks/useNavigation.js`

### Phase 2: 实验页面开发（第3-4天）

1. **创建实验相关组件**
   - `components/experiment/BeakerSelector.jsx`（烧杯选择器）
   - `components/experiment/TemperatureControl.jsx`（温度控制）
   - `components/experiment/BallDropAnimation.jsx`（小球动画）

2. **实现物理模型**
   - `utils/physicsModel.js`
   - 编写单元测试验证计算准确性

3. **开发实验页面**
   - `pages/Page09_Trial1.jsx`
   - `pages/Page10_Trial2.jsx`
   - `pages/Page11_Trial3.jsx`
   - 复用组件，逻辑统一

4. **实现图表页面**
   - `components/visualizations/LineChart.jsx`（基于Recharts）
   - `pages/Page12_Chart.jsx`
   - 数据映射逻辑

5. **开发文本问题页面**
   - `pages/Page13_TextQuestions.jsx`
   - `components/ui/TextArea.jsx`

### Phase 3: 问卷页面开发（第5天）

1. **创建问卷组件**
   - `components/questionnaire/RadioButtonGroup.jsx`
   - `components/questionnaire/QuestionBlock.jsx`

2. **开发问卷页面**
   - `pages/Page14_Questionnaire1.jsx` 到 `Page21_Questionnaire8.jsx`
   - 加载 `assets/data/questionnaireData.json`

3. **实现独立导航系统**
   - 修改 `LeftNavigation.jsx`（平台共享组件）
   - 添加 `navigationMode` prop支持

### Phase 4: 集成与测试（第6-7天）

1. **模块注册**
   - 完成 `index.jsx` 导出
   - 注册到 `moduleRegistry.js`

2. **端到端测试**
   - 从第0.1页到第21页完整流程
   - 数据提交验证
   - 会话心跳测试

3. **错误处理测试**
   - 网络故障场景
   - 会话失效场景
   - 数据验证失败场景

4. **性能优化**
   - Code Splitting（React.lazy）
   - 图片压缩
   - CSS优化

5. **代码审查**
   - ESLint检查（零警告）
   - Constitution Check（7大原则验证）

---

## 调试技巧

### 1. 使用React DevTools

安装 [React Developer Tools](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi) 浏览器扩展。

**调试Context状态**：
- 打开DevTools → Components选项卡
- 选择 `TrackingProvider` 组件
- 右侧查看 `hooks` → `Context` 值

### 2. 查看Mock API日志

Mock Service Worker会在控制台输出所有拦截的请求：

```
📝 [Mock API] 接收到MarkObject: {
  pageNumber: "9",
  pageDesc: "第1次蜂蜜黏度实验",
  ...
}
```

### 3. 验证物理模型计算

在浏览器控制台手动测试：

```javascript
import { calculateFallTime } from './utils/physicsModel';

// 测试不同参数组合
console.log(calculateFallTime(15, 25)); // 应约为 10.0秒
console.log(calculateFallTime(20, 25)); // 应约为 6.0秒
console.log(calculateFallTime(25, 25)); // 应约为 2.0秒
```

### 4. 监控会话心跳

启用心跳日志：

```javascript
// 在 useSessionHeartbeat.js 中
console.log('💓 心跳检测:', { sessionId, studentCode, timestamp: Date.now() });
```

### 5. 调试数据提交失败

在 `useDataLogger.js` 中添加详细日志：

```javascript
console.log('📤 提交数据:', markObject);
console.log('📥 服务器响应:', result);
```

---

## 常见问题

### Q1: 如何禁用Mock模式，连接真实API？

**A**: 修改 `src/main.jsx`：

```javascript
// 注释掉Mock启动代码
/*
if (import.meta.env.DEV) {
  const { worker } = await import('./mocks/browser.js');
  worker.start();
}
*/
```

然后配置代理（`vite.config.js`）：

```javascript
export default defineConfig({
  server: {
    proxy: {
      '/stu': {
        target: 'https://api.example.com', // 真实API地址
        changeOrigin: true,
      },
    },
  },
});
```

### Q2: Recharts图表不显示？

**A**: 检查以下几点：

1. 确认已安装Recharts：`pnpm list recharts`
2. 数据格式正确：
   ```javascript
   const data = [
     { waterContent: 15, fallTime: 11.2 },
     { waterContent: 20, fallTime: 8.7 },
     { waterContent: 25, fallTime: 6.5 },
   ];
   ```
3. 容器有明确的宽高：
   ```css
   .chartContainer {
     width: 600px;
     height: 400px;
   }
   ```

### Q3: CSS Modules样式不生效？

**A**: 确保：

1. 文件命名为 `.module.css` 后缀
2. 导入方式正确：
   ```javascript
   import styles from './Button.module.css';
   <button className={styles.primaryButton}>点击</button>
   ```
3. Vite配置启用CSS Modules（默认已启用）

### Q4: 心跳检测不工作？

**A**: 检查：

1. `sessionId` 和 `studentCode` 是否正确传递给Hook
2. Mock API是否正确处理 `/stu/checkSession` 请求
3. 浏览器控制台是否有网络错误
4. 页面是否处于可见状态（隐藏时心跳暂停）

### Q5: 小球动画卡顿？

**A**: 优化建议：

1. 使用CSS3 `@keyframes`（已在 `research.md` 中推荐）
2. 避免在动画期间执行复杂计算
3. 使用 `will-change: transform` 提示浏览器优化
4. 确保帧率60 FPS：
   ```css
   @keyframes ballFall {
     from { transform: translateY(0); }
     to { transform: translateY(500px); }
   }

   .ball {
     animation: ballFall var(--duration) linear forwards;
     will-change: transform;
   }
   ```

### Q6: ESLint报错 "React Hook useEffect has a missing dependency"？

**A**: 这是常见的依赖数组警告。解决方法：

1. **推荐**：添加缺失的依赖到数组中
   ```javascript
   useEffect(() => {
     // 使用 someValue
   }, [someValue]); // 添加依赖
   ```

2. **谨慎使用**：如果确认不需要依赖，添加注释禁用警告
   ```javascript
   useEffect(() => {
     // ...
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);
   ```

### Q7: 如何调试数据提交的JSON格式？

**A**: 在提交前打印并验证：

```javascript
const markObject = {
  pageNumber: "9",
  pageDesc: "第1次实验",
  // ...
};

// 验证JSON可序列化
const jsonStr = JSON.stringify(markObject);
console.log('JSON长度:', jsonStr.length);
console.log('JSON预览:', jsonStr.substring(0, 200));

// 验证可反序列化
const parsed = JSON.parse(jsonStr);
console.log('解析后:', parsed);
```

---

## 验收检查清单

开发完成后，请逐项检查：

### 功能完整性

- [ ] **23个页面全部实现**（第0.1, 0.2, 1-21页）
- [ ] **3次实验试验可正常进行**（选择参数 → 观察动画 → 记录时间）
- [ ] **物理模型计算准确**（含水量和温度影响下落时间）
- [ ] **折线图正确显示**（Recharts渲染，数据映射正确）
- [ ] **3个文本问题可输入和提交**
- [ ] **27个问卷题目可选择和提交**
- [ ] **独立导航系统工作正常**（实验部分1-13页，问卷部分1-8页）
- [ ] **过渡页不显示导航**（第0.1和0.2页）
- [ ] **双计时器正常运行**（40分钟实验 + 10分钟问卷）
- [ ] **心跳检测正常工作**（30秒间隔，页面隐藏时暂停）
- [ ] **多设备登录检测有效**（会话被踢时显示提示）

### 数据完整性

- [ ] **每页离开时提交MarkObject**
- [ ] **operationList记录所有用户操作**
- [ ] **answerList包含所有答案**
- [ ] **beginTime和endTime准确**
- [ ] **提交失败时执行3次重试**
- [ ] **会话失效(401)时不重试，直接提示**

### 代码质量

- [ ] **ESLint零警告**（运行 `pnpm lint`）
- [ ] **所有组件使用函数组件**（不使用Class组件）
- [ ] **CSS Modules正确应用**（无全局样式污染）
- [ ] **Console无错误和警告**（浏览器控制台）
- [ ] **模块完全隔离**（目录结构符合constitution.md）

### 性能指标

- [ ] **页面切换速度 < 2秒**
- [ ] **交互响应时间 < 100毫秒**
- [ ] **动画流畅度 60 FPS**
- [ ] **数据提交成功率 ≥ 99%**（Mock模式下测试）

### Constitution检查

- [ ] **I. Module Isolation**: 模块自包含，无跨模块依赖
- [ ] **II. Standardized Module Contract**: moduleConfig正确导出
- [ ] **III. Data Logging & Submission Protocol**: logOperation()记录所有操作
- [ ] **IV. Linear Navigation Flow**: 仅前进导航，无后退按钮
- [ ] **V. Timer Management**: 使用AppContext.startTaskTimer()
- [ ] **VI. Error Handling**: 401触发自动登出，ErrorBoundary包裹
- [ ] **VII. Code Quality**: 函数组件，零ESLint警告

### 测试覆盖

- [ ] **单元测试**: physicsModel.js计算函数
- [ ] **集成测试**: 完整流程（第0.1页 → 第21页）
- [ ] **错误场景测试**: 网络失败、会话失效、数据验证失败
- [ ] **性能测试**: 动画流畅度、数据提交速度

---

## 下一步

完成本模块开发后，可进行以下操作：

1. **提交代码审查（Code Review）**
   - 邀请团队成员审查代码
   - 验证Constitution原则遵守情况

2. **部署到测试环境**
   - 连接真实API
   - 进行用户验收测试（UAT）

3. **性能优化**
   - 使用Lighthouse分析性能
   - 优化首屏加载速度
   - 实施代码分割（Code Splitting）

4. **文档更新**
   - 更新项目README
   - 编写API文档
   - 记录已知问题和解决方案

5. **发布到生产环境**
   - 创建Git标签（如 `v1.0.0`）
   - 部署到生产服务器
   - 监控线上指标

---

## 参考资料

### 内部文档

- **spec.md**: 完整功能需求规格说明
- **plan.md**: 实现计划和技术路线
- **data-model.md**: 数据实体定义
- **contracts/api.yaml**: API契约规范
- **research.md**: 技术选型决策记录
- **constitution.md**: 平台开发原则（7大核心原则）

### 外部文档

- [React 18 官方文档](https://react.dev/)
- [Vite 4 文档](https://vitejs.dev/)
- [Recharts 文档](https://recharts.org/)
- [CSS Modules 规范](https://github.com/css-modules/css-modules)
- [MSW (Mock Service Worker)](https://mswjs.io/)

### 学习资源

- [React Hooks 完全指南](https://overreacted.io/a-complete-guide-to-useeffect/)
- [CSS3 动画性能优化](https://web.dev/animations-guide/)
- [API设计最佳实践](https://swagger.io/resources/articles/best-practices-in-api-design/)

---

**祝开发顺利！如有问题，请联系项目负责人。**
