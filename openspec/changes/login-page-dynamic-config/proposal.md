## Why

管理后台新增"测评登录页面管理"功能后，监测前端登录页目前所有文案、Logo、标题均为硬编码。需要从后端读取当前激活配置，实现登录页 Logo、标题、登录框标题的动态渲染，以及密码输入框的按需隐藏。当前 `VITE_PASSWORD_FREE` 环境变量控制免密模式，但无法按批次/测评灵活切换。动态配置让管理后台运营人员能按需调整登录页展示，无需前端重新部署。

## What Changes

- 新增 `GET /stu/api/login-page-config/active` API 接入，登录页初始化时异步拉取配置
- 新增 `LoginPageConfig` 类型定义和内置默认配置（与当前硬编码内容一致）
- Logo 区域支持 `none / image / text / image_text` 四种展示类型和 `top_left / top_center / top_right` 三种位置
- 标题区域支持 `highlightText`（独立 CSS class）、`mainText`、`subtitleText` 动态渲染
- 登录框标题由配置 `loginBoxTitle` 驱动，替代当前硬编码文案
- 密码输入框根据 `password.hidden` 配置动态隐藏；隐藏时提交自动使用默认密码 `1234`（与现有 `VITE_PASSWORD_FREE` 行为一致）
- 新增 localStorage 缓存策略：接口成功时缓存配置，失败时读取缓存兜底，缓存也不存在时使用内置默认配置
- 所有后端文本按纯文本渲染，不使用 `innerHTML`
- Logo 图片加载失败时降级处理，不阻塞登录

## Capabilities

### New Capabilities

- `login-page-config`: 登录页配置模型、API 客户端、缓存策略、默认配置、容错降级逻辑
- `login-page-dynamic-render`: Logo 区域动态渲染、标题区域动态渲染、登录框标题动态渲染、密码隐藏模式、CSS class 适配

### Modified Capabilities

- `security`: 登录页新增外部配置文本渲染，需确保纯文本输出、不注入 HTML/CSS/脚本（补充安全约束）
- `routing`: 登录页初始化流程新增异步配置读取步骤，需保证配置加载不阻塞页面渲染

## Impact

- **直接修改文件：** `src/pages/LoginPage.jsx`、`src/styles/LoginPage.css`
- **新增文件：** 配置类型定义、API 客户端、默认配置常量（约 3-4 个新文件）
- **API 依赖：** 新增 `GET /stu/api/login-page-config/active`（未认证可调用）
- **Mock 模式：** `vite.config.js` 需新增 Mock 拦截规则
- **兼容性：** 现有 `VITE_PASSWORD_FREE` 环境变量模式作为 `password.hidden=true` 的等价行为保留；配置优先级为：后端配置 > localStorage 缓存 > 内置默认配置
- **现有登录逻辑不受影响：** 登录接口、账号校验、验证码、批次跳转逻辑保持不变
