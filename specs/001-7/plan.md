# Implementation Plan: 7年级追踪测评 - 蜂蜜黏度探究交互实验模块

**Branch**: `001-7` | **Date**: 2025-01-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-7/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

本模块是HCI-Evaluation平台的新增7年级追踪测评模块,实现"探究蜂蜜黏度"交互式科学探究实验。模块包含23个页面,分为人机交互部分(第0.1-13页)和问卷调查部分(第0.2页+第14-22页),核心功能包括:线性导航系统、模拟实验(落球法测量蜂蜜黏度)、数据可视化(温度/含水量/下落时间关系折线图)、完整的操作日志记录和数据提交。

**技术方案**:复用现有7年级模块(grade-7)的架构模式,采用React 18 + CSS Modules构建独立的模块目录(src/modules/grade-7-tracking/),实现双导航系统(人机交互13页和问卷8页独立计数)、心跳检测机制(防止多设备同时登录)、40分钟+10分钟双计时器管理、以及基于物理模型的小球下落动画。

## Technical Context

**Language/Version**: JavaScript (ES6+) / React 18.2.0
**Primary Dependencies**:
- React 18.2.0 (UI框架)
- Vite 4 (构建工具)
- CSS Modules (样式隔离)
- Lucide Icons (图标库,用于界面元素如量筒、温度计等)

**Storage**:
- 临时存储: 浏览器localStorage (会话级缓存,实验数据和问卷答案)
- 持久存储: 后端API POST /stu/saveHcMark (提交完整MarkObject数据)

**Testing**:
- ESLint (代码质量检查,零警告要求)
- Mock Mode (本地开发测试,通过vite.config.js配置)
- 手动集成测试(与后端API联调)

**Target Platform**:
- Web浏览器: Chrome 90+, Firefox 88+, Edge 90+
- 屏幕分辨率: 1280x720, 1366x768, 1920x1080 (桌面端和平板端横屏)
- 不支持: IE11及以下,移动端竖屏

**Project Type**: Web - 前端单页应用(SPA),嵌入到现有React项目的模块系统中

**Performance Goals**:
- 页面切换速度: <2秒(从点击"下一页"到目标页面可交互)
- 交互响应时间: <100毫秒(文本输入、单选按钮点击的视觉反馈)
- 动画流畅度: 60 FPS(小球下落动画,在Intel i5 8代+ / 8GB RAM+设备上)
- 数据提交成功率: ≥99%(正常网络环境)
- 并发支持: 50名学生同时在线,服务器CPU<70%,内存<80%

**Constraints**:
- 线性导航: 用户只能向前推进,禁用浏览器后退按钮
- 模块隔离: 不能修改其他模块或全局代码,使用CSS Modules防止样式冲突
- 数据契约: 必须遵循MarkObject结构(pageNumber, pageDesc, operationList, answerList, beginTime, endTime, imgList)
- 会话管理: 禁止多设备同时登录,后登录踢掉先登录(需要30秒心跳检测)
- 计时器管理: 40分钟探究任务计时器+10分钟问卷计时器,使用AppContext.startTaskTimer()

**Scale/Scope**:
- 页面数量: 23页(第0.1页+第1-13页+第0.2页+第14-21页+第22页)
- 功能需求: 75个(FR-001 ~ FR-075)
- 模拟实验组合: 20种(4个量筒×5个温度档位)
- 问卷题目: 61题(分布在8页)
- 预计学生完成时间: 40分钟实验+10分钟问卷=50分钟总测评时长

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Module Isolation ✅

**Status**: PASS
**Compliance**:
- 模块目录: `src/modules/grade-7-tracking/` (完全独立)
- CSS策略: 所有样式使用CSS Modules (`*.module.css`),无全局样式污染
- 跨模块通信: 仅通过ModuleRegistry和userContext接口
- 依赖现有模块: 可复用grade-7的公共组件(LeftNavigation, AssessmentPageLayout),但需要抽取到共享目录`src/shared/components/`

**Validation Plan**:
- 文件结构审查: 确保无`../../../other-module`形式的导入
- ESLint规则: 配置`no-restricted-imports`防止跨模块引用
- CSS作用域验证: 所有样式类名包含模块前缀(如`.grade7Tracking_*`)

