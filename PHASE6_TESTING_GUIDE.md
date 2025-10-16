# Phase 6 数据记录和提交功能 - 测试指南

## 测试概述

本指南详细说明如何测试 Grade 7 Tracking 模块的数据记录和提交功能（Phase 6 - T088-T090）。

---

## T088: 验证 Mock API 接收完整数据

### 目标
确认所有用户交互都被正确记录，并且数据格式符合后端 API 契约。

### 前置条件
- 开启 Mock 模式: `VITE_USE_MOCK=1` (默认开启)
- 浏览器开发者工具已打开

### 测试步骤

#### 步骤 1: 准备测试环境
```bash
# 启动开发服务器
npm run dev
```

#### 步骤 2: 登录并进入测评

1. 访问 `http://localhost:3000`
2. 在登录页面输入任意凭证（Mock 模式会接受任何凭证）
3. 登录成功后会跳转到注意事项页面（Page01_Notice）

#### 步骤 3: 打开 Network 监控

1. 按 `F12` 打开开发者工具
2. 切换到 `Network` 标签
3. 勾选 `Preserve log` 选项（保留日志）
4. （可选）在过滤框输入 `saveHcMark` 以只显示数据提交请求

#### 步骤 4: 执行完整的页面交互

**在 Page01_Notice 页面**:

1. 观察页面加载（应该自动记录 `page_enter`）
2. 点击复选框"我已阅读并理解以上注意事项"
3. 等待或点击"下一页"按钮

#### 步骤 5: 检查 Network 请求

在 Network 标签中找到 `/stu/saveHcMark` 请求，点击查看详情。

**验证 Request Headers**:
```
Request URL: http://localhost:3000/stu/saveHcMark
Request Method: POST
Content-Type: multipart/form-data; boundary=----WebKitFormBoundary...
```

**验证 Request Payload (FormData)**:

点击 `Payload` 标签，应该看到：

```
jsonStr: {"pageNumber":"0.1","pageDesc":"注意事项","operationList":[...],"answerList":[...],"beginTime":"2025-10-14 10:30:15","endTime":"2025-10-14 10:30:45","imgList":[]}
```

复制 `jsonStr` 的值，使用 JSON 格式化工具（如 `https://jsonformatter.org`）格式化后查看：

#### 步骤 6: 验证数据结构

**MarkObject 完整结构**:

```json
{
  "pageNumber": "0.1",
  "pageDesc": "注意事项",
  "operationList": [
    {
      "targetElement": "Page_00_1_Precautions",
      "eventType": "page_enter",
      "value": "注意事项页",
      "time": "2025-10-14T02:30:15.123Z"
    },
    {
      "targetElement": "注意事项复选框",
      "eventType": "checkbox_check",
      "value": "勾选",
      "time": "2025-10-14T02:30:20.456Z"
    },
    {
      "targetElement": "下一页按钮",
      "eventType": "button_click",
      "value": "前往情景引入页",
      "time": "2025-10-14T02:30:25.789Z"
    },
    {
      "targetElement": "Page_00_1_Precautions",
      "eventType": "page_exit",
      "value": "注意事项页",
      "time": "2025-10-14T02:30:26.012Z"
    }
  ],
  "answerList": [
    {
      "targetElement": "notice_agreement",
      "value": "已阅读并同意"
    }
  ],
  "beginTime": "2025-10-14 10:30:15",
  "endTime": "2025-10-14 10:30:26",
  "imgList": []
}
```

**验证清单**:

- [ ] **pageNumber**: 字符串类型，值为 "0.1"
- [ ] **pageDesc**: 字符串类型，中文描述 "注意事项"
- [ ] **operationList**: 数组类型，包含至少4个操作
  - [ ] `page_enter` 操作（页面加载时）
  - [ ] 用户交互操作（复选框勾选）
  - [ ] `button_click` 操作（点击下一页）
  - [ ] `page_exit` 操作（页面离开时）
