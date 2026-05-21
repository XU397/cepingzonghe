# 测评登录页配置管理 API 接口文档

| 项目 | 内容 |
| --- | --- |
| 文档版本 | v1.0 |
| 日期 | 2026-05-10 |
| 后端项目 | `lujing-total/review` 管理后端 |
| 关联 PRD | `20260510测评登录页面管理-后端PRD.md` |
| 面向对象 | 管理后台前端、测评登录页前端、`02.新都测评后端` |

## 1. 职责边界

管理后端是登录页配置的唯一数据源，负责实现 PRD 中的全部管理能力：

- 登录页配置 CRUD、复制、归档、激活。
- Logo 上传、校验、公开访问 URL 生成。
- 全局唯一激活配置的事务保障。
- 管理端权限控制和操作日志。
- 未登录公开读取当前激活配置。

`02.新都测评后端` 不维护配置写入能力，只消费管理后端公开读取接口，并向 `01.新都前端` 提供同构读取接口。该部分需求见 `docs/plans/2026-05-10-xindu-assessment-login-page-config-integration.md`。

## 2. 通用约定

### 2.1 Base URL

- 管理端接口：`/api/assessment/login-page-configs`
- 公开读取接口：`/stu/api/login-page-config/active`
- Logo 静态资源：推荐 `/profile/login-logo/**`

### 2.2 认证和权限

- 管理端接口必须携带 `Authorization: Bearer <token>`。
- 公开读取接口不要求学生或管理端登录态。
- Logo 图片 URL 必须允许未登录 GET 访问。
- 当前项目 `SecurityConfig` 已放行 GET `/profile/**` 和 GET `/stu/api/login-page-config/active`。

### 2.3 响应格式