### II. Standardized Module Contract ✅

**Status**: PASS
**Compliance**:
- `moduleId`: 'grade-7-tracking'
- `displayName`: '7年级追踪测评-蜂蜜黏度探究'
- `url`: '/grade-7-tracking' (已确认,与后端协调一致)
- `version`: '1.0.0'
- `ModuleComponent`: 函数式组件,接收`{ userContext, initialPageId }`
- `getInitialPage(pageNum)`: 映射后端pageNum到内部页面ID(如1→'Page_01_Intro', 14→'Questionnaire_01')

**Validation Plan**:
- ModuleRegistry注册时自动验证接口完整性
- 类型签名检查(可选引入TypeScript类型定义)
- URL唯一性测试(确保不与其他模块冲突)

### III. Data Logging & Submission Protocol ✅

**Status**: PASS
**Compliance**:
- 操作日志: 每个交互调用`logOperation()`(文本输入、选择答案、实验参数)
- 页面生命周期: 记录`page_enter`和`page_exit`事件,包含beginTime和endTime
- 数据提交: 使用`POST /stu/saveHcMark`,FormData封装,mark字段包含JSON.stringify的MarkObject数组
- MarkObject结构: 包含pageNumber, pageDesc, operationList, answerList, beginTime, endTime, imgList(本模块imgList为空数组)

**Validation Plan**:
- 浏览器控制台检查logOperation()调用频率和参数
- 网络面板验证FormData结构和JSON格式
- 后端联调确认数据接收和解析正确

### IV. Linear Navigation Flow ✅

**Status**: PASS
**Compliance**:
- 单向导航: 用户只能点击"下一页"/"继续"等按钮前进
- 禁用后退: 不处理浏览器后退按钮,或显示警告提示
- 导航前置条件: 每页的"下一页"按钮初始灰色不可点击,完成该页任务后启用
- 进度恢复: `getInitialPage(pageNum)`处理后端返回的页码,恢复到正确页面

**特殊要求(本模块)**:
- 双导航系统: 人机交互部分(第1-13页)显示"第X页/共13页",问卷部分(第14-21页)显示"第X页/共8页"
- 过渡页无导航: 第0.1页(注意事项)和第0.2页(问卷说明)不显示页码导航栏

**Validation Plan**:
- 手动测试: 尝试点击浏览器后退按钮,确认无法返回或显示提示
- 导航逻辑测试: 验证每页的启用条件(如第8页需完成至少1次实验)
- 进度恢复测试: 刷新浏览器后验证页面恢复到正确位置

### V. Timer Management & Session Integrity ✅

**Status**: PASS
**Compliance**:
- 全局计时器: 使用`AppContext.startTaskTimer(duration)`,第1页启动40分钟,第14页启动10分钟
- 计时器持久化: 计时器状态存储在模块Context和localStorage,防止刷新丢失
- 到期处理: 40分钟到期→自动保存当前页→跳转第0.2页问卷说明;10分钟到期→自动提交问卷→跳转第22页
- 敏感数据保护: 不在console.log中输出batchCode, examNo等会话信息

**特殊要求(本模块)**:
- 双计时器管理: 探究任务40分钟和问卷10分钟,两个独立计时器
- 倒计时显示: 页面顶部显示"剩余时间 XX:XX"

**Validation Plan**:
- 计时器准确性测试: 验证倒计时与实际时间一致(误差<1秒)
- 刷新测试: 刷新浏览器后验证计时器状态恢复
- 到期测试: 模拟计时器到期,验证自动保存和跳转逻辑
- 敏感数据审查: 代码审查确保无console.log敏感信息

### VI. Error Handling & Resilience ✅

**Status**: PASS
**Compliance**:
- API错误处理: 通过apiService.js统一处理,401错误触发自动登出
- 网络失败: 数据提交失败时显示错误提示,允许重试(最多3次,每次间隔5秒)
- 组件错误: 使用ErrorBoundary包裹整个ModuleComponent
- 验证错误: 内联显示在表单字段旁边(如文本框下方显示"请至少输入10个字符")