- [ ] **每个 operation 包含**:
  - [ ] `targetElement`: string
  - [ ] `eventType`: string
  - [ ] `value`: string (可以是空字符串)
  - [ ] `time`: ISO 8601 格式的时间戳
- [ ] **answerList**: 数组类型，包含1个答案
  - [ ] `targetElement`: "notice_agreement"
  - [ ] `value`: "已阅读并同意" 或 "倒计时结束"
- [ ] **beginTime**: "YYYY-MM-DD HH:mm:ss" 格式
- [ ] **endTime**: "YYYY-MM-DD HH:mm:ss" 格式
- [ ] **imgList**: 空数组 `[]`

#### 步骤 7: 验证 Response

**成功响应**:
```json
{
  "code": 200,
  "msg": "success",
  "obj": null
}
```

**检查 Console 日志**:

打开 `Console` 标签，应该看到：

```
[TrackingProvider] 准备提交页面数据: {pageNumber: "0.1", pageDesc: "注意事项", ...}
[useDataLogger] 尝试提交数据 (1/3) {pageNumber: "0.1", pageDesc: "注意事项", ...}
[useDataLogger] ✅ 数据提交成功: {code: 200, msg: "success", obj: null}
[TrackingProvider] 数据提交成功: {code: 200, msg: "success", obj: null}
[TrackingProvider] 操作日志和答案已清除
[TrackingProvider] 导航至页面: 1 页码: 1
```

### 测试不同页面

重复上述步骤测试其他已集成的页面：

#### Page07_Design 测试

1. 导航到方案设计页面（可能需要先完成前面的页面）
2. 在3个输入框中输入文本（至少10个字符）
3. 点击"下一页"按钮
4. 检查 Network 请求中的 `jsonStr`

**预期 operationList** 应包含:
- `page_enter` 和 `page_exit`
- 3个 `start_edit` 操作（每个输入框首次聚焦）
- 多个 `文本域输入` 操作（每次输入时）
- `complete_design` 操作
- `click_next` 操作

**预期 answerList** 应包含:
- `实验想法1`: 输入的文本
- `实验想法2`: 输入的文本
- `实验想法3`: 输入的文本

---

## T089: 测试网络失败场景

### 目标
验证网络故障时的重试逻辑和用户体验。

### 测试步骤

#### 步骤 1: 模拟网络中断

1. 打开开发者工具 → `Network` 标签
2. 在右上角找到 `Throttling` 下拉菜单（默认为 "No throttling"）
3. 选择 `Offline` 选项（模拟完全断网）

#### 步骤 2: 尝试提交数据

1. 在任意页面完成交互（例如 Page01_Notice 勾选复选框）
2. 点击"下一页"按钮
3. 观察行为

#### 步骤 3: 验证重试逻辑

**检查 Console 日志**:

应该看到类似以下的日志：

```
[useDataLogger] 尝试提交数据 (1/3) {pageNumber: "0.1", ...}
[useDataLogger] ⚠️ 网络或其他错误 (尝试 1/3): Failed to fetch
[useDataLogger] ⏳ 等待 1000ms 后重试...
[useDataLogger] 尝试提交数据 (2/3) {pageNumber: "0.1", ...}
[useDataLogger] ⚠️ 网络或其他错误 (尝试 2/3): Failed to fetch
[useDataLogger] ⏳ 等待 2000ms 后重试...
[useDataLogger] 尝试提交数据 (3/3) {pageNumber: "0.1", ...}
[useDataLogger] ⚠️ 网络或其他错误 (尝试 3/3): Failed to fetch
[useDataLogger] ❌ 所有重试失败，数据提交失败
[Page01_Notice] 导航失败: Failed to fetch
```

**验证清单**:

- [ ] **重试次数**: 总共尝试3次
- [ ] **重试间隔**:
  - [ ] 第1次重试前等待 1秒
  - [ ] 第2次重试前等待 2秒
  - [ ] 第3次重试后不再等待
