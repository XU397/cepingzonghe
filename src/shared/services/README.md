共享服务层（services/）

用途
- API 客户端、存储、计时器、数据上报等通用服务。

结构建议
- `api/`     API 客户端与端点集中管理
- `storage/` 本地存储键名与工具
- `timers/`  统一计时器服务与封装

约定
- 使用别名导入：`@shared/services/...`。