**特殊要求(本模块)**:
- 动画降级: 如果浏览器不支持CSS动画,显示静态图片和文字说明
- 多设备登录检测: 每30秒心跳检测,发现会话被踢掉时显示"您的账号已在其他设备登录"提示

**Validation Plan**:
- 网络模拟: 使用浏览器开发工具模拟网络中断,验证重试逻辑
- 错误边界测试: 故意触发React组件错误,验证ErrorBoundary捕获
- 浏览器兼容性: 在旧版浏览器测试动画降级方案

### VII. Code Quality & Testing Standards ✅

**Status**: PASS
**Compliance**:
- ESLint: 所有代码必须通过`npm run lint`,零警告
- React规范: 仅使用函数式组件+Hooks,禁止class组件
- 命名规范: 组件PascalCase,函数/变量camelCase
- Hooks抽取: 复杂逻辑(如实验状态管理、计时器逻辑)抽取为自定义Hooks

**Validation Plan**:
- 提交前: 运行`npm run lint`,确保无警告
- Code Review: 同行审查检查模块隔离、数据契约、导航逻辑、错误处理
- 性能测试: 验证页面切换<2秒,交互响应<100ms

## Project Structure

### Documentation (this feature)

```
specs/001-7/
├── spec.md              # 功能规范 (已完成)
├── checklists/
│   └── requirements.md  # 规范质量检查清单 (已完成)
├── plan.md              # 本文件 (/speckit.plan 输出)
├── research.md          # Phase 0 输出 (本次生成)
├── data-model.md        # Phase 1 输出 (本次生成)
├── quickstart.md        # Phase 1 输出 (本次生成)
├── contracts/           # Phase 1 输出 (本次生成)
│   └── api.yaml         # API契约定义
└── tasks.md             # Phase 2 输出 (/speckit.tasks 命令 - 本次不创建)
```

### Source Code (repository root)

