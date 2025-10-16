# 任务分解审查与后端集成方案

**Feature ID**: 001-7
**创建日期**: 2025-10-14
**目的**: 审查 tasks.md 的合理性并解决后端登录路由问题

---

## 一、任务分解审查

### 1.1 总体评估 ✅ **合理**

**优点**:
- ✅ 任务粒度适中 (112个任务,每个任务预计0.5-2小时完成)
- ✅ 依赖关系清晰 (Foundational 阻塞所有 User Stories)
- ✅ 并行机会明确 (40-50个任务标记 [P])
- ✅ 按用户故事组织 (US1-US4 独立测试)
- ✅ MVP 范围明确 (US1 + US3 = 第0.1-13页)

### 1.2 依赖关系分析

#### Phase 依赖图

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) ← **关键路径 CRITICAL**
    ↓
    ├─→ Phase 3 (US1) ──┐
    ├─→ Phase 4 (US3) ──┤  可并行
    └─→ Phase 5 (US2) ──┘
            ↓
        Phase 6 (US4) ← 需要所有页面完成
            ↓
        Phase 7 (Polish)
```

**关键发现**:
1. **Phase 2 (Foundational) 是唯一的关键阻塞点** - 必须完成后才能开始任何 User Story
2. **US1, US2, US3 理论上可以并行开发** - 但 US3 依赖 US1 的基础组件 (Button, TextArea 等)
3. **US4 (数据记录) 必须等待所有页面完成** - 这是合理的,因为需要在所有页面集成 logOperation

#### 任务粒度检查

| Task ID | 描述 | 预计时长 | 粒度评估 |
|---------|------|---------|---------|
| T005 | 创建模块配置文件 config.js | 30分钟 | ✅ 合理 |
| T006 | 创建物理模型工具 physicsModel.js | 1小时 | ✅ 合理 |
| T009 | 创建 TrackingContext | 2小时 | ✅ 合理 |
| T024 | 创建 Page01_Notice 页面 | 2-3小时 | ✅ 合理 (包含倒计时逻辑) |
| T028 | 创建 Page05_Resource 页面 | 3-4小时 | ⚠️ 偏大 (5个资料+模态窗口+6个复选框) |
| T045 | 创建 Page10_Experiment 页面 | 4-5小时 | ⚠️ 偏大 (实验操作区+说明区+集成多个组件) |

**建议优化**:
- **T028 (Page05_Resource)** 可拆分为:
  - T028a: 创建页面布局和平板图形
  - T028b: 实现5个资料按钮和模态窗口逻辑
  - T028c: 实现6个影响因素复选框
- **T045 (Page10_Experiment)** 可拆分为:
  - T045a: 创建页面布局 (左右分栏)
  - T045b: 集成实验组件 (BeakerSelector, TemperatureControl)
  - T045c: 集成小球动画和计时逻辑

**结论**: 整体粒度合理,少数复杂页面可进一步细分,但不影响整体可执行性。

### 1.3 并行执行分析

#### 高价值并行组

**组1: Foundational Hooks (T011-T013)** - 可并行
```bash
T011: useDataLogger Hook
T012: useSessionHeartbeat Hook
T013: useNavigation Hook
```
**前提**: T009 (TrackingContext) 已完成

**组2: US1 基础组件 (T018-T023)** - 可并行
```bash
T018: Button 组件
T020: Checkbox 组件
T021: TextArea 组件
T022: Modal 组件
T023: CountdownTimer 组件
```
**前提**: Phase 2 完成

**组3: US3 实验组件 (T037-T043)** - 可并行
```bash
T037: BeakerSelector 组件
T039: TemperatureControl 组件
T041: BallDropAnimation 组件
T043: TimerDisplay 组件
```
**前提**: Phase 2 完成

**组4: US2 问卷页面 (T062-T069)** - 可并行
```bash
T062-T069: 8个问卷页面 (Page15-Page22)
```
**前提**: T055-T059 (问卷组件和 Hook) 已完成

**估算**: 如果有3名开发者,可以节省约40%的时间 (从12天减少到7-8天)

### 1.4 缺失任务识别

❌ **缺少的任务**:

1. **T113: 在 plan.md 中记录确定的 URL 路径** `/grade-7-tracking`
   - **Why**: 需要与后端协调并记录到设计文档中
   - **When**: 在 Phase 1 Setup 阶段

2. **T114: 更新 ModuleRegistry.js 的 URL 注释示例**
   - **Why**: 新增的 URL 应该在注册表中有明确的注释
   - **When**: T017 (注册模块) 时一并完成

3. **T115: 创建开发环境的 Mock 登录响应**
   - **Why**: 在本地开发时模拟后端返回 `{ url: '/grade-7-tracking', pageNum: '1' }`
   - **When**: Phase 1 Setup 阶段,在 T004 (Mock Service Worker) 时一并完成

### 1.5 风险与缓解

| 风险 | 影响 | 概率 | 缓解措施 |
|------|------|------|---------|
| Phase 2 时间估算不足 | 高 | 中 | 预留2-3天缓冲时间;优先完成核心 Hook (T011-T013) |
| 复杂页面 (T028, T045) 开发延期 | 中 | 中 | 进一步细分任务;安排有经验的开发者负责 |
| 并行开发时组件接口不一致 | 中 | 低 | 在 Phase 2 时明确定义所有组件的 Props 接口 |
| 后端 URL 路径协调延迟 | 高 | 低 | 使用 Mock 模式先行开发;后期仅需修改 config.js 中的 url 字段 |

---

## 二、后端登录路由问题

### 2.1 问题描述

**现状**:
- 后端在学生登录成功后返回 `authInfo` 对象,包含 `url` 字段
- 前端 `ModuleRouter.jsx` 根据 `authInfo.url` 动态加载对应模块
- 现有模块:
  - 4年级: `/four-grade`
  - 7年级: `/seven-grade`
- **问题**: 新增的 7年级追踪测评模块的 URL 尚未确定,无法通过登录跳转到开发中的页面

### 2.2 URL 路径建议

根据现有命名规范和模块性质,建议使用以下 URL:

**推荐选项**:

| 选项 | URL 路径 | 优点 | 缺点 |
|------|---------|------|------|
| **选项1** | `/grade-7-tracking` | 清晰表明是7年级追踪测评;符合 kebab-case 规范 | 与现有 `/seven-grade` 风格不一致 |
| **选项2** | `/seven-grade-tracking` | 与现有命名风格一致 (seven-grade) | 稍长;但语义明确 |
| **选项3** | `/seven-grade-2` | 简洁;与现有模块同系列 | 语义不明确;不知道是"追踪测评" |

**最终推荐**: **`/grade-7-tracking`** 或 **`/seven-grade-tracking`**

**理由**:
1. ✅ 语义清晰 - 一看就知道是7年级的追踪测评模块
2. ✅ 便于扩展 - 未来如果有 `grade-8-tracking` 也能保持一致
3. ✅ 与 plan.md 中的 moduleId `'grade-7-tracking'` 一致
4. ✅ URL 与模块目录名对应 `src/modules/grade-7-tracking/`

### 2.3 后端集成方案

#### 方案A: 后端创建新的测评任务类型 (推荐)

**后端需要修改**:

1. **数据库 - 测评任务表**:
```sql
-- 新增一条记录
INSERT INTO assessment_tasks (task_id, grade, type, module_url)
VALUES ('TASK_7_TRACKING', 7, 'tracking', '/grade-7-tracking');
```

2. **登录接口 - 返回对应的 URL**:
```javascript
// 后端登录逻辑伪代码
async function handleLogin(studentCode, password) {
  const student = await authenticateStudent(studentCode, password);
  const assignedTask = await getAssignedTask(student.id);

  return {
    examNo: student.examNo,
    batchCode: student.batchCode,
    url: assignedTask.module_url,  // 返回 '/grade-7-tracking'
    pageNum: assignedTask.last_page || '1'  // 页面恢复
  };
}
```

**前端配置** (已在 tasks.md 中):
```javascript
// src/modules/grade-7-tracking/index.jsx
export const moduleConfig = {
  moduleId: 'grade-7-tracking',
  displayName: '7年级追踪测评-蜂蜜黏度探究',
  url: '/grade-7-tracking',  // 与后端返回的 url 一致
  version: '1.0.0',
  ModuleComponent: Grade7TrackingModule,
  getInitialPage: (pageNum) => pageNum || 0.1
};
```

#### 方案B: 开发环境本地 Mock (临时方案)

在后端未就绪前,使用 Mock 模式开发:

**步骤1: 修改 Mock Service Worker**

创建文件: `src/mocks/login-handlers.js`

```javascript
import { rest } from 'msw';

