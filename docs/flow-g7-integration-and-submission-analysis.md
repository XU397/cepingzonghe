# Flow 集成与 7 年级蒸馒头数据提交流程分析

> 背景：目前通过 Flow 流程运行“7 年级蒸馒头”任务时，后端只收到部分页面（仅 page 1、2、3、4、10）的提交记录，其余页面未按预期落库。下面基于 OpenSpec 规范与现有实现，对登录 → Flow 子模块恢复 → 页面提交链路进行梳理，并分析从 3 个交互入口演进到 5 个子模块后可能出现的问题与改造建议。

---

## 1. 登录阶段：后端如何指示前端进入 Flow 以及定位子模块页面

本节回答：**“登录的时候，后端给到哪些数据，告知交互前端跳转到 Flow 的哪个子模块的哪一页？”**

### 1.1 登录接口返回的数据结构

代码参考：`src/shared/services/apiService.js:61`、`src/context/AppContext.jsx:1280` 与 OpenSpec `openspec/specs/assessment-core/spec.md`。

登录成功后，后端返回形如：

```jsonc
{
  "code": 200,
  "msg": "成功",
  "obj": {
    "batchCode": "批次号",
    "examNo": "学生考号",
    "pageNum": "页面编号（字符串）",
    "url": "/seven-grade" 或 "/flow/test-flow-1",
    "studentName": "学生姓名",
    "schoolName": "学校名称",
    // 其他字段：schoolCode、pwd 等
  }
}
```

前端在 `loginUser` 或 `mockLogin` 成功后，将 `response.obj` 传入 `handleLoginSuccess(userData)`：

- `batchCode` / `examNo` → 存入 `AppContext` 状态与 `localStorage`，作为后续所有提交的用户上下文。
- `url` → 作为“模块入口 URL”：
  - 若是传统模块，如 `/seven-grade`，走 **ModuleRouter → 模块系统**；
  - 若是 Flow 流程，如 `/flow/test-flow-1`，则走 **FlowModule + FlowOrchestrator**。
- `pageNum` → 作为“后端建议恢复页码”：
  - 对传统模块：由对应模块的 `getInitialPage(pageNum)` 解析为内部 `pageId`；
  - 对 Flow：当前实现主要依赖 **Flow 后端的 Progress**，`pageNum` 更多用于兼容/回退（也可支持复合页码 `M<stepIndex>:<subPageNum>`，由 `parseCompositePageNum` 解析）。

### 1.2 传统模块路径：ModuleRouter 直接恢复到模块页

规范参考：`openspec/specs/routing/spec.md`、`openspec/specs/assessment-core/spec.md`。

当 `url` 为非 Flow（如 `/seven-grade`）时：

1. `AppContext.handleLoginSuccess` 写入：
   - `moduleUrl = userData.url`；
   - `pageNum = userData.pageNum`；
   - 并持久化到 `STORAGE_KEYS.CORE_MODULE_URL` 与 `STORAGE_KEYS.CORE_PAGE_NUM`。
2. `App.jsx` 根据 `moduleUrl` / `isAuthenticated` 构造：
   - `globalContext`（包含当前状态与提交能力）；
   - `authInfo = { url, pageNum, examNo, batchCode }`。
3. `ModuleRouter` 收到 `globalContext` 与 `authInfo` 后：
   - 使用 `ModuleRegistry.getByUrl(url)` 获取模块定义；
   - 调用模块的 `getInitialPage(pageNum)` 得到内部 `pageId`；
   - 渲染模块，并将 `pageId` 作为初始页面。

这是 Assessment Core 规范中 **“登录后按后端指示进入对应模块与页面”** 的传统路径。

### 1.3 Flow 路径：登录只给 Flow 入口，子模块及页码由 Flow 后端 Progress 决定

当 `url` 为 Flow 入口（例如 `/flow/test-flow-1`）时：

1. 登录成功后，`AppContext.handleLoginSuccess` 同样写入：
   - `moduleUrl = '/flow/test-flow-1'`；
   - `batchCode` / `examNo` / `pageNum`。
