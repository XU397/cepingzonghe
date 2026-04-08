# Flow 架构分析与模块改造方案

## 文档概述

本文档详细分析了基于 OpenSpec 规范构建的交互评测系统的 Flow 架构，包括前后端交互规范、数据提交机制，以及原有模块向子模块架构迁移的技术方案。

**编写日期**: 2025-11-18
**适用版本**: v1.0.0 (Flow 架构)
**相关规范**: `openspec/specs/integration/spec.md`, `openspec/project.md`

---

## 一、登录流程与 Flow 入口机制

### 1.1 后端登录响应数据结构

#### 1.1.1 传统单模块模式（向后兼容）

**接口**: `POST /stu/login`

**响应示例**:
```json
{
  "code": 200,
  "msg": "成功",
  "obj": {
    "url": "/four-grade",           // 模块路由路径
    "pageNum": "11",                // 模块内页码（字符串）
    "batchCode": "250619",          // 批次号
    "examNo": "1001",               // 考生编号
    "studentName": "张三",          // 学生姓名
    "schoolCode": "24146",          // 学校代码
    "schoolName": "成都市XX小学"    // 学校名称
  }
}
```

**字段说明**:
- **url**: 必填，决定加载哪个模块（如 `/four-grade`, `/seven-grade`, `/grade-7-tracking`）
- **pageNum**: 必填，模块内页码，用于恢复进度（如用户刷新页面）
- **batchCode**: 必填，用于数据提交和权限校验
- **examNo**: 必填，考生唯一标识

---

#### 1.1.2 Flow 拼装式模式（新架构）

**响应示例**:
```json
{
  "code": 200,
  "msg": "成功",
  "obj": {
    "url": "/flow/test-flow-1",     // Flow 路由路径（格式: /flow/<flowId>）
    "pageNum": "0.1",               // 兼容字段：复合页码（可选）
    "batchCode": "250619",
    "examNo": "1001",
    "studentName": "测试用户",
    "schoolCode": "24146",
    "schoolName": "开发环境（Mock）",

    // === Flow 模式新增字段 ===
    "flowId": "test-flow-1",        // Flow 唯一标识（冗余字段，与 url 保持一致）
    "progress": {
      "stepIndex": 0,               // 当前步骤索引（从 0 开始）
      "modulePageNum": "1"          // 当前子模块内的页码（字符串）
    }
  }
}
```

**新增字段说明**:
- **flowId**: 建议返回，便于前端快速识别 Flow ID
- **progress.stepIndex**: 必填，指示用户当前在 Flow 的第几步
- **progress.modulePageNum**: 必填，指示用户在当前子模块的哪一页
- **pageNum**: 兼容字段，可编码为复合页码格式（如 `M0:1` 表示第 0 步第 1 页）

---

### 1.2 前端路由解析逻辑

**路由映射表**:
```
登录返回 url          =>  前端路由组件
---------------------------------------------
/four-grade          =>  ModuleRouter (加载 grade-4 模块)
/seven-grade         =>  ModuleRouter (加载 grade-7 模块)
/grade-7-tracking    =>  ModuleRouter (加载 grade-7-tracking 模块)
/flow/<flowId>       =>  FlowModule (加载 Flow 编排器)
```

**关键代码位置**:
- [src/flows/FlowModule.jsx:56-71](src/flows/FlowModule.jsx:56-71) - Flow ID 解析逻辑
- [src/modules/ModuleRouter.jsx](src/modules/ModuleRouter.jsx) - 传统模块路由器
- [src/flows/orchestrator/FlowOrchestrator.ts](src/flows/orchestrator/FlowOrchestrator.ts) - Flow 编排器