- [ ] **用户反馈**:
  - [ ] 显示 Alert 弹窗: "页面跳转失败，请重试"
  - [ ] "下一页"按钮恢复可点击状态
  - [ ] 页面仍停留在当前位置
- [ ] **数据保留**:
  - [ ] 操作日志未被清空（可在 Console 中验证）
  - [ ] 答案未被清空
  - [ ] 用户可以重新点击"下一页"按钮

#### 步骤 4: 恢复网络并重试

1. 在 `Throttling` 下拉菜单中选择 `No throttling`
2. 再次点击"下一页"按钮
3. 验证数据成功提交

**预期行为**:
- ✅ 数据成功提交
- ✅ 页面成功导航到下一页
- ✅ 之前记录的所有操作都被包含在提交中

#### 步骤 5: 测试慢速网络

1. 在 `Throttling` 下拉菜单中选择 `Slow 3G`
2. 尝试提交数据
3. 观察加载状态

**验证清单**:

- [ ] "下一页"按钮显示"跳转中..."文本
- [ ] 按钮处于禁用状态（防止重复提交）
- [ ] 最终成功提交（虽然较慢）
- [ ] 成功后正常导航

---

## T090: 测试会话失效场景

### 目标
验证 401 会话失效错误的处理逻辑。

### 测试步骤（方法1：修改代码模拟）

#### 步骤 1: 临时修改 useDataLogger

编辑 `src/modules/grade-7-tracking/hooks/useDataLogger.js`：

在第75行附近找到：

```javascript
// Check for success
if (response.ok && result.code === 200) {
  console.log('[useDataLogger] ✅ 数据提交成功:', {
    pageNumber: markObject.pageNumber,
    pageDesc: markObject.pageDesc
  });
  setIsSubmitting(false);
  return true;
}
```

在此代码**之前**添加模拟代码：

```javascript
// ====== 临时测试代码：模拟 401 响应 ======
if (result.code === 200) {
  console.warn('[TEST] 模拟 401 会话失效');
  result.code = 401;
  result.msg = '您的账号已在其他设备登录，请重新登录';
}
// ====== 测试代码结束 ======

// Check for success
if (response.ok && result.code === 200) {
  // ... rest of code
```

#### 步骤 2: 触发提交

1. 保存文件，Vite 会自动热更新
2. 在页面上完成交互
3. 点击"下一页"按钮

#### 步骤 3: 验证行为

**检查 Console 日志**:

```
[useDataLogger] 尝试提交数据 (1/3) {pageNumber: "0.1", ...}
[TEST] 模拟 401 会话失效
[useDataLogger] ❌ 会话已失效 (401): 您的账号已在其他设备登录，请重新登录
[Page01_Notice] 导航失败: 您的账号已在其他设备登录，请重新登录
```

**验证清单**:

- [ ] **不进行重试**: 只尝试1次，不进行2次和3次重试
- [ ] **错误处理**:
  - [ ] Console 显示 401 错误日志
  - [ ] `isSessionExpired: true` 标记
- [ ] **用户反馈**:
  - [ ] 显示 Alert 弹窗: "您的账号已在其他设备登录，请重新登录"
  - [ ] （理想情况）自动跳转到登录页面

#### 步骤 4: 清理测试代码

测试完成后，**务必删除**在 `useDataLogger.js` 中添加的测试代码。

### 测试步骤（方法2：后端协助）

如果有后端支持，可以请求后端提供一个特殊的测试端点或测试账号，在提交数据时返回 401 响应。

---

## 通用测试验证清单

对于每个已集成的页面，使用此清单验证数据记录功能：

### 页面加载

- [ ] Console 显示 `[TrackingProvider] ...`相关日志
- [ ] Console 显示 `page_enter` 操作记录

### 用户交互

- [ ] 每次点击/选择/输入都记录到 Console
- [ ] `logOperation` 被调用，参数正确
- [ ] 操作记录包含正确的 `targetElement`, `eventType`, `value`, `time`