```
src/modules/grade-7-tracking/
├── index.jsx                      # 模块定义和注册
├── config.js                      # 模块配置(moduleId, displayName, url, version)
├── context/                       # 模块级状态管理
│   ├── TrackingContext.jsx       # 主Context (实验数据、问卷答案、页面状态)
│   └── TrackingProvider.jsx      # Context Provider组件
├── pages/                         # 页面组件
│   ├── PrecautionsPage.jsx       # 第0.1页: 注意事项
│   ├── IntroPage.jsx              # 第1页: 蜂蜜的奥秘
│   ├── QuestionPage.jsx           # 第2页: 提出问题
│   ├── ResourcePage.jsx           # 第3页: 资料阅读
│   ├── HypothesisPage.jsx         # 第4页: 假设陈述
│   ├── DesignPage.jsx             # 第5页: 方案设计
│   ├── EvaluationPage.jsx         # 第6页: 方案评估
│   ├── TransitionPage.jsx         # 第7页: 过渡页
│   ├── ExperimentPage.jsx         # 第8页: 模拟实验
│   ├── AnalysisPage1.jsx          # 第9页: 实验分析1
│   ├── AnalysisPage2.jsx          # 第10页: 实验分析2
│   ├── AnalysisPage3.jsx          # 第11页: 实验分析3
│   ├── SolutionPage.jsx           # 第12页: 方案选择
│   ├── SummaryPage.jsx            # 第13页: 任务总结
│   ├── QuestionnaireIntroPage.jsx # 第0.2页: 问卷说明
│   ├── QuestionnairePage1.jsx     # 第14页: 问卷第1部分
│   ├── QuestionnairePage2.jsx     # 第15页: 问卷第2部分
│   ├── QuestionnairePage3.jsx     # 第16页: 问卷第3部分
│   ├── QuestionnairePage4.jsx     # 第17页: 问卷第4部分
│   ├── QuestionnairePage5.jsx     # 第18页: 问卷第5部分
│   ├── QuestionnairePage6.jsx     # 第19页: 问卷第6部分
│   ├── QuestionnairePage7.jsx     # 第20页: 问卷第7部分
│   ├── QuestionnairePage8.jsx     # 第21页: 问卷第8部分
│   └── CompletionPage.jsx         # 第22页: 问卷已完成
├── components/                    # 可复用UI组件
│   ├── layout/
│   │   ├── DualNavigationBar.jsx # 双导航系统 (第1-13页 vs 第14-21页)
│   │   └── PageLayout.jsx         # 页面布局容器
│   ├── experiment/
│   │   ├── BeakerSelector.jsx    # 量筒选择器 (4个量筒,单选)
│   │   ├── TemperatureControl.jsx # 温度控制器 (25-45℃,步进5℃)
│   │   ├── BallDropAnimation.jsx  # 小球下落动画
│   │   └── TimerDisplay.jsx       # 实验计时器显示
│   ├── questionnaire/
│   │   ├── RadioButtonGroup.jsx  # 单选按钮组 (4选项/5选项/10选项)
│   │   └── QuestionBlock.jsx      # 问题陈述+选项容器
│   ├── ui/
│   │   ├── Button.jsx             # 主按钮 (下一页/提交问卷/返回登录)
│   │   ├── Checkbox.jsx           # 复选框 (注意事项、资料阅读)
│   │   ├── TextArea.jsx           # 多行文本输入 (科学问题、理由)
│   │   ├── Modal.jsx              # 模态窗口 (资料内容展示)
│   │   └── CountdownTimer.jsx     # 倒计时组件 (40秒注意事项)
│   └── visualizations/
│       └── LineChart.jsx          # 折线图 (温度/含水量/下落时间关系)
├── hooks/                         # 自定义Hooks
│   ├── useExperiment.js           # 实验状态管理 (量筒、温度、下落时间)
│   ├── useNavigation.js           # 导航逻辑 (启用条件、页面跳转)
│   ├── useDataLogger.js           # 数据日志记录 (logOperation封装)
│   ├── useQuestionnaire.js        # 问卷状态管理 (答案收集、完成度检查)
│   └── useSessionHeartbeat.js     # 会话心跳检测 (每30秒检查会话有效性)
├── styles/                        # CSS Modules
│   ├── PrecautionsPage.module.css
│   ├── ExperimentPage.module.css  # 实验页特殊布局(左侧操作区+右侧说明)
│   ├── QuestionnairePage.module.css
│   └── shared.module.css          # 共享样式(按钮、输入框基础样式)
├── utils/                         # 工具函数
│   ├── physicsModel.js            # 物理模型计算 (含水量+温度→下落时间)
│   ├── pageMapping.js             # 页面映射 (pageNum → pageId)
│   └── validation.js              # 输入验证 (文本长度、必填项检查)
└── assets/                        # 静态资源
    ├── images/
    │   ├── honey.jpg              # 蜂蜜图片
    │   ├── dialogue-bubble.png    # 对话气泡背景
    │   ├── tablet.png             # 平板电脑图形
    │   ├── weather-chart.jpg      # 成都天气图
    │   ├── method-observation.png # 观察法示意图
    │   ├── method-ballfall.png    # 落球法示意图
    │   ├── method-flowrate.png    # 流速法示意图
    │   ├── kids-together.jpg      # 小明和小伙伴图片
    │   ├── beaker-15.png          # 量筒图标(15%)
    │   ├── beaker-17.png          # 量筒图标(17%)
    │   ├── beaker-19.png          # 量筒图标(19%)
    │   ├── beaker-21.png          # 量筒图标(21%)
    │   └── thermometer.png        # 温度计图标
    └── data/
        ├── resources.json         # 第3页资料内容 (蜂蜜酿造流程等5篇)
        └── questionnaire.json     # 问卷题目和选项 (61题)

src/shared/components/             # 从grade-7抽取的公共组件
├── LeftNavigation.jsx             # 左侧页码导航栏 (需修改支持双导航)
├── AssessmentPageLayout.jsx      # 评估页面布局容器
└── GlobalTimer.jsx                # 全局计时器组件

src/modules/ModuleRegistry.js      # 需要新增grade-7-tracking模块注册
```