**Flow 跳转示例**:
```javascript
// 登录成功后，前端根据 url 判断模式
const loginResponse = await loginUser(credentials);
const { url, flowId, progress, pageNum } = loginResponse.obj;

if (url.startsWith('/flow/')) {
  // Flow 模式：加载 FlowModule
  navigate(`/flow/${flowId}`, {
    state: {
      userContext: { examNo, batchCode, pageNum },
      progress
    }
  });
} else {
  // 传统模块模式：加载 ModuleRouter
  navigate(url, {
    state: { examNo, batchCode, pageNum }
  });
}
```

---

### 1.3 Flow 定义获取

**接口**: `GET /api/flows/{flowId}`

**响应示例**:
```json
{
  "code": 200,
  "msg": "ok",
  "obj": {
    "flowId": "test-flow-1",
    "name": "测试 Flow - 7年级实验+4年级实验",
    "url": "/flow/test-flow-1",
    "description": "用于开发测试的混合 Flow",
    "status": "published",
    "version": "1.0.0",

    "steps": [
      {
        "submoduleId": "g7-experiment",         // 子模块 ID
        "displayName": "7年级蒸馒头实验",
        "overrides": {                          // 配置覆盖
          "timers": {
            "task": 2700,                       // 45分钟（秒）
            "questionnaire": 600                // 10分钟（秒）
          }
        },
        "transitionPage": {                     // 过渡页配置
          "title": "第一部分已完成",
          "content": "您已完成7年级蒸馒头实验部分，稍后将进入4年级火车票任务。",
          "autoNextSeconds": 5                  // 5秒后自动跳转
        }
      },
      {
        "submoduleId": "g4-experiment",
        "displayName": "4年级火车票规划任务",
        "overrides": null,
        "transitionPage": null
      }
    ]
  }
}
```

**字段说明**:
- **steps**: 步骤数组，按顺序执行
- **submoduleId**: 必填，对应子模块注册表中的 ID（kebab-case）
- **overrides.timers**: 可选，覆盖子模块默认计时配置
- **transitionPage**: 可选，步骤间过渡页配置

---

## 二、页面数据提交机制

### 2.1 提交接口规范

**接口**: `POST /stu/saveHcMark`

**请求格式**: `multipart/form-data`（重要：不是 JSON）

**请求参数**:
```
batchCode: string       // 批次号
examNo: string          // 考生编号
mark: string            // JSON 字符串（MarkObject 序列化）
```

---

### 2.2 MarkObject 数据结构

**类型定义**:
```typescript
interface MarkObject {
  pageNumber: string;           // 页码（Flow模式为复合页码，如 "M0:11"）
  pageDesc: string;             // 页面描述（Flow模式带前缀）
  operationList: Operation[];   // 操作记录列表
  answerList: Answer[];         // 答案列表
  beginTime: string;            // 开始时间（格式: YYYY-MM-DD HH:mm:ss）
  endTime: string;              // 结束时间
  imgList: any[];               // 图片列表（通常为空）
}

interface Operation {
  code: number;                 // 序号（从 1 开始连续递增）
  targetElement: string;        // 目标元素描述
  eventType: string;            // 事件类型（见 EventTypes 枚举）
  value: string | object;       // 值（flow_context 事件为对象，其他为字符串）
  time: string;                 // 时间戳（YYYY-MM-DD HH:mm:ss）
  pageId?: string;              // 可选：页面 ID
}

interface Answer {
  code: number;                 // 序号（从 1 开始）
  targetElement: string;        // 答题元素
  value: string;                // 答案内容
}
```

---

### 2.3 传统模式提交示例

**提交数据示例**:
```json
{
  "pageNumber": "11",
  "pageDesc": "7年级实验-假设聚焦",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "",
      "time": "2025-11-16 09:00:00"
    },
    {
      "code": 2,
      "targetElement": "按钮:下一页",
      "eventType": "click",
      "value": "下一页",
      "time": "2025-11-16 09:00:30"
    },
    {
      "code": 3,
      "targetElement": "页面",
      "eventType": "page_exit",
      "value": "",
      "time": "2025-11-16 09:00:31"
    }
  ],
  "answerList": [
    {
      "code": 1,
      "targetElement": "Q1",
      "value": "温度影响面团发酵速度"
    }
  ],
  "beginTime": "2025-11-16 09:00:00",
  "endTime": "2025-11-16 09:00:31",
  "imgList": []
}
```

