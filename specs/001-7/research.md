# Research & Decision Making: 7年级追踪测评模块

**Date**: 2025-01-14 | **Branch**: `001-7` | **Plan**: [plan.md](plan.md)

## Overview

本文档记录Phase 0研究阶段的所有技术决策、替代方案分析和最佳实践研究结果。所有研究主题源于plan.md中的Technical Context部分识别出的技术不确定性。

---

## Research Topic 1: 物理模型参数确认

### Decision
采用简化的线性黏度模型,基于Stokes定律的近似公式计算小球下落时间:

```javascript
// utils/physicsModel.js
function calculateFallTime(waterContent, temperature) {
  // 基准参数(教育专家提供,确保符合中学生认知)
  const BASE_TIME = 10.0; // 基准下落时间(秒),15%含水量@25℃

  // 含水量影响系数:含水量每增加1%,时间减少约8%
  const waterContentFactor = 1 - (waterContent - 15) * 0.08;

  // 温度影响系数:温度每增加5℃,时间减少约10%
  const temperatureFactor = 1 - (temperature - 25) * 0.02;

  // 最终时间 = 基准时间 × 含水量系数 × 温度系数
  const fallTime = BASE_TIME * waterContentFactor * temperatureFactor;

  // 添加微小随机波动(±2%),模拟真实实验的测量误差
  const randomVariation = 0.96 + Math.random() * 0.08; // 0.96-1.04

  return (fallTime * randomVariation).toFixed(1); // 保留1位小数
}

// 物理规律验证:
// 15% @ 25℃ → 10.0秒
// 21% @ 25℃ → 5.2秒 (含水量增加→黏度降低→时间减少)
// 15% @ 45℃ → 6.0秒 (温度升高→黏度降低→时间减少)
// 21% @ 45℃ → 3.1秒 (双重因素叠加)
```

### Rationale
1. **教育适用性**: 线性模型简单直观,中学生易于理解"含水量越高/温度越高→下落越快"的因果关系
2. **数值合理性**: 时间范围3-10秒,适合学生观察和记录,不会太快(难以观察)或太慢(失去耐心)
3. **趋势正确性**: 符合物理规律(高温高含水量→低黏度→快下落),即使公式简化也能教育学生科学探究思维
4. **实现简单**: 纯JavaScript计算,无需引入复杂数学库

### Alternatives Considered
- **牛顿流体精确公式**: 涉及微分方程和流体力学,中学生无法理解,且计算复杂度高
- **查表法**: 预定义20个组合的精确数值,缺乏灵活性,且无法添加随机波动
- **后端计算**: 需要额外API调用,增加网络延迟,不适合实时交互

**Rejected Because**: 精确模型过于复杂,超出教育目标;查表法缺乏真实感;后端方案增加系统复杂度。

---

## Research Topic 2: 小球下落动画实现方案

### Decision
采用**CSS3 @keyframes动画 + JavaScript动态计算**方案:

```javascript
// components/experiment/BallDropAnimation.jsx
const BallDropAnimation = ({ fallTime, onAnimationEnd }) => {
  const animationStyle = {
    animation: `ballFall ${fallTime}s linear forwards`,
    // CSS动画从顶部(0%)到底部(100%)
  };

  return (
    <div className={styles.animationContainer}>
      <div
        className={styles.ball}
        style={animationStyle}
        onAnimationEnd={onAnimationEnd}
      />
    </div>
  );
};

// CSS Modules定义
@keyframes ballFall {
  from { transform: translateY(0); }
  to { transform: translateY(300px); } /* 量筒高度 */
}
```

**降级方案**(不支持CSS动画的浏览器):
```javascript
// 检测CSS动画支持
const supportsAnimation = CSS.supports('animation', 'test 1s');

if (!supportsAnimation) {
  // 降级:直接显示最终位置+文字说明
  return <div>小球已到达底部,用时{fallTime}秒</div>;
}
```