export const loginHandlers = [
  // Mock 登录接口
  rest.post('/api/login', (req, res, ctx) => {
    const { studentCode, password } = req.body;

    console.log('🔐 [Mock Login] 学生登录:', { studentCode });

    // 模拟登录成功,返回 authInfo
    return res(
      ctx.delay(500), // 模拟网络延迟
      ctx.json({
        code: 200,
        msg: '登录成功',
        data: {
          examNo: studentCode,
          batchCode: 'BATCH_2025',
          url: '/grade-7-tracking',  // 🔑 关键: 返回新模块的 URL
          pageNum: '1',  // 从第1页开始
          studentName: '测试学生',
          schoolCode: 'SCHOOL_001'
        }
      })
    );
  })
];
```

**步骤2: 在 src/mocks/handlers.js 中导入**

```javascript
import { rest } from 'msw';
import { loginHandlers } from './login-handlers';

export const handlers = [
  // 登录相关
  ...loginHandlers,

  // 数据提交相关 (已有)
  rest.post('/stu/saveHcMark', async (req, res, ctx) => {
    // ... 现有代码
  }),

  // 会话检测相关 (已有)
  rest.get('/stu/checkSession', (req, res, ctx) => {
    // ... 现有代码
  })
];
```

**步骤3: 在登录页面添加调试按钮**

```jsx
// src/pages/Login.jsx (示例)
import { useState } from 'react';