**Structure Decision**:
本模块采用**单一React项目**结构,作为现有HCI-Evaluation平台的新增模块。模块完全独立在`src/modules/grade-7-tracking/`目录下,遵循与grade-4和grade-7相同的目录组织模式:
- **pages/**: 23个页面组件,一一对应功能规范中的页面定义
- **components/**: 按功能分类(layout, experiment, questionnaire, ui, visualizations),提高组件复用性
- **hooks/**: 5个自定义Hooks封装复杂业务逻辑,保持组件简洁
- **context/**: 模块级状态管理,避免全局Redux
- **styles/**: CSS Modules确保样式隔离,防止污染其他模块

与现有模块的主要差异:
- **双导航系统**: 需要修改共享组件`LeftNavigation.jsx`支持两种计数模式
- **模拟实验交互**: 新增experiment/目录的组件,实现量筒选择、温度控制、小球动画
- **折线图可视化**: 新增visualizations/目录,实现数据可视化需求

## Complexity Tracking

*本模块无Constitution违规,无需填写此部分*

**理由**:
- 模块隔离: grade-7-tracking完全独立,无跨模块依赖
- 技术栈: 严格遵守React 18 + CSS Modules + Vite 4约束
- 数据契约: 使用标准MarkObject结构提交数据
- 导航模式: 线性导航,符合平台规范
- 唯一复杂度: 双导航系统,但通过抽取共享组件`LeftNavigation.jsx`解决,不引入新的架构模式

---

## Backend Configuration Agreement

**前后端约定 - 登录路由配置**

### 1. Module URL Path (模块路由路径)

**约定的 URL**: `/grade-7-tracking`

**理由**:
- ✅ 语义清晰 - 一看就知道是7年级追踪测评模块
- ✅ 与 moduleId 一致 - `'grade-7-tracking'`
- ✅ 与模块目录对应 - `src/modules/grade-7-tracking/`
- ✅ 便于扩展 - 未来可添加 `/grade-8-tracking` 等保持命名规范
- ✅ 避免冲突 - 不与现有模块URL冲突 (已有: `/seven-grade`, `/four-grade`)

**ModuleConfig 配置** (前端):
```javascript
// src/modules/grade-7-tracking/index.jsx
export const Grade7TrackingModule_Definition = {
  moduleId: 'grade-7-tracking',
  displayName: '7年级追踪测评-蜂蜜黏度探究',
  url: '/grade-7-tracking',  // 🔑 关键：与后端返回的 URL 必须完全匹配 (区分大小写)
  version: '1.0.0',
  ModuleComponent: Grade7TrackingModule,
  getInitialPage: (pageNum) => { /* ... */ }
};
```

**URL匹配规则**:
- 后端登录响应中的 `url` 字段必须精确匹配前端 ModuleConfig 中的 `url` 值
- URL路径区分大小写 (推荐使用小写+连字符命名规范)
- URL必须以 `/` 开头,不能以 `/` 结尾
- ModuleRegistry会自动验证URL唯一性,防止注册冲突

**开发测试方案**:
开发阶段可通过以下方式测试模块URL和页面恢复功能:

1. **方式1: URL参数模拟** (推荐用于快速页面跳转测试)
   ```
   http://localhost:3000/?moduleUrl=/grade-7-tracking&pageNum=8
   ```
   - 适用场景: 快速测试特定页面,无需真实登录
   - 优点: 可直接跳转到任意页面,方便调试单个页面
   - 缺点: 不包含真实会话信息(batchCode, examNo等),部分数据提交功能可能受限

2. **方式2: SessionStorage模拟** (推荐用于完整流程测试)
   ```javascript
   // 在浏览器控制台执行
   sessionStorage.setItem('authInfo', JSON.stringify({
     examNo: 'DEV_TEST_001',
     batchCode: 'DEV_BATCH_2025',
     url: '/grade-7-tracking',
     pageNum: '1',
     studentName: '测试学生',
     schoolName: '开发环境学校'
   }));
   window.location.reload();
   ```
   - 适用场景: 模拟完整登录状态,测试数据提交和会话管理
   - 优点: 包含完整会话信息,可测试数据提交和心跳检测
   - 缺点: 需要手动构造JSON,操作相对复杂

3. **方式3: Mock API登录** (推荐用于集成测试)
   ```bash
   # 确保 .env 中配置了 VITE_USE_MOCK=1
   # 修改 vite.config.js 中的 mock handler,返回 grade-7-tracking 模块URL
   ```
   修改 `vite.config.js` 第33行:
   ```javascript
   url: '/grade-7-tracking'  // 改为 grade-7-tracking 模块
   ```
   然后正常登录测试:
   ```
   http://localhost:3000/login
   用户名: 任意  密码: 任意
   ```
   - 适用场景: 模拟真实登录流程,测试完整用户体验
   - 优点: 最接近真实使用场景,可测试登录到退出的完整流程
   - 缺点: 需要修改配置文件,切换回其他模块时需要再次修改

**URL测试验证清单**:
- [ ] ModuleRegistry 正确注册 grade-7-tracking 模块 (检查控制台日志)
- [ ] URL `/grade-7-tracking` 不与其他模块冲突 (检查 getAllUrlMappings() 输出)
- [ ] 方式1 (URL参数) 可以正确加载模块和指定页面
- [ ] 方式2 (SessionStorage) 可以模拟完整会话,数据提交正常
- [ ] 方式3 (Mock登录) 可以正常登录并跳转到模块首页
- [ ] 页面刷新后能恢复到正确页码 (测试 getInitialPage 函数)
- [ ] 无效 pageNum 参数能正确回退到默认首页 (如 pageNum=999)

### 2. Login Response Contract (登录响应契约)

**后端登录接口**: `POST /stu/login`

**成功响应示例** (跳转到7年级追踪测评模块) - ✅ 后端已确认:
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "batchCode": "375186",          // 评价批次
    "studentCode": "xxx",            // 学籍号
    "examNo": "xxx",                 // 考生号
    "studentName": "xxx",            // 学生姓名
    "schoolCode": "5101140006",      // 学校编码
    "schoolName": "蚕丛路小学",      // 学校名称
    "classCode": "xxx",              // 班级
    "url": "/grade-7-tracking",      // 🔑 关键：前端路由URL
    "pageNum": "1"                   // 🔑 关键：起始页面编号（支持小数）
  }
}
```

