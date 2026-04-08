# 子模块页面构建规范流程（工作流执行手册）

> 目标落盘路径（按团队约定）：`docs/submodule-build-workflow.md`

> 目标读者：AI 开发工程师 / 工作流执行者
>
> 本文档定义“如何组织并拆分子模块页面构建任务”，以确保：页面内容交付、轨迹数据采集、答案收集、统一提交流程与 CI 守卫一次做对。
>
> **数据提交与格式规范以** `docs/submission-spec.md` **为唯一口径**；本文只补充“构建流程/拆分策略/验收方式”。

---

## 1. 核心原则（必须遵守）

- **禁止**“先把全部页面 UI 做完再统一补埋点/提交合规”。理由：现有子模块页面的 UI 交互与 `logOperation`/答案格式化/阻断校验高度共定位，后期 retrofit 返工大且容易漏。
- **推荐默认策略**：
  - **先打通底座**（mapping/Context/Frame/Submission）
  - **先做 1 个复杂页垂直样板**（UI + operations + answers + submission 一起）
  - **再按页垂直并行交付**（每页一个任务，每页都要“能提交且合规”）
- **合规是 Definition of Done 的一部分**：页面“能看”不算完成，必须“能提交且通过校验/测试”。

### 1.1 标准子模块架构蓝图（未来新子模块必须一致）

> 目标：避免“每个子模块各写一套”，把差异限制在 _pages 语义_ 与 _mapping 内容_。

- **唯一推荐模式：标准子模块模式**（参考基线：`src/submodules/g8-pv-sand-experiment/`；组织分层可参考 `src/submodules/g8-drone-imaging/`）
- **允许的例外：Legacy Wrapper 模式**（例如 `src/submodules/g7-experiment/`）
  - 仅用于“已有旧模块的薄包装迁移桥”，不作为新子模块模板；需要在子模块 README 明确标注“wrapper/bridge”。

标准目录结构（必须包含）：

```text
src/submodules/<submoduleId>/
  index.tsx|jsx           # SubmoduleDefinition
  Component.tsx|jsx       # Provider + Frame（统一接入 AssessmentPageFrame）
  mapping.ts              # 导出 SUBMODULE_MAPPING_CONFIG（单一真相源）
  context/<Name>Context.* # answers/operations/pageId/pageStartTime + 稳定 logOperation
  pages/                  # 页面组件（只做语义与 UI；不直连提交 API）
  __tests__/              # 最少：mapping 合规 + submission 快照/格式
```

职责边界（必须清晰且统一）：

- `mapping.ts`：只做“契约与静态配置”
  - 页面清单（pageId/subPageNum/title/navigationMode/stepIndex 可选）
  - 每页题目键（PAGE_QUESTIONS）
  - 题目 code/题干/选项（QUESTION_CODE_MAP/QUESTION_TEXT_MAP/QUESTION_OPTIONS_MAP）
  - `SUBMODULE_MAPPING_CONFIG` 导出（给 shared adapter/校验/测试使用）
- `context/*`：只做“状态与日志 plumbing”
  - 当前页、答案草稿、operations、pageStartTime
  - 稳定 `logOperation`（避免依赖变化导致 page_enter/page_exit 循环）
  - 页面切换时重置：operation sequence + flow_context 注入标记 + per-page operations
- `Component.tsx|jsx`（Frame 层）：只做“统一提交接线与导航流水线”
  - **必须使用** `src/shared/ui/PageFrame/AssessmentPageFrame.jsx` 作为外层容器
  - 统一 `onNext` 流水线：validate →（失败则 click_blocked）→ defaultSubmit → clearOperations → navigate/complete
  - 统一 `timerScope` 规则（Flow/Standalone 两种）
- `pages/*`：只做“页面语义与交互”
  - 通过 context actions 更新 answers/state
  - 对关键交互调用 `logOperation`
  - 不手写 pageNumber/前缀/flow_context/code/time（交给 shared + context）

禁止模式（避免未来再次分裂）：

- 禁止在页面内直接调用提交 API（包括任何直连 `/stu/saveHcMark` 或绕开 `usePageSubmission`/`AssessmentPageFrame` 的提交）
- 禁止把“全子模块状态机 + 提交接线 + pages/router”全部塞进单个超大组件（可交付但难维护，后续不许新增这种风格）
- 禁止在多个地方各自实现页码/前缀/flow_context 注入逻辑（必须收敛到 shared + context）

---

## 2. 输入物料清单（启动前必须齐）

- 页面清单：N 页的 `pageId / subPageNum / 标题(pageDesc) / 页面类型(说明/问卷/实验/计时/过渡) / 题目列表`。
- 题目与答案契约：
  - 每题的 **标准化答案键**（例如 `Q2_风速区域`）
  - `code` 编号规则（连续且唯一）
  - 完整题干文本（用于 `answerList.targetElement`）
  - 选项题的选项文本（用于格式化为 `A. 选项文本`）