function Login() {
  const [studentCode, setStudentCode] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentCode, password })
    });

    const result = await response.json();

    if (result.code === 200) {
      // 将 authInfo 传递给 ModuleRouter
      window.location.href = '#/module-router'; // 或使用 React Router 导航
      // 将 result.data 保存到 AppContext 或 sessionStorage
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="学号"
        value={studentCode}
        onChange={(e) => setStudentCode(e.target.value)}
      />
      <input
        type="password"
        placeholder="密码"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin}>登录</button>

      {/* 开发环境快捷按钮 */}
      {import.meta.env.DEV && (
        <button
          onClick={() => {
            setStudentCode('TEST001');
            setPassword('123456');
          }}
          style={{ marginLeft: '10px', backgroundColor: '#52c41a' }}
        >
          🚀 快速填充测试账号
        </button>
      )}
    </div>
  );
}
```

### 2.4 手工测试验证方案

#### 方案1: 使用浏览器 DevTools 模拟 authInfo

**步骤**:

1. **打开浏览器控制台**

2. **手动设置 authInfo 到 sessionStorage**:
```javascript
// 在浏览器控制台执行
sessionStorage.setItem('authInfo', JSON.stringify({
  examNo: 'TEST001',
  batchCode: 'BATCH_2025',
  url: '/grade-7-tracking',
  pageNum: '1',
  studentName: '测试学生'
}));

// 刷新页面或导航到模块路由
window.location.href = '#/module-router';
```

3. **验证模块加载**:
   - 查看控制台日志: `[ModuleRouter] 📦 找到对应模块: grade-7-tracking`
   - 查看页面左上角开发环境模块信息 (ModuleRouter.jsx L514-531)

#### 方案2: 使用 URL 参数直接跳转 (推荐)

**实现**: 在 `ModuleRouter.jsx` 中添加 URL 参数支持

**修改 src/modules/ModuleRouter.jsx**:

```javascript
// 在 ModuleRouter 组件顶部添加
const ModuleRouter = ({ globalContext, authInfo }) => {
  // 开发环境: 支持从 URL 参数中读取 moduleUrl 和 pageNum
  useEffect(() => {
    if (import.meta.env.DEV) {
      const urlParams = new URLSearchParams(window.location.search);
      const devModuleUrl = urlParams.get('moduleUrl');
      const devPageNum = urlParams.get('pageNum');

      if (devModuleUrl) {
        console.log('🔧 [Dev Mode] 从URL参数加载模块:', {
          moduleUrl: devModuleUrl,
          pageNum: devPageNum
        });

        // 覆盖 authInfo
        authInfo = {
          ...authInfo,
          url: devModuleUrl,
          pageNum: devPageNum || '1',
          examNo: authInfo?.examNo || 'DEV_TEST',
          batchCode: authInfo?.batchCode || 'DEV_BATCH'
        };
      }
    }
  }, []);

  // ... 原有代码
};
```

**使用方式**:

```bash
# 直接在浏览器地址栏访问
http://localhost:5173/?moduleUrl=/grade-7-tracking&pageNum=1