### 答案收集

- [ ] `collectAnswer` 被调用
- [ ] 答案包含正确的 `targetElement` 和 `value`

### 数据提交

- [ ] 点击"下一页"后，Network 中出现 `/stu/saveHcMark` 请求
- [ ] Request Method 为 `POST`
- [ ] Content-Type 为 `multipart/form-data`
- [ ] Payload 包含 `jsonStr` 字段
- [ ] `jsonStr` 是有效的 JSON 字符串
- [ ] MarkObject 结构完整（见 T088）

### 成功提交后

- [ ] Response 返回 `{"code": 200, "msg": "success"}`
- [ ] Console 显示 `✅ 数据提交成功`
- [ ] Console 显示 `操作日志和答案已清除`
- [ ] Console 显示 `导航至页面: X`
- [ ] 页面成功跳转到下一页
- [ ] 下一页显示 `page_enter` 日志（新页面开始记录）

### 错误处理

- [ ] 网络错误时显示重试日志
- [ ] 3次重试失败后显示错误提示
- [ ] 用户可以手动重试
- [ ] 401 错误不进行重试
- [ ] 401 错误显示会话失效提示

---

## 调试技巧

### 1. 实时查看操作日志

在浏览器 Console 中执行：

```javascript
// 获取 TrackingContext 的当前状态
// (需要先安装 React DevTools)

// 方法1: 通过 React DevTools
// 1. 打开 React DevTools
// 2. 选择 <TrackingProvider> 组件
// 3. 在右侧查看 hooks 中的 state

// 方法2: 临时添加调试代码
// 在 TrackingProvider.jsx 中添加：
useEffect(() => {
  console.log('[DEBUG] 当前操作日志:', operationLog);
  console.log('[DEBUG] 当前答案列表:', answers);
}, [operationLog, answers]);
```

### 2. 查看 localStorage 持久化数据

在 Console 中执行：

```javascript
// 查看所有 tracking 相关的 localStorage 数据
Object.keys(localStorage)
  .filter(key => key.startsWith('tracking_'))
  .forEach(key => {
    console.log(key + ':', JSON.parse(localStorage.getItem(key)));
  });
```

### 3. 强制触发数据提交

如果需要测试数据提交而不实际导航：

```javascript
// 在页面组件中添加临时测试按钮
<button onClick={async () => {
  const markObject = buildMarkObject('TEST', '测试页面');
  console.log('MarkObject:', markObject);
  const success = await submitPageData(markObject);
  console.log('提交结果:', success);
}}>
  测试数据提交
</button>
```

### 4. 验证数据格式

使用在线工具验证 JSON 格式：

```javascript
// 复制 Network 中的 jsonStr 值
const jsonStr = '{"pageNumber":"0.1",...}';

// 验证是否为有效 JSON
try {
  const parsed = JSON.parse(jsonStr);
  console.log('解析成功:', parsed);

  // 验证必需字段
  const requiredFields = ['pageNumber', 'pageDesc', 'operationList', 'answerList', 'beginTime', 'endTime', 'imgList'];
  const missing = requiredFields.filter(field => !(field in parsed));
  if (missing.length > 0) {
    console.error('缺少字段:', missing);
  } else {
    console.log('✅ 所有必需字段都存在');
  }
} catch (e) {
  console.error('❌ JSON 解析失败:', e);
}
```

---

## 常见问题和解决方案

### Q1: Network 中看不到 `/stu/saveHcMark` 请求

**可能原因**:
1. 未点击"下一页"按钮
2. 按钮被禁用（前置条件未满足）
3. JavaScript 错误导致代码未执行

**解决方案**:
- 检查 Console 是否有错误
- 确认"下一页"按钮可点击
- 检查 `canNavigate` 或 `canGoNext` 逻辑

### Q2: 提交的数据中 operationList 为空

