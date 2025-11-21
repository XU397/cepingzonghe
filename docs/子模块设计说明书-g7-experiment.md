# 子模块设计说明书示例：g7-experiment（7年级蒸馒头-交互）

> 本文是基于《子模块设计说明书模板》的 **完整示例**，对应现有实现 `g7-experiment`，可作为后续子模块设计说明书的参考范本。  
> 实际实现文件请以当前仓库代码为准（特别是 `src/shared/types/flow.ts` 与 `src/submodules/g7-experiment/*`）。

---

## 1. 基本信息（Basic Info）[必填]

- **子模块名称（中文）**  
  - `7年级蒸馒头-交互实验`

- **子模块标识 `submoduleId`（唯一，kebab-case）**  
  - `g7-experiment`
  - 说明：  
    - 与管理后台子模块注册表、后端 FlowDefinition.steps[].submoduleId 完全一致；  
    - 对应业务模块：七年级蒸馒头的“实验部分”（P02–P19）。

- **显示名称 `displayName`**  
  - `7年级蒸馒头-交互`

- **版本号 `version`**  
  - 当前实现：`1.0.0`

- **适用年级 / 学科 / 场景**  
  - 年级：七年级  
  - 学科：科学  
  - 场景：蒸馒头实验任务（主任务交互部分）

- **业务目标（简要描述）**  
  - 通过模拟蒸馒头的科学探究过程，评估学生在以下方面的能力：  
    - 阅读与理解实验材料；  
    - 提出合理假设；  
    - 设计实验方案；  
    - 在仿真实验中操作、观察并记录结果；  
    - 对方案优劣进行分析与选择。

- **所属 Flow 类型**  
  - 类型：`标准 Flow 步骤`（实验部分）  
  - 典型 Flow 组合：`g7-experiment` → `g7-questionnaire`，即“实验 + 问卷”两步。

---

## 2. 运行环境与全局约束（Runtime & Global Constraints）[必填]

- **运行容器**  
  - 运行于统一页面框架：  
    - `AssessmentPageFrame`：负责导航条、计时器、主体内容区域、底部“下一页”按钮、错误托盘；  
    - `LeftStepperNav`：显示当前 Flow step 的进度（步数）。  
  - 本子模块 **不自带** 全局导航、计时器或错误托盘，仅在主体区域渲染业务内容（通过包装 `Grade7Wrapper`）。

- **技术栈约束**  
  - React 18 + Vite 4（由项目统一配置）；  
  - 语言：当前实现使用 JavaScript（JSX），未来新增子模块可采用 TypeScript；  
  - 代码风格：遵守本仓库 ESLint + Prettier 规则。

- **禁止直接操作的能力（必须通过统一封装）**  
  - 不直接操作浏览器路由或 URL（导航交由 Flow 容器）；  
  - 不直接操作 `localStorage` 任意 key（计时器与进度使用统一服务）；  
  - 不自行处理 401 / 会话过期（交由 `handleSessionExpired`）；  
  - 不直接调用异步提交接口，而是通过 `usePageSubmission`（本模块当前提交路径仍由 `Grade7Wrapper` 内部兼容逻辑完成，将逐步迁移）。

- **支持环境假设**  
  - FlowModule 会提供：  
    - `userContext`（内含 `examNo`、`batchCode` 等）；  
    - `initialPageId`（经 `getInitialPage(modulePageNum)` 计算）；  
    - `flowContext`（包含 `flowId`、`stepIndex`、`submoduleId`、`onComplete`、`onTimeout` 等）；  
  - 全局 TimerService 与提交基础设施已就绪（参见 `src/context/AppContext.jsx`、`src/shared/services/submission/*`）。

---

## 3. CMI 接口定义与导出规范（CMI Definition）[必填]

> 说明：本节描述 g7-experiment 的 CMI 实际实现情况，并将其映射到模板中定义的抽象接口。

### 3.1 实际导出与类型对应关系