管理端详情、创建、更新、复制、激活、上传、公开读取使用 RuoYi `AjaxResult`：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {}
}
```

管理端列表使用 RuoYi `TableDataInfo`：

```json
{
  "code": 200,
  "msg": "查询成功",
  "rows": [],
  "total": 0
}
```

说明：

- 文档统一使用 `data` 字段，不使用 PRD 样例中的 `obj`。
- HTTP 状态码按现有 RuoYi 风格可统一返回 200，前端以响应体 `code` 判断业务结果。
- 公开接口无激活配置时必须显式返回 `"data": null`，避免前端需要区分字段缺失和空配置。

### 2.4 时间格式

默认使用当前项目常见格式：

```text
yyyy-MM-dd HH:mm:ss
```

示例：`2026-05-10 10:25:00`。

## 3. 枚举

### 3.1 配置状态

| 值 | 说明 | 可编辑 | 可激活 | 可归档 |
| --- | --- | --- | --- | --- |
| `draft` | 草稿 | 是 | 是 | 是 |
| `inactive` | 未激活 | 是 | 是 | 是 |
| `active` | 当前激活 | 是，更新后版本递增并刷新公开缓存 | 已激活 | 否 |
| `archived` | 已归档 | 否 | 否 | 否 |

### 3.2 Logo 展示类型

| 值 | 说明 |
| --- | --- |
| `none` | 不展示 Logo |
| `image` | 仅图片 Logo |
| `text` | 仅文字 Logo |
| `image_text` | 图片和文字同时展示 |

### 3.3 Logo 位置

| 值 | 说明 |
| --- | --- |
| `top_left` | 顶部左侧 |
| `top_center` | 顶部居中 |
| `top_right` | 顶部右侧 |

### 3.4 默认密码策略

| 值 | 说明 |
| --- | --- |
| `fixed_1234` | 密码输入框隐藏时，测评前端固定提交 `1234` |

## 4. 数据模型

### 4.1 创建/更新请求体

```json
{
  "configName": "2026春季默认登录页",
  "logo": {
    "displayType": "image_text",
    "position": "top_center",
    "imageFileId": "file_202605100001",
    "imageUrl": "https://admin.example.com/profile/login-logo/2026/05/10/file_202605100001.png",
    "text": "综合测评",
    "imageAlt": "综合测评 Logo"
  },
  "title": {
    "highlightText": "核心素养",
    "mainText": "监测平台",
    "subtitleText": "2026年春季学生综合测评"
  },
  "loginBoxTitle": "学生登录",
  "password": {
    "hidden": true
  },
  "remarks": "春季项目默认配置"
}
```

字段说明：

| 字段 | 类型 | 必填 | 校验 |
| --- | --- | --- | --- |
| `configName` | string | 是 | 1-80 字符 |
| `logo.displayType` | string | 是 | `none` / `image` / `text` / `image_text` |
| `logo.position` | string | 是 | 默认 `top_center` |
| `logo.imageFileId` | string | 否 | Logo 上传返回的文件 ID，最多 100 字符 |
| `logo.imageUrl` | string | 条件必填 | `image` / `image_text` 时必填；公开可访问 URL，建议存绝对 URL |
| `logo.text` | string | 条件必填 | `text` / `image_text` 时 1-40 字符 |
| `logo.imageAlt` | string | 否 | 最多 80 字符；为空时后端可用 `configName` 或 `logo.text` |
| `title.highlightText` | string | 是 | 1-40 字符，纯文本 |
| `title.mainText` | string | 是 | 1-80 字符，纯文本 |
| `title.subtitleText` | string | 否 | 最多 120 字符，纯文本 |
| `loginBoxTitle` | string | 是 | 1-40 字符，纯文本 |
| `password.hidden` | boolean | 是 | true / false |
| `remarks` | string | 否 | 最多 200 字符 |

### 4.2 详情响应对象

```json
{
  "id": 1001,
  "configName": "2026春季默认登录页",
  "status": "active",
  "active": true,
  "version": 3,
  "logo": {
    "displayType": "image_text",
    "position": "top_center",
    "imageFileId": "file_202605100001",
    "imageUrl": "https://admin.example.com/profile/login-logo/2026/05/10/file_202605100001.png",
    "text": "综合测评",
    "imageAlt": "综合测评 Logo"
  },
  "title": {
    "highlightText": "核心素养",
    "mainText": "监测平台",
    "subtitleText": "2026年春季学生综合测评"
  },
  "loginBoxTitle": "学生登录",
  "password": {
    "hidden": true,
    "defaultPasswordPolicy": "fixed_1234"
  },
  "remarks": "春季项目默认配置",
  "createdBy": "admin",
  "createdAt": "2026-05-10 10:00:00",
  "updatedBy": "admin",
  "updatedAt": "2026-05-10 10:20:00",
  "activatedBy": "admin",
  "activatedAt": "2026-05-10 10:25:00"
}
```

### 4.3 列表行对象

```json
{
  "id": 1001,
  "configName": "2026春季默认登录页",
  "status": "active",
  "active": true,
  "version": 3,
  "logoDisplayType": "image_text",
  "logoPosition": "top_center",
  "logoText": "综合测评",
  "logoImageUrl": "https://admin.example.com/profile/login-logo/2026/05/10/file_202605100001.png",
  "titleHighlightText": "核心素养",
  "titleMainText": "监测平台",
  "titleSubtitleText": "2026年春季学生综合测评",
  "loginBoxTitle": "学生登录",
  "passwordHidden": true,
  "updatedAt": "2026-05-10 10:20:00",
  "activatedAt": "2026-05-10 10:25:00"
}
```

## 5. 管理端接口

### 5.1 查询配置列表

```http
GET /api/assessment/login-page-configs?pageNum=1&pageSize=20&configName=春季&status=active&activeOnly=true
Authorization: Bearer <token>
```

权限：`assessment:loginPage:list`

查询参数：

| 参数 | 类型 | 必填 | 默认值 | 说明 |
| --- | --- | --- | --- | --- |
| `pageNum` | number | 否 | 1 | 页码 |
| `pageSize` | number | 否 | 20 | 每页数量 |
| `configName` | string | 否 | - | 配置名称模糊查询 |
| `status` | string | 否 | - | 状态筛选 |
| `activeOnly` | boolean | 否 | false | 仅查询激活配置 |

成功响应：

```json
{
  "code": 200,
  "msg": "查询成功",
  "rows": [
    {
      "id": 1001,
      "configName": "2026春季默认登录页",
      "status": "active",
      "active": true,
      "version": 3,
      "logoDisplayType": "image_text",
      "logoPosition": "top_center",
      "titleHighlightText": "核心素养",
      "titleMainText": "监测平台",
      "loginBoxTitle": "学生登录",
      "passwordHidden": true,
      "updatedAt": "2026-05-10 10:20:00",
      "activatedAt": "2026-05-10 10:25:00"
    }
  ],
  "total": 1
}
```

### 5.2 查询配置详情

```http
GET /api/assessment/login-page-configs/{id}
Authorization: Bearer <token>
```

权限：`assessment:loginPage:query`

成功响应：

```json
{
  "code": 200,
  "msg": "操作成功",
  "data": {
    "id": 1001,
    "configName": "2026春季默认登录页",
    "status": "active",
    "active": true,
    "version": 3,
    "logo": {
      "displayType": "image_text",
      "position": "top_center",
      "imageFileId": "file_202605100001",
      "imageUrl": "https://admin.example.com/profile/login-logo/2026/05/10/file_202605100001.png",
      "text": "综合测评",
      "imageAlt": "综合测评 Logo"
    },
    "title": {
      "highlightText": "核心素养",
      "mainText": "监测平台",
      "subtitleText": "2026年春季学生综合测评"
    },
    "loginBoxTitle": "学生登录",
    "password": {
      "hidden": true,
      "defaultPasswordPolicy": "fixed_1234"
    },
    "remarks": "春季项目默认配置",
    "createdBy": "admin",
    "createdAt": "2026-05-10 10:00:00",
    "updatedBy": "admin",
    "updatedAt": "2026-05-10 10:20:00",
    "activatedBy": "admin",
    "activatedAt": "2026-05-10 10:25:00"
  }
}
```

### 5.3 创建配置

```http
POST /api/assessment/login-page-configs
Authorization: Bearer <token>
Content-Type: application/json
```

权限：`assessment:loginPage:add`

业务规则：

- 初始状态固定为 `draft`。
- `version` 固定为 1。
- `defaultPasswordPolicy` 固定写入 `fixed_1234`。
- 纯文本字段后端按字符数校验并裁剪首尾空白；前端必须按纯文本渲染，不得按 HTML 渲染。

成功响应：返回详情响应对象。

```json
{
  "code": 200,
  "msg": "创建成功",
  "data": {
    "id": 1001,
    "status": "draft",
    "active": false,
    "version": 1
  }
}
```

### 5.4 更新配置

```http
PUT /api/assessment/login-page-configs/{id}
Authorization: Bearer <token>
Content-Type: application/json
```

权限：`assessment:loginPage:edit`

业务规则：

- `draft`、`inactive`、`active` 可更新。
- `archived` 不可更新。
- 每次成功更新 `version + 1`。
- 更新 `active` 配置后必须刷新公开读取接口缓存。
- 更新成功返回完整详情对象，方便前端刷新预览状态。

成功响应：

```json
{
  "code": 200,
  "msg": "更新成功",
  "data": {
    "id": 1001,
    "status": "active",
    "active": true,
    "version": 4
  }
}
```

### 5.5 复制配置

```http
POST /api/assessment/login-page-configs/{id}/copy
Authorization: Bearer <token>
Content-Type: application/json
```

权限：`assessment:loginPage:add`

请求体：

```json
{
  "configName": "2026春季默认登录页 - 副本"
}
```

业务规则：

- 支持复制 `draft`、`inactive`、`active`、`archived` 配置。
- 新配置状态固定为 `draft`，`active=false`，`version=1`。
- 如未传 `configName`，后端可使用 `{原名称} - 副本`，并保证不超过 80 字符。
- 复制配置不复制 `activatedBy`、`activatedAt`。
- 复制 Logo 引用，不复制实际文件。

成功响应：返回新配置详情对象。

### 5.6 归档配置

```http
DELETE /api/assessment/login-page-configs/{id}
Authorization: Bearer <token>
```

权限：`assessment:loginPage:remove`

业务规则：

- `active` 配置不允许归档。
- 后端默认做归档：`status=archived`、`active=false`。
- 归档配置不可编辑、不可激活。
- 归档配置如需重新使用，推荐通过复制接口生成新 `draft` 配置。

成功响应：

```json
{
  "code": 200,
  "msg": "操作成功"
}
```

### 5.7 激活配置

```http
POST /api/assessment/login-page-configs/{id}/activate
Authorization: Bearer <token>
```

权限：`assessment:loginPage:activate`

业务规则：

- 目标配置必须存在，且状态不是 `archived`。
- 激活前必须执行完整配置校验。
- 激活操作必须在事务中完成：锁定当前激活配置，取消旧激活，再激活目标配置。
- 激活成功后目标配置：`status=active`、`active=true`、记录 `activatedBy`、`activatedAt`。
- 旧激活配置：`status=inactive`、`active=false`。
- 激活成功必须刷新公开读取接口缓存。

成功响应：

```json
{
  "code": 200,
  "msg": "激活成功",
  "data": {
    "id": 1001,
    "active": true,
    "status": "active",
    "version": 3,
    "activatedAt": "2026-05-10 10:25:00"
  }
}
```

### 5.8 Logo 上传

```http
POST /api/assessment/login-page-configs/logo
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

