# Feature Specification: 4年级火车购票-交互子模块 (g4-experiment)

**Feature Branch**: `005-g4-experiment-submodule`
**Created**: 2025-12-17
**Status**: Draft
**Input**: 根据子模块构建说明书构建符合 Flow 子模块架构规范的四年级火车购票交互子模块

**Design References**:
- 技术规范: `docs/子模块需求文档/4年级火车购票交互课堂-子模块设计说明书.md`
- 页面设计: `docs/子模块需求文档/4年级火车票交互HCI.md`
- 对话动画参考: `docs/对话框动画参考/四年级火车票对话.html`
- 拖拽动画参考: `docs/SVG动画参考/任务条拖动动画.html`

**Specification Overrides** (本规格说明书对设计文档的覆盖声明):

| 条目 | 说明书原文 | 本规格覆盖为 | 原因 |
|------|------------|--------------|------|
| 票价校验 | "总票价等于公式计算结果"才可下一页 (说明书 4.3) | **不校验正确性**，仅校验"非空+数字格式" | 评测设计要求记录原始答案供后端评分，前端不做正确性拦截 |
| 路线5路程 | HCI分段总和约8.19km | 统一使用 **7.88km** (与Page6表格一致) | 避免数据自相矛盾，以展示给用户的最终结果为准 |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 学生完成火车购票评测全流程 (Priority: P1)

学生登录评测系统后，进入四年级火车购票交互模块，按照引导完成从注意事项阅读到最终提交的完整评测流程（共12个页面），系统记录学生的所有操作轨迹和答案数据并提交至后端。

**Why this priority**: 这是子模块的核心功能，直接决定评测能否正常进行。学生必须能够完成完整的评测流程，系统必须能够准确记录和提交数据。

**Independent Test**: 可以通过模拟学生操作完成整个12页评测流程来独立测试，验证每页的数据提交和导航功能。

**Acceptance Scenarios**:

1. **Given** 学生已登录并被分配到 g4-experiment 模块, **When** 学生进入模块, **Then** 系统显示注意事项页（Page 1）并启动40秒阅读倒计时
2. **Given** 学生在注意事项页阅读40秒后, **When** 学生勾选"已阅读"并点击下一页, **Then** 系统允许进入情景介绍页（Page 2）并启动40分钟全局计时器
3. **Given** 学生在任意需要输入的页面, **When** 学生完成输入并点击下一页, **Then** 系统收集该页答案和操作记录并提交至后端，提交成功后才允许导航
4. **Given** 学生完成所有页面并到达结束页, **When** 学生点击"完成"按钮, **Then** 系统提交最终数据并通知 Flow 容器模块已完成

---

### User Story 2 - 学生进行地图交互计算路程 (Priority: P2)

学生在出发站页面（Page 5）通过点击路线按钮查看5条从小明家到火车站的路线，计算路线1和路线5的路程，并在表格中填写答案。

**Why this priority**: 地图交互是本模块的核心交互形式之一，涉及"信息提取与处理"能力的评估，是评测设计的关键部分。

**Independent Test**: 可以单独测试Page 5页面的地图组件，验证路线按钮切换、路径显示、输入框数据收集功能。

**Acceptance Scenarios**:

1. **Given** 学生在出发站交互页, **When** 学生点击"路线1"按钮, **Then** 地图上显示路线1的路径和分段距离（3.64km, 4.26km）
2. **Given** 学生已查看路线信息, **When** 学生在表格中输入路线1路程为7.9km, **Then** 系统记录输入操作和值
3. **Given** 学生未填写路线1和路线5的路程, **When** 学生点击下一页, **Then** 系统阻止导航并提示需要完成输入

---

### User Story 3 - 学生进行任务条拖拽时间规划 (Priority: P2)

学生在出发时间页面（Page 7-10）通过拖拽任务条来设计早晨事务安排方案，包括观看演示、设计两种方案、评估和改进方案。

**Why this priority**: 拖拽交互是本模块最复杂的交互形式，涉及"想法生成"和"想法评估"能力的评估，是评测设计的核心创新点。