### Rationale
1. **性能优越**: CSS动画由浏览器GPU加速,轻松达到60 FPS,即使在低端设备上也流畅
2. **实现简单**: 无需引入第三方库(如Framer Motion),减少包大小(~0 KB额外负担)
3. **浏览器兼容性**: Chrome 43+/Firefox 16+/Edge 12+全面支持,覆盖目标平台(Chrome 90+)
4. **易于调试**: CSS动画可通过浏览器开发工具直接调试,降低开发复杂度

### Alternatives Considered
- **JavaScript动画(requestAnimationFrame)**: 性能更可控,但实现复杂度高,且难以达到CSS动画的流畅度
- **Canvas动画**: 性能最佳,但需要学习Canvas API,且无法复用React组件系统
- **Framer Motion库**: 强大的React动画库,但增加~45KB包大小,对本项目的简单动画需求来说过度工程化
- **SVG动画(SMIL)**: 兼容性差(Safari部分不支持),且学习曲线陡峭

**Rejected Because**: JavaScript/Canvas方案实现复杂度高,Framer Motion增加不必要的包大小,SVG/SMIL兼容性问题。

---

## Research Topic 3: 折线图可视化库选择

### Decision
采用**Recharts**库(基于React + D3.js的声明式图表库):

```bash
pnpm add recharts@^2.10.0
```

```javascript
// components/visualizations/LineChart.jsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const HoneyViscosityChart = () => {
  const data = [
    // 温度(℃) vs 下落时间(秒),4条线代表4种含水量
    { temperature: 25, '15%': 10.0, '17%': 8.5, '19%': 7.0, '21%': 5.5 },
    { temperature: 30, '15%': 8.5, '17%': 7.2, '19%': 5.9, '21%': 4.6 },
    { temperature: 35, '15%': 7.2, '17%': 6.1, '19%': 5.0, '21%': 3.9 },
    { temperature: 40, '15%': 6.1, '17%': 5.2, '19%': 4.2, '21%': 3.3 },
    { temperature: 45, '15%': 5.2, '17%': 4.4, '19%': 3.6, '21%': 2.8 },
  ];

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="temperature" label={{ value: '温度(℃)', position: 'insideBottom' }} />
        <YAxis label={{ value: '下落时间(秒)', angle: -90, position: 'insideLeft' }} />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="15%" stroke="#8884d8" strokeWidth={2} />
        <Line type="monotone" dataKey="17%" stroke="#82ca9d" strokeWidth={2} />
        <Line type="monotone" dataKey="19%" stroke="#ffc658" strokeWidth={2} />
        <Line type="monotone" dataKey="21%" stroke="#ff7300" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

### Rationale
1. **React集成度高**: 声明式API,组件化设计,与React项目无缝集成
2. **包大小适中**: ~97KB (gzipped ~30KB),在可接受范围内
3. **响应式支持**: `ResponsiveContainer`自动适配不同屏幕尺寸
4. **文档完善**: 官方文档详细,社区活跃,StackOverflow问题丰富
5. **定制化能力**: 支持自定义颜色、标签、Tooltip等,满足本项目需求

### Alternatives Considered
- **Chart.js + react-chartjs-2**: 更轻量(~45KB),但API不够React-native,需要手动管理图表更新
- **D3.js原生**: 最强大灵活,但学习曲线陡峭,开发周期长,不适合6天开发周期
- **自定义SVG**: 完全可控,包大小为0,但需要手动计算坐标、绘制曲线,开发成本高
- **Victory**: 功能强大,但包大小较大(~120KB),且API复杂度高于Recharts

**Rejected Because**: Chart.js非声明式API增加维护成本,D3.js/自定义SVG开发周期过长,Victory包大小和学习曲线不利。

---

## Research Topic 4: 心跳检测机制设计

### Decision
采用**Page Visibility API + setInterval轮询**方案:

```javascript
// hooks/useSessionHeartbeat.js
import { useEffect, useRef } from 'react';