2. `App.jsx` 根据 `moduleUrl` 构造 `globalContext` / `authInfo`；
3. `ModuleRouter` 检测到 URL 符合 `FLOW_URL_PATTERN = /^\/flow\/.+/`：
   - 调用 `delegateFlowNavigation(moduleContext)`；
   - 再次通过 `resolveModuleRoute({ url, pageNum })` 找到 `FlowModule` 定义（URL `/flow/:flowId`）；
   - 计算 `initialPageId`（目前 FlowModule 的 `getInitialPage` 返回 `null`，实际恢复逻辑在 Orchestrator）；
   - `navigate(moduleContext.url, { state: { userContext: serializableContext, initialPageId }})`，进入 React Router 的 `/flow/:flowId` 路由。
4. `AppShell` 的 `FlowRoute` 读取：
   - `flowId`（路由参数），例如 `test-flow-1`；
   - `routeState.userContext`（经序列化的 `{ batchCode, examNo, url, pageNum }` 等）。
5. `FlowModuleInner`：
   - 恢复出 `effectiveUserContext`（通过 `createModuleUserContext` 合并 `AppContext` 与 `routeState.userContext`）；
   - 构造 `FlowOrchestrator(flowId, examNo, batchCode)`。
6. **关键：FlowOrchestrator 通过后端 Progress 定位子模块与页码**：
   - `GET /stu/api/flows/{flowId}` → 返回 `FlowDefinition`（以及可选 `progress`）；
   - 若未带 `progress`，则再 `GET /stu/api/flows/{flowId}/progress/{examNo}?batchCode={batchCode}`；
   - 其中 `FlowDefinition` 满足 `openspec/specs/flow/spec.md`：
     ```ts
     type FlowDefinition = {
       flowId, name, url, version, status,
       steps: Array<{ submoduleId, displayName?, transitionPage?, overrides? }>
     }
     ```
   - `FlowProgress` 满足：
     ```ts
     type FlowProgress = {
       stepIndex: number,
       modulePageNum: string | null, // 可选复合页码 M<stepIndex>:<subPageNum>
       completed?: boolean
     }
     ```
   - `FlowOrchestrator.normalizeProgress` 会解析复合页码 `M<stepIndex>:<subPageNum>`：
     - 若 `modulePageNum = 'M1:10'`，则 `stepIndex=1`，子模块内部页码为 `10`；
   - `FlowOrchestrator.resolve(definition, progress)`：
     - 找到当前的 `FlowStep`（即哪一个 `submoduleId`，如 `g7-experiment`）；
     - 调用该子模块的 `getInitialPage(modulePageNum)` 计算 `initialPageId`。

**结论（Q1）：**

- 登录阶段，后端主要通过 **`url` + `pageNum`** 指示前端进入哪个“顶层模块”（或 Flow）；
- 对于 Flow 流程，**真正决定当前子模块与页码的是 Flow 后端提供的 `FlowDefinition` + `FlowProgress`**：
  - `flowId` 来自登录返回的 `url`（`/flow/<flowId>`）；
  - `stepIndex` + `modulePageNum` 来自 Flow Progress 接口，而不是登录响应本身；
  - 前端通过 `FlowOrchestrator.resolve` 把它映射为具体的子模块（例如 `g7-experiment`）和具体页面 ID。

---

## 2. 页面提交：交互端在每一页提交时传哪些数据、如何传

本节回答：**“交互端在每一个页面提交的时候要传递给后端哪些数据？传递的方法是怎样的？”**

### 2.1 提交数据结构：MarkObject 与 Operation / Answer

规范参考：

- `openspec/specs/data-format/spec.md`（Data Format Spec）；
- `openspec/specs/submission/spec.md`（Submission Spec）；
- `openspec/specs/assessment-core/spec.md`（Assessment Core）。

统一的数据结构为 **`MarkObject`**：

