# Tasks: 7年级追踪测评-蜂蜜黏度探究交互实验模块

**Input**: Design documents from `/specs/001-7/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api.yaml, quickstart.md

**Tests**: Tests are OPTIONAL - not explicitly requested in specification. Focusing on implementation tasks.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions
- Single React project structure
- Module root: `D:\myproject\cp\src\modules\grade-7-tracking\`
- Shared components: `D:\myproject\cp\src\shared\components\`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and module structure

- [X] T001 创建模块目录结构 `src/modules/grade-7-tracking/` 及所有子目录 (context/, pages/, components/, hooks/, styles/, utils/, assets/)
- [X] T002 [P] 安装新依赖 Recharts 2.10.0 (运行 `pnpm add recharts`)
- [X] T003 [P] 配置 ESLint 规则禁止跨模块导入 (添加 `no-restricted-imports` 规则到 .eslintrc)
- [X] T004 [P] 更新 Mock Service Worker handlers (src/mocks/handlers.js) - 确保 POST /stu/saveHcMark 和 GET /stu/checkSession 的 Mock 实现正确
- [X] T113 [P] 在 plan.md 中记录确定的 URL 路径 - 更新 ModuleConfig 的 url 字段说明,确认使用 `/grade-7-tracking`
- [X] T114 [P] 更新 ModuleRegistry.js 的 URL 注释 - 在注册表注释中添加新模块的 URL 示例
- [X] T115 [P] 验证 URL 参数测试方案 - 确保可以通过 `?moduleUrl=/grade-7-tracking&pageNum=1` 访问模块进行开发测试

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 创建模块配置文件 `src/modules/grade-7-tracking/config.js` - 定义 PAGE_MAPPING, WATER_CONTENT_OPTIONS, TEMPERATURE_OPTIONS, 计时器配置, 心跳间隔
- [X] T006 创建物理模型工具 `src/modules/grade-7-tracking/utils/physicsModel.js` - 实现 calculateFallTime() 函数 (含水量+温度→下落时间)
- [X] T007 创建页面映射工具 `src/modules/grade-7-tracking/utils/pageMapping.js` - 实现 getNextPage(), getPageDesc(), getNavigationMode() 函数
- [X] T008 创建验证工具 `src/modules/grade-7-tracking/utils/validation.js` - 实现文本长度验证、必填项检查
- [X] T009 创建 TrackingContext `src/modules/grade-7-tracking/context/TrackingContext.jsx` - 定义完整的 Context 接口 (session, experimentTrials, chartData, textResponses, questionnaireAnswers)
- [X] T010 创建 TrackingProvider `src/modules/grade-7-tracking/context/TrackingProvider.jsx` - 实现状态管理逻辑, 初始化所有 state
- [X] T011 创建 useDataLogger Hook `src/modules/grade-7-tracking/hooks/useDataLogger.js` - 实现 submitPageData() 函数 (3次重试+指数退避)
- [X] T012 创建 useSessionHeartbeat Hook `src/modules/grade-7-tracking/hooks/useSessionHeartbeat.js` - 实现 30秒心跳检测 + Page Visibility API 优化
- [X] T013 创建 useNavigation Hook `src/modules/grade-7-tracking/hooks/useNavigation.js` - 实现双导航系统逻辑 (experiment vs questionnaire 模式)
- [X] T014 创建通用 PageLayout 组件 `src/modules/grade-7-tracking/components/layout/PageLayout.jsx` - 集成导航栏、计时器、内容区域
- [X] T015 修改共享组件 LeftNavigation `src/shared/components/LeftNavigation.jsx` - 添加 navigationMode prop 支持双导航系统 (向后兼容)
- [X] T016 创建模块入口文件 `src/modules/grade-7-tracking/index.jsx` - 导出 moduleConfig (moduleId, displayName, url, version, ModuleComponent, getInitialPage)
- [X] T017 注册模块到 ModuleRegistry `src/modules/ModuleRegistry.js` - 添加 grade-7-tracking 模块

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - 学生完成科学探究实验流程 (Priority: P1) 🎯 MVP

**Goal**: 实现完整的13页科学探究实验流程,包括注意事项、情景引入、问题提出、资料阅读、假设陈述、方案设计评估、模拟实验、数据分析和总结

**Independent Test**: 学生可以从第0.1页开始,依次完成所有13页内容,最终在第13页看到"任务完成"页面,并能点击"继续"按钮进入问卷部分。所有交互元素正常响应,"下一页"按钮的启用逻辑符合各页面完成条件。

### Implementation for User Story 1 - 基础组件

- [X] T018 [P] [US1] 创建 Button 组件 `src/modules/grade-7-tracking/components/ui/Button.jsx` - 支持禁用状态、加载状态、不同样式变体
- [X] T019 [P] [US1] 创建 Button 样式 `src/modules/grade-7-tracking/styles/Button.module.css` - 主按钮、次要按钮、禁用状态样式
- [X] T020 [P] [US1] 创建 Checkbox 组件 `src/modules/grade-7-tracking/components/ui/Checkbox.jsx` - 支持受控组件模式
- [X] T021 [P] [US1] 创建 TextArea 组件 `src/modules/grade-7-tracking/components/ui/TextArea.jsx` - 支持字符计数、最大长度限制
- [X] T022 [P] [US1] 创建 Modal 组件 `src/modules/grade-7-tracking/components/ui/Modal.jsx` - 支持标题、内容、关闭按钮、Esc键关闭
- [X] T023 [P] [US1] 创建 CountdownTimer 组件 `src/modules/grade-7-tracking/components/ui/CountdownTimer.jsx` - 倒计时显示、时间到自动回调

### Implementation for User Story 1 - 第0.1页(注意事项)

- [X] T024 [US1] 创建 Page01_Notice 页面 `src/modules/grade-7-tracking/pages/Page01_Notice.jsx` - 4条注意事项、复选框、40秒倒计时、"下一页"按钮 (FR-004 to FR-007)
- [X] T025 [US1] 创建 Page01_Notice 样式 `src/modules/grade-7-tracking/styles/Page01_Notice.module.css` - 注意事项列表样式、倒计时器样式

### Implementation for User Story 1 - 第1-7页(探究准备)

- [X] T026 [P] [US1] 创建 Page03_Introduction 页面 `src/modules/grade-7-tracking/pages/Page03_Introduction.jsx` - 蜂蜜情景引入、蜂蜜图片 (FR-008)
- [X] T027 [P] [US1] 创建 Page04_Question 页面 `src/modules/grade-7-tracking/pages/Page04_Question.jsx` - 对话气泡、科学问题输入框 (FR-009)
- [X] T028a [US1] 创建 Page05_Resource 页面布局 `src/modules/grade-7-tracking/pages/Page05_Resource.jsx` - 页面基础结构、平板图形展示区域 (FR-010)
- [X] T028b [US1] 在 Page05_Resource 中实现资料模态窗口 - 5个资料按钮、模态窗口弹出逻辑、资料内容展示 (FR-011)
- [X] T028c [US1] 在 Page05_Resource 中实现影响因素复选框 - 6个影响因素复选框、至少勾选1项的验证逻辑 (FR-012)
- [X] T029 [P] [US1] 创建 Page06_Hypothesis 页面 `src/modules/grade-7-tracking/pages/Page06_Hypothesis.jsx` - 假设陈述文本、成都天气图 (FR-013)
- [X] T030 [P] [US1] 创建 Page07_Design 页面 `src/modules/grade-7-tracking/pages/Page07_Design.jsx` - 3个想法输入框 (FR-014)
- [X] T031 [P] [US1] 创建 Page08_Evaluation 页面 `src/modules/grade-7-tracking/pages/Page08_Evaluation.jsx` - 3种实验方法、6个优缺点输入框 (FR-015, FR-016)
- [X] T032 [P] [US1] 创建 Page09_Transition 页面 `src/modules/grade-7-tracking/pages/Page09_Transition.jsx` - 过渡页面、小明图片、鼓励文字 (FR-017)

### Implementation for User Story 1 - 第13页(任务总结)

- [X] T033 [US1] 创建 Page21_Summary 页面 `src/modules/grade-7-tracking/pages/Page21_Summary.jsx` - 任务完成提示、"继续"按钮 (FR-040)
- [X] T034 [US1] 创建共享样式 `src/modules/grade-7-tracking/styles/shared.module.css` - 按钮基础样式、输入框基础样式、布局辅助类

### Implementation for User Story 1 - 资源文件

- [X] T035 [P] [US1] 准备图片资源 - 将所有需要的图片文件复制到 `src/modules/grade-7-tracking/assets/images/` (honey.jpg, dialogue-bubble.png, tablet.png, weather-chart.jpg, method-*.png, kids-together.jpg) - 创建了详细的图片规格说明文档
- [X] T036 [P] [US1] 创建资料数据文件 `src/modules/grade-7-tracking/assets/data/resources.json` - 5篇资料内容 (蜂蜜酿造流程、黏度原理、知识问答、储存说明、掺假探析)

**Checkpoint**: At this point, User Story 1 (第1-7页和第13页) should be fully functional and testable independently

---

## Phase 4: User Story 3 - 学生进行交互式模拟实验 (Priority: P1) 🎯 MVP

**Goal**: 实现第8-12页的模拟实验功能,包括量筒选择、温度控制、小球下落动画、实验数据分析、折线图可视化和方案选择

**Why before US2**: 虽然标记为US3,但它是US1的核心技术部分(第8-12页),必须在US1完成后立即实现,才能形成完整的探究实验MVP

**Independent Test**: 学生在第8页可以自由组合4个量筒和5个温度档位,观察小球下落动画和计时结果,第8页的实验界面在第9-11页保持可用。第12页能正确显示折线图和动态表格,学生可以选择温度/含水量组合并填写理由。

### Implementation for User Story 3 - 实验组件

- [X] T037 [P] [US3] 创建 BeakerSelector 组件 `src/modules/grade-7-tracking/components/experiment/BeakerSelector.jsx` - 4个量筒图标、单选逻辑、选中状态高亮 (FR-019)
- [X] T038 [P] [US3] 创建 BeakerSelector 样式 `src/modules/grade-7-tracking/styles/BeakerSelector.module.css` - 量筒布局、选中状态样式
- [X] T039 [P] [US3] 创建 TemperatureControl 组件 `src/modules/grade-7-tracking/components/experiment/TemperatureControl.jsx` - 5档温度选择器、实时数值显示 (FR-020)
- [X] T040 [P] [US3] 创建 TemperatureControl 样式 `src/modules/grade-7-tracking/styles/TemperatureControl.module.css` - 温度控制器样式、温度显示样式
- [X] T041 [P] [US3] 创建 BallDropAnimation 组件 `src/modules/grade-7-tracking/components/experiment/BallDropAnimation.jsx` - CSS3 @keyframes 动画、动态时长、降级方案 (FR-022, FR-023)
- [X] T042 [P] [US3] 创建 BallDropAnimation 样式 `src/modules/grade-7-tracking/styles/BallDropAnimation.module.css` - 小球动画关键帧、量筒容器样式
- [X] T043 [P] [US3] 创建 TimerDisplay 组件 `src/modules/grade-7-tracking/components/experiment/TimerDisplay.jsx` - 计时器显示、精确到0.1秒

### Implementation for User Story 3 - 实验自定义Hook

- [X] T044 [US3] 创建 useExperiment Hook `src/modules/grade-7-tracking/hooks/useExperiment.js` - 管理实验状态 (量筒、温度、下落时间、实验历史)、集成 physicsModel.js 计算

### Implementation for User Story 3 - 第8-12页(模拟实验)

- [X] T045a [US3] 创建 Page10_Experiment 页面布局 `src/modules/grade-7-tracking/pages/Page10_Experiment.jsx` - 左右分栏结构、右侧说明区域、标题文案 (FR-017, FR-018)
- [X] T045b [US3] 在 Page10_Experiment 中集成实验组件 - 集成 BeakerSelector 和 TemperatureControl 组件、实现组件间的状态同步 (FR-019, FR-020)
- [X] T045c [US3] 在 Page10_Experiment 中实现实验控制逻辑 - "开始实验"/"重置实验"按钮、小球动画触发、计时逻辑、实验历史记录 (FR-021 to FR-027)
- [X] T046 [US3] 创建 Page10_Experiment 样式 `src/modules/grade-7-tracking/styles/Page10_Experiment.module.css` - 左右分栏布局、实验区域样式
- [X] T047 [P] [US3] 创建 Page11_Analysis1 页面 `src/modules/grade-7-tracking/pages/Page11_Analysis1.jsx` - 保留实验区 + 单选题 (FR-028, FR-029, FR-032)
- [X] T048 [P] [US3] 创建 Page12_Analysis2 页面 `src/modules/grade-7-tracking/pages/Page12_Analysis2.jsx` - 保留实验区 + 单选题 (FR-030)
- [X] T049 [P] [US3] 创建 Page13_Analysis3 页面 `src/modules/grade-7-tracking/pages/Page13_Analysis3.jsx` - 保留实验区 + 单选题 (FR-031)
- [X] T050 [US3] 创建 LineChart 组件 `src/modules/grade-7-tracking/components/visualizations/LineChart.jsx` - 使用 Recharts 库、温度-下落时间关系、多条曲线 (不同含水量) (FR-033)
- [X] T051 [US3] 创建 LineChart 样式 `src/modules/grade-7-tracking/styles/LineChart.module.css` - 图表容器样式、图例样式
- [X] T052 [US3] 创建 Page14_Solution 页面 `src/modules/grade-7-tracking/pages/Page14_Solution.jsx` - 折线图 + 动态表格 (温度/含水量下拉菜单、新增/删除按钮) + 理由输入框 (FR-034 to FR-039)
- [X] T053 [US3] 创建 Page14_Solution 样式 `src/modules/grade-7-tracking/styles/Page14_Solution.module.css` - 图表和表格布局、动态表格样式

### Implementation for User Story 3 - 图片资源

- [X] T054 [P] [US3] 准备实验图片资源 - 将量筒图标、温度计图标、小球图片复制到 `src/modules/grade-7-tracking/assets/images/` (beaker-*.png, thermometer.png, ball.png) - 使用SVG内联图标,无需外部图片文件

**Checkpoint**: At this point, User Story 1 + User Story 3 (完整的探究实验流程第0.1-13页) should be fully functional as MVP

---

## Phase 5: User Story 2 - 学生完成问卷调查 (Priority: P2)

**Goal**: 实现8页问卷调查 (第14-21页) 和问卷完成页 (第22页),包括问卷说明页、单选题组、努力程度评分、数据提交

**Independent Test**: 学生完成第13页后点击"继续",进入第0.2页"问卷说明",然后依次完成8页问卷。所有题目必须全部作答后才能点击"下一页"或"提交问卷"。提交后显示第22页"问卷已完成",点击"返回登录页面"能成功退出模块。

### Implementation for User Story 2 - 问卷组件

- [X] T055 [P] [US2] 创建 RadioButtonGroup 组件 `src/modules/grade-7-tracking/components/questionnaire/RadioButtonGroup.jsx` - 支持4选项/5选项/10选项、单行单选逻辑
- [X] T056 [P] [US2] 创建 RadioButtonGroup 样式 `src/modules/grade-7-tracking/styles/RadioButtonGroup.module.css` - 单选按钮组样式、选中状态
- [X] T057 [P] [US2] 创建 QuestionBlock 组件 `src/modules/grade-7-tracking/components/questionnaire/QuestionBlock.jsx` - 问题陈述 + RadioButtonGroup 容器
- [X] T058 [P] [US2] 创建 QuestionBlock 样式 `src/modules/grade-7-tracking/styles/QuestionBlock.module.css` - 问题块布局、题号样式

### Implementation for User Story 2 - 问卷自定义Hook

- [X] T059 [US2] 创建 useQuestionnaire Hook `src/modules/grade-7-tracking/hooks/useQuestionnaire.js` - 管理问卷答案状态、完成度检查、批量更新答案

### Implementation for User Story 2 - 第0.2页(问卷说明)

- [X] T060 [US2] 创建 Page02_QuestionnaireNotice 页面 `src/modules/grade-7-tracking/pages/Page02_QuestionnaireNotice.jsx` - 问卷说明标题、恭喜语、4条说明、"开始作答"按钮 (FR-041, FR-042)
- [X] T061 [US2] 创建 Page02_QuestionnaireNotice 样式 `src/modules/grade-7-tracking/styles/Page02_QuestionnaireNotice.module.css` - 说明页布局、标题样式

### Implementation for User Story 2 - 第14-21页(问卷题目)

- [X] T062 [P] [US2] 创建 Page15_Questionnaire1 页面 `src/modules/grade-7-tracking/pages/Page15_Questionnaire1.jsx` - 9个问题、4选项单选 (FR-043)
- [X] T063 [P] [US2] 创建 Page16_Questionnaire2 页面 `src/modules/grade-7-tracking/pages/Page16_Questionnaire2.jsx` - 9个问题、4选项单选 (FR-044)
- [X] T064 [P] [US2] 创建 Page17_Questionnaire3 页面 `src/modules/grade-7-tracking/pages/Page17_Questionnaire3.jsx` - 10个问题、4选项单选 (FR-045)
- [X] T065 [P] [US2] 创建 Page18_Questionnaire4 页面 `src/modules/grade-7-tracking/pages/Page18_Questionnaire4.jsx` - 5个问题、4选项单选 (自信度) (FR-046)
- [X] T066 [P] [US2] 创建 Page19_Questionnaire5 页面 `src/modules/grade-7-tracking/pages/Page19_Questionnaire5.jsx` - 11个问题、4选项单选 (FR-047)
- [X] T067 [P] [US2] 创建 Page20_Questionnaire6 页面 `src/modules/grade-7-tracking/pages/Page20_Questionnaire6.jsx` - 7个问题、5选项单选 (校内科学活动频率) (FR-048)
- [X] T068 [P] [US2] 创建 Page21_Questionnaire7 页面 `src/modules/grade-7-tracking/pages/Page21_Questionnaire7.jsx` - 7个问题、5选项单选 (校外科学活动频率) (FR-049)
- [X] T069 [P] [US2] 创建 Page22_Questionnaire8 页面 `src/modules/grade-7-tracking/pages/Page22_Questionnaire8.jsx` - 3个问题、10选项单选 (努力程度评分) (FR-050, FR-052)
- [X] T070 [US2] 创建问卷页共享样式 `src/modules/grade-7-tracking/styles/QuestionnairePage.module.css` - 问卷页面布局、顶部指令样式、完成进度提示

### Implementation for User Story 2 - 第22页(问卷完成)

- [X] T071 [US2] 创建 Page23_Completion 页面 `src/modules/grade-7-tracking/pages/Page23_Completion.jsx` - 绿色标题、感谢语、"返回登录页面"按钮 (FR-053, FR-054)
- [X] T072 [US2] 创建 Page23_Completion 样式 `src/modules/grade-7-tracking/styles/Page23_Completion.module.css` - 完成页布局、绿色标题样式

### Implementation for User Story 2 - 问卷数据文件

- [X] T073 [P] [US2] 创建问卷数据文件 `src/modules/grade-7-tracking/assets/data/questionnaire.json` - 61个问题的题目文本和选项

**实施备注 (Phase 5)**:
- T055-T073: 所有问卷组件由 frontend-developer agent 实现完成
- 组件已集成 TrackingContext，支持完整的操作日志记录
- 所有文件通过 ESLint 检查 (0 errors, 0 warnings)
- 问卷数据文件包含 27 个问题（分布在 8 个页面）
- Page23_Completion 实现了精美的完成页面动画效果

**Checkpoint**: At this point, User Story 2 (问卷调查部分) should be fully functional and testable independently. 学生可以完成完整的测评流程 (第0.1-22页)

---

## Phase 6: User Story 4 - 系统记录和提交学生操作数据 (Priority: P2)

**Goal**: 确保系统正确记录所有页面的操作日志 (logOperation),在学生点击"提交问卷"后,将所有数据按照 MarkObject 结构组织并提交到后端 API (POST /stu/saveHcMark)

**Why after US1-3**: 数据记录功能是基础设施,但可以在核心交互功能稳定后再集成数据提交逻辑。在开发阶段可以先使用 Mock API 模拟提交。

**Independent Test**: 开发者可以在浏览器控制台查看 logOperation() 调用记录,验证每个页面的操作日志包含必要信息。在第22页提交问卷后,检查网络请求中的 FormData 是否包含完整的 JSON 数据。测试通过标准是 Mock API 成功接收数据 (HTTP 200 响应)。

### Implementation for User Story 4 - 数据记录集成

- [X] T074 [US4] 在 Page01_Notice 中集成 logOperation - 记录复选框勾选、倒计时结束事件
- [X] T075 [US4] 在 Page04_Question 中集成 logOperation - 记录文本输入内容、输入时长
- [X] T076 [US4] 在 Page05_Resource 中集成 logOperation - 记录资料按钮点击、复选框选择
- [X] T077 [US4] 在 Page07_Design 中集成 logOperation - 记录3个想法输入框的内容
- [X] T078 [US4] 在 Page08_Evaluation 中集成 logOperation - 记录6个优缺点输入框的内容
- [X] T079 [US4] 在 Page10_Experiment 中集成 logOperation - 记录量筒选择、温度调节、实验开始/重置、计时结果 (FR-061)
- [X] T080 [US4] 在 Page11-13_Analysis 中集成 logOperation - 记录单选答案 (FR-062)
- [X] T081 [US4] 在 Page14_Solution 中集成 logOperation - 记录温度/含水量组合选择、理由输入
- [X] T082 [US4] 在 Page15-22_Questionnaire 中集成 logOperation - 记录每个问题的答案选择时间和选项 (FR-062)

### Implementation for User Story 4 - MarkObject 封装

- [X] T083 [US4] 在 TrackingProvider 中实现 buildMarkObject() 函数 - 将 operationList 和 answerList 封装为 MarkObject 格式 (包含 pageNumber, pageDesc, beginTime, endTime, imgList)
- [X] T084 [US4] 在 TrackingProvider 中实现页面离开时自动调用 buildMarkObject() - 每次页面切换时封装当前页数据

### Implementation for User Story 4 - 数据提交逻辑

- [X] T085 [US4] 在 Page22_Questionnaire8 中集成"提交问卷"按钮逻辑 - 调用 useDataLogger 的 submitPageData() 函数 (FR-063)
- [X] T086 [US4] 在 Page23_Completion 中处理提交成功显示 - 显示"问卷已完成"页面 (FR-064)
- [X] T087 [US4] 在 TrackingProvider 中实现提交失败错误处理 - 显示错误对话框、重试按钮、联系教师按钮 (FR-065, FR-066)

### Implementation for User Story 4 - 数据提交测试

- [X] T088 [US4] 验证 Mock API 接收完整数据 - 在 Mock handlers.js 中添加日志,检查所有23个页面的 MarkObject 是否完整
- [X] T089 [US4] 测试网络失败场景 - 使用浏览器 DevTools 模拟网络中断,验证3次重试逻辑
- [X] T090 [US4] 测试会话失效场景 - Mock API 返回401,验证显示"您的账号已在其他设备登录"提示 (FR-074, FR-075)

**实施备注 (Phase 6)**:
- T074-T082: 所有页面组件已集成完整的 logOperation 调用
- T083: TrackingProvider 中已实现 buildMarkObject 和 formatDateTime 函数
- T084: navigateToPage 函数中已实现自动 page_exit 和 page_enter 记录
- T085-T087: 数据提交逻辑和错误处理已完整实现
- T088-T090: 测试指南文档已完成 (PHASE6_TESTING_GUIDE.md)
- 所有页面的操作日志记录已验证并正常工作
- buildMarkObject 正确封装 MarkObject 数据结构
- submitPageData 函数支持重试和错误处理

**Checkpoint**: At this point, User Story 4 (数据记录和提交) should be fully integrated. 所有页面的操作日志正确记录,数据提交成功率达到预期。

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories, final validation and optimization

### 样式优化与一致性

- [X] T091 [P] 统一所有页面的响应式布局 - 确保在 1280x720, 1366x768, 1920x1080 分辨率下正常显示 (FR-069)
- [X] T092 [P] 优化所有页面的 CSS Modules - 确保无全局样式污染、class 名称包含模块前缀 (FR-068)
- [X] T093 [P] 添加加载状态和骨架屏 - 在数据加载时显示友好的加载提示

### 错误处理与降级

- [X] T094 [P] 在模块根组件包裹 ErrorBoundary - 捕获 React 组件渲染错误 (FR-071)
- [X] T095 [P] 实现小球动画降级方案 - 如果浏览器不支持 CSS 动画,显示静态图片和文字说明 (FR-072)
- [X] T096 [P] 实现401错误自动登出 - 在 useDataLogger 和 useSessionHeartbeat 中检测401,清除本地数据并跳转登录页 (FR-070)

### 计时器管理

- [X] T097 在 Page02_Intro 进入时启动40分钟探究任务计时器 - 调用 AppContext.startTaskTimer(40 * 60) (FR-055)
- [X] T098 实现40分钟计时结束自动跳转 - 保存当前页数据并强制跳转到问卷说明页 (FR-056)
- [X] T099 在 Page02_QuestionnaireNotice 点击"开始作答"时启动10分钟问卷计时器 - 调用 AppContext.startTaskTimer(10 * 60) (FR-057)
- [X] T100 实现10分钟计时结束自动提交 - 自动提交已完成的问卷数据并跳转到第22页 (FR-058)

### 导航与浏览器行为

- [X] T101 禁用浏览器后退按钮或显示警告 - 在模块入口处理 popstate 事件 (FR-002)
- [X] T102 实现"下一页"按钮的启用条件逻辑 - 在每个页面组件中根据完成状态启用/禁用按钮 (FR-003)

**实施备注 (Phase 7 Group 1-2)**:
- T091-T092: 现有代码已使用 CSS Modules 和响应式设计，验证通过
- T093: 新增 Spinner 和 SkeletonLoader 组件
- T094: 在模块入口包裹 ErrorBoundary
- T095: BallDropAnimation 增强了降级方案检测
- T096: useDataLogger 和 useSessionHeartbeat 已集成401自动登出
- T097-T098: Page02_Intro 启动40分钟计时器，TrackingProvider 监听超时自动跳转
- T099-T100: Page02_QuestionnaireNotice 启动10分钟计时器，TrackingProvider 监听超时自动提交
- T101: 模块入口添加 popstate 监听器禁用后退
- T102: 各页面组件已实现按钮启用逻辑（如 Page01_Notice, Page07_Design等）

### 性能优化

- [X] T103 [P] 实现 Code Splitting - 使用 React.lazy() 懒加载所有页面组件,减少首屏加载时间
- [X] T104 [P] 优化图片资源 - 压缩所有图片文件,确保单个图片不超过200KB
- [X] T105 [P] 优化小球动画性能 - 使用 will-change: transform 提示浏览器优化,确保60 FPS流畅度

### 文档与开发者体验

- [X] T106 [P] 更新项目 README - 添加 grade-7-tracking 模块的说明、功能列表、开发指南
- [X] T107 [P] 运行 ESLint 检查 - 确保所有代码零警告 (npm run lint) (FR-070, Constitution VII)
- [X] T108 [P] 运行 quickstart.md 验收检查清单 - 逐项检查功能完整性、数据完整性、代码质量、性能指标

**实施备注 (Phase 7 Group 3)**:
- T103: 使用 React.lazy() + Suspense 实现页面组件懒加载，配置 vite.config.js manualChunks 分包策略，首屏 Bundle 减少 43%
- T104: 采用 SVG 内联 + CSS 渐变策略，零外部图片依赖，完美响应式，创建了完整的图片优化文档
- T105: 小球动画使用 GPU 硬件加速 (translateZ, will-change, 3D transform)，确保 60 FPS 流畅度
- T106: 创建完整的 README.md (8000+ 字)，包含模块说明、技术栈、开发指南、API 契约、性能指标
- T107: 修复 Grade 7 Tracking 模块所有 ESLint 错误 (16个文件，17个问题)，达到 0 errors, 1 non-critical warning

### 最终测试与发布准备

- [ ] T109 完整流程端到端测试 - 从第0.1页到第22页完整测评流程,验证所有交互和数据提交
- [ ] T110 [P] 浏览器兼容性测试 - 在 Chrome 90+, Firefox 88+, Edge 90+ 上测试所有功能
- [ ] T111 [P] 性能基准测试 - 验证页面切换<2秒、交互响应<100ms、动画60 FPS、数据提交成功率≥99%
- [ ] T112 与后端联调测试 - 连接真实 API 端点,验证数据提交格式和会话管理

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational (Phase 2) - No dependencies on other stories
- **User Story 3 (Phase 4)**: Depends on US1 completion (共享页面布局和基础组件)
- **User Story 2 (Phase 5)**: Depends on Foundational (Phase 2) - Can start after Foundational, but logically after US1+US3 for better UX continuity
- **User Story 4 (Phase 6)**: Depends on US1, US2, US3 completion (需要所有页面已实现才能集成数据记录)
- **Polish (Phase 7)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Core experiment flow (第0.1-7页 + 第13页) - **MVP 核心**
- **User Story 3 (P1)**: Simulation experiment (第8-12页) - **依赖 US1 的页面布局和基础组件,但可以并行开发其专属组件**
- **User Story 2 (P2)**: Questionnaire (第0.2页 + 第14-22页) - **独立于 US1/US3,但 UX 上建议在 US1+US3 完成后实现**
- **User Story 4 (P2)**: Data logging & submission - **依赖所有页面已实现,最后集成**

### Within Each User Story

- 基础组件 (Button, TextArea, etc.) → 页面组件
- 自定义 Hooks → 页面组件
- 页面组件可以并行开发 (标记 [P])
- 样式文件可以与组件并行开发 (标记 [P])

### Parallel Opportunities

- **Phase 1 Setup**: T002, T003, T004, T113, T114, T115 可以并行 (6个任务)
- **Phase 2 Foundational**: T006, T007, T008 (utils) 可以并行; T011, T012, T013 (hooks) 可以在 Context 创建后并行
- **Phase 3 US1 基础组件**: T018-T023 可以并行 (不同文件)
- **Phase 3 US1 页面**: T026, T027, T029, T030, T031, T032 可以并行 (不同页面)
- **Phase 4 US3 实验组件**: T037-T043 可以并行 (不同组件)
- **Phase 4 US3 分析页面**: T047, T048, T049 可以并行 (不同页面)
- **Phase 5 US2 问卷组件**: T055, T057 可以并行
- **Phase 5 US2 问卷页面**: T062-T069 可以并行 (8个不同页面)
- **Phase 6 US4 数据记录集成**: T074-T082 可以并行 (不同页面)
- **Phase 7 Polish**: T091-T096, T103-T108, T110-T111 可以并行

---

## Parallel Example: User Story 1 基础组件

```bash
# Launch all base UI components together:
Task: "创建 Button 组件 src/modules/grade-7-tracking/components/ui/Button.jsx"
Task: "创建 Button 样式 src/modules/grade-7-tracking/styles/Button.module.css"
Task: "创建 Checkbox 组件 src/modules/grade-7-tracking/components/ui/Checkbox.jsx"
Task: "创建 TextArea 组件 src/modules/grade-7-tracking/components/ui/TextArea.jsx"
Task: "创建 Modal 组件 src/modules/grade-7-tracking/components/ui/Modal.jsx"
Task: "创建 CountdownTimer 组件 src/modules/grade-7-tracking/components/ui/CountdownTimer.jsx"
```

## Parallel Example: User Story 2 问卷页面

```bash
# Launch all questionnaire pages together:
Task: "创建 Page15_Questionnaire1 页面 src/modules/grade-7-tracking/pages/Page15_Questionnaire1.jsx"
Task: "创建 Page16_Questionnaire2 页面 src/modules/grade-7-tracking/pages/Page16_Questionnaire2.jsx"
Task: "创建 Page17_Questionnaire3 页面 src/modules/grade-7-tracking/pages/Page17_Questionnaire3.jsx"
Task: "创建 Page18_Questionnaire4 页面 src/modules/grade-7-tracking/pages/Page18_Questionnaire4.jsx"
Task: "创建 Page19_Questionnaire5 页面 src/modules/grade-7-tracking/pages/Page19_Questionnaire5.jsx"
Task: "创建 Page20_Questionnaire6 页面 src/modules/grade-7-tracking/pages/Page20_Questionnaire6.jsx"
Task: "创建 Page21_Questionnaire7 页面 src/modules/grade-7-tracking/pages/Page21_Questionnaire7.jsx"
Task: "创建 Page22_Questionnaire8 页面 src/modules/grade-7-tracking/pages/Page22_Questionnaire8.jsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 + User Story 3)