- **类型定义位置**  
  - `src/shared/types/flow.ts`  
    - `SubmoduleDefinition`：子模块接口定义；  
    - `SubmoduleProps`：`Component` 组件 props 定义。

- **实际导出文件路径（必须写在说明书中）**  
  - `src/submodules/g7-experiment/index.jsx`
  - 含义：**这个文件负责导出本子模块的 CMI 定义对象**，供 `SubmoduleRegistry` 动态导入与注册。

- **导出对象名称（必须写在说明书中）**  
  - `G7ExperimentSubmodule`  
  - 对应代码示例：  
    ```js
    // src/submodules/g7-experiment/index.jsx
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
      onInitialize: () => { ... },
      onDestroy: () => { ... },
    };
    ```
  - `SubmoduleRegistry` 对应注册位置：`src/submodules/registry.ts`  
    ```ts
    const { G7ExperimentSubmodule } = await import('./g7-experiment');
    this.register(G7ExperimentSubmodule);
    ```

> 解释：“实际导出文件路径”和“导出对象名称”就是指：**哪一个源码文件**导出了**哪个名字的 SubmoduleDefinition 对象**。  
> 在设计说明书里明确这一点，方便 AI 工程师和 QA 在实现/排查时快速定位和校验，而不是去猜测路径或命名是否遵循约定。

### 3.2 与 SubmoduleDefinition 的字段对应

- `submoduleId: 'g7-experiment'`  
  - 唯一标识，与后端/管理后台保持一致。

- `displayName: '7年级蒸馒头-交互'`  
  - 用于运营展示与日志可读性。

- `version: '1.0.0'`  
  - 当前版本号。

- `Component: G7ExperimentComponent`  
  - 实现文件：`src/submodules/g7-experiment/Component.jsx`；  
  - 签名：`({ userContext, initialPageId, options, flowContext }) => ReactElement`。

- `getInitialPage: (subPageNum: string) => string`  
  - 实现文件：`src/submodules/g7-experiment/mapping.ts`  
  - 逻辑：通过共享工具 `getTargetPageIdFromPageNum` 和 `PAGE_MAPPING` 将 `subPageNum` 映射为实际页面 `pageId`。

- `getTotalSteps: () => number`  
  - 基于 `PAGE_MAPPING` 计算总页数，当前为 14 步（详见第 4 节）。

- `getNavigationMode: (pageId: string) => 'experiment' | 'questionnaire'`  
  - 当前实现：所有页都返回 `'experiment'`，因为 g7-experiment 只涵盖实验任务部分。

- `getDefaultTimers?: () => { task?: number; questionnaire?: number }`  
  - 返回：`{ task: 40 * 60 }`，即默认 40 分钟任务计时。

- `resolvePageNum?: (pageId: string) => string | null`  
  - 实现为 `getPageNumByPageId`，用于从当前 `pageId` 反推 `modulePageNum`，便于进度同步。

- `onInitialize?: () => void` / `onDestroy?: () => void`  
  - 当前实现：仅打印日志。未来可以在此添加模块级初始化/清理逻辑（如重置计时器 scope）。

---

## 4. 页面模型与导航设计（Pages & Navigation）[必填]

### 4.1 页面列表（完整清单）

> 来源：`src/submodules/g7-experiment/mapping.ts` 中的 `PAGE_MAPPING`。