```ts
type Operation = {
  code: number;               // 从 1 开始递增
  targetElement: string;
  eventType: string;          // 事件类型枚举
  value: string | object;     // 普通为字符串；flow_context 等允许对象
  time: string;               // "YYYY-MM-DD HH:mm:ss"
  pageId?: string;            // 可选，方便排错
};

type Answer = {
  code: number;               // 从 1 开始递增
  targetElement: string;
  value: string;
};

type MarkObject = {
  pageNumber: string;         // 可支持复合页码，如 "M2:11" 或 "2.11"
  pageDesc: string;
  operationList: Operation[];
  answerList: Answer[];
  beginTime: string;          // "YYYY-MM-DD HH:mm:ss"
  endTime: string;            // "YYYY-MM-DD HH:mm:ss"
  imgList: any[];
};
```

事件类型集合（`eventType`）必须满足 Data Format Spec 与 Submission Spec 中的约束，核心包括：

- `page_enter`、`page_exit`、`click`、`input`、`input_blur`、`radio_select`、`checkbox_check`、`checkbox_uncheck`、`modal_open`、`modal_close`、`view_material`、`timer_start`、`timer_stop`、问卷与实验补充事件等；
- 为 Flow 与提交链路新增的：`flow_context`、`page_submit_success`、`page_submit_failed`。

其中 `flow_context` 的 `value` 为对象：

```ts
{
  flowId: string | null;
  submoduleId: string | null;
  stepIndex: number | null;
  pageId: string | null;
}
```

### 2.2 前端统一提交 Hook：usePageSubmission

代码参考：`src/shared/services/submission/usePageSubmission.js`。

无论是传统模块还是 Flow 子模块，**推荐的唯一提交入口**是 `usePageSubmission`，其职责：

1. 通过 `getUserContext` 或 `userContext` 获取：
   - `batchCode`（批次号）
   - `examNo`（考号）
2. 通过 `buildMark` 构建当前页面的 `MarkObject`：
   - 现有实现中，多数模块通过 `AppContext.preparePageSubmissionData()` 或模块自己的 `prepareMark` 来生成；
3. 通过 `getFlowContext`（如果存在）获取当前 Flow 上下文：
   - `flowId`, `submoduleId`, `stepIndex`, `pageId`；
   - 在提交前自动注入/补全一条 `flow_context` 操作，并在 `pageDesc` 前加上 `[flowId/submoduleId/stepIndex]` 前缀，方便后端观测与排查；
4. 对 `operationList` / `answerList` 做统一规范化：
   - 确保 `code` 从 1 连续递增；
   - 将普通事件的 `value` 统一为字符串（Flow 事件保留对象）；
   - 补全缺失的 `time` 字段为本地时间；
5. 调用 `validateMarkObject(markCandidate)` 做最小校验：
   - 非空字段检查；
   - 事件类型属于标准集合；
   - `code` 连续递增等；
6. 生成提交载荷：
   - 使用 `createSubmissionPayload(context, normalizedMark)` 得到：
     ```ts
     {
       batchCode: string;
       examNo: string;
       mark: MarkObject;
     }
     ```
7. 执行带重试的提交：
   - 默认通过 `submitImpl = submitPageMarkData`，即旧的 `saveHcMark` 接口；
   - 按 1s、2s、4s 的退避策略重试 3 次；
   - 401 / 会话过期时调用统一的 `handleSessionExpired`，终止重试并引导回登录；
   - 最终成功时返回 `true`，失败时返回 `false` 并设置 `lastError`。

### 2.3 实际 HTTP 提交：saveHcMark 接口与 FormData

代码参考：`src/shared/services/apiService.js:1-118`、`openspec/specs/api-client/spec.md`。

`submitPageMarkData(payload)` 负责把上述 `payload` 发送给后端：

1. 构造 URL：
   - `const apiUrl = buildApiUrl('/saveHcMark');`
   - 在开发环境通过 Vite 代理转发到后端（`/stu/saveHcMark`）。
2. 使用 `FormData`：
   - `formData.append('batchCode', payload.batchCode);`
   - `formData.append('examNo', payload.examNo);`
   - `formData.append('mark', JSON.stringify(payload.mark));`
