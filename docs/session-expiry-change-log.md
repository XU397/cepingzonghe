# Session 有效期调整变更日志

## 变更概述

**变更日期：** 2025-06-11
**变更类型：** 配置调整
**影响范围：** 用户 Session 有效期

---

## 变更内容

### 修改前
- **Session 有效期：** 24 小时
- **配置变量：** `SESSION_EXPIRY_HOURS = 24`
- **计算单位：** 小时

### 修改后
- **Session 有效期：** 90 分钟（1.5 小时）
- **配置变量：** `SESSION_EXPIRY_MINUTES = 90`
- **计算单位：** 分钟

---

## 技术实现

### 代码修改

**文件：** `src/context/AppContext.jsx`

**修改位置：** 第 619-633 行

**修改前代码：**
```javascript
const SESSION_EXPIRY_HOURS = 24; // Session有效期：24小时
const hoursSinceLastSession = (Date.now() - sessionEndTimeMillis) / (1000 * 60 * 60);

if (hoursSinceLastSession > SESSION_EXPIRY_HOURS) {
  console.log('[AppContext] ⏰ Session已过期（超过24小时），清除所有认证数据');
  handleLogout();
}
```

**修改后代码：**
```javascript
const SESSION_EXPIRY_MINUTES = 90; // Session有效期：90分钟
const minutesSinceLastSession = (Date.now() - sessionEndTimeMillis) / (1000 * 60);

if (minutesSinceLastSession > SESSION_EXPIRY_MINUTES) {
  console.log('[AppContext] ⏰ Session已过期（超过90分钟），清除所有认证数据');
  handleLogout();
}
```

### 变更细节

1. **变量重命名：**
   - `SESSION_EXPIRY_HOURS` → `SESSION_EXPIRY_MINUTES`
   - `hoursSinceLastSession` → `minutesSinceLastSession`

2. **时间计算调整：**
   - 小时计算：`/ (1000 * 60 * 60)`
   - 分钟计算：`/ (1000 * 60)`

3. **日志信息更新：**
   - "超过24小时" → "超过90分钟"

---

## 文档更新

### 已更新文档

**文件：** `docs/session-and-cookie-policy.md`

**更新内容：**
- 所有提及 "24 小时" 的地方改为 "90 分钟"
- 代码示例更新为新的变量名和计算方式
- 添加变更历史记录
- 更新版本号：v1.0 → v1.1

---

## 影响分析

### 对用户的影响

**变更前：**
- 用户登录后 24 小时内保持登录状态
- 超过 24 小时后需要重新登录

**变更后：**
- 用户登录后 90 分钟内保持登录状态
- 超过 90 分钟后需要重新登录

### 功能影响

✅ **正常工作的功能：**
- Session 有效期检查逻辑
- 自动登出机制
- 页面刷新状态恢复
- 离线时间计算

⚠️ **需要注意：**
- 后端 session cookie 的有效期应该 ≥ 90 分钟
- 用户需要在 90 分钟内完成测试任务
- 如果用户中途离开超过 90 分钟，将被自动登出

---

## 测试建议

### 测试场景

1. **正常登录测试：**
   - 登录后立即检查 session 是否有效
   - 验证 `lastSessionEndTime` 正确记录

2. **时间临界测试：**
   - 登录后等待 85 分钟，验证 session 仍然有效
   - 登录后等待 95 分钟，验证自动登出

3. **页面刷新测试：**
   - 登录后 30 分钟刷新页面，验证保持登录
   - 登录后 95 分钟刷新页面，验证自动登出

4. **数据提交测试：**
   - 验证数据提交成功后 `lastSessionEndTime` 更新
   - 验证时间戳更新后 session 有效期重新计算

5. **控制台日志验证：**
   ```
   [AppContext] Session年龄检查: {
     lastSessionEndTime: "...",
     minutesSinceLastSession: "...",
     expiryThreshold: 90
   }
   ```

---

## 回滚方案

如需回滚到 24 小时有效期：

```javascript
// 在 src/context/AppContext.jsx 第 619 行
const SESSION_EXPIRY_HOURS = 24; // Session有效期：24小时
const hoursSinceLastSession = (Date.now() - sessionEndTimeMillis) / (1000 * 60 * 60);

if (hoursSinceLastSession > SESSION_EXPIRY_HOURS) {
  console.log('[AppContext] ⏰ Session已过期（超过24小时），清除所有认证数据');
  handleLogout();
}
```

---

## 相关文档

- [Session 和 Cookie 策略完整文档](./session-and-cookie-policy.md)
- [项目架构文档](./architecture.md)
- [AppContext API 文档](../src/context/README.md)

---

**记录人：** 开发团队
**审核人：** 待定
**状态：** ✅ 已完成