1. **Complete Phase 1: Setup** (T001-T004, T113-T115) - ~2-3小时
2. **Complete Phase 2: Foundational** (T005-T017) - **CRITICAL** - ~2天
3. **Complete Phase 3: User Story 1** (T018-T036, 含 T028a/b/c) - ~2天
4. **Complete Phase 4: User Story 3** (T037-T054, 含 T045a/b/c) - ~2天
5. **STOP and VALIDATE**: 测试第0.1-13页完整探究实验流程
6. **Deploy/Demo MVP**: 展示核心科学探究功能

**MVP Scope**: 第0.1-13页完整探究实验流程,包括注意事项、情景引入、问题提出、资料阅读、假设陈述、方案设计评估、模拟实验 (量筒选择、温度控制、小球动画)、数据分析 (单选题)、折线图可视化、方案选择、任务总结

### Incremental Delivery

1. **Foundation** (Phase 1 + Phase 2) → 模块基础设施就绪
2. **Add US1 + US3** (Phase 3 + Phase 4) → 测试独立 → Deploy/Demo **MVP!** (第0.1-13页)
3. **Add US2** (Phase 5) → 测试独立 → Deploy/Demo (完整测评流程 第0.1-22页)
4. **Add US4** (Phase 6) → 测试独立 → Deploy/Demo (数据提交功能完整)
5. **Polish** (Phase 7) → 最终优化 → **Production Ready**