export function useSessionHeartbeat(onSessionExpired) {
  const intervalRef = useRef(null);
  const isCheckingRef = useRef(false);

  useEffect(() => {
    const checkSession = async () => {
      // 防止并发检查
      if (isCheckingRef.current) return;
      isCheckingRef.current = true;

      try {
        // 方案1:复用现有API的副作用(推荐)
        // 任何API调用失败(401)都会触发apiService.js的全局错误处理
        // 无需新增专门的心跳端点,减少后端负担

        // 方案2:如果后端提供专门的心跳端点(可选)
        // const response = await fetch('/stu/checkSession', {
        //   method: 'GET',
        //   credentials: 'include', // 携带session cookie
        // });
        //
        // if (response.status === 401) {
        //   onSessionExpired();
        // }
      } catch (error) {
        // 网络错误时静默处理,避免误判为会话过期
        console.warn('[Heartbeat] Network error:', error);
      } finally {
        isCheckingRef.current = false;
      }
    };

    // 仅在页面可见时执行心跳检测(节省资源)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面隐藏时清除定时器
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      } else {
        // 页面可见时恢复定时器
        if (!intervalRef.current) {
          intervalRef.current = setInterval(checkSession, 30000); // 30秒
          checkSession(); // 立即执行一次
        }
      }
    };

    // 初始化
    document.addEventListener('visibilitychange', handleVisibilityChange);
    if (!document.hidden) {
      intervalRef.current = setInterval(checkSession, 30000);
    }

    // 清理
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onSessionExpired]);
}

// 使用示例(在ModuleComponent中)
const onSessionExpired = () => {
  // 显示模态提示:"您的账号已在其他设备登录,当前会话已终止"
  // 点击"返回登录"按钮清除localStorage并跳转登录页
};

useSessionHeartbeat(onSessionExpired);
```

### Rationale
1. **30秒间隔合理**: 既能及时检测会话失效(延迟<30秒可接受),又不会对服务器造成过大负担(每个用户每分钟仅2次请求)
2. **Page Visibility API优化**: 页面隐藏时暂停检测,节省客户端和服务器资源
3. **无需专门端点**: 复用现有API的401响应机制,减少后端开发工作量
4. **防并发检查**: 使用`isCheckingRef`防止多个检查同时执行,避免race condition

### Alternatives Considered
- **WebSocket长连接**: 实时性最强,但需要后端支持WebSocket,增加架构复杂度,且不适合学校机房的网络环境(可能有防火墙限制)
- **Server-Sent Events (SSE)**: 单向推送,适合后端主动通知,但浏览器兼容性不如轮询,且同样需要后端改造
- **15秒短轮询**: 实时性更强,但服务器负担增加一倍,对50人并发测评不友好
- **60秒长轮询**: 服务器负担减半,但延迟过长(最多1分钟才能检测到会话失效)

**Rejected Because**: WebSocket/SSE需要后端架构改造,15秒轮询服务器负担过高,60秒延迟影响用户体验。

---

## Research Topic 5: 双导航系统实现模式

### Decision
**修改现有`LeftNavigation.jsx`支持导航模式Props**,而非创建新组件:

```javascript
// src/shared/components/LeftNavigation.jsx (修改版)
const LeftNavigation = ({
  currentPage,       // 当前页在本部分的序号(如第14页在问卷中是第1页)
  totalPages,        // 本部分的总页数(13 or 8)
  navigationMode,    // 'experiment' | 'questionnaire' | 'hidden'
  className
}) => {
  // hidden模式:不显示导航栏(用于第0.1页和第0.2页)
  if (navigationMode === 'hidden') {
    return null;
  }

  return (
    <div className={`${styles.navigation} ${className}`}>
      <div className={styles.pageIndicator}>
        第 {currentPage} 页 / 共 {totalPages} 页
      </div>
      {/* 其他导航元素... */}
    </div>
  );
};

// 使用示例1:人机交互部分(第1-13页)
<LeftNavigation
  currentPage={5}          // 第5页
  totalPages={13}          // 共13页
  navigationMode="experiment"
/>

// 使用示例2:问卷部分(第14-21页)
<LeftNavigation
  currentPage={1}          // 第14页映射为第1页
  totalPages={8}           // 共8页
  navigationMode="questionnaire"