| subPageNum | pageId                                          | 类型（type）   | navigationMode | 说明（业务含义）                    |
|-----------:|-------------------------------------------------|----------------|----------------|-------------------------------------|
| 1          | `Page_01_Precautions`                           | `notice`       | `hidden`       | 注意事项页（实验前须知，导航隐藏） |
| 2          | `Page_02_Introduction`                          | `experiment`   | `experiment`   | 实验介绍                            |
| 3          | `Page_03_Dialogue_Question`                     | `experiment`   | `experiment`   | 对话形式提出问题                   |
| 4          | `Page_04_Material_Reading_Factor_Selection`     | `experiment`   | `experiment`   | 阅读材料并选择影响因素             |
| 5          | `Page_10_Hypothesis_Focus`                      | `experiment`   | `experiment`   | 聚焦假设                            |
| 6          | `Page_11_Solution_Design_Measurement_Ideas`     | `experiment`   | `experiment`   | 设计测量方案                        |
| 7          | `Page_12_Solution_Evaluation_Measurement_Critique` | `experiment` | `experiment`   | 评价测量方案                        |
| 8          | `Page_13_Transition_To_Simulation`              | `experiment`   | `experiment`   | 过渡到仿真实验                     |
| 9          | `Page_14_Simulation_Intro_Exploration`          | `experiment`   | `experiment`   | 仿真实验介绍与探索                 |
| 10         | `Page_15_Simulation_Question_1`                 | `experiment`   | `experiment`   | 仿真实验问题 1                     |
| 11         | `Page_16_Simulation_Question_2`                 | `experiment`   | `experiment`   | 仿真实验问题 2                     |
| 12         | `Page_17_Simulation_Question_3`                 | `experiment`   | `experiment`   | 仿真实验问题 3                     |
| 13         | `Page_18_Solution_Selection`                    | `experiment`   | `experiment`   | 方案选择                            |
| 14         | `Page_19_Task_Completion`                       | `experiment`   | `experiment`   | 实验任务完成页                      |

> 说明：  
> - 默认页：`PAGE_MAPPING.default = 'Page_01_Precautions'`；  
> - 当前实现所有页面都视为 `experiment` 模式，没有问卷页；  
> - 注意事项页在 UI 上仍在统一导航步数之内显示（未使用 `hidden` 模式）。

### 4.2 页码映射规则（subPageNum ↔ pageId）

- `getInitialPage(subPageNum: string): string`  
  - 实现：  
    ```ts
    export function getInitialPage(subPageNum: string): string {
      return getTargetPageIdFromPageNum(subPageNum, PAGE_MAPPING);
    }
    ```  
  - 行为：  
    - `subPageNum` 为 `'1'..'14'` 时，按表直接映射；  
    - 其它值或缺失时，回落到 `PAGE_MAPPING.default`（即 `Page_01_Precautions`）。

- 逆向映射：`resolvePageNum(pageId: string | null | undefined): string | null`  
  - 实现：  
    ```ts
    export function getPageNumByPageId(pageId: string | null | undefined): string | null {
      if (!pageId) return null;
      return getPageNumFromPageId(pageId, PAGE_MAPPING);
    }
    ```  
  - 行为：  
    - 返回与 `PAGE_MAPPING` 一致的子页码字符串（如 `'9'`）；  
    - 未找到匹配项时返回 `null`。

### 4.3 导航规则（前进/返回/跳转）

- 导航行为  
  - 由历史 `grade-7` 模块内部导航 + 统一外壳协作完成：  
    - 外壳在“下一页”点击时提交数据（逐步迁移中）；  
    - `Grade7Wrapper` 内部路由在模块内执行实际页面切换。  

- 返回上一页  
  - 当前 Flow 规范中，默认不允许通过点击左侧导航直接跳转；  
  - 如果支持“上一步”，也由外壳统一控制，本子模块不直接操控 Flow 步骤切换。

- 前置条件与阻断  
  - 原七年级模块内部存在“必答题校验”，在未完成答题时会阻断翻页；  
  - 统一规范要求将这些阻断最终映射为 `click_blocked` 等标准事件，g7-experiment 在后续迁移中会逐步对齐。

- 步数与页面关系  
  - `getTotalSteps()` 返回 14（当前页表长度），用于左侧导航步数计算；  
  - 第 1 页 `Page_01_Precautions` 的 `navigationMode = 'hidden'`，在该页会整体隐藏导航栏，从第 2 页开始显示 14 步导航；  
  - 如未来增加更多仅用于说明的“隐藏页”，应在说明书中标明其与步数的关系，并同步调整 `getTotalSteps` 或导航显示策略。

---

## 5. 计时策略（Timing Strategy）[推荐]

### 5.1 默认计时配置

- 对应 `getDefaultTimers()`：