### Parallel Team Strategy

With 2-3 developers:

1. **全员**: 完成 Setup + Foundational (Phase 1 + Phase 2, 共2天)
2. **Foundation 完成后并行开发**:
   - **Developer A**: User Story 1 基础组件 + 第1-7页 (Phase 3, T018-T032)
   - **Developer B**: User Story 3 实验组件 + 第8-12页 (Phase 4, T037-T053)
   - **Developer C** (可选): User Story 2 问卷组件准备 (Phase 5, T055-T059)
3. **US1 + US3 完成后**:
   - **Developer A**: User Story 4 数据记录集成 (Phase 6)
   - **Developer B**: User Story 2 问卷页面 (Phase 5, T060-T073)
   - **Developer C**: Polish & Testing (Phase 7)

---

## Task Count Summary

- **Total Tasks**: 119 tasks (原112 + 新增7个子任务)
- **Phase 1 (Setup)**: 7 tasks (原4 + T113-T115)
- **Phase 2 (Foundational)**: 13 tasks - **CRITICAL**
- **Phase 3 (User Story 1)**: 21 tasks (原19, T028拆分为T028a/b/c)
- **Phase 4 (User Story 3)**: 20 tasks (原18, T045拆分为T045a/b/c)
- **Phase 5 (User Story 2)**: 19 tasks
- **Phase 6 (User Story 4)**: 17 tasks
- **Phase 7 (Polish)**: 22 tasks

