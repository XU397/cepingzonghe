# Feature Specification: 薇甘菊防治实验子模块

**Feature Branch**: `feature/g8-mikania-experiment`
**Created**: 2025-11-19
**Status**: Draft
**Input**: 详细需求文档 - `docs/子模块需求文档/薇甘菊防治实验子模块设计说明书.md`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 完成模拟实验探究流程 (Priority: P1)

学生登录后进入薇甘菊防治实验模块，阅读实验背景介绍，了解实验步骤，通过交互式模拟实验面板设置不同浓度和天数参数，观察薇甘菊种子发芽情况，回答相关问题，最终得出实验结论。

**Why this priority**: 这是模块的核心功能，评估学生对模拟实验的操作能力和变量控制理解，是整个评测的主要目标。

**Independent Test**: 可通过完整走完6个页面流程、正确操作实验面板并回答所有问题来验证，验证成功即完成核心评测功能。

**Acceptance Scenarios**:

1. **Given** 学生已登录并进入本模块, **When** 学生点击"下一页"逐步推进, **Then** 系统按顺序展示7个页面，从注意事项到最终结论
2. **Given** 学生在实验面板页面, **When** 学生选择浓度(0/5/10mg/ml)和天数(1-7天)后点击"开始", **Then** 系统播放滴管动画并显示对应的发芽率结果
3. **Given** 学生完成最后一页答题, **When** 学生点击"提交", **Then** 系统提交数据并通知Flow容器完成当前步骤

---

### User Story 2 - 数据记录与提交 (Priority: P2)

系统自动记录学生的所有交互操作（页面进入退出、实验参数调整、答案修改等），并在每次页面切换时提交数据到后端，确保评测数据完整可追溯。

**Why this priority**: 数据记录是评测系统的核心价值，没有完整的操作日志和答案记录，无法进行学习分析。

**Independent Test**: 可通过检查提交的MarkObject数据结构是否包含完整的operationList和answerList，以及pageNumber格式是否符合复合编码规范来验证。

**Acceptance Scenarios**:

1. **Given** 学生进入某一页面, **When** 页面组件挂载, **Then** 系统记录page_enter事件
2. **Given** 学生修改实验参数, **When** 学生切换浓度或调整天数, **Then** 系统记录exp_param_change事件包含新旧值
3. **Given** 学生点击"下一页", **When** 页面提交成功, **Then** MarkObject包含该页所有操作记录和答案，pageNumber为复合编码格式

---

### User Story 3 - 页面恢复与进度同步 (Priority: P3)

当学生刷新页面或意外断开连接后重新进入，系统能恢复到之前的页面位置和状态，包括已填写的答案和实验面板参数。

**Why this priority**: 保证用户体验和数据完整性，避免因意外情况导致学生需要重新开始整个实验。

**Independent Test**: 可通过在第3页操作实验后刷新浏览器，验证是否恢复到正确页面并保持实验状态来测试。

**Acceptance Scenarios**:

1. **Given** 学生在第3页操作过实验, **When** 学生刷新浏览器, **Then** 系统恢复到第3页并保持之前的实验参数状态
2. **Given** 学生已完成部分答题, **When** 学生重新进入模块, **Then** 之前填写的答案被回填到对应输入框

---

### User Story 4 - 计时与超时处理 (Priority: P4)

系统在20分钟任务时限内为学生计时，倒计时结束时自动提交当前数据并标记未完成项目。

**Why this priority**: 标准化评测需要时间控制，确保评测公平性和数据可比性。

**Independent Test**: 可通过设置较短测试时间后等待超时，验证自动提交和超时标记是否正常工作。

**Acceptance Scenarios**:

1. **Given** 学生在进行实验, **When** 20分钟计时到期, **Then** 系统自动提交当前页数据，未答项标记为"超时未回答"，并调用flowContext.onTimeout()

---

### Edge Cases

- 学生在必填项未完成时点击"下一页"：系统阻断导航并显示错误提示，记录click_blocked事件
- 学生输入文本少于最低字符要求：显示具体的字符数要求提示
- 网络错误导致提交失败：显示统一错误托盘，提供重试按钮，阻断导航直到提交成功
- 会话过期(401)：自动清理状态并重定向到登录页
- 实验参数超出有效范围：使用默认值并记录警告日志
- flowContext缺失(独立调试模式)：使用stepIndex=0，不调用Flow进度API

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 系统必须提供7页线性流程：注意事项→任务背景→实验步骤→模拟实验→数据分析→趋势分析→结论验证
- **FR-002**: 系统必须实现交互式实验面板，支持3种浓度(0/5/10mg/ml)和7天天数选择
- **FR-003**: 系统必须播放滴管动画和种子发芽动画，视觉效果需达到60FPS
- **FR-004**: 系统必须根据固定数据表显示发芽率结果，不得随机生成
- **FR-005**: 系统必须在每次页面切换时提交完整的MarkObject数据
- **FR-006**: 系统必须记录所有用户交互事件(page_enter/exit, change, exp_start/reset/param_change, click_blocked)
- **FR-007**: 系统必须支持从flowContext恢复页面位置和状态
- **FR-008**: 系统必须强制必填项验证：Q1≥5字符, Q2/Q3必选, Q4a必选且Q4b≥10字符
- **FR-009**: 系统必须在计时到期时自动提交数据并调用flowContext.onTimeout()
- **FR-010**: 系统必须在最后一页完成时调用flowContext.onComplete()，不调用updateModuleProgress
- **FR-011**: 系统必须使用encodeCompositePageNum生成pageNumber，格式为M{stepIndex}:{subPageNum}
- **FR-012**: 系统必须支持hidden导航模式用于引导页(第1、2页不显示左侧导航)
- **FR-015**: 系统必须在注意事项页实现38秒阅读倒计时，倒计时结束后才能勾选确认复选框
- **FR-016**: 系统必须验证用户已勾选"我已阅读并理解上述注意事项"才能进入下一页
- **FR-013**: 系统必须使用统一CSS颜色变量和布局规范
- **FR-014**: 系统必须使用module.g8-mikania-experiment.*命名空间存储本地数据

### Key Entities

- **实验数据模型(GerminationData)**: 存储7天x3浓度的发芽率数据表，值为0-78%的整数百分比
- **页面状态(PageState)**: 包含当前页ID、已填答案、实验面板参数(浓度/天数/是否已开始/结果)
- **操作记录(Operation)**: 包含targetElement、eventType、value、time四个必需字段
- **答案记录(Answer)**: 包含code(序号)、targetElement(P{pageNumber}_问题ID)、value(用户答案)

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 学生能在20分钟内完成7页实验流程的全部操作
- **SC-002**: 首屏渲染时间不超过3秒，单页渲染不超过500毫秒
- **SC-003**: SVG动画流畅度达到60FPS目标
- **SC-004**: 图片资源压缩后不超过200KB
- **SC-005**: 页面刷新后100%恢复到正确位置和状态
- **SC-006**: 所有提交数据的pageNumber格式符合M{n}:{m}复合编码规范
- **SC-007**: 所有必填项验证能阻止无效提交，验证失败率为0
- **SC-008**: 计时到期后自动提交成功率达100%