---

### 2.4 Flow 模式提交示例

**Flow 模式特殊处理**:

1. **复合页码编码**:
   - 格式: `M<stepIndex>:<subPageNum>`
   - 示例: `M0:11` 表示第 0 步（g7-experiment）的第 11 页

2. **pageDesc 前缀增强**:
   - 格式: `[flowId/submoduleId/stepIndex] 原始描述`
   - 示例: `[test-flow-1/g7-experiment/0] 7年级实验-假设聚焦`

3. **flow_context 事件注入**:
   - 每个页面提交时自动注入一条 `flow_context` 事件
   - value 为对象类型（非字符串）

**提交数据示例**:
```json
{
  "pageNumber": "M0:11",
  "pageDesc": "[test-flow-1/g7-experiment/0] 7年级实验-假设聚焦",
  "operationList": [
    {
      "code": 1,
      "targetElement": "页面",
      "eventType": "page_enter",
      "value": "",
      "time": "2025-11-16 09:00:00"
    },
    {
      "code": 2,
      "targetElement": "flow_context",
      "eventType": "flow_context",
      "value": {
        "flowId": "test-flow-1",
        "stepIndex": 0,
        "submoduleId": "g7-experiment",
        "moduleName": "7年级蒸馒头-交互"
      },
      "time": "2025-11-16 09:00:00",
      "pageId": "Page_10_Hypothesis_Focus"
    },
    {
      "code": 3,
      "targetElement": "按钮:下一页",
      "eventType": "click",
      "value": "下一页",
      "time": "2025-11-16 09:00:30"
    }
  ],
  "answerList": [...],
  "beginTime": "2025-11-16 09:00:00",
  "endTime": "2025-11-16 09:00:31",
  "imgList": []
}
```

---

### 2.5 提交方法实现

**核心 Hook**: [src/shared/services/submission/usePageSubmission.js](src/shared/services/submission/usePageSubmission.js)

**使用示例**:
```javascript
import { usePageSubmission } from '@shared/services/submission';

function MyPage() {
  const { submit, isSubmitting } = usePageSubmission({
    getUserContext: () => ({
      batchCode: '250619',
      examNo: '1001'
    }),
    buildMark: () => ({
      pageNumber: 'M0:11',
      pageDesc: '7年级实验-假设聚焦',
      operationList: [...],
      answerList: [...],
      beginTime: '2025-11-16 09:00:00',
      endTime: '2025-11-16 09:00:31',
      imgList: []
    }),
    getFlowContext: () => ({
      flowId: 'test-flow-1',
      stepIndex: 0,
      submoduleId: 'g7-experiment',
      pageId: 'Page_10_Hypothesis_Focus'
    })
  });

  const handleSubmit = async () => {
    const success = await submit();
    if (success) {
      navigateToNextPage();
    }
  };
}
```

**重试机制**:
- 失败后按 [1s, 2s, 4s] 指数退避重试
- 401 错误（会话过期）不重试，立即跳转登录页
- DEV 环境可配置失败放行（`allowProceedOnFailureInDev: true`）

---

## 三、原有模块向子模块架构迁移

### 3.1 原有模块结构

**原有 3 个独立模块**:
```
1. grade-7 (7年级蒸馒头)
   - 包含交互部分和问卷部分（混合在一起）
   - 使用传统 PageRouter
   - URL: /seven-grade

2. grade-4 (4年级火车票)
   - 纯交互评测
   - 使用 CSS Modules
   - URL: /four-grade

3. grade-7-tracking (7年级追踪-蜂蜜黏度)
   - 包含物理实验和问卷（混合在一起）
   - 使用 TrackingContext
   - URL: /grade-7-tracking
```