**Independent Test**: 可以单独测试拖拽组件的功能，包括磁吸对齐、克隆机制、跨区域拖动等。

**Acceptance Scenarios**:

1. **Given** 学生在演示页（Page 7）, **When** 学生点击"播放演示"按钮, **Then** 系统播放任务条拖拽动画演示，展示如何设计方案
2. **Given** 学生在方案设计页（Page 8）, **When** 学生从工具栏拖出任务条到方案一区域, **Then** 系统创建任务条副本并放置在目标位置，支持磁吸对齐
3. **Given** 学生已设计两种不同的方案, **When** 学生点击下一页, **Then** 系统记录两种方案的布局数据和用户输入的总用时
4. **Given** 学生在改进页选择"否"（方案不是最短）, **When** 学生未提供改进方案就点击下一页, **Then** 系统阻止导航并提示需要提供改进方案

---

### User Story 4 - 学生进行车票筛选和计价 (Priority: P2)

学生在车票选择页面（Page 11-12）根据约束条件筛选符合要求的车次，推荐合适车次并使用虚拟键盘计算三人票价。

**Why this priority**: 车票筛选和计价涉及"信息提取与处理"和"想法评估"能力的评估，是评测流程的收尾部分，直接影响评测完整性。

**Independent Test**: 可以单独测试Page 11-12的表格选择组件和虚拟键盘组件功能。

**Acceptance Scenarios**:

1. **Given** 学生在车票筛选页, **When** 学生点击车次前的图标进行多选, **Then** 系统高亮显示已选车次并记录选择操作
2. **Given** 学生在计价页, **When** 学生使用虚拟键盘输入计算过程, **Then** 系统记录每次按键操作和计算公式
3. **Given** 学生未填写推荐理由或票价计算不完整, **When** 学生点击下一页, **Then** 系统阻止导航并提示需要完成必填项

---

### User Story 5 - 进度恢复与超时处理 (Priority: P3)

系统支持学生在意外中断（如页面刷新）后恢复到之前的进度，并在40分钟全局计时器到期时自动提交并跳转到结束页。

**Why this priority**: 进度恢复和超时处理是保障评测公平性和数据完整性的重要功能，但优先级低于核心交互流程。

**Independent Test**: 可以通过模拟页面刷新和计时器到期来测试进度恢复和超时处理功能。

**Acceptance Scenarios**:

1. **Given** 学生在第N页答题中途刷新页面, **When** Flow 容器调用 `getInitialPage(modulePageNum)`, **Then** 子模块返回正确的页面ID并恢复到刷新前的页面
2. **Given** 40分钟全局计时器到期, **When** 学生尚未完成评测, **Then** 系统自动提交当前页数据（未答题目填"超时未回答"）并导航到结束页
3. **Given** 学生完成评测并在结束页, **When** 学生点击"完成", **Then** 系统调用 `flowContext.onComplete()` 通知 Flow 容器

---

### Edge Cases

- **网络异常**：数据提交失败时，系统显示错误托盘并阻止导航，允许用户重试
- **会话过期**：401 错误时，系统调用统一的 `handleSessionExpired` 处理流程
- **非法页码**：`modulePageNum` 越界时，系统回退到默认首页（notices）并记录错误日志
- **输入非法值**：路程计算输入非数字时，系统阻止提交并提示用户
- **拖拽操作异常**：拖拽到区域外时任务条消失（取消操作），双击删除任务条
- **方案相同**：两种方案布局完全相同时，系统提示需要设计不同方案
- **票价不校验正确性**：系统仅校验"非空+数字格式"，不拦截错误答案（记录原始答案供后端评分）

---

## Requirements *(mandatory)*

### Functional Requirements

#### 子模块注册与导出
- **FR-001**: 系统必须在 `src/submodules/g4-experiment/index.jsx` 导出符合 CMI 规范的 `G4ExperimentSubmodule` 对象
- **FR-002**: 系统必须实现 `getInitialPage(subPageNum)` 方法，支持 1-12 的合法输入，越界返回默认首页
- **FR-003**: 系统必须实现 `getTotalSteps()` 方法，返回 11（不含 hidden 类型的 notices 页）
- **FR-004**: 系统必须实现 `getNavigationMode(pageId)` 方法，返回 `hidden`/`experiment` 模式
- **FR-005**: 系统必须实现 `getDefaultTimers()` 方法，返回 `{ task: 2400 }`（40分钟）