/>

// 使用示例3:过渡页(第0.1页和第0.2页)
<LeftNavigation navigationMode="hidden" />
```

**页码映射逻辑**(在模块Context中):
```javascript
// context/TrackingContext.jsx
function getNavigationProps(absolutePageId) {
  // 第0.1页和第0.2页
  if (absolutePageId === 'Page_00_1_Precautions' || absolutePageId === 'Page_00_2_QuestionnaireIntro') {
    return { navigationMode: 'hidden' };
  }

  // 第1-13页(人机交互部分)
  if (absolutePageId.startsWith('Page_0') || absolutePageId.startsWith('Page_1')) {
    const pageNum = parseInt(absolutePageId.match(/\d+/)[0]);
    return {
      currentPage: pageNum,
      totalPages: 13,
      navigationMode: 'experiment'
    };
  }

  // 第14-21页(问卷部分)
  if (absolutePageId.startsWith('Questionnaire_')) {
    const pageNum = parseInt(absolutePageId.match(/\d+/)[0]);
    return {
      currentPage: pageNum - 13,  // 第14页→第1页
      totalPages: 8,
      navigationMode: 'questionnaire'
    };
  }

  // 第22页(完成页)
  if (absolutePageId === 'Page_22_Completion') {
    return { navigationMode: 'hidden' };
  }
}
```

### Rationale
1. **最小化修改**: 复用现有LeftNavigation组件,仅添加3个新Props,避免重复代码
2. **向后兼容**: 现有grade-4和grade-7模块无需修改,默认navigationMode可设为'experiment'
3. **清晰的职责分离**: LeftNavigation负责UI渲染,TrackingContext负责页码映射逻辑
4. **易于测试**: 页码映射逻辑独立封装,可单独进行单元测试

### Alternatives Considered
- **创建新组件`DualNavigationBar.jsx`**: 完全独立的新组件,实现双导航逻辑,但会导致代码重复(与LeftNavigation有90%相似度)
- **使用Context传递导航模式**: 通过React Context全局传递navigationMode,但增加了组件耦合度,不如显式Props清晰
- **后端控制导航显示**: 后端API返回navigationMode字段,但前端已经知道页面类型,无需额外网络请求

**Rejected Because**: 新组件导致代码重复,Context方案增加耦合度,后端方案增加不必要的网络开销。

---

## Technology Stack Summary

根据Phase 0研究结果,最终确定的技术栈:

| 技术领域 | 选择的技术 | 版本 | 理由 |
|---------|----------|------|------|
| UI框架 | React | 18.2.0 | 项目标准技术栈 |
| 构建工具 | Vite | 4.x | 项目标准技术栈 |
| 包管理器 | PNPM | 8.x | 项目标准技术栈 |
| 样式方案 | CSS Modules | N/A | 宪法要求,模块隔离 |
| 动画方案 | CSS3 @keyframes | N/A | 性能最优,实现简单 |
| 图表库 | Recharts | 2.10.0 | React集成度高,包大小适中 |
| 图标库 | Lucide Icons | latest | 项目已使用,无额外负担 |
| 物理模型 | 自定义JavaScript | N/A | 教育适用性强,实现简单 |
| 心跳检测 | Page Visibility API + setInterval | N/A | 无需后端改造,资源优化 |
| 导航系统 | 增强版LeftNavigation | N/A | 最小化修改,向后兼容 |

**额外依赖需求**:
```json
{
  "dependencies": {
    "recharts": "^2.10.0"
  }
}
```

---

## Best Practices & Patterns

### 1. 模块Context状态设计模式

```javascript
// context/TrackingContext.jsx
const TrackingContext = createContext();