---

### 3.2 目标子模块架构

**新架构拆分为 5 个子模块**:
```
1. g7-experiment (7年级蒸馒头-交互)
   - 拆分自 grade-7，仅包含交互部分
   - 14 个页面（Page_01 ~ Page_19，去除问卷）

2. g7-questionnaire (7年级蒸馒头-问卷)
   - 拆分自 grade-7，仅包含问卷部分
   - 9 个页面（Page_20 ~ Page_28）

3. g7-tracking-experiment (7年级追踪-交互)
   - 拆分自 grade-7-tracking，仅包含实验部分
   - 14 个页面（Page01 ~ Page14）

4. g7-tracking-questionnaire (7年级追踪-问卷)
   - 拆分自 grade-7-tracking，仅包含问卷部分
   - 9 个页面（Page15 ~ Page23）

5. g4-experiment (4年级火车票-交互)
   - 基于 grade-4 包装
   - 12 个页面（00-NoticesPage ~ 12-TaskCompletionPage）
```

---

### 3.3 子模块接口规范（CMI）

**类型定义**: [src/shared/types/flow.ts:80-106](src/shared/types/flow.ts:80-106)

**必需方法**:
```typescript
interface SubmoduleDefinition {
  // 基础信息
  submoduleId: string;                          // 唯一标识（kebab-case）
  displayName: string;                          // 显示名称
  version: string;                              // 版本号

  // 组件
  Component: ComponentType<SubmoduleProps>;     // React 组件

  // 页面映射（核心）
  getInitialPage: (subPageNum: string) => string;  // 子页码 => 页面 ID
  resolvePageNum?: (pageId: string) => string;     // 页面 ID => 子页码（可选但推荐）

  // 导航与计时
  getTotalSteps: () => number;                     // 总步数
  getNavigationMode: (pageId: string) => 'experiment' | 'questionnaire' | 'hidden';
  getDefaultTimers?: () => { task?: number; questionnaire?: number };

  // 生命周期钩子
  onInitialize?: () => void;                       // 初始化钩子
  onDestroy?: () => void;                          // 销毁钩子
}
```

---

### 3.4 子模块实现示例

**参考实现**: [src/submodules/g7-experiment/](src/submodules/g7-experiment/)

**目录结构**:
```
src/submodules/g7-experiment/
├── index.jsx              // 子模块定义（导出 G7ExperimentSubmodule）
├── Component.jsx          // 包装器组件
├── mapping.ts             // 页码映射逻辑
└── README.md              // 子模块说明文档
```

**index.jsx**:
```javascript
import { G7ExperimentComponent } from './Component';
import {
  getInitialPage,
  getTotalSteps,
  getNavigationMode,
  getDefaultTimers,
  getPageNumByPageId,
} from './mapping';

export const G7ExperimentSubmodule = {
  submoduleId: 'g7-experiment',
  displayName: '7年级蒸馒头-交互',
  version: '1.0.0',
  Component: G7ExperimentComponent,
  getInitialPage,
  getTotalSteps,
  getNavigationMode,
  getDefaultTimers,
  resolvePageNum: getPageNumByPageId,

  onInitialize: () => {
    console.log('[G7Experiment] 子模块初始化');
  },

  onDestroy: () => {
    console.log('[G7Experiment] 子模块销毁');
  },
};
```

**mapping.ts**:
```typescript
import { PageMapping, getTargetPageIdFromPageNum, getTotalPages } from '@/shared/utils/pageMapping';

export const PAGE_MAPPING: PageMapping = {
  default: 'Page_01_Precautions',
  '1': 'Page_01_Precautions',
  '2': 'Page_02_Introduction',
  '3': 'Page_03_Dialogue_Question',
  // ... 省略中间页面
  '14': 'Page_19_Task_Completion',
};

export function getInitialPage(subPageNum: string): string {
  return getTargetPageIdFromPageNum(subPageNum, PAGE_MAPPING);
}

export function getTotalSteps(): number {
  return getTotalPages(PAGE_MAPPING);
}

export function getNavigationMode(pageId: string): 'experiment' | 'questionnaire' | 'hidden' {
  if (pageId === 'Page_01_Precautions') {
    return 'hidden';  // 注意事项页隐藏导航
  }
  return 'experiment';
}

export function getDefaultTimers() {
  return { task: 40 * 60 };  // 40分钟
}
```