3. 使用统一配置 `getFetchOptions` 生成请求选项，删除手动设置的 `Content-Type`，让浏览器自动处理 `multipart/form-data` 边界；
4. 解析响应：
   - HTTP 非 2xx → 抛出带状态码的错误；
   - JSON 解析成功但 `code !== 200`：
     - 若 `code === 401` → 标记 `isSessionExpired = true` 并抛出；
     - 其他业务错误 → 抛出 `Error('业务错误 code: msg')`。

**因此，每一次页面提交到后端的实际载荷包含：**

- 顶层：`batchCode`、`examNo`；
- JSON 字段 `mark`：完整的 `MarkObject`，包含：
  - `pageNumber` / `pageDesc`；
  - `operationList`（带 `page_enter` / `page_exit` / `flow_context` / `page_submit_*` 和其他交互事件）；
  - `answerList`（问卷或开放题答案）；
  - `beginTime` / `endTime`（本地时间字符串）；
  - `imgList`（通常为空数组）。

### 2.4 7 年级蒸馒头在现架构下的提交链路

“7 年级蒸馒头”原始模块与当前 Flow 集成状态大致为：

- 原始实现：
  - 使用 `AppContext` 管理状态与 `currentPageData`；
  - 每个页面在点击“下一页”时调用 `submitPageData()`：
    - `preparePageSubmissionData()` 从 `currentPageData` 构建 `MarkObject`；
    - 通过 `usePageSubmission` 的 `submit` 发送到后端；
  - 导航逻辑统一在 `navigateToPage(nextPageId)` 中做“提交 + 切页”。

- Flow 集成后：
  - `src/submodules/g7-experiment/Component.jsx` 与 `src/modules/grade-7/wrapper.jsx` 把原始 7 年级模块包装成 **Flow 子模块**；
  - `Grade7Wrapper` 使用 `AssessmentPageFrame`：
    - `submission={submissionConfig}` 中再次配置了 `usePageSubmission`；
    - Frame 内部默认会在“下一页”按钮时调用 `submit()`；
  - 为避免 UI 重复，“Flow 外壳”隐藏了 Frame 的下一页按钮（`hideNextButton`），仍由原始 7 年级页面的按钮驱动导航与提交（调用 `submitPageData`）。

当前症状“只有 page 1、2、3、4、10 有记录”的根本原因仍需进一步调试，但从架构角度可以确认：

- **提交链路本身是统一的（都走 `usePageSubmission` + `saveHcMark`），问题更可能出在“哪些页面实际触发了提交”与“Flow 场景下是否存在双重或缺失触发”。**

---

## 3. 从 3 个交互模块到 5 个 Flow 子模块的改造分析

本节回答：**“原来的三个交互端，现在架构调整后改成 5 个子模块（四年级交互、七年级交互、七年级问卷、七年级追踪交互、七年级追踪问卷），这些原来的模块进行改造时，存在什么问题，需要如何解决？”**

### 3.1 原始架构：三个交互端

原先平台主要有三个完整的“交互入口模块”（每个模块内部自带登录后入口、导航与数据提交）：

1. **四年级交互模块**（火车票规划任务）；
2. **七年级交互模块**（蒸馒头实验 + 问卷合在一个大模块中）；
3. **七年级追踪模块**（追踪实验 + 问卷合在一起，带自己的一套 context 与 data logger）。

它们的共同特征：

- 各自维护页面路由（PageRouter）与导航按钮；
- 各自管理计时（或缺省）；
- 各自通过 `submitPageData` / `submitPageMarkData` 把数据提交到 `/saveHcMark`，但使用的工具与格式略有差异；
- 登录后由后端直接返回 `/seven-grade` 或 `/four-grade` 等 URL 作为入口。

### 3.2 新架构：五个 Flow 子模块

结合 OpenSpec 的 Flow 与 Integration 规范后，整体演进为：

1. **四年级交互 → 子模块 `g4-experiment`**
2. **七年级交互（实验） → 子模块 `g7-experiment`**
3. **七年级问卷 → 子模块 `g7-questionnaire`**
4. **七年级追踪实验 → 子模块 `g7-tracking-experiment`**
5. **七年级追踪问卷 → 子模块 `g7-tracking-questionnaire`**

这些子模块的共同点：