#### 页面导航与生命周期
- **FR-006**: 系统必须包含12个页面：notices、scenario-intro、problem-identification、factor-analysis、route-analysis、station-recommendation、timeline-planning-tutorial、user-solution-design、plan-optimization、ticket-filter、ticket-pricing、task-completion
- **FR-007**: 系统必须在每个页面进入时记录 `page_enter` 事件，离开时记录 `page_exit` 事件
- **FR-008**: 系统在 Flow 模式下必须在 `page_enter` 后自动注入 `flow_context` 事件
- **FR-009**: 系统必须禁止用户返回上一页或通过左侧导航跳页

#### 注意事项页 (notices) - HCI Page 1
> Design Reference: HCI Page 1, 说明书 4.1

- **FR-010**: 系统必须显示40秒倒计时，倒计时结束前复选框不可点击
- **FR-011**: 系统必须在用户勾选"已阅读"后才允许点击下一页
- **FR-012**: 系统必须在未满足条件时上报 `click_blocked` 事件（原因：`notice_not_confirmed`）
- **FR-013**: 系统必须显示完整的注意事项文案（见附录 A.1）

#### 情景介绍页 (scenario-intro) - HCI Page 2
> Design Reference: HCI Page 2, 说明书 4.1

- **FR-014**: 系统必须显示地图示意图（小明家、南充、成都位置）
- **FR-015**: 系统必须显示情景说明文案："小明一家住在四川省南充市。暑假快来了,住在成都的舅舅邀请小明一家到那里做客。请你帮小明一起规划出行方案吧!"
- **FR-016**: 此页为纯展示页，无交互组件，点击下一页即可进入

#### 问题识别页 (problem-identification) - HCI Page 3
> Design Reference: HCI Page 3 详细设计规格, 说明书 4.1