- 交互事件契约（每页需要记录哪些关键事件）：点击、选择、输入（focus/change/delete/blur）、模拟实验参数变化、运行结果、计时开始/结束/超时、阻断点击等。
- 资源/素材：图片、动画、图表数据源、实验参数范围、默认值。

输出物（最终要交付的代码形态，供执行者对齐）：

- 子模块目录：`src/submodules/<submoduleId>/`
- 页面：`src/submodules/<submoduleId>/pages/*`
- 规范化映射：`src/submodules/<submoduleId>/mapping.ts`（导出 `SUBMODULE_MAPPING_CONFIG`）
- Context：稳定 `logOperation`、flowContext 同步、页面切换重置序号/注入标记
- 提交接线：`usePageSubmission`/`AssessmentPageFrame` + `buildMark` 模式（推荐）
- 测试：mapping 合规测试 + submission 快照/格式测试（见第 5/7 节）

---

## 3. 分阶段工作流（强制顺序）

### Phase 0：冻结“契约”（只做设计，不堆 UI）

目的：把后续并行冲突与返工收敛到 mapping/模板层。

- 输出一份“页面契约表”（可以直接体现在 `mapping.ts` 的结构里）：
  - `PAGE_CONFIGS`：pageId、subPageNum、title/pageDesc、type、navigationMode、stepIndex（如适用）
  - `PAGE_QUESTIONS`：每页要收集的答案键列表
  - `QUESTION_CODE_MAP / QUESTION_TEXT_MAP / ANSWER_KEY_TO_QUESTION / QUESTION_OPTIONS_MAP`
- 明确每页的“最小事件集合”与特殊事件（以 `docs/submission-spec.md` 为准）。

验收：

- `SUBMODULE_MAPPING_CONFIG` 能通过 `validateMappingConfig`（参考 `src/submodules/__tests__/mapping-config-compliance.test.ts`）。

### Phase 1：打通底座（模板化）

目的：让后续“按页交付”变成可复制套路。

- 建立并验证这些底座能力：
  - 统一 pageMeta：pageId/pageNumber/pageDesc/stepIndex/subPageNum
  - `getPagePrefix()` 与 `prefixTarget()` 规则（前缀形如 `P1.03_...`）
  - 稳定 `logOperation`（避免 useEffect 循环触发；页面切换重置序号与 flow_context 注入标记）
  - 提交接线：**统一使用** `AssessmentPageFrame` + `submission.buildMark`（除非有明确理由，避免同仓库出现多套接线风格）
  - `flow_context` 注入策略明确（优先在 Context/提交层统一处理，不在每页散落手写）

建议的“标准 onNext 流水线”（在 Frame 层统一实现，不要让每个子模块各写一套）：

```text
onNext:
  1) validatePage() -> ok?
     - NO: logOperation(click_blocked, { missing }) 并 return false
  2) defaultSubmit() -> ok?
     - NO: return false
  3) clearOperations()
  4) navigateToNextPage() 或 flowContext.onComplete()
```

验收（必须可自动执行）：

- `npm run lint:submission`
- `npm run test:submission-format`

### Phase 2：复杂页垂直样板（强推荐做 1 页）

选择标准：优先选择包含“模拟实验/图表/多输入/计时/阻断校验”的页面。

目的：尽早暴露最难的问题（事件语义、值格式化、payload 体积、时序、flow_context）。

该页 Definition of Done（DoD）：

- 页面 UI 达到可用状态（交互完成闭环）
- 对应交互事件全部记录（最小事件集合 + 关键语义事件）
- 答案收集符合规范（非空入列；选项题格式化；复杂数据 JSON 字符串）
- 提交 payload 通过校验与快照测试

验收：

- `npm run lint:submission`
- `npm run test:submission-format`
- 如该子模块已有/新增 submodule 级测试：`npm run test:submission`

### Phase 3：按页垂直并行交付（12 个任务）

拆分方式：**一个页面 = 一个任务**，且每个任务都包含 UI + 轨迹/答案 + 合规提交。

并行规则：

- mapping.ts 变更是冲突热点：指定 1 人（或 1 个 AI agent）做 mapping/契约的合并仲裁。
- 页面开发尽量只改 pages/ 与少量共享组件；减少多人同时改 Context/提交底座。

每页任务 DoD（统一口径）：

- 页面可渲染 + 交互可用
- 关键交互均有对应 `logOperation`（事件类型在白名单内）
- 页面离开/下一步必有 `next_click`（或等效）与 `page_exit`
- 阻断校验必须记录 `click_blocked`（含 missing/原因）
- 提交 payload 的 pageNumber/targetPrefix/answerList 格式全部合规
- 相关测试/快照更新后通过