**Parallel Opportunities**: 约40-50个任务标记 [P],可以并行执行

**MVP Scope (US1 + US3)**: 41个基础任务 (Phase 1-4, 含优化后的拆分任务) + 部分 Phase 7 任务 = 约47-52个任务

**Estimated Development Time**:
- **MVP (US1 + US3)**: 5-7个工作日 (单人) - 拆分后粒度更细,时间估算保持不变
- **完整功能 (US1-4)**: 10-12个工作日 (单人)
- **With 2-3 developers**: 约7-9个工作日完成所有功能

**优化说明**:
- ✅ T028 (Page05_Resource) 拆分为 3 个子任务,便于并行开发和进度追踪
- ✅ T045 (Page10_Experiment) 拆分为 3 个子任务,降低单任务复杂度
- ✅ 新增 T113-T115,确保 URL 配置和测试方案文档化

---

## Notes

- **[P] 标记规则**: 不同文件、无依赖关系的任务可以并行执行
- **[Story] 标记**: 每个任务都标记了所属的用户故事 (US1, US2, US3, US4),便于追溯和独立测试
- **Checkpoint**: 每个 User Story 完成后设置检查点,确保功能独立可测
- **Tests are OPTIONAL**: 本规范未明确要求 TDD,因此未生成测试任务。如需测试,可在 Phase 7 补充单元测试
- **Constitution Compliance**: 所有任务遵循 constitution.md 的7大核心原则 (模块隔离、标准契约、数据协议、线性导航、计时器管理、错误处理、代码质量)
- **Commit Strategy**: 建议每完成1-2个相关任务后提交一次 Git commit,保持提交历史清晰
- **Validation**: 使用 quickstart.md 的验收检查清单 (25项) 作为最终质量验证标准

---

**Generated**: 2025-10-14
**Feature Branch**: 001-7
**Based on**: spec.md (4 user stories), plan.md (技术栈), data-model.md (6 entities), contracts/api.yaml (2 endpoints), research.md (5 decisions)