# 或者跳转到特定页面
http://localhost:5173/?moduleUrl=/grade-7-tracking&pageNum=8
```

**优点**:
- ✅ 无需修改登录逻辑
- ✅ 可以快速测试任意页面
- ✅ 便于分享测试链接给其他开发者
- ✅ 不污染 sessionStorage

#### 方案3: 创建开发环境快捷入口页面

**创建文件**: `src/pages/DevModuleSelector.jsx`

```jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function DevModuleSelector() {
  const navigate = useNavigate();
  const [selectedModule, setSelectedModule] = useState('/grade-7-tracking');
  const [pageNum, setPageNum] = useState('1');

  const modules = [
    { url: '/four-grade', name: '4年级测评' },
    { url: '/seven-grade', name: '7年级测评' },
    { url: '/grade-7-tracking', name: '7年级追踪测评-蜂蜜黏度探究' }
  ];

  const handleLaunchModule = () => {
    // 设置 authInfo 到 sessionStorage
    sessionStorage.setItem('authInfo', JSON.stringify({
      examNo: 'DEV_TEST',
      batchCode: 'DEV_BATCH',
      url: selectedModule,
      pageNum: pageNum,
      studentName: '开发测试'
    }));

    // 导航到模块路由
    navigate('/module-router');
  };

  return (
    <div style={{ padding: '40px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>🚀 开发环境 - 模块快速入口</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        此页面仅在开发环境可用,用于快速测试各个模块
      </p>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          选择模块:
        </label>
        <select
          value={selectedModule}
          onChange={(e) => setSelectedModule(e.target.value)}
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #d9d9d9'
          }}
        >
          {modules.map(module => (
            <option key={module.url} value={module.url}>
              {module.name} ({module.url})
            </option>
          ))}
        </select>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
          起始页码:
        </label>
        <input
          type="text"
          value={pageNum}
          onChange={(e) => setPageNum(e.target.value)}
          placeholder="如: 1, 8, 14"
          style={{
            width: '100%',
            padding: '10px',
            fontSize: '16px',
            borderRadius: '4px',
            border: '1px solid #d9d9d9'
          }}
        />
        <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
          提示: 输入页面编号可以直接跳转到对应页面
        </div>
      </div>

      <button
        onClick={handleLaunchModule}
        style={{
          width: '100%',
          padding: '12px',
          fontSize: '18px',
          backgroundColor: '#1890ff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        🚀 启动模块
      </button>

      <div style={{
        marginTop: '30px',
        padding: '15px',
        backgroundColor: '#f0f0f0',
        borderRadius: '4px'
      }}>
        <h3 style={{ marginTop: 0 }}>📋 当前配置</h3>
        <pre style={{ fontSize: '12px', overflow: 'auto' }}>
          {JSON.stringify({
            examNo: 'DEV_TEST',
            batchCode: 'DEV_BATCH',
            url: selectedModule,
            pageNum: pageNum
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
}

export default DevModuleSelector;
```

**路由配置** (在 App.jsx 或 Router.jsx 中):

```javascript
import DevModuleSelector from './pages/DevModuleSelector';

// React Router 配置
const routes = [
  // ... 其他路由
  {
    path: '/dev-module-selector',
    element: import.meta.env.DEV ? <DevModuleSelector /> : <Navigate to="/login" />
  }
];
```

**使用方式**:

```bash
# 访问开发入口页面
http://localhost:5173/dev-module-selector

# 选择模块 → 输入页码 → 点击"启动模块"
```

---

## 三、推荐实施方案

### 3.1 短期方案 (立即可用)

**目标**: 不依赖后端,立即开始开发和测试

**步骤**:

1. **✅ Phase 1 Setup** (tasks.md T001-T004)
   - 创建目录结构
   - 安装依赖
   - 配置 Mock Service Worker

2. **✅ 添加 Mock 登录接口** (参考 2.3 方案B)
   - 创建 `src/mocks/login-handlers.js`
   - 返回 `url: '/grade-7-tracking'`

3. **✅ 创建开发快捷入口** (参考 2.4 方案3)
   - 创建 `src/pages/DevModuleSelector.jsx`
   - 在 `http://localhost:5173/dev-module-selector` 访问

4. **✅ 开始 Phase 2-7 开发**
   - 所有测试都通过开发快捷入口进行
   - 无需依赖真实登录流程

### 3.2 中期方案 (后端对接)

**时机**: 模块开发完成 50% 后 (约 Phase 3-4 完成后)

**步骤**:

1. **✅ 与后端协调 URL 路径**
   - 确定最终 URL: `/grade-7-tracking` 或 `/seven-grade-tracking`
   - 后端创建新的测评任务类型
   - 后端在数据库中配置 `module_url` 字段

2. **✅ 修改 config.js 中的 url 字段**
   ```javascript
   // src/modules/grade-7-tracking/config.js
   export const moduleConfig = {
     url: '/grade-7-tracking',  // 使用后端确定的 URL
     // ... 其他配置
   };
   ```

3. **✅ 在测试环境进行联调**
   - 使用真实的学生账号登录
   - 验证 ModuleRouter 能正确加载模块
   - 验证页面恢复功能 (pageNum 参数)

### 3.3 长期方案 (生产部署)

**时机**: 所有功能开发完成,准备上线

**步骤**:

1. **✅ 后端配置生产环境**
   - 在生产数据库中添加新模块配置
   - 配置学生与测评任务的关联关系

2. **✅ 前端移除 Mock 代码**
   - 删除或禁用 Mock Service Worker 中的登录 handlers
   - 删除 DevModuleSelector 页面 (或设置生产环境不可访问)

3. **✅ 进行完整的端到端测试**
   - 真实学生登录 → 跳转到模块 → 完成测评 → 提交数据

---

## 四、后端协调清单

### 4.1 需要后端提供的信息 ✅ **已完成协调**

- [x] **确认 URL 路径**: ✅ 使用 `/grade-7-tracking` (已与前端 moduleId 保持一致)
- [x] **确认页面编号格式**: ✅ 支持小数页码（如 `"0.1"`, `"3.5"`）- 后端存储格式为页码×100
- [x] **确认 pageNum 映射逻辑**: ✅ 后端存储当前页码为字符串（如 `"3.5"`），前端直接使用
- [x] **确认数据提交接口**: ✅ POST /stu/saveHcMark 不需要新增字段，使用现有格式
- [x] **确认会话检测接口**: ✅ 不需要新增接口，后端已通过拦截器实现（session失效返回 `code === 401`）

### 4.2 需要后端配置的内容 ✅ **已通过管理后端可视化完成**

- [x] **数据库 - 测评任务表**: ✅ 已通过管理后端可视化配置
  ```sql
  -- 示例：任务表配置（实际已通过管理界面完成）
  INSERT INTO assessment_tasks (task_id, grade, type, module_url, duration)
  VALUES ('TASK_7_TRACKING', 7, 'tracking', '/grade-7-tracking', 50);
  ```

- [x] **数据库 - 学生任务关联**: ✅ 已通过管理后端可视化配置
  ```sql
  -- 示例：学生任务分配（实际已通过管理界面完成）
  UPDATE student_assignments
  SET task_id = 'TASK_7_TRACKING'
  WHERE batch_code = 'BATCH_2025_TRACKING';
  ```

- [x] **登录接口 - 返回 URL 逻辑**: ✅ 已实现，完整响应格式如下
  ```javascript
  // 登录成功响应（后端已实现）
  {
    "batchCode": "375186",         // 评价批次
    "studentCode": "xxx",           // 学籍号
    "examNo": "xxx",                // 考生号
    "studentName": "xxx",           // 学生姓名
    "schoolCode": "5101140006",     // 学校编码
    "schoolName": "蚕丛路小学",     // 学校名称
    "classCode": "xxx",             // 班级
    "url": "/grade-7-tracking",     // 🔑 前端路由URL
    "pageNum": "3.5"                // 🔑 最后答题页码（支持小数）
  }
  ```

### 4.3 API 契约确认 ✅ **已确认**

参考已生成的 `contracts/api.yaml`，后端已确认：

1. **POST /stu/saveHcMark**: ✅ **已确认，无需修改**

   **请求参数** (FormData):
   ```yaml
   parameters:
     - name: batchCode
       in: formData
       required: false      # 可从 Session 获取
       type: string
     - name: examNo
       in: formData
       required: false      # 可从 Session 获取
       type: string
     - name: mark
       in: formData
       required: true
       type: string         # JSON 字符串（对象，非数组）
       description: |
         JSON 对象（⚠️ 注意：是单个对象，不是数组），包含以下字段:
         - pageNumber: string (如 "3.5")
         - pageDesc: string (页面描述)
         - beginTime: string (ISO 8601格式)
         - endTime: string (ISO 8601格式)
         - answerList: array<{key, value}>
         - imgList: array<{imgUrl}>
         - operationList: array<{code, targetElement, eventType, time, value?}>

   responses:
     200:
       schema:
         code: 200
         msg: "保存成功"
         obj: true
     401:
       description: Session 已过期（由拦截器自动返回）
   ```

2. **GET /stu/checkSession**: ✅ **不需要新增**
   - ✅ 后端已通过拦截器实现 session 失效检测
   - ✅ 当 session 失效时，所有 API 请求自动返回 `code === 401`
   - ✅ 前端只需在全局拦截器中捕获 401 状态码，跳转到登录页即可
   - ❌ 无需实现额外的心跳检测接口

---

## 五、建议行动计划

### 第1周: 独立开发 (不依赖后端)

**Day 1-2**: Phase 1 Setup + Phase 2 Foundational
- ✅ 完成 T001-T017 (基础设施)
- ✅ 实施 Mock 登录方案 (本文档 2.3 方案B)
- ✅ 创建开发快捷入口 (本文档 2.4 方案3)

**Day 3-5**: Phase 3 US1 + Phase 4 US3 (MVP)
- ✅ 完成 T018-T054 (探究实验流程)
- ✅ 使用 `/dev-module-selector` 进行测试

**Day 6-7**: Phase 5 US2
- ✅ 完成 T055-T073 (问卷调查)
- ✅ MVP 验收测试

### 第2周: 后端对接 + 完善

**Day 8-9**: Phase 6 US4
- ✅ 完成 T074-T090 (数据记录和提交)
- ✅ 与后端协调 URL 和 API 细节

**Day 10-11**: Phase 7 Polish
- ✅ 完成 T091-T112 (优化和测试)
- ✅ 后端联调测试

**Day 12**: 最终验收
- ✅ 完整流程端到端测试
- ✅ 性能基准测试
- ✅ 准备上线

---

## 六、总结

### ✅ 任务分解审查结论

**整体评估**: **合格** - 任务粒度合理,依赖关系清晰,可执行性强

**需要优化的点**:
1. 少数复杂页面 (T028, T045) 可进一步细分
2. 新增3个缺失任务 (T113-T115)
3. 明确 Phase 2 的时间缓冲 (预留2-3天)

### ✅ 登录路由问题解决方案

**推荐 URL**: `/grade-7-tracking`

**短期方案**: Mock 登录 + 开发快捷入口 (立即可用)

**长期方案**: 后端配置 `module_url` + 前端 `config.js` 对齐 (需协调)

**手工测试**: 使用 `DevModuleSelector` 页面快速启动模块

### 📋 后续 TODO

1. [ ] 与后端团队开会,确认 URL 路径和 API 契约
2. [ ] 实施短期方案 (Mock 登录 + 开发快捷入口)
3. [ ] 开始 Phase 1-2 开发 (T001-T017)
4. [ ] 每周与后端同步进度,准备对接

---

**文档版本**: 1.0.0
**创建日期**: 2025-10-14
**下次更新**: 后端协调完成后更新 URL 路径