**页面恢复场景** (学生刷新浏览器或重新登录) - ✅ 后端已确认:
```json
{
  "code": 200,
  "msg": "登录成功",
  "data": {
    "batchCode": "375186",
    "studentCode": "xxx",
    "examNo": "xxx",
    "studentName": "xxx",
    "schoolCode": "5101140006",
    "schoolName": "蚕丛路小学",
    "classCode": "xxx",
    "url": "/grade-7-tracking",
    "pageNum": "3.5"                 // 🔑 恢复到上次进度（支持小数页码，如 "3.5"）
  }
}
```

**后端存储说明**:
- `pageNum` 在后端存储格式：页码 × 100（如 `"3.5"` 存储为 `350`）
- 前端接收到的 `pageNum` 为字符串格式（如 `"3.5"`），直接使用即可
- 支持小数页码，对应过渡页（如 `"0.1"`, `"0.2"`）

### 3. Page Number Mapping (页面编号映射)

**后端 `pageNum` 字段说明**:

| pageNum 值 | 对应页面 | 前端页面ID | 说明 |
|-----------|---------|-----------|------|
| `"0.1"` | 注意事项 | `Page_00_Precautions` | 过渡页（无导航栏） |
| `"1"` | 蜂蜜的奥秘 | `Page_01_Intro` | 人机交互第1页（共13页） |
| `"2"` | 提出问题 | `Page_02_Question` | 人机交互第2页 |
| `"3"` | 资料阅读 | `Page_03_Resource` | 人机交互第3页 |
| `"4"` | 假设陈述 | `Page_04_Hypothesis` | 人机交互第4页 |
| `"5"` | 方案设计 | `Page_05_Design` | 人机交互第5页 |
| `"6"` | 方案评估 | `Page_06_Evaluation` | 人机交互第6页 |
| `"7"` | 过渡页 | `Page_07_Transition` | 人机交互第7页 |
| `"8"` | 模拟实验 | `Page_08_Experiment` | 人机交互第8页（核心页） |
| `"9"` | 实验分析1 | `Page_09_Analysis1` | 人机交互第9页 |
| `"10"` | 实验分析2 | `Page_10_Analysis2` | 人机交互第10页 |
| `"11"` | 实验分析3 | `Page_11_Analysis3` | 人机交互第11页 |
| `"12"` | 方案选择 | `Page_12_Solution` | 人机交互第12页 |
| `"13"` | 任务总结 | `Page_13_Summary` | 人机交互第13页（最后一页） |
| `"0.2"` | 问卷说明 | `Questionnaire_00_Intro` | 过渡页（无导航栏） |
| `"14"` | 问卷第1部分 | `Questionnaire_01` | 问卷第1页（共8页） |
| `"15"` | 问卷第2部分 | `Questionnaire_02` | 问卷第2页 |
| `"16"` | 问卷第3部分 | `Questionnaire_03` | 问卷第3页 |
| `"17"` | 问卷第4部分 | `Questionnaire_04` | 问卷第4页 |
| `"18"` | 问卷第5部分 | `Questionnaire_05` | 问卷第5页 |
| `"19"` | 问卷第6部分 | `Questionnaire_06` | 问卷第6页 |
| `"20"` | 问卷第7部分 | `Questionnaire_07` | 问卷第7页 |
| `"21"` | 问卷第8部分 | `Questionnaire_08` | 问卷第8页（最后一页） |
| `"22"` | 问卷已完成 | `Page_22_Completion` | 结束页 |

