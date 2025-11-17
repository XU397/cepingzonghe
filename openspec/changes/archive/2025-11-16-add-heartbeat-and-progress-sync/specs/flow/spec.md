## ADDED Requirements

### Requirement: Flow 心跳与进度回写（可选）
Flow 运行时 SHALL 提供心跳与进度回写能力，以便后端观测与跨端恢复；失败时不得阻断前端流程。

#### Scenario: 回写策略
- WHEN 进入新页面或间隔达到阈值
- THEN 前端 SHALL 上报 `{ flowId, stepIndex, modulePageNum }` 至后端；
- AND 失败时 SHALL 仅本地记录，后续补写，不影响用户操作。