**可能原因**:
- 未调用 `logOperation`
- `logOperation` 调用时机不对
- 操作日志被意外清空

**解决方案**:
- 检查页面是否导入并使用了 `useTrackingContext`
- 确认 `logOperation` 在正确的事件处理函数中调用
- 检查是否有多次调用 `clearOperations`

### Q3: 提交的数据中 answerList 为空

**可能原因**:
- 未调用 `collectAnswer`
- 在 `buildMarkObject` 之后才调用 `collectAnswer`

**解决方案**:
- 确保在调用 `buildMarkObject` **之前**调用所有 `collectAnswer`
- 参考 Page01_Notice 或 Page07_Design 的实现顺序

### Q4: 时间格式不正确

**可能原因**:
- 使用了错误的时间格式化函数
- 传递了错误的参数类型

**解决方案**:
- 使用 `formatDateTime` 函数格式化 `beginTime` 和 `endTime`
- 使用 `new Date().toISOString()` 格式化 operation 的 `time`
- 确保传递 Date 对象而不是时间戳数字

### Q5: 页面刷新后数据丢失

**预期行为**: 当前页面的操作日志在刷新后会丢失，这是正常的。

**解决方案**:
- 页面刷新会重新初始化 TrackingProvider
- 之前已提交的数据在后端，不会丢失
- 如果需要保留未提交的数据，需要实现 localStorage 持久化

---

## 性能测试

### 操作日志容量测试

测试大量操作时的性能：

```javascript
// 在 Console 中执行
for (let i = 0; i < 1500; i++) {
  logOperation({
    action: 'test_operation',
    target: `test_element_${i}`,
    value: `test_value_${i}`,
    time: new Date().toISOString()
  });
}

// 检查是否触发日志大小限制警告
// 应该看到: "[TrackingProvider] 操作日志已达到最大大小，移除旧记录"
```

### 数据提交性能

测试大型 MarkObject 的提交时间：

```javascript
// 构建包含大量操作的 MarkObject
const largeMarkObject = buildMarkObject('TEST', '性能测试');
console.log('MarkObject 大小:', JSON.stringify(largeMarkObject).length, 'bytes');

// 测试提交时间
const startTime = performance.now();
await submitPageData(largeMarkObject);
const endTime = performance.now();
console.log('提交耗时:', (endTime - startTime).toFixed(2), 'ms');
```

---

## 测试报告模板

完成测试后，使用此模板记录结果：

```markdown
# Phase 6 测试报告

**测试日期**: 2025-10-14
**测试人员**: [姓名]
**测试环境**:
- 浏览器: Chrome 118.0
- Node.js: 18.16.0
- 测试模式: Mock API (VITE_USE_MOCK=1)

## T088: Mock API 数据验证

### Page01_Notice
- [x] 数据提交成功
- [x] MarkObject 结构正确
- [x] operationList 包含所有交互
- [x] answerList 包含答案
- [x] 时间格式正确

**发现的问题**: 无

### Page07_Design
- [x] 数据提交成功
- [x] MarkObject 结构正确
- [x] operationList 包含所有交互
- [x] answerList 包含3个想法
- [x] 时间格式正确

**发现的问题**: 无

## T089: 网络失败测试

- [x] 离线模式下重试3次
- [x] 重试间隔正确 (1s, 2s, 4s)
- [x] 显示错误提示
- [x] 数据保留未清空
- [x] 恢复网络后可重试

**发现的问题**: 无

## T090: 会话失效测试

- [x] 401 错误不进行重试
- [x] 显示会话失效提示
- [ ] 自动跳转登录页面 (待实现)

**发现的问题**: 未实现自动跳转登录功能

## 总结

整体功能符合预期，数据记录和提交逻辑运行正常。

**待改进项**:
1. 401 会话失效时自动跳转到登录页面
2. 添加离线数据队列功能
```

---

**文档版本**: 1.0
**最后更新**: 2025-10-14
**维护者**: Frontend Development Team