**前端映射实现** (`src/modules/grade-7-tracking/utils/pageMapping.js`):
```javascript
export function getInitialPage(pageNum) {
  const mapping = {
    '0.1': 'Page_00_Precautions',
    '1': 'Page_01_Intro',
    '2': 'Page_02_Question',
    // ... 其他页面映射
    '22': 'Page_22_Completion'
  };
  return mapping[pageNum] || 'Page_00_Precautions'; // 默认跳转注意事项页
}
```

### 4. Backend Database Configuration (后端数据库配置)

**任务表配置示例** (`t_assessment_task` 表):
```sql
INSERT INTO t_assessment_task (task_code, task_name, module_url, total_pages, duration_minutes)
VALUES ('HONEY_2025', '7年级追踪测评-蜂蜜黏度探究', '/grade-7-tracking', 23, 50);
```

**学生任务关联表** (`t_student_task` 表):
```sql
INSERT INTO t_student_task (student_id, task_code, current_page, status)
VALUES (1001, 'HONEY_2025', '1', 'IN_PROGRESS');
```

**登录逻辑伪代码** (后端):
```python
def login(student_code, password):
    # 1. 验证学生账号密码
    student = authenticate(student_code, password)

    # 2. 查询学生当前任务
    task = get_current_task(student.id)

    # 3. 获取任务进度
    progress = get_task_progress(student.id, task.task_code)

    # 4. 返回登录响应
    return {
        "code": 200,
        "data": {
            "examNo": student_code,
            "batchCode": task.batch_code,
            "url": task.module_url,        # 🔑 从数据库读取模块URL
            "pageNum": progress.current_page,  # 🔑 从进度表读取当前页码
            "studentName": student.name
        }
    }
```

### 5. Testing Agreement (测试约定)

**开发阶段** (详见第1节"开发测试方案"):
- 前端开发者可以通过 URL 参数手动测试不同页面
- 或者在浏览器控制台直接设置 sessionStorage
- 或者修改 Mock API 配置模拟真实登录

**集成测试阶段**:
- 后端提供测试账号和对应的任务分配
- 前端验证登录后能正确跳转到 `/grade-7-tracking` 模块
- 前端验证页面恢复逻辑（刷新浏览器后回到正确页码）

### 6. Coordination Checklist (协调检查清单)

**前端需要确认**:
- [x] ModuleConfig 中的 `url` 字段设置为 `/grade-7-tracking`
- [x] 在 ModuleRegistry.js 中注册新模块
- [x] 实现 `getInitialPage(pageNum)` 页面映射函数
- [x] 测试 ModuleRouter.jsx 能正确匹配 `/grade-7-tracking` URL
- [x] 验证URL参数测试方案 (通过 `?moduleUrl=/grade-7-tracking&pageNum=1` 访问)

