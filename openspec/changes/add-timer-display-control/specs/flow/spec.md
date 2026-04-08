## ADDED Requirements

### Requirement: 登录响应 displayOptions 协议
Flow 登录响应 SHALL 支持 `displayOptions` 字段，用于传递前端显示控制配置。

#### Scenario: displayOptions 结构
- **WHEN** 后端返回登录成功响应
- **THEN** 响应 MAY 包含 `displayOptions` 对象
- **AND** `displayOptions.hideTimerDisplay` SHALL 为 Boolean 类型
- **AND** `true` 表示隐藏学生端倒计时显示，`false` 或缺失表示显示

#### Scenario: 类型容错处理
- **WHEN** `displayOptions.hideTimerDisplay` 为非布尔值（如字符串 `"true"`、空对象、`null`、`undefined`）
- **THEN** 前端 SHALL 将其视为 `false`（显示倒计时）
- **AND** 前端 SHALL 在控制台输出警告日志，便于排查配置问题
- **AND** 前端 SHALL NOT 因类型错误导致页面崩溃或功能异常

#### Scenario: displayOptions 字段缺失
- **WHEN** 后端响应中 `displayOptions` 字段不存在或为 `null`/`undefined`
- **THEN** 前端 SHALL 使用默认值 `{ hideTimerDisplay: false }`
- **AND** 现有功能 SHALL 不受影响

#### Scenario: 登录响应示例（隐藏倒计时）
- **WHEN** 管理后台配置隐藏倒计时
- **THEN** 登录响应 SHALL 返回：
```json
{
  "code": 200,
  "msg": "成功",
  "obj": {
    "batchCode": "250619",
    "studentCode": "2024001",
    "examNo": "1001",
    "studentName": "张三",
    "schoolCode": "5101140001",
    "schoolName": "测试学校",
    "url": "/flow/g7a-mix-001",
    "pageNum": "0.1",
    "flowId": "g7a-mix-001",
    "progress": {
      "examNo": "1001",
      "batchCode": "250619",
      "flowId": "g7a-mix-001",
      "stepIndex": 0,
      "modulePageNum": "1"
    },
    "displayOptions": {
      "hideTimerDisplay": true
    }
  }
}
```

#### Scenario: 登录响应示例（显示倒计时）
- **WHEN** 管理后台未配置或配置显示倒计时
- **THEN** 登录响应 SHALL 返回：
```json
{
  "code": 200,
  "msg": "成功",
  "obj": {
    "batchCode": "250619",
    "examNo": "1001",
    "studentName": "张三",
    "url": "/flow/g7a-mix-001",
    "pageNum": "0.1",
    "flowId": "g7a-mix-001",
    "displayOptions": {
      "hideTimerDisplay": false
    }
  }
}
```

#### Scenario: 向后兼容
- **WHEN** 后端未返回 `displayOptions` 字段（旧版本后端）
- **THEN** 前端 SHALL 使用默认值 `{ hideTimerDisplay: false }`
- **AND** 现有功能 SHALL 不受影响
- **AND** 前端 SHALL NOT 报错或产生异常行为

#### Scenario: 配置覆盖与会话隔离
- **WHEN** 用户登录成功（无论是否为同一账号）
- **THEN** 前端 SHALL 以当前登录响应的 `displayOptions` 强制覆盖 localStorage 中的旧值
- **AND** 避免旧账号的配置污染新会话
- **AND** 若登录响应未包含 `displayOptions`，SHALL 使用默认值并覆盖旧值