权限：`assessment:loginPage:upload`

表单字段：

| 字段 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `file` | file | 是 | Logo 图片 |

文件限制：

- 支持 `png`、`jpg`、`jpeg`、`webp`。
- 单文件最大 2 MB。
- 不接受 `svg`。
- 后端必须校验扩展名、Content-Type、文件头魔数。
- 建议上传目录：`{ruoyi.profile}/login-logo/`。

成功响应：

```json
{
  "code": 200,
  "msg": "上传成功",
  "data": {
    "fileId": "file_202605100001",
    "url": "https://admin.example.com/profile/login-logo/2026/05/10/file_202605100001.png",
    "fileName": "logo.png",
    "contentType": "image/png",
    "fileSize": 36820
  }
}
```

实现注意：

- `url` 推荐返回绝对 URL，便于 `02.新都测评后端` 和测评前端跨服务使用。
- 如只能返回 `/profile/login-logo/...` 相对路径，消费方必须按管理后端公网地址补全。

## 6. 公开读取接口

### 6.1 获取当前激活配置

```http
GET /stu/api/login-page-config/active
```

权限：无，必须允许未登录访问。

用途：

- 测评登录页加载前读取配置。
- `02.新都测评后端` 读取管理后端配置的上游接口。

成功响应：

```json
{
  "code": 200,
  "msg": "ok",
  "data": {
    "id": 1001,
    "version": 3,
    "cacheVersion": "1001-3-20260510102500",
    "logo": {
      "displayType": "image_text",
      "position": "top_center",
      "imageUrl": "https://admin.example.com/profile/login-logo/2026/05/10/file_202605100001.png",
      "text": "综合测评",
      "imageAlt": "综合测评 Logo"
    },
    "title": {
      "highlightText": "核心素养",
      "mainText": "监测平台",
      "subtitleText": "2026年春季学生综合测评"
    },
    "loginBoxTitle": "学生登录",
    "password": {
      "hidden": true,
      "defaultPasswordPolicy": "fixed_1234"
    },
    "updatedAt": "2026-05-10 10:20:00",
    "activatedAt": "2026-05-10 10:25:00"
  }
}
```

