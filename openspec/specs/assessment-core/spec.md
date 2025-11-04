# 评测平台核心规格（Assessment Core Spec）

本规格定义平台层面的核心行为与数据契约，覆盖登录路由、页面恢复、计时与导航、数据提交、错误处理与问卷处理。用于指导各模块一致实现与跨模块复用。

## Requirements

### Requirement: 登录成功后按后端指示进入对应模块与页面
平台在登录成功后 MUST 根据后端返回的 `url` 与 `pageNum` 选择模块并恢复到目标页面。

#### Scenario: 选择模块与计算初始页面
- GIVEN 后端返回 `{ url: '/seven-grade', pageNum: '13' }`
- WHEN 前端调用 `ModuleRegistry.getModuleByUrl(url)` 获取模块，并调用该模块的 `getInitialPage(pageNum)`
- THEN 平台进入模块并渲染 `getInitialPage` 对应的页面组件
- AND 持久化 `core.module/url` 与 `core.page/pageNum`

### Requirement: 刷新页面后停留在当前页且计时器不中断
平台在刷新后 MUST 保持当前页面不变，并按离线时间扣减后继续倒计时。

#### Scenario: 刷新后跨秒恢复
- GIVEN 已持久化 `core.page/currentPageId`、`core.timer/taskStartTime`、`core.timer/remainingTime`
- WHEN 用户刷新页面
- THEN 平台计算预期结束时间并更新剩余秒数
- AND 渲染 `currentPageId` 对应页面，倒计时继续

### Requirement: 每次“下一页”操作前提交当前页数据
平台 MUST 在导航到下一页之前提交当前页的 `MarkObject` 数据；提交失败时默认阻止导航（DEV 下可放行）。

#### Scenario: 成功提交后导航
- GIVEN 用户点击“下一页”，当前页存在操作或答案
- WHEN 平台构建 `MarkObject` 并调用 `submitPageMarkData`
- THEN 返回成功，自动追加 `page_exit` 操作并导航到目标页

#### Scenario: 提交失败（非 401）
- GIVEN 网络抖动导致提交失败
- WHEN 平台完成指数退避重试后仍失败
- THEN 显示错误提示并阻止导航（DEV 可放行），留在当前页

### Requirement: 会话过期（401）统一处理并回到登录页
平台 MUST 在检测到 401 或业务判定的会话过期时，执行集中清理并返回登录页。

#### Scenario: 401 错误
- GIVEN 提交接口返回 401 或响应体 `code===401`
- WHEN 平台调用集中式 `handleSessionExpired`
- THEN 清空本地状态与命名空间键，并重定向到登录页

### Requirement: 主任务与问卷计时器与超时跳转
平台 MUST 提供主任务与问卷两类计时器；到时自动跳转各自的最后页（总结/完成）。

#### Scenario: 主任务到期
- GIVEN 主任务计时已启动且剩余秒数降为 0
- WHEN 处于交互（experiment）阶段且未进入总结/完成页
- THEN 自动导航到该子模块总结/完成页，并记录超时与跳转操作

#### Scenario: 问卷到期
- GIVEN 问卷计时已启动且剩余秒数降为 0
- WHEN 处于问卷（questionnaire）阶段且未进入问卷完成页
- THEN 自动导航到问卷完成页，并记录超时与跳转操作

### Requirement: 标准化 MarkObject 结构（数据提交契约）
平台 MUST 使用统一的 MarkObject 结构提交页面数据。

#### Scenario: MarkObject 字段
- GIVEN 平台准备提交页面数据
- THEN MarkObject 包含：
  - `pageNumber: string`
  - `pageDesc: string`
  - `operationList: Array<{ code:number, targetElement:string, eventType:string, value:string, time:string }>`
  - `answerList: Array<{ code:number, targetElement:string, value:string }>`
  - `beginTime: string(YYYY-MM-DD HH:mm:ss)`
  - `endTime: string(YYYY-MM-DD HH:mm:ss)`
  - `imgList: Array<any>`（可为空）

### Requirement: 操作日志与页面进入/退出记录
平台 MUST 在页面进入与离开时记录操作日志，以便数据可追溯。

#### Scenario: 页面进入/退出
- GIVEN 进入页面 `P`
- WHEN 页面挂载/卸载或导航切换
- THEN 记录 `page_enter` 与 `page_exit` 操作；`time` 为格式化时间戳

### Requirement: 问卷页面的答案收集与提交流程
问卷页 MUST 将所选项映射到 `answerList` 中，并与操作日志一起随 MarkObject 提交。

#### Scenario: 问卷提交
- GIVEN 问卷页 `Qn` 用户完成选择
- WHEN 点击“下一页”
- THEN 构建包含问卷答案的 `answerList` 并提交

### Requirement: 统一的页面映射与页面标题
平台 MUST 维护 `pageNum → pageId → pageInfo` 的稳定映射，并提供必要工具（如 `getTargetPageIdFromPageNum`）。

#### Scenario: 页面恢复
- GIVEN 后端返回 `pageNum=n`
- WHEN 调用 `getTargetPageIdFromPageNum(n)`
- THEN 返回稳定的 `pageId`；若超出范围，返回“注意事项页”作为默认页

### Requirement: 本地状态与账号隔离
平台 MUST 在恢复时校验账号一致性，避免旧账号残留污染现账号状态。

#### Scenario: 账号切换
- GIVEN localStorage 有上一账号的状态
- WHEN 检测到 `examNo` 不一致
- THEN 清理旧命名空间并用当前账号建立新状态

### Requirement: 开发模式辅助能力
平台 SHOULD 在开发模式提供模块选择器与调试浮标；生产模式不暴露。

#### Scenario: 开发模块选择器
- GIVEN 开发环境（`import.meta.env.DEV===true`）
- WHEN 渲染登录页
- THEN 显示“开发模块选择器”，可一键注入 `{ url, pageNum }` 并进入对应模块

## 默认参数与阈值
- 主任务计时：40 分钟（2400 秒）
- 问卷计时：10 分钟（600 秒）
- 注意事项：常用 40 秒（可按模块配置）
- 计时 UI：< 5 分钟进入警告态，< 60 秒进入严重态（可按模块配置）

## 合规性与范围说明
- 本规格为平台统一规则的基线，模块应实现与之对齐。
- 已知差异：四年级模块当前不具备“计时跨刷新恢复/到期自动跳转/401 回登录”的完整实现，后续通过变更提案接入统一计时与统一提交以对齐本规范。