---

### 3.5 模块改造的核心问题

#### 问题 1: 页码映射冲突

**问题描述**:
- 原有模块使用全局连续页码（如 grade-7: 1~28）
- 子模块拆分后需要重新映射（如 g7-experiment: 1~14, g7-questionnaire: 1~9）
- 后端数据库已存储旧页码，需要兼容

**解决方案**:
1. **前端映射层**:
   - 子模块内部使用新页码（1~14）
   - 通过 `mapping.ts` 定义新旧页码映射
   - `getInitialPage(subPageNum)` 处理页码转换

2. **后端兼容策略**:
   - 登录接口返回复合页码（如 `M0:11` 表示第 0 步第 11 页）
   - 提交接口接受复合页码格式
   - 后端根据 `pageDesc` 前缀解析 Flow 信息

**示例映射**:
```typescript
// 原 grade-7 页码 => 子模块页码
const LEGACY_TO_NEW_MAPPING = {
  // g7-experiment (交互部分)
  '1': 'M0:1',   // Page_01_Precautions
  '2': 'M0:2',   // Page_02_Introduction
  // ...
  '14': 'M0:14', // Page_19_Task_Completion

  // g7-questionnaire (问卷部分)
  '20': 'M1:1',  // Page_20_Questionnaire_Intro
  '21': 'M1:2',  // Page_21_Curiosity_Questions
  // ...
  '28': 'M1:9',  // Page_28_Effort_Submit
};
```

---

#### 问题 2: 状态管理隔离

**问题描述**:
- 原有模块使用独立的 Context（如 `Grade7Context`, `TrackingContext`）
- 子模块需要共享某些状态（如用户信息、计时器），但隔离业务逻辑
- 需要避免状态冲突和内存泄漏

**解决方案**:
1. **统一平台服务**:
   - 计时器: 使用 `TimerService`（[src/shared/services/timers/](src/shared/services/timers/)）
   - 提交: 使用 `usePageSubmission` Hook
   - 用户上下文: 通过 `FlowAppContextBridge` 桥接

2. **子模块隔离**:
   - 每个子模块维护自己的内部状态
   - 通过 `flowContext.updateModuleProgress(pageNum)` 同步进度
   - 销毁时调用 `onDestroy()` 清理状态

**代码示例**:
```javascript
// 子模块包装器组件
export function G7ExperimentComponent({ userContext, initialPageId, flowContext }) {
  // 内部状态（隔离）
  const [localState, setLocalState] = useState({});

  // 统一计时（共享）
  const { remainingTime } = useTimer({
    mode: 'task',
    duration: flowContext?.options?.timers?.task || 40 * 60
  });

  // 统一提交（共享）
  const { submit } = usePageSubmission({
    getUserContext: () => userContext,
    getFlowContext: () => ({
      flowId: flowContext?.flowId,
      stepIndex: flowContext?.stepIndex,
      submoduleId: 'g7-experiment'
    })
  });

  // 页面切换时同步进度
  const handleNavigate = (nextPageId) => {
    const nextPageNum = getPageNumByPageId(nextPageId);
    flowContext?.updateModuleProgress(nextPageNum);
  };

  // 完成时通知编排器
  const handleComplete = () => {
    flowContext?.onComplete();
  };

  return (
    <Grade7Provider localState={localState}>
      <Grade7Pages
        currentPageId={currentPageId}
        onNavigate={handleNavigate}
        onComplete={handleComplete}
      />
    </Grade7Provider>
  );
}
```