无激活配置响应：

```json
{
  "code": 200,
  "msg": "ok",
  "data": null
}
```

公开接口字段裁剪：

- 不返回 `configName`、`status`、`createdBy`、`updatedBy`、`activatedBy`、`remarks`、内部存储路径。
- 不返回任何真实密码或可配置密码字段。
- `password.defaultPasswordPolicy` 固定为 `fixed_1234`。

建议响应头：

```http
Cache-Control: public, max-age=60, must-revalidate
ETag: "login-page-config-1001-3-20260510102500"
```

缓存规则：

- 服务端可缓存激活配置 30-60 秒。
- 激活配置或编辑 active 配置后必须主动失效缓存。
- `cacheVersion` 使用 `{id}-{version}-{activatedAt}` 或 `{id}-{version}-{updatedAt}`。

## 7. 错误码

| code | msg | 适用接口 |
| --- | --- | --- |
| `40001` | 当前激活配置不可删除，请先激活其他配置 | DELETE |
| `40002` | 仅支持 png、jpg、jpeg、webp 格式 | Logo 上传 |
| `40003` | Logo 图片不能超过 2MB | Logo 上传 |
| `40004` | 配置内容不完整，无法激活 | 激活 |
| `40005` | 已归档配置不可编辑或激活 | 更新、激活 |
| `40006` | 请求参数不合法 | 创建、更新 |
| `40401` | 登录页配置不存在 | 详情、更新、复制、归档、激活 |
| `40901` | 配置激活冲突，请刷新后重试 | 激活 |
| `500` | 操作失败 | 通用异常 |