建议节奏：

- 先并行交付“低风险页”（说明/静态/简单输入）验证流程稳定
- 再集中处理“高风险页”（模拟/图表/计时）

### Phase 4：全量一致性审计（最后 10% 时间做）

目的：避免“每页都合规但整体不一致”。

- 审计清单：
  - pageNumber/前缀规则全一致
  - `flow_context` 只注入一次且位置正确
  - operation code 连续、从 1 开始
  - answer code 唯一连续；题干文本完整
  - 事件语义一致（同类控件的 eventType/value 结构一致）
  - payload 体积不过大（尤其是动画/拖拽类事件）

验收：

- `npm run lint:submission`
- `npm run test:submission-format`
- `npm run test:submission`

### Phase 5（可选但强建议）：Legacy 模块 → 标准子模块迁移打法

> 适用：你已经有一个“完整的旧 HCI/监测模块”（位于 `src/modules/*`，有自己的页面路由、状态、提交与计时），现在要改造成符合本手册第 1.1 节的“标准子模块”。
>
> 目标：在不牺牲正确性与可回归性的前提下，最小化回归风险。

#### 迁移路径选择（先决策，避免半途反复）

- 路径 A：Wrapper Bridge（推荐做第一步）
  - 做法：先做一个 submodule 包装器，把旧模块“装进 Flow”，只补 flow 进度/完成/超时桥接与 getFlowContext 注入，尽量不动旧模块内部。
  - 参考：`src/submodules/g7-experiment/`、`src/submodules/g7-tracking-experiment/`、`src/submodules/g7-tracking-questionnaire/`
  - 优点：回归风险最低，能最快上线 Flow 编排；CI submission guard 可逐步施压旧模块的合规改造。
  - 代价：短期内仍存在 legacy 风格，不是最终标准形态。

- 路径 B：Full Rewrite to Standard（直接重做为标准子模块）
  - 做法：按本手册 Phase 0→4，从 mapping/Context/Frame/pages/tests 完整搭建标准子模块，把旧模块的页面语义逐页搬迁。
  - 优点：一次到位，后续维护成本最低。
  - 风险：改动面大；若缺少快照/格式测试，容易出现“最后集中修合规”的不可控尾巴。

推荐策略（最稳）：A 先落地（桥接），再 B 渐进替换（逐页垂直切片迁移）。

#### 文档可否“单靠 AI 自动迁移”的现实边界（必须知晓）

- 现有文档能很好指导：提交流程、事件枚举、前缀/页码规则、最低事件集合、mapping.ts 配置与验证。
- 但“把一个完整旧模块改造成标准子模块”仍需要**模块级盘点信息**，否则 AI 会在边界处做错误假设（路由、计时、持久化键、完成判定、页面拆分）。
- 因此迁移任务必须先补齐“模块盘点表”（见下一节），再进入 Phase 0/1。

#### 模块盘点表（迁移前必须产出，AI 也必须先填）

> 建议把这份表直接写进目标子模块的 README 或迁移 PR 描述中。

- 模块定位：模块路径（`src/modules/...`）、moduleId/url（如有）、入口组件文件
- 页面清单：页面 ID/顺序/是否有输入/是否有实验交互/是否计时
- 提交点清单：哪些页面提交、提交时机（next/blur/timeout）、是否有自动提交
- 操作埋点现状：现有 eventType 集合、是否已有 page_enter/page_exit/next_click/click_blocked
- 答案收集现状：答案键名、是否已有“完整题干文本”、选项题是否已格式化为 `A. 文本`
- 计时器：task/questionnaire 是否拆分、timerScope 规则、超时后行为（提交/跳转/完成）
- 持久化：localStorage/sessionStorage 键清单、是否跨账号污染、是否需要进入时清理
- Flow 对接：progress 恢复策略、何时 updateModuleProgress、何时 onComplete/onTimeout
- 测试现状：现有测试命令、是否已有 submission 快照/format 测试、是否可新增

#### 版本一致性提醒（防止 AI 被旧文档误导）

- 本仓库存在“历史迁移文档/规范”的版本差异：遇到冲突时，以 `docs/submission-spec.md` 的规则为准。
- 迁移执行前必须明确：pageNumber 采用当前复合页码规则（如 `1.03`）还是历史点分规则（如 `0.3`）；并确保测试/守卫口径一致。

#### Wrapper Bridge 的 DoD（必须做到）

