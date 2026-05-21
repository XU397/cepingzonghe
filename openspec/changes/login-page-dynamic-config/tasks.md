## 1. 配置模型与 API 基础设施

- [x] 1.1 创建 `src/shared/services/loginPageConfig/types.ts` — 定义 `LoginPageConfig` 接口（logo、title、loginBoxTitle、password 字段）
- [x] 1.2 创建 `src/shared/services/loginPageConfig/defaultConfig.ts` — 内置默认配置常量，匹配当前硬编码登录页内容
- [x] 1.3 创建 `src/shared/services/loginPageConfig/api.ts` — 实现 `fetchLoginPageConfig()` 函数，调用 `GET /stu/api/login-page-config/active`，处理成功/空/失败三种响应
- [x] 1.4 创建 `src/shared/services/loginPageConfig/cache.ts` — 实现 localStorage 缓存读写（键名 `hci-login-page-config`，存储 cacheVersion/config/cachedAt）
- [x] 1.5 创建 `src/shared/services/loginPageConfig/index.ts` — 统一导出 `useLoginPageConfig` hook（组合 API + 缓存 + 默认配置 + 优先级链）

## 2. Mock 模式支持

- [x] 2.1 在 `vite.config.js` 的 `mockStuApi` 插件中新增 `/stu/api/login-page-config/active` 拦截规则，返回模拟配置（`password.hidden: true`）

## 3. 登录页改造

- [x] 3.1 改造 `src/pages/LoginPage.jsx` — 引入 `useLoginPageConfig` hook，mount 时异步拉取配置，state 管理有效配置
- [x] 3.2 改造 Logo 区域（`<header>.login-logo-container`）— 根据 `logo.displayType` 条件渲染 `<img className="login-header-logo">` 和/或 `<span>`，根据 `logo.position` 追加 CSS class 到 `.login-logo-container`
- [x] 3.3 改造标题区域（`<section>.login-product-intro`）— 在同一 `<h1 className="login-product-title">` 内：`title.highlightText` 渲染为 `<span className="login-product-highlight">`（保持现有强调色 CSS），`title.mainText` 渲染为 span 外的普通文本节点；`title.subtitleText` 渲染为 `<p className="login-product-subtitle">`，为空时不渲染该节点
- [x] 3.4 改造登录框标题（`<h2 className="login-welcome-title">`）— 用 `config.loginBoxTitle` 替换硬编码文案，空值时使用默认文案
- [x] 3.5 改造密码模式 — 用 `config.password.hidden` 结合 `VITE_PASSWORD_FREE` 控制密码输入框显示；隐藏时提交 `password='1234'`
- [x] 3.6 添加 Logo 图片加载失败处理 — `<img>` `onError` 隐藏图片元素，不影响文字 Logo 和表单

## 4. CSS 适配

- [x] 4.1 在 `src/styles/LoginPage.css` 中新增 logo 位置 class（`login-logo--top-left`、`login-logo--top-center`、`login-logo--top-right`）
- [x] 4.2 确保 logo 区域响应式适配（小屏统一折叠到顶部居中）

## 5. 测试

- [x] 5.1 为 `loginPageConfig/api.ts` 编写单元测试 — 成功响应、空响应、网络失败三种场景
- [x] 5.2 为 `loginPageConfig/cache.ts` 编写单元测试 — 缓存写入、读取、无缓存场景
- [x] 5.3 为 `loginPageConfig/defaultConfig.ts` 编写单元测试 — 验证默认配置字段完整性
- [x] 5.4 为 `useLoginPageConfig` hook 编写测试 — 优先级链（后端 > 缓存 > 默认）
- [x] 5.5 为 LoginPage 组件编写测试 — Logo 展示类型切换、标题动态渲染、密码隐藏模式、配置失败兜底
- [x] 5.6 验收测试 — Mock 模式下完整登录流程（含动态配置）无回归
