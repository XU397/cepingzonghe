共享 UI 组件层（ui/）

用途
- 存放可复用的 UI 原子/复合组件（例如计时器、导航等）。
- 被多个模块/子模块使用，避免重复实现。

约定
- 使用别名导入：`@shared/ui/...`。
- 样式优先使用 CSS Modules + 设计 token（见 `@shared/styles`）。