---

#### 问题 3: 计时器切换

**问题描述**:
- 交互部分和问卷部分使用不同的计时器（task vs questionnaire）
- 原有模块在同一个 Context 内切换计时器，逻辑复杂
- 子模块拆分后需要在步骤间切换计时器模式

**解决方案**:
1. **导航模式定义**:
   - 每个页面通过 `getNavigationMode(pageId)` 返回模式
   - 模式类型: `experiment`, `questionnaire`, `hidden`
   - 统一导航栏根据模式切换显示逻辑

2. **计时器自动切换**:
   - FlowOrchestrator 根据 `getNavigationMode()` 自动切换计时器
   - 超时行为根据模式触发不同的跳转逻辑

**配置示例**:
```typescript
// g7-experiment 子模块（仅 task 计时）
export function getNavigationMode(pageId: string) {
  if (pageId === 'Page_01_Precautions') {
    return 'hidden';  // 注意事项页
  }
  return 'experiment';  // 其他页面使用任务计时
}

export function getDefaultTimers() {
  return { task: 40 * 60 };  // 仅定义 task 计时
}

// g7-questionnaire 子模块（仅 questionnaire 计时）
export function getNavigationMode(pageId: string) {
  return 'questionnaire';  // 所有页面使用问卷计时
}

export function getDefaultTimers() {
  return { questionnaire: 10 * 60 };  // 仅定义 questionnaire 计时
}
```

---

#### 问题 4: 数据提交一致性

**问题描述**:
- 原有模块的提交逻辑分散在各个页面组件中
- 需要统一注入 Flow 上下文信息（flowId, stepIndex, submoduleId）
- 避免重复代码和遗漏字段

**解决方案**:
1. **统一提交 Hook**:
   - 所有子模块使用 `usePageSubmission`
   - 自动注入 `flow_context` 事件
   - 自动增强 `pageDesc` 前缀

2. **校验与容错**:
   - 使用 `validateMarkObject` 校验提交数据
   - 支持 DEV 环境失败放行（调试用）
   - 401 错误统一处理会话过期

**使用规范**:
```javascript
// 统一提交模式（推荐）
const { submit } = usePageSubmission({
  getUserContext: () => ({
    batchCode: userContext.batchCode,
    examNo: userContext.examNo
  }),
  buildMark: () => ({
    pageNumber: currentPageNum,
    pageDesc: '7年级实验-假设聚焦',
    operationList: operations,
    answerList: answers,
    beginTime: pageStartTime,
    endTime: new Date().toISOString()
  }),
  getFlowContext: () => flowContext  // 自动注入 Flow 信息
});

await submit();  // 自动处理重试、错误、Flow 上下文注入
```

---

#### 问题 5: 向后兼容性

**问题描述**:
- 旧账号已经在传统模块中开始测评
- 不能强制所有用户迁移到 Flow 模式
- 需要同时支持旧模块和新子模块

**解决方案**:
1. **双模式运行**:
   - 保留传统模块注册（grade-7, grade-4, grade-7-tracking）
   - 新增子模块注册（g7-experiment, g7-questionnaire 等）
   - 登录接口根据批次配置返回不同的 URL

2. **灰度发布策略**:
   - 通过批次绑定表（`batch_flows`）控制哪些批次使用 Flow
   - 未绑定的批次继续使用传统模块
   - 支持批次级别的回滚

3. **数据兼容**:
   - 提交接口同时接受传统页码和复合页码
   - `pageDesc` 前缀可选（旧数据无前缀）
   - 后端根据 `pageDesc` 格式自动识别模式