```ts
export function getDefaultTimers(): { task?: number; questionnaire?: number } {
  return {
    task: 40 * 60, // 40 分钟
  };
}
```

- 说明：  
  - 主任务计时：40 分钟，涵盖整个实验流程；  
  - 问卷计时：不在本子模块范围内（问卷在 `g7-questionnaire` 模块中实现）；  
  - 注意事项页：复用任务计时器（未单独使用 notice 计时）。

### 5.2 Flow 覆盖与优先级

- FlowStep.overrides：  
  - 类型：`overrides?: { timers?: { task?: number; questionnaire?: number } }`；  
  - 约定：如定义了 `overrides.timers.task`，则 Flow 配置优先于子模块默认的 40 分钟；  
  - SubmoduleProps.options：  
    - `options?.timers` 与 `FlowStep.overrides.timers` 对应，组件可根据 `options.timers.task` 动态调整计时器启动时长。

### 5.3 到期行为

- 任务计时到期：  
  - 由 TimerService（task 计时）统一触发超时回调；  
  - g7-experiment 子模块在 `Component.jsx` 中通过 `isTimeUp` 和 `handleTimeout()` 间接接收超时信号，并调用 `flowContext.onTimeout()`：  
    ```js
    useEffect(() => {
      if (isTimeUp) {
        handleTimeout();
      }
    }, [handleTimeout, isTimeUp]);
    ```  
  - Flow 容器随后可进入过渡页或根据策略结束该 step。

---

## 6. 数据提交与事件设计（Data & Events）[必填]

> g7-experiment 的提交路径目前仍依赖历史 `grade-7` 模块内部逻辑，正在迁移到统一的 `usePageSubmission`。本节描述目标规范和本模块需要遵守的约束。

### 6.1 数据格式与工具

- 目标：全部提交最终收敛到 `createMarkObject/validateMarkObject` 所定义的格式。  
- 对于 g7-experiment：  
  - 现状：`Grade7Wrapper` 内部包含历史数据上报逻辑，已在迁移过程中对齐 `pageNumber/pageDesc/operationList/answerList`；  
  - 目标：  
    - 所有页面提交均通过统一 Hook `usePageSubmission` 构造 MarkObject 后调用 `saveHcMark`；  
    - 由 `enhancePageDesc` 注入 `[flowId/submoduleId/stepIndex]` 前缀；  
    - `flow_context` 由 Flow 容器统一注入（见第 12 节）。

### 6.2 事件类型与命名规范（目标形态）

- g7-experiment 在迁移完成后应至少包含以下事件：

| 事件名          | 触发时机                               | 备注                                 |
|-----------------|----------------------------------------|--------------------------------------|
| `page_enter`    | 每个页面首次渲染时                     | 记录 pageId 与时间                   |
| `page_exit`     | 离开页面（提交成功 / 导航前）          | 与 `page_enter` 成对出现             |
| `change`        | 学生修改答案                           | 统一表示答题交互                     |
| `click`         | 点击普通按钮（非阻断）                 | 如帮助、查看提示                     |
| `click_blocked` | 点击“下一页/提交”但校验未通过         | 必须包含阻断原因（未答完等）        |
| `auto_submit`   | 计时器到期触发自动提交（如适用）       | 可选，便于排查超时行为               |

### 6.3 提交时机与失败处理（目标形态）

- 提交触发点（统一规则）：  
  - 点击“下一页/提交”时：  
    - 收集当前页全部答案 → 构造 MarkObject → `usePageSubmission.submit()`；  
    - 成功后允许导航到下一页。  
  - 计时器到期自动提交：  
    - 对应页尽可能补齐答案（未答填 `"超时未回答"`）→ 提交 → 进入完成/过渡逻辑。

- 提交失败：  
  - 网络/服务端错误：显示统一错误托盘消息，阻断导航，可重试；  
  - 401/会话过期：由 `handleSessionExpired` 统一处理，子模块不自定跳转。

---

## 7. Flow 集成与进度恢复（Flow Integration）[必填]

