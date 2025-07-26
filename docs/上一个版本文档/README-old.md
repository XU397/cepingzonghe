# 蒸馒头科学探究任务

这是一个基于React的在线互动探究任务网站，用于帮助学生完成"蒸馒头"科学探究任务。

## 项目结构

```
src/
├── App.jsx                 # 主应用组件
├── main.jsx                # 应用入口
├── assets/                 # 静态资源 (图片, 字体等)
│   └── images/
├── components/             # 可复用的UI组件
│   ├── common/             # 通用基础组件 (Button, Input, Modal等)
│   └── PageRouter.jsx      # 页面路由组件
├── pages/                  # 页面级组件 (对应PRD中的P0-P19)
├── context/                # React Context API 相关
│   ├── AppContext.jsx      # 全局状态管理
│   └── DataLoggerContext.jsx # 数据记录与提交服务
├── services/               # API服务
│   └── apiService.js       # 封装后端API调用
├── styles/                 # 全局样式
│   └── global.css
└── utils/                  # 工具函数
    ├── pageMappings.js     # 页面映射信息
    └── simulationData.js   # 模拟实验数据
```

## 已完成的工作

### 阶段一：项目初始化与核心架构搭建

1. 创建了基本的项目结构
2. 配置了Vite、ESLint和Prettier
3. 实现了全局样式
4. 创建了全局状态管理（AppContext）
5. 实现了数据记录与提交服务（DataLoggerContext）
6. 创建了API服务模块（apiService.js）
7. 实现了页面路由组件（PageRouter.jsx）
8. 创建了页面映射（pageMappings.js）
9. 实现了模拟实验数据（simulationData.js）
10. 创建了通用组件：
    - 导航按钮（NavigationButton.jsx）
    - 计时器（Timer.jsx）
11. 实现了页面组件：
    - 任务开始页面（StartPage.jsx）
    - 注意事项页面（PrecautionsPage.jsx）

### 阶段二：静态页面与基础交互组件开发

1. 开发了P2：蒸馒头任务引入页（IntroductionPage.jsx）
2. 开发了P10：蒸馒头聚焦猜想页（HypothesisFocusPage.jsx）
3. 开发了P13：蒸馒头过渡到模拟实验页（TransitionToSimulationPage.jsx）
4. 开发了P19：蒸馒头任务完成页（Page_19_Task_Completion.jsx）（已完成）

### 阶段三：输入型页面开发

1. 开发通用文本输入组件（TextInput.jsx）（已完成）
2. 开发P3：对话与提出问题页（Page_03_Dialogue_Question.jsx）（已完成）
3. 开发P11：方案设计测量方法构思页（Page_11_Solution_Design_Measurement_Ideas.jsx）（已完成）
4. 开发P12：方案评估测量方法评价页（Page_12_Solution_Evaluation_Measurement_Critique.jsx）（已完成）

### 阶段四：资料阅读与选择页面开发

1. 开发通用模态框组件（Modal.jsx）（已完成）
2. 开发P5-P9的资料内容组件（已完成）
   - 蒸馒头全流程（MaterialProcess.jsx）
   - 发酵原理趣话（MaterialPrinciple.jsx）
   - 发酵技巧讲堂（MaterialTechniques.jsx）
   - 发酵问题讨论（MaterialDiscussion.jsx）
   - 酵母用量秘籍（MaterialYeastDosage.jsx）
3. 开发P4：资料阅读与因素选择页（Page_04_Material_Reading_Factor_Selection.jsx）（已完成）

### 阶段五：模拟实验核心功能与页面开发（已完成）

1. 开发量筒视觉组件（`MeasuringCylinder.jsx`）（已完成）
2. 开发模拟实验控制组件（`SimulationControls.jsx`）（已完成）
3. 开发模拟实验主环境组件（`InteractiveSimulationEnvironment.jsx`）（已完成）
4. 开发通用单选按钮组件（`RadioButtonGroup.jsx`）（已完成）
5. 开发P14-P17的模拟实验页面（已完成）
   - P14：模拟实验界面介绍与自由探索（`Page_14_Simulation_Intro_Exploration.jsx`）（已完成）
   - P15：模拟实验问题1（`Page_15_Simulation_Question_1.jsx`）（已完成）
   - P16：模拟实验问题2（`Page_16_Simulation_Question_2.jsx`）（已完成）
   - P17：模拟实验问题3（`Page_17_Simulation_Question_3.jsx`）（已完成）

### 阶段六：方案选择页面开发（已完成）

1. 开发P18：方案选择页面（`Page_18_Solution_Selection.jsx`）（已完成）

### 阶段七：登录页面开发（已完成）

1. 开发登录页面组件（`LoginPage.jsx`）（已完成）
2. 实现真实API登录接口（`apiService.js`）（已完成）
3. 添加认证状态管理（`AppContext.jsx`）（已完成）
4. 实现受保护路由逻辑（`PageRouter.jsx`）（已完成）
5. 添加登录页面样式（`global.css`）（已完成）
6. 配置密码公钥加密（`jsencrypt.ts`）（已完成）

## 即将开展的工作

### 阶段八：整体联调、样式美化与测试

1. 步骤 8.1: 整体流程串联测试。（已完成）
2. 步骤 8.2: UI样式统一与美化。（已完成）
3. 步骤 8.3: 数据记录与提交完整性测试。
4. 步骤 8.4: 规则与约束条件测试。
5. 步骤 8.5: 40分钟总时长限制与自动提交通能测试。
6. 步骤 8.6: API错误处理测试。
7. 步骤 8.7: 浏览器兼容性初步测试。

## 登录页面开发规范(增加内容，现在进行)

本规范旨在指导AI或开发人员完成项目登录页面的开发。