**批次管理示例**:
```sql
-- 批次绑定表
CREATE TABLE batch_flows (
  batch_code VARCHAR(50) PRIMARY KEY,
  flow_id VARCHAR(100),
  version VARCHAR(20),
  bound_at TIMESTAMP,
  bound_by VARCHAR(50)
);

-- 绑定批次到 Flow
INSERT INTO batch_flows (batch_code, flow_id, version, bound_at, bound_by)
VALUES ('250619', 'test-flow-1', '1.0.0', NOW(), 'admin');

-- 登录逻辑
SELECT
  CASE
    WHEN bf.flow_id IS NOT NULL THEN CONCAT('/flow/', bf.flow_id)
    ELSE '/seven-grade'  -- 默认传统模块
  END AS url
FROM users u
LEFT JOIN batch_flows bf ON u.batch_code = bf.batch_code
WHERE u.exam_no = '1001';
```

---

## 四、迁移实施步骤

### 4.1 阶段划分

**阶段 1: 基础设施准备** (已完成)
- ✅ 实现 `FlowOrchestrator` 编排器
- ✅ 实现 `SubmoduleRegistry` 注册表
- ✅ 实现 `usePageSubmission` 统一提交
- ✅ 实现 `TimerService` 统一计时
- ✅ 定义 CMI 接口规范

**阶段 2: 子模块包装** (进行中)
- ✅ g7-experiment (7年级蒸馒头-交互)
- ✅ g7-questionnaire (7年级蒸馒头-问卷)
- ✅ g7-tracking-experiment (7年级追踪-交互)
- ✅ g7-tracking-questionnaire (7年级追踪-问卷)
- ✅ g4-experiment (4年级火车票-交互)

**阶段 3: 集成测试**
- 🔄 单子模块测试（模拟 Flow 环境）
- 🔄 Flow 拼装测试（多步骤跳转）
- 🔄 数据提交验证（复合页码、Flow 上下文）
- ⏳ 浏览器兼容性测试

**阶段 4: 灰度发布**
- ⏳ 创建测试批次（绑定到 Flow）
- ⏳ 小范围用户测试（10~20 人）
- ⏳ 监控数据提交成功率、错误率
- ⏳ 逐步扩大批次范围

**阶段 5: 全量上线**
- ⏳ 所有新批次默认使用 Flow
- ⏳ 旧批次保持传统模块（不强制迁移）
- ⏳ 性能监控与优化

---

### 4.2 验收标准

#### 功能验收
- [ ] 登录后正确加载 Flow 并跳转到指定步骤和页面
- [ ] 页面切换正确同步进度到后端（心跳接口）
- [ ] 数据提交包含正确的 Flow 上下文信息
- [ ] 步骤间过渡页正确显示和自动跳转
- [ ] 计时器根据导航模式正确切换（task/questionnaire）
- [ ] 超时后正确跳转到完成页并禁止返回
- [ ] 刷新页面后正确恢复到当前步骤和页面

#### 性能验收
- [ ] Flow 定义加载时间 < 500ms
- [ ] 子模块切换延迟 < 300ms
- [ ] 数据提交成功率 > 99%
- [ ] 心跳接口失败不影响用户继续操作

#### 兼容性验收
- [ ] 旧批次继续使用传统模块，功能正常
- [ ] 后端同时接受传统页码和复合页码
- [ ] 已提交的旧数据可正常查询和分析

---

## 五、技术细节参考

### 5.1 关键代码位置

**Flow 核心**:
- [src/flows/FlowModule.jsx](src/flows/FlowModule.jsx) - Flow 入口组件
- [src/flows/orchestrator/FlowOrchestrator.ts](src/flows/orchestrator/FlowOrchestrator.ts) - 编排器
- [src/flows/context/FlowProvider.jsx](src/flows/context/FlowProvider.jsx) - Flow 上下文

**子模块系统**:
- [src/submodules/registry.ts](src/submodules/registry.ts) - 子模块注册表
- [src/submodules/g7-experiment/](src/submodules/g7-experiment/) - 子模块示例
- [src/shared/types/flow.ts](src/shared/types/flow.ts) - 类型定义