**后端需要确认**:
- [ ] 数据库任务表中配置 `module_url = '/grade-7-tracking'`
- [ ] 登录接口返回的 `data.url` 字段值为 `/grade-7-tracking`
- [ ] 确认 `pageNum` 字段支持字符串格式（如 `"0.1"`, `"1"`, `"14"` 等）
- [ ] 实现进度恢复逻辑（记录学生当前页码）

**双方联调时确认**:
- [ ] 登录成功后前端能正确跳转到 `/grade-7-tracking` 模块
- [ ] 页面恢复功能正常（刷新浏览器后回到上次页码）
- [ ] 数据提交接口 `POST /stu/saveHcMark` 能正确接收 MarkObject 数据

---

## Phase 0: Research & Decision Making

*Phase 0 artifacts will be generated by research agents. See research.md for consolidated findings.*

### Research Topics

1. **物理模型参数确认**
   - 问题: 蜂蜜黏度与含水量、温度的关系公式
   - 需要研究: 简化的物理模型(适合中学生认知水平),确保小球下落时间计算合理
   - 输出: physicsModel.js中的计算公式和参数表

2. **小球下落动画实现方案**
   - 问题: CSS动画 vs JavaScript动画 vs Canvas/SVG
   - 需要研究: 性能(60 FPS)、浏览器兼容性、降级方案
   - 输出: BallDropAnimation.jsx的技术选型

3. **折线图可视化库选择**
   - 问题: Chart.js vs Recharts vs D3.js vs 自定义SVG
   - 需要研究: 包大小、React集成度、定制化能力
   - 输出: LineChart.jsx的依赖选择

4. **心跳检测机制设计**
   - 问题: 轮询间隔(30秒)是否合理,如何检测会话失效
   - 需要研究: 后端Session管理机制,前端检测时机(页面可见性API)
   - 输出: useSessionHeartbeat.js的实现策略

5. **双导航系统实现模式**
   - 问题: 如何让LeftNavigation组件支持两种计数模式(第X页/共13页 vs 第X页/共8页)
   - 需要研究: Props设计(navigationMode: 'experiment' | 'questionnaire')、页码映射逻辑
   - 输出: DualNavigationBar.jsx或增强版LeftNavigation.jsx

---

## Phase 1: Design & Contracts

*Phase 1 artifacts will be generated after research.md is complete. See data-model.md, /contracts/, and quickstart.md for deliverables.*

### Expected Outputs

1. **data-model.md**: 数据实体定义
   - ExperimentSession: 实验会话状态
   - ExperimentTrial: 单次实验试验记录
   - QuestionnaireAnswer: 问卷答案
   - StudentResponse: 文本输入回答
   - MarkObject: 数据提交结构

2. **contracts/api.yaml**: API契约
   - POST /stu/saveHcMark: 数据提交端点(FormData + JSON)
   - (可选)GET /stu/checkSession: 心跳检测端点

3. **quickstart.md**: 开发快速启动指南
   - 本地环境搭建(PNPM安装、Mock模式启动)
   - 模块注册步骤
   - 关键文件说明
   - 常见问题排查

---

## Phase 2: Task Breakdown

*Phase 2 is handled by `/speckit.tasks` command - NOT part of `/speckit.plan` output.*

Phase 2 will generate `tasks.md` with a dependency-ordered list of implementation tasks, grouped by:
- Module setup & registration
- Page components (23页)
- UI components (实验、问卷、布局)
- Hooks & utilities
- Styling & assets
- Testing & validation

---

## Notes

- 本计划基于功能规范[spec.md](spec.md)和项目章程[constitution.md](../../.specify/memory/constitution.md)生成
- 所有路径均为绝对路径,基于项目根目录`d:\myproject\cp`
- Phase 0和Phase 1的详细输出将在执行相应研究和设计任务后生成
- 双导航系统(FR-001a/FR-001b)和会话管理(FR-073/FR-074/FR-075)是本模块的关键差异点,需要在Phase 0深入研究