- Flow 进度桥接：页面变化时调用 `flowContext.updateModuleProgress(subPageNum)`（仅在有效页面范围内）
- 完成桥接：到达“模块完成页/完成信号”时调用 `flowContext.onComplete()`（幂等防抖）
- 超时桥接：旧模块计时结束时调用 `flowContext.onTimeout()`（幂等防抖）
- 提交链路：旧模块所有提交仍走 shared submission（至少通过 `usePageSubmission`/shared submit impl），并能注入 `flow_context`
- 缓存隔离：识别并处理旧模块 localStorage 键（避免跨账号污染；必要时在登录/进入模块时清理）

#### Full Rewrite 的 DoD（逐页迁移时每页必须做到）

- 每迁移 1 页：按 Phase 3 的“每页任务 DoD”交付（UI + events + answers + submission + tests）
- 每迁移 2–3 页：做一次快照审计，确保 pageNumber/前缀/flow_context/事件语义没有开始分叉

#### 迁移验收的强制证据（AI 执行必须产出）

- 变更前后对比：
  - 旧模块同一页的 MarkObject 示例（截图/快照）
  - 新子模块同一页的 MarkObject 示例（快照），并通过 `npm run test:submission-format`
- 关键回归路径：登录 → 进入 Flow → 逐页 next → 完成/超时（至少覆盖一次）

---

## 4. 事件与答案的落地约定（执行者速查）

> 详规见：`docs/submission-spec.md`

- **最小事件集合（每页必须）**：`page_enter`、`page_exit`、`next_click`（或等效下一步）；阻断必须 `click_blocked`。
- **输入类**：建议至少包含 focus/change/delete/blur（或按规范最小子集）。
- **模拟/计时类**：记录参数调整、计时开始/结束/运行结果（必要时记录结果摘要，而非高频过程）。
- **answerList 与 operationList 的分工**：
  - operationList：过程（允许用题目 ID 前缀，如 `P1.05_Q2_xxx`）
  - answerList：结果（targetElement 必须是完整题干文本；value 必须是规范化展示值）

---

## 5. 快速失败（Fast Fail）机制（强建议）

页面开发过程中，做到“每完成一页就能立刻失败”：

- 本地高频运行（建议写进工作流模板）：
  - `npm run lint:submission`
  - `npm run test:submission-format`
- PR 合并前（必须）：
  - `npm run test:submission`

### 5.1 最小测试套件（新子模块必须具备）

- mapping 合规：确保 `SUBMODULE_MAPPING_CONFIG` 可通过 shared 校验
  - 参考：`src/submodules/__tests__/mapping-config-compliance.test.ts`
- submission 格式/快照：至少覆盖 2 类典型页面
  - normal（正常提交）
  - blocked（缺必填 → click_blocked）
  - timeout（如模块有计时自动提交）

---

## 6. 决策量表（遇到争议时用）

- 含模拟/动画/图表/拖拽/计时自动提交/复杂阻断校验：**必须垂直交付**（UI + 合规一起做）。
- 纯静态说明页：可先做视觉稿，但进入主分支前必须接入底座并满足最小事件集合。
- 合规负责人（懂 mapping/flow_context/前缀/测试）少于 UI 产能：采用本文推荐的“底座 + 样板页 + 按页并行”，并指定 mapping 合并仲裁人。

---

## 7. PR 审查清单（用来强制一致性）

> 目标：让“是否合规/是否一致”在 Code Review 阶段就能被判定，而不是上线后回收。

- 结构：子模块目录符合第 1.1 节蓝图；`mapping.ts` 导出 `SUBMODULE_MAPPING_CONFIG`
- 提交：所有页面都在 `AssessmentPageFrame` 内；没有自造提交链路/直连 API
- 页码与前缀：不在页面里手写 pageNumber/前缀；operations 的 targetElement 仅在需要时由 prefix 工具添加；保留元素（如 `page/next_button/flow_context`）不加前缀
- 事件：每页至少具备 `page_enter/page_exit/next_click`；阻断时记录 `click_blocked` 且包含 missing
- 答案：仅非空入列；选项题 value 已格式化为 `A. 选项文本`；复杂值为 JSON 字符串
- 测试：新增/修改页面至少更新 submission 快照或格式测试；PR 前通过 `npm run lint:submission` 与 `npm run test:submission-format`

---

## 8. 参考实现（从仓库中找模式）

- 子模块参考：
  - `src/submodules/g8-drone-imaging/`
  - `src/submodules/g8-pv-sand-experiment/`
- legacy wrapper 参考（仅迁移桥，不做新模板）：
  - `src/submodules/g7-experiment/`
- mapping 合规测试：`src/submodules/__tests__/mapping-config-compliance.test.ts`
- 前缀/事件守卫测试：
  - `src/shared/services/submission/__tests__/validate-prefixes.test.js`
  - `src/shared/services/submission/__tests__/validate-events.test.js`