- **从进度到页面的映射**  
  - FlowProgress：`{ stepIndex, modulePageNum }`；  
  - FlowModule：  
    - 调用 `submoduleDefinition.getInitialPage(modulePageNum)` → `initialPageId`；  
    - 渲染 `Component({ userContext, initialPageId, options, flowContext })`。

- **进度回写**  
  - g7-experiment 在 `Component.jsx` 中使用 `useAppContext` 的 `currentPageId`，结合 `getPageNumByPageId` 将页面变化映射为 `modulePageNum`：  
    ```js
    const handlePageChange = useCallback((pageId) => {
      if (!flowContext?.updateModuleProgress || !pageId) return;
      const subPageNum = getPageNumByPageId(pageId);
      if (!subPageNum || lastProgressRef.current === subPageNum) return;
      lastProgressRef.current = subPageNum;
      flowContext.updateModuleProgress(subPageNum);
    }, [flowContext]);
    ```  
  - Flow 容器随后可调用进度同步 API（如 `/api/progress`），更新服务器端 `modulePageNum`。

- **完成判定与过渡**  
  - 在 `Component.jsx` 中通过 `isTaskFinished` 和页面 ID 组合确定“任务完成”：  
    ```js
    useEffect(() => {
      if (isTaskFinished || currentPageId === 'Page_19_Task_Completion') {
        handleComplete();
      }
    }, [currentPageId, handleComplete, isTaskFinished]);
    ```  
  - `handleComplete` 确保只调用一次 `flowContext.onComplete()`，Flow 容器据此进入过渡页并推进到下一个 step。

- **超时处理**  
  - 见第 5.3：`isTimeUp` → `flowContext.onTimeout()`。

---

## 8. 本地存储与状态管理（Local State & Persistence）[推荐]

- **状态管理方式**  
  - 依赖现有 `Grade7Wrapper` 与 `AppContext`，未在 g7-experiment 内新建 Context；  
  - 答案状态与计时器状态仍由历史模块与 TimerService 维护。

- **可持久化状态**  
  - 计时器：使用 TimerService 的 `module.grade-7.task` scope；  
  - 进度：通过 FlowStorageKeys（`flow.<id>.modulePageNum`）记录当前页码。

- **刷新恢复策略**  
  - 学生刷新浏览器后：  
    - 登录接口返回 `url: '/flow/<flowId>'` 与 `progress`；  
    - FlowModule 使用 `stepIndex` 与 `modulePageNum` 恢复到 g7-experiment 的当前页面。

---

## 9. 错误处理与边界情况（Error Handling & Edge Cases）[必填]

- **非法页码 / 配置错误**  
  - `subPageNum` 不在 `'1'..'14'` 时，`getInitialPage` 回退至默认页 `Page_01_Precautions`；  
  - `pageId` 找不到映射时，`getPageNumByPageId` 返回 `null`，不更新模块进度。

- **Flow 定义异常**  
  - 若 FlowDefinition 中的 `submoduleId` 不等于 `'g7-experiment'`，则本子模块不会被加载，交由 Flow 容器处理。

- **401 / 会话过期**  
  - 提交时发生 401 由统一 `handleSessionExpired` 处理，本子模块不直接触达该逻辑。

- **网络波动**  
  - 依赖 `usePageSubmission` 的重试与错误提示（迁移完成后）；  
  - 当前阶段由历史模块提交逻辑处理，保持行为兼容。

---

## 10. 视觉与交互规范（UI & UX Constraints）[必填]

- **统一部分（不可覆盖）**  
  - 左侧导航与计时器由 `AssessmentPageFrame` 负责；  
  - Flow 级别的错误托盘、超时跳转逻辑由上层统筹。

- **子模块可自定义部分**  
  - 通过 `Grade7Wrapper` 渲染的页面内容（已有历史实现）；  
  - 页面内控件样式和交互逻辑按原七年级视觉规范保持不变。

