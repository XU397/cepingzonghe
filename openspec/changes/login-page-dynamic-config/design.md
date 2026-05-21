## Context

当前登录页 (`src/pages/LoginPage.jsx`) 所有展示内容硬编码，需要替换的区域及精确 DOM 映射：

**Logo 区域** — `<header className="login-header">` 内的 `.login-logo-container > img.login-header-logo`：
- 顶部蓝色 header 条，Vite 静态导入 `img_logo.png`
- `logo.*` 配置控制此区域

**标题区域** — `<section className="login-product-intro">` 内：
- **主标题组**（同一 `<h1 className="login-product-title">` 内，同行不同颜色）：
  - `title.highlightText` → `<span className="login-product-highlight">学生问题解决能力</span>` — 主标题，通过 CSS class `.login-product-highlight` 控制强调色
  - `title.mainText` → span 外的普通文本 `监测平台` — 次级标题，与 highlightText 同行但不同颜色
- **副标题**：`title.subtitleText` → `<p className="login-product-subtitle">数据驱动的监测与分析平台</p>`

**登录框标题** — `<section className="login-form-container">` 内：
- `loginBoxTitle` → `<h2 className="login-welcome-title">请登录，开启你的科学探究之旅</h2>`

**密码模式**：由 `VITE_PASSWORD_FREE` 环境变量控制，构建时决定

改造目标：登录页在组件初始化时异步读取后端配置，按配置动态渲染上述内容。配置不可用时回退到当前硬编码内容作为默认值。

约束：
- 登录页是系统入口，**不可白屏**，必须先渲染默认配置再异步更新
- 新增 API 为未认证公开接口，Mock 模式需同步支持
- 现有 `VITE_PASSWORD_FREE` 模式必须继续工作（作为配置的 fallback）
- 不使用 `innerHTML`，所有文本纯文本渲染

## Goals / Non-Goals

**Goals:**

- 登录页初始化时异步拉取 `/stu/api/login-page-config/active`，成功后动态更新渲染
- `obj=null` 或接口失败时，依次尝试 localStorage 缓存 → 内置默认配置，不阻塞登录
- Logo 支持 4 种展示类型 × 3 种位置，通过 CSS class 切换
- 标题 highlight 文字独立 class `login-product-highlight`（保持现有蓝色强调色），mainText 作为同行普通文本
- 密码输入框按配置隐藏，隐藏时提交 `password='1234'`
- 图片加载失败降级，不影响表单

**Non-Goals:**

- 不开发管理配置页面
- 不支持用户手动切换主题
- 不支持自定义 CSS 注入
- 不改造后端账号体系
- 不改造验证码逻辑

## Decisions

### D1: 配置优先级链

**决定：** 后端配置 > localStorage 缓存 > `VITE_PASSWORD_FREE` 环境变量 > 内置默认配置

**理由：** 后端配置是权威数据源。缓存仅作接口失败兜底。环境变量在无后端（纯前端开发）场景下仍有效。内置默认配置确保首次访问无缓存时页面正常。

**替代方案：** 环境变量优先于后端配置 → 否决，因为运营人员通过管理后台调整的配置应立即生效，环境变量仅作为开发模式 fallback。

### D2: 配置数据放置位置

**决定：** 新建 `src/shared/services/loginPageConfig/` 目录，包含：
- `types.ts` — `LoginPageConfig` 类型定义
- `defaultConfig.ts` — 内置默认配置常量
- `api.ts` — API 客户端（fetch + 缓存读写）
- `index.ts` — 统一导出

**理由：** 配置服务与登录页解耦，便于测试和复用。放在 `shared/services/` 符合项目分层约定（参考 `submission/`、`timers/`）。

**替代方案：** 直接在 LoginPage.jsx 内处理 → 否决，登录页组件已较长，混合配置逻辑不利于维护和测试。

### D3: 缓存策略

