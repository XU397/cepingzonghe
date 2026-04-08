# Draft: 子模块构建任务拆分策略

## 问题陈述

- 现状：项目从独立模块迁移到 flow 架构，通过子模块拼接。
- 已有：部分模块已转为子模块，也新建了一些子模块；同时在标准化子模块构建与数据提交。
- 规范基准：`docs/submission-spec.md`（页码/前缀、operationList/answerList、usePageSubmission/buildMark、mapping.ts 常量、Context 稳定 logOperation、flow_context 注入等）。

## 需要决策的拆分方式（候选）

- 方案 A（水平拆分）：先把 12 页“信息页面/内容呈现”全部完成（动画、图文、题型、图表、输入、拼接等），再逐页做轨迹数据收集与提交流程改造。
- 方案 B（垂直拆分）：把任务拆成 12 个，每页一个任务；每个任务同时包含页面内容构建 + 轨迹数据收集/提交规范适配。

## 评估维度（待补充证据）

- 提交流程集成风险（pageNumber/targetPrefix/flow_context/最小事件集合遗漏）
- 返工成本（UI 完成后再 retrofit 事件埋点/答案收集）
- 并行开发效率（多人分工、冲突面）
- 验收与测试策略（submission-format 快照/guard 覆盖、E2E 证据）
- 子模块“复杂交互页”占比（模拟实验/计时/图表/拼接）

## 代码库证据（已确认）

- 页面内容与轨迹采集高度共定位：现有子模块页面通常 200-400 行，UI 交互逻辑与 `logOperation(...)`、答案收集/格式化、阻断校验（`click_blocked`）写在同一页组件内。
- 并非“后期容易补上”：很多埋点依赖页面具体状态（例如模拟实验参数、计时器状态、输入框 prev/next），后期 retrofit 需要重新梳理交互与状态边界。
- mapping.ts 是强前置约束：每个子模块都需要 `PAGE_DESC_MAP/PAGE_QUESTIONS/QUESTION_CODE_MAP/QUESTION_TEXT_MAP/ANSWER_KEY_TO_QUESTION/QUESTION_OPTIONS_MAP` 等，且会影响答案格式化与验证路径。
  - 参考：`src/submodules/g8-drone-imaging/mapping.ts`、`src/submodules/g8-pv-sand-experiment/mapping.ts`

## 测试/守卫证据（已确认）

- CI 存在 submission guard（强约束）：提交 lint + 格式/快照 + 全量 submission 测试会阻断合并。
- 格式错误会被快速定位：
  - 事件白名单：`src/shared/services/submission/__tests__/validate-events.test.js`
  - 前缀与页码：`src/shared/services/submission/__tests__/validate-prefixes.test.js`
  - 提交前校验（必含 `page_enter/page_exit`、flow_context、code 连续、前缀规则）：`src/shared/services/submission/submoduleAdapter/validateMark.ts`
  - mapping 合规：`src/submodules/__tests__/mapping-config-compliance.test.ts`

## 初步结论（当前推荐）

- 默认推荐：方案 B（每页垂直切片：页面内容 + 轨迹/提交合规一起做）。
- 更稳的落地形态：先打通底座，再按页垂直切片（混合但不是“先做完所有 UI 再 retrofit”）：
  1. 子模块底座：`mapping.ts` 初版 + Context 稳定 `logOperation` + `AssessmentPageFrame`/`usePageSubmission` 接线 + 提交快照/格式测试跑通。
  2. 选 1 个最复杂页（模拟/图表/输入）做端到端垂直切片，验证规范/工具链无坑。
  3. 剩余页面并行按页交付（每页都同时满足规范与测试）。

## 已生成流程文档

- 可直接用于指导 AI/工作流执行：`.sisyphus/drafts/submodule-page-build-process.md`

## Open Questions

- 当前团队更担心：交付速度（先出页面）还是合规/回归风险（先打通提交流程）？
- 现有 submission-format/guard 测试覆盖强度如何（能否快速发现漏埋点/前缀错误）？

## 相关验证入口（便于落地流程）

- 轻量快速自检（建议每页开发期间高频跑）：`npm run lint:submission`、`npm run test:submission-format`
- 全量提交相关回归（建议提 PR 前跑一次）：`npm run test:submission`

## 关于“规范文档能否指导 AI”与“共用组件”

### 结论草案

