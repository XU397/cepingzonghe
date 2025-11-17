# 心跳与进度回写 Payload 规范

本文档描述前端心跳/进度上报的请求结构、端点规范、失败重试策略与调试方法。

## Payload 结构

- 字段说明（JSON）：
  - `flowId` (string)：当前运行的 Flow 标识。
  - `stepIndex` (number)：当前步骤索引（从 0 起）。
  - `modulePageNum` (string|number)：当前模块页码（字符串或数字）。
  - `ts` (number)：客户端时间戳（毫秒）。

示例：

```json
{
  "flowId": "g7a-mix-001",
  "stepIndex": 3,
  "modulePageNum": "2",
  "ts": 1731738000000
}
```

## 端点规范

- HTTP 方法：`POST`
- 路径：`/api/flows/{flowId}/progress`
  - 对应前端 `endpoints.flow.updateProgress(flowId)`
- Headers：`Content-Type: application/json`
- 鉴权：携带 Cookie，`credentials: include`
- 请求体：见「Payload 结构」
- 响应：2xx 视为成功（前端仅记录 `status`）

发送策略：
- 定时心跳：默认每 15s 上报一次。
- 事件触发：切换步骤时即时上报一次。
- 启动补写：Hook 启动时先尝试 `flush` 本地队列，再发送一次心跳。

## 失败重试策略

- 本地队列：以 LocalStorage 保存未成功上报的 payload。
  - Key：`flow.<flowId>.heartbeatQueue`
  - 限制：最多保留最近 50 条（滚动截断）
- 入队条件：
  - 网络异常、非 2xx 响应均视为失败；失败后将此次 payload 追加入队。
- Flush 时机：
  - Hook 启动时先 `flush`；随后按周期继续上报。
  - `flush` 逐条尝试，成功移除，失败保留；结束后写回队列。

日志规范（控制台）：
- 成功：`[useHeartbeat] Heartbeat success { status, flowId }` 或 `Flush success`
- 失败：`[useHeartbeat] Heartbeat failed`, Error, `{ flowId, queueLength }`
- 发送：`[useHeartbeat] Sending heartbeat`, payload（完整）

## 调试方法（仅 DEV）

在开发环境（`import.meta.env.DEV === true`）下，前端暴露全局调试对象：`window.__flowHeartbeatDebug`。

- `getQueue(flowId: string): any[]`
  - 返回指定 `flowId` 的本地队列内容。
- `getLastHeartbeat(): any | null`
  - 返回最近一次发送的心跳 payload。
- `forceFlush(flowId: string): Promise<void>`
  - 立即尝试将本地队列内容依次上报。

示例：

```js
// 查看某个 Flow 的队列
window.__flowHeartbeatDebug?.getQueue('g7a-mix-001')

// 查看最近一次心跳 payload
window.__flowHeartbeatDebug?.getLastHeartbeat()

// 手动执行一次 flush
window.__flowHeartbeatDebug?.forceFlush('g7a-mix-001')
```

注意：调试对象仅在 DEV 环境提供，线上环境不会暴露。