**决定：** 使用 localStorage，键名 `hci-login-page-config`，存储 `{ cacheVersion, config, cachedAt }`。成功获取有效配置时写入；接口失败时读取；不设 TTL（配置变更由 `cacheVersion` 比对判断）。

**理由：** localStorage 是项目已有缓存机制（`hci-*` 键），保持一致。不设 TTL 避免配置在有效期内意外过期。`cacheVersion` 字段可用于后续增量更新判断。

### D4: 配置加载不阻塞渲染

**决定：** LoginPage 组件 mount 时先用默认配置渲染完整页面，同时 `useEffect` 异步拉取配置。配置返回后 setState 更新，页面切换到新配置渲染。

**理由：** PRD 第 6.1 节明确要求"先渲染默认配置，异步请求返回后再切换，避免白屏"。这也是最常见的骨架屏/渐进增强模式。

### D5: Mock 模式支持

**决定：** 在 `vite.config.js` 的 `mockStuApi` 插件中新增 `/stu/api/login-page-config/active` 拦截规则，返回模拟配置。默认返回 `password.hidden=true` 配置（与当前 `VITE_PASSWORD_FREE=1` 行为一致）。

**理由：** 项目已建立 Mock 模式基础设施，保持一致。

### D6: 密码隐藏模式与 VITE_PASSWORD_FREE 的关系

**决定：** 密码输入框显示逻辑为：
```
showPassword = !config.password.hidden && !isPasswordFreeEnv
```
即任一条件为真都隐藏密码。提交时：
```
actualPassword = (config.password.hidden || isPasswordFreeEnv) ? '1234' : form.password
```

**理由：** 两个开关取并集（隐藏优先），确保开发和生产环境的免密需求都能满足，不互相干扰。

### D7: CSS class 命名与 DOM 映射

**决定：** 保持现有 BEM 命名风格，配置驱动的改造严格映射到现有 DOM 结构：

| 配置字段 | 目标 DOM 元素 | 改造方式 |
|---|---|---|
| `logo.*` | `<header>.login-logo-container > img.login-header-logo` | 条件渲染 img/span，position 追加修饰符 class |
| `title.highlightText` | `<h1>.login-product-title > span.login-product-highlight` | 替换 span 内文本，保持现有强调色 CSS |
| `title.mainText` | `<h1>.login-product-title` 内 span 外的文本节点 | 替换 span 后的文本内容 |
| `title.subtitleText` | `<p>.login-product-subtitle` | 替换段落文本，为空时不渲染 `<p>` |
| `loginBoxTitle` | `<h2>.login-welcome-title` | 替换标题文本 |

新增 CSS class（位置修饰符）：
- Logo 位置：`login-logo--top-left`、`login-logo--top-center`、`login-logo--top-right`
- Logo 展示：通过条件渲染子元素控制，不额外加 class
- 标题高亮：现有 `login-product-highlight` class 继续使用（蓝色背景 + 圆角）

**理由：** 与现有 CSS 架构一致，不引入新命名体系。

## Risks / Trade-offs

- **[接口延迟导致闪烁]** → 先渲染默认配置（与当前硬编码一致），用户感知不到闪烁。如果默认配置和后端配置差异大，可能出现短暂内容切换。缓解：过渡动画 opacity fade。
- **[缓存过期]** → localStorage 无 TTL，如果后端配置更新但用户一直使用缓存，可能展示过期配置。缓解：每次进入登录页都发起请求，缓存仅作失败兜底。
- **[图片加载失败]** → img 标签 `onError` 处理，隐藏图片元素，不影响文字 Logo 和表单。
- **[XSS via 配置文本]** → React 默认转义文本内容，不使用 `dangerouslySetInnerHTML`。Logo text 用 `<span>` 纯文本。
- **[默认密码暴露]** → `password='1234'` 仅在网络请求 payload 中传输，不在页面明文展示。生产日志不记录密码字段。