- **FR-017**: 系统必须在左侧显示手机模拟器样式的聊天界面
  - 手机外壳：圆角48px、边框8px深灰色、高度680px
  - 顶部刘海：宽160px、高24px、居中
  - 顶部导航栏：蓝色背景(#3b82f6)、标题"假期安排讨论群(4)"
- **FR-018**: 系统必须自动播放9条对话消息（页面加载1秒后开始）
  - 播放时序：打字延迟 = min(max(字符数×100ms, 1200ms), 2500ms)
  - 消息间隔：500ms
  - 显示"正在输入"指示器（三点跳动动画）
- **FR-019**: 系统必须为4个角色显示不同样式的消息气泡
  - 舅舅/妈妈/爸爸：左侧蓝色气泡(#dbeafe)
  - 小明：右侧橙色气泡(#fdba74)
  - 头像使用PNG图片（jiujiuT.png、babaT.png、xiaomingT.png、mamaT.png）
- **FR-020**: 系统必须提供重播按钮，点击后清空并重新播放对话
- **FR-021**: 系统必须在右侧提供交互卡片
  - 标题："火车购票"
  - 问题文本："根据左侧对话,请写出小明接下来要解决什么问题?"
  - 输入框：最大200字符，4行高度
- **FR-022**: 系统必须在输入为空时禁用下一页按钮
- **FR-023**: 系统必须记录对话相关操作轨迹（见附录 B.1）

#### 因素分析页 (factor-analysis) - HCI Page 4
> Design Reference: HCI Page 4, 说明书 4.1

- **FR-024**: 系统必须显示问题说明和6个复选框选项（见附录 A.2）
- **FR-025**: 系统必须记录每次勾选/取消勾选操作（checkbox_check/checkbox_uncheck）
- **FR-026**: 系统必须在至少选中1个选项后才允许下一页

#### 出发站交互页 (route-analysis) - HCI Page 5
> Design Reference: HCI Page 5 + P6-P11状态, 说明书 4.1

- **FR-027**: 系统必须显示地图（小明家、南充北站、南充站）和5个路线按钮
- **FR-028**: 系统必须在点击路线按钮时显示对应路线的路径和距离信息
  - 路线1：分段显示 3.64km + 4.26km（需用户计算总和7.9km）
  - 路线2：显示总距离 8.65km
  - 路线3：显示总距离 10.2km
  - 路线4：显示总距离 9.63km
  - 路线5：分段显示 2km + 2.4km + 2km + 1.48km（需用户计算总和 **7.88km**，见 Overrides）
- **FR-029**: 系统必须提供右侧表格，路线1和路线5为输入框，其他为只读
- **FR-030**: 系统必须在两个输入框都填写合法数值（正数）后才允许下一页
- **FR-031**: 系统不校验路程计算结果的正确性，仅记录用户输入

#### 出发站结论页 (station-recommendation) - HCI Page 6
> Design Reference: HCI Page 6, 说明书 4.1

- **FR-032**: 系统必须显示路线数据表格（5条路线的出发站、路线、路程）
  - 南充北站：路线1=7.9km, 路线2=8.65km
  - 南充站：路线3=10.2km, 路线4=9.63km, 路线5=7.88km
- **FR-033**: 系统必须提供单选组件供用户选择推荐的出发站（南充北站/南充站）
- **FR-034**: 系统必须复用Page 5的地图交互（提示可重新查看路线）
- **FR-035**: 系统必须提供文本输入框供用户填写推荐理由
- **FR-036**: 系统必须在选择出发站和填写理由后才允许下一页

#### 拖拽演示页 (timeline-planning-tutorial) - HCI Page 7
> Design Reference: HCI Page 7, 说明书 4.1

- **FR-037**: 系统必须显示5个任务条及其属性（见附录 A.3 任务条数据）
- **FR-038**: 系统必须提供"播放演示"按钮和"重置"按钮
- **FR-039**: 系统必须播放完整的拖拽动画演示
  - 动画顺序：①→②→④(与②并行)→⑤→③
  - 显示动画光标（抓取/释放状态）
  - 动画时长：任务条移动800ms，光标移动500ms
- **FR-040**: 系统必须在动画完成后自动在输入框逐字显示"19"（300ms/字符）
- **FR-041**: 点击"重置"按钮恢复初始状态

#### 方案设计页 (user-solution-design) - HCI Page 8
> Design Reference: HCI Page 8, 说明书 4.1

- **FR-042**: 系统必须提供工具栏，包含5个可无限克隆的任务条模板
- **FR-043**: 系统必须提供两个独立的方案设计区域（方案一、方案二）
  - 每个区域包含双时间轴（主轴+副轴，支持任务并行）
  - 每个区域有独立的"清空"按钮
  - 每个区域有"总用时"输入框（用户手动填写）
- **FR-044**: 系统必须支持任务条的磁吸对齐功能
  - 吸附阈值：30px
  - 4种对齐模式：左-左、左-右、右-右、右-左
- **FR-045**: 系统必须支持任务条的交互操作
  - 从工具栏拖出：创建副本（原模板不动）
  - 方案内拖动：调整位置
  - 跨方案拖动：移动到另一方案（原方案移除）
  - 拖出区域外：删除任务条
  - 双击：删除任务条
  - 单击：高亮选中（蓝色边框）
- **FR-046**: 系统必须提供"重置全部"按钮，清空两个方案
- **FR-047**: 系统必须校验下一页条件
  - 两个方案都有至少1个任务条
  - 两个方案的总用时都已填写（正整数1-999）
  - **两个方案的布局不能完全相同**（提示"请设计两种不同的方案"）

#### 方案评估页 (plan-optimization) - HCI Page 9-10
> Design Reference: HCI Page 9 + Page 10, 说明书 4.1

- **FR-048**: 系统必须显示小明的方案图（甘特图形式）
  - 布局：①→②(并行④)→③→⑤
  - 标注总用时：15分钟
- **FR-049**: 系统必须提供单选组件（是/否）判断方案是否最短
- **FR-050**: 系统选择"否"时必须显示改进方案拖拽区域
  - 复用方案设计页的拖拽组件
  - 提供"总用时"输入框
- **FR-051**: 系统必须校验下一页条件
  - 必须选择"是"或"否"
  - 选择"否"时，改进方案必须有至少1个任务条且总用时已填写

#### 车票筛选页 (ticket-filter) - HCI Page 11
> Design Reference: HCI Page 11, 说明书 4.1

- **FR-052**: 系统必须显示筛选条件说明
  - 小明的约束：出发时间11时后、乘车时长2小时内
  - 妈妈的约束：3张车票同一车次、到达时间18:30前
- **FR-053**: 系统必须显示5条车次信息的表格（见附录 A.4 车次数据）
- **FR-054**: 系统必须支持点击行首图标进行多选（再次点击取消）
- **FR-055**: 系统必须在至少选择1条车次后才允许下一页
- **FR-056**: 系统不校验用户选择是否符合约束条件（仅记录选择）

#### 车票计价页 (ticket-pricing) - HCI Page 12
> Design Reference: HCI Page 12, 说明书 4.1

- **FR-057**: 系统必须显示筛选后的车次表格（D175, C751）
  - 说明：根据妈妈约束"3张票同车次+到达18:30前"，仅D175和C751符合
  - D175: 二等座148元(5张), 学生票112元(1张)
  - C751: 二等座96元(3张), 学生票60元(6张)
- **FR-058**: 系统必须提供单选组件推荐车次（D175/C751）
- **FR-059**: 系统必须提供推荐理由文本输入框
- **FR-060**: 系统必须提供虚拟键盘供用户输入计算过程
  - 按键：0-9、+、-、×、÷、=、Enter（换行）
  - 计算过程输入框（多行）
- **FR-061**: 系统必须提供总票价输入框
- **FR-062**: 系统必须校验下一页条件
  - 已选择推荐车次
  - 推荐理由非空
  - 计算过程非空
  - 总票价非空且为正整数
- **FR-063**: **系统不校验票价计算结果的正确性**（仅记录答案供后端评分）
  - 正确答案参考：D175=148×2+112=408元 或 148×2+74=370元（儿童半价）
  - C751=96×2+60=252元 或 96×2+48=240元（儿童半价）
  - 注：题目说"小明为半价儿童票"，但学生票价格已给出，口径由后端评分决定

#### 结束页 (task-completion) - HCI Page 13
> Design Reference: HCI Page 13, 说明书 4.1

- **FR-064**: 系统必须显示感谢信息："感谢你帮助小明完成了火车票购买,预祝小明一家在成都度过一个美好假期!"
- **FR-065**: 系统必须显示"完成"按钮
- **FR-066**: 系统点击"完成"后必须提交最终数据并调用 `flowContext.onComplete()`

#### 数据提交规范
- **FR-067**: 系统必须使用 `encodeCompositePageNum(stepIndex + 1, subPageNum)` 生成 `pageNumber`（格式 X.YY）
- **FR-068**: 系统必须使用 `buildPageDesc()` 生成带 Flow 前缀的 `pageDesc`
- **FR-069**: 系统必须为 `targetElement` 添加 `P{pageNumber}_` 前缀
- **FR-070**: 系统必须确保 `beginTime < endTime` 且格式为 `YYYY-MM-DD HH:mm:ss`
- **FR-071**: 系统必须使用 `mapping.ts` 中定义的 `QUESTION_CODE_MAP` 和 `QUESTION_TEXT_MAP`

#### 计时与超时
- **FR-072**: 系统必须在进入 scenario-intro 时启动40分钟全局计时器
- **FR-073**: 系统必须在计时器到期时自动提交当前页并导航到 task-completion
- **FR-074**: 系统必须将超时未答的题目填入"超时未回答"

#### 错误处理
- **FR-075**: 系统提交失败时必须显示错误托盘并阻止导航
- **FR-076**: 系统检测到401错误时必须交由统一 `handleSessionExpired` 处理
- **FR-077**: 系统必须实现 `validateMappingConfig` 对配置进行校验

#### 样式规范
- **FR-078**: 系统必须使用全局CSS变量定义颜色，禁止硬编码十六进制色值
  - **所有新增CSS变量必须在 `src/styles/global.css` 中声明**（不允许在子模块样式文件中声明）
  - HCI文档中的色值需映射到CSS变量（见附录 C 颜色映射表）
  - 主色：--cartoon-primary (#59c1ff) 用于按钮、选中状态
  - 气泡蓝：--g4-bubble-blue (#dbeafe) 用于舅舅/妈妈/爸爸气泡
  - 气泡橙：--g4-bubble-orange (#fdba74) 用于小明气泡
- **FR-079**: 系统必须遵循说明书10节的视觉规范（圆角、阴影、字体、响应式断点）

---

### Key Entities

- **PageConfig**: 页面配置信息（pageId、subPageNum、type、navigationMode、description）
- **MarkObject**: 数据提交对象（pageNumber、pageDesc、operationList、answerList、beginTime、endTime）
- **Operation**: 操作记录（targetElement、eventType、value、time）
- **Answer**: 答案记录（code、targetElement、value）
- **TaskBlock**: 任务条实体（id、cloneId、x、y、width、color、label、duration）
- **Solution**: 方案实体（tasks[]、userInputTime）
- **DialogueMessage**: 对话消息（role、text、avatarUrl）
- **TrainSchedule**: 车次信息（trainNo、departure、arrival、duration、adultPrice、adultSeats、studentPrice、studentSeats）

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 学生能够在40分钟内完成全部12个页面的评测流程
- **SC-002**: 95%的用户首次使用时能够正确理解并完成拖拽操作
- **SC-003**: 系统支持1000名学生同时进行评测而不出现数据丢失
- **SC-004**: 页面刷新后，学生能够在3秒内恢复到之前的进度
- **SC-005**: 数据提交成功率达到99.5%以上（网络正常情况下）
- **SC-006**: 所有操作轨迹数据完整记录，无遗漏（page_enter/page_exit/交互事件）
- **SC-007**: 拖拽交互响应时间小于100毫秒，无明显卡顿
- **SC-008**: 子模块符合 Flow CMI 规范，可被 Flow 容器正确加载和调用

---

## Assumptions

1. **Flow 容器可用**: 假设 Flow 框架和 AssessmentPageFrame 外壳已正确实现
2. **统一服务可用**: 假设 `usePageSubmission`、`handleSessionExpired`、`encodeCompositePageNum` 等共享服务已存在
3. **图片资源存在**: 假设 HCI 文档中提到的头像图片（jiujiuT.png、babaT.png等）和地图资源已准备好
4. **后端接口兼容**: 假设后端 `/stu/saveHcMark` 接口兼容本子模块的数据格式
5. **浏览器支持**: 假设目标浏览器支持 Pointer Events API 和 CSS Grid 布局
6. **票价评分口径**: 假设票价正确性由后端评分判定，前端仅记录原始答案

---

## Dependencies

- **Flow 框架**: `src/flows/FlowModule.jsx`、`src/shared/types/flow.ts`
- **统一提交服务**: `usePageSubmission` hook
- **页面映射工具**: `encodeCompositePageNum`、`buildPageDesc`
- **操作记录器**: `useOperationLogger` hook
- **样式变量**: `src/styles/global.css` 中的 CSS 变量

---

## Out of Scope

- 问卷调查模块（本子模块仅包含实验/前置评测部分）
- 后端接口的实现和修改
- Flow 容器框架的修改
- 评分逻辑和结果分析（票价、路程等答案由后端评分）
- 多语言支持

---

## Appendix A: 页面文案与常量数据

### A.1 注意事项文案

```
注意事项:
作答时间共40分钟,时间结束后,系统将自动退出答题界面。
请按顺序回答每页问题,上一页题目未完成作答,将无法点击进入下一页。
答题时,不要提前点击"下一页"查看后面的内容,否则将无法返回上一页。
遇到系统故障、死机、死循环等特殊情况时,请举手示意老师。

复选框文案：我已阅读上述注意事项
```

### A.2 因素分析选项

```
问题：为解决上述问题,请问小明在购票时需要考虑以下哪些因素?
提示：单击选择你认为正确的选项,再次单击可取消选择(可多选)。

选项：
□ 小明家到出发站的路程
□ 火车车厢数
□ 成都东站到舅舅家的路程
□ 火车到达时间
□ 剩余车票数
□ 火车发展历史
```

### A.3 任务条数据

| 序号 | 任务名称 | 颜色(HCI) | CSS变量映射 | 宽度(px) | 时长(分钟) |
|------|----------|-----------|-------------|----------|------------|
| ① | 洗水壶 | #2563EB | --g4-task-blue | 40 | 1 |
| ② | 烧热水 | #EA580C | --g4-task-orange | 400 | 10 |
| ③ | 灌水 | #6B7280 | --g4-task-gray | 80 | 2 |
| ④ | 整理背包 | #15803D | --g4-task-green | 80 | 2 |
| ⑤ | 吃早饭 | #DB2777 | --g4-task-pink | 240 | 6 |

### A.4 车次数据

| 车次 | 发车时间 | 到达时间 | 用时 | 二等座价格 | 余票 | 学生票价格 | 余票 |
|------|----------|----------|------|------------|------|------------|------|
| C769 | 11:15 | 12:58 | 1小时43分 | 96元 | 2张 | 60元 | 无 |
| D175 | 12:36 | 14:06 | 1小时30分 | 148元 | 5张 | 112元 | 1张 |
| C751 | 14:38 | 16:25 | 1小时47分 | 96元 | 3张 | 60元 | 6张 |
| C757 | 16:36 | 18:13 | 1小时37分 | 96元 | 1张 | 60元 | 1张 |
| D163 | 18:16 | 19:50 | 1小时34分 | 148元 | 12张 | 112元 | 8张 |

**筛选规则说明**（供参考，系统不做拦截）：
- C769：学生票无票，不符合"3张同车次"
- D175：符合所有条件 ✓
- C751：符合所有条件 ✓
- C757：仅2张票（二等座1+学生票1），不符合"3张同车次"
- D163：到达19:50 > 18:30，不符合"到达时间"

### A.5 对话消息数据

```javascript
const dialogueMessages = [
  { role: 'uncle', text: '@小明 你什么时候放暑假呀?' },
  { role: 'ming', text: '舅舅,我7月8号放暑假!' },
  { role: 'uncle', text: '这个假期有时间来成都看大熊猫吗?' },
  { role: 'ming', text: '好呀,我有时间!爸爸妈妈有时间陪我一起去吗?' },
  { role: 'mom', text: '没问题,我们可以选一个周末去,南充离成都不远。' },
  { role: 'dad', text: '7月27号怎么样?那天是周六,我们不用上班。' },
  { role: 'ming', text: '太好啦!那我来负责买火车票吧。' },
  { role: 'uncle', text: '记得到达站选择成都东站,那里交通方便。@小明' },
  { role: 'mom', text: '另外路上不要花太长时间,争取在18时30分前到成都东站。' }
];
```

---

## Appendix B: 操作轨迹采集清单

**事件类型命名规范**:
- 表中 `page_enter`、`page_exit` 等小写名称为**实际上报值**
- 表中 `INPUT_FOCUS`、`CLICK` 等大写名称为 **EventTypes 常量名**，实际上报值为小写（如 `input_focus`、`click`）
- 实现时必须使用 `EventTypes.*` 常量（如 `EventTypes.INPUT_FOCUS`），不得硬编码字符串
- EventTypes 常量定义位置：`src/shared/services/submission/eventTypes.js`（共享服务，子模块直接引用）

### B.1 问题识别页 (problem-identification) 事件

| 事件类型 | targetElement | value 格式 | 触发时机 |
|----------|---------------|------------|----------|
| page_enter | 页面 | Page_03_问题识别 | 进入页面 |
| INPUT_FOCUS | 对话容器 | 对话框聚焦 | 鼠标进入对话区域 |
| INPUT_BLUR | 对话容器 | 对话框失焦 | 鼠标离开对话区域 |
| CLICK | 对话消息_{index} | {role, messageIndex, messageText前50字} | 点击消息气泡 |
| INPUT_FOCUS | 对话消息_{index} | focus\|role={角色}\|idx={索引}\|text={文本前50字} | 鼠标进入消息 |
| INPUT_BLUR | 对话消息_{index} | blur\|role={角色}\|idx={索引}\|text={文本前50字} | 鼠标离开消息 |
| INPUT_FOCUS | 问题输入框 | 聚焦 | 输入框获得焦点 |
| INPUT_BLUR | 问题输入框 | {当前输入内容} | 输入框失去焦点 |
| INPUT_CHANGE | 问题输入框 | {prev, next} | 输入内容变化 |
| INPUT_DELETE | 问题输入框 | {action:'delete', prevLength, nextLength} | 删除字符 |
| CLICK | next_button | 提交答案 | 点击下一页 |
| page_exit | 页面 | Page_03_问题识别 | 离开页面 |

### B.2 拖拽页事件

| 事件类型 | targetElement | value 格式 | 触发时机 |
|----------|---------------|------------|----------|
| simulation_operation | 方案{N}_任务条{①-⑤} | {action:'drag_start', taskId, position:{x,y}} | 开始拖动 |
| simulation_operation | 方案{N}_任务条{①-⑤} | {action:'drag_place', taskId, position:{x,y}} | 放置任务条 |
| simulation_operation | 方案{N}_任务条{①-⑤} | {action:'delete', taskId} | 删除任务条 |
| input | 方案{N}_总用时 | {value} | 输入总用时 |
| click | 清空_方案{N} | clear | 点击清空按钮 |
| click | 重置全部 | reset | 点击重置按钮 |

---

## Appendix C: 颜色映射表

| 用途 | HCI色值 | CSS变量 | 说明 |
|------|---------|---------|------|
| 主色/按钮 | #3b82f6 | --cartoon-primary | 蓝色按钮、选中状态 |
| 气泡-舅舅/妈妈/爸爸 | #dbeafe | --g4-bubble-blue | 左侧消息气泡 |
| 气泡-小明 | #fdba74 | --g4-bubble-orange | 右侧消息气泡 |
| 任务条-洗水壶 | #2563EB | --g4-task-blue | 任务条① |
| 任务条-烧热水 | #EA580C | --g4-task-orange | 任务条② |
| 任务条-灌水 | #6B7280 | --g4-task-gray | 任务条③ |
| 任务条-整理背包 | #15803D | --g4-task-green | 任务条④ |
| 任务条-吃早饭 | #DB2777 | --g4-task-pink | 任务条⑤ |
| 手机边框 | #1f2937 | --g4-phone-border | 手机模拟器边框 |
| 聊天背景 | #f8fafc | --g4-chat-bg | 聊天内容区背景 |

**实现要求**: 所有CSS变量必须在 `src/styles/global.css` 中声明（不允许在子模块样式文件中新增变量声明），组件中引用变量而非硬编码色值。

---

## Appendix D: 页面-设计文档映射表

| subPageNum | pageId | HCI章节 | 说明书章节 | 页面类型 |
|------------|--------|---------|------------|----------|
| 1 | notices | Page 1 | 4.1, 5.2 | Type-A |
| 2 | scenario-intro | Page 2 | 4.1 | Type-A |
| 3 | problem-identification | Page 3 详细设计 | 4.1 | Type-B |
| 4 | factor-analysis | Page 4 | 4.1 | Type-D |
| 5 | route-analysis | Page 5 + P6-P11状态 | 4.1 | Type-C |
| 6 | station-recommendation | Page 6 | 4.1 | Type-D |
| 7 | timeline-planning-tutorial | Page 7 | 4.1 | Type-F |
| 8 | user-solution-design | Page 8 | 4.1 | Type-F |
| 9 | plan-optimization | Page 9 + Page 10 | 4.1 | Type-E + Type-F |
| 10 | ticket-filter | Page 11 | 4.1 | Type-D |
| 11 | ticket-pricing | Page 12 | 4.1 | Type-E |
| 12 | task-completion | Page 13 | 4.1 | Type-A |