### 1. 后端API信息

-   **后端服务地址**: `http://117.72.14.166:9002`
-   **API基础URL**: `/stu`
-   **登录接口**:
    -   **路径**: `/stu/login` 
    -   **方法**: `GET`
    -   **请求体 (Request Body)**: JSON格式，包含用户标识（如学号/用户名）和密码。公钥使用jsencryps.ts
        ```json
        {
           "userId": "accountName",
          "accountPass": "公钥加密"，"type":2
        }
        ```
    -   **成功响应 (Success Response)**: JSON格式，认证信息如下。
        ```json
        {"code":200,"msg":"成功","obj":{"batchCode":"250619","examNo":"10015","pageNum":"12","pwd":"1234","schoolCode":"24146","schoolName":"成都市新都区龙安小学校（中心）","studentCode":"","studentName":"7年级测试71","url":"/seven-grade"}}
        ```
        (具体字段请与后端确认)
    -   **失败响应 (Error Response)**: JSON格式，包含错误信息。例如:
        ```json
        {
          "success": false,
          "message": "用户名或密码错误"
        }
        ```

### 2. 登录页面组件 (`LoginPage.jsx`)

-   **位置**: `src/pages/LoginPage.jsx`
-   **功能**:
    -   提供输入框供用户输入账号（如学号/用户名）和密码。
    -   提供"登录"按钮。
    -   点击登录按钮后，调用 `apiService.js` 中的登录函数与后端交互。
    -   根据API返回结果：
        -   成功：将认证信息（如token、用户信息）存储到 `AppContext`，并导航到任务开始页面 (`StartPage.jsx` 或 PRD P0 对应的页面)。
        -   失败：在页面上显示错误提示信息。
-   **UI/UX**:
    -   页面应居中显示登录表单。
    -   包含项目Logo或标题。
    -   输入框和按钮样式应与项目现有风格保持一致（参考 `global.css` 和现有通用组件）。
    -   提供清晰的加载状态提示（例如，登录按钮禁用并显示加载动画）。

### 3. API服务 (`apiService.js`)

-   **位置**: `src/services/apiService.js`
-   **修改**:
    -   新增一个名为 `loginUser` (或类似名称) 的异步函数。
    -   该函数接收用户凭证（如 `userId`, `password`）作为参数。
    -   内部使用 `fetch` 或 `axios` (如果项目中已引入) 发送 `POST` 请求到 `http://117.72.14.166:9002/stu/login`。
    -   设置请求头 `Content-Type: application/json`。
    -   返回后端响应的Promise。
    -   应包含基本的错误处理逻辑。

    ```javascript
    // src/services/apiService.js 示例片段
    const API_BASE_URL = '[http://117.72.14.166:9002/stu](http://117.72.14.166:9002/stu)';

    export const loginUser = async (credentials) => {
      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(credentials),
        });
        if (!response.ok) {
          // 如果HTTP状态码表示错误，尝试解析错误信息体
          const errorData = await response.json().catch(() => ({ message: '登录失败，请稍后再试' }));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error("Login API error:", error);
        // 重新抛出错误，以便UI层可以捕获并显示给用户
        // 可以根据具体错误类型定制错误消息
        throw error;
      }
    };

    // 其他已有的API函数...
    ```

### 4. 全局状态管理 (`AppContext.jsx`)

-   **位置**: `src/context/AppContext.jsx`
-   **修改**:
    -   在 `AppState` (或类似的状态对象) 中添加以下字段：
        -   `isAuthenticated` (布尔值, 初始为 `false`)
        -   `authToken` (字符串, 初始为 `null` 或空字符串)
        -   `currentUser` (对象, 初始为 `null`，用于存储用户信息)
    -   提供更新这些状态的函数，例如：
        -   `handleLoginSuccess(token, userData)`: 更新 `isAuthenticated`, `authToken`, `currentUser`。可以考虑将token存储到localStorage或sessionStorage以实现持久登录。
        -   `handleLogout()`: 清除认证状态和用户信息，并从localStorage/sessionStorage中移除token。
    -   将这些状态和函数通过Context Provider暴露给子组件。

### 5. 页面路由 (`PageRouter.jsx` 或 `App.jsx`)

-   **位置**: `src/components/PageRouter.jsx` (或 `App.jsx` 中处理路由的地方)
-   **修改**:
    -   添加 `/login` 路由，指向 `LoginPage` 组件。
    -   考虑将 `/login` 设置为应用的初始路由，如果用户未认证。
    -   实现受保护路由：对于需要登录才能访问的页面（如 `StartPage` 及后续任务页面），在渲染前检查 `AppContext` 中的 `isAuthenticated` 状态。如果未认证，则重定向到 `/login` 页面。
    -   登录成功后，应从 `LoginPage` 导航到应用的主页面（例如 `StartPage`）。

### 6. 样式

-   遵循项目已有的样式规范。
-   可复用的样式（如表单、按钮）应考虑添加到 `global.css` 或创建新的通用CSS模块。
-   推荐使用Tailwind CSS（如果项目中已配置并使用）或CSS Modules来管理组件级样式，以避免样式冲突。

### 7. 错误处理与用户反馈

-   在 `LoginPage.jsx` 中清晰地向用户展示登录失败的原因（例如，"用户名或密码错误"，"网络请求失败"）。
-   在API调用期间，应有加载指示（例如，按钮禁用，显示加载图标）。

### 8. 安全提示

-   **前端不存储明文密码。**
-   密码采用公钥加密，公钥文件：jsencrypts.ts。


## 启动项目

```bash
# 安装依赖
npm install

# 开发环境运行
npm run dev

# 构建项目
npm run build

# 预览构建结果
npm run preview
``` 