- **关键交互约束**  
  - 本子模块不自行创建 Flow 级“下一步”按钮；  
  - 必须通过外壳 / Flow 容器协同完成 step 切换（即通过 `flowContext.onComplete()` 与页面内部导航而非直接跳转 Flow URL）。

---

## 11. 配置项与扩展性（Options & Extensibility）[可选]

- 当前实现：  
  - `SubmoduleProps.options` 只使用 `options.timers`（由 FlowStep.overrides.timers 提供）；  
  - 未定义 variant 或 practice 模式相关配置。

- 未来可扩展方向：  
  - `options.variant`：不同版本题目集（如 A/B 版实验）；  
  - `options.enablePractice`：是否开启练习模式（不写入正式 Mark 数据）。  
  - 扩展前需同步更新 `SubmoduleProps.options` 类型，并在说明书中补充字段说明。

---

## 12. 日志与埋点要求（Logging & Telemetry）[推荐]

- **flow_context 埋点（Flow 级）**  
  - 由 Flow 容器 + `usePageSubmission` 统一注入：  
    - 每个 step 的首个页面进入时，在 `operationList` 中添加一条 `eventType = 'flow_context'` 的记录；  
    - g7-experiment 子模块不自行添加 `flow_context` 事件。

- **模块级业务埋点（可选）**  
  - 如需额外统计“模块进入/完成”等业务事件，可使用自定义 `eventType`，例如：  
    - `module_enter_business`：进入 g7-experiment 时上报一次；  
    - `module_complete_business`：任务完成时上报一次。  
  - 字段中应包含：`flowId`、`submoduleId`、`stepIndex`、`pageNumber` 等。

---

## 13. 性能与安全要求（Performance & Safety）[推荐]

- 性能目标：  
  - 由于页面逻辑沿用历史实现，本子模块不额外引入大型资源；  
  - 需要保证包装器和 Flow 容器增加的逻辑不会显著增加首屏时间（实践中已经通过统一平台验证）。

- 安全与隐私：  
  - 不在本地存储学生姓名等敏感信息（交由统一 AppContext 管理）；  
  - 所有提交均发往统一 API 域，不与第三方域通信。

---

## 14. 验收标准与测试清单（Acceptance & Test Plan）[必填]

1. **正常完成流程**  
   - 登录后进入绑定了 g7-experiment 的 Flow；  
   - 完成各实验页面并进入 `Page_19_Task_Completion`；  
   - 验证：Flow 自动进入下一 step（通常为 g7-questionnaire）；提交数据格式正确。

2. **中途刷新恢复**  
   - 在仿真实验中（如 `Page_15`）刷新页面；  
   - 验证：通过 `stepIndex` + `modulePageNum` 恢复到正确页面。

3. **计时器到期**  
   - 将任务时间设置为较短值（测试环境），等待超时；  
   - 验证：`isTimeUp` 变为 true，触发 `flowContext.onTimeout()`，Flow 行为符合规范。

4. **网络错误与重试**  
   - 在提交路径上模拟错误（迁移到 `usePageSubmission` 后测试）；  
   - 验证错误提示与重试机制。

5. **Flow 级上下文埋点**  
   - 首次进入 g7-experiment 时，在一次提交的数据中检查 `operationList`；  
   - 验证存在一条 `eventType = 'flow_context'` 的记录（由 Flow 容器注入），子模块自身事件未覆盖或损坏该记录。

---

## 15. 代码与文档交付物清单（Deliverables）[必填]

- 代码：  
  - `src/submodules/g7-experiment/index.jsx`：导出 `G7ExperimentSubmodule`；  
  - `src/submodules/g7-experiment/Component.jsx`：包装现有 grade-7 模块；  
  - `src/submodules/g7-experiment/mapping.ts`：页码映射实现；  
  - 其他依赖文件：`src/shared/utils/pageMapping.ts`、`src/submodules/registry.ts`。

- 文档：  
  - 本说明书 `docs/子模块设计说明书-g7-experiment.md`；  
  - 若有补充方案（例如将提交路径完全迁移到 `usePageSubmission`），可在 `openspec/changes/...` 中追加变更说明。