错误响应示例：

```json
{
  "code": 40004,
  "msg": "配置内容不完整，无法激活"
}
```

## 8. 权限点

| 权限标识 | 接口 |
| --- | --- |
| `assessment:loginPage:list` | 查询配置列表 |
| `assessment:loginPage:query` | 查询配置详情 |
| `assessment:loginPage:add` | 创建配置、复制配置 |
| `assessment:loginPage:edit` | 更新配置 |
| `assessment:loginPage:remove` | 归档配置 |
| `assessment:loginPage:activate` | 激活配置 |
| `assessment:loginPage:upload` | 上传 Logo |

## 9. 审计要求

使用当前项目 `@Log` 写入 `sys_oper_log`，建议标题和业务类型如下：

| 操作 | title | businessType |
| --- | --- | --- |
| 创建配置 | 登录页配置创建 | `INSERT` |
| 更新配置 | 登录页配置更新 | `UPDATE` |
| 复制配置 | 登录页配置复制 | `INSERT` |
| 归档配置 | 登录页配置归档 | `DELETE` |
| 激活配置 | 登录页配置激活 | `UPDATE` |
| 上传 Logo | 登录页 Logo 上传 | `INSERT` |

当前实现通过 RuoYi 操作日志至少能追溯：

- 操作人、操作时间、IP、接口路径、结果状态。
- 请求参数和返回结果中的配置 ID、配置名称、状态、版本等关键字段。
- 如后续需要严格记录“变更前/变更后”字段差异，可在 Service 层追加专用审计明细。

### 9.1 查询操作日志

本功能不新增专用日志查询接口，复用 RuoYi 默认操作日志接口。

```http
GET /monitor/operlog/list
Authorization: Bearer <token>
```

权限：`monitor:operlog:list`

查询参数：

| 参数 | 类型 | 必填 | 说明 |
| --- | --- | --- | --- |
| `pageNum` | number | 否 | 页码，默认 1 |
| `pageSize` | number | 否 | 每页数量，默认 10/20，取决于前端或分页默认值 |
| `title` | string | 否 | 操作模块，支持模糊查询，例如 `登录页配置激活`、`登录页` |
| `businessType` | number | 否 | 业务类型：`1` 新增、`2` 修改、`3` 删除 |
| `status` | number | 否 | 操作状态：`0` 成功、`1` 异常 |
| `operName` | string | 否 | 操作人员，支持模糊查询 |
| `operIp` | string | 否 | 操作 IP，支持模糊查询 |
| `params[beginTime]` | string | 否 | 开始时间，格式 `yyyy-MM-dd HH:mm:ss` |
| `params[endTime]` | string | 否 | 结束时间，格式 `yyyy-MM-dd HH:mm:ss` |

响应使用 RuoYi `TableDataInfo`：

```json
{
  "code": 200,
  "msg": "查询成功",
  "rows": [
    {
      "operId": 34637,
      "title": "登录页配置激活",
      "businessType": 2,
      "method": "com.ruoyi.web.controller.assessment.AssessmentLoginPageConfigController.activate()",
      "requestMethod": "POST",
      "operatorType": 1,
      "operName": "admin",
      "operUrl": "/api/assessment/login-page-configs/2/activate",
      "operIp": "127.0.0.1",
      "operParam": "[2]",
      "jsonResult": "{\"msg\":\"激活成功\",\"code\":200,\"data\":{\"id\":2,\"active\":true,\"status\":\"active\"}}",
      "status": 0,
      "errorMsg": null,
      "operTime": "2026-05-11 13:12:28",
      "costTime": 371
    }
  ],
  "total": 1
}
```

