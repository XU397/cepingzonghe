## ADDED Requirements

### Requirement: Logo area dynamic rendering
The system SHALL render the logo area inside `<header className="login-header">` → `<div className="login-logo-container">`, based on `logo.displayType`:
- `none`: Do not render the logo area (or keep CSS placeholder)
- `image`: Render only `<img>` with `src=logo.imageUrl`, `alt=logo.imageAlt || logo.text || default`, class `login-header-logo`
- `text`: Render only `<span>` with `logo.text`
- `image_text`: Render both `<img>` and `<span>`

The logo area SHALL apply a CSS class based on `logo.position`:
- `top_left` → `login-logo--top-left`
- `top_center` → `login-logo--top-center`
- `top_right` → `login-logo--top-right`

#### Scenario: Image and text logo display
- **WHEN** `logo.displayType` is `'image_text'` and both `imageUrl` and `text` are provided
- **THEN** the system renders both `<img>` and `<span>` elements in the logo area

#### Scenario: Image-only logo
- **WHEN** `logo.displayType` is `'image'`
- **THEN** the system renders only an `<img>` element, no text span

#### Scenario: Text-only logo
- **WHEN** `logo.displayType` is `'text'` and `logo.text` is provided
- **THEN** the system renders only a `<span>` with the text

#### Scenario: No logo display
- **WHEN** `logo.displayType` is `'none'`
- **THEN** the system does not render logo elements (may keep layout placeholder)

#### Scenario: Logo position class applied
- **WHEN** `logo.position` is `'top_left'`
- **THEN** the logo container has CSS class `login-logo--top-left`

### Requirement: Logo image fallback
The system SHALL handle logo image loading failures gracefully. When the `<img>` `onError` fires, the system SHALL hide the image element. The failure SHALL NOT block or affect the login form.

#### Scenario: Image URL returns 404
- **WHEN** `logo.imageUrl` points to a non-existent resource
- **THEN** the `<img>` element is hidden and the login form remains fully functional

#### Scenario: Image load failure with text fallback
- **WHEN** `logo.displayType` is `'image_text'` and the image fails to load
- **THEN** the text logo remains visible and the image is hidden

### Requirement: Title area dynamic rendering
The system SHALL render the title area inside `<section className="login-product-intro">` using three config-driven text nodes with precise DOM mapping:

**主标题组**（同一 `<h1 className="login-product-title">` 内，同行展示，通过颜色区分两个标题）：
- `title.highlightText` → `<span className="login-product-highlight">{text}</span>` — 主标题，通过 CSS class `login-product-highlight` 控制强调色（当前为蓝色背景高亮）
- `title.mainText` → span 外的普通文本节点 — 次级标题，与 highlightText 同行但不同颜色（当前为默认文字色）

**副标题**：
- `title.subtitleText` → `<p className="login-product-subtitle">{text}</p>`；如果为空，该 `<p>` 元素 SHALL NOT 渲染

All title text SHALL be rendered as plain text, not HTML.

#### Scenario: Full title rendering
- **WHEN** config provides `highlightText: "核心素养"`, `mainText: "监测平台"`, `subtitleText: "2026年春季"`
- **THEN** `<h1>` renders `<span class="login-product-highlight">核心素养</span>监测平台` and `<p>` renders `"2026年春季"`

#### Scenario: Highlight and main text are in same line with different colors
- **WHEN** config provides both `highlightText` and `mainText`
- **THEN** both are rendered inside the same `<h1 className="login-product-title">`, highlightText wrapped in `<span class="login-product-highlight">` for color differentiation, mainText as plain text sibling

#### Scenario: Only highlight text provided
- **WHEN** config provides `highlightText: "核心素养"` but `mainText` is empty
- **THEN** `<h1>` renders only `<span class="login-product-highlight">核心素养</span>` with no trailing text

#### Scenario: Only main text provided
- **WHEN** config provides `mainText: "监测平台"` but `highlightText` is empty
- **THEN** `<h1>` renders only the plain text `"监测平台"` without a highlight span

#### Scenario: Empty subtitle
- **WHEN** config `subtitleText` is empty or undefined
- **THEN** the system does not render the subtitle `<p>` element (no empty space)

#### Scenario: Highlight text has independent styling
- **WHEN** `title.highlightText` is rendered
- **THEN** it is wrapped in `<span className="login-product-highlight">` element, controlled by existing CSS `.login-product-highlight` (color + background + border-radius)

### Requirement: Login box title dynamic rendering
The system SHALL render the login box title inside `<h2 className="login-welcome-title">` (within `<div className="login-welcome-section">` in `<section className="login-form-container">`) from config `loginBoxTitle`. If the field is empty or missing, the system SHALL use a default value (e.g., `登录`).

#### Scenario: Custom login box title
- **WHEN** config `loginBoxTitle` is `"学生登录"`
- **THEN** the login box heading displays `"学生登录"`

#### Scenario: Empty login box title
- **WHEN** config `loginBoxTitle` is empty
- **THEN** the login box heading displays the default title

### Requirement: Password input dynamic visibility
The system SHALL control password input visibility based on `password.hidden` from the effective config:
- `password.hidden = false` AND `VITE_PASSWORD_FREE != '1'`: Show password input, require user to enter password
- `password.hidden = true` OR `VITE_PASSWORD_FREE == '1'`: Hide password input, auto-submit with `password='1234'`

When password is hidden, the system SHALL NOT show password validation errors and SHALL disable any "remember password" functionality.

#### Scenario: Password visible with config
- **WHEN** config `password.hidden` is `false` AND `VITE_PASSWORD_FREE` is not `1`
- **THEN** the password input field is visible and required for login

#### Scenario: Password hidden by config
- **WHEN** config `password.hidden` is `true`
- **THEN** the password input field is hidden and login submits with `password='1234'`

#### Scenario: Password hidden by env var
- **WHEN** `VITE_PASSWORD_FREE` is `1` AND config `password.hidden` is `false`
- **THEN** the password input field is still hidden (env var takes precedence for dev mode)

#### Scenario: No password validation when hidden
- **WHEN** password is hidden and user submits
- **THEN** no password-related validation error is shown

### Requirement: Non-blocking config loading
The system SHALL render the login page immediately with the default (or cached) configuration. The async config fetch SHALL update the page state after completion without causing a visible layout shift or blank screen.

#### Scenario: Page renders before config loads
- **WHEN** the login page component mounts
- **THEN** the page is immediately rendered with default/cached config, and the config fetch happens in background

#### Scenario: Config updates page after fetch
- **WHEN** the async config fetch completes successfully
- **THEN** the page updates to reflect the new configuration

#### Scenario: Config fetch fails silently
- **WHEN** the async config fetch fails
- **THEN** the page continues to display with default/cached config, and no error is shown to the user

### Requirement: XSS prevention for config text
The system SHALL render all configuration text values (logo text, title text, login box title) as plain text using React's default text content rendering. The system SHALL NOT use `dangerouslySetInnerHTML`, `innerHTML`, or any equivalent HTML injection mechanism.

#### Scenario: Script tag in title text
- **WHEN** config `title.highlightText` contains `<script>alert('xss')</script>`
- **THEN** the text is rendered as literal text content, not executed as HTML

#### Scenario: HTML markup in logo text
- **WHEN** config `logo.text` contains `<b>bold</b>`
- **THEN** the text is rendered as literal `<b>bold</b>`, not formatted HTML