- 统一在 `src/submodules/<id>/` 下提供 CMI 包装器（`Component`, `getInitialPage`, `getTotalSteps` 等）；
- 由 `FlowOrchestrator` 根据 `FlowDefinition.steps` 动态加载；
- 由 `FlowModule` 负责在 React Router 中挂载，并通过 `FlowContext` 提供：
  - `flowId`, `submoduleId`, `stepIndex`, `modulePageNum`；
  - `onComplete`, `onTimeout`, `updateModuleProgress` 等。

### 3.3 改造中暴露的关键问题

基于 OpenSpec 的 Integration / Flow / Submission 规范与当前代码，主要存在以下问题与风险：

#### 问题 1：双重提交与提交责任不清

- 原模块中，页面本身已经在“下一页”按钮中直接调用 `submitPageData()`；
- 新包装器（例如 `Grade7Wrapper`）又在 `AssessmentPageFrame` 中配置了 `submission={...}`，即接入了 `usePageSubmission`；
- 为避免双按钮，目前是 **隐藏 Frame 的“下一页”按钮**，继续使用老按钮（页面级按钮），但 Frame 里的 `usePageSubmission` 仍然存在；
- 结果：
  - Flow 场景下，提交行为既有可能来自 `AppContext.submitPageData`，又可能（未来）来自 Frame；
  - 对某些页面，如果导航逻辑改为 `navigateToPage(nextPageId, { skipSubmit: true })` 或由 Flow Bridge 拦截，可能出现“既没有触发 Frame 提交，也没有触发老的 `submitPageData`”的情况，从而出现当前“部分页面没有落库”的症状。

**建议：**

- 对每个子模块明确“谁负责调用 `submit()`”：
  - Flow 集成场景下，应优先以 `AssessmentPageFrame` 为唯一的提交触发点；
  - 页面组件只负责收集数据（`logOperation` / `collectAnswer`）和触发“下一页”意图，不直接调用 `submitPageData`；
  - 可以通过给 Frame 传入 `onNext`，在里面调用 `navigateToPage(nextPageId, { skipSubmit: true })`，从而保证“先统一提交，再导航”。

#### 问题 2：导航与提交耦合在 AppContext，Flow 场景下难以区分

- 现有 `navigateToPage` 内部强耦合了“提交当前页 + 切换页面”的逻辑，并且假定所有模块都经过这个函数；
- Flow 场景下，子模块被挂载在 `FlowModule` 内，Flow 本身也有一套 Progress 与 `beforeNavigate` 钩子；
- 当 Flow 与 AppContext 同时尝试管理“当前页 + 提交 + 进度”时，很容易出现：
  - Progress 被写入错误的 Flow/step；
  - 某些页面绕过 `navigateToPage` 的提交逻辑，只依赖 Flow 的 `beforeNavigate`，但现在子模块内部导航没有完全挂到 Flow 的钩子上。

**建议：**

- 为 Flow 场景单独定义一条导航链路：
  - 当存在 `flowContextRef.current` 且当前模块为 Flow 子模块时：
    - 页面“下一页”应调用一个专门的 `navigateInFlow(nextPageId)`；
    - 该函数内部通过 `AssessmentPageFrame` 的 `submit()` 完成统一提交；
    - 提交成功后，通过 `FlowAppContextBridge.beforeNavigate` 更新 FlowOrchestrator 的 `modulePageNum`；
  - 在 Flow 场景下，`AppContext.navigateToPage` 只负责更新 `currentPageId`，不再负责提交；
  - 传统模块（非 Flow）继续使用当前 `navigateToPage + submitPageData` 策略。

#### 问题 3：计时与超时行为的复用不统一

- OpenSpec 明确要求：
  - 使用统一的 `TimerService` 与 `TimerDisplay`；
  - 主任务与问卷计时在刷新后可恢复，超时时自动跳转到对应完成页；
  - Flow 子模块只应订阅必要的计时状态。
- 当前：
  - 四年级模块部分仍使用旧计时实现；
  - 七年级追踪模块有自建的 `useSessionHeartbeat` 与计时逻辑；
  - Flow 封装后，若计时逻辑仍绑定在原模块内部，可能与 Flow 级心跳与进度回写产生重复或冲突。