**统一服务**:
- [src/shared/services/submission/usePageSubmission.js](src/shared/services/submission/usePageSubmission.js) - 提交 Hook
- [src/shared/services/timers/TimerService.js](src/shared/services/timers/TimerService.js) - 计时服务
- [src/shared/services/apiService.js](src/shared/services/apiService.js) - API 客户端

**规范文档**:
- [openspec/specs/integration/spec.md](openspec/specs/integration/spec.md) - 集成规范
- [openspec/project.md](openspec/project.md) - 项目约定
- [docs/需求-后端接口与数据模型.md](docs/需求-后端接口与数据模型.md) - 后端接口文档

---

### 5.2 调试与监控

**开发环境配置**:
```bash
# .env.local
VITE_USE_MOCK=1                       # 启用 Mock API
VITE_FLOW_PROVIDER_ENABLED=1          # 启用 FlowProvider
VITE_FLOW_BRIDGE_ENABLED=1            # 启用 FlowAppContextBridge
```

**日志规范**:
```javascript
// 统一日志前缀
console.log('[FlowModule] 加载 Flow:', flowId);
console.log('[FlowOrchestrator] 解析步骤:', stepIndex);
console.log('[usePageSubmission] 提交成功:', response);
```

**关键监控指标**:
- Flow 加载成功率（定义获取失败 / 总请求数）
- 数据提交成功率（提交成功 / 总提交数）
- 步骤切换延迟（中位数、P95、P99）
- 心跳失败率（失败次数 / 总心跳数）

---

## 六、常见问题 FAQ

### Q1: Flow 模式和传统模块模式能否共存？
**A**: 可以。系统支持双模式运行，登录接口根据批次配置返回不同的 `url`。未绑定 Flow 的批次继续使用传统模块。

### Q2: 如何处理用户在旧模块中的进度？
**A**: 旧批次不强制迁移到 Flow。如果需要迁移，需要后端提供数据转换脚本，将旧页码映射到复合页码格式。

### Q3: 子模块的页码是否需要全局唯一？
**A**: 不需要。子模块内部页码（subPageNum）只在子模块范围内唯一。Flow 模式下会编码为复合页码（如 `M0:11`）确保全局唯一。

### Q4: 如何调试 Flow 模式下的数据提交？
**A**:
1. 检查浏览器 Network 面板的 `/stu/saveHcMark` 请求
2. 确认 `mark` 字段是 JSON 字符串（不是对象）
3. 验证 `operationList` 中包含 `flow_context` 事件
4. 检查 `pageDesc` 是否带有 Flow 前缀

### Q5: 如何回滚到传统模块？
**A**:
1. 后端修改批次绑定表，删除 `flow_id` 字段
2. 登录接口返回传统模块 URL（如 `/seven-grade`）
3. 前端自动加载传统模块，无需代码修改

---

## 七、总结

### 架构优势
1. **模块化**: 子模块独立开发、测试、部署
2. **可组合**: 通过 Flow 定义灵活组合不同的评测流程
3. **向后兼容**: 传统模块和 Flow 模式共存
4. **统一服务**: 计时、提交、导航统一管理，减少重复代码
5. **灰度发布**: 支持批次级别的渐进式上线

### 技术挑战
1. **页码映射**: 需要维护旧页码到新页码的映射关系
2. **状态隔离**: 子模块间状态隔离，避免冲突和泄漏
3. **数据兼容**: 后端需要同时支持传统格式和 Flow 格式
4. **测试复杂度**: 需要测试单子模块、多步骤拼装、跨模块跳转等场景

### 下一步工作
1. 完成所有子模块的集成测试
2. 后端实现 Flow 定义管理接口
3. 创建测试批次并绑定到 Flow
4. 小范围用户灰度测试
5. 监控数据并优化性能

---

**文档维护者**: 开发团队
**最后更新**: 2025-11-18
**版本**: v1.0