- `docs/submission-spec.md` 对“**合规要求与接口契约**”描述很完整，配合仓库已有的共享能力（`usePageSubmission`、`AssessmentPageFrame`、`@shared/services/submission/submoduleAdapter/*`、CI submission guard）已经能指导 AI 做到合规。
- 但要让 AI 稳定产出、减少走弯路，仍建议补一层“**可复制的模板/共用 PageKit**”，把每页都重复的接线工作固化成少量共享 hook/组件。

### 建议的共享层边界（不做过度抽象）

- 适合集中到共享层（plumbing）：pageMeta 生成、前缀工具、稳定 logOperation、flow_context 注入策略、buildMark 包装、提交前 validateMark、统一 next_click/lifecycle 拼装、常见答案格式化/收集。
- 必须留在页面/子模块侧（semantics）：题干文本/选项与 code（mapping.ts）、每页有哪些关键交互事件要记录、模拟实验参数/结果的 value 结构、阻断校验的 missing 规则。

### 可演进的“共用组件/Hook”方向（命名待定）

- `useSubmodulePageKit(mapping, { submoduleId, moduleName })`：从 mapping 与 flowContext 推导 pageNumber/pageDesc/prefix，并提供 `logOperation`、`collectAnswers`、`buildMark`、`validateBeforeSubmit`、`submit`。
- `TrackedRadio/TrackedCheckbox/TrackedTextInput`：把“答案写入 + operation 记录 + value 格式化”封装为可复用控件（仍由 pageId/questionKey 驱动，不硬编码题目）。
- 保持现有 `AssessmentPageFrame` 为外层容器，避免把“UI 布局框架”与“提交适配”绑死在一个巨组件里。

## Legacy 模块迁移到标准子模块（文档覆盖度）

- 已有可用文档：
  - `docs/submission-spec.md`（合规口径）
  - `docs/migration-guide-unified-submission.md`（统一提交管道迁移样例 + Tracked\* + 分步迁移）
  - `docs/composite-page-numbering-migration-guide.md`（复合页码迁移）
  - `.sisyphus/drafts/submodule-page-build-process.md`（流程与一致性蓝图；已补充 Legacy→标准子模块迁移打法）
- 仍需明确的关键信息（AI 才能“安全改造”）：目标模块路径/moduleId/url、是否允许先 wrapper bridge、页面清单与拆分边界（是否拆成 experiment/questionnaire 多个 submodule）、计时器与缓存键策略、现有测试命令与回归路径。

## 现有 4 个子模块是否需要修改（风险评估草案）

- 仅采用“流程/DoD/验收命令/拆分方式”作为今后工作法：**不需要改**现有 `g7-experiment`、`g8-drone-imaging`、`g8-mikania-experiment`、`g8-pv-sand-experiment`。
- 如果要引入新的共享 PageKit 并迁移存量：属于“重构提交流程接线层”，**可做但不必做**，且建议渐进：
  - 低风险迁移：只抽出 `buildMark/getUserContext/getFlowContext/buildPageDesc/collectAnswers` 的配线（收益大、改动面相对可控）。
  - 中风险迁移：统一/替换各子模块 Context 的 operation logger 与 flow_context 注入/序号重置（容易牵动 useEffect/时序）。
- 高风险迁移：改动 `AssessmentPageFrame` 行为或把页面语义塞进黑盒通用组件（容易产生“漏语义/漏事件/事件爆炸/难调试”的回归）。

## 现状：4 个子模块的实现形态（快照）

- `src/submodules/g7-experiment/`：包装 legacy 模块的“薄适配器”，通过 `Grade7Wrapper` 复用旧页面体系；submodule 自身不实现 mapping.ts 常量/收集答案/操作日志。
- `src/submodules/g8-drone-imaging/`：TS + 独立 Context（`useOperationLogger`）+ `AssessmentPageFrame` + `usePageSubmission`；pageMeta 与 submissionConfig 在 Frame 层手工组装。
- `src/submodules/g8-mikania-experiment/`：单文件偏“巨组件”，useReducer + createOperationSequence + localStorage 持久化 + `AssessmentPageFrame`；flow_context 注入走 reducer/注入工具。
- `src/submodules/g8-pv-sand-experiment/`：更“规范化”的实现：mapping.ts 导出 `SUBMODULE_MAPPING_CONFIG`，Context 用稳定 logOperation + 注入 flow_context，Component 使用 buildMark 模式并复用 adapter 工具（collectAnswers/buildPageDesc/appendExperimentHistory），测试覆盖更完整。