**建议：**

- 对每个子模块 Wrapper 明确：
  - 尽量由外层 `AssessmentPageFrame` 控制计时 UI；
  - 内部仅保留必要的业务计时或完全迁移到统一计时服务上；
  - Flow 层面的心跳与进度回写用 `useHeartbeat` 实现，子模块只暴露 `updateModuleProgress` 所需的信息。

#### 问题 4：旧数据格式与新 Flow 扩展字段的兼容性

- 后端历史上已经存量大量旧数据：
  - 没有 `flow_context` 事件；
  - `pageNumber` 仅为简单页码（1–28）；
  - `pageDesc` 不带 `[flowId/submoduleId/stepIndex]` 前缀。
- Flow 集成后：
  - 仍需保持旧分析链路可用；
  - 同时新增基于 `flow_context` 的跨模块追踪能力。

**建议：**

- 保持 `MarkObject` 基本结构不变，只通过增加 `flow_context` 事件和增强 `pageDesc` 来实现 Flow 标识；
- 确保 `usePageSubmission` 在没有 Flow 信息时不破坏旧行为（目前已符合规范：缺少 Flow 信息时仅记录日志，跳过增强）。

### 3.4 综合改造建议小结

针对**四年级交互、七年级交互、七年级问卷、七年级追踪交互、七年级追踪问卷**五个子模块，从现状平滑演进到完全符合 OpenSpec 的建议路径如下：

1. **统一提交入口**：
   - 所有子模块页面都不再直接调用 `submitPageMarkData` 或 `submitPageData`；
   - 统一通过 `AssessmentPageFrame` + `usePageSubmission` 的 `submit()` 作为单一提交入口；
   - 页面层只负责记录操作与答案，触发“下一页”意图。
2. **区分 Flow 与非 Flow 场景的导航策略**：
   - 非 Flow：保留 `navigateToPage` 内部“提交 + 切页”的旧逻辑，后续可以逐步迁移；
   - Flow：
     - 导航前先由 Frame 调用 `submit()` 完成提交；
     - 成功后通过 FlowBridge 更新 FlowOrchestrator 的 `modulePageNum` 并在必要时调用 `onComplete`；
     - `AppContext` 仅更新 `currentPageId` 和数据缓存。
3. **拆分大模块为多个子模块时，保持页面映射与数据结构不变**：
   - 子模块级别仅改变“入口路径”和“计时/导航/提交负责方”，不改变原页面的 `pageNumber` / `pageDesc` 映射；
   - 这样可以保证老报表、分析逻辑仍能理解新数据。
4. **针对当前“7 年级蒸馒头只有部分页面有数据”的问题**：
   - 排查哪些页面的“下一页”没有触发任何提交：
     - 检查是否调用了 `submitPageData`；
     - 检查在 Flow 场景下是否误用了 `skipSubmit` 或绕过了 Frame 的 `submit()`；
   - 按上述“统一提交入口”的方向重构 7 年级子模块，确保每次导航到下一页前至少有一次 `usePageSubmission.submit()` 被调用。

---

## 4. 总结

- 登录阶段：后端通过 `{ url, pageNum, batchCode, examNo, ... }` 指示前端进入哪个模块/Flow；在 Flow 场景下，真正决定当前子模块与页码的是 **FlowDefinition + FlowProgress**，由 `FlowOrchestrator` 解析。
- 页面提交：统一由 `usePageSubmission` 构建符合 Data Format Spec 的 `MarkObject`，并通过 `submitPageMarkData` 以 FormData 形式调用 `/saveHcMark`；在 Flow 场景下，额外注入 `flow_context` 事件并增强 `pageDesc`。
- 模块改造：从 3 个交互端演进到 5 个 Flow 子模块的过程中，主要风险集中在“提交责任不清、导航/提交耦合在 AppContext、计时与 Flow 进度的重复管理”；通过**收口到 AssessmentPageFrame + usePageSubmission**、区分 Flow / 非 Flow 的导航策略，可以消除“只记录部分页面”的问题，并使前后端行为完全符合 OpenSpec 流程下的统一规范。