准确查询示例：

```http
GET /monitor/operlog/list?pageNum=1&pageSize=20&title=登录页配置激活&status=0
Authorization: Bearer <token>
```

用途：查询激活成功日志。

```http
GET /monitor/operlog/list?pageNum=1&pageSize=20&title=登录页配置激活&status=1
Authorization: Bearer <token>
```

用途：查询激活失败日志，例如激活已归档配置时的 `40005`。

```http
GET /monitor/operlog/list?pageNum=1&pageSize=20&title=登录页Logo上传&status=0
Authorization: Bearer <token>
```

用途：查询 Logo 上传成功日志。

```http
GET /monitor/operlog/list?pageNum=1&pageSize=20&title=登录页&operName=admin
Authorization: Bearer <token>
```

用途：查询某个操作人的全部登录页配置相关写操作。

注意：

- `@Log` 为异步写入，接口返回后建议等待 1-3 秒再查询。
- 查询配置列表、查询详情、公开读取当前激活配置这类 GET 接口默认不记录操作日志。
- 日志字段 `operParam` 和 `jsonResult` 最多保留 2000 字符，超长内容会被截断。

## 10. 后端实现注意点

### 10.1 数据库约束

建议主表：`assessment_login_page_config`。

关键约束：

- `id` 主键。
- `status`、`is_active`、`version` 必填。
- 全局最多一条 `is_active=1`。
- MySQL 8 可用生成列实现条件唯一索引，或在激活事务中通过 `SELECT ... FOR UPDATE` 锁定现有 active 行。
- 建议索引：`idx_login_page_status_updated(status, update_time)`。

如果数据库不支持条件唯一索引，激活接口必须用事务和行锁保障唯一 active。

### 10.2 字段命名映射

数据库建议沿用 RuoYi 常见审计字段：

| 文档字段 | 数据库字段建议 |
| --- | --- |
| `createdBy` | `create_by` |
| `createdAt` | `create_time` |
| `updatedBy` | `update_by` |
| `updatedAt` | `update_time` |
| `active` | `is_active` |
| `deletedFlag` | `del_flag` |

接口 JSON 仍使用 camelCase。

### 10.3 文件安全

当前 `FileUploadUtils` 默认最大 50 MB 且图片扩展包含 `bmp/gif`，登录页 Logo 不能直接复用默认规则。需要为本接口单独限制：

- 最大 2 MB。
- 仅 `png`、`jpg`、`jpeg`、`webp`。
- 校验文件头，不能只信任扩展名和 `Content-Type`。

### 10.4 公开接口可用性

公开接口失败不应影响测评登录页可用性：

- 无 active 配置返回 `data=null`。
- 后端异常返回业务错误时，测评前端应使用本地缓存或内置默认登录页。
- 管理后端应保留最近一次 active 配置缓存，减少数据库压力。

## 11. 联调验收清单

- 管理端可创建、编辑、复制、归档、查询、激活配置。
- 激活并发请求不会产生多条 active 配置。
- 更新 active 配置后公开接口的 `version` 或 `cacheVersion` 变化。
- Logo 上传拒绝 `svg`、超 2 MB 文件、伪造扩展名文件。
- Logo URL 未登录可访问。
- `/stu/api/login-page-config/active` 未登录可访问。
- 公开接口不返回审计字段、配置备注、内部文件路径、真实密码。
- 无 active 配置时返回 `code=200,data=null`。

## 12. Apifox 导入文件

可直接导入 Apifox 的 OpenAPI 3.0 JSON 文件：

```text
docs/api/2026-05-10-assessment-login-page-config.apifox-openapi.json
```

导入后建议在 Apifox 环境中配置：

- `baseUrl` 或服务地址：实际管理后端地址，例如 `http://localhost:8080`。
- `Authorization`：管理端接口和操作日志查询接口使用 Bearer Token。
- 公开读取接口 `/stu/api/login-page-config/active` 不需要 Token。