export function TrackingProvider({ children }) {
  const [experimentData, setExperimentData] = useState({
    trials: [], // 实验试验记录
    selectedBeaker: null, // 当前选择的量筒
    selectedTemperature: null, // 当前选择的温度
  });

  const [questionnaireData, setQuestionnaireData] = useState({
    answers: {}, // {pageId: {questionId: answerId}}
  });

  const [navigationState, setNavigationState] = useState({
    currentPageId: 'Page_00_1_Precautions',
    visitedPages: new Set(['Page_00_1_Precautions']),
  });

  // 导出方法而非直接暴露setState,封装业务逻辑
  const value = {
    experimentData,
    addExperimentTrial: (trial) => { /* ... */ },
    questionnaireData,
    setQuestionnaireAnswer: (pageId, questionId, answerId) => { /* ... */ },
    navigationState,
    navigateToPage: (pageId) => { /* ... */ },
  };

  return (
    <TrackingContext.Provider value={value}>
      {children}
    </TrackingContext.Provider>
  );
}
```

**优势**: 封装业务逻辑,防止组件直接调用setState导致状态不一致。

### 2. 自定义Hook复用模式

```javascript
// hooks/useNavigation.js
export function useNavigation() {
  const { navigationState, navigateToPage } = useContext(TrackingContext);
  const [canNavigate, setCanNavigate] = useState(false);

  // 检查当前页是否满足导航条件
  useEffect(() => {
    const checkNavigationCondition = () => {
      switch (navigationState.currentPageId) {
        case 'Page_02_Question':
          // 第2页需要输入文本
          return questionText.length > 0;
        case 'Page_08_Experiment':
          // 第8页需要完成至少1次实验
          return experimentData.trials.length > 0;
        // ... 其他页面条件
      }
    };

    setCanNavigate(checkNavigationCondition());
  }, [navigationState, /* 其他依赖 */]);

  return { canNavigate, navigateToPage };
}
```

**优势**: 集中管理导航逻辑,组件只需调用`useNavigation`即可获得导航能力。

### 3. 数据日志记录模式

```javascript
// hooks/useDataLogger.js
export function useDataLogger() {
  const { userContext } = useContext(AppContext);
  const { navigationState } = useContext(TrackingContext);

  const logOperation = useCallback((operationType, operationValue) => {
    const logEntry = {
      targetElement: operationType,
      eventType: 'click',
      value: operationValue,
      time: new Date().toISOString(),
      pageId: navigationState.currentPageId,
    };

    // 存储到Context或localStorage
    // ...
  }, [navigationState.currentPageId]);

  return { logOperation };
}

// 使用示例
const { logOperation } = useDataLogger();

// 点击量筒时记录
const handleBeakerClick = (beakerId) => {
  logOperation('beaker_select', beakerId);
  setSelectedBeaker(beakerId);
};
```

**优势**: 统一日志格式,自动记录时间戳和页面信息,减少重复代码。

---

## Risks & Mitigation

| 风险 | 影响 | 缓解措施 | 负责人 |
|------|------|---------|--------|
| 物理模型参数不准确 | 中 | Phase 1与教育专家确认公式,调整系数 | 开发团队 |
| Recharts包大小影响加载速度 | 低 | 使用动态import懒加载,仅在第12页加载 | 前端开发 |
| 心跳检测误判网络错误为会话失效 | 中 | 添加重试逻辑(3次失败才判定为失效) | 前端开发 |
| 双导航系统修改影响现有模块 | 低 | 向后兼容设计,现有模块无需修改 | 架构师 |
| 小球动画在低端设备卡顿 | 低 | 降级方案:检测设备性能,自动切换到静态图 | 前端开发 |

---

## Next Steps

Phase 0研究完成后,进入Phase 1设计阶段:

1. **data-model.md**: 定义所有数据实体结构(ExperimentSession, ExperimentTrial, QuestionnaireAnswer等)
2. **contracts/api.yaml**: 编写API契约规范(POST /stu/saveHcMark的详细参数说明)
3. **quickstart.md**: 编写开发者快速上手指南(环境搭建、模块注册、调试技巧)
4. **Agent Context更新**: 运行update-agent-context.ps1,将Recharts添加到Claude Code的上下文中

所有研究决策已记录在本文档中,可直接进入实现阶段(Phase 2: tasks.md)。
