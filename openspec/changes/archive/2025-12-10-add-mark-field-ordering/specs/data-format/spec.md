## ADDED Requirements

### Requirement: MarkObject 序列化字段顺序
MarkObject 的序列化表示 SHALL 使用固定字段顺序，且所有字段必须存在（空集合也输出为空数组），以便全局一致的审计和工具处理。

#### Scenario: 固定顺序与全量输出
- GIVEN 需要序列化 MarkObject（提交、日志、快照、调试导出等）
- THEN 字段顺序 SHALL 为：`pageNumber`，`pageDesc`，`operationList`，`answerList`，`beginTime`，`endTime`，`imgList`
- AND 所有字段 SHALL 始终输出，`imgList` 等空集合 SHALL 输出为空数组
- AND 该顺序 SHALL 适用于所有 MarkObject 生产方（含统一提交管道、迁移/回填工具、批量导出脚本）
